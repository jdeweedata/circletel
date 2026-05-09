/**
 * Admin Customer Invoices API
 * GET /api/admin/billing/customer-invoices
 *
 * Fetches all invoices for a specific customer.
 * Query params: customer_id (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: customer_id' },
        { status: 400 }
      );
    }

    // Use service role client for data operations (bypasses RLS)
    const supabase = await createClient();

    // Fetch invoices for customer
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('invoice_date', { ascending: false });

    if (invoicesError) {
      apiLogger.error('Error fetching invoices', { error: invoicesError.message, code: invoicesError.code });
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    apiLogger.error('Customer invoices fetch failed', { error: errorMessage });
    return NextResponse.json(
      { success: false, error: errorMessage || 'Internal server error' },
      { status: 500 }
    );
  }
}
