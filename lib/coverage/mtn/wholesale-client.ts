/**
 * MTN Wholesale Feasibility API Client
 *
 * Client for MTN MNS (Managed Network Services) Wholesale API
 * Provides coverage checking for business products
 *
 * Environment: Test (asp-feasibility.mtnbusiness.co.za)
 * Production: ftool.mtnbusiness.co.za (requires IP whitelisting)
 */

import { Coordinates } from '../types';
import {
  MTNWholesaleConfig,
  MTNProductsResponse,
  MTNFeasibilityRequest,
  MTNFeasibilityResponse,
  MTNWholesaleCoverageResult,
  MTNProductResult
} from './wholesale-types';

export class MTNWholesaleClient {
  private config: MTNWholesaleConfig;
  private productsCache: string[] | null = null;
  private productsCacheTime: number = 0;
  private readonly PRODUCTS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(config?: Partial<MTNWholesaleConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.MTN_WHOLESALE_API_KEY || 'bdaacbcae8ab77672e545649df54d0df',
      baseUrl: config?.baseUrl || process.env.MTN_WHOLESALE_API_URL || 'https://asp-feasibility.mtnbusiness.co.za',
      environment: (config?.environment as 'test' | 'production') || 'test',
      timeout: config?.timeout || 30000 // 30 seconds
    };
  }

  /**
   * Get available MTN wholesale products
   * Cached for 1 hour
   */
  async getProducts(): Promise<string[]> {
    // Check cache
    if (this.productsCache && Date.now() - this.productsCacheTime < this.PRODUCTS_CACHE_TTL) {
      return this.productsCache;
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/feasibility/product/wholesale/mns`,
        {
          method: 'GET',
          headers: {
            'X-API-KEY': this.config.apiKey,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(this.config.timeout!)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MTNProductsResponse = await response.json();

      if (data.error_code !== '200' && data.error_code !== '0') {
        throw new Error(`API Error: ${data.error_message}`);
      }

      // Cache the results
      this.productsCache = data.outputs || [];
      this.productsCacheTime = Date.now();

      return this.productsCache;
    } catch (error) {
      console.error('[MTN Wholesale] Failed to fetch products:', error);
      throw new Error(`Failed to fetch MTN wholesale products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check feasibility for multiple products at a location
   */
  async checkFeasibility(
    coordinates: Coordinates,
    productNames?: string[],
    customerName?: string
  ): Promise<MTNWholesaleCoverageResult> {
    const startTime = Date.now();

    try {
      // Get products if not provided
      let products = productNames;
      if (!products || products.length === 0) {
        products = await this.getProducts();
      }

      // Build request
      const request: MTNFeasibilityRequest = {
        inputs: [
          {
            latitude: coordinates.lat.toString(),
            longitude: coordinates.lng.toString(),
            customer_name: customerName || `Location ${coordinates.lat},${coordinates.lng}`
          }
        ],
        product_names: products,
        requestor: 'coverage@circletel.co.za'
      };

      // Make API call
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/feasibility/product/wholesale/mns`,
        {
          method: 'POST',
          headers: {
            'X-API-KEY': this.config.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeout!)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MTNFeasibilityResponse = await response.json();

      if (data.error_code !== '200' && data.error_code !== '0') {
        throw new Error(`API Error: ${data.error_message}`);
      }

      // Parse and map results
      const output = data.outputs[0]; // We only sent one location
      const mappedProducts = output?.product_results?.map(product => ({
        name: product.product_name,
        feasible: product.product_feasible.toLowerCase() === 'yes',
        capacity: product.product_capacity,
        region: product.product_region,
        notes: product.product_notes,
        productCategory: this.mapProductToCategory(product.product_name)
      })) || [];

      const responseTime = Date.now() - startTime;

      return {
        coordinates,
        available: mappedProducts.some(p => p.feasible),
        products: mappedProducts,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('[MTN Wholesale] Feasibility check failed:', error);

      return {
        coordinates,
        available: false,
        products: [],
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check feasibility for specific products only
   */
  async checkSpecificProducts(
    coordinates: Coordinates,
    productNames: string[],
    customerName?: string
  ): Promise<MTNWholesaleCoverageResult> {
    return this.checkFeasibility(coordinates, productNames, customerName);
  }

  /**
   * Map MTN wholesale product names to CircleTel product categories
   * FTTH = Fibre to the Home (consumer fibre)
   * Fixed Wireless = SkyFibre/wireless
   * Cloud Connect/Ethernet = Connectivity (business)
   */
  private mapProductToCategory(productName: string): 'fibre' | 'wireless' | 'connectivity' {
    const name = productName.toLowerCase();

    // FTTH products (Fibre to the Home - consumer fibre)
    if (name.includes('ftth') || name.includes('fibre')) {
      return 'fibre';
    }

    // Wireless products (maps to SkyFibre)
    if (name.includes('wireless') || name.includes('broadband')) {
      return 'wireless';
    }

    // Connectivity products (cloud connect, ethernet, access connect, etc.)
    return 'connectivity';
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: 'fibre' | 'wireless' | 'connectivity'): Promise<string[]> {
    const allProducts = await this.getProducts();

    return allProducts.filter(product => {
      return this.mapProductToCategory(product) === category;
    });
  }

  /**
   * Clear products cache
   */
  clearCache(): void {
    this.productsCache = null;
    this.productsCacheTime = 0;
  }
}

// Singleton instance
let wholesaleClientInstance: MTNWholesaleClient | null = null;

export function getMTNWholesaleClient(): MTNWholesaleClient {
  if (!wholesaleClientInstance) {
    wholesaleClientInstance = new MTNWholesaleClient();
  }
  return wholesaleClientInstance;
}

// Export for testing
export const mtnWholesaleClient = getMTNWholesaleClient();
