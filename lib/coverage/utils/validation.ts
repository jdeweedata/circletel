/**
 * Centralized Validation Utilities for Coverage Checking
 *
 * Provides coordinate validation, bounds checking, and request validation
 * for South African coverage checks. Consolidates duplicate validation logic.
 *
 * @module lib/coverage/utils/validation
 */

import { Coordinates, ServiceType, CoverageProvider, CoverageCheckRequest } from '../types';

// =============================================================================
// SOUTH AFRICA GEOGRAPHIC BOUNDS
// =============================================================================

/**
 * South Africa geographic bounds
 * Slightly expanded to include border areas
 */
export const SOUTH_AFRICA_BOUNDS = {
  north: -22.0,
  south: -35.0,
  east: 33.0,
  west: 16.0,
} as const;

/**
 * Major cities in South Africa for reference
 */
export const MAJOR_CITIES: Record<string, Coordinates> = {
  johannesburg: { lat: -26.2041, lng: 28.0473 },
  cape_town: { lat: -33.9249, lng: 18.4241 },
  durban: { lat: -29.8587, lng: 31.0218 },
  pretoria: { lat: -25.7461, lng: 28.1881 },
  port_elizabeth: { lat: -33.9180, lng: 25.5701 },
  bloemfontein: { lat: -29.0852, lng: 26.1596 },
  east_london: { lat: -33.0153, lng: 27.9116 },
  polokwane: { lat: -23.8962, lng: 29.4486 },
  nelspruit: { lat: -25.4753, lng: 30.9694 },
  kimberley: { lat: -28.7323, lng: 24.7623 },
} as const;

// =============================================================================
// VALID ENUMS
// =============================================================================

/**
 * Valid service types for coverage checking
 */
export const VALID_SERVICE_TYPES: readonly ServiceType[] = [
  'fibre',
  'fixed_lte',
  'uncapped_wireless',
  'licensed_wireless',
  '5g',
  'lte',
  '3g_900',
  '3g_2100',
  '2g',
] as const;

/**
 * Valid coverage providers
 */
export const VALID_PROVIDERS: readonly CoverageProvider[] = [
  'mtn',
  'dfa',
  'openserve',
  'vodacom',
  'telkom',
  'cell_c',
] as const;

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  warnings?: string[];
}

export interface CoordinateValidationResult extends ValidationResult {
  isInSouthAfrica: boolean;
  confidence: 'high' | 'medium' | 'low';
  nearestCity?: string;
  distanceToNearestCity?: number;
}

// =============================================================================
// COORDINATE VALIDATION
// =============================================================================

/**
 * Check if coordinates are within South Africa
 *
 * @param coordinates - Coordinates to validate
 * @returns true if within South Africa bounds
 */
export function isInSouthAfrica(coordinates: Coordinates): boolean {
  return (
    coordinates.lat >= SOUTH_AFRICA_BOUNDS.south &&
    coordinates.lat <= SOUTH_AFRICA_BOUNDS.north &&
    coordinates.lng >= SOUTH_AFRICA_BOUNDS.west &&
    coordinates.lng <= SOUTH_AFRICA_BOUNDS.east
  );
}

/**
 * Validate coordinates with detailed result
 *
 * @param coordinates - Coordinates to validate
 * @returns Detailed validation result with confidence and warnings
 */
export function validateCoordinates(coordinates: Coordinates): CoordinateValidationResult {
  const warnings: string[] = [];

  // Check for invalid numbers
  if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return {
      valid: false,
      error: 'Coordinates must be numbers',
      code: 'INVALID_COORDINATES',
      isInSouthAfrica: false,
      confidence: 'low',
    };
  }

  // Check for NaN
  if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
    return {
      valid: false,
      error: 'Coordinates cannot be NaN',
      code: 'INVALID_COORDINATES',
      isInSouthAfrica: false,
      confidence: 'low',
    };
  }

  // Check valid range (-90 to 90 for lat, -180 to 180 for lng)
  if (coordinates.lat < -90 || coordinates.lat > 90) {
    return {
      valid: false,
      error: 'Latitude must be between -90 and 90',
      code: 'INVALID_COORDINATES',
      isInSouthAfrica: false,
      confidence: 'low',
    };
  }

  if (coordinates.lng < -180 || coordinates.lng > 180) {
    return {
      valid: false,
      error: 'Longitude must be between -180 and 180',
      code: 'INVALID_COORDINATES',
      isInSouthAfrica: false,
      confidence: 'low',
    };
  }

  // Check South Africa bounds
  const inSA = isInSouthAfrica(coordinates);

  if (!inSA) {
    return {
      valid: false,
      error: 'Coordinates must be within South Africa',
      code: 'LOCATION_OUT_OF_BOUNDS',
      isInSouthAfrica: false,
      confidence: 'high',
      warnings: ['Coordinates are outside South African territory'],
    };
  }

  // Find nearest major city
  const nearest = findNearestCity(coordinates);

  // Determine confidence based on distance to major city
  let confidence: 'high' | 'medium' | 'low' = 'high';

  if (nearest.distance > 200) {
    confidence = 'low';
    warnings.push('Location is far from major urban areas - coverage may be limited');
  } else if (nearest.distance > 50) {
    confidence = 'medium';
    warnings.push('Location is in a suburban/semi-rural area');
  }

  return {
    valid: true,
    isInSouthAfrica: true,
    confidence,
    nearestCity: nearest.city,
    distanceToNearestCity: nearest.distance,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Find the nearest major city to given coordinates
 */
function findNearestCity(coordinates: Coordinates): { city: string; distance: number } {
  let nearestCity = '';
  let minDistance = Infinity;

  for (const [city, cityCoords] of Object.entries(MAJOR_CITIES)) {
    const distance = calculateDistance(coordinates, cityCoords);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.replace('_', ' ');
    }
  }

  return { city: nearestCity, distance: Math.round(minDistance) };
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

/**
 * Validate a coverage check request
 *
 * @param request - The coverage check request to validate
 * @returns Validation result with error details if invalid
 */
export function validateCoverageRequest(request: unknown): ValidationResult {
  // Check request is an object
  if (!request || typeof request !== 'object') {
    return {
      valid: false,
      error: 'Request body must be a JSON object',
      code: 'INVALID_REQUEST',
    };
  }

  const req = request as Partial<CoverageCheckRequest>;

  // Check either address or coordinates provided
  if (!req.address && !req.coordinates) {
    return {
      valid: false,
      error: 'Either address or coordinates must be provided',
      code: 'MISSING_LOCATION',
    };
  }

  // Validate coordinates if provided
  if (req.coordinates) {
    const coordValidation = validateCoordinates(req.coordinates);
    if (!coordValidation.valid) {
      return {
        valid: false,
        error: coordValidation.error,
        code: coordValidation.code,
      };
    }
  }

  // Validate service types if provided
  if (req.serviceTypes) {
    const serviceValidation = validateServiceTypes(req.serviceTypes);
    if (!serviceValidation.valid) {
      return serviceValidation;
    }
  }

  // Validate providers if provided
  if (req.providers) {
    const providerValidation = validateProviders(req.providers);
    if (!providerValidation.valid) {
      return providerValidation;
    }
  }

  return { valid: true };
}

/**
 * Validate service types array
 */
export function validateServiceTypes(serviceTypes: unknown): ValidationResult {
  if (!Array.isArray(serviceTypes)) {
    return {
      valid: false,
      error: 'serviceTypes must be an array',
      code: 'INVALID_SERVICE_TYPES',
    };
  }

  for (const serviceType of serviceTypes) {
    if (!VALID_SERVICE_TYPES.includes(serviceType as ServiceType)) {
      return {
        valid: false,
        error: `Invalid service type: ${serviceType}. Valid types: ${VALID_SERVICE_TYPES.join(', ')}`,
        code: 'INVALID_SERVICE_TYPE',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate providers array
 */
export function validateProviders(providers: unknown): ValidationResult {
  if (!Array.isArray(providers)) {
    return {
      valid: false,
      error: 'providers must be an array',
      code: 'INVALID_PROVIDERS',
    };
  }

  for (const provider of providers) {
    if (!VALID_PROVIDERS.includes(provider as CoverageProvider)) {
      return {
        valid: false,
        error: `Invalid provider: ${provider}. Valid providers: ${VALID_PROVIDERS.join(', ')}`,
        code: 'INVALID_PROVIDER',
      };
    }
  }

  return { valid: true };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse coordinates from query string parameters
 */
export function parseCoordinatesFromQuery(
  lat: string | null,
  lng: string | null
): { coordinates: Coordinates } | { error: string; code: string } {
  if (!lat || !lng) {
    return {
      error: 'lat and lng query parameters are required',
      code: 'MISSING_COORDINATES',
    };
  }

  const coordinates: Coordinates = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  };

  if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
    return {
      error: 'Invalid coordinates',
      code: 'INVALID_COORDINATES',
    };
  }

  return { coordinates };
}

/**
 * Normalize coordinates to consistent precision (4 decimal places)
 */
export function normalizeCoordinates(coordinates: Coordinates): Coordinates {
  return {
    lat: Math.round(coordinates.lat * 10000) / 10000,
    lng: Math.round(coordinates.lng * 10000) / 10000,
  };
}

/**
 * Generate a cache key from coordinates
 */
export function generateCacheKey(
  coordinates: Coordinates,
  options?: { providers?: string[]; serviceTypes?: string[] }
): string {
  const normalized = normalizeCoordinates(coordinates);
  const providers = (options?.providers || ['mtn']).sort().join(',');
  const services = (options?.serviceTypes || []).sort().join(',');
  return `${normalized.lat},${normalized.lng}_${providers}_${services}`;
}
