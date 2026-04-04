/**
 * Single Billing Setting API Routes
 *
 * GET  /api/admin/settings/billing/[key] - Get a single setting
 * PUT  /api/admin/settings/billing/[key] - Update a single setting
 *
 * @module app/api/admin/settings/billing/[key]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBillingSetting,
  updateBillingSetting,
  type BillingSettingKey,
} from '@/lib/billing/billing-settings-service';
import { billingLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

// =============================================================================
// Valid Setting Keys
// =============================================================================

const VALID_KEYS = new Set<string>([
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
// GET /api/admin/settings/billing/[key]
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await context.params;

    if (!VALID_KEYS.has(key)) {
      return NextResponse.json(
        { success: false, error: `Invalid setting key: ${key}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const authResult = await verifySuperAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get customer_type from query params
    const url = new URL(request.url);
    const customerType = (url.searchParams.get('customer_type') || 'global') as
      | 'global'
      | 'business'
      | 'consumer'
      | 'partner';

    const value = await getBillingSetting(key as BillingSettingKey, customerType);

    return NextResponse.json({
      success: true,
      data: {
        key,
        value,
        customer_type: customerType,
      },
    });
  } catch (error) {
    billingLogger.error('[API] GET /api/admin/settings/billing/[key] failed', { error });

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
// PUT /api/admin/settings/billing/[key]
// =============================================================================

interface UpdateSettingBody {
  value: unknown;
  customer_type?: 'global' | 'business' | 'consumer' | 'partner';
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await context.params;

    if (!VALID_KEYS.has(key)) {
      return NextResponse.json(
        { success: false, error: `Invalid setting key: ${key}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const authResult = await verifySuperAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body: UpdateSettingBody = await request.json();

    if (body.value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Value is required' },
        { status: 400 }
      );
    }

    await updateBillingSetting(
      key as BillingSettingKey,
      body.value as never,
      authResult.userId,
      body.customer_type || 'global'
    );

    billingLogger.info(`[API] Setting ${key} updated`, {
      value: body.value,
      updatedBy: authResult.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Setting ${key} updated successfully`,
    });
  } catch (error) {
    billingLogger.error('[API] PUT /api/admin/settings/billing/[key] failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
