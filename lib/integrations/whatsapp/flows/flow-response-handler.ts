/**
 * WhatsApp Flow completion handler (nfm_reply → coverage_leads).
 *
 * Deterministic CRM write — no LLM in the control plane.
 * Sales alert / confirmation are optional injectables (wired in Task A4).
 */

import { computeFirstResponseDueAt } from '@/lib/leads/first-response-sla';
import {
  getSessionByFlowToken,
  markSessionCompleted,
  markSessionFailedParse,
  type FlowSessionSupabase,
} from './session-store';
import {
  coerceF1LeadQualificationResponse,
  isF1LeadQualificationResponse,
  isNfmReplyWebhookMessage,
  normalizeCustomerType,
  type F1LeadQualificationResponse,
  type NfmReplyWebhookMessage,
  type WhatsAppFlowSession,
} from './types';

// =============================================================================
// RESULT / DEPS
// =============================================================================

export type FlowCompletionReason =
  | 'created'
  | 'idempotent'
  | 'unknown_token'
  | 'popia_rejected'
  | 'malformed_json'
  | 'invalid_payload'
  | 'insert_failed'
  | 'invalid_message';

export interface FlowCompletionResult {
  success: boolean;
  reason: FlowCompletionReason;
  coverageLeadId?: string;
  sessionId?: string;
  error?: string;
}

export interface LeadCreatedHookContext {
  leadId: string;
  session: WhatsAppFlowSession;
  form: F1LeadQualificationResponse;
  phone: string;
}

export interface FlowResponseHandlerDeps {
  supabase: FlowSessionSupabase;
  /** Optional — Task A4 wires confirmation + sales alert here */
  onLeadCreated?: (ctx: LeadCreatedHookContext) => Promise<void>;
  /** Injectable clock for SLA / tests */
  now?: () => Date;
  /** Optional logger (defaults to console) */
  log?: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
}

// =============================================================================
// PARSE
// =============================================================================

export interface ParsedNfmReply {
  ok: true;
  form: F1LeadQualificationResponse;
  flowToken: string;
  raw: Record<string, unknown>;
}

export interface ParsedNfmReplyError {
  ok: false;
  reason: 'malformed_json' | 'invalid_payload';
  flowToken?: string;
  rawText: string;
  raw?: unknown;
}

/**
 * Parse nfm_reply.response_json into a validated F1 form.
 * Pure — no I/O (unit-test without mocks).
 */
export function parseNfmReplyResponseJson(
  responseJson: string
): ParsedNfmReply | ParsedNfmReplyError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseJson);
  } catch {
    // Best-effort token extract for dead-letter correlation
    const tokenMatch = responseJson.match(
      /"flow_token"\s*:\s*"([^"]+)"/
    );
    return {
      ok: false,
      reason: 'malformed_json',
      flowToken: tokenMatch?.[1],
      rawText: responseJson,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      reason: 'invalid_payload',
      rawText: responseJson,
      raw: parsed,
    };
  }

  const record = parsed as Record<string, unknown>;
  const flowToken =
    typeof record.flow_token === 'string' ? record.flow_token.trim() : '';

  if (!isF1LeadQualificationResponse(record)) {
    return {
      ok: false,
      reason: 'invalid_payload',
      flowToken: flowToken || undefined,
      rawText: responseJson,
      raw: record,
    };
  }

  const form = coerceF1LeadQualificationResponse(record);
  const token = (form.flow_token ?? flowToken).trim();
  if (!token) {
    return {
      ok: false,
      reason: 'invalid_payload',
      rawText: responseJson,
      raw: record,
    };
  }

  return { ok: true, form: { ...form, flow_token: token }, flowToken: token, raw: record };
}

// =============================================================================
// LEAD ROW
// =============================================================================

export function buildCoverageLeadInsert(params: {
  form: F1LeadQualificationResponse;
  session: WhatsAppFlowSession;
  senderPhone: string;
  createdAt: Date;
}): Record<string, unknown> {
  const { form, session, senderPhone, createdAt } = params;
  const phone =
    (form.phone && form.phone.trim()) ||
    senderPhone ||
    session.phone ||
    '';

  // email is NOT NULL on coverage_leads — use empty string when form omits it
  const email = form.email?.trim() || '';

  return {
    first_name: form.first_name,
    last_name: form.last_name,
    customer_type: normalizeCustomerType(form.customer_type),
    email,
    phone,
    company_name: form.company_name ?? null,
    address: form.address,
    suburb: form.suburb,
    city: form.city,
    province: form.province ?? null,
    requested_service_type: form.service_interest,
    requested_speed: form.speed ?? null,
    budget_range: form.budget_range ?? null,
    contact_preference: form.contact_preference,
    best_contact_time: form.best_contact_time ?? null,
    lead_source: 'whatsapp_flow',
    source_campaign: session.source_campaign,
    status: 'new',
    first_response_due_at: computeFirstResponseDueAt(createdAt).toISOString(),
    metadata: {
      popia_optin: form.popia_optin,
      entry_source: session.entry_source,
      flow_token: session.flow_token,
      flow_id: session.flow_id,
      flow_name: session.flow_name,
    },
  };
}

// =============================================================================
// HANDLER
// =============================================================================

/**
 * Handle a single inbound nfm_reply message: parse → session guards → lead insert.
 */
export async function handleFlowCompletion(
  message: unknown,
  deps: FlowResponseHandlerDeps
): Promise<FlowCompletionResult> {
  const log = deps.log ?? console;
  const now = deps.now ?? (() => new Date());
  const { supabase } = deps;

  if (!isNfmReplyWebhookMessage(message)) {
    log.warn('[FlowHandler] Not an nfm_reply message');
    return { success: false, reason: 'invalid_message' };
  }

  const msg = message as NfmReplyWebhookMessage;
  const responseJson = msg.interactive.nfm_reply.response_json;
  const parsed = parseNfmReplyResponseJson(responseJson);

  if (!parsed.ok) {
    log.warn('[FlowHandler] Failed to parse nfm_reply', {
      reason: parsed.reason,
      flowToken: parsed.flowToken,
    });

    if (parsed.flowToken) {
      await markSessionFailedParse(supabase, parsed.flowToken, {
        responsePayload: parsed.raw ?? null,
        rawWebhook: msg,
      });
    }

    return {
      success: false,
      reason: parsed.reason,
      error: parsed.reason,
    };
  }

  const { form, flowToken } = parsed;

  const { data: session, error: sessionError } = await getSessionByFlowToken(
    supabase,
    flowToken
  );

  if (sessionError) {
    log.error('[FlowHandler] Session lookup failed', {
      flowToken,
      error: sessionError.message,
    });
    return {
      success: false,
      reason: 'unknown_token',
      error: sessionError.message,
    };
  }

  if (!session) {
    log.warn('[FlowHandler] Unknown flow_token — no session', { flowToken });
    return { success: false, reason: 'unknown_token' };
  }

  // Idempotent: Meta retries webhooks
  if (session.status === 'completed') {
    log.info('[FlowHandler] Session already completed — idempotent', {
      flowToken,
      coverageLeadId: session.coverage_lead_id,
    });
    return {
      success: true,
      reason: 'idempotent',
      coverageLeadId: session.coverage_lead_id ?? undefined,
      sessionId: session.id,
    };
  }

  // POPIA: reject if false
  if (form.popia_optin !== true) {
    log.warn('[FlowHandler] POPIA opt-in false — rejecting lead', {
      flowToken,
      sessionId: session.id,
    });
    await markSessionFailedParse(supabase, flowToken, {
      responsePayload: form,
      rawWebhook: msg,
    });
    return {
      success: false,
      reason: 'popia_rejected',
      sessionId: session.id,
    };
  }

  const createdAt = now();
  const leadRow = buildCoverageLeadInsert({
    form,
    session,
    senderPhone: msg.from,
    createdAt,
  });

  const { data: lead, error: insertError } = await supabase
    .from('coverage_leads')
    .insert(leadRow)
    .select('id')
    .single();

  if (insertError || !lead?.id) {
    log.error('[FlowHandler] coverage_leads insert failed', {
      flowToken,
      error: insertError?.message,
    });
    await markSessionFailedParse(supabase, flowToken, {
      responsePayload: form,
      rawWebhook: msg,
    });
    return {
      success: false,
      reason: 'insert_failed',
      sessionId: session.id,
      error: insertError?.message ?? 'No lead id returned',
    };
  }

  const leadId = lead.id as string;

  await markSessionCompleted(supabase, flowToken, leadId, form, msg);

  if (deps.onLeadCreated) {
    try {
      await deps.onLeadCreated({
        leadId,
        session: { ...session, coverage_lead_id: leadId, status: 'completed' },
        form,
        phone: (leadRow.phone as string) || msg.from,
      });
    } catch (hookError) {
      // Lead is already persisted — hook failures must not fail the webhook
      log.error('[FlowHandler] onLeadCreated hook failed', {
        leadId,
        error:
          hookError instanceof Error ? hookError.message : String(hookError),
      });
    }
  }

  log.info('[FlowHandler] Lead created from F1 flow', {
    leadId,
    flowToken,
    sessionId: session.id,
  });

  return {
    success: true,
    reason: 'created',
    coverageLeadId: leadId,
    sessionId: session.id,
  };
}
