> 产物编码：DEL-012 | 专员：GitHub标杆情报官 | KPI：基于5+真实项目访问的可迁移洞察

# AGI Engine · GitHub 标杆项目增长与转化情报

## 0. 情报来源与方法声明

本次情报全部基于 WebFetch 对下列 URL 的**实际访问**，共覆盖 **6 个 GitHub 仓库 + 4 个官网首页**。凡标注「原文」的短句均为访问所得页面的原样引用，仅作为证据出处；提炼出的规律与建议文案为原创，不照搬任何项目的成段文案。

| # | 项目 | 实际访问的 URL | 抓取结果 |
|---|---|---|---|
| 1 | open-webui/open-webui | `https://github.com/open-webui/open-webui` | README 正文完整获取 |
| 2 | Mintplex-Labs/anything-llm | `https://github.com/Mintplex-Labs/anything-llm` | README 正文完整获取 + 仓库指标 |
| 3 | mudler/LocalAI | `https://github.com/mudler/LocalAI`、`https://raw.githubusercontent.com/mudler/LocalAI/master/README.md` | 首屏 + 徽章原文 |
| 4 | supabase/supabase | `https://github.com/supabase/supabase` | README 正文完整获取 |
| 5 | calcom/cal.com | `https://github.com/calcom/cal.com`（重定向至 `calcom/cal.diy`） | fork 说明获取 |
| 6 | langgenius/dify | `https://raw.githubusercontent.com/langgenius/dify/main/README.md` | README 正文完整获取 |

补充访问的官网首页（用于分析 landing page 结构与社会证明）：

| # | 官网 | URL | 用途 |
|---|---|---|---|
| A | Cal.com | `https://cal.com` | 完整 landing page 结构、客户 logo、testimonial |
| B | Supabase | `https://supabase.com` | 完整 landing page 结构、案例、CTA |
| C | AnythingLLM | `https://anythingllm.com` | 数据徽章、三步上手、博客 |
| D | LocalAI | `https://localai.io/` | 安装引导、产品参数、功能分区 |

**访问异常说明**：`calcom/cal.com` 的 GitHub 页面重定向到社区 fork `calcom/cal.diy`，因此其 GitHub 侧数据以 fork 页面为准；Cal.com 的官网 `cal.com` 独立访问成功，landing page 数据完整。Dify 的 GitHub 仓库首页只返回文件树，改用 raw README 后拿到完整正文。LocalAI 仓库首页正文被截断，改用 raw README + 官网补齐。

---

## 1. 逐项目六维拆解

### 1.1 Open WebUI（open-webui/open-webui）

**① README 第一屏如何讲价值**

- 仓库描述原文：`User-friendly AI Interface (Supports Ollama, OpenAI API, ...)` —— 用「友好 + 兼容」两个词完成定位，括号里立刻给出兼容对象，让技术用户 3 秒判断能不能接自己的模型。
- 正文首句原文：`Open WebUI is a home for AI: an extensible, easy-to-use, self-hosted platform built to run entirely offline.` —— 用一个具象隐喻（a home for AI）承载四个形容词，且把「完全离线」放在句尾压轴。
- 第二句原文：`Connect local models through Ollama, use OpenAI-compatible APIs for local and cloud models, or add agents through Agent Client Protocol (ACP).` —— 用三个并列动词给出清晰接入路径。

**② 官网 / landing page 结构**

- 未发现独立营销域名，所有入口收敛到 `docs.openwebui.com`，形成「文档即首页」的结构。
- 首屏 CTA `Explore Open WebUI →` 直接指向文档 Quick Start，中间没有营销页阻隔。
- 结构：价值主张 → 安装（Python / Docker 双路径，命令可直接复制）→ Docker 镜像标签表（main / slim / cuda / ollama / dev）→ 生态三件套（Open Terminal、Knowledge Base Sync、Open WebUI Computer）→ 社区入口。

**③ 社会证明怎么展示**

- 仓库显示 `21,286 Commits`（提交数作为活跃度证明）。
- `Star History` 区块链接到 star-history.com 图表，用「增长曲线」而非静态数字证明势头。
- 署名原文：`Created by Timothy Jaeryang Baek.` —— 以真人署名建立个人可信度。
- 仓库内有 `banner.png` 视觉资产；**未见**用户 logo 墙、客户 quote 或 star 数字徽章。

**④ CTA 设计**

- 主 CTA：`Explore Open WebUI →`（探索，而非「立即注册」）。
- 安装型 CTA：`pip install open-webui`、`docker run ...` 命令块本身即转化动作。
- 下载型 CTA：`Download the native desktop app`（指向 `open-webui/desktop` 仓库）。
- 参与型 CTA：`Open an issue`、`start a discussion`、`GitHub security advisories`。
- 关键特征：**CTA 动词都是低承诺的「探索 / 阅读 / 安装」**，没有强制账号门槛。

**⑤ 定价 / 开源策略**

- 未见公开价格或套餐。
- License 原文：`Includes code under the Open WebUI License, which requires preserving the Open WebUI branding, and prior contributions under their original licenses.` —— 采用自定义许可证并要求保留品牌，属于「源代码可见 + 品牌资产保护」的中间路线。
- 生态中出现 `Terminals (Enterprise)` 与 `enterprise orchestration for per-user workspaces`，但未给出定价，属于商业化的伏笔而非明码标价。

**⑥ 社区运营手段**

- GitHub Discussions + Issues 双通道，Security 单独走 advisory。
- Roadmap 文档公开（`docs.openwebui.com/roadmap/`），把路线图变成社区参与入口。
- 多语言 README（含多语种版本）降低非英语用户参与门槛。

**→ 可迁移到 AGI Engine 的动作**

1. 把「完全离线 / 隐私优先」从卖点列表里提出来放到**价值主张句尾压轴**，因为 AGI Engine 的本地 AES-256 加密记忆是比 Open WebUI 更强的差异化锚点。
2. 官网 CTA 首动词用「免费下载 / 立即体验」而非「注册」，AGI Engine 单文件 PWA 的零安装属性可直接承接这个低承诺 CTA。
3. 公开一份 Roadmap 页面，让「技术已闭环、流量为 0」的现状转化为「早期共建」的叙事资产。

---

### 1.2 AnythingLLM（Mintplex-Labs/anything-llm）

**① README 第一屏如何讲价值**

- 仓库标语原文：`Stop renting your intelligence. Own it with AnythingLLM. Everything you need for a powerful local-first agent experience` —— 用「停止租用 vs 拥有」制造对立，把竞争对象从同类产品提升到「云端 AI 的租用模式」。
- 正文首句原文：`AnythingLLM: The all-in-one AI app you were looking for.` —— 用「你一直在找的」消除用户的选择焦虑。
- 第二句原文：`Chat with your docs, use AI Agents, hyper-configurable, multi-user, & no frustrating setup required.` —— 用「无令人沮丧的配置」直接击中竞品痛点。
- `Product Overview` 章节原文：`...lets you build a private, fully-featured ChatGPT—without compromises.` —— 借用用户心智中的品类名词 ChatGPT 做锚定，再加「不打折扣」。

**② 官网 / landing page 结构**（来源：`https://anythingllm.com`）

- Hero 原文：`Own your intelligence.` + `A private AI assistant that runs entirely on your computer. No accounts, no API keys, no token limits.`
- **数据徽章带**（首屏最醒目的社会证明）：`77M+ Desktop Downloads`、`223355B+ Tokens processed locally`、`$8.7M+ Saved by users vs. cloud APIs`、`5M+ Docker pulls`。其中「用户相对云端 API 节省的钱」是极聪明的转化锚点——把隐私价值翻译成可量化的经济价值。
- `No complex setup.` → `Preconfigured for productivity.` 功能卡 → `Every call becomes context.` 会议助手 → `Intelligence at your mouse pointer.` → 四步上手（`Download the app` / `Pick a model` / `You're ready to go` / `Scale to infinity`）→ 移动端 → 博客列表。
- 四步上手的第 1 步原文：`One file. No dependencies. Works on macOS, Windows, and Linux.` —— 「一个文件」与 AGI Engine 的单文件 PWA 形态高度同构。

**③ 社会证明怎么展示**

- GitHub 指标：`68.7k stars`、`410 watching`、`7.8k forks`、`132 Branches`、`40 Tags`、`2,769 Commits`。
- 首屏徽章：Trendshift（`trendshift.io/repositories/2415`）、GitHub Discussions、Reddit `r/anythingllm`、MIT license。
- 官网用「下载量 / 本地处理 token 数 / 为用户省钱 / Docker 拉取数」四组数字构成证据矩阵，比单纯 star 数更贴近用户收益。
- 博客以具体日期和版本号发布（`October 2026`、`v1.17.0`），用持续交付证明项目存活。

**④ CTA 设计**

- 首屏 `Docs`、`Hosted Instance`（指向 checkout 页）、`👉 AnythingLLM for desktop ... Download Now`、`Watch the video`、多语言 README（含 `简体中文`）。
- 自托管 CTA 矩阵列出 Docker / AWS / GCP / DigitalOcean / Render / Railway / RepoCloud / Elestio / Northflank / Sealos / Easypanel 共 11 种部署路径——**用「选择丰富」降低「怕装不上」的心理门槛**。
- 官网 CTA：`Learn more`、`See AnythingLLM Mobile`、`Read more`（博客）。

**⑤ 定价 / 开源策略**

- MIT License（README badge + GitHub 资源区双重展示）。
- 商业模式：开源核心自托管 + `Hosted Instance` 托管付费入口 + 官网 `Magic Echo` 等标注为 Pro 的功能（链接含 `/pro/magic-echo`）。
- 隐私策略透明化：专门章节 `Telemetry & Privacy`，原文给出 `Set DISABLE_TELEMETRY ... to "true" to opt out of telemetry.` —— 把可关闭的遥测写成明确开关，而不是含糊承诺。

**⑥ 社区运营手段**

- Discord / GitHub Discussions / Reddit `r/anythingllm` / Contributing / Security policy / Activity / Sponsors / Contributors / Star History 九类入口。
- `More Products` 区块导流 AnythingLLM Mobile、Browser Extension、Embed、Open Computer，形成产品矩阵互相输血。

**→ 可迁移到 AGI Engine 的动作**

1. 采用「对立叙事」：AGI Engine 的竞争对象应定义为「把记忆交给云端的 AI 租用模式」，而不是其他 PWA。官网主标可围绕「你的记忆不该存放在别人的服务器」构造（原创表达，非照搬）。
2. 建立属于 AGI Engine 的**收益量化带**：在收入为 0 的现实下不可编造下载量，但可展示可验证的硬指标——`AES-256`、`14 种语言`、`单文件 <X MB`、`零服务器依赖`，用「技术确定性」替代「规模数字」。
3. 复用「一个文件、无依赖」的上手叙事：AGI Engine 是单文件 PWA，可把「下载一个 HTML / 添加到主屏幕」做成 3 步引导，直接对标其第 1 步。
4. 写一篇 `遥测与隐私` 页面，明确声明「无任何遥测」并给出可验证方式；这比 AnythingLLM 的「可关闭遥测」更进一步，是隐私定位的超越点。

---

### 1.3 LocalAI（mudler/LocalAI）

**① README 第一屏如何讲价值**

- 仓库描述原文：`LocalAI is the open-source AI engine. Run any model - LLMs, vision, voice, image, video - on any hardware. No GPU required.` —— 「any model + any hardware + No GPU required」三重消除门槛，把「我能不能用」的疑虑一次性打掉。
- Hero 图替代文字：图片 alt 原文 `LocalAI: your own AI, on your own hardware. Agents, documents and every kind of model, for you and your team. The LocalAI llama mascot wears sunglasses.` —— 用吉祥物（戴墨镜的羊驼）做情感记忆点。
- README 正文首句：`LocalAI runs open models for chat, images, speech and video on your own machines. The API speaks the OpenAI and Anthropic formats.`

**② 官网 / landing page 结构**（来源：`https://localai.io/`）

- Hero 原文：`Your own AI, on your own hardware.` 紧接 `Open source under the MIT licence. 50,000+ stars on GitHub.`
- 安装区首屏即给出 `curl -sSL https://localai.io/install.sh | sh`，并按 Windows / macOS / Linux x86-64 / Linux ARM64 列出桌面安装包，末尾标注 `Android and iPhone: coming soon.`（用「即将到来」制造期待与订阅理由）。
- **产品参数四宫格**：`CPU or GPU (NVIDIA, AMD, Intel and Apple)`、`18 engines we wrote (C++ and GGML, with no Python at inference)`、`OpenAI-compatible (Also Anthropic and ElevenLabs formats)`、`MIT licence (Open since March 2023, 50,507 stars)` —— 把技术参数做成社会证明。
- 功能分区采用「小标题 + 一句话价值 + 截图 + `See X →` 链接」的统一节奏：One API / Every kind of model / Workspace / Team / Projects / Models and hardware / Everything new / Get started。
- 章节标题原文 `Change the base URL. Keep your client.` —— 用「只改一行配置」表达兼容性成本之低。

**③ 社会证明怎么展示**

- GitHub 页面 `50.6k stars`；官网反复出现 `50,000+ stars on GitHub` 与 `50,507 stars`。
- README 三个 badge：`Latest release`、`MIT license`、`Join the LocalAI Discord`（Discord badge 用 dynamic json 实时显示成员数，数字会自动更新）。
- **狗粮式证明**：官网原文 `42 seconds. We made this film with LocalAI: the pictures, the voices and the music.` —— 用产品自己生成的影片作为能力证明，比任何 testimonial 都硬。
- `Open since March 2023` 用时间长度证明持续性。

**④ CTA 设计**

- 主 CTA：`curl ... | sh` 一行命令；次 CTA：四平台桌面下载按钮。
- 分场景 CTA：`Try the API →`、`API docs →`、`See every modality →`、`Get started`、`All downloads`。
- FAQ / Blog / Documentation 组成自助路径，减少人工支持依赖。

**⑤ 定价 / 开源策略**

- MIT License，官网明写 `Open source under the MIT licence.`
- `Office and Sandbox are add-ons. An admin installs them once.` —— 采用「核心 MIT + 可选插件」的分层，付费伏笔在插件层。
- 未见具体价格数字。

**⑥ 社区运营手段**

- Discord（带动态成员数 badge）、FAQ、Blog、文档站四位一体。
- 顶部导航条原文：`Documentation | Quick start | Discord | FAQ | Blog` —— 把社区入口放在 README 第一屏，而非页尾。
- 每个功能分区都配 `Docs →` 链接，把文档流量分摊到具体功能页。

**→ 可迁移到 AGI Engine 的动作**

1. 学「狗粮式证明」：AGI Engine 可用自己生成的加密记忆演示、或一段 30 秒「本地断网运行」录屏作为首屏证据，直接证明「不联网也能用」，无需第三方背书。
2. 学「参数即证明」：把 `AES-256`、`单文件`、`14 语言`、`零服务器` 做成四宫格数字卡，与 LocalAI 的 `18 engines` 四宫格同构。
3. 学「coming soon 预告」：AGI Engine 可在官网列出即将支持的平台或语言，给早期访客一个留下联系方式的理由——但必须与真实路线图一致，不可虚构。
4. 学 Discord badge 动态数字思路：若 AGI Engine 初期无社区，改为展示「实时计数器：本机加密记忆条数」这类用户本地数据，把社会证明转为个人化证明。

---

### 1.4 Supabase（supabase/supabase）

**① README 第一屏如何讲价值**

- 仓库描述原文：`The Postgres development platform. Supabase gives you a dedicated Postgres database to build your web, mobile, and AI applications.`
- README 正文首句原文：`Supabase is the Postgres development platform. We're building the features of Firebase using enterprise-grade open source tools.` —— 用 Firebase 做心智锚点，再用「企业级开源工具」做差异化。
- 首屏用**清单体**罗列能力：Hosted Postgres Database / Authentication and Authorization / Auto-generated APIs（REST、GraphQL、Realtime）/ Functions / File Storage / AI + Vector Toolkit / Dashboard，每项带 Docs 链接。清单体让用户在 10 秒内完成「有没有我要的功能」的自检。

**② 官网 / landing page 结构**（来源：`https://supabase.com`）

- Hero 原文：`Build in a weekend. Scale to millions.` —— 对仗式短句，同时击中「上手快」与「能长大」两个焦虑。
- 副标题原文：`Start your project with a Postgres database. Add Authentication, Data APIs, Edge Functions, Realtime Data, Storage, and Vector embeddings.`
- 产品模块卡片区：Postgres Database / Authentication / Edge Functions / Storage / Realtime / Vector / Data APIs，每张卡一句话价值 + `100% portable`、`Built-in Auth with RLS` 等小标签。
- 统一句原文：`Use one or all. Best of breed products. Integrated as a platform.`
- **首页直接嵌入 React 代码块**（`createClient` 示例）——开发者产品把「代码即演示」放在首屏，比截图更有说服力。
- 模板区：`Kickstart your next project with production ready templates`，列出 Stripe Subscriptions Starter / Next.js Starter / AI Chatbot / LangChain + Next.js Starter 等。
- 案例区：`How industry leaders are building with Supabase` → Lovable 案例（头像 + 职位 + 引述 + `Read the story →`）。
- 价值观区原文：`Open source from day one ... You're never locked in, and always in control.`
- 结尾 CTA 重复 slogan：`Build in a weekend, scale to millions` + `Start your project` / `Request a demo`。

**③ 社会证明怎么展示**

- `Trusted by fast-growing companies worldwide` 客户 logo 带。
- 客户故事卡：Lovable 原文引述 `Powering millions of AI-generated apps with a complete Supabase backend.` + 真人姓名职位（Bryan Byrne, Product Manager, Lovable）+ 头像 + `Read the story →`。
- **「Made with Supabase」徽章**：README 的 `Badges` 章节提供 SVG 徽章源码（含深色版），鼓励用户在自己的项目里挂上徽章——这是把用户变成分发渠道的增长设计。
- `Community Forum / GitHub Issues / Email Support / Discord` 每项标注 `Best for: ...`，用场景化说明降低求助成本。

**④ CTA 设计**

- 主 CTA：`Start your project`（指向 dashboard sign-up）、`Request a demo`。
- 文档型 CTA：每个功能点后紧跟 `Docs` 链接；`Read docs for React`、`View all examples`、`More customer stories`、`View on GitHub`。
- 社区型 CTA：`Join us on Discord`。

**⑤ 定价 / 开源策略**

- 官网未见具体价格数字（README 亦无），但存在 `Request a demo` 与 `contact/sales`，指向企业销售路径。
- 开源理念原文：`Supabase is built in the open because we believe great developer tools should be transparent, inspectable, and owned by the community. Read, contribute, self-host.` —— 把「透明、可审查、不锁定」升级为品牌价值观。
- Client libraries 分 `⚡️ Official`（JS / Flutter / Swift / Python）与 `💚 Community`（C# / Go / Java / Kotlin / Ruby / Rust / Godot 等），用社区贡献补齐长尾语言。

**⑥ 社区运营手段**

- 40+ 语言 README 翻译（含简体中文、繁体中文），是本次访问中语言覆盖最广的项目。
- 贡献文档 `DEVELOPERS.md`、Community Forum、Discord、Email Support 四层支持体系。
- `Watch "releases" of this repo to get notified of major updates.` —— 把 GitHub Watch 变成更新订阅机制。

**→ 可迁移到 AGI Engine 的动作**

1. 学「对仗式 slogan」：AGI Engine 可设计类似「一次下载，终身私有」的双段式短句，同时表达低门槛与长期价值（原创表达）。
2. 学「首屏代码即演示」：AGI Engine 可在首屏放一段 3 行示例——填入自带 API Key、写入一条加密记忆、断网读取成功——用可复现步骤替代抽象承诺。
3. 学「Made with」徽章裂变：为 AGI Engine 设计一个 `Powered by AGI Engine / 本地加密` 小徽章，鼓励用户在博客或 README 中展示，把每个用户变成分发节点。初期没有用户时，先在自己的 14 语言版本中展示作为示范。
4. 学 40+ 语言 README 的本地化策略：AGI Engine 已有 14 语言，应把「14 语言原生支持」直接做成首屏数字徽章，这是相对 Supabase 的差异化——它靠社区翻译，AGI Engine 是产品内置。

---

### 1.5 Cal.com（calcom/cal.com → calcom/cal.diy）

**① README 第一屏如何讲价值**

- GitHub 重定向后的 `cal.diy` 页面描述原文：`Scheduling infrastructure for absolutely everyone.` —— 「absolutely everyone」把目标用户扩张到极限。
- fork 定位原文：`Cal.diy is the community-driven, fully open-source scheduling platform — a fork of Cal.com with all enterprise/commercial code removed.`
- 差异点清单原文：`No enterprise features`、`No license key required`、`100% open source`、`Community-maintained` —— 用「移除什么」来定义自己，是极清晰的反向定位。

**② 官网 / landing page 结构**（来源：`https://cal.com`）

- Hero 原文：`Where people find the time to meet` + `Making time for millions of people every month.`
- 客户 logo 带原文：`The fastest-growing companies use Cal.com for scheduling`，紧接 Deel / Retell AI / Storyblok / AngelList / Collective 五个可点击 case study logo。
- **问题-方案叙事**：标题原文 `Finding a time took a week of emails. Now it's one link.` 下方三步：① `Stop chasing a time over email` ② `Send one link with your free hours` ③ `Let them pick the time`。配一整段模拟邮件线程（多名虚构角色跨时区来回确认），把痛点演成可视化场景。
- 量化收益原文：`Deel spends 35% less time scheduling across support, sales and ops, and gets back more than 6,000 hours a week.`
- 功能矩阵标题原文：`One calendar for every way people meet.`，下辖 Booking pages / Routing / Round robin / Workflows / Embeds and API v2 / Cal Video。
- 集成区原文：`All your key tools in sync with your meetings.` + `Connects to Slack, Salesforce, and 100+ more.`，下方 12 个应用 logo 每个配一句功能说明。
- AI 区原文：`Give your agents a calendar.` 展示 MCP 接入与真实对话示例。
- 案例区原文：`Trusted by teams that meet at scale.` + Deel 卡片三项量化指标：`From $500M to $1.5B+ ARR`、`From 12s to <2s page loads`、`6,000+ hours saved per week`。
- FAQ 区标题原文：`The short ones are here. For anything else, ask below.`
- 结尾 CTA 区原文：`Scheduling for absolutely everyone.` + `Free for individuals, no credit card, no usage limits.`，按钮 `Get started for free` / `or talk to sales`。

**③ 社会证明怎么展示**

- 客户 logo + case study 链接（5 个）；案例卡片带可量化业务指标。
- 第三方评分徽章：`4.5 Trustpilot`、`4.8 Product Hunt`、`4.5 G2`（页尾）。
- **大量真实来源 quote**：每条 testimonial 带头像 + 姓名 + 来源链接，来源分布在 Trustpilot、Product Hunt、X。例如 Aria Minaei（CEO, Theatre.JS）的 `Just gave it a go and it's definitely the easiest meeting I've ever scheduled!`；Kent C. Dodds 的迁移评价（带 X 链接）。
- 多条 quote 明确对比竞品（Calendly），用「用户主动说比竞品好」形成替代论证。

**④ CTA 设计**

- 主 CTA：`Get started for free`（个人）/ `or talk to sales`（企业）双轨分流。
- 中段 CTA：`Try Cal.ai`、`Get Cal Desktop`、`Explore apps`、`Read the API docs`、`Book a demo`、`Host an event`。
- 每个客户故事卡都有 `Read the story`，每个 testimonial 都有外部来源链接——**把社会证明本身做成可点击的转化入口**。

**⑤ 定价 / 开源策略**

- 结尾明写 `Free for individuals, no credit card, no usage limits.` —— 用「免信用卡 + 无限量」消除试用顾虑。
- GitHub 侧出现 `cal.diy` 社区 fork：100% MIT、移除所有企业/商业代码、无需 license key，形成「官方 Open Core + 社区纯 MIT fork」的双轨生态。
- 企业版页面列出 SAML SSO、SCIM、Audit log、`Pay only for active members`，并以 `Encrypted in transit and at rest` + 合规链接建立信任。

**⑥ 社区运营手段**

- `Discover` 产品区：`Open time on your calendar? Discover shows it to people nearby.` —— 把用户闲置时间变成公开供给，形成双边网络效应。
- `App store` 生态：100+ 集成 + 每个应用的功能说明，构建护城河。
- 客户故事库 `/customers`、case study 页、Trustpilot / Product Hunt / G2 多平台评分运营。

**→ 可迁移到 AGI Engine 的动作**

1. 学「痛点场景化」：AGI Engine 首屏可用一段「换设备 / 清缓存后记忆全丢 + 云端 AI 记住了你的隐私」的对比场景图，把抽象的隐私风险演成具体损失，对标 Cal.com 的邮件线程演示。
2. 学「双轨 CTA 分流」：AGI Engine 用 `免费下载 PWA`（个人）与 `了解 Pro`（$100/年、$15/月）两条路径，避免单一 CTA 同时服务两类用户。
3. 学「评分徽章 + 来源链接」结构：但 AGI Engine 初期无第三方评分，改为展示可验证的技术合规信息（如 AES-256 算法说明页链接、隐私政策链接），用「可点击的证据」替代「不可点击的声明」。
4. 学「把社会证明做成入口」：每一条证据（加密说明、开源协议、多语言列表）都应可点击跳转到详情页，形成证据链而非静态装饰。

---

### 1.6 Dify（langgenius/dify）

**① README 第一屏如何讲价值**

- 仓库描述原文：`Build Agentic workflows, RAG pipelines, with rich AI model and tool support on one collaborative workspace. Deploy on cloud, VPC, or self-hosted, so teams move from prototype to production without rebuilding the stack.`
- README 正文首句原文：`Dify is an open-source LLM app development platform. Its intuitive interface combines AI workflow, RAG pipeline, agent capabilities, model management, observability features ... and more, letting you quickly go from prototype to production.`
- 价值表达的结构是「能力清单 + 部署自由 + 终局承诺」三段式：先说能做什么，再说能部署在哪，最后说能走到哪（prototype → production）。

**② 官网 / landing page 结构**

- README 顶部即四条导航原文：`Dify Cloud` · `Self-hosting` · `Documentation` · `Dify edition overview` —— 把「云 / 自托管 / 文档 / 版本对比」四个决策入口放在最上方。
- 官网主入口 `cloud.dify.ai`；定价页 `dify.ai/pricing`；企业页 `dify.ai/dify-enterprise`。
- `Using Dify` 章节三分：Cloud / Self-hosting Community Edition / Dify Enterprise，每类给出明确动作（前者见 pricing，中者见 starter guide，后者填表联系销售）。
- `Staying ahead` 章节原文：`Star Dify on GitHub and be instantly notified of new releases.` 配 star 操作截图——把 GitHub Star 变成「订阅更新」的行为号召。

**③ 社会证明怎么展示**

- **徽章矩阵（本次访问中最密集）**：`Product`、`free pricing`、`Discord`、`Reddit r/difyai`、`X(Twitter) follow`、`LinkedIn`、`Docker Pulls`、`Commits last month`、`Issues closed`、`Discussion posts`、`LFX Health Score`、`LFX Contributors`、`LFX Active Contributors`。注意后三项来自 Linux Foundation Insights，属于**第三方背书**。
- `Contributors` 区使用 `contrib.rocks/image?repo=langgenius/dify` 动态生成贡献者头像墙。
- `Star History` 图表（支持明暗双主题）。
- 17 种语言 README，含 `Klingon`（克林贡语）—— 用极端细节制造社区话题性。

**④ CTA 设计**

- 导航型 CTA：`Dify Cloud`、`Self-hosting`、`Documentation`、`Dify edition overview`。
- 参与型 CTA：`good first issues`（贡献代码）、`Start or join a GitHub Discussion`（想法反馈）、`internationalization guide`（翻译）、`Share the apps you build`（社区传播）。
- 企业型 CTA：`fill out this form to speak to a solution representative`。
- Star 型 CTA：`Star Dify on GitHub and be instantly notified of new releases.`

**⑤ 定价 / 开源策略**

- 三层结构：Dify Cloud（免费版存在，徽章 `free pricing`）/ Self-hosting Community Edition / Dify Enterprise（SSO、RBAC、SLA）。
- License 原文：`This repository is licensed under the Dify Open Source License, based on Apache 2.0 with additional conditions.` —— 「开源基座 + 附加条件」的改良型许可。
- `free pricing?logo=free` badge 直接把「有免费版」写在首屏。

**⑥ 社区运营手段**

- 贡献路径细分到四种角色（代码 / 想法 / 翻译 / 传播），每种给专门入口。
- GitHub Discussions、Issues、Discord、X 四通道，且每项标注用途（`Get help...`、`Report reproducible bugs...`、`Chat in real time...`、`Follow Dify for release news...`）。
- Linux Foundation Insights 健康度与贡献者徽章，把治理透明度对外展示。
- `good first issues` 标签降低新贡献者第一步门槛。

**→ 可迁移到 AGI Engine 的动作**

1. 学「三层版本结构」：AGI Engine 可明确 `免费单文件版 / Pro 个人版（$15/月或$100/年）/ 团队或定制`，并把「有免费版」像 Dify 的 `free pricing` badge 一样放在首屏最显眼处。
2. 学「四角色贡献路径」：即便 AGI Engine 初期不开源全部代码，也可开放「翻译 14 语言 / 提交使用案例 / 文档改进 / 社区答疑」四种参与方式，把 0 用户的冷启动变成共建。
3. 学「Star 即订阅」的话术改造：AGI Engine 可把「Star 项目 + 订阅更新」换成「加入更新列表，第一时间获知新版本」，并与官网的隐私承诺绑定。
4. 学「第三方背书位」的设计意识：当前无可信第三方背书时，先预留证据位（如安全审计页、隐私政策页链接），待有真实材料再填入，避免虚构。

---

## 2. 横向共性规律（8 条，每条含迁移动作）

### 规律 1：第一屏必须同时回答「是什么」与「和我有什么关系」

证据：Open WebUI 用 `a home for AI` + 四个形容词；AnythingLLM 用 `Stop renting your intelligence. Own it.`；Supabase 用 `Build in a weekend. Scale to millions.`；LocalAI 用 `Your own AI, on your own hardware.`；Cal.com 用 `Where people find the time to meet`。五个项目的首屏都是「具象价值 + 个人收益」的组合，没有一个用技术名词开头当主标。

**→ 迁移动作**：AGI Engine 主标必须出现「你的记忆 / 你的设备 / 你的 Key」这类所有权语言，副标用一句话说明单文件 PWA + AES-256 + 自带 API Key。禁止用「AGI Engine 是一个基于 Web 的 AI 应用」这种以产品自我为中心的开场。

### 规律 2：把「门槛恐惧」写成可以被消除的具体句子

证据：AnythingLLM `no frustrating setup required` + `One file. No dependencies.`；LocalAI `No GPU required.`；Cal.com `Free for individuals, no credit card, no usage limits.`；Dify 给出 `CPU >= 2 Core / RAM >= 4 GiB` 明确最低配置。

**→ 迁移动作**：AGI Engine 首屏连续给出三条消障句——「无需注册账号」「无需服务器」「无需上传记忆到云端」，并把「一个文件、双击即用」作为第一步。这些恰好是真实产品属性，不需要任何编造。

### 规律 3：数字徽章比形容词更能建立信任，且优先选「用户收益型数字」

证据：AnythingLLM 官网四组数字中，`$8.7M+ Saved by users vs. cloud APIs` 把隐私翻译成省钱；LocalAI `50,507 stars` 与 `18 engines we wrote` 把技术参数当数字；Dify 用 Docker Pulls、Commits、Issues closed、Discussion posts、LFX 指标组成徽章矩阵。

**→ 迁移动作**：AGI Engine 在流量为 0 的现实下**不得编造下载量**，改用可验证的技术数字徽章：`AES-256`、`14 语言`、`单文件`、`自带任意兼容 API Key`。待有真实用户数据后再替换为收益型数字（如累计本地加密记忆条数，且必须是本机展示而非服务器统计）。

### 规律 4：CTA 首动词低承诺，且按用户意图分流

证据：Open WebUI 主 CTA 是 `Explore Open WebUI →` 而非注册；Cal.com 用 `Get started for free` / `or talk to sales` 双轨；Dify 顶部四条导航本身就是四个决策入口；AnythingLLM 同时提供 Docs / Hosted Instance / Download Now / Watch the video 四种承诺层级。

**→ 迁移动作**：AGI Engine 官网设置三层 CTA——顶层「免费下载，立即体验」（零承诺）、中层「查看隐私与加密说明」（信息型）、底层「了解 Pro $15/月 / $100/年」（交易型）。避免一上来就推 $100 年付。

### 规律 5：社会证明必须可点击、可追溯，形成证据链

证据：Cal.com 每条 testimonial 带来源链接（Trustpilot / Product Hunt / X），每个客户 logo 链到 case study；Supabase 客户故事带真人姓名职位 + `Read the story →`；Dify 的 LFX 徽章链到 Linux Foundation Insights。

**→ 迁移动作**：AGI Engine 每一条信任声明都要有可点击的落点——「AES-256」链到加密说明页、「零服务器」链到架构说明、「14 语言」链到语言列表。即使初期没有第三方评价，也要让证据可逐层下钻，而不是停留在首页的静态标语。

### 规律 6：把用户变成分发渠道（徽章、fork、模板、Star 订阅）

证据：Supabase 提供 `Made with Supabase` SVG 徽章源码；Dify 把 `Star Dify on GitHub` 包装成更新订阅；Cal.com 的 `Discover` 让闲置时间变成公开供给；AnythingLLM 的 `More Products` 产品矩阵互相导流；`cal.diy` 社区 fork 形成第二分发轨道。

**→ 迁移动作**：AGI Engine 设计一枚 `本地加密 · Powered by AGI Engine` 徽章供用户在博客/README 使用；同时把「14 语言」做成可被翻译社区认领的共建入口。注意：所有裂变设计不得要求用户披露任何记忆内容。

### 规律 7：文档即落地页，安装步骤就是转化漏斗

证据：Open WebUI 把 `Explore Open WebUI →` 直接指向文档；Dify 首屏给可复制的 `docker compose up -d`；LocalAI 首屏给 `curl ... | sh`；AnythingLLM 用四步上手图（下载 → 选模型 → 就绪 → 扩展）。

**→ 迁移动作**：AGI Engine 把「下载单文件 → 打开即用 → 填入自己的 API Key → 写入第一条加密记忆」做成四步图文引导，直接放在首屏下方，让「可用」的证明早于「好看」的包装。

### 规律 8：用持续交付与多语言覆盖证明项目活着

证据：AnythingLLM 博客按日期发布版本更新（`v1.17.0`、`October 2026`）；Dify 有 17 语言 README 含克林贡语；Supabase 有 40+ 语言 README；LocalAI 明确 `Open since March 2023`。

**→ 迁移动作**：AGI Engine 建立可见的更新日志页（哪怕每月一条），并把已有的 14 语言做成首屏可切换的界面，让多语言从「功能列表里的一行」升级为「可被亲眼验证的体验」。

---

## 3. 「借鉴但超越」：AGI Engine 官网三条设计建议

### 建议一：做「断网可验证」的首屏，而不是又一张隐私承诺海报

**借鉴来源**：LocalAI 的 `42 seconds` 自制影片（用产品证明能力）+ AnythingLLM 的 `One file. No dependencies.`（消障句）。

**超越点**：以上项目都停留在「我们本地运行」的声明层面。AGI Engine 可把「本地」做成**用户可亲自验证的交互**：首屏嵌入一个 30 秒屏幕录制，展示拔掉网线后仍写入并读取一条 AES-256 加密记忆；旁边放一个真实可点的「加密演示」小组件，让用户当场输入一段文字，看到加密后的密文只存在于本机。

**为什么适配**：AGI Engine 的单文件 PWA + 本地加密记忆 + 自带 Key 三个属性叠加，使「断网可用」成为比竞品更彻底的证明——竞品多数仍需下载模型或依赖本地引擎，而 PWA 连安装都省了。

**注意边界**：演示数据不得上传服务器，否则与隐私承诺冲突；文案只写可实现的行为，不写「绝对无法被破解」这类不可证承诺。

### 建议二：把「自带 API Key」从成本项重写成所有权证明，并设计双轨定价叙事

**借鉴来源**：AnythingLLM 的 `Stop renting your intelligence. Own it.`（对立叙事）+ Dify 的三层版本结构（Cloud / Community / Enterprise）+ Cal.com 的双轨 CTA。

**超越点**：竞品普遍把「自带 Key」写成技术选项，AGI Engine 应把它升级为品牌主张——「Key 是你的，记忆是你的，账单也是你自己的」。官网定价区据此设计两条并列的账本：一条是 AGI Engine Pro 的 `$15/月 · $100/年`，另一条是「你付给模型厂商的费用，直接进你的账户，不经过我们」。这种「双账本透明化」是上述项目都没有做的，因为它要求产品真的不碰用户的 Key 与数据。

**具体结构**：定价卡左栏写免费版能力（单文件 PWA、AES-256、14 语言），右栏写 Pro 能力（用真实已实现的功能填充，不得虚构），下方一行小字说明「模型调用费由你直接支付给所选服务商」。CTA 分别为「免费下载」与「升级 Pro」。

**注意边界**：不得暗示用户「用我们的 Key 更便宜」；也不得承诺未实现的企业功能。

### 建议三：用「14 语言 + 单文件」做可参与的冷启动，替代虚假的 logo 墙

**借鉴来源**：Supabase 的 `Made with Supabase` 徽章与 40+ 语言 README、Dify 的四角色贡献路径与 `good first issues`、Cal.com 的客户故事证据链。

**超越点**：上述项目的社会证明都建立在已有规模之上（star、客户、评分）。AGI Engine 收入 0、流量 0，照搬 logo 墙只会暴露空窗。反向做法是**把「还没有用户」变成公开的共建邀请**：官网设一个「14 语言共建」板块，每种语言标注母语审校状态（真实状态），提供翻译贡献入口；再设一个「隐私见证人」页面，邀请早期使用者以自愿、可验证的方式留下使用感受（如公开仓库的 issue 或 discuss），而不是采购 testimonial。

**为什么适配**：14 语言是 AGI Engine 已有资产，单文件形态让「分发一个链接」成本极低，两者结合可把冷启动从「等流量」改为「给参与者一个可归属的贡献位」。

**注意边界**：不得虚构贡献者、不得伪造语言审校状态、不得用代币或积分激励（项目无此类机制）。所有贡献入口必须是真实可用的链接。

---

## 4. 证据边界与自检

| 检查项 | 状态 |
|---|---|
| 实际访问项目数 | 6 个 GitHub 仓库（要求 ≥5），另加 4 个官网 |
| 所有数据是否来自访问结果 | 是；star 数、下载量、评分、引述均来自上述 URL |
| 是否提区块链 / 代币 | 否 |
| 是否虚构项目特性 | 否；未访问到的信息明确标注「未见」 |
| 是否照搬文案原文 | 仅短句引用作证据出处；规律与建议文案为原创提炼 |
| 每条洞察是否含迁移动作 | 是（第 1 节每项目末尾 + 第 2 节每条规律末尾） |
| AGI Engine 数据是否被编造 | 否；技术数字仅使用题设已给属性，规模数字明确禁止编造 |

**情报官结论**：六个标杆的共同底层不是「功能多」，而是「把用户的犹豫逐条写成已被消除的句子」。AGI Engine 当前最大的可迁移杠杆，是把隐私与本地属性从功能清单移到首屏，并用可验证的交互（断网演示、密文演示）替代尚不存在的规模数字。
