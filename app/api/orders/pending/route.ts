import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get pending orders for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    // Fetch pending orders for this customer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, package_name, package_price, installation_address, created_at, status, payment_status')
      .eq('customer_id', user.id)
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch pending orders',
          details: ordersError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });

  } catch (error) {
    console.error('Unexpected error fetching pending orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
