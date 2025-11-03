/**
 * ZOHO Sign Webhook Handler
 * Task Group 6: Contract Generation & PDF with KYC Badge
 *
 * Handles signature webhook events from ZOHO Sign API
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

export interface ZohoSignWebhookPayload {
  event_type: 'request.completed' | 'request.signed' | 'request.declined' | 'request.expired';
  request_id: string;
  request_name: string;
  actions?: Array<{
    action_id: string;
    recipient_email: string;
    recipient_name: string;
    action_type: 'SIGN';
    action_status: 'SIGNED' | 'DECLINED' | 'PENDING';
    signed_time?: string;
  }>;
  signed_document_url?: string;
}

// =============================================================================
// WEBHOOK HANDLERS
// =============================================================================

/**
 * Handle signature completion (both parties signed)
 *
 * @param contractId - Contract UUID
 * @param signedPdfUrl - URL of fully signed PDF from ZOHO Sign
 */
export async function handleSignatureComplete(
  contractId: string,
  signedPdfUrl: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const now = new Date().toISOString();

    // Update contract status to fully_signed
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'fully_signed',
        fully_signed_date: now,
        signed_pdf_url: signedPdfUrl,
      })
      .eq('id', contractId);

    if (error) {
      console.error('[handleSignatureComplete] Update error:', error);
      throw new Error(`Failed to update contract ${contractId}: ${error.message}`);
    }

    console.log(`[handleSignatureComplete] Contract ${contractId} fully signed`);

    // TODO: Trigger invoice generation (Task Group 10)
    // await triggerInvoiceGeneration(contractId);
  } catch (error: any) {
    console.error('[handleSignatureComplete] Error:', error);
    throw error;
  }
}

/**
 * Process ZOHO Sign webhook event
 *
 * @param payload - ZOHO Sign webhook payload
 * @returns Success status
 */
export async function processSignWebhook(payload: ZohoSignWebhookPayload): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { event_type, request_id, actions, signed_document_url } = payload;

    // 1. Find contract by ZOHO Sign request ID
    const { data: contract, error: findError } = await supabase
      .from('contracts')
      .select('id, status, customer_id')
      .eq('zoho_sign_request_id', request_id)
      .single();

    if (findError || !contract) {
      console.error(`[processSignWebhook] Contract not found for request ${request_id}`);
      return false;
    }

    const contractId = contract.id;
    const now = new Date().toISOString();

    // 2. Route event to appropriate handler
    switch (event_type) {
      case 'request.completed':
        // Both signers have signed
        if (!signed_document_url) {
          console.error('[processSignWebhook] Missing signed_document_url for completed event');
          return false;
        }

        await handleSignatureComplete(contractId, signed_document_url);
        break;

      case 'request.signed':
        // One signer has signed (partial signature)
        const updates: any = { status: 'partially_signed' };

        // Track which party signed based on action data
        if (actions && actions.length > 0) {
          const customerSignedAction = actions.find((a) =>
            a.action_status === 'SIGNED' && a.recipient_email !== 'contracts@circletel.co.za'
          );
          const circletelSignedAction = actions.find((a) =>
            a.action_status === 'SIGNED' && a.recipient_email === 'contracts@circletel.co.za'
          );

          if (customerSignedAction && customerSignedAction.signed_time) {
            updates.customer_signature_date = customerSignedAction.signed_time;
          }

          if (circletelSignedAction && circletelSignedAction.signed_time) {
            updates.circletel_signature_date = circletelSignedAction.signed_time;
          }
        }

        const { error: updateError } = await supabase
          .from('contracts')
          .update(updates)
          .eq('id', contractId);

        if (updateError) {
          console.error('[processSignWebhook] Partial signature update error:', updateError);
          return false;
        }

        console.log(`[processSignWebhook] Contract ${contractId} partially signed`);
        break;

      case 'request.declined':
        // Signature declined - revert to draft
        await supabase
          .from('contracts')
          .update({ status: 'draft' })
          .eq('id', contractId);

        console.log(`[processSignWebhook] Contract ${contractId} signature declined`);
        break;

      case 'request.expired':
        // Signature request expired - revert to draft
        await supabase
          .from('contracts')
          .update({ status: 'draft' })
          .eq('id', contractId);

        console.log(`[processSignWebhook] Contract ${contractId} signature request expired`);
        break;

      default:
        console.log(`[processSignWebhook] Unknown event type: ${event_type}`);
        return false;
    }

    return true;
  } catch (error: any) {
    console.error('[processSignWebhook] Processing error:', error);
    throw error;
  }
}

/**
 * Mark contract fully signed when both signatures received
 *
 * @param contractId - Contract UUID
 * @returns True if contract now fully signed
 */
export async function checkAndMarkFullySigned(contractId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Fetch contract with signature dates
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('customer_signature_date, circletel_signature_date, status')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      console.error('[checkAndMarkFullySigned] Contract fetch error:', error);
      return false;
    }

    // Check if both parties have signed
    const bothSigned =
      contract.customer_signature_date !== null && contract.circletel_signature_date !== null;

    if (bothSigned && contract.status !== 'fully_signed') {
      // Mark as fully signed
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'fully_signed',
          fully_signed_date: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) {
        console.error('[checkAndMarkFullySigned] Update error:', updateError);
        return false;
      }

      console.log(`[checkAndMarkFullySigned] Contract ${contractId} marked fully signed`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('[checkAndMarkFullySigned] Error:', error);
    return false;
  }
}

/**
 * Verify ZOHO Sign webhook signature (HMAC-SHA256)
 *
 * @param payload - Raw webhook payload string
 * @param signature - X-ZOHO-Sign-Signature header value
 * @param secret - ZOHO webhook secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[verifyWebhookSignature] Error:', error);
    return false;
  }
}
