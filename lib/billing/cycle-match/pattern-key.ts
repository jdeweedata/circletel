import type { LeakType } from './types';

export function buildPatternKey(input: {
  leakType: LeakType | null;
  packageName?: string | null;
}): string | null {
  if (!input.leakType) return null;
  return input.leakType;
}
