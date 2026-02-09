/**
 * API Route: Send Payment Method Registration Notification
 * POST /api/admin/orders/:orderId/payment-method/notify
 *
 * Sends email and SMS to customer with NetCash eMandate registration link
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';
import { apiLogger } from '@/lib/logging';

interface RouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    
    // Use service role to bypass RLS for admin operations
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

    // Get eMandate request directly from emandate_requests table
    const { data: emandate, error: emandateError } = await supabase
      .from('emandate_requests')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emandateError) {
      apiLogger.error('Error fetching emandate request:', emandateError);
    }

    // Check if we have a mandate URL
    const mandateUrl = emandate?.netcash_short_url;
    
    if (!emandate) {
      return NextResponse.json(
        { success: false, error: 'No eMandate request found. Please create the eMandate request first.' },
        { status: 404 }
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

    // Send Email - reminder about pending mandate
    try {
      const emailResult = await EnhancedEmailService.sendEmail({
        to: order.email,
        templateId: 'payment_method_registration',
        props: {
          customerName: `${order.first_name} ${order.last_name}`,
          orderNumber: order.order_number,
          mandateUrl: mandateUrl || 'Please check your email for the signing link',
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
      apiLogger.error('Failed to send email:', emailError);
      results.email.error = emailError.message;
    }

    // Send SMS - reminder about pending mandate
    try {
      const clickatell = new ClickatellService();
      let smsText: string;
      
      if (mandateUrl) {
        smsText = `Hi ${order.first_name}, please complete your CircleTel payment registration for ${order.order_number}. Click: ${mandateUrl} - CircleTel`;
      } else {
        smsText = `Hi ${order.first_name}, please check your email to complete your CircleTel payment registration for ${order.order_number}. - CircleTel`;
      }

      const smsResult = await clickatell.sendSMS({
        to: order.phone,
        text: smsText,
      });

      results.sms.sent = smsResult.success;
      if (!smsResult.success) {
        results.sms.error = smsResult.error || 'Unknown error';
      }
    } catch (smsError: any) {
      apiLogger.error('Failed to send SMS:', smsError);
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
          content: `Sent payment method registration reminder`,
          status: results.email.sent ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          metadata: {
            template: 'payment_method_registration',
            mandate_url: mandateUrl,
            account_reference: emandate.netcash_account_reference,
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
            mandate_url: mandateUrl,
          },
        },
      ]);

      apiLogger.info('✅ Communication logged:', logResult);
    } catch (logError) {
      apiLogger.warn('⚠️ Failed to log communication (table may not exist):', logError);
    }

    // Return results
    const success = results.email.sent || results.sms.sent;
    return NextResponse.json({
      success,
      data: {
        email: results.email,
        sms: results.sms,
        mandateUrl: mandateUrl,
        accountReference: emandate.netcash_account_reference,
      },
      message: success
        ? 'Notification sent successfully'
        : 'Failed to send notifications',
    });
  } catch (error: any) {
    apiLogger.error('Error sending payment method notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
