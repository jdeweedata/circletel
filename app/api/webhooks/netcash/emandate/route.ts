import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateService, EMandatePostback } from '@/lib/payments/netcash-emandate-service';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 30; // Postback processing might take longer

/**
 * POST /api/webhooks/netcash/emandate
 * Handles NetCash eMandate postback after customer signs mandate
 *
 * NetCash sends a form-encoded POST with mandate details
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from NetCash
    const formData = await request.formData();
    const postbackData: Record<string, string> = {};

    formData.forEach((value, key) => {
      postbackData[key] = value.toString();
    });

    console.log('NetCash eMandate postback received:', {
      accountRef: postbackData.AccountRef,
      mandateSuccessful: postbackData.MandateSuccessful,
    });

    // Parse postback
    const parsedPostback = NetCashEMandateService.parsePostback(postbackData);

    // Extract order ID from custom fields
    const orderId = parsedPostback.Field1; // We stored order_id in Field1
    const orderNumber = parsedPostback.Field2;
    const customerId = parsedPostback.Field3;

    if (!orderId || !orderNumber) {
      console.error('Missing order reference in postback:', parsedPostback);
      return NextResponse.json(
        { error: 'Missing order reference in postback' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
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

    // Find emandate request by account reference
    const { data: emandateRequest, error: findError } = await supabase
      .from('emandate_requests')
      .select('*')
      .eq('order_id', orderId)
      .eq('netcash_account_reference', parsedPostback.AccountRef)
      .in('status', ['sent', 'customer_notified', 'viewed'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (findError) {
      console.error('Error finding emandate request:', findError);
      return NextResponse.json(
        { error: 'Failed to process postback' },
        { status: 500 }
      );
    }

    if (!emandateRequest) {
      console.warn('No matching emandate request found for postback:', {
        orderId,
        accountRef: parsedPostback.AccountRef,
      });
      // Still return 200 to prevent NetCash retries
      return NextResponse.json({ received: true });
    }

    const mandateSuccessful = parsedPostback.MandateSuccessful === '1';
    const mandateDeclined = parsedPostback.IsDeclined === '1';

    // Update emandate request with postback data
    const { error: updateError } = await supabase
      .from('emandate_requests')
      .update({
        status: mandateSuccessful ? 'signed' : mandateDeclined ? 'declined' : 'failed',
        postback_received_at: new Date().toISOString(),
        postback_data: parsedPostback,
        postback_mandate_successful: mandateSuccessful,
        postback_reason_for_decline: parsedPostback.ReasonForDecline || null,
        postback_mandate_pdf_link: parsedPostback.MandatePDFLink || null,
        signed_at: mandateSuccessful ? new Date().toISOString() : null,
      })
      .eq('id', emandateRequest.id);

    if (updateError) {
      console.error('Error updating emandate request:', updateError);
      // Continue processing despite error
    }

    if (mandateSuccessful) {
      // Update payment method with signed mandate details
      const { error: pmUpdateError } = await supabase
        .from('payment_methods')
        .update({
          status: 'active',
          mandate_signed_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          mandate_active: true,
          is_verified: true,
          verification_method: 'emandate',
          netcash_mandate_reference: parsedPostback.MandateReferenceNumber,
          netcash_mandate_pdf_link: parsedPostback.MandatePDFLink,

          // Bank account details (masked)
          bank_name: parsedPostback.BankName || null,
          bank_account_name: parsedPostback.BankAccountName || null,
          bank_account_number_masked: parsedPostback.BankAccountNo || null, // Already masked
          bank_account_type: parsedPostback.BankAccountType?.toLowerCase() || null,
          branch_code: parsedPostback.BranchCode || null,

          // Credit card details (if applicable)
          card_type: parsedPostback.IsCreditCard === 'True' ? parsedPostback.CCType?.toLowerCase() : null,
          card_number_masked: parsedPostback.IsCreditCard === 'True' ? parsedPostback.CCAccountNo : null,
          card_holder_name: parsedPostback.IsCreditCard === 'True' ? parsedPostback.CCAccountName : null,
          card_expiry_month: parsedPostback.IsCreditCard === 'True' && parsedPostback.CCExpMM
            ? parseInt(parsedPostback.CCExpMM)
            : null,
          card_expiry_year: parsedPostback.IsCreditCard === 'True' && parsedPostback.CCExpYYYY
            ? parseInt(parsedPostback.CCExpYYYY)
            : null,
          netcash_token: parsedPostback.CCToken || null,

          // Update metadata
          metadata: {
            ...emandateRequest.request_payload,
            postback_received: new Date().toISOString(),
            mandate_reference: parsedPostback.MandateReferenceNumber,
            debit_day: parsedPostback.DebitDay,
            agreement_date: parsedPostback.AgreementDate,
          },
        })
        .eq('id', emandateRequest.payment_method_id);

      if (pmUpdateError) {
        console.error('Error updating payment method:', pmUpdateError);
      }

      // Update or create customer_billing record with primary payment method
      if (customerId && emandateRequest.payment_method_id) {
        const debitDay = parseInt(parsedPostback.DebitDay || '1');
        const billingDate = [1, 5, 25, 30].includes(debitDay) ? debitDay : 1;

        const { error: billingError } = await supabase
          .from('customer_billing')
          .upsert({
            customer_id: customerId,
            primary_payment_method_id: emandateRequest.payment_method_id,
            payment_method_type: 'debit_order',
            auto_pay_enabled: true,
            preferred_billing_date: billingDate,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'customer_id',
          });

        if (billingError) {
          console.error('Error updating customer_billing:', billingError);
        } else {
          console.log('Customer billing updated with debit order:', {
            customerId,
            billingDate,
          });
        }
      }

      // Update order status to payment_method_registered
      const { error: orderUpdateError } = await supabase
        .from('consumer_orders')
        .update({
          status: 'payment_method_registered',
          payment_method_registered_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error('Error updating order status:', orderUpdateError);
      }

      // Log status change in order history
      await supabase.from('order_status_history').insert({
        entity_type: 'consumer_order',
        entity_id: orderId,
        old_status: 'payment_method_pending', // Or fetch current status
        new_status: 'payment_method_registered',
        change_reason: 'Payment method registered via NetCash eMandate',
        automated: true,
        customer_notified: false, // Will be handled by notifications system
        status_changed_at: new Date().toISOString(),
      });

      console.log('Payment method registered successfully:', {
        orderId,
        paymentMethodId: emandateRequest.payment_method_id,
        bankName: parsedPostback.BankName,
      });

      // TODO: Trigger notifications (Phase 5)
      // - Send confirmation email to customer
      // - Notify admin of successful registration
      // - Update communication timeline
    } else {
      // Mandate declined or failed
      const { error: pmFailError } = await supabase
        .from('payment_methods')
        .update({
          status: 'failed',
          metadata: {
            ...emandateRequest.request_payload,
            postback_received: new Date().toISOString(),
            decline_reason: parsedPostback.ReasonForDecline,
          },
        })
        .eq('id', emandateRequest.payment_method_id);

      if (pmFailError) {
        console.error('Error updating failed payment method:', pmFailError);
      }

      console.log('Payment method registration failed:', {
        orderId,
        reason: parsedPostback.ReasonForDecline,
      });

      // TODO: Trigger notifications (Phase 5)
      // - Notify admin of failed registration
      // - Provide instructions for retry
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      orderId,
      mandateSuccessful,
    });
  } catch (error: any) {
    console.error('Error processing NetCash eMandate postback:', error);

    // Return 200 even on error to prevent NetCash retries flooding our system
    // Log error for manual review
    return NextResponse.json(
      {
        received: true,
        error: 'Internal processing error',
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/netcash/emandate
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: 'NetCash eMandate Webhook',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
