/**
 * Admin Customers API Route
 * GET /api/admin/customers - Search, filter and paginate customers
 *
 * Query params:
 * - q:      search across first_name, last_name, email, phone, account_number, business_name
 * - filter: 'overdue' | 'suspended' | 'new' (last 7 days)
 * - limit:  page size (default 25, max 100)
 * - offset: pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

function escapeIlike(term: string): string {
  // Escape PostgREST or-filter delimiters and ilike wildcards in user input
  return term.replace(/[%_,()]/g, '');
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const q = (searchParams.get('q') || '').trim();
    const filter = searchParams.get('filter') || '';
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT,
      PAGE_SIZE_MAX
    );
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Customers with overdue unpaid invoices — needed both for the 'overdue'
    // filter and for the global stat count
    const { data: overdueRows, error: overdueError } = await supabase
      .from('customer_invoices')
      .select('customer_id')
      .neq('status', 'paid')
      .lt('due_date', new Date().toISOString());

    if (overdueError) {
      console.error('[Customers API] Overdue lookup failed:', overdueError);
    }
    const overdueCustomerIds = Array.from(
      new Set((overdueRows || []).map((r) => r.customer_id).filter(Boolean))
    );

    let query = supabase
      .from('customers')
      .select(
        'id, first_name, last_name, email, phone, account_number, account_type, business_name, status, email_verified, created_at',
        { count: 'exact' }
      );

    if (q) {
      const term = escapeIlike(q);
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,account_number.ilike.%${term}%,business_name.ilike.%${term}%`
      );
    }

    if (filter === 'suspended') {
      query = query.eq('status', 'suspended');
    } else if (filter === 'new') {
      query = query.gte('created_at', weekAgo);
    } else if (filter === 'overdue') {
      if (overdueCustomerIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          stats: await fetchStats(supabase, overdueCustomerIds.length, weekAgo),
        });
      }
      query = query.in('id', overdueCustomerIds);
    }

    const { data: customers, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Customers API] Query failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customers', details: error.message },
        { status: 500 }
      );
    }

    // Outstanding balance for the customers on this page (one aggregate query)
    const pageIds = (customers || []).map((c) => c.id);
    const outstandingByCustomer: Record<string, number> = {};
    if (pageIds.length > 0) {
      const { data: unpaidInvoices, error: unpaidError } = await supabase
        .from('customer_invoices')
        .select('customer_id, total_amount, amount_paid')
        .neq('status', 'paid')
        .in('customer_id', pageIds);

      if (unpaidError) {
        console.error('[Customers API] Outstanding lookup failed:', unpaidError);
      }
      for (const inv of unpaidInvoices || []) {
        outstandingByCustomer[inv.customer_id] =
          (outstandingByCustomer[inv.customer_id] || 0) +
          ((inv.total_amount || 0) - (inv.amount_paid || 0));
      }
    }

    const overdueSet = new Set(overdueCustomerIds);
    const data = (customers || []).map((c) => ({
      ...c,
      outstanding_balance: outstandingByCustomer[c.id] || 0,
      has_overdue: overdueSet.has(c.id),
    }));

    return NextResponse.json({
      success: true,
      data,
      count: count ?? data.length,
      stats: await fetchStats(supabase, overdueCustomerIds.length, weekAgo),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function fetchStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  overdueCount: number,
  weekAgo: string
) {
  const [totalResult, suspendedResult, newResult] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'suspended'),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
  ]);

  return {
    total: totalResult.count || 0,
    overdue: overdueCount,
    suspended: suspendedResult.count || 0,
    new_this_week: newResult.count || 0,
  };
}
