/**
 * Network performance aggregate helpers (System Health dashboard)
 */

import {
  avgOrNull,
  buildDailyUptimeSeries,
  bpsToMbps,
  classifyDeviceRole,
  computeFleetOverview,
  computeNetworkInventory,
  computeResourceAverages,
  percentDelta,
  roundPercent,
} from '@/lib/network/performance-aggregates';

describe('roundPercent', () => {
  it('rounds to two decimal places', () => {
    expect(roundPercent(99.985)).toBe(99.99);
    expect(roundPercent(0)).toBe(0);
  });
});

describe('percentDelta', () => {
  it('returns change vs previous', () => {
    expect(percentDelta(98, 96)).toBeCloseTo(2.083, 2);
  });

  it('returns null when previous is zero', () => {
    expect(percentDelta(50, 0)).toBeNull();
  });
});

describe('bpsToMbps', () => {
  it('converts bits per second to Mbps', () => {
    expect(bpsToMbps(842_000_000)).toBeCloseTo(842, 1);
  });
});

describe('avgOrNull', () => {
  it('averages numbers and ignores nulls', () => {
    expect(avgOrNull([10, null, 20, undefined])).toBe(15);
  });

  it('returns null for empty', () => {
    expect(avgOrNull([])).toBeNull();
    expect(avgOrNull([null, undefined])).toBeNull();
  });
});

describe('computeResourceAverages', () => {
  it('averages CPU, memory, and blended radio utilization', () => {
    const result = computeResourceAverages([
      { cpu_usage: 60, memory_usage: 40, radio_2g_utilization: 20, radio_5g_utilization: 40 },
      { cpu_usage: 80, memory_usage: 60, radio_2g_utilization: 30, radio_5g_utilization: 50 },
    ]);

    expect(result.avgCpu).toBe(70);
    expect(result.avgMemory).toBe(50);
    expect(result.avgRadio).toBe(35);
  });
});

describe('computeFleetOverview', () => {
  it('builds System Health KPIs from device + snapshot inputs', () => {
    const overview = computeFleetOverview({
      devices: [
        { sn: 'a', status: 'online', online_clients: 10, cpu_usage: 50, memory_usage: 40, radio_2g_utilization: 10, radio_5g_utilization: 20 },
        { sn: 'b', status: 'online', online_clients: 5, cpu_usage: 70, memory_usage: 60, radio_2g_utilization: 30, radio_5g_utilization: 40 },
        { sn: 'c', status: 'offline', online_clients: 0, cpu_usage: null, memory_usage: null, radio_2g_utilization: null, radio_5g_utilization: null },
      ],
      healthBySn: {
        a: { health_score: 95, anomaly_count: 0 },
        b: { health_score: 72, anomaly_count: 1 },
        c: { health_score: 20, anomaly_count: 2 },
      },
      priorOnlineRate: 66.67,
    });

    expect(overview.totalDevices).toBe(3);
    expect(overview.onlineDevices).toBe(2);
    expect(overview.uptimePercent).toBeCloseTo(66.67, 1);
    expect(overview.healthyDevices).toBe(1);
    expect(overview.warningDevices).toBe(1);
    expect(overview.criticalDevices).toBe(1);
    expect(overview.offlineDevices).toBe(1);
    expect(overview.successRatePercent).toBeCloseTo(33.33, 1); // healthy / total
    expect(overview.responseConsistencyPercent).toBeCloseTo(66.67, 1); // score >= 50
    expect(overview.totalClients).toBe(15);
    expect(overview.resources.avgCpu).toBe(60);
    expect(overview.uptimeDeltaVsPrior).toBeCloseTo(0, 1);
  });
});

describe('buildDailyUptimeSeries', () => {
  it('computes daily online rates for last N days', () => {
    const series = buildDailyUptimeSeries({
      days: 3,
      now: new Date('2026-07-25T12:00:00Z'),
      snapshots: [
        { device_sn: 'a', status: 'online', captured_at: '2026-07-25T10:00:00Z' },
        { device_sn: 'b', status: 'offline', captured_at: '2026-07-25T10:00:00Z' },
        { device_sn: 'a', status: 'online', captured_at: '2026-07-24T10:00:00Z' },
        { device_sn: 'b', status: 'online', captured_at: '2026-07-24T10:00:00Z' },
        { device_sn: 'a', status: 'offline', captured_at: '2026-07-23T10:00:00Z' },
      ],
      deviceCount: 2,
    });

    expect(series).toHaveLength(3);
    expect(series[0].date).toBe('2026-07-23');
    expect(series[0].uptimePercent).toBe(0); // only offline snapshot that day for a; b missing → treat by samples
    expect(series[1].uptimePercent).toBe(100);
    expect(series[2].uptimePercent).toBe(50);
  });
});

describe('classifyDeviceRole', () => {
  it('detects gateway, switch, and AP from model/name', () => {
    expect(classifyDeviceRole('TL-ER7206', 'Edge')).toBe('gateway');
    expect(classifyDeviceRole('TL-SG2210MP', 'Core Switch')).toBe('switch');
    expect(classifyDeviceRole('RAP2260', 'Lobby AP')).toBe('ap');
    expect(classifyDeviceRole(null, 'OPERATIONSAP')).toBe('ap');
  });
});

describe('computeNetworkInventory', () => {
  it('counts roles and picks edge device', () => {
    const inv = computeNetworkInventory([
      {
        sn: 'g1',
        device_name: 'Edge',
        model: 'ER7206',
        status: 'online',
        online_clients: 2,
      },
      {
        sn: 's1',
        device_name: 'Core Switch',
        model: 'SG2210',
        status: 'offline',
        online_clients: 0,
      },
      {
        sn: 'a1',
        device_name: 'Lobby',
        model: 'RAP2260',
        status: 'online',
        online_clients: 5,
      },
    ]);

    expect(inv.gateway).toBe(1);
    expect(inv.ap).toBe(1);
    expect(inv.switchTotal).toBe(1);
    expect(inv.switchOnline).toBe(0);
    expect(inv.client).toBe(7);
    expect(inv.guest).toBeNull();
    expect(inv.edgeDevice?.sn).toBe('g1');
  });
});
