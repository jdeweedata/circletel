/**
 * Link Budget Calculator for Tarana G1 Fixed Wireless
 *
 * Uses Free Space Path Loss (FSPL) + terrain obstruction loss to predict
 * received signal strength and estimated throughput at a target location.
 *
 * Tarana G1 specs used:
 *   - Frequency: 5.4 GHz
 *   - BN TX power: 30 dBm (EIRP limited by regulatory)
 *   - BN antenna gain: 18 dBi (sector antenna)
 *   - RN antenna gain: 14 dBi (CPE)
 *   - Receiver sensitivity: -90 dBm at MCS0
 *   - Rain fade margin: 3 dB (5 GHz, South Africa)
 */

import type { LinkBudgetParams, LinkBudgetResult, SignalQuality } from './types';

// Tarana G1 default RF parameters
export const TARANA_G1_DEFAULTS = {
  frequencyGHz: 5.4,
  txPowerDbm: 30,
  txAntennaGainDbi: 18,   // BN sector antenna
  rxAntennaGainDbi: 14,   // RN CPE
  rainFadeMarginDb: 3,
  systemLossDb: 2,         // Cable + connector + body losses
  rxSensitivityDbm: -90,  // At MCS0
} as const;

// MCS index to throughput mapping (approximate for Tarana G1 at 80 MHz channel)
// [dl_mbps, ul_mbps]
export const MCS_THROUGHPUT: [number, number][] = [
  [5, 2],     // MCS 0  — QPSK 1/2
  [10, 4],    // MCS 1  — QPSK 3/4
  [20, 8],    // MCS 2  — 16-QAM 1/2
  [30, 12],   // MCS 3  — 16-QAM 3/4
  [40, 18],   // MCS 4  — 64-QAM 2/3
  [55, 25],   // MCS 5  — 64-QAM 3/4
  [65, 30],   // MCS 6  — 64-QAM 5/6
  [80, 38],   // MCS 7  — 256-QAM 3/4
  [100, 45],  // MCS 8  — 256-QAM 5/6
  [120, 55],  // MCS 9  — 1024-QAM 3/4
  [150, 70],  // MCS 10 — 1024-QAM 5/6
  [180, 85],  // MCS 11 — 4096-QAM (high SNR only)
];

// RSSI thresholds for MCS selection (dBm, approximate)
// The higher the RSSI, the higher the MCS
const RSSI_MCS_THRESHOLDS = [-90, -87, -83, -80, -76, -73, -70, -66, -63, -59, -55, -50];

/**
 * Calculate Free Space Path Loss using the standard FSPL formula.
 * FSPL(dB) = 20·log10(d_km) + 20·log10(f_GHz) + 92.44
 */
export function calculateFreeSpacePathLoss(distanceKm: number, frequencyGHz: number): number {
  if (distanceKm <= 0) return 0;
  return 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyGHz) + 92.44;
}

/**
 * Calculate full link budget for a Tarana G1 link.
 */
export function calculateLinkBudget(params: LinkBudgetParams): LinkBudgetResult {
  const {
    distanceKm,
    frequencyGHz,
    txPowerDbm,
    txAntennaGainDbi,
    rxAntennaGainDbi,
    obstructionLossDb,
    rainFadeMarginDb,
    systemLossDb,
  } = params;

  const freeSpacePathLossDb = calculateFreeSpacePathLoss(distanceKm, frequencyGHz);

  const totalPathLossDb =
    freeSpacePathLossDb +
    obstructionLossDb +
    rainFadeMarginDb +
    systemLossDb;

  // EIRP = TX power + TX antenna gain
  const eirpDbm = txPowerDbm + txAntennaGainDbi;

  // Received power = EIRP - path loss + RX antenna gain
  const predictedRxPowerDbm = eirpDbm - totalPathLossDb + rxAntennaGainDbi;

  // Link margin = RX power - sensitivity (at MCS0)
  const linkMarginDb = predictedRxPowerDbm - TARANA_G1_DEFAULTS.rxSensitivityDbm;

  // Determine MCS based on received power
  const expectedMcsIndex = getMcsFromRssi(predictedRxPowerDbm);
  const [dlMbps, ulMbps] = MCS_THROUGHPUT[expectedMcsIndex] || [0, 0];

  const signalQuality = getSignalQuality(predictedRxPowerDbm);

  return {
    freeSpacePathLossDb,
    totalPathLossDb,
    predictedRxPowerDbm,
    linkMarginDb,
    expectedMcsIndex,
    estimatedThroughputDlMbps: dlMbps,
    estimatedThroughputUlMbps: ulMbps,
    signalQuality,
  };
}

/**
 * Get MCS index from predicted RSSI.
 */
export function getMcsFromRssi(rssiDbm: number): number {
  for (let i = RSSI_MCS_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rssiDbm >= RSSI_MCS_THRESHOLDS[i]) return i;
  }
  return 0; // Below minimum — may not connect
}

/**
 * Map received signal power to a signal quality category.
 */
export function getSignalQuality(rxPowerDbm: number): SignalQuality {
  if (rxPowerDbm >= -60) return 'excellent';
  if (rxPowerDbm >= -70) return 'good';
  if (rxPowerDbm >= -80) return 'fair';
  if (rxPowerDbm >= -90) return 'poor';
  return 'none';
}

/**
 * Build a LinkBudgetParams object using Tarana G1 defaults.
 */
export function buildTaranaLinkBudgetParams(
  distanceKm: number,
  obstructionLossDb: number = 0
): LinkBudgetParams {
  return {
    distanceKm,
    frequencyGHz: TARANA_G1_DEFAULTS.frequencyGHz,
    txPowerDbm: TARANA_G1_DEFAULTS.txPowerDbm,
    txAntennaGainDbi: TARANA_G1_DEFAULTS.txAntennaGainDbi,
    rxAntennaGainDbi: TARANA_G1_DEFAULTS.rxAntennaGainDbi,
    obstructionLossDb,
    rainFadeMarginDb: TARANA_G1_DEFAULTS.rainFadeMarginDb,
    systemLossDb: TARANA_G1_DEFAULTS.systemLossDb,
  };
}
