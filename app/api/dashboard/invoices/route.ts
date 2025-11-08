/**
 * Customer Invoices API - List Endpoint
 * GET /api/dashboard/invoices
 *
 * Returns paginated list of customer invoices with filtering
 * Task 2.5: Invoice API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Vercel configuration: Allow longer execution for invoice queries
export const runtime = 'nodejs';
export const maxDuration = 15; // Allow up to 15 seconds

/**
 * GET /api/dashboard/invoices
 *
 * Query parameters:
 * - status: Filter by status (unpaid, paid, overdue, partial)
 * - limit: Number of results per page (default: 10, max: 50)
 * - offset: Offset for pagination (default: 0)
 *
 * Returns:
 * - invoices: Array of invoice records
 * - pagination: { total, limit, offset, has_more }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Customer Invoices API] ⏱️ Request started');

  try {
    const supabase = await createClient();
    console.log('[Customer Invoices API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Build query
    let query = supabase
      .from('customer_invoices')
      .select('*', { count: 'exact' })
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false });
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query with timeout protection
    const QUERY_TIMEOUT = 12000; // 12 second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Customer invoices query timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let invoices, error, count;
    try {
      const result = await Promise.race([query, timeoutPromise]);
      invoices = result.data;
      error = result.error;
      count = result.count;
      console.log('[Customer Invoices API] ⏱️ Query completed:', Date.now() - startTime, 'ms', `(${invoices?.length || 0} invoices)`);
    } catch (timeoutError) {
      console.error('[Customer Invoices API] ❌ Query timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          error: 'Invoices query is taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }
    
    // Calculate pagination info
    const total = count || 0;
    const has_more = offset + limit < total;
    
    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        total,
        limit,
        offset,
        has_more
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
