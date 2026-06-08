/**
 * Product Rules Engine.
 *
 * Evaluates a UnifiedProduct against a set of composable rules and returns a
 * structured evaluation (results + summary + blocked/publishable flags). Pure
 * and dependency-free so it runs identically server-side (publish gating) and
 * client-side (console badges).
 */

import { BUILTIN_RULES } from './definitions';
import {
  DEFAULT_RULE_CONFIG,
  type ProductRule,
  type ProductRuleEvaluation,
  type RuleConfig,
  type RuleLevel,
  type RuleResult,
} from './types';
import type { UnifiedProduct } from '@/lib/types/unified-product';

const LEVEL_RANK: Record<RuleLevel, number> = { fail: 0, warning: 1, pass: 2 };

export class RulesEngine {
  private readonly rules: ProductRule[];
  private readonly baseConfig: RuleConfig;

  constructor(rules: ProductRule[] = BUILTIN_RULES, config: RuleConfig = DEFAULT_RULE_CONFIG) {
    this.rules = rules;
    this.baseConfig = config;
  }

  /** The rule definitions this engine evaluates (for the Rules Studio UI). */
  listRules(): ProductRule[] {
    return this.rules;
  }

  /** Evaluate one product. `configOverride` patches the base thresholds. */
  evaluateProduct(
    product: UnifiedProduct,
    configOverride?: Partial<RuleConfig>
  ): ProductRuleEvaluation {
    const config = { ...this.baseConfig, ...configOverride };

    const results = this.rules
      .map((rule) => rule.evaluate(product, config))
      .filter((r): r is RuleResult => r !== null)
      .sort((a, b) => {
        const byLevel = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
        if (byLevel !== 0) return byLevel;
        return priorityOf(this.rules, a.ruleId) - priorityOf(this.rules, b.ruleId);
      });

    const summary = { pass: 0, warning: 0, fail: 0 };
    for (const r of results) summary[r.level] += 1;

    return {
      uid: product.uid,
      results,
      summary,
      blocked: summary.fail > 0,
      publishable: summary.fail === 0,
    };
  }

  /** Evaluate many products. */
  evaluateMany(
    products: UnifiedProduct[],
    configOverride?: Partial<RuleConfig>
  ): ProductRuleEvaluation[] {
    return products.map((p) => this.evaluateProduct(p, configOverride));
  }

  /**
   * Evaluate a single rule against a product (used by the Rules Studio
   * "simulate" feature). Returns null when the rule does not apply.
   */
  simulateRule(
    ruleId: string,
    product: UnifiedProduct,
    configOverride?: Partial<RuleConfig>
  ): RuleResult | null {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) return null;
    return rule.evaluate(product, { ...this.baseConfig, ...configOverride });
  }
}

function priorityOf(rules: ProductRule[], ruleId: string): number {
  return rules.find((r) => r.id === ruleId)?.priority ?? 99;
}

/** Shared singleton with the default rule set and thresholds. */
export const rulesEngine = new RulesEngine();
