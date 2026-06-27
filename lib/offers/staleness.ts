export function isSnapshotStale(
  snapshotComputedAt: string,
  sourceUpdatedAt: string | null,
): boolean {
  if (!sourceUpdatedAt) return false;
  return new Date(sourceUpdatedAt).getTime() > new Date(snapshotComputedAt).getTime();
}
