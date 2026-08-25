/**
 * WhatsApp Flow sender (Cloud API interactive flow messages).
 *
 * Creates a `whatsapp_flow_sessions` row (flow_token) then POSTs the
 * interactive flow message. Follows whatsapp-service lazy config + SA phone format.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-flow-messages
 */

import { randomUUID } from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  WhatsAppErrorResponse,
  WhatsAppMessageResponse,
  WhatsAppSendResult,
} from '../types';
import {
  createFlowSession,
  type FlowSessionSupabase,
} from './session-store';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default Meta Flow name stored on sessions (not the display CTA). */
export const F1_FLOW_NAME = 'lead_qualification';

/** Default first screen id — must match Flow Builder screen name. */
export const F1_DEFAULT_SCREEN = 'CONTACT';

/**
 * Cold-send MARKETING template (FLOW button).
 * Meta template id 2086190671980465 — use only when status is APPROVED.
 */
export const F1_COLD_TEMPLATE_NAME = 'circletel_lead_qualification';
export const F1_COLD_TEMPLATE_LANGUAGE = 'en_ZA';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

// =============================================================================
// TYPES
// =============================================================================

export interface SendFlowParams {
  /** Recipient phone (SA local or international) */
  to: string;
  /**
   * Meta flow id. Defaults to `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID`.
   */
  flowId?: string;
  /** Stored on session row; default `lead_qualification` */
  flowName?: string;
  /** Button label (max 30 chars per Meta) */
  flowCta?: string;
  /** First screen id for `flow_action: navigate` */
  screen?: string;
  /** Session entry source: website | qr | admin | ctwa_ad | manual | followup */
  entrySource: string;
  sourceCampaign?: string | null;
  bodyText?: string;
  headerText?: string;
  footerText?: string;
  /**
   * When true, sets `parameters.mode = "draft"` (sibling of flow_action_payload).
   * Required to send unpublished DRAFT flows to test numbers.
   */
  draft?: boolean;
  /** Injectable Supabase (tests); defaults to service-role client */
  supabase?: FlowSessionSupabase;
}

export interface SendFlowResult extends WhatsAppSendResult {
  flowToken?: string;
  sessionId?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getPhoneNumberId(): string {
  return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
}

function getAccessToken(): string {
  return process.env.WHATSAPP_ACCESS_TOKEN || '';
}

/**
 * Format phone to WhatsApp international digits (no +).
 * Mirrors WhatsAppService.formatPhoneNumber (SA 0… → 27…).
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('27') && cleaned.length === 9) {
    cleaned = '27' + cleaned;
  }

  return cleaned;
}

function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service role credentials not configured');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Build Cloud API interactive flow message payload (pure — testable).
 */
export function buildFlowMessagePayload(params: {
  to: string;
  flowToken: string;
  flowId: string;
  flowCta: string;
  screen: string;
  bodyText: string;
  headerText?: string;
  footerText?: string;
  draft?: boolean;
}): Record<string, unknown> {
  // Meta: `mode` is a sibling of flow_action_payload under parameters
  // (interactive.action.parameters.mode), NOT inside flow_action_payload.
  // Wrong nesting returns error_code 100: Unexpected key "mode" on flow_action_payload.
  const parameters: Record<string, unknown> = {
    flow_message_version: '3',
    flow_token: params.flowToken,
    flow_id: params.flowId,
    flow_cta: params.flowCta,
    flow_action: 'navigate',
    flow_action_payload: {
      screen: params.screen,
    },
  };
  if (params.draft) {
    parameters.mode = 'draft';
  }

  const interactive: Record<string, unknown> = {
    type: 'flow',
    body: { text: params.bodyText },
    action: {
      name: 'flow',
      parameters,
    },
  };

  if (params.headerText) {
    interactive.header = { type: 'text', text: params.headerText };
  }
  if (params.footerText) {
    interactive.footer = { text: params.footerText };
  }

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: params.to,
    type: 'interactive',
    interactive,
  };
}

// =============================================================================
// SEND
// =============================================================================

/**
 * Create a flow session then send an interactive WhatsApp Flow message.
 *
 * Order: generate flow_token → insert session → POST Cloud API.
 * Session is created first so webhook completions can always correlate.
 */
export async function sendFlow(params: SendFlowParams): Promise<SendFlowResult> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'WhatsApp API not configured' };
  }

  const flowId =
    params.flowId || process.env.WHATSAPP_FLOW_LEAD_QUALIFICATION_ID || '';
  if (!flowId) {
    return {
      success: false,
      error: 'WHATSAPP_FLOW_LEAD_QUALIFICATION_ID not configured',
    };
  }

  const formattedPhone = formatWhatsAppPhone(params.to);
  if (!formattedPhone || formattedPhone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  const flowToken = randomUUID();
  const flowName = params.flowName ?? F1_FLOW_NAME;
  const flowCta = params.flowCta ?? 'Get started';
  const screen = params.screen ?? F1_DEFAULT_SCREEN;
  const bodyText =
    params.bodyText ??
    'Complete this short form so we can check coverage and get you the right CircleTel package.';

  let supabase: FlowSessionSupabase;
  try {
    supabase = params.supabase ?? createServiceRoleClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Supabase not configured',
    };
  }

  const { data: session, error: sessionError } = await createFlowSession(
    supabase,
    {
      flow_token: flowToken,
      flow_id: flowId,
      flow_name: flowName,
      phone: formattedPhone,
      entry_source: params.entrySource,
      source_campaign: params.sourceCampaign ?? null,
      status: 'sent',
    }
  );

  if (sessionError || !session) {
    console.error('[FlowSender] Failed to create session', sessionError);
    return {
      success: false,
      error: sessionError?.message ?? 'Failed to create flow session',
      flowToken,
    };
  }

  const payload = buildFlowMessagePayload({
    to: formattedPhone,
    flowToken,
    flowId,
    flowCta,
    screen,
    bodyText,
    headerText: params.headerText,
    footerText: params.footerText,
    draft: params.draft,
  });

  console.log('[FlowSender] Sending flow message', {
    to: formattedPhone,
    flowId,
    flowToken,
    sessionId: session.id,
    draft: Boolean(params.draft),
  });

  try {
    const response = await fetch(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as
      | WhatsAppMessageResponse
      | WhatsAppErrorResponse;

    if (!response.ok || 'error' in data) {
      const errorData = data as WhatsAppErrorResponse;
      console.error('[FlowSender] Cloud API error', errorData);
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
        errorCode: errorData.error?.code,
        flowToken,
        sessionId: session.id,
      };
    }

    const successData = data as WhatsAppMessageResponse;
    const messageId = successData.messages?.[0]?.id;
    const waId = successData.contacts?.[0]?.wa_id;

    console.log('[FlowSender] Flow message sent', {
      messageId,
      flowToken,
      sessionId: session.id,
    });

    // Best-effort: attach wamid to session when send succeeds
    if (messageId) {
      try {
        await supabase
          .from('whatsapp_flow_sessions')
          .update({
            whatsapp_message_id: messageId,
            updated_at: new Date().toISOString(),
          })
          .eq('flow_token', flowToken);
      } catch (updateErr) {
        console.warn('[FlowSender] Failed to store whatsapp_message_id', updateErr);
      }
    }

    return {
      success: true,
      messageId,
      waId,
      flowToken,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('[FlowSender] Send error', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send flow message',
      flowToken,
      sessionId: session.id,
    };
  }
}

// =============================================================================
// COLD SEND (template + FLOW button) — outside 24h window
// =============================================================================

export interface SendFlowTemplateParams {
  to: string;
  /** Greeting name for body {{1}} */
  customerName?: string;
  entrySource: string;
  sourceCampaign?: string | null;
  flowId?: string;
  flowName?: string;
  supabase?: FlowSessionSupabase;
}

/**
 * Send the approved cold F1 template with a FLOW button.
 * Creates `whatsapp_flow_sessions` first so nfm_reply can correlate via flow_token.
 *
 * Requires Meta template `circletel_lead_qualification` status APPROVED.
 */
export async function sendFlowTemplate(
  params: SendFlowTemplateParams
): Promise<SendFlowResult> {
  const phoneNumberId = getPhoneNumberId();
  const accessToken = getAccessToken();

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'WhatsApp API not configured' };
  }

  const flowId =
    params.flowId || process.env.WHATSAPP_FLOW_LEAD_QUALIFICATION_ID || '';
  if (!flowId) {
    return {
      success: false,
      error: 'WHATSAPP_FLOW_LEAD_QUALIFICATION_ID not configured',
    };
  }

  const formattedPhone = formatWhatsAppPhone(params.to);
  if (!formattedPhone || formattedPhone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  const flowToken = randomUUID();
  const flowName = params.flowName ?? F1_FLOW_NAME;
  const displayName = (params.customerName || 'there').trim() || 'there';

  let supabase: FlowSessionSupabase;
  try {
    supabase = params.supabase ?? createServiceRoleClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Supabase not configured',
    };
  }

  const { data: session, error: sessionError } = await createFlowSession(
    supabase,
    {
      flow_token: flowToken,
      flow_id: flowId,
      flow_name: flowName,
      phone: formattedPhone,
      entry_source: params.entrySource,
      source_campaign: params.sourceCampaign ?? null,
      status: 'sent',
    }
  );

  if (sessionError || !session) {
    console.error('[FlowSender] Failed to create session (template)', sessionError);
    return {
      success: false,
      error: sessionError?.message ?? 'Failed to create flow session',
      flowToken,
    };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: F1_COLD_TEMPLATE_NAME,
      language: { code: F1_COLD_TEMPLATE_LANGUAGE },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: displayName }],
        },
        {
          type: 'button',
          sub_type: 'flow',
          index: '0',
          parameters: [
            {
              type: 'action',
              action: {
                flow_token: flowToken,
                flow_action_data: {},
              },
            },
          ],
        },
      ],
    },
  };

  console.log('[FlowSender] Sending cold flow template', {
    to: formattedPhone,
    template: F1_COLD_TEMPLATE_NAME,
    flowToken,
    sessionId: session.id,
  });

  try {
    const response = await fetch(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as
      | WhatsAppMessageResponse
      | WhatsAppErrorResponse;

    if (!response.ok || 'error' in data) {
      const errorData = data as WhatsAppErrorResponse;
      console.error('[FlowSender] Template Cloud API error', errorData);
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
        errorCode: errorData.error?.code,
        flowToken,
        sessionId: session.id,
      };
    }

    const successData = data as WhatsAppMessageResponse;
    const messageId = successData.messages?.[0]?.id;
    const waId = successData.contacts?.[0]?.wa_id;

    if (messageId) {
      try {
        await supabase
          .from('whatsapp_flow_sessions')
          .update({
            whatsapp_message_id: messageId,
            updated_at: new Date().toISOString(),
          })
          .eq('flow_token', flowToken);
      } catch (updateErr) {
        console.warn('[FlowSender] Failed to store whatsapp_message_id', updateErr);
      }
    }

    return {
      success: true,
      messageId,
      waId,
      flowToken,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('[FlowSender] Template send error', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send flow template',
      flowToken,
      sessionId: session.id,
    };
  }
}
