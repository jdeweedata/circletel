import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
// next/link uses useContext internally. Under jest.resetModules() (needed to bind the
// @/-aliased public-read automock) the page tree loads a SECOND React instance while the
// top-level renderToString holds the first → "Invalid hook call". Mocking Link to a plain
// anchor removes the only hook-bearing node from the render; the CTA href is still asserted.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// mock-prefixed name is hoisting-safe inside the factory.
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound() }));

// Bare automock + jest.resetModules() + dynamic import binds the @/-aliased mock reliably
// under this repo's ts-jest config (a top-level factory mock does not bind here). The page
// renders no hook component, so resetModules is safe. offerProductJsonLd is left REAL so the
// rendered Product JSON-LD is exercised for leaks at the page level.
jest.mock('@/lib/offers/public-read');
jest.mock('@/lib/publishing/public-read');

const INTERNAL_FIELDS = [
  'total_cost', 'margin_pct', 'guardrail_status', 'cost_buildup', 'source_uid',
  'source_type', 'source_id', 'unit_cost', 'unit_price', 'resolved_price', 'priceExclVat',
];

describe('/offers/[slug] detail page', () => {
  let getPublicOfferBySlug: any;
  let getPublicCampaignBySlug: any;
  let OfferDetailPage: any;
  let renderToString: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    // Import renderToString from the post-reset registry so it shares the same React
    // instance as the dynamically-imported page tree (avoids the dual-React dispatcher mismatch).
    ({ renderToString } = await import('react-dom/server'));

    const publicRead = await import('@/lib/offers/public-read');
    getPublicOfferBySlug = publicRead.getPublicOfferBySlug;
    const publishingRead = await import('@/lib/publishing/public-read');
    getPublicCampaignBySlug = publishingRead.getPublicCampaignBySlug;
    jest.mocked(getPublicCampaignBySlug).mockResolvedValue(null);

    const page = await import('@/app/offers/[slug]/page');
    OfferDetailPage = page.default;
  });

  it('renders price + VAT label + CTA + real Product JSON-LD, leaks nothing', async () => {
    jest.mocked(getPublicOfferBySlug).mockResolvedValue({
      slug: 'sky-50', title: 'SkyFibre 50', customerType: 'consumer',
      priceInclVat: 2183.85, vatRate: 0.15, vatLabel: 'incl. VAT',
      description: 'Fast and reliable 50Mbps connection',
    } as any);

    const html = renderToString(
      await OfferDetailPage({ params: Promise.resolve({ slug: 'sky-50' }) }),
    );

    expect(html).toContain('incl. VAT');
    expect(html).toContain('/coverage-check?offer=sky-50');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('Product'); // real offerProductJsonLd output
    expect(html).toContain('SkyFibre 50');
    for (const k of INTERNAL_FIELDS) {
      expect(html).not.toContain(k);
    }
  });

  it('calls notFound() when the offer is missing', async () => {
    jest.mocked(getPublicOfferBySlug).mockResolvedValue(null);
    await expect(
      OfferDetailPage({ params: Promise.resolve({ slug: 'nope' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
