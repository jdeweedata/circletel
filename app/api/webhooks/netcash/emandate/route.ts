import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateService, EMandatePostback } from '@/lib/payments/netcash-emandate-service';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { AdminNotificationService } from '@/lib/notifications/admin-notifications';
import { webhookLogger } from '@/lib/logging';

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

    webhookLogger.info('NetCash eMandate postback received:', {
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
      webhookLogger.error('Missing order reference in postback:', parsedPostback);
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
    // Include 'pending' and 'resent' statuses for robustness - sometimes the status
    // update doesn't happen before the postback arrives
    const { data: emandateRequest, error: findError } = await supabase
      .from('emandate_requests')
      .select('*')
      .eq('order_id', orderId)
      .eq('netcash_account_reference', parsedPostback.AccountRef)
      .in('status', ['pending', 'sent', 'resent', 'customer_notified', 'viewed'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (findError) {
      webhookLogger.error('Error finding emandate request:', findError);
      return NextResponse.json(
        { error: 'Failed to process postback' },
        { status: 500 }
      );
    }

    if (!emandateRequest) {
      webhookLogger.warn('No matching emandate request found for postback:', {
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
      webhookLogger.error('Error updating emandate request:', updateError);
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
        webhookLogger.error('Error updating payment method:', pmUpdateError);
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
          webhookLogger.error('Error updating customer_billing:', billingError);
        } else {
          webhookLogger.info('Customer billing updated with debit order:', {
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
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        webhookLogger.error('Error updating order status:', orderUpdateError);
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

      webhookLogger.info('Payment method registered successfully:', {
        orderId,
        paymentMethodId: emandateRequest.payment_method_id,
        bankName: parsedPostback.BankName,
      });

      // Fetch order details for notifications
      const { data: order } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order) {
        const debitDay = parseInt(parsedPostback.DebitDay || '1');

        // Send customer confirmation email (async, don't block)
        EmailNotificationService.sendPaymentMethodRegisteredEmail({
          email: order.email,
          customer_name: `${order.first_name} ${order.last_name}`,
          order_number: order.order_number,
          account_number: order.account_number || undefined,
          bank_name: parsedPostback.BankName || 'Bank',
          bank_account_masked: parsedPostback.BankAccountNo || 'XXXX-XXXX',
          debit_day: debitDay,
          monthly_amount: order.package_price,
          package_name: order.package_name,
        }).then((result) => {
          if (result.success) {
            webhookLogger.info('Customer payment method confirmation email sent:', result.message_id);
          } else {
            webhookLogger.error('Failed to send customer confirmation:', result.error);
          }
        }).catch((err) => webhookLogger.error('Email error:', err));

        // Send admin notification (async, don't block)
        AdminNotificationService.notifyPaymentMethodRegistered({
          order_number: order.order_number,
          order_id: order.id,
          customer_name: `${order.first_name} ${order.last_name}`,
          customer_email: order.email,
          customer_phone: order.phone,
          bank_name: parsedPostback.BankName || 'Bank',
          bank_account_masked: parsedPostback.BankAccountNo || 'XXXX-XXXX',
          debit_day: debitDay,
          package_name: order.package_name,
          monthly_amount: order.package_price,
        }).then((result) => {
          if (result.success) {
            webhookLogger.info('Admin payment method notification sent:', result.message_id);
          } else {
            webhookLogger.error('Failed to send admin notification:', result.error);
          }
        }).catch((err) => webhookLogger.error('Admin notification error:', err));

        // Update order_status_history to mark customer was notified
        await supabase
          .from('order_status_history')
          .update({ customer_notified: true })
          .eq('entity_id', orderId)
          .eq('new_status', 'payment_method_registered');
      }
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
        webhookLogger.error('Error updating failed payment method:', pmFailError);
      }

      webhookLogger.info('Payment method registration failed:', {
        orderId,
        reason: parsedPostback.ReasonForDecline,
      });

      // Fetch order details for admin notification
      const { data: failedOrder } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (failedOrder) {
        // Notify admin of failed registration (async, don't block)
        const adminEmail = process.env.SALES_TEAM_EMAIL || 'sales@circletel.co.za';
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        resend.emails.send({
          from: 'CircleTel Admin <devadmin@notifications.circletelsa.co.za>',
          to: adminEmail,
          subject: `[FAILED] Payment Method Registration - ${failedOrder.order_number}`,
          html: `
            <h2>Payment Method Registration Failed</h2>
            <p><strong>Order:</strong> ${failedOrder.order_number}</p>
            <p><strong>Customer:</strong> ${failedOrder.first_name} ${failedOrder.last_name}</p>
            <p><strong>Email:</strong> ${failedOrder.email}</p>
            <p><strong>Phone:</strong> ${failedOrder.phone}</p>
            <p><strong>Reason:</strong> ${parsedPostback.ReasonForDecline || 'Not specified'}</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders/${orderId}">View Order</a></p>
            <hr>
            <p><strong>Action Required:</strong> Contact customer to retry payment method setup or use alternative payment method.</p>
          `,
        }).then(() => {
          webhookLogger.info('Admin notified of failed mandate:', failedOrder.order_number);
        }).catch((err) => {
          webhookLogger.error('Failed to notify admin of mandate failure:', err);
        });
      }
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      orderId,
      mandateSuccessful,
    });
  } catch (error: any) {
    webhookLogger.error('Error processing NetCash eMandate postback:', error);

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
