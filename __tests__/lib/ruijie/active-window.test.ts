import {
  filterActiveDevices,
  isDeviceActiveInWindow,
} from '@/lib/ruijie/active-window';

const NOW = Date.parse('2026-07-25T18:00:00.000Z');

describe('isDeviceActiveInWindow', () => {
  it('keeps currently online devices even without last_seen', () => {
    expect(
      isDeviceActiveInWindow({ sn: 'a', status: 'online', last_seen_at: null }, NOW)
    ).toBe(true);
  });

  it('keeps offline devices seen within 14 days', () => {
    expect(
      isDeviceActiveInWindow(
        {
          sn: 'b',
          status: 'offline',
          last_seen_at: '2026-07-20T12:00:00.000Z',
        },
        NOW
      )
    ).toBe(true);
  });

  it('drops offline devices older than 14 days', () => {
    expect(
      isDeviceActiveInWindow(
        {
          sn: 'c',
          status: 'offline',
          last_seen_at: '2026-07-01T12:00:00.000Z',
        },
        NOW
      )
    ).toBe(false);
  });

  it('drops offline devices with no last_seen', () => {
    expect(
      isDeviceActiveInWindow({ sn: 'd', status: 'offline', last_seen_at: null }, NOW)
    ).toBe(false);
  });
});

describe('filterActiveDevices', () => {
  it('filters the fleet to the active window', () => {
    const devices = [
      { sn: 'on', status: 'online', last_seen_at: null },
      { sn: 'recent', status: 'offline', last_seen_at: '2026-07-15T00:00:00.000Z' },
      { sn: 'stale', status: 'offline', last_seen_at: '2026-06-01T00:00:00.000Z' },
    ];
    expect(filterActiveDevices(devices, NOW).map((d) => d.sn)).toEqual([
      'on',
      'recent',
    ]);
  });
});
