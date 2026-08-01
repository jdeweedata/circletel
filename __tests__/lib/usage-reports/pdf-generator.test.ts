import { reportModelToCsv } from '@/lib/usage-reports/csv';
import {
  buildWeekBands,
  generateSiteUsageReportPdf,
  generateSkipSlipPdf,
} from '@/lib/usage-reports/pdf-generator';
import type { SiteUsageReportModel } from '@/lib/usage-reports/types';

const minimalModel: SiteUsageReportModel = {
  generatedAtIso: '2026-08-01T12:00:00+02:00',
  site: {
    id: 'site-alexandra',
    name: 'Alexandra',
    accountNumber: 'CT-2026-00001',
    corporateCode: 'UNJ-ALEX',
    accountName: 'Unjani Clinics',
  },
  period: {
    preset: 'monthly',
    timezone: 'Africa/Johannesburg',
    startIso: '2026-07-01T00:00:00+02:00',
    endIso: '2026-08-01T00:00:00+02:00',
    startUtc: new Date('2026-06-30T22:00:00Z'),
    endUtc: new Date('2026-07-31T22:00:00Z'),
    label: 'Monthly · Jul 2026',
    rangeLabel: '1–31 Jul 2026',
    inclusiveDayCount: 31,
    isShortPeriod: false,
  },
  core: {
    source: 'interstellio_daily',
    sourceLabel: 'Interstellio daily',
    downloadBytes: 120_000_000_000,
    uploadBytes: 12_000_000_000,
    avgDownKbps: 850,
    peakBucketBytes: 1_500_000_000,
    dailyDownloadBytes: Array.from({ length: 31 }, (_, index) => (index + 1) * 100_000_000),
    note: 'Daily BNG usage for the selected period.',
  },
  device: {
    name: 'Alexandra AP',
    model: 'RG-EG105G',
    serial: 'SN-ALEX-001',
    group: 'Unjani',
    status: 'online',
  },
  unjani: true,
  staff: {
    kind: 'available',
    totalBytes: 8_000_000_000,
    rxBytes: 6_000_000_000,
    txBytes: 2_000_000_000,
  },
  patient: {
    kind: 'available',
    uniqueUsers: 250,
    loginSessions: 410,
    downloadGb: 18.5,
  },
};

describe('site usage report exports', () => {
  it('generates a PDF buffer', () => {
    const buffer = generateSiteUsageReportPdf(minimalModel);

    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('generates a skip slip PDF buffer', () => {
    const buffer = generateSkipSlipPdf({
      siteLabel: 'Alexandra',
      periodLabel: 'Monthly · Jul 2026',
      reason: 'No usable Ruijie or Interstellio source for this period',
      generatedAtIso: '2026-08-01T12:00:00+02:00',
    });

    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('generates the companion CSV', () => {
    const csv = reportModelToCsv(minimalModel);

    expect(csv).toContain('site,period,core source,download GB,upload GB');
    expect(csv).toContain('Alexandra,Monthly · Jul 2026,Interstellio daily');
    expect(csv).toContain('250,410,18.50');
  });

  it('uses Monday-aligned week bands', () => {
    expect(buildWeekBands('2026-07-01T00:00:00+02:00', 31)).toEqual([
      { label: 'Week 1', start: 0, span: 5 },
      { label: 'Week 2', start: 5, span: 7 },
      { label: 'Week 3', start: 12, span: 7 },
      { label: 'Week 4', start: 19, span: 7 },
      { label: 'Week 5', start: 26, span: 5 },
    ]);
  });

  it.each([
    ['no_samples', 'Not available — no Staff Wi-Fi samples in this period'],
    ['ap_unlinked', 'Not available — AP not linked to site'],
  ] as const)('exports the %s Staff N/A reason', (kind, reason) => {
    const csv = reportModelToCsv({
      ...minimalModel,
      staff: { kind },
      patient: { kind: 'awaiting_export' },
    });

    expect(csv).toContain(reason);
    expect(csv).toContain('Awaiting TDX export');
  });
});
