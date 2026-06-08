---
name: openai-imagegen
description: Generate and edit images using OpenAI's gpt-image models (gpt-image-1 / gpt-image-2). Use as an alternative to the Gemini (Nano Banana) image path when the user asks for OpenAI image generation, or when comparing providers for a hero/product/social asset. Covers text-to-image, image editing, transparent backgrounds, and CircleTel brand context.
---

# OpenAI Image Generation (gpt-image)

OpenAI counterpart to the Gemini-based `nb-*` / `brand-design` skills. Use when the
user explicitly wants OpenAI, or to A/B a visual against the Gemini output.

> **Provider choice**: Gemini (Nano Banana Pro) excels at photorealistic scenes and
> reliable in-image text. gpt-image excels at instruction-following, transparent-background
> assets (logos/stickers), and clean edits. When unsure which to use, ask the user.

## Prerequisites

- `OPENAI_API_KEY` in `.env.local` (already configured).
- Helper script: `scripts/generate-image-openai.ts` (no extra npm deps — uses global `fetch`).
- Verified working: gpt-image-1, gpt-image-1-mini, gpt-image-1.5, gpt-image-2.

## Models

| Model | Use for |
|-------|---------|
| `gpt-image-1` | Default. High quality, full feature set. |
| `gpt-image-1-mini` | Cheaper/faster drafts and iteration. |
| `gpt-image-1.5` | Improved quality over 1. |
| `gpt-image-2` | Newest, highest quality (premium final assets). |

## Parameters

| Param | Values | Notes |
|-------|--------|-------|
| `size` | `1024x1024` (sq), `1536x1024` (landscape), `1024x1536` (portrait), `auto` | |
| `quality` | `high`, `medium`, `low`, `auto` | low ≈ cheapest, use for drafts |
| `n` | integer | number of images |
| `background` | `opaque`, `transparent`, `auto` | transparent requires `png` or `webp` |
| `output_format` | `png`, `jpeg`, `webp` | gpt-image always returns base64 (`b64_json`) |

## CircleTel Brand Context

| Element | Value |
|---------|-------|
| Primary | Orange `#F5831F` |
| Secondary | Navy `#1B2A4A` |
| Accent | White |
| Tone | Confident, modern, South African |
| Avoid | Stock-photo clichés, generic "tech bubbles", excessive lens flare |

When generating CircleTel brand assets, reuse the prompt templates in
`.claude/skills/nb-product-hero/SKILL.md` (Templates A–H) — they are provider-agnostic.
Append: `colour-accurate orange #F5831F (NOT yellow or red), deep navy #1B2A4A`.

## Step 1 — Gather inputs (if not provided)

1. **Subject / scene** — what is the image of?
2. **Purpose** — hero / product shot / social ad / logo / sticker?
3. **Aspect** — square `1024x1024`, landscape `1536x1024`, portrait `1024x1536`.
4. **Transparent background?** — yes for logos/stickers (forces png/webp).
5. **Model** — final asset → `gpt-image-2`; quick draft → `gpt-image-1-mini`.

## Step 2 — Generate

```bash
set -a && source .env.local && set +a && npx tsx scripts/generate-image-openai.ts \
  --prompt "PASTE PROMPT HERE" \
  --model gpt-image-1 \
  --size 1536x1024 \
  --quality high \
  --out designs/circletel-hero.png
```

Transparent logo/sticker:

```bash
set -a && source .env.local && set +a && npx tsx scripts/generate-image-openai.ts \
  --prompt "CircleTel circle-arc logo mark, flat vector, orange #F5831F" \
  --background transparent --format png \
  --out designs/circletel-logo.png
```

## Step 3 — Edit an existing image

```bash
set -a && source .env.local && set +a && npx tsx scripts/generate-image-openai.ts \
  --edit designs/source.png \
  --prompt "replace the background with a deep navy studio gradient" \
  --out designs/edited.png
```

Multiple source images (composition): `--edit "a.png,b.png"`.

## Conventions

- Output goes to `designs/` (per `.claude/rules/file-organization.md`) — never project root.
- Default output name is `designs/openai-<timestamp>.<format>` if `--out` is omitted.
- `--n > 1` appends `-1`, `-2`, … to the filename.

## Iteration Tips

| If result is... | Try... |
|-----------------|--------|
| Wrong colours | Add "colour-accurate #F5831F orange, NOT yellow or red" |
| Too generic | Name a place: "South African suburb / Johannesburg CBD / Cape Town coastline" |
| Halo on transparent PNG | Add "clean cutout, no background halo or fringe" |
| Text garbled | Keep in-image text to ≤4 words; consider the Gemini path for heavy text |
