/**
 * Firecrawl Client Wrapper
 *
 * Provides a typed wrapper around the Firecrawl SDK for web scraping
 * competitor pricing data with error handling, retry logic, and credit tracking.
 *
 * @version 1.0.1 - 2025-12-02
 */

import Firecrawl from '@mendable/firecrawl-js';
import type {
  FirecrawlScrapeOptions,
  FirecrawlExtractOptions,
  FirecrawlScrapeResponse,
  FirecrawlExtractResponse,
  FirecrawlMapResponse,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!FIRECRAWL_API_KEY) {
  console.warn('[FirecrawlClient] FIRECRAWL_API_KEY not set - scraping will fail');
}

/** Default timeout for scrape operations (30 seconds) */
const DEFAULT_TIMEOUT = 30000;

/** Maximum retries for failed requests */
const MAX_RETRIES = 3;

/** Delay between retries (ms) */
const RETRY_DELAY = 2000;

/** Credit costs for different operations */
const CREDIT_COSTS = {
  scrape: 1,
  extract: 15,
  map: 1,
} as const;

// =============================================================================
// CREDIT TRACKING
// =============================================================================

interface CreditUsage {
  operation: keyof typeof CREDIT_COSTS;
  credits: number;
  url: string;
  timestamp: Date;
  success: boolean;
}

/** In-memory credit usage tracking for current session */
const creditUsageLog: CreditUsage[] = [];

/** Track credit usage */
function trackCreditUsage(
  operation: keyof typeof CREDIT_COSTS,
  url: string,
  success: boolean
): void {
  const usage: CreditUsage = {
    operation,
    credits: success ? CREDIT_COSTS[operation] : 0,
    url,
    timestamp: new Date(),
    success,
  };
  creditUsageLog.push(usage);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[FirecrawlClient] ${operation.toUpperCase()} ${success ? 'SUCCESS' : 'FAILED'} - ` +
        `${usage.credits} credits - ${url}`
    );
  }
}

/**
 * Get total credits used in current session
 */
export function getSessionCreditsUsed(): number {
  return creditUsageLog.reduce((sum, log) => sum + log.credits, 0);
}

/**
 * Get credit usage breakdown by operation type
 */
export function getCreditUsageBreakdown(): Record<string, number> {
  const breakdown: Record<string, number> = {
    scrape: 0,
    extract: 0,
    map: 0,
    total: 0,
  };

  for (const log of creditUsageLog) {
    breakdown[log.operation] += log.credits;
    breakdown.total += log.credits;
  }

  return breakdown;
}

/**
 * Get recent credit usage log
 */
export function getRecentCreditUsage(limit = 50): CreditUsage[] {
  return creditUsageLog.slice(-limit);
}

/**
 * Clear credit usage log (for testing)
 */
export function clearCreditUsageLog(): void {
  creditUsageLog.length = 0;
}

// =============================================================================
// FIRECRAWL CLIENT
// =============================================================================

/**
 * Create a configured Firecrawl client instance
 */
function createClient(): Firecrawl {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not set');
  }
  return new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrape a single URL and return the content
 *
 * @param url - URL to scrape
 * @param options - Scrape options
 * @returns Scraped content
 *
 * @example
 * ```typescript
 * const result = await scrapeUrl('https://www.mtn.co.za/shop/deals', {
 *   formats: ['markdown'],
 *   onlyMainContent: true,
 * });
 * ```
 */
export async function scrapeUrl(
  url: string,
  options: FirecrawlScrapeOptions = {}
): Promise<FirecrawlScrapeResponse> {
  const client = createClient();

  const scrapeOptions = {
    formats: options.formats || ['markdown'],
    onlyMainContent: options.onlyMainContent ?? true,
    includeTags: options.includeTags,
    excludeTags: options.excludeTags,
    waitFor: options.waitFor,
    timeout: options.timeout || DEFAULT_TIMEOUT,
    headers: options.headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use the SDK's scrape method (not scrapeUrl)
      const response = await client.scrape(url, scrapeOptions);

      // The SDK returns the document directly on success
      trackCreditUsage('scrape', url, true);
      return {
        success: true,
        data: {
          markdown: response.markdown,
          html: response.html,
          rawHtml: response.rawHtml,
          links: response.links,
          screenshot: response.screenshot,
          metadata: response.metadata,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        console.warn(
          `[FirecrawlClient] Scrape attempt ${attempt} failed for ${url}: ${lastError.message}. ` +
            `Retrying in ${RETRY_DELAY}ms...`
        );
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
      }
    }
  }

  trackCreditUsage('scrape', url, false);
  return {
    success: false,
    error: lastError?.message || 'Scrape failed after all retries',
  };
}

/**
 * Extract structured data from URLs using a schema
 *
 * Uses Firecrawl's LLM-powered extraction to pull structured data
 * from web pages based on a JSON schema.
 *
 * @param options - Extract options with URLs and schema
 * @returns Extracted structured data
 *
 * @example
 * ```typescript
 * const result = await extractData({
 *   urls: ['https://www.mtn.co.za/shop/deals/devices/phones'],
 *   schema: {
 *     products: {
 *       type: 'array',
 *       items: {
 *         type: 'object',
 *         properties: {
 *           name: { type: 'string' },
 *           price: { type: 'string' },
 *           data: { type: 'string' },
 *         },
 *       },
 *     },
 *   },
 *   prompt: 'Extract all mobile phone deals with their monthly prices and data bundles',
 * });
 * ```
 */
export async function extractData(
  options: FirecrawlExtractOptions
): Promise<FirecrawlExtractResponse> {
  const client = createClient();

  const { urls, schema, prompt, enableWebSearch } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use startExtract for async extraction
      const response = await client.startExtract({
        urls,
        schema,
        prompt,
        enableWebSearch,
      });

      // Check if we got a job ID (async response)
      if ('id' in response && response.id) {
        // Poll for completion
        const maxPollAttempts = 30;
        const pollInterval = 2000;

        for (let pollAttempt = 0; pollAttempt < maxPollAttempts; pollAttempt++) {
          await sleep(pollInterval);

          const statusResponse = await client.getExtractStatus(response.id);

          if (statusResponse.status === 'completed' && statusResponse.data) {
            // Track credits for each URL
            for (const url of urls) {
              trackCreditUsage('extract', url, true);
            }
            return {
              success: true,
              data: statusResponse.data as Record<string, unknown>,
            };
          } else if (statusResponse.status === 'failed') {
            throw new Error(statusResponse.error || 'Extract job failed');
          }
          // Continue polling if still processing
        }

        throw new Error('Extract job timed out');
      }

      // Direct response (synchronous extraction)
      if (response.success && response.data) {
        for (const url of urls) {
          trackCreditUsage('extract', url, true);
        }
        return {
          success: true,
          data: response.data as Record<string, unknown>,
        };
      }

      throw new Error('Extract failed with no error message');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        console.warn(
          `[FirecrawlClient] Extract attempt ${attempt} failed: ${lastError.message}. ` +
            `Retrying in ${RETRY_DELAY}ms...`
        );
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  // Track failed credits
  for (const url of urls) {
    trackCreditUsage('extract', url, false);
  }

  return {
    success: false,
    error: lastError?.message || 'Extract failed after all retries',
  };
}

/**
 * Map a website to discover all URLs
 *
 * Useful for discovering product pages on a competitor's site
 * before scraping individual products.
 *
 * @param url - Base URL to map
 * @param options - Map options
 * @returns List of discovered URLs
 *
 * @example
 * ```typescript
 * const result = await mapSite('https://www.mtn.co.za/shop/deals', {
 *   search: 'contract',
 *   limit: 100,
 * });
 * console.log(result.links); // Array of discovered URLs
 * ```
 */
export async function mapSite(
  url: string,
  options: {
    search?: string;
    sitemap?: 'skip' | 'include' | 'only';
    includeSubdomains?: boolean;
    limit?: number;
  } = {}
): Promise<FirecrawlMapResponse> {
  const client = createClient();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use the SDK's map method
      const response = await client.map(url, {
        search: options.search,
        sitemap: options.sitemap,
        includeSubdomains: options.includeSubdomains,
        limit: options.limit,
      });

      // The SDK returns MapData with links as SearchResultWeb[]
      // Extract just the URL strings
      trackCreditUsage('map', url, true);
      return {
        success: true,
        links: response.links.map((link) => link.url),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        console.warn(
          `[FirecrawlClient] Map attempt ${attempt} failed for ${url}: ${lastError.message}. ` +
            `Retrying in ${RETRY_DELAY}ms...`
        );
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  trackCreditUsage('map', url, false);
  return {
    success: false,
    error: lastError?.message || 'Map failed after all retries',
  };
}

/**
 * Batch scrape multiple URLs
 *
 * More efficient than scraping URLs one by one.
 *
 * @param urls - Array of URLs to scrape
 * @param options - Scrape options applied to all URLs
 * @returns Array of scrape results
 */
export async function batchScrape(
  urls: string[],
  options: FirecrawlScrapeOptions = {}
): Promise<FirecrawlScrapeResponse[]> {
  // Process URLs in parallel with concurrency limit
  const CONCURRENCY_LIMIT = 3;
  const results: FirecrawlScrapeResponse[] = [];

  for (let i = 0; i < urls.length; i += CONCURRENCY_LIMIT) {
    const batch = urls.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((url) => scrapeUrl(url, options))
    );
    results.push(...batchResults);

    // Add small delay between batches to avoid rate limiting
    if (i + CONCURRENCY_LIMIT < urls.length) {
      await sleep(500);
    }
  }

  return results;
}

// =============================================================================
// EXTRACTION SCHEMAS
// =============================================================================

/**
 * Common extraction schema for mobile deals
 */
export const MOBILE_DEALS_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      description: 'List of mobile phone deals or contracts',
      items: {
        type: 'object',
        properties: {
          device_name: {
            type: 'string',
            description: 'Name of the device (e.g., "Samsung Galaxy S24")',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly contract price (e.g., "R499" or "499")',
          },
          once_off_price: {
            type: 'string',
            description: 'Once-off/upfront price if any',
          },
          contract_term: {
            type: 'string',
            description: 'Contract length (e.g., "24 months")',
          },
          data_bundle: {
            type: 'string',
            description: 'Data included (e.g., "50GB" or "Unlimited")',
          },
          technology: {
            type: 'string',
            description: 'Network technology (e.g., "5G", "LTE")',
          },
          product_url: {
            type: 'string',
            description: 'URL to the product page',
          },
          sku: {
            type: 'string',
            description: 'Product SKU or ID if available',
          },
        },
        required: ['device_name', 'monthly_price'],
      },
    },
  },
  required: ['products'],
};

/**
 * Common extraction schema for fibre packages
 */
export const FIBRE_PACKAGES_SCHEMA = {
  type: 'object',
  properties: {
    packages: {
      type: 'array',
      description: 'List of fibre internet packages',
      items: {
        type: 'object',
        properties: {
          package_name: {
            type: 'string',
            description: 'Name of the package',
          },
          download_speed: {
            type: 'string',
            description: 'Download speed (e.g., "100Mbps")',
          },
          upload_speed: {
            type: 'string',
            description: 'Upload speed (e.g., "50Mbps")',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly price',
          },
          once_off_price: {
            type: 'string',
            description: 'Installation/setup fee',
          },
          contract_term: {
            type: 'string',
            description: 'Contract length',
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of included features',
          },
          product_url: {
            type: 'string',
            description: 'URL to the product page',
          },
        },
        required: ['package_name', 'monthly_price'],
      },
    },
  },
  required: ['packages'],
};

/**
 * Common extraction schema for data-only deals
 */
export const DATA_ONLY_SCHEMA = {
  type: 'object',
  properties: {
    deals: {
      type: 'array',
      description: 'List of data-only deals or SIM-only contracts',
      items: {
        type: 'object',
        properties: {
          deal_name: {
            type: 'string',
            description: 'Name of the deal',
          },
          data_amount: {
            type: 'string',
            description: 'Data included (e.g., "100GB")',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly price',
          },
          contract_term: {
            type: 'string',
            description: 'Contract length (or "prepaid")',
          },
          technology: {
            type: 'string',
            description: 'Network technology',
          },
          validity: {
            type: 'string',
            description: 'Data validity period',
          },
          product_url: {
            type: 'string',
            description: 'URL to the product page',
          },
        },
        required: ['deal_name', 'monthly_price'],
      },
    },
  },
  required: ['deals'],
};

// =============================================================================
// EXPORTS
// =============================================================================

export const FirecrawlClient = {
  scrapeUrl,
  extractData,
  mapSite,
  batchScrape,
  getSessionCreditsUsed,
  getCreditUsageBreakdown,
  getRecentCreditUsage,
  clearCreditUsageLog,
  schemas: {
    MOBILE_DEALS_SCHEMA,
    FIBRE_PACKAGES_SCHEMA,
    DATA_ONLY_SCHEMA,
  },
  creditCosts: CREDIT_COSTS,
};

export default FirecrawlClient;
