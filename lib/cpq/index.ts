/**
 * CPQ (Configure, Price, Quote) System
 *
 * AI-powered quote configuration system for B2B sales
 */

// Types
export * from './types';

// Rule Engine
export {
  getDiscountLimits,
  checkEligibility,
  validatePricing,
  getApplicableRules,
  calculateFinalPrice,
  checkApprovalRequired,
  calculateSessionTotal,
  getAllDiscountLimits,
  getAllPricingRules,
} from './rule-engine';

// AI Service
export {
  parseNaturalLanguage,
  getPackageRecommendations,
  analyzePricing,
  createUsageRecord,
} from './ai-service';
export type { CPQAIRequestType, CPQAIUsageRecord } from './ai-service';

// AI Prompts (for customization if needed)
export {
  getNLParserSystemPrompt,
  getPackageRecommendationPrompt,
  getPricingAnalysisPrompt,
  CPQ_AI_ERROR_MESSAGES,
} from './ai-prompts';
export type {
  PackageRecommendationContext,
  PricingAnalysisContext,
} from './ai-prompts';

// Hooks (client-side)
export {
  useCPQSession,
  useAutoSave,
  useStepAutoSave,
  useCPQNavigation,
  CPQ_STEPS,
} from './hooks';
export type {
  CPQStepKey,
  CPQStepId,
  StepValidationResult,
  StepValidator,
} from './hooks';
