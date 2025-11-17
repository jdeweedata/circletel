/**
 * API Route: Send Payment Method Registration Notification
 * POST /api/admin/orders/:orderId/payment-method/notify
 *
 * Sends email and SMS to customer with NetCash eMandate registration link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';

interface RouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const supabase = await createClient();

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get payment method and eMandate request
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select(`
        *,
        emandate_requests (
          mandate_url,
          account_reference,
          created_at,
          status
        )
      `)
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pmError || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'No pending payment method registration found' },
        { status: 404 }
      );
    }

    // @ts-ignore - emandate_requests is an array from the join
    const emandate = paymentMethod.emandate_requests?.[0];

    if (!emandate || !emandate.mandate_url) {
      return NextResponse.json(
        { success: false, error: 'No eMandate URL found. Please create the eMandate request first.' },
        { status: 400 }
      );
    }

    // Get package details
    const { data: packageData } = await supabase
      .from('service_packages')
      .select('name, price_monthly')
      .eq('id', order.package_id)
      .single();

    const results = {
      email: { sent: false, error: null as string | null },
      sms: { sent: false, error: null as string | null },
    };

    // Send Email
    try {
      const emailResult = await EnhancedEmailService.sendEmail({
        to: order.email,
        templateId: 'payment_method_registration',
        props: {
          customerName: `${order.first_name} ${order.last_name}`,
          orderNumber: order.order_number,
          mandateUrl: emandate.mandate_url,
          monthlyAmount: order.package_price || packageData?.price_monthly || 0,
          packageName: packageData?.name || 'Internet Service',
        },
        orderId: order.id,
        customerId: order.customer_id,
      });

      results.email.sent = emailResult.success;
      if (!emailResult.success) {
        results.email.error = emailResult.error || 'Unknown error';
      }
    } catch (emailError: any) {
      console.error('Failed to send email:', emailError);
      results.email.error = emailError.message;
    }

    // Send SMS
    try {
      const clickatell = new ClickatellService();
      const smsText = `Hi ${order.first_name}, register your payment method for ${order.order_number}. Click: ${emandate.mandate_url}`;

      const smsResult = await clickatell.sendSMS({
        to: order.phone,
        text: smsText,
      });

      results.sms.sent = smsResult.success;
      if (!smsResult.success) {
        results.sms.error = smsResult.error || 'Unknown error';
      }
    } catch (smsError: any) {
      console.error('Failed to send SMS:', smsError);
      results.sms.error = smsError.message;
    }

    // Log communication in order_communications table if it exists
    try {
      const logResult = await supabase.from('order_communications').insert([
        {
          order_id: orderId,
          type: 'email',
          channel: 'email',
          recipient: order.email,
          subject: 'Payment Method Registration Required',
          content: `Sent payment method registration link: ${emandate.mandate_url}`,
          status: results.email.sent ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          metadata: {
            template: 'payment_method_registration',
            mandate_url: emandate.mandate_url,
            account_reference: emandate.account_reference,
          },
        },
        {
          order_id: orderId,
          type: 'sms',
          channel: 'sms',
          recipient: order.phone,
          subject: 'Payment Method Registration',
          content: `SMS: Register payment method for ${order.order_number}`,
          status: results.sms.sent ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          metadata: {
            mandate_url: emandate.mandate_url,
          },
        },
      ]);

      console.log('✅ Communication logged:', logResult);
    } catch (logError) {
      console.warn('⚠️ Failed to log communication (table may not exist):', logError);
    }

    // Return results
    const success = results.email.sent || results.sms.sent;
    return NextResponse.json({
      success,
      data: {
        email: results.email,
        sms: results.sms,
        mandateUrl: emandate.mandate_url,
        accountReference: emandate.account_reference,
      },
      message: success
        ? 'Notification sent successfully'
        : 'Failed to send notifications',
    });
  } catch (error: any) {
    console.error('Error sending payment method notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
