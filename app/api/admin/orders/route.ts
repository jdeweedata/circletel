import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

// Vercel configuration: Allow longer execution for order queries
export const runtime = 'nodejs';
export const maxDuration = 15; // Allow up to 15 seconds for order queries

export async function GET() {
  const startTime = Date.now();
  apiLogger.info('[Orders API] ⏱️ Request started');

  try {
    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    apiLogger.info('[Orders API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');

    // Execute query with timeout protection
    const QUERY_TIMEOUT = 12000; // 12 second timeout
    const queryPromise = supabase
      .from('consumer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Orders query timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let orders, error;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      orders = result.data;
      error = result.error;
      apiLogger.info('[Orders API] ⏱️ Query completed:', Date.now() - startTime, 'ms', `(${orders?.length || 0} orders)`);
    } catch (timeoutError) {
      apiLogger.error('[Orders API] ❌ Query timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Orders database query is taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (error) {
      apiLogger.error('Error fetching orders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders || [],
      count: orders?.length || 0
    });
  } catch (error) {
    apiLogger.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
