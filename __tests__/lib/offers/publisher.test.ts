import { describe, it, expect } from '@jest/globals';
import { buildOfferDraftFromUnified } from '@/lib/offers/publisher';
import type { UnifiedProduct } from '@/lib/types/unified-product';

function unified(over: Partial<UnifiedProduct> = {}): UnifiedProduct {
  return {
    uid: 'service_packages:abc',
    id: 'abc',
    sourceTable: 'service_packages',
    source: 'CircleTel',
    name: 'SkyFibre Home 50/50',
    sku: null,
    category: 'Connectivity',
    rawCategory: null,
    type: 'Service',
    status: 'active',
    rawStatus: 'active',
    price: 899,
    cost: 499,
    margin: 44,
    description: null,
    publishTarget: null,
    isPublished: false,
    technology: 'fibre',
    tags: [],
    channels: [],
    isFeatured: false,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    raw: { slug: 'skyfibre-home-50', customer_type: 'consumer' },
    ...over,
  } as UnifiedProduct;
}

describe('buildOfferDraftFromUnified', () => {
  it('maps a service package into a single-primary-component draft', () => {
    const d = buildOfferDraftFromUnified(unified());
    expect(d.sourceUid).toBe('service_packages:abc');
    expect(d.slug).toBe('skyfibre-home-50');
    expect(d.title).toBe('SkyFibre Home 50/50');
    expect(d.customerType).toBe('consumer');
    expect(d.basePrice).toBe(899);
    expect(d.channelVisibility).toEqual(['direct']);
    expect(d.sourceUpdatedAt).toBe('2026-06-01T00:00:00Z');
    expect(d.components).toHaveLength(1);
    expect(d.components[0]).toMatchObject({
      sourceType: 'service_package', sourceId: 'abc', qty: 1, role: 'primary',
      unitCost: 499, unitPrice: 899,
    });
  });

  it('maps each source table to the right offer source type', () => {
    expect(buildOfferDraftFromUnified(unified({ uid: 'circletel_hardware_products:h', id: 'h', sourceTable: 'circletel_hardware_products' })).components[0].sourceType).toBe('hardware');
    expect(buildOfferDraftFromUnified(unified({ uid: 'mtn_dealer_products:m', id: 'm', sourceTable: 'mtn_dealer_products' })).components[0].sourceType).toBe('mtn_deal');
  });

  it('defaults customerType to both and slugifies name when raw lacks them', () => {
    const d = buildOfferDraftFromUnified(unified({ raw: {} }));
    expect(d.customerType).toBe('both');
    expect(d.slug).toBe('skyfibre-home-50-50');
  });
});
