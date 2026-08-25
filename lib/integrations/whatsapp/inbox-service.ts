import { createClient } from '@supabase/supabase-js';
import { zohoLogger } from '@/lib/logging';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import {
  mintDeskAccessToken,
  WA_OUT_MARKER,
} from '@/lib/integrations/whatsapp/desk-bridge';
import {
  classifySupportImReadProbe,
  classifySupportImSendProbe,
  decodeInboxThreadId,
  deskCollection,
  deskTicketWebUrl,
  encodeInboxThreadId,
  formatDisplayPhone,
  isInternalInboxMessage,
  isWhatsAppSupportTicket,
  mergeDeskHistory,
  SUPPORT_IM_SEND_SENTINEL_SESSION_ID,
  supportImReplyBody,
  supportImSendPath,
  toCustomerFacingText,
  toInboxTimestamp,
  type InboxChannel,
  type InboxMessage,
} from '@/lib/integrations/whatsapp/inbox-thread';

export interface InboxThreadSummary {
  id: string;
  channel: InboxChannel;
  title: string;
  phone: string | null;
  ticketId: string | null;
  ticketNumber: string | null;
  deskUrl: string | null;
  preview: string;
  updatedAt: string;
  status: string;
}

export interface InboxThreadDetail {
  thread: InboxThreadSummary;
  messages: InboxMessage[];
  canReply: boolean;
  cannotReplyReason?: string;
  historyWarning?: string;
}

export interface InboxListResult {
  threads: InboxThreadSummary[];
  supportComposerEnabled: boolean;
  supportComposerReason?: string;
}

type DeskThreadRow = {
  id: string;
  wa_from: string;
  desk_ticket_id: string;
  desk_ticket_number: string | null;
  contact_name: string | null;
  status: 'open' | 'closed';
  updated_at: string;
};

type ImActor = {
  name?: string;
  contactName?: string;
  phone?: string;
  externalId?: string;
  type?: string;
};

type ImSession = {
  id: string;
  subject?: string;
  lastActiveTime?: string | number;
  createdTime?: string | number;
  integrationService?: string;
  channel?: string;
  status?: string;
  meta?: {
    DESK_TICKET_ID?: string;
    DESK_TICKET_NUMBER?: string | number;
  };
  actor?: ImActor | null;
  contact?: { name?: string; phone?: string } | null;
  endUser?: { name?: string; phone?: string } | null;
};

function deskBaseUrl(): string {
  const region = process.env.ZOHO_REGION || 'US';
  const suffix =
    ({ US: '', EU: '.eu', IN: '.in', AU: '.com.au', CN: '.com.cn' } as Record<
      string,
      string
    >)[region] ?? '';
  return `https://desk.zoho${suffix}.com/api/v1`;
}

async function deskRequest<T>(
  accessToken: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  const orgId = process.env.ZOHO_DESK_ORG_ID || '';
  const headers: Record<string, string> = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (orgId) headers.orgId = orgId;
  try {
    const res = await fetch(`${deskBaseUrl()}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      return { success: false, error: text.slice(0, 500), status: res.status };
    }
    return {
      success: true,
      data: text ? (JSON.parse(text) as T) : undefined,
      status: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function supportDepartmentId(): string {
  return process.env.ZOHO_DESK_DEPARTMENT_ID || '';
}

let imProbeCache: {
  at: number;
  canRead: boolean;
  canSend: boolean;
  reason?: string;
} | null = null;

export async function probeSupportImCapability(): Promise<{
  canRead: boolean;
  canSend: boolean;
  reason?: string;
}> {
  const now = Date.now();
  if (imProbeCache && now - imProbeCache.at < 60_000) return imProbeCache;
  try {
    const token = await mintDeskAccessToken();
    const list = await deskRequest<{ data?: ImSession[] }>(
      token,
      '/im/sessions?limit=1'
    );
    if (!list.success) {
      const classified = classifySupportImReadProbe(list.status, list.error);
      imProbeCache = {
        at: now,
        canRead: false,
        canSend: false,
        reason: classified.reason,
      };
      return imProbeCache;
    }

    // Empty POST to a well-formed fake id: 422 means send exists.
    // `{ message }` on a missing id returns URL_NOT_FOUND (same as GET).
    const send = await deskRequest(
      token,
      supportImSendPath(SUPPORT_IM_SEND_SENTINEL_SESSION_ID),
      'POST',
      {}
    );
    const classified = classifySupportImSendProbe(send.status, send.error);
    imProbeCache = {
      at: now,
      canRead: true,
      canSend: classified.canSend,
      reason: classified.canSend
        ? undefined
        : classified.reason ||
          'Support WhatsApp replies stay in Zoho Desk Instant Messaging.',
    };
    return imProbeCache;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    imProbeCache = { at: now, canRead: false, canSend: false, reason };
    return imProbeCache;
  }
}

function sessionTitle(session: ImSession): string {
  return (
    session.actor?.contactName ||
    session.actor?.name ||
    session.endUser?.name ||
    session.contact?.name ||
    session.subject ||
    'WhatsApp support'
  );
}

function sessionPhone(session: ImSession): string | null {
  const raw =
    session.actor?.externalId ||
    session.actor?.phone ||
    session.endUser?.phone ||
    session.contact?.phone ||
    null;
  return raw ? formatDisplayPhone(raw) : null;
}

async function listSalesThreads(): Promise<InboxThreadSummary[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('whatsapp_desk_threads')
    .select(
      'id, wa_from, desk_ticket_id, desk_ticket_number, contact_name, status, updated_at'
    )
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    zohoLogger.error('[WA Inbox] list sales threads failed', {
      error: error.message,
    });
    return [];
  }

  return ((data || []) as DeskThreadRow[]).map((row) => {
    const phone = formatDisplayPhone(row.wa_from);
    const title = row.contact_name?.trim() || phone;
    return {
      id: encodeInboxThreadId({ channel: 'sales', id: row.id }),
      channel: 'sales' as const,
      title,
      phone,
      ticketId: row.desk_ticket_id,
      ticketNumber: row.desk_ticket_number,
      deskUrl: deskTicketWebUrl(row.desk_ticket_id),
      preview: `Sales 084 · #${row.desk_ticket_number || row.desk_ticket_id}`,
      updatedAt: row.updated_at,
      status: row.status,
    };
  });
}

async function listSupportImSessions(
  token: string
): Promise<InboxThreadSummary[]> {
  const dept = supportDepartmentId();
  const qs = new URLSearchParams({ limit: '50' });
  if (dept) qs.set('departmentId', dept);
  const result = await deskRequest<{ data?: ImSession[] }>(
    token,
    `/im/sessions?${qs.toString()}`
  );
  if (!result.success || !result.data?.data) return [];

  return result.data.data
    .filter((s) => (s.integrationService || '').toUpperCase() === 'WHATSAPP')
    .map((session) => {
      const ticketId = session.meta?.DESK_TICKET_ID
        ? String(session.meta.DESK_TICKET_ID)
        : null;
      const ticketNumber = session.meta?.DESK_TICKET_NUMBER
        ? String(session.meta.DESK_TICKET_NUMBER)
        : null;
      return {
        id: encodeInboxThreadId({
          channel: 'support',
          id: session.id,
          kind: 'session',
        }),
        channel: 'support' as const,
        title: sessionTitle(session),
        phone: sessionPhone(session),
        ticketId,
        ticketNumber,
        deskUrl: ticketId ? deskTicketWebUrl(ticketId) : null,
        preview: session.subject || 'WhatsApp support',
        updatedAt: toInboxTimestamp(session.lastActiveTime || session.createdTime),
        status: (session.status || 'open').toLowerCase(),
      };
    });
}

type SupportDeskTicket = {
  id: string;
  ticketNumber?: string;
  subject?: string;
  channel?: string;
  modifiedTime?: string;
  createdTime?: string;
  status?: string;
  contact?: { lastName?: string; firstName?: string; phone?: string };
};

function mapSupportTicket(t: SupportDeskTicket): InboxThreadSummary {
  const name = [t.contact?.firstName, t.contact?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    id: encodeInboxThreadId({
      channel: 'support',
      id: t.id,
      kind: 'ticket',
    }),
    channel: 'support' as const,
    title: name || t.subject || 'WhatsApp support',
    phone: t.contact?.phone || null,
    ticketId: t.id,
    ticketNumber: t.ticketNumber || null,
    deskUrl: deskTicketWebUrl(t.id),
    preview: t.subject || 'WhatsApp support',
    updatedAt: toInboxTimestamp(t.modifiedTime || t.createdTime),
    status: (t.status || 'Open').toLowerCase(),
  };
}

async function listSupportTicketsFallback(
  token: string
): Promise<InboxThreadSummary[]> {
  const dept = supportDepartmentId();
  const qs = new URLSearchParams({ limit: '50' });
  if (dept) qs.set('departmentId', dept);
  const result = await deskRequest<{ data?: SupportDeskTicket[] }>(
    token,
    `/tickets?${qs.toString()}`
  );
  const tickets = deskCollection<SupportDeskTicket>(result);
  if (!result.success && result.status !== 204) {
    zohoLogger.error('[WA Inbox] support ticket fallback failed', {
      status: result.status,
    });
    return [];
  }

  const matched = tickets
    .filter((t) => isWhatsAppSupportTicket(t.channel, t.subject))
    .map(mapSupportTicket);

  zohoLogger.info('[WA Inbox] support ticket fallback', {
    status: result.status || 200,
    listed: tickets.length,
    whatsapp: matched.length,
  });
  return matched;
}

export async function listInboxThreads(
  channel: 'all' | InboxChannel = 'all'
): Promise<InboxListResult> {
  const probe = await probeSupportImCapability();
  const [sales, support] = await Promise.all([
    channel === 'support' ? Promise.resolve([]) : listSalesThreads(),
    channel === 'sales'
      ? Promise.resolve([])
      : (async () => {
          try {
            const token = await mintDeskAccessToken();
            if (probe.canRead) return listSupportImSessions(token);
            return listSupportTicketsFallback(token);
          } catch (error) {
            zohoLogger.error('[WA Inbox] support list failed', {
              error: error instanceof Error ? error.message : String(error),
            });
            return [];
          }
        })(),
  ]);

  const threads = [...sales, ...support].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );

  return {
    threads,
    supportComposerEnabled: probe.canSend,
    supportComposerReason: probe.reason,
  };
}

async function loadDeskMessages(
  token: string,
  ticketId: string
): Promise<InboxMessage[]> {
  const comments = await deskRequest<{
    data?: Array<{
      id: string;
      content?: string;
      contentType?: string;
      isPublic?: boolean;
      createdTime?: string;
      commentedTime?: string;
      author?: { name?: string };
    }>;
  }>(token, `/tickets/${ticketId}/comments?limit=50`);

  const conversations = await deskRequest<{
    data?: Array<{
      id: string;
      direction?: string;
      content?: string;
      summary?: string;
      createdTime?: string;
      author?: { name?: string };
    }>;
  }>(token, `/tickets/${ticketId}/conversations?limit=50`);

  return mergeDeskHistory(
    Array.isArray(comments.data?.data) ? comments.data.data : [],
    Array.isArray(conversations.data?.data) ? conversations.data.data : []
  );
}

async function loadImMessages(
  token: string,
  sessionId: string
): Promise<InboxMessage[]> {
  const result = await deskRequest<{
    data?: Array<{
      id: string;
      displayMessage?: string;
      message?: string;
      createdTime?: string | number;
      direction?: string;
      actor?: { name?: string; type?: string };
    }>;
  }>(token, `/im/sessions/${sessionId}/messages?from=0&limit=50`);
  if (!result.success || !result.data?.data) return [];
  const messages: InboxMessage[] = [];
  for (const m of result.data.data) {
    const text = toCustomerFacingText(m.displayMessage || m.message);
    if (!text || isInternalInboxMessage(text)) continue;
    const dir = (m.direction || '').toUpperCase();
    const actorType = (m.actor?.type || '').toUpperCase().replace(/_/g, '');
    const inbound = dir === 'IN' || actorType === 'ENDUSER';
    messages.push({
      id: m.id,
      direction: inbound ? 'in' : 'out',
      text,
      timestamp: toInboxTimestamp(m.createdTime),
      author: m.actor?.name,
    });
  }
  return messages.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export async function getInboxThread(
  threadId: string
): Promise<InboxThreadDetail | null> {
  const ref = decodeInboxThreadId(threadId);
  if (!ref) return null;

  if (ref.channel === 'sales') {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('whatsapp_desk_threads')
      .select(
        'id, wa_from, desk_ticket_id, desk_ticket_number, contact_name, status, updated_at'
      )
      .eq('id', ref.id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as DeskThreadRow;
    const phone = formatDisplayPhone(row.wa_from);
    let messages: InboxMessage[] = [];
    let historyWarning: string | undefined;
    try {
      const token = await mintDeskAccessToken();
      messages = await loadDeskMessages(token, row.desk_ticket_id);
    } catch (error) {
      historyWarning =
        error instanceof Error ? error.message : String(error);
      zohoLogger.error('[WA Inbox] sales thread history failed', {
        error: historyWarning,
        threadId,
      });
    }
    return {
      thread: {
        id: threadId,
        channel: 'sales',
        title: row.contact_name?.trim() || phone,
        phone,
        ticketId: row.desk_ticket_id,
        ticketNumber: row.desk_ticket_number,
        deskUrl: deskTicketWebUrl(row.desk_ticket_id),
        preview: messages.at(-1)?.text || 'Sales 084',
        updatedAt: row.updated_at,
        status: row.status,
      },
      messages,
      canReply: true,
      historyWarning,
    };
  }

  let token: string;
  try {
    token = await mintDeskAccessToken();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      thread: {
        id: threadId,
        channel: 'support',
        title: 'WhatsApp support',
        phone: null,
        ticketId: ref.kind === 'ticket' ? ref.id : null,
        ticketNumber: null,
        deskUrl: ref.kind === 'ticket' ? deskTicketWebUrl(ref.id) : null,
        preview: 'WhatsApp support',
        updatedAt: new Date().toISOString(),
        status: 'open',
      },
      messages: [],
      canReply: false,
      cannotReplyReason: message,
    };
  }

  const probe = await probeSupportImCapability();

  if (ref.kind === 'session') {
    const sessionRes = await deskRequest<ImSession>(
      token,
      `/im/sessions/${ref.id}`
    );
    const session = sessionRes.data;
    const ticketId = session?.meta?.DESK_TICKET_ID
      ? String(session.meta.DESK_TICKET_ID)
      : null;
    const messages = await loadImMessages(token, ref.id);
    return {
      thread: {
        id: threadId,
        channel: 'support',
        title: session ? sessionTitle(session) : 'WhatsApp support',
        phone: session ? sessionPhone(session) : null,
        ticketId,
        ticketNumber: session?.meta?.DESK_TICKET_NUMBER
          ? String(session.meta.DESK_TICKET_NUMBER)
          : null,
        deskUrl: ticketId ? deskTicketWebUrl(ticketId) : null,
        preview: messages.at(-1)?.text || 'WhatsApp support',
        updatedAt: toInboxTimestamp(session?.lastActiveTime || session?.createdTime),
        status: 'open',
      },
      messages,
      canReply: probe.canSend,
      cannotReplyReason: probe.canSend
        ? undefined
        : probe.reason || 'Reply in Zoho Desk Instant Messaging.',
    };
  }

  const messages = await loadDeskMessages(token, ref.id);
  return {
    thread: {
      id: threadId,
      channel: 'support',
      title: 'WhatsApp support',
      phone: null,
      ticketId: ref.id,
      ticketNumber: null,
      deskUrl: deskTicketWebUrl(ref.id),
      preview: messages.at(-1)?.text || 'WhatsApp support',
      updatedAt: messages.at(-1)?.timestamp || toInboxTimestamp(undefined),
      status: 'open',
    },
    messages,
    canReply: false,
    cannotReplyReason:
      'This Support thread is ticket-backed only. Open it in Zoho Desk Instant Messaging to reply.',
  };
}

export async function replyInboxThread(
  threadId: string,
  rawBody: string
): Promise<{ success: boolean; error?: string }> {
  const text = toCustomerFacingText(rawBody);
  if (!text) return { success: false, error: 'Message body is empty' };
  const ref = decodeInboxThreadId(threadId);
  if (!ref) return { success: false, error: 'Unknown conversation' };

  if (ref.channel === 'sales') {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('whatsapp_desk_threads')
      .select('id, wa_from, desk_ticket_id')
      .eq('id', ref.id)
      .maybeSingle();
    if (error || !data) return { success: false, error: 'Sales thread not found' };

    const send = await whatsAppService.sendText(data.wa_from, text);
    if (!send.success) {
      return {
        success: false,
        error: send.error || 'WhatsApp Cloud API send failed',
      };
    }

    const token = await mintDeskAccessToken();
    const comment = await deskRequest<{ id?: string }>(
      token,
      `/tickets/${data.desk_ticket_id}/comments`,
      'POST',
      { content: text, contentType: 'plainText', isPublic: true }
    );
    await deskRequest(
      token,
      `/tickets/${data.desk_ticket_id}/comments`,
      'POST',
      {
        content: `${WA_OUT_MARKER} Sent to WhatsApp via admin inbox (${send.messageId || 'ok'})`,
        contentType: 'plainText',
        isPublic: false,
      }
    );
    if (comment.data?.id) {
      await supabase
        .from('whatsapp_desk_threads')
        .update({
          last_synced_comment_id: `comment:${comment.data.id}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);
    }
    return { success: true };
  }

  const probe = await probeSupportImCapability();
  if (!probe.canSend || ref.kind !== 'session') {
    return {
      success: false,
      error:
        probe.reason ||
        'Support replies must be sent from Zoho Desk Instant Messaging.',
    };
  }

  const token = await mintDeskAccessToken();
  const sent = await deskRequest(
    token,
    supportImSendPath(ref.id),
    'POST',
    supportImReplyBody(text)
  );
  if (!sent.success) {
    return {
      success: false,
      error:
        sent.status === 401 || sent.status === 403
          ? 'Desk token cannot send Instant Messages. Reply in Zoho Desk.'
          : sent.error || 'Desk IM send failed',
    };
  }
  return { success: true };
}
