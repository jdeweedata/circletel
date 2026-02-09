/**
 * Admin Customer Invoices API
 * GET /api/admin/billing/customer-invoices
 *
 * Fetches all invoices for a specific customer.
 * Query params: customer_id (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: customer_id' },
        { status: 400 }
      );
    }

    // Check for Authorization header first (admin panel uses this)
    const authHeader = request.headers.get('authorization');
    let user = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabaseAuth = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabaseAuth.auth.getUser(token);
      user = data.user;
    }

    // Fallback to cookie-based session
    if (!user) {
      const sessionClient = await createClientWithSession();
      const { data } = await sessionClient.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for data operations (bypasses RLS)
    const supabase = await createClient();

    // Check admin permissions
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, permissions')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch invoices for customer
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('invoice_date', { ascending: false });

    if (invoicesError) {
      apiLogger.error('Error fetching invoices:', invoicesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      count: invoices?.length || 0
    });

  } catch (error: any) {
    apiLogger.error('Customer invoices fetch failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
