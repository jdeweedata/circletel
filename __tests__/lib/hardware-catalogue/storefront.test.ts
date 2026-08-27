import { describe, expect, it } from '@jest/globals'

import {
  isStorefrontPublished,
  leadTimeFromPromote,
  omitDealerCost,
  storefrontAvailability,
} from '@/lib/hardware-catalogue/storefront'

describe('isStorefrontPublished', () => {
  it('allows only published Promoted rows', () => {
    expect(isStorefrontPublished('published')).toBe(true)
    expect(isStorefrontPublished('draft')).toBe(false)
    expect(isStorefrontPublished('archived')).toBe(false)
    expect(isStorefrontPublished(null)).toBe(false)
  })
})

describe('leadTimeFromPromote', () => {
  it('uses Promote metadata when present', () => {
    expect(
      leadTimeFromPromote({
        metadata: { lead_time_business_days: { min: 5, max: 7 } },
      })
    ).toBe('5–7 business days')
  })

  it('falls back to terms delivery estimate, then the 5–7 default', () => {
    expect(
      leadTimeFromPromote({ deliveryEstimate: '3 business days' })
    ).toBe('3 business days')
    expect(leadTimeFromPromote({})).toBe('5–7 business days')
  })
})

describe('storefrontAvailability', () => {
  it('treats Esquire Yes/No as available, not unit count', () => {
    expect(
      storefrontAvailability({ stockTotal: 1, booleanStock: true })
    ).toEqual({
      inStock: true,
      label: 'Available',
      showBranchCounts: false,
    })
  })

  it('does not say “only 1 left” for boolean stock', () => {
    const result = storefrontAvailability({
      stockTotal: 1,
      booleanStock: true,
    })
    expect(result.label).not.toMatch(/only/i)
  })
})

describe('omitDealerCost', () => {
  it('strips supplier cost fields from a storefront payload', () => {
    const row = omitDealerCost({
      name: 'ZTE G5C',
      retail_price: 2499,
      cost_price: 1999,
      best_supplier_cost: 1999,
    })

    expect(row).toEqual({ name: 'ZTE G5C', retail_price: 2499 })
    expect(row).not.toHaveProperty('cost_price')
    expect(row).not.toHaveProperty('best_supplier_cost')
  })
})
