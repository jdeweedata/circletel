/**
 * MTN Coverage Map Client
 * Integrates with MTN's interactive coverage maps for both consumer and business services
 *
 * Consumer Map: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html
 * Business Map: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976
 */

import { Coordinates, ServiceType, CoverageResponse } from '../types';

export type MTNMapType = 'consumer' | 'business';

export interface MTNMapConfig {
  type: MTNMapType;
  url: string;
  mapContext?: string;
}

export interface MTNMapCoverageResult {
  coordinates: Coordinates;
  mapType: MTNMapType;
  services: {
    type: ServiceType;
    available: boolean;
    signal: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    technology?: string;
    layerName?: string;
  }[];
  metadata: {
    capturedAt: string;
    mapVersion: string;
    zoomLevel?: number;
  };
}

/**
 * MTN Map Coverage Client
 * Uses Playwright to interact with MTN's coverage maps
 */
export class MTNMapClient {
  private static readonly CONSUMER_MAP_URL = 'https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html';
  private static readonly BUSINESS_MAP_URL = 'https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976';

  /**
   * Get map configuration for a specific type
   */
  static getMapConfig(type: MTNMapType): MTNMapConfig {
    switch (type) {
      case 'consumer':
        return {
          type: 'consumer',
          url: this.CONSUMER_MAP_URL,
        };
      case 'business':
        return {
          type: 'business',
          url: this.BUSINESS_MAP_URL,
          mapContext: 'busr-407a787d7e9949dbb2d8fc9a3d073976',
        };
      default:
        throw new Error(`Unknown map type: ${type}`);
    }
  }

  /**
   * Check coverage using MTN map (requires Playwright MCP or server-side browser)
   * This method is designed to be called from an API route with browser access
   */
  static async checkCoverageWithMap(
    coordinates: Coordinates,
    mapType: MTNMapType = 'consumer'
  ): Promise<MTNMapCoverageResult> {
    const config = this.getMapConfig(mapType);

    // This will be called via API route that has access to Playwright
    // The actual browser interaction happens server-side
    throw new Error('This method should be called via API route /api/coverage/mtn/map-check');
  }

  /**
   * Map MTN layer names to our service types
   */
  static mapLayerToServiceType(layerName: string): ServiceType | null {
    const layerMap: Record<string, ServiceType> = {
      // Consumer map layers
      '5g': '5g',
      'lte': 'lte',
      'lte-advanced': 'lte',
      '3g': '3g_2100',
      '3g_900': '3g_900',
      '2g': '2g',
      'fixed_lte': 'fixed_lte',
      'wireless': 'uncapped_wireless',
      'tarana': 'uncapped_wireless',

      // Business map layers
      'business_fibre': 'fibre',
      'business_wireless': 'licensed_wireless',
      'business_lte': 'fixed_lte',
    };

    const normalized = layerName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return layerMap[normalized] || null;
  }

  /**
   * Infer signal strength from map layer data
   */
  static inferSignalStrength(layerData: any): 'excellent' | 'good' | 'fair' | 'poor' | 'none' {
    // If the layer has specific signal indicators, use them
    if (layerData?.signal) {
      const signal = layerData.signal.toLowerCase();
      if (signal.includes('excellent') || signal.includes('strong')) return 'excellent';
      if (signal.includes('good')) return 'good';
      if (signal.includes('fair') || signal.includes('moderate')) return 'fair';
      if (signal.includes('poor') || signal.includes('weak')) return 'poor';
      return 'none';
    }

    // Default to good if layer is present
    if (layerData?.visible || layerData?.coverage) {
      return 'good';
    }

    return 'none';
  }

  /**
   * Parse map response into standardized coverage result
   */
  static parseMapResponse(
    mapData: any,
    coordinates: Coordinates,
    mapType: MTNMapType
  ): MTNMapCoverageResult {
    const services: MTNMapCoverageResult['services'] = [];

    // Parse layers from map data
    if (mapData.layers && Array.isArray(mapData.layers)) {
      for (const layer of mapData.layers) {
        const serviceType = this.mapLayerToServiceType(layer.name);
        if (!serviceType) continue;

        services.push({
          type: serviceType,
          available: layer.visible && layer.coverage === true,
          signal: this.inferSignalStrength(layer),
          technology: layer.technology || this.getTechnologyName(serviceType),
          layerName: layer.name,
        });
      }
    }

    return {
      coordinates,
      mapType,
      services,
      metadata: {
        capturedAt: new Date().toISOString(),
        mapVersion: mapData.version || 'v3',
        zoomLevel: mapData.zoomLevel,
      },
    };
  }

  /**
   * Get human-readable technology name
   */
  private static getTechnologyName(serviceType: ServiceType): string {
    const techMap: Record<ServiceType, string> = {
      '5g': '5G',
      'lte': 'LTE',
      'fixed_lte': 'Fixed LTE',
      'uncapped_wireless': 'Tarana Wireless G1',
      'licensed_wireless': 'PMP Wireless',
      'fibre': 'FTTB',
      '3g_2100': '3G 2100MHz',
      '3g_900': '3G 900MHz',
      '2g': '2G GSM',
    };
    return techMap[serviceType] || serviceType;
  }

  /**
   * Combine consumer and business map results
   */
  static combineMapResults(
    consumerResult: MTNMapCoverageResult,
    businessResult: MTNMapCoverageResult
  ): CoverageResponse {
    const allServices = new Map<ServiceType, any>();

    // Add consumer services
    for (const service of consumerResult.services) {
      allServices.set(service.type, {
        ...service,
        provider: 'MTN Consumer',
      });
    }

    // Add business services (they may override consumer with better signal)
    for (const service of businessResult.services) {
      const existing = allServices.get(service.type);
      if (!existing || this.compareSignalStrength(service.signal, existing.signal) > 0) {
        allServices.set(service.type, {
          ...service,
          provider: 'MTN Business',
        });
      }
    }

    const services = Array.from(allServices.values());
    const available = services.some((s) => s.available);

    return {
      available,
      coordinates: consumerResult.coordinates,
      confidence: 'high', // Map data is high confidence
      services: services.map((s) => ({
        type: s.type,
        available: s.available,
        signal: s.signal,
        provider: s.provider,
        technology: s.technology,
      })),
      providers: [
        {
          name: 'MTN',
          available,
          services: services.map((s) => ({
            type: s.type,
            available: s.available,
            signal: s.signal,
            provider: s.provider,
            technology: s.technology,
          })),
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Compare signal strengths (returns positive if a > b)
   */
  private static compareSignalStrength(
    a: 'excellent' | 'good' | 'fair' | 'poor' | 'none',
    b: 'excellent' | 'good' | 'fair' | 'poor' | 'none'
  ): number {
    const strength = { excellent: 4, good: 3, fair: 2, poor: 1, none: 0 };
    return strength[a] - strength[b];
  }
}

/**
 * MTN Map Layer Definitions
 * Based on the actual layers available in the MTN coverage maps
 */
export const MTN_MAP_LAYERS = {
  consumer: [
    { id: '5g', name: '5G', serviceType: '5g' as ServiceType, color: '#FF6B35' },
    { id: 'lte', name: 'LTE', serviceType: 'lte' as ServiceType, color: '#F7931E' },
    { id: 'lte_advanced', name: 'LTE Advanced', serviceType: 'lte' as ServiceType, color: '#FDB913' },
    { id: '3g_2100', name: '3G 2100MHz', serviceType: '3g_2100' as ServiceType, color: '#C1D82F' },
    { id: '3g_900', name: '3G 900MHz', serviceType: '3g_900' as ServiceType, color: '#00A99D' },
    { id: '2g', name: '2G', serviceType: '2g' as ServiceType, color: '#00539F' },
  ],
  business: [
    { id: 'business_wireless', name: 'Business Wireless', serviceType: 'uncapped_wireless' as ServiceType, color: '#FF6B35' },
    { id: 'business_lte', name: 'Business LTE', serviceType: 'fixed_lte' as ServiceType, color: '#F7931E' },
    { id: 'business_fibre', name: 'Business Fibre', serviceType: 'fibre' as ServiceType, color: '#00A99D' },
  ],
};
