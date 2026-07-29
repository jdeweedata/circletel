/**
 * DeviceSystemHealth — renders the current_performance fields the fleet sync discards.
 * Values below are the live payload from G1U52HL044467 (RAP2200(F)).
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DeviceSystemHealth, formatUptime } from '@/components/admin/network/detail/DeviceSystemHealth';

// react-test-renderer needs the act environment to flush; the repo's jest env is node (no jsdom).
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const LIVE_SYSTEM = {
  cpu_usage: 6,
  memory_usage: 48,
  cpu_temp: null,
  memory_free_kb: 14144,
  flash_rate: 42,
  flash_free_kb: 408,
  disk_rate: 0,
  disk_free_kb: 0,
  process_num: 92,
  user_count: 3,
};

/** Render the card and return its serialised tree for substring assertions. */
function render(element: React.ReactElement): string {
  let tree: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    tree = TestRenderer.create(element);
  });
  return JSON.stringify(tree!.toJSON());
}

describe('DeviceSystemHealth', () => {
  it('renders memory and flash headroom from the live payload', () => {
    const out = render(<DeviceSystemHealth system={LIVE_SYSTEM} uptimeSeconds={134594} />);
    expect(out).toContain('48%');
    expect(out).toContain('13.8 MB'); // 14144 KB free
    expect(out).toContain('42%');
    expect(out).toContain('408 KB');
    expect(out).toContain('92'); // processes
    expect(out).toContain('1d 13h'); // derived uptime
  });

  it('hides the disk row on APs, which report 0/0', () => {
    const out = render(<DeviceSystemHealth system={LIVE_SYSTEM} uptimeSeconds={1} />);
    expect(out).not.toContain('Disk');
  });

  it('falls back to the device client count when there is no temperature sensor', () => {
    const out = render(<DeviceSystemHealth system={LIVE_SYSTEM} uptimeSeconds={1} />);
    expect(out).toContain('Clients (device)');
    expect(out).not.toContain('CPU Temp');
  });

  it('shows temperature when the model actually reports one', () => {
    const out = render(
      <DeviceSystemHealth system={{ ...LIVE_SYSTEM, cpu_temp: 41.5 }} uptimeSeconds={1} />
    );
    expect(out).toContain('CPU Temp');
    expect(out).toContain('41.5 °C');
  });

  it('degrades to dashes for an offline device rather than throwing', () => {
    const out = render(<DeviceSystemHealth system={null} uptimeSeconds={null} />);
    expect(out).toContain('—');
  });
});

describe('formatUptime', () => {
  it('formats days, hours and minutes', () => {
    expect(formatUptime(134594)).toBe('1d 13h');
    expect(formatUptime(7260)).toBe('2h 1m');
    expect(formatUptime(300)).toBe('5m');
  });

  it('shows a dash when uptime is unknown', () => {
    expect(formatUptime(null)).toBe('—');
    expect(formatUptime(0)).toBe('—');
  });
});
