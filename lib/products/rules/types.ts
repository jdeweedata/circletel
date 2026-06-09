/**
 * Product Rules Engine — types.
 *
 * A composable governance layer over the UnifiedProduct read model. Each rule
 * is a pure function `(product, config) => RuleResult | null`. Rules return
 * `null` when they do not apply to a given product, so the engine only reports
 * relevant results.
 *
 * Thresholds default to the values in `.claude/rules/margin-guardrails.md`
 * (25% minimum margin, 30% bundle margin) and can be overridden per call.
 */

import type { UnifiedProduct, UnifiedProductSource } from '@/lib/types/unified-product';

export type RuleLevel = 'pass' | 'warning' | 'fail';

export type RuleGroup = 'Pricing' | 'Eligibility' | 'Publishing' | 'Governance' | 'Approval';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  group: RuleGroup;
  level: RuleLevel;
  message: string;
}

export interface RuleConfig {
  /** Minimum contribution margin %, default 25 (margin-guardrails.md). */
  marginFloorPct: number;
  /** Minimum combined margin % for bundles, default 30. */
  bundleMarginFloorPct: number;
  /**
   * Fallback minimum MARKUP % for MTN/Arlan deals with no business_use_case.
   * MTN/Arlan use a markup model (not the connectivity margin floor); per-use-case
   * floors come from MARKUP_RULES (8–20%). Default 8 (lowest, "device_upgrade").
   */
  mtnDefaultMarkupFloorPct: number;
  /** Sources whose products require a FICA checklist before quoting. */
  ficaRequiredSources: UnifiedProductSource[];
}

export interface ProductRule {
  id: string;
  name: string;
  description: string;
  group: RuleGroup;
  /** 1 = highest. Used for ordering results (fail-first within priority). */
  priority: number;
  /** Human-readable scope, e.g. "All priced products". */
  appliesTo: string;
  /** Return null when the rule does not apply to this product. */
  evaluate(product: UnifiedProduct, config: RuleConfig): RuleResult | null;
}

export interface ProductRuleEvaluation {
  uid: string;
  results: RuleResult[];
  summary: { pass: number; warning: number; fail: number };
  /** True when any rule failed. */
  blocked: boolean;
  /** True when no rule failed (warnings are allowed). */
  publishable: boolean;
}

/** Default thresholds — see `.claude/rules/margin-guardrails.md`. */
export const DEFAULT_RULE_CONFIG: RuleConfig = {
  marginFloorPct: 25,
  bundleMarginFloorPct: 30,
  mtnDefaultMarkupFloorPct: 8,
  ficaRequiredSources: ['MTN / Arlan'],
};
