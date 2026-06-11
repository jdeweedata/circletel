import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging/logger';

/**
 * POST /api/customers/ensure
 * Ensures a customer record exists for the authenticated user
 * Creates one if it doesn't exist
 *
 * Supports both Authorization header (Bearer token) and cookie-based auth
 */
export async function POST(request: NextRequest) {
  try {
    // Service role client for database operations
    const supabase = await createClient();

    // Get authenticated user - check Authorization header first, then cookies.
    // The user identity comes ONLY from a verified session; never from the body.
    let user = null;
    let authError = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Extract token and verify with Supabase
      const token = authHeader.split(' ')[1];
      const tokenClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await tokenClient.auth.getUser(token);
      user = data?.user ?? null;
      authError = error;
    } else {
      // Fall back to cookie-based auth
      try {
        const sessionClient = await createClientWithSession();
        const { data, error } = await sessionClient.auth.getUser();
        user = data?.user ?? null;
        authError = error;
      } catch (e) {
        // Cookie reading failed, continue with null user
        apiLogger.warn('[API/customers/ensure] Cookie auth failed', { error: e });
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (existingCustomer) {
      return NextResponse.json({
        success: true,
        customer: existingCustomer,
        message: 'Customer already exists'
      });
    }

    // Create customer from auth user
    const accountNumber = `CT-${Date.now().toString().slice(-8)}`;

    const { data: customer, error: createError } = await supabase
      .from('customers')
      .insert({
        auth_user_id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || 'Customer',
        last_name: user.user_metadata?.last_name || '',
        phone: user.user_metadata?.phone || user.phone || '',
        account_number: accountNumber,
        account_status: 'active',
        account_type: 'personal',
      })
      .select('*')
      .single();

    if (createError) {
      // Concurrent ensure calls (dashboard + auth provider) can race the insert
      if (createError.code === '23505') {
        const { data: racedCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        return NextResponse.json({
          success: true,
          customer: racedCustomer,
          message: 'Customer already exists'
        });
      }

      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer created'
    });

  } catch (error) {
    apiLogger.error('Error ensuring customer', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
