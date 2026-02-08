/**
 * Unified Coverage Cache System
 *
 * Consolidates caching logic from aggregation-service.ts and mtn/cache.ts
 * into a single, configurable cache with consistent behavior.
 *
 * Features:
 * - Spatial caching with coordinate-based keys
 * - Request deduplication to prevent concurrent duplicate API calls
 * - Configurable TTL and size limits
 * - Cache statistics for monitoring
 *
 * @module lib/coverage/utils/cache
 */

import { Coordinates, CoverageCheckResult } from '../types';
import { generateCacheKey, calculateDistance, normalizeCoordinates } from './validation';

// =============================================================================
// TYPES
// =============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  coordinates: Coordinates;
  key: string;
}

export interface CacheOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Maximum number of entries (default: 1000) */
  maxEntries?: number;
  /** Spatial radius for cache hits in meters (default: 500m) */
  spatialRadius?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRatio: number;
  oldestEntry: number;
  newestEntry: number;
  pendingRequests: number;
}

// =============================================================================
// UNIFIED COVERAGE CACHE
// =============================================================================

/**
 * Unified coverage cache with spatial awareness and request deduplication
 *
 * @example
 * ```typescript
 * const cache = new CoverageCache({ ttl: 5 * 60 * 1000 });
 *
 * // Get cached data
 * const cached = cache.get(coordinates);
 * if (cached) return cached;
 *
 * // Or use getOrFetch for automatic caching
 * const result = await cache.getOrFetch(coordinates, {}, async () => {
 *   return await fetchCoverage(coordinates);
 * });
 * ```
 */
export class CoverageCache<T = CoverageCheckResult> {
  private cache = new Map<string, CacheEntry<T>>();
  private pendingRequests = new Map<string, Promise<T>>();
  private stats = { hits: 0, misses: 0 };

  // Configuration
  private ttl: number;
  private maxEntries: number;
  private spatialRadius: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    this.maxEntries = options.maxEntries ?? 1000;
    this.spatialRadius = options.spatialRadius ?? 500; // 500m default
  }

  // ===========================================================================
  // CORE CACHE OPERATIONS
  // ===========================================================================

  /**
   * Get cached data for coordinates
   *
   * First tries exact match, then looks for nearby cached entries within spatialRadius.
   */
  get(
    coordinates: Coordinates,
    options?: { providers?: string[]; serviceTypes?: string[] }
  ): T | null {
    const key = generateCacheKey(coordinates, options);

    // Try exact match first
    const exactEntry = this.cache.get(key);
    if (exactEntry && this.isValidEntry(exactEntry)) {
      this.stats.hits++;
      return exactEntry.data;
    }

    // Try spatial match (find nearby cached entry)
    const nearbyEntry = this.findNearbyEntry(coordinates);
    if (nearbyEntry) {
      this.stats.hits++;
      return nearbyEntry.data;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Store data in cache
   */
  set(
    coordinates: Coordinates,
    data: T,
    options?: { providers?: string[]; serviceTypes?: string[] }
  ): void {
    // Clean up if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.cleanup();
    }

    const key = generateCacheKey(coordinates, options);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      coordinates: normalizeCoordinates(coordinates),
      key,
    };

    this.cache.set(key, entry);
  }

  /**
   * Get cached data or fetch and cache if not available
   *
   * This method also handles request deduplication - if multiple concurrent
   * requests come in for the same coordinates, only one fetch is performed.
   */
  async getOrFetch(
    coordinates: Coordinates,
    options: { providers?: string[]; serviceTypes?: string[] },
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check cache first
    const cached = this.get(coordinates, options);
    if (cached) return cached;

    const key = generateCacheKey(coordinates, options);

    // Check for pending request (deduplication)
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = fetchFn()
      .then((data) => {
        this.set(coordinates, data, options);
        return data;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Delete specific cache entry
   */
  delete(
    coordinates: Coordinates,
    options?: { providers?: string[]; serviceTypes?: string[] }
  ): boolean {
    const key = generateCacheKey(coordinates, options);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  // ===========================================================================
  // SPATIAL MATCHING
  // ===========================================================================

  /**
   * Find a cached entry within spatialRadius of given coordinates
   */
  private findNearbyEntry(coordinates: Coordinates): CacheEntry<T> | null {
    let nearestEntry: CacheEntry<T> | null = null;
    let nearestDistance = Infinity;

    for (const entry of this.cache.values()) {
      if (!this.isValidEntry(entry)) continue;

      const distance = calculateDistance(coordinates, entry.coordinates) * 1000; // km to m
      if (distance <= this.spatialRadius && distance < nearestDistance) {
        nearestDistance = distance;
        nearestEntry = entry;
      }
    }

    return nearestEntry;
  }

  // ===========================================================================
  // ENTRY VALIDATION & CLEANUP
  // ===========================================================================

  /**
   * Check if a cache entry is still valid (not expired)
   */
  private isValidEntry(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp <= this.ttl;
  }

  /**
   * Clean up expired entries and oldest entries if over capacity
   */
  private cleanup(): void {
    // Remove expired entries
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    // If still over capacity, remove oldest 10%
    if (this.cache.size >= this.maxEntries) {
      const entriesToRemove = Math.floor(this.maxEntries * 0.1);
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((e) => e.timestamp);
    const total = this.stats.hits + this.stats.misses;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRatio: total > 0 ? this.stats.hits / total : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      pendingRequests: this.pendingRequests.size,
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Export cache to JSON string for persistence
   */
  export(): string {
    const exportData = {
      entries: Array.from(this.cache.entries()),
      stats: this.stats,
      timestamp: Date.now(),
      config: {
        ttl: this.ttl,
        maxEntries: this.maxEntries,
        spatialRadius: this.spatialRadius,
      },
    };
    return JSON.stringify(exportData);
  }

  /**
   * Import cache from JSON string
   */
  import(data: string): boolean {
    try {
      const importData = JSON.parse(data);

      if (!importData.entries || !Array.isArray(importData.entries)) {
        return false;
      }

      this.cache.clear();

      for (const [key, entry] of importData.entries) {
        if (this.isValidEntry(entry)) {
          this.cache.set(key, entry);
        }
      }

      if (importData.stats) {
        this.stats = importData.stats;
      }

      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

/**
 * Default coverage cache instance with 5-minute TTL
 */
export const coverageCache = new CoverageCache<CoverageCheckResult>({
  ttl: 5 * 60 * 1000,
  maxEntries: 1000,
  spatialRadius: 500,
});

/**
 * Long-term coverage cache for preloaded data (30-minute TTL)
 */
export const preloadCache = new CoverageCache<CoverageCheckResult>({
  ttl: 30 * 60 * 1000,
  maxEntries: 2000,
  spatialRadius: 1000,
});
