// MTN WMS Client with dual-source support
import {
  MTNMapConfig,
  MTNWMSRequest,
  MTNWMSResponse,
  MTNFeatureInfo,
  MTN_CONFIGS,
  MTNError,
  BoundingBox
} from './types';
import { Coordinates, ServiceType, SignalStrength } from '../types';
import { mtnCoverageCache } from './cache';
import { getMockCoverageData } from './test-data';
import { mtnResponseValidator } from './validation';
import { mtnCoverageMonitor } from './monitoring';

export class MTNWMSClient {
  private businessBaseUrl = 'https://mtnsi.mtn.co.za/coverage/dev/v3';
  private consumerBaseUrl = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';
  private timeout = 15000; // 15 seconds for external API
  private rateLimitDelay = 250; // 250ms between requests
  private lastRequestTime = 0;
  private testMode = process.env.NODE_ENV === 'development' && process.env.MTN_TEST_MODE === 'true';

  constructor(businessBaseUrl?: string, consumerBaseUrl?: string) {
    if (businessBaseUrl) {
      this.businessBaseUrl = businessBaseUrl;
    }
    if (consumerBaseUrl) {
      this.consumerBaseUrl = consumerBaseUrl;
    }
  }

  /**
   * Check coverage at specific coordinates using both business and consumer maps
   */
  async checkCoverage(coordinates: Coordinates, serviceTypes?: ServiceType[]): Promise<{
    business: MTNWMSResponse[];
    consumer: MTNWMSResponse[];
  }> {
    const startTime = Date.now();
    let cacheHit = false;
    let success = true;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    try {
      // Try to get cached results first
      const cacheKey = `${coordinates.lat},${coordinates.lng}_${serviceTypes?.join(',') || 'all'}`;
      const cached = mtnCoverageCache.get(coordinates);

      if (cached) {
        console.log('Using cached coverage data for', coordinates);
        cacheHit = true;

        // Split cached results by source
        const business = cached.filter(r => r.layer && this.isBusinessLayer(r.layer));
        const consumer = cached.filter(r => r.layer && this.isConsumerLayer(r.layer));

        // Record cache hit metric
        mtnCoverageMonitor.recordRequest({
          coordinates,
          layers: cached.map(r => r.layer).filter(Boolean),
          duration: Date.now() - startTime,
          success: true,
          cacheHit: true,
          source: 'both',
          validationErrors: 0,
          validationWarnings: 0
        });

        return { business, consumer };
      }

      const businessConfig = MTN_CONFIGS.business;
      const consumerConfig = MTN_CONFIGS.consumer;

      // Determine which layers to query
      const businessLayers = this.getLayersToQuery(businessConfig, serviceTypes);
      const consumerLayers = this.getLayersToQuery(consumerConfig, serviceTypes);

      // Query both sources in parallel
      const [businessResults, consumerResults] = await Promise.allSettled([
        this.queryLayers(businessConfig, businessLayers, coordinates),
        this.queryLayers(consumerConfig, consumerLayers, coordinates)
      ]);

      const business = businessResults.status === 'fulfilled' ? businessResults.value : [];
      const consumer = consumerResults.status === 'fulfilled' ? consumerResults.value : [];

      // Check for errors
      if (businessResults.status === 'rejected') {
        console.warn('Business API query failed:', businessResults.reason);
      }
      if (consumerResults.status === 'rejected') {
        console.warn('Consumer API query failed:', consumerResults.reason);
      }

      // Determine if request was successful
      success = business.length > 0 || consumer.length > 0;

      // Cache the combined results
      const allResults = [...business, ...consumer];
      if (allResults.length > 0) {
        mtnCoverageCache.set(coordinates, allResults);
      }

      return { business, consumer };

    } catch (error) {
      success = false;
      if (error instanceof MTNError) {
        errorCode = error.code;
        errorMessage = error.message;
      } else {
        errorCode = 'WMS_REQUEST_FAILED';
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }
      throw error;
    } finally {
      // Record metrics for monitoring
      const allLayers = [
        ...this.getLayersToQuery(MTN_CONFIGS.business, serviceTypes),
        ...this.getLayersToQuery(MTN_CONFIGS.consumer, serviceTypes)
      ];

      mtnCoverageMonitor.recordRequest({
        coordinates,
        layers: allLayers,
        duration: Date.now() - startTime,
        success,
        errorCode: errorCode as any,
        errorMessage,
        cacheHit,
        source: 'both',
        validationErrors: 0,
        validationWarnings: 0
      });
    }
  }

  /**
   * Check if layer belongs to business configuration
   */
  private isBusinessLayer(layer: string): boolean {
    return Object.values(MTN_CONFIGS.business.layers).includes(layer);
  }

  /**
   * Check if layer belongs to consumer configuration
   */
  private isConsumerLayer(layer: string): boolean {
    return Object.values(MTN_CONFIGS.consumer.layers).includes(layer);
  }

  /**
   * Query specific layers from a map configuration
   */
  private async queryLayers(
    config: MTNMapConfig,
    layers: string[],
    coordinates: Coordinates
  ): Promise<MTNWMSResponse[]> {
    // Use test data in test mode
    if (this.testMode) {
      console.log(`[TEST MODE] Simulating MTN ${config.type} coverage query for`, coordinates);
      const serviceTypes = layers.map(layer => this.getServiceTypeFromLayer(layer, config.type)).filter(Boolean) as ServiceType[];
      return getMockCoverageData(config.type, coordinates, serviceTypes);
    }

    const promises = layers.map(layer =>
      this.queryLayerWithFallback(config, layer, coordinates)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Failed to query layer ${layers[index]}:`, result.reason);
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
          layer: layers[index],
          coordinates
        };
      }
    });
  }

  /**
   * Get service type from layer name
   */
  private getServiceTypeFromLayer(layer: string, source: 'business' | 'consumer'): ServiceType | null {
    const layerMappings: Record<string, ServiceType> = {
      'FTTBCoverage': 'fibre',
      'UncappedWirelessEBU': 'uncapped_wireless',
      'FLTECoverageEBU': 'fixed_lte',
      'PMPCoverage': 'licensed_wireless',
      'mtnsi:MTNSA-Coverage-5G-5G': '5g',
      'mtnsi:MTNSA-Coverage-LTE': 'lte',
      'mtnsi:SUPERSONIC-CONSOLIDATED': 'fibre',
      'mtnsi:MTNSA-Coverage-UMTS-900': '3g_900',
      'mtnsi:MTNSA-Coverage-UMTS-2100': '3g_2100',
      'mtnsi:MTNSA-Coverage-GSM': '2g'
    };

    return layerMappings[layer] || null;
  }

  /**
   * Query a layer with fallback to alternative config if needed
   */
  private async queryLayerWithFallback(
    config: MTNMapConfig,
    layer: string,
    coordinates: Coordinates
  ): Promise<MTNWMSResponse> {
    try {
      // First try with the primary config
      return await this.queryLayer(config, layer, coordinates);
    } catch (error) {
      // Check if this is a cross-source layer that should be queried from alternative config
      const shouldFallback = this.shouldUseFallbackConfig(config, layer);

      if (shouldFallback) {
        const fallbackConfig = config.type === 'consumer' ? MTN_CONFIGS.business : MTN_CONFIGS.consumer;
        console.log(`Falling back to ${fallbackConfig.type} config for layer ${layer}`);

        try {
          const fallbackResult = await this.queryLayer(fallbackConfig, layer, coordinates);
          // Mark the result as coming from fallback source
          return {
            ...fallbackResult,
            layer: layer,
            coordinates
          };
        } catch (fallbackError) {
          console.warn(`Fallback query also failed for layer ${layer}:`, fallbackError);
          throw error; // Throw original error
        }
      }

      throw error;
    }
  }

  /**
   * Determine if we should use fallback config for a specific layer
   */
  private shouldUseFallbackConfig(config: MTNMapConfig, layer: string): boolean {
    // UncappedWirelessEBU should fallback from consumer to business
    if (config.type === 'consumer' && layer === 'UncappedWirelessEBU') {
      return true;
    }

    // Add other cross-source layer rules here if needed

    return false;
  }

  /**
   * Query a single WMS layer
   */
  async queryLayer(
    config: MTNMapConfig,
    layer: string,
    coordinates: Coordinates
  ): Promise<MTNWMSResponse> {
    try {
      const bbox = this.createBoundingBox(coordinates, 100); // 100m radius
      const wmsRequest: MTNWMSRequest = {
        configId: config.configId,
        layer,
        coordinates,
        bbox,
        width: 256,
        height: 256,
        x: 128, // Center pixel
        y: 128, // Center pixel
        format: 'application/json'
      };

      const url = this.buildWMSUrl(wmsRequest, config);
      const response = await this.makeRequest(url);
      const parseResult = this.parseWMSResponse(response, layer, coordinates);

      return {
        success: true,
        data: parseResult.features,
        layer,
        coordinates,
        validationErrors: parseResult.validationErrors,
        validationWarnings: parseResult.validationWarnings
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        layer,
        coordinates
      };
    }
  }

  /**
   * Build WMS GetFeatureInfo URL
   */
  private buildWMSUrl(request: MTNWMSRequest, config: MTNMapConfig): string {
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeatureInfo',
      LAYERS: request.layer,
      QUERY_LAYERS: request.layer,
      INFO_FORMAT: request.format || 'application/json',
      FEATURE_COUNT: '10',
      EXCEPTIONS: 'application/json'
    });

    if (request.bbox) {
      // WMS 1.3.0 uses CRS:84 (longitude, latitude order)
      params.append('CRS', 'CRS:84');
      params.append('BBOX', [
        request.bbox.minX,
        request.bbox.minY,
        request.bbox.maxX,
        request.bbox.maxY
      ].join(','));
    }

    if (request.width && request.height) {
      params.append('WIDTH', request.width.toString());
      params.append('HEIGHT', request.height.toString());
    }

    if (request.x !== undefined && request.y !== undefined) {
      params.append('I', request.x.toString());
      params.append('J', request.y.toString());
    }

    // Use the correct base URL for the config type
    const baseUrl = config.type === 'consumer' ? this.consumerBaseUrl : this.businessBaseUrl;
    const endpoint = config.type === 'consumer' ? '' : '/wms'; // GeoServer doesn't need /wms suffix

    return `${baseUrl}${endpoint}?${params.toString()}`;
  }

  /**
   * Create bounding box around coordinates
   */
  private createBoundingBox(coordinates: Coordinates, radiusMeters: number): BoundingBox {
    // Approximate conversion: 1 degree ≈ 111,000 meters
    const metersPerDegree = 111000;
    const deltaLat = radiusMeters / metersPerDegree;
    const deltaLng = radiusMeters / (metersPerDegree * Math.cos(coordinates.lat * Math.PI / 180));

    return {
      minX: coordinates.lng - deltaLng,
      minY: coordinates.lat - deltaLat,
      maxX: coordinates.lng + deltaLng,
      maxY: coordinates.lat + deltaLat
    };
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Make HTTP request with timeout and rate limiting
   */
  private async makeRequest(url: string): Promise<any> {
    // Enforce rate limiting
    await this.enforceRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CircleTel-Coverage-Checker/1.0',
          'Referer': 'https://mtnsi.mtn.co.za/',
          'Origin': 'https://mtnsi.mtn.co.za'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Enhanced error handling for different HTTP status codes
        if (response.status === 429) {
          throw new MTNError(
            'Rate limit exceeded - too many requests',
            'WMS_REQUEST_FAILED'
          );
        }

        if (response.status === 503) {
          throw new MTNError(
            'MTN service temporarily unavailable',
            'SERVICE_UNAVAILABLE'
          );
        }

        if (response.status === 404) {
          throw new MTNError(
            `WMS layer not found: ${response.status}`,
            'LAYER_NOT_AVAILABLE'
          );
        }

        throw new MTNError(
          `WMS request failed: ${response.status} ${response.statusText}`,
          'WMS_REQUEST_FAILED'
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        // Some WMS servers return text/plain or text/html for JSON
        const text = await response.text();

        // Check if it's an error response
        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('exception')) {
          throw new MTNError(
            `WMS service error: ${text.substring(0, 200)}`,
            'WMS_REQUEST_FAILED'
          );
        }

        try {
          return JSON.parse(text);
        } catch {
          // If not JSON, return as text (might be XML or HTML error)
          return { rawResponse: text, contentType };
        }
      } else {
        // Binary response (images, etc.)
        return await response.arrayBuffer();
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof MTNError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new MTNError(
          `Request timeout after ${this.timeout}ms`,
          'WMS_REQUEST_FAILED'
        );
      }

      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new MTNError(
          'Network connection failed - check internet connectivity',
          'WMS_REQUEST_FAILED',
          undefined,
          undefined,
          error
        );
      }

      throw new MTNError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WMS_REQUEST_FAILED',
        undefined,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse WMS GetFeatureInfo response with validation
   */
  private parseWMSResponse(response: any, layer: string, coordinates?: Coordinates): {
    features: MTNFeatureInfo[];
    validationErrors: number;
    validationWarnings: number;
  } {
    try {
      // Use validator for comprehensive response validation
      const validationResult = mtnResponseValidator.validateResponse(
        response,
        layer,
        coordinates || { lat: 0, lng: 0 }
      );

      // Log validation issues for monitoring
      if (validationResult.errors.length > 0) {
        console.error(`WMS response validation errors for layer ${layer}:`, validationResult.errors);
      }

      if (validationResult.warnings.length > 0) {
        console.warn(`WMS response validation warnings for layer ${layer}:`, validationResult.warnings);
      }

      // Return validated and normalized data with metrics
      return {
        features: validationResult.normalizedData || [{
          layer,
          coverage: {
            available: false,
            signal: 'none'
          }
        }],
        validationErrors: validationResult.errors.length,
        validationWarnings: validationResult.warnings.length
      };

    } catch (error) {
      console.error('Failed to validate WMS response:', error);

      // Fallback to original parsing for backward compatibility
      return {
        features: this.parseWMSResponseFallback(response, layer),
        validationErrors: 1, // Count the validation failure as an error
        validationWarnings: 0
      };
    }
  }

  /**
   * Fallback parser for when validation fails
   */
  private parseWMSResponseFallback(response: any, layer: string): MTNFeatureInfo[] {
    const features: MTNFeatureInfo[] = [];

    try {
      // Handle different response formats
      if (response.features && Array.isArray(response.features)) {
        // GeoJSON format
        for (const feature of response.features) {
          features.push({
            layer,
            feature: {
              properties: feature.properties || {},
              geometry: feature.geometry
            },
            coverage: this.extractCoverageInfo(feature.properties || {})
          });
        }
      } else if (response.results && Array.isArray(response.results)) {
        // Custom format
        for (const result of response.results) {
          features.push({
            layer,
            feature: {
              properties: result,
              geometry: undefined
            },
            coverage: this.extractCoverageInfo(result)
          });
        }
      } else if (typeof response === 'object' && response !== null) {
        // Single feature object
        features.push({
          layer,
          feature: {
            properties: response,
            geometry: undefined
          },
          coverage: this.extractCoverageInfo(response)
        });
      }

      return features;
    } catch (error) {
      console.warn('Failed to parse WMS response:', error);
      return [{
        layer,
        coverage: {
          available: false,
          signal: 'none'
        }
      }];
    }
  }

  /**
   * Extract coverage information from feature properties
   */
  private extractCoverageInfo(properties: Record<string, any>) {
    // This is a simplified extraction - actual logic depends on MTN's response format
    const available = this.determineCoverageAvailability(properties);
    const signal = this.determineSignalStrength(properties);

    return {
      available,
      signal,
      technology: properties.technology || properties.type,
      metadata: properties
    };
  }

  /**
   * Determine if coverage is available based on properties
   */
  private determineCoverageAvailability(properties: Record<string, any>): boolean {
    // Check various possible property names that indicate coverage
    const coverageIndicators = [
      'coverage',
      'available',
      'signal',
      'strength',
      'level',
      'quality'
    ];

    for (const indicator of coverageIndicators) {
      const value = properties[indicator];
      if (value !== undefined && value !== null) {
        // If it's a boolean
        if (typeof value === 'boolean') {
          return value;
        }
        // If it's a number (signal strength)
        if (typeof value === 'number') {
          return value > 0;
        }
        // If it's a string
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          return !['none', 'no', 'false', 'unavailable', 'null'].includes(lowerValue);
        }
      }
    }

    // If no specific coverage indicator, check if any properties exist
    return Object.keys(properties).length > 0;
  }

  /**
   * Determine signal strength from properties
   */
  private determineSignalStrength(properties: Record<string, any>): SignalStrength {
    const strengthValue = properties.signal || properties.strength || properties.quality || properties.level;

    if (typeof strengthValue === 'number') {
      if (strengthValue >= 90) return 'excellent';
      if (strengthValue >= 70) return 'good';
      if (strengthValue >= 50) return 'fair';
      if (strengthValue >= 30) return 'poor';
      return 'none';
    }

    if (typeof strengthValue === 'string') {
      const lower = strengthValue.toLowerCase();
      if (lower.includes('excellent') || lower.includes('very strong')) return 'excellent';
      if (lower.includes('good') || lower.includes('strong')) return 'good';
      if (lower.includes('fair') || lower.includes('medium')) return 'fair';
      if (lower.includes('poor') || lower.includes('weak')) return 'poor';
      if (lower.includes('none') || lower.includes('no signal')) return 'none';
    }

    // Default to 'fair' if coverage is available but strength is unknown
    return this.determineCoverageAvailability(properties) ? 'fair' : 'none';
  }

  /**
   * Get layers to query based on service types
   */
  private getLayersToQuery(config: MTNMapConfig, serviceTypes?: ServiceType[]): string[] {
    if (!serviceTypes || serviceTypes.length === 0) {
      // Return all available layers for this config
      return Object.values(config.layers).filter(layer => layer);
    }

    // Return only requested service types that are available in this config
    return serviceTypes
      .map(serviceType => config.layers[serviceType])
      .filter(layer => layer); // Remove undefined layers
  }

  /**
   * Test connectivity to MTN WMS service
   */
  async testConnection(configId?: string): Promise<boolean> {
    try {
      const testConfig = configId ?
        Object.values(MTN_CONFIGS).find(c => c.configId === configId) || MTN_CONFIGS.business :
        MTN_CONFIGS.business;

      // Test with a simple GetCapabilities request
      const url = `${this.businessBaseUrl}/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`;
      const response = await this.makeRequest(url);

      return response !== null;
    } catch (error) {
      console.warn('MTN WMS connectivity test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mtnWMSClient = new MTNWMSClient();