import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

// Explicit column list — never expose the full row to the client
const CUSTOMER_COLUMNS =
  'id, auth_user_id, first_name, last_name, email, phone, account_number, account_status, account_type, business_name, business_registration, tax_number, email_verified, status, last_login, created_at, updated_at';

/**
 * Resolve the authenticated user from the Authorization header (Bearer token)
 * or, failing that, the session cookies. Returns null if unauthenticated.
 */
async function getRequestUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const tokenClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await tokenClient.auth.getUser(token);
    if (!error && data?.user) return data.user;
    return null;
  }

  try {
    const sessionClient = await createClientWithSession();
    const { data, error } = await sessionClient.auth.getUser();
    if (!error && data?.user) return data.user;
  } catch (e) {
    apiLogger.warn('[API /customers] Cookie auth failed', { error: e });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    const { firstName, lastName, phone, accountType } = body;

    // Validation
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only the caller's own record may be created or updated
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .maybeSingle();

    if (existingCustomer) {
      const { data, error } = await supabase
        .from('customers')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          account_type: accountType || 'personal',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id)
        .select(CUSTOMER_COLUMNS)
        .single();

      if (error) {
        apiLogger.error('Error updating customer', { error });
        return NextResponse.json(
          { success: false, error: 'Failed to update customer' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        customer: data,
        message: 'Customer updated successfully',
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        auth_user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone,
        account_type: accountType || 'personal',
        status: 'active',
        email_verified: false,
      })
      .select(CUSTOMER_COLUMNS)
      .single();

    if (error) {
      apiLogger.error('Error creating customer', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: data,
      message: 'Customer created successfully',
    });
  } catch (error) {
    apiLogger.error('Error in customer API', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // The caller can only ever retrieve their own record
    let { data, error } = await supabase
      .from('customers')
      .select(CUSTOMER_COLUMNS)
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!data && !error && user.email) {
      ({ data, error } = await supabase
        .from('customers')
        .select(CUSTOMER_COLUMNS)
        .eq('email', user.email)
        .maybeSingle());
    }

    if (error) {
      apiLogger.error('Error fetching customer', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: data,
    });
  } catch (error) {
    apiLogger.error('Error in customer API', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    apiLogger.info('[API PUT /customers] Request received');

    // Get the request body
    const body = await request.json();
    const { first_name, last_name, phone, business_name, business_registration, tax_number } = body;
    apiLogger.info('[API PUT /customers] Body:', { first_name, last_name, phone });

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    apiLogger.info('[API PUT /customers] Auth header present', { present: !!authHeader });

    if (!authHeader) {
      apiLogger.error('[API PUT /customers] No authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    apiLogger.info('[API PUT /customers] Token extracted', { length: token.length });

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    apiLogger.info('[API PUT /customers] Auth verification:', { hasUser: !!user, authError: authError?.message });

    if (authError || !user) {
      apiLogger.error('[API PUT /customers] Auth failed', { error: authError });
      return NextResponse.json(
        { success: false, error: `Invalid session: ${authError?.message || 'No user'}` },
        { status: 401 }
      );
    }

    apiLogger.info('[API PUT /customers] User authenticated', { userId: user.id });

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    apiLogger.info('[API PUT /customers] Customer lookup:', { found: !!customer, error: customerError?.message });

    if (customerError || !customer) {
      apiLogger.error('[API PUT /customers] Customer not found', { error: customerError });
      return NextResponse.json(
        { success: false, error: `Customer not found: ${customerError?.message || 'No record'}` },
        { status: 404 }
      );
    }

    apiLogger.info('[API PUT /customers] Updating customer', { customerId: customer.id });

    // Update customer record
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        first_name,
        last_name,
        phone,
        business_name,
        business_registration,
        tax_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id)
      .select()
      .single();

    if (updateError) {
      apiLogger.error('[API PUT /customers] Update failed', { error: updateError });
      return NextResponse.json(
        { success: false, error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    apiLogger.info('[API PUT /customers] Update successful');

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    apiLogger.error('[API PUT /customers] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
