import {
  aggregateSsidActivity,
  buildHourlyRollupUpserts,
  computeGroupTrafficCards,
  computeRadioUtilSummary,
  filterRollupsForScope,
  hourBucketIso,
  HOURLY_ROLLUP_WINDOW,
  MAX_ANALYTICS_CUSTOM_DAYS,
  MAX_ANALYTICS_HOURS,
  parseAnalyticsCustomRange,
  parseAnalyticsHours,
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

  it('keys every row to the device the flow came from', () => {
    // device_sn is a real column now, not just raw_summary trivia — it is what
    // lets one site be attributed its own AP instead of the group's (#702).
    const rows = buildHourlyRollupUpserts({
      groupId: '9058218',
      groupName: 'Unjani',
      flowSn: 'G1U52HL00261B',
      dataPoints: [
        {
          timestamp: Date.parse('2026-07-25T20:15:00+02:00'),
          rxBytes: 1_000,
          txBytes: 100,
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].device_sn).toBe('G1U52HL00261B');
  });

  it('produces independent rows for two devices in the same group and hour', () => {
    const at = Date.parse('2026-07-25T20:15:00+02:00');
    const [first] = buildHourlyRollupUpserts({
      groupId: '9058218',
      groupName: 'Unjani',
      flowSn: 'SN-A',
      dataPoints: [{ timestamp: at, rxBytes: 1_000, txBytes: 100 }],
    });
    const [second] = buildHourlyRollupUpserts({
      groupId: '9058218',
      groupName: 'Unjani',
      flowSn: 'SN-B',
      dataPoints: [{ timestamp: at, rxBytes: 5_000, txBytes: 500 }],
    });

    // Same group, same hour, different device — previously impossible, because
    // the unique key was (group_id, captured_at, hours_window).
    expect(first.captured_at).toBe(second.captured_at);
    expect(first.group_id).toBe(second.group_id);
    expect(first.device_sn).not.toBe(second.device_sn);
    expect(first.total_rx_bytes).toBe(1_000);
    expect(second.total_rx_bytes).toBe(5_000);
  });
});

describe('parseAnalyticsHours', () => {
  it('allows a 30-day (720h) window and clamps above that', () => {
    expect(MAX_ANALYTICS_HOURS).toBe(720);
    expect(parseAnalyticsHours('720')).toBe(720);
    expect(parseAnalyticsHours('168')).toBe(168);
    expect(parseAnalyticsHours('721')).toBe(720);
    expect(parseAnalyticsHours(null)).toBe(24);
    expect(parseAnalyticsHours('0')).toBe(24);
    expect(parseAnalyticsHours('abc')).toBe(24);
  });
});

describe('parseAnalyticsCustomRange', () => {
  it('parses an inclusive SAST range with UTC bounds', () => {
    expect(MAX_ANALYTICS_CUSTOM_DAYS).toBe(90);
    const range = parseAnalyticsCustomRange('2026-07-26', '2026-08-02');
    expect(range).not.toBeNull();
    expect(range!.startDate).toBe('2026-07-26');
    expect(range!.endDate).toBe('2026-08-02');
    expect(range!.inclusiveDayCount).toBe(8);
    expect(range!.startUtc.toISOString()).toBe('2026-07-25T22:00:00.000Z');
    expect(range!.endUtc.toISOString()).toBe('2026-08-02T21:59:59.999Z');
  });

  it('rejects invalid, reversed, or over-long ranges', () => {
    expect(parseAnalyticsCustomRange(null, '2026-08-02')).toBeNull();
    expect(parseAnalyticsCustomRange('2026-08-02', '2026-07-26')).toBeNull();
    expect(parseAnalyticsCustomRange('not-a-date', '2026-08-02')).toBeNull();
    // 91 inclusive days (1 Jul → 30 Sep)
    expect(parseAnalyticsCustomRange('2026-07-01', '2026-09-29')).toBeNull();
  });
});

describe('filterRollupsForScope', () => {
  const rows = [
    { group_id: 'g1', device_sn: 'SN-A', captured_at: '2026-08-01T10:00:00Z', total_rx_bytes: 100 },
    { group_id: 'g1', device_sn: 'SN-B', captured_at: '2026-08-01T10:00:00Z', total_rx_bytes: 200 },
    { group_id: 'g2', device_sn: 'SN-C', captured_at: '2026-08-01T10:00:00Z', total_rx_bytes: 50 },
  ];

  it('keeps all devices in the group when deviceSn is omitted', () => {
    const filtered = filterRollupsForScope(rows, { groupId: 'g1' });
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.device_sn).sort()).toEqual(['SN-A', 'SN-B']);
  });

  it('keeps only the matching device when deviceSn is set', () => {
    const filtered = filterRollupsForScope(rows, { groupId: 'g1', deviceSn: 'SN-B' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].device_sn).toBe('SN-B');
    expect(filtered[0].total_rx_bytes).toBe(200);
  });
});
