import {
  clampTrafficHistoryHours,
  RUIJIE_TRAFFIC_HISTORY_HOURS,
} from '@/lib/ruijie/traffic-history';

describe('clampTrafficHistoryHours', () => {
  it('defaults to the full historic window', () => {
    expect(clampTrafficHistoryHours(undefined)).toBe(RUIJIE_TRAFFIC_HISTORY_HOURS);
    expect(clampTrafficHistoryHours(Number.NaN)).toBe(RUIJIE_TRAFFIC_HISTORY_HOURS);
  });

  it('clamps to 1..168', () => {
    expect(clampTrafficHistoryHours(0)).toBe(1);
    expect(clampTrafficHistoryHours(24)).toBe(24);
    expect(clampTrafficHistoryHours(500)).toBe(168);
  });
});
