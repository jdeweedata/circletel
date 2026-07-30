/**
 * WhatsApp Flow session repository (whatsapp_flow_sessions).
 * Service-role client only — table has RLS with no anon policies.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FlowSessionStatus,
  WhatsAppFlowSession,
} from './types';

export interface CreateFlowSessionInput {
  flow_token: string;
  flow_id: string;
  flow_name: string;
  phone: string;
  entry_source: string;
  source_campaign?: string | null;
  whatsapp_message_id?: string | null;
  status?: FlowSessionStatus;
}

type QueryError = { message: string; code?: string } | null;

/**
 * Minimal Supabase surface used by the session store (testable).
 */
export type FlowSessionSupabase = Pick<SupabaseClient, 'from'>;

export async function createFlowSession(
  supabase: FlowSessionSupabase,
  input: CreateFlowSessionInput
): Promise<{ data: WhatsAppFlowSession | null; error: QueryError }> {
  const { data, error } = await supabase
    .from('whatsapp_flow_sessions')
    .insert({
      flow_token: input.flow_token,
      flow_id: input.flow_id,
      flow_name: input.flow_name,
      phone: input.phone,
      entry_source: input.entry_source,
      source_campaign: input.source_campaign ?? null,
      whatsapp_message_id: input.whatsapp_message_id ?? null,
      status: input.status ?? 'sent',
    })
    .select()
    .single();

  return { data: data as WhatsAppFlowSession | null, error: error as QueryError };
}

export async function getSessionByFlowToken(
  supabase: FlowSessionSupabase,
  flowToken: string
): Promise<{ data: WhatsAppFlowSession | null; error: QueryError }> {
  const { data, error } = await supabase
    .from('whatsapp_flow_sessions')
    .select('*')
    .eq('flow_token', flowToken)
    .maybeSingle();

  return { data: data as WhatsAppFlowSession | null, error: error as QueryError };
}

export async function markSessionCompleted(
  supabase: FlowSessionSupabase,
  flowToken: string,
  coverageLeadId: string,
  responsePayload: unknown,
  rawWebhook?: unknown
): Promise<{ error: QueryError }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('whatsapp_flow_sessions')
    .update({
      status: 'completed',
      coverage_lead_id: coverageLeadId,
      response_payload: responsePayload,
      raw_webhook: rawWebhook ?? null,
      completed_at: now,
      updated_at: now,
    })
    .eq('flow_token', flowToken);

  return { error: error as QueryError };
}

export async function markSessionFailedParse(
  supabase: FlowSessionSupabase,
  flowToken: string,
  opts: {
    responsePayload?: unknown;
    rawWebhook?: unknown;
  } = {}
): Promise<{ error: QueryError }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('whatsapp_flow_sessions')
    .update({
      status: 'failed_parse',
      response_payload: opts.responsePayload ?? null,
      raw_webhook: opts.rawWebhook ?? null,
      updated_at: now,
    })
    .eq('flow_token', flowToken);

  return { error: error as QueryError };
}
