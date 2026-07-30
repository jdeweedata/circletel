/**
 * Admin WhatsApp Flow Send API
 *
 * POST /api/admin/whatsapp/flows/send
 * Manually sends the F1 lead-qualification flow to a phone number.
 * Requires admin authentication (same pattern as billing/whatsapp/send).
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { sendFlow } from '@/lib/integrations/whatsapp';
import { apiLogger } from '@/lib/logging';

const VALID_ENTRY_SOURCES = [
  'website',
  'qr',
  'admin',
  'ctwa_ad',
  'manual',
  'followup',
] as const;

type EntrySource = (typeof VALID_ENTRY_SOURCES)[number];

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const body = await request.json();
    const {
      phone,
      entry_source = 'admin',
      source_campaign,
      draft = false,
    } = body as {
      phone?: string;
      entry_source?: string;
      source_campaign?: string;
      draft?: boolean;
    };

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 }
      );
    }

    if (
      !VALID_ENTRY_SOURCES.includes(entry_source as EntrySource)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid entry_source. Must be one of: ${VALID_ENTRY_SOURCES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    apiLogger.info('[Admin Flow Send] Sending F1 flow', {
      phone: phone.trim(),
      entrySource: entry_source,
      sourceCampaign: source_campaign ?? null,
      draft: Boolean(draft),
      adminId: authResult.adminUser.id,
    });

    const result = await sendFlow({
      to: phone.trim(),
      entrySource: entry_source,
      sourceCampaign: source_campaign ?? null,
      draft: Boolean(draft),
    });

    if (result.success) {
      apiLogger.info('[Admin Flow Send] Sent successfully', {
        messageId: result.messageId,
        flowToken: result.flowToken,
        sessionId: result.sessionId,
        adminId: authResult.adminUser.id,
      });

      return NextResponse.json({
        success: true,
        message_id: result.messageId,
        wa_id: result.waId,
        flow_token: result.flowToken,
        session_id: result.sessionId,
      });
    }

    apiLogger.error('[Admin Flow Send] Send failed', {
      error: result.error,
      errorCode: result.errorCode,
      flowToken: result.flowToken,
      sessionId: result.sessionId,
    });

    // Missing flow id / WhatsApp config / invalid phone → 400; API/network → 502
    const clientErrors = [
      'WHATSAPP_FLOW_LEAD_QUALIFICATION_ID not configured',
      'WhatsApp API not configured',
      'Invalid phone number',
      'Supabase service role credentials not configured',
      'Supabase not configured',
    ];
    const isClientError =
      result.error &&
      (clientErrors.some((msg) => result.error!.includes(msg)) ||
        result.error.startsWith('Failed to create flow session'));

    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Failed to send WhatsApp flow',
        error_code: result.errorCode,
        flow_token: result.flowToken,
        session_id: result.sessionId,
      },
      { status: isClientError ? 400 : 502 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Admin Flow Send] Error', { error: errorMsg });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
