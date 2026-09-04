import { ZohoAPIClient } from '@/lib/zoho-api-client';
import rateLimiter from './rate-limiter';
import { zohoLogger } from '@/lib/logging';
import type { InventoryAdjustmentPayload } from './inventory-sync';

export interface ZohoInventoryItem {
  item_id: string;
  name: string;
  sku?: string;
  stock_on_hand?: number;
  status?: string;
}

export interface ZohoInventoryOrganization {
  organization_id: string;
  name: string;
  is_org_active?: boolean;
}

interface ZohoInventoryError {
  code?: number;
  message?: string;
}

export class ZohoInventoryClient extends ZohoAPIClient {
  private readonly organizationId: string;

  constructor() {
    super({
      clientId: process.env.ZOHO_INVENTORY_CLIENT_ID || process.env.ZOHO_CLIENT_ID!,
      clientSecret:
        process.env.ZOHO_INVENTORY_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET!,
      refreshToken:
        process.env.ZOHO_INVENTORY_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN!,
      region:
        (process.env.ZOHO_INVENTORY_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') ||
        (process.env.ZOHO_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') ||
        'US',
    });

    this.organizationId =
      process.env.ZOHO_INVENTORY_ORGANIZATION_ID ||
      process.env.ZOHO_INVENTORY_ORG_ID ||
      '';

    if (!this.organizationId) {
      zohoLogger.warn('[ZohoInventoryClient] ZOHO_INVENTORY_ORGANIZATION_ID not configured');
    }
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  private getInventoryBaseUrl(): string {
    const regionMap: Record<string, string> = {
      US: 'https://www.zohoapis.com/inventory/v1',
      EU: 'https://www.zohoapis.eu/inventory/v1',
      IN: 'https://www.zohoapis.in/inventory/v1',
      AU: 'https://www.zohoapis.com.au/inventory/v1',
      CN: 'https://www.zohoapis.com.cn/inventory/v1',
    };
    return regionMap[this.config.region || 'US'] || regionMap.US;
  }

  private buildUrl(endpoint: string, additionalParams?: Record<string, string>): string {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      ...additionalParams,
    });
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${this.getInventoryBaseUrl()}${endpoint}${separator}${params.toString()}`;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown,
    queryParams?: Record<string, string>
  ): Promise<T> {
    await rateLimiter.waitForSlot('billing');

    const accessToken = await this.getAccessToken();
    const url = this.buildUrl(endpoint, queryParams);
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    zohoLogger.debug(`[ZohoInventoryClient] ${method} ${endpoint}`);
    const response = await fetch(url, options);
    const data = (await response.json()) as T & ZohoInventoryError;

    if (!response.ok) {
      zohoLogger.error('[ZohoInventoryClient] API Error', {
        status: response.status,
        code: data.code,
        message: data.message,
      });
      if (response.status === 401 || data.code === 57) {
        throw new Error(`OAUTH_ERROR: ${data.message || 'Unauthorized'}`);
      }
      throw new Error(`Zoho Inventory API error: ${data.message || response.status} (${data.code})`);
    }

    return data;
  }

  async listOrganizations(): Promise<ZohoInventoryOrganization[]> {
    const response = await this.request<{ organizations?: ZohoInventoryOrganization[] }>(
      '/organizations'
    );
    return response.organizations ?? [];
  }

  async searchItemBySku(sku: string): Promise<ZohoInventoryItem | null> {
    const response = await this.request<{ items?: ZohoInventoryItem[] }>(
      '/items',
      'GET',
      undefined,
      { sku }
    );
    return response.items?.[0] ?? null;
  }

  async getItem(itemId: string): Promise<ZohoInventoryItem> {
    const response = await this.request<{ item?: ZohoInventoryItem }>(`/items/${itemId}`);
    if (!response.item?.item_id) {
      throw new Error(`Zoho Inventory item ${itemId} not found`);
    }
    return response.item;
  }

  async createInventoryAdjustment(
    payload: InventoryAdjustmentPayload
  ): Promise<{ adjustmentId: string }> {
    const response = await this.request<{
      inventory_adjustment?: {
        inventory_adjustment_id?: string;
        inventoryadjustment_id?: string;
      };
      inventoryadjustment?: {
        inventory_adjustment_id?: string;
        inventoryadjustment_id?: string;
      };
    }>('/inventoryadjustments', 'POST', payload);

    const created = response.inventory_adjustment ?? response.inventoryadjustment;
    const adjustmentId =
      created?.inventory_adjustment_id || created?.inventoryadjustment_id;
    if (!adjustmentId) {
      throw new Error('Zoho Inventory adjustment response missing inventoryadjustment_id');
    }
    return { adjustmentId };
  }
}

export function createZohoInventoryClient(): ZohoInventoryClient {
  return new ZohoInventoryClient();
}
