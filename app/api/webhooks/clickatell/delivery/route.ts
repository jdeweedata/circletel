/**
 * Clickatell Delivery Status Webhook
 * 
 * POST /api/webhooks/clickatell/delivery
 * 
 * Receives delivery status callbacks from Clickatell when SMS status changes.
 * Updates the emandate_requests table with delivery status.
 * 
 * Clickatell sends callbacks for:
 * - Message delivered
 * - Message failed
 * - Message expired
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { webhookLogger } from '@/lib/logging';

export const runtime = 'nodejs';

interface ClickatellCallback {
  messageId: string;
  statusCode: number;
  status: string;
  statusDescription?: string;
  timestamp?: string;
  to?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    webhookLogger.info('[Clickatell Webhook] Received callback:', JSON.stringify(body, null, 2));

    // Clickatell can send single or batch callbacks
    const callbacks: ClickatellCallback[] = Array.isArray(body) ? body : [body];

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

    for (const callback of callbacks) {
      const { messageId, statusCode, status, statusDescription, timestamp } = callback;

      if (!messageId) {
        webhookLogger.warn('[Clickatell Webhook] Missing messageId in callback');
        continue;
      }

      // Map Clickatell status to our simplified status
      const deliveryStatus = mapClickatellStatus(statusCode);

      webhookLogger.info(`[Clickatell Webhook] MessageId: ${messageId}, Status: ${status} (${statusCode}) -> ${deliveryStatus}`);

      // Find and update the emandate request
      const { data: emandateRequest, error: findError } = await supabase
        .from('emandate_requests')
        .select('id, order_id')
        .eq('sms_message_id', messageId)
        .maybeSingle();

      if (findError) {
        webhookLogger.error('[Clickatell Webhook] Error finding emandate request:', findError);
        continue;
      }

      if (!emandateRequest) {
        webhookLogger.warn(`[Clickatell Webhook] No emandate request found for messageId: ${messageId}`);
        continue;
      }

      // Update the emandate request with delivery status
      const updateData: Record<string, any> = {
        sms_delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      };

      if (deliveryStatus === 'delivered' && timestamp) {
        updateData.sms_delivered_at = timestamp;
      }

      if (deliveryStatus === 'failed') {
        updateData.sms_error = statusDescription || `Failed with code ${statusCode}`;
      }

      const { error: updateError } = await supabase
        .from('emandate_requests')
        .update(updateData)
        .eq('id', emandateRequest.id);

      if (updateError) {
        webhookLogger.error('[Clickatell Webhook] Error updating emandate request:', updateError);
        continue;
      }

      webhookLogger.info(`[Clickatell Webhook] Updated emandate request ${emandateRequest.id} with status: ${deliveryStatus}`);

      // Log the status change
      await supabase.from('order_status_history').insert({
        entity_type: 'consumer_order',
        entity_id: emandateRequest.order_id,
        old_status: 'sms_pending',
        new_status: `sms_${deliveryStatus}`,
        changed_by: 'clickatell_webhook',
        notes: `SMS delivery status: ${status} (${statusCode}). ${statusDescription || ''}`,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, processed: callbacks.length });

  } catch (error: any) {
    webhookLogger.error('[Clickatell Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Map Clickatell status codes to simplified status
 * 
 * Clickatell status codes:
 * 001 - Message unknown
 * 002 - Message queued
 * 003 - Delivered to gateway
 * 004 - Received by recipient (DELIVERED)
 * 005 - Error with message
 * 006 - User cancelled message delivery
 * 007 - Error delivering message
 * 008 - OK (message received by gateway)
 * 009 - Routing error
 * 010 - Message expired
 * 011 - Message queued for later delivery
 * 012 - Out of credit
 * 014 - Maximum MT limit exceeded
 */
function mapClickatellStatus(statusCode: number): 'pending' | 'delivered' | 'failed' | 'expired' {
  switch (statusCode) {
    case 4:
      return 'delivered';
    case 2:
    case 3:
    case 8:
    case 11:
      return 'pending';
    case 10:
      return 'expired';
    case 5:
    case 6:
    case 7:
    case 9:
    case 12:
    case 14:
    default:
      return 'failed';
  }
}

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'Clickatell Delivery Webhook',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
