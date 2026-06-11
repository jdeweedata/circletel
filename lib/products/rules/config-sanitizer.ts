/**
 * Rules Config Sanitizer
 *
 * Validates and cleans Rules Studio configuration before storage or use.
 * Ensures only known RuleConfig keys are present with sane values (0–100 for percentages).
 */

import type { RuleConfig } from '@/lib/products/rules';

const NUMERIC_KEYS = ['marginFloorPct', 'bundleMarginFloorPct', 'mtnDefaultMarkupFloorPct'] as const;

/**
 * Sanitize unknown input into a valid RuleConfig partial.
 * Drops unknown keys, out-of-range and non-numeric values.
 * Returns an empty object for null/garbage input.
 */
export function sanitizeRuleConfig(input: unknown): Partial<RuleConfig> {
  if (typeof input !== 'object' || input === null) return {};
  const out: Partial<RuleConfig> = {};
  for (const key of NUMERIC_KEYS) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100) {
      out[key] = v;
    }
  }
  return out;
}
