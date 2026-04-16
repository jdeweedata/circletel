/**
 * Zoho Desk Campaign Service
 *
 * Campaign-specific Zoho Desk queries and ConversationIntelligence for the
 * WhatsApp Lead Campaign daily report pipeline.
 */

import { createZohoDeskAuthService } from './auth-service';
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

interface ZohoThreadListResponse {
  data: Array<{
    id: string;
    direction: string;
    createdTime: string;
    channel?: string;
    author?: { name: string; type?: string } | null;
    channelRelatedInfo?: { messages?: string } | null;
  }>;
}

interface ZohoThreadMessagesResponse {
  data: Array<{
    id: string;
    type: string;          // 'TEXT' | 'LAYOUT' | 'LOCATION' | etc.
    direction: string;     // 'IN' | 'OUT'
    summary: string | null; // actual message text
    createdTime: string;
    author?: { name: string } | null;
  }>;
}

export class CampaignZohoDeskService {
  private auth = createZohoDeskAuthService();
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

      const headers: Record<string, string> = {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      };
      if (this.orgId) headers['orgId'] = this.orgId;

      const response = await fetch(url, {
        method,
        headers,
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

  /** Map a raw Zoho ticket object to CampaignTicket. */
  private mapTicket(t: ZohoTicketListResponse['data'][number]): CampaignTicket {
    return {
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
    };
  }

  /**
   * Subject patterns that identify WhatsApp campaign tickets.
   * The Zoho Desk search endpoint requires Desk.search.READ scope which our token
   * does not have. Instead we paginate GET /tickets and filter client-side.
   *
   * Actual subject patterns observed in Zoho Desk:
   *   "https://fb.me/<hash>\n\nHello! Can I get more info on this?"
   *   "https://lnk.ms/<hash>\n\nHello! Can I get more info on this?"
   *   "Hello! Can I get more info on this?"
   *   "I want to know more"
   *   "interested"
   */
  private static readonly CAMPAIGN_SUBJECT_PATTERNS = [
    'fb.me/',
    'lnk.ms/',
    'Hello! Can I get more info on this?',
    'I want to know more',
    'interested',
  ];

  /** Return true if the subject looks like a WhatsApp campaign enquiry. */
  private isCampaignTicket(subject: string): boolean {
    if (!subject) return false;
    const lower = subject.toLowerCase();
    return CampaignZohoDeskService.CAMPAIGN_SUBJECT_PATTERNS.some((p) =>
      lower.includes(p.toLowerCase())
    );
  }

  /**
   * Fetch ALL WhatsApp campaign tickets by paginating GET /tickets and filtering
   * by subject patterns client-side.
   *
   * Why not /tickets/search? Zoho Desk search endpoint requires Desk.search.READ
   * scope which the current OAuth token does not include. GET /tickets works with
   * Desk.tickets.READ alone.
   *
   * Pagination stops when either:
   *  - A page returns fewer tickets than the page size (last page), or
   *  - We have fetched MAX_PAGES pages (safety cap at ~1,000 tickets).
   */
  async fetchAllCampaignTickets(): Promise<CampaignTicket[]> {
    const PAGE_SIZE = 50;
    const MAX_PAGES = 20; // safety cap — 1,000 tickets max
    const seen = new Set<string>();
    const tickets: CampaignTicket[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const result = await this.makeRequest<ZohoTicketListResponse>(
        `/tickets?limit=${PAGE_SIZE}&from=${from}`
      );

      if (!result.success || !result.data?.data) break;

      const batch = result.data.data;

      for (const t of batch) {
        if (seen.has(t.id)) continue;
        if (!this.isCampaignTicket(t.subject)) continue;
        seen.add(t.id);
        tickets.push(this.mapTicket(t));
      }

      // Stop if we got a partial page — no more tickets exist
      if (batch.length < PAGE_SIZE) break;
    }

    zohoLogger.debug(`[CampaignDesk] Fetched ${tickets.length} campaign tickets via paginated list`);
    return tickets;
  }

  /**
   * Fetch the real tag names for a single ticket.
   * The search/list endpoints do not return tag data; this endpoint does.
   *
   * NOTE: Response format is `{ tags: [...] }` (NOT `{ data: [...] }` like other endpoints).
   */
  async fetchTicketTags(ticketId: string): Promise<string[]> {
    interface TagsResponse { tags: Array<{ name: string }> }
    const result = await this.makeRequest<TagsResponse>(`/tickets/${ticketId}/tags`);
    if (!result.success || !result.data?.tags) return [];
    return result.data.tags.map((tag) => tag.name);
  }

  /**
   * Fetch conversations for a single ticket.
   */
  async fetchConversations(ticketId: string): Promise<CampaignConversation[]> {
    // Step 1: fetch the thread list for this ticket
    const threadsResult = await this.makeRequest<ZohoThreadListResponse>(
      `/tickets/${ticketId}/conversations`
    );
    if (!threadsResult.success || !threadsResult.data?.data) return [];

    const conversations: CampaignConversation[] = [];

    // Step 2: for each thread, fetch the nested messages endpoint to get actual text
    for (const thread of threadsResult.data.data) {
      const messagesUrl = thread.channelRelatedInfo?.messages;
      if (!messagesUrl) continue;

      // Strip the base URL — makeRequest prepends it
      const path = messagesUrl.replace(this.baseUrl, '');
      const msgResult = await this.makeRequest<ZohoThreadMessagesResponse>(path);
      if (!msgResult.success || !msgResult.data?.data) continue;

      // Only include messages that have readable text (summary field)
      for (const m of msgResult.data.data) {
        if (!m.summary) continue;
        conversations.push({
          id: m.id,
          author: m.author?.name ?? thread.author?.name ?? 'Unknown',
          direction: (m.direction?.toUpperCase() === 'OUT' ? 'out' : 'in') as 'in' | 'out',
          content: m.summary,
          timestamp: m.createdTime,
          channel: (thread.channel || 'whatsapp').toLowerCase(),
        });
      }
    }

    // Return in chronological order
    return conversations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Search tickets by subject keyword by paginating GET /tickets and filtering
   * client-side (Desk.search.READ scope not available on current token).
   *
   * NOTE: Tag data is not returned here. Use fetchTicketTags() per ticket if needed.
   */
  async searchTicketsBySubject(searchStr: string): Promise<CampaignTicket[]> {
    const PAGE_SIZE = 50;
    const MAX_PAGES = 20;
    const lower = searchStr.toLowerCase();
    const results: CampaignTicket[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const result = await this.makeRequest<ZohoTicketListResponse>(
        `/tickets?limit=${PAGE_SIZE}&from=${from}`
      );

      if (!result.success || !result.data?.data) break;

      const batch = result.data.data;
      for (const t of batch) {
        if ((t.subject || '').toLowerCase().includes(lower)) {
          results.push(this.mapTicket(t));
        }
      }

      if (batch.length < PAGE_SIZE) break;
    }

    return results;
  }

  /**
   * Fetch the N most recent tickets from Zoho Desk without subject filtering.
   * Used by the diagnostic endpoint to identify real subject patterns.
   */
  async fetchRecentTickets(limit = 10): Promise<Array<{ id: string; subject: string; status: string; createdTime: string }>> {
    const result = await this.makeRequest<ZohoTicketListResponse>(
      `/tickets?limit=${limit}`
    );
    if (!result.success || !result.data?.data) return [];
    return result.data.data.map((t) => ({
      id: t.id,
      subject: t.subject ?? '(no subject)',
      status: t.status,
      createdTime: t.createdTime,
    }));
  }

  /**
   * Test raw API connectivity — returns the actual HTTP error if the call fails.
   * Used by the diagnostic endpoint to distinguish auth scope failures from empty results.
   */
  async testApiConnectivity(): Promise<{ success: boolean; ticketCount?: number; error?: string }> {
    const result = await this.makeRequest<ZohoTicketListResponse>('/tickets?limit=1');
    if (!result.success) return { success: false, error: result.error };
    return { success: true, ticketCount: result.data?.data?.length ?? 0 };
  }

  /**
   * Add "whatsapp lead" tag to a ticket.
   *
   * IMPORTANT: Zoho Desk v1 REST API does not support writing tags to tickets.
   * GET /tickets/{id}/tags — Allow: GET, OPTIONS only (POST → 405)
   * PATCH /tickets/{id} with tags/tagIds → 422 UNPROCESSABLE_ENTITY
   *
   * Workaround: PATCH the ticket's cf_ticket_type custom field to record
   * campaign origin. Returns true on success, false if the API rejects the value.
   */
  async addCampaignTag(ticketId: string): Promise<boolean> {
    const result = await this.makeRequest(
      `/tickets/${ticketId}`,
      'PATCH',
      { cf: { cf_ticket_type: 'WhatsApp Campaign' } }
    );
    if (!result.success) {
      zohoLogger.warn(
        '[CampaignDesk] addCampaignTag: Zoho Desk v1 REST API cannot write tags. ' +
        'Custom field PATCH also failed. Ticket must be tagged manually in Zoho Desk UI.',
        { ticketId }
      );
    }
    return result.success;
  }
}

export function createCampaignZohoDeskService(): CampaignZohoDeskService {
  return new CampaignZohoDeskService();
}
