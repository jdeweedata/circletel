import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyZohoInventoryWebhook } from '@/lib/admin/warehouse-zoho-sync';
import {
  authorizeZohoInventoryWebhook,
  zohoInventoryWebhookSignature,
} from '@/lib/integrations/zoho/inventory-webhook-auth';
import { webhookLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const secret =
      process.env.ZOHO_INVENTORY_WEBHOOK_SECRET || process.env.ZOHO_WEBHOOK_SECRET;
    const signature = zohoInventoryWebhookSignature(request.headers);

    if (
      authorizeZohoInventoryWebhook({ payload: raw, signature, secret }) !== 'ok'
    ) {
      webhookLogger.error('[Zoho Inventory Webhook] Invalid signature');
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    let body: unknown = {};
    if (raw.trim()) {
      body = JSON.parse(raw);
    }

    const supabase = await createClient();
    const result = await applyZohoInventoryWebhook(supabase, body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    webhookLogger.error('[Zoho Inventory Webhook] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return NextResponse.json({
    success: true,
    message: 'Zoho Inventory webhook endpoint active',
    timestamp: new Date().toISOString(),
  });
}
