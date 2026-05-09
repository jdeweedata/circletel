/**
 * Manual Billing Run API
 * POST /api/admin/billing/run - Trigger manual billing run
 * GET /api/admin/billing/run - Get billing run history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const body = await request.json();
    const { billing_day, dry_run = false } = body;

    // Check admin permissions (only super_admin can run billing)
    if (authResult.adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required for billing runs' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Call the Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/billing-auto-generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          billing_day,
          force: true,
          dry_run
        })
      }
    );

    const result = await response.json();

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: authResult.adminUser.id,
        action: 'manual_billing_run',
        resource_type: 'billing_run',
        resource_id: result.run_id,
        details: {
          billing_day,
          dry_run,
          invoices_generated: result.invoices_generated,
          total_amount: result.total_amount_billed
        }
      });

    return NextResponse.json({
      success: true,
      message: dry_run ? 'Dry run completed' : 'Billing run completed',
      ...result
    });

  } catch (error: any) {
    apiLogger.error('Manual billing run failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run billing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    // Get billing run history
    const { data: runs, error, count } = await supabase
      .from('billing_run_log')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      billing_runs: runs,
      total: count,
      limit,
      offset
    });

  } catch (error: any) {
    apiLogger.error('Get billing runs failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get billing runs' },
      { status: 500 }
    );
  }
}
