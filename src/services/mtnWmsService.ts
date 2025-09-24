/**
 * MTN WMS Service Client
 *
 * Provides integration with MTN's Web Map Service (WMS) API for real-time
 * 4G/5G coverage data with signal strength information.
 *
 * Features:
 * - WMS GetCapabilities parsing and layer management
 * - GetMap and GetFeatureInfo requests for coverage queries
 * - Coordinate transformation (WGS84 ↔ Web Mercator)
 * - Authentication with session management and token refresh
 * - Rate limiting with exponential backoff retry logic
 * - Signal strength interpretation and package recommendations
 * - Error handling and service availability detection
 */

import type { TechnologyType } from '@/types/adminProducts';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface MTNWMSConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  rateLimitOptions?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay?: number;
  };
  enableSessionManagement?: boolean;
}

export interface MTNWMSCapabilities {
  serviceName: string;
  serviceTitle: string;
  layers: MTNWMSLayer[];
  supportedFormats: string[];
  maxWidth: number;
  maxHeight: number;
}

export interface MTNWMSLayer {
  name: string;
  title: string;
  bounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  supportedCRS: string[];
}

export interface MTNCoverageResult {
  provider: 'MTN';
  technology: '4G' | '5G' | 'LTE';
  signalStrength: number; // 0-100
  speedEstimate: number; // Mbps estimated
  coverageType: 'indoor' | 'outdoor' | 'mixed';
  confidence: number; // 0-100
  hasConcentration: boolean;
  availablePackages: string[];
  coordinates: { lat: number; lng: number };
  timestamp: string;
  notes?: string;
}

interface MTNAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
}

interface MTNFeatureInfo {
  signalStrength?: number;
  technology?: string;
  coverageType?: string;
  speedEstimate?: number;
  confidence?: number;
}

// =============================================================================
// Coordinate Transformation Utilities
// =============================================================================

export class CoordinateTransformer {
  private static readonly SOUTH_AFRICA_BOUNDS = {
    west: 16.0,
    east: 33.0,
    south: -35.0,
    north: -22.0
  };

  /**
   * Convert WGS84 coordinates to Web Mercator (EPSG:3857)
   */
  wgs84ToWebMercator(lat: number, lng: number): { x: number; y: number } {
    const x = lng * 20037508.34 / 180;
    let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;

    return { x, y };
  }

  /**
   * Convert Web Mercator coordinates to WGS84 (EPSG:4326)
   */
  webMercatorToWgs84(x: number, y: number): { lat: number; lng: number } {
    const lng = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);

    return { lat, lng };
  }

  /**
   * Validate if coordinates are within South African bounds
   */
  isValidSouthAfricanCoordinate(lat: number, lng: number): boolean {
    const { west, east, south, north } = CoordinateTransformer.SOUTH_AFRICA_BOUNDS;
    return lng >= west && lng <= east && lat >= south && lat <= north;
  }

  /**
   * Validate coordinate values are numeric and within valid ranges
   */
  isValidCoordinate(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  }
}

// =============================================================================
// Signal Strength Interpretation
// =============================================================================

export class SignalStrengthInterpreter {
  /**
   * Get quality rating from signal strength (0-100)
   */
  getQualityRating(signalStrength: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'No Signal' {
    if (signalStrength >= 80) return 'Excellent';
    if (signalStrength >= 60) return 'Good';
    if (signalStrength >= 40) return 'Fair';
    if (signalStrength >= 20) return 'Poor';
    return 'No Signal';
  }

  /**
   * Estimate speed based on signal strength and technology
   */
  getSpeedEstimate(signalStrength: number, technology: string): number {
    if (signalStrength < 20) return 0;

    // Base speeds by technology at 100% signal
    const maxSpeeds = {
      '4G': 50,   // Mbps
      '5G': 200,  // Mbps
      'LTE': 40   // Mbps
    };

    const maxSpeed = maxSpeeds[technology as keyof typeof maxSpeeds] || 20;

    // Apply signal strength multiplier
    const speedMultiplier = Math.min(signalStrength / 100, 1);
    const estimatedSpeed = maxSpeed * speedMultiplier;

    // Add some randomness to simulate real-world variations (±20%)
    const variance = 0.2;
    const randomFactor = 1 + (Math.random() - 0.5) * variance;

    return Math.round(estimatedSpeed * randomFactor);
  }

  /**
   * Get recommended MTN packages based on signal strength and technology
   */
  getRecommendedPackages(signalStrength: number, technology: string): string[] {
    if (signalStrength < 20) return [];

    const packages: Record<string, string[]> = {
      '4G': [
        'MTN Business 4G 10GB',
        'MTN Business 4G 25GB',
        'MTN Business 4G 50GB',
        'MTN Business 4G 100GB',
        'MTN Business 4G Unlimited'
      ],
      '5G': [
        'MTN Business 5G 25GB',
        'MTN Business 5G 50GB',
        'MTN Business 5G 100GB',
        'MTN Business 5G 200GB',
        'MTN Business 5G Unlimited'
      ],
      'LTE': [
        'MTN Business LTE 5GB',
        'MTN Business LTE 10GB',
        'MTN Business LTE 25GB',
        'MTN Business LTE 50GB'
      ]
    };

    const techPackages = packages[technology] || packages['4G'];

    // Recommend packages based on signal quality
    if (signalStrength >= 80) {
      return techPackages; // All packages
    } else if (signalStrength >= 60) {
      return techPackages.slice(0, -1); // Exclude unlimited
    } else if (signalStrength >= 40) {
      return techPackages.slice(0, 3); // Basic and mid-tier
    } else {
      return techPackages.slice(0, 2); // Basic packages only
    }
  }
}

// =============================================================================
// MTN WMS Service Implementation
// =============================================================================

export class MTNWMSService {
  private config: MTNWMSConfig;
  private transformer: CoordinateTransformer;
  private interpreter: SignalStrengthInterpreter;
  private authSession: MTNAuthSession | null = null;
  private capabilities: MTNWMSCapabilities | null = null;

  constructor(config: MTNWMSConfig) {
    this.config = {
      timeout: 10000,
      rateLimitOptions: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      enableSessionManagement: true,
      ...config
    };

    this.transformer = new CoordinateTransformer();
    this.interpreter = new SignalStrengthInterpreter();
  }

  // =============================================================================
  // Public API Methods
  // =============================================================================

  /**
   * Get API key (for testing purposes)
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Get base URL (for testing purposes)
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Retrieve and parse WMS capabilities
   */
  async getCapabilities(): Promise<MTNWMSCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const url = `${this.config.baseUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;

    try {
      const response = await this.makeRequest(url);
      const xmlText = await response.text();

      this.capabilities = this.parseCapabilities(xmlText);
      return this.capabilities;
    } catch (error) {
      console.error('Failed to get WMS capabilities:', error);
      throw new Error('Failed to retrieve MTN WMS capabilities');
    }
  }

  /**
   * Check coverage at specified coordinates for given technology
   */
  async checkCoverage(
    lat: number,
    lng: number,
    technology: '4G' | '5G' | 'LTE' = '4G'
  ): Promise<MTNCoverageResult> {
    // Validate coordinates
    if (!this.transformer.isValidCoordinate(lat, lng)) {
      throw new Error('Invalid coordinate values');
    }

    if (!this.transformer.isValidSouthAfricanCoordinate(lat, lng)) {
      throw new Error('Coordinates outside South African bounds');
    }

    try {
      const featureInfo = await this.getFeatureInfo(lat, lng, technology);
      return this.buildCoverageResult(lat, lng, technology, featureInfo);
    } catch (error) {
      console.error(`MTN coverage check failed for ${technology} at ${lat}, ${lng}:`, error);

      // Return fallback result instead of throwing
      return this.buildFallbackResult(lat, lng, technology, error);
    }
  }

  // =============================================================================
  // Private Implementation Methods
  // =============================================================================

  /**
   * Make authenticated HTTP request with retry logic
   */
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const { maxRetries, baseDelay, maxDelay } = this.config.rateLimitOptions!;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
          ...options.headers as Record<string, string>
        };

        const requestOptions: RequestInit = {
          ...options,
          headers,
          signal: AbortSignal.timeout(this.config.timeout!)
        };

        const response = await fetch(url, requestOptions);

        if (response.status === 401 || response.status === 403) {
          // Clear session and retry with fresh token
          this.authSession = null;
          if (attempt < maxRetries) {
            continue;
          }
          throw new Error('Authentication failed');
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;

      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay || 10000);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    // For simplicity, we'll use the API key as the token
    // In a real implementation, this would handle OAuth flow

    if (!this.config.enableSessionManagement) {
      return this.config.apiKey;
    }

    if (this.authSession && this.authSession.expiresAt > Date.now()) {
      return this.authSession.accessToken;
    }

    // Mock session creation (in real implementation, this would call OAuth endpoint)
    this.authSession = {
      accessToken: `session_${this.config.apiKey}_${Date.now()}`,
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
      tokenType: 'Bearer'
    };

    return this.authSession.accessToken;
  }

  /**
   * Parse WMS GetCapabilities XML response
   */
  private parseCapabilities(xmlText: string): MTNWMSCapabilities {
    // For production, use a proper XML parser like DOMParser
    // This is a simplified implementation for demo purposes

    const capabilities: MTNWMSCapabilities = {
      serviceName: 'MTN Coverage WMS',
      serviceTitle: 'MTN Network Coverage Maps',
      layers: [],
      supportedFormats: ['image/png', 'image/jpeg'],
      maxWidth: 2048,
      maxHeight: 2048
    };

    // Extract layer information using regex (simplified)
    const layerPattern = /<Layer[^>]*>[\s\S]*?<Name>([^<]+)<\/Name>[\s\S]*?<Title>([^<]+)<\/Title>[\s\S]*?<\/Layer>/g;
    let match;

    while ((match = layerPattern.exec(xmlText)) !== null) {
      const [, name, title] = match;

      capabilities.layers.push({
        name: name.trim(),
        title: title.trim(),
        bounds: {
          west: 16.0,
          east: 33.0,
          south: -35.0,
          north: -22.0
        },
        supportedCRS: ['EPSG:4326', 'EPSG:3857']
      });
    }

    return capabilities;
  }

  /**
   * Get feature information for specific coordinates and technology
   */
  private async getFeatureInfo(
    lat: number,
    lng: number,
    technology: string
  ): Promise<MTNFeatureInfo> {
    const layerName = `mtn:${technology.toLowerCase()}_coverage`;

    // Convert to Web Mercator for WMS request
    const { x, y } = this.transformer.wgs84ToWebMercator(lat, lng);

    // Build GetFeatureInfo URL
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      REQUEST: 'GetFeatureInfo',
      VERSION: '1.3.0',
      LAYERS: layerName,
      QUERY_LAYERS: layerName,
      FORMAT: 'image/png',
      INFO_FORMAT: 'application/xml',
      WIDTH: '101',
      HEIGHT: '101',
      CRS: 'EPSG:3857',
      BBOX: `${x-1000},${y-1000},${x+1000},${y+1000}`,
      I: '50', // X pixel coordinate
      J: '50'  // Y pixel coordinate
    });

    const url = `${this.config.baseUrl}?${params.toString()}`;

    const response = await this.makeRequest(url);
    const xmlText = await response.text();

    return this.parseFeatureInfo(xmlText);
  }

  /**
   * Parse WMS GetFeatureInfo XML response
   */
  private parseFeatureInfo(xmlText: string): MTNFeatureInfo {
    const featureInfo: MTNFeatureInfo = {};

    // Extract field values using regex (simplified XML parsing)
    const fieldPattern = /<FIELD\s+name="([^"]+)"\s+value="([^"]+)"/g;
    let match;

    while ((match = fieldPattern.exec(xmlText)) !== null) {
      const [, name, value] = match;

      switch (name) {
        case 'signal_strength':
          featureInfo.signalStrength = parseInt(value, 10);
          break;
        case 'technology':
          featureInfo.technology = value;
          break;
        case 'coverage_type':
          featureInfo.coverageType = value;
          break;
        case 'speed_estimate':
          featureInfo.speedEstimate = parseFloat(value);
          break;
        case 'confidence':
          featureInfo.confidence = parseInt(value, 10);
          break;
      }
    }

    return featureInfo;
  }

  /**
   * Build coverage result from feature info
   */
  private buildCoverageResult(
    lat: number,
    lng: number,
    technology: '4G' | '5G' | 'LTE',
    featureInfo: MTNFeatureInfo
  ): MTNCoverageResult {
    const signalStrength = featureInfo.signalStrength || 0;
    const hasConcentration = signalStrength >= 20;

    const speedEstimate = featureInfo.speedEstimate ||
      this.interpreter.getSpeedEstimate(signalStrength, technology);

    const availablePackages = hasConcentration
      ? this.interpreter.getRecommendedPackages(signalStrength, technology)
      : [];

    return {
      provider: 'MTN',
      technology,
      signalStrength,
      speedEstimate,
      coverageType: (featureInfo.coverageType as string) || 'mixed',
      confidence: featureInfo.confidence || (hasConcentration ? 80 : 10),
      hasConcentration,
      availablePackages,
      coordinates: { lat, lng },
      timestamp: new Date().toISOString(),
      notes: hasConcentration
        ? `${this.interpreter.getQualityRating(signalStrength)} ${technology} signal available`
        : `Limited ${technology} coverage in this area`
    };
  }

  /**
   * Build fallback result when service is unavailable
   */
  private buildFallbackResult(
    lat: number,
    lng: number,
    technology: '4G' | '5G' | 'LTE',
    error: Error | unknown
  ): MTNCoverageResult {
    const isServiceError = error.message?.includes('Service unavailable') ||
                          error.message?.includes('timeout');

    const notes = isServiceError
      ? 'MTN coverage service temporarily unavailable'
      : error.message?.includes('Invalid response format')
      ? 'Invalid response format from MTN service'
      : 'Unable to check MTN coverage at this time';

    return {
      provider: 'MTN',
      technology,
      signalStrength: 0,
      speedEstimate: 0,
      coverageType: 'mixed',
      confidence: 0,
      hasConcentration: false,
      availablePackages: [],
      coordinates: { lat, lng },
      timestamp: new Date().toISOString(),
      notes
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Factory Function and Default Export
// =============================================================================

/**
 * Create MTN WMS Service instance with environment configuration
 */
export function createMTNWMSService(): MTNWMSService {
  const apiKey = import.meta.env.VITE_MTN_WMS_API_KEY;
  const baseUrl = import.meta.env.VITE_MTN_WMS_BASE_URL || 'https://coverage.mtn.co.za/wms';

  if (!apiKey) {
    throw new Error('MTN WMS API key not configured. Set VITE_MTN_WMS_API_KEY environment variable.');
  }

  return new MTNWMSService({
    apiKey,
    baseUrl,
    timeout: 15000,
    rateLimitOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000
    },
    enableSessionManagement: true
  });
}

// Export singleton instance for application use
export const mtnWmsService = createMTNWMSService();