/**
 * MTN Provider Scraper
 *
 * Scrapes mobile contracts, device deals, and data packages from MTN South Africa.
 * Uses Firecrawl's LLM extraction for structured data extraction.
 */

import { BaseProvider } from './base-provider';
import type { RawScrapedProduct, CompetitorProvider } from '../types';

// =============================================================================
// EXTRACTION SCHEMA
// =============================================================================

/**
 * JSON Schema for MTN product extraction.
 * Designed to capture mobile contracts, device deals, and data packages.
 */
const MTN_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      description: 'List of MTN mobile deals, contracts, and device offers',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Full product/deal name including device if applicable',
          },
          device_name: {
            type: 'string',
            description: 'Device name if this is a device deal (e.g., "Samsung Galaxy S24")',
          },
          monthly_price: {
            type: 'string',
            description: 'Monthly contract price in Rands (e.g., "R499" or "499")',
          },
          once_off_price: {
            type: 'string',
            description: 'Once-off/upfront payment if any (e.g., "R0" or "R1999")',
          },
          contract_term: {
            type: 'string',
            description: 'Contract length (e.g., "24 months", "36 months")',
          },
          data_bundle: {
            type: 'string',
            description: 'Data included (e.g., "50GB", "100GB", "Unlimited")',
          },
          minutes: {
            type: 'string',
            description: 'Voice minutes included if specified',
          },
          sms: {
            type: 'string',
            description: 'SMS included if specified',
          },
          technology: {
            type: 'string',
            description: 'Network technology (e.g., "5G", "LTE", "4G")',
          },
          deal_type: {
            type: 'string',
            description: 'Type of deal (e.g., "Contract", "SIM Only", "Device Deal", "Data Only")',
          },
          promo_tag: {
            type: 'string',
            description: 'Any promotional tag or special offer text',
          },
          sku: {
            type: 'string',
            description: 'Product SKU or ID if visible',
          },
          url: {
            type: 'string',
            description: 'Direct link to the product page',
          },
        },
        required: ['name', 'monthly_price'],
      },
    },
  },
  required: ['products'],
};

// =============================================================================
// MTN PROVIDER CLASS
// =============================================================================

export class MTNProvider extends BaseProvider {
  constructor(provider: CompetitorProvider) {
    super(provider, {
      defaultProductType: 'mobile_contract',
      pricesIncludeVat: true,
      currencySymbol: 'R',
    });
  }

  /**
   * Get the extraction schema for MTN products.
   */
  getExtractionSchema(): Record<string, unknown> {
    // Check for custom schema in provider config
    if (this.provider.scrape_config?.extraction_schema) {
      return this.provider.scrape_config.extraction_schema;
    }
    return MTN_EXTRACTION_SCHEMA;
  }

  /**
   * Get the extraction prompt for MTN.
   */
  getExtractionPrompt(): string {
    return `Extract all mobile phone deals, contracts, and data packages from this MTN South Africa page.

For each product, extract:
- The full product name including device if applicable
- The monthly price in Rands (look for "pm", "per month", or similar)
- Any once-off/upfront payment required
- Contract term (usually 24 or 36 months)
- Data bundle included (GB or Unlimited)
- Network technology (5G, LTE, 4G)
- Voice minutes and SMS if specified
- Any promotional tags or special offers

Focus on:
- Device contracts (phone + contract bundle)
- SIM-only deals
- Data-only contracts
- Business deals if visible

Ignore:
- Prepaid bundles (we want contracts)
- Accessories
- Insurance add-ons`;
  }

  /**
   * Scrape products from MTN's website.
   */
  async scrape(): Promise<RawScrapedProduct[]> {
    const allProducts: RawScrapedProduct[] = [];
    const scrapeUrls = this.provider.scrape_urls;

    if (!scrapeUrls || scrapeUrls.length === 0) {
      console.warn('[MTNProvider] No scrape URLs configured');
      return [];
    }

    // Extract structured data from each configured URL
    for (const url of scrapeUrls) {
      try {
        console.log(`[MTNProvider] Scraping URL: ${url}`);

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
            `[MTNProvider] Extracted ${products.length} products from ${url}`
          );
        }
      } catch (error) {
        console.error(
          `[MTNProvider] Failed to scrape ${url}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Deduplicate by name + monthly price
    const uniqueProducts = this.deduplicateProducts(allProducts);

    console.log(
      `[MTNProvider] Total unique products: ${uniqueProducts.length} (from ${allProducts.length} raw)`
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

    return {
      external_id: (data.sku as string) || undefined,
      name,
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
   * Deduplicate products by name + price combination.
   */
  private deduplicateProducts(products: RawScrapedProduct[]): RawScrapedProduct[] {
    const seen = new Map<string, RawScrapedProduct>();

    for (const product of products) {
      const key = `${product.name.toLowerCase()}|${product.monthly_price || ''}`;

      if (!seen.has(key)) {
        seen.set(key, product);
      } else {
        // Prefer the one with more data
        const existing = seen.get(key)!;
        const existingFields = Object.keys(existing.raw || {}).length;
        const newFields = Object.keys(product.raw || {}).length;

        if (newFields > existingFields) {
          seen.set(key, product);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Override product type detection for MTN-specific patterns.
   */
  protected detectProductType(raw: RawScrapedProduct): 'mobile_contract' | 'data_only' | 'device' | 'prepaid' | null {
    const name = raw.name.toLowerCase();
    const dealType = ((raw.raw as Record<string, unknown>)?.deal_type as string || '').toLowerCase();

    // Check deal type from extraction
    if (dealType.includes('data only') || dealType.includes('data-only')) {
      return 'data_only';
    }
    if (dealType.includes('sim only') || dealType.includes('sim-only')) {
      return 'data_only';
    }
    if (dealType.includes('device') || dealType.includes('contract')) {
      return 'mobile_contract';
    }

    // Check name patterns
    if (name.includes('data only') || name.includes('sim only')) {
      return 'data_only';
    }

    // Has device = mobile contract
    if (raw.device_name) {
      return 'mobile_contract';
    }

    // Default for MTN
    return 'mobile_contract';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default MTNProvider;
