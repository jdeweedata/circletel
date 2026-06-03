import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateService, EMandatePostback } from '@/lib/payments/netcash-emandate-service';
import { mapPostbackToPaymentMethod } from '@/lib/payments/payment-method-mapper';
import { activateDebitOrderMandate } from '@/lib/payments/activate-debit-order-mandate';
import { retainMandatePdf } from '@/lib/payments/retain-mandate-pdf';
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

    // order_id/order_number are absent for B2B (order-less) mandates. Only the NetCash account
    // reference is required to locate the request; customer id (Field3) drives activation.
    if (!parsedPostback.AccountRef) {
      webhookLogger.error('Missing account reference in postback', { parsedPostback });
      return NextResponse.json(
        { error: 'Missing account reference in postback' },
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

    // Find emandate request by account reference (+ customer id when present). Keyed on the
    // account reference rather than order_id so B2B (order-less) mandates resolve too.
    // Include 'pending'/'sent'/'resent' statuses for robustness — the status update doesn't
    // always land before the postback arrives.
    let findQuery = supabase
      .from('emandate_requests')
      .select('*')
      .eq('netcash_account_reference', parsedPostback.AccountRef)
      .in('status', ['pending', 'sent', 'resent', 'customer_notified', 'viewed'])
      .order('created_at', { ascending: false });
    if (customerId) findQuery = findQuery.eq('customer_id', customerId);
    const { data: emandateRequest, error: findError } = await findQuery.maybeSingle();

    if (findError) {
      webhookLogger.error('Error finding emandate request', { error: findError.message });
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
      webhookLogger.error('Error updating emandate request', { error: updateError.message });
      // Continue processing despite error
    }

    if (mandateSuccessful) {
      // W1.2 (Gap 2) + W2.1 (Gap 3): Write the active mandate to `customer_payment_methods`
      // (the table the debit-order batch reads) and update `customer_billing`. Shared with the
      // manual approve-validation path via activateDebitOrderMandate so they never diverge.
      if (customerId) {
        const signedAt = new Date().toISOString();
        const pmWrite = mapPostbackToPaymentMethod(parsedPostback, customerId, signedAt);

        // W4.1: retain our own copy of the signed mandate PDF (PASA 5-year retention).
        // Best-effort — failure is logged but does not block activation.
        const pdfPath = await retainMandatePdf(supabase, {
          customerId,
          mandateRef: pmWrite.mandate_id || parsedPostback.AccountRef,
          pdfLink: parsedPostback.MandatePDFLink,
        });
        if (pdfPath) pmWrite.encrypted_details.mandate_pdf_path = pdfPath;

        const { errors: activationErrors } = await activateDebitOrderMandate(supabase, customerId, pmWrite);
        if (activationErrors.length) {
          webhookLogger.error('Error activating debit-order mandate', { errors: activationErrors, customerId });
        } else {
          webhookLogger.info('Debit-order mandate activated', { customerId, mandateId: pmWrite.mandate_id });
        }
      }

      // B2C only: update the linked consumer order + send order-based notifications.
      // B2B mandates have no order_id, so this whole block is skipped for them.
      if (orderId) {
      // Update order status to payment_method_registered
      const { error: orderUpdateError } = await supabase
        .from('consumer_orders')
        .update({
          status: 'payment_method_registered',
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        webhookLogger.error('Error updating order status', { error: orderUpdateError.message });
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
            webhookLogger.info('Customer payment method confirmation email sent', { message_id: result.message_id });
          } else {
            webhookLogger.error('Failed to send customer confirmation', { error: result.error });
          }
        }).catch((err) => webhookLogger.error('Email error', { error: err instanceof Error ? err.message : String(err) }));

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
            webhookLogger.info('Admin payment method notification sent', { message_id: result.message_id });
          } else {
            webhookLogger.error('Failed to send admin notification', { error: result.error });
          }
        }).catch((err) => webhookLogger.error('Admin notification error', { error: err instanceof Error ? err.message : String(err) }));

        // Update order_status_history to mark customer was notified
        await supabase
          .from('order_status_history')
          .update({ customer_notified: true })
          .eq('entity_id', orderId)
          .eq('new_status', 'payment_method_registered');
      }
      } // end if (orderId) — B2C order-coupled updates
    } else {
      // Mandate declined or failed. The decline is already recorded on emandate_requests
      // (status='declined'/'failed' above); no customer_payment_methods row is created until
      // a mandate succeeds, so there is nothing to mark failed here.
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
          webhookLogger.info('Admin notified of failed mandate', { order_number: failedOrder.order_number });
        }).catch((err) => {
          webhookLogger.error('Failed to notify admin of mandate failure', { error: err instanceof Error ? err.message : String(err) });
        });
      }
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      orderId,
      mandateSuccessful,
    });
  } catch (error: unknown) {
    webhookLogger.error('Error processing NetCash eMandate postback', { error: error instanceof Error ? error.message : String(error) });

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
