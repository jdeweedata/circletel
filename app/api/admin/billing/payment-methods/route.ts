/**
 * Admin Payment Methods API
 * GET /api/admin/billing/payment-methods
 *
 * Lists all customer payment methods with filtering and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface PaymentMethodFilters {
  status?: string;
  method_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const supabase = await createClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: PaymentMethodFilters = {
      status: searchParams.get('status') || undefined,
      method_type: searchParams.get('method_type') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    const offset = (filters.page! - 1) * filters.limit!;

    // Source of truth: customer_payment_methods (W1.3 cutover). Status/details live in
    // mandate_status/token_status + encrypted_details jsonb, so filters/search/stats adapt.
    const normaliseStatus = (pm: any): string =>
      pm.mandate_status || pm.token_status || (pm.is_active ? 'active' : 'inactive');

    let query = supabase
      .from('customer_payment_methods')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.or(`mandate_status.eq.${filters.status},token_status.eq.${filters.status}`);
    }

    if (filters.method_type) {
      // Legacy UI uses 'bank_account'; the source table uses 'debit_order'.
      const methodType = filters.method_type === 'bank_account' ? 'debit_order' : filters.method_type;
      query = query.eq('method_type', methodType);
    }

    // Apply search across the columns that exist on this table
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`display_name.ilike.${searchTerm},card_holder_name.ilike.${searchTerm},last_four.ilike.${searchTerm}`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + filters.limit! - 1);

    const { data: rows, error, count } = await query;

    if (error) {
      apiLogger.error('[Admin Payment Methods] Query error', { error: error.message, code: error.code });
      return NextResponse.json(
        { error: 'Failed to fetch payment methods', details: error.message },
        { status: 500 }
      );
    }

    // Project into the shape the dashboard expects (bank + card + refs + customer).
    const paymentMethods = (rows || []).map((pm: any) => {
      const ed = pm.encrypted_details || {};
      const isBank = pm.method_type === 'debit_order';
      return {
        id: pm.id,
        method_type: isBank ? 'bank_account' : pm.method_type,
        status: normaliseStatus(pm),
        is_verified: ed.verified === true || ed.verified === 'true',
        bank_name: ed.bank_name || (isBank && ed.provider === 'netcash' ? 'NetCash' : null),
        bank_account_name: ed.bank_account_name || (isBank ? pm.display_name : null),
        bank_account_number_masked: ed.bank_account_number_masked || (isBank ? pm.last_four : null),
        bank_account_type: ed.bank_account_type || null,
        card_type: pm.card_type,
        card_number_masked: pm.card_masked_number,
        card_holder_name: pm.card_holder_name,
        card_expiry_month: pm.card_expiry_month,
        card_expiry_year: pm.card_expiry_year,
        netcash_account_reference: ed.account_reference || ed.mandate_reference || pm.mandate_id || null,
        netcash_mandate_reference: pm.mandate_id || ed.mandate_reference || null,
        created_at: pm.created_at,
        updated_at: pm.updated_at,
        customer: pm.customer,
      };
    });

    // Get stats
    const { data: statRows } = await supabase
      .from('customer_payment_methods')
      .select('mandate_status, token_status, is_active, method_type');

    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    (statRows || []).forEach((pm: any) => {
      const st = normaliseStatus(pm);
      statusCounts[st] = (statusCounts[st] || 0) + 1;
      const mt = pm.method_type === 'debit_order' ? 'bank_account' : pm.method_type;
      typeCounts[mt] = (typeCounts[mt] || 0) + 1;
    });
    const stats = {
      total: statRows?.length || 0,
      by_status: statusCounts,
      by_type: typeCounts,
    };

    return NextResponse.json({
      success: true,
      data: paymentMethods,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit!),
      },
      stats,
    });
  } catch (error) {
    apiLogger.error('[Admin Payment Methods] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
