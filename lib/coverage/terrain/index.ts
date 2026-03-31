/**
 * Terrain Analysis Module
 *
 * Exports for elevation data and Fresnel zone analysis.
 * Used by the coverage prediction model (lib/coverage/prediction/).
 */

export {
  getElevation,
  getElevationBatch,
  getElevationProfile,
  haversineDistanceM,
} from './elevation-client';

export {
  calculateFresnelRadius,
  analyseFresnelClearance,
  calculateObstructionLoss,
  isLineOfSight,
} from './fresnel-zone';

export type {
  Coordinate,
  ElevationPoint,
  ElevationProfile,
  FresnelAnalysis,
  ElevationCacheEntry,
} from './types';
