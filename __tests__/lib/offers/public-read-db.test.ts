import { getPublicOfferBySlug, listPublicOffers } from '@/lib/offers/public-read'

function makeClient(result: { data: any; error: any }) {
  const createBuilder = () => {
    const builder: any = {
      select: () => createBuilder(),
      eq: () => createBuilder(),
      order: () => createBuilder(),
      then: (onfulfilled: any, onrejected?: any) => Promise.resolve(result).then(onfulfilled, onrejected),
    };
    return builder;
  };
  return { from: () => createBuilder() };
}

const sp = (over: any = {}) => ({
  slug: 'sky-50', title: 'SkyFibre 50', customer_type: 'consumer',
  source_uid: 'service_packages:a', media: {},
  offer_pricing_snapshot: { resolved_price: 1899 },
  offer_components: [{ role: 'primary', source_type: 'service_package' }],
  ...over,
});

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
import { createClient } from '@/lib/supabase/server'

describe('public-read DB functions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listPublicOffers maps + drops excluded sources', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({
      data: [sp(), sp({ slug: 'admin-1', source_uid: 'admin_products:x' })], error: null,
    }))
    const offers = await listPublicOffers('all');
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ slug: 'sky-50', priceInclVat: 2183.85, vatLabel: 'incl. VAT' });
  });

  it('listPublicOffers filters by segment (business excludes consumer-only)', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({
      data: [sp({ slug: 'c', customer_type: 'consumer' }), sp({ slug: 'b', customer_type: 'business' }), sp({ slug: 'x', customer_type: 'both' })],
      error: null,
    }))
    const slugs = (await listPublicOffers('business')).map((o) => o.slug);
    expect(slugs).toEqual(['b', 'x']);
  });

  it('listPublicOffers returns [] on db error', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: null, error: { message: 'boom' } }))
    expect(await listPublicOffers()).toEqual([]);
  });

  it('getPublicOfferBySlug returns the mapped offer', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: [sp()], error: null }))
    expect(await getPublicOfferBySlug('sky-50')).toMatchObject({ slug: 'sky-50', priceInclVat: 2183.85 });
  });

  it('getPublicOfferBySlug returns null for an excluded source', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: [sp({ source_uid: 'admin_products:x' })], error: null }))
    expect(await getPublicOfferBySlug('admin-1')).toBeNull();
  });

  it('getPublicOfferBySlug returns null when not found', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: [], error: null }))
    expect(await getPublicOfferBySlug('nope')).toBeNull();
  });
});
