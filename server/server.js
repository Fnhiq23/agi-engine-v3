/**
 * AGI Engine — Backend (zero dependencies, Node.js built-ins only)
 *
 * Provides:
 *   POST /api/event           - track a funnel event
 *   GET  /api/report          - aggregated real data (for 8pm report)
 *   GET  /api/stats           - public stats
 *   POST /api/paypal/webhook  - verify + record real PayPal payments
 *   GET  /api/subscribe/:id   - check subscription status (by client id)
 *   GET  /api/health          - health check
 *
 * Storage: JSON file (atomic writes). Swap for SQLite/Postgres in production.
 *
 * Config via environment variables:
 *   PORT               (default 3000)
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_SECRET
 *   PAYPAL_WEBHOOK_ID  (from PayPal Developer Dashboard -> Webhooks)
 *   PAYPAL_MODE        = sandbox | live
 */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Minimal zero-dependency .env loader (process env still wins).
(function loadEnv() {
  try {
    const f = path.join(__dirname, '.env');
    if (!fs.existsSync(f)) return;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
      }
    }
  } catch (e) { console.warn('[ENV] load failed:', e.message); }
})();

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const PAYPAL = {
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  secret: process.env.PAYPAL_SECRET || '',
  webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  mode: (process.env.PAYPAL_MODE || 'sandbox').toLowerCase(),
  annualLink: process.env.PAYPAL_ANNUAL_LINK || 'https://www.paypal.com/ncp/payment/SBJ2ZGWP7ACLQ',
  monthlyLink: process.env.PAYPAL_MONTHLY_LINK || 'https://www.paypal.com/ncp/payment/6SAYLMHK2ZHNE',
  planMonthly: process.env.PAYPAL_PLAN_MONTHLY || '',
  planAnnual: process.env.PAYPAL_PLAN_ANNUAL || '',
};
// Admin token protects manual claim reconciliation endpoints.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const PAYPAL_API = PAYPAL.mode === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ---------- Storage ----------
function emptyDB() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    events: [],          // { ts, type, clientId, channel, data }
    subscriptions: {},   // clientId -> { plan, status, expiresAt, payerId, orderId, ts }
    payments: [],        // verified payments only
    webhookLog: [],      // audit trail
    claims: [],          // manual payment claims: { id, ts, email, plan, txnId, clientId, status, channel, reviewedAt, reviewedBy }
  };
}

// Backfill claims array for DBs created before this feature existed.
function ensureSchema(d) {
  if (!Array.isArray(d.claims)) d.claims = [];
  return d;
}

function loadDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const db = emptyDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }
    return ensureSchema(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  } catch (e) {
    console.error('[DB] load failed, using empty db:', e.message);
    return emptyDB();
  }
}

let db = loadDB();

function saveDB() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // atomic
}

// Keep storage bounded
function prune() {
  const now = Date.now();
  const day = 86400000;
  if (db.events.length > 50000) {
    db.events = db.events.filter(e => now - new Date(e.ts).getTime() < 30 * day);
  }
  if (db.webhookLog.length > 5000) db.webhookLog = db.webhookLog.slice(-5000);
}

// ---------- Helpers ----------
function json(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      if (data.length > 2e6) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// Raw body needed for PayPal webhook signature verification
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 2e6) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------- PayPal ----------
async function getAccessToken() {
  if (!PAYPAL.clientId || !PAYPAL.secret) throw new Error('PayPal credentials not configured');
  const auth = Buffer.from(`${PAYPAL.clientId}:${PAYPAL.secret}`).toString('base64');
  const res = await httpsRequest(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }, 'grant_type=client_credentials');
  if (res.status !== 200) throw new Error('PayPal token error: ' + res.status);
  return JSON.parse(res.body).access_token;
}

/**
 * Verify webhook signature with PayPal's verify-webhook-signature API.
 * This is the REAL verification — not trusting client-side redirects.
 */
async function verifyWebhook(headers, rawBody) {
  if (!PAYPAL.webhookId) return { verified: false, reason: 'WEBHOOK_ID_NOT_CONFIGURED' };
  const token = await getAccessToken();
  const payload = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: PAYPAL.webhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const res = await httpsRequest(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, JSON.stringify(payload));
  if (res.status !== 200) return { verified: false, reason: 'VERIFY_API_ERROR_' + res.status };
  const out = JSON.parse(res.body);
  return {
    verified: out.verification_status === 'SUCCESS',
    status: out.verification_status,
    event: payload.webhook_event,
  };
}

function planFromResource(resource) {
  // Map PayPal order/custom_id to plan. custom_id should be set on the payment link.
  const custom = (resource && (resource.custom_id || (resource.purchase_units && resource.purchase_units[0] && resource.purchase_units[0].custom_id))) || '';
  const amount = resource && resource.amount && resource.amount.value;
  if (/annual/i.test(custom) || Number(amount) >= 100) return { plan: 'annual', amount: Number(amount) || 100 };
  if (/monthly/i.test(custom) || Number(amount) >= 15) return { plan: 'monthly', amount: Number(amount) || 15 };
  return { plan: 'unknown', amount: Number(amount) || 0 };
}

// ---------- Manual claim helpers ----------
function planAmount(plan) { return plan === 'annual' ? 100 : plan === 'monthly' ? 15 : 0; }

function isAdmin(req) {
  // Token may be supplied via header (x-admin-token) or query (?token=).
  if (!ADMIN_TOKEN) return false; // fail closed when no token configured
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const supplied = (req.headers['x-admin-token'] || u.searchParams.get('token') || '');
  const a = Buffer.from(String(supplied));
  const b = Buffer.from(ADMIN_TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function normalizeTxn(s) {
  return String(s || '').trim().toUpperCase().replace(/[\s-]/g, '').slice(0, 80);
}

// ---------- Report ----------
function buildReport() {
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const dayMs = 86400000;

  const byDay = {};
  const byChannel = {};
  const funnel = {};
  let revenueTotal = 0;
  // De-duplicate people per stage so conversion rates never exceed 100%.
  // key = `${day}:${clientId}` — a person counts once per stage per day.
  const seen = { signup: new Set(), activation: new Set(), proView: new Set(), proClick: new Set() };

  for (const e of db.events) {
    const d = (e.ts || '').slice(0, 10);
    if (!byDay[d]) byDay[d] = { visitors: 0, signups: 0, activations: 0, proViews: 0, proClicks: 0, payments: 0 };
    const bucket = byDay[d];
    const who = e.clientId || 'anon';
    const key = `${d}:${who}`;
    switch (e.type) {
      case 'landing_view': bucket.visitors++; break;
      case 'trial_start':
        if (!seen.signup.has(key)) { bucket.signups++; seen.signup.add(key); }
        break;
      case 'first_memory':
      case 'first_chat':
        if (!seen.activation.has(key)) { bucket.activations++; seen.activation.add(key); }
        break;
      case 'pro_view':
        if (!seen.proView.has(key)) { bucket.proViews++; seen.proView.add(key); }
        break;
      case 'pro_click':
        if (!seen.proClick.has(key)) { bucket.proClicks++; seen.proClick.add(key); }
        break;
    }
    funnel[e.type] = (funnel[e.type] || 0) + 1;
    if (e.channel) byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
  }

  for (const p of db.payments) {
    const d = (p.ts || '').slice(0, 10);
    if (!byDay[d]) byDay[d] = { visitors: 0, signups: 0, activations: 0, proViews: 0, proClicks: 0, payments: 0 };
    byDay[d].payments++;
    byDay[d].revenue = (byDay[d].revenue || 0) + (p.amount || 0);
    revenueTotal += p.amount || 0;
    if (p.channel) byChannel[p.channel] = (byChannel[p.channel] || 0) + 1;
  }

  const t = byDay[today] || { visitors: 0, signups: 0, activations: 0, proViews: 0, proClicks: 0, payments: 0, revenue: 0 };
  const week = Object.keys(byDay).sort().slice(-7).map(d => ({ date: d, ...byDay[d] }));

  const subs = Object.values(db.subscriptions);
  const activeSubs = subs.filter(s => s.status === 'ACTIVE' && (!s.expiresAt || new Date(s.expiresAt).getTime() > now));

  return {
    generatedAt: new Date().toISOString(),
    source: 'server-verified-data',
    today: { date: today, ...t },
    funnel,
    conversion: {
      landingToSignup: t.visitors ? (t.signups / t.visitors * 100).toFixed(1) + '%' : '0%',
      signupToActivation: t.signups ? (t.activations / t.signups * 100).toFixed(1) + '%' : '0%',
      proViewToPayment: t.proViews ? (t.payments / t.proViews * 100).toFixed(1) + '%' : '0%',
    },
    revenue: { total: revenueTotal, today: t.revenue || 0, transactions: db.payments.length },
    claims: {
      pending: db.claims.filter(c => c.status === 'PENDING').length,
      approved: db.claims.filter(c => c.status === 'APPROVED').length,
      rejected: db.claims.filter(c => c.status === 'REJECTED').length,
      total: db.claims.length,
    },
    channels: byChannel,
    weekly: week,
    subscriptions: { active: activeSubs.length, total: subs.length },
    dataIntegrity: { events: db.events.length, verifiedPayments: db.payments.length, webhookCalls: db.webhookLog.length },
  };
}

// ---------- Router ----------
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = u.pathname;

  if (req.method === 'OPTIONS') return json(res, 204, {});

  try {
    if (p === '/api/health') return json(res, 200, { ok: true, time: new Date().toISOString(), mode: PAYPAL.mode });

    if (p === '/api/event' && req.method === 'POST') {
      const b = await readBody(req);
      const allowed = ['landing_view', 'trial_start', 'onboard_complete', 'first_memory', 'first_chat', 'pro_view', 'pro_click', 'referral'];
      if (!allowed.includes(b.type)) return json(res, 400, { error: 'unknown event type' });
      db.events.push({
        ts: new Date().toISOString(),
        type: b.type,
        clientId: String(b.clientId || 'anon').slice(0, 64),
        channel: String(b.channel || 'direct').slice(0, 32),
        data: b.data || {},
      });
      prune(); saveDB();
      return json(res, 200, { ok: true });
    }

    if (p === '/api/report') return json(res, 200, buildReport());

    if (p === '/api/stats') {
      const r = buildReport();
      return json(res, 200, {
        visitorsToday: r.today.visitors,
        paymentsToday: r.today.payments,
        revenueToday: r.today.revenue,
        activeSubs: r.subscriptions.active,
      });
    }

    if (p.startsWith('/api/subscribe/') && req.method === 'GET') {
      const id = decodeURIComponent(p.replace('/api/subscribe/', '')).slice(0, 64);
      const sub = db.subscriptions[id] || null;
      return json(res, 200, { clientId: id, subscription: sub });
    }

    // ---- Manual payment claims (for no-code PayPal links) ----
    // Customer submits proof of payment after paying via the hosted link.
    if (p === '/api/claim' && req.method === 'POST') {
      const b = await readBody(req);
      const plan = (b.plan === 'annual' || b.plan === 'monthly') ? b.plan : '';
      const txn = normalizeTxn(b.txnId);
      const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      const clientId = String(b.clientId || 'anon').slice(0, 64);
      if (!plan) return json(res, 400, { error: 'plan must be annual or monthly' });
      if (!txn) return json(res, 400, { error: 'txnId (PayPal transaction ID) is required' });
      if (!/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: 'valid email is required' });
      // Duplicate protection: same transaction cannot be claimed twice.
      if (db.claims.some(c => c.txn === txn)) {
        return json(res, 409, { error: 'DUPLICATE_TXN', message: 'This transaction ID was already submitted.' });
      }
      const claim = {
        id: 'CLM-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        ts: new Date().toISOString(),
        email, plan, txn, clientId,
        channel: String(b.channel || 'direct').slice(0, 32),
        status: 'PENDING',
        reviewedAt: null, reviewedBy: null,
      };
      db.claims.push(claim);
      db.events.push({ ts: claim.ts, type: 'pro_click', clientId, channel: claim.channel, data: { plan, claimId: claim.id } });
      prune(); saveDB();
      return json(res, 200, { ok: true, claimId: claim.id, status: 'PENDING', message: 'Submitted. Access activates after verification (usually within 24h).' });
    }

    // Customer checks claim status by claim id (public, limited fields).
    if (p.startsWith('/api/claim/status/') && req.method === 'GET') {
      const id = decodeURIComponent(p.replace('/api/claim/status/', '')).slice(0, 24);
      const c = db.claims.find(x => x.id === id);
      if (!c) return json(res, 404, { error: 'claim not found' });
      return json(res, 200, { claimId: c.id, status: c.status, plan: c.plan, ts: c.ts, reviewedAt: c.reviewedAt });
    }

    // Admin: list all claims (protected).
    if (p === '/api/admin/claims' && req.method === 'GET') {
      if (!isAdmin(req)) return json(res, 401, { error: 'UNAUTHORIZED', message: 'Admin token required.' });
      const claims = db.claims.slice().sort((a, b2) => b2.ts.localeCompare(a.ts));
      return json(res, 200, { count: claims.length, claims });
    }

    // Admin: approve or reject a claim (protected). Approval activates subscription + records real revenue.
    if ((p === '/api/admin/claim/approve' || p === '/api/admin/claim/reject') && req.method === 'POST') {
      if (!isAdmin(req)) return json(res, 401, { error: 'UNAUTHORIZED', message: 'Admin token required.' });
      const b = await readBody(req);
      const id = String(b.id || '').slice(0, 24);
      const c = db.claims.find(x => x.id === id);
      if (!c) return json(res, 404, { error: 'claim not found' });
      if (c.status !== 'PENDING') return json(res, 409, { error: 'ALREADY_REVIEWED', status: c.status });

      if (p.endsWith('/reject')) {
        c.status = 'REJECTED';
        c.reviewedAt = new Date().toISOString();
        c.reviewedBy = 'admin';
        c.rejectReason = String(b.reason || '').slice(0, 200);
        saveDB();
        return json(res, 200, { ok: true, status: 'REJECTED', claimId: id });
      }

      // Approve: activate subscription and record revenue.
      const now = new Date();
      const expires = new Date(now);
      if (c.plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
      else if (c.plan === 'monthly') expires.setMonth(expires.getMonth() + 1);
      else expires.setDate(expires.getDate() + 30);
      const amount = Number(b.amount) || planAmount(c.plan); // allow founder to override actual captured amount
      c.status = 'APPROVED';
      c.reviewedAt = now.toISOString();
      c.reviewedBy = 'admin';
      c.activatedFor = c.clientId;
      db.subscriptions[c.clientId] = {
        plan: c.plan,
        status: 'ACTIVE',
        expiresAt: expires.toISOString(),
        payerId: c.email,
        orderId: c.txn,
        ts: now.toISOString(),
        source: 'manual-reconciliation',
      };
      db.payments.push({
        ts: now.toISOString(),
        amount,
        plan: c.plan,
        orderId: c.txn,
        clientId: c.clientId,
        eventType: 'MANUAL_RECONCILIATION',
        channel: c.channel,
        email: c.email,
      });
      saveDB();
      return json(res, 200, { ok: true, status: 'APPROVED', claimId: id, activatedFor: c.clientId, expiresAt: expires.toISOString() });
    }

    // Public config for claim page (payment links + subscription plan ids, no secrets).
    if (p === '/api/payment-links') {
      return json(res, 200, {
        annual: PAYPAL.annualLink, monthly: PAYPAL.monthlyLink, mode: PAYPAL.mode,
        planAnnual: PAYPAL.planAnnual, planMonthly: PAYPAL.planMonthly,
        subscriptionsEnabled: !!(PAYPAL.planAnnual && PAYPAL.planMonthly && PAYPAL.clientId),
      });
    }

    if (p === '/api/paypal/webhook' && req.method === 'POST') {
      const raw = await readRawBody(req);
      let result;
      if (PAYPAL.webhookId) {
        result = await verifyWebhook(req.headers, raw);
      } else {
        // Dev/sandbox mode without credentials: log but DO NOT activate subscription.
        result = { verified: false, reason: 'DEV_MODE_NO_WEBHOOK_ID' };
      }
      let event = null;
      try { event = JSON.parse(raw); } catch (e) {}

      db.webhookLog.push({
        ts: new Date().toISOString(),
        verified: result.verified,
        reason: result.reason || result.status || 'ok',
        eventType: event && event.event_type,
      });

      if (result.verified && event) {
        const et = event.event_type;
        const res0 = event.resource || {};
        // One-time payment events only. PAYMENT.SALE.COMPLETED with a billing
        // agreement is a subscription renewal and is handled separately below.
        const isRenewal = et === 'PAYMENT.SALE.COMPLETED' && (res0.billing_agreement_id || res0.custom_id);
        if ((et === 'CHECKOUT.ORDER.APPROVED' || et === 'PAYMENT.CAPTURE.COMPLETED' || et === 'PAYMENT.SALE.COMPLETED') && !isRenewal) {
          const clientId = String(res0.custom_id || (res0.purchase_units && res0.purchase_units[0] && res0.purchase_units[0].custom_id) || '').slice(0, 64);
          const info = planFromResource(res0);
          const orderId = res0.id || (res0.supplementary_data && res0.supplementary_data.related_ids && res0.supplementary_data.related_ids.order_id) || '';
          const now = new Date();
          const expires = new Date(now);
          if (info.plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
          else if (info.plan === 'monthly') expires.setMonth(expires.getMonth() + 1);
          else expires.setDate(expires.getDate() + 30);

          if (clientId) {
            db.subscriptions[clientId] = {
              plan: info.plan,
              status: 'ACTIVE',
              expiresAt: expires.toISOString(),
              payerId: res0.payer_id || '',
              orderId,
              ts: now.toISOString(),
            };
          }
          db.payments.push({
            ts: now.toISOString(),
            amount: info.amount,
            plan: info.plan,
            orderId,
            clientId,
            eventType: et,
            channel: res0.channel || 'direct',
          });
        }

        // ---- Subscription lifecycle events (Subscriptions API) ----
        const subEvents = ['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CREATED',
          'BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED'];
        if (subEvents.includes(et)) {
          const subId = res0.id || '';
          const clientId = String(res0.custom_id || '').slice(0, 64);
          const planId = String(res0.plan_id || '');
          let plan = 'unknown';
          if (PAYPAL.planAnnual && planId === PAYPAL.planAnnual) plan = 'annual';
          else if (PAYPAL.planMonthly && planId === PAYPAL.planMonthly) plan = 'monthly';
          else if (/annual/i.test(planId)) plan = 'annual';
          else if (/monthly/i.test(planId)) plan = 'monthly';
          const shouldActivate = (et === 'BILLING.SUBSCRIPTION.ACTIVATED' || et === 'BILLING.SUBSCRIPTION.CREATED');
          if (clientId) {
            if (shouldActivate) {
              const now = new Date();
              const expires = new Date(now);
              if (plan === 'annual') expires.setFullYear(expires.getFullYear() + 1);
              else if (plan === 'monthly') expires.setMonth(expires.getMonth() + 1);
              else expires.setDate(expires.getDate() + 30);
              db.subscriptions[clientId] = {
                plan, status: 'ACTIVE', expiresAt: expires.toISOString(),
                payerId: (res0.subscriber && res0.subscriber.email_address) || '',
                orderId: subId, ts: now.toISOString(), source: 'paypal-subscription',
              };
            } else {
              // Cancelled/suspended/expired → revoke access.
              if (db.subscriptions[clientId]) {
                db.subscriptions[clientId].status = 'CANCELLED';
                db.subscriptions[clientId].cancelledAt = new Date().toISOString();
                db.subscriptions[clientId].cancelEvent = et;
              }
            }
          }
          db.events.push({ ts: new Date().toISOString(), type: 'pro_click', clientId: clientId || 'anon', channel: 'subscription', data: { et, subId, plan } });
        }

        // ---- Recurring subscription payments ----
        if (et === 'PAYMENT.SALE.COMPLETED' && (res0.billing_agreement_id || res0.custom_id)) {
          const clientId = String(res0.custom_id || '').slice(0, 64);
          const amt = Number(res0.amount && res0.amount.value) || 0;
          db.payments.push({
            ts: new Date().toISOString(), amount: amt,
            plan: amt >= 100 ? 'annual' : 'monthly',
            orderId: res0.id || res0.billing_agreement_id || '', clientId,
            eventType: 'SUBSCRIPTION_RENEWAL', channel: 'subscription',
          });
        }
      }
      prune(); saveDB();
      return json(res, 200, { received: true, verified: !!result.verified, reason: result.reason });
    }

    // Static pages
    const staticPages = {
      '/': 'dashboard.html',
      '/dashboard': 'dashboard.html',
      '/claim': 'claim.html',
      '/reconcile': 'reconcile.html',
    };
    if (staticPages[p]) {
      const file = path.join(PUBLIC_DIR, staticPages[p]);
      if (fs.existsSync(file)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(fs.readFileSync(file));
      }
    }
    if (p.startsWith('/static/')) {
      const name = path.basename(p).replace(/[^a-zA-Z0-9._-]/g, '');
      const file = path.join(PUBLIC_DIR, name);
      if (fs.existsSync(file)) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(fs.readFileSync(file));
      }
    }

    return json(res, 404, { error: 'not found' });
  } catch (e) {
    console.error('[ERR]', e);
    return json(res, 500, { error: e.message || 'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`AGI Engine backend listening on http://localhost:${PORT}`);
  console.log(`PayPal mode: ${PAYPAL.mode} | webhook configured: ${!!PAYPAL.webhookId}`);
});
