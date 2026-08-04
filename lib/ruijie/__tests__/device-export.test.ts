/**
 * Device report export — model builder, PDF and Excel generators.
 * Ruijie client + Supabase are mocked; fixtures mimic live response shapes.
 */

import ExcelJS from 'exceljs';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createClientWithSession: jest.fn(),
}));

jest.mock('../client', () => ({
  getDeviceMetrics: jest.fn(),
  getDeviceClients: jest.fn(),
  getDeviceLogs: jest.fn(),
  getNetworkTraffic: jest.fn(),
}));

jest.mock('@/lib/network/analytics-export', () => ({
  resolveAnalyticsExportPeriod: jest.fn(() => ({
    mode: 'hours',
    hours: 24,
    label: 'Last 24 hours',
    startUtc: new Date('2026-08-01T00:00:00Z'),
    endUtc: new Date('2026-08-02T00:00:00Z'),
  })),
  loadInterstellioForDeviceSn: jest.fn(async () => ({
    linked: false,
    dailyDownloadBytes: [0],
    dailyUploadBytes: [0],
    totalDownloadBytes: 0,
    totalUploadBytes: 0,
    note: 'Interstellio not linked for this AP — set corporate_sites.interstellio_subscriber_id on the linked site.',
  })),
}));

import { createClient } from '@/lib/supabase/server';
import {
  getDeviceMetrics,
  getDeviceClients,
  getDeviceLogs,
  getNetworkTraffic,
} from '../client';
import { loadInterstellioForDeviceSn } from '@/lib/network/analytics-export';
import {
  buildDeviceExportModel,
  clampHours,
  exportFilename,
  type DeviceExportModel,
} from '../device-export';
import { generateDeviceReportPdf } from '../device-report-pdf';
import { generateDeviceReportExcel } from '../device-report-excel';

const DEVICE_ROW = {
  sn: 'G1U52HL044467',
  device_name: 'UNJANICLINICTHOKOZA',
  model: 'RAP2200(F)',
  group_id: '9058218',
  group_name: 'Unjani',
  management_ip: '10.0.0.2',
  wan_ip: '105.0.0.1',
  egress_ip: '105.0.0.1',
  status: 'online',
  config_status: 'Synced',
  firmware_version: 'ReyeeOS 1.55',
  mac_address: 'AA:BB:CC:DD:EE:FF',
  cpu_usage: 12,
  memory_usage: 44,
  uptime_seconds: 86_400,
  online_clients: 2,
  synced_at: '2026-08-02T14:11:43.751Z',
};

const TRAFFIC = {
  totalRxBytes: 14_800_000_000,
  totalTxBytes: 4_600_000_000,
  totalBytes: 19_400_000_000,
  avgRxRate: 210_500,
  avgTxRate: 64_900,
  peakRxBytes: 702_100_000,
  peakTxBytes: 88_000_000,
  dataPoints: Array.from({ length: 144 }, (_, i) => ({
    timestamp: 1_754_000_000_000 + i * 600_000,
    timeString: `2026-08-01 ${String(Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}:00`,
    rxBytes: 100_000_000 + i,
    txBytes: 30_000_000 + i,
    rxPkts: 1000,
    txPkts: 400,
    buildingId: 0,
    sn: 'G1U52HL044467',
  })),
};

const CLIENTS = [
  {
    mac: '11:22:33:44:55:66',
    userIp: '192.168.110.21',
    ssid: 'Unjani-Staff',
    rssi: -48,
    band: '5G',
    channel: 36,
    sn: 'G1U52HL044467',
    signalQuality: 'excellent' as const,
    utilization: null,
    uplinkRate: 12_000_000,
    downlinkRate: 86_000_000,
    pktLoseRate: null,
    latencyMs: 4,
    score: 98,
    scoreReason: null,
    hostname: 'clinic-laptop',
    vendor: 'HP',
    sessionBytes: 1_400_000_000,
    sessionMs: 5_600_000,
  },
];

const LOGS = [
  {
    id: 1,
    sn: 'G1U52HL044467',
    logType: 'onoffline',
    logSubType: 'ON',
    logDetail: 'AP came online',
    operateTime: 1_754_100_000_000,
  },
];

const METRICS = {
  cpu_usage: 14,
  memory_usage: 41,
  uptime_seconds: 90_000,
  online_clients: 2,
  radio_2g_channel: 6,
  radio_5g_channel: 36,
  radio_2g_utilization: 20,
  radio_5g_utilization: 12,
  system: {},
  experience: {},
};

function mockSupabaseDeviceRow(row: typeof DEVICE_ROW | null) {
  (createClient as jest.Mock).mockResolvedValue({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(async () => ({ data: row, error: row ? null : { message: 'not found' } })),
        })),
      })),
    })),
  });
}

function fullFixtureModel(): DeviceExportModel {
  return {
    device: { ...DEVICE_ROW },
    metrics: METRICS as unknown as DeviceExportModel['metrics'],
    traffic: TRAFFIC,
    clients: CLIENTS,
    logs: LOGS,
    interstellio: {
      linked: false,
      dailyDownloadBytes: [0],
      dailyUploadBytes: [0],
      totalDownloadBytes: 0,
      totalUploadBytes: 0,
      note: 'Interstellio not linked',
    },
    hours: 168,
    generatedAtIso: '2026-08-02T15:00:00.000Z',
    unavailable: {},
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (loadInterstellioForDeviceSn as jest.Mock).mockResolvedValue({
    linked: false,
    dailyDownloadBytes: [0],
    dailyUploadBytes: [0],
    totalDownloadBytes: 0,
    totalUploadBytes: 0,
    note: 'Interstellio not linked for this AP — set corporate_sites.interstellio_subscriber_id on the linked site.',
  });
});

describe('clampHours', () => {
  it('accepts the four traffic windows and defaults everything else to 24', () => {
    expect(clampHours(6)).toBe(6);
    expect(clampHours(168)).toBe(168);
    expect(clampHours(999)).toBe(24);
    expect(clampHours(NaN)).toBe(24);
    expect(clampHours(null)).toBe(24);
  });
});

describe('exportFilename', () => {
  it('embeds SN, SAST date and window', () => {
    const name = exportFilename('G1U52HL044467', 168, 'pdf');
    expect(name).toMatch(/^CircleTel_Device_G1U52HL044467_\d{4}-\d{2}-\d{2}_168h\.pdf$/);
  });
});

describe('buildDeviceExportModel', () => {
  it('assembles all sections when every source succeeds', async () => {
    mockSupabaseDeviceRow(DEVICE_ROW);
    (getDeviceMetrics as jest.Mock).mockResolvedValue(METRICS);
    (getNetworkTraffic as jest.Mock).mockResolvedValue(TRAFFIC);
    (getDeviceClients as jest.Mock).mockResolvedValue(CLIENTS);
    (getDeviceLogs as jest.Mock).mockResolvedValue(LOGS);

    const model = await buildDeviceExportModel('G1U52HL044467', 168);

    expect(model).not.toBeNull();
    expect(model!.device.device_name).toBe('UNJANICLINICTHOKOZA');
    expect(model!.traffic!.dataPoints).toHaveLength(144);
    expect(model!.clients).toHaveLength(1);
    expect(model!.logs).toHaveLength(1);
    expect(model!.unavailable).toEqual({});
    expect(model!.interstellio?.linked).toBe(false);
    expect(getDeviceClients).toHaveBeenCalledWith('G1U52HL044467', '9058218');
    expect(loadInterstellioForDeviceSn).toHaveBeenCalled();
  });

  it('degrades failed sections to unavailable notes instead of throwing', async () => {
    mockSupabaseDeviceRow(DEVICE_ROW);
    (getDeviceMetrics as jest.Mock).mockResolvedValue(METRICS);
    (getNetworkTraffic as jest.Mock).mockResolvedValue(TRAFFIC);
    (getDeviceClients as jest.Mock).mockRejectedValue(new Error('STA timeout'));
    (getDeviceLogs as jest.Mock).mockRejectedValue(new Error('logs 500'));

    const model = await buildDeviceExportModel('G1U52HL044467', 24);

    expect(model!.clients).toEqual([]);
    expect(model!.logs).toEqual([]);
    expect(model!.unavailable.clients).toBe('STA timeout');
    expect(model!.unavailable.logs).toBe('logs 500');
  });

  it('flags an empty traffic window as unavailable but keeps the summary', async () => {
    mockSupabaseDeviceRow(DEVICE_ROW);
    (getDeviceMetrics as jest.Mock).mockResolvedValue(METRICS);
    (getNetworkTraffic as jest.Mock).mockResolvedValue({ ...TRAFFIC, dataPoints: [] });
    (getDeviceClients as jest.Mock).mockResolvedValue([]);
    (getDeviceLogs as jest.Mock).mockResolvedValue([]);

    const model = await buildDeviceExportModel('G1U52HL044467', 24);

    expect(model!.traffic).not.toBeNull();
    expect(model!.unavailable.traffic).toMatch(/No traffic samples/);
  });

  it('returns null for an unknown device', async () => {
    mockSupabaseDeviceRow(null);
    const model = await buildDeviceExportModel('NOPE', 24);
    expect(model).toBeNull();
    expect(getNetworkTraffic).not.toHaveBeenCalled();
  });
});

describe('generateDeviceReportPdf', () => {
  it('produces a PDF from a full model', () => {
    const output = generateDeviceReportPdf(fullFixtureModel());
    const magic = Buffer.from(output.slice(0, 4)).toString('ascii');
    expect(magic).toBe('%PDF');
    expect(output.byteLength).toBeGreaterThan(5_000);
    // Customer-facing copy + signal legend (binary PDF still embeds ASCII strings)
    const asText = Buffer.from(output).toString('latin1');
    expect(asText).toContain('Wi-Fi usage report');
    expect(asText).toContain('How to read signal quality');
    expect(asText).toContain('Download');
    expect(asText).not.toContain('Upload (stacked)');
  });

  it('still renders when traffic, clients and logs are all unavailable', () => {
    const model: DeviceExportModel = {
      ...fullFixtureModel(),
      traffic: { ...TRAFFIC, dataPoints: [], totalRxBytes: 0, totalTxBytes: 0 },
      clients: [],
      logs: [],
      unavailable: {
        traffic: 'No traffic samples returned for this window',
        clients: 'Not available — device offline',
        logs: 'Ruijie timeout',
      },
    };
    const output = generateDeviceReportPdf(model);
    expect(Buffer.from(output.slice(0, 4)).toString('ascii')).toBe('%PDF');
  });
});

describe('generateDeviceReportExcel', () => {
  it('produces a workbook with traffic buckets and Interstellio sheet', async () => {
    const buffer = await generateDeviceReportExcel(fullFixtureModel());

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Overview',
      'Traffic',
      'Clients',
      'Interstellio',
      'Logs',
    ]);

    const trafficSheet = workbook.getWorksheet('Traffic')!;
    // header + 144 buckets + totals row
    expect(trafficSheet.rowCount).toBe(1 + 144 + 1);
    expect(trafficSheet.getRow(1).getCell(1).value).toBe('Timestamp (SAST)');
    const totalsRow = trafficSheet.getRow(trafficSheet.rowCount);
    expect(totalsRow.getCell(1).value).toBe('TOTAL');
    expect(totalsRow.getCell(2).value).toBe(TRAFFIC.totalRxBytes);

    const overview = workbook.getWorksheet('Overview')!;
    expect(overview.getRow(1).getCell(2).value).toBe('UNJANICLINICTHOKOZA');

    const clients = workbook.getWorksheet('Clients')!;
    expect(clients.getRow(2).getCell(1).value).toBe('clinic-laptop');

    const logs = workbook.getWorksheet('Logs')!;
    expect(logs.getRow(2).getCell(4).value).toBe('AP came online');
  });
});
