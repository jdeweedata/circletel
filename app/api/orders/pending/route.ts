import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';

/**
 * Get pending orders for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    // Check Authorization header first (for client-side fetch requests)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;

    if (token) {
      // Use service role client for token validation (more efficient)
      const supabase = await createClient();

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
      // Fall back to cookies
      const supabase = await createClientWithSession();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !cookieUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized'
          },
          { status: 401 }
        );
      }

      user = cookieUser;
    }

    // Use service role client for database query
    const supabaseService = await createClient();

    // Fetch pending orders for this customer (status: 'pending' with payment_status: 'pending')
    const { data: orders, error: ordersError } = await supabaseService
      .from('consumer_orders')
      .select('id, order_number, package_name, package_price, installation_address, created_at, status, payment_status')
      .eq('email', user.email)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
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
