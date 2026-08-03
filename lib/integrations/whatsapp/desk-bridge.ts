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

const SUBJECT_PREFIX = 'WhatsApp support from';

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

function placeholderEmail(waFrom: string): string {
  return `wa-${normalizeWaFrom(waFrom)}@whatsapp.circletel.local`;
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
  options?: { contactName?: string }
): Promise<{
  success: boolean;
  ticketId?: string;
  reason?: string;
}> {
  if (!isBridgeEnabled()) {
    return { success: false, reason: 'bridge_disabled' };
  }

  const departmentId = process.env.ZOHO_DESK_DEPARTMENT_ID;
  if (!departmentId) {
    zohoLogger.error('[WA Desk Bridge] ZOHO_DESK_DEPARTMENT_ID not set');
    return { success: false, reason: 'missing_department' };
  }

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

    const ticketPayload: Record<string, unknown> = {
      subject: `${SUBJECT_PREFIX} ${displayPhone}`,
      description: `${inboundComment}\n\n---\nChannel: WhatsApp Cloud API bridge\nWA ID: ${waFrom}`,
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

/**
 * Sync new public Desk comments on open WA threads out to WhatsApp.
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
    const commentsResult = await deskRequest<{ data: DeskComment[] }>(
      accessToken,
      `/tickets/${thread.desk_ticket_id}/comments?limit=50`
    );

    if (!commentsResult.success) {
      errors.push(
        `ticket ${thread.desk_ticket_id}: ${commentsResult.error || 'comments_failed'}`
      );
      continue;
    }

    const comments = commentsResult.data?.data || [];
    // Oldest first so replies send in agent order
    const chronological = [...comments].sort((a, b) => {
      const at = Date.parse(a.commentedTime || a.createdTime || '') || 0;
      const bt = Date.parse(b.commentedTime || b.createdTime || '') || 0;
      return at - bt;
    });

    let cursor = thread.last_synced_comment_id;
    let sawCursor = cursor == null;
    let threadFailed = false;

    for (const comment of chronological) {
      if (!sawCursor) {
        if (comment.id === cursor) {
          sawCursor = true;
        }
        continue;
      }

      if (!shouldSyncCommentToWhatsApp(comment)) {
        cursor = comment.id;
        continue;
      }

      const text = commentPlainText(comment);
      const sendResult = await whatsAppService.sendText(thread.wa_from, text);

      if (!sendResult.success) {
        errors.push(
          `ticket ${thread.desk_ticket_id} comment ${comment.id}: ${sendResult.error}`
        );
        threadFailed = true;
        break;
      }

      messagesSent += 1;
      cursor = comment.id;

      await deskRequest(
        accessToken,
        `/tickets/${thread.desk_ticket_id}/comments`,
        'POST',
        {
          content: `${WA_OUT_MARKER} Sent to WhatsApp (${sendResult.messageId || 'ok'})`,
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
