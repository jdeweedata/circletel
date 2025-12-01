/**
 * Competitor Analysis Module - Type Definitions
 *
 * Type definitions for competitor price tracking, product matching,
 * and market analysis features.
 */

// =============================================================================
// DATABASE ENTITY TYPES
// =============================================================================

export type ProviderType = 'mobile' | 'fibre' | 'both';
export type ScrapeFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
export type ProductType = 'mobile_contract' | 'fibre' | 'lte' | 'device' | 'data_only' | 'prepaid';
export type Technology = 'LTE' | '5G' | 'Fibre' | 'ADSL' | 'Wireless' | null;
export type MatchMethod = 'auto' | 'manual';
export type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TriggerType = 'manual' | 'scheduled';
export type CircleTelProductType = 'mtn_dealer' | 'fibre' | 'lte' | 'product' | 'service_package';

/**
 * Competitor provider entity from database
 */
export interface CompetitorProvider {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo_url: string | null;
  provider_type: ProviderType;
  scrape_urls: string[];
  scrape_config: ScrapeConfig;
  is_active: boolean;
  last_scraped_at: string | null;
  scrape_frequency: ScrapeFrequency;
  created_at: string;
  updated_at: string;
}

/**
 * Provider-specific scraping configuration
 */
export interface ScrapeConfig {
  /** Custom extraction schema override */
  extraction_schema?: Record<string, unknown>;
  /** Selectors for specific elements */
  selectors?: Record<string, string>;
  /** Wait time before scraping (ms) */
  wait_time?: number;
  /** Whether to use JavaScript rendering */
  render_js?: boolean;
  /** Custom headers to send */
  headers?: Record<string, string>;
  /** Price parsing options */
  price_format?: {
    currency: string;
    includes_vat: boolean;
    decimal_separator: string;
  };
}

/**
 * Scraped competitor product entity
 */
export interface CompetitorProduct {
  id: string;
  provider_id: string;
  external_id: string | null;
  product_name: string;
  product_type: ProductType | null;

  // Pricing
  monthly_price: number | null;
  once_off_price: number | null;
  price_includes_vat: boolean;

  // Product details
  contract_term: number | null;
  data_bundle: string | null;
  data_gb: number | null;
  speed_mbps: number | null;
  device_name: string | null;
  technology: Technology;

  // Metadata
  source_url: string | null;
  raw_data: Record<string, unknown> | null;
  scraped_at: string;
  is_current: boolean;

  created_at: string;
  updated_at: string;
}

/**
 * Historical price record
 */
export interface CompetitorPriceHistory {
  id: string;
  competitor_product_id: string;
  monthly_price: number | null;
  once_off_price: number | null;
  recorded_at: string;
}

/**
 * Product match between CircleTel and competitor
 */
export interface ProductCompetitorMatch {
  id: string;
  product_type: CircleTelProductType;
  product_id: string;
  competitor_product_id: string;
  match_confidence: number | null;
  match_method: MatchMethod | null;
  matched_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Scrape job log entry
 */
export interface CompetitorScrapeLog {
  id: string;
  provider_id: string;
  status: ScrapeStatus;
  products_found: number;
  products_updated: number;
  products_new: number;
  error_message: string | null;
  firecrawl_credits_used: number;
  started_at: string;
  completed_at: string | null;
  triggered_by: string | null;
  trigger_type: TriggerType;
}

// =============================================================================
// VIEW TYPES (Denormalized)
// =============================================================================

/**
 * Price comparison view result
 */
export interface PriceComparisonResult {
  match_id: string;
  product_type: CircleTelProductType;
  product_id: string;
  match_confidence: number | null;
  match_method: MatchMethod | null;
  competitor_product_id: string;
  provider_id: string;
  competitor_name: string;
  competitor_slug: string;
  competitor_logo: string | null;
  competitor_product: string;
  competitor_price: number | null;
  competitor_once_off: number | null;
  competitor_data: string | null;
  competitor_data_gb: number | null;
  competitor_term: number | null;
  competitor_technology: Technology;
  competitor_device: string | null;
  scraped_at: string;
  source_url: string | null;
}

/**
 * Provider statistics view result
 */
export interface ProviderStats {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo_url: string | null;
  provider_type: ProviderType;
  is_active: boolean;
  scrape_frequency: ScrapeFrequency;
  last_scraped_at: string | null;
  total_products: number;
  current_products: number;
  avg_monthly_price: number | null;
  min_monthly_price: number | null;
  max_monthly_price: number | null;
  matched_products: number;
}

// =============================================================================
// FIRECRAWL TYPES
// =============================================================================

/**
 * Firecrawl scrape options
 */
export interface FirecrawlScrapeOptions {
  /** Formats to return */
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  /** Only return main content */
  onlyMainContent?: boolean;
  /** Include tags to extract */
  includeTags?: string[];
  /** Exclude tags from extraction */
  excludeTags?: string[];
  /** Wait for specific selector before scraping */
  waitFor?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Headers to send with request */
  headers?: Record<string, string>;
}

/**
 * Firecrawl extract options with schema
 */
export interface FirecrawlExtractOptions {
  /** URLs to extract data from */
  urls: string[];
  /** JSON schema for structured extraction */
  schema: Record<string, unknown>;
  /** Prompt to guide extraction */
  prompt?: string;
  /** Enable web search for additional context */
  enableWebSearch?: boolean;
}

/**
 * Firecrawl scrape response
 */
export interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

/**
 * Firecrawl extract response
 */
export interface FirecrawlExtractResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Firecrawl map response (site discovery)
 */
export interface FirecrawlMapResponse {
  success: boolean;
  links?: string[];
  error?: string;
}

// =============================================================================
// SCRAPER TYPES
// =============================================================================

/**
 * Raw scraped product before normalization
 */
export interface RawScrapedProduct {
  external_id?: string;
  name: string;
  monthly_price?: string | number;
  once_off_price?: string | number;
  contract_term?: string | number;
  data_bundle?: string;
  speed?: string | number;
  device_name?: string;
  technology?: string;
  url?: string;
  raw?: Record<string, unknown>;
}

/**
 * Normalized product ready for database insertion
 */
export interface NormalizedProduct {
  external_id: string | null;
  product_name: string;
  product_type: ProductType | null;
  monthly_price: number | null;
  once_off_price: number | null;
  price_includes_vat: boolean;
  contract_term: number | null;
  data_bundle: string | null;
  data_gb: number | null;
  speed_mbps: number | null;
  device_name: string | null;
  technology: Technology;
  source_url: string | null;
  raw_data: Record<string, unknown> | null;
}

/**
 * Scrape job result
 */
export interface ScrapeJobResult {
  provider_id: string;
  provider_slug: string;
  status: ScrapeStatus;
  products_found: number;
  products_new: number;
  products_updated: number;
  products_unchanged: number;
  credits_used: number;
  duration_ms: number;
  errors: string[];
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Dashboard stats response
 */
export interface DashboardStats {
  total_providers: number;
  active_providers: number;
  total_products: number;
  current_products: number;
  total_matches: number;
  last_scrape_at: string | null;
  scrapes_last_7_days: number;
  price_changes_last_7_days: number;
  alerts: DashboardAlert[];
  opportunities: PricingOpportunity[];
}

/**
 * Dashboard alert
 */
export interface DashboardAlert {
  id: string;
  type: 'price_drop' | 'price_increase' | 'new_product' | 'scrape_failed';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  provider_slug?: string;
  product_id?: string;
  created_at: string;
}

/**
 * Pricing opportunity (where CircleTel can increase margin)
 */
export interface PricingOpportunity {
  product_type: CircleTelProductType;
  product_id: string;
  product_name: string;
  your_price: number;
  competitor_avg_price: number;
  price_gap: number;
  price_gap_percentage: number;
  competitors_higher: number;
  total_competitors: number;
}

/**
 * Create provider request
 */
export interface CreateProviderRequest {
  name: string;
  slug: string;
  website: string;
  logo_url?: string;
  provider_type: ProviderType;
  scrape_urls?: string[];
  scrape_config?: ScrapeConfig;
  is_active?: boolean;
  scrape_frequency?: ScrapeFrequency;
}

/**
 * Update provider request
 */
export interface UpdateProviderRequest {
  name?: string;
  website?: string;
  logo_url?: string;
  provider_type?: ProviderType;
  scrape_urls?: string[];
  scrape_config?: ScrapeConfig;
  is_active?: boolean;
  scrape_frequency?: ScrapeFrequency;
}

/**
 * Trigger scrape request
 */
export interface TriggerScrapeRequest {
  provider_id?: string;
  provider_slug?: string;
  all?: boolean;
}

/**
 * Create match request
 */
export interface CreateMatchRequest {
  product_type: CircleTelProductType;
  product_id: string;
  competitor_product_id: string;
  match_confidence?: number;
  notes?: string;
}

/**
 * Products filter options
 */
export interface ProductsFilter {
  provider_id?: string;
  provider_slug?: string;
  product_type?: ProductType;
  technology?: Technology;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_current?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Price history filter options
 */
export interface PriceHistoryFilter {
  product_id: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

// =============================================================================
// MATCHING TYPES
// =============================================================================

/**
 * Match candidate with confidence score
 */
export interface MatchCandidate {
  competitor_product: CompetitorProduct;
  confidence: number;
  score_breakdown: {
    data_score: number;
    price_score: number;
    tech_score: number;
    term_score: number;
  };
}

/**
 * Market position analysis
 */
export interface MarketPosition {
  position: 'below_market' | 'competitive' | 'above_market';
  your_price: number;
  market_avg: number;
  market_min: number;
  market_max: number;
  percentile: number;
  competitor_count: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * API error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
