/**
 * Competitor Analysis Module
 *
 * Comprehensive competitor price tracking and market analysis system
 * for South African telecom providers.
 *
 * @module competitor-analysis
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Database entity types
  ProviderType,
  ScrapeFrequency,
  ProductType,
  Technology,
  MatchMethod,
  ScrapeStatus,
  TriggerType,
  CircleTelProductType,
  CompetitorProvider,
  ScrapeConfig,
  CompetitorProduct,
  CompetitorPriceHistory,
  ProductCompetitorMatch,
  CompetitorScrapeLog,

  // View types
  PriceComparisonResult,
  ProviderStats,

  // Firecrawl types
  FirecrawlScrapeOptions,
  FirecrawlExtractOptions,
  FirecrawlScrapeResponse,
  FirecrawlExtractResponse,
  FirecrawlMapResponse,

  // Scraper types
  RawScrapedProduct,
  NormalizedProduct,
  ScrapeJobResult,

  // API types
  DashboardStats,
  DashboardAlert,
  PricingOpportunity,
  CreateProviderRequest,
  UpdateProviderRequest,
  TriggerScrapeRequest,
  CreateMatchRequest,
  ProductsFilter,
  PriceHistoryFilter,

  // Matching types
  MatchCandidate,
  MarketPosition,

  // Utility types
  ApiError,
  PaginatedResponse,
} from './types';

// =============================================================================
// CLIENT EXPORTS
// =============================================================================

export {
  // Main Firecrawl client functions
  scrapeUrl,
  extractData,
  mapSite,
  batchScrape,

  // Credit tracking
  getSessionCreditsUsed,
  getCreditUsageBreakdown,
  getRecentCreditUsage,
  clearCreditUsageLog,

  // Extraction schemas
  MOBILE_DEALS_SCHEMA,
  FIBRE_PACKAGES_SCHEMA,
  DATA_ONLY_SCHEMA,

  // Default export
  FirecrawlClient,
  default as firecrawl,
} from './firecrawl-client';

// =============================================================================
// PROVIDER EXPORTS
// =============================================================================

export {
  // Base class
  BaseProvider,

  // Provider implementations
  MTNProvider,
  VodacomProvider,
  TelkomProvider,
  RainProvider,
  AfrihostProvider,

  // Registry
  ProviderRegistry,
  createProvider,
  isProviderSupported,
  getSupportedProviders,
} from './providers';

export type {
  ProviderScrapeContext,
  NormalizationConfig,
} from './providers';

// =============================================================================
// MATCHER SERVICE EXPORTS
// =============================================================================

export {
  findMatches,
  suggestAutoMatches,
  batchFindMatches,
  MatcherService,
} from './matcher-service';

export type {
  MatchCriteria,
  BatchMatchRequest,
  BatchMatchResult,
} from './matcher-service';

// =============================================================================
// ANALYSIS ENGINE EXPORTS
// =============================================================================

export {
  analyzeMarketPosition,
  analyzeFromComparisons,
  identifyPricingOpportunities,
  analyzePriceTrend,
  analyzeMarketSegments,
  analyzeCompetitiveLandscape,
  AnalysisEngine,
} from './analysis-engine';

export type {
  OpportunityAnalysis,
  ProductForAnalysis,
  PriceTrend,
  PriceHistoryPoint,
  MarketSegmentStats,
  CompetitiveLandscape,
} from './analysis-engine';

// =============================================================================
// PRICE CHANGE DETECTOR EXPORTS
// =============================================================================

export {
  detectPriceChanges,
  detectChangesFromScrape,
  summarizePriceChanges,
  PriceChangeDetector,
} from './price-change-detector';

export type {
  PriceChange,
  PriceChangeDetectionResult,
  DetectionConfig,
} from './price-change-detector';

// =============================================================================
// ALERT SERVICE EXPORTS
// =============================================================================

export {
  sendPriceDropAlerts,
  sendScrapeFailureAlert,
  sendScrapesSummary,
  storeAlerts,
  CompetitorAlertService,
} from './alert-service';

export type {
  AlertConfig,
  AlertResult,
} from './alert-service';
