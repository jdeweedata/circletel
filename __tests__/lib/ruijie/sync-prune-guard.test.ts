import { shouldSkipDevicePrune } from '@/lib/ruijie/sync-service';

describe('shouldSkipDevicePrune', () => {
  it('skips when keep set is empty (would wipe fleet)', () => {
    expect(shouldSkipDevicePrune({ keepCount: 0, failedGroupIds: [] })).toEqual({
      skip: true,
      reason: 'empty_keep_set',
    });
  });

  it('skips when any Ruijie group fetch failed', () => {
    expect(
      shouldSkipDevicePrune({ keepCount: 12, failedGroupIds: [9058218] })
    ).toEqual({
      skip: true,
      reason: 'partial_group_fetch_failure',
    });
  });

  it('allows prune when keep set is non-empty and all groups succeeded', () => {
    expect(shouldSkipDevicePrune({ keepCount: 12, failedGroupIds: [] })).toEqual({
      skip: false,
    });
  });
});
