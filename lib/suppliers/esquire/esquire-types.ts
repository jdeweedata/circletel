export interface ParsedEsquireProduct {
  sku: string
  name: string
  description: string | null
  category: string | null
  cost_price: number
  in_stock: boolean
  available_qty_raw: string
  source_image_url: string | null
}

export interface EsquireParseResult {
  success: boolean
  products: ParsedEsquireProduct[]
  errors: string[]
}

export interface EsquireFeedEnv {
  ESQUIRE_FEED_USER?: string
  ESQUIRE_FEED_PASSWORD?: string
}
