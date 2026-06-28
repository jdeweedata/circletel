import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderToString } from 'react-dom/server';

// ts-jest does not reliably hoist and bind factory mocks with @/-aliased ESM-interop modules.
// Use jest.resetModules() + dynamic import() in beforeEach to ensure a fresh, correctly-bound mock per test.
jest.mock('@/lib/offers/public-read');
jest.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
jest.mock('@/components/layout/Footer', () => ({ Footer: () => null }));

describe('/offers list page', () => {
  let listPublicOffers: any;
  let OffersPage: any;

  beforeEach(async () => {
    jest.resetModules();
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

    expect(html).toContain('incl. VAT');
    expect(html).toContain('SkyFibre 50');
    for (const k of ['total_cost', 'margin_pct', 'cost_buildup', 'source_uid', 'resolved_price']) {
      expect(html).not.toContain(k);
    }
  });
});
