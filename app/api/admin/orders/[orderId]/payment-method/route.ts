import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      .select(`
        *,
        payment_methods (*)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emandateError) {
      console.error('Error fetching emandate request:', emandateError);
    }

    // Helper function to generate signed URL for mandate PDFs in Supabase storage
    const getSignedPdfUrl = async (pdfLink: string | null): Promise<string | null> => {
      if (!pdfLink) return null;

      // Check if it's a Supabase storage path
      if (pdfLink.startsWith('mandate-documents/')) {
        const storagePath = pdfLink.replace('mandate-documents/', '');
        const { data: urlData } = await supabase.storage
          .from('mandate-documents')
          .createSignedUrl(storagePath, 60 * 60); // 1 hour validity
        return urlData?.signedUrl || null;
      }

      // Return as-is if it's already a full URL
      return pdfLink;
    };

    // If we have an eMandate request, use that data
    if (emandateRequest) {
      const pm = emandateRequest.payment_methods;

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
