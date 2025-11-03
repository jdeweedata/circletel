/**
 * ZOHO CRM Webhook Handler
 * Task Group 7.4: Handle bidirectional sync (ZOHO → CircleTel)
 *
 * Processes ZOHO CRM webhook events for:
 * - Deal stage updates (Closed Won, Closed Lost, etc.)
 * - Custom field changes (KYC_Status, RICA_Status, etc.)
 * - Bidirectional synchronization
 */

import { createClient } from '@/lib/supabase/server';
import type { ZohoWebhookPayload } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface DealWebhookData {
  id: string;
  Deal_Name?: string;
  Stage?: string;
  KYC_Status?: string;
  RICA_Status?: string;
  Contract_Number?: string;
  [key: string]: unknown;
}

interface WebhookProcessingResult {
  success: boolean;
  message: string;
  affectedEntity?: {
    type: string;
    id: string;
  };
}

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

/**
 * Process ZOHO CRM webhook event
 *
 * @param payload - ZOHO webhook payload
 * @returns Processing result
 */
export async function processZohoCRMWebhook(
  payload: ZohoWebhookPayload
): Promise<WebhookProcessingResult> {
  const { module, operation, record_id, record_data } = payload;

  console.log(`[ZOHO CRM Webhook] Received ${operation} event for ${module} record ${record_id}`);

  try {
    // Route to appropriate handler based on module
    switch (module) {
      case 'Deals':
        return await handleDealWebhook(operation, record_id, record_data as DealWebhookData);

      case 'Contacts':
        return await handleContactWebhook(operation, record_id, record_data);

      case 'Quotes':
        return await handleQuoteWebhook(operation, record_id, record_data);

      default:
        console.warn(`[ZOHO CRM Webhook] Unsupported module: ${module}`);
        return {
          success: true,
          message: `Module ${module} not handled`,
        };
    }
  } catch (error) {
    console.error('[ZOHO CRM Webhook] Processing failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle Deal (Contract) webhook events
 * Syncs ZOHO Deal changes back to CircleTel contracts
 */
async function handleDealWebhook(
  operation: string,
  zohoId: string,
  data: DealWebhookData
): Promise<WebhookProcessingResult> {
  const supabase = await createClient();

  // Find CircleTel contract linked to this ZOHO Deal
  const { data: mapping } = await supabase
    .from('zoho_entity_mappings')
    .select('circletel_id')
    .eq('zoho_type', 'Deals')
    .eq('zoho_id', zohoId)
    .single();

  if (!mapping) {
    console.warn(`[ZOHO CRM Webhook] No mapping found for Deal ${zohoId}`);
    return {
      success: true,
      message: 'Deal not mapped to CircleTel entity',
    };
  }

  const contractId = mapping.circletel_id;

  // Process based on operation type
  switch (operation) {
    case 'update':
      await handleDealUpdate(contractId, data);
      break;

    case 'delete':
      // Don't delete contract in CircleTel, just log it
      console.log(`[ZOHO CRM Webhook] Deal ${zohoId} deleted in ZOHO (contract ${contractId} preserved)`);
      break;

    default:
      console.log(`[ZOHO CRM Webhook] Deal operation ${operation} not handled`);
  }

  return {
    success: true,
    message: `Deal ${operation} processed`,
    affectedEntity: {
      type: 'contract',
      id: contractId,
    },
  };
}

/**
 * Handle Deal update event
 * Updates CircleTel contract status based on ZOHO Deal stage
 */
async function handleDealUpdate(contractId: string, data: DealWebhookData): Promise<void> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};

  // 1. Sync Deal Stage to Contract Status
  if (data.Stage) {
    const mappedStatus = mapDealStageToContractStatus(data.Stage);
    if (mappedStatus) {
      updates.status = mappedStatus;
      console.log(`[ZOHO CRM Webhook] Deal stage '${data.Stage}' → Contract status '${mappedStatus}'`);
    }
  }

  // 2. Sync custom fields (if changed in ZOHO)
  if (data.KYC_Status) {
    // Note: This is informational - CircleTel is source of truth for KYC
    console.log(`[ZOHO CRM Webhook] Deal KYC_Status updated to: ${data.KYC_Status}`);
  }

  if (data.RICA_Status) {
    // Note: This is informational - CircleTel is source of truth for RICA
    console.log(`[ZOHO CRM Webhook] Deal RICA_Status updated to: ${data.RICA_Status}`);
  }

  // 3. Apply updates if any
  if (Object.keys(updates).length > 0) {
    updates.last_synced_at = new Date().toISOString();

    const { error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', contractId);

    if (error) {
      console.error('[ZOHO CRM Webhook] Failed to update contract:', error);
      throw error;
    }

    console.log(`[ZOHO CRM Webhook] Contract ${contractId} updated from ZOHO`);
  } else {
    console.log('[ZOHO CRM Webhook] No actionable updates for contract');
  }
}

/**
 * Handle Contact webhook events
 * Future implementation: Sync contact updates
 */
async function handleContactWebhook(
  operation: string,
  zohoId: string,
  data: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  console.log(`[ZOHO CRM Webhook] Contact ${operation} event (not yet implemented)`);

  return {
    success: true,
    message: 'Contact webhook acknowledged but not processed',
  };
}

/**
 * Handle Quote (Estimate) webhook events
 * Future implementation: Sync quote updates
 */
async function handleQuoteWebhook(
  operation: string,
  zohoId: string,
  data: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  console.log(`[ZOHO CRM Webhook] Quote ${operation} event (not yet implemented)`);

  return {
    success: true,
    message: 'Quote webhook acknowledged but not processed',
  };
}

// =============================================================================
// FIELD MAPPING HELPERS
// =============================================================================

/**
 * Map ZOHO Deal Stage to CircleTel Contract Status
 *
 * ZOHO Stages:
 * - Qualification
 * - Needs Analysis
 * - Value Proposition
 * - Identify Decision Makers
 * - Proposal/Price Quote
 * - Negotiation/Review
 * - Closed Won
 * - Closed Lost
 * - Closed-Lost to Competition
 *
 * CircleTel Statuses:
 * - draft
 * - pending_signature
 * - partially_signed
 * - fully_signed
 * - active
 * - expired
 * - terminated
 */
function mapDealStageToContractStatus(stage: string): string | null {
  const normalized = stage.toLowerCase();

  // Closed Won → Activate contract
  if (normalized.includes('closed won') || normalized === 'won') {
    return 'active';
  }

  // Closed Lost → Terminate contract
  if (
    normalized.includes('closed lost') ||
    normalized.includes('closed-lost') ||
    normalized === 'lost'
  ) {
    return 'terminated';
  }

  // Proposal/Negotiation → Draft or Pending Signature
  if (normalized.includes('proposal') || normalized.includes('negotiation')) {
    return 'draft';
  }

  // Other stages: No mapping (don't update)
  return null;
}

/**
 * Verify ZOHO webhook signature (HMAC-SHA256)
 * Note: ZOHO uses X-ZOHO-WEBHOOK-SIGNATURE header
 *
 * @param payload - Raw webhook payload (JSON string)
 * @param signature - Signature from X-ZOHO-WEBHOOK-SIGNATURE header
 * @param secret - Webhook secret key
 * @returns True if signature is valid
 */
export function verifyZohoWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // ZOHO uses HMAC-SHA256 for webhook verification
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Validate ZOHO webhook payload structure
 *
 * @param payload - Parsed webhook payload
 * @returns True if valid
 */
export function isValidZohoWebhookPayload(payload: unknown): payload is ZohoWebhookPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  return (
    typeof p.module === 'string' &&
    typeof p.operation === 'string' &&
    typeof p.record_id === 'string' &&
    typeof p.record_data === 'object'
  );
}

// =============================================================================
// LOGGING & MONITORING
// =============================================================================

/**
 * Log webhook event to database for audit trail
 *
 * @param payload - Webhook payload
 * @param result - Processing result
 */
export async function logWebhookEvent(
  payload: ZohoWebhookPayload,
  result: WebhookProcessingResult
): Promise<void> {
  const supabase = await createClient();

  try {
    await supabase.from('zoho_sync_logs').insert({
      entity_type: payload.module.toLowerCase() as 'quote' | 'contract' | 'invoice' | 'customer',
      entity_id: payload.record_id,
      zoho_entity_type: payload.module as 'Estimates' | 'Deals' | 'Invoices' | 'Contacts',
      zoho_entity_id: payload.record_id,
      status: result.success ? 'success' : 'failed',
      attempt_number: 1,
      error_message: result.success ? undefined : result.message,
      request_payload: payload as unknown as Record<string, unknown>,
      response_payload: result as unknown as Record<string, unknown>,
    });

    console.log('[ZOHO CRM Webhook] Event logged successfully');
  } catch (error) {
    console.error('[ZOHO CRM Webhook] Failed to log event:', error);
    // Don't throw - logging failure shouldn't break webhook processing
  }
}
