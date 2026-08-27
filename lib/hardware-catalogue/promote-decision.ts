import {
  calculateListPriceFromExclCost,
  type ListPriceStatus,
  type ShopBenchmarkRecord,
  type ShopQuote,
} from '@/lib/products/list-price'

export const DEFAULT_LEAD_TIME = { min: 5, max: 7 } as const

export type PromoteBlockReason = 'below_floor' | 'unbenchmarked_unconfirmed'

export interface DecidePromoteInput {
  costExclVat: number
  quotes?: ShopQuote[]
  confirmUnbenchmarked?: boolean
  streetNote?: string
  leadTime?: { min: number; max: number }
}

export interface PromoteDecisionMetadata {
  list_price_status: ListPriceStatus
  shop_benchmark: ShopBenchmarkRecord
  street_note?: string
  confirm_unbenchmarked?: boolean
  lead_time_business_days: { min: number; max: number }
}

export type PromoteDecision =
  | {
      allowed: false
      reason: PromoteBlockReason
      status: ListPriceStatus
      listInclVat: number | null
      metadata: PromoteDecisionMetadata
      error: string
    }
  | {
      allowed: true
      reason?: undefined
      status: ListPriceStatus
      listInclVat: number
      metadata: PromoteDecisionMetadata
      error?: undefined
    }

function shopBenchmarkRecord(quotes: ShopQuote[] | undefined): ShopBenchmarkRecord {
  const record: ShopBenchmarkRecord = {}
  for (const quote of quotes ?? []) {
    if (quote.source === 'afrihost') record.afrihost = quote
    if (quote.source === 'axxess') record.axxess = quote
  }
  return record
}

export function quotesFromShopFields(fields: {
  afrihostUrl?: string
  afrihostPrice?: number
  axxessUrl?: string
  axxessPrice?: number
}): ShopQuote[] {
  const quotes: ShopQuote[] = []
  if (fields.afrihostUrl?.trim() && Number(fields.afrihostPrice) > 0) {
    quotes.push({
      source: 'afrihost',
      url: fields.afrihostUrl.trim(),
      priceInclVat: Number(fields.afrihostPrice),
      kind: 'shop',
    })
  }
  if (fields.axxessUrl?.trim() && Number(fields.axxessPrice) > 0) {
    quotes.push({
      source: 'axxess',
      url: fields.axxessUrl.trim(),
      priceInclVat: Number(fields.axxessPrice),
      kind: 'shop',
    })
  }
  return quotes
}

export function decidePromote(input: DecidePromoteInput): PromoteDecision {
  const priced = calculateListPriceFromExclCost(input.costExclVat, input.quotes)
  const leadTime = input.leadTime ?? DEFAULT_LEAD_TIME
  const metadata: PromoteDecisionMetadata = {
    list_price_status: priced.status,
    shop_benchmark: shopBenchmarkRecord(input.quotes),
    street_note: input.streetNote?.trim() || undefined,
    lead_time_business_days: { min: leadTime.min, max: leadTime.max },
  }

  if (priced.status === 'below_floor') {
    return {
      allowed: false,
      reason: 'below_floor',
      status: priced.status,
      listInclVat: null,
      metadata,
      error: 'Standalone List Price is below the 25% margin floor',
    }
  }

  if (priced.status === 'unbenchmarked' && !input.confirmUnbenchmarked) {
    return {
      allowed: false,
      reason: 'unbenchmarked_unconfirmed',
      status: priced.status,
      listInclVat: priced.listInclVat,
      metadata,
      error:
        'Confirm Promote without a Shop Benchmark to keep List Price at 35%',
    }
  }

  if (priced.listInclVat == null) {
    return {
      allowed: false,
      reason: 'below_floor',
      status: priced.status,
      listInclVat: null,
      metadata,
      error: 'Cannot compute a standalone List Price from this cost',
    }
  }

  if (input.confirmUnbenchmarked && priced.status === 'unbenchmarked') {
    metadata.confirm_unbenchmarked = true
  }

  return {
    allowed: true,
    status: priced.status,
    listInclVat: priced.listInclVat,
    metadata,
  }
}

export function leadTimeLabel(lead: { min: number; max: number }): string {
  if (lead.min === lead.max) return `${lead.min} business days`
  return `${lead.min}–${lead.max} business days`
}
