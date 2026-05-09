/**
 * Single Billing Setting API Routes
 *
 * GET  /api/admin/settings/billing/[key] - Get a single setting
 * PUT  /api/admin/settings/billing/[key] - Update a single setting
 *
 * @module app/api/admin/settings/billing/[key]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
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
// GET /api/admin/settings/billing/[key]
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { key } = await context.params;

    if (!VALID_KEYS.has(key)) {
      return NextResponse.json(
        { success: false, error: `Invalid setting key: ${key}` },
        { status: 400 }
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
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { key } = await context.params;

    if (!VALID_KEYS.has(key)) {
      return NextResponse.json(
        { success: false, error: `Invalid setting key: ${key}` },
        { status: 400 }
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
      authResult.user.id,
      body.customer_type || 'global'
    );

    billingLogger.info(`[API] Setting ${key} updated`, {
      value: body.value,
      updatedBy: authResult.user.id,
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
