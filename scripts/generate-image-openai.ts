/**
 * OpenAI Image Generation helper (gpt-image-1 / gpt-image-2)
 *
 * Generates or edits images via the OpenAI Images API and saves them to disk.
 * Companion to the `openai-imagegen` skill. Mirror of the Gemini path used by
 * the nb-* skills, but for OpenAI's gpt-image models.
 *
 * Run:
 *   set -a && source .env.local && set +a && npx tsx scripts/generate-image-openai.ts \
 *     --prompt "a photorealistic fibre router on a navy studio backdrop" \
 *     --out designs/router.png
 *
 * Flags:
 *   --prompt   <text>   (required) the image prompt
 *   --model    <id>     gpt-image-1 (default) | gpt-image-1-mini | gpt-image-1.5 | gpt-image-2
 *   --size     <wxh>    1024x1024 (default) | 1536x1024 | 1024x1536 | auto
 *   --quality  <level>  high (default) | medium | low | auto
 *   --n        <int>    number of images (default 1)
 *   --background <mode> opaque (default) | transparent | auto   (transparent needs png/webp)
 *   --format   <ext>    png (default) | jpeg | webp
 *   --edit     <path>   optional source image(s), comma-separated — switches to /images/edits
 *   --out      <path>   output path (default designs/openai-<timestamp>.<format>)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

function arg(name: string, fallback = ''): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not set. Run with: set -a && source .env.local && set +a && npx tsx ...');
    process.exit(1);
  }

  const prompt = arg('prompt');
  if (!prompt) {
    console.error('❌ --prompt is required');
    process.exit(1);
  }

  const model = arg('model', 'gpt-image-1');
  const size = arg('size', '1024x1024');
  const quality = arg('quality', 'high');
  const n = parseInt(arg('n', '1'), 10);
  const background = arg('background', 'opaque');
  const format = arg('format', 'png');
  const editPaths = arg('edit');
  const outBase = arg('out', `designs/openai-${Date.now()}.${format}`);

  let data: Array<{ b64_json?: string }>;

  if (editPaths) {
    // Image edit (multipart). One or more source images.
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', quality);
    form.append('n', String(n));
    for (const p of editPaths.split(',').map((s) => s.trim())) {
      const buf = readFileSync(p);
      const ext = p.split('.').pop() || 'png';
      form.append('image[]', new Blob([buf], { type: `image/${ext}` }), p.split('/').pop() || 'image.png');
    }
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${JSON.stringify(json)}`);
    data = json.data;
  } else {
    // Generation (JSON). gpt-image models always return b64_json.
    const body: Record<string, unknown> = { model, prompt, size, quality, n };
    if (background !== 'opaque') body.background = background;
    if (format !== 'png') body.output_format = format;
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${JSON.stringify(json)}`);
    data = json.data;
  }

  data.forEach((img, idx) => {
    if (!img.b64_json) return;
    const out = n > 1 ? outBase.replace(/(\.\w+)$/, `-${idx + 1}$1`) : outBase;
    const dir = dirname(out);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(out, Buffer.from(img.b64_json, 'base64'));
    console.log(`✅ Saved: ${out}`);
  });
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
