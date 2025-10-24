// MTN Coverage Data Cache System
import { Coordinates } from '../types';
import { MTNWMSResponse } from './types';

interface CacheEntry {
  data: MTNWMSResponse[];
  timestamp: number;
  coordinates: Coordinates;
  radius: number; // Cache radius in meters
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  oldestEntry: number;
  newestEntry: number;
}

export class MTNCoverageCache {
  private cache = new Map<string, CacheEntry>();
  private maxEntries = 1000;
  private defaultTTL = 30 * 60 * 1000; // 30 minutes
  private hitStats = { hits: 0, misses: 0 };
  // Optimization: Request deduplication to prevent redundant API calls
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Generate cache key based on coordinates and radius
   * Optimized: Adaptive precision based on radius for better spatial efficiency
   */
  private generateKey(coordinates: Coordinates, radius: number = 500): string {
    // Optimization: Use adaptive precision based on radius
    // Smaller radius = higher precision, larger radius = lower precision
    const precision = radius < 100 ? 100000 : radius < 500 ? 10000 : 1000;
    const lat = Math.round(coordinates.lat * precision) / precision;
    const lng = Math.round(coordinates.lng * precision) / precision;
    return `${lat},${lng}_${radius}`;
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: CacheEntry, coordinates: Coordinates, ttl?: number): boolean {
    const now = Date.now();
    const maxAge = ttl || this.defaultTTL;

    // Check if entry is expired
    if (now - entry.timestamp > maxAge) {
      return false;
    }

    // Check if coordinates are within cache radius
    const distance = this.calculateDistance(entry.coordinates, coordinates);
    return distance <= entry.radius;
  }

  /**
   * Find nearest cache entry within radius
   */
  private findNearestEntry(coordinates: Coordinates, maxRadius: number = 1000): CacheEntry | null {
    let nearestEntry: CacheEntry | null = null;
    let nearestDistance = Infinity;

    for (const entry of this.cache.values()) {
      if (this.isValidEntry(entry, coordinates)) {
        const distance = this.calculateDistance(entry.coordinates, coordinates);
        if (distance < nearestDistance && distance <= maxRadius) {
          nearestDistance = distance;
          nearestEntry = entry;
        }
      }
    }

    return nearestEntry;
  }

  /**
   * Get cached coverage data
   */
  get(coordinates: Coordinates, radius: number = 500): MTNWMSResponse[] | null {
    // First try exact match
    const exactKey = this.generateKey(coordinates, radius);
    const exactEntry = this.cache.get(exactKey);

    if (exactEntry && this.isValidEntry(exactEntry, coordinates)) {
      this.hitStats.hits++;
      return exactEntry.data;
    }

    // Try to find nearby cache entry
    const nearestEntry = this.findNearestEntry(coordinates, radius * 2);
    if (nearestEntry) {
      this.hitStats.hits++;
      return nearestEntry.data;
    }

    this.hitStats.misses++;
    return null;
  }

  /**
   * Store coverage data in cache
   */
  set(
    coordinates: Coordinates,
    data: MTNWMSResponse[],
    radius: number = 500,
    ttl?: number
  ): void {
    // Clean expired entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.cleanExpiredEntries();
    }

    // If still full, remove oldest entries
    if (this.cache.size >= this.maxEntries) {
      this.removeOldestEntries(Math.floor(this.maxEntries * 0.1)); // Remove 10%
    }

    const key = this.generateKey(coordinates, radius);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      coordinates,
      radius
    };

    this.cache.set(key, entry);
  }

  /**
   * Remove expired entries
   */
  private cleanExpiredEntries(ttl?: number): number {
    const now = Date.now();
    const maxAge = ttl || this.defaultTTL;
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Remove oldest entries
   */
  private removeOldestEntries(count: number): number {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);

    for (const [key] of entries) {
      this.cache.delete(key);
    }

    return entries.length;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hitStats = { hits: 0, misses: 0 };
  }

  /**
   * Optimization: Deduplicate concurrent requests for same coordinates
   */
  async deduplicateRequest<T>(
    key: string,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new request and store it
    const request = fetchFunction().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      hits: this.hitStats.hits,
      misses: this.hitStats.misses,
      entries: this.cache.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.hitStats.hits + this.hitStats.misses;
    return total > 0 ? this.hitStats.hits / total : 0;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hitStats = { hits: 0, misses: 0 };
  }

  /**
   * Preload cache for specific area (grid-based)
   */
  async preloadArea(
    centerCoords: Coordinates,
    radiusKm: number,
    gridSize: number = 500, // meters
    fetchFunction: (coords: Coordinates) => Promise<MTNWMSResponse[]>
  ): Promise<void> {
    const points: Coordinates[] = [];
    const latStep = gridSize / 111000; // Approximate meters to degrees
    const lngStep = gridSize / (111000 * Math.cos(centerCoords.lat * Math.PI / 180));

    const radiusDegrees = radiusKm * 1000 / 111000;
    const steps = Math.ceil(radiusDegrees / latStep);

    for (let i = -steps; i <= steps; i++) {
      for (let j = -steps; j <= steps; j++) {
        const lat = centerCoords.lat + (i * latStep);
        const lng = centerCoords.lng + (j * lngStep);

        // Check if point is within radius
        const distance = this.calculateDistance(centerCoords, { lat, lng });
        if (distance <= radiusKm * 1000) {
          points.push({ lat, lng });
        }
      }
    }

    // Fetch and cache data for each point
    for (const point of points) {
      if (!this.get(point)) {
        try {
          const data = await fetchFunction(point);
          this.set(point, data);

          // Add small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('Failed to preload coverage for', point, error);
        }
      }
    }
  }

  /**
   * Export cache for persistence
   */
  export(): string {
    const exportData = {
      entries: Array.from(this.cache.entries()),
      stats: this.hitStats,
      timestamp: Date.now()
    };
    return JSON.stringify(exportData);
  }

  /**
   * Import cache from persistence
   */
  import(data: string): boolean {
    try {
      const importData = JSON.parse(data);

      if (!importData.entries || !Array.isArray(importData.entries)) {
        return false;
      }

      this.cache.clear();

      for (const [key, entry] of importData.entries) {
        // Only import entries that are not expired
        if (this.isValidEntry(entry, entry.coordinates)) {
          this.cache.set(key, entry);
        }
      }

      if (importData.stats) {
        this.hitStats = importData.stats;
      }

      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mtnCoverageCache = new MTNCoverageCache();