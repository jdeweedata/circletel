/**
 * useAdminProducts Hook
 *
 * React Query hook wrapper for admin products data with caching and state management.
 * Provides a clean API for components to access admin products with technology filtering.
 *
 * @see specs/001-admin-products-integration/contracts/admin-products-coverage-api.yaml
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  TechnologyType,
  ServicePackage,
  AdminProductsApiError
} from '@/types/adminProducts';
import {
  fetchAdminProducts,
  generateCacheKey,
  generateGlobalCacheKey,
  getUserFriendlyErrorMessage,
  createPerformanceTracker,
  CACHE_CONFIG
} from '@/services/adminProducts';

// =============================================================================
// Hook Options and Configuration
// =============================================================================

/**
 * Options for useAdminProducts hook
 */
export interface UseAdminProductsOptions {
  /** Array of technology types to fetch products for */
  technologies: TechnologyType[];
  /** Optional coverage area for geo-filtering */
  coverageArea?: string;
  /** Whether to enable the query (defaults to true) */
  enabled?: boolean;
  /** Custom stale time override (defaults to CACHE_CONFIG.staleTime) */
  staleTime?: number;
  /** Whether to refetch when window regains focus */
  refetchOnWindowFocus?: boolean;
  /** Whether to retry failed requests */
  retry?: boolean | number;
}

/**
 * Return type for useAdminProducts hook
 */
export interface UseAdminProductsReturn {
  /** The service packages data */
  data: ServicePackage[] | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: AdminProductsApiError | Error | null;
  /** Success state (data loaded successfully) */
  isSuccess: boolean;
  /** Error state boolean */
  isError: boolean;
  /** Whether query is currently fetching */
  isFetching: boolean;
  /** Whether this is the initial loading */
  isInitialLoading: boolean;
  /** Whether data is considered stale */
  isStale: boolean;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Refresh/refetch function */
  refetch: () => void;
  /** Invalidate cache and refetch */
  invalidate: () => Promise<void>;
  /** Check if specific technologies are loaded */
  hasData: boolean;
  /** Performance metrics (development only) */
  performanceMetrics?: Record<string, unknown>;
}

// =============================================================================
// Main Hook Implementation
// =============================================================================

/**
 * Hook for managing admin products data with React Query
 *
 * Provides technology filtering, caching, and state management for admin products.
 * Follows the caching strategy defined in research.md with 5-minute TTL.
 *
 * @example
 * ```tsx
 * const { data: products, isLoading, error } = useAdminProducts({
 *   technologies: ['FIBRE', 'FIXED_WIRELESS']
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={errorMessage} />;
 *
 * return (
 *   <div>
 *     {products?.map(product => (
 *       <ProductCard key={product.id} product={product} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAdminProducts(options: UseAdminProductsOptions): UseAdminProductsReturn {
  const {
    technologies,
    coverageArea,
    enabled = true,
    staleTime = CACHE_CONFIG.staleTime,
    refetchOnWindowFocus = false,
    retry = 2
  } = options;

  const queryClient = useQueryClient();

  // Generate cache key for this specific request
  const queryKey = generateCacheKey(technologies, coverageArea);

  // Performance tracking for development
  const performanceTracker = process.env.NODE_ENV === 'development'
    ? createPerformanceTracker(technologies, false)
    : null;

  // React Query configuration
  const queryConfig = {
    queryKey,
    queryFn: async (): Promise<ServicePackage[]> => {
      console.log('useAdminProducts: Fetching admin products', { technologies, coverageArea });

      try {
        const result = await fetchAdminProducts(technologies, coverageArea);

        // Track performance in development
        if (performanceTracker) {
          performanceTracker.finish(result.length);
        }

        return result;
      } catch (error) {
        // Track failed performance in development
        if (performanceTracker) {
          performanceTracker.finish(0);
        }
        throw error;
      }
    },
    enabled: enabled && technologies.length > 0,
    staleTime,
    retry,
    refetchOnWindowFocus,
    // Cache data for the configured TTL
    gcTime: CACHE_CONFIG.ttl,
    // Prevent background refetches by default (explicit refresh preferred)
    refetchOnMount: true,
    refetchOnReconnect: true
  };

  // Execute the query
  const query = useQuery(queryConfig);

  // Helper functions
  const refetch = () => {
    console.log('useAdminProducts: Manual refetch triggered');
    query.refetch();
  };

  const invalidate = async () => {
    console.log('useAdminProducts: Cache invalidation triggered');
    await queryClient.invalidateQueries({
      queryKey: generateGlobalCacheKey()
    });
  };

  // Transform error to user-friendly message
  const errorMessage = query.error
    ? getUserFriendlyErrorMessage(query.error)
    : null;

  // Performance metrics for development
  const performanceMetrics = process.env.NODE_ENV === 'development' && query.data
    ? {
        cacheKey: queryKey.join(':'),
        dataFreshness: query.dataUpdatedAt,
        lastFetch: query.dataUpdatedAt,
        productCount: query.data?.length || 0,
        technologies: technologies.join(', ')
      }
    : undefined;

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isFetching: query.isFetching,
    isInitialLoading: query.isLoading && !query.data,
    isStale: query.isStale,
    errorMessage,
    refetch,
    invalidate,
    hasData: !!(query.data && query.data.length > 0),
    performanceMetrics
  };
}

// =============================================================================
// Specialized Hook Variants
// =============================================================================

/**
 * Hook for fetching admin products for a single technology
 *
 * Convenience wrapper around useAdminProducts for single technology queries.
 */
export function useAdminProductsForTechnology(
  technology: TechnologyType,
  coverageArea?: string,
  options?: Omit<UseAdminProductsOptions, 'technologies'>
): UseAdminProductsReturn {
  return useAdminProducts({
    ...options,
    technologies: [technology],
    coverageArea
  });
}

/**
 * Hook for fetching all available admin products
 *
 * Fetches products for all supported technology types.
 */
export function useAllAdminProducts(
  coverageArea?: string,
  options?: Omit<UseAdminProductsOptions, 'technologies'>
): UseAdminProductsReturn {
  return useAdminProducts({
    ...options,
    technologies: ['FIBRE', 'FIXED_WIRELESS', 'LTE'],
    coverageArea
  });
}

// =============================================================================
// Cache Management Utilities
// =============================================================================

/**
 * Hook for cache management operations
 *
 * Provides utilities for managing the admin products cache.
 */
export function useAdminProductsCache() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    console.log('useAdminProductsCache: Invalidating all admin products cache');
    await queryClient.invalidateQueries({
      queryKey: generateGlobalCacheKey()
    });
  };

  const removeAll = () => {
    console.log('useAdminProductsCache: Removing all admin products cache');
    queryClient.removeQueries({
      queryKey: generateGlobalCacheKey()
    });
  };

  const prefetch = async (technologies: TechnologyType[], coverageArea?: string) => {
    const cacheKey = generateCacheKey(technologies, coverageArea);
    console.log('useAdminProductsCache: Prefetching', { technologies, coverageArea });

    await queryClient.prefetchQuery({
      queryKey: cacheKey,
      queryFn: () => fetchAdminProducts(technologies, coverageArea),
      staleTime: CACHE_CONFIG.staleTime
    });
  };

  const getCachedData = (technologies: TechnologyType[], coverageArea?: string): ServicePackage[] | undefined => {
    const cacheKey = generateCacheKey(technologies, coverageArea);
    return queryClient.getQueryData(cacheKey);
  };

  return {
    invalidateAll,
    removeAll,
    prefetch,
    getCachedData
  };
}

// =============================================================================
// Development and Debugging Utilities
// =============================================================================

/**
 * Debug hook for development (only works in development mode)
 *
 * Provides debugging information about admin products queries.
 */
export function useAdminProductsDebug() {
  const queryClient = useQueryClient();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getAllQueries = () => {
    const allQueries = queryClient.getQueriesData({
      queryKey: generateGlobalCacheKey()
    });

    return allQueries.map(([queryKey, data]) => ({
      key: queryKey,
      data,
      size: data ? JSON.stringify(data).length : 0
    }));
  };

  const getQueryStats = () => {
    const queries = getAllQueries();
    return {
      totalQueries: queries.length,
      totalCacheSize: queries.reduce((sum, q) => sum + q.size, 0),
      queries: queries.map(q => ({
        key: q.key.join(':'),
        productCount: Array.isArray(q.data) ? q.data.length : 0,
        size: q.size
      }))
    };
  };

  const logCacheState = () => {
    const stats = getQueryStats();
    console.log('Admin Products Cache Stats:', stats);
  };

  return {
    getAllQueries,
    getQueryStats,
    logCacheState
  };
}

// =============================================================================
// Export for Testing
// =============================================================================

/**
 * Export internals for testing purposes
 */
export const __testing__ = {
  useAdminProducts,
  useAdminProductsForTechnology,
  useAllAdminProducts,
  useAdminProductsCache,
  useAdminProductsDebug
};