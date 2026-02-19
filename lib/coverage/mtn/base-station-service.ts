/**
 * Tarana Base Station Proximity Service
 *
 * Validates SkyFibre coverage by checking distance to nearest Tarana base stations.
 * Uses static BN-Report data imported into the tarana_base_stations table.
 *
 * Coverage Rules:
 * - <3km, >10 connections: HIGH confidence - Show SkyFibre
 * - 3-5km, >5 connections: MEDIUM confidence - Show with note
 * - 3-5km, 1-5 connections: LOW confidence - Show with elevated install warning
 * - >5km: NONE - Hide SkyFibre
 */

import { createClient } from '@/lib/supabase/server';
import { Coordinates } from '../types';
import { searchRadios } from '@/lib/tarana/client';
import { hasTaranaAuth } from '@/lib/tarana/auth';

// Coverage confidence levels
export type CoverageConfidence = 'high' | 'medium' | 'low' | 'none';

// Base station data from database
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

// Result of base station proximity check
export interface BaseStationProximityResult {
  hasCoverage: boolean;
  confidence: CoverageConfidence;
  requiresElevatedInstall: boolean;
  installationNote: string | null;
  nearestStation: {
    siteName: string;
    hostname: string;
    distanceKm: number;
    activeConnections: number;
    market: string;
  } | null;
  allNearbyStations: TaranaBaseStation[];
  metadata: {
    checkedAt: string;
    coordinatesUsed: Coordinates;
    stationsChecked: number;
  };
}

// Coverage thresholds (in km)
const COVERAGE_THRESHOLD_HIGH = 3.0;
const COVERAGE_THRESHOLD_MAX = 5.0;
const MIN_CONNECTIONS_HIGH = 10;
const MIN_CONNECTIONS_MEDIUM = 5;
const MIN_CONNECTIONS_LOW = 1;

/**
 * Check Tarana base station proximity for SkyFibre coverage validation
 */
export async function checkBaseStationProximity(
  coordinates: Coordinates,
  options: { limit?: number } = {}
): Promise<BaseStationProximityResult> {
  const { limit = 5 } = options;
  const supabase = await createClient();

  try {
    // Call the database function to find nearest base stations
    const { data: stations, error } = await supabase.rpc(
      'find_nearest_tarana_base_station',
      {
        p_lat: coordinates.lat,
        p_lng: coordinates.lng,
        p_limit: limit
      }
    );

    if (error) {
      console.error('[BaseStationService] Database error:', error.message);
      // Return fallback result - assume no coverage data available
      return createFallbackResult(coordinates, 'Database error');
    }

    if (!stations || stations.length === 0) {
      // No base stations found - no coverage
      return {
        hasCoverage: false,
        confidence: 'none',
        requiresElevatedInstall: false,
        installationNote: null,
        nearestStation: null,
        allNearbyStations: [],
        metadata: {
          checkedAt: new Date().toISOString(),
          coordinatesUsed: coordinates,
          stationsChecked: 0
        }
      };
    }

    // Map database results
    const nearbyStations: TaranaBaseStation[] = stations.map((s: any) => ({
      id: s.id,
      serial_number: s.serial_number,
      hostname: s.hostname,
      site_name: s.site_name,
      active_connections: s.active_connections,
      market: s.market,
      lat: Number(s.lat),
      lng: Number(s.lng),
      distance_km: Number(s.distance_km)
    }));

    const nearest = nearbyStations[0];

    // Determine coverage confidence based on distance and connections
    const { confidence, requiresElevatedInstall, installationNote } =
      calculateCoverageConfidence(nearest.distance_km, nearest.active_connections);

    return {
      hasCoverage: confidence !== 'none',
      confidence,
      requiresElevatedInstall,
      installationNote,
      nearestStation: {
        siteName: nearest.site_name,
        hostname: nearest.hostname,
        distanceKm: nearest.distance_km,
        activeConnections: nearest.active_connections,
        market: nearest.market
      },
      allNearbyStations: nearbyStations,
      metadata: {
        checkedAt: new Date().toISOString(),
        coordinatesUsed: coordinates,
        stationsChecked: nearbyStations.length
      }
    };
  } catch (error) {
    console.error('[BaseStationService] Unexpected error:', error);
    return createFallbackResult(coordinates, 'Unexpected error');
  }
}

/**
 * Check base station proximity using live Tarana API
 * Falls back to database if API is unavailable
 */
export async function checkBaseStationProximityLive(
  coordinates: Coordinates,
  options: { limit?: number; useLiveApi?: boolean } = {}
): Promise<BaseStationProximityResult> {
  const { limit = 5, useLiveApi = false } = options;

  // Try live API if requested and authenticated
  if (useLiveApi && hasTaranaAuth()) {
    try {
      console.log('[BaseStationService] Using live Tarana API');
      const result = await searchRadios('BN', { limit: 100 });

      // Calculate distances and find nearest
      const stationsWithDistance = result.radios
        .filter(bn => bn.latitude && bn.longitude)
        .map(bn => ({
          id: bn.serialNumber,
          serial_number: bn.serialNumber,
          hostname: bn.deviceId,
          site_name: bn.siteName,
          active_connections: 0, // Not available in search
          market: bn.marketName,
          lat: bn.latitude,
          lng: bn.longitude,
          distance_km: calculateDistance(coordinates, { lat: bn.latitude, lng: bn.longitude }),
          device_status: bn.deviceStatus,
        }))
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, limit);

      if (stationsWithDistance.length > 0) {
        return buildProximityResult(coordinates, stationsWithDistance);
      }
    } catch (error) {
      console.error('[BaseStationService] Live API failed, falling back to database:', error);
    }
  }

  // Fall back to database
  return checkBaseStationProximity(coordinates, options);
}

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
function calculateDistance(coord1: Coordinates, coord2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Build proximity result from stations with distance
 */
function buildProximityResult(
  coordinates: Coordinates,
  stations: Array<{
    id: string;
    serial_number: string;
    hostname: string;
    site_name: string;
    active_connections: number;
    market: string;
    lat: number;
    lng: number;
    distance_km: number;
  }>
): BaseStationProximityResult {
  const nearest = stations[0];

  // Determine coverage confidence based on distance
  let confidence: CoverageConfidence = 'none';
  let requiresElevatedInstall = false;
  let installationNote: string | null = null;

  if (nearest) {
    if (nearest.distance_km <= COVERAGE_THRESHOLD_HIGH) {
      confidence = 'high';
    } else if (nearest.distance_km <= COVERAGE_THRESHOLD_MAX) {
      confidence = 'medium';
      requiresElevatedInstall = true;
      installationNote = 'Elevated installation (10m+) may be required for optimal signal.';
    }
  }

  return {
    hasCoverage: confidence !== 'none',
    confidence,
    requiresElevatedInstall,
    installationNote,
    nearestStation: nearest ? {
      siteName: nearest.site_name,
      hostname: nearest.hostname,
      distanceKm: nearest.distance_km,
      activeConnections: nearest.active_connections,
      market: nearest.market,
    } : null,
    allNearbyStations: stations as TaranaBaseStation[],
    metadata: {
      checkedAt: new Date().toISOString(),
      coordinatesUsed: coordinates,
      stationsChecked: stations.length,
    },
  };
}

/**
 * Calculate coverage confidence based on distance and active connections
 */
function calculateCoverageConfidence(
  distanceKm: number,
  activeConnections: number
): {
  confidence: CoverageConfidence;
  requiresElevatedInstall: boolean;
  installationNote: string | null;
} {
  // Beyond max range - no coverage
  if (distanceKm > COVERAGE_THRESHOLD_MAX) {
    return {
      confidence: 'none',
      requiresElevatedInstall: false,
      installationNote: null
    };
  }

  // Close range with good connections - high confidence
  if (distanceKm <= COVERAGE_THRESHOLD_HIGH && activeConnections >= MIN_CONNECTIONS_HIGH) {
    return {
      confidence: 'high',
      requiresElevatedInstall: false,
      installationNote: null
    };
  }

  // Close range with moderate connections - medium confidence
  if (distanceKm <= COVERAGE_THRESHOLD_HIGH && activeConnections >= MIN_CONNECTIONS_MEDIUM) {
    return {
      confidence: 'medium',
      requiresElevatedInstall: false,
      installationNote: null
    };
  }

  // Medium range (3-5km) with good connections - medium confidence
  if (
    distanceKm > COVERAGE_THRESHOLD_HIGH &&
    distanceKm <= COVERAGE_THRESHOLD_MAX &&
    activeConnections >= MIN_CONNECTIONS_MEDIUM
  ) {
    return {
      confidence: 'medium',
      requiresElevatedInstall: false,
      installationNote: 'Located at edge of coverage area'
    };
  }

  // Medium range (3-5km) with few connections - low confidence, elevated install likely
  if (
    distanceKm > COVERAGE_THRESHOLD_HIGH &&
    distanceKm <= COVERAGE_THRESHOLD_MAX &&
    activeConnections >= MIN_CONNECTIONS_LOW
  ) {
    return {
      confidence: 'low',
      requiresElevatedInstall: true,
      installationNote: 'Installation may require elevated antenna (10m+) for optimal signal'
    };
  }

  // Close range but zero connections - might be a new/inactive tower
  if (distanceKm <= COVERAGE_THRESHOLD_HIGH && activeConnections < MIN_CONNECTIONS_LOW) {
    return {
      confidence: 'low',
      requiresElevatedInstall: true,
      installationNote: 'Limited coverage data available for this area'
    };
  }

  // Edge case - within range but low connections
  if (distanceKm <= COVERAGE_THRESHOLD_MAX) {
    return {
      confidence: 'low',
      requiresElevatedInstall: true,
      installationNote: 'Installation may require elevated antenna (10m+) for optimal signal'
    };
  }

  // Default - no coverage
  return {
    confidence: 'none',
    requiresElevatedInstall: false,
    installationNote: null
  };
}

/**
 * Create a fallback result when database is unavailable
 */
function createFallbackResult(
  coordinates: Coordinates,
  reason: string
): BaseStationProximityResult {
  console.warn(`[BaseStationService] Using fallback result: ${reason}`);

  return {
    hasCoverage: true, // Optimistic fallback - let WMS decide
    confidence: 'medium',
    requiresElevatedInstall: false,
    installationNote: 'Coverage verification pending',
    nearestStation: null,
    allNearbyStations: [],
    metadata: {
      checkedAt: new Date().toISOString(),
      coordinatesUsed: coordinates,
      stationsChecked: 0
    }
  };
}

/**
 * Format coverage confidence for display
 */
export function formatCoverageConfidence(confidence: CoverageConfidence): string {
  switch (confidence) {
    case 'high':
      return 'Strong Coverage';
    case 'medium':
      return 'Good Coverage';
    case 'low':
      return 'Limited Coverage';
    case 'none':
      return 'No Coverage';
    default:
      return 'Unknown';
  }
}

/**
 * Check if SkyFibre should be shown based on base station proximity
 */
export function shouldShowSkyFibre(result: BaseStationProximityResult): boolean {
  return result.hasCoverage && result.confidence !== 'none';
}

export default {
  checkBaseStationProximity,
  checkBaseStationProximityLive,
  formatCoverageConfidence,
  shouldShowSkyFibre
};
