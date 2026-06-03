import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateBatchService, EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';
import { mapPaymentMethodToDisplay } from '@/lib/payments/payment-method-mapper';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Helper to create Supabase service client
 */
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * POST /api/admin/orders/[orderId]/payment-method
 * Create an eMandate request for an order (admin-initiated)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { orderId } = await context.params;
    const body = await request.json();

    const {
      mandateAmount,
      paymentMethodType = 'both',
      debitFrequency = 'Monthly',
      debitDay = '01',
      notes,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      apiLogger.error('[Admin Payment Method] Order not found', { error: orderError?.message, code: orderError?.code });
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_type, account_number')
      .eq('id', order.customer_id)
      .single();

    if (customerError || !customer) {
      apiLogger.error('[Admin Payment Method] Customer not found', { error: customerError?.message, code: customerError?.code });
      return NextResponse.json(
        { success: false, error: 'Customer not found for this order' },
        { status: 404 }
      );
    }

    // Validate customer has account number
    if (!customer.account_number) {
      apiLogger.error('[Admin Payment Method] Customer account number not assigned', { customerId: customer.id });
      return NextResponse.json(
        { success: false, error: 'Customer account number not yet assigned. Please contact support.' },
        { status: 400 }
      );
    }

    const accountReference = customer.account_number;
    const amount = parseFloat(mandateAmount) || parseFloat(order.package_price) || 0;
    const billingDay = parseInt(debitDay) || 1;

    // W1.3 cutover: no pending `payment_methods` row is created. Pending state lives on
    // `emandate_requests`; the active mandate is written to `customer_payment_methods` by the
    // NetCash webhook / approve-validation on signing.

    // Build eMandate batch request
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const isConsumer = customer.account_type !== 'business';

    const emandateBatchRequest: EMandateBatchRequest = {
      accountReference: accountReference,
      mandateName: `${customer.first_name} ${customer.last_name}`,
      mandateAmount: amount,
      isConsumer: isConsumer,
      firstName: customer.first_name,
      surname: customer.last_name,
      mobileNumber: customer.phone?.replace(/^\+27/, '0').replace(/\D/g, '') || '',
      debitFrequency: 1, // Monthly
      commencementMonth: nextMonth.getMonth() + 1,
      commencementDay: String(billingDay).padStart(2, '0'),
      agreementDate: today,
      agreementReference: order.order_number,
      field1: orderId,
      field2: order.order_number,
      field3: customer.id,
      emailAddress: customer.email || undefined,
      sendMandate: true,
      publicHolidayOption: 1,
    };

    // Create emandate_requests record
    // Note: billing_day and mandate_amount stored in request_payload
    const { data: emandateRecord, error: erError } = await supabase
      .from('emandate_requests')
      .insert({
        payment_method_id: null,
        order_id: orderId,
        customer_id: customer.id,
        request_type: 'batch',
        status: 'pending',
        netcash_account_reference: accountReference,
        request_payload: {
          ...emandateBatchRequest,
          billing_day: billingDay,
          mandate_amount: amount,
          initiated_by: 'admin',
          admin_notes: notes,
        },
        notification_email: customer.email,
        notification_phone: customer.phone,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        user_agent: request.headers.get('user-agent') || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (erError || !emandateRecord) {
      apiLogger.error('[Admin Payment Method] Failed to create emandate request', { error: erError?.message, code: erError?.code });
      return NextResponse.json(
        { success: false, error: 'Failed to create eMandate request' },
        { status: 500 }
      );
    }

    // Call NetCash BatchFileUpload API
    let fileToken: string | undefined;

    try {
      const emandateBatchService = new NetCashEMandateBatchService();
      const batchResult = await emandateBatchService.submitMandate(emandateBatchRequest);

      if (!batchResult.success) {
        throw new Error(
          `NetCash API error: ${batchResult.errorCode} - ${batchResult.errorMessage || 'Unknown error'}`
        );
      }

      fileToken = batchResult.fileToken;

      // Update emandate_requests with response
      // Store file_token in request_payload since there's no metadata column
      const updatedPayload = {
        ...(emandateRecord.request_payload || {}),
        file_token: fileToken,
        submitted_at: new Date().toISOString(),
      };

      await supabase
        .from('emandate_requests')
        .update({
          status: 'sent',
          netcash_response_code: 'SUCCESS',
          request_payload: updatedPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', emandateRecord.id);

      apiLogger.info('[Admin Payment Method] Mandate batch submitted successfully:', {
        emandateRequestId: emandateRecord.id,
        fileToken,
      });
    } catch (netcashError: unknown) {
      apiLogger.error('[Admin Payment Method] NetCash API error', { error: netcashError instanceof Error ? netcashError.message : String(netcashError) });

      // Update records with error status
      await supabase
        .from('emandate_requests')
        .update({
          status: 'failed',
          netcash_response_code: 'ERROR',
          netcash_error_messages: [netcashError.message],
          updated_at: new Date().toISOString(),
        })
        .eq('id', emandateRecord.id);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create eMandate with NetCash',
          details: netcashError.message,
        },
        { status: 502 }
      );
    }

    // Update order status
    await supabase
      .from('consumer_orders')
      .update({
        status: 'payment_method_pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Generate the customer-facing mandate URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
    const mandateUrl = `${baseUrl}/payments/${orderId}`;

    return NextResponse.json({
      success: true,
      data: {
        mandateUrl,
        accountReference,
        emandateRequestId: emandateRecord.id,
        paymentMethodId: null,
        fileToken,
        expiresAt: emandateRecord.expires_at,
      },
      message: 'eMandate request created. Customer will receive email/SMS from NetCash to sign the mandate.',
    });
  } catch (error: unknown) {
    apiLogger.error('[Admin Payment Method] Unexpected error', { error: error instanceof Error ? error.message : String(error) });
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
 * GET /api/admin/orders/[orderId]/payment-method
 * Retrieve payment method details for an order including eMandate requests
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;

    // Use service role to bypass RLS for admin
    const supabase = createServiceClient();

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

    // First, check for eMandate request for this order
    const { data: emandateRequest, error: emandateError } = await supabase
      .from('emandate_requests')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emandateError) {
      apiLogger.error('Error fetching emandate request', { error: emandateError.message, code: emandateError.code });
    }

    // Source of truth: active debit-order mandate in customer_payment_methods,
    // written by the NetCash webhook / approve-validation on signing (W1.3 cutover).
    let activeMandate: ReturnType<typeof mapPaymentMethodToDisplay> | null = null;
    {
      const { data: cpmRow } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', order.customer_id)
        .eq('method_type', 'debit_order')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cpmRow) activeMandate = mapPaymentMethodToDisplay(cpmRow);
    }

    // Helper function to generate signed URL for mandate PDFs in Supabase storage
    const getSignedPdfUrl = async (pdfLink: string | null): Promise<string | null> => {
      if (!pdfLink) return null;

      try {
        // Check if it's a Supabase storage path
        if (pdfLink.startsWith('mandate-documents/')) {
          const storagePath = pdfLink.replace('mandate-documents/', '');
          const { data: urlData, error: urlError } = await supabase.storage
            .from('mandate-documents')
            .createSignedUrl(storagePath, 60 * 60); // 1 hour validity

          if (urlError) {
            apiLogger.error('Error creating signed URL', { error: urlError.message });
            return null;
          }
          return urlData?.signedUrl || null;
        }

        // Return as-is if it's already a full URL
        return pdfLink;
      } catch (err) {
        apiLogger.error('Exception in getSignedPdfUrl', { error: err instanceof Error ? err.message : String(err) });
        return null;
      }
    };

    // If we have an eMandate request, use that data
    if (emandateRequest) {
      // Prefer the active mandate (post-signing) from customer_payment_methods; before signing,
      // fall back to the NetCash postback data / request payload on the emandate request itself.
      const postback = emandateRequest.postback_data || {};
      const reqPayload = emandateRequest.request_payload || {};
      const statusMap: Record<string, string> = { signed: 'active', declined: 'declined', failed: 'failed' };

      // Get signed URL for the mandate PDF
      const pdfLink = activeMandate?.netcash_mandate_pdf_link || emandateRequest.postback_mandate_pdf_link;
      const signedPdfUrl = await getSignedPdfUrl(pdfLink);

      const transformedPaymentMethod = {
        id: activeMandate?.id || emandateRequest.payment_method_id || emandateRequest.id,
        method_type: 'bank_account',
        status: activeMandate?.status || statusMap[emandateRequest.status] || emandateRequest.status || 'pending',

        // Bank account details from the active mandate or emandate postback
        bank_name: activeMandate?.bank_name || postback.BankName || null,
        bank_account_name: activeMandate?.bank_account_name || postback.BankAccountName || null,
        bank_account_number_masked: activeMandate?.bank_account_number_masked || postback.BankAccountNo || null,
        bank_account_type: activeMandate?.bank_account_type || 'cheque',
        branch_code: activeMandate?.branch_code || postback.BranchCode || null,

        // Mandate details
        mandate_amount: activeMandate?.mandate_amount ?? reqPayload.mandate_amount ?? null,
        mandate_frequency: 'monthly',
        mandate_debit_day: activeMandate?.mandate_debit_day || reqPayload.billing_day || 1,
        mandate_signed_at: activeMandate?.mandate_signed_at || emandateRequest.signed_at,
        netcash_mandate_pdf_link: signedPdfUrl,

        created_at: activeMandate?.created_at || emandateRequest.created_at,
      };

      const transformedEmandateRequest = {
        id: emandateRequest.id,
        status: emandateRequest.status,
        netcash_short_url: emandateRequest.netcash_short_url,
        expires_at: emandateRequest.expires_at,
        postback_reason_for_decline: emandateRequest.postback_reason_for_decline,
        created_at: emandateRequest.created_at,
        // SMS tracking fields
        sms_provider: emandateRequest.sms_provider,
        sms_message_id: emandateRequest.sms_message_id,
        sms_sent_at: emandateRequest.sms_sent_at,
        sms_delivery_status: emandateRequest.sms_delivery_status,
        sms_delivered_at: emandateRequest.sms_delivered_at,
        sms_error: emandateRequest.sms_error,
      };

      return NextResponse.json({
        success: true,
        data: {
          paymentMethod: transformedPaymentMethod,
          emandateRequest: transformedEmandateRequest,
        },
      });
    }

    // Fallback: PiCheckBold customer_payment_methods table
    const { data: paymentMethod, error: pmError } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', order.customer_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pmError) {
      apiLogger.error('Error fetching payment method', { error: pmError.message, code: pmError.code });
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
    apiLogger.error('Error in payment-method API', { error: error instanceof Error ? error.message : String(error) });
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
