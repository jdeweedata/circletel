/**
 * Pure helpers for Network System Health / Analytics aggregates.
 * Kept free of I/O so unit tests can lock KPI math.
 */

export type DeviceResourceRow = {
  cpu_usage: number | null;
  memory_usage: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
};

export type FleetDeviceInput = DeviceResourceRow & {
  sn: string;
  status: string;
  online_clients: number;
};

export type DeviceHealthInput = {
  health_score: number;
  anomaly_count: number;
};

export type UptimeSnapshotPoint = {
  device_sn: string;
  status: string | null;
  captured_at: string;
};

export type DailyUptimePoint = {
  date: string;
  uptimePercent: number;
  sampleCount: number;
};

export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return roundPercent(((current - previous) / previous) * 100);
}

export function bpsToMbps(bps: number): number {
  return bps / 1_000_000;
}

export function avgOrNull(
  values: Array<number | null | undefined>
): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function blendedRadio(
  radio2g: number | null | undefined,
  radio5g: number | null | undefined
): number | null {
  return avgOrNull([radio2g, radio5g]);
}

export function computeResourceAverages(rows: DeviceResourceRow[]): {
  avgCpu: number | null;
  avgMemory: number | null;
  avgRadio: number | null;
} {
  return {
    avgCpu: avgOrNull(rows.map((r) => r.cpu_usage)),
    avgMemory: avgOrNull(rows.map((r) => r.memory_usage)),
    avgRadio: avgOrNull(rows.map((r) => blendedRadio(r.radio_2g_utilization, r.radio_5g_utilization))),
  };
}

export function computeFleetOverview(input: {
  devices: FleetDeviceInput[];
  healthBySn: Record<string, DeviceHealthInput>;
  priorOnlineRate?: number | null;
  consistencyThreshold?: number;
}): {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  healthyDevices: number;
  warningDevices: number;
  criticalDevices: number;
  totalClients: number;
  uptimePercent: number;
  successRatePercent: number;
  responseConsistencyPercent: number;
  uptimeDeltaVsPrior: number | null;
  anomaliesLast24h: number;
  overallScore: number;
  resources: ReturnType<typeof computeResourceAverages>;
} {
  const threshold = input.consistencyThreshold ?? 50;
  const totalDevices = input.devices.length;
  const onlineDevices = input.devices.filter((d) => d.status === 'online').length;
  const offlineDevices = input.devices.filter((d) => d.status === 'offline').length;
  const totalClients = input.devices.reduce((sum, d) => sum + (d.online_clients || 0), 0);

  let healthyDevices = 0;
  let warningDevices = 0;
  let criticalDevices = 0;
  let totalHealthScore = 0;
  let consistent = 0;
  let anomaliesLast24h = 0;

  for (const device of input.devices) {
    const health = input.healthBySn[device.sn] ?? {
      health_score: device.status === 'online' ? 100 : 40,
      anomaly_count: 0,
    };
    const score = health.health_score;
    totalHealthScore += score;
    anomaliesLast24h += health.anomaly_count;

    if (score >= 80) healthyDevices++;
    else if (score >= 50) warningDevices++;
    else criticalDevices++;

    if (score >= threshold) consistent++;
  }

  const uptimePercent = totalDevices > 0 ? roundPercent((onlineDevices / totalDevices) * 100) : 100;
  const successRatePercent =
    totalDevices > 0 ? roundPercent((healthyDevices / totalDevices) * 100) : 100;
  const responseConsistencyPercent =
    totalDevices > 0 ? roundPercent((consistent / totalDevices) * 100) : 100;
  const overallScore =
    totalDevices > 0 ? Math.round(totalHealthScore / totalDevices) : 100;

  return {
    totalDevices,
    onlineDevices,
    offlineDevices,
    healthyDevices,
    warningDevices,
    criticalDevices,
    totalClients,
    uptimePercent,
    successRatePercent,
    responseConsistencyPercent,
    uptimeDeltaVsPrior:
      input.priorOnlineRate == null ? null : percentDelta(uptimePercent, input.priorOnlineRate),
    anomaliesLast24h,
    overallScore,
    resources: computeResourceAverages(input.devices),
  };
}

/**
 * Daily uptime = online samples / all samples that day (fleet-wide).
 * Days with no samples return 0% with sampleCount 0.
 */
export function buildDailyUptimeSeries(input: {
  days: number;
  now: Date;
  snapshots: UptimeSnapshotPoint[];
  deviceCount: number;
}): DailyUptimePoint[] {
  const dayKeys: string[] = [];
  for (let i = input.days - 1; i >= 0; i--) {
    const d = new Date(input.now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const byDay: Record<string, { online: number; total: number }> = {};
  for (const key of dayKeys) {
    byDay[key] = { online: 0, total: 0 };
  }

  for (const snap of input.snapshots) {
    const key = snap.captured_at.slice(0, 10);
    if (!byDay[key]) continue;
    byDay[key].total += 1;
    if (snap.status === 'online') byDay[key].online += 1;
  }

  return dayKeys.map((date) => {
    const bucket = byDay[date];
    const uptimePercent =
      bucket.total > 0 ? roundPercent((bucket.online / bucket.total) * 100) : 0;
    return { date, uptimePercent, sampleCount: bucket.total };
  });
}

export type DeviceRole = 'gateway' | 'switch' | 'ap' | 'unknown';

export type InventoryDeviceInput = {
  sn: string;
  device_name: string;
  model: string | null | undefined;
  status: string;
  online_clients: number;
  cpu_usage?: number | null;
  memory_usage?: number | null;
  radio_2g_utilization?: number | null;
  radio_5g_utilization?: number | null;
  management_ip?: string | null;
  wan_ip?: string | null;
  synced_at?: string | null;
};

/**
 * Classify Ruijie/Omada-like hardware from model + name heuristics.
 * Defaults unknown Wi-Fi APs to `ap` when model is empty but name suggests AP.
 */
export function classifyDeviceRole(
  model: string | null | undefined,
  deviceName: string | null | undefined
): DeviceRole {
  const hay = `${model || ''} ${deviceName || ''}`.toLowerCase();
  if (/gateway|router|\ber\d|\beg\d|er7206|er605|tl-er|tl-r/.test(hay)) return 'gateway';
  if (/switch|\bsg\d|tl-sg|tl-sl|core.?switch|access.?switch/.test(hay)) return 'switch';
  if (/\bap\b|eap|rap|access.?point|wifi|wi-fi|reyee/.test(hay)) return 'ap';
  // Ruijie fleet is predominantly APs when model unknown
  if (!model && deviceName) return 'ap';
  return 'unknown';
}

export function computeNetworkInventory(devices: InventoryDeviceInput[]): {
  gateway: number;
  ap: number;
  switchOnline: number;
  switchTotal: number;
  client: number;
  guest: number | null;
  edgeDevice: InventoryDeviceInput | null;
} {
  let gateway = 0;
  let ap = 0;
  let switchOnline = 0;
  let switchTotal = 0;
  let client = 0;

  const gateways: InventoryDeviceInput[] = [];
  const onlineDevices: InventoryDeviceInput[] = [];

  for (const device of devices) {
    const role = classifyDeviceRole(device.model, device.device_name);
    client += device.online_clients || 0;
    if (device.status === 'online') onlineDevices.push(device);

    if (role === 'gateway') {
      gateway += 1;
      gateways.push(device);
    } else if (role === 'switch') {
      switchTotal += 1;
      if (device.status === 'online') switchOnline += 1;
    } else if (role === 'ap' || role === 'unknown') {
      ap += 1;
    }
  }

  // Prefer online gateway; else busiest online device
  let edgeDevice: InventoryDeviceInput | null =
    gateways.find((g) => g.status === 'online') || gateways[0] || null;
  if (!edgeDevice && onlineDevices.length > 0) {
    edgeDevice = [...onlineDevices].sort(
      (a, b) => (b.online_clients || 0) - (a.online_clients || 0)
    )[0];
  }

  return {
    gateway,
    ap,
    switchOnline,
    switchTotal,
    client,
    guest: null, // Ruijie cache has no guest split yet
    edgeDevice,
  };
}
