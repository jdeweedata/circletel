import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateBatchService, EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';

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
      console.error('[Admin Payment Method] Order not found:', orderError);
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
      console.error('[Admin Payment Method] Customer not found:', customerError);
      return NextResponse.json(
        { success: false, error: 'Customer not found for this order' },
        { status: 404 }
      );
    }

    // Validate customer has account number
    if (!customer.account_number) {
      console.error('[Admin Payment Method] Customer account number not assigned:', customer.id);
      return NextResponse.json(
        { success: false, error: 'Customer account number not yet assigned. Please contact support.' },
        { status: 400 }
      );
    }

    const accountReference = customer.account_number;
    const amount = parseFloat(mandateAmount) || parseFloat(order.package_price) || 0;
    const billingDay = parseInt(debitDay) || 1;

    // Delete any existing incomplete payment methods (from failed previous attempts)
    await supabase
      .from('payment_methods')
      .delete()
      .eq('netcash_account_reference', accountReference)
      .is('mandate_signed_at', null);

    // Create payment_methods record
    // Note: valid_bank_account constraint requires bank_name, bank_account_name,
    // and bank_account_number_masked when method_type = 'bank_account'
    // Using placeholder values until customer completes mandate signing
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .insert({
        customer_id: customer.id,
        order_id: orderId,
        method_type: 'bank_account',
        status: 'pending',
        // Placeholder bank details (required by constraint, updated after mandate signing)
        bank_name: 'Pending',
        bank_account_name: `${customer.first_name} ${customer.last_name}`,
        bank_account_number_masked: 'XXXX-XXXX',
        bank_account_type: 'current',
        netcash_account_reference: accountReference,
        mandate_amount: amount,
        mandate_frequency: 'monthly',
        mandate_debit_day: billingDay,
        mandate_agreement_date: new Date().toISOString().split('T')[0],
        mandate_active: false,
        is_primary: true,
        is_verified: false,
        metadata: {
          initiated_at: new Date().toISOString(),
          initiated_by: 'admin',
          order_number: order.order_number,
          package_name: order.package_name,
          payment_method_type: paymentMethodType,
          debit_frequency: debitFrequency,
          admin_notes: notes,
          bank_details_pending: true,
        },
      })
      .select()
      .single();

    if (pmError || !paymentMethod) {
      console.error('[Admin Payment Method] Failed to create payment method:', pmError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment method' },
        { status: 500 }
      );
    }

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
    const { data: emandateRecord, error: erError } = await supabase
      .from('emandate_requests')
      .insert({
        payment_method_id: paymentMethod.id,
        order_id: orderId,
        customer_id: customer.id,
        request_type: 'batch',
        status: 'pending',
        netcash_account_reference: accountReference,
        billing_day: billingDay,
        mandate_amount: amount,
        request_payload: emandateBatchRequest,
        notification_email: customer.email,
        notification_phone: customer.phone,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        user_agent: request.headers.get('user-agent') || null,
        metadata: {
          initiated_by: 'admin',
          admin_notes: notes,
        },
      })
      .select()
      .single();

    if (erError || !emandateRecord) {
      console.error('[Admin Payment Method] Failed to create emandate request:', erError);
      await supabase.from('payment_methods').delete().eq('id', paymentMethod.id);
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
      await supabase
        .from('emandate_requests')
        .update({
          status: 'sent',
          netcash_response_code: 'SUCCESS',
          metadata: {
            ...emandateRecord.metadata,
            file_token: fileToken,
            submitted_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', emandateRecord.id);

      // Update payment_methods status
      await supabase
        .from('payment_methods')
        .update({
          status: 'pending',
          metadata: {
            ...paymentMethod.metadata,
            file_token: fileToken,
            mandate_sent_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentMethod.id);

      console.log('[Admin Payment Method] Mandate batch submitted successfully:', {
        emandateRequestId: emandateRecord.id,
        paymentMethodId: paymentMethod.id,
        fileToken,
      });
    } catch (netcashError: any) {
      console.error('[Admin Payment Method] NetCash API error:', netcashError);

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

      await supabase
        .from('payment_methods')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentMethod.id);

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
        paymentMethodId: paymentMethod.id,
        fileToken,
        expiresAt: emandateRecord.expires_at,
      },
      message: 'eMandate request created. Customer will receive email/SMS from NetCash to sign the mandate.',
    });
  } catch (error: any) {
    console.error('[Admin Payment Method] Unexpected error:', error);
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
      console.error('Error fetching emandate request:', emandateError);
    }

    // Fetch payment method separately to avoid join issues
    let paymentMethodData = null;
    if (emandateRequest?.payment_method_id) {
      const { data: pmData, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', emandateRequest.payment_method_id)
        .single();

      if (pmError) {
        console.error('Error fetching payment method:', pmError);
      } else {
        paymentMethodData = pmData;
      }
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
            console.error('Error creating signed URL:', urlError);
            return null;
          }
          return urlData?.signedUrl || null;
        }

        // Return as-is if it's already a full URL
        return pdfLink;
      } catch (err) {
        console.error('Exception in getSignedPdfUrl:', err);
        return null;
      }
    };

    // If we have an eMandate request, use that data
    if (emandateRequest) {
      const pm = paymentMethodData;

      // Get signed URL for the mandate PDF
      const pdfLink = pm?.netcash_mandate_pdf_link || emandateRequest.postback_mandate_pdf_link;
      const signedPdfUrl = await getSignedPdfUrl(pdfLink);

      const transformedPaymentMethod = {
        id: pm?.id || emandateRequest.payment_method_id,
        method_type: 'bank_account',
        status: pm?.status || 'pending',

        // Bank account details from payment_methods or emandate postback
        bank_name: pm?.bank_name || emandateRequest.postback_data?.BankName || null,
        bank_account_name: pm?.bank_account_name || emandateRequest.postback_data?.BankAccountName || null,
        bank_account_number_masked: pm?.bank_account_number_masked || emandateRequest.postback_data?.BankAccountNo || null,
        bank_account_type: pm?.bank_account_type || 'cheque',
        branch_code: pm?.branch_code || emandateRequest.postback_data?.BranchCode || null,

        // Mandate details
        mandate_amount: pm?.mandate_amount || emandateRequest.mandate_amount,
        mandate_frequency: 'monthly',
        mandate_debit_day: emandateRequest.billing_day || pm?.mandate_debit_day || 25,
        mandate_signed_at: pm?.mandate_signed_at || emandateRequest.signed_at,
        netcash_mandate_pdf_link: signedPdfUrl,

        created_at: pm?.created_at || emandateRequest.created_at,
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

    // Fallback: Check customer_payment_methods table
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
