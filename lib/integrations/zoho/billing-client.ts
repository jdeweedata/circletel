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
  ZohoBillingProduct,
  CreateProductPayload,
  UpdateProductPayload,
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
   * Uses zohoapis.com domain as required by Zoho API (error code 9)
   */
  protected getBillingBaseUrl(): string {
    const regionMap: Record<string, string> = {
      US: 'https://www.zohoapis.com/billing/v1',
      EU: 'https://www.zohoapis.eu/billing/v1',
      IN: 'https://www.zohoapis.in/billing/v1',
      AU: 'https://www.zohoapis.com.au/billing/v1',
      CN: 'https://www.zohoapis.com.cn/billing/v1',
    };

    const region = this.config.region || 'US';
    return regionMap[region] || regionMap.US;
  }

  /**
   * Build full URL with organization ID
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = this.getBillingBaseUrl();
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${baseUrl}${endpoint}${separator}organization_id=${this.organizationId}`;
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
      const response = await this.request<any>(
        `/plans?plan_code=${encodeURIComponent(planCode)}`
      );

      // Response structure: { code, message, plans: [...] }
      if (response.plans && response.plans.length > 0) {
        return response.plans[0];
      }

      return null;
    } catch (error) {
      console.error('[ZohoBillingClient] Error searching plans:', error);
      throw error;
    }
  }

  /**
   * Get a plan by plan_code
   * @param planCode - The plan_code (NOT plan_id) to retrieve
   */
  async getPlan(planCode: string): Promise<ZohoBillingPlan> {
    try {
      // Zoho Billing uses plan_code in the path, not plan_id
      const response = await this.request<any>(
        `/plans/${planCode}`
      );

      // Response structure: { code, message, plan: {...} }
      if (!response.plan) {
        throw new Error('Plan not found');
      }

      return response.plan;
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

      console.log('[ZohoBillingClient] Full plan payload:', JSON.stringify(planData, null, 2));

      const response = await this.request<any>(
        '/plans',
        'POST',
        planData
      );

      // Response structure: { code, message, plan: { plan_id, ... } }
      if (!response.plan?.plan_id) {
        throw new Error('Failed to create plan - no plan_id returned');
      }

      console.log('[ZohoBillingClient] Plan created:', response.plan.plan_id);
      return response.plan.plan_id;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating plan:', error);
      throw error;
    }
  }

  /**
   * Update an existing plan
   * @param planCode - The plan_code (NOT plan_id) to update
   */
  async updatePlan(planCode: string, payload: UpdatePlanPayload): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Updating plan:', planCode);
      console.log('[ZohoBillingClient] Update payload:', JSON.stringify(payload, null, 2));

      // Zoho Billing uses plan_code in the path, not plan_id
      await this.request<any>(
        `/plans/${planCode}`,
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
   * @param planCode - The plan_code to inactivate
   */
  async inactivatePlan(planCode: string): Promise<void> {
    try {
      await this.updatePlan(planCode, { status: 'inactive' });
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

        // Zoho Billing requires plan_code, name, recurring_price, and interval for updates
        const updatePayload: UpdatePlanPayload = {
          plan_code: payload.plan_code, // Required even though it can't change
          name: payload.name,
          recurring_price: payload.recurring_price,
          interval: payload.interval,
          interval_unit: payload.interval_unit,
          description: payload.description,
          billing_cycles: payload.billing_cycles,
          setup_fee: payload.setup_fee,
          status: payload.status,
        };

        // Use plan_code for update, not plan_id
        await this.updatePlan(payload.plan_code, updatePayload);
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
  // Products API
  // ============================================================================

  /**
   * Search for a product by name
   * Note: Zoho Billing Products API doesn't support search filters,
   * so we list all products and filter in-memory
   */
  async searchProducts(name: string): Promise<ZohoBillingProduct | null> {
    try {
      // List all products (no search filter available)
      const response = await this.request<any>('/products');

      // Response structure: { code, message, products: [...] }
      if (response.products && Array.isArray(response.products)) {
        // Filter by exact name match
        const product = response.products.find(
          (p: ZohoBillingProduct) => p.name === name
        );
        return product || null;
      }

      return null;
    } catch (error) {
      console.error('[ZohoBillingClient] Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get a product by ID
   */
  async getProduct(productId: string): Promise<ZohoBillingProduct> {
    try {
      const response = await this.request<any>(
        `/products/${productId}`
      );

      // Response structure: { code, message, product: {...} }
      if (!response.product) {
        throw new Error('Product not found');
      }

      return response.product;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting product:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(payload: CreateProductPayload): Promise<string> {
    try {
      console.log('[ZohoBillingClient] Creating product:', {
        name: payload.name,
      });

      const response = await this.request<any>(
        '/products',
        'POST',
        payload
      );

      console.log('[ZohoBillingClient] Product creation response:', JSON.stringify(response, null, 2));

      // Response structure: { code, message, product: { product_id, ... } }
      if (!response.product?.product_id) {
        throw new Error(`Failed to create product - no product_id returned. Response: ${JSON.stringify(response)}`);
      }

      console.log('[ZohoBillingClient] Product created:', response.product.product_id);
      return response.product.product_id;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, payload: UpdateProductPayload): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Updating product:', productId);

      await this.request<ZohoBillingApiResponse<ZohoBillingProduct>>(
        `/products/${productId}`,
        'PUT',
        payload
      );

      console.log('[ZohoBillingClient] Product updated successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error updating product:', error);
      throw error;
    }
  }

  /**
   * Create or update a product (upsert)
   * Search by name, create if doesn't exist, update if exists
   */
  async upsertProduct(name: string, payload: CreateProductPayload): Promise<string> {
    try {
      const existingProduct = await this.searchProducts(name);

      if (existingProduct) {
        console.log('[ZohoBillingClient] Product exists, updating:', existingProduct.product_id);

        // Extract updateable fields
        const updatePayload: UpdateProductPayload = {
          name: payload.name,
          description: payload.description,
          email_ids: payload.email_ids,
          redirect_url: payload.redirect_url,
        };

        await this.updateProduct(existingProduct.product_id, updatePayload);
        return existingProduct.product_id;
      } else {
        console.log('[ZohoBillingClient] Product does not exist, creating new');
        return await this.createProduct(payload);
      }
    } catch (error) {
      console.error('[ZohoBillingClient] Error upserting product:', error);
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
