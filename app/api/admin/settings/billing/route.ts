/**
 * Billing Settings API Routes
 *
 * GET  /api/admin/settings/billing - List all billing settings
 * PUT  /api/admin/settings/billing - Update multiple settings
 *
 * @module app/api/admin/settings/billing/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBillingSettingsByCategory,
  updateBillingSettings,
  clearBillingSettingsCache,
  type BillingSettingKey,
} from '@/lib/billing/billing-settings-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// Auth Helper
// =============================================================================

async function verifySuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Check if user is Super Admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      id,
      role_template:role_templates(name)
    `)
    .eq('id', user.id)
    .single();

  if (adminError || !adminUser) {
    return { error: 'Forbidden: Admin user not found', status: 403 };
  }

  const roleName = Array.isArray(adminUser.role_template)
    ? adminUser.role_template[0]?.name
    : (adminUser.role_template as { name: string } | null)?.name;

  if (roleName !== 'Super Admin') {
    return { error: 'Forbidden: Super Admin access required', status: 403 };
  }

  return { userId: user.id };
}

// =============================================================================
// GET /api/admin/settings/billing
// =============================================================================

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await verifySuperAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const settings = await getBillingSettingsByCategory();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    billingLogger.error('[API] GET /api/admin/settings/billing failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/admin/settings/billing
// =============================================================================

interface UpdateSettingsBody {
  settings: Array<{
    key: BillingSettingKey;
    value: unknown;
  }>;
  customer_type?: 'global' | 'business' | 'consumer' | 'partner';
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authResult = await verifySuperAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body: UpdateSettingsBody = await request.json();

    if (!body.settings || !Array.isArray(body.settings) || body.settings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: settings array required' },
        { status: 400 }
      );
    }

    // Validate setting keys
    const validKeys = new Set([
      'vat_rate',
      'invoice_due_days',
      'b2b_due_days',
      'grace_period_days',
      'auto_suspend_days',
      'billing_dates',
      'late_payment_fee',
      'reconnection_fee',
      'router_price',
      'failed_debit_fee',
      'email_reminder_days',
      'sms_reminder_max',
      'sms_urgency_thresholds',
      'whatsapp_enabled',
    ]);

    for (const { key } of body.settings) {
      if (!validKeys.has(key)) {
        return NextResponse.json(
          { success: false, error: `Invalid setting key: ${key}` },
          { status: 400 }
        );
      }
    }

    await updateBillingSettings(
      body.settings,
      authResult.userId,
      body.customer_type || 'global'
    );

    // Clear cache to ensure fresh reads
    clearBillingSettingsCache();

    billingLogger.info('[API] Billing settings updated', {
      keys: body.settings.map((s) => s.key),
      updatedBy: authResult.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${body.settings.length} settings`,
    });
  } catch (error) {
    billingLogger.error('[API] PUT /api/admin/settings/billing failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
