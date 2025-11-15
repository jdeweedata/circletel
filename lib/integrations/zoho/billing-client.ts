/**
 * Zoho Billing API Client
 *
 * Handles all Zoho Billing API interactions for Plans, Items, Subscriptions
 * Extends ZohoApiClient to reuse OAuth token management
 *
 * Epic 3.2 - Zoho Billing Integration
 */

import { ZohoAPIClient } from '@/lib/zoho-api-client';
import type {
  ZohoBillingPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
  ZohoBillingItem,
  CreateItemPayload,
  UpdateItemPayload,
  ZohoBillingSubscription,
  CreateSubscriptionPayload,
  ZohoBillingInvoice,
  ZohoBillingApiResponse,
  ZohoBillingListResponse,
  ZohoBillingError,
} from './billing-types';

export class ZohoBillingClient extends ZohoAPIClient {
  private readonly organizationId: string;

  constructor() {
    super({
      clientId: process.env.ZOHO_CLIENT_ID!,
      clientSecret: process.env.ZOHO_CLIENT_SECRET!,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN!,
      region: (process.env.ZOHO_REGION as any) || 'US',
    });

    this.organizationId = process.env.ZOHO_ORG_ID || '';

    if (!this.organizationId) {
      console.warn('[ZohoBillingClient] ZOHO_ORG_ID not configured');
    }
  }

  /**
   * Get Zoho Billing API base URL
   * Different from CRM API base URL
   */
  protected getBillingBaseUrl(): string {
    const regionMap: Record<string, string> = {
      US: 'https://billing.zoho.com/api/v1',
      EU: 'https://billing.zoho.eu/api/v1',
      IN: 'https://billing.zoho.in/api/v1',
      AU: 'https://billing.zoho.com.au/api/v1',
      CN: 'https://billing.zoho.com.cn/api/v1',
    };

    const region = this.config.region || 'US';
    return regionMap[region] || regionMap.US;
  }

  /**
   * Build full URL with organization ID
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = this.getBillingBaseUrl();
    return `${baseUrl}${endpoint}?organization_id=${this.organizationId}`;
  }

  /**
   * Generic API request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    const url = this.buildUrl(endpoint);

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

    console.log(`[ZohoBillingClient] ${method} ${endpoint}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const error = data as ZohoBillingError;
      console.error('[ZohoBillingClient] API Error:', {
        status: response.status,
        code: error.code,
        message: error.message,
        errors: error.errors,
      });

      throw new Error(`Zoho Billing API error: ${error.message} (${error.code})`);
    }

    return data as T;
  }

  // ============================================================================
  // Plans API
  // ============================================================================

  /**
   * Search for a plan by plan_code
   */
  async searchPlans(planCode: string): Promise<ZohoBillingPlan | null> {
    try {
      const response = await this.request<ZohoBillingListResponse<ZohoBillingPlan>>(
        `/plans?plan_code=${encodeURIComponent(planCode)}`
      );

      if (response.data?.plans && response.data.plans.length > 0) {
        return response.data.plans[0];
      }

      return null;
    } catch (error) {
      console.error('[ZohoBillingClient] Error searching plans:', error);
      throw error;
    }
  }

  /**
   * Get a plan by ID
   */
  async getPlan(planId: string): Promise<ZohoBillingPlan> {
    try {
      const response = await this.request<ZohoBillingApiResponse<ZohoBillingPlan>>(
        `/plans/${planId}`
      );

      if (!response.data) {
        throw new Error('Plan not found');
      }

      return response.data;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting plan:', error);
      throw error;
    }
  }

  /**
   * Create a new plan
   */
  async createPlan(payload: CreatePlanPayload): Promise<string> {
    try {
      // Default to ZAR currency
      const planData = {
        ...payload,
        currency_code: payload.currency_code || 'ZAR',
      };

      console.log('[ZohoBillingClient] Creating plan:', {
        plan_code: planData.plan_code,
        recurring_price: planData.recurring_price,
      });

      const response = await this.request<ZohoBillingApiResponse<ZohoBillingPlan>>(
        '/plans',
        'POST',
        planData
      );

      if (!response.data?.plan_id) {
        throw new Error('Failed to create plan - no plan_id returned');
      }

      console.log('[ZohoBillingClient] Plan created:', response.data.plan_id);
      return response.data.plan_id;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating plan:', error);
      throw error;
    }
  }

  /**
   * Update an existing plan
   */
  async updatePlan(planId: string, payload: UpdatePlanPayload): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Updating plan:', planId);

      await this.request<ZohoBillingApiResponse<ZohoBillingPlan>>(
        `/plans/${planId}`,
        'PUT',
        payload
      );

      console.log('[ZohoBillingClient] Plan updated successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error updating plan:', error);
      throw error;
    }
  }

  /**
   * Mark a plan as inactive (soft delete)
   */
  async inactivatePlan(planId: string): Promise<void> {
    try {
      await this.updatePlan(planId, { status: 'inactive' });
    } catch (error) {
      console.error('[ZohoBillingClient] Error inactivating plan:', error);
      throw error;
    }
  }

  /**
   * Upsert plan - create if doesn't exist, update if exists
   */
  async upsertPlan(planCode: string, payload: CreatePlanPayload): Promise<string> {
    try {
      const existingPlan = await this.searchPlans(planCode);

      if (existingPlan) {
        console.log('[ZohoBillingClient] Plan exists, updating:', existingPlan.plan_id);

        // Extract updateable fields
        const updatePayload: UpdatePlanPayload = {
          name: payload.name,
          description: payload.description,
          recurring_price: payload.recurring_price,
          setup_fee: payload.setup_fee,
          status: payload.status,
          custom_fields: payload.custom_fields,
        };

        await this.updatePlan(existingPlan.plan_id, updatePayload);
        return existingPlan.plan_id;
      } else {
        console.log('[ZohoBillingClient] Plan does not exist, creating new');
        return await this.createPlan(payload);
      }
    } catch (error) {
      console.error('[ZohoBillingClient] Error upserting plan:', error);
      throw error;
    }
  }

  // ============================================================================
  // Items API
  // ============================================================================

  /**
   * Search for an item by SKU
   */
  async searchItems(sku: string): Promise<ZohoBillingItem | null> {
    try {
      const response = await this.request<ZohoBillingListResponse<ZohoBillingItem>>(
        `/items?sku=${encodeURIComponent(sku)}`
      );

      if (response.data?.items && response.data.items.length > 0) {
        return response.data.items[0];
      }

      return null;
    } catch (error) {
      console.error('[ZohoBillingClient] Error searching items:', error);
      throw error;
    }
  }

  /**
   * Get an item by ID
   */
  async getItem(itemId: string): Promise<ZohoBillingItem> {
    try {
      const response = await this.request<ZohoBillingApiResponse<ZohoBillingItem>>(
        `/items/${itemId}`
      );

      if (!response.data) {
        throw new Error('Item not found');
      }

      return response.data;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting item:', error);
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async createItem(payload: CreateItemPayload): Promise<string> {
    try {
      console.log('[ZohoBillingClient] Creating item:', {
        sku: payload.sku,
        item_name: payload.item_name,
        rate: payload.rate,
      });

      const response = await this.request<ZohoBillingApiResponse<ZohoBillingItem>>(
        '/items',
        'POST',
        payload
      );

      if (!response.data?.item_id) {
        throw new Error('Failed to create item - no item_id returned');
      }

      console.log('[ZohoBillingClient] Item created:', response.data.item_id);
      return response.data.item_id;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(itemId: string, payload: UpdateItemPayload): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Updating item:', itemId);

      await this.request<ZohoBillingApiResponse<ZohoBillingItem>>(
        `/items/${itemId}`,
        'PUT',
        payload
      );

      console.log('[ZohoBillingClient] Item updated successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error updating item:', error);
      throw error;
    }
  }

  /**
   * Mark an item as inactive (soft delete)
   */
  async inactivateItem(itemId: string): Promise<void> {
    try {
      await this.updateItem(itemId, { status: 'inactive' });
    } catch (error) {
      console.error('[ZohoBillingClient] Error inactivating item:', error);
      throw error;
    }
  }

  /**
   * Upsert item - create if doesn't exist, update if exists
   */
  async upsertItem(sku: string, payload: CreateItemPayload): Promise<string> {
    try {
      const existingItem = await this.searchItems(sku);

      if (existingItem) {
        console.log('[ZohoBillingClient] Item exists, updating:', existingItem.item_id);

        // Extract updateable fields
        const updatePayload: UpdateItemPayload = {
          item_name: payload.item_name,
          description: payload.description,
          rate: payload.rate,
          tax_id: payload.tax_id,
          status: payload.status,
          custom_fields: payload.custom_fields,
        };

        await this.updateItem(existingItem.item_id, updatePayload);
        return existingItem.item_id;
      } else {
        console.log('[ZohoBillingClient] Item does not exist, creating new');
        return await this.createItem(payload);
      }
    } catch (error) {
      console.error('[ZohoBillingClient] Error upserting item:', error);
      throw error;
    }
  }

  // ============================================================================
  // Subscriptions API (For testing/reference)
  // ============================================================================

  /**
   * Create a subscription
   * Note: This is typically done from the order/checkout flow, not the publish pipeline
   */
  async createSubscription(payload: CreateSubscriptionPayload): Promise<string> {
    try {
      console.log('[ZohoBillingClient] Creating subscription:', {
        customer_id: payload.customer_id,
        plan_id: payload.plan_id,
      });

      const response = await this.request<ZohoBillingApiResponse<ZohoBillingSubscription>>(
        '/subscriptions',
        'POST',
        payload
      );

      if (!response.data?.subscription_id) {
        throw new Error('Failed to create subscription - no subscription_id returned');
      }

      console.log('[ZohoBillingClient] Subscription created:', response.data.subscription_id);
      return response.data.subscription_id;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<ZohoBillingSubscription> {
    try {
      const response = await this.request<ZohoBillingApiResponse<ZohoBillingSubscription>>(
        `/subscriptions/${subscriptionId}`
      );

      if (!response.data) {
        throw new Error('Subscription not found');
      }

      return response.data;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting subscription:', error);
      throw error;
    }
  }

  // ============================================================================
  // Invoices API (For testing/reference)
  // ============================================================================

  /**
   * Get invoices for a subscription
   */
  async getSubscriptionInvoices(subscriptionId: string): Promise<ZohoBillingInvoice[]> {
    try {
      const response = await this.request<ZohoBillingListResponse<ZohoBillingInvoice>>(
        `/invoices?subscription_id=${subscriptionId}`
      );

      return response.data?.invoices || [];
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting subscription invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<ZohoBillingInvoice> {
    try {
      const response = await this.request<ZohoBillingApiResponse<ZohoBillingInvoice>>(
        `/invoices/${invoiceId}`
      );

      if (!response.data) {
        throw new Error('Invoice not found');
      }

      return response.data;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting invoice:', error);
      throw error;
    }
  }
}
