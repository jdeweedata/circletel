/**
 * Zoho Billing API Client
 *
 * Handles all Zoho Billing API interactions for Plans, Items, Subscriptions
 * Extends ZohoApiClient to reuse OAuth token management
 *
 * Epic 3.2 - Zoho Billing Integration
 * Epic 4.4 - Rate Limiting Protection
 */

import { ZohoAPIClient } from '@/lib/zoho-api-client';
import rateLimiter from './rate-limiter';
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
      'X-com-zoho-subscriptions-organizationid': this.organizationId,
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
      const response = await this.request<any>(
        `/items?sku=${encodeURIComponent(sku)}`
      );

      // Response structure: { code, message, items: [...] }
      if (response.items && response.items.length > 0) {
        return response.items[0];
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
      const response = await this.request<any>(
        `/items/${itemId}`
      );

      // Response structure: { code, message, item: {...} }
      if (!response.item) {
        throw new Error('Item not found');
      }

      return response.item;
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
        name: payload.name,
        rate: payload.rate,
      });

      const response = await this.request<any>(
        '/items',
        'POST',
        payload
      );

      // Response structure: { code, message, item: { item_id, ... } }
      if (!response.item?.item_id) {
        throw new Error('Failed to create item - no item_id returned');
      }

      console.log('[ZohoBillingClient] Item created:', response.item.item_id);
      return response.item.item_id;
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

      await this.request<any>(
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
          name: payload.name,
          description: payload.description,
          rate: payload.rate,
          tax_id: payload.tax_id,
          status: payload.status,
          // custom_fields removed - requires pre-defined fields in Zoho Billing
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
  // Customers API
  // ============================================================================

  /**
   * Search for a customer by email
   * Returns first matching customer
   */
  async searchCustomers(email: string): Promise<any | null> {
    try {
      const response = await this.request<any>(
        `/customers?email=${encodeURIComponent(email)}`
      );

      // Response structure: { code, message, customers: [...] }
      if (response.customers && response.customers.length > 0) {
        return response.customers[0];
      }

      return null;
    } catch (error) {
      console.error('[ZohoBillingClient] Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<any> {
    try {
      const response = await this.request<any>(
        `/customers/${customerId}`
      );

      // Response structure: { code, message, customer: {...} }
      if (!response.customer) {
        throw new Error('Customer not found');
      }

      return response.customer;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting customer:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(payload: any): Promise<string> {
    try {
      console.log('[ZohoBillingClient] Creating customer:', {
        email: payload.email,
        display_name: payload.display_name,
      });

      const response = await this.request<any>(
        '/customers',
        'POST',
        payload
      );

      // Response structure: { code, message, customer: { customer_id, ... } }
      if (!response.customer?.customer_id) {
        throw new Error('Failed to create customer - no customer_id returned');
      }

      console.log('[ZohoBillingClient] Customer created:', response.customer.customer_id);
      return response.customer.customer_id;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(customerId: string, payload: any): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Updating customer:', customerId);

      await this.request<any>(
        `/customers/${customerId}`,
        'PUT',
        payload
      );

      console.log('[ZohoBillingClient] Customer updated successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Create or update a customer based on email
   * Uses email as the unique identifier
   */
  async upsertCustomer(email: string, payload: any): Promise<string> {
    try {
      // Search for existing customer
      const existingCustomer = await this.searchCustomers(email);

      if (existingCustomer) {
        // Update existing customer
        console.log('[ZohoBillingClient] Customer exists, updating:', existingCustomer.customer_id);

        const updatePayload: any = {
          display_name: payload.display_name,
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone: payload.phone,
          mobile: payload.mobile,
          company_name: payload.company_name,
          // Address fields
          street: payload.street,
          city: payload.city,
          state: payload.state,
          zip: payload.zip,
          country: payload.country,
        };

        await this.updateCustomer(existingCustomer.customer_id, updatePayload);
        return existingCustomer.customer_id;
      } else {
        // Create new customer
        console.log('[ZohoBillingClient] Customer does not exist, creating new');
        return await this.createCustomer(payload);
      }
    } catch (error) {
      console.error('[ZohoBillingClient] Error upserting customer:', error);
      throw error;
    }
  }

  // ============================================================================
  // Subscriptions API
  // ============================================================================

  /**
   * Create a new subscription
   * Automatically generates first invoice
   */
  async createSubscription(payload: any): Promise<any> {
    try {
      console.log('[ZohoBillingClient] Creating subscription:', {
        customer_id: payload.customer_id,
        plan: payload.plan,
      });

      const response = await this.request<any>(
        '/subscriptions',
        'POST',
        payload
      );

      // Response structure: { code, message, subscription: {...} }
      if (!response.subscription) {
        throw new Error('Failed to create subscription');
      }

      console.log('[ZohoBillingClient] Subscription created:', {
        subscription_id: response.subscription.subscription_id,
        subscription_number: response.subscription.subscription_number,
        status: response.subscription.status,
      });

      return response.subscription;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await this.request<any>(
        `/subscriptions/${subscriptionId}`
      );

      // Response structure: { code, message, subscription: {...} }
      if (!response.subscription) {
        throw new Error('Subscription not found');
      }

      return response.subscription;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtEnd: boolean = false
  ): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Cancelling subscription:', subscriptionId, {
        cancel_at_end: cancelAtEnd,
      });

      await this.request<any>(
        `/subscriptions/${subscriptionId}/cancel`,
        'POST',
        { cancel_at_end: cancelAtEnd }
      );

      console.log('[ZohoBillingClient] Subscription cancelled successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error cancelling subscription:', error);
      throw error;
    }
  }

  // ============================================================================
  // Invoices API
  // ============================================================================

  /**
   * Get invoices for a subscription
   */
  async getSubscriptionInvoices(subscriptionId: string): Promise<any[]> {
    try {
      const response = await this.request<any>(
        `/invoices?subscription_id=${subscriptionId}`
      );

      // Response structure: { code, message, invoices: [...] }
      return response.invoices || [];
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting subscription invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<any> {
    try {
      const response = await this.request<any>(
        `/invoices/${invoiceId}`
      );

      // Response structure: { code, message, invoice: {...} }
      if (!response.invoice) {
        throw new Error('Invoice not found');
      }

      return response.invoice;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting invoice:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice for a customer
   * Used for manual invoices (installation, pro-rata, equipment, adjustments)
   * Recurring invoices are auto-generated by ZOHO from subscriptions
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
    [key: string]: any; // Allow custom fields
  }): Promise<any> {
    try {
      console.log('[ZohoBillingClient] Creating invoice:', {
        customer_id: payload.customer_id,
        line_items: payload.line_items.length,
      });

      const response = await this.request<any>(
        '/invoices',
        'POST',
        payload
      );

      // Response structure: { code, message, invoice: {...} }
      if (!response.invoice) {
        throw new Error('Failed to create invoice');
      }

      console.log('[ZohoBillingClient] Invoice created successfully:', {
        invoice_id: response.invoice.invoice_id,
        invoice_number: response.invoice.invoice_number,
        total: response.invoice.total,
      });

      return response.invoice;
    } catch (error) {
      console.error('[ZohoBillingClient] Error creating invoice:', error);
      throw error;
    }
  }

  // ============================================================================
  // Payments API
  // ============================================================================

  /**
   * Record a payment for one or more invoices
   * Automatically marks invoices as paid when full amount is received
   */
  async recordPayment(payload: {
    customer_id: string;
    payment_mode: string;
    amount: number;
    date?: string;
    reference_number?: string;
    description?: string;
    invoices: Array<{
      invoice_id: string;
      amount_applied: number;
    }>;
  }): Promise<any> {
    try {
      console.log('[ZohoBillingClient] Recording payment:', {
        customer_id: payload.customer_id,
        amount: payload.amount,
        payment_mode: payload.payment_mode,
        invoices: payload.invoices.length,
      });

      const response = await this.request<any>(
        '/payments',
        'POST',
        payload
      );

      // Response structure: { code, message, payment: {...} }
      if (!response.payment) {
        throw new Error('Failed to record payment');
      }

      console.log('[ZohoBillingClient] Payment recorded:', {
        payment_id: response.payment.payment_id,
        payment_number: response.payment.payment_number,
        amount: response.payment.amount,
      });

      return response.payment;
    } catch (error) {
      console.error('[ZohoBillingClient] Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.request<any>(
        `/payments/${paymentId}`
      );

      // Response structure: { code, message, payment: {...} }
      if (!response.payment) {
        throw new Error('Payment not found');
      }

      return response.payment;
    } catch (error) {
      console.error('[ZohoBillingClient] Error getting payment:', error);
      throw error;
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Deleting payment:', paymentId);

      await this.request<any>(
        `/payments/${paymentId}`,
        'DELETE'
      );

      console.log('[ZohoBillingClient] Payment deleted successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error deleting payment:', error);
      throw error;
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Deleting invoice:', invoiceId);

      await this.request<any>(
        `/invoices/${invoiceId}`,
        'DELETE'
      );

      console.log('[ZohoBillingClient] Invoice deleted successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Delete a customer (only if no associated subscriptions/invoices)
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      console.log('[ZohoBillingClient] Deleting customer:', customerId);

      await this.request<any>(
        `/customers/${customerId}`,
        'DELETE'
      );

      console.log('[ZohoBillingClient] Customer deleted successfully');
    } catch (error) {
      console.error('[ZohoBillingClient] Error deleting customer:', error);
      throw error;
    }
  }

  // ============================================================================
  // Plans API - Update Operations (Epic 3.6)
  // ============================================================================

  /**
   * Update an existing plan
   * Used for price changes - updates plan price when price change becomes effective
   *
   * @param planId - Zoho Billing Plan ID
   * @param updates - Partial plan object with fields to update
   * @returns Updated plan object
   */
  async updatePlan(planId: string, updates: Partial<any>): Promise<any> {
    try {
      console.log(`[ZohoBillingClient] Updating plan ${planId}:`, updates);

      const response = await this.request<any>(
        `/plans/${planId}`,
        'PUT',
        updates
      );

      // Response structure: { code, message, plan: {...} }
      if (!response.plan) {
        throw new Error('Failed to update plan');
      }

      console.log('[ZohoBillingClient] Plan updated successfully:', {
        plan_id: response.plan.plan_id,
        plan_code: response.plan.plan_code,
        recurring_price: response.plan.recurring_price,
      });

      return response.plan;
    } catch (error) {
      console.error('[ZohoBillingClient] Error updating plan:', error);
      throw error;
    }
  }
}
