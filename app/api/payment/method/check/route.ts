import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Check if customer has a verified payment method
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    // Check if customer has any completed payment validations
    // A completed validation charge indicates they have a verified payment method
    const { data: validations, error: validationError } = await supabase
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
