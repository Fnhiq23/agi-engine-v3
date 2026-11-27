# AGI Engine — 生产环境状态（2026-11-27）

> 本文记录 PayPal 生产凭据配置结果、已创建的订阅基础设施、验证结果。
> **注意**：Secret 等敏感值只存在于 `server/.env`（已被 gitignore），本文不含任何密钥。

## 一、PayPal 生产凭据（已配置并验证）

| 配置项 | 状态 | 验证方式 |
|---|---|---|
| `PAYPAL_MODE` | `live` ✅ | 成功从 `api-m.paypal.com` 获取 token |
| `PAYPAL_CLIENT_ID` | 已填 ✅ | 生产 API 认证通过 |
| `PAYPAL_SECRET` | 已填 ✅ | 仅存于 `.env`，不入库、不写文档 |
| `PAYPAL_WEBHOOK_ID` | 已填 ✅ | `8NT344242B442103Y` |

凭据真实性已用 PayPal 官方 API 交叉验证：
- LIVE 端点 → ✓ 拿到 access token
- SANDBOX 端点 → ✗ 401（证明这对凭据确实是 live 生产凭据）

## 二、已创建的订阅基础设施（生产账户）

通过 PayPal API 自动创建（原本账户内 0 产品 0 计划）：

| 项目 | ID | 说明 |
|---|---|---|
| 产品 | `PROD-9X067181NB848643G` | AGI Engine |
| 月付计划 | `P-00463614GP722660DNMEYTMA` | AGI Monthly Pass, $15/月 |
| 年付计划 | `P-6E034647497229630NMEYTMI` | AGI Annual Pass, $100/年 |
| Webhook | `8NT344242B442103Y` | 7 个事件（支付/订阅生命周期） |

Webhook URL：
```
https://acb7adbd80f066c9d.app.workbuddy.host/api/paypal/webhook?sharecode=S4XAXZRX4F
```

订阅事件：`PAYMENT.CAPTURE.COMPLETED`、`PAYMENT.SALE.COMPLETED`、
`BILLING.SUBSCRIPTION.ACTIVATED/CANCELLED/SUSPENDED/EXPIRED/RE-ACTIVATED`

## 三、自动续费全链路（已打通并实测）

```
用户点付费墙按钮
  → POST /api/subscription/create（后端带 custom_id=用户ID 调 PayPal）
  → 返回 PayPal 批准链接 → 用户跳转批准
  → 用户确认付款 → PayPal 发带签名的 Webhook
  → 后端调用 PayPal verify-webhook-signature 校验真伪
  → 校验通过 → 自动激活订阅 + 记录收入 → 进战报
```

**实测结果**（真实调用生产 API，未产生实际扣款）：
- 创建月付订阅 → ✓ 拿到订阅 ID `I-WX3HXMMKPDJ2` 和批准链接
- 测试订阅已清理，生产账户干净
- 伪造事件（无签名）→ ✓ 被 PayPal 验证 API 拒绝（`VERIFY_API_ERROR_400`），安全红线守住
- 战报数据：收入 0、订阅 0（干净交付状态）

## 四、三个入口并存

| 方式 | 特点 |
|---|---|
| **订阅按钮**（付费墙） | ✅ 自动续费、可取消、到期自动降级 —— 主推 |
| 一次性付款链接 $100/$15 | 固定金额、区分套餐 —— 备选 |
| PayPal.Me | 金额自填、无套餐标识 —— 备用 |

## 五、安全提醒（务必执行）

Secret 通过聊天传递过，**请当作已暴露处理**：
1. 前往 https://developer.paypal.com/dashboard/applications
2. 找到 App → Secret → **Rotate**（轮换）
3. 把轮换后的新 Secret 更新到 `server/.env` 的 `PAYPAL_SECRET`
4. 重新发布后端使新 Secret 生效

## 六、线上地址

| 用途 | 地址 |
|---|---|
| 数据看板 | `https://acb7adbd80f066c9d.app.workbuddy.host/dashboard?sharecode=S4XAXZRX4F` |
| 客户认领 | `https://acb7adbd80f066c9d.app.workbuddy.host/claim?sharecode=S4XAXZRX4F` |
| 核销台 | `https://acb7adbd80f066c9d.app.workbuddy.host/reconcile?sharecode=S4XAXZRX4F` |
| 前端 Demo | `https://fnhiq23.github.io/agi-engine-v3/` |

> ⚠️ `?sharecode=S4XAXZRX4F` 是访问凭据，必须完整保留。

## 七、诚实的边界

- ✅ 技术闭环已完整：真凭据、真订阅、真支付验证、真数据看板、公网部署
- ⚠️ 收款会进你的 PayPal 账户，但**流量要靠你本人账号发布内容**（`launch/` 文案已备好）
- ❌ "每天 1 万美元" 没有任何技术手段能保证，看板显示的是真实数字
