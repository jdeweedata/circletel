/**
 * Coverage Prediction Module
 *
 * Terrain-aware signal quality and throughput predictions for Tarana G1 links.
 * Uses FSPL + Fresnel zone analysis + empirical calibration from deployed RNs.
 */

export {
  calculateFreeSpacePathLoss,
  calculateLinkBudget,
  getMcsFromRssi,
  getSignalQuality,
  buildTaranaLinkBudgetParams,
  TARANA_G1_DEFAULTS,
  MCS_THROUGHPUT,
} from './link-budget';

export {
  getCalibrationData,
  getAllCalibrationData,
} from './empirical-calibrator';

export {
  predictCoverage,
  predictCoverageAtPoint,
  generateCoverageGrid,
} from './coverage-predictor';

export type {
  LinkBudgetParams,
  LinkBudgetResult,
  SignalQuality,
  CoveragePrediction,
  CalibrationData,
  CoverageGridPoint,
} from './types';
