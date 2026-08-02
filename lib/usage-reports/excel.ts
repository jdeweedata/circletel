/**
 * Site usage report as an Excel workbook (exceljs).
 *
 * Two sheets: Overview (everything the PDF summarises) and Daily traffic
 * (per-day download bytes with coverage). An uncovered day keeps an EMPTY
 * bytes cell — never a zero — matching the chart rule in types.ts (#689).
 */

import ExcelJS from 'exceljs';
import type { SiteUsageReportModel } from './types';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
};

function sastTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/** Calendar date of day `index` of the period, matching the PDF's day labels. */
function dayDate(periodStartIso: string, index: number): string {
  const start = new Date(`${periodStartIso.slice(0, 10)}T00:00:00Z`);
  const date = new Date(start);
  date.setUTCDate(start.getUTCDate() + index);
  return date.toISOString().slice(0, 10);
}

function staffLabel(staff: SiteUsageReportModel['staff']): string {
  if (staff.kind === 'available') {
    return `Total ${staff.totalBytes} bytes (down ${staff.rxBytes} / up ${staff.txBytes})`;
  }
  return staff.kind === 'no_samples'
    ? 'Not available — no Staff Wi-Fi samples in this period'
    : 'Not available — AP not linked to site';
}

function patientLabel(patient: SiteUsageReportModel['patient']): string {
  if (patient.kind === 'available') {
    return `${patient.uniqueUsers} unique users, ${patient.loginSessions} sessions, ${patient.downloadGb.toFixed(2)} GB down`;
  }
  return 'Awaiting TDX export';
}

export async function generateSiteUsageReportExcel(
  model: SiteUsageReportModel
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CircleTel';
  workbook.created = new Date(model.generatedAtIso);

  // --- Overview ---
  const overview = workbook.addWorksheet('Overview');
  overview.columns = [
    { key: 'label', width: 26 },
    { key: 'value', width: 52 },
  ];
  const deviceLabel = model.device
    ? `${model.device.name} · ${model.device.model} · SN ${model.device.serial} · ${model.device.status}`
    : 'Not available';
  const rows: Array<[string, string | number]> = [
    ['Site', model.site.name],
    ['Account number', model.site.accountNumber],
    ['Corporate code', model.site.corporateCode],
    ['Account name', model.site.accountName],
    ['Report period', model.period.label],
    ['Range (SAST)', model.period.rangeLabel],
    ['Core source', model.core.sourceLabel],
    ['Downloaded bytes', model.core.downloadBytes],
    ['Uploaded bytes', model.core.uploadBytes],
    ['Avg download (Kbps)', model.core.avgDownKbps ?? 'N/A'],
    ['Peak bucket bytes', model.core.peakBucketBytes ?? 'N/A'],
    ['Staff Wi-Fi', staffLabel(model.staff)],
    ['Patient Free Wi-Fi', patientLabel(model.patient)],
    ['Device', deviceLabel],
    ['Generated (SAST)', sastTimestamp(model.generatedAtIso)],
    ['Note', model.core.note],
  ];
  rows.forEach(([label, value]) => {
    const row = overview.addRow({ label, value });
    row.getCell(1).font = { bold: true };
  });
  if (model.unjani) {
    const warning = overview.addRow({
      label: 'Warning',
      value: 'Patient + Staff + core are separate sources — do not sum.',
    });
    warning.getCell(1).font = { bold: true, color: { argb: 'FFB45309' } };
    warning.getCell(2).font = { color: { argb: 'FFB45309' } };
  }

  // --- Daily traffic ---
  const daily = workbook.addWorksheet('Daily traffic');
  daily.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Download bytes', key: 'download', width: 18 },
    { header: 'Coverage', key: 'coverage', width: 14 },
  ];
  const headerRow = daily.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });
  model.core.dailyDownloadBytes.forEach((bytes, index) => {
    const covered = model.core.dailyCovered[index] === true;
    daily.addRow({
      date: dayDate(model.period.startIso, index),
      // An uncovered day has no data — an empty cell, never a zero.
      download: covered ? bytes : null,
      coverage: covered ? 'covered' : 'no data',
    });
  });
  const totals = daily.addRow({
    date: 'TOTAL',
    download: model.core.downloadBytes,
    coverage: '',
  });
  totals.font = { bold: true };
  daily.getColumn('download').numFmt = '#,##0';

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
