/**
 * Admin Payment Methods API
 * GET /api/admin/billing/payment-methods
 *
 * Lists all customer payment methods with filtering and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Build query
    let query = supabase
      .from('payment_methods')
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
      query = query.eq('status', filters.status);
    }

    if (filters.method_type) {
      query = query.eq('method_type', filters.method_type);
    }

    // Apply search (search customer name, email, or account reference)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`netcash_account_reference.ilike.${searchTerm},bank_account_name.ilike.${searchTerm},card_holder_name.ilike.${searchTerm}`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + filters.limit! - 1);

    const { data: paymentMethods, error, count } = await query;

    if (error) {
      console.error('[Admin Payment Methods] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment methods', details: error.message },
        { status: 500 }
      );
    }

    // Get stats
    const { data: stats } = await supabase
      .from('payment_methods')
      .select('status, method_type')
      .then(({ data }) => {
        const statusCounts: Record<string, number> = {};
        const typeCounts: Record<string, number> = {};

        data?.forEach((pm: any) => {
          statusCounts[pm.status] = (statusCounts[pm.status] || 0) + 1;
          typeCounts[pm.method_type] = (typeCounts[pm.method_type] || 0) + 1;
        });

        return {
          data: {
            total: data?.length || 0,
            by_status: statusCounts,
            by_type: typeCounts,
          },
        };
      });

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
    console.error('[Admin Payment Methods] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
