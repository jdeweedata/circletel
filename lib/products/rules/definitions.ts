/**
 * Built-in product rules.
 *
 * Each rule operates on a UnifiedProduct and returns a RuleResult, or null when
 * it does not apply. Rules are intentionally small and pure so they can run both
 * server-side (publish gating) and client-side (console badges).
 */

import type { ProductRule, RuleResult } from './types';
import type { UnifiedProduct } from '@/lib/types/unified-product';

function result(
  rule: Pick<ProductRule, 'id' | 'name' | 'group'>,
  level: RuleResult['level'],
  message: string
): RuleResult {
  return { ruleId: rule.id, ruleName: rule.name, group: rule.group, level, message };
}

/** CircleTel naming convention: `[Descriptor]Connect` or an approved brand. */
const APPROVED_BRAND_PREFIXES = [
  'SkyFibre',
  'AirLink',
  'UmojaLink',
  'CloudWiFi',
  'CircleConnect',
  'CircleCloud',
  'ParkConnect',
  'BizFibreConnect',
  'HomeFibreConnect',
  'WorkConnect',
  'ClinicConnect',
];

// ---------------------------------------------------------------------------
// 1. Margin floor (Pricing)
// ---------------------------------------------------------------------------
const marginFloorRule: ProductRule = {
  id: 'margin-floor',
  name: 'Minimum product margin',
  description: 'Every priced product must meet the configured contribution-margin floor.',
  group: 'Pricing',
  priority: 1,
  appliesTo: 'All products with a retail price',
  evaluate(product, config) {
    if (product.price <= 0) return null; // not priced — not applicable
    if (product.cost <= 0) {
      return result(this, 'warning', 'Cost of sale not set — margin cannot be verified.');
    }
    const floor = config.marginFloorPct;
    return product.margin >= floor
      ? result(this, 'pass', `Margin ${product.margin}% meets the ${floor}% floor.`)
      : result(this, 'fail', `Margin ${product.margin}% is below the ${floor}% floor.`);
  },
};

// ---------------------------------------------------------------------------
// 2. Bundle margin (Pricing)
// ---------------------------------------------------------------------------
const bundleMarginRule: ProductRule = {
  id: 'bundle-margin',
  name: 'Bundle margin guardrail',
  description: 'Bundles must exceed the higher bundle-margin floor (default 30%).',
  group: 'Pricing',
  priority: 2,
  appliesTo: 'Products of type "Bundle"',
  evaluate(product, config) {
    if (product.type !== 'Bundle') return null;
    if (product.price <= 0 || product.cost <= 0) {
      return result(this, 'warning', 'Bundle cost/price incomplete — margin cannot be verified.');
    }
    const floor = config.bundleMarginFloorPct;
    return product.margin >= floor
      ? result(this, 'pass', `Bundle margin ${product.margin}% meets the ${floor}% rule.`)
      : result(this, 'fail', `Bundle margin ${product.margin}% is below the ${floor}% rule.`);
  },
};

// ---------------------------------------------------------------------------
// 3. Naming convention (Governance)
// ---------------------------------------------------------------------------
const namingRule: ProductRule = {
  id: 'naming-convention',
  name: 'CircleTel naming convention',
  description: 'CircleTel products should follow the [Descriptor]Connect pattern or an approved brand name.',
  group: 'Governance',
  priority: 3,
  appliesTo: 'CircleTel-sourced products',
  evaluate(product) {
    if (product.source !== 'CircleTel') return null; // vendor names are out of scope
    const name = product.name?.trim() ?? '';
    if (!name) return result(this, 'fail', 'Product has no name.');
    const matchesConnect = /connect\b/i.test(name);
    const matchesBrand = APPROVED_BRAND_PREFIXES.some((b) => name.toLowerCase().startsWith(b.toLowerCase()));
    return matchesConnect || matchesBrand
      ? result(this, 'pass', 'Name follows an approved CircleTel pattern.')
      : result(this, 'warning', 'Name does not match the [Descriptor]Connect pattern or an approved brand.');
  },
};

// ---------------------------------------------------------------------------
// 4. Content ready (Publishing)
// ---------------------------------------------------------------------------
const contentReadyRule: ProductRule = {
  id: 'content-ready',
  name: 'Content ready for publish',
  description: 'A product needs a name and a non-trivial description before it can be published.',
  group: 'Publishing',
  priority: 2,
  appliesTo: 'All products',
  evaluate(product) {
    const hasName = Boolean(product.name?.trim());
    const desc = product.description?.trim() ?? '';
    if (hasName && desc.length >= 20) {
      return result(this, 'pass', 'Name and description are present.');
    }
    const missing: string[] = [];
    if (!hasName) missing.push('name');
    if (desc.length < 20) missing.push('description');
    return result(this, 'warning', `Content incomplete — missing or too short: ${missing.join(', ')}.`);
  },
};

// ---------------------------------------------------------------------------
// 5. MTN end-of-life publish block (Publishing)
// ---------------------------------------------------------------------------
const mtnEolRule: ProductRule = {
  id: 'mtn-eol-block',
  name: 'MTN end-of-life publish block',
  description: 'MTN/Arlan deals on EOL devices or in an archived state must not be published.',
  group: 'Publishing',
  priority: 1,
  appliesTo: 'MTN / Arlan deals',
  evaluate(product) {
    if (product.source !== 'MTN / Arlan') return null;
    const deviceStatus = String((product.raw as { device_status?: unknown }).device_status ?? '');
    const isEol = deviceStatus.toUpperCase() === 'EOL' || product.status === 'archived';
    if (!isEol) return result(this, 'pass', 'Deal is not end-of-life.');
    return product.isPublished
      ? result(this, 'fail', 'End-of-life deal is currently published — unpublish it.')
      : result(this, 'warning', 'Deal is end-of-life — do not publish.');
  },
};

// ---------------------------------------------------------------------------
// 6. FICA required (Approval)
// ---------------------------------------------------------------------------
const ficaRule: ProductRule = {
  id: 'fica-required',
  name: 'FICA required at quote',
  description: 'MTN/Arlan orders require a completed FICA checklist before a quote can be issued.',
  group: 'Approval',
  priority: 3,
  appliesTo: 'MTN / Arlan deals',
  evaluate(product, config) {
    if (!config.ficaRequiredSources.includes(product.source)) return null;
    return result(this, 'warning', 'FICA checklist must be completed at the quote stage.');
  },
};

// ---------------------------------------------------------------------------
// 7. 5G CPE data-plan eligibility (Eligibility)
// ---------------------------------------------------------------------------
const cpeDataPlanRule: ProductRule = {
  id: 'cpe-data-plan',
  name: '5G CPE needs a data plan',
  description: 'A 5G CPE/router deal should carry a data bundle so it is sellable as connectivity.',
  group: 'Eligibility',
  priority: 2,
  appliesTo: 'MTN / Arlan 5G CPE/router deals',
  evaluate(product) {
    if (product.source !== 'MTN / Arlan') return null;
    const tech = (product.technology ?? '').toUpperCase();
    if (!tech.includes('5G')) return null;
    const device = String((product.raw as { device_name?: unknown }).device_name ?? '').toLowerCase();
    const isCpe = /cpe|router|modem|tozed|mifi/.test(device);
    if (!isCpe) return null;
    const dataGb = Number((product.raw as { data_bundle_gb?: unknown }).data_bundle_gb ?? 0);
    const dataLabel = String((product.raw as { data_bundle?: unknown }).data_bundle ?? '').trim();
    const hasData = dataGb > 0 || (dataLabel.length > 0 && !/^0(\.0+)?\s*gb$/i.test(dataLabel));
    return hasData
      ? result(this, 'pass', '5G CPE has a data bundle attached.')
      : result(this, 'fail', '5G CPE has no data bundle — not sellable as connectivity.');
  },
};

/** All built-in rules, in evaluation order. */
export const BUILTIN_RULES: ProductRule[] = [
  marginFloorRule,
  bundleMarginRule,
  mtnEolRule,
  cpeDataPlanRule,
  contentReadyRule,
  namingRule,
  ficaRule,
];
