import { evaluateDraftToActive, evaluateTransition, isSalesQuotePackLine } from '@/lib/products/product-line-gates';
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
