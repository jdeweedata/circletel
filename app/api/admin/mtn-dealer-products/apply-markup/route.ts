import { NextRequest, NextResponse } from 'next/server';
import { applyMarkupRules, getMarkupSummary } from '@/lib/products/markup-rules-service';
import type { MTNDealerBusinessUseCase } from '@/lib/types/mtn-dealer-products';

// POST /api/admin/mtn-dealer-products/apply-markup
// Applies category-based markup rules to curated deals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const { use_case_filter, dry_run } = body as {
      use_case_filter?: MTNDealerBusinessUseCase;
      dry_run?: boolean;
    };

    const result = await applyMarkupRules({
      use_case_filter,
      dry_run: dry_run ?? false,
    });

    return NextResponse.json({
      success: true,
      dry_run: dry_run ?? false,
      result,
    });
  } catch (error) {
    console.error('[apply-markup] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Markup application failed' },
      { status: 500 }
    );
  }
}

// GET /api/admin/mtn-dealer-products/apply-markup
// Returns current markup summary across all deals
export async function GET() {
  try {
    const summary = await getMarkupSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('[apply-markup] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get markup summary' },
      { status: 500 }
    );
  }
}
