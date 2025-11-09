/**
 * Resend Webhook Handler
 * Tracks email events: sent, delivered, opened, clicked, bounced
 *
 * Resend Event Types:
 * - email.sent - Email successfully sent
 * - email.delivered - Email delivered to recipient
 * - email.delivery_delayed - Temporary delivery delay
 * - email.bounced - Email bounced (hard/soft)
 * - email.opened - Recipient opened email (tracking pixel)
 * - email.clicked - Recipient clicked link in email
 *
 * Documentation: https://resend.com/docs/api-reference/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookEvent {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    to: string | string[];
    from: string;
    subject: string;
    created_at: string;

    // For click events
    link?: string;

    // For bounce events
    bounce_type?: 'hard' | 'soft';
    bounce_reason?: string;

    // Custom metadata (if we added tags to emails)
    tags?: {
      template_id?: string;
      order_id?: string;
      customer_id?: string;
      notification_type?: string;
    };
  };
}

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// =============================================================================

/**
 * Verify Resend webhook signature using HMAC-SHA256
 *
 * Resend sends signature in 'resend-signature' header as:
 * t=<timestamp>,v1=<signature>
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Parse signature header: "t=1234567890,v1=abc123..."
    const signatureParts = signature.split(',');
    const timestamp = signatureParts.find(p => p.startsWith('t='))?.split('=')[1];
    const signatureHash = signatureParts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      console.error('Invalid signature format');
      return false;
    }

    // Prevent replay attacks (reject signatures older than 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const signatureTime = parseInt(timestamp);
    if (currentTime - signatureTime > 300) {
      console.error('Signature timestamp too old');
      return false;
    }

    // Construct signed payload: timestamp.payload
    const signedPayload = `${timestamp}.${payload}`;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// =============================================================================
// EVENT TYPE MAPPING
// =============================================================================

function mapResendEventToTrackingType(resendType: ResendEventType): string {
  const mapping: Record<ResendEventType, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'delayed',
    'email.bounced': 'bounced',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
  };
  return mapping[resendType] || 'unknown';
}

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('RESEND_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      const signature = request.headers.get('resend-signature');

      if (!signature) {
        console.error('Missing resend-signature header');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }

      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const event: ResendWebhookEvent = JSON.parse(rawBody);

    console.log('📧 Resend webhook received:', {
      type: event.type,
      email_id: event.data.email_id,
      to: event.data.to,
    });

    // Initialize Supabase client with service role (bypass RLS)
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

    // Extract recipient email (handle both string and array)
    const recipientEmail = Array.isArray(event.data.to)
      ? event.data.to[0]
      : event.data.to;

    // Try to find related order by email
    const { data: order } = await supabase
      .from('consumer_orders')
      .select('id, order_number')
      .eq('email', recipientEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Extract metadata from tags (if available)
    const templateId = event.data.tags?.template_id;
    const orderId = event.data.tags?.order_id || order?.id;
    const customerId = event.data.tags?.customer_id;

    // Create notification tracking record
    const { error: insertError } = await supabase
      .from('notification_tracking')
      .insert({
        message_id: event.data.email_id,
        event_type: mapResendEventToTrackingType(event.type),
        notification_type: 'email',
        email: recipientEmail,
        order_id: orderId,
        customer_id: customerId,
        timestamp: new Date(event.created_at),
        metadata: {
          subject: event.data.subject,
          from: event.data.from,
          link: event.data.link,
          bounce_type: event.data.bounce_type,
          bounce_reason: event.data.bounce_reason,
          template_id: templateId,
          raw_event: event,
        },
      });

    if (insertError) {
      console.error('Failed to insert notification tracking:', insertError);
      // Don't return error - we still want to acknowledge the webhook
    }

    // Update email template metrics (if we have template_id)
    if (templateId) {
      let metricType: string | null = null;

      switch (event.type) {
        case 'email.sent':
          metricType = 'sent';
          break;
        case 'email.opened':
          metricType = 'open';
          break;
        case 'email.clicked':
          metricType = 'click';
          break;
        case 'email.bounced':
          metricType = 'bounce';
          break;
      }

      if (metricType) {
        const { error: metricsError } = await supabase.rpc(
          'record_email_version_metrics',
          {
            p_version_id: templateId,
            p_metric_type: metricType,
            p_count: 1,
          }
        );

        if (metricsError) {
          console.error('Failed to update template metrics:', metricsError);
        }
      }
    }

    // Log important events
    if (event.type === 'email.opened') {
      console.log(`✅ Email opened: ${recipientEmail} (${event.data.email_id})`);
    } else if (event.type === 'email.clicked') {
      console.log(`🔗 Link clicked: ${event.data.link} by ${recipientEmail}`);
    } else if (event.type === 'email.bounced') {
      console.warn(`⚠️ Email bounced: ${recipientEmail} (${event.data.bounce_type})`);
    }

    // Return success response to Resend
    return NextResponse.json({
      success: true,
      event_type: event.type,
      message_id: event.data.email_id,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Return 200 to prevent Resend from retrying
    // (Log error for debugging but acknowledge receipt)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// HEALTH CHECK (GET request)
// =============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'resend-webhook',
    timestamp: new Date().toISOString(),
  });
}
