import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { createBundleQuote, type BundleQuoteRequest } from '@/lib/products/bundle-quote';
import { priceBundle } from '@/lib/products/bundle-pricing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.EDIT);
  if (denied) return denied;

  const body = (await request.json()) as BundleQuoteRequest;
  if (!body.company_name || !body.contact_email || !body.pricing) {
    return NextResponse.json({ success: false, error: 'Missing quote fields' }, { status: 400 });
  }

  const preview = priceBundle(body.pricing);
  if (preview.belowFloor) {
    const approveDenied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.APPROVE);
    if (approveDenied) {
      return NextResponse.json(
        {
          success: false,
          error: `Margin ${preview.marginPct}% is below the ${preview.floorPct}% finance floor`,
          pricing: preview,
        },
        { status: 409 }
      );
    }
  }

  const supabase = await createClient();
  try {
    const result = await createBundleQuote(supabase, body, auth.adminUser.id);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create quote' },
      { status: 500 }
    );
  }
}
