/**
 * Ruijie performance metric mappers (Tier 1 — current_performance + STA util)
 */

import {
  aggregateStaExperienceForDevice,
  aggregateStaMetricsForDevice,
  buildHourlyFlowRequest,
  deriveUptimeFromLogs,
  estimateSpanSeconds,
  mapCurrentPerformance,
  pickFlowDeviceSn,
  type DeviceLogRaw,
  type StaUserRaw,
} from '@/lib/ruijie/performance-metrics';

describe('mapCurrentPerformance', () => {
  it('maps the full current_performance payload, not just cpu/memory', () => {
    // Shape captured live from G1U52HL044467 (RAP2200(F))
    expect(
      mapCurrentPerformance({
        cpuRate: 30,
        memoryRate: 63,
        memoryFree: 114336,
        flashRate: 67,
        flashFree: 408,
        diskRate: 0,
        diskFree: 0,
        processNum: 179,
        cpuTemp: 41.5,
        userCnt: 3,
      })
    ).toEqual({
      cpu_usage: 30,
      memory_usage: 63,
      cpu_temp: 41.5,
      memory_free_kb: 114336,
      flash_rate: 67,
      flash_free_kb: 408,
      disk_rate: 0,
      disk_free_kb: 0,
      process_num: 179,
      user_count: 3,
    });
  });

  it('treats cpuTemp 0 as not reported (RAP2200 has no temperature sensor)', () => {
    expect(mapCurrentPerformance({ cpuRate: 6, cpuTemp: 0 }).cpu_temp).toBeNull();
  });

  it('keeps a genuine 0 for rate fields', () => {
    const mapped = mapCurrentPerformance({ diskRate: 0, flashRate: 0 });
    expect(mapped.disk_rate).toBe(0);
    expect(mapped.flash_rate).toBe(0);
  });

  it('returns nulls when the payload is empty', () => {
    expect(mapCurrentPerformance({})).toEqual({
      cpu_usage: null,
      memory_usage: null,
      cpu_temp: null,
      memory_free_kb: null,
      flash_rate: null,
      flash_free_kb: null,
      disk_rate: null,
      disk_free_kb: null,
      process_num: null,
      user_count: null,
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

describe('aggregateStaExperienceForDevice', () => {
  // Field shapes captured live from sta_users for G1U52HL044467
  const stas: StaUserRaw[] = [
    {
      sn: 'AP-1',
      mac: 'aa',
      band: '2.4G',
      timeDelay: 108,
      score: 96,
      scoreReason: '',
      floorNoise: -91,
      activeTime: 1_142_000,
    },
    {
      sn: 'AP-1',
      mac: 'bb',
      band: '5G',
      timeDelay: 200,
      score: 74,
      scoreReason: 'heavy interference',
      floorNoise: -92,
      activeTime: 181_428_000,
    },
    {
      sn: 'AP-1',
      mac: 'cc',
      band: '5G',
      timeDelay: 1,
      score: 100,
      scoreReason: '',
      floorNoise: -94,
      activeTime: 132_886_000,
    },
    // Different AP — must be excluded entirely
    { sn: 'AP-2', mac: 'dd', band: '5G', timeDelay: 999, score: 10, floorNoise: -60 },
  ];

  it('summarises latency, score and noise floor for one AP', () => {
    expect(aggregateStaExperienceForDevice(stas, 'AP-1')).toEqual({
      avg_latency_ms: 103, // (108 + 200 + 1) / 3
      worst_latency_ms: 200,
      avg_score: 90, // (96 + 74 + 100) / 3
      worst_score: 74,
      worst_score_reason: 'heavy interference',
      noise_floor_2g: -91,
      noise_floor_5g: -93, // (-92 + -94) / 2
      clients_2g: 1,
      clients_5g: 2,
      longest_session_ms: 181_428_000,
    });
  });

  it('reports no reason when the worst client has none', () => {
    const clean: StaUserRaw[] = [{ sn: 'AP-1', band: '5G', score: 88, scoreReason: '' }];
    expect(aggregateStaExperienceForDevice(clean, 'AP-1').worst_score_reason).toBeNull();
  });

  it('parses string-typed numerics (Ruijie returns several as strings)', () => {
    const stringy = [
      { sn: 'AP-1', band: '2.4G', timeDelay: '50', score: '80', floorNoise: '-88' },
    ] as unknown as StaUserRaw[];
    const out = aggregateStaExperienceForDevice(stringy, 'AP-1');
    expect(out.avg_latency_ms).toBe(50);
    expect(out.avg_score).toBe(80);
    expect(out.noise_floor_2g).toBe(-88);
  });

  it('returns empty experience when the AP has no stations', () => {
    expect(aggregateStaExperienceForDevice(stas, 'AP-MISSING')).toEqual({
      avg_latency_ms: null,
      worst_latency_ms: null,
      avg_score: null,
      worst_score: null,
      worst_score_reason: null,
      noise_floor_2g: null,
      noise_floor_5g: null,
      clients_2g: 0,
      clients_5g: 0,
      longest_session_ms: null,
    });
  });
});

describe('deriveUptimeFromLogs', () => {
  const NOW = 1_785_097_786_000;
  // logSubType is undocumented but present on every live onoffline entry
  const logs: DeviceLogRaw[] = [
    { logType: 'onoffline', logSubType: 'OFF', logDetail: 'Device offline', operateTime: NOW - 7_200_000 },
    { logType: 'onoffline', logSubType: 'ON', logDetail: 'Device online', operateTime: NOW - 3_600_000 },
    { logType: 'reboot', logDetail: 'Device restart', operateTime: NOW - 3_600_000 },
  ];

  it('measures uptime from the most recent online event regardless of log order', () => {
    expect(deriveUptimeFromLogs(logs, NOW)).toBe(3600);
  });

  it('returns null when the newest onoffline event is OFF', () => {
    const down: DeviceLogRaw[] = [
      { logType: 'onoffline', logSubType: 'ON', logDetail: 'Device online', operateTime: NOW - 7_200_000 },
      { logType: 'onoffline', logSubType: 'OFF', logDetail: 'Device offline', operateTime: NOW - 60_000 },
    ];
    expect(deriveUptimeFromLogs(down, NOW)).toBeNull();
  });

  it('falls back to logDetail when logSubType is absent', () => {
    const noSubType: DeviceLogRaw[] = [
      { logType: 'onoffline', logDetail: 'Device online', operateTime: NOW - 1_800_000 },
    ];
    expect(deriveUptimeFromLogs(noSubType, NOW)).toBe(1800);
  });

  it('returns null when there is no onoffline history at all', () => {
    expect(deriveUptimeFromLogs([{ logType: 'reboot', logDetail: 'Device restart', operateTime: NOW }], NOW)).toBeNull();
  });

  it('returns null rather than a negative uptime for a future timestamp', () => {
    const future: DeviceLogRaw[] = [
      { logType: 'onoffline', logSubType: 'ON', logDetail: 'Device online', operateTime: NOW + 60_000 },
    ];
    expect(deriveUptimeFromLogs(future, NOW)).toBeNull();
  });
});

describe('estimateSpanSeconds', () => {
  const at = (minutes: number) => ({ timestamp: 1_700_000_000_000 + minutes * 60_000 });

  it('measures the real span of 10-minute buckets, not one hour per point', () => {
    // 6 buckets x 10 min = 1 hour, not 6 hours
    expect(estimateSpanSeconds([at(0), at(10), at(20), at(30), at(40), at(50)])).toBe(3600);
  });

  it('still resolves hourly rollup points correctly', () => {
    expect(estimateSpanSeconds([at(0), at(60), at(120)])).toBe(3 * 3600);
  });

  it('handles unsorted input', () => {
    expect(estimateSpanSeconds([at(20), at(0), at(10)])).toBe(1800);
  });

  it('assumes one hour for a single point and zero for none', () => {
    expect(estimateSpanSeconds([at(0)])).toBe(3600);
    expect(estimateSpanSeconds([])).toBe(0);
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
