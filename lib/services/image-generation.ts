/**
 * OpenRouter Image Generation Service
 * 
 * Generates images via OpenRouter's chat completions API and saves them
 * to Supabase storage via Payload's Local API.
 * 
 * OpenRouter image models available:
 * - openai/gpt-5-image-mini ($0.05/img) — fast, good for products & blog heroes
 * - openai/gpt-5.4-image-2 ($0.08/img) — highest quality
 * - google/gemini-3.1-flash-image-preview ($0.07/img) — Nano Banana 2, great for wireframes
 * - xai/grok-imagine ($0.05/img) — budget alternative
 * - recraftai/recraft-vector ($0.08/img) — SVG vector icons
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface ImageGenRequest {
  prompt: string
  style?: 'product' | 'blog_hero' | 'wireframe' | 'icon'
  aspect?: 'square' | 'landscape' | 'portrait'
  model?: string
}

interface ImageGenResponse {
  url: string
  model: string
  cost: number
  width: number
  height: number
}

const MODEL_MAP: Record<string, { id: string; cost: number }> = {
  product:    { id: 'openai/gpt-5-image-mini', cost: 0.05 },
  blog_hero:  { id: 'openai/gpt-5-image-mini', cost: 0.05 },
  wireframe:  { id: 'google/gemini-3.1-flash-image-preview', cost: 0.07 },
  icon:       { id: 'recraftai/recraft-vector', cost: 0.08 },
}

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  square:    { width: 1024, height: 1024 },
  landscape: { width: 1280, height: 720 },
  portrait:  { width: 720, height: 1280 },
}

/**
 * Build a style-specific system prompt that guides the model toward the right output.
 */
function getStylePrompt(style: string): string {
  switch (style) {
    case 'product':
      return 'Generate a professional e-commerce product photo. Clean white/light background, studio lighting, sharp focus, no text or logos on the product. 4K product photography quality.'
    case 'blog_hero':
      return 'Generate a high-quality blog header image. Cinematic composition, warm professional lighting, 16:9 ratio feel. No text overlays, no logos. Modern editorial photography style.'
    case 'wireframe':
      return 'Generate a clean UI wireframe mockup. Grayscale or muted palette, visible grid structure, placeholder content blocks, minimal styling. Looks like a Balsamiq or Figma lo-fi wireframe.'
    case 'icon':
      return 'Generate a simple, clean vector-style icon. Flat design, minimal detail, suitable for UI use. Transparent or light background centered. Professional app icon quality.'
    default:
      return 'Generate a high-quality image. Professional, clean, well-composed. No text overlays or watermarks.'
  }
}

/**
 * Load OpenRouter API key from environment or Hermes config.
 */
function getApiKey(): string {
  // Try environment variable first
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY
  }
  
  // Fall back to config.yaml (only works in dev/CLI context)
  try {
    const fs = require('fs')
    const yaml = require('yaml')
    const config = yaml.parse(fs.readFileSync('/root/.hermes/config.yaml', 'utf8'))
    for (const p of config.custom_providers || []) {
      if (p.name === 'OpenRouter') return p.api_key
    }
  } catch {
    // Config not available (production build)
  }
  
  throw new Error('OPENROUTER_API_KEY not set and no Hermes config available')
}

/**
 * Generate an image via OpenRouter and return the URL.
 */
export async function generateImage(req: ImageGenRequest): Promise<ImageGenResponse> {
  const style = req.style || 'product'
  const aspect = req.aspect || 'square'
  const modelInfo = MODEL_MAP[style] || MODEL_MAP.product
  const model = req.model || modelInfo.id
  const dimensions = ASPECT_DIMENSIONS[aspect] || ASPECT_DIMENSIONS.square

  const apiKey = getApiKey()

  const systemPrompt = getStylePrompt(style)
  const fullPrompt = `${systemPrompt}\n\n${req.prompt}\n\nImage requirements: ${dimensions.width}x${dimensions.height}, ${aspect} aspect ratio.`

  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: fullPrompt,
      },
    ],
    modalities: ['image', 'text'],
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message

  // Extract image from response
  const images = message?.images || []
  if (images.length === 0) {
    throw new Error('No images in OpenRouter response')
  }

  const imageUrl = images[0]?.image_url?.url
  if (!imageUrl) {
    throw new Error('Image URL not found in response')
  }

  // If it's a URL (not base64), return it directly
  if (imageUrl.startsWith('http')) {
    return {
      url: imageUrl,
      model,
      cost: modelInfo.cost,
      width: dimensions.width,
      height: dimensions.height,
    }
  }

  // If base64, we need to save it. In a full implementation, this would
  // upload to Supabase storage via the Payload Local API.
  // For now, return the data URL (it'll be saved by the API route handler).
  return {
    url: imageUrl, // data:image/png;base64,...
    model,
    cost: modelInfo.cost,
    width: dimensions.width,
    height: dimensions.height,
  }
}

/**
 * Save a base64 image to a file (used for local dev / direct file output).
 */
export function saveBase64Image(base64Data: string, outputPath: string): void {
  const fs = require('fs')
  const path = require('path')
  
  const b64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
  const buffer = Buffer.from(b64, 'base64')
  
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(outputPath, buffer)
}
