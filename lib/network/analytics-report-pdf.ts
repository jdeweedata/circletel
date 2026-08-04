/**
 * Network Analytics PDF — group aggregate or single AP.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';
import type { AnalyticsExportModel } from './analytics-export';

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

function formatSastTime(timestampMs: number, hoursHint: number): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    ...(hoursHint <= 24
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }).format(new Date(timestampMs));
}

function hoursHint(model: AnalyticsExportModel): number {
  if (model.period.mode === 'hours') return model.period.hours;
  return model.period.inclusiveDayCount * 24;
}

function resampleForChart(
  points: AnalyticsExportModel['traffic']['dataPoints']
): Array<{ timestamp: number; rxBytes: number; txBytes: number }> {
  if (points.length <= MAX_CHART_BARS) {
    return points.map((p) => ({
      timestamp: p.timestamp,
      rxBytes: p.rxBytes,
      txBytes: p.txBytes,
    }));
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

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateAnalyticsReportPdf(model: AnalyticsExportModel): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const { traffic } = model;
  const hint = hoursHint(model);

  addLogo(doc, margin, 14, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COLORS.dark);
  doc.text('NETWORK ANALYTICS', pageWidth - margin, 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(`Generated ${formatGeneratedAt(model.generatedAtIso)} SAST`, pageWidth - margin, 30, {
    align: 'right',
  });
  doc.setDrawColor(COLORS.orange);
  doc.setLineWidth(0.8);
  doc.line(margin, 43, pageWidth - margin, 43);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.gray);
  doc.text(model.scope === 'device' ? 'DEVICE' : 'GROUP', margin, 51);
  doc.text('REPORT PERIOD', pageWidth - margin, 51, { align: 'right' });
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark);
  const title =
    model.scope === 'device' && model.device
      ? model.device.device_name
      : model.group.name;
  doc.text(title, margin, 58);
  doc.text(model.period.label, pageWidth - margin, 58, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  const subtitle =
    model.scope === 'device' && model.device
      ? [model.device.model, `SN ${model.device.sn}`, model.group.name]
          .filter(Boolean)
          .join(' · ')
      : `All devices in group · Ruijie rollups`;
  doc.text(subtitle, margin, 63);
  doc.text('Times in SAST', pageWidth - margin, 63, { align: 'right' });

  const kpiY = 72;
  sectionTitle(doc, `Traffic — ${model.period.label}`, margin, kpiY - 2);
  const kpis: Array<[string, string]> = [
    ['DOWNLOADED', formatBytes(traffic.totalRxBytes)],
    ['UPLOADED', formatBytes(traffic.totalTxBytes)],
    ['AVG RATE', formatBps(traffic.avgRxRate)],
    ['PEAK BUCKET', formatBytes(traffic.peakRxBytes)],
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

  const chartBoxY = kpiY + 22;
  const chartBoxHeight = 52;
  const chartHeight = 32;
  const bars = resampleForChart(traffic.dataPoints);
  doc.setFillColor(COLORS.panel);
  doc.setDrawColor(COLORS.border);
  doc.roundedRect(margin, chartBoxY, contentWidth, chartBoxHeight, 1.5, 1.5, 'FD');
  if (bars.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.gray);
    doc.text(
      model.unavailable.traffic ?? 'No traffic samples in this window',
      pageWidth / 2,
      chartBoxY + chartBoxHeight / 2 + 1,
      { align: 'center' }
    );
  } else {
    const chartX = margin + 18;
    const chartY = chartBoxY + 6;
    const chartWidth = contentWidth - 24;
    const maxValue = Math.max(1, ...bars.map((bar) => bar.rxBytes + bar.txBytes));
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
    const barWidth = chartWidth / bars.length;
    const barGap = bars.length > 40 ? 0.3 : 0.6;
    const scale = chartHeight / maxValue;
    bars.forEach((bar, index) => {
      if (bar.rxBytes + bar.txBytes === 0) return;
      const x = chartX + index * barWidth + barGap / 2;
      const width = Math.max(0.3, barWidth - barGap);
      const rxDraw = bar.rxBytes > 0 ? Math.max(bar.rxBytes * scale, 0.4) : 0;
      const txDraw = bar.txBytes > 0 ? Math.max(bar.txBytes * scale, 0.4) : 0;
      if (rxDraw > 0) {
        doc.setFillColor(COLORS.orange);
        doc.rect(x, chartY + chartHeight - rxDraw, width, rxDraw, 'F');
      }
      if (txDraw > 0) {
        doc.setFillColor(COLORS.navy);
        doc.rect(x, chartY + chartHeight - rxDraw - txDraw, width, txDraw, 'F');
      }
    });
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(COLORS.gray);
    for (let i = 0; i < 5; i++) {
      const barIndex = Math.min(bars.length - 1, Math.round((i / 4) * (bars.length - 1)));
      const x = chartX + (barIndex + 0.5) * barWidth;
      doc.text(formatSastTime(bars[barIndex].timestamp, hint), x, chartY + chartHeight + 4, {
        align: 'center',
      });
    }
  }

  let y = chartBoxY + chartBoxHeight + 10;

  if (model.scope === 'group' && model.groupTraffic.length > 0) {
    y = ensureSpace(doc, y, 40);
    sectionTitle(doc, 'Group traffic breakdown', margin, y);
    autoTable(doc, {
      startY: y + 3,
      margin: { left: margin, right: margin },
      head: [['Group', 'Total', 'Download', 'Upload', 'Samples']],
      body: model.groupTraffic.map((g) => [
        g.groupName,
        formatBytes(g.totalBytes),
        formatBytes(g.totalRxBytes),
        formatBytes(g.totalTxBytes),
        String(g.sampleCount),
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
    });
    y =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
    y += 8;
  }

  y = ensureSpace(doc, y, 30);
  sectionTitle(doc, 'Radio utilisation (group)', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark);
  const radioLines = [
    `2.4 GHz avg: ${model.radio.avg2g != null ? `${model.radio.avg2g}%` : '—'}`,
    `5 GHz avg: ${model.radio.avg5g != null ? `${model.radio.avg5g}%` : '—'}`,
    `Blended: ${model.radio.avgBlended != null ? `${model.radio.avgBlended}%` : '—'}`,
    `Devices with radio: ${model.radio.devicesWithRadio}/${model.radio.totalDevices}`,
  ];
  radioLines.forEach((line, i) => {
    doc.text(line, margin, y + 6 + i * 5);
  });
  y += 6 + radioLines.length * 5 + 6;

  if (model.scope === 'device') {
    y = ensureSpace(doc, y, 40);
    sectionTitle(
      doc,
      `Connected clients at generation time (${model.clients.length})`,
      margin,
      y
    );
    if (model.clients.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLORS.gray);
      doc.text(
        model.unavailable.clients ?? 'No clients connected right now',
        margin,
        y + 6
      );
      y += 14;
    } else {
      autoTable(doc, {
        startY: y + 3,
        margin: { left: margin, right: margin },
        head: [['Device', 'MAC', 'IP', 'SSID', 'Band', 'RSSI', 'Quality', 'Latency', 'Score', 'Down']],
        body: model.clients.map((client) => [
          client.hostname ?? client.vendor ?? '—',
          client.mac,
          client.userIp,
          client.ssid,
          `${client.band} ch ${client.channel}`,
          `${client.rssi} dBm`,
          client.signalQuality,
          client.latencyMs != null ? `${client.latencyMs} ms` : '—',
          client.score != null ? String(client.score) : '—',
          formatBps(client.downlinkRate),
        ]),
        theme: 'plain',
        styles: {
          fontSize: 6.5,
          cellPadding: 1.4,
          textColor: COLORS.dark,
          lineColor: COLORS.border,
          lineWidth: 0.2,
        },
        headStyles: { fillColor: COLORS.panel, textColor: COLORS.gray, fontStyle: 'bold' },
      });
      y =
        (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
        y + 20;
      y += 8;
    }

    if (model.interstellio) {
      y = ensureSpace(doc, y, 40);
      sectionTitle(doc, 'Interstellio BNG (secondary)', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COLORS.gray);
      if (!model.interstellio.linked) {
        doc.text(model.interstellio.note ?? 'Interstellio not linked', margin, y + 6);
        y += 14;
      } else {
        doc.setTextColor(COLORS.dark);
        doc.text(
          [
            model.interstellio.siteName ?? 'Linked site',
            `Download ${formatBytes(model.interstellio.totalDownloadBytes)}`,
            `Upload ${formatBytes(model.interstellio.totalUploadBytes)}`,
          ].join(' · '),
          margin,
          y + 6
        );
        if (model.interstellio.note) {
          doc.setTextColor(COLORS.gray);
          doc.setFontSize(6.5);
          doc.text(model.interstellio.note, margin, y + 11, {
            maxWidth: contentWidth,
          });
        }
        autoTable(doc, {
          startY: y + 16,
          margin: { left: margin, right: margin },
          head: [['Day', 'Download', 'Upload']],
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
      }
    }
  }

  const pageCount = doc.getNumberOfPages();
  const footerId =
    model.scope === 'device' && model.device ? model.device.sn : model.group.name;
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(COLORS.border);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.muted);
    doc.text(
      `CircleTel · Analytics · ${footerId} · ${model.period.label} · Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 9,
      { align: 'center' }
    );
  }

  return doc.output('arraybuffer');
}
