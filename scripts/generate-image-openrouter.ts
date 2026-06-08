/**
 * OpenRouter Image Generation helper — cost-effective alternative to gpt-image.
 *
 * OpenRouter generates images via the CHAT COMPLETIONS endpoint with a `modalities`
 * param (NOT OpenAI's /images/generations). Images come back as base64 data URLs in
 * `choices[0].message.images[].image_url.url`. Companion to the `openrouter-imagegen` skill.
 *
 * Run (after adding OPENROUTER_API_KEY to .env.local):
 *   set -a && source .env.local && set +a && npx tsx scripts/generate-image-openrouter.ts \
 *     --prompt "a fibre router on a navy studio backdrop" --out designs/router.png
 *
 * Flags:
 *   --prompt <text>    (required) the image prompt
 *   --model  <id>      bytedance-seed/seedream-4.5 (default, ~$0.03/img)
 *                      alternatives: black-forest-labs/flux.2-pro (~$0.05),
 *                      recraft/recraft-v4 (~$0.04), google/gemini-2.5-flash-image (~$0.039),
 *                      openai/gpt-5-image, openai/gpt-5-image-mini
 *   --aspect <ratio>   1:1 (default) | 16:9 | 4:3 | 3:2 | 9:16 | 4:5 | 21:9 ...
 *   --size   <res>     1K (default) | 2K | 4K   (only some models honour this)
 *   --edit   <path>    optional source image(s), comma-separated (image-to-image)
 *   --out    <path>    output path (default designs/openrouter-<timestamp>.png)
 *
 * Cost-effective model note: Gemini image models are cheaper called DIRECTLY via
 * GEMINI_API_KEY (no OpenRouter markup) — use scripts nb-* / generate-hero-image.py for those.
 * Use this helper for models you can ONLY reach via OpenRouter (Seedream, FLUX, Recraft).
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

function arg(name: string, fallback = ''): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// Gemini/OpenAI on OpenRouter output text+image; pure image models (Flux, Seedream,
// Recraft, Sourceful) take image-only. Deterministic rule — not model-as-policy.
function modalitiesFor(model: string): string[] {
  return /gemini|gpt-5|openai/i.test(model) ? ['image', 'text'] : ['image'];
}

function extFromMime(mime: string): string {
  const m = mime.split('/')[1] || 'png';
  return m === 'jpeg' ? 'jpg' : m;
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not set. Add it to .env.local, then run with: set -a && source .env.local && set +a && npx tsx ...');
    process.exit(1);
  }

  const prompt = arg('prompt');
  if (!prompt) {
    console.error('❌ --prompt is required');
    process.exit(1);
  }

  const model = arg('model', 'bytedance-seed/seedream-4.5');
  const aspect = arg('aspect', '1:1');
  const size = arg('size');
  const editPaths = arg('edit');
  let outBase = arg('out', `designs/openrouter-${Date.now()}.png`);

  // Build user content. For image-to-image, attach source images alongside the text.
  let content: unknown = prompt;
  if (editPaths) {
    const parts: unknown[] = [{ type: 'text', text: prompt }];
    for (const p of editPaths.split(',').map((s) => s.trim())) {
      const buf = readFileSync(p);
      const ext = (p.split('.').pop() || 'png').replace('jpg', 'jpeg');
      parts.push({ type: 'image_url', image_url: { url: `data:image/${ext};base64,${buf.toString('base64')}` } });
    }
    content = parts;
  }

  const image_config: Record<string, string> = { aspect_ratio: aspect };
  if (size) image_config.image_size = size;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://www.circletel.co.za',
      'X-Title': 'CircleTel Image Gen',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      modalities: modalitiesFor(model),
      image_config,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(json)}`);

  const message = json.choices?.[0]?.message;
  // REST returns snake_case image_url; SDK camelCases to imageUrl — handle both.
  const images = message?.images || [];
  if (!images.length) {
    throw new Error(`No images returned. Response: ${JSON.stringify(json).slice(0, 800)}`);
  }

  images.forEach((img: any, idx: number) => {
    const url: string = img?.image_url?.url || img?.imageUrl?.url || '';
    const match = url.match(/^data:(image\/\w+);base64,(.*)$/s);
    if (!match) {
      console.error(`⚠️  image ${idx + 1}: unexpected url format (${url.slice(0, 40)}...)`);
      return;
    }
    // Always match the file extension to the ACTUAL returned format (models pick
    // their own — e.g. Seedream returns JPEG even when png is requested).
    const ext = extFromMime(match[1]);
    let out = outBase.replace(/\.\w+$/, '');
    out = `${out}.${ext}`;
    if (images.length > 1) out = out.replace(/(\.\w+)$/, `-${idx + 1}$1`);
    const dir = dirname(out);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(out, Buffer.from(match[2], 'base64'));
    console.log(`✅ Saved: ${out}  (model: ${model})`);
  });
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
