import {
  assembleSiteUsageReport,
  type AssembleReportDeps,
} from '@/lib/usage-reports/assemble-report';
import type {
  ReportPeriod,
  SiteUsageReportModel,
} from '@/lib/usage-reports/types';

const period: ReportPeriod = {
  preset: 'weekly',
  timezone: 'Africa/Johannesburg',
  startIso: '2026-07-20T00:00:00.000+02:00',
  endIso: '2026-07-26T23:59:59.999+02:00',
  startUtc: new Date('2026-07-19T22:00:00.000Z'),
  endUtc: new Date('2026-07-26T21:59:59.999Z'),
  label: 'Last complete week',
  rangeLabel: '20 - 26 Jul 2026',
  inclusiveDayCount: 7,
  isShortPeriod: true,
};

const site = {
  id: 's1',
  name: 'Unjani Clinic',
  account_number: 'UNJ-001',
  status: 'active',
  service_id: 'svc-1',
  service_status: 'active',
  corporate_code: 'UNJ',
  account_name: 'Unjani Clinics',
};

const availableCore: SiteUsageReportModel['core'] = {
  source: 'ruijie_hourly',
  sourceLabel: 'Ruijie traffic rollups (hourly)',
  downloadBytes: 1_000,
  uploadBytes: 200,
  avgDownKbps: 25,
  peakBucketBytes: 400,
  dailyDownloadBytes: [100, 200, 300, 100, 100, 100, 100],
  note: 'Hourly rollups.',
};

function buildDeps(
  overrides: Partial<AssembleReportDeps> = {}
): AssembleReportDeps {
  return {
    loadSite: async () => site,
    loadCore: async () => availableCore,
    loadStaff: async () => ({ kind: 'no_samples' }),
    loadDevice: async () => null,
    generatedAtIso: () => '2026-08-01T17:40:00.000+02:00',
    ...overrides,
  };
}

describe('assembleSiteUsageReport', () => {
  it('returns a core_unavailable skip with site identity', async () => {
    const result = await assembleSiteUsageReport({
      siteId: site.id,
      period,
      patientRow: null,
      deps: buildDeps({
        loadCore: async () => ({
          ...availableCore,
          source: 'unavailable',
          sourceLabel: 'Not available',
        }),
      }),
    });

    expect(result).toEqual({
      ok: false,
      reason: 'core_unavailable',
      siteId: 's1',
      siteLabel: 'Unjani Clinic',
    });
  });

  it('builds an Unjani model and leaves absent patient data awaiting export', async () => {
    const device = {
      name: 'Clinic AP',
      model: 'RG-EG105G',
      serial: 'SN-1',
      group: 'Unjani',
      status: 'online',
    };
    const result = await assembleSiteUsageReport({
      siteId: site.id,
      period,
      patientRow: null,
      deps: buildDeps({
        loadStaff: async () => ({
          kind: 'available',
          totalBytes: 50,
          rxBytes: 40,
          txBytes: 10,
        }),
        loadDevice: async () => device,
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model).toMatchObject({
      generatedAtIso: '2026-08-01T17:40:00.000+02:00',
      site: {
        id: 's1',
        name: 'Unjani Clinic',
        accountNumber: 'UNJ-001',
        corporateCode: 'UNJ',
        accountName: 'Unjani Clinics',
      },
      period,
      core: availableCore,
      device,
      unjani: true,
      staff: { kind: 'available' },
      patient: { kind: 'awaiting_export' },
    });
  });

  it('maps an Unjani patient export row into available patient usage', async () => {
    const result = await assembleSiteUsageReport({
      siteId: site.id,
      period,
      patientRow: {
        siteCode: 'UNJ-001',
        uniqueUsers: 12,
        loginSessions: 20,
        downloadGb: 2.5,
      },
      deps: buildDeps(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.patient).toEqual({
      kind: 'available',
      uniqueUsers: 12,
      loginSessions: 20,
      downloadGb: 2.5,
    });
  });

  it('does not load Unjani-only staff data for another corporate account', async () => {
    let staffLoads = 0;
    const result = await assembleSiteUsageReport({
      siteId: 'other-1',
      period,
      patientRow: {
        siteCode: 'OTHER-1',
        uniqueUsers: 12,
        loginSessions: 20,
        downloadGb: 2,
      },
      deps: buildDeps({
        loadSite: async () => ({
          ...site,
          id: 'other-1',
          name: 'Other Site',
          corporate_code: 'OTHER',
        }),
        loadStaff: async () => {
          staffLoads += 1;
          return { kind: 'no_samples' };
        },
      }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(staffLoads).toBe(0);
    expect(result.model.unjani).toBe(false);
    expect(result.model.staff).toEqual({ kind: 'no_samples' });
    expect(result.model.patient).toEqual({ kind: 'awaiting_export' });
  });

  it('returns site_not_eligible when the site loader has no match', async () => {
    const result = await assembleSiteUsageReport({
      siteId: 'missing',
      period,
      patientRow: null,
      deps: buildDeps({ loadSite: async () => null }),
    });

    expect(result).toEqual({
      ok: false,
      reason: 'site_not_eligible',
      siteId: 'missing',
      siteLabel: 'missing',
    });
  });
});
