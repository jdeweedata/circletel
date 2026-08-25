import {
  computeSsidHourDeltas,
  positiveCounterDelta,
  sampleStateKey,
} from '@/lib/ruijie/ssid-sta-rollup';

describe('positiveCounterDelta', () => {
  it('returns 0 when previous is missing (baseline)', () => {
    expect(positiveCounterDelta(1000, undefined)).toBe(0);
  });

  it('credits increase', () => {
    expect(positiveCounterDelta(1500, 1000)).toBe(500);
  });

  it('credits current on session reset (decrease)', () => {
    expect(positiveCounterDelta(200, 1000)).toBe(200);
  });

  it('returns 0 for invalid current', () => {
    expect(positiveCounterDelta(Number.NaN, 10)).toBe(0);
    expect(positiveCounterDelta(-1, 10)).toBe(0);
  });
});

describe('computeSsidHourDeltas', () => {
  const sampledAtMs = Date.parse('2026-08-01T14:37:00.000Z');
  const hour = '2026-08-01T14:00:00.000Z';

  it('baselines Staff and Free WiFi with no credit; skips incomplete and unknown SSIDs', () => {
    const result = computeSsidHourDeltas({
      samples: [
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:01',
          ssid: 'Unjani Clinic Free WiFi',
          wifiUp: 999,
          wifiDown: 999,
        },
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:02',
          ssid: 'Unjani Clinic Staff',
          wifiUp: 1000,
          wifiDown: 2000,
        },
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:04',
          ssid: 'Guest-Unknown',
          wifiUp: 50,
          wifiDown: 50,
        },
        { sn: '', mac: 'aa', ssid: 'Unjani Clinic Staff', wifiUp: 1, wifiDown: 1 },
      ],
      previous: new Map(),
      sampledAtMs,
    });

    expect(result.hourDeltas).toEqual([]);
    expect(result.clientHourDeltas).toEqual([]);
    expect(result.skippedNonAllowlisted).toBe(1);
    expect(result.skippedIncomplete).toBe(1);
    expect(result.nextState).toEqual([
      {
        device_sn: 'AP1',
        mac: 'aa:bb:cc:dd:ee:01',
        ssid: 'Unjani Clinic Free WiFi',
        last_wifi_up: 999,
        last_wifi_down: 999,
      },
      {
        device_sn: 'AP1',
        mac: 'aa:bb:cc:dd:ee:02',
        ssid: 'Unjani Clinic Staff',
        last_wifi_up: 1000,
        last_wifi_down: 2000,
      },
    ]);
  });

  it('sums Free WiFi deltas into the UTC hour bucket', () => {
    const prevKey = sampleStateKey(
      'AP1',
      'aa:bb:cc:dd:ee:01',
      'Unjani Clinic Free WiFi'
    );
    const previous = new Map([
      [
        prevKey,
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:01',
          ssid: 'Unjani Clinic Free WiFi',
          last_wifi_up: 500,
          last_wifi_down: 800,
        },
      ],
    ]);

    const result = computeSsidHourDeltas({
      samples: [
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:01',
          ssid: 'Unjani Clinic Free WiFi',
          wifiUp: 700,
          wifiDown: 1100,
        },
      ],
      previous,
      sampledAtMs,
    });

    expect(result.hourDeltas).toEqual([
      {
        device_sn: 'AP1',
        ssid: 'Unjani Clinic Free WiFi',
        hour_bucket: hour,
        rx_bytes: 300,
        tx_bytes: 200,
      },
    ]);
    expect(result.clientHourDeltas).toEqual([
      {
        device_sn: 'AP1',
        mac: 'aa:bb:cc:dd:ee:01',
        ssid: 'Unjani Clinic Free WiFi',
        hour_bucket: hour,
        rx_bytes: 300,
        tx_bytes: 200,
        hostname: null,
        manufacture: null,
        band: null,
      },
    ]);
  });

  it('sums Staff deltas into the UTC hour bucket', () => {
    const prevKey = sampleStateKey('AP1', 'aa:bb:cc:dd:ee:02', 'Unjani Clinic Staff');
    const previous = new Map([
      [
        prevKey,
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:02',
          ssid: 'Unjani Clinic Staff',
          last_wifi_up: 1000,
          last_wifi_down: 2000,
        },
      ],
    ]);

    const result = computeSsidHourDeltas({
      samples: [
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:02',
          ssid: 'Unjani Clinic Staff',
          wifiUp: 1500,
          wifiDown: 2600,
        },
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:03',
          ssid: 'Unjani Clinic Staff',
          wifiUp: 100,
          wifiDown: 50,
        },
      ],
      previous,
      sampledAtMs,
    });

    expect(result.hourDeltas).toEqual([
      {
        device_sn: 'AP1',
        ssid: 'Unjani Clinic Staff',
        hour_bucket: hour,
        rx_bytes: 600,
        tx_bytes: 500,
      },
    ]);
    // Only the STA with a previous checkpoint contributes bytes; new MAC is baseline.
    expect(result.clientHourDeltas).toEqual([
      {
        device_sn: 'AP1',
        mac: 'aa:bb:cc:dd:ee:02',
        ssid: 'Unjani Clinic Staff',
        hour_bucket: hour,
        rx_bytes: 600,
        tx_bytes: 500,
        hostname: null,
        manufacture: null,
        band: null,
      },
    ]);
    expect(result.nextState).toHaveLength(2);
  });

  it('keeps per-MAC rows separate when two clients share an AP+SSID hour', () => {
    const previous = new Map([
      [
        sampleStateKey('AP1', 'aa:bb:cc:dd:ee:01', 'Unjani Clinic Staff'),
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:01',
          ssid: 'Unjani Clinic Staff',
          last_wifi_up: 100,
          last_wifi_down: 200,
        },
      ],
      [
        sampleStateKey('AP1', 'aa:bb:cc:dd:ee:02', 'Unjani Clinic Staff'),
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:02',
          ssid: 'Unjani Clinic Staff',
          last_wifi_up: 50,
          last_wifi_down: 80,
        },
      ],
    ]);

    const result = computeSsidHourDeltas({
      samples: [
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:01',
          ssid: 'Unjani Clinic Staff',
          wifiUp: 150,
          wifiDown: 300,
          hostname: 'nurse-tablet',
          manufacture: 'Apple',
          band: '5G',
        },
        {
          sn: 'AP1',
          mac: 'AA:BB:CC:DD:EE:02',
          ssid: 'Unjani Clinic Staff',
          wifiUp: 90,
          wifiDown: 100,
          hostname: 'reception-pc',
          manufacture: 'Dell',
          band: '2.4G',
        },
      ],
      previous,
      sampledAtMs,
    });

    expect(result.hourDeltas).toEqual([
      {
        device_sn: 'AP1',
        ssid: 'Unjani Clinic Staff',
        hour_bucket: hour,
        rx_bytes: 120,
        tx_bytes: 90,
      },
    ]);
    expect(result.clientHourDeltas).toEqual(
      expect.arrayContaining([
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:01',
          ssid: 'Unjani Clinic Staff',
          hour_bucket: hour,
          rx_bytes: 100,
          tx_bytes: 50,
          hostname: 'nurse-tablet',
          manufacture: 'Apple',
          band: '5G',
        },
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:02',
          ssid: 'Unjani Clinic Staff',
          hour_bucket: hour,
          rx_bytes: 20,
          tx_bytes: 40,
          hostname: 'reception-pc',
          manufacture: 'Dell',
          band: '2.4G',
        },
      ])
    );
    expect(result.clientHourDeltas).toHaveLength(2);
  });

  it('credits fresh cumulative after counter reset', () => {
    const prevKey = sampleStateKey('AP1', 'aa:bb:cc:dd:ee:02', 'Unjani Clinic Staff');
    const previous = new Map([
      [
        prevKey,
        {
          device_sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:02',
          ssid: 'Unjani Clinic Staff',
          last_wifi_up: 5000,
          last_wifi_down: 8000,
        },
      ],
    ]);

    const result = computeSsidHourDeltas({
      samples: [
        {
          sn: 'AP1',
          mac: 'aa:bb:cc:dd:ee:02',
          ssid: 'Unjani Clinic Staff',
          wifiUp: 120,
          wifiDown: 80,
        },
      ],
      previous,
      sampledAtMs,
    });

    expect(result.hourDeltas[0]).toMatchObject({
      rx_bytes: 80,
      tx_bytes: 120,
      hour_bucket: hour,
    });
  });
});
