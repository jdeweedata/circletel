/**
 * PROTOTYPE — throwaway. Answers wayfinder ticket #688 (map #661 → #687):
 * "What is the composition of the refactored Usage Reports page?"
 *
 * Fixture data only. The real page reads /api/admin/network/usage-reports/*,
 * which 401s on a dev box (see #691), so layout is judged against static
 * models here rather than live telemetry.
 */

import type { SiteUsageReportModel } from '@/lib/usage-reports/types';

export interface ProtoSite {
  id: string;
  name: string;
  account_number: string;
  corporate_code: string;
  account_name: string;
}

export const PROTO_SITES: ProtoSite[] = [
  {
    id: 'site-alexandra',
    name: 'Unjani Clinic Alexandra',
    account_number: 'CT-UNJ-004',
    corporate_code: 'UNJ',
    account_name: 'Unjani Clinics NPC',
  },
  {
    id: 'site-jabulani',
    name: 'Unjani Clinic Jabulani',
    account_number: 'CT-UNJ-015',
    corporate_code: 'UNJ',
    account_name: 'Unjani Clinics NPC',
  },
  {
    id: 'site-sweetwaters',
    name: 'Sweetwaters Business Park',
    account_number: 'CT-CORP-041',
    corporate_code: 'SWT',
    account_name: 'Sweetwaters Holdings',
  },
  {
    id: 'site-soshanguve',
    name: 'Unjani Clinic Soshanguve',
    account_number: 'CT-UNJ-022',
    corporate_code: 'UNJ',
    account_name: 'Unjani Clinics NPC',
  },
];

const GB = 1024 ** 3;

/** 31 daily download figures with a weekend dip — shaped like real clinic traffic. */
const ALEXANDRA_DAILY = [
  11.2, 13.8, 14.1, 12.9, 15.4, 6.2, 4.1, 13.6, 15.9, 14.8, 16.2, 15.1, 7.0, 3.8,
  14.9, 16.4, 15.2, 17.1, 16.8, 8.2, 4.4, 15.6, 17.9, 16.1, 18.2, 17.4, 7.8, 4.9,
  16.2, 17.6, 15.9,
].map((gb) => Math.round(gb * GB));

const SWEETWATERS_DAILY = [
  38.4, 41.2, 39.8, 44.1, 42.6, 9.1, 6.4, 40.2, 43.8, 45.1, 41.9, 44.6, 10.2, 7.1,
  42.8, 46.2, 44.9, 47.1, 45.3, 11.4, 6.9, 43.6, 48.2, 46.8, 49.1, 47.2, 12.1, 7.4,
  45.8, 48.9, 46.2,
].map((gb) => Math.round(gb * GB));

const BASE_PERIOD: SiteUsageReportModel['period'] = {
  preset: 'monthly',
  timezone: 'Africa/Johannesburg',
  startIso: '2026-07-01T00:00:00+02:00',
  endIso: '2026-07-31T23:59:59+02:00',
  startUtc: new Date('2026-06-30T22:00:00Z'),
  endUtc: new Date('2026-07-31T21:59:59Z'),
  label: 'Previous month',
  rangeLabel: '1 – 31 July 2026',
  inclusiveDayCount: 31,
  isShortPeriod: false,
};

export const ALEXANDRA_MODEL: SiteUsageReportModel = {
  generatedAtIso: '2026-08-01T12:14:00+02:00',
  site: {
    id: 'site-alexandra',
    name: 'Unjani Clinic Alexandra',
    accountNumber: 'CT-UNJ-004',
    corporateCode: 'UNJ',
    accountName: 'Unjani Clinics NPC',
  },
  period: BASE_PERIOD,
  core: {
    source: 'interstellio_daily',
    sourceLabel: 'Interstellio subscriber usage (daily)',
    downloadBytes: ALEXANDRA_DAILY.reduce((sum, value) => sum + value, 0),
    uploadBytes: Math.round(38.1 * GB),
    avgDownKbps: 14_200,
    peakBucketBytes: Math.round(18.2 * GB),
    dailyDownloadBytes: ALEXANDRA_DAILY,
    note: 'BNG subscriber accounting for the full period.',
  },
  device: {
    name: 'UNJANICLINICALEXANDRA',
    model: 'RAP2260(G)',
    serial: 'G1UQ9C8000421',
    group: 'Unjani',
    status: 'online',
  },
  unjani: true,
  staff: {
    kind: 'available',
    totalBytes: Math.round(61.4 * GB),
    rxBytes: Math.round(48.9 * GB),
    txBytes: Math.round(12.5 * GB),
  },
  patient: {
    kind: 'available',
    uniqueUsers: 4182,
    loginSessions: 9930,
    downloadGb: 88.4,
  },
};

export const JABULANI_MODEL: SiteUsageReportModel = {
  ...ALEXANDRA_MODEL,
  site: {
    id: 'site-jabulani',
    name: 'Unjani Clinic Jabulani',
    accountNumber: 'CT-UNJ-015',
    corporateCode: 'UNJ',
    accountName: 'Unjani Clinics NPC',
  },
  core: {
    ...ALEXANDRA_MODEL.core,
    downloadBytes: Math.round(212.8 * GB),
    uploadBytes: Math.round(19.4 * GB),
    avgDownKbps: 7_800,
    peakBucketBytes: Math.round(11.6 * GB),
    dailyDownloadBytes: ALEXANDRA_DAILY.map((value) => Math.round(value * 0.52)),
  },
  device: {
    name: 'UNJANICLINICJABULANI',
    model: 'RAP2260(G)',
    serial: 'G1UQ9C8000921',
    group: 'Unjani',
    status: 'online',
  },
  staff: { kind: 'no_samples' },
  patient: { kind: 'awaiting_export' },
};

export const SWEETWATERS_MODEL: SiteUsageReportModel = {
  generatedAtIso: '2026-08-01T12:14:00+02:00',
  site: {
    id: 'site-sweetwaters',
    name: 'Sweetwaters Business Park',
    accountNumber: 'CT-CORP-041',
    corporateCode: 'SWT',
    accountName: 'Sweetwaters Holdings',
  },
  period: BASE_PERIOD,
  core: {
    source: 'interstellio_daily',
    sourceLabel: 'Interstellio subscriber usage (daily)',
    downloadBytes: SWEETWATERS_DAILY.reduce((sum, value) => sum + value, 0),
    uploadBytes: Math.round(102.6 * GB),
    avgDownKbps: 41_600,
    peakBucketBytes: Math.round(49.1 * GB),
    dailyDownloadBytes: SWEETWATERS_DAILY,
    note: 'BNG subscriber accounting for the full period.',
    secondaryInterstellio: undefined,
  },
  device: {
    name: 'SWEETWATERS-CORE',
    model: 'RAP6262(G)',
    serial: 'G1PW4A2001180',
    group: 'Newgen Network',
    status: 'online',
  },
  unjani: false,
  staff: { kind: 'ap_unlinked' },
  patient: { kind: 'awaiting_export' },
};

export interface ProtoUnavailable {
  kind: 'unavailable';
  siteId: string;
  headline: string;
  reason: string;
  unlock: string[];
  staffNote: string;
}

export const SOSHANGUVE_UNAVAILABLE: ProtoUnavailable = {
  kind: 'unavailable',
  siteId: 'site-soshanguve',
  headline: 'Core traffic not available',
  reason:
    'A previous-month report needs Interstellio subscriber accounting, and this site has no BNG subscriber mapping. Ruijie rollups only reach back ~14 days, so they cannot cover July on their own.',
  unlock: [
    'Map the site to its Interstellio subscriber ID on the site detail page',
    'Or pick a period of 7 days or less, once the AP is linked to the site',
  ],
  staffNote: 'Staff Wi-Fi: not available — AP not linked to site',
};

export type ProtoReport = SiteUsageReportModel | ProtoUnavailable;

export const PROTO_REPORTS: Record<string, ProtoReport> = {
  'site-alexandra': ALEXANDRA_MODEL,
  'site-jabulani': JABULANI_MODEL,
  'site-sweetwaters': SWEETWATERS_MODEL,
  'site-soshanguve': SOSHANGUVE_UNAVAILABLE,
};

export function isUnavailable(report: ProtoReport): report is ProtoUnavailable {
  return (report as ProtoUnavailable).kind === 'unavailable';
}

export function gb(bytes: number): string {
  return `${(bytes / GB).toFixed(1)} GB`;
}

export function mbps(kbps: number | null): string {
  return kbps == null ? '—' : `${(kbps / 1000).toFixed(1)} Mbps`;
}

/** Bars keyed by day-of-month, matching the locked PDF axis (#667 Variant A). */
export function chartData(model: SiteUsageReportModel) {
  return model.core.dailyDownloadBytes.map((bytes, index) => ({
    day: index + 1,
    week: `Week ${Math.floor(index / 7) + 1}`,
    downloadGb: Number((bytes / GB).toFixed(2)),
  }));
}
