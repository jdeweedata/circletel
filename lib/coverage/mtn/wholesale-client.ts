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
  private readonly DEFAULT_RADIUS_METERS = 500; // Default radius for multi-point check

  constructor(config?: Partial<MTNWholesaleConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.MTN_WHOLESALE_API_KEY || 'bdaacbcae8ab77672e545649df54d0df',
      baseUrl: config?.baseUrl || process.env.MTN_WHOLESALE_API_URL || 'https://asp-feasibility.mtnbusiness.co.za',
      environment: (config?.environment as 'test' | 'production') || 'test',
      timeout: config?.timeout || 30000 // 30 seconds
    };
  }

  /**
   * Create an AbortSignal with timeout (compatible with all Node.js versions)
   * AbortSignal.timeout() is only available in Node.js 17.3+
   */
  private createTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  /**
   * Generate cardinal points around a center coordinate for multi-point coverage check
   * This compensates for geocoding inaccuracy (Google Maps can be ~460m off)
   *
   * @param center - Center coordinates from geocoding
   * @param radiusMeters - Radius in meters (default 500m covers typical geocoding variance)
   * @returns Array of 5 coordinates: center + N/S/E/W
   *
   * Pattern:
   *         N (500m)
   *           •
   *           |
   *   W •-----+-----• E (500m)
   *           |
   *           •
   *         S (500m)
   */
  private generateCardinalPoints(center: Coordinates, radiusMeters: number = this.DEFAULT_RADIUS_METERS): Coordinates[] {
    // 1 degree latitude ≈ 111,000 meters (constant worldwide)
    // 1 degree longitude ≈ 111,000 * cos(latitude) meters (varies by latitude)
    const latOffset = radiusMeters / 111000;
    const lngOffset = radiusMeters / (111000 * Math.cos(center.lat * Math.PI / 180));

    return [
      center, // Center point (original geocoded location)
      { lat: center.lat + latOffset, lng: center.lng }, // North
      { lat: center.lat - latOffset, lng: center.lng }, // South
      { lat: center.lat, lng: center.lng - lngOffset }, // West
      { lat: center.lat, lng: center.lng + lngOffset }, // East
    ];
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
          signal: this.createTimeoutSignal(this.config.timeout!)
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
   * Uses multi-point radius check to compensate for geocoding inaccuracy (~460m variance)
   *
   * @param coordinates - Center coordinates (from geocoding)
   * @param productNames - Product names to check (defaults to all)
   * @param customerName - Customer name for the request
   * @param useRadiusCheck - Enable multi-point radius check (default: true)
   */
  async checkFeasibility(
    coordinates: Coordinates,
    productNames?: string[],
    customerName?: string,
    useRadiusCheck: boolean = true
  ): Promise<MTNWholesaleCoverageResult> {
    const startTime = Date.now();

    try {
      // Get products if not provided
      let products = productNames;
      if (!products || products.length === 0) {
        products = await this.getProducts();
      }

      // Generate check points: center + cardinal points at 500m radius (if enabled)
      // This compensates for Google Maps geocoding variance (~460m observed)
      const checkPoints = useRadiusCheck
        ? this.generateCardinalPoints(coordinates, this.DEFAULT_RADIUS_METERS)
        : [coordinates];

      const pointLabels = ['Center', 'North', 'South', 'West', 'East'];

      console.log('[MTN Wholesale] Checking feasibility with', checkPoints.length, 'points:', {
        center: coordinates,
        radiusCheck: useRadiusCheck,
        radiusMeters: this.DEFAULT_RADIUS_METERS
      });

      // Build request with multiple inputs (single API call)
      const request: MTNFeasibilityRequest = {
        inputs: checkPoints.map((coord, i) => ({
          latitude: coord.lat.toString(),
          longitude: coord.lng.toString(),
          customer_name: customerName
            ? `${customerName} (${pointLabels[i] || `Point_${i}`})`
            : `${pointLabels[i] || `Point_${i}`} ${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`
        })),
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
          signal: this.createTimeoutSignal(this.config.timeout!)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MTNFeasibilityResponse = await response.json();

      if (data.error_code !== '200' && data.error_code !== '0') {
        throw new Error(`API Error: ${data.error_message}`);
      }

      // Aggregate results from ALL check points
      // A product is considered feasible if it's feasible at ANY of the check points
      const productFeasibilityMap = new Map<string, {
        feasible: boolean;
        capacity: string;
        region: string;
        notes: string;
        feasibleAt: string[];
      }>();

      // Process each output (one per check point)
      data.outputs.forEach((output, pointIndex) => {
        const pointLabel = pointLabels[pointIndex] || `Point_${pointIndex}`;

        output.product_results?.forEach(product => {
          const isFeasible = product.product_feasible.toLowerCase() === 'yes';
          const existing = productFeasibilityMap.get(product.product_name);

          if (existing) {
            // Update if this point shows feasibility
            if (isFeasible && !existing.feasible) {
              existing.feasible = true;
              existing.capacity = product.product_capacity;
              existing.region = product.product_region;
              existing.notes = product.product_notes;
            }
            if (isFeasible) {
              existing.feasibleAt.push(pointLabel);
            }
          } else {
            // First occurrence of this product
            productFeasibilityMap.set(product.product_name, {
              feasible: isFeasible,
              capacity: product.product_capacity,
              region: product.product_region,
              notes: product.product_notes,
              feasibleAt: isFeasible ? [pointLabel] : []
            });
          }
        });
      });

      // Convert map to array format
      const mappedProducts = Array.from(productFeasibilityMap.entries()).map(([name, result]) => ({
        name,
        feasible: result.feasible,
        capacity: result.capacity,
        region: result.region,
        notes: result.feasibleAt.length > 0
          ? `${result.notes || ''} [Feasible at: ${result.feasibleAt.join(', ')}]`.trim()
          : result.notes,
        productCategory: this.mapProductToCategory(name)
      }));

      // Log aggregated results
      const feasibleProducts = mappedProducts.filter(p => p.feasible);
      console.log('[MTN Wholesale] Aggregated feasibility results:', {
        totalProducts: mappedProducts.length,
        feasibleCount: feasibleProducts.length,
        feasibleProducts: feasibleProducts.map(p => ({
          name: p.name,
          feasibleAt: productFeasibilityMap.get(p.name)?.feasibleAt
        }))
      });

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
