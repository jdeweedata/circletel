/**
 * Zoho Books API Client
 *
 * Handles all Zoho Books API interactions for Contacts, Invoices, Payments
 * Used for accounting/financial reporting (NOT subscription billing)
 *
 * Key difference from Zoho Billing:
 * - CircleTel is the billing system (Supabase generates invoices)
 * - Zoho Books is for accounting only (AR aging, tax compliance, reporting)
 *
 * API Base: https://www.zohoapis.com/books/v3
 *
 * @see docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md
 */

import { ZohoAPIClient } from '@/lib/zoho-api-client';
import rateLimiter from './rate-limiter';
import { zohoLogger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

export interface ZohoBooksContact {
  contact_id: string;
  contact_name: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contact_type: 'customer' | 'vendor';
  status: 'active' | 'inactive';
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  custom_fields?: Array<{
    customfield_id?: string;
    label: string;
    value: string;
  }>;
  created_time?: string;
  last_modified_time?: string;
}

export interface ZohoBooksInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'void' | 'partially_paid';
  total: number;
  balance: number;
  line_items: Array<{
    item_id?: string;
    name: string;
    description?: string;
    rate: number;
    quantity: number;
    amount: number;
  }>;
  notes?: string;
  terms?: string;
  custom_fields?: Array<{
    customfield_id?: string;
    label: string;
    value: string;
  }>;
  created_time?: string;
  last_modified_time?: string;
}

export interface ZohoBooksPayment {
  payment_id: string;
  payment_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  amount: number;
  payment_mode: string;
  reference_number?: string;
  description?: string;
  invoices?: Array<{
    invoice_id: string;
    invoice_number: string;
    amount_applied: number;
  }>;
  created_time?: string;
}

export interface ZohoBooksError {
  code: number;
  message: string;
}

// ============================================================================
// Client
// ============================================================================

export class ZohoBooksClient extends ZohoAPIClient {
  private readonly organizationId: string;

  constructor() {
    super({
      clientId: process.env.ZOHO_CLIENT_ID!,
      clientSecret: process.env.ZOHO_CLIENT_SECRET!,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN!,
      region: (process.env.ZOHO_REGION as any) || 'US',
    });

    // Zoho Books uses its own org ID (may differ from Billing org ID)
    this.organizationId = process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORG_ID || '';

    if (!this.organizationId) {
      zohoLogger.warn('[ZohoBooksClient] ZOHO_BOOKS_ORGANIZATION_ID not configured');
    }
  }

  /**
   * Get Zoho Books API base URL
   * Books API v3 uses zohoapis.com domain
   */
  private getBooksBaseUrl(): string {
    const regionMap: Record<string, string> = {
      US: 'https://www.zohoapis.com/books/v3',
      EU: 'https://www.zohoapis.eu/books/v3',
      IN: 'https://www.zohoapis.in/books/v3',
      AU: 'https://www.zohoapis.com.au/books/v3',
      CN: 'https://www.zohoapis.com.cn/books/v3',
    };

    const region = this.config.region || 'US';
    return regionMap[region] || regionMap.US;
  }

  /**
   * Build full URL with organization ID
   */
  private buildUrl(endpoint: string, additionalParams?: Record<string, string>): string {
    const baseUrl = this.getBooksBaseUrl();
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      ...additionalParams,
    });
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${baseUrl}${endpoint}${separator}${params.toString()}`;
  }

  /**
   * Generic API request handler with error handling and rate limiting
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    // Apply rate limiting (use billing quota for Books API)
    await rateLimiter.waitForSlot('billing');

    const accessToken = await this.getAccessToken();
    const url = this.buildUrl(endpoint, queryParams);

    const headers: Record<string, string> = {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    zohoLogger.debug(`[ZohoBooksClient] ${method} ${endpoint}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const error = data as ZohoBooksError;
      zohoLogger.error('[ZohoBooksClient] API Error', {
        status: response.status,
        code: error.code,
        message: error.message,
      });

      // Check for OAuth errors (require human intervention)
      if (response.status === 401 || error.code === 57) {
        throw new Error(`OAUTH_ERROR: ${error.message}`);
      }

      throw new Error(`Zoho Books API error: ${error.message} (${error.code})`);
    }

    return data as T;
  }

  // ============================================================================
  // Contacts API (Customers)
  // ============================================================================

  /**
   * Search for a contact by email
   */
  async searchContacts(email: string): Promise<ZohoBooksContact | null> {
    try {
      const response = await this.request<any>(
        `/contacts?email=${encodeURIComponent(email)}`
      );

      if (response.contacts && response.contacts.length > 0) {
        return response.contacts[0];
      }

      return null;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error searching contacts', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get a contact by ID
   */
  async getContact(contactId: string): Promise<ZohoBooksContact> {
    try {
      const response = await this.request<any>(`/contacts/${contactId}`);

      if (!response.contact) {
        throw new Error('Contact not found');
      }

      return response.contact;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error getting contact', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new Books contact
   * Note: Named differently from base class createContact to avoid type conflict
   */
  async createContact_(payload: Partial<ZohoBooksContact>): Promise<string> {
    try {
      zohoLogger.debug('[ZohoBooksClient] Creating contact:', {
        email: payload.email,
        contact_name: payload.contact_name,
      });

      const response = await this.request<any>('/contacts', 'POST', payload);

      if (!response.contact?.contact_id) {
        throw new Error('Failed to create contact - no contact_id returned');
      }

      zohoLogger.debug('[ZohoBooksClient] Contact created', {
        contactId: response.contact.contact_id,
      });
      return response.contact.contact_id;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error creating contact', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update an existing Books contact
   */
  async updateContact_(
    contactId: string,
    payload: Partial<ZohoBooksContact>
  ): Promise<void> {
    try {
      zohoLogger.debug('[ZohoBooksClient] Updating contact', { contactId });

      await this.request<any>(`/contacts/${contactId}`, 'PUT', payload);

      zohoLogger.debug('[ZohoBooksClient] Contact updated successfully');
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error updating contact', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create or update a contact based on email
   */
  async upsertContact(
    email: string,
    payload: Partial<ZohoBooksContact>
  ): Promise<string> {
    try {
      const existingContact = await this.searchContacts(email);

      if (existingContact) {
        zohoLogger.debug('[ZohoBooksClient] Contact exists, updating', {
          contactId: existingContact.contact_id,
        });
        await this.updateContact_(existingContact.contact_id, payload);
        return existingContact.contact_id;
      } else {
        zohoLogger.debug('[ZohoBooksClient] Contact does not exist, creating new');
        return await this.createContact_(payload);
      }
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error upserting contact', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================================================
  // Invoices API
  // ============================================================================

  /**
   * Get an invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<ZohoBooksInvoice> {
    try {
      const response = await this.request<any>(`/invoices/${invoiceId}`);

      if (!response.invoice) {
        throw new Error('Invoice not found');
      }

      return response.invoice;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error getting invoice', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Search for an invoice by number
   */
  async searchInvoiceByNumber(invoiceNumber: string): Promise<ZohoBooksInvoice | null> {
    try {
      const response = await this.request<any>(
        `/invoices?invoice_number=${encodeURIComponent(invoiceNumber)}`
      );

      if (response.invoices && response.invoices.length > 0) {
        return response.invoices[0];
      }

      return null;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error searching invoice', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new invoice
   *
   * Key: Uses ignore_auto_number_generation=true to preserve CircleTel invoice numbers
   */
  async createInvoice(payload: {
    customer_id: string;
    invoice_number?: string;
    date?: string;
    due_date?: string;
    payment_terms?: number;
    payment_terms_label?: string;
    line_items: Array<{
      item_id?: string;
      name: string;
      description?: string;
      rate: number;
      quantity: number;
    }>;
    notes?: string;
    terms?: string;
    custom_fields?: Array<{ label: string; value: string }>;
  }): Promise<ZohoBooksInvoice> {
    try {
      const itemCount = payload.line_items?.length || 0;
      zohoLogger.debug('[ZohoBooksClient] Creating invoice:', {
        customer_id: payload.customer_id,
        invoice_number: payload.invoice_number,
        items: itemCount,
      });

      // Use ignore_auto_number_generation to preserve our invoice number
      const queryParams = payload.invoice_number
        ? { ignore_auto_number_generation: 'true' }
        : undefined;

      const response = await this.request<any>(
        '/invoices',
        'POST',
        payload,
        queryParams
      );

      if (!response.invoice) {
        throw new Error('Failed to create invoice');
      }

      zohoLogger.debug('[ZohoBooksClient] Invoice created successfully:', {
        invoice_id: response.invoice.invoice_id,
        invoice_number: response.invoice.invoice_number,
        total: response.invoice.total,
      });

      return response.invoice;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error creating invoice', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark an invoice as sent (changes status from draft to sent)
   */
  async markInvoiceAsSent(invoiceId: string): Promise<void> {
    try {
      zohoLogger.debug('[ZohoBooksClient] Marking invoice as sent', { invoiceId });

      await this.request<any>(`/invoices/${invoiceId}/status/sent`, 'POST');

      zohoLogger.debug('[ZohoBooksClient] Invoice marked as sent');
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error marking invoice as sent', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Void an invoice
   */
  async voidInvoice(invoiceId: string): Promise<void> {
    try {
      zohoLogger.debug('[ZohoBooksClient] Voiding invoice', { invoiceId });

      await this.request<any>(`/invoices/${invoiceId}/status/void`, 'POST');

      zohoLogger.debug('[ZohoBooksClient] Invoice voided');
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error voiding invoice', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================================================
  // Payments API (Customer Payments)
  // ============================================================================

  /**
   * Record a customer payment
   */
  async recordPayment(payload: {
    customer_id: string;
    payment_mode: string;
    amount: number;
    date?: string;
    reference_number?: string;
    description?: string;
    invoices?: Array<{
      invoice_id: string;
      amount_applied: number;
    }>;
  }): Promise<ZohoBooksPayment> {
    try {
      zohoLogger.debug('[ZohoBooksClient] Recording payment:', {
        customer_id: payload.customer_id,
        amount: payload.amount,
        payment_mode: payload.payment_mode,
        invoices: payload.invoices?.length || 0,
      });

      const response = await this.request<any>(
        '/customerpayments',
        'POST',
        payload
      );

      if (!response.payment) {
        throw new Error('Failed to record payment');
      }

      zohoLogger.debug('[ZohoBooksClient] Payment recorded:', {
        payment_id: response.payment.payment_id,
        payment_number: response.payment.payment_number,
        amount: response.payment.amount,
      });

      return response.payment;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error recording payment', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get a payment by ID
   */
  async getPayment(paymentId: string): Promise<ZohoBooksPayment> {
    try {
      const response = await this.request<any>(`/customerpayments/${paymentId}`);

      if (!response.payment) {
        throw new Error('Payment not found');
      }

      return response.payment;
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error getting payment', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      zohoLogger.debug('[ZohoBooksClient] Deleting payment', { paymentId });

      await this.request<any>(`/customerpayments/${paymentId}`, 'DELETE');

      zohoLogger.debug('[ZohoBooksClient] Payment deleted successfully');
    } catch (error) {
      zohoLogger.error('[ZohoBooksClient] Error deleting payment', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================================================
  // Organization API
  // ============================================================================

  /**
   * Test connection by fetching organization info
   */
  async testConnection(): Promise<{ success: boolean; org_name?: string; error?: string }> {
    try {
      const response = await this.request<any>('/organizations');

      if (response.organizations && response.organizations.length > 0) {
        const org = response.organizations.find(
          (o: any) => o.organization_id === this.organizationId
        ) || response.organizations[0];

        return {
          success: true,
          org_name: org.name,
        };
      }

      return {
        success: false,
        error: 'No organizations found',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Singleton instance
let booksClientInstance: ZohoBooksClient | null = null;

export function getZohoBooksClient(): ZohoBooksClient {
  if (!booksClientInstance) {
    booksClientInstance = new ZohoBooksClient();
  }
  return booksClientInstance;
}
