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

    // Check if customer has any completed payment validations
    // A completed validation charge indicates they have a verified payment method
    const { data: validations, error: validationError } = await supabaseService
      .from('consumer_orders')
      .select('id, payment_status')
      .eq('email', user.email)
      .eq('payment_status', 'completed')
      .limit(1);

    if (validationError) {
      console.error('Error checking payment method:', validationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check payment method',
          details: validationError.message
        },
        { status: 500 }
      );
    }

    const hasPaymentMethod = validations && validations.length > 0;

    return NextResponse.json({
      success: true,
      hasPaymentMethod,
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
