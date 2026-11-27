# 手动对账运营手册（Manual Reconciliation Playbook）

> 这份手册解决一个具体问题：**你用的是 PayPal「免代码付款链接」（ncp/payment），它只支持一次性付款、不带 custom_id、Webhook 无法识别付款人。** 在这种情况下，如何真实地完成「有人付款 → 确认到账 → 开通 Pro → 数据进战报」的闭环。
>
> 全程合法：你本人在自己的 PayPal 后台核对到账，再手动批准。不冒充身份、不群发、不伪造数据。

---

## 一、整体流程（一图看懂）

```
用户点付款链接 → PayPal 付款成功
        ↓
用户打开 /claim 页，填：邮箱 + 交易号 + 用户ID
        ↓  （后端生成 PENDING 认领，记 pro_click 事件）
你打开 /reconcile 核销台
        ↓
到 PayPal 后台核对交易号确实到账 ✓
        ↓
点「批准」→ 自动激活订阅 + 记入真实收入 + 进战报
        ↓
用户查 /api/claim/status 看到 APPROVED，Pro 生效
```

**为什么需要这一步**：PayPal 官方明确说付款链接 `support one-time payments only`，且不带 `custom_id`。所以系统无法自动知道「谁付了钱」。核销台就是你用肉眼确认 + 一键授权的环节——**真实、可验证、不可伪造**（交易号重复会被拒绝，无管理员令牌无法批准）。

---

## 二、三个页面的地址

| 页面 | 路径 | 给谁用 | 作用 |
|---|---|---|---|
| 客户认领页 | `/claim` | 付款的用户 | 填交易号提交开通申请 |
| 核销台 | `/reconcile` | 你（创始人） | 看待核销列表、核对、一键批准/拒绝 |
| 数据看板 | `/dashboard` | 你 | 看真实漏斗、收入、渠道 |

⚠️ 前端 `index.html` 的付费墙已加「Already paid? Submit your receipt」链接，指向 `/claim`。

---

## 三、首次配置（一次性，5 分钟）

### 1. 设置管理员令牌
核销台必须设令牌，否则任何人都能批准付款——这是安全红线。

编辑 `server/.env`（复制自 `.env.example`）：
```bash
ADMIN_TOKEN=换成你自己的一长串随机字符
PAYPAL_MODE=live
```
生成随机令牌：`openssl rand -hex 16`

### 2. 启动后端
```bash
cd server
node server.js
```
访问 `http://localhost:3000/reconcile`，输入你设的令牌进入核销台。

### 3. 部署到公网（让用户能访问 /claim）
后端需要部署到公网服务器（Render / Railway / 自己的 VPS），拿到一个网址，例如 `https://agi-backend.onrender.com`。
然后**在前端 `index.html` 顶部**设置：
```js
const BACKEND_BASE = 'https://agi-backend.onrender.com';
```
这样 GitHub Pages 上的前端就能把认领链接、埋点事件正确发到后端。

> 后端已开启 CORS（`Access-Control-Allow-Origin: *`），跨域没问题。

---

## 四、日常操作（收到付款后）

### 第 1 步：核对到账（必做，不能省）
1. 登录 [PayPal 商户后台](https://www.paypal.com/businessmanage/home)
2. 找到这笔交易，确认：
   - **金额正确**（$100 年卡 / $15 月卡）
   - **状态是 Completed / 已收款**，不是 Pending
3. 复制交易号（Transaction ID）

### 第 2 步：在核销台批准
1. 打开 `/reconcile`，进入核销台
2. 找到对应认领（按邮箱 / 交易号匹配）
3. 点「✓ 批准」，输入实际到账金额（默认 $100/$15，可覆盖）
4. 系统自动：
   - 激活该用户订阅（年卡到期日 = 今天 + 1 年）
   - 记入真实收入（进战报的收入、交易数）
   - 认领状态变 APPROVED

### 第 3 步：（可选）通知用户
用你自己的邮箱/社媒告诉用户「已开通」。自动发邮件需要你配置邮件服务（ SendGrid / Resend ）——这属于后续可选项。

---

## 五、异常处理

| 情况 | 处理 |
|---|---|
| 用户填错交易号 | 核销台点「拒绝」，让用户重新提交（新交易号） |
| 重复交易号提交 | 后端自动拒绝（HTTP 409），防止一人多领 |
| 有人伪造交易号 | 你在 PayPal 后台核对不到 → 拒绝，绝不批准 |
| 金额不对 | 批准时输入实际到账金额，收入按真实金额记 |
| 忘记令牌 | 看 `server/.env` 的 `ADMIN_TOKEN`（不设则核销台拒绝所有访问） |

---

## 六、安全设计（已内置，可验证）

- ✅ **无令牌不能看/改**：`/api/admin/*` 全部校验 `x-admin-token`，用 `crypto.timingSafeEqual` 防时序攻击
- ✅ **交易号去重**：同一交易号不能重复认领/开通
- ✅ **重复批准防护**：已批复的认领再次批准返回 `ALREADY_REVIEWED`
- ✅ **未验证付款不激活**：Webhook 未配置时，伪造付款不会激活订阅（沿用原有安全设计）
- ✅ **数据只在服务端**：收入、订阅、认领都存 `server/data/db.json`，不在浏览器里伪造

---

## 七、从手动升级到全自动（未来）

当你要做真订阅（自动续费 + 自动开通）时：
1. 在 PayPal Developer Dashboard 创建 REST API 应用，拿 Client ID / Secret
2. 创建 Webhook，订阅 `PAYMENT.CAPTURE.COMPLETED` 等事件
3. 填进 `server/.env`：`PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` / `PAYPAL_WEBHOOK_ID` / `PAYPAL_MODE=live`
4. 用 PayPal **Subscriptions API** 生成订阅链接（替代 ncp 付款链接），并在 order 里设置 `custom_id = 用户clientId`
5. 此后 Webhook 会自动验证签名 + 激活订阅，无需人工核销

详见 `PAYMENT_UPGRADE.md`。在那之前，**手动核销是完全可行、很多项目早期都这么做的合法方式**。

---

## 八、诚实提醒

- 这套流程能真实收款、真实开通、真实出战报。但**流量要靠你用本人账号发布内容**（Show HN / Product Hunt / 社媒文案已备好在 `launch/`）。
- 「每天 1 万美元」没有任何技术手段能保证。战报会如实显示真实数据——可能是 0。这正是它可验证的价值。
- 令牌、PayPal 凭据绝不提交到 Git（`.gitignore` 已排除 `server/.env`）。
