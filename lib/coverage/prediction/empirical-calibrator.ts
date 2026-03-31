/**
 * Empirical Calibrator
 *
 * Uses data from tarana_link_metrics (collected from deployed RNs) to
 * calibrate the theoretical link budget model. Computes a per-BN correction
 * factor (dB offset) based on the difference between predicted and actual RSSI.
 *
 * With 14 deployed RNs, we get initial calibration data immediately.
 * Accuracy improves as more links are deployed and more data accumulates.
 */

import { createClient } from '@/lib/supabase/server';
import { calculateFreeSpacePathLoss, TARANA_G1_DEFAULTS } from './link-budget';
import type { CalibrationData } from './types';

const CALIBRATION_WINDOW_DAYS = 7;
const MIN_SAMPLES_FOR_HIGH_CONFIDENCE = 50;
const MIN_SAMPLES_FOR_MEDIUM_CONFIDENCE = 10;

/**
 * Get calibration data for a specific Base Node.
 * Compares predicted RSSI (from link budget) vs actual RSSI from collected metrics.
 */
export async function getCalibrationData(bnSerial: string): Promise<CalibrationData> {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - CALIBRATION_WINDOW_DAYS);

  const { data: metrics, error } = await supabase
    .from('tarana_link_metrics')
    .select('rssi_dbm, distance_m, rn_lat, rn_lng, bn_lat, bn_lng, captured_at')
    .eq('bn_serial_number', bnSerial)
    .gte('captured_at', since.toISOString())
    .not('rssi_dbm', 'is', null)
    .not('distance_m', 'is', null)
    .order('captured_at', { ascending: false })
    .limit(500);

  if (error || !metrics || metrics.length === 0) {
    return {
      bnSerial,
      correctionDb: 0,
      sampleCount: 0,
      confidenceLevel: 'none',
      avgPredictedRssi: null,
      avgActualRssi: null,
      avgErrorDb: null,
      lastUpdated: null,
    };
  }

  // Calculate predicted RSSI for each sample using pure FSPL
  const errors: number[] = [];
  let sumActualRssi = 0;
  let sumPredictedRssi = 0;

  for (const m of metrics) {
    if (!m.rssi_dbm || !m.distance_m) continue;

    const distanceKm = m.distance_m / 1000;
    const fspl = calculateFreeSpacePathLoss(distanceKm, TARANA_G1_DEFAULTS.frequencyGHz);
    const eirpDbm = TARANA_G1_DEFAULTS.txPowerDbm + TARANA_G1_DEFAULTS.txAntennaGainDbi;
    const predictedRssi = eirpDbm - fspl + TARANA_G1_DEFAULTS.rxAntennaGainDbi;

    errors.push(m.rssi_dbm - predictedRssi); // Positive = actual better than predicted
    sumActualRssi += m.rssi_dbm;
    sumPredictedRssi += predictedRssi;
  }

  if (errors.length === 0) {
    return {
      bnSerial,
      correctionDb: 0,
      sampleCount: 0,
      confidenceLevel: 'none',
      avgPredictedRssi: null,
      avgActualRssi: null,
      avgErrorDb: null,
      lastUpdated: null,
    };
  }

  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
  const avgActualRssi = sumActualRssi / errors.length;
  const avgPredictedRssi = sumPredictedRssi / errors.length;

  const confidenceLevel =
    errors.length >= MIN_SAMPLES_FOR_HIGH_CONFIDENCE ? 'high' :
    errors.length >= MIN_SAMPLES_FOR_MEDIUM_CONFIDENCE ? 'medium' : 'low';

  return {
    bnSerial,
    correctionDb: avgError,
    sampleCount: errors.length,
    confidenceLevel,
    avgPredictedRssi,
    avgActualRssi,
    avgErrorDb: avgError,
    lastUpdated: metrics[0]?.captured_at ?? null,
  };
}

/**
 * Get calibration data for all BNs that have link metrics.
 */
export async function getAllCalibrationData(): Promise<CalibrationData[]> {
  const supabase = await createClient();

  const { data: bnSerials } = await supabase
    .from('tarana_link_metrics')
    .select('bn_serial_number')
    .not('bn_serial_number', 'is', null)
    .not('rssi_dbm', 'is', null);

  if (!bnSerials) return [];

  const uniqueSerials = Array.from(new Set(bnSerials.map(r => r.bn_serial_number).filter(Boolean)));
  return Promise.all(uniqueSerials.map(serial => getCalibrationData(serial!)));
}
