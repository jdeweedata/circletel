/**
 * Network Analytics Excel workbook — group aggregate or single AP.
 */

import ExcelJS from 'exceljs';
import type { AnalyticsExportModel } from './analytics-export';

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

export async function generateAnalyticsReportExcel(
  model: AnalyticsExportModel
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CircleTel';
  workbook.created = new Date(model.generatedAtIso);

  const overview = workbook.addWorksheet('Overview');
  overview.columns = [
    { key: 'label', width: 28 },
    { key: 'value', width: 48 },
  ];
  const rows: Array<[string, string | number]> = [
    ['Scope', model.scope === 'device' ? 'Device' : 'Group'],
    ['Group', model.group.name],
    ['Group ID', model.group.id],
  ];
  if (model.device) {
    rows.push(
      ['Device name', model.device.device_name],
      ['Serial number', model.device.sn],
      ['Model', model.device.model ?? '—'],
      ['Status', model.device.status]
    );
  }
  rows.push(
    ['Report period', model.period.label],
    ['Downloaded', model.traffic.totalRxBytes],
    ['Uploaded', model.traffic.totalTxBytes],
    ['Total traffic', model.traffic.totalBytes],
    ['Data points', model.traffic.dataPoints.length],
    ['Generated (SAST)', sastTimestamp(model.generatedAtIso)]
  );
  if (model.interstellio) {
    rows.push(
      ['Interstellio linked', model.interstellio.linked ? 'Yes' : 'No'],
      ['Interstellio site', model.interstellio.siteName ?? '—'],
      ['Interstellio download bytes', model.interstellio.totalDownloadBytes],
      ['Interstellio upload bytes', model.interstellio.totalUploadBytes]
    );
  }
  rows.forEach(([label, value]) => {
    const row = overview.addRow({ label, value });
    row.getCell(1).font = { bold: true };
  });
  Object.entries(model.unavailable).forEach(([section, reason]) => {
    const row = overview.addRow({ label: `Note — ${section}`, value: reason });
    row.getCell(1).font = { bold: true, color: { argb: 'FF9CA3AF' } };
  });

  const trafficSheet = workbook.addWorksheet('Traffic');
  trafficSheet.columns = [
    { header: 'Timestamp (SAST)', key: 'time', width: 22 },
    { header: 'Download bytes', key: 'rx', width: 18 },
    { header: 'Upload bytes', key: 'tx', width: 18 },
  ];
  styleHeaderRow(trafficSheet.getRow(1));
  model.traffic.dataPoints.forEach((point) => {
    trafficSheet.addRow({
      time: sastTimestamp(point.timestamp),
      rx: point.rxBytes,
      tx: point.txBytes,
    });
  });
  if (model.traffic.dataPoints.length === 0) {
    trafficSheet.addRow({
      time: model.unavailable.traffic ?? 'No traffic samples',
    });
  } else {
    const totals = trafficSheet.addRow({
      time: 'TOTAL',
      rx: model.traffic.totalRxBytes,
      tx: model.traffic.totalTxBytes,
    });
    totals.font = { bold: true };
  }
  trafficSheet.getColumn('rx').numFmt = '#,##0';
  trafficSheet.getColumn('tx').numFmt = '#,##0';

  const groupsSheet = workbook.addWorksheet('Group cards');
  groupsSheet.columns = [
    { header: 'Group', key: 'name', width: 24 },
    { header: 'Group ID', key: 'id', width: 14 },
    { header: 'Total bytes', key: 'total', width: 16 },
    { header: 'Download bytes', key: 'rx', width: 16 },
    { header: 'Upload bytes', key: 'tx', width: 16 },
    { header: 'Samples', key: 'samples', width: 10 },
  ];
  styleHeaderRow(groupsSheet.getRow(1));
  model.groupTraffic.forEach((g) => {
    groupsSheet.addRow({
      name: g.groupName,
      id: g.groupId,
      total: g.totalBytes,
      rx: g.totalRxBytes,
      tx: g.totalTxBytes,
      samples: g.sampleCount,
    });
  });

  const radioSheet = workbook.addWorksheet('Radio');
  radioSheet.columns = [
    { key: 'label', width: 28 },
    { key: 'value', width: 40 },
  ];
  (
    [
      ['Avg 2.4 GHz util %', model.radio.avg2g ?? '—'],
      ['Avg 5 GHz util %', model.radio.avg5g ?? '—'],
      ['Blended util %', model.radio.avgBlended ?? '—'],
      ['Devices with radio', model.radio.devicesWithRadio],
      ['Total devices', model.radio.totalDevices],
      ['2.4 GHz channels', model.radio.channels2g.join(', ') || '—'],
      ['5 GHz channels', model.radio.channels5g.join(', ') || '—'],
    ] as Array<[string, string | number]>
  ).forEach(([label, value]) => {
    const row = radioSheet.addRow({ label, value });
    row.getCell(1).font = { bold: true };
  });
  if (model.radio.byDevice.length > 0) {
    radioSheet.addRow({});
    const header = radioSheet.addRow({
      label: 'Device',
      value: '2.4 / 5 GHz util %',
    });
    header.font = { bold: true };
    model.radio.byDevice.forEach((d) => {
      radioSheet.addRow({
        label: d.device_name || d.sn,
        value: `${d.radio_2g_utilization ?? '—'} / ${d.radio_5g_utilization ?? '—'}`,
      });
    });
  }

  if (model.scope === 'device') {
    const clientsSheet = workbook.addWorksheet('Clients');
    clientsSheet.columns = [
      { header: 'Hostname', key: 'hostname', width: 22 },
      { header: 'MAC', key: 'mac', width: 18 },
      { header: 'IP', key: 'ip', width: 15 },
      { header: 'SSID', key: 'ssid', width: 22 },
      { header: 'Band', key: 'band', width: 8 },
      { header: 'Channel', key: 'channel', width: 9 },
      { header: 'RSSI (dBm)', key: 'rssi', width: 11 },
      { header: 'Quality', key: 'quality', width: 11 },
      { header: 'Latency (ms)', key: 'latency', width: 12 },
      { header: 'Score', key: 'score', width: 8 },
      { header: 'Down rate (bps)', key: 'down', width: 15 },
      { header: 'Up rate (bps)', key: 'up', width: 15 },
      { header: 'Loss', key: 'loss', width: 10 },
      { header: 'Air util', key: 'air', width: 10 },
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
        latency: client.latencyMs,
        score: client.score,
        down: client.downlinkRate,
        up: client.uplinkRate,
        loss: client.pktLoseRate,
        air: client.utilization,
      });
    });
    if (model.clients.length === 0) {
      clientsSheet.addRow({
        hostname:
          model.unavailable.clients ??
          'No clients connected (live snapshot at generation time)',
      });
    }

    if (model.interstellio) {
      const interSheet = workbook.addWorksheet('Interstellio');
      interSheet.columns = [
        { header: 'Day index', key: 'day', width: 12 },
        { header: 'Download bytes', key: 'rx', width: 18 },
        { header: 'Upload bytes', key: 'tx', width: 18 },
      ];
      styleHeaderRow(interSheet.getRow(1));
      interSheet.insertRow(1, [
        'Linked',
        model.interstellio.linked ? 'Yes' : 'No',
      ]);
      interSheet.insertRow(2, [
        'Site',
        model.interstellio.siteName ?? '—',
      ]);
      interSheet.insertRow(3, [
        'Note',
        model.interstellio.note ?? '',
      ]);
      interSheet.insertRow(4, []);
      model.interstellio.dailyDownloadBytes.forEach((rx, index) => {
        interSheet.addRow({
          day: index + 1,
          rx,
          tx: model.interstellio?.dailyUploadBytes[index] ?? 0,
        });
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
