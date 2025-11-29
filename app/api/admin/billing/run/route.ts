/**
 * Manual Billing Run API
 * POST /api/admin/billing/run - Trigger manual billing run
 * GET /api/admin/billing/run - Get billing run history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billing_day, dry_run = false } = body;

    // Authenticate
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions (only super_admin can run billing)
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser || adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required for billing runs' },
        { status: 403 }
      );
    }

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
        admin_user_id: adminUser.id,
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
    console.error('Manual billing run failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run billing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Authenticate
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

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
    console.error('Get billing runs failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get billing runs' },
      { status: 500 }
    );
  }
}
