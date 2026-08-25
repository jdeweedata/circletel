/**
 * Ruijie STA session-byte → hourly SSID + per-client rollup helpers.
 *
 * Wayfinder #672 / #673 / #675 / #679: sample STA wifiUp/wifiDown, credit
 * positive deltas into UTC hour buckets for allow-listed SSIDs only
 * (Staff + Free Clinic WiFi). Also emits per-MAC hour deltas for
 * `ruijie_ssid_sta_traffic_rollups` (additive; SSID aggregates unchanged).
 */

import { hourBucketIso } from '@/lib/network/analytics-aggregates';
import { RUIJIE_SSID_ROLLUP_ALLOWLIST } from '@/lib/ruijie/types';

export const SSID_ROLLUP_RETENTION_DAYS = 90;
export const SSID_SAMPLE_STATE_RETENTION_HOURS = 36;
export const SSID_GROUP_DELAY_MS = 250;

export type StaSampleInput = {
  sn: string;
  mac: string;
  ssid: string;
  wifiUp: number;
  wifiDown: number;
  hostname?: string | null;
  manufacture?: string | null;
  band?: string | null;
};

export type StaSampleStateSnapshot = {
  device_sn: string;
  mac: string;
  ssid: string;
  last_wifi_up: number;
  last_wifi_down: number;
};

export type HourBucketDelta = {
  device_sn: string;
  ssid: string;
  hour_bucket: string;
  rx_bytes: number;
  tx_bytes: number;
};

/** Per-client hour credit (AP + MAC + SSID). */
export type ClientHourBucketDelta = {
  device_sn: string;
  mac: string;
  ssid: string;
  hour_bucket: string;
  rx_bytes: number;
  tx_bytes: number;
  hostname: string | null;
  manufacture: string | null;
  band: string | null;
};

export function sampleStateKey(deviceSn: string, mac: string, ssid: string): string {
  return `${deviceSn}\0${mac}\0${ssid}`;
}

export function hourBucketKey(deviceSn: string, ssid: string, hourBucket: string): string {
  return `${deviceSn}\0${ssid}\0${hourBucket}`;
}

export function clientHourBucketKey(
  deviceSn: string,
  mac: string,
  ssid: string,
  hourBucket: string
): string {
  return `${deviceSn}\0${mac}\0${ssid}\0${hourBucket}`;
}

export function isAllowlistedSsid(
  ssid: string,
  allowlist: readonly string[] = RUIJIE_SSID_ROLLUP_ALLOWLIST
): boolean {
  return allowlist.includes(ssid);
}

/**
 * Positive delta between consecutive samples for one counter.
 * - No previous → 0 (baseline only; avoid dumping long-lived session into first hour)
 * - Current >= previous → current - previous
 * - Current < previous → session reset; credit current as fresh cumulative
 */
export function positiveCounterDelta(current: number, previous: number | undefined): number {
  if (!Number.isFinite(current) || current < 0) return 0;
  if (previous === undefined || !Number.isFinite(previous)) return 0;
  if (current >= previous) return current - previous;
  return current;
}

function normalizeMeta(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Compute hour-bucket byte credits and next checkpoint state from a STA sample.
 * Returns SSID aggregates (`hourDeltas`) and per-MAC rows (`clientHourDeltas`).
 */
export function computeSsidHourDeltas(params: {
  samples: StaSampleInput[];
  previous: ReadonlyMap<string, StaSampleStateSnapshot>;
  sampledAtMs: number;
  allowlist?: readonly string[];
}): {
  hourDeltas: HourBucketDelta[];
  clientHourDeltas: ClientHourBucketDelta[];
  nextState: StaSampleStateSnapshot[];
  skippedNonAllowlisted: number;
  skippedIncomplete: number;
} {
  const allowlist = params.allowlist ?? RUIJIE_SSID_ROLLUP_ALLOWLIST;
  const hourIso = hourBucketIso(params.sampledAtMs);
  const byHour = new Map<string, HourBucketDelta>();
  const byClientHour = new Map<string, ClientHourBucketDelta>();
  const nextState: StaSampleStateSnapshot[] = [];
  let skippedNonAllowlisted = 0;
  let skippedIncomplete = 0;

  for (const sample of params.samples) {
    const sn = (sample.sn || '').trim();
    const mac = (sample.mac || '').trim().toLowerCase();
    const ssid = (sample.ssid || '').trim();
    if (!sn || !mac || !ssid) {
      skippedIncomplete += 1;
      continue;
    }
    if (!isAllowlistedSsid(ssid, allowlist)) {
      skippedNonAllowlisted += 1;
      continue;
    }

    const wifiUp = Number(sample.wifiUp);
    const wifiDown = Number(sample.wifiDown);
    if (!Number.isFinite(wifiUp) || !Number.isFinite(wifiDown)) {
      skippedIncomplete += 1;
      continue;
    }

    const hostname = normalizeMeta(sample.hostname);
    const manufacture = normalizeMeta(sample.manufacture);
    const band = normalizeMeta(sample.band != null ? String(sample.band) : null);

    const key = sampleStateKey(sn, mac, ssid);
    const prev = params.previous.get(key);
    const txDelta = positiveCounterDelta(wifiUp, prev?.last_wifi_up);
    const rxDelta = positiveCounterDelta(wifiDown, prev?.last_wifi_down);

    if (txDelta > 0 || rxDelta > 0) {
      const hKey = hourBucketKey(sn, ssid, hourIso);
      const existing = byHour.get(hKey);
      if (existing) {
        existing.rx_bytes += rxDelta;
        existing.tx_bytes += txDelta;
      } else {
        byHour.set(hKey, {
          device_sn: sn,
          ssid,
          hour_bucket: hourIso,
          rx_bytes: rxDelta,
          tx_bytes: txDelta,
        });
      }

      const cKey = clientHourBucketKey(sn, mac, ssid, hourIso);
      const existingClient = byClientHour.get(cKey);
      if (existingClient) {
        existingClient.rx_bytes += rxDelta;
        existingClient.tx_bytes += txDelta;
        if (hostname) existingClient.hostname = hostname;
        if (manufacture) existingClient.manufacture = manufacture;
        if (band) existingClient.band = band;
      } else {
        byClientHour.set(cKey, {
          device_sn: sn,
          mac,
          ssid,
          hour_bucket: hourIso,
          rx_bytes: rxDelta,
          tx_bytes: txDelta,
          hostname,
          manufacture,
          band,
        });
      }
    }

    nextState.push({
      device_sn: sn,
      mac,
      ssid,
      last_wifi_up: wifiUp,
      last_wifi_down: wifiDown,
    });
  }

  return {
    hourDeltas: Array.from(byHour.values()),
    clientHourDeltas: Array.from(byClientHour.values()),
    nextState,
    skippedNonAllowlisted,
    skippedIncomplete,
  };
}
