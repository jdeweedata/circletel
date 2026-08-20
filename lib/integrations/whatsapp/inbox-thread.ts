import {
  extractAgentReplyBody,
  WA_IN_PREFIX,
  WA_INTERNAL_MARKER,
  WA_OUT_MARKER,
} from './desk-bridge';

export type InboxChannel = 'sales' | 'support';

export type InboxThreadRef =
  | { channel: 'sales'; id: string }
  | { channel: 'support'; id: string; kind: 'session' | 'ticket' };

export interface InboxMessage {
  id: string;
  direction: 'in' | 'out';
  text: string;
  timestamp: string;
  author?: string;
}

export function encodeInboxThreadId(ref: InboxThreadRef): string {
  if (ref.channel === 'sales') return `sales:${ref.id}`;
  return `support:${ref.kind}:${ref.id}`;
}

export function decodeInboxThreadId(raw: string): InboxThreadRef | null {
  const value = (raw || '').trim();
  const sales = /^sales:([^:]+)$/.exec(value);
  if (sales?.[1]) return { channel: 'sales', id: sales[1] };
  const support = /^support:(session|ticket):(.+)$/.exec(value);
  if (support?.[1] && support[2]) {
    return {
      channel: 'support',
      kind: support[1] as 'session' | 'ticket',
      id: support[2],
    };
  }
  return null;
}

export function asInboxText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function isInternalInboxMessage(text: unknown): boolean {
  const t = asInboxText(text).trim();
  if (!t) return true;
  if (t.includes(WA_INTERNAL_MARKER)) return true;
  if (t.includes(WA_OUT_MARKER)) return true;
  if (t.startsWith('AGENT REPLY (WhatsApp bridge)')) return true;
  if (t.startsWith(WA_IN_PREFIX)) return false;
  return !extractAgentReplyBody(t);
}

export function toCustomerFacingText(raw: unknown): string {
  const t = asInboxText(raw).trim();
  if (t.startsWith(WA_IN_PREFIX)) {
    return t.slice(WA_IN_PREFIX.length).trim();
  }
  return extractAgentReplyBody(t);
}

export function deskTicketWebUrl(ticketId: string): string {
  const portal =
    process.env.ZOHO_DESK_PORTAL_NAME || 'circletelsaptyltd';
  // Agent console, not /support/{portal} Help Center (that page is for
  // customers and returns "Unauthorized access to this portal" for agents).
  return `https://desk.zoho.com/agent/${portal}/all/tickets/details/${ticketId}`;
}

export function formatDisplayPhone(waFrom: string): string {
  const digits = waFrom.replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) {
    return `0${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits ? `+${digits}` : waFrom;
}

export function toInboxTimestamp(value: string | number | null | undefined): string {
  if (value == null || value === '') return new Date().toISOString();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return new Date(Number(raw)).toISOString();
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

/**
 * Classify a POST to a sentinel IM session id (never a real customer).
 * 401/403 or missing URL → composer off. Validation / resource-not-found → API exists.
 */
export function classifySupportImSendProbe(
  status?: number,
  errorBody?: string
): { canSend: boolean; reason?: string } {
  const body = (errorBody || '').toUpperCase();
  if (!status) {
    return {
      canSend: false,
      reason:
        'Desk Instant Messaging send could not be verified. Support replies stay in Zoho Desk.',
    };
  }
  if (status === 401 || status === 403 || body.includes('OAUTH_SCOPE')) {
    return {
      canSend: false,
      reason:
        'Desk token is missing Instant Messaging CREATE scope (Desk.InstantMessages.CREATE). Support replies stay in Zoho Desk.',
    };
  }
  if (body.includes('URL_NOT_FOUND') || body.includes('INVALID_URL')) {
    return {
      canSend: false,
      reason:
        'Desk IM send endpoint is not available on this org. Support replies stay in Zoho Desk.',
    };
  }
  if (status === 400 || status === 404 || status === 422) {
    return { canSend: true };
  }
  return {
    canSend: false,
    reason: `Desk IM send unavailable (${status}). Support replies stay in Zoho Desk.`,
  };
}
