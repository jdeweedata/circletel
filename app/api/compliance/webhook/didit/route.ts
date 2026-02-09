/**
 * POST /api/compliance/webhook/didit
 *
 * Handles webhook events from Didit KYC verification system
 * Implements HMAC-SHA256 signature verification for security
 * Ensures idempotency to prevent duplicate processing
 *
 * Headers:
 * - X-Didit-Signature: HMAC-SHA256 signature of request body
 *
 * Request Body: DiditWebhookPayload
 * {
 *   event: 'verification.completed' | 'verification.failed' | 'session.abandoned' | 'session.expired',
 *   sessionId: string,
 *   timestamp: string,
 *   result?: { status, risk_score },
 *   data?: ExtractedKYCData,
 *   error?: { code, message }
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyDiditWebhook,
  processDiditWebhook,
} from '@/lib/integrations/didit/webhook-handler';
import type { DiditWebhookPayload } from '@/lib/integrations/didit/types';
import { webhookLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    // 1. Extract signature from headers
    const signature =
      request.headers.get('X-Didit-Signature') ||
      request.headers.get('x-didit-signature') ||
      request.headers.get('x-signature');

    if (!signature) {
      webhookLogger.error('[Webhook API] Missing X-Didit-Signature header');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing X-Didit-Signature header',
        },
        { status: 401 }
      );
    }

    // 2. Get raw request body (needed for signature verification)
    const rawBody = await request.text();

    // 3. Verify webhook signature
    let isValidSignature;
    try {
      isValidSignature = verifyDiditWebhook(rawBody, signature);
    } catch (error) {
      webhookLogger.error('[Webhook API] Signature verification error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Signature verification failed',
        },
        { status: 401 }
      );
    }

    if (!isValidSignature) {
      webhookLogger.error('[Webhook API] Invalid webhook signature');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook signature',
        },
        { status: 401 }
      );
    }

    // 4. Parse webhook payload
    let webhookPayload: DiditWebhookPayload;
    try {
      webhookPayload = JSON.parse(rawBody);
    } catch (error) {
      webhookLogger.error('[Webhook API] Failed to parse webhook payload:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload',
        },
        { status: 400 }
      );
    }

    webhookLogger.info(
      `[Webhook API] Processing ${webhookPayload.event} for session ${webhookPayload.sessionId}`
    );

    // 5. Process webhook event
    const result = await processDiditWebhook(webhookPayload);

    if (!result.valid) {
      webhookLogger.error('[Webhook API] Webhook processing failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to process webhook',
        },
        { status: 400 }
      );
    }

    // 6. Return success response
    webhookLogger.info(
      `[Webhook API] Webhook processed successfully: ${webhookPayload.event}`
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    webhookLogger.error('[Webhook API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
