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
  /** Device-reported client count. Undocumented but present on live responses. */
  userCnt?: number;
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
  /** Cumulative session bytes (up + down). */
  wifiUpDown?: number;
  floorNoise?: number;
  pktLoseRate?: number;
  score?: number;
  /** Why the score is low, e.g. "heavy interference". Empty string when healthy. */
  scoreReason?: string;
  /** Round-trip latency in ms. */
  timeDelay?: number;
  /** Session duration in ms. */
  activeTime?: number;
  /** Client hostname, when the device advertises one. */
  userName?: string;
  /** Client hardware vendor, e.g. "HUAWEI". */
  manufacture?: string;
};

/** Subset of the devicemgtlogs entry needed to derive uptime. */
export type DeviceLogRaw = {
  logType?: string;
  /** "ON" | "OFF" on onoffline entries. Undocumented but present on live responses. */
  logSubType?: string;
  logDetail?: string;
  operateTime?: number;
};

export type StaDeviceMetrics = {
  online_clients: number;
  radio_2g_channel: number | null;
  radio_5g_channel: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
};

/** Device health beyond CPU/memory, from a single current_performance call. */
export type DeviceSystemHealth = {
  cpu_usage: number | null;
  memory_usage: number | null;
  cpu_temp: number | null;
  memory_free_kb: number | null;
  flash_rate: number | null;
  flash_free_kb: number | null;
  disk_rate: number | null;
  disk_free_kb: number | null;
  process_num: number | null;
  user_count: number | null;
};

/** Client-experience view of an AP, derived from the STAs attached to it. */
export type StaDeviceExperience = {
  avg_latency_ms: number | null;
  worst_latency_ms: number | null;
  avg_score: number | null;
  worst_score: number | null;
  worst_score_reason: string | null;
  noise_floor_2g: number | null;
  noise_floor_5g: number | null;
  clients_2g: number;
  clients_5g: number;
  longest_session_ms: number | null;
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

/** Coerce a Ruijie numeric that may arrive as a number or a string. */
function toNum(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : null;
}

export function mapCurrentPerformance(
  data: CurrentPerformanceRaw | null | undefined
): DeviceSystemHealth {
  const temp = toNum(data?.cpuTemp);
  return {
    cpu_usage: toNum(data?.cpuRate),
    memory_usage: toNum(data?.memoryRate),
    // RAP2200/RAP62 have no temperature sensor and always report 0 — not a real reading.
    cpu_temp: temp !== null && temp > 0 ? temp : null,
    memory_free_kb: toNum(data?.memoryFree),
    flash_rate: toNum(data?.flashRate),
    flash_free_kb: toNum(data?.flashFree),
    disk_rate: toNum(data?.diskRate),
    disk_free_kb: toNum(data?.diskFree),
    process_num: toNum(data?.processNum),
    user_count: toNum(data?.userCnt),
  };
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

/**
 * Client-experience summary for one AP (API V2.0.3 §2.5.1 fields the fleet sync ignores).
 * Separate from aggregateStaMetricsForDevice, whose shape the sync path depends on.
 */
export function aggregateStaExperienceForDevice(
  stas: StaUserRaw[],
  sn: string
): StaDeviceExperience {
  const mine = stas.filter((s) => s.sn === sn);

  const latencies: number[] = [];
  const scores: number[] = [];
  const noise2g: number[] = [];
  const noise5g: number[] = [];
  const sessions: number[] = [];
  let clients2g = 0;
  let clients5g = 0;
  let worstScore: number | null = null;
  let worstScoreReason: string | null = null;

  for (const sta of mine) {
    const latency = toNum(sta.timeDelay);
    if (latency !== null) latencies.push(latency);

    const score = toNum(sta.score);
    if (score !== null) {
      scores.push(score);
      if (worstScore === null || score < worstScore) {
        worstScore = score;
        // Ruijie sends an empty string when the client is healthy.
        worstScoreReason = sta.scoreReason ? sta.scoreReason : null;
      }
    }

    const noise = toNum(sta.floorNoise);
    const session = toNum(sta.activeTime);
    if (session !== null) sessions.push(session);

    if (is2g(sta.band)) {
      clients2g++;
      if (noise !== null) noise2g.push(noise);
    } else if (is5g(sta.band)) {
      clients5g++;
      if (noise !== null) noise5g.push(noise);
    }
  }

  return {
    avg_latency_ms: avg(latencies),
    worst_latency_ms: latencies.length ? Math.max(...latencies) : null,
    avg_score: avg(scores),
    worst_score: worstScore,
    worst_score_reason: worstScoreReason,
    noise_floor_2g: avg(noise2g),
    noise_floor_5g: avg(noise5g),
    clients_2g: clients2g,
    clients_5g: clients5g,
    longest_session_ms: sessions.length ? Math.max(...sessions) : null,
  };
}

/**
 * Uptime in seconds since the most recent "device online" event.
 *
 * Ruijie's Cloud JSON APIs expose no uptime field, but devicemgtlogs (§2.6.4) carries
 * onoffline events. Returns null when the device's last transition was OFF, or when
 * there is no onoffline history — never a guess.
 */
export function deriveUptimeFromLogs(
  logs: DeviceLogRaw[],
  nowMs: number = Date.now()
): number | null {
  const transitions = logs
    .filter((l) => l.logType === 'onoffline' && toNum(l.operateTime) !== null)
    .sort((a, b) => (b.operateTime ?? 0) - (a.operateTime ?? 0));

  const latest = transitions[0];
  if (!latest) return null;

  // logSubType is the reliable signal; logDetail is the documented fallback.
  const isOnline = latest.logSubType
    ? latest.logSubType.toUpperCase() === 'ON'
    : /online/i.test(latest.logDetail || '') && !/offline/i.test(latest.logDetail || '');
  if (!isOnline) return null;

  const elapsed = nowMs - (latest.operateTime ?? 0);
  return elapsed > 0 ? Math.floor(elapsed / 1000) : null;
}

/**
 * Seconds covered by a flow series, derived from the timestamps themselves.
 *
 * flow/show/hour returns 10-minute buckets in practice (144 points per 24h), not hourly
 * ones, so counting points as hours understates average rate by ~6x. Falls back to one
 * hour per point only when there aren't enough timestamps to measure a gap.
 */
export function estimateSpanSeconds(points: Array<{ timestamp: number }>): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return 3600;

  const sorted = points.map((p) => p.timestamp).sort((a, b) => a - b);
  const bucketMs = sorted[1] - sorted[0];
  const spanMs = sorted[sorted.length - 1] - sorted[0] + Math.max(bucketMs, 0);
  return spanMs > 0 ? spanMs / 1000 : points.length * 3600;
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
