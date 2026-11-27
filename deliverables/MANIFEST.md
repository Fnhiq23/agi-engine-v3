# 产物存档索引（MANIFEST）

> 本文件是 AI 专员团队本次作战产物的可追溯索引。每份产物带唯一编码，随仓库版本化存档。

| 编码 | 文件 | 字节 | 行数 | 签发专员 | 状态 |
|---|---|---:|---:|---|---|
| DEL-000 | DEL-000-创始人总纲与作战令.md | — | — | 创始人 | 已签发 |
| DEL-001 | DEL-001-增长作战地图.md | 17736 | 287 | 增长战略专员 | 已交付 |
| DEL-002 | DEL-002-全球多语言发布文案包.md | 16943 | 273 | 内容营销专员 | 已交付 |
| DEL-003 | DEL-003-可被发现性工程方案.md | 23605 | 415 | 发现与SEO专员 | 已交付·代码落地 |
| DEL-004 | DEL-004-付费转化深度优化方案.md | 20534 | 271 | 转化优化专员 | 已交付·P0落地 |
| DEL-005 | DEL-005-信任基础设施文档包.md | 23785 | 328 | 信任合规专员 | 已交付 |
| DEL-006 | DEL-006-竞争定位与定价锚定情报.md | 7934 | 103 | 竞争定位专员 | 已交付 |
| DEL-007 | DEL-007-分层开源战略.md | — | 337 | 开源战略官 | 已交付·代码落地 |
| DEL-008 | DEL-008-联盟分润系统设计.md | — | 372 | 联盟分润架构师 | 已交付·P0落地 |
| DEL-009 | DEL-009-信任页面信息架构.md | — | 590 | 信任基础设施落地官 | 已交付·代码落地 |
| DEL-010 | DEL-010-真实变现能力审计与KPI.md | — | 343 | KPI与真实变现审计官 | 已交付·看板落地 |
| DEL-011 | DEL-011-创始人第二轮执行总结.md | — | — | 创始人 | 已签发 |
| DEL-012 | DEL-012-GitHub标杆项目情报.md | — | 439 | GitHub标杆情报官 | 已交付·洞察落地 |
| DEL-013 | DEL-013-高转化官网设计蓝图.md | — | 468 | 转化心理架构师 | 已交付·官网落地 |
| DEL-014 | DEL-014-全球免费流量作战地图.md | — | 468 | 全球免费流量作战官 | 已交付 |
| DEL-015 | DEL-015-官网KPI与数据体系.md | — | 580 | 官网KPI数据官 | 已交付·埋点落地 |
| DEL-016 | DEL-016-第三轮官网落地总纲.md | — | — | 创始人 | 已签发 |

**合计**：14 位专员 + 3 份创始人总纲/总结，16 份产物。

## 编码规则
- `DEL-NNN`：Deliverable（交付物）三位序号。
- 000 保留给创始人总纲，011 为第二轮执行总结，001~010 为专员作战产物。
- 每份产物正文首行内嵌编码 + 专员名 + 作战任务，防止串档。

## 落地代码映射
- DEL-003 → `index.html` 的 `<head>`（SEO meta + JSON-LD）
- DEL-004 → `index.html` 的 `I18N` 字典（14 语言 `pw_headline` / `pw_sub` / `cta_why`）
- DEL-005 → `privacy.html` / `terms.html` / `refund.html` / `faq.html`（邮箱统一为 80306495@qq.com）
- DEL-007 → `LICENSE` / `NOTICE` / `CONTRIBUTING.md` / `.gitignore`（分层开源）
- DEL-008 → `server/server.js`（分润归因 P0：parseCustomId / recordCommission / referral APIs / claim 兜底归因）、`index.html`（refCode 透传）、`server/public/claim.html`（兜底归因）
- DEL-009 → 4 个公开信任页 + 付费墙政策链接 + README 导航
- DEL-010 → `server/server.js` 的 `/api/report`（northStar WAPS + referral 段）
- DEL-012 → 官网四个可验证信任信号（开源可审计/标准算法/公开政策/PayPal）
- DEL-013 → 根 `index.html` 官网（Hero 损失厌恶、数据流向图、定价锚定、风险逆转、FAQ、双语）
- DEL-014 → 免费流量作战弹药（供创始人本人发布）
- DEL-015 → 官网埋点（surface=site）、`/api/event` 扩展、`/api/report` 的 site 段、dashboard KPI 卡片；修复 `agi_ref_by` bug

## 第三轮入口结构
- 根 `index.html` = 官网（营销首页，转化容器）
- `app.html` = 应用本体（原 index.html，功能不变）
- 后端 `/` = 官网、`/app` = 应用、`/dashboard` = 数据看板

## 分层开源边界（第二轮决策）
- **完全公开**：`index.html`、4 个信任页、信任/SEO/KPI 文档、LICENSE/NOTICE/CONTRIBUTING/AFFILIATE
- **选择性公开**：`server.js`（脱敏审阅后）、DEL-001~004 增长情报
- **永不公开**：`server/.env`、`server/.mail.env`、`server/data/*.json`（已 gitignore，验证无泄露）

## 存档版本
- 首次建档：2026-11-27
- 第二轮（开源+分润+KPI）：2026-11-27
- 关联仓库：Fnhiq23/agi-engine-v3
