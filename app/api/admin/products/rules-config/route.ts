import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { sanitizeRuleConfig } from '@/lib/products/rules/config-sanitizer';
import type { RuleConfig } from '@/lib/products/rules';

/**
 * GET /api/admin/products/rules-config
 *
 * Fetch the persisted Rules Studio configuration.
 * Returns the stored JSONB config or an empty object if not yet configured.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_rules_config')
    .select('config, updated_at')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    config: data?.config ?? {},
    updatedAt: data?.updated_at ?? null,
  });
}

/**
 * PUT /api/admin/products/rules-config
 *
 * Persist Rules Studio configuration. Requires product_manager or super_admin role.
 * The request body must contain a `config` field with Partial<RuleConfig> data.
 */
export async function PUT(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  if (!['super_admin', 'product_manager'].includes(auth.adminUser.role)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const config = sanitizeRuleConfig(body?.config);

  const supabase = await createClient();
  const { error } = await supabase.from('product_rules_config').upsert({
    id: 'default',
    config,
    updated_by: auth.adminUser.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, config });
}
