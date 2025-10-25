import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Create Customer Record (Server-side with Service Role)
 *
 * This route uses the service role to bypass RLS and create customer records
 * immediately after Supabase Auth signup. This is necessary because client-side
 * RLS policies may not recognize auth.uid() immediately after signup.
 *
 * POST /api/auth/create-customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auth_user_id, first_name, last_name, email, phone, account_type } = body;

    // Validate required fields (allow empty strings for names as they may be collected later)
    if (!auth_user_id || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: auth_user_id, email, and phone are required' },
        { status: 400 }
      );
    }

    // Use placeholder values for empty names
    const finalFirstName = first_name?.trim() || 'Customer';
    const finalLastName = last_name?.trim() || 'User';

    // Create Supabase client with service role (bypasses RLS)
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

    // Insert customer record using service role
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        auth_user_id,
        first_name: finalFirstName,
        last_name: finalLastName,
        email,
        phone,
        account_type: account_type || 'personal',
        email_verified: false,
        status: 'active',
      })
      .select()
      .single();

    if (customerError) {
      console.error('Failed to create customer record:', customerError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create customer profile: ${customerError.message}`,
          code: customerError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer profile created successfully'
    });

  } catch (error) {
    console.error('Create customer API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
