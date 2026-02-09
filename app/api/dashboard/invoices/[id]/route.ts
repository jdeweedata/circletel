/**
 * Customer Invoice Detail API
 * GET /api/dashboard/invoices/[id]
 * 
 * Returns single invoice with full details
 * Task 2.5: Invoice API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { billingLogger } from '@/lib/logging/logger';

/**
 * GET /api/dashboard/invoices/[id]
 *
 * Returns:
 * - Full invoice details
 * - Customer information
 * - Service information
 * - Line items
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check Authorization header first (for client-side fetch requests)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;

    if (token) {
      // Use token from Authorization header
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'Invalid or expired session token'
          },
          { status: 401 }
        );
      }

      user = tokenUser;
    } else {
      // Fall back to cookies (for SSR/middleware scenarios)
      const sessionClient = await createClientWithSession();
      const { data: { session }, error: authError } = await sessionClient.auth.getSession();

      if (authError || !session?.user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'No session found. Please login again.'
          },
          { status: 401 }
        );
      }

      user = session.user;
    }

    // Use service role client for database queries to bypass RLS
    const supabase = await createClient();

    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found'
        },
        { status: 404 }
      );
    }

    // Fetch invoice with related data
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number
        ),
        service:customer_services(
          id,
          package_name,
          service_type,
          installation_address
        )
      `)
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });

  } catch (error) {
    billingLogger.error('Unexpected error in invoice detail API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

