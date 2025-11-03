// ZOHO CRM Webhook Handler
// Handles webhook notifications from ZOHO CRM

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import type { ZohoWebhookPayload } from '@/lib/integrations/zoho/types';

/**
 * POST /api/integrations/zoho/webhook
 * Receives webhook notifications from ZOHO CRM
 *
 * ZOHO sends webhooks for:
 * - Record created
 * - Record updated
 * - Record deleted
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature (if configured)
    const signature = request.headers.get('x-zoho-signature');
    const webhookSecret = process.env.ZOHO_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const body = await request.text();
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);

      if (!isValid) {
        console.error('[ZOHO Webhook] Invalid signature');
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid webhook signature',
          },
          { status: 401 }
        );
      }

      // Parse body after verification
      const payload: ZohoWebhookPayload = JSON.parse(body);
      return await processWebhook(payload);
    } else {
      // No signature verification configured
      const payload = await request.json();
      return await processWebhook(payload);
    }
  } catch (error) {
    console.error('[ZOHO Webhook] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Process webhook payload
 */
async function processWebhook(payload: ZohoWebhookPayload): Promise<NextResponse> {
  try {
    console.log('[ZOHO Webhook] Received:', payload.operation, payload.module, payload.record_id);

    const supabase = await createClient();

    // Find corresponding CircleTel entity
    const zohoType = mapModuleToZohoType(payload.module);
    if (!zohoType) {
      console.warn('[ZOHO Webhook] Unknown module:', payload.module);
      return NextResponse.json({
        success: true,
        message: 'Module not tracked',
      });
    }

    const { data: mapping } = await supabase
      .from('zoho_entity_mappings')
      .select('*')
      .eq('zoho_type', zohoType)
      .eq('zoho_id', payload.record_id)
      .single();

    if (!mapping) {
      console.warn('[ZOHO Webhook] No mapping found for:', zohoType, payload.record_id);
      return NextResponse.json({
        success: true,
        message: 'No mapping found',
      });
    }

    // Handle different operations
    switch (payload.operation) {
      case 'update':
        await handleUpdate(mapping, payload);
        break;
      case 'delete':
        await handleDelete(mapping, payload);
        break;
      case 'insert':
        // Usually we create from CircleTel → ZOHO, not the other way
        console.log('[ZOHO Webhook] Insert operation (no action needed)');
        break;
      default:
        console.warn('[ZOHO Webhook] Unknown operation:', payload.operation);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('[ZOHO Webhook] Processing error:', error);
    throw error;
  }
}

/**
 * Handle record update
 */
async function handleUpdate(
  mapping: { circletel_type: string; circletel_id: string; zoho_type: string; zoho_id: string },
  payload: ZohoWebhookPayload
): Promise<void> {
  const supabase = await createClient();

  console.log(`[ZOHO Webhook] Update: ${mapping.circletel_type}:${mapping.circletel_id}`);

  // Update last_synced_at timestamp
  await supabase
    .from('zoho_entity_mappings')
    .update({
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', mapping.circletel_id);

  // Log webhook event
  await supabase.from('zoho_sync_logs').insert({
    entity_type: mapping.circletel_type,
    entity_id: mapping.circletel_id,
    zoho_entity_type: mapping.zoho_type,
    zoho_entity_id: mapping.zoho_id,
    status: 'success',
    attempt_number: 1,
    request_payload: { webhook_event: 'update' },
    response_payload: payload.record_data,
  });

  // TODO: Sync changes back to CircleTel database if needed
  // For now, we only push CircleTel → ZOHO (one-way sync)
}

/**
 * Handle record deletion
 */
async function handleDelete(
  mapping: { circletel_type: string; circletel_id: string },
  payload: ZohoWebhookPayload
): Promise<void> {
  const supabase = await createClient();

  console.log(`[ZOHO Webhook] Delete: ${mapping.circletel_type}:${mapping.circletel_id}`);

  // Option 1: Delete mapping (ZOHO record deleted)
  // await supabase
  //   .from('zoho_entity_mappings')
  //   .delete()
  //   .eq('circletel_id', mapping.circletel_id);

  // Option 2: Keep mapping but mark as deleted (recommended for audit trail)
  await supabase.from('zoho_sync_logs').insert({
    entity_type: mapping.circletel_type,
    entity_id: mapping.circletel_id,
    status: 'success',
    attempt_number: 1,
    request_payload: { webhook_event: 'delete' },
    response_payload: { deleted_at: payload.timestamp },
  });

  console.log('[ZOHO Webhook] Delete logged (mapping preserved for audit)');
}

/**
 * Verify webhook signature (HMAC-SHA256)
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    console.error('[ZOHO Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Map ZOHO module name to ZohoEntityType
 */
function mapModuleToZohoType(module: string): string | null {
  const mapping: Record<string, string> = {
    Quotes: 'Estimates',
    Deals: 'Deals',
    Invoices: 'Invoices',
    Contacts: 'Contacts',
  };

  return mapping[module] || null;
}

/**
 * GET /api/integrations/zoho/webhook
 * Webhook verification endpoint (some services require this)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Return challenge for webhook verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({
    success: true,
    message: 'ZOHO webhook endpoint active',
    timestamp: new Date().toISOString(),
  });
}
