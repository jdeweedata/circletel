import { describe, it, expect } from '@jest/globals';
import { offerProductJsonLd, offersItemListJsonLd } from '@/lib/offers/offer-jsonld';

const base = { slug: 'sky-50', title: 'SkyFibre 50', customerType: 'consumer' as const,
  priceInclVat: 2183.85, vatRate: 0.15, vatLabel: 'incl. VAT' };

describe('offer JSON-LD', () => {
  it('Product uses the VAT-inclusive price and ZAR', () => {
    const ld = offerProductJsonLd(base) as any;
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.price).toBe(2183.85);
    expect(ld.offers.priceCurrency).toBe('ZAR');
    expect(ld.offers.url).toBe('https://www.circletel.co.za/offers/sky-50');
  });

  it('omits image/description when absent and includes them when present', () => {
    expect(offerProductJsonLd(base) as any).not.toHaveProperty('image');
    const ld = offerProductJsonLd({ ...base, image: 'http://i/x.jpg', description: 'fast' }) as any;
    expect(ld.image).toBe('http://i/x.jpg');
    expect(ld.description).toBe('fast');
  });

  it('never leaks internal fields', () => {
    const s = JSON.stringify(offerProductJsonLd({ ...base, description: 'fast' }));
    for (const k of ['resolved_price', 'total_cost', 'margin_pct', 'guardrail_status', 'cost_buildup', 'source_uid', 'source_type', 'source_id', 'unit_cost', 'unit_price', 'priceExclVat']) {
      expect(s).not.toContain(k);
    }
  });

  it('ItemList references each detail URL', () => {
    const ld = offersItemListJsonLd([base]) as any;
    expect(ld['@type']).toBe('ItemList');
    expect(ld.itemListElement[0].url).toBe('https://www.circletel.co.za/offers/sky-50');
  });
});
