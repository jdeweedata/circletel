/**
 * MTN NAD (National Address Database) Coordinate Correction Client
 *
 * This client attempts to correct Google Maps geocoding errors using MTN's NAD lookup.
 * Google Maps geocoding in South Africa can be ~466m off from actual locations.
 * MTN's NAD database contains accurate property coordinates.
 *
 * @module lib/coverage/mtn/nad-client
 * @see {@link https://mtnsi.mtn.co.za/utils/geocode/gd} NAD API Endpoint
 * @see {@link docs/api/MTN_COVERAGE_API_INTEGRATION.md} Full API Documentation
 *
 * Problem Statement:
 * - Google Maps geocoding returns approximate coordinates
 * - Variance of ~466m observed in South Africa
 * - Coverage checks at wrong coordinates return false negatives
 *
 * Solution:
 * - Query MTN's NAD database for accurate coordinates
 * - Falls back gracefully if NAD API unavailable
 * - Multi-point buffer query compensates when NAD fails
 *
 * Console Log Evidence (from MTN Coverage Map):
 * - "Address Verification: Location variation 466m"
 * - "Address Verification: Relocating Google Maps result to NAD location"
 *
 * @note The NAD API requires browser authentication (session cookies).
 * Server-side calls will gracefully fall back to original coordinates.
 * The multi-point buffer query in wms-realtime-client.ts compensates for this.
 *
 * @example
 * ```typescript
 * import { mtnNADClient } from '@/lib/coverage/mtn/nad-client';
 *
 * const correction = await mtnNADClient.correctCoordinates(
 *   { lat: -26.7949714, lng: 27.7671094 }
 * );
 *
 * console.log(`Distance correction: ${correction.distance}m`);
 * console.log(`Source: ${correction.source}`); // 'nad' or 'original'
 * ```
 *
 * @author CircleTel Development Team
 * @version 1.0.0
 * @since 2025-12-09
 */

import { Coordinates } from '../types';

export interface NADCorrectionRequest {
  lat: number;
  lon: number;
  distance?: number; // Search radius in meters (default 500)
}

export interface NADAddress {
  formattedAddress?: string;
  streetNumber?: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface NADCorrectionResult {
  original: Coordinates;
  corrected: Coordinates;
  address?: NADAddress;
  distance: number; // Distance between original and corrected in meters
  confidence: 'high' | 'medium' | 'low';
  source: 'nad' | 'original';
}

export interface NADResponse {
  success: boolean;
  results?: Array<{
    latitude: number;
    longitude: number;
    formattedAddress?: string;
    distance?: number;
    confidence?: number;
    addressComponents?: {
      streetNumber?: string;
      streetName?: string;
      suburb?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  }>;
  error?: string;
}

export class MTNNADClient {
  private static readonly BASE_URL = 'https://mtnsi.mtn.co.za/utils/geocode/gd';
  private static readonly DEFAULT_RADIUS = 500; // meters
  private static readonly TIMEOUT = 10000; // 10 seconds

  // Cache to avoid repeated NAD lookups for same coordinates
  private static cache = new Map<string, NADCorrectionResult>();
  private static readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Correct coordinates using MTN's NAD lookup
   *
   * @param coordinates - Original coordinates (from Google Maps or other geocoding)
   * @param searchRadius - Search radius in meters (default 500m)
   * @returns Corrected coordinates if NAD match found, original otherwise
   */
  static async correctCoordinates(
    coordinates: Coordinates,
    searchRadius: number = this.DEFAULT_RADIUS
  ): Promise<NADCorrectionResult> {
    const cacheKey = `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('[NAD Client] Using cached correction for:', cacheKey);
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mtnsi.mtn.co.za/',
          'Origin': 'https://mtnsi.mtn.co.za'
        },
        body: JSON.stringify({
          lat: coordinates.lat,
          lon: coordinates.lng,
          distance: searchRadius
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[NAD Client] HTTP ${response.status}: ${response.statusText}`);
        return this.createFallbackResult(coordinates);
      }

      const data: NADResponse = await response.json();

      if (!data.success || !data.results || data.results.length === 0) {
        console.log('[NAD Client] No NAD match found, using original coordinates');
        return this.createFallbackResult(coordinates);
      }

      // Use the first (best) result
      const nadResult = data.results[0];
      const corrected: Coordinates = {
        lat: nadResult.latitude,
        lng: nadResult.longitude
      };

      // Calculate distance between original and corrected
      const distance = this.calculateDistance(coordinates, corrected);

      const result: NADCorrectionResult = {
        original: coordinates,
        corrected,
        address: nadResult.addressComponents ? {
          streetNumber: nadResult.addressComponents.streetNumber,
          streetName: nadResult.addressComponents.streetName,
          suburb: nadResult.addressComponents.suburb,
          city: nadResult.addressComponents.city,
          province: nadResult.addressComponents.province,
          postalCode: nadResult.addressComponents.postalCode,
          country: nadResult.addressComponents.country,
          formattedAddress: nadResult.formattedAddress
        } : undefined,
        distance,
        confidence: nadResult.confidence && nadResult.confidence > 0.8 ? 'high' :
                   nadResult.confidence && nadResult.confidence > 0.5 ? 'medium' : 'low',
        source: 'nad'
      };

      console.log('[NAD Client] Coordinate correction:', {
        original: coordinates,
        corrected,
        distance: `${distance.toFixed(0)}m`,
        address: nadResult.formattedAddress
      });

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('[NAD Client] Request timeout');
      } else {
        console.error('[NAD Client] Error:', error);
      }

      return this.createFallbackResult(coordinates);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const deltaLat = (to.lat - from.lat) * Math.PI / 180;
    const deltaLng = (to.lng - from.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Create fallback result when NAD lookup fails
   */
  private static createFallbackResult(coordinates: Coordinates): NADCorrectionResult {
    return {
      original: coordinates,
      corrected: coordinates,
      distance: 0,
      confidence: 'low',
      source: 'original'
    };
  }

  /**
   * Clear the NAD correction cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const mtnNADClient = MTNNADClient;
