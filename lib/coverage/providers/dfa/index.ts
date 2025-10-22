/**
 * DFA (Dark Fibre Africa) Coverage Provider
 *
 * Complete integration for DFA ArcGIS REST API
 * Includes coverage checking, coordinate transformations, and product mapping
 */

// Export client
export { dfaCoverageClient, DFACoverageClient } from './dfa-coverage-client';

// Export product mapper
export { dfaProductMapper, DFAProductMapper } from './dfa-product-mapper';

// Export utilities
export {
  latLngToWebMercator,
  webMercatorToLatLng,
  createBoundingBox,
  calculateDistance,
  haversineDistance,
  isWithinSouthAfricaBounds,
  formatGeometryPoint,
  formatGeometryEnvelope
} from './coordinate-utils';

// Export types
export type {
  DFACoverageRequest,
  DFACoverageResponse,
  DFACoverageType,
  DFAConnectedBuilding,
  DFANearNetBuilding,
  DFADuctbank,
  ArcGISQueryResponse,
  ArcGISFeature,
  ArcGISGeometry,
  WebMercatorCoordinates,
  WGS84Coordinates,
  DFACoverageError
} from './types';

export type { MappedProduct } from './dfa-product-mapper';
