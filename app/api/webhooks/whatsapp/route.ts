/**
 * WhatsApp Webhook Handler
 *
 * Handles incoming webhooks from Meta Cloud API:
 * - Webhook verification (GET)
 * - Message status updates (POST)
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { whatsAppService } from '@/lib/integrations/whatsapp';
import type {
  WebhookPayload,
  WebhookStatusUpdate,
} from '@/lib/integrations/whatsapp/types';

// =============================================================================
// WEBHOOK VERIFICATION (GET)
// =============================================================================

/**
 * Handle webhook verification from Meta
 * Meta sends a GET request with hub.mode, hub.verify_token, hub.challenge
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[WhatsApp Webhook] Verification request', { mode, token });

  const verification = whatsAppService.verifyWebhook(mode, token, challenge);

  if (verification.valid) {
    // Return just the challenge as plain text
    return new NextResponse(verification.challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// =============================================================================
// WEBHOOK EVENTS (POST)
// =============================================================================

/**
 * Handle incoming webhook events from Meta
 * Processes message status updates (sent, delivered, read, failed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Parse webhook payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      console.error('[WhatsApp Webhook] Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate it's a WhatsApp webhook
    if (payload.object !== 'whatsapp_business_account') {
      console.warn('[WhatsApp Webhook] Not a WhatsApp webhook', { object: payload.object });
      return NextResponse.json({ received: true });
    }

    // Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Process status updates
        if (value.statuses && value.statuses.length > 0) {
          await processStatusUpdates(value.statuses);
        }

        // Process incoming messages (optional - for future use)
        if (value.messages && value.messages.length > 0) {
          // Could be used for customer replies
          console.log('[WhatsApp Webhook] Received messages:', value.messages.length);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// STATUS UPDATE PROCESSING
// =============================================================================

/**
 * Process message status updates
 * Updates whatsapp_message_log with delivery status
 */
async function processStatusUpdates(statuses: WebhookStatusUpdate[]): Promise<void> {
  // Create Supabase client
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

  for (const status of statuses) {
    console.log('[WhatsApp Webhook] Status update', {
      messageId: status.id,
      status: status.status,
      recipientId: status.recipient_id,
    });

    // Extract error info if present
    const errorCode = status.errors?.[0]?.code;
    const errorMessage = status.errors?.[0]?.message || status.errors?.[0]?.title;

    // Extract billing info if present
    const billable = status.pricing?.billable;
    const pricingCategory = status.pricing?.category;

    // Update message log using the helper function
    const { data: updated } = await supabase.rpc('update_whatsapp_message_status', {
      p_message_id: status.id,
      p_status: status.status,
      p_error_code: errorCode || null,
      p_error_message: errorMessage || null,
      p_billable: billable,
      p_pricing_category: pricingCategory || null,
    });

    if (!updated) {
      console.warn('[WhatsApp Webhook] Message not found in log', {
        messageId: status.id,
      });
    }

    // Handle failed messages
    if (status.status === 'failed') {
      console.error('[WhatsApp Webhook] Message delivery failed', {
        messageId: status.id,
        errorCode,
        errorMessage,
      });

      // TODO: Could trigger SMS fallback here
      // await triggerSmsFallback(status.id, status.recipient_id);
    }

    // Log delivery metrics
    if (status.status === 'delivered') {
      console.log('[WhatsApp Webhook] Message delivered', {
        messageId: status.id,
        recipientId: status.recipient_id,
        billable,
        pricingCategory,
      });
    }

    if (status.status === 'read') {
      console.log('[WhatsApp Webhook] Message read', {
        messageId: status.id,
        recipientId: status.recipient_id,
      });
    }
  }
}

// =============================================================================
// CONFIG
// =============================================================================

// Disable body parser to handle raw JSON
export const config = {
  api: {
    bodyParser: false,
  },
};
