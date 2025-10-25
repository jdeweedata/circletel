import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, accountType } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      // Update existing customer
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
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
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

    // Create new customer
    const { data, error } = await supabase
      .from('customers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        account_type: accountType || 'personal',
        status: 'active',
        email_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
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
    console.error('Error in customer API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: 'Email or ID required' },
        { status: 400 }
      );
    }

    let query = supabase.from('customers').select('*');

    if (email) {
      query = query.eq('email', email);
    } else if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching customer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: data,
    });
  } catch (error) {
    console.error('Error in customer API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[API PUT /customers] Request received');
    
    // Get the request body
    const body = await request.json();
    const { first_name, last_name, phone, business_name, business_registration, tax_number } = body;
    console.log('[API PUT /customers] Body:', { first_name, last_name, phone });

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[API PUT /customers] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[API PUT /customers] No authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    console.log('[API PUT /customers] Token extracted, length:', token.length);
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('[API PUT /customers] Auth verification:', { hasUser: !!user, authError: authError?.message });
    
    if (authError || !user) {
      console.error('[API PUT /customers] Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: `Invalid session: ${authError?.message || 'No user'}` },
        { status: 401 }
      );
    }

    console.log('[API PUT /customers] User authenticated:', user.id);

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    console.log('[API PUT /customers] Customer lookup:', { found: !!customer, error: customerError?.message });

    if (customerError || !customer) {
      console.error('[API PUT /customers] Customer not found:', customerError);
      return NextResponse.json(
        { success: false, error: `Customer not found: ${customerError?.message || 'No record'}` },
        { status: 404 }
      );
    }

    console.log('[API PUT /customers] Updating customer:', customer.id);

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
      console.error('[API PUT /customers] Update failed:', updateError);
      return NextResponse.json(
        { success: false, error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('[API PUT /customers] Update successful');

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('[API PUT /customers] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
