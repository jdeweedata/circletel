import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Calculate pro-rata billing amount
 * Billing cycles: 1st, 5th, 15th, 25th of month
 */
function calculateProRataBilling(
  monthlyPrice: number,
  activationDate: Date
): {
  prorataAmount: number;
  prorataDays: number;
  nextBillingDate: Date;
  billingCycleDay: number;
} {
  const day = activationDate.getDate();
  let billingCycleDay: number;
  let nextBillingDate: Date;

  // Determine which billing cycle day to use
  if (day <= 1) {
    billingCycleDay = 1;
    nextBillingDate = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, 1);
  } else if (day <= 5) {
    billingCycleDay = 5;
    nextBillingDate = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, 5);
  } else if (day <= 15) {
    billingCycleDay = 15;
    nextBillingDate = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, 15);
  } else if (day <= 25) {
    billingCycleDay = 25;
    nextBillingDate = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, 25);
  } else {
    // After 25th, go to 1st of next month
    billingCycleDay = 1;
    nextBillingDate = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, 1);
  }

  // Calculate pro-rata days
  const prorataDays = Math.ceil(
    (nextBillingDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get days in month for calculation
  const daysInMonth = new Date(
    activationDate.getFullYear(),
    activationDate.getMonth() + 1,
    0
  ).getDate();

  // Calculate pro-rata amount
  const dailyRate = monthlyPrice / daysInMonth;
  const prorataAmount = Math.round(dailyRate * prorataDays * 100) / 100;

  return {
    prorataAmount,
    prorataDays,
    nextBillingDate,
    billingCycleDay,
  };
}

/**
 * POST /api/admin/orders/[orderId]/activate
 * Activates an order and sets up billing
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { accountNumber, connectionId, notes, billing_start_date } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate current status
    if (order.status !== 'installation_completed') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot activate order from status: ${order.status}. Order must be in "installation_completed" status.`
        },
        { status: 400 }
      );
    }

    // Check if installation document was uploaded
    if (!order.installation_document_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Installation document must be uploaded before activation. Please complete the installation first.'
        },
        { status: 400 }
      );
    }

    // Check if customer has an active and verified payment method
    const { data: paymentMethods, error: pmError } = await supabase
      .from('customer_payment_methods')
      .select('id, method_type, mandate_status, is_active, encrypted_details')
      .eq('customer_id', order.customer_id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (pmError) {
      console.error('Error fetching payment methods:', pmError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify payment method'
        },
        { status: 500 }
      );
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active payment method found. Customer must register a payment method before activation.'
        },
        { status: 400 }
      );
    }

    const paymentMethod = paymentMethods[0];

    // Check if payment method is verified (debit orders must have active mandate)
    const isVerified = paymentMethod.encrypted_details?.verified === true ||
                      paymentMethod.encrypted_details?.verified === 'true';

    if (paymentMethod.method_type === 'debit_order' && paymentMethod.mandate_status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Debit order mandate is not active. Customer must complete mandate verification before activation.'
        },
        { status: 400 }
      );
    }

    if (!isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method is not verified. Please verify the payment method before activation.'
        },
        { status: 400 }
      );
    }

    // Calculate billing details
    const activationDate = new Date();
    let billing: any;
    let billingStartDate: Date;

    // Check if custom billing start date is provided
    if (billing_start_date) {
      billingStartDate = new Date(billing_start_date);

      // Validate billing start date is in the future
      if (billingStartDate <= activationDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Billing start date must be in the future'
          },
          { status: 400 }
        );
      }

      // For future billing start date, no pro-rata charge
      const billingCycleDay = billingStartDate.getDate();
      billing = {
        prorataAmount: 0, // No charge until billing starts
        prorataDays: 0,
        nextBillingDate: billingStartDate,
        billingCycleDay: billingCycleDay,
      };
    } else {
      // Standard pro-rata billing from activation date
      billing = calculateProRataBilling(
        parseFloat(order.package_price),
        activationDate
      );
    }

    // Update order to active status with billing details
    const updateData: any = {
      status: 'active',
      activation_date: activationDate.toISOString().split('T')[0], // Date only
      billing_active: true,
      billing_activated_at: activationDate.toISOString(),
      billing_start_date: billing_start_date || activationDate.toISOString().split('T')[0],
      next_billing_date: billing.nextBillingDate.toISOString().split('T')[0],
      billing_cycle_day: billing.billingCycleDay,
      prorata_amount: billing.prorataAmount,
      prorata_days: billing.prorataDays,
      updated_at: new Date().toISOString(),
    };

    if (accountNumber) {
      updateData.account_number = accountNumber;
    }

    if (connectionId) {
      updateData.connection_id = connectionId;
    }

    if (notes) {
      updateData.internal_notes = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('consumer_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error activating order:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to activate order',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    // Log status change
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        entity_type: 'consumer_order',
        entity_id: orderId,
        old_status: order.status,
        new_status: 'active',
        change_reason: notes || 'Service activated and billing started',
        changed_by: null, // TODO: Get from auth session
        automated: false,
        customer_notified: false,
        status_changed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error logging status history:', historyError);
      // Don't fail the request if history logging fails
    }

    // TODO: Create first pro-rata invoice
    // TODO: Send activation notification to customer
    // TODO: Schedule first billing on next_billing_date

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order activated successfully',
      billing: {
        activationDate: activationDate.toISOString().split('T')[0],
        prorataAmount: billing.prorataAmount,
        prorataDays: billing.prorataDays,
        nextBillingDate: billing.nextBillingDate.toISOString().split('T')[0],
        billingCycleDay: billing.billingCycleDay,
        monthlyAmount: parseFloat(order.package_price),
      },
    });
  } catch (error: any) {
    console.error('Error activating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
