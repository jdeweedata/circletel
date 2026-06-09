/**
 * Product Rules Engine — public surface.
 *
 * Usage:
 *   import { rulesEngine } from '@/lib/products/rules';
 *   const evaluation = rulesEngine.evaluateProduct(unifiedProduct);
 */

export * from './types';
export { BUILTIN_RULES } from './definitions';
export { RulesEngine, rulesEngine } from './engine';
