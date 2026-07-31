/**
 * WhatsApp Flows — F1 Lead Qualification types
 *
 * Field names must match Meta Flow Builder JSON exactly (single source of truth).
 * @see docs/superpowers/specs/2026-07-31-near-term-f1-followup-floor-design.md
 */

// =============================================================================
// F1 RESPONSE (form fields from nfm_reply.response_json)
// =============================================================================

/**
 * Parsed F1 Lead Qualification form payload.
 * `flow_token` is included by Meta inside response_json for correlation.
 */
export interface F1LeadQualificationResponse {
  flow_token?: string;
  first_name: string;
  last_name: string;
  /** Raw form value — normalize with `normalizeCustomerType` before DB insert */
  customer_type: string;
  email?: string;
  phone?: string;
  company_name?: string;
  address: string;
  suburb: string;
  city: string;
  province?: string;
  service_interest: string;
  speed?: string;
  budget_range?: string;
  contact_preference: string;
  best_contact_time?: string;
  /** Must be true to create a lead (POPIA) */
  popia_optin: boolean;
}

/** DB-facing customer_type after normalize (coverage_leads enum) */
export type CoverageLeadCustomerType = 'consumer' | 'smme' | 'enterprise';

export type FlowSessionStatus =
  | 'sent'
  | 'delivered'
  | 'completed'
  | 'expired'
  | 'failed_parse';

export type FlowEntrySource =
  | 'website'
  | 'qr'
  | 'admin'
  | 'ctwa_ad'
  | 'manual'
  | 'followup';

export interface WhatsAppFlowSession {
  id: string;
  flow_token: string;
  flow_id: string;
  flow_name: string;
  phone: string;
  entry_source: string;
  source_campaign: string | null;
  status: FlowSessionStatus | string;
  response_payload: unknown | null;
  raw_webhook: unknown | null;
  coverage_lead_id: string | null;
  whatsapp_message_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Inbound interactive message carrying an nfm_reply (flow completion).
 * Mirrors Meta Cloud API webhook message shape.
 */
export interface NfmReplyWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'interactive';
  interactive: {
    type: 'nfm_reply';
    nfm_reply: {
      response_json: string;
      body?: string;
      name?: string;
    };
  };
}

// =============================================================================
// TYPE GUARDS / HELPERS
// =============================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

/**
 * WhatsApp Flow toggles may arrive as boolean or string ("true"/"false"/"0"/"1").
 */
export function parsePopiaOptIn(value: unknown): boolean | null {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(v)) return false;
  }
  return null;
}

/**
 * Normalize form customer_type to coverage_leads enum values.
 * Design labels: consumer | business → DB: consumer | smme | enterprise.
 */
export function normalizeCustomerType(raw: string): CoverageLeadCustomerType {
  const v = raw.trim().toLowerCase();
  if (['business', 'smme', 'sme', 'commercial', 'company', 'b2b'].includes(v)) {
    return 'smme';
  }
  if (['enterprise', 'corporate'].includes(v)) {
    return 'enterprise';
  }
  return 'consumer';
}

/**
 * Type guard for F1 Lead Qualification response (plain — no new deps).
 * Required: first_name, last_name, customer_type, address, suburb, city,
 * service_interest, contact_preference, popia_optin (parseable).
 */
export function isF1LeadQualificationResponse(
  value: unknown
): value is F1LeadQualificationResponse {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;

  if (!isNonEmptyString(o.first_name)) return false;
  if (!isNonEmptyString(o.last_name)) return false;
  if (!isNonEmptyString(o.customer_type)) return false;
  if (!isNonEmptyString(o.address)) return false;
  if (!isNonEmptyString(o.suburb)) return false;
  if (!isNonEmptyString(o.city)) return false;
  if (!isNonEmptyString(o.service_interest)) return false;
  if (!isNonEmptyString(o.contact_preference)) return false;

  if (!isOptionalString(o.email)) return false;
  if (!isOptionalString(o.phone)) return false;
  if (!isOptionalString(o.company_name)) return false;
  if (!isOptionalString(o.province)) return false;
  if (!isOptionalString(o.speed)) return false;
  if (!isOptionalString(o.budget_range)) return false;
  if (!isOptionalString(o.best_contact_time)) return false;
  if (!isOptionalString(o.flow_token)) return false;

  const popia = parsePopiaOptIn(o.popia_optin);
  if (popia === null) return false;

  return true;
}

/**
 * Coerce a raw parsed object into F1LeadQualificationResponse (popia as boolean).
 * Call only after isF1LeadQualificationResponse.
 */
export function coerceF1LeadQualificationResponse(
  value: Record<string, unknown>
): F1LeadQualificationResponse {
  const popia = parsePopiaOptIn(value.popia_optin);
  return {
    flow_token:
      typeof value.flow_token === 'string' ? value.flow_token : undefined,
    first_name: String(value.first_name).trim(),
    last_name: String(value.last_name).trim(),
    customer_type: String(value.customer_type).trim(),
    email:
      typeof value.email === 'string' && value.email.trim()
        ? value.email.trim()
        : undefined,
    phone:
      typeof value.phone === 'string' && value.phone.trim()
        ? value.phone.trim()
        : undefined,
    company_name:
      typeof value.company_name === 'string' && value.company_name.trim()
        ? value.company_name.trim()
        : undefined,
    address: String(value.address).trim(),
    suburb: String(value.suburb).trim(),
    city: String(value.city).trim(),
    province:
      typeof value.province === 'string' && value.province.trim()
        ? value.province.trim()
        : undefined,
    service_interest: String(value.service_interest).trim(),
    speed:
      typeof value.speed === 'string' && value.speed.trim()
        ? value.speed.trim()
        : undefined,
    budget_range:
      typeof value.budget_range === 'string' && value.budget_range.trim()
        ? value.budget_range.trim()
        : undefined,
    contact_preference: String(value.contact_preference).trim(),
    best_contact_time:
      typeof value.best_contact_time === 'string' &&
      value.best_contact_time.trim()
        ? value.best_contact_time.trim()
        : undefined,
    popia_optin: popia === true,
  };
}

export function isNfmReplyWebhookMessage(
  value: unknown
): value is NfmReplyWebhookMessage {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  if (m.type !== 'interactive') return false;
  if (typeof m.from !== 'string' || typeof m.id !== 'string') return false;
  const interactive = m.interactive as Record<string, unknown> | undefined;
  if (!interactive || interactive.type !== 'nfm_reply') return false;
  const nfm = interactive.nfm_reply as Record<string, unknown> | undefined;
  if (!nfm || typeof nfm.response_json !== 'string') return false;
  return true;
}
