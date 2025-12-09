// General Coverage Types for CircleTel
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CoverageCheckRequest {
  address?: string;
  coordinates?: Coordinates;
  serviceTypes?: ServiceType[];
  providers?: CoverageProvider[];
}

export interface CoverageCheckResult {
  available: boolean;
  coordinates: Coordinates;
  address?: string;
  confidence: 'high' | 'medium' | 'low';
  services: ServiceCoverage[];
  providers: ProviderCoverage[];
  lastUpdated: string;
  metadata?: {
    source?: string;
    endpoint?: string;
    phase?: string;
    note?: string;
    error?: string;
    infrastructureEstimatorAvailable?: boolean;
    wholesaleFallbackUsed?: boolean;
    coverageType?: string;
    buildingId?: string;
    distance?: number;
    installationEstimate?: any;
    productsAvailable?: number;
  };
}

export interface CoverageCheckResponse {
  success: boolean;
  data?: CoverageCheckResult;
  error?: string;
  code?: string;
}

// Alias for backwards compatibility
export type CoverageResponse = CoverageCheckResult;

export interface ServiceCoverage {
  type: ServiceType;
  available: boolean;
  signal: SignalStrength;
  provider: string;
  technology?: string;
  estimatedSpeed?: {
    download: number;
    upload: number;
    unit: 'Mbps' | 'Gbps';
  };
}

export interface ProviderCoverage {
  name: string;
  available: boolean;
  services: ServiceCoverage[];
}

export type ServiceType =
  | 'fibre'
  | 'fixed_lte'
  | 'uncapped_wireless'
  | 'licensed_wireless'
  | '5g'
  | 'lte'
  | '3g_900'
  | '3g_2100'
  | '2g';

export type SignalStrength =
  | 'excellent'  // 90-100%
  | 'good'       // 70-89%
  | 'fair'       // 50-69%
  | 'poor'       // 30-49%
  | 'none';      // 0-29%

export type CoverageProvider = 'mtn' | 'dfa' | 'openserve' | 'vodacom' | 'telkom' | 'cell_c';

export interface CoverageArea {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: Coordinates;
  radius?: number; // in meters
}

export interface CoverageLayer {
  id: string;
  name: string;
  type: ServiceType;
  visible: boolean;
  opacity: number;
  color: string;
  provider: CoverageProvider;
}

// Provider interface for coverage checking
export interface ICoverageProvider {
  name: CoverageProvider;
  getSupportedServices(): ServiceType[];
  checkCoverage(request: CoverageCheckRequest): Promise<CoverageCheckResponse>;
  getAvailableLayers(): CoverageLayer[];
}

// Coverage cache interface
export interface CoverageCache {
  key: string;
  data: CoverageCheckResponse;
  expiresAt: Date;
  createdAt: Date;
}

// Coverage API error types
export class CoverageError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CoverageError';
  }
}

export type CoverageErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_COORDINATES'
  | 'INVALID_ADDRESS'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PARSING_ERROR'
  | 'NETWORK_ERROR';

// ============================================
// Tarana Base Station Types (SkyFibre Coverage)
// ============================================

/**
 * Coverage confidence levels based on base station proximity
 * - high: <3km with >10 active connections
 * - medium: <3km with 5-10 connections OR 3-5km with >5 connections
 * - low: 3-5km with <5 connections (may require elevated install)
 * - none: >5km from any base station
 */
export type BaseStationCoverageConfidence = 'high' | 'medium' | 'low' | 'none';

/**
 * Tarana base station data from BN-Report
 */
export interface TaranaBaseStation {
  id: string;
  serial_number: string;
  hostname: string;
  site_name: string;
  active_connections: number;
  market: string;
  lat: number;
  lng: number;
  distance_km: number;
}

/**
 * Result of base station proximity check for SkyFibre coverage validation
 */
export interface BaseStationProximityResult {
  /** Whether the location has Tarana coverage */
  hasCoverage: boolean;
  /** Coverage confidence based on distance and base station activity */
  confidence: BaseStationCoverageConfidence;
  /** Whether elevated antenna (10m+) is likely required */
  requiresElevatedInstall: boolean;
  /** Installation note to display to user */
  installationNote: string | null;
  /** Nearest base station details */
  nearestStation: {
    siteName: string;
    hostname: string;
    distanceKm: number;
    activeConnections: number;
    market: string;
  } | null;
  /** All nearby base stations (up to limit) */
  allNearbyStations: TaranaBaseStation[];
  /** Query metadata */
  metadata: {
    checkedAt: string;
    coordinatesUsed: Coordinates;
    stationsChecked: number;
  };
}