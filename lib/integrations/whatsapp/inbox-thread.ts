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
  const text = t.startsWith(WA_IN_PREFIX)
    ? t.slice(WA_IN_PREFIX.length).trim()
    : extractAgentReplyBody(t);
  return stripInboundFromPrefix(text);
}

/** Bridge inbound comments are `[WA-IN] From: Name\\nbody`. */
export function stripInboundFromPrefix(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const twoLine = trimmed.replace(/^From:\s*[^\n]+\n/, '').trim();
  return twoLine || trimmed;
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
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  let raw = String(value).trim();
  if (/^\d+$/.test(raw)) return new Date(Number(raw)).toISOString();
  raw = raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? '' : new Date(parsed).toISOString();
}

export interface DeskHistoryComment {
  id: string;
  content?: string;
  isPublic?: boolean;
  createdTime?: string;
  commentedTime?: string;
  author?: { name?: string };
}

export interface DeskHistoryConversation {
  id: string;
  direction?: string;
  content?: string;
  summary?: string;
  createdTime?: string;
  author?: { name?: string };
}

function displayKey(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Comments are the WhatsApp-bridge source of truth. Desk also creates email
 * conversations from public comments; those often have the same body with
 * direction defaulting to IN, which duplicated agent replies in the inbox.
 */
export function mergeDeskHistory(
  comments: DeskHistoryComment[],
  conversations: DeskHistoryConversation[]
): InboxMessage[] {
  const messages: InboxMessage[] = [];
  const seen = new Set<string>();

  const push = (message: InboxMessage) => {
    const key = displayKey(message.text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    messages.push(message);
  };

  for (const c of comments) {
    const raw = asInboxText(c.content);
    if (isInternalInboxMessage(raw)) continue;
    const inbound = raw.trim().startsWith(WA_IN_PREFIX);
    if (!inbound && c.isPublic === false) continue;
    const text = toCustomerFacingText(raw);
    if (!text) continue;
    push({
      id: `comment:${c.id}`,
      direction: inbound ? 'in' : 'out',
      text,
      timestamp: toInboxTimestamp(c.commentedTime || c.createdTime),
      author: c.author?.name,
    });
  }

  for (const item of conversations) {
    const raw = asInboxText(item.summary || item.content);
    if (isInternalInboxMessage(raw)) continue;
    const text = toCustomerFacingText(raw);
    if (!text) continue;
    const direction = (item.direction || '').toUpperCase() === 'OUT' ? 'out' : 'in';
    if (direction === 'in' && /^From:\s/i.test(text)) continue;
    push({
      id: `conv:${item.id}`,
      direction,
      text,
      timestamp: toInboxTimestamp(item.createdTime),
      author: item.author?.name,
    });
  }

  return messages
    .map((message, index) => ({ message, index }))
    .sort((a, b) => {
      const ta = Date.parse(a.message.timestamp);
      const tb = Date.parse(b.message.timestamp);
      const aOk = Number.isFinite(ta);
      const bOk = Number.isFinite(tb);
      if (aOk && bOk && ta !== tb) return ta - tb;
      if (aOk !== bOk) return aOk ? -1 : 1;
      return a.index - b.index;
    })
    .map((row) => row.message);
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
