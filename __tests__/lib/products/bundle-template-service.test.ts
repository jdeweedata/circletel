import type { ProductLineWithRelations } from '@/lib/types/product-lines';
import { flyerChip, isFlyerLine } from '@/lib/products/bundle-template-service';

function line(
  overrides: Partial<ProductLineWithRelations> = {}
): ProductLineWithRelations {
  return {
    id: '1',
    code: 'otg',
    name: 'OTG — On the Go',
    lifecycle_stage: 'draft',
    sellability: 'sell_now',
    revenue_model: 'hybrid',
    channel: 'skytel_dealer',
    gate1_eligible: true,
    msc_flag: false,
    target_market: 'soho',
    list_arpu_zar: 346.96,
    list_arpu_incl_vat_zar: 399,
    min_margin_pct: 25,
    cps_path: null,
    brd_path: null,
    fsd_path: null,
    cps_status: 'missing',
    brd_status: 'missing',
    fsd_status: 'missing',
    cps_version: null,
    brd_version: null,
    fsd_version: null,
    brd_required: true,
    fsd_required: false,
    finance_approved_at: null,
    finance_approved_by: null,
    finance_approval_notes: null,
    live_mrr_match: null,
    price_drift_notes: null,
    notes: null,
    submitted_for_approval_at: null,
    submitted_for_approval_by: null,
    default_term_months: 12,
    default_helios_includes_cpe: false,
    default_m365_seats: 1,
    default_connectivity_cost_excl: 174,
    billed_incl_vat_zar: 399,
    published_package_id: null,
    sales_blurb: null,
    published_defaults: null,
    created_at: '2026-08-18T00:00:00Z',
    updated_at: '2026-08-18T00:00:00Z',
    skus: [],
    bundle_components: [],
    ...overrides,
  };
}

describe('flyerChip', () => {
  it('labels a draft as working', () => {
    expect(flyerChip(line())).toBe('working');
  });

  it('labels a sent draft as waiting', () => {
    expect(
      flyerChip(line({ submitted_for_approval_at: '2026-08-18T00:00:00Z' }))
    ).toBe('waiting');
  });

  it('labels an active published flyer as ready', () => {
    expect(
      flyerChip(
        line({
          lifecycle_stage: 'active',
          finance_approved_at: '2026-08-18T00:00:00Z',
          published_defaults: {
            termMonths: 12,
            heliosIncludesCpe: false,
            m365Seats: 1,
            connectivityCostExcl: 174,
            billedInclVat: 399,
          },
        })
      )
    ).toBe('ready');
  });

  it('labels a live flyer with a pending price change', () => {
    expect(
      flyerChip(
        line({
          lifecycle_stage: 'active',
          published_defaults: {
            termMonths: 12,
            heliosIncludesCpe: false,
            m365Seats: 1,
            connectivityCostExcl: 174,
            billedInclVat: 399,
          },
          submitted_for_approval_at: '2026-08-18T12:00:00Z',
          finance_approved_at: null,
        })
      )
    ).toBe('price_change');
  });
});

describe('isFlyerLine', () => {
  it('always includes OTG even without a BOM yet', () => {
    expect(isFlyerLine(line({ bundle_components: [], billed_incl_vat_zar: null }))).toBe(
      true
    );
  });
});
