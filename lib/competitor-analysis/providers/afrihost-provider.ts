/**
 * Afrihost Provider Scraper
 *
 * Scrapes fibre and LTE packages from Afrihost.
 * Afrihost is a major South African ISP offering various connectivity solutions.
 */

import { BaseProvider } from './base-provider';
import type { RawScrapedProduct, CompetitorProvider, ProductType } from '../types';

// =============================================================================
// EXTRACTION SCHEMA
// =============================================================================

/**
 * JSON Schema for Afrihost product extraction.
 * Handles fibre and LTE products.
 */
const AFRIHOST_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      description: 'List of Afrihost fibre and LTE packages',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Package name',
          },
          product_type: {
            type: 'string',
            description: 'Type: "Fibre", "LTE", "DSL"',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly price in Rands',
          },
          once_off_price: {
            type: 'string',
            description: 'Installation or setup fee',
          },
          download_speed: {
            type: 'string',
            description: 'Download speed (Mbps)',
          },
          upload_speed: {
            type: 'string',
            description: 'Upload speed (Mbps)',
          },
          data_cap: {
            type: 'string',
            description: 'Data cap or "Uncapped"',
          },
          contract_term: {
            type: 'string',
            description: 'Contract length',
          },
          fibre_network: {
            type: 'string',
            description: 'Fibre network operator (Openserve, Vumatel, Octotel, etc.)',
          },
          throttle_policy: {
            type: 'string',
            description: 'Throttling or fair use policy',
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Included features',
          },
          promo: {
            type: 'string',
            description: 'Any promotional offer or discount',
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
// AFRIHOST PROVIDER CLASS
// =============================================================================

export class AfrihostProvider extends BaseProvider {
  constructor(provider: CompetitorProvider) {
    super(provider, {
      defaultProductType: 'fibre',
      pricesIncludeVat: true,
      currencySymbol: 'R',
    });
  }

  /**
   * Get the extraction schema for Afrihost products.
   */
  getExtractionSchema(): Record<string, unknown> {
    if (this.provider.scrape_config?.extraction_schema) {
      return this.provider.scrape_config.extraction_schema;
    }
    return AFRIHOST_EXTRACTION_SCHEMA;
  }

  /**
   * Get the extraction prompt for Afrihost.
   */
  getExtractionPrompt(): string {
    return `Extract all internet packages from this Afrihost page.

Afrihost offers:
- Fibre packages (various network operators)
- LTE/Mobile data packages
- DSL packages (legacy)

For each package, extract:
- Package name
- Product type (Fibre, LTE, DSL)
- Monthly price in Rands
- Installation/once-off fee
- Download speed (Mbps)
- Upload speed (Mbps)
- Data cap (or "Uncapped")
- Contract term
- Fibre network provider if applicable
- Throttling/fair use policy
- Key features
- Any promotional offers

Note: Afrihost partners with multiple fibre networks (Openserve, Vumatel, Octotel, Frogfoot, etc.)`;
  }

  /**
   * Scrape products from Afrihost's website.
   */
  async scrape(): Promise<RawScrapedProduct[]> {
    const allProducts: RawScrapedProduct[] = [];
    const scrapeUrls = this.provider.scrape_urls;

    if (!scrapeUrls || scrapeUrls.length === 0) {
      console.warn('[AfrihostProvider] No scrape URLs configured');
      return [];
    }

    for (const url of scrapeUrls) {
      try {
        console.log(`[AfrihostProvider] Scraping URL: ${url}`);

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
            `[AfrihostProvider] Extracted ${products.length} products from ${url}`
          );
        }
      } catch (error) {
        console.error(
          `[AfrihostProvider] Failed to scrape ${url}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const uniqueProducts = this.deduplicateProducts(allProducts);

    console.log(
      `[AfrihostProvider] Total unique products: ${uniqueProducts.length}`
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

    // Build enhanced name with network info
    let enhancedName = name;
    const fibreNetwork = data.fibre_network as string | undefined;
    if (fibreNetwork && !name.toLowerCase().includes(fibreNetwork.toLowerCase())) {
      enhancedName = `${name} (${fibreNetwork})`;
    }

    return {
      name: enhancedName,
      monthly_price: data.monthly_price as string | undefined,
      once_off_price: data.once_off_price as string | undefined,
      contract_term: data.contract_term as string | undefined,
      data_bundle: data.data_cap as string | undefined,
      speed: data.download_speed as string | undefined,
      technology: this.mapProductTypeToTech(data.product_type as string | undefined),
      url: (data.url as string) || sourceUrl,
      raw: {
        ...data,
        source_url: sourceUrl,
        scraped_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Map Afrihost product type to technology string.
   */
  private mapProductTypeToTech(productType: string | undefined): string | undefined {
    if (!productType) return undefined;

    const lower = productType.toLowerCase();
    if (lower.includes('fibre') || lower.includes('fiber')) {
      return 'Fibre';
    }
    if (lower.includes('lte')) {
      return 'LTE';
    }
    if (lower.includes('dsl') || lower.includes('adsl')) {
      return 'ADSL';
    }
    return undefined;
  }

  /**
   * Deduplicate products.
   */
  private deduplicateProducts(products: RawScrapedProduct[]): RawScrapedProduct[] {
    const seen = new Map<string, RawScrapedProduct>();

    for (const product of products) {
      // Include speed in key for fibre since same name can have different speeds
      const speed = product.speed || '';
      const key = `${product.name.toLowerCase()}|${product.monthly_price || ''}|${speed}`;

      if (!seen.has(key)) {
        seen.set(key, product);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Override product type detection for Afrihost.
   */
  protected detectProductType(raw: RawScrapedProduct): ProductType | null {
    const productType = ((raw.raw as Record<string, unknown>)?.product_type as string || '').toLowerCase();
    const name = raw.name.toLowerCase();

    // Check extracted product type first
    if (productType.includes('fibre') || productType.includes('fiber')) {
      return 'fibre';
    }
    if (productType.includes('lte')) {
      return 'lte';
    }

    // Check name
    if (name.includes('fibre') || name.includes('fiber')) {
      return 'fibre';
    }
    if (name.includes('lte')) {
      return 'lte';
    }

    // Default based on URL context
    const sourceUrl = ((raw.raw as Record<string, unknown>)?.source_url as string || '').toLowerCase();
    if (sourceUrl.includes('fibre')) {
      return 'fibre';
    }
    if (sourceUrl.includes('lte')) {
      return 'lte';
    }

    return 'fibre';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AfrihostProvider;
