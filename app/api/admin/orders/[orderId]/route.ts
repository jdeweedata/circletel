import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel configuration: allow longer execution for single order queries
export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    // Use service role client to bypass RLS for admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: order, error } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order by ID:', error);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch customer account number if not on order
    let customerAccountNumber = order.account_number;
    if (!customerAccountNumber && order.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('account_number')
        .eq('id', order.customer_id)
        .single();
      
      customerAccountNumber = customer?.account_number || null;
    }

    // Fetch active payment method status for this customer
    const { data: paymentMethod } = await supabase
      .from('customer_payment_methods')
      .select('mandate_status, is_active')
      .eq('customer_id', order.customer_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Enrich order data with payment method status and customer account number
    const enrichedOrder = {
      ...order,
      account_number: customerAccountNumber || order.account_number,
      payment_method_active: !!paymentMethod,
      payment_method_mandate_status: paymentMethod?.mandate_status || (paymentMethod ? 'active' : null)
    };

    return NextResponse.json({
      success: true,
      data: enrichedOrder,
    });
  } catch (error: any) {
    console.error('Admin single order fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
