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