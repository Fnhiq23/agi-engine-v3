# 支付方案现状与升级路径

> 更新：2026-11-27。基于你刚创建的两个 PayPal 付款链接。

---

## 一、当前状态（已验证）

| 链接 | 名称 | 金额 | 状态 |
|---|---|---|---|
| `paypal.com/ncp/payment/SBJ2ZGWP7ACLQ` | AGI Annual Pass | $100.00 | HTTP 200 ✓ 有效 |
| `paypal.com/ncp/payment/6SAYLMHK2ZHNE` | AGI Monthly Pass | $15.00 | HTTP 200 ✓ 有效 |

代码中的链接与上述完全一致，无需改动。**钱可以正常进你的 PayPal 账户。**

---

## 二、必须知道的三个限制（PayPal 官方 FAQ）

PayPal 官方文档明确说明（https://developer.paypal.com/payment-links-buttons/faq）：

1. **支付链接不支持订阅**
   > "Do payment links support subscriptions? **No. Payment links support one-time payments only.**"
   
   即：买 $15/月的客户，下个月**不会自动扣款**，需要他自己再来点一次链接付款。

2. **支付链接无法携带 `custom_id` / `invoice_id`**
   - 后果：后端 Webhook 收到付款通知时，**不知道是哪个用户付的**。
   - 后果：无法自动把"已付款"状态绑定到某个用户的账号上。

3. **链接永不过期、不支持单次使用**
   > "Do payment links expire? No."
   
   任何人拿到链接都能付，无法做到"一人一链接"。

**结论：当前链接适合"先收钱、你手动开通权限"的早期模式，不适合自动化订阅。**

---

## 三、早期可行做法（零开发，今天就能用）

在还没有真订阅系统前，用这个流程收款：

1. 用户点链接付款 $100 或 $15 → 钱进你 PayPal。
2. 你在 PayPal 后台看到付款通知（邮件/App）。
3. 你手动把该用户的 Pro 权限开通（比如发一个兑换码，或后台标记）。
4. 到期手动提醒续费。

**这是诚实、能跑通的模式**，很多早期项目都这么起步。

---

## 四、升级到真订阅（需要开发，我来写）

要自动续费 + 自动关联用户，必须换成 PayPal 官方的 **Subscriptions API**：

```
POST /v1/billing/subscriptions
{
  "plan_id": "P-xxx",           // 先在 PayPal 创建月度/年度 Plan
  "custom_id": "user_12345",    // 关键：绑定你的用户 ID
  "subscriber": { "email_address": "..." },
  "application_context": {
    "return_url": "https://你的域名/success",
    "cancel_url": "https://你的域名/cancel"
  }
}
```

配合 Webhook 监听：
- `BILLING.SUBSCRIPTION.ACTIVATED`（订阅生效）
- `BILLING.SUBSCRIPTION.CANCELLED`（取消）
- `PAYMENT.SALE.COMPLETED`（每期扣款成功）

Webhook 事件里会带回 `custom_id`，后端就能自动知道"user_12345 付款了"，从而自动开通 Pro。

**这需要一个托管后端 + 真实域名 + PayPal 开发者凭据。** 我已经写好了 Webhook 验证框架（`server/server.js`），升级时切换事件类型和订阅逻辑即可。

---

## 五、我现在能继续做的

如果你给我 PayPal 开发者凭据（Client ID / Secret / Webhook ID），我可以：
1. 帮你创建月度/年度 Billing Plan；
2. 把前端付款按钮从"链接跳转"改成"调用 Subscriptions API"；
3. 接通 Webhook，实现付款自动开通 Pro；
4. 让数据看板显示真实的订阅与续费数据。

在那之前，当前链接就是**能收钱的最小可用方案**——这是真实的进展，不是假的。
