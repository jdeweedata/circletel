import { describe, expect, it } from '@jest/globals'

import {
  evaluatePromoteSuggestion,
  isApprovedCpeName,
  isFirstWaveFit,
  isLifestyleCategory,
  normalizeCategory,
} from '@/lib/hardware-catalogue/promote-suggestion'

describe('normalizeCategory', () => {
  it('strips Esquire CDATA wrappers', () => {
    expect(normalizeCategory('<![CDATA[Scented Candles]]>')).toBe(
      'Scented Candles'
    )
  })
})

describe('isLifestyleCategory', () => {
  it.each([
    'Scented Candles',
    '<![CDATA[Birthday Balloons]]>',
    'Samsung S4 Covers',
    'Disney Products',
  ])('excludes %s', (category) => {
    expect(isLifestyleCategory(category)).toBe(true)
  })

  it('does not treat access points as lifestyle', () => {
    expect(isLifestyleCategory('Access Points, Bridges')).toBe(false)
  })
})

describe('isFirstWaveFit', () => {
  it.each([
    'Access Points, Bridges',
    'IP Camera',
    'CCTV (PTZ Camera)',
    'Ethernet Switches PoE',
    'Power UPS Unit',
    'Networking Cables-Cat5',
    'Cable: HDMI',
    'Cable: Power',
    'Network Routers 5G',
  ])('includes %s', (category) => {
    expect(isFirstWaveFit(category)).toBe(true)
  })

  it('holds NAS and OTDR out of first-wave suggestions', () => {
    expect(isFirstWaveFit('Network Attached Storage NAS')).toBe(false)
    expect(isFirstWaveFit('OTDR')).toBe(false)
  })
})

describe('isApprovedCpeName', () => {
  it('matches Approved CPE models even when the category is wrong', () => {
    expect(isApprovedCpeName('ZTE G5C 5G CPE WiFi Router')).toBe(true)
    expect(isApprovedCpeName('Huawei H155-386')).toBe(true)
  })

  it('does not match a scented candle', () => {
    expect(isApprovedCpeName('Vanilla Jar Candle')).toBe(false)
  })
})

describe('evaluatePromoteSuggestion', () => {
  it('suggests an in-stock fit SKU that can publish a List Price', () => {
    const result = evaluatePromoteSuggestion({
      category: 'Access Points, Bridges',
      name: 'Ubiquiti U6 Pro',
      costExclVat: 1800,
      stockTotal: 1,
      alreadyPromoted: false,
    })

    expect(result.suggested).toBe(true)
    expect(result.reason).toBe('fit')
  })

  it('excludes lifestyle categories', () => {
    const result = evaluatePromoteSuggestion({
      category: '<![CDATA[Scented Candles]]>',
      name: 'Vanilla Jar',
      costExclVat: 40,
      stockTotal: 1,
      alreadyPromoted: false,
    })

    expect(result.suggested).toBe(false)
    expect(result.reason).toBe('lifestyle')
  })

  it('excludes already Promoted supplier rows', () => {
    const result = evaluatePromoteSuggestion({
      category: 'Access Points, Bridges',
      name: 'Ubiquiti U6 Pro',
      costExclVat: 1800,
      stockTotal: 1,
      alreadyPromoted: true,
    })

    expect(result.suggested).toBe(false)
    expect(result.reason).toBe('already_promoted')
  })

  it('excludes out-of-stock rows', () => {
    const result = evaluatePromoteSuggestion({
      category: 'IP Camera',
      name: 'Hikvision Dome',
      costExclVat: 900,
      stockTotal: 0,
      alreadyPromoted: false,
    })

    expect(result.suggested).toBe(false)
    expect(result.reason).toBe('out_of_stock')
  })
})
