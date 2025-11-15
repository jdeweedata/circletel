import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/server';
import {
  getAdminProductContext,
  validateAdminProductForPublish,
  buildServicePackagePayload,
  upsertServicePackage,
  archivePreviousVersions,
  logPublishAudit,
} from '@/lib/catalog/publish';
import { syncWithRetry } from '@/lib/integrations/zoho/sync-retry-service';

/**
 * POST /api/admin/products/[id]/publish
 *
 * Publishes an approved admin product (admin_products) into the runtime catalogue
 * (service_packages) via the publish pipeline. This does NOT call Zoho yet; it
 * only affects our internal catalogue.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Authenticate admin user using same pattern as /api/admin/me
    const supabaseSSR = await createSSRClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseAdmin = await createAdminClient();
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, is_active, role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in admin_users table' },
        { status: 404 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    if (!['super_admin', 'product_manager'].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);

    const marketSegment = searchParams.get('market_segment') || undefined;
    const provider = searchParams.get('provider') || undefined;

    // 1. Load admin product context
    const ctx = await getAdminProductContext(id);

    // 2. Validate
    const errors = validateAdminProductForPublish(ctx);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product is not ready to be published',
          errors,
        },
        { status: 400 }
      );
    }

    // 3. Build service_packages payload
    const payload = buildServicePackagePayload(ctx, {
      marketSegment,
      provider,
    });

    // 4. Upsert into service_packages
    const { servicePackage, wasCreated } = await upsertServicePackage(payload);

    // 5. Archive previous versions
    await archivePreviousVersions(servicePackage, payload);

    // 6. Update latest audit log entry with user attribution
    await logPublishAudit(
      {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
      },
      servicePackage,
      'Published from admin product catalogue',
      {
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      }
    );

    // 7. Best-effort sync to Zoho CRM Product catalogue with retry logic
    let zohoSync = null;
    try {
      zohoSync = await syncWithRetry(servicePackage, 0); // Start with attempt 0
    } catch (zohoError) {
      console.error('[publish] Zoho CRM product sync error:', zohoError);
    }

    return NextResponse.json({
      success: true,
      data: servicePackage,
      metadata: {
        wasCreated,
        zoho_crm: zohoSync,
      },
    });
  } catch (error: any) {
    console.error('[publish] Error publishing admin product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish product',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
