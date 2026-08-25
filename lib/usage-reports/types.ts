export type ReportPeriodPreset = 'weekly' | 'monthly' | 'sixty_day' | 'custom';

export type CoreTrafficSource =
  | 'ruijie_hourly'
  | 'interstellio_daily'
  | 'unavailable';

export interface ReportPeriod {
  preset: ReportPeriodPreset;
  timezone: 'Africa/Johannesburg';
  startIso: string; // offset-aware SAST
  endIso: string;
  startUtc: Date;
  endUtc: Date;
  label: string;
  rangeLabel: string;
  inclusiveDayCount: number;
  /** true when inclusiveDayCount <= 7 — Ruijie-eligible primary */
  isShortPeriod: boolean;
}

/**
 * Why no core traffic source was permitted. Every flag is already computed by
 * `assembleCoreTraffic` while choosing a source — surfaced so the UI can name
 * each applicable cause instead of one generic message (#689).
 *
 * More than one cause can be true at once (no AP linked AND no subscriber
 * mapping); consumers should list every false flag, not just the first.
 */
export interface CoreUnavailableDiagnosis {
  /** `corporate_sites.interstellio_subscriber_id` is set. */
  interstellioMapped: boolean;
  /** Site resolves to a Ruijie device with a `group_id` in the cache. */
  ruijieLinked: boolean;
  /** That group has at least one rollup row inside the report window. */
  ruijieCoversWindow: boolean;
  /**
   * Whether the Ruijie series is this site's alone. False while
   * `ruijie_traffic_rollups` is keyed by `group_id` — roughly ten clinics share
   * one representative AP's flow, so it cannot stand in for a single site
   * (#698). Distinct from `ruijieLinked`: the device IS linked, the data just
   * is not per-site. Flips true when per-device collection lands (#702).
   */
  ruijiePerDeviceSeries: boolean;
}

export type StaffWifiState =
  | { kind: 'available'; totalBytes: number; rxBytes: number; txBytes: number }
  | { kind: 'no_samples' }
  | { kind: 'ap_unlinked' };

export type PatientWifiSource = 'ruijie_ssid' | 'tdx_csv' | 'combined';

export type PatientWifiState =
  | {
      kind: 'available';
      /** Ruijie Free Clinic SSID rollups, TDX CSV, or both (GB from Ruijie when combined). */
      source: PatientWifiSource;
      /** Present when a TDX/Looker row was supplied; null for Ruijie-only. */
      uniqueUsers: number | null;
      loginSessions: number | null;
      downloadGb: number;
      /** STA byte totals when source is ruijie_ssid or combined; null for tdx_csv. */
      rxBytes: number | null;
      txBytes: number | null;
      totalBytes: number | null;
    }
  | { kind: 'no_samples' }
  | { kind: 'ap_unlinked' }
  /** @deprecated Prefer no_samples / ap_unlinked — kept for transitional call sites. */
  | { kind: 'awaiting_export' };

export interface SiteUsageReportModel {
  generatedAtIso: string;
  site: {
    id: string;
    name: string;
    accountNumber: string;
    corporateCode: string;
    accountName: string;
  };
  period: ReportPeriod;
  core: {
    source: CoreTrafficSource;
    sourceLabel: string;
    downloadBytes: number;
    uploadBytes: number;
    avgDownKbps: number | null;
    peakBucketBytes: number | null;
    dailyDownloadBytes: number[]; // length = inclusiveDayCount
    /**
     * Whether each day carried at least one sample — same length and order as
     * `dailyDownloadBytes`. A day can be covered and read 0 bytes (a quiet day);
     * an uncovered day has no data at all and must never be drawn as a zero
     * (#689). Ruijie retention (~14 days) makes this routine on long periods.
     */
    dailyCovered: boolean[];
    note: string;
    /** Present only when `source === 'unavailable'`. */
    unavailable?: CoreUnavailableDiagnosis;
    secondaryInterstellio?: {
      downloadBytes: number;
      uploadBytes: number;
    };
  };
  device: {
    name: string;
    model: string;
    serial: string;
    group: string;
    status: string;
  } | null;
  unjani: boolean;
  staff: StaffWifiState;
  patient: PatientWifiState;
}

export type AssembleSkipReason =
  | 'core_unavailable'
  | 'site_not_eligible';
