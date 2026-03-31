/**
 * Fresnel Zone Calculator
 *
 * Calculates Fresnel zone clearance for a radio link path.
 * Used to determine whether terrain obstructions cause signal degradation.
 *
 * For Tarana G1:
 *   - Frequency: ~5.4 GHz (UNII-1/2/3 bands)
 *   - 1st Fresnel zone radius at 3km midpoint ≈ 4.1m
 *   - Rule of thumb: need 60% of 1st Fresnel zone clear for near-LOS performance
 */

import type { ElevationProfile, FresnelAnalysis } from './types';

const TARANA_G1_FREQUENCY_GHZ = 5.4;
const MINIMUM_FRESNEL_CLEARANCE_RATIO = 0.6; // 60% of 1st zone

/**
 * Calculate 1st Fresnel zone radius at a point along the path.
 *
 * @param d1M - Distance from transmitter to obstruction point (metres)
 * @param d2M - Distance from obstruction point to receiver (metres)
 * @param frequencyGHz - Radio frequency in GHz
 * @returns Radius of 1st Fresnel zone in metres
 */
export function calculateFresnelRadius(d1M: number, d2M: number, frequencyGHz: number = TARANA_G1_FREQUENCY_GHZ): number {
  // r1 = 17.3 * sqrt(d1*d2 / (f * (d1+d2)))  [metres, km, GHz]
  const d1Km = d1M / 1000;
  const d2Km = d2M / 1000;
  return 17.3 * Math.sqrt((d1Km * d2Km) / (frequencyGHz * (d1Km + d2Km)));
}

/**
 * Calculate Fresnel zone clearance analysis for a full elevation profile.
 *
 * @param profile - Elevation profile from BN to RN/target
 * @param bnHeightAboveGroundM - BN antenna height above its terrain elevation (metres)
 * @param rnHeightAboveGroundM - RN antenna height above its terrain elevation (metres)
 * @param frequencyGHz - Radio frequency
 */
export function analyseFresnelClearance(
  profile: ElevationProfile,
  bnHeightAboveGroundM: number = 15,
  rnHeightAboveGroundM: number = 5,
  frequencyGHz: number = TARANA_G1_FREQUENCY_GHZ
): FresnelAnalysis {
  const { points, totalDistanceM } = profile;
  if (points.length < 2) {
    return {
      clearanceRatioMin: 1,
      worstObstructionPointM: 0,
      obstructionLossDb: 0,
      isLineOfSight: true,
      fresnelRadius1M: 0,
      recommendation: 'Insufficient profile data',
    };
  }

  const txElevM = (points[0]?.elevation_m ?? 0) + bnHeightAboveGroundM;
  const rxElevM = (points[points.length - 1]?.elevation_m ?? 0) + rnHeightAboveGroundM;

  let worstClearanceRatio = Infinity;
  let worstPointM = 0;
  let worstFresnelRadius = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const d1M = (i / (points.length - 1)) * totalDistanceM;
    const d2M = totalDistanceM - d1M;

    // LOS height at this point (linear interpolation)
    const losHeightM = txElevM + (rxElevM - txElevM) * (d1M / totalDistanceM);

    // Fresnel zone radius at this point
    const fresnelR = calculateFresnelRadius(d1M, d2M, frequencyGHz);

    // Clearance = (LOS height - terrain height) / Fresnel radius
    const terrainElevM = points[i]?.elevation_m ?? 0;
    const clearance = losHeightM - terrainElevM;
    const clearanceRatio = fresnelR > 0 ? clearance / fresnelR : clearance > 0 ? 1 : -1;

    if (clearanceRatio < worstClearanceRatio) {
      worstClearanceRatio = clearanceRatio;
      worstPointM = d1M;
      worstFresnelRadius = fresnelR;
    }
  }

  if (worstClearanceRatio === Infinity) worstClearanceRatio = 1;

  const isLineOfSight = worstClearanceRatio >= 0;
  const obstructionLossDb = calculateObstructionLoss(worstClearanceRatio);
  const recommendation = getRecommendation(worstClearanceRatio, bnHeightAboveGroundM);

  return {
    clearanceRatioMin: worstClearanceRatio,
    worstObstructionPointM: worstPointM,
    obstructionLossDb,
    isLineOfSight,
    fresnelRadius1M: worstFresnelRadius,
    recommendation,
  };
}

/**
 * Estimate additional path loss (dB) from Fresnel zone obstruction.
 * Uses a simplified knife-edge diffraction approximation.
 *
 * @param clearanceRatio - Fresnel clearance ratio (1.0 = just touching 1st zone)
 */
export function calculateObstructionLoss(clearanceRatio: number): number {
  if (clearanceRatio >= MINIMUM_FRESNEL_CLEARANCE_RATIO) {
    return 0; // Adequate clearance — no loss
  }
  if (clearanceRatio >= 0) {
    // Partial obstruction: 0–6 dB loss
    return (1 - clearanceRatio / MINIMUM_FRESNEL_CLEARANCE_RATIO) * 6;
  }
  // Full obstruction (NLOS): 6–20+ dB loss based on depth
  // Tarana G1 can work with moderate NLOS due to its technology
  const nlosDepth = Math.abs(clearanceRatio);
  return Math.min(20, 6 + nlosDepth * 8);
}

/**
 * Simple LOS check — true if terrain doesn't block the direct path.
 */
export function isLineOfSight(
  profile: ElevationProfile,
  bnHeightAboveGroundM: number = 15,
  rnHeightAboveGroundM: number = 5
): boolean {
  const analysis = analyseFresnelClearance(profile, bnHeightAboveGroundM, rnHeightAboveGroundM);
  return analysis.isLineOfSight;
}

function getRecommendation(clearanceRatio: number, bnHeightM: number): string {
  if (clearanceRatio >= 1.0) return 'Excellent LOS — full Fresnel zone clear';
  if (clearanceRatio >= MINIMUM_FRESNEL_CLEARANCE_RATIO) return 'Good LOS — adequate Fresnel clearance (>=60%)';
  if (clearanceRatio >= 0) return `Partial obstruction — consider elevated RN mount (currently ${Math.round(clearanceRatio * 100)}% clearance)`;
  if (clearanceRatio >= -0.5) return 'NLOS — elevated mount required (10m+ recommended)';
  return 'Deep NLOS — significant elevation change or alternative BN recommended';
}
