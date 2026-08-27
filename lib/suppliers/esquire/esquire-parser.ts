import type { EsquireParseResult, ParsedEsquireProduct } from './esquire-types'

function decodeXml(value: string): string {
  const decoded = value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return decoded.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1').trim()
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i'))
  return match ? decodeXml(match[1].trim()) : ''
}

function parsePrice(raw: string): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

function parseAvailability(raw: string): { in_stock: boolean; available_qty_raw: string } {
  const available_qty_raw = raw.trim() || 'No'
  const in_stock = /^yes$/i.test(available_qty_raw)
  return { in_stock, available_qty_raw }
}

export function parseEsquireXml(xml: string): EsquireParseResult {
  if (!xml || !/<ROOT[\s>]|<products[\s>]/i.test(xml)) {
    return {
      success: false,
      products: [],
      errors: ['Invalid Esquire XML: expected ROOT/products'],
    }
  }

  const blocks = xml.match(/<product>([\s\S]*?)<\/product>/gi) ?? []
  const products: ParsedEsquireProduct[] = []
  const errors: string[] = []

  for (const block of blocks) {
    const sku = tag(block, 'ProductCode')
    if (!sku) continue

    const { in_stock, available_qty_raw } = parseAvailability(tag(block, 'AvailableQty'))
    const image = tag(block, 'image')

    products.push({
      sku,
      name: tag(block, 'ProductName') || sku,
      description: tag(block, 'ProductSummary') || null,
      category: tag(block, 'Category') || null,
      cost_price: parsePrice(tag(block, 'Price')),
      in_stock,
      available_qty_raw,
      source_image_url: image || null,
    })
  }

  return { success: true, products, errors }
}
