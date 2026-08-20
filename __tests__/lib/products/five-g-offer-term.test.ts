import {
  CIRCLECONNECT_5G_CATALOGUE,
  OP19627_PROMOS,
  getFiveGOfferTerm,
  getFiveGCardDataCap,
  grossMarginPct,
} from '@/lib/products/five-g-offer-term';

describe('getFiveGOfferTerm', () => {
  it('labels 24-month contract with router as 24-month + router', () => {
    expect(
      getFiveGOfferTerm({
        router_included: true,
        contract_type: '24-month-contract',
        contract_duration: '24 Months',
      })
    ).toEqual({
      kind: 'contract_router',
      label: '24-month + router',
      priceHint: 'per month incl. VAT · 24-month contract',
    });
  });

  it('labels month-to-month without router as month-to-month SIM only', () => {
    expect(
      getFiveGOfferTerm({
        router_included: false,
        contract_type: 'month-to-month',
        contract_duration: 'Month-to-Month',
      })
    ).toEqual({
      kind: 'mtm_sim',
      label: 'Month-to-month SIM only',
      priceHint: 'per month incl. VAT · no contract',
    });
  });

  it('does not treat a router package as month-to-month', () => {
    const term = getFiveGOfferTerm({
      router_included: true,
      contract_type: '24-month-contract',
    });
    expect(term.kind).toBe('contract_router');
    expect(term.label).not.toMatch(/month-to-month/i);
  });
});

describe('getFiveGCardDataCap', () => {
  it('shows 500 GB for a hard-capped FWA package instead of uncapped', () => {
    expect(
      getFiveGCardDataCap({
        data_cap: '500GB hard cap',
        data_cap_gb: 500,
        capped: true,
      })
    ).toEqual({ displayData: '500', unit: 'GB', caption: 'Monthly Data' });
  });

  it('shows uncapped for speed-uncapped 5G with FUP', () => {
    expect(
      getFiveGCardDataCap({
        data_cap: 'Uncapped (500GB FUP)',
        fup_limit_gb: 500,
        capped: false,
      })
    ).toEqual({ displayData: '∞', unit: null, caption: 'Uncapped' });
  });
});

describe('CircleConnect 5G catalogue vs August 2026 Helios', () => {
  it('uses current Helios incl-VAT cost as cost_price_zar', () => {
    expect(
      CIRCLECONNECT_5G_CATALOGUE.map((row) => [row.sku, row.dealId, row.costInclVat])
    ).toEqual([
      ['CC-5G-CON-035', '202604EBU0002', 489],
      ['CC-5G-M2M-035', '2026EBU00221', 539],
      ['CC-5G-M2M-FWA', '2026EBU00223', 649],
      ['CC-5G-CON-060', 'EBUOP:19627001', 579],
      ['CC-5G-M2M-060', '2026EBU00224', 759],
      ['CC-5G-CON-BE', '202604EBU0005', 1029],
      ['CC-5G-M2M-BE', '2026EBU00225', 1079],
    ]);
  });

  it('sells at Helios pass-through incl VAT so the storefront is not below cost', () => {
    for (const row of CIRCLECONNECT_5G_CATALOGUE) {
      expect(row.sellInclVat).toBe(row.costInclVat);
      expect(row.sellInclVat).toBeGreaterThan(400);
      expect(grossMarginPct(row.sellInclVat, row.costInclVat)).toBe(0);
    }
  });

  it('keeps 24-month + router cheaper than the matching month-to-month SIM', () => {
    const bySku = Object.fromEntries(
      CIRCLECONNECT_5G_CATALOGUE.map((row) => [row.sku, row])
    );
    expect(bySku['CC-5G-CON-035'].sellInclVat).toBeLessThan(bySku['CC-5G-M2M-035'].sellInclVat);
    expect(bySku['CC-5G-CON-060'].sellInclVat).toBeLessThan(bySku['CC-5G-M2M-060'].sellInclVat);
    expect(bySku['CC-5G-CON-BE'].sellInclVat).toBeLessThan(bySku['CC-5G-M2M-BE'].sellInclVat);
  });
});

describe('OP19627 public promos vs MTN retail', () => {
  it('sells at SkyTel cost and undercuts MTN business shop', () => {
    expect(
      OP19627_PROMOS.map((row) => [
        row.sku,
        row.dealId,
        row.costInclVat,
        row.promoSellInclVat,
        row.mtnRetailInclVat,
        grossMarginPct(row.promoSellInclVat, row.costInclVat),
      ])
    ).toEqual([
      ['CC-OP-UNC-20', 'EBUOP:19627000', 499, 499, 599, 0],
      ['CC-5G-CON-060', 'EBUOP:19627001', 579, 579, 699, 0],
    ]);
  });

  it('saves R100 / R120 vs MTN and stays below the 25% floor if sold at MTN', () => {
    const [twenty, sixty] = OP19627_PROMOS;
    expect(twenty.mtnRetailInclVat - twenty.promoSellInclVat).toBe(100);
    expect(sixty.mtnRetailInclVat - sixty.promoSellInclVat).toBe(120);
    expect(grossMarginPct(twenty.mtnRetailInclVat, twenty.costInclVat)).toBe(16.7);
    expect(grossMarginPct(sixty.mtnRetailInclVat, sixty.costInclVat)).toBe(17.2);
  });
});
