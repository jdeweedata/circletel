/**
 * Coordinate Transformation Utilities for DFA ArcGIS API
 *
 * DFA API requires Web Mercator (EPSG:3857 / WKID:102100) coordinates
 * Google Maps and standard GPS use WGS84 (EPSG:4326 / WKID:4326)
 */

import { WebMercatorCoordinates, WGS84Coordinates } from './types';

// Earth radius in meters (WGS84 semi-major axis)
const EARTH_RADIUS = 6378137;
const HALF_CIRCUMFERENCE = Math.PI * EARTH_RADIUS;

/**
 * Convert WGS84 (lat/lng) to Web Mercator (x/y) projection
 * Used by: DFA API, Esri ArcGIS, Bing Maps, OpenStreetMap
 *
 * @param latitude - Latitude in degrees (-90 to 90)
 * @param longitude - Longitude in degrees (-180 to 180)
 * @returns Web Mercator coordinates {x, y} in meters
 *
 * @example
 * const coords = latLngToWebMercator(-26.051, 28.062); // Sandton
 * // Returns: { x: 3123456.789, y: -3004567.890, spatialReference: { wkid: 102100 } }
 */
export function latLngToWebMercator(
  latitude: number,
  longitude: number
): WebMercatorCoordinates {
  // Validate input ranges
  if (latitude < -85.05112878 || latitude > 85.05112878) {
    throw new Error(
      `Latitude ${latitude} out of Web Mercator range (-85.05 to 85.05)`
    );
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error(
      `Longitude ${longitude} out of valid range (-180 to 180)`
    );
  }

  // Convert longitude to meters (simple linear transformation)
  const x = (longitude * HALF_CIRCUMFERENCE) / 180;

  // Convert latitude to meters (Mercator projection formula)
  // Uses spherical Mercator approximation
  const latRad = (latitude * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * EARTH_RADIUS;

  return {
    x,
    y,
    spatialReference: {
      wkid: 102100
    }
  };
}

/**
 * Convert Web Mercator (x/y) to WGS84 (lat/lng) projection
 * Used for: Converting ArcGIS responses back to standard GPS coordinates
 *
 * @param x - X coordinate (easting) in meters
 * @param y - Y coordinate (northing) in meters
 * @returns WGS84 coordinates {latitude, longitude} in degrees
 *
 * @example
 * const coords = webMercatorToLatLng(3123456.789, -3004567.890);
 * // Returns: { latitude: -26.051, longitude: 28.062, spatialReference: { wkid: 4326 } }
 */
export function webMercatorToLatLng(
  x: number,
  y: number
): WGS84Coordinates {
  // Convert X (meters) to longitude (degrees)
  const longitude = (x / HALF_CIRCUMFERENCE) * 180;

  // Convert Y (meters) to latitude (degrees)
  // Inverse Mercator projection
  const latRad = Math.PI / 2 - 2 * Math.atan(Math.exp(-y / EARTH_RADIUS));
  const latitude = (latRad * 180) / Math.PI;

  return {
    latitude,
    longitude,
    spatialReference: {
      wkid: 4326
    }
  };
}

/**
 * Create a bounding box (envelope) in Web Mercator coordinates
 * Used for: Map viewport queries, area-based coverage checks
 *
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param radiusMeters - Radius in meters (creates square bbox)
 * @returns Bounding box coordinates in Web Mercator
 *
 * @example
 * // Create 500m radius around Sandton
 * const bbox = createBoundingBox(-26.051, 28.062, 500);
 */
export function createBoundingBox(
  centerLat: number,
  centerLng: number,
  radiusMeters: number
) {
  const center = latLngToWebMercator(centerLat, centerLng);

  return {
    xmin: center.x - radiusMeters,
    ymin: center.y - radiusMeters,
    xmax: center.x + radiusMeters,
    ymax: center.y + radiusMeters,
    spatialReference: {
      wkid: 102100
    }
  };
}

/**
 * Calculate straight-line distance between two Web Mercator points
 * Note: This is an approximation - actual distance may vary slightly
 * For accurate distances, use Haversine formula on WGS84 coordinates
 *
 * @param point1 - First point {x, y}
 * @param point2 - Second point {x, y}
 * @returns Distance in meters
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Haversine distance between two WGS84 coordinates
 * Most accurate method for geographic distances
 *
 * @param lat1 - First latitude
 * @param lng1 - First longitude
 * @param lat2 - Second latitude
 * @param lng2 - Second longitude
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c; // Distance in meters
}

/**
 * Validate if coordinates are within South Africa bounds
 * Used to prevent invalid queries outside service area
 *
 * South Africa approximate bounds:
 * - Latitude: -35° to -22° (South to North)
 * - Longitude: 16° to 33° (West to East)
 */
export function isWithinSouthAfricaBounds(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude >= -35 &&
    latitude <= -22 &&
    longitude >= 16 &&
    longitude <= 33
  );
}

/**
 * Format coordinates for ArcGIS API geometry parameter
 * Returns JSON string required by DFA API
 */
export function formatGeometryPoint(coords: WebMercatorCoordinates): string {
  return JSON.stringify({
    x: coords.x,
    y: coords.y,
    spatialReference: { wkid: 102100 }
  });
}

/**
 * Format bounding box for ArcGIS API geometry parameter
 */
export function formatGeometryEnvelope(bbox: {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}): string {
  return JSON.stringify({
    ...bbox,
    spatialReference: { wkid: 102100 }
  });
}
