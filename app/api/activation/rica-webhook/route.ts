/**
 * API Route: RICA Webhook
 *
 * POST /api/activation/rica-webhook
 *
 * Purpose: Receive RICA approval/rejection webhooks from ICASA
 * Task Group: 12.7 - RICA Webhook Handler
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processRICAWebhook,
  verifyRICAWebhookSignature,
  type RICAWebhookPayload
} from '@/lib/compliance/rica-webhook-handler';

/**
 * POST /api/activation/rica-webhook
 *
 * Expected Headers:
 * - X-RICA-Signature: HMAC-SHA256 signature of request body
 *
 * Request Body (webhook payload):
 * {
 *   event: 'rica.approved' | 'rica.rejected' | 'rica.pending_review';
 *   submission_id: string;
 *   order_id: string;
 *   icasa_tracking_id: string;
 *   rejection_reason?: string;
 *   timestamp?: string;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RICA Webhook] Received webhook');

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('X-RICA-Signature') || '';

    // Verify webhook signature (HMAC-SHA256)
    const isValid = verifyRICAWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('[RICA Webhook] ❌ Invalid signature');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook signature'
        },
        { status: 401 }
      );
    }

    console.log('[RICA Webhook] ✅ Signature verified');

    // Parse webhook payload
    const payload: RICAWebhookPayload = JSON.parse(rawBody);

    console.log('[RICA Webhook] Event:', payload.event, 'Order:', payload.order_id);

    // Validate payload structure
    if (!payload.event || !payload.order_id || !payload.icasa_tracking_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload: missing required fields'
        },
        { status: 400 }
      );
    }

    // Process webhook event
    const result = await processRICAWebhook(payload);

    if (result.success) {
      console.log('[RICA Webhook] ✅ Processing complete:', result.message);
    } else {
      console.error('[RICA Webhook] ❌ Processing failed:', result.message);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[RICA Webhook] Error processing webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/activation/rica-webhook
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'RICA webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
