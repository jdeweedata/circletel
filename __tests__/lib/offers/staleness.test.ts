import { describe, it, expect } from '@jest/globals';
import { isSnapshotStale } from '@/lib/offers/staleness';

describe('isSnapshotStale', () => {
  it('is stale when the source changed after the snapshot', () => {
    expect(isSnapshotStale('2026-06-01T00:00:00Z', '2026-06-02T00:00:00Z')).toBe(true);
  });
  it('is fresh when the snapshot is newer than the source', () => {
    expect(isSnapshotStale('2026-06-03T00:00:00Z', '2026-06-02T00:00:00Z')).toBe(false);
  });
  it('is fresh when timestamps are equal', () => {
    expect(isSnapshotStale('2026-06-02T00:00:00Z', '2026-06-02T00:00:00Z')).toBe(false);
  });
  it('is never stale when source updated_at is null', () => {
    expect(isSnapshotStale('2026-06-02T00:00:00Z', null)).toBe(false);
  });
});
