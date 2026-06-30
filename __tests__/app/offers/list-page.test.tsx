import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderToString } from 'react-dom/server';

// Renders the REAL OfferTabs -> OfferCard tree and the REAL ItemList JSON-LD: only the
// data source (public-read) and the isolated layout chrome (Navbar/Footer) are mocked, so
// the leak assertions below exercise the actual rendered component output, not stubs.
// NOTE: do NOT add jest.resetModules() here — with the real OfferTabs ('use client' + useState)
// rendered under the top-level renderToString, a module reset loads a second React instance
// and React throws "Invalid hook call" from the dispatcher mismatch. clearAllMocks is enough;
// the bare automock of public-read binds correctly through the dynamic import without a reset.
jest.mock('@/lib/offers/public-read');
jest.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));

describe('/offers list page', () => {
  let listPublicOffers: any;
  let OffersPage: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const publicRead = await import('@/lib/offers/public-read');
    listPublicOffers = publicRead.listPublicOffers;
    jest.mocked(listPublicOffers).mockResolvedValue([
      { slug: 'sky-50', title: 'SkyFibre 50', customerType: 'consumer', priceInclVat: 2183.85, vatRate: 0.15, vatLabel: 'incl. VAT' },
      { slug: 'biz-100', title: 'Business 100', customerType: 'business', priceInclVat: 5000, vatRate: 0.15, vatLabel: 'incl. VAT' },
    ]);

    const page = await import('@/app/offers/page');
    OffersPage = page.default;
  });

  it('renders VAT-labelled prices and no internal fields', async () => {
    const ui = await OffersPage();
    const html = renderToString(ui);

    // Real OfferCard markup (initial 'consumer' tab shows the consumer offer).
    expect(html).toContain('incl. VAT');
    expect(html).toContain('SkyFibre 50');
    // Real ItemList JSON-LD <script> rendered by the page (offersItemListJsonLd is not mocked).
    expect(html).toContain('application/ld+json');
    expect(html).toContain('ItemList');
    // Full never-expose set must be absent from the real rendered tree AND the JSON-LD.
    for (const k of ['total_cost', 'margin_pct', 'guardrail_status', 'cost_buildup',
      'source_uid', 'source_type', 'source_id', 'unit_cost', 'unit_price', 'resolved_price', 'priceExclVat']) {
      expect(html).not.toContain(k);
    }
  });
});
