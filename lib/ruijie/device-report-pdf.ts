/**
 * Customer-facing Wi-Fi usage PDF for one access point.
 *
 * Layout mirrors the admin device Traffic tab (emerald download + blue upload
 * area chart). Copy stays plain-language; technical fields (MAC, management
 * IP, firmware strings, Interstellio linkage notes) are omitted from the PDF.
 * Excel remains the analyst-oriented export.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';
import { windowLabel, type DeviceExportModel } from './device-export';
import type { RuijieClient, TrafficDataPoint } from './client';

const COLORS = {
  orange: '#F5831F',
  dark: '#1F2937',
  gray: '#6B7280',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  panel: '#F9FAFB',
  white: '#FFFFFF',
  /** Match components/admin/network/TrafficChart.tsx */
  download: '#10B981',
  downloadFill: '#A7F3D0',
  upload: '#3B82F6',
  uploadFill: '#BFDBFE',
};

const MAX_CHART_POINTS = 84;
const MAX_EVENT_ROWS = 8;

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

function fitText(doc: jsPDF, value: string, maxWidth: number): string {
  if (doc.getTextWidth(value) <= maxWidth) return value;
  let text = value;
  while (text.length > 1 && doc.getTextWidth(`${text}…`) > maxWidth) {
    text = text.slice(0, -1);
  }
  return `${text}…`;
}

function formatSastTime(timestampMs: number, hours: number): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    ...(hours <= 24
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }).format(new Date(timestampMs));
}

function friendlyStatus(status: string): string {
  return status.toLowerCase() === 'online' ? 'Working normally' : 'Offline';
}

function friendlyConfig(status: string | null): string {
  if (!status) return '—';
  const upper = status.toUpperCase().replace(/\s+/g, '_');
  if (upper.includes('UP_TO_DATE') || upper.includes('SYNCED')) return 'Up to date';
  if (upper.includes('PENDING') || upper.includes('SYNCING')) return 'Updating';
  return status;
}

function titleCaseQuality(quality: RuijieClient['signalQuality']): string {
  return quality.charAt(0).toUpperCase() + quality.slice(1);
}

function clientDisplayName(client: RuijieClient): string {
  if (client.hostname?.trim()) return client.hostname.trim();
  if (client.vendor?.trim()) return `${client.vendor.trim()} device`;
  return 'Unknown device';
}

function friendlyBand(band: string): string {
  const b = band.trim().toUpperCase();
  if (b.includes('5')) return '5 GHz';
  if (b.includes('2.4') || b.includes('2G')) return '2.4 GHz';
  if (b.includes('6')) return '6 GHz';
  return band || '—';
}

/** Soften raw Ruijie log types into short customer-readable events. */
function friendlyLogDetail(
  logType: string,
  logSubType: string | null | undefined,
  detail: string
): string | null {
  const type = `${logType}/${logSubType ?? ''}`.toLowerCase();
  if (type.includes('reboot') || detail.toLowerCase().includes('restart')) {
    return 'Access point restarted';
  }
  if (type.includes('onoffline/on') || type.endsWith('/on')) return 'Access point came online';
  if (type.includes('onoffline/off') || type.endsWith('/off')) return 'Access point went offline';
  // Skip opaque management chatter on the customer PDF.
  return null;
}

/** Merge consecutive 10-minute buckets so a 7-day window stays readable at A4 width. */
function resampleForChart(
  points: TrafficDataPoint[]
): Array<{ timestamp: number; rxBytes: number; txBytes: number }> {
  if (points.length <= MAX_CHART_POINTS) {
    return points.map((p) => ({ timestamp: p.timestamp, rxBytes: p.rxBytes, txBytes: p.txBytes }));
  }
  const groupSize = Math.ceil(points.length / MAX_CHART_POINTS);
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

type ChartPoint = { timestamp: number; rxBytes: number; txBytes: number };

/**
 * Draw an overlaid area series (fill under the curve + stroke), matching the
 * admin TrafficChart look. Y scale is independent per series peak — not stacked.
 * Uses jsPDF `lines()` trapezoids between consecutive samples.
 */
function drawAreaSeries(
  doc: jsPDF,
  points: ChartPoint[],
  getValue: (p: ChartPoint) => number,
  chartX: number,
  chartY: number,
  chartWidth: number,
  chartHeight: number,
  maxValue: number,
  fillColor: string,
  strokeColor: string
): void {
  if (points.length === 0 || maxValue <= 0) return;

  const xAt = (index: number) =>
    chartX + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const yAt = (value: number) => chartY + chartHeight * (1 - value / maxValue);
  const base = chartY + chartHeight;

  for (let i = 0; i < points.length - 1; i++) {
    const x0 = xAt(i);
    const x1 = xAt(i + 1);
    const y0 = yAt(getValue(points[i]));
    const y1 = yAt(getValue(points[i + 1]));
    // Closed trapezoid relative to (x0, base): up to y0, across to y1, down to base
    doc.setFillColor(fillColor);
    doc.lines(
      [
        [0, y0 - base],
        [x1 - x0, y1 - y0],
        [0, base - y1],
        [x0 - x1, 0],
      ],
      x0,
      base,
      [1, 1],
      'F'
    );
  }

  doc.setDrawColor(strokeColor);
  doc.setLineWidth(0.55);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(xAt(i), yAt(getValue(points[i])), xAt(i + 1), yAt(getValue(points[i + 1])));
  }
}

function drawTrafficAreaChart(
  doc: jsPDF,
  points: ChartPoint[],
  chartX: number,
  chartY: number,
  chartWidth: number,
  chartHeight: number,
  hours: number
): void {
  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.rxBytes, p.txBytes)));

  // Gridlines at 0 / ¼ / ½ / ¾ / max
  for (let i = 0; i <= 4; i++) {
    const fraction = i / 4;
    const y = chartY + chartHeight * (1 - fraction);
    doc.setDrawColor(i === 0 ? COLORS.muted : COLORS.border);
    doc.setLineWidth(i === 0 ? 0.3 : 0.15);
    doc.line(chartX, y, chartX + chartWidth, y);
    if (i % 2 === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(COLORS.gray);
      doc.text(formatBytes(maxValue * fraction), chartX - 1.5, y + 1, { align: 'right' });
    }
  }

  // Upload under, download on top (download dominates visually like the admin UI)
  drawAreaSeries(
    doc,
    points,
    (p) => p.txBytes,
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    maxValue,
    COLORS.uploadFill,
    COLORS.upload
  );
  drawAreaSeries(
    doc,
    points,
    (p) => p.rxBytes,
    chartX,
    chartY,
    chartWidth,
    chartHeight,
    maxValue,
    COLORS.downloadFill,
    COLORS.download
  );

  // Time labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(COLORS.gray);
  for (let i = 0; i < 5; i++) {
    const index = Math.min(points.length - 1, Math.round((i / 4) * (points.length - 1)));
    const x =
      chartX +
      (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
    doc.text(formatSastTime(points[index].timestamp, hours), x, chartY + chartHeight + 4, {
      align: 'center',
    });
  }
}

function drawSignalQualityLegend(doc: jsPDF, x: number, y: number, maxWidth: number): number {
  sectionTitle(doc, 'How to read signal quality', x, y);
  const lines = [
    'Quality is based on how strong the Wi-Fi signal is at that device (RSSI):',
    '  Excellent  stronger than -50 dBm   Good  -50 to -60 dBm',
    '  Fair  -60 to -70 dBm   Poor  weaker than -70 dBm',
    'A "Poor" or "Fair" rating does not always mean the clinic Wi-Fi is broken.',
    'Older phones, budget tablets, and devices stuck on 2.4 GHz often show weaker',
    'quality even when the access point is healthy. Distance, walls, and where the',
    'person is standing also change the reading. Use Quality together with the',
    'device name and Wi-Fi band when reviewing connected devices.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.gray);
  let cursor = y + 5;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    doc.text(wrapped, x, cursor);
    cursor += wrapped.length * 3.2;
  }
  return cursor;
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
  doc.setFontSize(18);
  doc.setTextColor(COLORS.dark);
  doc.text('Wi-Fi usage report', pageWidth - margin, 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(`Prepared ${formatGeneratedAt(model.generatedAtIso)} SAST`, pageWidth - margin, 30, {
    align: 'right',
  });
  doc.setDrawColor(COLORS.orange);
  doc.setLineWidth(0.8);
  doc.line(margin, 43, pageWidth - margin, 43);

  // Site / period identity
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.gray);
  doc.text('SITE ACCESS POINT', margin, 51);
  doc.text('REPORT PERIOD', pageWidth - margin, 51, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark);
  doc.text(device.device_name, margin, 58);
  doc.text(windowLabel(model.hours), pageWidth - margin, 58, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(
    [device.model, device.group_name ? `${device.group_name} network` : null]
      .filter(Boolean)
      .join(' · '),
    margin,
    63
  );
  doc.text('Times in South Africa (SAST)', pageWidth - margin, 63, { align: 'right' });

  // Customer-friendly summary (no MAC / management IP / firmware)
  const summaryY = 70;
  const summaryRows: Array<[string, string]> = [
    ['Status', friendlyStatus(device.status)],
    ['Settings', friendlyConfig(device.config_status)],
    ['Network group', device.group_name ?? '—'],
    ['Access point', device.model ?? '—'],
    ['Time online', formatUptime(model.metrics?.uptime_seconds ?? device.uptime_seconds)],
    [
      'Devices connected',
      String(model.metrics?.online_clients ?? device.online_clients ?? 0),
    ],
  ];
  const summaryRowHeight = 6;
  const summaryHeight = Math.ceil(summaryRows.length / 2) * summaryRowHeight + 10;
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, summaryY, contentWidth, summaryHeight, 1.5, 1.5, 'FD');
  sectionTitle(doc, 'At a glance', margin + 4, summaryY + 6);
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
    doc.text(fitText(doc, value, colWidth - 40), x + 36, y);
  });

  // Traffic KPI strip
  const kpiY = summaryY + summaryHeight + 8;
  sectionTitle(doc, `Usage — ${windowLabel(model.hours).toLowerCase()}`, margin, kpiY - 2);
  const kpis: Array<[string, string]> = [
    ['DOWNLOADED', formatBytes(traffic?.totalRxBytes)],
    ['UPLOADED', formatBytes(traffic?.totalTxBytes)],
    ['AVG DOWNLOAD', formatBps(traffic?.avgRxRate)],
    ['BUSIEST PERIOD', formatBytes(traffic?.peakRxBytes)],
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

  // Traffic area chart (admin Traffic tab style)
  const chartBoxY = kpiY + 22;
  const chartBoxHeight = 58;
  const chartHeight = 34;
  const points = resampleForChart(traffic?.dataPoints ?? []);
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, chartBoxY, contentWidth, chartBoxHeight, 1.5, 1.5, 'FD');

  // Chart header totals (like TrafficChart)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.dark);
  doc.text(`Device traffic — ${windowLabel(model.hours).toLowerCase()}`, margin + 4, chartBoxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.download);
  doc.text(
    `Download ${formatBytes(traffic?.totalRxBytes)}  |  Avg ${formatBps(traffic?.avgRxRate)}`,
    pageWidth - margin - 4,
    chartBoxY + 5,
    { align: 'right' }
  );

  if (points.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.gray);
    doc.text(
      model.unavailable.traffic ?? 'No usage data in this period',
      pageWidth / 2,
      chartBoxY + chartBoxHeight / 2 + 2,
      { align: 'center' }
    );
  } else {
    const chartX = margin + 18;
    const chartY = chartBoxY + 10;
    const chartWidth = contentWidth - 24;
    drawTrafficAreaChart(doc, points, chartX, chartY, chartWidth, chartHeight, model.hours);

    const legendY = chartY + chartHeight + 7;
    doc.setFillColor(COLORS.download);
    doc.rect(chartX, legendY - 1.8, 2.4, 2.4, 'F');
    doc.setFillColor(COLORS.upload);
    doc.rect(chartX + 22, legendY - 1.8, 2.4, 2.4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(COLORS.gray);
    doc.text('Download', chartX + 3.6, legendY);
    doc.text('Upload', chartX + 25.6, legendY);
    doc.setTextColor(COLORS.upload);
    doc.text(
      `Upload ${formatBytes(traffic?.totalTxBytes)}  |  Avg ${formatBps(traffic?.avgTxRate)}`,
      chartX + chartWidth,
      legendY,
      { align: 'right' }
    );
  }

  // Connected devices
  const clientsStartY = chartBoxY + chartBoxHeight + 8;
  sectionTitle(
    doc,
    `Connected devices when this report was prepared (${model.clients.length})`,
    margin,
    clientsStartY
  );
  if (model.clients.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.gray);
    doc.text(
      model.unavailable.clients ??
        (device.status === 'online'
          ? 'No devices were connected at this moment'
          : 'Device list not available — access point offline'),
      margin,
      clientsStartY + 6
    );
  } else {
    autoTable(doc, {
      startY: clientsStartY + 3,
      margin: { left: margin, right: margin },
      head: [['Device', 'Wi-Fi network', 'Band', 'Signal quality', 'Download', 'Upload']],
      body: model.clients.map((client) => [
        clientDisplayName(client),
        client.ssid || '—',
        friendlyBand(client.band),
        titleCaseQuality(client.signalQuality),
        formatBps(client.downlinkRate),
        formatBps(client.uplinkRate),
      ]),
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: COLORS.dark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: { fillColor: COLORS.panel, textColor: COLORS.gray, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 40 },
        2: { cellWidth: 18 },
        3: { cellWidth: 26 },
      },
    });
  }

  let afterClientsY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    clientsStartY + 10;

  // Signal quality legend (always show when we have clients, or always for education)
  const legendStartY =
    afterClientsY + 10 > pageHeight - 45 ? (doc.addPage(), 20) : afterClientsY + 10;
  afterClientsY = drawSignalQualityLegend(doc, margin, legendStartY, contentWidth);

  // Linked Interstellio only when there is real data (skip "not linked" tech notes)
  if (model.interstellio?.linked) {
    const interY =
      afterClientsY + 10 > pageHeight - 40 ? (doc.addPage(), 20) : afterClientsY + 10;
    sectionTitle(doc, 'Site broadband usage (secondary source)', margin, interY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.dark);
    doc.text(
      [
        model.interstellio.siteName ?? 'Linked site',
        `Downloaded ${formatBytes(model.interstellio.totalDownloadBytes)}`,
        `Uploaded ${formatBytes(model.interstellio.totalUploadBytes)}`,
      ].join(' · '),
      margin,
      interY + 6
    );
    autoTable(doc, {
      startY: interY + 10,
      margin: { left: margin, right: margin },
      head: [['Day', 'Downloaded', 'Uploaded']],
      body: model.interstellio.dailyDownloadBytes.map((rx, index) => [
        `Day ${index + 1}`,
        formatBytes(rx),
        formatBytes(model.interstellio?.dailyUploadBytes[index] ?? 0),
      ]),
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 1.6,
        textColor: COLORS.dark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: { fillColor: COLORS.panel, textColor: COLORS.gray, fontStyle: 'bold' },
    });
    afterClientsY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
      interY + 20;
  }

  // Recent events — customer-friendly subset only
  const friendlyEvents = model.logs
    .map((log) => {
      const detail = friendlyLogDetail(log.logType, log.logSubType, log.logDetail);
      if (!detail) return null;
      return {
        time: formatGeneratedAt(new Date(log.operateTime).toISOString()),
        detail,
      };
    })
    .filter((row): row is { time: string; detail: string } => row != null)
    .slice(0, MAX_EVENT_ROWS);

  if (friendlyEvents.length > 0) {
    const eventsTitleY =
      afterClientsY + 10 > pageHeight - 30 ? (doc.addPage(), 20) : afterClientsY + 10;
    sectionTitle(doc, `Recent access-point events (${friendlyEvents.length})`, margin, eventsTitleY);
    autoTable(doc, {
      startY: eventsTitleY + 3,
      margin: { left: margin, right: margin },
      head: [['When (SAST)', 'What happened']],
      body: friendlyEvents.map((row) => [row.time, row.detail]),
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: COLORS.dark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: { fillColor: COLORS.panel, textColor: COLORS.gray, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 42 } },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(COLORS.border);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.muted);
    doc.text(
      `CircleTel · ${device.device_name} · ${windowLabel(model.hours)} · Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 9,
      { align: 'center' }
    );
  }

  return doc.output('arraybuffer');
}
