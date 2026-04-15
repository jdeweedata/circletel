/**
 * Zoho Desk Campaign Service
 *
 * Campaign-specific Zoho Desk queries and ConversationIntelligence for the
 * WhatsApp Lead Campaign daily report pipeline.
 */

import { createZohoAuthService } from './auth-service';
import { zohoLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export interface CampaignConversation {
  id: string;
  author: string;
  direction: 'in' | 'out';
  content: string;
  timestamp: string;
  channel: string;
}

export interface CampaignTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;            // 'Open' | 'Closed' | etc.
  assigneeName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdTime: string;
  closedTime: string | null;
  tags: string[];
}

export interface LeadProfile {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type InsightStatus =
  | 'signed_up'
  | 'no_coverage'
  | 'closed_resolved'
  | 'completed'
  | 'in_progress'
  | 'awaiting_details'
  | 'awaiting_agent'
  | 'unresponsive';

// =============================================================================
// CONVERSATION INTELLIGENCE
// =============================================================================

const EMAIL_REGEX = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const PHONE_REGEX = /(\+27|0)[6-8]\d{8}/;
const NO_COVERAGE_PHRASES = ['no coverage', 'not available', 'coverage check failed'];

export class ConversationIntelligence {
  private conversations: CampaignConversation[];
  private ticketStatus: string;

  constructor(conversations: CampaignConversation[], ticketStatus: string) {
    this.conversations = conversations;
    this.ticketStatus = ticketStatus;
  }

  /**
   * Extract lead profile fields from inbound conversation messages.
   *
   * Strategy:
   * - email: regex match on any inbound content
   * - phone: regex match on any inbound content
   * - address: first inbound message after a bot/GC message containing "location"
   * - name: first inbound message after a bot/GC message containing "name"
   */
  extractLeadProfile(): LeadProfile {
    const profile: LeadProfile = {};
    const inbound = this.conversations.filter((c) => c.direction === 'in');

    for (const conv of inbound) {
      const text = conv.content || '';

      if (!profile.email) {
        const emailMatch = text.match(EMAIL_REGEX);
        if (emailMatch) profile.email = emailMatch[0].toLowerCase();
      }

      if (!profile.phone) {
        const stripped = text.replace(/[\s-]/g, '');
        const phoneMatch = stripped.match(PHONE_REGEX);
        if (phoneMatch) profile.phone = phoneMatch[0];
      }
    }

    // Extract address from the message immediately following a "location" prompt
    const addressPromptIdx = this.conversations.findIndex(
      (c) =>
        c.direction === 'out' &&
        /location|address|where do you live/i.test(c.content || '')
    );
    if (addressPromptIdx !== -1) {
      const nextInbound = this.conversations
        .slice(addressPromptIdx + 1)
        .find((c) => c.direction === 'in');
      if (nextInbound) profile.address = (nextInbound.content || '').trim();
    }

    // Extract name from the message immediately following a "name" prompt
    const namePromptIdx = this.conversations.findIndex(
      (c) =>
        c.direction === 'out' &&
        /full name|your name/i.test(c.content || '')
    );
    if (namePromptIdx !== -1) {
      const nextInbound = this.conversations
        .slice(namePromptIdx + 1)
        .find((c) => c.direction === 'in');
      if (nextInbound) profile.name = (nextInbound.content || '').trim();
    }

    return profile;
  }

  /**
   * Derive the insight status for this ticket.
   * Priority: signed_up > no_coverage > closed_resolved > completed >
   *           in_progress > awaiting_details > awaiting_agent > unresponsive
   */
  deriveInsightStatus({ isSigned_up }: { isSigned_up: boolean }): InsightStatus {
    if (isSigned_up) return 'signed_up';

    const outbound = this.conversations.filter((c) => c.direction === 'out');
    const inbound = this.conversations.filter((c) => c.direction === 'in');

    // no_coverage: any outbound agent message contains no-coverage phrase
    const hasNoCoverage = outbound.some((c) =>
      NO_COVERAGE_PHRASES.some((phrase) =>
        (c.content || '').toLowerCase().includes(phrase)
      )
    );
    if (hasNoCoverage) return 'no_coverage';

    // closed_resolved: ticket is Closed
    if (this.ticketStatus === 'Closed') return 'closed_resolved';

    // completed: long thread (>=5 messages) with agent engagement signals data was collected
    if (outbound.length > 0 && this.conversations.length >= 5) return 'completed';

    // awaiting_agent: inbound exists but no outbound at all
    if (inbound.length > 0 && outbound.length === 0) return 'awaiting_agent';

    // unresponsive: last inbound > 48h ago, agent has since replied, ticket Open
    if (outbound.length > 0 && inbound.length > 0) {
      const lastInbound = inbound[inbound.length - 1];
      const lastOutbound = outbound[outbound.length - 1];
      const lastInboundMs = new Date(lastInbound.timestamp).getTime();
      const lastOutboundMs = new Date(lastOutbound.timestamp).getTime();
      const ageMs = Date.now() - lastInboundMs;
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
      if (ageMs > FORTY_EIGHT_HOURS && lastOutboundMs >= lastInboundMs) {
        return 'unresponsive';
      }
    }

    // awaiting_details: agent has asked for specific data fields but conversation is short
    const hasDataCollectionPrompt = outbound.some((c) =>
      /full name|your name|location|address|where do you live|email|phone number/i.test(
        c.content || ''
      )
    );
    if (inbound.length > 0 && hasDataCollectionPrompt) return 'awaiting_details';

    // in_progress: agent has engaged, ticket open, no negative signals
    if (outbound.length > 0 && inbound.length > 0) return 'in_progress';

    return 'awaiting_agent';
  }
}

// =============================================================================
// CAMPAIGN ZOHO DESK SERVICE
// =============================================================================

interface ZohoTicketListResponse {
  data: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    assignee?: { name: string; email?: string } | null;
    contact?: { name: string; email?: string; phone?: string } | null;
    createdTime: string;
    closedTime?: string | null;
    tags?: string[];
  }>;
  count?: number;
}

interface ZohoConversationResponse {
  data: Array<{
    id: string;
    author?: { name: string };
    type?: string;
    direction?: string;
    content: string;
    createdTime: string;
    channel?: string;
  }>;
}

export class CampaignZohoDeskService {
  private auth = createZohoAuthService();
  private baseUrl: string;
  private orgId: string;

  constructor() {
    const region = process.env.ZOHO_REGION || 'US';
    const regionSuffix = ({ US: '', EU: '.eu', IN: '.in', AU: '.com.au', CN: '.com.cn' } as Record<string, string>)[region] ?? '';
    this.baseUrl = `https://desk.zoho${regionSuffix}.com/api/v1`;
    this.orgId = process.env.ZOHO_DESK_ORG_ID || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const accessToken = await this.auth.getAccessToken();
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
          'orgId': this.orgId,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        zohoLogger.error('[CampaignDesk] API error', { status: response.status, error: errorText });
        return { success: false, error: `${response.status} ${response.statusText}` };
      }

      const data: T = await response.json();
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      zohoLogger.error('[CampaignDesk] Request failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Fetch ALL tickets tagged "whatsapp lead", paginated.
   */
  async fetchAllCampaignTickets(): Promise<CampaignTicket[]> {
    const tickets: CampaignTicket[] = [];
    let from = 0;
    const limit = 100;

    while (true) {
      const result = await this.makeRequest<ZohoTicketListResponse>(
        `/tickets?tags=whatsapp+lead&limit=${limit}&from=${from}&fields=id,ticketNumber,subject,status,assignee,contact,createdTime,closedTime,tags`
      );

      if (!result.success || !result.data?.data) break;

      const batch = result.data.data;
      if (batch.length === 0) break;

      for (const t of batch) {
        tickets.push({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject || '',
          status: t.status || 'Open',
          assigneeName: t.assignee?.name ?? null,
          contactName: t.contact?.name ?? null,
          contactPhone: t.contact?.phone ?? null,
          contactEmail: t.contact?.email ?? null,
          createdTime: t.createdTime,
          closedTime: t.closedTime ?? null,
          tags: t.tags ?? [],
        });
      }

      if (batch.length < limit) break;
      from += limit;
    }

    zohoLogger.debug(`[CampaignDesk] Fetched ${tickets.length} tagged tickets`);
    return tickets;
  }

  /**
   * Fetch conversations for a single ticket.
   */
  async fetchConversations(ticketId: string): Promise<CampaignConversation[]> {
    const result = await this.makeRequest<ZohoConversationResponse>(
      `/tickets/${ticketId}/conversations`
    );

    if (!result.success || !result.data?.data) return [];

    return result.data.data.map((c) => ({
      id: c.id,
      author: c.author?.name ?? 'Unknown',
      direction: (c.direction?.toLowerCase() === 'out' ? 'out' : 'in') as 'in' | 'out',
      content: c.content || '',
      timestamp: c.createdTime,
      channel: (c.channel || 'whatsapp').toLowerCase(),
    }));
  }

  /**
   * Search tickets by subject keyword (for backfill use).
   */
  async searchTicketsBySubject(searchStr: string): Promise<CampaignTicket[]> {
    const result = await this.makeRequest<ZohoTicketListResponse>(
      `/tickets/search?searchStr=${encodeURIComponent(searchStr)}&limit=100`
    );

    if (!result.success || !result.data?.data) return [];

    return result.data.data.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject || '',
      status: t.status || 'Open',
      assigneeName: t.assignee?.name ?? null,
      contactName: t.contact?.name ?? null,
      contactPhone: t.contact?.phone ?? null,
      contactEmail: t.contact?.email ?? null,
      createdTime: t.createdTime,
      closedTime: t.closedTime ?? null,
      tags: t.tags ?? [],
    }));
  }

  /**
   * Add "whatsapp lead" tag to a ticket (merges with existing tags).
   */
  async addCampaignTag(ticketId: string, existingTags: string[]): Promise<boolean> {
    const updatedTags = Array.from(new Set([...existingTags, 'whatsapp lead']));
    const result = await this.makeRequest(
      `/tickets/${ticketId}`,
      'PATCH',
      { tags: updatedTags }
    );
    return result.success;
  }
}

export function createCampaignZohoDeskService(): CampaignZohoDeskService {
  return new CampaignZohoDeskService();
}
