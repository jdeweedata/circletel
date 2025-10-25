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

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 });
    }

    // Fetch billing info
    const { data: billing, error: billingError } = await supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    // Fetch invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        billing: billing || null,
        invoices: invoices || []
      }
    });

  } catch (error) {
    console.error('Dashboard billing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch billing data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
