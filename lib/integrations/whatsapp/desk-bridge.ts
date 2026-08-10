/**
 * WhatsApp ↔ Zoho Desk support bridge
 *
 * Inbound: Meta Cloud API messages → Desk tickets / comments
 * Outbound: agent public Desk comments → WhatsApp sendText (via Inngest sync)
 *
 * Uses a freshly minted Desk OAuth token (same pattern as
 * scripts/log-unjani-support-tickets.ts) — does NOT use the shared zoho_tokens
 * cache, which CRM jobs overwrite with CRM-scoped tokens.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import type { WebhookMessage } from '@/lib/integrations/whatsapp/types';
import { zohoLogger } from '@/lib/logging';

export const WA_IN_PREFIX = '[WA-IN]';
export const WA_OUT_MARKER = '[WA-OUT-SYNCED]';

const SUBJECT_PREFIX_SUPPORT = 'WhatsApp support from';
const SUBJECT_PREFIX_SALES = 'WhatsApp sales from';

/** True when inbound Cloud API phone is the sales/marketing line (084). */
export function isSalesPhoneNumberId(
  phoneNumberId: string | undefined | null
): boolean {
  if (!phoneNumberId) return false;
  const salesId =
    process.env.WHATSAPP_SALES_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    '';
  return !!salesId && phoneNumberId.trim() === salesId.trim();
}

/**
 * Desk department for bridge tickets.
 * Sales 084 → ZOHO_DESK_SALES_DEPARTMENT_ID (CircleTel Sales); else support dept.
 */
export function resolveBridgeDepartmentId(
  phoneNumberId?: string | null
): string | undefined {
  if (isSalesPhoneNumberId(phoneNumberId)) {
    return (
      process.env.ZOHO_DESK_SALES_DEPARTMENT_ID ||
      process.env.ZOHO_DESK_DEPARTMENT_ID ||
      undefined
    );
  }
  return process.env.ZOHO_DESK_DEPARTMENT_ID || undefined;
}

export function resolveBridgeSubjectPrefix(
  phoneNumberId?: string | null
): string {
  return isSalesPhoneNumberId(phoneNumberId)
    ? SUBJECT_PREFIX_SALES
    : SUBJECT_PREFIX_SUPPORT;
}

type DeskThreadRow = {
  id: string;
  wa_from: string;
  desk_ticket_id: string;
  desk_ticket_number: string | null;
  contact_name: string | null;
  status: 'open' | 'closed';
  last_inbound_wa_message_id: string | null;
  last_synced_comment_id: string | null;
};

type DeskComment = {
  id: string;
  content?: string;
  contentType?: string;
  isPublic?: boolean;
  createdTime?: string;
  commentedTime?: string;
  author?: { name?: string; email?: string } | null;
};

function isBridgeEnabled(): boolean {
  const flag = process.env.WHATSAPP_DESK_BRIDGE_ENABLED;
  if (flag === 'false' || flag === '0') return false;
  // Default ON for urgent support restoration; set WHATSAPP_DESK_BRIDGE_ENABLED=false to disable
  return true;
}

/**
 * Phone number IDs that use Zoho Desk native Instant Messaging (not this bridge).
 * Default: sales 084 when WHATSAPP_SALES_NATIVE_IM=true.
 */
export function getNativeDeskImPhoneNumberIds(): Set<string> {
  const ids = new Set<string>();
  const explicit = process.env.WHATSAPP_NATIVE_DESK_IM_PHONE_NUMBER_IDS || '';
  for (const part of explicit.split(',')) {
    const id = part.trim();
    if (id) ids.add(id);
  }
  const salesNative =
    process.env.WHATSAPP_SALES_NATIVE_IM === 'true' ||
    process.env.WHATSAPP_SALES_NATIVE_IM === '1';
  if (salesNative) {
    const salesId =
      process.env.WHATSAPP_SALES_PHONE_NUMBER_ID ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      '';
    if (salesId) ids.add(salesId);
  }
  return ids;
}

/** Skip CircleTel desk-bridge when Zoho Desk IM owns this Cloud API phone. */
export function shouldSkipDeskBridgeForPhone(
  phoneNumberId: string | undefined | null
): boolean {
  if (!phoneNumberId) return false;
  return getNativeDeskImPhoneNumberIds().has(phoneNumberId.trim());
}

function getServiceSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function deskBaseUrl(): string {
  const region = process.env.ZOHO_REGION || 'US';
  const suffix =
    ({ US: '', EU: '.eu', IN: '.in', AU: '.com.au', CN: '.com.cn' } as Record<string, string>)[
      region
    ] ?? '';
  return `https://desk.zoho${suffix}.com/api/v1`;
}

function accountsHost(): string {
  const region = process.env.ZOHO_REGION || 'US';
  return (
    ({
      US: 'accounts.zoho.com',
      EU: 'accounts.zoho.eu',
      IN: 'accounts.zoho.in',
      AU: 'accounts.zoho.com.au',
      CN: 'accounts.zoho.com.cn',
    } as Record<string, string>)[region] ?? 'accounts.zoho.com'
  );
}

/** Mint Desk access token directly from Desk refresh token (bypass zoho_tokens). */
export async function mintDeskAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_DESK_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
  const clientSecret =
    process.env.ZOHO_DESK_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
  const refreshToken =
    process.env.ZOHO_DESK_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Zoho Desk OAuth env (ZOHO_DESK_CLIENT_ID/SECRET/REFRESH_TOKEN)'
    );
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`https://${accountsHost()}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`Desk token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
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
      zohoLogger.error('[WA Desk Bridge] Desk API error', {
        status: res.status,
        endpoint,
        error: text.slice(0, 500),
      });
      return { success: false, error: text, status: res.status };
    }
    return {
      success: true,
      data: text ? (JSON.parse(text) as T) : undefined,
      status: res.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    zohoLogger.error('[WA Desk Bridge] Desk request failed', { error: message });
    return { success: false, error: message };
  }
}

function normalizeWaFrom(from: string): string {
  return from.replace(/\D/g, '');
}

/**
 * Desk requires a contact email. Use a real domain (+tag) so Send does not
 * NXDOMAIN-bounce. Delivery to WhatsApp still goes through the Cloud API bridge
 * (comments / conversation sync) — not SMTP to this address.
 */
function placeholderEmail(waFrom: string): string {
  return `contactus+wa${normalizeWaFrom(waFrom)}@circletel.co.za`;
}

function extractInboundBody(
  message: WebhookMessage,
  contactName?: string
): string {
  const nameLine = contactName ? `From: ${contactName}\n` : '';
  if (message.type === 'text' && message.text?.body) {
    return `${nameLine}${message.text.body}`;
  }
  if (message.type === 'button' && message.button?.text) {
    return `${nameLine}[Button] ${message.button.text}`;
  }
  if (message.type === 'interactive') {
    const title =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title;
    if (title) return `${nameLine}[Interactive] ${title}`;
  }
  if (message.type === 'image') {
    return `${nameLine}[Customer sent an image]`;
  }
  if (message.type === 'document') {
    return `${nameLine}[Customer sent a document]`;
  }
  return `${nameLine}[Unsupported message type: ${message.type}]`;
}

function formatDisplayPhone(waFrom: string): string {
  const digits = normalizeWaFrom(waFrom);
  if (digits.startsWith('27') && digits.length === 11) {
    return `0${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

async function findOpenThread(
  supabase: SupabaseClient,
  waFrom: string
): Promise<DeskThreadRow | null> {
  const { data, error } = await supabase
    .from('whatsapp_desk_threads')
    .select('*')
    .eq('wa_from', normalizeWaFrom(waFrom))
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    zohoLogger.error('[WA Desk Bridge] findOpenThread failed', {
      error: error.message,
    });
    return null;
  }
  return data as DeskThreadRow | null;
}

/**
 * Handle inbound non-flow WhatsApp message → Desk ticket/comment.
 * Soft-fails: never throws to the webhook caller.
 */
export async function handleInboundWhatsAppToDesk(
  message: WebhookMessage,
  options?: { contactName?: string; phoneNumberId?: string }
): Promise<{
  success: boolean;
  ticketId?: string;
  reason?: string;
}> {
  if (!isBridgeEnabled()) {
    return { success: false, reason: 'bridge_disabled' };
  }

  if (shouldSkipDeskBridgeForPhone(options?.phoneNumberId)) {
    zohoLogger.info(
      '[WA Desk Bridge] Skipping — phone uses Zoho Desk native IM',
      { phoneNumberId: options?.phoneNumberId }
    );
    return { success: false, reason: 'native_desk_im' };
  }

  const departmentId = resolveBridgeDepartmentId(options?.phoneNumberId);
  if (!departmentId) {
    zohoLogger.error(
      '[WA Desk Bridge] ZOHO_DESK_DEPARTMENT_ID / ZOHO_DESK_SALES_DEPARTMENT_ID not set'
    );
    return { success: false, reason: 'missing_department' };
  }
  const subjectPrefix = resolveBridgeSubjectPrefix(options?.phoneNumberId);
  const isSales = isSalesPhoneNumberId(options?.phoneNumberId);

  const waFrom = normalizeWaFrom(message.from);
  const supabase = getServiceSupabase();

  const { data: existingByMsg } = await supabase
    .from('whatsapp_desk_threads')
    .select('id, desk_ticket_id')
    .eq('last_inbound_wa_message_id', message.id)
    .maybeSingle();

  if (existingByMsg) {
    return {
      success: true,
      ticketId: existingByMsg.desk_ticket_id,
      reason: 'duplicate_message',
    };
  }

  const body = extractInboundBody(message, options?.contactName);
  const inboundComment = `${WA_IN_PREFIX} ${body}`;

  try {
    const accessToken = await mintDeskAccessToken();
    const openThread = await findOpenThread(supabase, waFrom);

    if (openThread) {
      const commentResult = await deskRequest<DeskComment>(
        accessToken,
        `/tickets/${openThread.desk_ticket_id}/comments`,
        'POST',
        {
          content: inboundComment,
          contentType: 'plainText',
          isPublic: false,
        }
      );

      if (!commentResult.success) {
        return {
          success: false,
          reason: `add_comment_failed: ${commentResult.error}`,
        };
      }

      await supabase
        .from('whatsapp_desk_threads')
        .update({
          last_inbound_wa_message_id: message.id,
          contact_name: options?.contactName || openThread.contact_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', openThread.id);

      return {
        success: true,
        ticketId: openThread.desk_ticket_id,
        reason: 'comment_added',
      };
    }

    const displayPhone = formatDisplayPhone(waFrom);
    const contactName = options?.contactName?.trim() || displayPhone;
    const nameParts = contactName.trim().split(/\s+/);
    const lastName =
      nameParts.length > 1
        ? nameParts[nameParts.length - 1]
        : nameParts[0] || 'WhatsApp';
    const firstName =
      nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : undefined;

    const channelLabel = isSales
      ? 'WhatsApp Cloud API bridge (Sales 084)'
      : 'WhatsApp Cloud API bridge';

    const agentInstructionsPrivateNote =
      'AGENT REPLY (WhatsApp bridge)\n' +
      '1. Best: add a Public Comment with reply text only (no quotes) — synced to WhatsApp ~1 min.\n' +
      '2. Or click Send — reply text is synced to WhatsApp via Cloud API (~1 min). The contact email is only a Desk placeholder.\n' +
      '3. Prefer a short reply without CSAT / quoted history.\n' +
      '4. Ignore mailer-daemon bounces if any — WhatsApp delivery is via the bridge, not email.\n\n' +
      `Channel: ${channelLabel}\nWA ID: ${waFrom}`;

    const ticketPayload: Record<string, unknown> = {
      subject: `${subjectPrefix} ${displayPhone}`,
      // Customer-visible body only — instructions go in a private note after create
      description: inboundComment,
      departmentId,
      priority: 'Medium',
      status: 'Open',
      channel: 'WhatsApp',
      phone: displayPhone,
      contact: {
        ...(firstName ? { firstName } : {}),
        lastName,
        email: placeholderEmail(waFrom),
        phone: displayPhone,
      },
    };

    let createResult = await deskRequest<{
      id: string;
      ticketNumber?: string;
    }>(accessToken, '/tickets', 'POST', ticketPayload);

    if (!createResult.success || !createResult.data?.id) {
      if (createResult.error?.toLowerCase().includes('channel')) {
        const { channel: _channel, ...withoutChannel } = ticketPayload;
        createResult = await deskRequest<{ id: string; ticketNumber?: string }>(
          accessToken,
          '/tickets',
          'POST',
          withoutChannel
        );
      }
    }

    if (!createResult.success || !createResult.data?.id) {
      return {
        success: false,
        reason: `create_ticket_failed: ${createResult.error}`,
      };
    }

    const ticketId = createResult.data.id;
    const ticketNumber = createResult.data.ticketNumber ?? null;

    const instructionsNote = await deskRequest(
      accessToken,
      `/tickets/${ticketId}/comments`,
      'POST',
      {
        content: agentInstructionsPrivateNote,
        contentType: 'plainText',
        isPublic: false,
      }
    );
    if (!instructionsNote.success) {
      zohoLogger.warn('[WA Desk Bridge] agent instructions private note failed', {
        ticketId,
        error: instructionsNote.error,
      });
    }

    const { error: insertError } = await supabase
      .from('whatsapp_desk_threads')
      .insert({
        wa_from: waFrom,
        desk_ticket_id: ticketId,
        desk_ticket_number: ticketNumber,
        contact_name: options?.contactName || null,
        status: 'open',
        last_inbound_wa_message_id: message.id,
        last_synced_comment_id: null,
      });

    if (insertError) {
      zohoLogger.error('[WA Desk Bridge] thread insert failed', {
        error: insertError.message,
        ticketId,
      });
    }

    return { success: true, ticketId, reason: 'ticket_created' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    zohoLogger.error('[WA Desk Bridge] inbound failed', { error: msg });
    return { success: false, reason: msg };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function commentPlainText(comment: DeskComment): string {
  const raw = comment.content || '';
  if (comment.contentType === 'html' || /<[^>]+>/.test(raw)) {
    return stripHtml(raw);
  }
  return raw.trim();
}

function shouldSyncCommentToWhatsApp(comment: DeskComment): boolean {
  if (comment.isPublic === false) return false;
  const text = commentPlainText(comment);
  if (!text) return false;
  if (text.startsWith(WA_IN_PREFIX)) return false;
  if (text.includes(WA_OUT_MARKER)) return false;
  return true;
}

type OutboundCandidate = {
  id: string;
  text: string;
  timestamp: number;
  source: 'comment' | 'conversation';
};

/** Strip Desk email quoted history / CSAT chrome so only the agent reply goes to WhatsApp. */
export function extractAgentReplyBody(raw: string): string {
  let text = stripHtml(raw || '');
  // Normalize en/em dashes so Zoho/WhatsApp quote markers match consistently
  text = text.replace(/[\u2013\u2014]/g, '-');

  // Cut quoted history. Zoho uses "---- on Mon, … wrote ----"; WhatsApp may show
  // a single dash/em-dash line. Require a weekday+date-like "on Mon, 10 …" to avoid
  // cutting legitimate agent text that merely contains "on".
  text = text.split(
    /\n?-+\s*on\s+[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/i
  )[0];
  text = text.split(/\nOn .+ wrote:/i)[0];
  text = text.split(/\n?\[WA-IN\]/)[0];
  text = text.split(/\nChannel:\s*WhatsApp Cloud API bridge/i)[0];
  // Drop CSAT prompt blocks agents often leave in
  text = text.replace(/How would you rate our customer service\?[\s\S]*$/i, '');
  text = text.replace(/\bGood\b\s*\bBad\b[\s\S]*$/i, '');
  return text.trim();
}

type DeskConversationThread = {
  id: string;
  direction?: string;
  channel?: string;
  content?: string;
  summary?: string;
  createdTime?: string;
  author?: { name?: string; type?: string } | null;
  channelRelatedInfo?: { messages?: string } | null;
};

async function fetchOutboundConversationCandidates(
  accessToken: string,
  ticketId: string
): Promise<OutboundCandidate[]> {
  const list = await deskRequest<{ data: DeskConversationThread[] }>(
    accessToken,
    `/tickets/${ticketId}/conversations?limit=50`
  );
  if (!list.success || !list.data?.data?.length) return [];

  const out: OutboundCandidate[] = [];

  for (const item of list.data.data) {
    const direction = (item.direction || '').toUpperCase();
    if (direction && direction !== 'OUT') continue;

    // Prefer nested messages when Desk only returns a thread shell
    let bodies: Array<{ id: string; text: string; ts: string }> = [];
    const messagesUrl = item.channelRelatedInfo?.messages;
    if (messagesUrl) {
      const path = messagesUrl.replace(/^https?:\/\/[^/]+\/api\/v1/, '');
      const msgs = await deskRequest<{
        data: Array<{
          id: string;
          direction?: string;
          summary?: string | null;
          content?: string | null;
          createdTime?: string;
        }>;
      }>(accessToken, path.startsWith('/') ? path : `/${path}`);
      if (msgs.success && msgs.data?.data) {
        for (const m of msgs.data.data) {
          if ((m.direction || '').toUpperCase() === 'IN') continue;
          const raw = m.summary || m.content || '';
          if (!raw) continue;
          bodies.push({
            id: m.id,
            text: extractAgentReplyBody(raw),
            ts: m.createdTime || item.createdTime || '',
          });
        }
      }
    }

    if (!bodies.length) {
      const raw = item.content || item.summary || '';
      if (raw && (!direction || direction === 'OUT')) {
        bodies.push({
          id: item.id,
          text: extractAgentReplyBody(raw),
          ts: item.createdTime || '',
        });
      }
    }

    for (const b of bodies) {
      if (!b.text) continue;
      if (b.text.startsWith(WA_IN_PREFIX) || b.text.includes(WA_OUT_MARKER)) continue;
      // Skip pure inbound description echoes
      if (b.text.includes('WhatsApp Cloud API bridge') && b.text.includes('[WA-IN]')) {
        continue;
      }
      out.push({
        id: `conv:${b.id}`,
        text: b.text,
        timestamp: Date.parse(b.ts) || 0,
        source: 'conversation',
      });
    }
  }

  return out;
}

async function fetchOutboundCommentCandidates(
  accessToken: string,
  ticketId: string
): Promise<OutboundCandidate[]> {
  const commentsResult = await deskRequest<{ data: DeskComment[] }>(
    accessToken,
    `/tickets/${ticketId}/comments?limit=50`
  );
  if (!commentsResult.success || !commentsResult.data?.data) return [];

  return commentsResult.data.data
    .filter((c) => shouldSyncCommentToWhatsApp(c))
    .map((c) => ({
      id: `comment:${c.id}`,
      text: extractAgentReplyBody(commentPlainText(c)),
      timestamp: Date.parse(c.commentedTime || c.createdTime || '') || 0,
      source: 'comment' as const,
    }))
    .filter((c) => !!c.text);
}

/**
 * Sync agent replies on open WA threads out to WhatsApp.
 * Sources: public Desk comments AND email/conversation Send replies.
 */
export async function syncDeskCommentsToWhatsApp(): Promise<{
  threadsChecked: number;
  messagesSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let messagesSent = 0;

  if (!isBridgeEnabled()) {
    return { threadsChecked: 0, messagesSent: 0, errors: ['bridge_disabled'] };
  }

  const supabase = getServiceSupabase();
  const { data: threads, error } = await supabase
    .from('whatsapp_desk_threads')
    .select('*')
    .eq('status', 'open')
    .order('updated_at', { ascending: true })
    .limit(50);

  if (error) {
    return {
      threadsChecked: 0,
      messagesSent: 0,
      errors: [error.message],
    };
  }

  if (!threads?.length) {
    return { threadsChecked: 0, messagesSent: 0, errors: [] };
  }

  let accessToken: string;
  try {
    accessToken = await mintDeskAccessToken();
  } catch (e) {
    return {
      threadsChecked: 0,
      messagesSent: 0,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }

  for (const thread of threads as DeskThreadRow[]) {
    const [fromComments, fromConversations] = await Promise.all([
      fetchOutboundCommentCandidates(accessToken, thread.desk_ticket_id),
      fetchOutboundConversationCandidates(accessToken, thread.desk_ticket_id),
    ]);

    const candidates = [...fromComments, ...fromConversations].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    let cursor = thread.last_synced_comment_id;
    let sawCursor = cursor == null;
    let threadFailed = false;

    for (const candidate of candidates) {
      if (!sawCursor) {
        if (candidate.id === cursor) {
          sawCursor = true;
        }
        continue;
      }

      const sendResult = await whatsAppService.sendText(
        thread.wa_from,
        candidate.text
      );

      if (!sendResult.success) {
        errors.push(
          `ticket ${thread.desk_ticket_id} ${candidate.id}: ${sendResult.error}`
        );
        threadFailed = true;
        break;
      }

      messagesSent += 1;
      cursor = candidate.id;

      await deskRequest(
        accessToken,
        `/tickets/${thread.desk_ticket_id}/comments`,
        'POST',
        {
          content: `${WA_OUT_MARKER} Sent to WhatsApp via ${candidate.source} (${sendResult.messageId || 'ok'})`,
          contentType: 'plainText',
          isPublic: false,
        }
      );

      await supabase
        .from('whatsapp_desk_threads')
        .update({
          last_synced_comment_id: cursor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thread.id);

      await new Promise((r) => setTimeout(r, 200));
    }

    if (!threadFailed && cursor && cursor !== thread.last_synced_comment_id) {
      await supabase
        .from('whatsapp_desk_threads')
        .update({
          last_synced_comment_id: cursor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thread.id);
    }
  }

  return {
    threadsChecked: threads.length,
    messagesSent,
    errors,
  };
}
