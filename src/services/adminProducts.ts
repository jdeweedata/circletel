/**
 * Admin Products Service
 *
 * Service layer for fetching admin products via the Edge Function.
 * Integrates with React Query for caching and provides clean API for components.
 *
 * @see specs/001-admin-products-integration/contracts/admin-products-coverage-api.yaml
 */

import type {
  TechnologyType,
  AdminProductsCoverageApiResponse,
  AdminProductsCoverageRequest,
  ServicePackage,
  isSuccessResponse,
  isErrorResponse
} from '@/types/adminProducts';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Edge Function configuration
 */
const EDGE_FUNCTION_CONFIG = {
  // Use the deployed Edge Function URL
  baseUrl: 'https://agyjovdugmtopasyvlng.supabase.co/functions/v1',
  functionName: 'admin-products-coverage',
  defaultTimeout: 10000, // 10 seconds
  retryAttempts: 2,
  retryDelay: 1000 // 1 second
} as const;

/**
 * Cache configuration following research.md recommendations
 */
export const CACHE_CONFIG = {
  // Cache TTL in milliseconds (5 minutes as per research.md)
  ttl: 5 * 60 * 1000,
  // Stale time (use cached data for 4 minutes, then refetch in background)
  staleTime: 4 * 60 * 1000,
  // Cache key prefix for React Query
  keyPrefix: 'admin-products'
} as const;

// =============================================================================
// Cache Key Generation
// =============================================================================

/**
 * Generate React Query cache key for admin products
 *
 * Pattern: admin-products-{technologies}-{coverageArea}
 * Example: admin-products-FIBRE,FIXED_WIRELESS-johannesburg-north
 */
export function generateCacheKey(
  technologies: TechnologyType[],
  coverageArea?: string
): string[] {
  // Sort technologies for consistent cache keys
  const sortedTechs = [...technologies].sort().join(',');
  const baseKey = `${CACHE_CONFIG.keyPrefix}-${sortedTechs}`;

  if (coverageArea) {
    return [baseKey, coverageArea];
  }

  return [baseKey];
}

/**
 * Generate cache key for all admin products (used for invalidation)
 */
export function generateGlobalCacheKey(): string[] {
  return [CACHE_CONFIG.keyPrefix];
}

// =============================================================================
// API Client
// =============================================================================

/**
 * Admin Products API Error class
 */
export class AdminProductsApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AdminProductsApiError';
  }
}

/**
 * Network timeout error
 */
export class AdminProductsTimeoutError extends AdminProductsApiError {
  constructor(timeoutMs: number) {
    super(
      'TIMEOUT_ERROR',
      `Request timed out after ${timeoutMs}ms`,
      { timeoutMs }
    );
  }
}

/**
 * Make HTTP request to Edge Function with timeout and retry logic
 */
async function makeRequest(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = EDGE_FUNCTION_CONFIG.defaultTimeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AdminProductsTimeoutError(timeoutMs);
    }

    throw error;
  }
}

/**
 * Core API client for admin products Edge Function
 */
export class AdminProductsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = EDGE_FUNCTION_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch admin products from Edge Function
   */
  async fetchProducts(
    request: AdminProductsCoverageRequest
  ): Promise<ServicePackage[]> {
    console.log('AdminProductsApiClient: Fetching products', request);

    // Build query parameters
    const searchParams = new URLSearchParams();
    searchParams.set('technologies', request.technologies.join(','));

    if (request.coverageArea) {
      searchParams.set('coverageArea', request.coverageArea);
    }

    const url = `${this.baseUrl}/${EDGE_FUNCTION_CONFIG.functionName}?${searchParams.toString()}`;

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= EDGE_FUNCTION_CONFIG.retryAttempts; attempt++) {
      try {
        console.log(`AdminProductsApiClient: Attempt ${attempt + 1}/${EDGE_FUNCTION_CONFIG.retryAttempts + 1}`);

        const response = await makeRequest(url, {
          method: 'GET'
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new AdminProductsApiError(
            `HTTP_${response.status}`,
            `HTTP ${response.status}: ${errorText}`,
            { status: response.status, url }
          );
        }

        const data: AdminProductsCoverageApiResponse = await response.json();

        if (isErrorResponse(data)) {
          throw new AdminProductsApiError(
            data.error.code,
            data.error.message,
            data.error.details
          );
        }

        if (isSuccessResponse(data)) {
          console.log(`AdminProductsApiClient: Success - ${data.data.length} products`);
          return data.data;
        }

        throw new AdminProductsApiError(
          'INVALID_RESPONSE',
          'Invalid response format from API',
          { response: data }
        );

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (error instanceof AdminProductsApiError) {
          if (['INVALID_TECHNOLOGY', 'MISSING_PARAMETERS', 'VALIDATION_ERROR'].includes(error.code)) {
            throw error; // Don't retry validation errors
          }
        }

        // Wait before retry (except on last attempt)
        if (attempt < EDGE_FUNCTION_CONFIG.retryAttempts) {
          console.log(`AdminProductsApiClient: Retrying in ${EDGE_FUNCTION_CONFIG.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, EDGE_FUNCTION_CONFIG.retryDelay));
        }
      }
    }

    // All retries failed
    throw lastError || new AdminProductsApiError(
      'MAX_RETRIES_EXCEEDED',
      `Failed after ${EDGE_FUNCTION_CONFIG.retryAttempts + 1} attempts`
    );
  }

  /**
   * Check Edge Function health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${EDGE_FUNCTION_CONFIG.functionName}/health`;
      const response = await makeRequest(url, { method: 'GET' }, 5000);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// Service Layer
// =============================================================================

/**
 * Default API client instance
 */
export const defaultApiClient = new AdminProductsApiClient();

/**
 * Fetch admin products for given technologies
 *
 * This is the main service function used by React Query hooks
 */
export async function fetchAdminProducts(
  technologies: TechnologyType[],
  coverageArea?: string
): Promise<ServicePackage[]> {
  if (!technologies || technologies.length === 0) {
    throw new AdminProductsApiError(
      'INVALID_INPUT',
      'At least one technology must be specified'
    );
  }

  // Validate technology types
  const validTechnologies: TechnologyType[] = ['FIBRE', 'FIXED_WIRELESS', 'LTE'];
  const invalidTechnologies = technologies.filter(tech => !validTechnologies.includes(tech));

  if (invalidTechnologies.length > 0) {
    throw new AdminProductsApiError(
      'INVALID_TECHNOLOGY',
      `Invalid technology types: ${invalidTechnologies.join(', ')}`,
      { invalidTechnologies, validTechnologies }
    );
  }

  return await defaultApiClient.fetchProducts({
    technologies,
    coverageArea
  });
}

/**
 * Fetch admin products for a single technology
 */
export async function fetchAdminProductsForTechnology(
  technology: TechnologyType,
  coverageArea?: string
): Promise<ServicePackage[]> {
  return await fetchAdminProducts([technology], coverageArea);
}

/**
 * Check if admin products service is available
 */
export async function checkAdminProductsHealth(): Promise<boolean> {
  return await defaultApiClient.checkHealth();
}

// =============================================================================
// Error Transformation
// =============================================================================

/**
 * Transform API errors to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AdminProductsTimeoutError) {
    return 'The service is taking longer than expected. Please try again.';
  }

  if (error instanceof AdminProductsApiError) {
    switch (error.code) {
      case 'INVALID_TECHNOLOGY':
        return 'The requested service type is not supported. Please try a different option.';
      case 'DATABASE_ERROR':
        return 'Unable to load products at this time. Please try again later.';
      case 'TIMEOUT_ERROR':
        return 'The request timed out. Please check your connection and try again.';
      case 'HTTP_401':
      case 'HTTP_403':
        return 'Access denied. Please refresh the page and try again.';
      case 'HTTP_404':
        return 'The product service is temporarily unavailable.';
      case 'HTTP_500':
      case 'HTTP_502':
      case 'HTTP_503':
        return 'The service is temporarily unavailable. Please try again in a few minutes.';
      default:
        return 'Unable to load products. Please try again later.';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

// =============================================================================
// Development and Debugging
// =============================================================================

/**
 * Performance monitoring for development
 */
export interface PerformanceMetrics {
  requestStart: number;
  requestEnd: number;
  duration: number;
  cacheHit: boolean;
  productCount: number;
  technologies: TechnologyType[];
}

/**
 * Track performance metrics (development only)
 */
export function createPerformanceTracker(
  technologies: TechnologyType[],
  cacheHit: boolean = false
) {
  const startTime = performance.now();

  return {
    finish: (productCount: number): PerformanceMetrics => {
      const endTime = performance.now();
      const metrics = {
        requestStart: startTime,
        requestEnd: endTime,
        duration: endTime - startTime,
        cacheHit,
        productCount,
        technologies
      };

      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log('AdminProducts Performance:', {
          duration: `${metrics.duration.toFixed(2)}ms`,
          cacheHit: metrics.cacheHit,
          productCount: metrics.productCount,
          technologies: metrics.technologies.join(', ')
        });
      }

      return metrics;
    }
  };
}

/**
 * Export for testing purposes
 */
export const __testing__ = {
  AdminProductsApiClient,
  makeRequest,
  EDGE_FUNCTION_CONFIG
};