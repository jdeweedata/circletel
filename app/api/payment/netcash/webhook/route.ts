import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface NetcashWebhookPayload {
  Reference: string; // Our payment reference (CT-xxx)
  TransactionId: string; // Netcash transaction ID
  Status: string; // Payment status (Paid, Failed, Cancelled)
  Amount: string; // Amount in cents
  Extra1?: string; // Order ID
  Extra2?: string; // Payment reference
  Extra3?: string; // Customer email
  Signature?: string; // HMAC signature for verification
}

/**
 * Verify webhook signature using HMAC SHA-256
 */
function verifySignature(payload: NetcashWebhookPayload): boolean {
  const webhookSecret = process.env.NETCASH_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('NETCASH_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!payload.Signature) {
    console.error('No signature provided in webhook');
    return false;
  }

  // Create verification string (order matters - must match Netcash documentation)
  const dataToSign = `${payload.Reference}${payload.TransactionId}${payload.Status}${payload.Amount}`;

  // Generate HMAC signature
  const hmac = createHmac('sha256', webhookSecret);
  hmac.update(dataToSign);
  const calculatedSignature = hmac.digest('hex');

  const isValid = calculatedSignature === payload.Signature;

  if (!isValid) {
    console.error('Signature verification failed:', {
      provided: payload.Signature,
      calculated: calculatedSignature
    });
  }

  return isValid;
}

/**
 * Send order confirmation email
 */
async function sendConfirmationEmail(order: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'orders@circletel.co.za',
      to: order.customer_email,
      subject: 'Payment Confirmed - CircleTel Order',
      html: `
        <h1>Payment Confirmed!</h1>
        <p>Thank you for your payment, ${order.customer_name}.</p>
        <p><strong>Order Reference:</strong> ${order.payment_reference}</p>
        <p><strong>Amount:</strong> R${(order.base_price + order.installation_fee).toFixed(2)}</p>
        <p><strong>Service:</strong> ${order.service_type}</p>
        <p>We'll be in touch shortly to schedule your installation.</p>
        <p>Best regards,<br/>CircleTel Team</p>
      `
    });

    if (error) {
      console.error('Failed to send confirmation email:', error);
    } else {
      console.log('Confirmation email sent:', data);
    }
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

/**
 * POST /api/payment/netcash/webhook
 * Handles payment callbacks from Netcash
 */
export async function POST(request: NextRequest) {
  try {
    const payload: NetcashWebhookPayload = await request.json();

    console.log('Webhook received:', {
      reference: payload.Reference,
      transactionId: payload.TransactionId,
      status: payload.Status,
      amount: payload.Amount
    });

    // Verify webhook signature
    const signatureValid = verifySignature(payload);

    // Log webhook in audit table
    const headersArray = Array.from(request.headers.entries());
    const headersObject: Record<string, string> = {};
    headersArray.forEach(([key, value]) => {
      headersObject[key] = value;
    });

    const auditData = {
      order_id: payload.Extra1 || null, // Order ID from Extra1
      event_type: 'webhook_received',
      status: payload.Status.toLowerCase(),
      netcash_response: payload,
      request_headers: headersObject,
      request_body: JSON.stringify(payload),
      signature_valid: signatureValid,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: new Date().toISOString()
    };

    await supabase.from('payment_audit_logs').insert(auditData);

    if (!signatureValid) {
      console.error('Invalid webhook signature - possible security issue');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid signature'
        },
        { status: 403 }
      );
    }

    // Find order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', payload.Reference)
      .single();

    if (orderError || !order) {
      console.error('Order not found for reference:', payload.Reference);
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    // Map Netcash status to our payment status
    let paymentStatus: string;
    let orderStatus: string;

    switch (payload.Status.toLowerCase()) {
      case 'paid':
      case 'completed':
        paymentStatus = 'completed';
        orderStatus = 'payment_received';
        break;
      case 'failed':
        paymentStatus = 'failed';
        orderStatus = 'failed';
        break;
      case 'cancelled':
        paymentStatus = 'cancelled';
        orderStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'processing';
        orderStatus = 'pending_payment';
    }

    // Update order with payment details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        order_status: orderStatus,
        netcash_transaction_id: payload.TransactionId,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order'
        },
        { status: 500 }
      );
    }

    // Log payment verification
    await supabase.from('payment_audit_logs').insert({
      order_id: order.id,
      event_type: 'payment_verified',
      status: paymentStatus,
      netcash_response: payload,
      signature_valid: true,
      created_at: new Date().toISOString()
    });

    // Send confirmation email if payment successful
    if (paymentStatus === 'completed') {
      await sendConfirmationEmail(order);
    }

    console.log('Webhook processed successfully:', {
      orderId: order.id,
      paymentStatus,
      orderStatus,
      transactionId: payload.TransactionId
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: order.id,
      paymentStatus
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
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

/**
 * GET /api/payment/netcash/webhook
 * Webhook health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'netcash-webhook',
    timestamp: new Date().toISOString(),
    message: 'CircleTel Netcash webhook endpoint is operational'
  });
}