/**
 * Rain Provider Scraper
 *
 * Scrapes 5G and LTE data packages from Rain South Africa.
 * Rain specializes in data-only mobile services with simple pricing.
 */

import { BaseProvider } from './base-provider';
import type { RawScrapedProduct, CompetitorProvider, ProductType } from '../types';

// =============================================================================
// EXTRACTION SCHEMA
// =============================================================================

/**
 * JSON Schema for Rain product extraction.
 * Rain has a simple product lineup focused on data.
 */
const RAIN_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      description: 'List of Rain data packages (5G and 4G LTE)',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Package name (e.g., "rain 5G unlimited", "rain 4G for home")',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly price in Rands',
          },
          once_off_price: {
            type: 'string',
            description: 'SIM or router cost if any',
          },
          data_bundle: {
            type: 'string',
            description: 'Data included (usually "Unlimited" for rain)',
          },
          speed_cap: {
            type: 'string',
            description: 'Speed cap or tier (e.g., "30Mbps", "uncapped")',
          },
          technology: {
            type: 'string',
            description: '5G or 4G LTE',
          },
          use_case: {
            type: 'string',
            description: 'Intended use (e.g., "Home", "Mobile", "Work")',
          },
          fair_use_policy: {
            type: 'string',
            description: 'Fair usage policy or peak/off-peak details',
          },
          device_included: {
            type: 'string',
            description: 'Router or SIM included',
          },
          contract_term: {
            type: 'string',
            description: 'Contract type (month-to-month or fixed)',
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of included features',
          },
          url: {
            type: 'string',
            description: 'Product page URL',
          },
        },
        required: ['name', 'monthly_price'],
      },
    },
  },
  required: ['products'],
};

// =============================================================================
// RAIN PROVIDER CLASS
// =============================================================================

export class RainProvider extends BaseProvider {
  constructor(provider: CompetitorProvider) {
    super(provider, {
      defaultProductType: 'lte',
      pricesIncludeVat: true,
      currencySymbol: 'R',
    });
  }

  /**
   * Get the extraction schema for Rain products.
   */
  getExtractionSchema(): Record<string, unknown> {
    if (this.provider.scrape_config?.extraction_schema) {
      return this.provider.scrape_config.extraction_schema;
    }
    return RAIN_EXTRACTION_SCHEMA;
  }

  /**
   * Get the extraction prompt for Rain.
   */
  getExtractionPrompt(): string {
    return `Extract all data packages from this Rain South Africa page.

Rain offers simple, unlimited data packages:
- 5G packages (home and mobile)
- 4G LTE packages
- Work/business packages

For each package, extract:
- Package name
- Monthly price in Rands
- Any once-off costs (SIM, router)
- Data allowance (usually unlimited)
- Speed tier or cap (if applicable)
- Technology (5G or 4G)
- Use case (Home, Mobile, Work)
- Fair use policy details
- Whether router/SIM is included
- Contract type (month-to-month)
- Key features

Note: Rain typically offers month-to-month contracts with no lock-in.`;
  }

  /**
   * Scrape products from Rain's website.
   */
  async scrape(): Promise<RawScrapedProduct[]> {
    const allProducts: RawScrapedProduct[] = [];
    const scrapeUrls = this.provider.scrape_urls;

    if (!scrapeUrls || scrapeUrls.length === 0) {
      console.warn('[RainProvider] No scrape URLs configured');
      return [];
    }

    for (const url of scrapeUrls) {
      try {
        console.log(`[RainProvider] Scraping URL: ${url}`);

        const extractedData = await this.extractFromUrls([url]);

        if (extractedData && 'products' in extractedData) {
          const products = extractedData.products as Array<Record<string, unknown>>;

          for (const product of products) {
            const rawProduct = this.mapToRawProduct(product, url);
            if (rawProduct) {
              allProducts.push(rawProduct);
            }
          }

          console.log(
            `[RainProvider] Extracted ${products.length} products from ${url}`
          );
        }
      } catch (error) {
        console.error(
          `[RainProvider] Failed to scrape ${url}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const uniqueProducts = this.deduplicateProducts(allProducts);

    console.log(
      `[RainProvider] Total unique products: ${uniqueProducts.length}`
    );

    return uniqueProducts;
  }

  /**
   * Map extracted data to RawScrapedProduct format.
   */
  private mapToRawProduct(
    data: Record<string, unknown>,
    sourceUrl: string
  ): RawScrapedProduct | null {
    const name = data.name as string | undefined;
    if (!name) {
      return null;
    }

    // Build enhanced name with use case
    let enhancedName = name;
    const useCase = data.use_case as string | undefined;
    if (useCase && !name.toLowerCase().includes(useCase.toLowerCase())) {
      enhancedName = `${name} (${useCase})`;
    }

    return {
      name: enhancedName,
      monthly_price: data.monthly_price as string | undefined,
      once_off_price: data.once_off_price as string | undefined,
      contract_term: (data.contract_term as string) || 'Month-to-month',
      data_bundle: data.data_bundle as string | undefined,
      speed: data.speed_cap as string | undefined,
      technology: data.technology as string | undefined,
      url: (data.url as string) || sourceUrl,
      raw: {
        ...data,
        source_url: sourceUrl,
        scraped_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Deduplicate products.
   */
  private deduplicateProducts(products: RawScrapedProduct[]): RawScrapedProduct[] {
    const seen = new Map<string, RawScrapedProduct>();

    for (const product of products) {
      const key = `${product.name.toLowerCase()}|${product.monthly_price || ''}`;

      if (!seen.has(key)) {
        seen.set(key, product);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Override product type detection for Rain.
   * Rain only offers data-only and LTE products.
   */
  protected detectProductType(raw: RawScrapedProduct): ProductType | null {
    const name = raw.name.toLowerCase();
    const tech = raw.technology?.toLowerCase() || '';

    // Rain is all data-only / LTE
    if (tech.includes('5g') || name.includes('5g')) {
      return 'lte'; // 5G is still LTE category for our purposes
    }

    return 'lte';
  }

  /**
   * Override technology detection for Rain.
   */
  protected detectTechnology(raw: RawScrapedProduct): '5G' | 'LTE' {
    const tech = raw.technology?.toLowerCase() || '';
    const name = raw.name.toLowerCase();

    if (tech.includes('5g') || name.includes('5g')) {
      return '5G';
    }

    return 'LTE';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default RainProvider;
