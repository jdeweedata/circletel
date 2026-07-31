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
  periodLabel: 'June 2026 (calendar month)',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  timezone: 'Africa/Johannesburg',
  generatedAt: '2026-07-31T15:28:00+02:00',
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
    note: 'Site-level BNG aggregate for the period. Not SSID-split.',
  },
  /** Sparse daily series for chart/table placeholders (GB download). */
  dailyDownloadGb: [
    3.2, 4.1, 5.8, 4.4, 6.2, 2.1, 1.8, 5.5, 6.0, 5.1, 4.8, 5.9, 2.0, 1.5, 6.4, 7.1, 5.3, 4.9,
    5.6, 2.2, 1.9, 6.8, 7.4, 5.0, 4.7, 5.2, 2.3, 1.6, 6.1, 5.8,
  ],
  staffWifi: {
    available: false,
    statusLabel: 'Not available — instrumentation pending',
    ssids: ['Unjani Clinic Staff'],
    unlockChecklist: [
      'Link AP serials to corporate_sites',
      'Persist STA session-byte rollups by SSID',
      'Allow-list Unjani Clinic Staff (and Free WiFi) SSIDs',
    ],
  },
  patientWifi: {
    available: true,
    source: 'TDX/ThinkWiFi (manual Looker export)',
    uniqueUsers: 1842,
    loginSessions: 6210,
    downloadGb: 96.3,
    footnote:
      'Source: TDX/ThinkWiFi (manual export) · period June 2026 · aggregate/anonymised · may be revised by TDX · do not sum with Staff or BNG totals.',
  },
} as const;

export type MockSiteUsageReport = typeof MOCK_SITE_USAGE_REPORT;

export const VARIANT_META = [
  { key: 'A', name: 'Classic document' },
  { key: 'B', name: 'Executive dashboard sheet' },
  { key: 'C', name: 'Dual-source narrative' },
] as const;
