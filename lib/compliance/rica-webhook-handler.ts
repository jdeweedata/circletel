/**
 * RICA Webhook Handler
 *
 * Purpose: Process RICA approval/rejection webhooks from ICASA
 * Task Group: 12 - RICA Webhook Processing
 */

import { createClient } from '@/lib/supabase/server';
import { activateService } from '@/lib/activation/service-activator';
import * as crypto from 'crypto';

const RICA_WEBHOOK_SECRET = process.env.RICA_WEBHOOK_SECRET;

/**
 * RICA Webhook Event Types
 */
export type RICAWebhookEvent = 'rica.approved' | 'rica.rejected' | 'rica.pending_review';

/**
 * RICA Webhook Payload
 */
export interface RICAWebhookPayload {
  event: RICAWebhookEvent;
  submission_id: string;
  order_id: string;
  icasa_tracking_id: string;
  rejection_reason?: string;
  timestamp?: string;
}

/**
 * Verify RICA Webhook Signature (HMAC-SHA256)
 *
 * @param payload - Raw request body (string)
 * @param signature - X-RICA-Signature header
 * @returns true if signature is valid
 */
export function verifyRICAWebhookSignature(payload: string, signature: string): boolean {
  if (!RICA_WEBHOOK_SECRET) {
    console.warn('[RICA Webhook] No webhook secret configured - skipping verification');
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', RICA_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[RICA Webhook] Signature comparison failed:', error);
    return false;
  }
}

/**
 * Process RICA Webhook
 *
 * Handles three webhook events:
 * 1. rica.approved → Activate service
 * 2. rica.rejected → Flag order for admin review
 * 3. rica.pending_review → Update status (no action)
 *
 * @param payload - Webhook payload
 * @returns Processing result
 */
export async function processRICAWebhook(payload: RICAWebhookPayload): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createClient();

  console.log('[RICA Webhook] Processing event:', payload.event, 'for order:', payload.order_id);

  try {
    // Update rica_submissions status
    const { error: updateError } = await supabase
      .from('rica_submissions')
      .update({
        status: payload.event === 'rica.approved' ? 'approved' :
                payload.event === 'rica.rejected' ? 'rejected' :
                'pending_review',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', payload.order_id);

    if (updateError) {
      console.error('[RICA Webhook] Failed to update submission:', updateError);
      throw new Error('Failed to update RICA submission');
    }

    // Handle event-specific actions
    switch (payload.event) {
      case 'rica.approved':
        console.log('[RICA Webhook] ✅ RICA approved - activating service');

        // Trigger service activation
        await activateService(payload.order_id);

        // Update order notes
        await supabase
          .from('consumer_orders')
          .update({
            notes: `RICA approved. ICASA Tracking: ${payload.icasa_tracking_id}`
          })
          .eq('id', payload.order_id);

        return {
          success: true,
          message: 'Service activated successfully'
        };

      case 'rica.rejected':
        console.log('[RICA Webhook] ❌ RICA rejected - flagging for admin review');

        // Update order status to require admin review
        await supabase
          .from('consumer_orders')
          .update({
            status: 'pending_review',
            notes: `RICA rejected: ${payload.rejection_reason || 'Unknown reason'}. ICASA Tracking: ${payload.icasa_tracking_id}`
          })
          .eq('id', payload.order_id);

        // TODO: Send admin notification (Task Group 14)
        console.log('[RICA Webhook] ⚠️ Admin notification not yet implemented');

        return {
          success: true,
          message: 'Order flagged for admin review'
        };

      case 'rica.pending_review':
        console.log('[RICA Webhook] ⏳ RICA pending manual review');

        // Update order status
        await supabase
          .from('consumer_orders')
          .update({
            status: 'pending_rica_review',
            notes: `RICA submission under manual review. ICASA Tracking: ${payload.icasa_tracking_id}`
          })
          .eq('id', payload.order_id);

        return {
          success: true,
          message: 'Status updated to pending review'
        };

      default:
        console.warn('[RICA Webhook] Unknown event type:', payload.event);
        return {
          success: false,
          message: `Unknown event type: ${payload.event}`
        };
    }
  } catch (error) {
    console.error('[RICA Webhook] Processing failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle RICA Manual Approval (Admin Action)
 *
 * Allows admin to manually approve RICA if webhook fails
 *
 * @param orderId - UUID of consumer_orders record
 */
export async function manuallyApproveRICA(orderId: string): Promise<void> {
  const supabase = await createClient();

  console.log('[RICA Webhook] Manual approval for order:', orderId);

  // Update RICA submission
  await supabase
    .from('rica_submissions')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
      notes: 'Manually approved by admin'
    })
    .eq('order_id', orderId);

  // Activate service
  await activateService(orderId);

  console.log('[RICA Webhook] ✅ Manual approval complete');
}
