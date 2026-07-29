import {
  aggregateSsidActivity,
  buildHourlyRollupUpserts,
  computeGroupTrafficCards,
  computeRadioUtilSummary,
  hourBucketIso,
  HOURLY_ROLLUP_WINDOW,
} from '@/lib/network/analytics-aggregates';

describe('computeGroupTrafficCards', () => {
  it('sums rollups per group and sorts by total bytes', () => {
    const cards = computeGroupTrafficCards([
      {
        group_id: 'a',
        group_name: 'Unjani',
        total_rx_bytes: 100,
        total_tx_bytes: 50,
        captured_at: '2026-07-25T10:00:00Z',
      },
      {
        group_id: 'a',
        group_name: 'Unjani',
        total_rx_bytes: 200,
        total_tx_bytes: 25,
        captured_at: '2026-07-25T11:00:00Z',
      },
      {
        group_id: 'b',
        group_name: 'Newgen',
        total_rx_bytes: 10,
        total_tx_bytes: 5,
        captured_at: '2026-07-25T11:00:00Z',
      },
    ]);
    expect(cards).toHaveLength(2);
    expect(cards[0].groupName).toBe('Unjani');
    expect(cards[0].totalBytes).toBe(375);
    expect(cards[0].sampleCount).toBe(2);
    expect(cards[1].groupName).toBe('Newgen');
  });
});

describe('computeRadioUtilSummary', () => {
  it('returns null averages when util is missing (no fake dBm)', () => {
    const summary = computeRadioUtilSummary([
      {
        sn: '1',
        device_name: 'AP1',
        status: 'online',
        radio_2g_utilization: null,
        radio_5g_utilization: null,
      },
    ]);
    expect(summary.avg2g).toBeNull();
    expect(summary.avg5g).toBeNull();
    expect(summary.avgBlended).toBeNull();
    expect(summary.devicesWithRadio).toBe(0);
  });

  it('averages 2g/5g and lists channels when present', () => {
    const summary = computeRadioUtilSummary([
      {
        sn: '1',
        device_name: 'AP1',
        status: 'online',
        radio_2g_utilization: 20,
        radio_5g_utilization: 40,
        radio_2g_channel: 6,
        radio_5g_channel: 36,
      },
      {
        sn: '2',
        device_name: 'AP2',
        status: 'online',
        radio_2g_utilization: 10,
        radio_5g_utilization: null,
        radio_2g_channel: 11,
      },
    ]);
    expect(summary.avg2g).toBe(15);
    expect(summary.avg5g).toBe(40);
    expect(summary.devicesWithRadio).toBe(2);
    expect(summary.channels2g).toEqual([6, 11]);
    expect(summary.channels5g).toEqual([36]);
  });
});

describe('aggregateSsidActivity', () => {
  it('counts clients per SSID and skips blanks', () => {
    expect(
      aggregateSsidActivity([
        { ssid: 'Clinic' },
        { ssid: 'Clinic' },
        { ssid: 'Guest' },
        { ssid: '' },
        { ssid: null },
      ])
    ).toEqual([
      { ssid: 'Clinic', clients: 2 },
      { ssid: 'Guest', clients: 1 },
    ]);
  });
});

describe('buildHourlyRollupUpserts', () => {
  it('buckets flow points to UTC hours with hours_window=1', () => {
    const rows = buildHourlyRollupUpserts({
      groupId: '9124474',
      groupName: 'UnjanihAPaxS',
      flowSn: 'SN123',
      dataPoints: [
        {
          timestamp: Date.parse('2026-07-25T20:15:00+02:00'),
          rxBytes: 10_000_000,
          txBytes: 1_000_000,
        },
        {
          timestamp: Date.parse('2026-07-25T20:45:00+02:00'),
          rxBytes: 5_000_000,
          txBytes: 500_000,
        },
        {
          timestamp: Date.parse('2026-07-25T21:10:00+02:00'),
          rxBytes: 2_000_000,
          txBytes: 200_000,
        },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.hours_window === HOURLY_ROLLUP_WINDOW)).toBe(true);
    expect(rows[0].captured_at).toBe(hourBucketIso(Date.parse('2026-07-25T20:15:00+02:00')));
    expect(rows[0].total_rx_bytes).toBe(15_000_000);
    expect(rows[0].total_tx_bytes).toBe(1_500_000);
    expect(rows[0].avg_rx_bps).toBeCloseTo((15_000_000 * 8) / 3600);
    expect(rows[1].total_rx_bytes).toBe(2_000_000);
    expect(rows[0].raw_summary.flowSn).toBe('SN123');
  });
});
