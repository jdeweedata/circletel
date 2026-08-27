import { addVat } from '@/lib/billing/vat'

/**
 * Standalone List Price from supplier cost and Shop Benchmark.
 *
 * Shop Benchmark is the cheaper of Afrihost / Axxess once-off shop prices
 * for the same model. Subsidised / free quotes do not count.
 */

export const TARGET_MARGIN = 0.35
export const FLOOR_MARGIN = 0.25

export type ShopQuoteSource = 'afrihost' | 'axxess'

export type ShopQuoteKind = 'shop' | 'subsidised'

export interface ShopQuote {
  source: ShopQuoteSource
  url: string
  priceInclVat: number
  kind: ShopQuoteKind
}

export interface ListPriceInput {
  costInclVat: number
  quotes?: ShopQuote[]
}

export type ListPriceStatus = 'target' | 'match_benchmark' | 'unbenchmarked' | 'below_floor'

export interface ListPriceResult {
  status: ListPriceStatus
  listInclVat: number | null
  marginPct: number | null
  shopBenchmark: number | null
}

export interface ShopBenchmarkRecord {
  afrihost?: ShopQuote
  axxess?: ShopQuote
  streetNote?: string
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

function marginPct(listInclVat: number, costInclVat: number): number {
  if (listInclVat <= 0) return 0
  return Math.round(((listInclVat - costInclVat) / listInclVat) * 1000) / 10
}

export function isValidShopQuote(quote: ShopQuote): boolean {
  return quote.kind === 'shop' && Number.isFinite(quote.priceInclVat) && quote.priceInclVat > 0
}

export function shopBenchmarkFromQuotes(quotes: ShopQuote[] | undefined): number | null {
  const valid = (quotes ?? []).filter(isValidShopQuote).map((q) => q.priceInclVat)
  if (valid.length === 0) return null
  return Math.min(...valid)
}

export function calculateListPrice(input: ListPriceInput): ListPriceResult {
  const cost = input.costInclVat
  if (!Number.isFinite(cost) || cost <= 0) {
    return {
      status: 'unbenchmarked',
      listInclVat: null,
      marginPct: null,
      shopBenchmark: null,
    }
  }

  const target = roundMoney(cost / (1 - TARGET_MARGIN))
  const floor = roundMoney(cost / (1 - FLOOR_MARGIN))
  const shopBenchmark = shopBenchmarkFromQuotes(input.quotes)

  if (shopBenchmark == null) {
    return {
      status: 'unbenchmarked',
      listInclVat: target,
      marginPct: marginPct(target, cost),
      shopBenchmark: null,
    }
  }

  if (shopBenchmark < floor) {
    return {
      status: 'below_floor',
      listInclVat: null,
      marginPct: marginPct(shopBenchmark, cost),
      shopBenchmark,
    }
  }

  if (target <= shopBenchmark) {
    return {
      status: 'target',
      listInclVat: target,
      marginPct: marginPct(target, cost),
      shopBenchmark,
    }
  }

  return {
    status: 'match_benchmark',
    listInclVat: shopBenchmark,
    marginPct: marginPct(shopBenchmark, cost),
    shopBenchmark,
  }
}

/** Supplier cost is stored excl VAT. Shop List Price is incl VAT. */
export function calculateListPriceFromExclCost(
  costExclVat: number,
  quotes?: ShopQuote[]
): ListPriceResult {
  return calculateListPrice({
    costInclVat: addVat(costExclVat),
    quotes,
  })
}
