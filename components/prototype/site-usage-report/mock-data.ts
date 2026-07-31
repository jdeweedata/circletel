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
    available: false,
    statusLabel: 'Not available — critical gap',
    ssids: ['Unjani Clinic Staff'],
    whyMissing: [
      'CircleTel does not yet store period download/upload bytes broken down by Wi-Fi SSID.',
      'The device Traffic graph (e.g. G1U52HL00261B) is aggregate only — Free + Staff + other traffic mixed.',
      'Clients-tab RATES are live Kbps snapshots, not June GB totals — they cannot fill this section.',
      'Until STA session-byte rollups by SSID are persisted, Staff usage cannot be shown next to Patient Free Wi-Fi.',
    ],
    whyCritical:
      'Staff Wi-Fi period usage is the critical CircleTel-attributable clinic metric to view alongside Patient Free Wi-Fi (TDX). Without it, ops cannot compare staff vs patient load or investigate which SSID drives site traffic.',
    unlockChecklist: [
      'Link AP serials to corporate_sites (site ↔ device)',
      'Schedule/persist STA session-byte rollups by SSID',
      'Allow-list SSIDs: Unjani Clinic Staff and Unjani Clinic Free WiFi',
    ],
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
