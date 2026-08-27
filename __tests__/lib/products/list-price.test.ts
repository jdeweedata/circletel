import { describe, expect, it } from '@jest/globals'

import {
  calculateListPrice,
  calculateListPriceFromExclCost,
  shopBenchmarkFromQuotes,
} from '@/lib/products/list-price'

/** Helios G5TS COS incl VAT — worked example in the shop-first spec. */
const G5TS_COST_INCL = 1729

describe('calculateListPrice', () => {
  it('matches the cheaper Afrihost/Axxess shop price when that sits between 25% and 35%', () => {
    const result = calculateListPrice({
      costInclVat: G5TS_COST_INCL,
      quotes: [
        {
          source: 'afrihost',
          url: 'https://www.afrihost.com/devices/view/zte-g5ts',
          priceInclVat: 2499,
          kind: 'shop',
        },
        {
          source: 'axxess',
          url: 'https://www.axxess.co.za/shop/pid=108213&subcat=607',
          priceInclVat: 2499,
          kind: 'shop',
        },
      ],
    })

    expect(result.status).toBe('match_benchmark')
    expect(result.listInclVat).toBe(2499)
    expect(result.marginPct).toBe(30.8)
    expect(result.shopBenchmark).toBe(2499)
  })

  it('stays at 35% target when there is no valid shop quote', () => {
    const result = calculateListPrice({ costInclVat: G5TS_COST_INCL })

    expect(result.status).toBe('unbenchmarked')
    expect(result.listInclVat).toBe(2660)
    expect(result.marginPct).toBe(35)
    expect(result.shopBenchmark).toBeNull()
  })

  it('rejects a Shop Benchmark below the 25% floor', () => {
    const result = calculateListPrice({
      costInclVat: G5TS_COST_INCL,
      quotes: [
        {
          source: 'afrihost',
          url: 'https://www.afrihost.com/devices/view/zte-g5ts',
          priceInclVat: 2200,
          kind: 'shop',
        },
      ],
    })

    expect(result.status).toBe('below_floor')
    expect(result.listInclVat).toBeNull()
    expect(result.shopBenchmark).toBe(2200)
  })

  it('does not treat subsidised or free quotes as a Shop Benchmark', () => {
    const result = calculateListPrice({
      costInclVat: G5TS_COST_INCL,
      quotes: [
        {
          source: 'afrihost',
          url: 'https://www.afrihost.com/devices/view/zte-g5ts',
          priceInclVat: 1499,
          kind: 'subsidised',
        },
        {
          source: 'axxess',
          url: 'https://www.axxess.co.za/shop/pid=108213',
          priceInclVat: 0,
          kind: 'shop',
        },
      ],
    })

    expect(result.status).toBe('unbenchmarked')
    expect(result.listInclVat).toBe(2660)
    expect(result.shopBenchmark).toBeNull()
  })

  it('converts excl-VAT supplier cost before applying the G5TS shop match', () => {
    const result = calculateListPriceFromExclCost(1503.48, [
      {
        source: 'afrihost',
        url: 'https://www.afrihost.com/devices/view/zte-g5ts',
        priceInclVat: 2499,
        kind: 'shop',
      },
    ])

    expect(result.status).toBe('match_benchmark')
    expect(result.listInclVat).toBe(2499)
    expect(result.marginPct).toBe(30.8)
  })

  it('uses the 35% target when that is already at or below the Shop Benchmark', () => {
    const result = calculateListPrice({
      costInclVat: G5TS_COST_INCL,
      quotes: [
        {
          source: 'axxess',
          url: 'https://www.axxess.co.za/shop/pid=108213',
          priceInclVat: 2800,
          kind: 'shop',
        },
      ],
    })

    expect(result.status).toBe('target')
    expect(result.listInclVat).toBe(2660)
    expect(result.shopBenchmark).toBe(2800)
  })
})

describe('shopBenchmarkFromQuotes', () => {
  it('takes the min of Afrihost and Axxess shop prices only', () => {
    expect(
      shopBenchmarkFromQuotes([
        {
          source: 'afrihost',
          url: 'https://www.afrihost.com/devices/view/zte-g5ts',
          priceInclVat: 2499,
          kind: 'shop',
        },
        {
          source: 'axxess',
          url: 'https://www.axxess.co.za/shop/pid=108213',
          priceInclVat: 2399,
          kind: 'shop',
        },
      ])
    ).toBe(2399)
  })
})
