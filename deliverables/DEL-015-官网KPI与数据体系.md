> 产物编码：DEL-015 | 专员：官网 KPI 数据官 | KPI：官网埋点与数据体系可落地

# 官网 KPI 与数据体系（AGI Engine · DEL-015）

## 0. 适用范围、证据基准与诚实声明

### 0.1 本文解决什么

官网（营销入口，尚未上线）与产品应用（`https://fnhiq23.github.io/agi-engine-v3/`）是两个不同的"面"。本文只做一件事：把官网上的真实用户动作，用现有后端 `server/server.js` 能接收、能聚合、能核验的方式，接入 `GET /api/report`，使官网阶段的"方向正确"可被验证，而不是靠想象。

本文**不修改任何代码**，只给出可交给开发直接落地的事件定义、字段、代码位置与验收清单。

### 0.2 证据基准（所有代码位置建议均来自以下真实文件）

| 编号 | 证据文件 | 关键行号 | 用途 |
| --- | --- | --- | --- |
| S1 | `server/server.js` | 65–79 `emptyDB()`、83–92 `ensureSchema()` | 数据结构与可新增字段位置 |
| S2 | `server/server.js` | 94–103 `parseCustomId()` | `v1\|clientId\|refCode` 归因载体 |
| S3 | `server/server.js` | 284–374 `buildReport()` | `/api/report` 全部聚合字段 |
| S4 | `server/server.js` | 410–423 `/api/event` | 事件白名单与落库格式 |
| S5 | `server/server.js` | 425 `/api/report`、427–435 `/api/stats` | 报表路由 |
| S6 | `server/server.js` | 586–622 `/api/subscription/create` | 订阅创建与 `custom_id` 写入 |
| S7 | `server/server.js` | 624–739 `/api/paypal/webhook` | 验签、订阅开通、收入入账 |
| S8 | `server/public/dashboard.html` | 45、47–67、72–144 | 看板 DOM 与渲染逻辑 |
| A1 | `index.html` | 1062–1063 `BACKEND_BASE` | 应用端后端地址注入方式 |
| A2 | `index.html` | 1086、1124–1135 | 订阅 `refCode` 与 `track()` 上报 |
| A3 | `index.html` | 1141–1152 `clientId` | 浏览器匿名 ID 生成方式 |
| A4 | `index.html` | 1968–1981 | `?ref=` 解析与 30 天归因窗口 |
| A5 | `index.html` | 2208–2352 `Analytics` | **仅本地内存**统计，刷新即丢，不进后端 |
| A6 | `index.html` | 2448 | 应用内 `landing_view` 只进本地 `Analytics`，不进后端 |
| D1 | `deliverables/DEL-010-真实变现能力审计与KPI.md` | 66–96 | WAPS 北极星定义（本文沿用） |

### 0.3 三条不可越过的底线

1. **不编造数据**：所有"当前真实值"均为 `0` 或"无数据"。官网未上线时，任何 KPI 都不允许填估算值、行业均值或演示数。上线后只允许读取 `server/data/db.json` 与 `/api/report` 的真实记录。
2. **不虚构能力**：后端没有的字段就写"需改造"；应用端没有真正上报的事件就写"当前不上报"，不把白名单当成"已接入"。
3. **不碰隐私与记忆内容**：埋点 `data` 严禁包含记忆文本、聊天内容、LLM API Key、邮件正文、完整邮箱、IP、剪贴板。服务端必须做字段白名单与长度硬截断（见 §3.2）。本文只描述现有后端已具备的能力，不引入任何项目并不存在的机制。

---

## 1. 官网专属 KPI 树

### 1.1 双 surface 模型（官网埋点与应用埋点必须分开）

现有 `db.events` 结构为 `{ ts, type, clientId, channel, data }`（S1:74）。它没有"发生在哪个页面体系"的字段。若不区分，官网的 `landing_view` 会和应用内 `landing_view` 混在同一个 `funnel` 里，官网贡献永远算不清。

**改造方案**：给每个事件增加 `surface` 字段，取值只允许两个枚举：

| surface | 含义 | 页面范围 | 上报方 |
| --- | --- | --- | --- |
| `site` | 官网（营销入口） | 官网首页、定价页、FAQ、隐私/条款/退款页以及官网跳转到应用的 CTA | 官网自己的 JS，主动 `POST /api/event` |
| `app` | 产品应用 | `agi-engine-v3/` 单文件 PWA 内部 | 应用内 `track()`（A2）|

`channel` 继续保留现有语义（S4:418），承载来源渠道：`direct` / `organic` / `producthunt` / `hn` / `wechat` / `referral` / `reddit` / `x` 等。**`source` 与 `channel` 的关系**：官网把落地页 URL 上的 `utm_source` 归一化为 `channel` 入库；`source` 作为原始字符串保留在 `data` 中用于溯源（字段名统一为 `data.sourceRaw`，长度 ≤ 64）。

> 应用层现状必须说清：白名单里有 11 个事件（S4:412），但应用真正 `fetch('/api/event')` 的只有 `track()`（A2:1124–1135），而 `track()` 在全文只在 `?ref=` 分支被调用一次（A4:1979）。`trial_start`/`onboard_complete`/`first_memory`/`first_chat`/`pro_view`/`pro_click` 目前只进本地 `Analytics`（A5），**刷新即丢、不进 `/api/report`**。因此官网 KPI 树中"注册/激活/付费"三段，官网侧只能观测"点击跳转"与"落地应用后归因落库"，不能声称官网已能直接看到应用内激活。要打通需 §3.4 的补齐。

### 1.2 全链路 KPI 表（访客 → 官网互动 → 点击使用产品 → 注册 → 激活 → 付费）

| # | 漏斗环节 | 事件名（type） | 触发时机 | data 字段 | 数据来源 | 当前真实值 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 访客到达 | `site_view` | 官网任一页面 DOMContentLoaded，每个页面视图一次（SPA 路由切换也算一次） | `{page, lang, sourceRaw, refCode, sid}` | 官网埋点 → `/api/event` | 0（官网未上线） |
| 2 | 官网互动·主 CTA 曝光 | `hero_cta_view` | Hero 区主 CTA 首次进入视口（`IntersectionObserver`，threshold 0.5，只触发一次） | `{page, ctaId:"hero-free", lang}` | 官网埋点 | 0 |
| 3 | 官网互动·主 CTA 点击 | `hero_cta_click` | 用户点击"免费使用" | `{page, ctaId, lang, dest, sourceRaw, refCode, sid}` | 官网埋点 | 0 |
| 4 | 官网互动·定价浏览 | `pricing_view` | 定价区块/定价页首次进入视口 | `{page, planHighlighted, lang}` | 官网埋点 | 0 |
| 5 | 官网互动·FAQ 展开 | `faq_expand` | 任一 FAQ 条目 `aria-expanded` 由 false→true | `{page, faqId, questionIndex}` | 官网埋点 | 0 |
| 6 | 官网互动·信任/政策页 | `policy_link_click` | 点击隐私/条款/退款/Footer 政策链接 | `{page, policy:"privacy"\|"terms"\|"refund", lang}` | 官网埋点 | 0 |
| 7 | 官网互动·站外支付查看 | `outbound_paypal_click` | 点击官网上的 PayPal 支付/ donate/ paypal.me 链接 | `{page, dest:"paypal", planHint, lang}` | 官网埋点 | 0 |
| 8 | 点击使用产品（跳转） | `site_to_app_click` | 任何指向应用 URL 的链接被点击（含 hero、导航、pricing、footer） | `{page, ctaId, destUrlHost, sourceRaw, sid}` | 官网埋点 | 0 |
| 9 | 应用落地承接 | `app_landing_view` | 应用收到带 `src/sid` 的参数并完成归因写入后上报 | `{sourceRaw, channel, sid, refCode, landingPage}` | 应用埋点（需改造 A2/A4） | 0 |
| 10 | 注册 | `trial_start` | 应用内首次点击"开始试用"并产生 `clientId` | `{sourceRaw, channel, sid, refCode}` | 应用埋点（白名单已有，**当前未真正上报**） | 0 |
| 11 | 激活 | `first_memory` / `first_chat` | 应用内首次保存记忆 / 首次发送对话 | `{sourceRaw, channel, sid}` | 应用埋点（同上，当前未上报） | 0 |
| 12 | 付费意愿 | `pro_view` / `pro_click` | 应用内查看 Paywall / 点击订阅链接 | `{plan, sourceRaw, channel, sid, refCode}` | 应用埋点（同上；`pro_click` 目前仅由 `/api/claim` 与订阅创建在服务端补写，S6:616） | 0 |
| 13 | 付费（真实） | 服务端 `payments` 记录 | PayPal webhook 验签 `SUCCESS` 后入账（S7:643–682） | 服务端自动生成，不信任前端 | 服务端验签 | 0 笔 / $0 |

### 1.3 官网埋点 vs 应用埋点对照

| 维度 | 官网埋点（新增） | 应用埋点（改造） |
| --- | --- | --- |
| 载体 | 官网自己的 `<script>`，独立文件或内联 | `index.html` 的 `track()`（A2:1124） |
| 后端地址 | 复用 `window.AGI_BACKEND_BASE` 约定（A1:1063）；官网未配置则不上报 | 已用该约定，默认空串 |
| 身份 | 官网发文前生成 `sid`（§4.2），无账号体系 | `GAME.clientId`（A3:1143） |
| surface | 固定 `site` | 固定 `app` |
| 隐私 | 只发枚举与短字符串；不发任何正文 | 同左；严禁发 `GAME.memories` / `chatHistory` |
| 失败策略 | `fetch(..., {keepalive:true}).catch(()=>{})`，不影响页面 | 同左（A2:1132） |
| 去重 | 曝光类事件每会话每元素一次；点击类每次计一次 | 服务端 `buildReport` 已按 `day:clientId` 去重（S3:296） |

### 1.4 从 KPI 树读出的三条现状结论

1. 官网阶段能**真实拿到**的只有 1–8 与 9（改造后），10–12 需要补应用端上报，13 只能由验签产生。
2. 现有 `/api/report` 的 `funnel` 是 `type → count` 的平铺计数（S3:320），没有 surface 维度；官网 `site_view` 加进去后仍无法单独统计官网，必须按 §3.3 新增 `site` 段。
3. WAPS（D1:70）是唯一北极星，但它对官网是**滞后指标**——官网上线后 WAPS 仍可能长期为 0。官网阶段必须用 §5 的输入指标证明方向。

---

## 2. 需要新增的埋点事件（官网侧，可直接开发）

### 2.1 统一信封（所有官网事件共用）

官网所有事件走同一个 `send()`，服务端 `POST /api/event` 的请求体结构必须与 S4:414–420 对齐，并额外带 `surface`：

```json
{
  "type": "hero_cta_click",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "producthunt",
  "data": {
    "page": "/",
    "lang": "zh",
    "ctaId": "hero-free",
    "sourceRaw": "producthunt",
    "refCode": "AGI-4F2A9C",
    "sid": "s_1a2b3c4d5e"
  }
}
```

字段约束：`type` 必须命中服务端白名单（§3.1）；`surface` 仅 `site|app`；`clientId` ≤ 64 且只含 `[A-Za-z0-9_-]`；`channel` ≤ 32；`data` 每个值 ≤ 64 字符、嵌套深度 ≤ 2、键名命中白名单（§3.2）。

### 2.2 事件清单

**E1 `site_view`** — 触发：页面加载完成（或 SPA 路由变更）后 1 次。

```json
{
  "type": "site_view",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "producthunt",
  "data": {
    "page": "/pricing",
    "lang": "zh",
    "sourceRaw": "producthunt",
    "refCode": "",
    "sid": "s_1a2b3c4d5e"
  }
}
```

**E2 `hero_cta_view`** — 触发：Hero 主 CTA 首次进入视口；`threshold: 0.5`，`once: true`。

```json
{
  "type": "hero_cta_view",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "direct",
  "data": { "page": "/", "ctaId": "hero-free", "lang": "zh" }
}
```

**E3 `hero_cta_click`** — 触发：Hero 区"免费使用"被点击（ href 构造见 §4.3）。

```json
{
  "type": "hero_cta_click",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "producthunt",
  "data": {
    "page": "/",
    "ctaId": "hero-free",
    "lang": "zh",
    "dest": "app",
    "sourceRaw": "producthunt",
    "refCode": "",
    "sid": "s_1a2b3c4d5e"
  }
}
```

**E4 `pricing_view`** — 触发：定价区块首次进入视口；`planHighlighted` 只允许 `annual|monthly|none`。

```json
{
  "type": "pricing_view",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "direct",
  "data": { "page": "/pricing", "planHighlighted": "annual", "lang": "zh" }
}
```

**E5 `faq_expand`** — 触发：FAQ `<details>` 的 `toggle` 事件且 `open === true`。

```json
{
  "type": "faq_expand",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "direct",
  "data": { "page": "/faq", "faqId": "faq-privacy", "questionIndex": 3 }
}
```

**E6 `policy_link_click`** — 触发：Footer 或正文的隐私/条款/退款链接点击；`policy` 为枚举。

```json
{
  "type": "policy_link_click",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "direct",
  "data": { "page": "/", "policy": "privacy", "lang": "zh" }
}
```

**E7 `outbound_paypal_click`** — 触发：官网任何指向 PayPal 的外链点击。注意此事件**只证明点击，不证明付款**，付款只认 S7 验签记录。

```json
{
  "type": "outbound_paypal_click",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "direct",
  "data": { "page": "/pricing", "dest": "paypal", "planHint": "annual", "lang": "zh" }
}
```

**E8 `site_to_app_click`** — 触发：任何 `href` 指向应用 host 的链接点击（用事件委托统一捕获，避免漏埋）。

```json
{
  "type": "site_to_app_click",
  "surface": "site",
  "clientId": "s_1a2b3c4d5e",
  "channel": "producthunt",
  "data": {
    "page": "/",
    "ctaId": "nav-try",
    "destUrlHost": "fnhiq23.github.io",
    "sourceRaw": "producthunt",
    "sid": "s_1a2b3c4d5e"
  }
}
```

**E9 `app_landing_view`**（应用侧新增）— 触发：应用解析完 URL 参数并写入 localStorage 后；用于连通"官网跳转→应用承接"。

```json
{
  "type": "app_landing_view",
  "surface": "app",
  "clientId": "c_x8y7z6w5v4",
  "channel": "producthunt",
  "data": {
    "sourceRaw": "producthunt",
    "channel": "producthunt",
    "sid": "s_1a2b3c4d5e",
    "refCode": "AGI-4F2A9C",
    "landingPage": "/agi-engine-v3/"
  }
}
```

> 事件总数：官网新增 8 个（`site_view`、`hero_cta_view`、`hero_cta_click`、`pricing_view`、`faq_expand`、`policy_link_click`、`outbound_paypal_click`、`site_to_app_click`），应用新增 1 个（`app_landing_view`）。其余复用现有白名单。

---

## 3. 后端改造清单

### 3.1 白名单扩展（`server/server.js:412`）

现状：

```js
const allowed = ['landing_view', 'trial_start', 'onboard_complete', 'first_memory', 'first_chat', 'pro_view', 'pro_click', 'referral', 'referral_click', 'referral_signup', 'referral_qualified'];
```

改为常量 + 追加官网事件（保留原 11 个，不删除，兼容历史数据）：

```js
// 建议放在文件顶部配置区（约第 60 行后），避免每次请求重建数组
const ALLOWED_EVENTS = new Set([
  // 应用侧（历史白名单，保留）
  'landing_view', 'trial_start', 'onboard_complete', 'first_memory', 'first_chat',
  'pro_view', 'pro_click', 'referral', 'referral_click', 'referral_signup', 'referral_qualified',
  // 官网侧（DEL-015 新增）
  'site_view', 'hero_cta_view', 'hero_cta_click', 'pricing_view',
  'faq_expand', 'policy_link_click', 'outbound_paypal_click',
  'site_to_app_click', 'app_landing_view',
]);
// 路由内改为：if (!ALLOWED_EVENTS.has(b.type)) return json(res, 400, { error: 'unknown event type' });
```

### 3.2 落库加固（`server/server.js:414–420`）

现状 `data: b.data || {}` 原样落库，存在隐私注入风险（前端可塞任意文本/记忆内容）。改为字段白名单 + 枚举 + 硬截断：

```js
const DATA_KEYS = ['page','lang','ctaId','dest','sourceRaw','refCode','sid',
                   'planHighlighted','faqId','questionIndex','policy',
                   'destUrlHost','planHint','plan','subId','code','claimId',
                   'channel','landingPage'];
const clean = {};
for (const k of DATA_KEYS) {
  if (b.data && Object.prototype.hasOwnProperty.call(b.data, k)) {
    clean[k] = String(b.data[k]).slice(0, 64); // 统一截断
  }
}
const surface = b.surface === 'site' ? 'site' : 'app'; // 默认 app，防止越权标记
db.events.push({
  ts: new Date().toISOString(),
  type: b.type,
  clientId: String(b.clientId || 'anon').slice(0, 64).replace(/[^A-Za-z0-9_-]/g, ''),
  channel: String(b.channel || 'direct').slice(0, 32),
  surface,                       // 新增：区分官网/应用
  data: clean,                   // 新增：只留白名单字段
});
```

补充约束：`questionIndex` 用 `parseInt` 限制 0–999；`planHighlighted` 限定 `annual|monthly|none`；`policy` 限定 `privacy|terms|refund|faq`；`dest` 限定 `app|paypal`。任何不在白名单的键**直接丢弃**，不报错、不落库——保证"埋点不得收集用户记忆内容或个人隐私"在服务端也成立。

### 3.3 `buildReport()` 新增官网段（`server/server.js:285–374`）

在 `buildReport()` 的循环（S3:298–322）内追加按 surface 的计数：

```js
const bySurface = { site: 0, app: 0 };          // 放在 290 行附近
const siteFunnel = {};                           // 官网专属漏斗
// 循环内（320 行 funnel[e.type] 旁边）追加：
bySurface[e.surface === 'site' ? 'site' : 'app']++;
if (e.surface === 'site') siteFunnel[e.type] = (siteFunnel[e.type] || 0) + 1;
```

在返回对象（S3:339–373）中新增字段：

```js
site: {
  views: siteFunnel.site_view || 0,
  heroCtaViews: siteFunnel.hero_cta_view || 0,
  heroCtaClicks: siteFunnel.hero_cta_click || 0,
  pricingViews: siteFunnel.pricing_view || 0,
  faqExpands: siteFunnel.faq_expand || 0,
  policyLinkClicks: siteFunnel.policy_link_click || 0,
  outboundPaypalClicks: siteFunnel.outbound_paypal_click || 0,
  toAppClicks: siteFunnel.site_to_app_click || 0,
  appLandingViews: siteFunnel.app_landing_view || 0,
  heroCtr: (siteFunnel.hero_cta_view || 0)
    ? ((siteFunnel.hero_cta_click || 0) / siteFunnel.hero_cta_view * 100).toFixed(1) + '%' : '0%',
  jumpRate: (siteFunnel.site_to_app_click || 0)
    ? ((siteFunnel.app_landing_view || 0) / siteFunnel.site_to_app_click * 100).toFixed(1) + '%' : '0%',
  bySurface,
},
```

并给 `channels`（S3:356）增加按 surface 的拆分：`channelsBySurface: { site: {...}, app: {...} }`，用于回答"哪个渠道给官网带来了流量、哪个渠道最终成交"。

**兼容性**：以上均为**新增字段**，不改动 `today/funnel/conversion/revenue/weekly/referral/northStar` 的既有结构，现有 dashboard 渲染（S8:81–137）不会因升级而崩。

### 3.4 应用端补齐（`index.html`，用于让 10–12 段真实进报表）

改造 `track()`（A2:1124–1135）为接受 `data` 参数并始终带 `surface:'app'`；然后在以下真实位置补调用：

| 应用内位置 | 建议插入点 | 调用 |
| --- | --- | --- |
| 开始试用按钮 | 创建 `GAME.clientId` 后、进入 app 屏前（参考 A4:1960 附近） | `track('trial_start','direct',{sid, refCode})` |
| 首次保存记忆 | 成就 `first_memory` 判定处（A5 引用 1186 行附近的实际写入函数） | `track('first_memory','direct',{sid})` |
| 首次对话 | 成就 `first_chat` 判定处（1188 行附近） | `track('first_chat','direct',{sid})` |
| Paywall 展示 | Paywall 打开函数（参考 952 行 paywall 区块） | `track('pro_view','direct',{sid, plan:'none'})` |
| 订阅点击 | A2:1086–1090 `subscription/create` 调用前 | `track('pro_click','direct',{plan, refCode, sid})` |

> 这些是**建议改造点**，不是已完成事实。未改造前，`/api/report` 的"注册/激活"数字来自应用的为 0，看板必须标注该口径。

### 3.5 路由与存储检查

- **无需新增路由**：官网直接复用 `POST /api/event`、`GET /api/report`（S5:425）。保持零依赖、单文件后端。
- **无需改 `emptyDB()`**：`surface` 是事件级字段，落在 `events[].surface` 即可（S1:74）；`ensureSchema()`（S1:83）无需迁移旧库，旧事件无 `surface` 时 `buildReport` 按 `app` 兜底（见 §3.3 `bySurface` 逻辑）。
- **可选分页**：`/api/report` 全量遍历 `db.events`（S3:298），`prune()`（S1:141–148）在 >5 万条时保留 30 天，官网流量起来后仍够用；暂不加分页，避免过度工程。

---

## 4. 官网 → 应用的归因贯通

### 4.1 需要传递的四个参数

| 参数 | 含义 | 生成方 | 长度/格式 |
| --- | --- | --- | --- |
| `src` | 来源渠道，归一化后的 `channel` | 官网（从 `utm_source`/`ref` 映射） | ≤ 32，小写字母数字与 `-` |
| `sid` | 官网会话/访客 ID | 官网（localStorage 持久化） | `s_` + 10 位 base36 |
| `ref` | 推荐码（可选，有推荐人时才有） | 推荐链接或用户手动输入 | `AGI-XXXXXX`，≤ 16，大写 |
| `lang` | 界面语言 | 官网 | `zh`/`en` 等，≤ 8 |

### 4.2 官网侧：生成并持久化身份

```js
const SID_KEY = 'agi_site_sid';
let sid;
try {
  sid = localStorage.getItem(SID_KEY) || ('s_' + Math.random().toString(36).slice(2, 12));
  localStorage.setItem(SID_KEY, sid);
} catch (e) { sid = 's_anon'; }

// 落地页参数归一化：utm_source / ref 都进 src；白名单避免任意字符串入库
const CHANNELS = ['direct','organic','producthunt','hn','wechat','reddit','x','referral','newsletter'];
const q = new URLSearchParams(location.search);
const raw = (q.get('utm_source') || q.get('src') || 'direct').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
const src = CHANNELS.includes(raw) ? raw : 'direct';
const refRaw = (q.get('ref') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
const ref = /^AGI-[A-Z0-9]{3,}$/.test(refRaw) ? refRaw : '';
```

### 4.3 官网 CTA 链接构造（所有"免费使用"按钮统一走此函数）

```js
const APP_BASE = 'https://fnhiq23.github.io/agi-engine-v3/';
function appUrl(ctaId) {
  const u = new URL(APP_BASE);
  u.searchParams.set('src', src);      // 渠道
  u.searchParams.set('sid', sid);      // 官网会话
  u.searchParams.set('lang', document.documentElement.lang || 'zh');
  if (ref) u.searchParams.set('ref', ref); // 推荐码（可选）
  return u.toString();
}
// 点击时先埋点再用 location.href = appUrl('hero-free') 跳转；
// 用 keepalive 保证跳转不丢事件（见 §2.1 信封）
```

### 4.4 应用侧承接：落到 localStorage（`index.html:1968–1981` 改造）

现有代码只解析 `ref`。改为同时解析 `src/sid`，并**修复一个真实 bug**：现有 `agi_ref_by` 存的是 JSON 对象 `{code, ts}`（A4:1977），但 A2:1086 与 A2:1127 直接把它当字符串读取，重载后传给后端的会是 `"[object Object]"`（虽然会被服务端正则清洗成空，但归因丢失）。统一用解析函数：

```js
function readRefBy() {
  try {
    const v = JSON.parse(localStorage.getItem('agi_ref_by') || '{}');
    return (v && typeof v.code === 'string') ? v : {};
  } catch (e) { return {}; }
}
// 初始化时（替换 A4:1968–1981 的解析段）：
const q = new URLSearchParams(location.search);
const src = (q.get('src') || 'direct').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
const sid = (q.get('sid') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
const ref = (q.get('ref') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
if (src) localStorage.setItem('agi_src', src);
if (sid) localStorage.setItem('agi_site_sid', sid);
// 30 天归因窗口沿用现有逻辑（A4:1976）
if (ref && ref !== GAME.referralCode) {
  const stored = readRefBy();
  if (stored.code !== ref || Date.now() - (stored.ts || 0) > 30 * 86400000) {
    localStorage.setItem('agi_ref_by', JSON.stringify({ code: ref, ts: Date.now() }));
    GAME.referrerCode = ref;
    track('referral_click', 'referral', { sid });
  }
}
track('app_landing_view', src || 'direct', { sourceRaw: src, sid, refCode: ref });
```

### 4.5 贯穿到付款（已有链路，只需修正读取方式）

现有 `custom_id` 格式为 `v1|clientId|refCode`（S2:94–103、S6:594），webhook 验签后解析 `refCode` 并调用 `recordCommission()`（S7:681、720）。也就是说**推荐码到付款的链路后端已经具备**，官网只需保证 `ref` 正确传入：

```js
// 替换 A2:1086 的取值方式
const refCode = (GAME.referrerCode || readRefBy().code || '').toString().slice(0, 16);
// /api/subscription/create 的 body 保持 A2:1087–1090 结构：
// { plan, clientId: GAME.clientId, refCode, returnUrl: location.href }
// 后端 S6:594 会把它写入 custom_id = 'v1|' + clientId + '|' + refCode
```

**归因优先级**（冲突时取前者）：URL `?ref=`（本次点击） > `GAME.referrerCode`（本会话） > `agi_ref_by.code`（30 天内持久化） > 空。渠道 `src` 优先级：URL `?src=` > `localStorage.agi_src` > `direct`。

**口径提醒**：`sid` 是官网访客 ID，`clientId` 是应用匿名 ID，两者**不同**。要证明"官网点击→应用注册→付费"是同一人，需在应用注册时把 `sid` 写进事件 `data.sid`（§3.4），由 `buildReport` 按 `sid` 串联；不能把 `sid` 冒充 `clientId` 写进订阅（会破坏 S2 的 `custom_id` 解析与自推荐拦截 S7:382）。

---

## 5. 北极星与输入指标

### 5.1 北极星指标（沿用 DEL-010，不另立门户）

**WAPS（Weekly Active Paying Subscribers，周活跃付费订阅数）**，数据来自 `/api/report → subscriptions.active`（S3:358、367–371），由验签通过的付款驱动。

官网阶段增加一个**归因子口径**用于看官网贡献：`site-sourced WAPS` = 订阅记录中 `refCode` 或事件链中 `sid` 来自官网的活跃订阅数。此为**新增派生指标**，需在 `subscriptions` 写入时保留 `sid`（S6/S7 的 `db.subscriptions[clientId]` 增加 `sid` 字段），当前真实值为 **0**。

### 5.2 流量仍为 0 时该看什么：输入指标清单

流量为 0 是冷启动常态（D1:92–96）。此时 WAPS 的 0 不含信息量，要看下列**输入指标**证明"埋点管道正确、页面方向正确"。每项均给出"方向正确"的可判定信号。

| # | 输入指标 | 定义/计算 | 数据来源 | 流量 0 时的正确信号 |
| --- | --- | --- | --- | --- |
| I1 | 埋点送达率 | 官网发出事件数 / 后端收到 `surface=site` 事件数 | 官网本地计数 vs `/api/report → site.bySurface.site` | 测试点击后两者相等（±网络重试） |
| I2 | 白名单命中率 | `POST /api/event` 返回 200 的比例 | 官网 fetch 状态统计 | 100%；出现 400 说明事件名未进白名单 |
| I3 | CTA 曝光率 | `hero_cta_view / site_view`（同会话） | `site.heroCtaViews / site.views` | >0（页面确实把主 CTA 放在首屏） |
| I4 | CTA 点击率 CTR | `site.heroCtaClicks / site.heroCtaViews` | `site.heroCtr` | 有任何真实点击即证明文案有效 |
| I5 | 跳转成功率 | `site.appLandingViews / site.toAppClicks` | `site.jumpRate` | 接近 100%；明显偏低说明 URL 参数或落地页有问题 |
| I6 | 渠道覆盖数 | `channels` 中非零渠道个数 | `/api/report → channels` | ≥1，说明分发动作带来了真实访客 |
| I7 | 内容互动率 | `faqExpands + policyLinkClicks + pricingViews` | `site` 段 | 非零说明访客在看信任与定价信息 |
| I8 | 归因落库率 | 带 `sid/refCode` 的事件 / 全部官网事件 | `data.sid` 非空计数 | 接近 100%，保证后续能串联 |
| I9 | 验签通路健康 | `dataIntegrity.webhookCalls` 有记录且无异常 | `dataIntegrity` | 测试事件被正确拒绝（`verified:false`）即为正确 |
| I10 | 数据纯度 | 剔除测试 clientId 后的真实事件占比 | `channels` 与 `clientId` 审计 | 上线后真实事件占比持续上升 |

> 判据原则：**先看 I1/I2（管道通不通），再看 I3–I5（页面引导是否有效），最后看 I6–I8（流量与归因是否真实）**。任何阶段都不允许把 I 指标当作收入增长来汇报。

---

## 6. 看板升级建议（基于 `server/public/dashboard.html`）

### 6.1 新增卡片清单（KPI 区，S8:45 的 `#kpi`）

| 卡片 | 显示字段 | 数据来源 | 空数据文案 |
| --- | --- | --- | --- |
| 官网访客（今日） | `site.views` | `/api/report → site` | 0 |
| 主 CTA 曝光 | `site.heroCtaViews` | 同上 | 0 |
| 主 CTA 点击 | `site.heroCtaClicks` | 同上 | 0 |
| 官网→应用跳转 | `site.toAppClicks` | 同上 | 0 |
| 应用承接成功 | `site.appLandingViews` | 同上 | 0 |
| 官网曝光→点击率 | `site.heroCtr` | 同上 | 0% |

### 6.2 新增区块（插入到 S8:67 之后、"数据完整性"之前）

1. **官网漏斗区块**（`<div class="section"><h2>官网 → 应用漏斗</h2><div id="siteFunnel"></div></div>`）：复用现有 `.funnel-row/.funnel-bar` 样式（S8:27–30），依次显示 `site_view → hero_cta_view → hero_cta_click → site_to_app_click → app_landing_view → trial_start`。
2. **渠道 × surface 区块**：表格显示 `channelsBySurface.site` 与 `channelsBySurface.app` 两列，回答"哪个渠道只带来浏览、哪个带来落地"。
3. **输入指标区块**：显示 I1–I8 的当前值与"方向正确"标注；明确标注"流量 0 阶段，此区为方向验证，不代表收入"。
4. **数据边界说明**（放在 integrity 区块 S8:63–67 内）：追加一行"官网埋点只记录点击/跳转/来源，不记录停留时长与未点击的浏览；付款仅认 PayPal 验签记录。"

### 6.3 渲染代码位置建议（S8:72–144 的 `load()` 内）

在 S8:89 的 KPI 模板字符串末尾追加：

```js
document.getElementById('kpi').insertAdjacentHTML('beforeend', `
  <div class="card"><div class="label">官网访客</div><div class="value">${fmt(d.site?.views)}</div></div>
  <div class="card"><div class="label">主CTA点击</div><div class="value">${fmt(d.site?.heroCtaClicks)}</div></div>
  <div class="card"><div class="label">官网→应用跳转</div><div class="value amb">${fmt(d.site?.toAppClicks)}</div></div>
  <div class="card"><div class="label">应用承接</div><div class="value amb">${fmt(d.site?.appLandingViews)}</div></div>
  <div class="card"><div class="label">官网CTR</div><div class="value amb">${d.site?.heroCtr || '0%'}</div></div>`);
```

漏斗渲染复用 S8:102–106 的 `stages.map(...)` 模式，把 `stages` 换成官网五段即可。`d.site` 用可选链兜底，保证后端未升级时看板不报错。

---

## 7. 诚实的数据边界

### 7.1 能真实拿到（服务端埋点 / 验签）

- 官网页面的**加载次数、语言、页面路径、来源渠道、推荐码、会话 ID**（E1–E8，需改造后）。
- 主 CTA 的**曝光与点击次数、CTR**、定价/FAQ/政策链接的点击与展开。
- 官网跳转到应用的**点击数与应用承接数**，以及两者的比值 I5。
- 来源 `src/ref` 经 URL → localStorage → `custom_id`（S6:594）→ webhook（S7:650–681）的**完整归因链**。
- 付款：**仅** `dataIntegrity.verifiedPayments` 与 `revenue.transactions`（S7 验签通过后入账）。

### 7.2 拿不到或当前拿不到（不要虚构）

| 数据 | 为什么拿不到 | 正确做法 |
| --- | --- | --- |
| 用户在官网停留多久 | 没有时长埋点；`beforeunload` 上报不可靠 | 不展示；如需可新增显式心跳，但本次不做 |
| 滚动深度、鼠标轨迹、未点击的浏览 | 无相关埋点；且属于过度收集 | 明确"不记录" |
| 看了 CTA 但没点的人 | 点击事件不记录"未点击" | 只能用曝光数减点击数估算"曝光未点击"，需标注为推算 |
| 应用内注册/激活（当前） | A5 `Analytics` 只在内存，A2 `track()` 仅上报 `referral_click` | 按 §3.4 改造后才真实；改造前看板标注"应用事件未接入" |
| 自然搜索关键词 | 浏览器不传给站点 | 不展示 |
| 跨设备/清缓存后的同一用户 | 匿名 ID 存 localStorage，清除即失联 | 承认口径为"浏览器级"而非"人级" |
| 付款未完成/拒付 | 前端点击不等于付款，无 webhook 记录 | `outbound_paypal_click` 只算意愿，不算成交 |
| 官网的真实收入数字（当前） | 收入 0，且官网未上线 | 显示 $0，不做任何预估 |

### 7.3 数据与隐私红线

- 不收集用户记忆、聊天、LLM Key、邮箱正文、IP；服务端 `data` 白名单（§3.2）保证即使前端误发也不会落库。
- 不把测试事件（如历史 `pro_click` 的 `c_test_subscription` 等，D1:171）计入真实输入指标；看板标注 I10 数据纯度。
- 推荐奖励是"免费月数"模式（S7:391 `mode:'free-months'`），现金返佣需创始人确认（S5:557），本文不改变该策略。

---

## 8. 落地验收清单

| # | 验收项 | 判定标准 |
| --- | --- | --- |
| 1 | 白名单扩展 | `POST /api/event` 对 8 个官网事件均返回 200 |
| 2 | 落库加固 | 发送含记忆文本的 `data`，后端落库不含该字段 |
| 3 | surface 区分 | `/api/report → site.bySurface` 统计与实际点击数一致 |
| 4 | 官网漏斗 | 看板官网漏斗五段均有数字（测试环境） |
| 5 | URL 参数贯通 | 官网 CTA 带 `src/sid/ref`，应用收到后写入 localStorage |
| 6 | 归因修复 | 应用重载后订阅 `refCode` 不再出现 `[object Object]` |
| 7 | 付款归因 | 测试订阅的 `custom_id` 为 `v1|clientId|refCode`，webhook 解析正确 |
| 8 | 零数据诚实 | 未上线时所有 KPI 显示 0，无估算值 |
| 9 | 看板兼容 | 后端未升级时 dashboard 仍正常渲染（可选链兜底） |
| 10 | 零依赖保持 | 后端仍仅用 Node.js 内置模块，未引入新包 |

（正文完）
