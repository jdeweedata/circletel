/**
 * GET /api/admin/products/unified/item?source_table=&id=
 *
 * Single catalogue row plus optional linked product_line (CPS/BRD/FSD, ARPU, live MRR),
 * cost components, contribution, and docs-only sellability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, hasPermission, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { unifiedProductAggregator } from '@/lib/services/unified-product-aggregator';
import {
  getProductLineForSource,
  redactProductLineCosts,
} from '@/lib/products/product-line-service';
import {
  computeSkuContribution,
  evaluateDocsSellability,
  monthlyCostAmount,
} from '@/lib/products/product-line-gates';
import {
  redactUnifiedProductCosts,
  type SkuContributionView,
  type SkuCostComponent,
  type UnifiedProductSourceTable,
} from '@/lib/types/unified-product';

export const runtime = 'nodejs';
export const maxDuration = 15;

const VALID_TABLES: UnifiedProductSourceTable[] = [
  'service_packages',
  'admin_products',
  'mtn_dealer_products',
  'circletel_hardware_products',
];

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const sourceTable = searchParams.get('source_table');
  const id = searchParams.get('id');

  if (!sourceTable || !id) {
    return NextResponse.json(
      { success: false, error: 'source_table and id are required' },
      { status: 400 }
    );
  }

  if (!VALID_TABLES.includes(sourceTable as UnifiedProductSourceTable)) {
    return NextResponse.json({ success: false, error: 'Invalid source_table' }, { status: 400 });
  }

  try {
    const product = await unifiedProductAggregator.aggregateOne(`${sourceTable}:${id}`);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const supabase = await createClient();
    const line = await getProductLineForSource(supabase, sourceTable, id, product.sku);
    const showCosts = hasPermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW_COSTS);
    const docs_gate = evaluateDocsSellability(line);

    let cost_components: SkuCostComponent[] = [];
    if (sourceTable === 'service_packages') {
      const { data } = await supabase
        .from('product_cost_components')
        .select(
          'id, name, category, cost_amount, recurrence, amortisation_months, amortised_monthly_cost, sort_order'
        )
        .eq('package_id', id)
        .order('sort_order');

      cost_components = (data ?? []).map((row) => {
        const cost_amount = num(row.cost_amount) ?? 0;
        const amortised_monthly_cost = num(row.amortised_monthly_cost);
        return {
          id: String(row.id),
          name: String(row.name),
          category: String(row.category),
          cost_amount,
          recurrence: String(row.recurrence),
          amortisation_months: row.amortisation_months == null ? null : Number(row.amortisation_months),
          amortised_monthly_cost,
          monthly_amount: monthlyCostAmount({
            recurrence: String(row.recurrence),
            cost_amount,
            amortised_monthly_cost,
          }),
          sort_order: Number(row.sort_order ?? 0),
        };
      });
    }

    const fallbackCost = num(product.raw.cost_price_zar) ?? (product.cost > 0 ? product.cost : null);
    const contribution: SkuContributionView = computeSkuContribution(
      product.price,
      cost_components,
      fallbackCost
    );

    const redactedContribution: SkuContributionView = {
      retail: product.price,
      monthly_cos: null,
      contribution: null,
      margin_pct: null,
      cost_missing: contribution.cost_missing,
      redacted: true,
    };

    return NextResponse.json({
      success: true,
      show_costs: showCosts,
      product: showCosts ? product : redactUnifiedProductCosts(product),
      line: line ? (showCosts ? line : redactProductLineCosts(line)) : null,
      cost_components: showCosts ? cost_components : [],
      contribution: showCosts ? contribution : redactedContribution,
      docs_gate,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load product',
      },
      { status: 500 }
    );
  }
}
