import jsPDF from 'jspdf';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';
import { formatBytesAsGb, formatBytesAsMb } from './bytes';
import type { SiteUsageReportModel } from './types';

const COLORS = {
  orange: '#F5831F',
  dark: '#1F2937',
  gray: '#6B7280',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  panel: '#F9FAFB',
  white: '#FFFFFF',
};

const STAFF_FOOTNOTE =
  'Sampled STA session telemetry (not accounting-grade); forward-only from sampler go-live; may undercount short sessions / gaps.';

export interface SkipSlipInput {
  siteLabel: string;
  periodLabel: string;
  reason: string;
  generatedAtIso: string;
}

export interface WeekBand {
  label: string;
  start: number;
  span: number;
}

export function buildWeekBands(periodStartIso: string, dayCount: number): WeekBand[] {
  if (dayCount <= 0) return [];

  const startDate = new Date(`${periodStartIso.slice(0, 10)}T00:00:00Z`);
  const firstSpan = Math.min(dayCount, (8 - startDate.getUTCDay()) % 7 || 7);
  const bands: WeekBand[] = [{ label: 'Week 1', start: 0, span: firstSpan }];
  let start = firstSpan;

  while (start < dayCount) {
    bands.push({
      label: `Week ${bands.length + 1}`,
      start,
      span: Math.min(7, dayCount - start),
    });
    start += 7;
  }

  return bands;
}

function outputBuffer(doc: jsPDF): ArrayBuffer {
  return doc.output('arraybuffer');
}

function addLogo(doc: jsPDF, x: number, y: number, size: number): void {
  try {
    // Embedded representation of public/images/circletel-enclosed-logo.png.
    doc.addImage(circleTelLogoBase64, 'PNG', x, y, size, size);
  } catch {
    doc.setFillColor(COLORS.orange);
    doc.roundedRect(x, y, size, size, 2, 2, 'F');
    doc.setTextColor(COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CT', x + size / 2, y + size / 2 + 2, { align: 'center' });
  }
}

function formatGeneratedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  }).format(new Date(iso));
}

function dayLabels(model: SiteUsageReportModel): number[] {
  const startDate = new Date(`${model.period.startIso.slice(0, 10)}T00:00:00Z`);
  return model.core.dailyDownloadBytes.map((_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    return date.getUTCDate();
  });
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark);
  doc.text(title, x, y);
}

export function generateSiteUsageReportPdf(model: SiteUsageReportModel): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. Logo + title + generated-at
  addLogo(doc, margin, 14, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(COLORS.dark);
  doc.text('SITE NETWORK USAGE REPORT', pageWidth - margin, 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(`Generated ${formatGeneratedAt(model.generatedAtIso)} SAST`, pageWidth - margin, 30, {
    align: 'right',
  });
  doc.setDrawColor(COLORS.orange);
  doc.setLineWidth(0.8);
  doc.line(margin, 43, pageWidth - margin, 43);

  // 2. Site / period
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.gray);
  doc.text('SITE', margin, 51);
  doc.text('REPORT PERIOD', pageWidth - margin, 51, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark);
  doc.text(model.site.name, margin, 58);
  doc.text(model.period.label, pageWidth - margin, 58, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(`${model.site.corporateCode} · ${model.site.accountName}`, margin, 63);
  doc.text(`${model.period.rangeLabel} · SAST`, pageWidth - margin, 63, { align: 'right' });

  // 3. KPI strip
  const kpiY = 70;
  const kpiWidth = contentWidth / 4;
  const kpis = [
    ['DOWNLOADED', formatBytesAsGb(model.core.downloadBytes)],
    ['UPLOADED', formatBytesAsGb(model.core.uploadBytes)],
    ['AVG DL', model.core.avgDownKbps === null ? 'N/A' : `${model.core.avgDownKbps.toLocaleString('en-ZA')} Kbps`],
    ['PEAK BUCKET', model.core.peakBucketBytes === null ? 'N/A' : formatBytesAsMb(model.core.peakBucketBytes)],
  ];
  doc.setFillColor(COLORS.panel);
  doc.rect(margin, kpiY, contentWidth, 18, 'F');
  kpis.forEach(([label, value], index) => {
    const x = margin + index * kpiWidth + 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.gray);
    doc.text(label, x, kpiY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(COLORS.dark);
    doc.text(value, x, kpiY + 13);
  });

  // 4. Core chart
  sectionTitle(doc, 'Core site traffic', margin, 97);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.gray);
  doc.text(`Primary: ${model.core.sourceLabel}`, pageWidth - margin, 97, { align: 'right' });
  const noteLines = doc.splitTextToSize(model.core.note, contentWidth);
  doc.text(noteLines, margin, 102);

  const chartX = margin + 4;
  const chartY = 110;
  const chartWidth = contentWidth - 8;
  const chartHeight = 28;
  const values = model.core.dailyDownloadBytes;
  const maxValue = Math.max(1, ...values);
  const barGap = values.length > 20 ? 0.4 : 0.8;
  const barWidth = values.length ? chartWidth / values.length : chartWidth;
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, chartY - 3, contentWidth, 43, 1.5, 1.5, 'FD');
  values.forEach((value, index) => {
    const height = Math.max(0.8, (value / maxValue) * chartHeight);
    doc.setFillColor(COLORS.orange);
    doc.rect(
      chartX + index * barWidth + barGap / 2,
      chartY + chartHeight - height,
      Math.max(0.3, barWidth - barGap),
      height,
      'F',
    );
  });
  doc.setDrawColor(COLORS.border);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
  const labels = dayLabels(model);
  doc.setFont('courier', 'normal');
  doc.setFontSize(values.length > 31 ? 4.5 : 5.5);
  doc.setTextColor(COLORS.gray);
  labels.forEach((label, index) => {
    doc.text(String(label), chartX + (index + 0.5) * barWidth, chartY + chartHeight + 4, {
      align: 'center',
    });
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  buildWeekBands(model.period.startIso, values.length).forEach((band) => {
    const center = chartX + (band.start + band.span / 2) * barWidth;
    doc.text(band.label, center, chartY + chartHeight + 8, { align: 'center' });
  });

  // 5. Device identity
  const deviceY = 157;
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, deviceY, contentWidth, 17, 1.5, 1.5, 'FD');
  sectionTitle(doc, 'Device identity', margin + 4, deviceY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.gray);
  const deviceText = model.device
    ? `${model.device.name} · ${model.device.model} · SN ${model.device.serial} · Group ${model.device.group} · ${model.device.status}`
    : 'Not available';
  doc.text(doc.splitTextToSize(deviceText, contentWidth - 8), margin + 4, deviceY + 12);

  // 6. Unjani Staff + Patient blocks
  if (model.unjani) {
    sectionTitle(doc, 'Unjani Wi-Fi breakdown (separate sources — do not sum)', margin, 183);
    const staffY = 188;
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(margin, staffY, contentWidth, 30, 1.5, 1.5, 'S');
    sectionTitle(doc, 'Staff Wi-Fi', margin + 4, staffY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    if (model.staff.kind === 'available') {
      doc.setTextColor(COLORS.dark);
      doc.text(`Total ${formatBytesAsGb(model.staff.totalBytes)}`, margin + 4, staffY + 13);
      doc.text(`Download ${formatBytesAsGb(model.staff.rxBytes)}`, margin + 62, staffY + 13);
      doc.text(`Upload ${formatBytesAsGb(model.staff.txBytes)}`, margin + 124, staffY + 13);
      doc.setFontSize(6.2);
      doc.setTextColor(COLORS.muted);
      doc.text(doc.splitTextToSize(STAFF_FOOTNOTE, contentWidth - 8), margin + 4, staffY + 20);
    } else {
      doc.setTextColor(COLORS.gray);
      doc.text(
        model.staff.kind === 'no_samples'
          ? 'Not available — no Staff Wi-Fi samples in this period'
          : 'Not available — AP not linked to site',
        margin + 4,
        staffY + 14,
      );
    }

    const patientY = 223;
    doc.roundedRect(margin, patientY, contentWidth, 29, 1.5, 1.5, 'S');
    sectionTitle(doc, 'Patient Free Wi-Fi', margin + 4, patientY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    if (model.patient.kind === 'available') {
      doc.setTextColor(COLORS.dark);
      const p = model.patient;
      if (p.totalBytes != null) {
        doc.text(`Total ${(p.totalBytes / 1e9).toFixed(2)} GB`, margin + 4, patientY + 13);
        doc.text(`Down ${((p.rxBytes ?? 0) / 1e9).toFixed(2)} GB`, margin + 52, patientY + 13);
        doc.text(`Up ${((p.txBytes ?? 0) / 1e9).toFixed(2)} GB`, margin + 100, patientY + 13);
      } else {
        doc.text(`Download ${p.downloadGb.toFixed(2)} GB`, margin + 4, patientY + 13);
      }
      if (p.uniqueUsers != null) {
        doc.text(
          `Users ${p.uniqueUsers.toLocaleString('en-ZA')}`,
          margin + 140,
          patientY + 13
        );
      }
      doc.setFontSize(6.2);
      doc.setTextColor(COLORS.muted);
      doc.text(
        p.source === 'tdx_csv'
          ? 'TDX anonymised analytics; numbers may be revised by TDX.'
          : 'CircleTel Free Clinic SSID STA samples — do not sum with Staff/BNG/TDX.',
        margin + 4,
        patientY + 21
      );
    } else {
      doc.setTextColor(COLORS.gray);
      doc.text(
        model.patient.kind === 'ap_unlinked'
          ? 'Not available — AP not linked to site'
          : model.patient.kind === 'no_samples'
            ? 'Not available — no Free Clinic Wi-Fi samples in this period'
            : 'Awaiting TDX export',
        margin + 4,
        patientY + 14
      );
    }
  }

  // 7. Footer do-not-sum
  doc.setDrawColor(COLORS.border);
  doc.line(margin, pageHeight - 17, pageWidth - margin, pageHeight - 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.muted);
  doc.text(
    `CircleTel · ${model.site.corporateCode} · Do not sum Patient + Staff + BNG · Page 1 of 1`,
    pageWidth / 2,
    pageHeight - 11,
    { align: 'center' },
  );

  return outputBuffer(doc);
}

export function generateSkipSlipPdf(input: SkipSlipInput): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  addLogo(doc, margin, 18, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(COLORS.dark);
  doc.text('SITE USAGE REPORT — NOT GENERATED', pageWidth - margin, 28, { align: 'right' });
  doc.setDrawColor(COLORS.orange);
  doc.setLineWidth(0.8);
  doc.line(margin, 51, pageWidth - margin, 51);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('SITE', margin, 68);
  doc.text('PERIOD', margin, 86);
  doc.text('REASON', margin, 104);
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark);
  doc.text(input.siteLabel, margin, 75);
  doc.text(input.periodLabel, margin, 93);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(input.reason, pageWidth - margin * 2), margin, 112);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(`Generated ${formatGeneratedAt(input.generatedAtIso)} SAST`, margin, 140);

  return outputBuffer(doc);
}
