import { NextRequest, NextResponse } from 'next/server';
import { autoCurateDeals, classifyAllDeals } from '@/lib/products/auto-curation-service';
import type { AutoCurationRules } from '@/lib/types/mtn-dealer-products';

// POST /api/admin/mtn-dealer-products/auto-curate
// Runs auto-curation rules to filter 10K+ deals down to ~200-500 recommended deals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const { rules, classify_only } = body as {
      rules?: Partial<AutoCurationRules>;
      classify_only?: boolean;
    };

    // Option to only classify use cases without changing curation status
    if (classify_only) {
      const counts = await classifyAllDeals();
      return NextResponse.json({
        success: true,
        action: 'classify_only',
        classified_by_use_case: counts,
      });
    }

    // Run full auto-curation with optional custom rules
    const result = await autoCurateDeals(
      rules
        ? {
            device_statuses: rules.device_statuses ?? ['Available', 'CTB'],
            contract_terms: rules.contract_terms ?? [24, 36],
            min_price_incl_vat: rules.min_price_incl_vat ?? 300,
            max_price_incl_vat: rules.max_price_incl_vat ?? 2000,
            require_current_promo: rules.require_current_promo ?? true,
            require_helios_or_ilula: rules.require_helios_or_ilula ?? true,
          }
        : undefined
    );

    return NextResponse.json({
      success: true,
      action: 'auto_curate',
      result,
    });
  } catch (error) {
    console.error('[auto-curate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Auto-curation failed' },
      { status: 500 }
    );
  }
}
