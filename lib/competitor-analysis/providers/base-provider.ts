/**
 * Base Provider - Abstract Scraper Class
 *
 * Provides a common interface for all competitor provider scrapers.
 * Each provider implementation handles the specific extraction logic
 * for their website structure.
 */

import type {
  CompetitorProvider,
  RawScrapedProduct,
  NormalizedProduct,
  ProductType,
  Technology,
  ScrapeJobResult,
  ScrapeStatus,
} from '../types';
import { scrapeUrl, extractData, batchScrape, getSessionCreditsUsed } from '../firecrawl-client';

// =============================================================================
// TYPES
// =============================================================================

export interface ProviderScrapeContext {
  provider: CompetitorProvider;
  startTime: number;
  productsFound: RawScrapedProduct[];
  errors: string[];
  creditsUsed: number;
}

export interface NormalizationConfig {
  /** Default product type if not detected */
  defaultProductType?: ProductType;
  /** Whether prices include VAT by default */
  pricesIncludeVat?: boolean;
  /** Currency symbol to strip from prices */
  currencySymbol?: string;
  /** Decimal separator used in prices */
  decimalSeparator?: string;
}

// =============================================================================
// ABSTRACT BASE CLASS
// =============================================================================

/**
 * Abstract base class for all provider scrapers.
 *
 * Subclasses must implement:
 * - `scrape()`: Fetch and extract raw products from the provider's website
 * - `getExtractionSchema()`: Return the JSON schema for structured extraction
 *
 * Subclasses may override:
 * - `normalizeProduct()`: Custom normalization logic
 * - `detectProductType()`: Custom product type detection
 * - `detectTechnology()`: Custom technology detection
 */
export abstract class BaseProvider {
  protected provider: CompetitorProvider;
  protected config: NormalizationConfig;

  constructor(provider: CompetitorProvider, config?: Partial<NormalizationConfig>) {
    this.provider = provider;
    this.config = {
      defaultProductType: undefined,
      pricesIncludeVat: true,
      currencySymbol: 'R',
      decimalSeparator: '.',
      ...config,
    };
  }

  // ===========================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ===========================================================================

  /**
   * Scrape products from the provider's website.
   * Returns raw scraped products before normalization.
   */
  abstract scrape(): Promise<RawScrapedProduct[]>;

  /**
   * Get the JSON schema for structured extraction.
   * Used by Firecrawl's LLM extraction.
   */
  abstract getExtractionSchema(): Record<string, unknown>;

  /**
   * Get extraction prompt for LLM guidance.
   */
  abstract getExtractionPrompt(): string;

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Run a full scrape job for this provider.
   * Handles scraping, normalization, and result tracking.
   */
  async runScrapeJob(): Promise<ScrapeJobResult> {
    const startTime = Date.now();
    const initialCredits = getSessionCreditsUsed();
    const errors: string[] = [];

    let status: ScrapeStatus = 'running';
    let rawProducts: RawScrapedProduct[] = [];
    let normalizedProducts: NormalizedProduct[] = [];

    try {
      // Scrape raw products
      rawProducts = await this.scrape();

      // Normalize all products
      normalizedProducts = rawProducts
        .map((raw) => {
          try {
            return this.normalizeProduct(raw);
          } catch (error) {
            errors.push(
              `Failed to normalize product "${raw.name}": ${error instanceof Error ? error.message : String(error)}`
            );
            return null;
          }
        })
        .filter((p): p is NormalizedProduct => p !== null);

      status = 'completed';
    } catch (error) {
      status = 'failed';
      errors.push(
        `Scrape failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const creditsUsed = getSessionCreditsUsed() - initialCredits;

    return {
      provider_id: this.provider.id,
      provider_slug: this.provider.slug,
      status,
      products_found: rawProducts.length,
      products_new: 0, // Will be calculated when saving to DB
      products_updated: 0, // Will be calculated when saving to DB
      products_unchanged: 0, // Will be calculated when saving to DB
      credits_used: creditsUsed,
      duration_ms: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Get the provider slug (used for registry lookup)
   */
  getSlug(): string {
    return this.provider.slug;
  }

  /**
   * Get the provider name
   */
  getName(): string {
    return this.provider.name;
  }

  // ===========================================================================
  // NORMALIZATION (can be overridden)
  // ===========================================================================

  /**
   * Normalize a raw scraped product into database-ready format.
   * Can be overridden by subclasses for custom logic.
   */
  normalizeProduct(raw: RawScrapedProduct): NormalizedProduct {
    return {
      external_id: raw.external_id || null,
      product_name: this.cleanProductName(raw.name),
      product_type: this.detectProductType(raw),
      monthly_price: this.parsePrice(raw.monthly_price),
      once_off_price: this.parsePrice(raw.once_off_price),
      price_includes_vat: this.config.pricesIncludeVat ?? true,
      contract_term: this.parseContractTerm(raw.contract_term),
      data_bundle: raw.data_bundle || null,
      data_gb: this.parseDataAmount(raw.data_bundle),
      speed_mbps: this.parseSpeed(raw.speed),
      device_name: raw.device_name || null,
      technology: this.detectTechnology(raw),
      source_url: raw.url || null,
      raw_data: raw.raw || null,
    };
  }

  /**
   * Detect product type from raw data.
   * Can be overridden by subclasses.
   */
  protected detectProductType(raw: RawScrapedProduct): ProductType | null {
    const name = raw.name.toLowerCase();
    const hasDevice = !!raw.device_name;

    // Fibre indicators
    if (name.includes('fibre') || name.includes('fiber')) {
      return 'fibre';
    }

    // LTE/Fixed wireless indicators
    if (name.includes('lte') || name.includes('wireless')) {
      return 'lte';
    }

    // 5G can be LTE or mobile contract
    if (name.includes('5g')) {
      return hasDevice ? 'mobile_contract' : 'lte';
    }

    // Data-only indicators
    if (
      name.includes('data only') ||
      name.includes('data-only') ||
      name.includes('sim only') ||
      name.includes('sim-only')
    ) {
      return 'data_only';
    }

    // Prepaid indicators
    if (name.includes('prepaid') || name.includes('pay as you go')) {
      return 'prepaid';
    }

    // Device with contract
    if (hasDevice) {
      return 'mobile_contract';
    }

    // Default
    return this.config.defaultProductType || null;
  }

  /**
   * Detect network technology from raw data.
   * Can be overridden by subclasses.
   */
  protected detectTechnology(raw: RawScrapedProduct): Technology {
    const tech = raw.technology?.toLowerCase() || '';
    const name = raw.name.toLowerCase();

    if (tech.includes('5g') || name.includes('5g')) {
      return '5G';
    }
    if (tech.includes('lte') || name.includes('lte') || tech.includes('4g')) {
      return 'LTE';
    }
    if (tech.includes('fibre') || tech.includes('fiber') || name.includes('fibre')) {
      return 'Fibre';
    }
    if (tech.includes('adsl') || name.includes('adsl')) {
      return 'ADSL';
    }
    if (tech.includes('wireless') || name.includes('wireless')) {
      return 'Wireless';
    }

    return null;
  }

  // ===========================================================================
  // PARSING UTILITIES
  // ===========================================================================

  /**
   * Parse a price value from string or number format.
   * Handles formats like "R499", "R 499.00", "499", etc.
   */
  protected parsePrice(value: string | number | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    // Remove currency symbol and whitespace
    let cleaned = value
      .replace(new RegExp(`${this.config.currencySymbol}\\s*`, 'gi'), '')
      .replace(/\s/g, '')
      .replace(/,/g, ''); // Remove thousand separators

    // Handle decimal separator
    if (this.config.decimalSeparator !== '.') {
      cleaned = cleaned.replace(this.config.decimalSeparator!, '.');
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse contract term from string or number.
   * Handles formats like "24 months", "24", "2 years", etc.
   */
  protected parseContractTerm(value: string | number | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    const lower = value.toLowerCase();

    // Check for years
    const yearsMatch = lower.match(/(\d+)\s*year/);
    if (yearsMatch) {
      return parseInt(yearsMatch[1], 10) * 12;
    }

    // Check for months
    const monthsMatch = lower.match(/(\d+)\s*month/);
    if (monthsMatch) {
      return parseInt(monthsMatch[1], 10);
    }

    // Try direct number
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse data amount from string.
   * Handles formats like "50GB", "50 GB", "Unlimited", etc.
   */
  protected parseDataAmount(value: string | undefined): number | null {
    if (!value) {
      return null;
    }

    const lower = value.toLowerCase();

    // Unlimited = null (no specific amount)
    if (lower.includes('unlimited')) {
      return null;
    }

    // Parse GB
    const gbMatch = lower.match(/(\d+(?:\.\d+)?)\s*gb/);
    if (gbMatch) {
      return parseFloat(gbMatch[1]);
    }

    // Parse TB (convert to GB)
    const tbMatch = lower.match(/(\d+(?:\.\d+)?)\s*tb/);
    if (tbMatch) {
      return parseFloat(tbMatch[1]) * 1024;
    }

    // Parse MB (convert to GB)
    const mbMatch = lower.match(/(\d+(?:\.\d+)?)\s*mb/);
    if (mbMatch) {
      return parseFloat(mbMatch[1]) / 1024;
    }

    return null;
  }

  /**
   * Parse speed from string or number.
   * Handles formats like "100Mbps", "100 Mbps", etc.
   */
  protected parseSpeed(value: string | number | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    const lower = value.toLowerCase();

    // Parse Mbps
    const mbpsMatch = lower.match(/(\d+(?:\.\d+)?)\s*mbps/);
    if (mbpsMatch) {
      return parseFloat(mbpsMatch[1]);
    }

    // Parse Gbps (convert to Mbps)
    const gbpsMatch = lower.match(/(\d+(?:\.\d+)?)\s*gbps/);
    if (gbpsMatch) {
      return parseFloat(gbpsMatch[1]) * 1000;
    }

    // Try direct number
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Clean product name (trim, normalize whitespace)
   */
  protected cleanProductName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ');
  }

  // ===========================================================================
  // SCRAPING HELPERS (for subclasses)
  // ===========================================================================

  /**
   * Scrape a single URL and return markdown content.
   * Wrapper for subclasses to use.
   */
  protected async scrapeUrl(url: string): Promise<string | null> {
    const result = await scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: this.provider.scrape_config?.wait_time,
      headers: this.provider.scrape_config?.headers,
    });

    if (!result.success || !result.data?.markdown) {
      return null;
    }

    return result.data.markdown;
  }

  /**
   * Extract structured data from URLs using schema.
   * Wrapper for subclasses to use.
   */
  protected async extractFromUrls(urls: string[]): Promise<Record<string, unknown> | null> {
    const result = await extractData({
      urls,
      schema: this.getExtractionSchema(),
      prompt: this.getExtractionPrompt(),
    });

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  }

  /**
   * Batch scrape multiple URLs.
   * Wrapper for subclasses to use.
   */
  protected async batchScrapeUrls(urls: string[]): Promise<Map<string, string>> {
    const results = await batchScrape(urls, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: this.provider.scrape_config?.wait_time,
      headers: this.provider.scrape_config?.headers,
    });

    const contentMap = new Map<string, string>();

    results.forEach((result, index) => {
      if (result.success && result.data?.markdown) {
        contentMap.set(urls[index], result.data.markdown);
      }
    });

    return contentMap;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default BaseProvider;
