/**
 * GET /api/admin/products/unified/item?source_table=&id=
 *
 * Single catalogue row plus optional linked product_line (CPS/BRD/FSD, ARPU, live MRR).
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
  redactUnifiedProductCosts,
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

    return NextResponse.json({
      success: true,
      show_costs: showCosts,
      product: showCosts ? product : redactUnifiedProductCosts(product),
      line: line ? (showCosts ? line : redactProductLineCosts(line)) : null,
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
