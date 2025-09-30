// Coverage Provider Type Definitions

export interface NetworkProvider {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  type: 'api' | 'static';
  logo?: string;
  description?: string;
  website?: string;
  supportContact?: string;
  apiConfig?: ApiConfiguration;
  staticConfig?: StaticConfiguration;
  serviceTypes: ServiceType[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  coverageFiles?: CoverageFile[];
}

export interface ApiConfiguration {
  baseUrl: string;
  authMethod: 'none' | 'api_key' | 'oauth' | 'bearer';
  apiKey?: string;
  authToken?: string;
  rateLimitRpm: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  customHeaders?: Record<string, string>;
  endpoints: {
    coverage?: string;
    packages?: string;
    availability?: string;
  };
}

export interface StaticConfiguration {
  kmlFiles: CoverageFile[];
  kmzFiles: CoverageFile[];
  coverageAreas: string[];
  fallbackBehavior: 'none' | 'approximate' | 'redirect';
  lastUpdated?: string;
}

export interface CoverageFile {
  id: string;
  filename: string;
  originalName: string;
  type: 'kml' | 'kmz';
  providerId: string;
  uploadDate: string;
  fileSize: number;
  filePath: string;
  coverageAreas: string[];
  serviceTypes: ServiceType[];
  metadata?: {
    boundingBox?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    featureCount?: number;
    description?: string;
    author?: string;
    version?: string;
  };
  status: 'uploaded' | 'processing' | 'active' | 'error';
  errorMessage?: string;
}

export interface ProviderLogo {
  id: string;
  providerId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadDate: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface ProviderConfiguration {
  globalSettings: {
    defaultTimeoutMs: number;
    defaultRateLimitRpm: number;
    cacheTtlSeconds: number;
    retryAttempts: number;
    retryDelayMs: number;
    enableStaticFallback: boolean;
  };
  securitySettings: {
    enableCors: boolean;
    enableRateLimit: boolean;
    enableApiLogging: boolean;
    allowedOrigins: string[];
    maxRequestsPerHour: number;
  };
  geographicSettings: {
    defaultCountryCode: string;
    coordinatePrecision: number;
    boundingBox: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
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
  | '3g'
  | '2g'
  | 'satellite'
  | 'microwave'
  | 'dsl'
  | 'cable';

export interface ProviderApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
  providerId: string;
  responseTime: number;
  fromCache: boolean;
}

export interface CoverageCheckRequest {
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  providers?: string[];
  serviceTypes?: ServiceType[];
  includeSignalStrength?: boolean;
  includeFallback?: boolean;
}

export interface CoverageCheckResponse {
  success: boolean;
  data?: {
    coordinates: {
      lat: number;
      lng: number;
    };
    providers: ProviderCoverageResult[];
    aggregatedServices: ServiceAvailability[];
    recommendations: ServiceRecommendation[];
    location?: {
      province?: string;
      nearestCity?: string;
      distanceToMajorCity?: number;
      populationDensityArea?: 'urban' | 'suburban' | 'rural';
    };
    metadata: {
      requestId: string;
      timestamp: string;
      processingTimeMs: number;
      sourcesUsed: ('api' | 'static' | 'cache')[];
    };
  };
  error?: string;
  code?: string;
}

export interface ProviderCoverageResult {
  providerId: string;
  providerName: string;
  success: boolean;
  responseTime: number;
  source: 'api' | 'static' | 'cache';
  services: ServiceAvailability[];
  error?: string;
  lastUpdated?: string;
}

export interface ServiceAvailability {
  type: ServiceType;
  available: boolean;
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  signalValue?: number; // 0-100
  technology?: string;
  maxSpeed?: {
    download: number;
    upload: number;
    unit: 'mbps' | 'gbps';
  };
  confidence: 'high' | 'medium' | 'low';
  provider: string;
  source: 'api' | 'static';
}

export interface ServiceRecommendation {
  serviceType: ServiceType;
  provider: string;
  score: number; // 0-100
  reasons: string[];
  pricing?: {
    monthly: number;
    setup: number;
    currency: string;
  };
  features: string[];
}

// Database schema interfaces
export interface NetworkProviderRow {
  id: string;
  name: string;
  display_name: string;
  enabled: boolean;
  type: 'api' | 'static';
  logo_id?: string;
  description?: string;
  website?: string;
  support_contact?: string;
  api_config?: any; // JSON
  static_config?: any; // JSON
  service_types: string[]; // Array of ServiceType
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CoverageFileRow {
  id: string;
  filename: string;
  original_name: string;
  type: 'kml' | 'kmz';
  provider_id: string;
  file_path: string;
  file_size: number;
  coverage_areas: string[];
  service_types: string[];
  metadata?: any; // JSON
  status: 'uploaded' | 'processing' | 'active' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderLogoRow {
  id: string;
  provider_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  dimensions?: any; // JSON
  created_at: string;
}