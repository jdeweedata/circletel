import JSZip from 'jszip';

import {
  buildUsageReportArtifact,
  type UsageReportArtifactDeps,
} from '@/lib/usage-reports/artifacts';
import type { SiteUsageReportModel } from '@/lib/usage-reports/types';

const period: SiteUsageReportModel['period'] = {
  preset: 'weekly',
  timezone: 'Africa/Johannesburg',
  startIso: '2026-07-20T00:00:00+02:00',
  endIso: '2026-07-26T23:59:59.999+02:00',
  startUtc: new Date('2026-07-19T22:00:00.000Z'),
  endUtc: new Date('2026-07-26T21:59:59.999Z'),
  label: 'Weekly',
  rangeLabel: '20 Jul – 26 Jul 2026',
  inclusiveDayCount: 7,
  isShortPeriod: true,
};

function model(siteId: string, accountNumber: string): SiteUsageReportModel {
  return {
    generatedAtIso: '2026-08-01T18:00:00+02:00',
    site: {
      id: siteId,
      name: `Clinic ${siteId}`,
      accountNumber,
      corporateCode: 'UNJ',
      accountName: 'Unjani Clinics',
    },
    period,
    core: {
      source: 'ruijie_hourly',
      sourceLabel: 'Ruijie hourly',
      downloadBytes: 10,
      uploadBytes: 5,
      avgDownKbps: 1,
      peakBucketBytes: 2,
      dailyDownloadBytes: [1, 1, 1, 1, 1, 1, 1],
      note: 'Measured',
    },
    device: null,
    unjani: true,
    staff: { kind: 'no_samples' },
    patient: { kind: 'awaiting_export' },
  };
}

describe('buildUsageReportArtifact', () => {
  it('returns a PDF directly for one generated site', async () => {
    const deps: UsageReportArtifactDeps = {
      assemble: async ({ siteId }) => ({ ok: true, model: model(siteId, 'UNJ-001') }),
      reportPdf: () => Uint8Array.from([1, 2, 3]).buffer,
      skipPdf: () => Uint8Array.from([9]).buffer,
      csv: () => 'csv',
    };

    const artifact = await buildUsageReportArtifact(
      {
        sites: [{ id: 'site-1', accountNumber: 'UNJ-001' }],
        period,
        patientRows: [],
        includeCsv: false,
      },
      deps
    );

    expect(artifact.contentType).toBe('application/pdf');
    expect(artifact.filename).toBe('CircleTel_Usage_UNJ-001_2026-07-20_to_2026-07-26.pdf');
    expect([...artifact.bytes]).toEqual([1, 2, 3]);
    expect(artifact.outcome).toEqual({ generated: ['site-1'], skipped: [] });
  });

  it('packs PDFs, CSVs, and explicit skip slips into a ZIP', async () => {
    const seenPatientRows: unknown[] = [];
    const deps: UsageReportArtifactDeps = {
      assemble: async ({ siteId, patientRow }) => {
        seenPatientRows.push(patientRow);
        return siteId === 'site-2'
          ? {
              ok: false,
              reason: 'core_unavailable',
              siteId,
              siteLabel: 'Clinic Two',
            }
          : { ok: true, model: model(siteId, 'UNJ-001') };
      },
      reportPdf: () => Uint8Array.from([1]).buffer,
      skipPdf: () => Uint8Array.from([9]).buffer,
      csv: () => 'site,data\r\n',
    };

    const artifact = await buildUsageReportArtifact(
      {
        sites: [
          { id: 'site-1', accountNumber: 'UNJ-001' },
          { id: 'site-2', accountNumber: 'UNJ-002' },
        ],
        period,
        patientRows: [
          { siteCode: 'unj-001', uniqueUsers: 3, loginSessions: 4, downloadGb: 5 },
        ],
        includeCsv: true,
      },
      deps
    );
    const zip = await JSZip.loadAsync(artifact.bytes);

    expect(artifact.contentType).toBe('application/zip');
    expect(Object.keys(zip.files).sort()).toEqual([
      'CircleTel_Usage_Clinic_Two_2026-07-20_to_2026-07-26_SKIPPED.pdf',
      'CircleTel_Usage_UNJ-001_2026-07-20_to_2026-07-26.csv',
      'CircleTel_Usage_UNJ-001_2026-07-20_to_2026-07-26.pdf',
    ]);
    expect(await zip.file(/SKIPPED/)[0].async('uint8array')).toEqual(Uint8Array.from([9]));
    expect(seenPatientRows).toEqual([
      { siteCode: 'unj-001', uniqueUsers: 3, loginSessions: 4, downloadGb: 5 },
      null,
    ]);
    expect(artifact.outcome).toEqual({
      generated: ['site-1'],
      skipped: [{ siteId: 'site-2', reason: 'core_unavailable' }],
    });
  });
});
