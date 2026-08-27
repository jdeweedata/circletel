import type { ParsedEsquireProduct } from './esquire-types'

/**
 * Map a parsed Esquire row to supplier_products fields.
 * stock_total is 1 or 0 so the generated in_stock column matches Yes/No.
 * It is not a warehouse count.
 */
export function planEsquireUpsert(
  incoming: ParsedEsquireProduct[],
  existingBySku: Map<string, { cost_price: number | null; stock_total: number }>
): { insert: string[]; update: string[]; unchanged: string[] } {
  const insert: string[] = []
  const update: string[] = []
  const unchanged: string[] = []

  for (const product of incoming) {
    const existing = existingBySku.get(product.sku)
    if (!existing) {
      insert.push(product.sku)
      continue
    }
    const nextStock = product.in_stock ? 1 : 0
    if (existing.cost_price !== product.cost_price || existing.stock_total !== nextStock) {
      update.push(product.sku)
    } else {
      unchanged.push(product.sku)
    }
  }

  return { insert, update, unchanged }
}

export function toSupplierProductRow(
  product: ParsedEsquireProduct,
  supplierId: string
) {
  return {
    supplier_id: supplierId,
    sku: product.sku,
    name: product.name,
    description: product.description,
    manufacturer: null as string | null,
    cost_price: product.cost_price,
    retail_price: null as number | null,
    source_image_url: product.source_image_url,
    product_url: null as string | null,
    stock_cpt: 0,
    stock_jhb: 0,
    stock_dbn: 0,
    stock_total: product.in_stock ? 1 : 0,
    category: product.category,
    subcategory: null as string | null,
    specifications: {},
    features: [] as string[],
    is_active: true,
    metadata: {
      available_qty_raw: product.available_qty_raw,
      stock_is_boolean: true,
    },
  }
}
