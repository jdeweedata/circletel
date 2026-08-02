import type { SupabaseClient } from '@supabase/supabase-js';
import { getInterstellioClient } from '@/lib/interstellio';
import type { DataUsageEntry } from '@/lib/interstellio/types';
import type {
  CoreTrafficSource,
  ReportPeriod,
  SiteUsageReportModel,
} from './types';

const SAST_OFFSET_MS = 2 * 60 * 60 * 1_000;
const BYTES_PER_INTERSTELLIO_KB = 1_024;

export interface RuijieHourlyRow {
  captured_at: string;
  total_rx_bytes: number | string | null;
  total_tx_bytes: number | string | null;
  avg_rx_bps: number | string | null;
  peak_rx_bps: number | string | null;
}

export interface CoreTrafficAggregate {
  downloadBytes: number;
  uploadBytes: number;
  avgDownKbps: number | null;
  peakBucketBytes: number | null;
  dailyDownloadBytes: number[];
  /** Per-day sample presence — see `SiteUsageReportModel['core'].dailyCovered`. */
  dailyCovered: boolean[];
}

export interface RuijieHourlyLoad {
  groupId: string | null;
  rows: RuijieHourlyRow[];
}

export const CORE_SOURCE_LABEL: Record<CoreTrafficSource, string> = {
  ruijie_hourly: 'Ruijie traffic rollups (hourly)',
  interstellio_daily: 'Interstellio subscriber usage (daily)',
  unavailable: 'Not available',
};

export function selectCorePrimarySource(input: {
  isShortPeriod: boolean;
  ruijieLinked: boolean;
  ruijieCoversWindow: boolean;
  interstellioMapped: boolean;
}): CoreTrafficSource {
  const ruijieOk = input.ruijieLinked && input.ruijieCoversWindow;

  if (input.isShortPeriod) {
    if (ruijieOk) return 'ruijie_hourly';
    return input.interstellioMapped ? 'interstellio_daily' : 'unavailable';
  }

  // Long periods: prefer Interstellio (BNG accounting). MTN / TDX sites with no
  // Interstellio fall back to Ruijie AP/group rollups for hours that exist.
  if (input.interstellioMapped) return 'interstellio_daily';
  if (ruijieOk) return 'ruijie_hourly';
  return 'unavailable';
}

export function shouldAttachSecondaryInterstellio(input: {
  isShortPeriod: boolean;
  primary: CoreTrafficSource;
  interstellioMapped: boolean;
}): boolean {
  return (
    input.isShortPeriod &&
    input.primary === 'ruijie_hourly' &&
    input.interstellioMapped
  );
}

function numberOrZero(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sastDayKey(value: Date | string): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

function buildSastDayIndex(
  dayCount: number,
  start: Date
): {
  dailyDownloadBytes: number[];
  dailyCovered: boolean[];
  indexByDay: Map<string, number>;
} {
  const startKey = sastDayKey(start);
  const normalizedDayCount = Math.max(0, Math.trunc(dayCount));
  const dailyDownloadBytes = Array.from({ length: normalizedDayCount }, () => 0);
  // Starts all-false: a day is covered only once a sample lands on it.
  const dailyCovered = Array.from({ length: normalizedDayCount }, () => false);
  const indexByDay = new Map<string, number>();

  if (!startKey) return { dailyDownloadBytes, dailyCovered, indexByDay };

  const startDayUtc = new Date(`${startKey}T00:00:00.000Z`);
  for (let index = 0; index < normalizedDayCount; index += 1) {
    const key = new Date(startDayUtc.getTime() + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    indexByDay.set(key, index);
  }

  return { dailyDownloadBytes, dailyCovered, indexByDay };
}

export function aggregateRuijieHourly(
  rows: RuijieHourlyRow[],
  dayCount: number,
  start: Date
): CoreTrafficAggregate {
  const { dailyDownloadBytes, dailyCovered, indexByDay } = buildSastDayIndex(
    dayCount,
    start
  );
  let downloadBytes = 0;
  let uploadBytes = 0;
  let averageBpsTotal = 0;
  let averageBpsSamples = 0;
  let peakBucketBytes: number | null = null;

  for (const row of rows) {
    const rowDownloadBytes = numberOrZero(row.total_rx_bytes);
    downloadBytes += rowDownloadBytes;
    uploadBytes += numberOrZero(row.total_tx_bytes);
    peakBucketBytes = Math.max(peakBucketBytes ?? 0, rowDownloadBytes);

    const averageBps = Number(row.avg_rx_bps);
    if (Number.isFinite(averageBps)) {
      averageBpsTotal += averageBps;
      averageBpsSamples += 1;
    }

    const index = indexByDay.get(sastDayKey(row.captured_at) ?? '');
    if (index !== undefined) {
      dailyDownloadBytes[index] += rowDownloadBytes;
      // A row is a sample even when it reports 0 bytes — that is a quiet hour,
      // not a missing one.
      dailyCovered[index] = true;
    }
  }

  return {
    downloadBytes,
    uploadBytes,
    avgDownKbps:
      averageBpsSamples > 0
        ? averageBpsTotal / averageBpsSamples / 1_000
        : null,
    peakBucketBytes,
    dailyDownloadBytes,
    dailyCovered,
  };
}

export function aggregateInterstellioDaily(
  entries: DataUsageEntry[],
  dayCount: number,
  start: Date
): CoreTrafficAggregate {
  const { dailyDownloadBytes, dailyCovered, indexByDay } = buildSastDayIndex(
    dayCount,
    start
  );
  let downloadBytes = 0;
  let uploadBytes = 0;
  let averageKbpsTotal = 0;
  let averageKbpsSamples = 0;
  const downloadBytesByDay = new Map<number, number>();

  for (const entry of entries) {
    const entryDownloadBytes =
      numberOrZero(entry.download_kb) * BYTES_PER_INTERSTELLIO_KB;
    downloadBytes += entryDownloadBytes;
    uploadBytes += numberOrZero(entry.upload_kb) * BYTES_PER_INTERSTELLIO_KB;

    if (entry.download_kbps !== undefined && Number.isFinite(entry.download_kbps)) {
      averageKbpsTotal += entry.download_kbps;
      averageKbpsSamples += 1;
    }

    const index = indexByDay.get(sastDayKey(entry.time) ?? '');
    if (index !== undefined) {
      downloadBytesByDay.set(
        index,
        (downloadBytesByDay.get(index) ?? 0) + entryDownloadBytes
      );
    }
  }

  for (const [index, bytes] of downloadBytesByDay) {
    dailyDownloadBytes[index] = bytes;
    // Presence of an entry is the coverage signal, whatever it reports.
    dailyCovered[index] = true;
  }

  return {
    downloadBytes,
    uploadBytes,
    avgDownKbps:
      averageKbpsSamples > 0 ? averageKbpsTotal / averageKbpsSamples : null,
    peakBucketBytes:
      downloadBytesByDay.size > 0
        ? Math.max(...downloadBytesByDay.values())
        : entries.length > 0
          ? 0
          : null,
    dailyDownloadBytes,
    dailyCovered,
  };
}

export async function loadInterstellioSubscriberId(
  supabase: SupabaseClient,
  siteId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('corporate_sites')
    .select('interstellio_subscriber_id')
    .eq('id', siteId)
    .maybeSingle();

  if (error) throw error;
  return (data?.interstellio_subscriber_id as string | null | undefined) ?? null;
}

export async function loadRuijieHourlyRows(
  supabase: SupabaseClient,
  siteId: string,
  startUtc: Date,
  endUtc: Date
): Promise<RuijieHourlyLoad> {
  const { data: device, error: deviceError } = await supabase
    .from('network_devices')
    .select('ruijie_device_sn')
    .eq('corporate_site_id', siteId)
    .not('ruijie_device_sn', 'is', null)
    .limit(1)
    .maybeSingle();

  if (deviceError) throw deviceError;
  const serial = device?.ruijie_device_sn as string | null | undefined;
  if (!serial) return { groupId: null, rows: [] };

  const { data: cachedDevice, error: cacheError } = await supabase
    .from('ruijie_device_cache')
    .select('group_id')
    .eq('sn', serial)
    .not('group_id', 'is', null)
    .maybeSingle();

  if (cacheError) throw cacheError;
  const groupId = cachedDevice?.group_id as string | null | undefined;
  if (!groupId) return { groupId: null, rows: [] };

  const { data: rows, error: rollupError } = await supabase
    .from('ruijie_traffic_rollups')
    .select(
      'captured_at,total_rx_bytes,total_tx_bytes,avg_rx_bps,peak_rx_bps'
    )
    .eq('group_id', groupId)
    .eq('hours_window', 1)
    .gte('captured_at', startUtc.toISOString())
    .lte('captured_at', endUtc.toISOString())
    .order('captured_at', { ascending: true });

  if (rollupError) throw rollupError;
  return { groupId, rows: (rows ?? []) as RuijieHourlyRow[] };
}

export async function loadInterstellioDailyEntries(
  subscriberId: string,
  period: ReportPeriod
): Promise<DataUsageEntry[]> {
  return getInterstellioClient().getSubscriberUsage(subscriberId, 'daily', {
    start: period.startIso,
    end: period.endIso,
  });
}

function ruijieCoreNote(
  period: ReportPeriod,
  dailyDownloadBytes: number[]
): string {
  const daysWithSamples = dailyDownloadBytes.filter((bytes) => bytes > 0).length;
  const partial =
    !period.isShortPeriod && daysWithSamples < period.inclusiveDayCount
      ? ` Coverage is partial (${daysWithSamples} of ${period.inclusiveDayCount} days have samples; Ruijie retention is typically ~14 days).`
      : '';
  return (
    'AP / Wi-Fi group hourly rollups only — not BNG or MTN subscriber accounting. ' +
    'Totals include available hours only; missing hours may undercount.' +
    partial
  );
}

export async function assembleCoreTraffic(
  supabase: SupabaseClient,
  siteId: string,
  period: ReportPeriod
): Promise<SiteUsageReportModel['core']> {
  const subscriberId = await loadInterstellioSubscriberId(supabase, siteId);
  // Load Ruijie for short periods always; for long periods only when Interstellio
  // is absent (MTN / TDX / unmapped BNG) so we can fall back.
  const needsRuijie = period.isShortPeriod || subscriberId === null;
  const ruijie = needsRuijie
    ? await loadRuijieHourlyRows(supabase, siteId, period.startUtc, period.endUtc)
    : ({ groupId: null, rows: [] } satisfies RuijieHourlyLoad);

  const diagnosis = {
    interstellioMapped: subscriberId !== null,
    ruijieLinked: ruijie.groupId !== null,
    ruijieCoversWindow: ruijie.rows.length > 0,
  };

  const source = selectCorePrimarySource({
    isShortPeriod: period.isShortPeriod,
    ...diagnosis,
  });

  if (source === 'unavailable') {
    return {
      source,
      sourceLabel: CORE_SOURCE_LABEL[source],
      downloadBytes: 0,
      uploadBytes: 0,
      avgDownKbps: null,
      peakBucketBytes: null,
      dailyDownloadBytes: Array.from(
        { length: period.inclusiveDayCount },
        () => 0
      ),
      dailyCovered: Array.from({ length: period.inclusiveDayCount }, () => false),
      note: 'No permitted core traffic source is available for this period.',
      // Kept rather than discarded so callers can name each applicable cause.
      unavailable: diagnosis,
    };
  }

  if (source === 'interstellio_daily') {
    const entries = await loadInterstellioDailyEntries(subscriberId!, period);
    return {
      source,
      sourceLabel: CORE_SOURCE_LABEL[source],
      ...aggregateInterstellioDaily(
        entries,
        period.inclusiveDayCount,
        period.startUtc
      ),
      note: 'Interstellio daily subscriber usage (1 KB = 1,024 bytes).',
    };
  }

  const primary = aggregateRuijieHourly(
    ruijie.rows,
    period.inclusiveDayCount,
    period.startUtc
  );
  const secondaryEntries = shouldAttachSecondaryInterstellio({
    isShortPeriod: period.isShortPeriod,
    primary: source,
    interstellioMapped: subscriberId !== null,
  })
    ? await loadInterstellioDailyEntries(subscriberId!, period)
    : null;
  const secondary = secondaryEntries
    ? aggregateInterstellioDaily(
        secondaryEntries,
        period.inclusiveDayCount,
        period.startUtc
      )
    : null;

  return {
    source,
    sourceLabel: CORE_SOURCE_LABEL[source],
    ...primary,
    note: ruijieCoreNote(period, primary.dailyDownloadBytes),
    ...(secondary
      ? {
          secondaryInterstellio: {
            downloadBytes: secondary.downloadBytes,
            uploadBytes: secondary.uploadBytes,
          },
        }
      : {}),
  };
}
