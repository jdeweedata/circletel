import {
  computeSkuContribution,
  evaluateDocsSellability,
  evaluateDraftToActive,
  evaluateTransition,
  isSalesQuotePackLine,
  monthlyCostAmount,
} from '@/lib/products/product-line-gates';
import type { ProductLine } from '@/lib/types/product-lines';

function line(overrides: Partial<ProductLine> = {}): ProductLine {
  return {
    id: '1',
    code: 'skyfibre-smb',
    name: 'SkyFibre SMB',
    lifecycle_stage: 'draft',
    sellability: 'selective',
    revenue_model: 'circletel_mrr',
    channel: 'mtn_wholesale',
    gate1_eligible: true,
    msc_flag: true,
    target_market: 'smb',
    list_arpu_zar: 1899,
    list_arpu_incl_vat_zar: 2183.85,
    min_margin_pct: 25,
    cps_path: 'products/connectivity/fixed-wireless/SkyFibre_SMB_Commercial_Product_Spec_v2_0.md',
    brd_path: 'products/connectivity/fixed-wireless/SkyFibre_SMB_Business_Rules_Document_v1_0.md',
    fsd_path: null,
    cps_status: 'current',
    brd_status: 'current',
    fsd_status: 'missing',
    cps_version: '2.0',
    brd_version: '1.0',
    fsd_version: null,
    brd_required: true,
    fsd_required: false,
    finance_approved_at: '2026-08-16T00:00:00Z',
    finance_approved_by: 'cfo',
    finance_approval_notes: null,
    live_mrr_match: 'SkyFibre',
    price_drift_notes: null,
    notes: null,
    created_at: '2026-08-16T00:00:00Z',
    updated_at: '2026-08-16T00:00:00Z',
    ...overrides,
  };
}

describe('evaluateDraftToActive', () => {
  it('allows a complete Gate 1 line without FSD', () => {
    const result = evaluateDraftToActive(line());
    expect(result.allowed).toBe(true);
  });

  it('blocks missing CPS even if finance signed', () => {
    const result = evaluateDraftToActive(line({ cps_status: 'missing', cps_path: null }));
    expect(result.allowed).toBe(false);
    expect(result.items.find((i) => i.label === 'CPS current')?.ok).toBe(false);
  });

  it('blocks missing finance approval', () => {
    const result = evaluateDraftToActive(line({ finance_approved_at: null }));
    expect(result.allowed).toBe(false);
  });

  it('requires FSD only when fsd_required', () => {
    const without = evaluateDraftToActive(line({ fsd_required: false, fsd_status: 'missing' }));
    expect(without.allowed).toBe(true);
    const withFsd = evaluateDraftToActive(line({ fsd_required: true, fsd_status: 'missing' }));
    expect(withFsd.allowed).toBe(false);
  });
});

describe('evaluateTransition', () => {
  it('rejects illegal jumps', () => {
    const result = evaluateTransition(line({ lifecycle_stage: 'idea' }), 'active');
    expect(result.allowed).toBe(false);
  });

  it('requires a reason for ACTIVE → INACTIVE', () => {
    const blocked = evaluateTransition(line({ lifecycle_stage: 'active' }), 'inactive');
    expect(blocked.allowed).toBe(false);
    const ok = evaluateTransition(line({ lifecycle_stage: 'active' }), 'inactive', {
      reason: 'Pricing review',
    });
    expect(ok.allowed).toBe(true);
  });

  it('blocks archive while open quotes exist', () => {
    const result = evaluateTransition(line({ lifecycle_stage: 'inactive' }), 'archived', {
      openQuotes: 2,
    });
    expect(result.allowed).toBe(false);
  });
});

describe('evaluateDocsSellability', () => {
  it('blocks an unlinked SKU', () => {
    const result = evaluateDocsSellability(null);
    expect(result.allowed).toBe(false);
    expect(result.items[0]?.label).toBe('On a portfolio line');
  });

  it('allows SkyFibre SMB when CPS and required BRD are current without finance', () => {
    const result = evaluateDocsSellability(line({ finance_approved_at: null, fsd_status: 'current' }));
    expect(result.allowed).toBe(true);
  });

  it('blocks stale CPS even when BRD is current', () => {
    const result = evaluateDocsSellability(line({ cps_status: 'stale' }));
    expect(result.allowed).toBe(false);
  });

  it('blocks missing BRD when brd_required', () => {
    const result = evaluateDocsSellability(line({ brd_status: 'missing', brd_path: null }));
    expect(result.allowed).toBe(false);
  });

  it('blocks missing FSD only when fsd_required', () => {
    const optional = evaluateDocsSellability(line({ fsd_required: false, fsd_status: 'missing' }));
    expect(optional.allowed).toBe(true);
    const required = evaluateDocsSellability(line({ fsd_required: true, fsd_status: 'missing' }));
    expect(required.allowed).toBe(false);
  });
});

describe('monthlyCostAmount', () => {
  it('uses amortised monthly for install and raw amount for monthly rows', () => {
    expect(monthlyCostAmount({ recurrence: 'monthly', cost_amount: 599, amortised_monthly_cost: 599 })).toBe(599);
    expect(monthlyCostAmount({ recurrence: 'amortised', cost_amount: 2550, amortised_monthly_cost: 212.5 })).toBe(212.5);
    expect(monthlyCostAmount({ recurrence: 'once_off', cost_amount: 300, amortised_monthly_cost: 300 })).toBe(0);
  });
});

describe('computeSkuContribution', () => {
  it('returns contribution from summed monthly COS', () => {
    const result = computeSkuContribution(1499, [
      { recurrence: 'monthly', cost_amount: 599, amortised_monthly_cost: 599 },
      { recurrence: 'monthly', cost_amount: 50, amortised_monthly_cost: 50 },
      { recurrence: 'monthly', cost_amount: 45, amortised_monthly_cost: 45 },
      { recurrence: 'monthly', cost_amount: 10.96, amortised_monthly_cost: 10.96 },
      { recurrence: 'amortised', cost_amount: 2550, amortised_monthly_cost: 212.5 },
      { recurrence: 'monthly', cost_amount: 10, amortised_monthly_cost: 10 },
    ]);
    expect(result.cost_missing).toBe(false);
    expect(result.monthly_cos).toBe(927.46);
    expect(result.contribution).toBe(571.54);
    expect(result.margin_pct).toBe(38.1);
  });

  it('does not report 100% margin when COS is missing', () => {
    const result = computeSkuContribution(1899, [], null);
    expect(result.cost_missing).toBe(true);
    expect(result.monthly_cos).toBeNull();
    expect(result.contribution).toBeNull();
    expect(result.margin_pct).toBeNull();
  });
});

describe('isSalesQuotePackLine', () => {
  it('shows OTG and CircleConnect 5G Essential, hides not-Gate-1', () => {
    expect(isSalesQuotePackLine(line({ code: 'otg', gate1_eligible: true, sellability: 'sell_now' }))).toBe(true);
    expect(
      isSalesQuotePackLine(
        line({ code: 'circleconnect-5g-essential', gate1_eligible: true, sellability: 'sell_now' })
      )
    ).toBe(true);
    expect(
      isSalesQuotePackLine(line({ code: 'workconnect', gate1_eligible: false, sellability: 'not_gate_1' }))
    ).toBe(false);
  });
});
