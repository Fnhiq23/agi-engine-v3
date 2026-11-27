# AGI Engine — 线上部署状态与 Webhook 配置

> 生成时间：2026-11-27
> 本文记录已发布到公网的后端地址、Webhook 配置方法、当前限制与下一步。

---

## 一、已上线的公网后端

后端（零依赖 Node.js）已发布到公网，以下地址**均可正常访问**：

| 用途 | 确切地址 |
|---|---|
| 健康检查 | `https://acb7adbd80f066c9d.app.workbuddy.host/api/health?sharecode=S4XAXZRX4F` |
| 数据看板 | `https://acb7adbd80f066c9d.app.workbuddy.host/dashboard?sharecode=S4XAXZRX4F` |
| 客户认领页 `/claim` | `https://acb7adbd80f066c9d.app.workbuddy.host/claim?sharecode=S4XAXZRX4F` |
| 创始人核销台 `/reconcile` | `https://acb7adbd80f066c9d.app.workbuddy.host/reconcile?sharecode=S4XAXZRX4F` |
| 每日战报 API | `https://acb7adbd80f066c9d.app.workbuddy.host/api/report?sharecode=S4XAXZRX4F` |
| **PayPal Webhook** | **`https://acb7adbd80f066c9d.app.workbuddy.host/api/paypal/webhook?sharecode=S4XAXZRX4F`** |

> ⚠️ `?sharecode=S4XAXZRX4F` 是访问凭据，**必须完整保留**。
> 这个公网链接带访问控制，不带它的请求会被 403 拦截。
> 已实测：把 sharecode 放进 URL 参数后，Webhook POST 和认领 POST 均返回 HTTP 200。

---

## 二、配置 PayPal Webhook（自动续费的关键）

### 2.1 在 PayPal Developer Dashboard 创建 Webhook

1. 打开 https://developer.paypal.com/dashboard/applications
2. 进入你的 App（AGI Engine）→ **Webhooks** → **Add Webhook**
3. **Webhook URL** 填（整条复制，含 sharecode）：
   ```
   https://acb7adbd80f066c9d.app.workbuddy.host/api/paypal/webhook?sharecode=S4XAXZRX4F
   ```
4. 勾选这些事件：
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.SALE.COMPLETED`（订阅续费）
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
5. 保存后复制 **Webhook ID**。

### 2.2 把凭据填入后端 `.env`

编辑 `server/.env`（此文件已被 gitignore，不会泄露）：

```bash
ADMIN_TOKEN=你的管理员令牌
PAYPAL_MODE=sandbox                    # 先 sandbox 测通，再改 live
PAYPAL_CLIENT_ID=你的_client_id
PAYPAL_SECRET=你的_secret
PAYPAL_WEBHOOK_ID=你的_webhook_id
PAYPAL_PLAN_MONTHLY=P-你的月度计划ID
PAYPAL_PLAN_ANNUAL=P-你的年度计划ID
PAYPAL_ANNUAL_LINK=https://www.paypal.com/ncp/payment/SBJ2ZGWP7ACLQ
PAYPAL_MONTHLY_LINK=https://www.paypal.com/ncp/payment/6SAYLMHK2ZHNE
```

填好后告诉我，我**重新发布**后端让新配置生效（重新发布会保持同一个链接）。

---

## 三、当前状态与限制（诚实说明）

| 项 | 状态 |
|---|---|
| 公网后端 | ✅ 已上线，API 与 3 个页面 HTTP 200 |
| Webhook 端点可送达 | ✅ 实测带 sharecode 的 POST 返回 200 |
| PayPal 凭据 | ⚠️ 未配置（当前 `DEV_MODE_NO_WEBHOOK_ID`） |
| 付款自动激活订阅 | ⏳ 需填凭据后才生效（安全设计：未验证的付款不激活） |
| 收款本身 | ✅ 两个 PayPal 链接已可收钱（进你的账户） |
| 支付方式 | ⚠️ 当前是一次性付款链接，非自动续费订阅 |

**关于这个公网地址的持久性**：它由当前沙箱环境发布，适合验证流程与早期使用。若要作为长期生产地址，建议后续按 `RENDER_DEPLOY_GUIDE.html` 迁移到 Render 免费层（永久域名、不依赖沙箱生命周期）。

---

## 四、验证记录（可复现）

```
健康检查   → {"ok":true,"mode":"sandbox"}                    ✓
/dashboard → HTTP 200                                          ✓
/claim     → HTTP 200                                          ✓
/reconcile → HTTP 200                                          ✓
Webhook POST（带 sharecode） → {"received":true}              ✓
认领 POST（带 sharecode）    → {"ok":true,"status":"PENDING"} ✓
不带 sharecode 的请求        → HTTP 403（访问控制生效）       ✓
```

战报数据源：`server-verified-data`（来自服务端真实记录，非浏览器本地伪造）。
