/**
 * Pure helpers for Network Analytics (Phase 3).
 * No I/O — unit-tested aggregates for group traffic, radio util, SSID activity.
 */

import { avgOrNull, roundPercent } from './performance-aggregates';

export type GroupRollupRow = {
  group_id: string;
  group_name: string | null;
  total_rx_bytes: number | null;
  total_tx_bytes: number | null;
  captured_at: string;
};

export type GroupTrafficCard = {
  groupId: string;
  groupName: string;
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  sampleCount: number;
  lastCapturedAt: string | null;
};

export type RadioDeviceRow = {
  sn: string;
  device_name: string;
  status: string;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
  radio_2g_channel?: number | null;
  radio_5g_channel?: number | null;
};

export type RadioUtilSummary = {
  avg2g: number | null;
  avg5g: number | null;
  avgBlended: number | null;
  devicesWithRadio: number;
  totalDevices: number;
  channels2g: number[];
  channels5g: number[];
  byDevice: Array<{
    sn: string;
    device_name: string;
    status: string;
    radio_2g_utilization: number | null;
    radio_5g_utilization: number | null;
  }>;
};

export type SsidStaRow = {
  ssid?: string | null;
};

export type SsidActivityCard = {
  ssid: string;
  clients: number;
};

/**
 * Sum rollup traffic per group within the selected window.
 * Only returns groups that have at least one rollup row.
 */
export function computeGroupTrafficCards(rows: GroupRollupRow[]): GroupTrafficCard[] {
  const byGroup = new Map<
    string,
    {
      groupName: string;
      rx: number;
      tx: number;
      samples: number;
      lastCapturedAt: string | null;
    }
  >();

  for (const row of rows) {
    if (!row.group_id) continue;
    const prev = byGroup.get(row.group_id) || {
      groupName: row.group_name || row.group_id,
      rx: 0,
      tx: 0,
      samples: 0,
      lastCapturedAt: null as string | null,
    };
    prev.rx += Number(row.total_rx_bytes) || 0;
    prev.tx += Number(row.total_tx_bytes) || 0;
    prev.samples += 1;
    if (row.group_name) prev.groupName = row.group_name;
    if (
      !prev.lastCapturedAt ||
      new Date(row.captured_at).getTime() > new Date(prev.lastCapturedAt).getTime()
    ) {
      prev.lastCapturedAt = row.captured_at;
    }
    byGroup.set(row.group_id, prev);
  }

  return Array.from(byGroup.entries())
    .map(([groupId, v]) => ({
      groupId,
      groupName: v.groupName,
      totalRxBytes: v.rx,
      totalTxBytes: v.tx,
      totalBytes: v.rx + v.tx,
      sampleCount: v.samples,
      lastCapturedAt: v.lastCapturedAt,
    }))
    .filter((c) => c.totalBytes > 0 || c.sampleCount > 0)
    .sort((a, b) => b.totalBytes - a.totalBytes);
}

/**
 * Radio / channel util from device cache only.
 * Returns null averages when no device has util metrics (empty UI, no fake dBm).
 */
export function computeRadioUtilSummary(devices: RadioDeviceRow[]): RadioUtilSummary {
  const withRadio = devices.filter(
    (d) => d.radio_2g_utilization != null || d.radio_5g_utilization != null
  );
  const channels2g = [
    ...new Set(
      devices
        .map((d) => d.radio_2g_channel)
        .filter((c): c is number => typeof c === 'number' && !Number.isNaN(c))
    ),
  ].sort((a, b) => a - b);
  const channels5g = [
    ...new Set(
      devices
        .map((d) => d.radio_5g_channel)
        .filter((c): c is number => typeof c === 'number' && !Number.isNaN(c))
    ),
  ].sort((a, b) => a - b);

  const avg2g = avgOrNull(devices.map((d) => d.radio_2g_utilization));
  const avg5g = avgOrNull(devices.map((d) => d.radio_5g_utilization));
  const blended = devices.map((d) =>
    avgOrNull([d.radio_2g_utilization, d.radio_5g_utilization])
  );

  return {
    avg2g: avg2g == null ? null : roundPercent(avg2g),
    avg5g: avg5g == null ? null : roundPercent(avg5g),
    avgBlended: (() => {
      const v = avgOrNull(blended);
      return v == null ? null : roundPercent(v);
    })(),
    devicesWithRadio: withRadio.length,
    totalDevices: devices.length,
    channels2g,
    channels5g,
    byDevice: withRadio
      .map((d) => ({
        sn: d.sn,
        device_name: d.device_name,
        status: d.status,
        radio_2g_utilization: d.radio_2g_utilization,
        radio_5g_utilization: d.radio_5g_utilization,
      }))
      .sort((a, b) => {
        const aMax = Math.max(a.radio_2g_utilization ?? 0, a.radio_5g_utilization ?? 0);
        const bMax = Math.max(b.radio_2g_utilization ?? 0, b.radio_5g_utilization ?? 0);
        return bMax - aMax;
      }),
  };
}

/**
 * Client counts by SSID from live STA rows (not byte traffic).
 * Empty when Ruijie STA has no SSID associations.
 */
export function aggregateSsidActivity(stas: SsidStaRow[]): SsidActivityCard[] {
  const counts = new Map<string, number>();
  for (const sta of stas) {
    const ssid = (sta.ssid || '').trim();
    if (!ssid) continue;
    counts.set(ssid, (counts.get(ssid) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([ssid, clients]) => ({ ssid, clients }))
    .sort((a, b) => b.clients - a.clients || a.ssid.localeCompare(b.ssid));
}
