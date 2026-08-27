import { describe, expect, it } from '@jest/globals'

import { decidePromote } from '@/lib/hardware-catalogue/promote-decision'

const G5TS_COST_EXCL = 1503.48

describe('decidePromote', () => {
  it('blocks a standalone Promote when Shop Benchmark is below the 25% floor', () => {
    const result = decidePromote({
      costExclVat: G5TS_COST_EXCL,
      quotes: [
        {
          source: 'afrihost',
          url: 'https://www.afrihost.com/devices/view/zte-g5ts',
          priceInclVat: 2200,
          kind: 'shop',
        },
      ],
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('below_floor')
    expect(result.listInclVat).toBeNull()
  })

  it('blocks unbenchmarked Promote without explicit confirm', () => {
    const result = decidePromote({
      costExclVat: G5TS_COST_EXCL,
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('unbenchmarked_unconfirmed')
    expect(result.listInclVat).toBe(2660)
  })

  it('allows unbenchmarked Promote at 35% after explicit confirm', () => {
    const result = decidePromote({
      costExclVat: G5TS_COST_EXCL,
      confirmUnbenchmarked: true,
    })

    expect(result.allowed).toBe(true)
    expect(result.status).toBe('unbenchmarked')
    expect(result.listInclVat).toBe(2660)
    expect(result.metadata.confirm_unbenchmarked).toBe(true)
    expect(result.metadata.lead_time_business_days).toEqual({
      min: 5,
      max: 7,
    })
  })

  it('stores Shop Benchmark quotes and uses the formula List Price', () => {
    const result = decidePromote({
      costExclVat: G5TS_COST_EXCL,
      quotes: [
        {
          source: 'afrihost',
          url: 'https://www.afrihost.com/devices/view/zte-g5ts',
          priceInclVat: 2499,
          kind: 'shop',
        },
        {
          source: 'axxess',
          url: 'https://www.axxess.co.za/shop/pid=108213',
          priceInclVat: 2499,
          kind: 'shop',
        },
      ],
    })

    expect(result.allowed).toBe(true)
    expect(result.status).toBe('match_benchmark')
    expect(result.listInclVat).toBe(2499)
    expect(result.metadata.shop_benchmark.afrihost?.url).toContain('afrihost')
    expect(result.metadata.shop_benchmark.axxess?.priceInclVat).toBe(2499)
  })
})
