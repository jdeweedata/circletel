/**
 * Coverage Predictor — Main Prediction Service
 *
 * Combines:
 *   1. BN location from tarana_base_stations
 *   2. Distance (Haversine)
 *   3. Terrain profile and Fresnel zone analysis
 *   4. Link budget calculation (FSPL + obstruction)
 *   5. Empirical calibration from collected metrics
 *
 * to produce a CoveragePrediction for any target coordinate.
 */

import { createClient } from '@/lib/supabase/server';
import { getElevationProfile, haversineDistanceM } from '@/lib/coverage/terrain/elevation-client';
import { analyseFresnelClearance } from '@/lib/coverage/terrain/fresnel-zone';
import {
  calculateLinkBudget,
  buildTaranaLinkBudgetParams,
  getSignalQuality,
  MCS_THROUGHPUT,
  TARANA_G1_DEFAULTS,
} from './link-budget';
import { getCalibrationData } from './empirical-calibrator';
import type { CoveragePrediction, CoverageGridPoint, SignalQuality } from './types';

// BN antenna height above ground (metres) — typical Tarana G1 tower
const DEFAULT_BN_HEIGHT_ABOVE_GROUND_M = 20;
// RN antenna height above ground (metres) — typical roof/wall mount
const DEFAULT_RN_HEIGHT_ABOVE_GROUND_M = 5;
// Maximum BN search radius for coverage checks
const MAX_BN_RADIUS_KM = 8;
// Terrain profile sample points
const TERRAIN_SAMPLES = 20;

/**
 * Predict coverage quality at target coordinates from a specific BN.
 */
export async function predictCoverage(
  bnSerial: string,
  targetLat: number,
  targetLng: number
): Promise<CoveragePrediction> {
  const supabase = await createClient();
  const computedAt = new Date().toISOString();

  // 1. Get BN details
  const { data: bn } = await supabase
    .from('tarana_base_stations')
    .select('serial_number, site_name, lat, lng, height_m, active_connections')
    .eq('serial_number', bnSerial)
    .single();

  if (!bn || !bn.lat || !bn.lng) {
    return buildNoCoverageResult(bnSerial, '', targetLat, targetLng, computedAt);
  }

  // 2. Calculate distance
  const distanceM = haversineDistanceM(
    { lat: bn.lat, lng: bn.lng },
    { lat: targetLat, lng: targetLng }
  );
  const distanceKm = distanceM / 1000;

  if (distanceKm > MAX_BN_RADIUS_KM) {
    return buildNoCoverageResult(bnSerial, bn.site_name, targetLat, targetLng, computedAt, distanceKm);
  }

  // 3. Get terrain profile and Fresnel analysis
  let terrainObstructionLossDb = 0;
  let fresnelAnalysis = null;

  try {
    const bnHeightAboveGround = bn.height_m
      ? Math.max(DEFAULT_BN_HEIGHT_ABOVE_GROUND_M, bn.height_m - 1700) // rough ASL to AGL
      : DEFAULT_BN_HEIGHT_ABOVE_GROUND_M;

    const profile = await getElevationProfile(
      { lat: bn.lat, lng: bn.lng },
      { lat: targetLat, lng: targetLng },
      TERRAIN_SAMPLES
    );

    fresnelAnalysis = analyseFresnelClearance(
      profile,
      bnHeightAboveGround,
      DEFAULT_RN_HEIGHT_ABOVE_GROUND_M,
      TARANA_G1_DEFAULTS.frequencyGHz
    );

    terrainObstructionLossDb = fresnelAnalysis.obstructionLossDb;
  } catch (err) {
    console.warn(
      '[CoveragePredictor] Terrain analysis failed, using 0 obstruction loss:',
      err instanceof Error ? err.message : String(err)
    );
  }

  // 4. Run link budget
  const params = buildTaranaLinkBudgetParams(distanceKm, terrainObstructionLossDb);
  const linkBudget = calculateLinkBudget(params);

  // 5. Apply empirical calibration
  let calibrationCorrectionDb = 0;
  let calibrationApplied = false;

  try {
    const calibration = await getCalibrationData(bnSerial);
    if (calibration.sampleCount > 0 && calibration.confidenceLevel !== 'none') {
      calibrationCorrectionDb = calibration.correctionDb;
      calibrationApplied = true;
    }
  } catch {
    // Calibration is optional — proceed without it
  }

  // Apply calibration correction
  const calibratedRxPower = linkBudget.predictedRxPowerDbm + calibrationCorrectionDb;
  const finalSignalQuality = getSignalQuality(calibratedRxPower);

  // Throughput range: use calibrated MCS ± 1 for range
  const mcsIdx = Math.max(
    0,
    Math.min(
      MCS_THROUGHPUT.length - 1,
      linkBudget.expectedMcsIndex + Math.round(calibrationCorrectionDb / 4)
    )
  );
  const [dlMbps] = MCS_THROUGHPUT[mcsIdx] || [0, 0];
  const dlMbpsMax = (MCS_THROUGHPUT[Math.min(mcsIdx + 1, MCS_THROUGHPUT.length - 1)] || [dlMbps])[0];

  // Confidence scoring
  const confidence = determineConfidence(distanceKm, finalSignalQuality, calibrationApplied);

  // Elevated install recommendation
  const requiresElevatedInstall =
    fresnelAnalysis !== null &&
    !fresnelAnalysis.isLineOfSight &&
    distanceKm > 2;

  return {
    targetLat,
    targetLng,
    nearestBnSerial: bnSerial,
    nearestBnSiteName: bn.site_name,
    distanceKm,
    signalQuality: finalSignalQuality,
    confidence,
    predictedRxPowerDbm: calibratedRxPower,
    estimatedThroughputDl: dlMbps,
    estimatedThroughputDlMax: dlMbpsMax,
    fresnelAnalysis,
    terrainObstructionLossDb,
    calibrationApplied,
    calibrationCorrectionDb,
    requiresElevatedInstall,
    computedAt,
  };
}

/**
 * Find the best coverage prediction at a point by checking all nearby BNs.
 */
export async function predictCoverageAtPoint(
  lat: number,
  lng: number
): Promise<CoveragePrediction | null> {
  const supabase = await createClient();

  // Find BNs within MAX_BN_RADIUS_KM using PostGIS
  const { data: nearbyBns } = await supabase.rpc('find_nearest_tarana_base_station', {
    p_lat: lat,
    p_lng: lng,
    p_limit: 3,
  });

  if (!nearbyBns || nearbyBns.length === 0) return null;

  // Run predictions for each nearby BN and return the best
  const predictions = await Promise.all(
    nearbyBns
      .filter((bn: { distance_km: number }) => bn.distance_km <= MAX_BN_RADIUS_KM)
      .map((bn: { serial_number: string }) => predictCoverage(bn.serial_number, lat, lng))
  );

  // Return prediction with best signal quality
  const qualityOrder: SignalQuality[] = ['excellent', 'good', 'fair', 'poor', 'none'];
  return predictions.sort(
    (a, b) => qualityOrder.indexOf(a.signalQuality) - qualityOrder.indexOf(b.signalQuality)
  )[0] ?? null;
}

/**
 * Generate a coverage prediction grid around a BN for map visualisation.
 * radiusKm: how far from BN to generate grid
 * gridSizeM: spacing between grid points in metres
 */
export async function generateCoverageGrid(
  bnSerial: string,
  radiusKm: number = 4,
  gridSizeM: number = 250
): Promise<CoverageGridPoint[]> {
  const supabase = await createClient();

  const { data: bn } = await supabase
    .from('tarana_base_stations')
    .select('lat, lng')
    .eq('serial_number', bnSerial)
    .single();

  if (!bn?.lat || !bn?.lng) return [];

  const gridPoints: CoverageGridPoint[] = [];
  const degPerMeterLat = 1 / 111320;
  const degPerMeterLng = 1 / (111320 * Math.cos((bn.lat * Math.PI) / 180));
  const stepsLat = Math.ceil((radiusKm * 1000) / gridSizeM);
  const stepsLng = Math.ceil((radiusKm * 1000) / gridSizeM);

  for (let i = -stepsLat; i <= stepsLat; i++) {
    for (let j = -stepsLng; j <= stepsLng; j++) {
      const gridLat = bn.lat + i * gridSizeM * degPerMeterLat;
      const gridLng = bn.lng + j * gridSizeM * degPerMeterLng;

      // Only include points within the radius
      const dist = haversineDistanceM(
        { lat: bn.lat, lng: bn.lng },
        { lat: gridLat, lng: gridLng }
      );
      if (dist / 1000 > radiusKm) continue;

      try {
        const prediction = await predictCoverage(bnSerial, gridLat, gridLng);
        const { fresnelAnalysis: _, ...rest } = prediction;
        gridPoints.push({ ...rest, gridLat, gridLng });
      } catch {
        // Skip failed grid points
      }
    }
  }

  return gridPoints;
}

// ============================================================================
// Helpers
// ============================================================================

function buildNoCoverageResult(
  bnSerial: string,
  siteName: string,
  targetLat: number,
  targetLng: number,
  computedAt: string,
  distanceKm: number = 0
): CoveragePrediction {
  return {
    targetLat,
    targetLng,
    nearestBnSerial: bnSerial,
    nearestBnSiteName: siteName,
    distanceKm,
    signalQuality: 'none',
    confidence: 'none',
    predictedRxPowerDbm: -120,
    estimatedThroughputDl: 0,
    estimatedThroughputDlMax: 0,
    fresnelAnalysis: null,
    terrainObstructionLossDb: 0,
    calibrationApplied: false,
    calibrationCorrectionDb: 0,
    requiresElevatedInstall: false,
    computedAt,
  };
}

function determineConfidence(
  distanceKm: number,
  signalQuality: SignalQuality,
  calibrationApplied: boolean
): 'high' | 'medium' | 'low' | 'none' {
  if (signalQuality === 'none') return 'none';
  if (distanceKm < 2 && (signalQuality === 'excellent' || signalQuality === 'good')) {
    return calibrationApplied ? 'high' : 'medium';
  }
  if (distanceKm < 4 && signalQuality !== 'poor') {
    return calibrationApplied ? 'medium' : 'low';
  }
  return 'low';
}
