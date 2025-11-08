/**
 * Admin Customers API Route
 * GET /api/admin/customers - Fetch all customers
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Vercel configuration: Allow longer execution for customer queries
export const runtime = 'nodejs';
export const maxDuration = 15; // Allow up to 15 seconds for customer queries

export async function GET() {
  const startTime = Date.now();
  console.log('[Customers API] ⏱️ Request started');

  try {
    // Use service role client to bypass RLS
    const supabase = await createClient();
    console.log('[Customers API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');

    // Execute query with timeout protection
    const QUERY_TIMEOUT = 12000; // 12 second timeout
    const queryPromise = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Customers query timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let customers, error;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      customers = result.data;
      error = result.error;
      console.log('[Customers API] ⏱️ Query completed:', Date.now() - startTime, 'ms', `(${customers?.length || 0} customers)`);
    } catch (timeoutError) {
      console.error('[Customers API] ❌ Query timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Customers database query is taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch customers',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customers || [],
      count: customers?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/admin/customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
