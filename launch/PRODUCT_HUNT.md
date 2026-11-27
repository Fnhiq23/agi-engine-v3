# Product Hunt 发布素材

> 用法：素材供你本人填写发布。PH 需要在 https://www.producthunt.com 用你的账号提交。

---

## Tagline（一句话）

Your personal AI that remembers you — with encryption you can verify.

## Description（产品描述）

AGI Engine is a local-first personal AI assistant that stores your memories on your own device, not in someone else's cloud. Bring your own LLM key (OpenAI, Anthropic, OpenRouter, or a local model), and use the built-in encryption vault to protect your notes with AES-256-GCM — the passphrase never leaves your browser.

Search your memories, export them as plain JSON or an encrypted backup, and import them back anywhere. No account required for the core experience.

## 第一评论（发布后自己置顶）

Hey Product Hunt 👋

I'm the maker of AGI Engine. I built it after realizing I was telling ChatGPT the same things over and over, and I didn't love that those notes lived on a server I don't control.

Key things I want to be transparent about:
- It's a bring-your-own-key app. You supply the LLM API key; the app itself doesn't include a model.
- It's early. The memory + encryption UX is the part I most want feedback on.
- An earlier version had blockchain claims that weren't implemented. I removed them. No token, no chain.

I'm here all day — ask me anything, especially about the encryption design (PBKDF2 210k iterations + AES-256-GCM, verifier-based passphrase check).

## 图片素材建议

PH 需要 5 张图，建议按此顺序（你可以用截图工具自己截）：
1. 主界面 + "Your Personal AGI" 标题
2. 记忆页：搜索 + 标签 + 导出按钮
3. 设置页：Privacy Vault 加密界面
4. 加密导出 JSON 的片段（展示 alg: AES-256-GCM）
5. 对比图：本地加密 vs 云端明文（自己画一张简单的）

## 发布时机

- 最佳：周二–周四，太平洋时间 00:01（北京时间 15:01）发布，能拿满一天投票。
- 提前一天在 Twitter/X 预告，发布当天在评论区积极互动。
