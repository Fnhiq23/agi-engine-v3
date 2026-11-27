# AGI Engine — Optimized Fork

> 这是 `Fnhiq23/agi-engine` 的优化分叉版本。
> 本分支的目标是：**去掉虚假宣传、修复致命 Bug、加入真实可用的加密功能**。

---

## 这个分支做了什么

### 1. 修复了导致整个应用无法运行的致命 Bug（P0）
原版 `sendChat()` 函数缺少一个闭合花括号 `}`，导致**主 JavaScript 脚本语法错误，所有按钮和交互全部失效**。
本分支已修复。现在应用可以正常运行。

### 2. 删除了不实宣传（合规）
原版声称但**代码中完全没有实现**的功能，已全部改为真实描述：

| 原版宣传 | 实际情况 | 本分支处理 |
|---|---|---|
| "On-chain Persistence" 链上存储 | 数据只存在浏览器 localStorage | 改为 "Local AES-256 Encryption" |
| "immutable, decentralized" 区块链 | 无任何区块链代码 | 改为 "encrypted on this device" |
| 显示 Polygon 钱包地址、"smart contract coming" | 无合约、无链上收入 | 移除地址，明确标注无合约 |
| "encrypted: true" | 只是个标签，内容是明文 | 见下方真实加密实现 |

### 3. 加入了真实加密（Web Crypto API）
新增 `SecureVault` 模块，使用浏览器原生加密：
- **AES-256-GCM** 对称加密
- **PBKDF2** 密钥派生（210,000 次迭代 + 随机盐）
- 用户口令**永不存储、永不上传**
- 设置页新增 "Privacy Vault" 界面，可设置口令并加密记忆
- 口令丢失则数据无法恢复（这是加密的正常特性）

### 4. 记忆工具（新增真实价值）
记忆页新增：**全文搜索**、**导出为 JSON**、**导出为加密备份**、**从备份导入**、**单条删除**。
加密备份使用 `SecureVault`，导入时用口令解密——数据真正可携带、可迁移。

### 5. 其他清理
- 修复了重复的 `tab-settings` section（HTML 中重复 id 是无效的）
- 移除了指向不存在文件的失效外链 script
- 明确标注演示聊天是脚本模拟回复，真实 AI 需用户自己的 API Key

---

## 验证结果（可复现）

| 检查项 | 结果 |
|---|---|
| 4 个 JS 脚本块语法校验（node --check） | 全部 PASS |
| 无头浏览器实际渲染 | PASS，界面正常，日志 "AGI Engine v3.0 initialized" |
| AES-256-GCM 加密往返（Node Web Crypto） | PASS |
| 密文不含明文 / 错误口令被拒绝 | PASS / PASS |
| "on-chain" 虚假宣传残留 | 0 |
| 失效的 Polygon 钱包地址残留 | 0 |

---

## 后端与真实数据（本轮新增）

`server/` 下是一个**零依赖** Node.js 后端（只用内置模块）：

- `POST /api/event` — 服务端埋点（漏斗事件）
- `GET /api/report` — 真实汇总战报（漏斗/转化/收入/渠道/7日趋势）
- `GET /api/stats` — 公开统计
- `POST /api/paypal/webhook` — **PayPal 签名验证**（调用官方 verify-webhook-signature API，只有验证通过才激活订阅）
- `GET /api/subscribe/:id` — 查询订阅状态
- `GET /dashboard` — 真实数据可视化看板

**安全设计**：未配置 Webhook ID 或签名验证失败时，付款请求会被记录但**拒绝激活订阅**——没人能靠伪造前端跳转冒充付款。数据存 `server/data/db.json`（原子写入，可升级 SQLite）。

配置：复制 `server/.env.example`，填入 PayPal 凭据后启动。

## 发布素材（本轮新增）

`launch/` 下有 Show HN、Product Hunt、Twitter/X、中文社区的发布文案，以及发布前清单和红线提醒。

## 支付方案

见 `PAYMENT_UPGRADE.md` —— 当前两个 PayPal 链接的验证结果、能力边界（官方 FAQ：支付链接只支持一次性付款、无 custom_id）、以及升级到真订阅的 API 路径。

## 手动对账闭环（本轮新增，可立即收款）

见 `MANUAL_OPS.md` —— 在现有免代码付款链接下，如何真实完成「付款 → 核对到账 → 开通 Pro → 进战报」：

- **`/claim`**：客户付款后提交邮箱 + 交易号（前端付费墙已接入口）
- **`/reconcile`**：你在 PayPal 后台确认到账后，凭 ADMIN_TOKEN 一键批准（自动激活订阅、记真实收入）
- **安全**：交易号去重、无令牌拒绝、重复批准防护、未验证付款不激活

这是当前链接下的合法起步方式；升级真订阅见 `PAYMENT_UPGRADE.md`。

## 完整路线图与判断

见 `FOUNDER_PLAN.md` —— 第一性原理拆解、竞品现实、三块必补项、现实收入预期。

---

## 重要事实（继续诚实说明）

- **没有 AI 模型**：用户自带 LLM Key，应用本身不含模型。
- **"每天 1 万美元" 无法通过任何技术手段保证。** 任何这样承诺的人都在误导你。
- **发布与收款必须你本人操作**（你的账号、你的 PayPal），AI 不能冒充你的身份。

---

## 如何运行

### 前端（个人使用）
```bash
cd /workspace/agi-engine-optimized
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000（HTTPS/localhost 才能用 Web Crypto）
```

### 后端 + 数据看板
```bash
cd server
node server.js                    # 默认 http://localhost:3000
# 打开 http://localhost:3000/dashboard 看真实数据看板
# 配置 PayPal：先 cp .env.example .env 并填写，然后设置环境变量启动
```
