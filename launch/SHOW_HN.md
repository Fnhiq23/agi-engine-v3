# Show HN 发布文案

> 用法：把下面 Title 和 Text 原样发到 https://news.ycombinator.com/submit
> 发布者：必须是项目所有者本人（你的账号）。发布后盯住评论区 24 小时，真诚回复每一条。

---

## Title

Show HN: AGI Engine – a local-first personal AI with an actually encrypted memory vault

## Text (Body)

Hi HN,

I built AGI Engine because I wanted a personal AI that remembers me without sending my private notes to a cloud server.

What it is:
- A single-page app that runs entirely in your browser (no backend required for the core experience)
- Bring your own LLM key (OpenAI / Anthropic / OpenRouter / local Ollama) — I don't pay API costs, you stay in control
- A memory system with search, tags, import/export
- A real encryption vault: AES-256-GCM + PBKDF2 (210k iterations), passphrase never stored or uploaded

What it is NOT (I'm being upfront):
- It is not a hosted AI service and does not include an LLM
- No blockchain, no token, no smart contract — I removed those claims from an earlier version
- It's early, and the "Pro" tier is currently just a support mechanism

Why I'm sharing: I'm looking for honest feedback on the memory model and the encryption UX. If you'd use something like this, tell me what would make it worth paying for.

Live demo: [YOUR URL]
GitHub: [YOUR REPO URL]

Happy to answer questions.

---

## 发布前必做的 3 件事

1. 把 `[YOUR URL]` 和 `[YOUR REPO URL]` 换成真实可访问链接。
2. 确保 demo 能打开（用 `python3 -m http.server` 或部署到 GitHub Pages / Netlify）。
3. 用你自己的 HN 账号发布，不要买号、不要多账号刷票——违反 HN 规则会被封。

## 评论区应对原则

- 有人指出 bug → 承认并说"我会在 X 时间内修"，然后真的修。
- 有人问"和 AnythingLLM / MemPalace 有何不同" → 诚实回答：目前差异很小，这是早期版本，你在找 niche。
- 不要吹嘘、不要承诺收入、不要发付款链接刷屏。
