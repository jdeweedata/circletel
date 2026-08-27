/**
 * Customer-facing Storefront Catalogue helpers.
 * Only published Promoted rows. Never show dealer cost or raw Procurement SKUs.
 */

import { DEFAULT_LEAD_TIME, leadTimeLabel } from '@/lib/hardware-catalogue/promote-decision'

export function isStorefrontPublished(
  status: string | null | undefined
): boolean {
  return status === 'published'
}

export function isBooleanSupplierStock(
  supplierCode: string | null | undefined
): boolean {
  return supplierCode === 'ESQUIRE'
}

export function leadTimeFromPromote(input: {
  metadata?: Record<string, unknown> | null
  deliveryEstimate?: string | null
}): string {
  const raw = input.metadata?.lead_time_business_days
  if (raw && typeof raw === 'object' && raw !== null) {
    const days = raw as { min?: unknown; max?: unknown }
    const min = Number(days.min)
    const max = Number(days.max)
    if (min > 0 && max > 0) return leadTimeLabel({ min, max })
  }
  if (input.deliveryEstimate?.trim()) return input.deliveryEstimate.trim()
  return leadTimeLabel(DEFAULT_LEAD_TIME)
}

export interface StorefrontAvailability {
  inStock: boolean
  label: string
  showBranchCounts: boolean
}

export function storefrontAvailability(input: {
  stockTotal: number
  booleanStock: boolean
}): StorefrontAvailability {
  const inStock = input.stockTotal > 0
  if (input.booleanStock) {
    return {
      inStock,
      label: inStock ? 'Available' : 'Unavailable',
      showBranchCounts: false,
    }
  }
  return {
    inStock,
    label: inStock
      ? input.stockTotal > 10
        ? 'In Stock'
        : `Only ${input.stockTotal} left`
      : 'Out of Stock',
    showBranchCounts: inStock,
  }
}

export function omitDealerCost<T extends Record<string, unknown>>(row: T): Omit<
  T,
  'cost_price' | 'best_supplier_cost'
> {
  const { cost_price: _cost, best_supplier_cost: _best, ...rest } = row
  return rest
}
