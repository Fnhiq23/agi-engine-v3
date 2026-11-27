# 为 AGI Engine 做贡献

感谢你考虑贡献。AGI Engine 是隐私优先、本地优先的单文件 PWA 个人 AI 助手。
我们欢迎能提升**隐私、安全、可访问性、翻译质量、真实可用性**的贡献。

## 行为准则

- 尊重他人，就事论事。
- 不提交恶意代码、后门、追踪脚本或会泄露用户数据的改动。
- 任何涉及加密算法、数据存储、网络请求的改动都必须保持"本地优先"原则，并在 PR 中说明数据流。

## 仓库结构与"公开 / 私有"边界

| 文件 | 状态 | 说明 |
|---|---|---|
| `index.html` | 完全公开 | 单文件前端应用，MIT 许可 |
| `privacy.html` / `terms.html` / `refund.html` / `faq.html` | 完全公开 | 信任文档 |
| `server/public/*.html` | 完全公开 | 后端托管的页面 |
| `server/server.js` | 公开（建议脱敏审阅后） | 零依赖 Node 后端 |
| `deliverables/DEL-005~010` | 公开 | 信任/SEO/KPI 文档 |
| `deliverables/DEL-001~004` | 选择性公开 | 增长/转化作战情报，贡献者可见 |
| `server/.env` / `server/.mail.env` | **永不公开** | PayPal 凭据、邮箱授权码（已 gitignore） |
| `server/data/*.json` | **永不公开** | 运行数据（已 gitignore） |

> 请勿在 issue、PR、讨论区粘贴任何密钥、token、授权码或真实用户数据。

## 本地运行

```bash
git clone https://github.com/Fnhiq23/agi-engine-v3.git
cd agi-engine-v3

# 方式 A：纯前端（无后端也能用）
# 直接用浏览器打开 index.html，或起一个静态服务：
python3 -m http.server 8899
# 打开 http://localhost:8899

# 方式 B：带后端
node server/server.js
# 打开 http://localhost:3000
# 后端为零依赖 Node.js（仅用内置模块），无需 npm install
```

前端如需连接后端，设置 `window.AGI_BACKEND_BASE`（例如内嵌一段脚本指向 `http://localhost:3000`）；
不设置则退化为纯静态一次性支付链接，核心功能不受影响。

## 最有价值的贡献方向

1. **翻译**：`index.html` 内的 `I18N` 字典（14 种语言）。补齐遗漏文案、修正措辞，保持中英对照。
2. **安全审计**：审阅 `SecureVault`（AES-256-GCM/PBKDF2）实现、找到隐私隐患。这类贡献优先级最高。
3. **可访问性**：键盘导航、ARIA 标签、对比度、移动端布局。
4. **埋点与看板**：`server/server.js` 的 `/api/report` 与 `server/public/dashboard.html`，让真实数据更可信。
5. **文档**：`deliverables/` 下的信任/增长/转化文档，欢迎翻译与本地化。

## 提交 PR 的流程

1. Fork 仓库，创建分支：`git checkout -b feat/your-change`。
2. 改动保持**最小、单一目的**。前端改动请用浏览器实测并附截图。
3. 涉及 JS 的改动，确保内联脚本通过 `node --check`（可用脚本抽取后检查）。
4. 提交信息用祈使句，如 `fix: correct German translation in paywall`。
5. 开 PR，说明：改了什么、为什么、如何验证、是否影响数据流/隐私。
6. PR 合并后，贡献者自动进入分润体系的候选名单（见 `AFFILIATE.md`）。

## 报告安全问题

请不要在公开 issue 报告安全漏洞。send 到：**80306495@qq.com**，标题注明 `[SECURITY]`。
我们会在确认后尽快响应。

## 许可

贡献即表示你同意以 MIT 许可授权你的改动。商标与官方渠道声明见 `NOTICE`。
