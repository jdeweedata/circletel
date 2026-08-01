import {
  aggregateInterstellioDaily,
  aggregateRuijieHourly,
  CORE_SOURCE_LABEL,
  selectCorePrimarySource,
  shouldAttachSecondaryInterstellio,
} from '@/lib/usage-reports/core-traffic';

describe('selectCorePrimarySource', () => {
  it('prefers covered Ruijie data for a short period', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: true,
        ruijieLinked: true,
        ruijieCoversWindow: true,
        interstellioMapped: true,
      })
    ).toBe('ruijie_hourly');
  });

  it('falls back to Interstellio when short-period Ruijie data is absent', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: true,
        ruijieLinked: true,
        ruijieCoversWindow: false,
        interstellioMapped: true,
      })
    ).toBe('interstellio_daily');
  });

  it('does not use Ruijie coverage unless the site is linked', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: true,
        ruijieLinked: false,
        ruijieCoversWindow: true,
        interstellioMapped: true,
      })
    ).toBe('interstellio_daily');
  });

  it('uses Interstellio for a long period when mapped', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: false,
        ruijieLinked: true,
        ruijieCoversWindow: true,
        interstellioMapped: true,
      })
    ).toBe('interstellio_daily');
  });

  it('falls back to Ruijie for a long period when Interstellio is absent (MTN/TDX)', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: false,
        ruijieLinked: true,
        ruijieCoversWindow: true,
        interstellioMapped: false,
      })
    ).toBe('ruijie_hourly');
  });

  it('returns unavailable when long period has neither Interstellio nor Ruijie samples', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: false,
        ruijieLinked: true,
        ruijieCoversWindow: false,
        interstellioMapped: false,
      })
    ).toBe('unavailable');
  });
});

describe('shouldAttachSecondaryInterstellio', () => {
  it('allows a secondary only beside a short-period Ruijie primary', () => {
    expect(
      shouldAttachSecondaryInterstellio({
        isShortPeriod: true,
        primary: 'ruijie_hourly',
        interstellioMapped: true,
      })
    ).toBe(true);
  });

  it.each([
    [false, 'ruijie_hourly', true],
    [true, 'interstellio_daily', true],
    [true, 'ruijie_hourly', false],
  ] as const)(
    'rejects secondary for short=%s primary=%s mapped=%s',
    (isShortPeriod, primary, interstellioMapped) => {
      expect(
        shouldAttachSecondaryInterstellio({
          isShortPeriod,
          primary,
          interstellioMapped,
        })
      ).toBe(false);
    }
  );
});

describe('CORE_SOURCE_LABEL', () => {
  it('defines a display label for every core source', () => {
    expect(CORE_SOURCE_LABEL).toEqual({
      ruijie_hourly: 'Ruijie traffic rollups (hourly)',
      interstellio_daily: 'Interstellio subscriber usage (daily)',
      unavailable: 'Not available',
    });
  });
});

describe('aggregateRuijieHourly', () => {
  it('sums present rows and buckets downloads by SAST day', () => {
    const result = aggregateRuijieHourly(
      [
        {
          captured_at: '2026-07-01T21:30:00.000Z',
          total_rx_bytes: 1_000_000_000,
          total_tx_bytes: 100_000_000,
          avg_rx_bps: 8_000_000,
          peak_rx_bps: 20_000_000,
        },
        {
          captured_at: '2026-07-01T22:30:00.000Z',
          total_rx_bytes: 500_000_000,
          total_tx_bytes: 50_000_000,
          avg_rx_bps: 4_000_000,
          peak_rx_bps: 10_000_000,
        },
      ],
      2,
      new Date('2026-07-01T00:00:00+02:00')
    );

    expect(result).toEqual({
      downloadBytes: 1_500_000_000,
      uploadBytes: 150_000_000,
      avgDownKbps: 6_000,
      peakBucketBytes: 1_000_000_000,
      dailyDownloadBytes: [1_000_000_000, 500_000_000],
      dailyCovered: [true, true],
    });
  });

  it('fills missing days with zero without inventing totals', () => {
    const result = aggregateRuijieHourly(
      [
        {
          captured_at: '2026-07-03T08:00:00+02:00',
          total_rx_bytes: 25,
          total_tx_bytes: 5,
          avg_rx_bps: 1_000,
          peak_rx_bps: 2_000,
        },
      ],
      3,
      new Date('2026-07-01T00:00:00+02:00')
    );

    expect(result.downloadBytes).toBe(25);
    expect(result.dailyDownloadBytes).toEqual([0, 0, 25]);
    // Days 1-2 read zero because nothing was sampled, not because traffic was
    // zero — callers must be able to tell those apart (#689).
    expect(result.dailyCovered).toEqual([false, false, true]);
  });

  it('counts a zero-byte sample as covered — a quiet day is not a gap', () => {
    const result = aggregateRuijieHourly(
      [
        {
          captured_at: '2026-07-02T08:00:00+02:00',
          total_rx_bytes: 0,
          total_tx_bytes: 0,
          avg_rx_bps: 0,
          peak_rx_bps: 0,
        },
      ],
      3,
      new Date('2026-07-01T00:00:00+02:00')
    );

    expect(result.dailyDownloadBytes[1]).toBe(0);
    expect(result.dailyCovered).toEqual([false, true, false]);
  });

  it('returns a coverage entry for every day in the window', () => {
    const result = aggregateRuijieHourly(
      [
        {
          captured_at: '2026-07-01T08:00:00+02:00',
          total_rx_bytes: 5,
          total_tx_bytes: 1,
          avg_rx_bps: 10,
          peak_rx_bps: 20,
        },
      ],
      31,
      new Date('2026-07-01T00:00:00+02:00')
    );

    expect(result.dailyCovered).toHaveLength(31);
    expect(result.dailyCovered.filter(Boolean)).toHaveLength(1);
  });

  it('returns null rate and peak metrics for no rows', () => {
    expect(
      aggregateRuijieHourly([], 1, new Date('2026-07-01T00:00:00+02:00'))
    ).toEqual({
      downloadBytes: 0,
      uploadBytes: 0,
      avgDownKbps: null,
      peakBucketBytes: null,
      dailyDownloadBytes: [0],
      dailyCovered: [false],
    });
  });
});

describe('aggregateInterstellioDaily', () => {
  it('maps Interstellio KiB to bytes and keeps daily gaps at zero', () => {
    const result = aggregateInterstellioDaily(
      [
        {
          time: '2026-07-01T22:30:00.000Z',
          download_kb: 2_000,
          upload_kb: 500,
          combined_kb: 2_500,
          download_kbps: 800,
        },
        {
          time: '2026-07-03T12:00:00+02:00',
          download_kb: 1_000,
          upload_kb: 250,
          combined_kb: 1_250,
          download_kbps: 400,
        },
      ],
      3,
      new Date('2026-07-01T00:00:00+02:00')
    );

    expect(result).toEqual({
      downloadBytes: 3_072_000,
      uploadBytes: 768_000,
      avgDownKbps: 600,
      peakBucketBytes: 2_048_000,
      dailyDownloadBytes: [0, 2_048_000, 1_024_000],
      dailyCovered: [false, true, true],
    });
  });
});
