import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  console.log('[Customer Order Detail API] ⏱️ Request started');

  try {
    const { id } = await context.params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Customer Order Detail API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');

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

    // Fetch order with timeout protection
    const QUERY_TIMEOUT = 12000; // 12 second timeout
    const queryPromise = supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Order query timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let order, orderError;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      order = result.data;
      orderError = result.error;
      console.log('[Customer Order Detail API] ⏱️ Query completed:', Date.now() - startTime, 'ms');
    } catch (timeoutError) {
      console.error('[Customer Order Detail API] ❌ Query timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Order query is taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Order not found'
        }, { status: 404 });
      }
      throw orderError;
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Dashboard order detail error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order details',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
