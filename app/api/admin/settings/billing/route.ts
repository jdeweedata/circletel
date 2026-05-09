/**
 * Billing Settings API Routes
 *
 * GET  /api/admin/settings/billing - List all billing settings
 * PUT  /api/admin/settings/billing - Update multiple settings
 *
 * @module app/api/admin/settings/billing/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  getBillingSettingsByCategory,
  updateBillingSettings,
  clearBillingSettingsCache,
  type BillingSettingKey,
} from '@/lib/billing/billing-settings-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// GET /api/admin/settings/billing
// =============================================================================

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {

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
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {

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
      authResult.user.id,
      body.customer_type || 'global'
    );

    // Clear cache to ensure fresh reads
    clearBillingSettingsCache();

    billingLogger.info('[API] Billing settings updated', {
      keys: body.settings.map((s) => s.key),
      updatedBy: authResult.user.id,
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
