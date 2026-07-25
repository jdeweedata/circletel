/**
 * Pure mappers for Ruijie Cloud performance APIs (V2.0.3)
 * - 2.6.6 current_performance
 * - 2.5.1 sta_users
 * - 2.6.2 flow/show/hour request body
 */

export type CurrentPerformanceRaw = {
  cpuRate?: number;
  memoryRate?: number;
  memoryFree?: number;
  flashRate?: number;
  processNum?: number;
  cpuTemp?: number;
  flashFree?: number;
  diskRate?: number;
  diskFree?: number;
};

export type StaUserRaw = {
  sn?: string;
  mac?: string;
  band?: string;
  channel?: string | number;
  utilization?: number | string;
  rssi?: string | number;
  ssid?: string;
  userIp?: string;
  uplinkRate?: number;
  downlinkRate?: number;
  wifiUp?: number;
  wifiDown?: number;
  floorNoise?: number;
  pktLoseRate?: number;
  score?: number;
};

export type StaDeviceMetrics = {
  online_clients: number;
  radio_2g_channel: number | null;
  radio_5g_channel: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
};

function is2g(band: string | undefined): boolean {
  if (!band) return false;
  const b = band.toLowerCase().replace(/\s/g, '');
  return b.includes('2.4') || b === '2g' || b.startsWith('2g');
}

function is5g(band: string | undefined): boolean {
  if (!band) return false;
  const b = band.toLowerCase().replace(/\s/g, '');
  return b.includes('5g') || b.startsWith('5');
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function modeChannel(channels: number[]): number | null {
  if (!channels.length) return null;
  const counts = new Map<number, number>();
  for (const c of channels) {
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  let best = channels[0];
  let bestCount = 0;
  for (const [ch, n] of counts) {
    if (n > bestCount) {
      best = ch;
      bestCount = n;
    }
  }
  return best;
}

export function mapCurrentPerformance(data: CurrentPerformanceRaw | null | undefined): {
  cpu_usage: number | null;
  memory_usage: number | null;
} {
  if (!data) {
    return { cpu_usage: null, memory_usage: null };
  }
  const cpu =
    typeof data.cpuRate === 'number' && Number.isFinite(data.cpuRate) ? data.cpuRate : null;
  const mem =
    typeof data.memoryRate === 'number' && Number.isFinite(data.memoryRate)
      ? data.memoryRate
      : null;
  return { cpu_usage: cpu, memory_usage: mem };
}

export function aggregateStaMetricsForDevice(
  stas: StaUserRaw[],
  sn: string
): StaDeviceMetrics {
  const mine = stas.filter((s) => s.sn === sn);
  const util2g: number[] = [];
  const util5g: number[] = [];
  const ch2g: number[] = [];
  const ch5g: number[] = [];

  for (const sta of mine) {
    const util =
      typeof sta.utilization === 'number'
        ? sta.utilization
        : parseFloat(String(sta.utilization ?? ''));
    const channel =
      typeof sta.channel === 'number'
        ? sta.channel
        : parseInt(String(sta.channel ?? ''), 10);

    if (is2g(sta.band)) {
      if (Number.isFinite(util)) util2g.push(util);
      if (Number.isFinite(channel) && channel > 0) ch2g.push(channel);
    } else if (is5g(sta.band)) {
      if (Number.isFinite(util)) util5g.push(util);
      if (Number.isFinite(channel) && channel > 0) ch5g.push(channel);
    }
  }

  return {
    online_clients: mine.length,
    radio_2g_channel: modeChannel(ch2g),
    radio_5g_channel: modeChannel(ch5g),
    radio_2g_utilization: avg(util2g),
    radio_5g_utilization: avg(util5g),
  };
}

export function buildHourlyFlowRequest(opts: {
  sn: string;
  hours: number;
  endMs?: number;
}): { sn: string; startDate: number; endDate: number } {
  const endDate = opts.endMs ?? Date.now();
  const hours = Math.max(1, opts.hours);
  return {
    sn: opts.sn,
    startDate: endDate - hours * 60 * 60 * 1000,
    endDate,
  };
}

/** Prefer gateway/EG serials for flow APIs that target Reyee EG. */
export function pickFlowDeviceSn(
  devices: Array<{ sn: string; status?: string; model?: string | null; role?: string }>
): string | null {
  if (!devices.length) return null;
  const online = devices.filter((d) => d.status === 'online');
  const pool = online.length ? online : devices;
  const gateway = pool.find(
    (d) =>
      d.role === 'gateway' ||
      /egw?|gateway|firewall/i.test(d.model || '') ||
      /^eg/i.test(d.model || '')
  );
  return (gateway || pool[0])?.sn ?? null;
}
