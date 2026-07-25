/**
 * Ruijie performance metric mappers (Tier 1 — current_performance + STA util)
 */

import {
  aggregateStaMetricsForDevice,
  buildHourlyFlowRequest,
  mapCurrentPerformance,
  pickFlowDeviceSn,
  type StaUserRaw,
} from '@/lib/ruijie/performance-metrics';

describe('mapCurrentPerformance', () => {
  it('maps cpuRate and memoryRate from current_performance payload', () => {
    expect(
      mapCurrentPerformance({
        cpuRate: 30,
        memoryRate: 63,
        memoryFree: 114336,
        flashRate: 67,
        processNum: 179,
      })
    ).toEqual({
      cpu_usage: 30,
      memory_usage: 63,
    });
  });

  it('returns nulls when rates are missing', () => {
    expect(mapCurrentPerformance({})).toEqual({
      cpu_usage: null,
      memory_usage: null,
    });
  });
});

describe('aggregateStaMetricsForDevice', () => {
  const stas: StaUserRaw[] = [
    {
      sn: 'AP-1',
      mac: 'aa',
      band: '2.4G',
      channel: '6',
      utilization: 40,
      rssi: '-50',
    },
    {
      sn: 'AP-1',
      mac: 'bb',
      band: '5G',
      channel: '36',
      utilization: 20,
      rssi: '-55',
    },
    {
      sn: 'AP-1',
      mac: 'cc',
      band: '5G',
      channel: '36',
      utilization: 30,
      rssi: '-60',
    },
    {
      sn: 'AP-2',
      mac: 'dd',
      band: '5G',
      channel: '44',
      utilization: 90,
      rssi: '-40',
    },
  ];

  it('counts clients and averages utilization by band for one AP', () => {
    expect(aggregateStaMetricsForDevice(stas, 'AP-1')).toEqual({
      online_clients: 3,
      radio_2g_channel: 6,
      radio_5g_channel: 36,
      radio_2g_utilization: 40,
      radio_5g_utilization: 25,
    });
  });

  it('returns zeros/nulls when AP has no stations', () => {
    expect(aggregateStaMetricsForDevice(stas, 'AP-MISSING')).toEqual({
      online_clients: 0,
      radio_2g_channel: null,
      radio_5g_channel: null,
      radio_2g_utilization: null,
      radio_5g_utilization: null,
    });
  });
});

describe('buildHourlyFlowRequest', () => {
  it('builds sn + startDate + endDate window (docs 2.6.2)', () => {
    const end = 1_700_000_000_000;
    const body = buildHourlyFlowRequest({ sn: 'EG-1', hours: 24, endMs: end });
    expect(body).toEqual({
      sn: 'EG-1',
      startDate: end - 24 * 60 * 60 * 1000,
      endDate: end,
    });
  });
});

describe('pickFlowDeviceSn', () => {
  it('prefers online gateway/EG models', () => {
    expect(
      pickFlowDeviceSn([
        { sn: 'AP-1', status: 'online', model: 'RAP2200' },
        { sn: 'EG-9', status: 'online', model: 'EG2100' },
        { sn: 'AP-2', status: 'offline', model: 'RAP2200' },
      ])
    ).toBe('EG-9');
  });

  it('falls back to first online device', () => {
    expect(
      pickFlowDeviceSn([
        { sn: 'AP-1', status: 'offline', model: 'RAP2200' },
        { sn: 'AP-2', status: 'online', model: 'RAP2200' },
      ])
    ).toBe('AP-2');
  });
});
