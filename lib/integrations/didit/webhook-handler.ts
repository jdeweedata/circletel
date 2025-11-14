/**
 * Didit KYC Webhook Handler
 *
 * Processes webhook events from Didit KYC verification system
 * Implements HMAC-SHA256 signature verification for security
 */

import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { calculateRiskTier } from '@/lib/compliance/risk-scoring';
import type {
  DiditWebhookPayload,
  WebhookVerificationResult,
  ExtractedKYCData,
} from './types';

// Webhook secret for HMAC verification
const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET;

if (!DIDIT_WEBHOOK_SECRET) {
  console.warn(
    '[Webhook Handler] DIDIT_WEBHOOK_SECRET not configured. Webhook signature verification will fail.'
  );
}

/**
 * Verify Didit Webhook Signature
 *
 * Implements HMAC-SHA256 signature verification using timing-safe comparison
 * This prevents timing attacks where attackers try to guess the signature
 *
 * @param payload - Raw webhook payload (JSON string)
 * @param signature - Signature from X-Didit-Signature header
 * @returns True if signature is valid, false otherwise
 *
 * @example
 * const isValid = verifyDiditWebhook(
 *   JSON.stringify(webhookData),
 *   request.headers.get('X-Didit-Signature')
 * );
 */
export function verifyDiditWebhook(payload: string, signature: string): boolean {
  if (!DIDIT_WEBHOOK_SECRET) {
    throw new Error('DIDIT_WEBHOOK_SECRET is not configured');
  }

  if (!signature) {
    console.error('[Webhook Handler] No signature provided');
    return false;
  }

  try {
    // Generate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', DIDIT_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Convert both signatures to buffers for timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);

    // Buffers must be same length for timingSafeEqual
    if (expectedBuffer.length !== receivedBuffer.length) {
      console.error(
        '[Webhook Handler] Signature length mismatch',
        `Expected: ${expectedBuffer.length}, Received: ${receivedBuffer.length}`
      );
      return false;
    }

    // Timing-safe comparison prevents timing attacks
    const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      console.error('[Webhook Handler] Signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook Handler] Signature verification error:', error);
    return false;
  }
}

/**
 * Process Didit Webhook Event
 *
 * Handles all Didit webhook events and updates database accordingly
 *
 * Supported events:
 * - verification.completed: KYC verification finished successfully
 * - verification.failed: KYC verification failed (invalid docs, etc.)
 * - session.abandoned: Customer closed verification without completing
 * - session.expired: Session expired (typically 7 days)
 *
 * @param payload - Parsed webhook payload
 * @returns Result object with success status
 *
 * @example
 * const result = await processDiditWebhook(webhookPayload);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export async function processDiditWebhook(
  payload: DiditWebhookPayload
): Promise<WebhookVerificationResult> {
  const { timestamp, result, data, error } = payload;

  const rawEvent = (payload as any).event || (payload as any).webhook_type;
  const event = rawEvent as DiditWebhookPayload['event'] | undefined;

  const sessionId = (payload as any).sessionId || (payload as any).session_id;

  console.log(
    `[Webhook Handler] Processing event: ${event} for session ${sessionId} at ${timestamp}`
  );

  const supabase = await createClient();

  if (!sessionId) {
    const errorMsg =
      'Didit webhook payload missing session identifier (sessionId/session_id)';
    console.error('[Webhook Handler]', errorMsg);
    return {
      valid: false,
      error: errorMsg,
    };
  }

  let kybSubjectId: string | undefined;
  if (payload.vendor_data) {
    try {
      const vendorMeta = JSON.parse(payload.vendor_data as string);
      if (vendorMeta && typeof vendorMeta.kyb_subject_id === 'string') {
        kybSubjectId = vendorMeta.kyb_subject_id;
      }
    } catch (parseError) {
      console.error('[Webhook Handler] Failed to parse vendor_data:', parseError);
    }
  }

  // 1. Find existing KYC session
  const { data: session, error: sessionError } = await supabase
    .from('kyc_sessions')
    .select('id, quote_id, status, raw_webhook_payload')
    .eq('didit_session_id', sessionId)
    .single();

  if (sessionError || !session) {
    const errorMsg = `KYC session not found for Didit session ID: ${sessionId}`;
    console.error('[Webhook Handler]', errorMsg, sessionError);
    return {
      valid: false,
      error: errorMsg,
    };
  }

  // 2. Check for idempotency (prevent duplicate processing)
  if (session.raw_webhook_payload) {
    const previousPayload = session.raw_webhook_payload as DiditWebhookPayload;
    if (
      previousPayload.event === event &&
      previousPayload.timestamp === timestamp
    ) {
      console.warn(
        `[Webhook Handler] Duplicate webhook detected for session ${sessionId}, skipping`
      );
      return {
        valid: true,
        sessionId,
      };
    }
  }

  // 3. Handle event based on type
  switch (event) {
    case 'verification.completed':
      return handleVerificationCompleted(session.id, result, data, payload, kybSubjectId);

    case 'verification.failed':
      return handleVerificationFailed(session.id, error, payload, kybSubjectId);

    case 'session.abandoned':
      return handleSessionAbandoned(session.id, payload, kybSubjectId);

    case 'session.expired':
      return handleSessionExpired(session.id, payload, kybSubjectId);

    case 'status.updated':
      return handleStatusUpdated(session.id, payload, kybSubjectId);

    default:
      console.warn(`[Webhook Handler] Unknown event type: ${event}`);
      return {
        valid: false,
        error: `Unknown event type: ${event}`,
      };
  }
}

/**
 * Handle Verification Completed Event
 *
 * Processes successful KYC verification, calculates risk tier,
 * determines if auto-approval is possible
 */
async function handleVerificationCompleted(
  sessionId: string,
  result: DiditWebhookPayload['result'],
  extractedData: ExtractedKYCData | undefined,
  rawPayload: DiditWebhookPayload,
  kybSubjectId?: string
): Promise<WebhookVerificationResult> {
  const supabase = await createClient();

  if (!result || !extractedData) {
    console.error('[Webhook Handler] Verification completed but missing result or data');
    return {
      valid: false,
      error: 'Missing result or extracted data',
    };
  }

  // Calculate risk tier based on extracted data
  const riskScore = calculateRiskTier(extractedData);

  console.log(
    `[Webhook Handler] KYC completed - Risk: ${riskScore.risk_tier} (${riskScore.total_score}/100)`
  );

  // Determine verification result based on risk tier
  let verificationResult: 'approved' | 'declined' | 'pending_review';
  if (riskScore.auto_approved) {
    verificationResult = 'approved';
  } else if (riskScore.risk_tier === 'high') {
    verificationResult = 'declined';
  } else {
    verificationResult = 'pending_review'; // Medium risk = admin review
  }

  // Update kyc_sessions table
  const { error: updateError } = await supabase
    .from('kyc_sessions')
    .update({
      status: 'completed',
      extracted_data: extractedData,
      verification_result: verificationResult,
      risk_tier: riskScore.risk_tier,
      completed_at: new Date().toISOString(),
      webhook_received_at: new Date().toISOString(),
      raw_webhook_payload: rawPayload,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('[Webhook Handler] Failed to update session:', updateError);
    return {
      valid: false,
      error: 'Failed to update KYC session',
    };
  }

  // If this session belongs to a KYB subject (UBO/director), update its status
  if (kybSubjectId) {
    const { error: kybUpdateError } = await supabase
      .from('kyb_subjects')
      .update({
        kyc_status: verificationResult,
        risk_tier: riskScore.risk_tier,
      })
      .eq('id', kybSubjectId);

    if (kybUpdateError) {
      console.error(
        '[Webhook Handler] Failed to update KYB subject KYC fields:',
        kybUpdateError
      );
    }
  }

  console.log(
    `[Webhook Handler] KYC session ${sessionId} updated: ${verificationResult}`
  );

  // Send KYC completion email notification
  try {
    // Import dynamically to avoid circular dependencies
    const { sendKYCCompletedEmail } = await import('@/lib/notifications/workflow-notifications');
    
    // Fetch quote details for email
    const { data: kycWithQuote } = await supabase
      .from('kyc_sessions')
      .select('*, quote:business_quotes(*)')
      .eq('id', sessionId)
      .single();

    if (kycWithQuote && kycWithQuote.quote) {
      await sendKYCCompletedEmail({
        id: sessionId,
        quote_id: kycWithQuote.quote_id,
        verification_result: verificationResult,
        risk_tier: riskScore.risk_tier,
        completed_at: new Date().toISOString(),
        customer_name: kycWithQuote.quote.contact_name,
        customer_email: kycWithQuote.quote.contact_email,
        quote_number: kycWithQuote.quote.quote_number,
      });
      
      console.log('[Webhook Handler] KYC completion email sent');
    }
  } catch (emailError) {
    // Log but don't fail the webhook
    console.error('[Webhook Handler] Failed to send KYC email:', emailError);
  }

  // TODO: Trigger contract generation if auto-approved (low risk)
  // This will be implemented in Task Group 6

  return {
    valid: true,
    sessionId,
  };
}

async function handleStatusUpdated(
  sessionId: string,
  rawPayload: DiditWebhookPayload,
  kybSubjectId?: string
): Promise<WebhookVerificationResult> {
  const supabase = await createClient();

  const diditStatusRaw = (rawPayload as any).status as string | undefined;
  const normalizedStatus = diditStatusRaw
    ? diditStatusRaw.toLowerCase().replace(/\s+/g, '_')
    : undefined;

  let kycStatus: 'not_started' | 'in_progress' | 'completed' | 'abandoned' =
    'in_progress';
  let verificationResult: 'approved' | 'declined' | 'pending_review' | null =
    null;
  let riskTier: 'low' | 'medium' | 'high' | null = null;
  let completedAt: string | null = null;

  switch (normalizedStatus) {
    case 'approved':
      kycStatus = 'completed';
      verificationResult = 'approved';
      riskTier = 'low';
      completedAt = new Date().toISOString();
      break;
    case 'declined':
    case 'rejected':
      kycStatus = 'completed';
      verificationResult = 'declined';
      riskTier = 'high';
      completedAt = new Date().toISOString();
      break;
    case 'in_review':
      kycStatus = 'in_progress';
      verificationResult = 'pending_review';
      riskTier = 'medium';
      break;
    case 'abandoned':
      kycStatus = 'abandoned';
      completedAt = new Date().toISOString();
      break;
    case 'expired':
    case 'kyc_expired':
      kycStatus = 'abandoned';
      completedAt = new Date().toISOString();
      break;
    default:
      kycStatus = 'in_progress';
      break;
  }

  const updatePayload: Record<string, unknown> = {
    status: kycStatus,
    webhook_received_at: new Date().toISOString(),
    raw_webhook_payload: rawPayload,
  };

  if (verificationResult) {
    updatePayload.verification_result = verificationResult;
  }

  if (riskTier) {
    updatePayload.risk_tier = riskTier;
  }

  if (completedAt) {
    updatePayload.completed_at = completedAt;
  }

  const { error: updateError } = await supabase
    .from('kyc_sessions')
    .update(updatePayload)
    .eq('id', sessionId);

  if (updateError) {
    console.error('[Webhook Handler] Failed to update session (status.updated):', updateError);
    return {
      valid: false,
      error: 'Failed to update KYC session from status.updated',
    };
  }

  if (kybSubjectId && (verificationResult || riskTier)) {
    const kybUpdate: Record<string, unknown> = {};

    if (verificationResult) {
      kybUpdate.kyc_status = verificationResult;
    }

    if (riskTier) {
      kybUpdate.risk_tier = riskTier;
    }

    if (Object.keys(kybUpdate).length > 0) {
      const { error: kybUpdateError } = await supabase
        .from('kyb_subjects')
        .update(kybUpdate)
        .eq('id', kybSubjectId);

      if (kybUpdateError) {
        console.error(
          '[Webhook Handler] Failed to update KYB subject KYC fields (status.updated):',
          kybUpdateError
        );
      }
    }
  }

  return {
    valid: true,
    sessionId,
  };
}

/**
 * Handle Verification Failed Event
 *
 * Customer attempted verification but failed (invalid ID, expired docs, etc.)
 */
async function handleVerificationFailed(
  sessionId: string,
  error: DiditWebhookPayload['error'],
  rawPayload: DiditWebhookPayload,
  kybSubjectId?: string
): Promise<WebhookVerificationResult> {
  const supabase = await createClient();

  console.log(`[Webhook Handler] KYC verification failed:`, error?.message);

  const { error: updateError } = await supabase
    .from('kyc_sessions')
    .update({
      status: 'declined',
      verification_result: 'declined',
      risk_tier: 'high',
      completed_at: new Date().toISOString(),
      webhook_received_at: new Date().toISOString(),
      raw_webhook_payload: rawPayload,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('[Webhook Handler] Failed to update session:', updateError);
    return {
      valid: false,
      error: 'Failed to update KYC session',
    };
  }

  if (kybSubjectId) {
    const { error: kybUpdateError } = await supabase
      .from('kyb_subjects')
      .update({
        kyc_status: 'declined',
        risk_tier: 'high',
      })
      .eq('id', kybSubjectId);

    if (kybUpdateError) {
      console.error(
        '[Webhook Handler] Failed to update KYB subject KYC fields (failed):',
        kybUpdateError
      );
    }
  }

  // TODO: Send customer email with retry instructions
  // This will be implemented in Task Group 14

  return {
    valid: true,
    sessionId,
  };
}

/**
 * Handle Session Abandoned Event
 *
 * Customer started but didn't complete verification
 */
async function handleSessionAbandoned(
  sessionId: string,
  rawPayload: DiditWebhookPayload,
  kybSubjectId?: string
): Promise<WebhookVerificationResult> {
  const supabase = await createClient();

  console.log(`[Webhook Handler] KYC session abandoned`);

  const { error: updateError } = await supabase
    .from('kyc_sessions')
    .update({
      status: 'abandoned',
      webhook_received_at: new Date().toISOString(),
      raw_webhook_payload: rawPayload,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('[Webhook Handler] Failed to update session:', updateError);
    return {
      valid: false,
      error: 'Failed to update KYC session',
    };
  }

  if (kybSubjectId) {
    const { error: kybUpdateError } = await supabase
      .from('kyb_subjects')
      .update({
        kyc_status: 'abandoned',
      })
      .eq('id', kybSubjectId);

    if (kybUpdateError) {
      console.error(
        '[Webhook Handler] Failed to update KYB subject KYC fields (abandoned):',
        kybUpdateError
      );
    }
  }

  // TODO: Send reminder email after 6 hours
  // This will be implemented in Task Group 14

  return {
    valid: true,
    sessionId,
  };
}

/**
 * Handle Session Expired Event
 *
 * Session expired before customer completed verification (typically 7 days)
 */
async function handleSessionExpired(
  sessionId: string,
  rawPayload: DiditWebhookPayload,
  kybSubjectId?: string
): Promise<WebhookVerificationResult> {
  const supabase = await createClient();

  console.log(`[Webhook Handler] KYC session expired`);

  const { error: updateError } = await supabase
    .from('kyc_sessions')
    .update({
      status: 'abandoned',
      webhook_received_at: new Date().toISOString(),
      raw_webhook_payload: rawPayload,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('[Webhook Handler] Failed to update session:', updateError);
    return {
      valid: false,
      error: 'Failed to update KYC session',
    };
  }

  if (kybSubjectId) {
    const { error: kybUpdateError } = await supabase
      .from('kyb_subjects')
      .update({
        kyc_status: 'expired',
      })
      .eq('id', kybSubjectId);

    if (kybUpdateError) {
      console.error(
        '[Webhook Handler] Failed to update KYB subject KYC fields (expired):',
        kybUpdateError
      );
    }
  }

  // TODO: Send email with "Create new verification" link
  // This will be implemented in Task Group 14

  return {
    valid: true,
    sessionId,
  };
}
