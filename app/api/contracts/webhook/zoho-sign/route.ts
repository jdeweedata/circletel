/**
 * API Route: ZOHO Sign Webhook Handler
 * Task Group 7: ZOHO Sign Integration
 *
 * POST /api/contracts/webhook/zoho-sign
 * Processes ZOHO Sign webhook events for signature updates
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processZohoSignWebhook } from '@/lib/integrations/zoho/sign-service';
import { webhookLogger } from '@/lib/logging';

const ZOHO_SIGN_WEBHOOK_SECRET = process.env.ZOHO_SIGN_WEBHOOK_SECRET;

/**
 * Verify ZOHO Sign webhook signature using HMAC-SHA256
 *
 * @param payload - Raw webhook payload string
 * @param signature - Signature from X-Zoho-Sign-Signature header
 * @returns True if signature is valid
 */
function verifyZohoSignWebhook(payload: string, signature: string): boolean {
  if (!ZOHO_SIGN_WEBHOOK_SECRET) {
    throw new Error('ZOHO_SIGN_WEBHOOK_SECRET is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', ZOHO_SIGN_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Extract signature header
    const signature = request.headers.get('X-Zoho-Sign-Signature');
    if (!signature) {
      webhookLogger.warn('[ZOHO Sign Webhook] Missing signature header');
      return NextResponse.json(
        { success: false, error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // 2. Get raw body for signature verification
    const rawBody = await request.text();

    // 3. Verify signature
    const isValid = verifyZohoSignWebhook(rawBody, signature);
    if (!isValid) {
      webhookLogger.warn('[ZOHO Sign Webhook] Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 4. Parse payload
    const payload = JSON.parse(rawBody);
    const { event_type, request_id } = payload;

    webhookLogger.info(`[ZOHO Sign Webhook] Received event: ${event_type} for request ${request_id}`);

    // 5. Validate required fields
    if (!event_type || !request_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (event_type, request_id)' },
        { status: 400 }
      );
    }

    // 6. Process webhook event
    await processZohoSignWebhook(event_type, request_id, payload);

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: `Event ${event_type} processed successfully`,
    });
  } catch (error: any) {
    webhookLogger.error('[ZOHO Sign Webhook Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}
