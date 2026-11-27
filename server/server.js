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

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const PAYPAL = {
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  secret: process.env.PAYPAL_SECRET || '',
  webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  mode: (process.env.PAYPAL_MODE || 'sandbox').toLowerCase(),
};
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
  };
}

function loadDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const db = emptyDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
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
        if (et === 'CHECKOUT.ORDER.APPROVED' || et === 'PAYMENT.CAPTURE.COMPLETED' || et === 'PAYMENT.SALE.COMPLETED') {
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
      }
      prune(); saveDB();
      return json(res, 200, { received: true, verified: !!result.verified, reason: result.reason });
    }

    // Static: dashboard
    if (p === '/' || p === '/dashboard') {
      const file = path.join(PUBLIC_DIR, 'dashboard.html');
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
