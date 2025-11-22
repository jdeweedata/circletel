import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/orders/[orderId]/payment-method
 * Retrieve payment method details for an order
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const supabase = await createClient();

    // Get the order to find customer_id
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('customer_id, payment_method')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get the customer's payment method
    const { data: paymentMethod, error: pmError } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', order.customer_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pmError) {
      console.error('Error fetching payment method:', pmError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment method' },
        { status: 500 }
      );
    }

    // No payment method found
    if (!paymentMethod) {
      return NextResponse.json({
        success: true,
        data: {
          paymentMethod: null,
          emandateRequest: null,
        },
      });
    }

    // Transform customer_payment_methods data to match PaymentMethodStatus component expectations
    const transformedPaymentMethod = {
      id: paymentMethod.id,
      method_type: paymentMethod.method_type === 'debit_order' ? 'bank_account' : paymentMethod.method_type,
      status: paymentMethod.mandate_status || 'active',

      // Bank account details (for debit order)
      bank_name: paymentMethod.encrypted_details?.provider === 'netcash' ? 'NetCash' : null,
      bank_account_name: paymentMethod.display_name || 'Debit Order',
      bank_account_number_masked: paymentMethod.last_four || 'XXXX',
      bank_account_type: 'cheque',
      branch_code: null,

      // Mandate details
      mandate_amount: paymentMethod.encrypted_details?.monthly_amount || paymentMethod.max_debit_amount,
      mandate_frequency: 'monthly',
      mandate_debit_day: paymentMethod.encrypted_details?.first_billing_date ?
        new Date(paymentMethod.encrypted_details.first_billing_date).getDate() : 1,
      mandate_signed_at: paymentMethod.mandate_approved_at || paymentMethod.created_at,
      netcash_mandate_pdf_link: null,

      created_at: paymentMethod.created_at,

      // Additional metadata
      _original_method_type: paymentMethod.method_type,
      _provider: paymentMethod.encrypted_details?.provider,
      _verified: paymentMethod.encrypted_details?.verified,
      _verification_date: paymentMethod.encrypted_details?.verification_date,
      _is_primary: paymentMethod.is_primary,
    };

    return NextResponse.json({
      success: true,
      data: {
        paymentMethod: transformedPaymentMethod,
        emandateRequest: null, // No emandate request for manually verified payment methods
      },
    });
  } catch (error) {
    console.error('Error in payment-method API:', error);
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
