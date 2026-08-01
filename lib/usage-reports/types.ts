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

export type StaffWifiState =
  | { kind: 'available'; totalBytes: number; rxBytes: number; txBytes: number }
  | { kind: 'no_samples' }
  | { kind: 'ap_unlinked' };

export type PatientWifiState =
  | {
      kind: 'available';
      uniqueUsers: number;
      loginSessions: number;
      downloadGb: number;
    }
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
    note: string;
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
