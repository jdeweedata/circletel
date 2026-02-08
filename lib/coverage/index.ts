/**
 * Coverage Module
 *
 * Centralized exports for coverage checking functionality.
 * Includes types, utilities, providers, and the aggregation service.
 *
 * @module lib/coverage
 *
 * @example
 * ```typescript
 * import {
 *   coverageAggregationService,
 *   geocodeAddress,
 *   validateCoordinates,
 *   isInSouthAfrica,
 *   CoverageCache,
 * } from '@/lib/coverage';
 *
 * // Check coverage at coordinates
 * const result = await coverageAggregationService.aggregateCoverage({
 *   lat: -26.2041,
 *   lng: 28.0473,
 * });
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export {
  // Core types
  type Coordinates,
  type CoverageCheckRequest,
  type CoverageCheckResult,
  type CoverageCheckResponse,
  type CoverageResponse,
  type ServiceCoverage,
  type ProviderCoverage,
  type CoverageArea,
  type CoverageLayer,
  type CoverageCache as CoverageCacheInterface,

  // Enums/unions
  type ServiceType,
  type SignalStrength,
  type CoverageProvider,

  // Error types
  CoverageError,
  type CoverageErrorCode,

  // Provider interface
  type ICoverageProvider,

  // Base station types
  type BaseStationCoverageConfidence,
  type TaranaBaseStation,
  type BaseStationProximityResult,
} from './types';

// =============================================================================
// UTILITIES
// =============================================================================

export {
  // Geocoding
  geocodeAddress,
  batchGeocode,
  GeocodingError,
  type GeocodeResult,
  type GeocodingErrorCode,

  // Validation
  SOUTH_AFRICA_BOUNDS,
  MAJOR_CITIES,
  VALID_SERVICE_TYPES,
  VALID_PROVIDERS,
  isInSouthAfrica,
  validateCoordinates,
  calculateDistance,
  validateCoverageRequest,
  validateServiceTypes,
  validateProviders,
  parseCoordinatesFromQuery,
  normalizeCoordinates,
  generateCacheKey,
  type ValidationResult,
  type CoordinateValidationResult,

  // Cache
  CoverageCache,
  coverageCache,
  preloadCache,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
} from './utils';

// =============================================================================
// PROVIDERS
// =============================================================================

export {
  // Base provider
  BaseCoverageProvider,
  ProviderRegistry,
  providerRegistry,
  type ProviderConfig,
  type ProviderStatus,
  type ProviderCoverageResult,
  type ProviderServiceResult,
} from './providers/base-provider';

// DFA Provider
export { dfaCoverageClient } from './providers/dfa';
export { dfaProductMapper } from './providers/dfa';

// =============================================================================
// AGGREGATION SERVICE
// =============================================================================

export {
  CoverageAggregationService,
  coverageAggregationService,
  type AggregatedCoverageResponse,
  type ServiceCoverageRecommendation,
  type CoverageAggregationOptions,
} from './aggregation-service';

// =============================================================================
// MTN CLIENTS (for direct access when needed)
// =============================================================================

// Note: These are typically used internally by the aggregation service.
// Most consumers should use coverageAggregationService instead.

export { mtnWMSRealtimeClient, MTN_WMS_LAYERS } from './mtn/wms-realtime-client';
export { mtnWholesaleClient } from './mtn/wholesale-client';
export { mtnNADClient } from './mtn/nad-client';
export { mtnCoverageCache } from './mtn/cache';
export { geographicValidator } from './mtn/geo-validation';
export { checkBaseStationProximity, shouldShowSkyFibre } from './mtn/base-station-service';
