/**
 * Elevation Data Client
 *
 * Fetches SRTM elevation data from Open-Elevation API with caching in
 * the elevation_cache table. Falls back to Open-Meteo API if primary fails.
 *
 * Primary: https://api.open-elevation.com/api/v1/lookup (free, no key, batch support)
 * Fallback: https://api.open-meteo.com/v1/elevation (free, no key, batch support)
 */

import { createClient } from '@/lib/supabase/server';
import type { Coordinate, ElevationPoint, ElevationProfile } from './types';

const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
const OPEN_METEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const CACHE_PRECISION = 4; // decimal places (~11m grid)
const DEFAULT_SAMPLES = 20; // sample points for elevation profiles

/**
 * Round coordinate to cache precision
 */
function roundCoord(val: number): number {
  return Math.round(val * Math.pow(10, CACHE_PRECISION)) / Math.pow(10, CACHE_PRECISION);
}

/**
 * Get elevation for a single point, checking cache first.
 */
export async function getElevation(lat: number, lng: number): Promise<number> {
  const points = await getElevationBatch([{ lat, lng }]);
  return points[0]?.elevation_m ?? 0;
}

/**
 * Get elevations for multiple coordinates in a single API call.
 * Checks cache first, only fetches uncached points.
 */
export async function getElevationBatch(coordinates: Coordinate[]): Promise<ElevationPoint[]> {
  if (coordinates.length === 0) return [];

  const supabase = await createClient();

  // Check cache for each coordinate
  const cacheKeys = coordinates.map(c => ({
    lat: roundCoord(c.lat),
    lng: roundCoord(c.lng),
    original: c,
  }));

  const { data: cached } = await supabase
    .from('elevation_cache')
    .select('lat, lng, elevation_m')
    .in(
      'lat',
      Array.from(new Set(cacheKeys.map(k => k.lat)))
    );

  const cacheMap = new Map<string, number>();
  for (const row of cached || []) {
    cacheMap.set(`${roundCoord(row.lat)},${roundCoord(row.lng)}`, row.elevation_m);
  }

  // Separate cached vs uncached
  const uncached: Coordinate[] = [];
  const results: ElevationPoint[] = [];

  for (const key of cacheKeys) {
    const cacheKey = `${key.lat},${key.lng}`;
    if (cacheMap.has(cacheKey)) {
      results.push({ lat: key.original.lat, lng: key.original.lng, elevation_m: cacheMap.get(cacheKey)! });
    } else {
      uncached.push(key.original);
    }
  }

  // Fetch uncached elevations from API
  if (uncached.length > 0) {
    const fetched = await fetchElevationsFromApi(uncached);

    // Store in cache
    if (fetched.length > 0) {
      const cacheInserts = fetched.map(p => ({
        lat: roundCoord(p.lat),
        lng: roundCoord(p.lng),
        elevation_m: p.elevation_m,
        source: 'open_elevation' as const,
        fetched_at: new Date().toISOString(),
      }));

      await supabase
        .from('elevation_cache')
        .upsert(cacheInserts, { onConflict: 'lat,lng', ignoreDuplicates: true });
    }

    results.push(...fetched);
  }

  return results;
}

/**
 * Get elevation profile between two points with N evenly-spaced samples.
 */
export async function getElevationProfile(
  from: Coordinate,
  to: Coordinate,
  samples: number = DEFAULT_SAMPLES
): Promise<ElevationProfile> {
  // Generate evenly-spaced sample points along the great-circle path
  const samplePoints: Coordinate[] = [];
  for (let i = 0; i <= samples; i++) {
    const fraction = i / samples;
    samplePoints.push({
      lat: from.lat + (to.lat - from.lat) * fraction,
      lng: from.lng + (to.lng - from.lng) * fraction,
    });
  }

  const elevations = await getElevationBatch(samplePoints);

  // Calculate total distance (Haversine)
  const totalDistanceM = haversineDistanceM(from, to);

  const points: ElevationPoint[] = samplePoints.map((coord, i) => ({
    lat: coord.lat,
    lng: coord.lng,
    elevation_m: elevations.find(
      e => roundCoord(e.lat) === roundCoord(coord.lat) && roundCoord(e.lng) === roundCoord(coord.lng)
    )?.elevation_m ?? 0,
  }));

  const startElevationM = points[0]?.elevation_m ?? 0;
  const endElevationM = points[points.length - 1]?.elevation_m ?? 0;
  const maxTerrainElevationM = Math.max(...points.map(p => p.elevation_m));

  // Calculate minimum clearance (LOS line vs terrain)
  // LOS height at each point = linear interpolation between BN and RN antenna heights
  let minClearanceM = Infinity;
  for (let i = 0; i < points.length; i++) {
    const fraction = i / (points.length - 1);
    const losElevation = startElevationM + (endElevationM - startElevationM) * fraction;
    const clearance = losElevation - points[i].elevation_m;
    if (clearance < minClearanceM) minClearanceM = clearance;
  }

  return {
    points,
    totalDistanceM,
    startElevationM,
    endElevationM,
    maxTerrainElevationM,
    minClearanceM,
  };
}

/**
 * Fetch elevations from Open-Elevation API, falling back to Open-Meteo.
 */
async function fetchElevationsFromApi(coordinates: Coordinate[]): Promise<ElevationPoint[]> {
  // Try Open-Elevation first
  try {
    return await fetchFromOpenElevation(coordinates);
  } catch (err) {
    console.warn('[ElevationClient] Open-Elevation failed, trying Open-Meteo:', err instanceof Error ? err.message : String(err));
  }

  // Fallback to Open-Meteo
  try {
    return await fetchFromOpenMeteo(coordinates);
  } catch (err) {
    console.error('[ElevationClient] Both elevation APIs failed:', err instanceof Error ? err.message : String(err));
    // Return zero elevation as last resort — prediction will be degraded but won't crash
    return coordinates.map(c => ({ ...c, elevation_m: 0 }));
  }
}

async function fetchFromOpenElevation(coordinates: Coordinate[]): Promise<ElevationPoint[]> {
  const response = await fetch(OPEN_ELEVATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ locations: coordinates.map(c => ({ latitude: c.lat, longitude: c.lng })) }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`Open-Elevation HTTP ${response.status}`);

  const data = await response.json();
  const results = data.results || [];

  return results.map((r: { latitude: number; longitude: number; elevation: number }, i: number) => ({
    lat: coordinates[i]?.lat ?? r.latitude,
    lng: coordinates[i]?.lng ?? r.longitude,
    elevation_m: r.elevation ?? 0,
  }));
}

async function fetchFromOpenMeteo(coordinates: Coordinate[]): Promise<ElevationPoint[]> {
  const lats = coordinates.map(c => c.lat).join(',');
  const lngs = coordinates.map(c => c.lng).join(',');
  const url = `${OPEN_METEO_ELEVATION_URL}?latitude=${lats}&longitude=${lngs}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);

  const data = await response.json();
  const elevations: number[] = data.elevation || [];

  return coordinates.map((c, i) => ({
    lat: c.lat,
    lng: c.lng,
    elevation_m: elevations[i] ?? 0,
  }));
}

/**
 * Haversine distance between two coordinates in metres.
 */
export function haversineDistanceM(from: Coordinate, to: Coordinate): number {
  const R = 6371000; // Earth radius in metres
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
