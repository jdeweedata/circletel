import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 });
    }

    // Fetch active services
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('active', true)
      .order('created_at', { ascending: false });

    // Fetch billing info
    const { data: billing, error: billingError } = await supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    // Fetch recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, invoice_date, total_amount, amount_due, status')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false })
      .limit(5);

    // Calculate stats
    const stats = {
      activeServices: services?.length || 0,
      totalOrders: orders?.length || 0,
      pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
      overdueInvoices: invoices?.filter(i => i.status === 'overdue').length || 0,
      accountBalance: billing?.account_balance || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          customerSince: customer.created_at,
        },
        services: services || [],
        billing: billing || null,
        orders: orders || [],
        invoices: invoices || [],
        stats,
      }
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
