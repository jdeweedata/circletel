/**
 * Netcash Payment Webhook Endpoint
 * Receives and processes webhook notifications from Netcash
 * Task 3.3: Netcash Webhook Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateWebhookRequest,
  determineWebhookType,
  generateIdempotencyKey,
  extractOrderIdFromReference,
  sanitizePayloadForLogging,
  type NetcashWebhookPayload,
} from '@/lib/payment/netcash-webhook-validator';
import {
  processPaymentSuccess,
  processPaymentFailure,
  processRefund,
  processChargeback,
} from '@/lib/payment/netcash-webhook-processor';

// ==================================================================
// CONFIGURATION
// ==================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration (100 requests per minute per IP)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100;

// In-memory rate limit store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// ==================================================================
// RATE LIMITING
// ==================================================================

/**
 * Check if IP address is rate limited
 */
function checkRateLimit(ipAddress: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ipAddress);

  // Clean up expired entries
  if (record && record.resetTime < now) {
    rateLimitStore.delete(ipAddress);
  }

  // Get or create rate limit record
  const current = rateLimitStore.get(ipAddress) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  // Check if limit exceeded
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: current.resetTime };
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(ipAddress, current);

  return { allowed: true };
}

// ==================================================================
// HELPER FUNCTIONS
// ==================================================================

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Log webhook to database
 */
async function logWebhook(
  payload: NetcashWebhookPayload,
  signature: string | null,
  signatureValid: boolean,
  sourceIP: string,
  userAgent: string | null
): Promise<string> {
  const webhookType = determineWebhookType(payload);
  const orderId = extractOrderIdFromReference(payload.Reference);

  const { data, error } = await supabase
    .from('payment_webhooks')
    .insert({
      order_id: orderId || null,
      payment_reference: payload.Reference,
      webhook_type: webhookType,
      netcash_transaction_id: payload.TransactionID || null,
      netcash_reference: payload.Reference,
      amount: parseFloat(payload.Amount) / 100, // Convert cents to rands
      status: 'received',
      raw_payload: payload,
      signature: signature || null,
      signature_valid: signatureValid,
      source_ip: sourceIP,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Webhook Endpoint] Failed to log webhook:', error);
    throw new Error(`Failed to log webhook: ${error.message}`);
  }

  return data.id;
}

/**
 * Check if webhook is duplicate (idempotency check)
 */
async function isDuplicateWebhook(payload: NetcashWebhookPayload): Promise<boolean> {
  if (!payload.TransactionID) {
    return false; // Cannot check duplicates without transaction ID
  }

  const webhookType = determineWebhookType(payload);

  const { data, error } = await supabase
    .from('payment_webhooks')
    .select('id')
    .eq('netcash_transaction_id', payload.TransactionID)
    .eq('webhook_type', webhookType)
    .eq('status', 'processed')
    .limit(1);

  if (error) {
    console.error('[Webhook Endpoint] Duplicate check failed:', error);
    return false; // On error, allow processing
  }

  return data && data.length > 0;
}

/**
 * Update webhook status
 */
async function updateWebhookStatus(
  webhookId: string,
  status: 'processing' | 'processed' | 'failed' | 'duplicate',
  errorMessage?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'processed') {
    updateData.processed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('payment_webhooks')
    .update(updateData)
    .eq('id', webhookId);

  if (error) {
    console.error('[Webhook Endpoint] Failed to update webhook status:', error);
  }
}

/**
 * Get active payment configuration for webhook secret
 */
async function getActivePaymentConfig(): Promise<{
  webhookSecret: string;
  environment: string;
} | null> {
  const { data, error } = await supabase.rpc('get_active_payment_config', {
    env: process.env.NODE_ENV === 'production' ? 'production' : 'test',
  });

  if (error || !data || data.length === 0) {
    console.error('[Webhook Endpoint] No active payment configuration found');
    return null;
  }

  return {
    webhookSecret: data[0].webhook_secret,
    environment: data[0].environment,
  };
}

// ==================================================================
// WEBHOOK PROCESSOR ROUTER
// ==================================================================

/**
 * Route webhook to appropriate processor based on type
 */
async function routeWebhookProcessor(
  webhookId: string,
  payload: NetcashWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  const webhookType = determineWebhookType(payload);

  console.log(`[Webhook Endpoint] Processing webhook type: ${webhookType}`);

  try {
    switch (webhookType) {
      case 'payment_success':
        return await processPaymentSuccess(payload, webhookId);

      case 'payment_failure':
        return await processPaymentFailure(payload, webhookId);

      case 'refund':
        return await processRefund(payload, webhookId);

      case 'chargeback':
        return await processChargeback(payload, webhookId);

      case 'payment_pending':
        // For pending payments, just log and wait
        console.log('[Webhook Endpoint] Payment pending, no action taken');
        return { success: true };

      case 'notify':
        // Generic notification, log only
        console.log('[Webhook Endpoint] Generic notification received');
        return { success: true };

      default:
        console.warn(`[Webhook Endpoint] Unknown webhook type: ${webhookType}`);
        return { success: true }; // Still return success to prevent Netcash retries
    }
  } catch (error) {
    console.error('[Webhook Endpoint] Processor error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error',
    };
  }
}

// ==================================================================
// MAIN WEBHOOK HANDLER
// ==================================================================

/**
 * POST /api/payment/netcash/webhook
 * Handle incoming webhook notifications from Netcash
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let webhookId: string | undefined;

  try {
    // ==================================================================
    // 1. RATE LIMITING
    // ==================================================================

    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      console.warn(`[Webhook Endpoint] Rate limit exceeded for IP: ${clientIP}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetTime! - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime! - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime!.toString(),
          },
        }
      );
    }

    // ==================================================================
    // 2. GET WEBHOOK SECRET
    // ==================================================================

    const config = await getActivePaymentConfig();

    if (!config) {
      console.error('[Webhook Endpoint] No active payment configuration found');

      // Always return 200 to Netcash to prevent retries
      return NextResponse.json(
        {
          success: false,
          error: 'Payment configuration not found',
        },
        { status: 200 }
      );
    }

    console.log(`[Webhook Endpoint] Using ${config.environment} configuration`);

    // ==================================================================
    // 3. VALIDATE WEBHOOK REQUEST
    // ==================================================================

    const validationResult = await validateWebhookRequest(req, config.webhookSecret);

    if (!validationResult.valid) {
      console.error('[Webhook Endpoint] Validation failed:', validationResult.errors);

      // Log failed webhook attempt
      const userAgent = req.headers.get('user-agent');
      const signature = req.headers.get('x-netcash-signature') ||
                       req.headers.get('x-signature');

      // Still return 200 to prevent Netcash retries
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook validation failed',
          errors: validationResult.errors,
        },
        { status: 200 }
      );
    }

    const payload = validationResult.payload!;
    const sanitizedPayload = sanitizePayloadForLogging(payload);

    console.log('[Webhook Endpoint] Webhook received:', sanitizedPayload);

    // ==================================================================
    // 4. CHECK FOR DUPLICATE (IDEMPOTENCY)
    // ==================================================================

    const isDuplicate = await isDuplicateWebhook(payload);

    if (isDuplicate) {
      console.log('[Webhook Endpoint] Duplicate webhook detected, skipping processing');

      // Log as duplicate
      const userAgent = req.headers.get('user-agent');
      const signature = req.headers.get('x-netcash-signature') ||
                       req.headers.get('x-signature');

      webhookId = await logWebhook(
        payload,
        signature,
        true,
        clientIP,
        userAgent
      );

      await updateWebhookStatus(webhookId, 'duplicate');

      return NextResponse.json(
        {
          success: true,
          message: 'Duplicate webhook, already processed',
        },
        { status: 200 }
      );
    }

    // ==================================================================
    // 5. LOG WEBHOOK TO DATABASE
    // ==================================================================

    const userAgent = req.headers.get('user-agent');
    const signature = req.headers.get('x-netcash-signature') ||
                     req.headers.get('x-signature');

    webhookId = await logWebhook(
      payload,
      signature,
      true, // Signature valid (passed validation)
      clientIP,
      userAgent
    );

    console.log(`[Webhook Endpoint] Webhook logged with ID: ${webhookId}`);

    // ==================================================================
    // 6. UPDATE STATUS TO PROCESSING
    // ==================================================================

    await updateWebhookStatus(webhookId, 'processing');

    // ==================================================================
    // 7. ROUTE TO APPROPRIATE PROCESSOR
    // ==================================================================

    const processingResult = await routeWebhookProcessor(webhookId, payload);

    // ==================================================================
    // 8. UPDATE FINAL STATUS
    // ==================================================================

    if (processingResult.success) {
      await updateWebhookStatus(webhookId, 'processed');

      const processingTime = Date.now() - startTime;
      console.log(`[Webhook Endpoint] Webhook processed successfully in ${processingTime}ms`);

      return NextResponse.json(
        {
          success: true,
          message: 'Webhook processed successfully',
          webhookId,
          processingTime,
        },
        { status: 200 }
      );
    } else {
      await updateWebhookStatus(webhookId, 'failed', processingResult.error);

      console.error('[Webhook Endpoint] Processing failed:', processingResult.error);

      // Still return 200 to Netcash
      return NextResponse.json(
        {
          success: false,
          error: 'Processing failed',
          message: processingResult.error,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[Webhook Endpoint] Unexpected error:', error);

    // Update webhook status if we have an ID
    if (webhookId) {
      await updateWebhookStatus(
        webhookId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Always return 200 to prevent Netcash retries
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

// ==================================================================
// HEALTH CHECK ENDPOINT
// ==================================================================

/**
 * GET /api/payment/netcash/webhook
 * Health check endpoint
 */
export async function GET() {
  try {
    // Check if payment configuration exists
    const config = await getActivePaymentConfig();

    if (!config) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'No active payment configuration found',
        },
        { status: 503 }
      );
    }

    // Check database connection
    const { error } = await supabase
      .from('payment_webhooks')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Database connection failed',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        environment: config.environment,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
