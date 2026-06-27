import { describe, it, expect } from '@jest/globals';
import { resolveOfferPricing } from '@/lib/offers/pricing-resolver';
import type { OfferDraft } from '@/lib/types/offer';

function draft(over: Partial<OfferDraft> = {}): OfferDraft {
  return {
    slug: 'skyfibre-home-50',
    title: 'SkyFibre Home 50/50',
    customerType: 'consumer',
    basePrice: 899,
    channelVisibility: ['direct'],
    sourceUid: 'service_packages:abc',
    sourceUpdatedAt: '2026-06-01T00:00:00.000Z',
    components: [
      { sourceType: 'service_package', sourceId: 'abc', qty: 1, role: 'primary',
        unitCost: 499, unitPrice: 899, label: 'SkyFibre Home 50/50' },
    ],
    ...over,
  };
}

describe('resolveOfferPricing', () => {
  it('builds cost lines, total cost, and margin from components', () => {
    const r = resolveOfferPricing(draft());
    expect(r.resolvedPrice).toBe(899);
    expect(r.totalCost).toBe(499);
    expect(r.costBuildup).toHaveLength(1);
    expect(r.costBuildup[0].lineCost).toBe(499);
    // margin = (899-499)/899*100 = 44.49 -> rounded 44
    expect(r.marginPct).toBe(44);
    expect(r.guardrailStatus).toBe('pass');
  });

  it('sums multi-component cost build-up', () => {
    const r = resolveOfferPricing(draft({
      basePrice: 1500,
      components: [
        { sourceType: 'service_package', sourceId: 'a', qty: 1, role: 'primary', unitCost: 499, unitPrice: 899, label: 'Conn' },
        { sourceType: 'hardware', sourceId: 'b', qty: 2, role: 'addon', unitCost: 200, unitPrice: 300, label: 'Router' },
      ],
    }));
    expect(r.totalCost).toBe(899); // 499 + 200*2
    expect(r.costBuildup[1].lineCost).toBe(400);
  });

  it('flags fail when margin below the floor', () => {
    const r = resolveOfferPricing(draft({ basePrice: 600, components: [
      { sourceType: 'service_package', sourceId: 'a', qty: 1, role: 'primary', unitCost: 499, unitPrice: 600, label: 'Conn' },
    ] }), { marginFloorPct: 25 });
    // margin = (600-499)/600*100 = 16.8 -> 17 < 25
    expect(r.marginPct).toBe(17);
    expect(r.guardrailStatus).toBe('fail');
  });

  it('flags warning inside the floor..floor+5 band', () => {
    const r = resolveOfferPricing(draft({ basePrice: 680, components: [
      { sourceType: 'service_package', sourceId: 'a', qty: 1, role: 'primary', unitCost: 499, unitPrice: 680, label: 'Conn' },
    ] }), { marginFloorPct: 25 });
    // margin = (680-499)/680*100 = 26.6 -> 27, in [25,30)
    expect(r.marginPct).toBe(27);
    expect(r.guardrailStatus).toBe('warning');
  });

  it('fails on non-positive price', () => {
    const r = resolveOfferPricing(draft({ basePrice: 0 }));
    expect(r.marginPct).toBe(0);
    expect(r.guardrailStatus).toBe('fail');
  });
});
