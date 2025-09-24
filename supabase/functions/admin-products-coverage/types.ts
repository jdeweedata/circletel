/**
 * TypeScript types specific to the admin-products-coverage Edge Function
 *
 * This file contains types for database queries, transformations, and
 * Edge Function-specific logic. It complements the main types in
 * src/types/adminProducts.ts for frontend use.
 *
 * @see src/types/adminProducts.ts for frontend types
 */

// =============================================================================
// Database Query Result Types
// =============================================================================

/**
 * Raw database row from admin_products table
 *
 * Matches the exact database schema for type safety in queries.
 */
export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  category: 'business_fibre' | 'fixed_wireless_business' | 'fixed_wireless_residential';
  service_type: string;
  description: string | null;
  long_description: string | null;
  speed_down: number;
  speed_up: number;
  is_symmetrical: boolean;
  contract_terms: number[];
  status: 'draft' | 'pending' | 'approved' | 'archived';
  version: number;
  is_current: boolean;
  sort_order: number;
  is_featured: boolean;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Raw database row from admin_product_pricing table
 */
export interface AdminProductPricingRow {
  id: string;
  product_id: string;
  price_regular: number;
  price_promo: number | null;
  installation_fee: number;
  hardware_contribution: number;
  router_rental: number;
  is_promotional: boolean;
  promo_start_date: string | null;
  promo_end_date: string | null;
  effective_from: string;
  effective_to: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Raw database row from admin_product_features table
 */
export interface AdminProductFeatureRow {
  id: string;
  product_id: string;
  feature_name: string;
  feature_value: string | null;
  feature_category: string;
  is_highlighted: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * Result from the optimized joined query
 *
 * This represents the shape of data returned from the SQL query that
 * joins products, pricing, and aggregated features.
 */
export interface ProductQueryResult {
  // Product fields
  id: string;
  name: string;
  slug: string;
  category: 'business_fibre' | 'fixed_wireless_business' | 'fixed_wireless_residential';
  service_type: string;
  description: string | null;
  long_description: string | null;
  speed_down: number;
  speed_up: number;
  is_symmetrical: boolean;
  contract_terms: number[];
  status: 'draft' | 'pending' | 'approved' | 'archived';
  version: number;
  is_current: boolean;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;

  // Current pricing fields (from CTE)
  price_regular: number;
  price_promo: number | null;
  installation_fee: number;
  hardware_contribution: number;
  router_rental: number;
  is_promotional: boolean;
  promo_start_date: string | null;
  promo_end_date: string | null;

  // Aggregated features (from CTE)
  features: string[];
}

// =============================================================================
// Technology Mapping Types
// =============================================================================

/**
 * Technology types as they appear in requests
 */
export type TechnologyType = 'FIBRE' | 'FIXED_WIRELESS' | 'LTE';

/**
 * Admin product categories for database filtering
 */
export type AdminProductCategory = 'business_fibre' | 'fixed_wireless_business' | 'fixed_wireless_residential';

/**
 * Technology to category mapping for query filtering
 */
export const TECHNOLOGY_CATEGORY_MAP: Record<TechnologyType, AdminProductCategory[]> = {
  'FIBRE': ['business_fibre'],
  'FIXED_WIRELESS': ['fixed_wireless_business', 'fixed_wireless_residential'],
  'LTE': [] // LTE products not yet implemented in admin system
} as const;

/**
 * Category to technology reverse mapping
 */
export const CATEGORY_TECHNOLOGY_MAP: Record<AdminProductCategory, TechnologyType> = {
  'business_fibre': 'FIBRE',
  'fixed_wireless_business': 'FIXED_WIRELESS',
  'fixed_wireless_residential': 'FIXED_WIRELESS'
} as const;

// =============================================================================
// Transformation Types
// =============================================================================

/**
 * ServicePackage interface - Target transformation format
 *
 * This is the expected output format that matches the frontend interface.
 */
export interface ServicePackage {
  id: string;
  name: string;
  technology: TechnologyType;
  provider: string;
  speed: string;
  price: number;
  originalPrice?: number;
  installation: number;
  originalInstallation?: number;
  router: number;
  originalRouter?: number;
  contract: number;
  features: string[];
  available: boolean;
  isRecommended?: boolean;
  promotionalOffer?: {
    freeInstallation: boolean;
    freeRouter: boolean;
    discountedPrice?: number;
    validUntil?: string;
  };
}

/**
 * Intermediate pricing calculation for transformations
 */
export interface PricingTransformation {
  currentPrice: number;
  originalPrice?: number;
  currentInstallation: number;
  originalInstallation?: number;
  currentRouter: number;
  originalRouter?: number;
  isPromotional: boolean;
  promotionalOffer?: {
    freeInstallation: boolean;
    freeRouter: boolean;
    discountedPrice?: number;
    validUntil?: string;
  };
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Parsed request parameters
 */
export interface ParsedRequest {
  technologies: TechnologyType[];
  coverageArea?: string;
}

/**
 * Successful API response
 */
export interface SuccessResponse {
  success: true;
  data: ServicePackage[];
  meta: {
    count: number;
    technologies: TechnologyType[];
  };
}

/**
 * Error API response
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse = SuccessResponse | ErrorResponse;

// =============================================================================
// Database Configuration Types
// =============================================================================

/**
 * Database client configuration
 */
export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Query filter options for product fetching
 */
export interface ProductQueryFilters {
  categories: AdminProductCategory[];
  includeInactive?: boolean;
  sortBy?: 'sort_order' | 'is_featured' | 'price_regular';
  sortDirection?: 'asc' | 'desc';
  effectiveDate?: string; // ISO date string for pricing effective date
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Query parameter validation schema
 */
export interface QueryValidation {
  technologies: {
    required: true;
    type: 'string';
    pattern: RegExp;
    allowedValues: TechnologyType[];
  };
  coverageArea: {
    required: false;
    type: 'string';
    maxLength: number;
  };
}

/**
 * Environment variable validation schema
 */
export interface EnvironmentValidation {
  SUPABASE_URL: {
    required: true;
    type: 'url';
  };
  SUPABASE_ANON_KEY: {
    required: true;
    type: 'string';
    minLength: number;
  };
}

// =============================================================================
// Error Handling Types
// =============================================================================

/**
 * Standard error codes used by the Edge Function
 */
export const ERROR_CODES = {
  // Request validation errors (4xx)
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_TECHNOLOGY: 'INVALID_TECHNOLOGY',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Server errors (5xx)
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TRANSFORMATION_ERROR: 'TRANSFORMATION_ERROR',
  ENVIRONMENT_ERROR: 'ENVIRONMENT_ERROR'
} as const;

/**
 * Error code type
 */
export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Error details for specific error types
 */
export interface ErrorDetails {
  [ERROR_CODES.INVALID_TECHNOLOGY]: {
    invalidTechnologies: string[];
    validTechnologies: TechnologyType[];
  };
  [ERROR_CODES.DATABASE_ERROR]: {
    query?: string;
    originalError?: string;
  };
  [ERROR_CODES.TRANSFORMATION_ERROR]: {
    productId?: string;
    transformationStep?: string;
    originalError?: string;
  };
  [ERROR_CODES.VALIDATION_ERROR]: {
    field: string;
    value: unknown;
    expectedType: string;
  };
}

// =============================================================================
// Performance Monitoring Types
// =============================================================================

/**
 * Performance metrics for monitoring and optimization
 */
export interface PerformanceMetrics {
  requestStartTime: number;
  databaseQueryTime?: number;
  transformationTime?: number;
  totalResponseTime?: number;
  productCount: number;
  cacheHit?: boolean;
}

/**
 * Logging context for debugging and monitoring
 */
export interface LoggingContext {
  requestId: string;
  timestamp: string;
  technologies: TechnologyType[];
  coverageArea?: string;
  userAgent?: string;
  performance: PerformanceMetrics;
}

// =============================================================================
// Cache Configuration Types
// =============================================================================

/**
 * Cache key generation parameters
 */
export interface CacheKeyParams {
  technologies: TechnologyType[];
  coverageArea?: string;
  effectiveDate: string; // For pricing-sensitive caching
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in seconds (300 = 5 minutes)
  keyPrefix: string;
  enableCompression: boolean;
}

// =============================================================================
// Utility Type Guards
// =============================================================================

/**
 * Type guard to check if a value is a valid technology type
 */
export function isValidTechnologyType(value: string): value is TechnologyType {
  return ['FIBRE', 'FIXED_WIRELESS', 'LTE'].includes(value);
}

/**
 * Type guard to check if promotional pricing is currently valid
 */
export function hasValidPromotionalPricing(
  pricing: Pick<ProductQueryResult, 'is_promotional' | 'price_promo' | 'promo_start_date' | 'promo_end_date'>
): boolean {
  if (!pricing.is_promotional || !pricing.price_promo) return false;
  if (!pricing.promo_start_date || !pricing.promo_end_date) return false;

  const now = new Date();
  const startDate = new Date(pricing.promo_start_date);
  const endDate = new Date(pricing.promo_end_date);

  return startDate <= now && now <= endDate;
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse(response: ApiResponse): response is SuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false;
}