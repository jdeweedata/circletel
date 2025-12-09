import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateCustomerInvoice, buildInvoiceLineItems } from '@/lib/invoices/invoice-generator';

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

    // Create customer_services record for billing/invoice generation
    const serviceRecord = await createCustomerServiceRecord(supabase, order, updatedOrder, billing);
    if (!serviceRecord.success) {
      console.error('Error creating customer service record:', serviceRecord.error);
      // Don't fail - order is activated, service record is supplementary
    }

    // Generate pro-rata invoice if applicable
    let invoiceNumber: string | undefined;
    if (billing.prorataAmount > 0 && serviceRecord.success && serviceRecord.serviceId) {
      try {
        const lineItems = buildInvoiceLineItems(
          'pro_rata',
          {
            package_name: order.package_name || 'Internet Service',
            monthly_price: parseFloat(order.package_price),
          },
          billing.prorataAmount,
          {
            start: activationDate.toISOString().split('T')[0],
            end: billing.nextBillingDate.toISOString().split('T')[0],
          }
        );

        const invoice = await generateCustomerInvoice({
          customer_id: order.customer_id,
          service_id: serviceRecord.serviceId,
          invoice_type: 'pro_rata',
          line_items: lineItems,
          period_start: activationDate.toISOString().split('T')[0],
          period_end: billing.nextBillingDate.toISOString().split('T')[0],
          due_days: 7,
        });

        invoiceNumber = invoice.invoice_number;
        console.log('[Activation] Pro-rata invoice generated:', invoice.invoice_number);
      } catch (invoiceError) {
        console.error('[Activation] Failed to generate pro-rata invoice:', invoiceError);
        // Don't fail activation if invoice generation fails
      }
    }

    // Send activation notification to customer
    try {
      await sendActivationNotification(order, updatedOrder, billing, invoiceNumber);
      console.log('[Activation] Notification sent to:', order.email);
    } catch (notifyError) {
      console.error('[Activation] Failed to send notification:', notifyError);
      // Don't fail activation if notification fails
    }

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

/**
 * Create a customer_services record from an activated order
 * This enables the invoice generation cron to pick up the service
 */
async function createCustomerServiceRecord(
  supabase: any, // Using any to avoid complex Supabase type inference issues
  order: any,
  updatedOrder: any,
  billing: {
    prorataAmount: number;
    prorataDays: number;
    nextBillingDate: Date;
    billingCycleDay: number;
  }
): Promise<{ success: boolean; error?: string; serviceId?: string }> {
  try {
    // Check if service record already exists for this order
    const { data: existingService } = await supabase
      .from('customer_services')
      .select('id')
      .eq('customer_id', order.customer_id)
      .eq('package_name', order.package_name)
      .eq('status', 'active')
      .maybeSingle();

    if (existingService) {
      console.log('Customer service record already exists:', existingService.id);
      return { success: true, serviceId: existingService.id };
    }

    // Determine service type from package name or order details
    let serviceType = 'wireless'; // Default
    const packageNameLower = (order.package_name || '').toLowerCase();

    if (packageNameLower.includes('fibre') || packageNameLower.includes('fiber')) {
      serviceType = 'fibre';
    } else if (packageNameLower.includes('lte')) {
      serviceType = 'lte';
    } else if (packageNameLower.includes('5g')) {
      serviceType = '5g';
    } else if (packageNameLower.includes('sky') || packageNameLower.includes('wireless')) {
      serviceType = 'wireless';
    }

    // Parse speed from package_speed (e.g., "100/50 Mbps")
    let speedDown: number | null = null;
    let speedUp: number | null = null;
    if (order.package_speed) {
      const speedMatch = order.package_speed.match(/(\d+)\s*\/\s*(\d+)/);
      if (speedMatch) {
        speedDown = parseInt(speedMatch[1], 10);
        speedUp = parseInt(speedMatch[2], 10);
      }
    }

    // Build full installation address
    const fullAddress = [
      order.installation_address,
      order.residential_suburb || order.suburb,
      order.residential_city || order.city,
      order.residential_province || order.province,
      order.residential_postal_code || order.postal_code,
    ].filter(Boolean).join(', ');

    // Create the service record using actual customer_services columns
    const { data: newService, error: insertError } = await supabase
      .from('customer_services')
      .insert({
        customer_id: order.customer_id,
        service_type: serviceType,
        package_name: order.package_name,
        speed_down: speedDown,
        speed_up: speedUp,
        data_cap_gb: null, // Unlimited
        installation_address: fullAddress,
        monthly_price: parseFloat(order.package_price),
        setup_fee: parseFloat(order.installation_fee || 0),
        status: 'active',
        active: true,
        activation_date: updatedOrder.activation_date,
        provider_name: 'MTN', // Default provider
        provider_code: 'MTN',
        contract_months: 24,
        contract_start_date: updatedOrder.activation_date,
        contract_end_date: new Date(
          new Date(updatedOrder.activation_date).setFullYear(
            new Date(updatedOrder.activation_date).getFullYear() + 2
          )
        ).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating customer service record:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('Created customer service record:', newService.id);
    return { success: true, serviceId: newService.id };
  } catch (error) {
    console.error('Error in createCustomerServiceRecord:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send activation notification to customer via email
 * Includes service details, billing info, and pro-rata invoice if applicable
 */
async function sendActivationNotification(
  order: any,
  updatedOrder: any,
  billing: {
    prorataAmount: number;
    prorataDays: number;
    nextBillingDate: Date;
    billingCycleDay: number;
  },
  invoiceNumber?: string
): Promise<void> {
  // Email via Resend
  if (process.env.RESEND_API_KEY && order.email) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const proRataSection = billing.prorataAmount > 0 && invoiceNumber
      ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Pro-Rata Charge</h3>
          <p>Your service was activated mid-billing cycle. A pro-rata invoice has been generated:</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Pro-Rata Amount:</strong> R${billing.prorataAmount.toFixed(2)} (for ${billing.prorataDays} days)</p>
          <p><strong>Due Date:</strong> Within 7 days</p>
        </div>
      `
      : '';

    await resend.emails.send({
      from: 'CircleTel <service@circletel.co.za>',
      to: order.email,
      subject: `Your CircleTel Service is Now Active!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F5831F;">Welcome to CircleTel!</h1>

          <p>Dear ${order.first_name || 'Valued Customer'},</p>

          <p>Great news! Your internet service has been activated and is ready to use.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Service Details</h2>
            <p><strong>Package:</strong> ${order.package_name || 'Internet Service'}</p>
            <p><strong>Speed:</strong> ${order.package_speed || 'N/A'}</p>
            ${updatedOrder.account_number ? `<p><strong>Account Number:</strong> ${updatedOrder.account_number}</p>` : ''}
            <p><strong>Installation Address:</strong> ${order.installation_address || 'N/A'}</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2e7d32;">Billing Information</h3>
            <p><strong>Monthly Amount:</strong> R${parseFloat(order.package_price).toFixed(2)}</p>
            <p><strong>Billing Day:</strong> ${billing.billingCycleDay}${getOrdinalSuffix(billing.billingCycleDay)} of each month</p>
            <p><strong>Next Billing Date:</strong> ${billing.nextBillingDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          ${proRataSection}

          <p>You can view your invoices and manage your account at <a href="https://www.circletel.co.za/dashboard">your customer dashboard</a>.</p>

          <p>If you have any questions, please contact us:</p>
          <ul>
            <li>Email: support@circletel.co.za</li>
            <li>Phone: 0860 CIRCLE (247 253)</li>
          </ul>

          <p>Thank you for choosing CircleTel!</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated notification. Please do not reply to this message.
          </p>
        </div>
      `
    });
  }
}

/**
 * Get ordinal suffix for day number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
