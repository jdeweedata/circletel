import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, hasPermission, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { redactProductLineCosts } from '@/lib/products/product-line-service';
import {
  bundleTemplateFromLine,
  workingBundleTemplateFromLine,
} from '@/lib/products/bundle-pricing';
import {
  createBundleTemplate,
  flyerChip,
  listBundleTemplates,
  sellableTemplates,
} from '@/lib/products/bundle-template-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const sellable = new URL(request.url).searchParams.get('sellable') === '1';
  const supabase = await createClient();
  try {
    const lines = await listBundleTemplates(supabase, { sellable });
    const showCosts = hasPermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW_COSTS);
    const visible = showCosts ? lines : lines.map(redactProductLineCosts);
    return NextResponse.json({
      success: true,
      show_costs: showCosts,
      templates: sellable
        ? sellableTemplates(visible)
        : visible.map((line) => ({
            ...workingBundleTemplateFromLine(line),
            chip: flyerChip(line),
            published: line.published_defaults ? bundleTemplateFromLine(line) : null,
            line,
          })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list flyers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.CREATE);
  if (denied) return denied;

  const body = await request.json();
  if (!body.name || body.billed_incl_vat_zar == null) {
    return NextResponse.json(
      { success: false, error: 'Name and customer price are required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  try {
    const line = await createBundleTemplate(
      supabase,
      {
        name: body.name,
        code: body.code,
        target_market: body.target_market,
        sales_blurb: body.sales_blurb,
        billed_incl_vat_zar: Number(body.billed_incl_vat_zar),
        default_term_months: (Number(body.default_term_months) || 12) as 12 | 24 | 36,
        default_helios_includes_cpe: Boolean(body.default_helios_includes_cpe),
        default_m365_seats: Number(body.default_m365_seats) || 0,
        default_connectivity_cost_excl: Number(body.default_connectivity_cost_excl) || 0,
        components: body.components,
      },
      auth.adminUser.id
    );
    return NextResponse.json({ success: true, line }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not save flyer' },
      { status: 400 }
    );
  }
}
