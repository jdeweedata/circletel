/**
 * DeviceTrafficPanel — the one new device-page component with real interactive state
 * (fetch, loading/error paths, window switching). Drives the component for real rather
 * than re-testing the summary maths, which is covered in performance-metrics.test.ts.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DeviceTrafficPanel } from '@/components/admin/network/detail/DeviceTrafficPanel';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// recharts needs layout; the chart itself is not under test here.
jest.mock('@/components/admin/network/TrafficChart', () => ({
  TrafficChart: ({ dataPoints, title }: { dataPoints: unknown[]; title?: string }) =>
    React.createElement('div', null, `chart:${title}:${dataPoints.length}`),
}));

const SN = 'G1U52HL044467';

/** Shape of the /traffic response, trimmed to what the panel reads. */
function historyPayload(points = 2) {
  return {
    history: {
      totalRxBytes: 3_836_000_000,
      totalTxBytes: 181_000_000,
      totalBytes: 4_017_000_000,
      avgRxRate: 355_000,
      avgTxRate: 16_700,
      peakRxBytes: 179_426_406,
      peakTxBytes: 8_000_000,
      dataPoints: Array.from({ length: points }, (_, i) => ({
        timestamp: 1_785_012_000_000 + i * 600_000,
        timeString: `2026-07-25 22:${40 + i}:00`,
        rxBytes: 144_331,
        txBytes: 124_642,
      })),
    },
  };
}

function mockFetchOnce(impl: () => Promise<any>) {
  (globalThis as any).fetch = jest.fn(impl);
}

async function renderPanel() {
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<DeviceTrafficPanel sn={SN} />);
  });
  return tree;
}

const dump = (t: TestRenderer.ReactTestRenderer) => JSON.stringify(t.toJSON());

describe('DeviceTrafficPanel', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests a 24h window for this device on mount', async () => {
    mockFetchOnce(async () => ({ ok: true, json: async () => historyPayload() }));
    await renderPanel();

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      `/api/ruijie/devices/${SN}/traffic?hours=24`,
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('renders totals and the chart once history arrives', async () => {
    mockFetchOnce(async () => ({ ok: true, json: async () => historyPayload(144) }));
    const out = dump(await renderPanel());

    expect(out).toContain('3.6 GB'); // downloaded
    expect(out).toContain('355.0 Kbps'); // avg rate — the corrected 10-min-bucket maths
    expect(out).toContain('chart:Device Traffic — last 24h:144');
    expect(out).not.toContain('Loading traffic history');
  });

  it('shows an error and no chart data when the request fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchOnce(async () => ({ ok: false, status: 502, json: async () => ({}) }));
    const out = dump(await renderPanel());

    expect(out).toContain('Could not load traffic history');
    expect(out).toContain('chart:Device Traffic — last 24h:0');
  });

  it('surfaces a network rejection rather than throwing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchOnce(async () => {
      throw new Error('ECONNREFUSED');
    });
    const out = dump(await renderPanel());

    expect(out).toContain('Could not load traffic history');
  });

  it('ignores a superseded response when the window changes mid-flight', async () => {
    // The 24h request never settles until we say so; 7d resolves immediately.
    let settleStale!: (v: unknown) => void;
    const stale = new Promise((resolve) => {
      settleStale = resolve;
    });
    (globalThis as any).fetch = jest.fn((url: string) =>
      url.includes('hours=24')
        ? stale
        : Promise.resolve({ ok: true, json: async () => historyPayload(7) })
    );

    const tree = await renderPanel();
    const sevenDay = tree.root.findAllByType('button').find((b) => b.props.children === '7d');
    await act(async () => {
      sevenDay!.props.onClick();
    });

    // The stale 24h request lands last, carrying a distinctly different payload.
    await act(async () => {
      settleStale({ ok: true, json: async () => historyPayload(99) });
      await Promise.resolve();
    });

    const out = dump(tree);
    expect(out).toContain('chart:Device Traffic — last 168h:7'); // the window actually selected
    expect(out).not.toContain(':99'); // the superseded response must not win
  });

  it('refetches with the new window when a range button is pressed', async () => {
    mockFetchOnce(async () => ({ ok: true, json: async () => historyPayload() }));
    const tree = await renderPanel();

    const sevenDay = tree.root
      .findAllByType('button')
      .find((b) => b.props.children === '7d');
    expect(sevenDay).toBeDefined();

    await act(async () => {
      sevenDay!.props.onClick();
    });

    expect((globalThis as any).fetch).toHaveBeenLastCalledWith(
      `/api/ruijie/devices/${SN}/traffic?hours=168`,
      expect.objectContaining({ credentials: 'include' })
    );
    expect(sevenDay!.props['aria-pressed']).toBe(true);
  });
});
