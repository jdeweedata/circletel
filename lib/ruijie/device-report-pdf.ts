/**
 * Device dossier PDF.
 *
 * Renders a DeviceExportModel with jsPDF: identity summary, traffic window
 * (KPIs + stacked bar chart drawn with rect()), connected clients and recent
 * management logs as autoTable tables. Layout and palette mirror
 * lib/usage-reports/pdf-generator.ts; its helpers are module-private there,
 * so the small ones are replicated here.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';
import { windowLabel, type DeviceExportModel } from './device-export';
import type { TrafficDataPoint } from './client';

const COLORS = {
  orange: '#F5831F',
  navy: '#1B2A4A',
  dark: '#1F2937',
  gray: '#6B7280',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  panel: '#F9FAFB',
  white: '#FFFFFF',
};

const MAX_CHART_BARS = 84;
const MAX_LOG_ROWS = 30;

function addLogo(doc: jsPDF, x: number, y: number, size: number): void {
  try {
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

function sectionTitle(doc: jsPDF, title: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark);
  doc.text(title, x, y);
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatBps(bps: number | null | undefined): string {
  if (bps == null || !Number.isFinite(bps) || bps === 0) return '0 bps';
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.min(Math.floor(Math.log(bps) / Math.log(1000)), units.length - 1);
  return `${(bps / Math.pow(1000, i)).toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatSastTime(timestampMs: number, hours: number): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    ...(hours <= 24
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }).format(new Date(timestampMs));
}

/** Merge consecutive 10-minute buckets so a 7-day window stays readable at A4 width. */
function resampleForChart(
  points: TrafficDataPoint[]
): Array<{ timestamp: number; rxBytes: number; txBytes: number }> {
  if (points.length <= MAX_CHART_BARS) {
    return points.map((p) => ({ timestamp: p.timestamp, rxBytes: p.rxBytes, txBytes: p.txBytes }));
  }
  const groupSize = Math.ceil(points.length / MAX_CHART_BARS);
  const bars: Array<{ timestamp: number; rxBytes: number; txBytes: number }> = [];
  for (let start = 0; start < points.length; start += groupSize) {
    const group = points.slice(start, start + groupSize);
    bars.push({
      timestamp: group[0].timestamp,
      rxBytes: group.reduce((sum, p) => sum + p.rxBytes, 0),
      txBytes: group.reduce((sum, p) => sum + p.txBytes, 0),
    });
  }
  return bars;
}

export function generateDeviceReportPdf(model: DeviceExportModel): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const { device, traffic } = model;

  // Header
  addLogo(doc, margin, 14, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(COLORS.dark);
  doc.text('DEVICE REPORT', pageWidth - margin, 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(`Generated ${formatGeneratedAt(model.generatedAtIso)} SAST`, pageWidth - margin, 30, {
    align: 'right',
  });
  doc.setDrawColor(COLORS.orange);
  doc.setLineWidth(0.8);
  doc.line(margin, 43, pageWidth - margin, 43);

  // Device identity row
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.gray);
  doc.text('DEVICE', margin, 51);
  doc.text('REPORT PERIOD', pageWidth - margin, 51, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark);
  doc.text(device.device_name, margin, 58);
  doc.text(windowLabel(model.hours), pageWidth - margin, 58, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(
    [device.model, `SN ${device.sn}`, device.group_name].filter(Boolean).join(' · '),
    margin,
    63
  );
  doc.text('Times in SAST', pageWidth - margin, 63, { align: 'right' });

  // Device summary grid
  const summaryY = 70;
  const summaryRows: Array<[string, string]> = [
    ['Status', device.status === 'online' ? 'Online' : 'Offline'],
    ['Config', device.config_status ?? '—'],
    ['Management IP', device.management_ip ?? '—'],
    ['WAN IP', device.wan_ip ?? '—'],
    ['MAC address', device.mac_address ?? '—'],
    ['Firmware', device.firmware_version ?? '—'],
    ['Uptime', formatUptime(model.metrics?.uptime_seconds ?? device.uptime_seconds)],
    [
      'CPU / Memory',
      `${model.metrics?.cpu_usage ?? device.cpu_usage ?? '—'}% / ${model.metrics?.memory_usage ?? device.memory_usage ?? '—'}%`,
    ],
    ['Connected clients', String(model.metrics?.online_clients ?? device.online_clients ?? 0)],
    [
      'Last synced',
      device.synced_at ? `${formatGeneratedAt(device.synced_at)} SAST` : '—',
    ],
  ];
  const summaryRowHeight = 6;
  const summaryHeight = Math.ceil(summaryRows.length / 2) * summaryRowHeight + 10;
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, summaryY, contentWidth, summaryHeight, 1.5, 1.5, 'FD');
  sectionTitle(doc, 'Device summary', margin + 4, summaryY + 6);
  const colWidth = contentWidth / 2;
  summaryRows.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + 4 + col * colWidth;
    const y = summaryY + 12 + row * summaryRowHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.gray);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text(value, x + 32, y);
  });

  // Traffic KPI strip
  const kpiY = summaryY + summaryHeight + 8;
  sectionTitle(doc, `Traffic — ${windowLabel(model.hours).toLowerCase()}`, margin, kpiY - 2);
  const kpis: Array<[string, string]> = [
    ['DOWNLOADED', formatBytes(traffic?.totalRxBytes)],
    ['UPLOADED', formatBytes(traffic?.totalTxBytes)],
    ['AVG RATE', formatBps(traffic?.avgRxRate)],
    ['BUSIEST BUCKET', formatBytes(traffic?.peakRxBytes)],
  ];
  const kpiWidth = contentWidth / 4;
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

  // Traffic chart — download orange, upload navy stacked on top
  const chartBoxY = kpiY + 22;
  const chartHeight = 28;
  const bars = resampleForChart(traffic?.dataPoints ?? []);
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, chartBoxY, contentWidth, 44, 1.5, 1.5, 'FD');
  if (bars.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.gray);
    doc.text(
      model.unavailable.traffic ?? 'No traffic samples in this window',
      pageWidth / 2,
      chartBoxY + 23,
      { align: 'center' }
    );
  } else {
    const chartX = margin + 4;
    const chartY = chartBoxY + 5;
    const chartWidth = contentWidth - 8;
    const maxValue = Math.max(1, ...bars.map((bar) => bar.rxBytes + bar.txBytes));
    const barWidth = chartWidth / bars.length;
    const barGap = bars.length > 40 ? 0.3 : 0.6;
    bars.forEach((bar, index) => {
      const x = chartX + index * barWidth + barGap / 2;
      const width = Math.max(0.3, barWidth - barGap);
      const rxHeight = (bar.rxBytes / maxValue) * chartHeight;
      const txHeight = (bar.txBytes / maxValue) * chartHeight;
      const total = Math.max(0.5, rxHeight + txHeight);
      doc.setFillColor(COLORS.orange);
      doc.rect(x, chartY + chartHeight - rxHeight, width, rxHeight, 'F');
      doc.setFillColor(COLORS.navy);
      doc.rect(x, chartY + chartHeight - total, width, txHeight, 'F');
    });
    doc.setDrawColor(COLORS.border);
    doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
    // Five evenly spaced time labels
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(COLORS.gray);
    for (let i = 0; i < 5; i++) {
      const barIndex = Math.min(bars.length - 1, Math.round((i / 4) * (bars.length - 1)));
      const x = chartX + (barIndex + 0.5) * barWidth;
      doc.text(formatSastTime(bars[barIndex].timestamp, model.hours), x, chartY + chartHeight + 4, {
        align: 'center',
      });
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(COLORS.gray);
    doc.text('Download (orange) + Upload (navy), stacked', chartX, chartY + chartHeight + 8);
  }

  // Connected clients table
  const clientsStartY = chartBoxY + 52;
  sectionTitle(doc, `Connected clients (${model.clients.length})`, margin, clientsStartY);
  if (model.clients.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.gray);
    doc.text(
      model.unavailable.clients ??
        (device.status === 'online' ? 'No clients connected right now' : 'Not available — device offline'),
      margin,
      clientsStartY + 6
    );
  } else {
    autoTable(doc, {
      startY: clientsStartY + 3,
      margin: { left: margin, right: margin },
      head: [['Hostname', 'IP', 'SSID', 'Band', 'RSSI', 'Quality', 'Down', 'Up']],
      body: model.clients.map((client) => [
        client.hostname ?? client.mac,
        client.userIp,
        client.ssid,
        client.band,
        `${client.rssi} dBm`,
        client.signalQuality,
        formatBps(client.downlinkRate),
        formatBps(client.uplinkRate),
      ]),
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1.8, textColor: COLORS.dark, lineColor: COLORS.border, lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.panel, textColor: COLORS.gray, fontStyle: 'bold' },
    });
  }

  // Recent logs table
  const afterClientsY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    clientsStartY + 10;
  const logs = model.logs.slice(0, MAX_LOG_ROWS);
  const logsTitleY = afterClientsY + 10 > pageHeight - 30 ? (doc.addPage(), 20) : afterClientsY + 10;
  sectionTitle(doc, `Recent device logs${model.logs.length > MAX_LOG_ROWS ? ` (latest ${MAX_LOG_ROWS} of ${model.logs.length})` : ` (${model.logs.length})`}`, margin, logsTitleY);
  if (logs.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.gray);
    doc.text(model.unavailable.logs ?? 'No log entries returned', margin, logsTitleY + 6);
  } else {
    autoTable(doc, {
      startY: logsTitleY + 3,
      margin: { left: margin, right: margin },
      head: [['Time (SAST)', 'Type', 'Detail']],
      body: logs.map((log) => [
        formatGeneratedAt(new Date(log.operateTime).toISOString()),
        log.logSubType ? `${log.logType}/${log.logSubType}` : log.logType,
        log.logDetail,
      ]),
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1.8, textColor: COLORS.dark, lineColor: COLORS.border, lineWidth: 0.2 },
      headStyles: { fillColor: COLORS.panel, textColor: COLORS.gray, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 28 } },
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(COLORS.border);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.muted);
    doc.text(
      `CircleTel · ${device.sn} · ${windowLabel(model.hours)} · Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 9,
      { align: 'center' }
    );
  }

  return doc.output('arraybuffer');
}
