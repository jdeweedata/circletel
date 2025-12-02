/**
 * PM Agent Capabilities
 *
 * Exports all capabilities available to the PM Agent.
 *
 * @module lib/agents/pm/capabilities
 */

// Product Analysis Capability
export {
  ProductGapAnalyzer,
  analyzeProductGap,
} from './product-analysis'

export type {
  ProductDomain,
  ImpactScore,
  EffortScore,
  FeatureCategory,
  ProductGapInput,
  ProductGapOutput,
  SuggestedFeature,
  RelevantSection,
} from './product-analysis'
