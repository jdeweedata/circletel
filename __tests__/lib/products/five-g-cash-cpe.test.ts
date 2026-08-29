import {
  FIVE_G_CASH_CPE_PRICE_INCL_VAT,
  FIVE_G_CASH_CPE_STORAGE_KEY,
  buildFiveGCashCpeAddon,
  formatFiveGCashCpePrice,
  hasCashCpeCheckout,
  hydrateCashCpeSelectedAddons,
  onceOffFromSelectedAddons,
  selectFiveGCashCpeRouters,
  stripEsquireCdata,
} from '@/lib/products/five-g-cash-cpe';

describe('selectFiveGCashCpeRouters', () => {
  it('lists only published in-stock storefront cash-CPE rows at R2999.99', () => {
    const routers = selectFiveGCashCpeRouters([
      {
        sku: 'G5C',
        name: 'ZTE G5C 5G CPE WiFi Router',
        image_url: '/images/hardware/cpe/zte-g5c.png',
        in_stock: true,
        stock_total: 1,
        status: 'published',
        metadata: { cash_cpe: true, deal_addon_only: true, supplier_sku: 'G5C' },
      },
      {
        sku: 'ZTE-G5B',
        name: 'ZTE G5B 5G Ultra Fast WiFi 6 Router',
        image_url: '/images/hardware/cpe/zte-g5b.png',
        in_stock: true,
        stock_total: 1,
        status: 'published',
        metadata: {},
      },
      {
        sku: 'G5C-DRAFT',
        name: 'ZTE G5C draft',
        in_stock: true,
        stock_total: 1,
        status: 'draft',
        metadata: { cash_cpe: true, supplier_sku: 'G5C' },
      },
    ]);

    expect(routers).toEqual([
      {
        sku: 'G5C',
        name: 'ZTE G5C 5G CPE WiFi Router',
        imageUrl: '/images/hardware/cpe/zte-g5c.png',
        inStock: true,
        sellInclVat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      },
    ]);
  });

  it('drops out-of-stock cash CPE even when flagged', () => {
    expect(
      selectFiveGCashCpeRouters([
        {
          sku: 'G5C',
          name: 'ZTE G5C 5G CPE WiFi Router',
          in_stock: false,
          stock_total: 0,
          status: 'published',
          metadata: { cash_cpe: true, supplier_sku: 'G5C' },
        },
      ])
    ).toEqual([]);
  });
});

describe('cash CPE checkout carry-through', () => {
  it('hydrates the once-off addon from session when packages start empty', () => {
    const addons = hydrateCashCpeSelectedAddons(undefined, {
      dealSku: 'CC-5G-35-SIM',
      router: {
        sku: 'G5C',
        name: 'ZTE G5C 5G CPE WiFi Router',
        imageUrl: '/images/hardware/cpe/zte-g5c.png',
        inStock: true,
        sellInclVat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      },
    });

    expect(onceOffFromSelectedAddons(addons)).toBe(FIVE_G_CASH_CPE_PRICE_INCL_VAT);
    expect(addons[0]?.addon.id).toBe('cash-cpe:G5C');
  });

  it('detects cash CPE from server-trusted flags, not a client amount', () => {
    expect(hasCashCpeCheckout({ cash_cpe: true })).toBe(true);
    expect(hasCashCpeCheckout({ router_sku: 'G5C' })).toBe(true);
    expect(hasCashCpeCheckout({ metadata: { cash_cpe: { sku: 'G5C' } } })).toBe(true);
    expect(hasCashCpeCheckout({ router_sku: 'ZTE-G5B' })).toBe(false);
    expect(hasCashCpeCheckout({})).toBe(false);
  });
});

describe('buildFiveGCashCpeAddon', () => {
  it('adds the router to the deal as a once-off at R2999.99', () => {
    const addon = buildFiveGCashCpeAddon({
      sku: 'G5C',
      name: 'ZTE G5C 5G CPE WiFi Router',
      imageUrl: 'https://cdn.example/g5c.jpg',
      inStock: true,
      sellInclVat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
    });

    expect(addon).toEqual({
      id: 'cash-cpe:G5C',
      name: 'ZTE G5C 5G CPE WiFi Router',
      slug: 'g5c',
      description: 'Approved 5G router. Paid once-off. Month-to-month SIM stays month-to-month.',
      short_description: 'Cash CPE',
      price: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      price_incl_vat: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      price_type: 'once-off',
      compatible_product_categories: ['5G'],
      icon: 'https://cdn.example/g5c.jpg',
      sort_order: 0,
    });
  });
});

describe('formatFiveGCashCpePrice', () => {
  it('keeps the 99 cents the deal is sold at', () => {
    expect(formatFiveGCashCpePrice(FIVE_G_CASH_CPE_PRICE_INCL_VAT)).toBe('R2,999.99');
  });
});

describe('stripEsquireCdata', () => {
  it('unwraps Esquire CDATA leftovers', () => {
    expect(stripEsquireCdata('<![CDATA[G5C]]>')).toBe('G5C');
  });
});

describe('storage key', () => {
  it('uses a dedicated session key for the 5G cash CPE', () => {
    expect(FIVE_G_CASH_CPE_STORAGE_KEY).toBe('five_g_cash_cpe');
  });
});
