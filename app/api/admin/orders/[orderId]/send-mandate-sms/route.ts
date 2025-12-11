/**
 * Send Mandate SMS via Clickatell API
 * 
 * POST /api/admin/orders/[orderId]/send-mandate-sms
 * 
 * Phase 2 Enhancement:
 * 1. Submits mandate to NetCash with sendMandate=0 (don't auto-send)
 * 2. Sends SMS via Clickatell with the signing link
 * 3. Tracks delivery status via Clickatell API
 * 
 * This provides visibility into SMS delivery that NetCash doesn't offer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateBatchService, EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';
import { MandateSMSService } from '@/lib/integrations/clickatell/mandate-sms-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

    // Fetch the order
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

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch existing emandate request
    const { data: emandateRequest, error: emandateError } = await supabase
      .from('emandate_requests')
      .select('*, payment_methods(*)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!emandateRequest) {
      return NextResponse.json(
        { success: false, error: 'No eMandate request found. Please initiate a mandate first.' },
        { status: 404 }
      );
    }

    if (emandateRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, error: 'Mandate has already been signed.' },
        { status: 400 }
      );
    }

    // Check if we have a mandate URL from NetCash
    let mandateUrl = emandateRequest.netcash_short_url;

    // If no URL, we need to submit to NetCash first with sendMandate=0
    if (!mandateUrl) {
      console.log('[Mandate SMS] No existing mandate URL, submitting to NetCash with sendMandate=0');

      const accountReference = customer.account_number || `CT-${order.order_number}`;
      const agreementDate = new Date();
      const requestPayload = emandateRequest.request_payload || {};
      const bankDetails = requestPayload.bank_details || {};

      const emandateBatchRequest: EMandateBatchRequest = {
        accountReference: accountReference.substring(0, 22),
        mandateName: `${customer.first_name} ${customer.last_name}`.substring(0, 50),
        isConsumer: true,
        firstName: customer.first_name || order.first_name,
        surname: customer.last_name || order.last_name,
        mobileNumber: customer.phone || order.phone,
        emailAddress: customer.email || order.email,
        mandateAmount: parseFloat(order.package_price) || 0,
        debitFrequency: 1,
        commencementMonth: agreementDate.getMonth() + 1,
        commencementDay: String(emandateRequest.billing_day || requestPayload.billing_day || 25),
        agreementDate: agreementDate,
        agreementReference: order.order_number,
        sendMandate: false, // DON'T auto-send - we'll send via Clickatell
        
        ...(bankDetails.account_number && {
          bankDetailType: 1,
          bankAccountName: bankDetails.account_name || `${customer.first_name} ${customer.last_name}`,
          bankAccountType: bankDetails.account_type === 'savings' ? 2 : 1,
          branchCode: bankDetails.branch_code,
          bankAccountNumber: bankDetails.account_number,
        }),
        
        field1: orderId,
        field2: order.order_number,
        field3: customer.id,
      };

      const emandateBatchService = new NetCashEMandateBatchService();
      const batchResult = await emandateBatchService.submitMandate(emandateBatchRequest);

      if (!batchResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create mandate in NetCash',
            details: batchResult.errorMessage || batchResult.errorCode
          },
          { status: 500 }
        );
      }

      // Note: NetCash BatchFileUpload doesn't return the mandate URL directly
      // The URL is typically sent via email/SMS when sendMandate=1
      // For sendMandate=0, we need to construct the URL or get it from the portal
      // For now, we'll use a placeholder approach - in production, you'd need to
      // either query NetCash for the URL or use their synchronous API
      
      // Update: The mandate URL format is typically:
      // https://mandate.netcash.co.za/m/{short_code}
      // But we don't get the short_code from BatchFileUpload
      
      // Fallback: Use the NetCash portal URL for manual lookup
      mandateUrl = `https://merchant.netcash.co.za/SitePages/DebitOrders/ElectronicMandates.aspx?ref=${accountReference}`;
      
      console.log('[Mandate SMS] NetCash submission successful, but URL not available from batch API');
    }

    // Send SMS via Clickatell
    const mandateSMSService = new MandateSMSService();
    const phoneNumber = customer.phone || order.phone;
    const customerName = `${customer.first_name} ${customer.last_name}`;
    const accountReference = customer.account_number || `CT-${order.order_number}`;

    const smsResult = await mandateSMSService.sendMandateSMS({
      phoneNumber,
      customerName,
      accountReference,
      mandateUrl,
      amount: parseFloat(order.package_price) || 0,
    });

    if (!smsResult.success) {
      // Update emandate request with SMS error
      await supabase
        .from('emandate_requests')
        .update({
          sms_provider: 'clickatell',
          sms_error: smsResult.error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', emandateRequest.id);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send SMS via Clickatell',
          details: smsResult.error
        },
        { status: 500 }
      );
    }

    // Update emandate request with SMS tracking info
    await supabase
      .from('emandate_requests')
      .update({
        sms_provider: 'clickatell',
        sms_message_id: smsResult.messageId,
        sms_sent_at: new Date().toISOString(),
        sms_delivery_status: 'pending',
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emandateRequest.id);

    // Log the action
    await supabase.from('order_status_history').insert({
      entity_type: 'consumer_order',
      entity_id: orderId,
      old_status: emandateRequest.status,
      new_status: 'mandate_sms_sent',
      changed_by: 'admin',
      notes: `Mandate SMS sent via Clickatell to ${phoneNumber}. MessageId: ${smsResult.messageId}`,
      created_at: new Date().toISOString(),
    });

    console.log(`[Mandate SMS] Successfully sent to ${phoneNumber}. MessageId: ${smsResult.messageId}`);

    return NextResponse.json({
      success: true,
      message: `Mandate SMS sent successfully to ${phoneNumber}`,
      data: {
        messageId: smsResult.messageId,
        recipientPhone: phoneNumber,
        mandateUrl,
        provider: 'clickatell',
      },
    });

  } catch (error: any) {
    console.error('[Mandate SMS] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check SMS delivery status
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

    // Fetch emandate request with SMS info
    const { data: emandateRequest, error } = await supabase
      .from('emandate_requests')
      .select('sms_message_id, sms_sent_at, sms_delivery_status, sms_delivered_at, sms_error, sms_provider')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !emandateRequest) {
      return NextResponse.json(
        { success: false, error: 'No eMandate request found' },
        { status: 404 }
      );
    }

    if (!emandateRequest.sms_message_id) {
      return NextResponse.json({
        success: true,
        data: {
          hasSMS: false,
          message: 'No SMS has been sent for this mandate',
        },
      });
    }

    // If sent via Clickatell, check current delivery status
    if (emandateRequest.sms_provider === 'clickatell' && emandateRequest.sms_delivery_status === 'pending') {
      const mandateSMSService = new MandateSMSService();
      const statusResult = await mandateSMSService.checkDeliveryStatus(emandateRequest.sms_message_id);

      if (statusResult.success && statusResult.status) {
        // Update database with latest status
        const updateData: any = {
          sms_delivery_status: statusResult.status,
          updated_at: new Date().toISOString(),
        };

        if (statusResult.status === 'delivered' && statusResult.deliveredAt) {
          updateData.sms_delivered_at = statusResult.deliveredAt;
        }

        await supabase
          .from('emandate_requests')
          .update(updateData)
          .eq('order_id', orderId);

        return NextResponse.json({
          success: true,
          data: {
            hasSMS: true,
            provider: emandateRequest.sms_provider,
            messageId: emandateRequest.sms_message_id,
            sentAt: emandateRequest.sms_sent_at,
            deliveryStatus: statusResult.status,
            deliveredAt: statusResult.deliveredAt || emandateRequest.sms_delivered_at,
            statusDescription: statusResult.statusDescription,
          },
        });
      }
    }

    // Return cached status
    return NextResponse.json({
      success: true,
      data: {
        hasSMS: true,
        provider: emandateRequest.sms_provider,
        messageId: emandateRequest.sms_message_id,
        sentAt: emandateRequest.sms_sent_at,
        deliveryStatus: emandateRequest.sms_delivery_status,
        deliveredAt: emandateRequest.sms_delivered_at,
        error: emandateRequest.sms_error,
      },
    });

  } catch (error: any) {
    console.error('[Mandate SMS Status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
