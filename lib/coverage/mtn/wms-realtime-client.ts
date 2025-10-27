// MTN GeoServer WMS Real-time Coverage Client
// This client queries the live MTN WMS service for coverage checking
// Based on analysis of https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html

import { Coordinates, ServiceType, CoverageCheckResult } from '../types';

export interface WMSGetFeatureInfoRequest {
  coordinates: Coordinates;
  layers: string[];
  buffer?: number; // pixels around point to search
}

export interface WMSFeatureInfo {
  type: string;
  id: string;
  geometry: any;
  properties: Record<string, any>;
}

export interface WMSGetFeatureInfoResponse {
  type: 'FeatureCollection';
  features: WMSFeatureInfo[];
  totalFeatures: number;
  numberMatched: number;
  numberReturned: number;
  timeStamp: string;
  crs: {
    type: string;
    properties: { name: string };
  };
}

/**
 * MTN WMS Layer Configuration
 * Discovered from https://mtnsi.mtn.co.za/cache/geoserver/GetMapConfiguration.json
 */
export const MTN_WMS_LAYERS = {
  UNCAPPED_WIRELESS: {
    layerId: 'UncappedWirelessEBU',
    wmsLayer: 'mtnsi:MTNSA-Coverage-Tarana',
    wmsStyle: 'MTN-Coverage-UWA-EBU',
    label: 'Uncapped Wireless',
    serviceType: 'uncapped_wireless' as ServiceType
  },
  FIXED_LTE: {
    layerId: 'FLTECoverageEBU',
    wmsLayer: 'mtnsi:MTNSA-Coverage-FIXLTE-EBU-0',
    wmsStyle: 'MTNSA-Coverage-FIXLTE-EBU-0',
    label: 'Fixed LTE',
    serviceType: 'fixed_lte' as ServiceType
  },
  FIBRE: {
    layerId: 'FTTBCoverage',
    wmsLayer: 'mtnsi:MTN-FTTB-Feasible',
    wmsStyle: 'MTN-FTTB-Feasible',
    label: 'Fibre',
    serviceType: 'fibre' as ServiceType
  },
  LICENSED_WIRELESS: {
    layerId: 'PMPCoverage',
    wmsLayer: 'mtnsi:MTN-PMP-Feasible-Integrated',
    wmsStyle: 'MTN-PMP-Feasible-Integrated',
    label: 'Licensed Wireless',
    serviceType: 'licensed_wireless' as ServiceType
  }
} as const;

export class MTNWMSRealtimeClient {
  private static readonly BASE_URL = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';
  private static readonly QUERY_LAYER = 'mtnsi:OSM South Africa';
  private static readonly SRS = 'EPSG:900913'; // Web Mercator
  private static readonly TILE_SIZE = 256;
  private static readonly DEFAULT_ZOOM = 14;

  /**
   * Check coverage at specific coordinates using WMS GetFeatureInfo
   * Optimized with parallel queries and timeout controls
   */
  static async checkCoverage(
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<{
    available: boolean;
    services: Array<{
      type: ServiceType;
      available: boolean;
      layerData?: any;
    }>;
  }> {
    const layersToCheck = serviceTypes
      ? this.getLayersForServiceTypes(serviceTypes)
      : Object.values(MTN_WMS_LAYERS);

    // Optimization: Add timeout wrapper for each query
    const queryWithTimeout = (layer: typeof MTN_WMS_LAYERS[keyof typeof MTN_WMS_LAYERS]) => {
      return Promise.race([
        this.queryLayer(coordinates, layer.wmsLayer),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 8000)
        )
      ]);
    };

    const results = await Promise.allSettled(
      layersToCheck.map(layer => queryWithTimeout(layer))
    );

    const services = layersToCheck.map((layer, index) => {
      const result = results[index];

      if (result.status === 'fulfilled' && result.value) {
        return {
          type: layer.serviceType,
          available: result.value.features.length > 0,
          layerData: result.value.features[0]?.properties
        };
      }

      return {
        type: layer.serviceType,
        available: false
      };
    });

    return {
      available: services.some(s => s.available),
      services
    };
  }

  /**
   * Query specific WMS layer for coverage at coordinates
   * FIXED: Now queries the actual coverage layer instead of OSM base layer
   */
  private static async queryLayer(
    coordinates: Coordinates,
    wmsLayer: string
  ): Promise<WMSGetFeatureInfoResponse | null> {
    try {
      const bbox = this.calculateBBox(coordinates, this.DEFAULT_ZOOM);
      const pixelCoords = this.latLngToPixel(coordinates, bbox);

      // CRITICAL FIX: Query the actual coverage layer, not the OSM base layer
      const params = new URLSearchParams({
        service: 'WMS',
        version: '1.3.0',
        request: 'GetFeatureInfo',
        layers: wmsLayer, // Use the actual coverage layer
        query_layers: wmsLayer, // Query the coverage layer, not OSM
        feature_count: '100',
        srs: this.SRS,
        bbox: bbox.join(','),
        width: this.TILE_SIZE.toString(),
        height: this.TILE_SIZE.toString(),
        i: pixelCoords.x.toString(),
        j: pixelCoords.y.toString(),
        info_format: 'application/json'
      });

      const url = `${this.BASE_URL}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.mtn.co.za/',
          'Origin': 'https://www.mtn.co.za'
        },
        cache: 'no-cache' // Always get fresh coverage data
      });

      if (!response.ok) {
        console.error(`WMS query failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data as WMSGetFeatureInfoResponse;

    } catch (error) {
      console.error(`Error querying WMS layer ${wmsLayer}:`, error);
      return null;
    }
  }

  /**
   * Calculate bounding box for tile at given coordinates and zoom level
   * Returns [minx, miny, maxx, maxy] in EPSG:900913 projection
   */
  private static calculateBBox(coordinates: Coordinates, zoom: number): number[] {
    // Convert lat/lng to Web Mercator (EPSG:900913)
    const x = coordinates.lng * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + coordinates.lat) * Math.PI / 360)) / (Math.PI / 180);
    const yMercator = y * 20037508.34 / 180;

    // Calculate tile extent at zoom level
    const resolution = 156543.03392804097 / Math.pow(2, zoom);
    const halfExtent = (this.TILE_SIZE * resolution) / 2;

    return [
      x - halfExtent,  // minx
      yMercator - halfExtent,  // miny
      x + halfExtent,  // maxx
      yMercator + halfExtent   // maxy
    ];
  }

  /**
   * Convert lat/lng to pixel coordinates within tile
   */
  private static latLngToPixel(
    coordinates: Coordinates,
    bbox: number[]
  ): { x: number; y: number } {
    const x = coordinates.lng * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + coordinates.lat) * Math.PI / 360)) / (Math.PI / 180);
    const yMercator = y * 20037508.34 / 180;

    // Calculate pixel position within tile
    const pixelX = Math.floor(
      ((x - bbox[0]) / (bbox[2] - bbox[0])) * this.TILE_SIZE
    );
    const pixelY = Math.floor(
      ((bbox[3] - yMercator) / (bbox[3] - bbox[1])) * this.TILE_SIZE
    );

    return { x: pixelX, y: pixelY };
  }

  /**
   * Get WMS layers for specific service types
   */
  private static getLayersForServiceTypes(serviceTypes: ServiceType[]) {
    return Object.values(MTN_WMS_LAYERS).filter(layer =>
      serviceTypes.includes(layer.serviceType)
    );
  }

  /**
   * Get map tile URL for visualization
   */
  static getMapTileUrl(
    coordinates: Coordinates,
    serviceType: ServiceType,
    zoom: number = this.DEFAULT_ZOOM
  ): string {
    const layer = this.getLayerForServiceType(serviceType);
    if (!layer) {
      throw new Error(`Unknown service type: ${serviceType}`);
    }

    const bbox = this.calculateBBox(coordinates, zoom);

    const params = new URLSearchParams({
      service: 'WMS',
      version: '1.3.0',
      request: 'GetMap',
      layers: layer.wmsLayer,
      styles: layer.wmsStyle,
      srs: this.SRS,
      bbox: bbox.join(','),
      width: this.TILE_SIZE.toString(),
      height: this.TILE_SIZE.toString(),
      format: 'image/png',
      transparent: 'true'
    });

    return `${this.BASE_URL}?${params.toString()}`;
  }

  /**
   * Get layer configuration for service type
   */
  private static getLayerForServiceType(serviceType: ServiceType) {
    return Object.values(MTN_WMS_LAYERS).find(
      layer => layer.serviceType === serviceType
    );
  }
}

// Export for convenience
export const mtnWMSRealtimeClient = MTNWMSRealtimeClient;