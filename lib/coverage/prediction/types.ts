/**
 * Coverage Prediction Model Types
 */

import type { FresnelAnalysis } from '@/lib/coverage/terrain/types';

// ============================================================================
// Link Budget
// ============================================================================

export interface LinkBudgetParams {
  distanceKm: number;
  frequencyGHz: number;
  txPowerDbm: number;          // Transmit power (dBm)
  txAntennaGainDbi: number;    // TX antenna gain (dBi)
  rxAntennaGainDbi: number;    // RX antenna gain (dBi)
  obstructionLossDb: number;   // From Fresnel zone analysis
  rainFadeMarginDb: number;    // Fixed margin for weather
  systemLossDb: number;        // Cable, connector, body losses
}

export interface LinkBudgetResult {
  freeSpacePathLossDb: number;
  totalPathLossDb: number;
  predictedRxPowerDbm: number;  // Estimated receive power
  linkMarginDb: number;          // Margin above minimum (higher = better)
  expectedMcsIndex: number;      // 0–15, higher = faster
  estimatedThroughputDlMbps: number;
  estimatedThroughputUlMbps: number;
  signalQuality: SignalQuality;
}

// ============================================================================
// Signal Quality
// ============================================================================

export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'none';

// ============================================================================
// Coverage Prediction
// ============================================================================

export interface CoveragePrediction {
  targetLat: number;
  targetLng: number;
  nearestBnSerial: string;
  nearestBnSiteName: string;
  distanceKm: number;
  signalQuality: SignalQuality;
  confidence: 'high' | 'medium' | 'low' | 'none';
  predictedRxPowerDbm: number;
  estimatedThroughputDl: number;   // Mbps (lower bound)
  estimatedThroughputDlMax: number; // Mbps (upper bound)
  fresnelAnalysis: FresnelAnalysis | null;
  terrainObstructionLossDb: number;
  calibrationApplied: boolean;
  calibrationCorrectionDb: number;
  requiresElevatedInstall: boolean;
  computedAt: string;
}

// ============================================================================
// Calibration
// ============================================================================

export interface CalibrationData {
  bnSerial: string;
  correctionDb: number;           // dB offset to apply to predictions
  sampleCount: number;
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
  avgPredictedRssi: number | null;
  avgActualRssi: number | null;
  avgErrorDb: number | null;
  lastUpdated: string | null;
}

// ============================================================================
// Coverage Grid
// ============================================================================

export interface CoverageGridPoint extends Omit<CoveragePrediction, 'fresnelAnalysis'> {
  gridLat: number;
  gridLng: number;
}
