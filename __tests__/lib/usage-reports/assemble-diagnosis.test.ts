import {
  assembleSiteUsageReport,
  type AssembleReportDeps,
} from '@/lib/usage-reports/assemble-report';
import type {
  CoreUnavailableDiagnosis,
  ReportPeriod,
  SiteUsageReportModel,
} from '@/lib/usage-reports/types';

const period: ReportPeriod = {
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

const site = {
  id: 'site-1',
  name: 'Unjani Clinic Soshanguve',
  account_number: 'CT-UNJ-022',
  status: 'active',
  service_id: null,
  service_status: null,
  corporate_code: 'UNJ',
  account_name: 'Unjani Clinics NPC',
};

function unavailableCore(
  diagnosis: CoreUnavailableDiagnosis
): SiteUsageReportModel['core'] {
  return {
    source: 'unavailable',
    sourceLabel: 'No permitted source',
    downloadBytes: 0,
    uploadBytes: 0,
    avgDownKbps: null,
    peakBucketBytes: null,
    dailyDownloadBytes: Array.from({ length: 31 }, () => 0),
    dailyCovered: Array.from({ length: 31 }, () => false),
    note: 'No permitted core traffic source is available for this period.',
    unavailable: diagnosis,
  };
}

function deps(core: SiteUsageReportModel['core']): AssembleReportDeps {
  return {
    loadSite: async () => site,
    loadCore: async () => core,
    loadStaff: async () => ({ kind: 'ap_unlinked' }),
    loadDevice: async () => null,
    generatedAtIso: () => '2026-08-01T12:00:00+02:00',
  };
}

describe('assembleSiteUsageReport — unavailability diagnosis', () => {
  it('carries every applicable cause on the failure result', async () => {
    const diagnosis: CoreUnavailableDiagnosis = {
      interstellioMapped: false,
      ruijieLinked: false,
      ruijieCoversWindow: false,
      ruijiePerDeviceSeries: false,
    };

    const result = await assembleSiteUsageReport({
      siteId: 'site-1',
      period,
      patientRow: null,
      deps: deps(unavailableCore(diagnosis)),
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected an unavailable result');
    expect(result.reason).toBe('core_unavailable');
    expect(result.siteLabel).toBe('Unjani Clinic Soshanguve');
    // Both causes are true at once — the panel must be able to list both.
    expect(result.diagnosis).toEqual(diagnosis);
  });

  it('distinguishes a retention gap from a missing link', async () => {
    const diagnosis: CoreUnavailableDiagnosis = {
      interstellioMapped: false,
      ruijieLinked: true,
      ruijieCoversWindow: false,
      ruijiePerDeviceSeries: false,
    };

    const result = await assembleSiteUsageReport({
      siteId: 'site-1',
      period,
      patientRow: null,
      deps: deps(unavailableCore(diagnosis)),
    });

    if (result.ok) throw new Error('expected an unavailable result');
    // Linked but uncovered — the copy explains retention rather than telling
    // the admin to link a device that is already linked.
    expect(result.diagnosis?.ruijieLinked).toBe(true);
    expect(result.diagnosis?.ruijieCoversWindow).toBe(false);
  });

  it('leaves diagnosis absent when the site itself is not eligible', async () => {
    const result = await assembleSiteUsageReport({
      siteId: 'site-1',
      period,
      patientRow: null,
      deps: { ...deps(unavailableCore({
        interstellioMapped: false,
        ruijieLinked: false,
        ruijieCoversWindow: false,
        ruijiePerDeviceSeries: false,
      })), loadSite: async () => null },
    });

    if (result.ok) throw new Error('expected an unavailable result');
    expect(result.reason).toBe('site_not_eligible');
    expect(result.diagnosis).toBeUndefined();
  });
});
