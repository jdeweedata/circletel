import {
  FIVE_G_PROMO_PAGES,
  HUAWEI_H155_386,
  getFiveGContractRouterCards,
  getFiveGListPrice,
  getFiveGListingTitle,
  getFiveGPromoPage,
  getFiveGSellPrice,
  isFiveGPromoSlug,
  splitFiveGDeals,
  type FiveGDealPackage,
} from '@/lib/products/five-g-deals';

function pkg(overrides: Partial<FiveGDealPackage> & Pick<FiveGDealPackage, 'sku' | 'name'>): FiveGDealPackage {
  return {
    id: overrides.sku,
    slug: overrides.sku.toLowerCase(),
    price: 499,
    promotion_price: null,
    metadata: {
      router_included: true,
      contract_type: '24-month-contract',
      contract_duration: '24 Months',
    },
    ...overrides,
  };
}

describe('five-g promo pages', () => {
  it('allowlists only the two OP19627 product URLs', () => {
    expect(Object.keys(FIVE_G_PROMO_PAGES)).toEqual([
      'circleconnect-5g-60-mbps',
      'circleconnect-uncapped-20-mbps',
    ]);
    expect(FIVE_G_PROMO_PAGES['circleconnect-5g-60-mbps'].sku).toBe('CC-5G-CON-060');
    expect(FIVE_G_PROMO_PAGES['circleconnect-uncapped-20-mbps'].sku).toBe('CC-OP-UNC-20');
  });

  it('maps promo slugs to the Huawei H155-386 asset', () => {
    expect(getFiveGPromoPage('circleconnect-5g-60-mbps')?.cpeImage).toBe(HUAWEI_H155_386.image);
    expect(getFiveGPromoPage('circleconnect-uncapped-20-mbps')?.cpeAlt).toContain('Huawei H155-386');
    expect(getFiveGPromoPage('circleconnect-5g-35-mbps')).toBeNull();
    expect(isFiveGPromoSlug('circleconnect-5g-best-effort')).toBe(false);
  });
});

describe('five-g listing prices and grouping', () => {
  it('sells from promotion_price when it undercuts the list price', () => {
    expect(
      getFiveGSellPrice({ price: 699, promotion_price: 649, base_price_zar: 699 })
    ).toBe(649);
    expect(getFiveGListPrice({ price: 599, promotion_price: 549 })).toBe(599);
    expect(getFiveGSellPrice({ price: 489, promotion_price: null })).toBe(489);
  });

  it('features 5G 60 then Uncapped 20, and groups the rest by term', () => {
    const packages: FiveGDealPackage[] = [
      pkg({
        sku: 'CC-5G-CON-035',
        name: 'CircleConnect 5G 35 Mbps',
        slug: 'circleconnect-5g-35-mbps',
        price: 489,
      }),
      pkg({
        sku: 'CC-OP-UNC-20',
        name: 'CircleConnect Uncapped 20 Mbps',
        slug: 'circleconnect-uncapped-20-mbps',
        price: 599,
        promotion_price: 549,
      }),
      pkg({
        sku: 'CC-5G-CON-060',
        name: 'CircleConnect 5G 60 Mbps',
        slug: 'circleconnect-5g-60-mbps',
        price: 699,
        promotion_price: 649,
      }),
      pkg({
        sku: 'CC-5G-M2M-035',
        name: 'CircleConnect 5G 35 Mbps SIM Only',
        slug: 'circleconnect-5g-35-mbps-sim-only',
        price: 539,
        metadata: {
          router_included: false,
          contract_type: 'month-to-month',
          contract_duration: 'Month-to-Month',
        },
      }),
    ];

    const split = splitFiveGDeals(packages);

    expect(split.featured.map((row) => row.sku)).toEqual(['CC-5G-CON-060', 'CC-OP-UNC-20']);
    expect(split.contractRouter.map((row) => row.sku)).toEqual(['CC-5G-CON-035']);
    expect(split.simOnly.map((row) => row.sku)).toEqual(['CC-5G-M2M-035']);
  });

  it('shortens listing titles and keeps 5G 60 in the 24-month row', () => {
    expect(
      getFiveGListingTitle(
        { sku: 'CC-5G-CON-060', name: 'CircleConnect 5G 60 Mbps', speed_down: 60 },
        'featured'
      )
    ).toBe('5G 60 + Huawei CPE');
    expect(
      getFiveGListingTitle(
        { sku: 'CC-5G-CON-035', name: 'CircleConnect 5G 35 Mbps', speed_down: 35 },
        'compact'
      )
    ).toBe('35 Mbps');
    expect(
      getFiveGListingTitle(
        { sku: 'CC-5G-M2M-FWA', name: 'CircleConnect 5G FWA 500 GB', speed_down: 0 },
        'compact'
      )
    ).toBe('FWA 500GB');

    const cards = getFiveGContractRouterCards([
      pkg({ sku: 'CC-5G-CON-035', name: 'CircleConnect 5G 35 Mbps', speed_down: 35, price: 489 }),
      pkg({
        sku: 'CC-OP-UNC-20',
        name: 'CircleConnect Uncapped 20 Mbps',
        speed_down: 20,
        price: 549,
      }),
      pkg({ sku: 'CC-5G-CON-060', name: 'CircleConnect 5G 60 Mbps', speed_down: 60, price: 649 }),
    ]);
    expect(cards.map((row) => row.sku)).toEqual(['CC-5G-CON-035', 'CC-5G-CON-060']);
  });
});
