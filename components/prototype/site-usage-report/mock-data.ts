/**
 * PROTOTYPE — throwaway mock for Site Network Usage Report PDF layouts (#667).
 * Not production telemetry. Wipe with the prototype branch.
 */

export const MOCK_SITE_USAGE_REPORT = {
  title: 'Site Network Usage Report',
  siteName: 'Unjani Clinic — Alexandra',
  siteCode: 'CT-UNJ-002',
  corporateCode: 'UNJ',
  accountName: 'Unjani Clinics NPC',
  periodLabel: 'June 2026',
  periodType: 'Last complete calendar month',
  periodRangeLabel: '1 – 30 June 2026',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  timezone: 'Africa/Johannesburg',
  timezoneShort: 'SAST',
  /** Machine stamp (audit) */
  generatedAt: '2026-07-31T15:28:00+02:00',
  /** Human stamp for PDF/UI header */
  generatedAtLabel: '31 July 2026, 15:28 SAST',
  generatedBy: 'admin@circletel.co.za',
  primarySource: 'Interstellio BNG (PPPoE)',
  secondarySource: null as string | null,
  device: {
    name: 'UNJANIALEX2',
    model: 'RAP2200(F)',
    serial: 'G1U52HL00261B',
    group: 'Unjani',
    status: 'Online',
  },
  coreTraffic: {
    downloadGb: 142.6,
    uploadGb: 18.4,
    avgDownKbps: 448.2,
    avgUpKbps: 57.9,
    peakBucketMb: 980.4,
    note: 'Site-level BNG aggregate for the period. Not SSID-split — includes all Wi-Fi + wired use on the circuit.',
  },
  dailyDownloadGb: [
    3.2, 4.1, 5.8, 4.4, 6.2, 2.1, 1.8, 5.5, 6.0, 5.1, 4.8, 5.9, 2.0, 1.5, 6.4, 7.1, 5.3, 4.9,
    5.6, 2.2, 1.9, 6.8, 7.4, 5.0, 4.7, 5.2, 2.3, 1.6, 6.1, 5.8,
  ],
  staffWifi: {
    /** Preview assumes instrumentation live (#672 / #682) — not the old critical-gap panel. */
    available: true,
    ssids: ['Unjani Clinic Staff'],
    source: 'CircleTel STA session-byte rollups (SSID)',
    /** SUM(rx+tx) for period — mock monthly Staff volume */
    totalGb: 12.4,
    downloadGb: 11.1,
    uploadGb: 1.3,
    footnote:
      'Source: CircleTel STA session-byte rollups · SSID Unjani Clinic Staff · sampled telemetry (not accounting-grade) · forward-only from sampler go-live · may undercount short sessions / gaps · do not sum with Patient or BNG totals.',
  },
  patientWifi: {
    available: true,
    source: 'TDX/ThinkWiFi (manual Looker export)',
    uniqueUsers: 1842,
    loginSessions: 6210,
    downloadGb: 96.3,
    footnote:
      'Source: TDX/ThinkWiFi (manual export) · 1–30 June 2026 · aggregate/anonymised · may be revised by TDX · do not sum with Staff or BNG totals.',
  },
} as const;

export type MockSiteUsageReport = typeof MOCK_SITE_USAGE_REPORT;

export const VARIANT_META = [
  { key: 'A', name: 'Classic document' },
  { key: 'B', name: 'Executive dashboard sheet' },
  { key: 'C', name: 'Dual-source narrative' },
] as const;
