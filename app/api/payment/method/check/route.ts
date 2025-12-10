import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';

/**
 * Check if customer has a verified payment method
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

    // First, get customer record from auth user ID
    const { data: customer, error: customerError } = await supabaseService
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      // Customer record doesn't exist yet - no payment method
      return NextResponse.json({
        success: true,
        hasPaymentMethod: false,
        paymentMethod: null,
      });
    }

    // Query BOTH payment method tables:
    // 1. payment_methods - for eMandate/debit order (older table)
    // 2. customer_payment_methods - for card payments (newer table)

    // Check customer_payment_methods first (card payments from NetCash Pay Now)
    const { data: customerPaymentMethods, error: customerPmError } = await supabaseService
      .from('customer_payment_methods')
      .select(`
        id,
        method_type,
        display_name,
        last_four,
        is_primary,
        is_active,
        token_status,
        mandate_status
      `)
      .eq('customer_id', customer.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (customerPmError) {
      console.error('Error checking customer_payment_methods:', customerPmError);
    }

    // If found in customer_payment_methods, return it
    if (customerPaymentMethods && customerPaymentMethods.length > 0) {
      const method = customerPaymentMethods[0];
      return NextResponse.json({
        success: true,
        hasPaymentMethod: true,
        paymentMethod: {
          id: method.id,
          type: method.method_type,
          isPrimary: method.is_primary,
          displayName: method.display_name,
          mandateActive: method.mandate_status === 'active' || method.token_status === 'active',
        },
      });
    }

    // Fallback: Check payment_methods table (for eMandate/debit order)
    const { data: paymentMethods, error: paymentError } = await supabaseService
      .from('payment_methods')
      .select(`
        id,
        method_type,
        status,
        is_verified,
        is_primary,
        bank_name,
        bank_account_number_masked,
        card_type,
        card_number_masked,
        mandate_active
      `)
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .eq('is_verified', true)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (paymentError) {
      console.error('Error checking payment_methods:', paymentError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check payment method',
          details: paymentError.message
        },
        { status: 500 }
      );
    }

    const hasPaymentMethod = paymentMethods && paymentMethods.length > 0;
    const primaryMethod = hasPaymentMethod ? paymentMethods[0] : null;

    return NextResponse.json({
      success: true,
      hasPaymentMethod,
      paymentMethod: primaryMethod ? {
        id: primaryMethod.id,
        type: primaryMethod.method_type,
        isPrimary: primaryMethod.is_primary,
        // Masked details for display
        displayName: primaryMethod.method_type === 'bank_account'
          ? `${primaryMethod.bank_name || 'Bank'} ****${primaryMethod.bank_account_number_masked?.slice(-4) || '****'}`
          : `${primaryMethod.card_type || 'Card'} ****${primaryMethod.card_number_masked?.slice(-4) || '****'}`,
        mandateActive: primaryMethod.mandate_active,
      } : null,
    });

  } catch (error) {
    console.error('Unexpected error checking payment method:', error);
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
