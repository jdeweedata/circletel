/**
 * Analytics export — pure period/filename helpers + model assembly with mocks.
 */

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/ruijie/client', () => ({
  getDeviceClients: jest.fn(),
}));

jest.mock('@/lib/usage-reports/core-traffic', () => ({
  loadInterstellioSubscriberId: jest.fn(),
  loadInterstellioDailyEntries: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getDeviceClients } from '@/lib/ruijie/client';
import {
  loadInterstellioSubscriberId,
  loadInterstellioDailyEntries,
} from '@/lib/usage-reports/core-traffic';
import {
  analyticsExportFilename,
  buildAnalyticsExportModel,
  periodToReportPeriod,
  resolveAnalyticsExportPeriod,
  shapeInterstellioSection,
  trafficFromAnalyticsRollups,
  type AnalyticsExportModel,
} from '@/lib/network/analytics-export';
import { generateAnalyticsReportPdf } from '@/lib/network/analytics-report-pdf';
import { generateAnalyticsReportExcel } from '@/lib/network/analytics-report-excel';
import ExcelJS from 'exceljs';

describe('resolveAnalyticsExportPeriod', () => {
  it('uses custom SAST range when both dates are valid', () => {
    const period = resolveAnalyticsExportPeriod({
      hoursRaw: '24',
      startDate: '2026-07-26',
      endDate: '2026-08-02',
    });
    expect(period.mode).toBe('custom');
    if (period.mode !== 'custom') return;
    expect(period.startDate).toBe('2026-07-26');
    expect(period.endDate).toBe('2026-08-02');
    expect(period.inclusiveDayCount).toBe(8);
    expect(period.label).toBe('2026-07-26 → 2026-08-02');
  });

  it('falls back to hours when custom is invalid', () => {
    const period = resolveAnalyticsExportPeriod({
      hoursRaw: '168',
      startDate: '2026-08-02',
      endDate: '2026-07-26',
    });
    expect(period.mode).toBe('hours');
    if (period.mode !== 'hours') return;
    expect(period.hours).toBe(168);
    expect(period.label).toBe('Last 7 days');
  });
});

describe('analyticsExportFilename', () => {
  it('names group and device exports with period suffix', () => {
    const hoursPeriod = resolveAnalyticsExportPeriod({
      hoursRaw: '168',
      startDate: null,
      endDate: null,
    });
    expect(
      analyticsExportFilename({
        scope: 'group',
        groupName: 'Unjani',
        deviceSn: null,
        period: hoursPeriod,
        extension: 'pdf',
      })
    ).toMatch(/^CircleTel_Analytics_Unjani_\d{4}-\d{2}-\d{2}_7d\.pdf$/);

    expect(
      analyticsExportFilename({
        scope: 'device',
        groupName: 'Unjani',
        deviceSn: 'G1U52HL00261B',
        period: hoursPeriod,
        extension: 'xlsx',
      })
    ).toMatch(/^CircleTel_Analytics_G1U52HL00261B_\d{4}-\d{2}-\d{2}_7d\.xlsx$/);
  });
});

describe('trafficFromAnalyticsRollups', () => {
  it('sums scoped rollup rows into a traffic summary', () => {
    const summary = trafficFromAnalyticsRollups([
      {
        captured_at: '2026-08-01T10:00:00Z',
        total_rx_bytes: 1000,
        total_tx_bytes: 100,
        avg_rx_bps: 8000,
        avg_tx_bps: 800,
      },
      {
        captured_at: '2026-08-01T11:00:00Z',
        total_rx_bytes: 2000,
        total_tx_bytes: 200,
        avg_rx_bps: 16000,
        avg_tx_bps: 1600,
      },
    ]);
    expect(summary.totalRxBytes).toBe(3000);
    expect(summary.totalTxBytes).toBe(300);
    expect(summary.dataPoints).toHaveLength(2);
    expect(summary.peakRxBytes).toBe(2000);
  });
});

describe('shapeInterstellioSection', () => {
  it('marks unmapped sites as not linked', () => {
    const section = shapeInterstellioSection({
      siteId: null,
      siteName: null,
      subscriberId: null,
      entries: [],
      dayCount: 3,
    });
    expect(section.linked).toBe(false);
    expect(section.note).toMatch(/not linked/i);
    expect(section.dailyDownloadBytes).toEqual([0, 0, 0]);
  });

  it('maps daily entries into download/upload byte arrays', () => {
    const section = shapeInterstellioSection({
      siteId: 'site-1',
      siteName: 'Unjani Alex',
      subscriberId: 'sub-1',
      dayCount: 2,
      startUtc: new Date('2026-07-31T22:00:00.000Z'), // 2026-08-01 00:00 SAST
      entries: [
        {
          time: '2026-08-01T12:00:00+02:00',
          download_kb: 1000,
          upload_kb: 100,
          combined_kb: 1100,
        },
        {
          time: '2026-08-02T12:00:00+02:00',
          download_kb: 2000,
          upload_kb: 200,
          combined_kb: 2200,
        },
      ],
    });
    expect(section.linked).toBe(true);
    expect(section.dailyDownloadBytes.length).toBe(2);
    expect(section.dailyUploadBytes?.length).toBe(2);
    expect(section.dailyDownloadBytes[0]).toBe(1000 * 1024);
    expect(section.dailyUploadBytes?.[0]).toBe(100 * 1024);
    expect(section.siteName).toBe('Unjani Alex');
  });
});

describe('periodToReportPeriod', () => {
  it('builds a ReportPeriod for Interstellio loaders', () => {
    const period = resolveAnalyticsExportPeriod({
      hoursRaw: null,
      startDate: '2026-07-26',
      endDate: '2026-08-02',
    });
    const report = periodToReportPeriod(period);
    expect(report.preset).toBe('custom');
    expect(report.inclusiveDayCount).toBe(8);
    expect(report.timezone).toBe('Africa/Johannesburg');
  });
});

describe('buildAnalyticsExportModel', () => {
  const deviceRows = [
    {
      group_id: '9058218',
      group_name: 'Unjani',
      sn: 'G1U52HL00261B',
      device_name: 'UNJANIALEX2',
      model: 'RAP2200(F)',
      status: 'online',
      radio_2g_utilization: 20,
      radio_5g_utilization: 5,
      radio_2g_channel: 1,
      radio_5g_channel: 36,
    },
    {
      group_id: '9058218',
      group_name: 'Unjani',
      sn: 'G1U52HL044404',
      device_name: 'UNJANISICELO',
      model: 'RAP2200(F)',
      status: 'online',
      radio_2g_utilization: 10,
      radio_5g_utilization: 2,
      radio_2g_channel: 6,
      radio_5g_channel: 40,
    },
  ];

  const rollups = [
    {
      group_id: '9058218',
      group_name: 'Unjani',
      device_sn: 'G1U52HL00261B',
      captured_at: '2026-08-01T10:00:00Z',
      hours_window: 1,
      total_rx_bytes: 5_000_000,
      total_tx_bytes: 500_000,
      avg_rx_bps: 10_000,
      avg_tx_bps: 1_000,
      peak_rx_bps: 20_000,
      peak_tx_bps: 2_000,
      raw_summary: null,
    },
    {
      group_id: '9058218',
      group_name: 'Unjani',
      device_sn: 'G1U52HL044404',
      captured_at: '2026-08-01T10:00:00Z',
      hours_window: 1,
      total_rx_bytes: 1_000_000,
      total_tx_bytes: 100_000,
      avg_rx_bps: 2_000,
      avg_tx_bps: 200,
      peak_rx_bps: 4_000,
      peak_tx_bps: 400,
      raw_summary: null,
    },
  ];

  function mockSupabase(opts?: {
    siteLink?: { corporate_site_id: string; site_name: string } | null;
  }) {
    const siteLink = opts?.siteLink ?? null;
    const from = jest.fn((table: string) => {
      if (table === 'ruijie_device_cache') {
        return {
          select: () => ({
            not: () => Promise.resolve({ data: deviceRows, error: null }),
          }),
        };
      }
      if (table === 'ruijie_traffic_rollups') {
        const chain: Record<string, unknown> = {};
        const self = () => chain;
        chain.select = self;
        chain.eq = self;
        chain.neq = self;
        chain.gte = self;
        chain.lte = self;
        chain.order = () => Promise.resolve({ data: rollups, error: null });
        return chain;
      }
      if (table === 'network_devices') {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                limit: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: siteLink
                        ? { corporate_site_id: siteLink.corporate_site_id }
                        : null,
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'corporate_sites') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: siteLink
                    ? {
                        id: siteLink.corporate_site_id,
                        site_name: siteLink.site_name,
                        interstellio_subscriber_id: 'sub-1',
                      }
                    : null,
                  error: null,
                }),
            }),
          }),
        };
      }
      return { select: () => ({}) };
    });
    (createClient as jest.Mock).mockResolvedValue({ from });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (getDeviceClients as jest.Mock).mockResolvedValue([
      {
        mac: 'AA:BB:CC:DD:EE:FF',
        userIp: '192.168.77.10',
        ssid: 'Unjani Clinic Staff',
        rssi: -50,
        band: '5G',
        channel: 36,
        sn: 'G1U52HL00261B',
        signalQuality: 'excellent',
        utilization: null,
        uplinkRate: 1_000_000,
        downlinkRate: 10_000_000,
        pktLoseRate: 0,
        latencyMs: 12,
        score: 95,
        scoreReason: null,
        hostname: 'phone',
        vendor: 'Apple',
        sessionBytes: 1000,
        sessionMs: 1000,
      },
    ]);
    (loadInterstellioSubscriberId as jest.Mock).mockResolvedValue(null);
    (loadInterstellioDailyEntries as jest.Mock).mockResolvedValue([]);
  });

  it('builds a group-scoped model without clients or Interstellio', async () => {
    mockSupabase();
    const model = await buildAnalyticsExportModel({
      groupId: '9058218',
      deviceSn: null,
      hoursRaw: '24',
      startDate: null,
      endDate: null,
    });
    expect(model).not.toBeNull();
    expect(model!.scope).toBe('group');
    expect(model!.traffic.totalRxBytes).toBe(6_000_000);
    expect(model!.clients).toEqual([]);
    expect(model!.interstellio).toBeNull();
    expect(model!.unavailable.clients).toMatch(/Select an AP/i);
  });

  it('builds a device-scoped model with clients and unmapped Interstellio', async () => {
    mockSupabase({ siteLink: null });
    const model = await buildAnalyticsExportModel({
      groupId: '9058218',
      deviceSn: 'G1U52HL00261B',
      hoursRaw: '24',
      startDate: null,
      endDate: null,
    });
    expect(model!.scope).toBe('device');
    expect(model!.device?.sn).toBe('G1U52HL00261B');
    expect(model!.traffic.totalRxBytes).toBe(5_000_000);
    expect(model!.clients).toHaveLength(1);
    expect(model!.interstellio?.linked).toBe(false);
  });

  it('attaches Interstellio when the AP is linked to a mapped site', async () => {
    mockSupabase({
      siteLink: { corporate_site_id: 'site-alex', site_name: 'Unjani Alex' },
    });
    (loadInterstellioSubscriberId as jest.Mock).mockResolvedValue('sub-1');
    (loadInterstellioDailyEntries as jest.Mock).mockResolvedValue([
      {
        time: '2026-08-03T12:00:00+02:00',
        download_kb: 100,
        upload_kb: 10,
        combined_kb: 110,
      },
      {
        time: '2026-08-04T12:00:00+02:00',
        download_kb: 200,
        upload_kb: 20,
        combined_kb: 220,
      },
    ]);

    const model = await buildAnalyticsExportModel({
      groupId: '9058218',
      deviceSn: 'G1U52HL00261B',
      hoursRaw: '48',
      startDate: null,
      endDate: null,
    });

    expect(model!.interstellio?.linked).toBe(true);
    expect(model!.interstellio?.siteName).toBe('Unjani Alex');
    expect(loadInterstellioDailyEntries).toHaveBeenCalled();
  });
});

describe('analytics report generators', () => {
  const baseModel = (): AnalyticsExportModel => ({
    scope: 'device',
    group: { id: '9058218', name: 'Unjani' },
    device: {
      sn: 'G1U52HL00261B',
      device_name: 'UNJANIALEX2',
      model: 'RAP2200(F)',
      status: 'online',
      group_id: '9058218',
      group_name: 'Unjani',
    },
    period: {
      mode: 'hours',
      hours: 24,
      label: 'Last 24 hours',
      startUtc: new Date('2026-08-03T00:00:00Z'),
      endUtc: new Date('2026-08-04T00:00:00Z'),
    },
    traffic: trafficFromAnalyticsRollups([
      {
        captured_at: '2026-08-03T10:00:00Z',
        total_rx_bytes: 1_000_000,
        total_tx_bytes: 100_000,
        avg_rx_bps: 1000,
        avg_tx_bps: 100,
      },
    ]),
    groupTraffic: [
      {
        groupId: '9058218',
        groupName: 'Unjani',
        totalRxBytes: 1_000_000,
        totalTxBytes: 100_000,
        totalBytes: 1_100_000,
        sampleCount: 1,
        lastCapturedAt: '2026-08-03T10:00:00Z',
      },
    ],
    radio: {
      avg2g: 20,
      avg5g: 5,
      avgBlended: 12,
      devicesWithRadio: 1,
      totalDevices: 1,
      channels2g: [1],
      channels5g: [36],
      byDevice: [],
    },
    clients: [],
    interstellio: {
      linked: true,
      siteName: 'Unjani Alex',
      dailyDownloadBytes: [1024],
      dailyUploadBytes: [128],
      totalDownloadBytes: 1024,
      totalUploadBytes: 128,
      note: 'Secondary source',
    },
    generatedAtIso: '2026-08-04T10:00:00.000Z',
    unavailable: {},
  });

  it('produces a PDF for a device-scoped model', () => {
    const pdf = generateAnalyticsReportPdf(baseModel());
    expect(Buffer.from(pdf.slice(0, 4)).toString('ascii')).toBe('%PDF');
    expect(pdf.byteLength).toBeGreaterThan(2_000);
  });

  it('produces an Excel workbook with expected sheets', async () => {
    const buffer = await generateAnalyticsReportExcel(baseModel());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    expect(workbook.worksheets.map((s) => s.name)).toEqual([
      'Overview',
      'Traffic',
      'Group cards',
      'Radio',
      'Clients',
      'Interstellio',
    ]);
  });
});
