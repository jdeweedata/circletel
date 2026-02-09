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

    // Try to get user from request body first (for cases where session isn't available)
    const body = await request.json().catch(() => ({}));

    // Get authenticated user - check Authorization header first, then cookies
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

    // If we have auth_user_id in body, use that (allows creating customer without session)
    if (body.auth_user_id) {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', body.auth_user_id)
        .single();

      if (existingCustomer) {
        return NextResponse.json({
          success: true,
          customer: existingCustomer,
          message: 'Customer already exists'
        });
      }

      // Create customer from provided data
      const accountNumber = `CT-${Date.now().toString().slice(-8)}`;

      const { data: customer, error: createError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: body.auth_user_id,
          email: body.email || 'unknown@circletel.co.za',
          first_name: body.first_name || 'Customer',
          last_name: body.last_name || '',
          phone: body.phone || '',
          account_number: accountNumber,
          account_status: 'active',
          account_type: 'personal',
        })
        .select('*')
        .single();

      if (createError) {
        return NextResponse.json(
          { success: false, error: createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        customer,
        message: 'Customer created from provided data'
      });
    }

    if (authError || !user) {
      // No auth and no body data
      const bodyData = body;

      if (!body.auth_user_id || !body.email) {
        return NextResponse.json(
          { success: false, error: 'Not authenticated and no user data provided' },
          { status: 401 }
        );
      }

      // Create customer from provided data
      const accountNumber = `CT-${Date.now().toString().slice(-8)}`;

      const { data: customer, error: createError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: body.auth_user_id,
          email: body.email,
          first_name: body.first_name || 'Customer',
          last_name: body.last_name || '',
          phone: body.phone || '',
          account_number: accountNumber,
          account_status: 'active',
          account_type: 'personal',
        })
        .select('*')
        .single();

      if (createError) {
        // Check if customer already exists
        if (createError.code === '23505') {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('auth_user_id', body.auth_user_id)
            .single();

          return NextResponse.json({
            success: true,
            customer: existingCustomer,
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
        message: 'Customer created from provided data'
      });
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
