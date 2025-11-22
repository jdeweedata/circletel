/**
 * ZOHO Desk Service
 * Customer support ticket management integration
 *
 * Features:
 * - Create support tickets
 * - List customer tickets
 * - Get ticket details with comments
 * - Update ticket status
 * - Add ticket comments
 *
 * API Documentation: https://desk.zoho.com/DeskAPIDocument
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ZohoDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'Open' | 'On Hold' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  subCategory?: string;
  createdTime: string;
  modifiedTime: string;
  customerEmail: string;
  customerName: string;
  departmentId?: string;
  assigneeId?: string;
  commentCount?: number;
}

export interface ZohoDeskComment {
  id: string;
  content: string;
  contentType: 'plainText' | 'html';
  isPublic: boolean;
  createdTime: string;
  authorName: string;
  authorEmail?: string;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  subCategory?: string;
  departmentId?: string;
  phone?: string;
}

export interface ZohoDeskConfig {
  orgId: string;
  accessToken: string;
  region?: 'US' | 'EU' | 'IN' | 'AU' | 'CN';
}

// =============================================================================
// ZOHO DESK SERVICE
// =============================================================================

export class ZohoDeskService {
  private config: ZohoDeskConfig;
  private baseUrl: string;

  constructor(config: ZohoDeskConfig) {
    this.config = {
      region: 'US',
      ...config,
    };
    this.baseUrl = this.getBaseUrl();
  }

  private getBaseUrl(): string {
    const regionMap = {
      US: '',
      EU: '.eu',
      IN: '.in',
      AU: '.com.au',
      CN: '.com.cn',
    };

    const region = regionMap[this.config.region || 'US'];
    return `https://desk.zoho${region}.com/api/v1`;
  }

  private async makeRequest<T = unknown>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers: Record<string, string> = {
        'Authorization': `Zoho-oauthtoken ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'orgId': this.config.orgId,
      };

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ZOHO Desk] API error ${response.status}:`, errorText);
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      const responseData = await response.json();

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('[ZOHO Desk] Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a new support ticket
   */
  async createTicket(input: CreateTicketInput): Promise<{
    success: boolean;
    ticket?: ZohoDeskTicket;
    error?: string;
  }> {
    const ticketData = {
      subject: input.subject,
      description: input.description,
      email: input.customerEmail,
      contactName: input.customerName || input.customerEmail.split('@')[0],
      priority: input.priority || 'Medium',
      status: 'Open',
      category: input.category,
      subCategory: input.subCategory,
      departmentId: input.departmentId,
      phone: input.phone,
    };

    const result = await this.makeRequest<ZohoDeskTicket>('/tickets', 'POST', ticketData);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create ticket',
      };
    }

    return {
      success: true,
      ticket: result.data,
    };
  }

  /**
   * List tickets for a specific customer email
   */
  async listCustomerTickets(email: string, limit = 50): Promise<{
    success: boolean;
    tickets?: ZohoDeskTicket[];
    error?: string;
  }> {
    // Search tickets by customer email
    const searchQuery = encodeURIComponent(`email:${email}`);
    const endpoint = `/tickets/search?limit=${limit}&searchStr=${searchQuery}`;

    const result = await this.makeRequest<{ data: ZohoDeskTicket[] }>(endpoint);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch tickets',
      };
    }

    return {
      success: true,
      tickets: result.data?.data || [],
    };
  }

  /**
   * Get ticket details including comments
   */
  async getTicketDetails(ticketId: string): Promise<{
    success: boolean;
    ticket?: ZohoDeskTicket;
    comments?: ZohoDeskComment[];
    error?: string;
  }> {
    // Get ticket details
    const ticketResult = await this.makeRequest<ZohoDeskTicket>(`/tickets/${ticketId}`);

    if (!ticketResult.success) {
      return {
        success: false,
        error: ticketResult.error || 'Failed to fetch ticket',
      };
    }

    // Get ticket comments
    const commentsResult = await this.makeRequest<{ data: ZohoDeskComment[] }>(
      `/tickets/${ticketId}/comments`
    );

    return {
      success: true,
      ticket: ticketResult.data,
      comments: commentsResult.data?.data || [],
    };
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: 'Open' | 'On Hold' | 'Escalated' | 'Closed'
  ): Promise<{
    success: boolean;
    ticket?: ZohoDeskTicket;
    error?: string;
  }> {
    const result = await this.makeRequest<ZohoDeskTicket>(
      `/tickets/${ticketId}`,
      'PATCH',
      { status }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update ticket',
      };
    }

    return {
      success: true,
      ticket: result.data,
    };
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(
    ticketId: string,
    content: string,
    isPublic = true
  ): Promise<{
    success: boolean;
    comment?: ZohoDeskComment;
    error?: string;
  }> {
    const commentData = {
      content,
      contentType: 'plainText',
      isPublic,
    };

    const result = await this.makeRequest<ZohoDeskComment>(
      `/tickets/${ticketId}/comments`,
      'POST',
      commentData
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to add comment',
      };
    }

    return {
      success: true,
      comment: result.data,
    };
  }

  /**
   * Get available ticket categories
   */
  async getCategories(departmentId?: string): Promise<{
    success: boolean;
    categories?: Array<{ id: string; name: string }>;
    error?: string;
  }> {
    const endpoint = departmentId
      ? `/departments/${departmentId}/categories`
      : '/categories';

    const result = await this.makeRequest<{ data: Array<{ id: string; name: string }> }>(
      endpoint
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch categories',
      };
    }

    return {
      success: true,
      categories: result.data?.data || [],
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create ZOHO Desk service instance with environment config
 */
export function createZohoDeskService(): ZohoDeskService {
  const orgId = process.env.ZOHO_DESK_ORG_ID;
  const accessToken = process.env.ZOHO_ACCESS_TOKEN || process.env.ZOHO_DESK_ACCESS_TOKEN;

  if (!orgId || !accessToken) {
    throw new Error(
      'Missing ZOHO Desk configuration. Required: ZOHO_DESK_ORG_ID and ZOHO_ACCESS_TOKEN'
    );
  }

  return new ZohoDeskService({
    orgId,
    accessToken,
    region: (process.env.ZOHO_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') || 'US',
  });
}

/**
 * Example usage:
 *
 * ```typescript
 * import { createZohoDeskService } from '@/lib/integrations/zoho/desk-service';
 *
 * const deskService = createZohoDeskService();
 *
 * // Create ticket
 * const { ticket } = await deskService.createTicket({
 *   subject: 'Internet connection issue',
 *   description: 'My internet keeps dropping every few minutes',
 *   customerEmail: 'customer@example.com',
 *   priority: 'High',
 *   category: 'Technical Support'
 * });
 *
 * // List customer tickets
 * const { tickets } = await deskService.listCustomerTickets('customer@example.com');
 *
 * // Get ticket details
 * const { ticket, comments } = await deskService.getTicketDetails('12345');
 *
 * // Add comment
 * await deskService.addComment('12345', 'I will investigate this issue', true);
 * ```
 */
