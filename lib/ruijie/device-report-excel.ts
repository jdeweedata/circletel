/**
 * Device dossier Excel workbook (exceljs).
 *
 * Four sheets — Overview, Traffic, Clients, Logs — carrying the same data as
 * the PDF but in analyst-friendly raw form: the Traffic sheet keeps every
 * 10-minute bucket so totals can be re-derived and pivoted.
 */

import ExcelJS from 'exceljs';
import { windowLabel, type DeviceExportModel } from './device-export';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
};

function sastTimestamp(input: string | number): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(input));
}

function styleHeaderRow(row: ExcelJS.Row): void {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
  });
}

export async function generateDeviceReportExcel(model: DeviceExportModel): Promise<Buffer> {
  const { device, traffic } = model;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CircleTel';
  workbook.created = new Date(model.generatedAtIso);

  // --- Overview ---
  const overview = workbook.addWorksheet('Overview');
  overview.columns = [
    { key: 'label', width: 26 },
    { key: 'value', width: 42 },
  ];
  const overviewRows: Array<[string, string | number]> = [
    ['Device name', device.device_name],
    ['Serial number', device.sn],
    ['Model', device.model ?? '—'],
    ['Group', device.group_name ?? '—'],
    ['Status', device.status],
    ['Config status', device.config_status ?? '—'],
    ['Management IP', device.management_ip ?? '—'],
    ['WAN IP', device.wan_ip ?? '—'],
    ['Egress IP', device.egress_ip ?? '—'],
    ['MAC address', device.mac_address ?? '—'],
    ['Firmware', device.firmware_version ?? '—'],
    ['CPU usage (%)', model.metrics?.cpu_usage ?? device.cpu_usage ?? '—'],
    ['Memory usage (%)', model.metrics?.memory_usage ?? device.memory_usage ?? '—'],
    ['Uptime (seconds)', model.metrics?.uptime_seconds ?? device.uptime_seconds ?? '—'],
    ['Connected clients', model.metrics?.online_clients ?? device.online_clients ?? 0],
    ['Last synced (SAST)', device.synced_at ? sastTimestamp(device.synced_at) : '—'],
    ['Report period', windowLabel(model.hours)],
    ['Generated (SAST)', sastTimestamp(model.generatedAtIso)],
  ];
  overviewRows.forEach(([label, value]) => {
    const row = overview.addRow({ label, value });
    row.getCell(1).font = { bold: true };
  });
  const unavailableNotes = Object.entries(model.unavailable);
  if (unavailableNotes.length > 0) {
    overview.addRow({});
    unavailableNotes.forEach(([section, reason]) => {
      const row = overview.addRow({ label: `Note — ${section}`, value: reason });
      row.getCell(1).font = { bold: true, color: { argb: 'FF9CA3AF' } };
      row.getCell(2).font = { color: { argb: 'FF9CA3AF' } };
    });
  }

  // --- Traffic (raw 10-minute buckets) ---
  const trafficSheet = workbook.addWorksheet('Traffic');
  trafficSheet.columns = [
    { header: 'Timestamp (SAST)', key: 'time', width: 22 },
    { header: 'Download bytes', key: 'rx', width: 18 },
    { header: 'Upload bytes', key: 'tx', width: 18 },
  ];
  styleHeaderRow(trafficSheet.getRow(1));
  (traffic?.dataPoints ?? []).forEach((point) => {
    trafficSheet.addRow({
      time: sastTimestamp(point.timestamp),
      rx: point.rxBytes,
      tx: point.txBytes,
    });
  });
  if (traffic && traffic.dataPoints.length > 0) {
    const totals = trafficSheet.addRow({
      time: 'TOTAL',
      rx: traffic.totalRxBytes,
      tx: traffic.totalTxBytes,
    });
    totals.font = { bold: true };
  } else {
    trafficSheet.addRow({ time: model.unavailable.traffic ?? 'No traffic samples' });
  }
  trafficSheet.getColumn('rx').numFmt = '#,##0';
  trafficSheet.getColumn('tx').numFmt = '#,##0';

  // --- Clients ---
  const clientsSheet = workbook.addWorksheet('Clients');
  clientsSheet.columns = [
    { header: 'Hostname', key: 'hostname', width: 24 },
    { header: 'MAC', key: 'mac', width: 18 },
    { header: 'IP', key: 'ip', width: 15 },
    { header: 'SSID', key: 'ssid', width: 20 },
    { header: 'Band', key: 'band', width: 8 },
    { header: 'Channel', key: 'channel', width: 9 },
    { header: 'RSSI (dBm)', key: 'rssi', width: 11 },
    { header: 'Quality', key: 'quality', width: 11 },
    { header: 'Down rate (bps)', key: 'down', width: 15 },
    { header: 'Up rate (bps)', key: 'up', width: 15 },
    { header: 'Session bytes', key: 'sessionBytes', width: 15 },
    { header: 'Latency (ms)', key: 'latency', width: 12 },
    { header: 'Score', key: 'score', width: 8 },
  ];
  styleHeaderRow(clientsSheet.getRow(1));
  model.clients.forEach((client) => {
    clientsSheet.addRow({
      hostname: client.hostname ?? '—',
      mac: client.mac,
      ip: client.userIp,
      ssid: client.ssid,
      band: client.band,
      channel: client.channel,
      rssi: client.rssi,
      quality: client.signalQuality,
      down: client.downlinkRate,
      up: client.uplinkRate,
      sessionBytes: client.sessionBytes,
      latency: client.latencyMs,
      score: client.score,
    });
  });
  if (model.clients.length === 0) {
    clientsSheet.addRow({
      hostname:
        model.unavailable.clients ??
        (device.status === 'online' ? 'No clients connected' : 'Not available — device offline'),
    });
  }

  // --- Logs ---
  const logsSheet = workbook.addWorksheet('Logs');
  logsSheet.columns = [
    { header: 'Time (SAST)', key: 'time', width: 22 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Subtype', key: 'subtype', width: 10 },
    { header: 'Detail', key: 'detail', width: 70 },
  ];
  styleHeaderRow(logsSheet.getRow(1));
  model.logs.forEach((log) => {
    logsSheet.addRow({
      time: sastTimestamp(log.operateTime),
      type: log.logType,
      subtype: log.logSubType ?? '',
      detail: log.logDetail,
    });
  });
  if (model.logs.length === 0) {
    logsSheet.addRow({ time: model.unavailable.logs ?? 'No log entries returned' });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
