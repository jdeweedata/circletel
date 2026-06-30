import { describe, expect, it } from '@jest/globals';
import {
  buildCampaignInsert,
  buildCampaignSlotInserts,
} from '@/lib/publishing/admin';

describe('publishing admin helpers', () => {
  it('normalizes campaign create input without accepting commercial pricing fields', () => {
    const insert = buildCampaignInsert({
      title: '  July Business Fibre Deals  ',
      pageType: 'promotion',
      template: 'promotion_landing',
      status: 'published',
      summary: ' Fast offers ',
      content: {
        hero: { title: 'Hero' },
        priceInclVat: 1,
        marginPct: 90,
      },
      seo: {
        title: 'SEO',
        description: 'SEO description',
        total_cost: 999,
      },
      channelVisibility: ['website', 'whatsapp'],
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2026-07-01T00:00:00.000Z',
      actorId: 'admin-1',
    });

    expect(insert).toEqual({
      slug: 'july-business-fibre-deals',
      title: 'July Business Fibre Deals',
      page_type: 'promotion',
      template: 'promotion_landing',
      status: 'published',
      summary: 'Fast offers',
      content: { hero: { title: 'Hero' } },
      seo_metadata: { title: 'SEO', description: 'SEO description' },
      channel_visibility: ['website', 'whatsapp'],
      valid_from: '2026-06-01T00:00:00.000Z',
      valid_until: '2026-07-01T00:00:00.000Z',
      published_at: expect.any(String),
      created_by: 'admin-1',
      approved_by: 'admin-1',
      approved_at: expect.any(String),
    });
  });

  it('builds ordered offer slots from selected offers', () => {
    expect(buildCampaignSlotInserts('campaign-1', [
      { offerId: 'offer-2', label: 'Best value', badge: 'Popular', ctaLabel: 'Check coverage' },
      { offerId: 'offer-1' },
    ])).toEqual([
      {
        campaign_id: 'campaign-1',
        offer_id: 'offer-2',
        position: 0,
        label: 'Best value',
        badge: 'Popular',
        cta_label: 'Check coverage',
      },
      {
        campaign_id: 'campaign-1',
        offer_id: 'offer-1',
        position: 1,
        label: null,
        badge: null,
        cta_label: null,
      },
    ]);
  });

  it('rejects missing titles and empty offer selections', () => {
    expect(() => buildCampaignInsert({
      title: '',
      pageType: 'campaign',
      template: 'campaign_article',
      actorId: 'admin-1',
    })).toThrow('Campaign title is required');

    expect(() => buildCampaignSlotInserts('campaign-1', [])).toThrow('At least one Offer is required');
  });
});
