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
  baseUrl?: string;
  authMethod?: 'none' | 'api_key' | 'oauth' | 'bearer' | 'sso';
  apiKey?: string;
  authToken?: string;
  rateLimitRpm?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  customHeaders?: Record<string, string>;
  endpoints?: {
    feasibility?: string;
    products?: string;
    coverage?: string;
    availability?: string;
  };
}

export interface SSOConfiguration {
  enabled: boolean;
  loginUrl: string;
  casTicket: string | null;
  expiryTimestamp: string | null;
  autoRefreshEnabled: boolean;
  autoRefreshCron: string;
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
  data?: unknown;
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
  api_config?: Record<string, unknown>; // JSON
  static_config?: Record<string, unknown>; // JSON
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
  metadata?: Record<string, unknown>; // JSON
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
  dimensions?: { width: number; height: number }; // JSON
  created_at: string;
}

// New interfaces for provider management system

export interface ProviderApiLog {
  id: string;
  providerId: string;
  endpointType: 'feasibility' | 'products' | 'coverage' | 'availability';
  requestUrl: string;
  requestMethod: string;
  requestHeaders?: Record<string, unknown>;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  responseTimeMs?: number;
  success: boolean;
  errorMessage?: string;
  errorCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  createdAt: string;
}

export interface ProviderApiLogRow {
  id: string;
  provider_id: string;
  endpoint_type: 'feasibility' | 'products' | 'coverage' | 'availability';
  request_url: string;
  request_method: string;
  request_headers?: Record<string, unknown>;
  request_body?: Record<string, unknown>;
  response_status?: number;
  response_body?: Record<string, unknown>;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  error_code?: string;
  coordinates?: unknown; // PostGIS GEOGRAPHY type
  address?: string;
  created_at: string;
}

export interface ProviderConfigurationSetting {
  id: string;
  settingKey: string;
  settingValue: Record<string, unknown>;
  description?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfigurationRow {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderHealthMetrics {
  successRate24h: number;
  avgResponseTime24h: number;
  healthStatus: 'healthy' | 'degraded' | 'down' | 'untested';
  lastHealthCheck?: string;
  lastSuccessfulCheck?: string;
}

// Enhanced NetworkProviderRow with new health and config fields
export interface EnhancedNetworkProviderRow extends NetworkProviderRow {
  api_config?: Record<string, unknown>;
  static_config?: Record<string, unknown>;
  sso_config?: Record<string, unknown>;
  last_health_check?: string;
  health_status?: 'healthy' | 'degraded' | 'down' | 'untested';
  success_rate_24h?: number;
  avg_response_time_24h?: number;
  last_successful_check?: string;
}

// Enhanced NetworkProvider with new fields
export interface EnhancedNetworkProvider extends NetworkProvider {
  ssoConfig?: SSOConfiguration;
  healthMetrics?: ProviderHealthMetrics;
}

// API request/response types for provider management endpoints
export interface CreateProviderRequest {
  name: string;
  displayName: string;
  type: 'api' | 'static';
  description?: string;
  website?: string;
  supportContact?: string;
  apiConfig?: ApiConfiguration;
  staticConfig?: StaticConfiguration;
  ssoConfig?: SSOConfiguration;
  serviceTypes: ServiceType[];
  priority: number;
}

export interface UpdateProviderRequest {
  id: string;
  displayName?: string;
  enabled?: boolean;
  description?: string;
  website?: string;
  supportContact?: string;
  apiConfig?: ApiConfiguration;
  staticConfig?: StaticConfiguration;
  ssoConfig?: SSOConfiguration;
  serviceTypes?: ServiceType[];
  priority?: number;
}

export interface TestProviderRequest {
  providerId: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  productNames?: string[]; // For feasibility APIs
  endpointType?: 'feasibility' | 'products' | 'coverage' | 'availability';
}

export interface TestProviderResponse {
  success: boolean;
  providerId: string;
  providerName: string;
  requestDetails: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: Record<string, unknown>;
  };
  responseDetails: {
    status: number;
    body: Record<string, unknown>;
    timeMs: number;
  };
  error?: string;
  timestamp: string;
}

export interface ProviderPerformanceMetrics {
  providerId: string;
  providerName: string;
  period: '24h' | '7d' | '30d';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorBreakdown: {
    errorType: string;
    count: number;
  }[];
  geographicDistribution?: {
    province: string;
    count: number;
  }[];
}

export interface MTNWholesaleConfig {
  baseUrl: string;
  apiKey: string;
  enabledProducts: string[];
  ssoConfig: SSOConfiguration;
}

export interface MTNWholesaleTestRequest {
  address: string;
  productNames: string[];
}

export interface RefreshSSOSessionRequest {
  providerId: string;
}

export interface RefreshSSOSessionResponse {
  success: boolean;
  casTicket: string;
  expiryTimestamp: string;
  error?: string;
}