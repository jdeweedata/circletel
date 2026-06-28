import { describe, it, expect } from '@jest/globals';
import { mapOfferRow, type OfferReadRow } from '@/lib/offers/public-read';

function row(over: Partial<OfferReadRow> = {}): OfferReadRow {
  return {
    slug: 'skyfibre-home-50',
    title: 'SkyFibre Home 50/50',
    customer_type: 'consumer',
    source_uid: 'service_packages:abc',
    media: {},
    offer_pricing_snapshot: { resolved_price: 1899 },
    offer_components: [{ role: 'primary', source_type: 'service_package' }],
    ...over,
  };
}

describe('mapOfferRow — sanitization + VAT + guard', () => {
  it('maps a service-package offer to a VAT-inclusive public DTO', () => {
    const r = mapOfferRow(row());
    expect(r).toEqual({
      slug: 'skyfibre-home-50',
      title: 'SkyFibre Home 50/50',
      customerType: 'consumer',
      priceInclVat: 2183.85,
      vatRate: 0.15,
      vatLabel: 'incl. VAT',
    });
  });

  it('never includes cost/margin/provenance keys', () => {
    const r = mapOfferRow(row()) as Record<string, unknown>;
    for (const k of ['resolved_price', 'priceExclVat', 'total_cost', 'margin_pct',
      'cost_buildup', 'guardrail_status', 'source_uid', 'source_type', 'source_id']) {
      expect(r).not.toHaveProperty(k);
    }
  });

  it('whitelists only media.description and media.image strings', () => {
    const r = mapOfferRow(row({ media: { description: 'Fast fibre', image: 'http://img/x.jpg', secret: 'NO', cost: 123 } }))!;
    expect(r.description).toBe('Fast fibre');
    expect(r.image).toBe('http://img/x.jpg');
    expect(r as Record<string, unknown>).not.toHaveProperty('secret');
    expect(r as Record<string, unknown>).not.toHaveProperty('cost');
  });

  it('omits description/image when media is empty or non-string', () => {
    const r = mapOfferRow(row({ media: { description: 42 as unknown as string } }))!;
    expect(r.description).toBeUndefined();
    expect(r.image).toBeUndefined();
  });

  it('returns null when source_uid is not a service_packages: row (admin_products excluded)', () => {
    expect(mapOfferRow(row({ source_uid: 'admin_products:xyz' }))).toBeNull();
    expect(mapOfferRow(row({ source_uid: 'mtn_dealer_products:1' }))).toBeNull();
  });

  it('returns null when the primary component is not source_type service_package', () => {
    expect(mapOfferRow(row({ offer_components: [{ role: 'primary', source_type: 'hardware' }] }))).toBeNull();
  });

  it('tolerates the snapshot arriving as a single-element array', () => {
    const r = mapOfferRow(row({ offer_pricing_snapshot: [{ resolved_price: 1899 }] as unknown as OfferReadRow['offer_pricing_snapshot'] }))!;
    expect(r.priceInclVat).toBe(2183.85);
  });

  it('returns null when no snapshot price exists', () => {
    expect(mapOfferRow(row({ offer_pricing_snapshot: null as unknown as OfferReadRow['offer_pricing_snapshot'] }))).toBeNull();
  });
});
