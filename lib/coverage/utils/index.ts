/**
 * Coverage Utilities
 *
 * Consolidated utilities for coverage checking:
 * - Geocoding: Address to coordinates conversion
 * - Validation: Coordinate and request validation
 * - Cache: Unified caching with request deduplication
 *
 * @module lib/coverage/utils
 */

// Geocoding
export {
  geocodeAddress,
  batchGeocode,
  type GeocodeResult,
  GeocodingError,
  type GeocodingErrorCode,
} from './geocoding';

// Validation
export {
  // South Africa bounds
  SOUTH_AFRICA_BOUNDS,
  MAJOR_CITIES,

  // Valid enums
  VALID_SERVICE_TYPES,
  VALID_PROVIDERS,

  // Coordinate validation
  isInSouthAfrica,
  validateCoordinates,
  calculateDistance,

  // Request validation
  validateCoverageRequest,
  validateServiceTypes,
  validateProviders,

  // Utilities
  parseCoordinatesFromQuery,
  normalizeCoordinates,
  generateCacheKey,

  // Types
  type ValidationResult,
  type CoordinateValidationResult,
} from './validation';

// Cache
export {
  CoverageCache,
  coverageCache,
  preloadCache,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
} from './cache';
