import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NetCashEMandateService } from '@/lib/payments/netcash-emandate-service';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/orders/[orderId]/payment-method
 * Returns payment method status for an order
 */
export async function GET(
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
    const supabase = await createClient();

    // Fetch payment method for this order
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (pmError) {
      console.error('Error fetching payment method:', pmError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment method', details: pmError.message },
        { status: 500 }
      );
    }

    // Fetch latest emandate request
    const { data: emandateRequest, error: erError } = await supabase
      .from('emandate_requests')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (erError) {
      console.error('Error fetching emandate request:', erError);
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentMethod,
        emandateRequest,
        hasPaymentMethod: !!paymentMethod,
        isActive: paymentMethod?.status === 'active',
        isPending: emandateRequest?.status === 'sent' || emandateRequest?.status === 'customer_notified',
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/orders/[orderId]/payment-method:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders/[orderId]/payment-method
 * Creates a new eMandate request for payment method registration
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
    const {
      mandateAmount,
      paymentMethodType = 'both', // 'both', 'bank_account', or 'credit_card'
      debitFrequency = 'Monthly',
      debitDay = '01',
      notes,
    } = body;

    // Validate inputs
    if (!mandateAmount || mandateAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid mandate amount is required' },
        { status: 400 }
      );
    }

    // Map payment method type to NetCash BankDetailType
    let bankDetailType: 1 | 2 | undefined;
    if (paymentMethodType === 'bank_account') {
      bankDetailType = 1; // Bank account only
    } else if (paymentMethodType === 'credit_card') {
      bankDetailType = 2; // Credit card only
    }
    // If 'both', leave undefined so customer can choose

    const supabase = await createClient();

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select(`
        id,
        order_number,
        first_name,
        last_name,
        email,
        phone,
        id_number,
        package_price,
        installation_address,
        customer_id,
        status
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found', details: orderError?.message },
        { status: 404 }
      );
    }

    // Check if payment method already exists and is active
    const { data: existingPaymentMethod } = await supabase
      .from('payment_methods')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingPaymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Active payment method already exists for this order' },
        { status: 400 }
      );
    }

    // Check if there's a pending emandate request
    const { data: pendingRequest } = await supabase
      .from('emandate_requests')
      .select('id, status, netcash_short_url, expires_at')
      .eq('order_id', orderId)
      .in('status', ['sent', 'customer_notified'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (pendingRequest) {
      // Check if expired
      const expiresAt = pendingRequest.expires_at ? new Date(pendingRequest.expires_at) : null;
      const isExpired = expiresAt && expiresAt < new Date();

      if (!isExpired && pendingRequest.netcash_short_url) {
        return NextResponse.json({
          success: false,
          error: 'Pending eMandate request already exists',
          pendingRequest: {
            id: pendingRequest.id,
            url: pendingRequest.netcash_short_url,
            expiresAt: pendingRequest.expires_at,
          },
        }, { status: 400 });
      }

      // Mark expired request as expired
      if (isExpired) {
        await supabase
          .from('emandate_requests')
          .update({ status: 'expired' })
          .eq('id', pendingRequest.id);
      }
    }

    // Calculate commencement date (next month, 1st)
    const { month, day } = NetCashEMandateService.getNextDebitDay();
    const agreementDate = new Date();

    // Generate unique account reference
    const accountReference = NetCashEMandateService.generateAccountReference(order.order_number);

    // Prepare eMandate request
    const emandateService = new NetCashEMandateService();
    const emandateRequest: any = {
      AccountReference: accountReference,
      MandateName: `${order.first_name} ${order.last_name}`,
      MandateAmount: parseFloat(mandateAmount),
      IsConsumer: true, // CircleTel serves individual consumers
      FirstName: order.first_name,
      Surname: order.last_name,
      TradingName: '', // Not a business
      RegistrationNumber: '', // Not a business
      RegisteredName: '', // Not a business
      MobileNumber: order.phone,
      DebitFrequency: debitFrequency,
      CommencementMonth: month,
      CommencementDay: debitDay,
      AgreementDate: NetCashEMandateService.formatDate(agreementDate),
      AgreementReferenceNumber: order.order_number,
      EmailAddress: order.email,
      PhoneNumber: order.phone,
      IsIdNumber: !!order.id_number,
      Notes: notes || `Monthly subscription for ${order.package_price}/mo service`,
      PublicHolidayOption: 'VeryNextOrdinaryBusinessDay' as const,
      CancellationNoticePeriod: 20,
      AllowVariableDebitAmounts: false,
      MandateActive: true,
      // Store order ID in custom field for postback reference
      Field1: orderId,
      Field2: order.order_number,
      Field3: order.customer_id,
    };

    // Add BankDetailType if specific payment method is requested
    if (bankDetailType) {
      emandateRequest.BankDetailType = bankDetailType;
    }

    // Create payment method record (pending)
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .insert({
        customer_id: order.customer_id,
        order_id: orderId,
        method_type: 'bank_account',
        status: 'pending',
        netcash_account_reference: accountReference,
        mandate_amount: mandateAmount,
        mandate_frequency: debitFrequency.toLowerCase(),
        mandate_debit_day: parseInt(debitDay),
        mandate_agreement_date: agreementDate.toISOString().split('T')[0],
        metadata: {
          order_number: order.order_number,
          package_price: order.package_price,
          created_via: 'admin_request',
        },
      })
      .select()
      .single();

    if (pmError) {
      console.error('Error creating payment method:', pmError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment method', details: pmError.message },
        { status: 500 }
      );
    }

    // Call NetCash eMandate API
    let netcashResponse;
    try {
      netcashResponse = await emandateService.createMandate(emandateRequest);
    } catch (netcashError: any) {
      console.error('NetCash API error:', netcashError);

      // Clean up payment method
      await supabase.from('payment_methods').delete().eq('id', paymentMethod.id);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create eMandate with NetCash',
          details: netcashError.message,
        },
        { status: 500 }
      );
    }

    // Check NetCash response
    if (netcashResponse.ErrorCode !== '000') {
      console.error('NetCash returned error:', netcashResponse);

      // Clean up payment method
      await supabase.from('payment_methods').delete().eq('id', paymentMethod.id);

      return NextResponse.json(
        {
          success: false,
          error: 'NetCash eMandate request failed',
          details: netcashResponse.Errors?.join(', ') || 'Unknown error',
          errorCode: netcashResponse.ErrorCode,
        },
        { status: 400 }
      );
    }

    // Create emandate request record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: emandateRequestRecord, error: erError } = await supabase
      .from('emandate_requests')
      .insert({
        payment_method_id: paymentMethod.id,
        order_id: orderId,
        customer_id: order.customer_id,
        request_type: 'synchronous',
        status: 'sent',
        netcash_account_reference: accountReference,
        netcash_mandate_url: netcashResponse.MandateUrl,
        netcash_short_url: netcashResponse.MandateUrl,
        netcash_response_code: netcashResponse.ErrorCode,
        netcash_warnings: netcashResponse.Warnings || [],
        request_payload: emandateRequest,
        notification_email: order.email,
        notification_phone: order.phone,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (erError) {
      console.error('Error creating emandate request:', erError);
    }

    // Update payment method with mandate URL
    await supabase
      .from('payment_methods')
      .update({
        netcash_mandate_url: netcashResponse.MandateUrl,
      })
      .eq('id', paymentMethod.id);

    // TODO: Send email/SMS to customer with mandate URL
    // This would be implemented in Phase 5 (Notifications)

    return NextResponse.json({
      success: true,
      data: {
        paymentMethodId: paymentMethod.id,
        emandateRequestId: emandateRequestRecord?.id,
        mandateUrl: netcashResponse.MandateUrl,
        accountReference,
        expiresAt: expiresAt.toISOString(),
      },
      message: 'eMandate request created successfully',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/orders/[orderId]/payment-method:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/orders/[orderId]/payment-method
 * Cancels a pending eMandate request
 */
export async function DELETE(
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
    const supabase = await createClient();

    // Find pending emandate request
    const { data: pendingRequest, error: findError } = await supabase
      .from('emandate_requests')
      .select('id, payment_method_id')
      .eq('order_id', orderId)
      .in('status', ['pending', 'sent', 'customer_notified'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { success: false, error: 'Failed to find emandate request', details: findError.message },
        { status: 500 }
      );
    }

    if (!pendingRequest) {
      return NextResponse.json(
        { success: false, error: 'No pending eMandate request found' },
        { status: 404 }
      );
    }

    // Update emandate request status
    await supabase
      .from('emandate_requests')
      .update({ status: 'cancelled' })
      .eq('id', pendingRequest.id);

    // Cancel payment method
    if (pendingRequest.payment_method_id) {
      await supabase
        .from('payment_methods')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', pendingRequest.payment_method_id);
    }

    return NextResponse.json({
      success: true,
      message: 'eMandate request cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/orders/[orderId]/payment-method:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
