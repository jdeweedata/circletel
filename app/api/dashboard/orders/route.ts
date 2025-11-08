import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
// Vercel configuration: Allow longer execution for customer orders
export const runtime = 'nodejs';
export const maxDuration = 15; // Allow up to 15 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Customer Orders API] ⏱️ Request started');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Customer Orders API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');

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

    // Fetch orders with timeout protection
    const QUERY_TIMEOUT = 12000; // 12 second timeout
    const queryPromise = supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false});

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Customer orders query timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let orders, ordersError;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      orders = result.data;
      ordersError = result.error;
      console.log('[Customer Orders API] ⏱️ Query completed:', Date.now() - startTime, 'ms', `(${orders?.length || 0} orders)`);
    } catch (timeoutError) {
      console.error('[Customer Orders API] ❌ Query timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Orders query is taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (ordersError) {
      throw ordersError;
    }

    return NextResponse.json({
      success: true,
      data: orders || []
    });

  } catch (error) {
    console.error('Dashboard orders error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
