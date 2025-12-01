/**
 * Vodacom Provider Scraper
 *
 * Scrapes mobile contracts, smartphone deals, and data packages from Vodacom South Africa.
 * Uses Firecrawl's LLM extraction for structured data extraction.
 */

import { BaseProvider } from './base-provider';
import type { RawScrapedProduct, CompetitorProvider } from '../types';

// =============================================================================
// EXTRACTION SCHEMA
// =============================================================================

/**
 * JSON Schema for Vodacom product extraction.
 */
const VODACOM_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      description: 'List of Vodacom mobile deals, contracts, and smartphone offers',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Full product/deal name including smartphone if applicable',
          },
          device_name: {
            type: 'string',
            description: 'Smartphone name (e.g., "iPhone 15 Pro", "Samsung Galaxy S24")',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly price in Rands (look for "pm", "/month")',
          },
          once_off_price: {
            type: 'string',
            description: 'Upfront payment or device cost',
          },
          contract_term: {
            type: 'string',
            description: 'Contract duration (e.g., "24 months")',
          },
          data_bundle: {
            type: 'string',
            description: 'Data allocation (e.g., "40GB", "Unlimited")',
          },
          airtime: {
            type: 'string',
            description: 'Airtime value included',
          },
          minutes: {
            type: 'string',
            description: 'Voice minutes included',
          },
          technology: {
            type: 'string',
            description: 'Network type (5G, LTE)',
          },
          plan_name: {
            type: 'string',
            description: 'Vodacom plan name (e.g., "Red", "Smart", "uChoose")',
          },
          storage: {
            type: 'string',
            description: 'Device storage if specified (e.g., "256GB")',
          },
          color: {
            type: 'string',
            description: 'Device color if specified',
          },
          sku: {
            type: 'string',
            description: 'Product SKU or ID',
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
// VODACOM PROVIDER CLASS
// =============================================================================

export class VodacomProvider extends BaseProvider {
  constructor(provider: CompetitorProvider) {
    super(provider, {
      defaultProductType: 'mobile_contract',
      pricesIncludeVat: true,
      currencySymbol: 'R',
    });
  }

  /**
   * Get the extraction schema for Vodacom products.
   */
  getExtractionSchema(): Record<string, unknown> {
    if (this.provider.scrape_config?.extraction_schema) {
      return this.provider.scrape_config.extraction_schema;
    }
    return VODACOM_EXTRACTION_SCHEMA;
  }

  /**
   * Get the extraction prompt for Vodacom.
   */
  getExtractionPrompt(): string {
    return `Extract all smartphone deals and mobile contracts from this Vodacom South Africa page.

For each product, extract:
- Full product name with device
- Device/smartphone name
- Monthly price in Rands
- Any upfront/once-off payment
- Contract term (usually 24 months)
- Data bundle (GB)
- Airtime value if included
- Voice minutes if specified
- Network technology (5G, LTE)
- Vodacom plan name (Red, Smart, uChoose, Flexi, etc.)
- Device storage and color variants if shown

Focus on:
- Smartphone contracts (device + contract bundles)
- Red/Smart/uChoose plans with devices
- SIM-only deals
- Data contracts

Ignore:
- Prepaid options
- Accessories and add-ons
- Insurance products`;
  }

  /**
   * Scrape products from Vodacom's website.
   */
  async scrape(): Promise<RawScrapedProduct[]> {
    const allProducts: RawScrapedProduct[] = [];
    const scrapeUrls = this.provider.scrape_urls;

    if (!scrapeUrls || scrapeUrls.length === 0) {
      console.warn('[VodacomProvider] No scrape URLs configured');
      return [];
    }

    for (const url of scrapeUrls) {
      try {
        console.log(`[VodacomProvider] Scraping URL: ${url}`);

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
            `[VodacomProvider] Extracted ${products.length} products from ${url}`
          );
        }
      } catch (error) {
        console.error(
          `[VodacomProvider] Failed to scrape ${url}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const uniqueProducts = this.deduplicateProducts(allProducts);

    console.log(
      `[VodacomProvider] Total unique products: ${uniqueProducts.length}`
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

    // Build enhanced name with plan info
    let enhancedName = name;
    const planName = data.plan_name as string | undefined;
    if (planName && !name.toLowerCase().includes(planName.toLowerCase())) {
      enhancedName = `${name} on ${planName}`;
    }

    return {
      external_id: (data.sku as string) || undefined,
      name: enhancedName,
      monthly_price: data.monthly_price as string | undefined,
      once_off_price: data.once_off_price as string | undefined,
      contract_term: data.contract_term as string | undefined,
      data_bundle: data.data_bundle as string | undefined,
      device_name: data.device_name as string | undefined,
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
   * Override product type detection for Vodacom patterns.
   */
  protected detectProductType(raw: RawScrapedProduct): 'mobile_contract' | 'data_only' | 'device' | null {
    const name = raw.name.toLowerCase();
    const planName = ((raw.raw as Record<string, unknown>)?.plan_name as string || '').toLowerCase();

    // Vodacom plan patterns
    if (planName.includes('data') || name.includes('data only')) {
      return 'data_only';
    }

    // Has device = mobile contract
    if (raw.device_name) {
      return 'mobile_contract';
    }

    return 'mobile_contract';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default VodacomProvider;
