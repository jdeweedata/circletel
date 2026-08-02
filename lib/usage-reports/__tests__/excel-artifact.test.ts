/**
 * Excel format for site usage reports: the workbook generator itself, and the
 * artifact builder's format routing (single-site xlsx, multi-site zip of xlsx,
 * skip slips staying PDF).
 */

import ExcelJS from 'exceljs';
import JSZip from 'jszip';

import {
  buildUsageReportArtifact,
  EXCEL_CONTENT_TYPE,
  type UsageReportArtifactDeps,
} from '../artifacts';
import { generateSiteUsageReportExcel } from '../excel';
import type { ReportPeriod, SiteUsageReportModel } from '../types';

const PERIOD: ReportPeriod = {
  preset: 'weekly',
  timezone: 'Africa/Johannesburg',
  startIso: '2026-07-27T00:00:00+02:00',
  endIso: '2026-08-02T23:59:59+02:00',
  startUtc: new Date('2026-07-26T22:00:00Z'),
  endUtc: new Date('2026-08-02T21:59:59Z'),
  label: 'Last complete week',
  rangeLabel: '27 Jul – 2 Aug 2026',
  inclusiveDayCount: 7,
  isShortPeriod: true,
};

function fixtureModel(overrides?: Partial<SiteUsageReportModel['core']>): SiteUsageReportModel {
  return {
    generatedAtIso: '2026-08-02T15:00:00.000Z',
    site: {
      id: 'site-1',
      name: 'Unjani Clinic Thokoza',
      accountNumber: 'CT-UNJ-014',
      corporateCode: 'UNJANI',
      accountName: 'Unjani Clinics NPC',
    },
    period: PERIOD,
    core: {
      source: 'ruijie_hourly',
      sourceLabel: 'Ruijie AP hourly flow',
      downloadBytes: 14_800_000_000,
      uploadBytes: 4_600_000_000,
      avgDownKbps: 210,
      peakBucketBytes: 702_100_000,
      dailyDownloadBytes: [1e9, 2e9, 0, 3e9, 4e9, 2.4e9, 2.4e9],
      dailyCovered: [true, true, false, true, true, true, true],
      note: 'Ruijie per-device rollups.',
      ...overrides,
    },
    device: {
      name: 'UNJANICLINICTHOKOZA',
      model: 'RAP2200(F)',
      serial: 'G1U52HL044467',
      group: 'Unjani',
      status: 'online',
    },
    unjani: true,
    staff: { kind: 'available', totalBytes: 5e9, rxBytes: 4e9, txBytes: 1e9 },
    patient: { kind: 'available', uniqueUsers: 120, loginSessions: 340, downloadGb: 88.4 },
  };
}

describe('generateSiteUsageReportExcel', () => {
  it('produces Overview + Daily traffic sheets with uncovered days left EMPTY, not zero', async () => {
    const buffer = await generateSiteUsageReportExcel(fixtureModel());

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Overview',
      'Daily traffic',
    ]);

    const overview = workbook.getWorksheet('Overview')!;
    expect(overview.getRow(1).getCell(2).value).toBe('Unjani Clinic Thokoza');

    const daily = workbook.getWorksheet('Daily traffic')!;
    // header + 7 days + totals
    expect(daily.rowCount).toBe(1 + 7 + 1);
    // Day 3 (index 2) is uncovered: bytes cell empty, coverage says "no data".
    const uncovered = daily.getRow(4);
    expect(uncovered.getCell(2).value).toBeNull();
    expect(uncovered.getCell(3).value).toBe('no data');
    // A covered zero-byte day would still show 0 — but here day 1 has data.
    expect(daily.getRow(2).getCell(2).value).toBe(1e9);
    // Totals row carries the period total.
    const totals = daily.getRow(daily.rowCount);
    expect(totals.getCell(1).value).toBe('TOTAL');
    expect(totals.getCell(2).value).toBe(14_800_000_000);
    // Dates follow the period start.
    expect(daily.getRow(2).getCell(1).value).toBe('2026-07-27');
    expect(daily.getRow(8).getCell(1).value).toBe('2026-08-02');
  });
});

describe('buildUsageReportArtifact format routing', () => {
  const model = fixtureModel();

  function stubDeps(): UsageReportArtifactDeps {
    return {
      assemble: jest.fn(async () => ({ ok: true as const, model })),
      reportPdf: jest.fn(() => new TextEncoder().encode('%PDF-fake').buffer),
      reportExcel: jest.fn(async () => Buffer.from('PK-fake-xlsx')),
      skipPdf: jest.fn(() => new TextEncoder().encode('%PDF-skip').buffer),
      csv: jest.fn(() => 'a,b\r\n'),
    };
  }

  const input = {
    period: PERIOD,
    patientRows: [],
    includeCsv: false,
  };

  it('single site + excel → xlsx artifact', async () => {
    const deps = stubDeps();
    const artifact = await buildUsageReportArtifact(
      { ...input, sites: [{ id: 'site-1', accountNumber: 'CT-UNJ-014' }], format: 'excel' },
      deps
    );
    expect(artifact.contentType).toBe(EXCEL_CONTENT_TYPE);
    expect(artifact.filename).toMatch(/\.xlsx$/);
    expect(deps.reportExcel).toHaveBeenCalledTimes(1);
    expect(deps.reportPdf).not.toHaveBeenCalled();
  });

  it('single site with no format → pdf artifact (backwards compatible)', async () => {
    const deps = stubDeps();
    const artifact = await buildUsageReportArtifact(
      { ...input, sites: [{ id: 'site-1', accountNumber: 'CT-UNJ-014' }] },
      deps
    );
    expect(artifact.contentType).toBe('application/pdf');
    expect(artifact.filename).toMatch(/\.pdf$/);
    expect(deps.reportExcel).not.toHaveBeenCalled();
  });

  it('multiple sites + excel → zip of xlsx files', async () => {
    const deps = stubDeps();
    // Distinct account numbers per site — the filename comes from the model.
    (deps.assemble as jest.Mock)
      .mockResolvedValueOnce({ ok: true, model })
      .mockResolvedValueOnce({
        ok: true,
        model: { ...model, site: { ...model.site, accountNumber: 'CT-UNJ-015' } },
      });
    const artifact = await buildUsageReportArtifact(
      {
        ...input,
        sites: [
          { id: 'site-1', accountNumber: 'CT-UNJ-014' },
          { id: 'site-2', accountNumber: 'CT-UNJ-015' },
        ],
        format: 'excel',
      },
      deps
    );
    expect(artifact.contentType).toBe('application/zip');
    const zip = await JSZip.loadAsync(artifact.bytes);
    const names = Object.keys(zip.files);
    expect(names).toHaveLength(2);
    expect(names.every((name) => name.endsWith('.xlsx'))).toBe(true);
  });

  it('skipped site + excel → skip slip stays a PDF inside the zip', async () => {
    const deps = stubDeps();
    (deps.assemble as jest.Mock)
      .mockResolvedValueOnce({ ok: true, model })
      .mockResolvedValueOnce({
        ok: false,
        reason: 'core_unavailable',
        siteLabel: 'CT-UNJ-016',
      });
    const artifact = await buildUsageReportArtifact(
      {
        ...input,
        sites: [
          { id: 'site-1', accountNumber: 'CT-UNJ-014' },
          { id: 'site-3', accountNumber: 'CT-UNJ-016' },
        ],
        format: 'excel',
      },
      deps
    );
    const zip = await JSZip.loadAsync(artifact.bytes);
    const names = Object.keys(zip.files);
    expect(names.some((name) => name.endsWith('.xlsx'))).toBe(true);
    expect(names.some((name) => name.endsWith('_SKIPPED.pdf'))).toBe(true);
    expect(deps.skipPdf).toHaveBeenCalledTimes(1);
  });
});
