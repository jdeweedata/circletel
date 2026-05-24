/**
 * Hardware Product Catalogue — Pricing Logic
 *
 * Markup calculation, retail price suggestions, and cost sync helpers.
 */

import { createClient } from '@/lib/supabase/server'

// =====================================================
// Constants
// =====================================================

/** Default markup percentage applied to supplier cost to get retail price */
export const DEFAULT_MARKUP_PERCENT = 25

/** Threshold for flagging a product for admin review (cost change %) */
export const COST_CHANGE_REVIEW_THRESHOLD = 5

// =====================================================
// Markup Calculations
// =====================================================

/**
 * Calculate suggested retail price from cost with markup.
 * Rounds up to the nearest R9.95 for South African pricing convention.
 */
export function calculateRetailPrice(
  costPriceExclVat: number,
  markupPercent: number = DEFAULT_MARKUP_PERCENT
): number {
  const raw = costPriceExclVat * (1 + markupPercent / 100)
  return roundToSAPrice(raw)
}

/**
 * Calculate markup percentage from cost and retail prices.
 */
export function calculateMarkupPercent(
  costPrice: number,
  retailPrice: number
): number | null {
  if (costPrice <= 0) return null
  return Math.round(((retailPrice - costPrice) / costPrice) * 1000) / 10
}

/**
 * Calculate margin amount in Rands.
 */
export function calculateMargin(
  costPrice: number,
  retailPrice: number
): number {
  return retailPrice - costPrice
}

// =====================================================
// SA Pricing Convention
// =====================================================

/**
 * Round to South African R9.95 pricing convention.
 * Rounds up to nearest R9.95 or R5.00 increment.
 */
export function roundToSAPrice(price: number): number {
  if (price <= 0) return 0

  // For prices under R100, round to nearest R5
  if (price < 100) {
    return Math.ceil(price / 5) * 5
  }

  // For R100-R1000, round to nearest R10
  if (price < 1000) {
    return Math.ceil(price / 10) * 10
  }

  // For R1000+, round to nearest R50
  return Math.ceil(price / 50) * 50
}

/**
 * Format price in South African Rand.
 */
export function formatPrice(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format price excluding VAT label.
 */
export function formatPriceExclVat(amount: number): string {
  return `${formatPrice(amount)} excl VAT`
}

/**
 * Format price including VAT.
 * VAT rate: 15%
 */
export function formatPriceInclVat(exclVatAmount: number): string {
  const inclVat = Math.round(exclVatAmount * 1.15 * 100) / 100
  return `${formatPrice(inclVat)} incl VAT`
}

// =====================================================
// Cost Sync (Post-supplier-sync hook)
// =====================================================

/**
 * Sync costs for all linked hardware products after a supplier sync.
 * Updates supplier_cost on hardware_product_suppliers and
 * cost_price on circletel_hardware_products to the best available cost.
 *
 * Returns products where cost changed > threshold for admin review.
 */
export async function syncHardwareCosts(
  supplierCode: string
): Promise<
  Array<{
    hardware_product_id: string
    slug: string
    name: string
    old_cost: number
    new_cost: number
    change_percent: number
  }>
> {
  const supabase = await createClient()

  // Get linked products for this supplier
  const { data: links } = await supabase
    .from('hardware_product_suppliers')
    .select(
      `
      id,
      hardware_product_id,
      supplier_product_id,
      supplier_cost,
      hardware_product:circletel_hardware_products (
        id,
        slug,
        name,
        cost_price
      )
    `
    )
    .not('supplier_product_id', 'is', null)

  if (!links || links.length === 0) return []

  // Fetch current costs from supplier_products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkUpdates: any[] = []
  const productCosts: Map<
    string,
    { productId: string; slug: string; name: string; oldCost: number; costs: number[] }
  > = new Map()

  for (const link of links) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = link as any
    const { data: sp } = await supabase
      .from('supplier_products')
      .select('cost_price')
      .eq('id', l.supplier_product_id)
      .single()

    if (!sp) continue

    const newCost = sp.cost_price || 0
    const oldCost = l.supplier_cost || 0

    if (newCost !== oldCost) {
      linkUpdates.push({
        id: l.id,
        supplier_cost: newCost,
        last_synced_cost: oldCost,
        cost_updated_at: new Date().toISOString(),
      })
    }

    const hw = l.hardware_product
    if (hw) {
      const existing = productCosts.get(hw.id)
      if (existing) {
        existing.costs.push(newCost)
      } else {
        productCosts.set(hw.id, {
          productId: hw.id,
          slug: hw.slug,
          name: hw.name,
          oldCost: hw.cost_price || 0,
          costs: [newCost],
        })
      }
    }
  }

  // Update supplier links
  for (const update of linkUpdates) {
    await supabase
      .from('hardware_product_suppliers')
      .update({
        supplier_cost: update.supplier_cost,
        last_synced_cost: update.last_synced_cost,
        cost_updated_at: update.cost_updated_at,
      })
      .eq('id', update.id)
  }

  // Update product cost prices to best available
  const flagged: Array<{
    hardware_product_id: string
    slug: string
    name: string
    old_cost: number
    new_cost: number
    change_percent: number
  }> = []

  for (const [, info] of productCosts) {
    const bestCost = Math.min(...info.costs.filter((c) => c > 0))
    if (bestCost === Infinity) continue

    if (bestCost !== info.oldCost) {
      await supabase
        .from('circletel_hardware_products')
        .update({ cost_price: bestCost })
        .eq('id', info.productId)

      const changePercent =
        info.oldCost > 0
          ? Math.round(
              ((bestCost - info.oldCost) / info.oldCost) * 1000
            ) / 10
          : 100

      if (Math.abs(changePercent) >= COST_CHANGE_REVIEW_THRESHOLD) {
        flagged.push({
          hardware_product_id: info.productId,
          slug: info.slug,
          name: info.name,
          old_cost: info.oldCost,
          new_cost: bestCost,
          change_percent: changePercent,
        })
      }
    }
  }

  return flagged
}
