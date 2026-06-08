---
name: openrouter-imagegen
description: Generate images cost-effectively via OpenRouter (Seedream 4.5, FLUX.2, Recraft V4, etc.) as a cheaper alternative to OpenAI gpt-image. Use when the user wants low-cost image generation, a specific OpenRouter image model, or quality comparable to gpt-image-2 at a fraction of the price. Requires OPENROUTER_API_KEY in .env.local.
---

# OpenRouter Image Generation (cost-effective)

A unified gateway to many image models. Use for the cheap-but-high-quality path,
or to reach models only available via OpenRouter (Seedream, FLUX, Recraft, Sourceful).

## Prerequisites

- `OPENROUTER_API_KEY` in `.env.local` (placeholder present — paste your key from
  https://openrouter.ai/keys). Until set, the helper exits with a clear message.
- Helper script: `scripts/generate-image-openrouter.ts` (no extra npm deps — global `fetch`).

## ⚠️ Two facts that matter

1. **No Qwen image model on OpenRouter** (checked live). Qwen-Image is served via Alibaba
   DashScope, not OpenRouter. Don't promise it here.
2. **Gemini image models are cheaper called DIRECTLY** via `GEMINI_API_KEY` (no OpenRouter
   markup) — use the `nb-*` skills for those. Use *this* skill for Seedream / FLUX / Recraft /
   OpenAI gpt-5-image, which you can only reach via OpenRouter.

## Cost-effective model picks (≈ per image)

| Model id | ~Cost | Best for |
|----------|-------|----------|
| `bytedance-seed/seedream-4.5` | **~$0.03** | **Default** — best quality-per-dollar, gpt-image-2-class |
| `recraft/recraft-v4` | ~$0.04 | UI / design / logos / **vector** output |
| `google/gemini-2.5-flash-image` | ~$0.039 | Photoreal + in-image text (cheaper direct, though) |
| `black-forest-labs/flux.2-pro` | ~$0.05 | Arguably highest quality |
| `openai/gpt-5-image` | higher | OpenAI quality via one key |

For reference, OpenAI `gpt-image-2` high ≈ **$0.17–0.19/img** — Seedream is ~6× cheaper.

> Pricing changes — verify live: `curl "https://openrouter.ai/api/v1/models?output_modalities=image"`.

## How it works (different from OpenAI!)

OpenRouter generates images through the **chat-completions** endpoint with a `modalities`
param, NOT `/images/generations`:

```
POST https://openrouter.ai/api/v1/chat/completions
{ "model": "...", "messages": [{ "role": "user", "content": "PROMPT" }],
  "modalities": ["image"],            // ["image","text"] for gemini/openai models
  "image_config": { "aspect_ratio": "16:9", "image_size": "2K" } }
```

Images return as base64 data URLs in `choices[0].message.images[].image_url.url`.
The helper handles modalities selection, parsing, and saving automatically.

## Generate

```bash
set -a && source .env.local && set +a && npx tsx scripts/generate-image-openrouter.ts \
  --prompt "PASTE PROMPT HERE" \
  --model bytedance-seed/seedream-4.5 \
  --aspect 16:9 \
  --out designs/circletel-hero.png
```

Other models: `--model black-forest-labs/flux.2-pro`, `--model recraft/recraft-v4`.

## Image-to-image / edit

```bash
set -a && source .env.local && set +a && npx tsx scripts/generate-image-openrouter.ts \
  --edit designs/source.png \
  --prompt "replace the background with a deep navy studio gradient" \
  --out designs/edited.png
```

## Aspect ratios

`1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `9:16`, `16:9`, `21:9` (model-dependent).
gemini-3.1-flash-image-preview also supports `1:4`, `4:1`, `1:8`, `8:1`.

## CircleTel brand context

Orange `#F5831F`, navy `#1B2A4A`, white accent. The prompt templates in
`.claude/skills/nb-product-hero/SKILL.md` are provider-agnostic — reuse them and append
`colour-accurate orange #F5831F (NOT yellow or red), deep navy #1B2A4A`.

## Provider cheat-sheet

| Want | Use |
|------|-----|
| Cheapest good quality | this skill → `seedream-4.5` |
| Best instruction-following / transparent logos | `openai-imagegen` (gpt-image) |
| Photoreal + reliable in-image text | `nb-*` (Gemini direct) |
| Vector / icon / logo files | this skill → `recraft/recraft-v4` |
