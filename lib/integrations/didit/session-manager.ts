/**
 * Didit KYC Session Manager
 *
 * Business logic for creating and managing Didit KYC verification sessions
 * Integrates with CircleTel quote system and Supabase database
 */

import { createClient } from '@/lib/supabase/server';
import { createSession } from './client';
import { WebhookUrls } from '@/lib/utils/webhook-urls';
import type {
  DiditSessionRequest,
  DiditFlowType,
  KYCSessionCreationResult,
} from './types';

/**
 * Quote Amount Threshold for Full KYC
 *
 * Quotes >= R500,000 require comprehensive KYC verification
 * Quotes < R500,000 use light KYC verification
 */
const FULL_KYC_THRESHOLD = 500000; // R500k

/**
 * Create KYC Session for Quote
 *
 * Determines appropriate KYC flow based on quote amount and customer type,
 * creates Didit session, stores in database, returns verification URL
 *
 * @param quoteId - CircleTel business quote ID
 * @returns Session details with verification URL for customer
 *
 * @throws Error if quote not found or Didit API fails
 *
 * @example
 * const session = await createKYCSessionForQuote('bq_abc123');
 * // Redirect customer to session.verificationUrl
 */
export async function createKYCSessionForQuote(
  quoteId: string
): Promise<KYCSessionCreationResult> {
  const supabase = await createClient();

  // 1. Fetch quote details
  // NOTE: The business_quotes table does not have a generic total_amount column.
  // We use total_monthly as the primary pricing signal for KYC flow decisions.
  const { data: quote, error: quoteError } = await supabase
    .from('business_quotes')
    .select('id, total_monthly, customer_type, customer_id')
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) {
    console.error(`[Session Manager] Quote not found: ${quoteId}`, quoteError);
    throw new Error(`Quote not found: ${quoteId}`);
  }

  // 2. Normalise customer type for KYC purposes
  const kycUserType: 'business' | 'consumer' =
    quote.customer_type === 'consumer' ? 'consumer' : 'business';

  // 3. Determine KYC flow type based on quote monthly total
  const flowType = determineFlowType(quote.total_monthly, kycUserType);
  const diditFlowType = mapFlowTypeToDidit(flowType);

  console.log(
    `[Session Manager] Creating ${flowType} KYC session for quote ${quoteId} (R${quote.total_monthly} p/m)`
  );

  // 4. Build Didit session request
  const sessionRequest: DiditSessionRequest = {
    type: 'kyc',
    jurisdiction: 'ZA',
    flow: diditFlowType,
    features: ['id_verification', 'document_extraction', 'liveness', 'aml'],
    metadata: {
      quote_id: quoteId,
      user_type: kycUserType,
      quote_amount: quote.total_monthly,
    },
    redirect_url: WebhookUrls.kycCompleted(quoteId),
    webhook_url: WebhookUrls.didit(),
  };

  // 5. Create session via Didit API
  let diditResponse;
  try {
    diditResponse = await createSession(sessionRequest);
  } catch (error) {
    console.error('[Session Manager] Didit API error:', error);
    throw new Error('Failed to create KYC session with Didit');
  }

  // 6. Store session in database
  const { error: insertError } = await supabase.from('kyc_sessions').insert({
    quote_id: quoteId,
    didit_session_id: diditResponse.sessionId,
    flow_type: flowType,
    user_type: kycUserType,
    status: 'not_started',
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('[Session Manager] Failed to store session:', insertError);
    throw new Error('Failed to store KYC session in database');
  }

  console.log(
    `[Session Manager] KYC session created: ${diditResponse.sessionId} (${flowType})`
  );

  // 7. Return session details
  return {
    sessionId: diditResponse.sessionId,
    verificationUrl: diditResponse.verificationUrl,
    flowType,
    expiresAt: diditResponse.expiresAt,
  };
}

/**
 * Determine KYC Flow Type
 *
 * Business logic for selecting appropriate KYC verification flow
 *
 * Rules:
 * - Business quotes >= R500k: full_kyc (comprehensive)
 * - Business quotes < R500k: sme_light (basic)
 * - Consumer quotes: consumer_light (basic)
 *
 * @param quoteAmount - Total quote amount in ZAR
 * @param customerType - 'business' or 'consumer'
 * @returns Flow type identifier
 */
function determineFlowType(
  quoteAmount: number,
  customerType: 'business' | 'consumer'
): 'sme_light' | 'consumer_light' | 'full_kyc' {
  if (customerType === 'consumer') {
    return 'consumer_light';
  }

  // Business customer
  if (quoteAmount >= FULL_KYC_THRESHOLD) {
    return 'full_kyc';
  }

  return 'sme_light';
}

/**
 * Map CircleTel Flow Type to Didit API Flow Name
 *
 * @param flowType - Internal flow type
 * @returns Didit API flow name
 */
function mapFlowTypeToDidit(
  flowType: 'sme_light' | 'consumer_light' | 'full_kyc'
): DiditFlowType {
  switch (flowType) {
    case 'sme_light':
      return 'business_light_kyc';
    case 'consumer_light':
      return 'consumer_light_kyc';
    case 'full_kyc':
      return 'business_full_kyc';
    default:
      return 'business_light_kyc';
  }
}

/**
 * Retry KYC Session
 *
 * Creates new Didit session for quotes with declined/abandoned KYC
 * Updates existing kyc_sessions record with new session ID
 *
 * @param quoteId - CircleTel business quote ID
 * @returns New session details
 */
export async function retryKYCSession(
  quoteId: string
): Promise<KYCSessionCreationResult> {
  const supabase = await createClient();

  // 1. Find existing KYC session
  const { data: existingSession, error: sessionError } = await supabase
    .from('kyc_sessions')
    .select('id, flow_type, status')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !existingSession) {
    console.warn(`[Session Manager] No existing session for quote ${quoteId}, creating new`);
    return createKYCSessionForQuote(quoteId);
  }

  // 2. Verify session can be retried
  if (
    existingSession.status !== 'declined' &&
    existingSession.status !== 'abandoned'
  ) {
    throw new Error(
      `Cannot retry KYC session with status: ${existingSession.status}. Only declined or abandoned sessions can be retried.`
    );
  }

  console.log(
    `[Session Manager] Retrying KYC for quote ${quoteId} (previous: ${existingSession.status})`
  );

  // 3. Create new session (same logic as initial creation)
  return createKYCSessionForQuote(quoteId);
}

/**
 * Get KYC Session Status
 *
 * Retrieves current status of KYC session from database
 *
 * @param quoteId - CircleTel business quote ID
 * @returns Session status details or null if not found
 */
export async function getKYCSessionStatus(quoteId: string): Promise<{
  status: string;
  verification_result: string | null;
  risk_tier: string | null;
  completed_at: string | null;
  didit_session_id: string;
} | null> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('kyc_sessions')
    .select('status, verification_result, risk_tier, completed_at, didit_session_id')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !session) {
    console.warn(`[Session Manager] No KYC session found for quote ${quoteId}`);
    return null;
  }

  return session;
}

export async function createKYCSessionForKYBSubject(
  subjectId: string,
  expectedType?: 'ubo' | 'director'
): Promise<KYCSessionCreationResult> {
  const supabase = await createClient();

  const { data: subject, error: subjectError } = await supabase
    .from('kyb_subjects')
    .select('id, quote_id, subject_type')
    .eq('id', subjectId)
    .single();

  if (subjectError || !subject) {
    console.error(`[Session Manager] KYB subject not found: ${subjectId}`, subjectError);
    throw new Error(`KYB subject not found: ${subjectId}`);
  }

  if (expectedType && subject.subject_type !== expectedType) {
    console.error(
      `[Session Manager] KYB subject type mismatch for ${subjectId}: expected ${expectedType}, got ${subject.subject_type}`
    );
    throw new Error('KYB subject type mismatch');
  }

  const { data: quote, error: quoteError } = await supabase
    .from('business_quotes')
    .select('id, total_monthly, customer_type, customer_id')
    .eq('id', subject.quote_id)
    .single();

  if (quoteError || !quote) {
    console.error(
      `[Session Manager] Quote not found for KYB subject ${subjectId}: ${subject.quote_id}`,
      quoteError
    );
    throw new Error(`Quote not found for KYB subject: ${subjectId}`);
  }

  const kycUserType: 'business' | 'consumer' =
    quote.customer_type === 'consumer' ? 'consumer' : 'business';

  const flowType = determineFlowType(quote.total_monthly, kycUserType);
  const diditFlowType = mapFlowTypeToDidit(flowType);

  console.log(
    `[Session Manager] Creating ${flowType} KYB KYC session for subject ${subjectId} on quote ${subject.quote_id}`
  );

  const sessionRequest: DiditSessionRequest = {
    type: 'kyc',
    jurisdiction: 'ZA',
    flow: diditFlowType,
    features: ['id_verification', 'document_extraction', 'liveness', 'aml'],
    metadata: {
      quote_id: quote.id,
      user_type: kycUserType,
      quote_amount: quote.total_monthly,
      context: 'kyb_subject',
      subject_type: subject.subject_type as 'ubo' | 'director',
      kyb_subject_id: subject.id,
    },
    redirect_url: WebhookUrls.kycCompleted(quote.id),
    webhook_url: WebhookUrls.didit(),
  };

  let diditResponse;
  try {
    diditResponse = await createSession(sessionRequest);
  } catch (error) {
    console.error('[Session Manager] Didit API error (KYB subject):', error);
    throw new Error('Failed to create KYB KYC session with Didit');
  }

  const { error: insertError } = await supabase.from('kyc_sessions').insert({
    quote_id: quote.id,
    didit_session_id: diditResponse.sessionId,
    flow_type: flowType,
    user_type: kycUserType,
    status: 'not_started',
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('[Session Manager] Failed to store KYB KYC session:', insertError);
    throw new Error('Failed to store KYB KYC session in database');
  }

  const { error: subjectUpdateError } = await supabase
    .from('kyb_subjects')
    .update({
      didit_session_id: diditResponse.sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subjectId);

  if (subjectUpdateError) {
    console.error(
      '[Session Manager] Failed to update KYB subject with session id:',
      subjectUpdateError
    );
  }

  return {
    sessionId: diditResponse.sessionId,
    verificationUrl: diditResponse.verificationUrl,
    flowType,
    expiresAt: diditResponse.expiresAt,
  };
}
