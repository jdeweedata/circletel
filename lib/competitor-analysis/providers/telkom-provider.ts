/**
 * Telkom Provider Scraper
 *
 * Scrapes mobile contracts, fibre packages, and LTE deals from Telkom South Africa.
 * Telkom offers both mobile and fixed-line services.
 */

import { BaseProvider } from './base-provider';
import type { RawScrapedProduct, CompetitorProvider, ProductType } from '../types';

// =============================================================================
// EXTRACTION SCHEMA
// =============================================================================

/**
 * JSON Schema for Telkom product extraction.
 * Handles both mobile and fibre products.
 */
const TELKOM_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      description: 'List of Telkom products including mobile, fibre, and LTE',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Product/package name',
          },
          product_category: {
            type: 'string',
            description: 'Category: "Mobile", "Fibre", "LTE", "DSL"',
          },
          device_name: {
            type: 'string',
            description: 'Device name for mobile contracts',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly price in Rands',
          },
          once_off_price: {
            type: 'string',
            description: 'Installation or upfront cost',
          },
          contract_term: {
            type: 'string',
            description: 'Contract duration',
          },
          data_bundle: {
            type: 'string',
            description: 'Data included (GB)',
          },
          download_speed: {
            type: 'string',
            description: 'Download speed for fibre/LTE (Mbps)',
          },
          upload_speed: {
            type: 'string',
            description: 'Upload speed for fibre (Mbps)',
          },
          minutes: {
            type: 'string',
            description: 'Voice minutes included',
          },
          sms: {
            type: 'string',
            description: 'SMS included',
          },
          technology: {
            type: 'string',
            description: 'Technology type (5G, LTE, Fibre, DSL)',
          },
          fibre_provider: {
            type: 'string',
            description: 'Fibre network operator (Openserve, Vumatel, etc.)',
          },
          sku: {
            type: 'string',
            description: 'Product SKU',
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
// TELKOM PROVIDER CLASS
// =============================================================================

export class TelkomProvider extends BaseProvider {
  constructor(provider: CompetitorProvider) {
    super(provider, {
      defaultProductType: undefined,
      pricesIncludeVat: true,
      currencySymbol: 'R',
    });
  }

  /**
   * Get the extraction schema for Telkom products.
   */
  getExtractionSchema(): Record<string, unknown> {
    if (this.provider.scrape_config?.extraction_schema) {
      return this.provider.scrape_config.extraction_schema;
    }
    return TELKOM_EXTRACTION_SCHEMA;
  }

  /**
   * Get the extraction prompt for Telkom.
   */
  getExtractionPrompt(): string {
    return `Extract all products from this Telkom South Africa page.

Telkom offers multiple product types:
1. Mobile contracts (postpaid with device)
2. SIM-only mobile plans
3. Fibre packages (home internet)
4. LTE/Fixed wireless packages
5. DSL packages

For each product, extract:
- Product/package name
- Category (Mobile, Fibre, LTE, DSL)
- Device name if mobile contract
- Monthly price in Rands
- Installation/once-off fee
- Contract term
- Data allocation or speed
- Download/upload speeds for fibre/LTE
- Voice minutes and SMS for mobile
- Technology type
- Fibre network provider if applicable

Focus on consumer and SOHO products. Ignore enterprise-only plans.`;
  }

  /**
   * Scrape products from Telkom's website.
   */
  async scrape(): Promise<RawScrapedProduct[]> {
    const allProducts: RawScrapedProduct[] = [];
    const scrapeUrls = this.provider.scrape_urls;

    if (!scrapeUrls || scrapeUrls.length === 0) {
      console.warn('[TelkomProvider] No scrape URLs configured');
      return [];
    }

    for (const url of scrapeUrls) {
      try {
        console.log(`[TelkomProvider] Scraping URL: ${url}`);

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
            `[TelkomProvider] Extracted ${products.length} products from ${url}`
          );
        }
      } catch (error) {
        console.error(
          `[TelkomProvider] Failed to scrape ${url}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const uniqueProducts = this.deduplicateProducts(allProducts);

    console.log(
      `[TelkomProvider] Total unique products: ${uniqueProducts.length}`
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

    // Determine speed from download_speed or data_bundle
    const downloadSpeed = data.download_speed as string | undefined;
    const speed = downloadSpeed || undefined;

    return {
      external_id: (data.sku as string) || undefined,
      name,
      monthly_price: data.monthly_price as string | undefined,
      once_off_price: data.once_off_price as string | undefined,
      contract_term: data.contract_term as string | undefined,
      data_bundle: data.data_bundle as string | undefined,
      speed,
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
   * Override product type detection for Telkom's mixed offerings.
   */
  protected detectProductType(raw: RawScrapedProduct): ProductType | null {
    const name = raw.name.toLowerCase();
    const category = ((raw.raw as Record<string, unknown>)?.product_category as string || '').toLowerCase();
    const tech = raw.technology?.toLowerCase() || '';

    // Check category first (most reliable)
    if (category.includes('fibre') || category.includes('fiber')) {
      return 'fibre';
    }
    if (category.includes('lte') || category.includes('wireless')) {
      return 'lte';
    }
    if (category.includes('mobile')) {
      return raw.device_name ? 'mobile_contract' : 'data_only';
    }
    if (category.includes('dsl') || category.includes('adsl')) {
      return 'fibre'; // Treat DSL as fibre category for comparison
    }

    // Check name patterns
    if (name.includes('fibre') || name.includes('fiber')) {
      return 'fibre';
    }
    if (name.includes('lte') || name.includes('wireless')) {
      return 'lte';
    }

    // Check technology
    if (tech.includes('fibre') || tech.includes('fiber')) {
      return 'fibre';
    }
    if (tech.includes('lte')) {
      return 'lte';
    }

    // Has device = mobile contract
    if (raw.device_name) {
      return 'mobile_contract';
    }

    // Has speed = likely fibre or LTE
    if (raw.speed) {
      return 'fibre';
    }

    return null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default TelkomProvider;
