import { describe, expect, it } from '@jest/globals';
import {
  isCampaignVisible,
  mapCampaignRow,
  type CampaignReadRow,
} from '@/lib/publishing/public-read';

const baseOffer = {
  slug: 'skyfibre-100',
  title: 'SkyFibre 100',
  customer_type: 'business',
  source_uid: 'service_packages:svc-100',
  media: {
    description: 'Fast business connectivity',
    image: 'https://example.com/skyfibre.jpg',
    total_cost: 1,
  },
  offer_pricing_snapshot: { resolved_price: 1299 },
  offer_components: [{ role: 'primary', source_type: 'service_package' }],
};

function campaign(overrides: Partial<CampaignReadRow> = {}): CampaignReadRow {
  return {
    slug: 'july-business-fibre',
    title: 'July Business Fibre Deals',
    page_type: 'promotion',
    template: 'promotion_landing',
    status: 'published',
    summary: 'Upgrade your office connection this month.',
    content: {
      hero: {
        eyebrow: 'Limited offer',
        title: 'Upgrade your office connectivity',
        subtitle: 'Business-ready fibre with transparent pricing.',
        image: 'https://example.com/hero.jpg',
      },
      sections: [
        { heading: 'Why this offer', body: 'Built for growing teams.' },
      ],
      internalMarginNote: 'do not leak',
    },
    seo_metadata: {
      title: 'Business Fibre Deals',
      description: 'Business fibre offers from CircleTel.',
      cost_buildup: [],
    },
    published_at: '2026-06-01T00:00:00.000Z',
    valid_from: '2026-06-01T00:00:00.000Z',
    valid_until: '2026-07-01T00:00:00.000Z',
    campaign_offer_slots: [
      {
        position: 1,
        label: 'Featured',
        badge: 'Launch offer',
        cta_label: 'Check availability',
        offers: baseOffer,
      },
    ],
    ...overrides,
  };
}

describe('publishing public read helpers', () => {
  it('only exposes published campaigns inside their validity window', () => {
    const now = new Date('2026-06-15T12:00:00.000Z');
    expect(isCampaignVisible(campaign(), now)).toBe(true);
    expect(isCampaignVisible(campaign({ status: 'draft' }), now)).toBe(false);
    expect(isCampaignVisible(campaign({ published_at: '2026-06-16T00:00:00.000Z' }), now)).toBe(false);
    expect(isCampaignVisible(campaign({ valid_until: '2026-06-10T00:00:00.000Z' }), now)).toBe(false);
  });

  it('maps a campaign into a public Teljoy-style page model with sanitized offers', () => {
    const mapped = mapCampaignRow(campaign(), new Date('2026-06-15T12:00:00.000Z'));
    expect(mapped).toEqual({
      slug: 'july-business-fibre',
      title: 'July Business Fibre Deals',
      pageType: 'promotion',
      template: 'promotion_landing',
      summary: 'Upgrade your office connection this month.',
      hero: {
        eyebrow: 'Limited offer',
        title: 'Upgrade your office connectivity',
        subtitle: 'Business-ready fibre with transparent pricing.',
        image: 'https://example.com/hero.jpg',
      },
      sections: [
        { heading: 'Why this offer', body: 'Built for growing teams.' },
      ],
      seo: {
        title: 'Business Fibre Deals',
        description: 'Business fibre offers from CircleTel.',
      },
      offers: [
        {
          slotLabel: 'Featured',
          badge: 'Launch offer',
          ctaLabel: 'Check availability',
          offer: {
            slug: 'skyfibre-100',
            title: 'SkyFibre 100',
            customerType: 'business',
            priceInclVat: 1493.85,
            vatRate: 0.15,
            vatLabel: 'incl. VAT',
            description: 'Fast business connectivity',
            image: 'https://example.com/skyfibre.jpg',
          },
        },
      ],
      validUntil: '2026-07-01T00:00:00.000Z',
    });
  });

  it('returns null for invisible campaigns or offers that fail public offer guards', () => {
    const invisible = mapCampaignRow(campaign({ status: 'archived' }), new Date('2026-06-15T12:00:00.000Z'));
    expect(invisible).toBeNull();

    const unsafeOffer = campaign({
      campaign_offer_slots: [
        {
          position: 1,
          label: 'Hardware',
          badge: null,
          cta_label: null,
          offers: { ...baseOffer, source_uid: 'circletel_hardware_products:1' },
        },
      ],
    });
    expect(mapCampaignRow(unsafeOffer, new Date('2026-06-15T12:00:00.000Z'))?.offers).toEqual([]);
  });
});
