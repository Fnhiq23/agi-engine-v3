# AGI Engine — 生产环境状态（2026-11-27）

> 本文记录 PayPal 生产凭据配置结果、已创建的订阅基础设施、验证结果。
> **注意**：Secret 等敏感值只存在于 `server/.env`（已被 gitignore），本文不含任何密钥。

## ✅ 故障已修复（2026-11-27 22:07）

**问题**：21:55 复查发现 PayPal 生产 Secret 被 PayPal 端拒绝（401 invalid_client），
自动续费订阅链路一度暂停。原因是旧 Secret 在聊天中传递过，被轮换/吊销。

**修复过程**（已完成）：
1. 用户提供新 Secret → 用 `api-m.paypal.com/v1/oauth2/token` 验证真伪 → PASS（拿到 live token）
2. 写回 `server/.env` 的 `PAYPAL_SECRET`（Client ID 未变）
3. 重启本地服务实测订阅创建 → 成功创建订阅并拿到批准链接
4. 重新发布后端（链接不变）使线上生效
5. 线上复测 `POST /api/subscription/create` → 成功创建真实订阅 `I-4YK1TGSXPPCP`
   （未批准，不扣款；未批准的订阅 PayPal 会自动过期）
6. 线上健康 `mode=live`，报表数据干净（revenue 0 / subscriptions 0）

**当前状态**：自动续费订阅链路已恢复 ✅；三个收款入口全部有效（$100 年付、$15 月付、
`paypal.me/fnhiq23`，均 HTTP 200）。

**安全提醒**：新 Secret 同样通过聊天传递，请当作已暴露处理。稳定运营后建议：
在 PayPal Dashboard 再次轮换，改用 `python3 server/fix_paypal.py` 以非聊天方式更新，
或迁移到 Render 后用平台环境变量注入，彻底避免密钥进聊天记录。

- GitHub 代码已同步：最新 commit `7b97c5c7`（含 PayPal.Me、生产订阅基础设施、修复脚本、状态文档）。

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
