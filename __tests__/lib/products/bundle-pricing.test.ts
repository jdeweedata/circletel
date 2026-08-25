import {
  allocateBundleLineItems,
  FINANCE_MARGIN_FLOOR_PCT,
  inclToExcl,
  priceBundle,
} from '@/lib/products/bundle-pricing';
import {
  FIXTURE_CIRCLECONNECT,
  FIXTURE_OTG,
  FIXTURE_SOHO_MIFI,
} from './bundle-template-fixtures';

describe('priceBundle', () => {
  it('does not amortise CPE when the Helios deal already includes a router', () => {
    const result = priceBundle({
      template: FIXTURE_CIRCLECONNECT,
      termMonths: 24,
      heliosIncludesCpe: true,
      cpeCostExcl: 1200,
      addCpeUpgrade: false,
      m365Seats: 0,
    });
    expect(result.cpeCharged).toBe(false);
    expect(result.cpeAmortisedMonthlyExcl).toBe(0);
    expect(result.cpeCashOutExcl).toBe(0);
    expect(result.billedInclVat).toBe(489);
    expect(result.billedExclVat).toBe(inclToExcl(489));
    expect(result.priceDriftNote).toMatch(/Catalogue list/);
  });

  it('adds Rectron CPE only as an explicit upgrade on a router-included deal', () => {
    const result = priceBundle({
      template: FIXTURE_CIRCLECONNECT,
      termMonths: 24,
      heliosIncludesCpe: true,
      cpeCostExcl: 1200,
      addCpeUpgrade: true,
      m365Seats: 0,
    });
    expect(result.cpeCharged).toBe(true);
    expect(result.cpeCashOutExcl).toBe(1200);
    expect(result.cpeAmortisedMonthlyExcl).toBe(50);
    expect(result.month1CashOutExcl).toBe(
      result.connectivityCostExcl + 1200 + result.m365CspMonthlyExcl
    );
  });

  it('includes M365 CSP cost on OTG and flags margin below the finance floor', () => {
    const result = priceBundle({
      template: FIXTURE_OTG,
      termMonths: 12,
      heliosIncludesCpe: false,
      cpeCostExcl: 360,
      addCpeUpgrade: false,
      m365Seats: 1,
    });
    expect(result.m365CspMonthlyExcl).toBe(270);
    expect(result.cpeAmortisedMonthlyExcl).toBe(30);
    expect(result.directCostExcl).toBe(
      result.connectivityCostExcl + 30 + 270
    );
    expect(result.belowFloor).toBe(true);
    expect(result.floorPct).toBe(FINANCE_MARGIN_FLOOR_PCT);
    expect(result.marginPct).toBeLessThan(FINANCE_MARGIN_FLOOR_PCT);
  });

  it('uses flyer incl-VAT as the billed price for OTG', () => {
    expect(FIXTURE_OTG.billedInclVat).toBe(399);
    const result = priceBundle({
      template: FIXTURE_OTG,
      termMonths: 12,
      heliosIncludesCpe: false,
      cpeCostExcl: 0,
      addCpeUpgrade: false,
      m365Seats: 0,
    });
    expect(result.billedInclVat).toBe(399);
  });

  it('prices a custom flyer from template numbers, not hardcoded codes', () => {
    const result = priceBundle({
      template: FIXTURE_SOHO_MIFI,
      termMonths: 12,
      heliosIncludesCpe: false,
      cpeCostExcl: 400,
      addCpeUpgrade: false,
      m365Seats: 0,
    });
    expect(result.billedInclVat).toBe(499);
    expect(result.connectivityCostExcl).toBe(174);
    expect(result.cpeAmortisedMonthlyExcl).toBeCloseTo(400 / 12, 2);
    expect(result.m365CspMonthlyExcl).toBe(0);
    expect(result.directCostExcl).toBeCloseTo(174 + 400 / 12, 2);
  });

  it('adds unknown BOM roles into monthly cost without crashing', () => {
    const result = priceBundle({
      template: {
        ...FIXTURE_SOHO_MIFI,
        components: [
          { role: 'connectivity', costExcl: 174, amortiseMonths: null, heliosIncludesCpe: false },
          { role: 'labour', costExcl: 50, amortiseMonths: null, heliosIncludesCpe: false },
        ],
      },
      termMonths: 12,
      heliosIncludesCpe: false,
      cpeCostExcl: 0,
      addCpeUpgrade: false,
      m365Seats: 0,
    });
    expect(result.extraRoleCostExcl).toBe(50);
    expect(result.directCostExcl).toBe(224);
  });

  it('allocates quote lines so they sum to billed excl VAT', () => {
    const pricing = priceBundle({
      template: FIXTURE_OTG,
      termMonths: 12,
      heliosIncludesCpe: false,
      cpeCostExcl: 360,
      addCpeUpgrade: false,
      m365Seats: 1,
    });
    const lines = allocateBundleLineItems(pricing, 1);
    const sum =
      lines.connectivityMonthlyExcl +
      lines.cpeMonthlyExcl +
      lines.m365MonthlyExclPerSeat * lines.m365Seats;
    expect(sum).toBeCloseTo(pricing.billedExclVat, 2);
    expect(lines.m365MonthlyExcl).toBeLessThan(pricing.billedExclVat);
  });

  it('does not put a second CPE line when Helios already includes the router', () => {
    const pricing = priceBundle({
      template: FIXTURE_CIRCLECONNECT,
      termMonths: 24,
      heliosIncludesCpe: true,
      cpeCostExcl: 1200,
      addCpeUpgrade: false,
      m365Seats: 0,
    });
    const lines = allocateBundleLineItems(pricing, 0);
    expect(lines.cpeMonthlyExcl).toBe(0);
    expect(lines.connectivityMonthlyExcl).toBe(pricing.billedExclVat);
  });
});
