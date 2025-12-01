/**
 * Scrape Trigger API
 *
 * POST /api/admin/competitor-analysis/scrape
 * Triggers a scrape job for one or all providers.
 *
 * GET /api/admin/competitor-analysis/scrape
 * Returns recent scrape logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createProvider,
  isProviderSupported,
  getSessionCreditsUsed,
} from '@/lib/competitor-analysis';
import type {
  TriggerScrapeRequest,
  CompetitorProvider,
  NormalizedProduct,
} from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const providerId = searchParams.get('provider_id');

    let query = supabase
      .from('competitor_scrape_logs')
      .select(`
        *,
        competitor_providers (
          name,
          slug
        )
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Scrape API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scrape logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('[Scrape API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrape logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: TriggerScrapeRequest = await request.json();

    // Determine which providers to scrape
    let providersToScrape: CompetitorProvider[] = [];

    if (body.all) {
      // Scrape all active providers
      const { data, error } = await supabase
        .from('competitor_providers')
        .select('*')
        .eq('is_active', true);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch providers' },
          { status: 500 }
        );
      }

      providersToScrape = data || [];
    } else if (body.provider_id) {
      // Scrape specific provider by ID
      const { data, error } = await supabase
        .from('competitor_providers')
        .select('*')
        .eq('id', body.provider_id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      providersToScrape = [data];
    } else if (body.provider_slug) {
      // Scrape specific provider by slug
      const { data, error } = await supabase
        .from('competitor_providers')
        .select('*')
        .eq('slug', body.provider_slug)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      providersToScrape = [data];
    } else {
      return NextResponse.json(
        { error: 'Specify provider_id, provider_slug, or all=true' },
        { status: 400 }
      );
    }

    if (providersToScrape.length === 0) {
      return NextResponse.json(
        { error: 'No providers to scrape' },
        { status: 400 }
      );
    }

    // Filter to supported providers only
    const supportedProviders = providersToScrape.filter((p) =>
      isProviderSupported(p.slug)
    );

    if (supportedProviders.length === 0) {
      return NextResponse.json(
        { error: 'No supported scraper implementations for the selected providers' },
        { status: 400 }
      );
    }

    // Create scrape log entries
    const scrapeLogIds: string[] = [];

    for (const provider of supportedProviders) {
      const { data: logEntry, error: logError } = await supabase
        .from('competitor_scrape_logs')
        .insert({
          provider_id: provider.id,
          status: 'pending',
          trigger_type: 'manual',
        })
        .select('id')
        .single();

      if (logError) {
        console.error('[Scrape API] Failed to create log entry:', logError);
        continue;
      }

      scrapeLogIds.push(logEntry.id);
    }

    // Start scraping in background (don't await)
    // In production, this would be a queue job
    runScrapeJobs(supportedProviders, scrapeLogIds, supabase).catch((error) => {
      console.error('[Scrape API] Background scrape error:', error);
    });

    return NextResponse.json({
      message: `Started scrape for ${supportedProviders.length} provider(s)`,
      scrape_ids: scrapeLogIds,
      providers: supportedProviders.map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
    });
  } catch (error) {
    console.error('[Scrape API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger scrape' },
      { status: 500 }
    );
  }
}

/**
 * Run scrape jobs for multiple providers.
 * Updates log entries and saves products to database.
 */
async function runScrapeJobs(
  providers: CompetitorProvider[],
  logIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const logId = logIds[i];

    try {
      // Update status to running
      await supabase
        .from('competitor_scrape_logs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', logId);

      // Get the scraper instance
      const scraper = createProvider(provider);
      if (!scraper) {
        throw new Error(`No scraper implementation for ${provider.slug}`);
      }

      // Run the scrape job
      const result = await scraper.runScrapeJob();

      // Save products to database
      const { newCount, updatedCount } = await saveProducts(
        supabase,
        provider.id,
        result.products_found > 0 ? await getScrapedProducts(scraper) : []
      );

      // Update log entry with results
      await supabase
        .from('competitor_scrape_logs')
        .update({
          status: result.status,
          products_found: result.products_found,
          products_new: newCount,
          products_updated: updatedCount,
          firecrawl_credits_used: result.credits_used,
          completed_at: new Date().toISOString(),
          error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
        })
        .eq('id', logId);

      // Update provider's last_scraped_at
      if (result.status === 'completed') {
        await supabase
          .from('competitor_providers')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', provider.id);
      }
    } catch (error) {
      console.error(`[Scrape] Failed for ${provider.slug}:`, error);

      // Update log entry with error
      await supabase
        .from('competitor_scrape_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq('id', logId);
    }
  }
}

/**
 * Get scraped products from a scraper (re-runs scrape to get normalized products).
 * In a real implementation, this would be cached from the scrape job.
 */
async function getScrapedProducts(
  scraper: ReturnType<typeof createProvider>
): Promise<NormalizedProduct[]> {
  if (!scraper) return [];

  try {
    const rawProducts = await scraper.scrape();
    return rawProducts.map((raw) => scraper.normalizeProduct(raw));
  } catch {
    return [];
  }
}

/**
 * Save normalized products to database.
 * Updates existing products or creates new ones.
 */
async function saveProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  providerId: string,
  products: NormalizedProduct[]
): Promise<{ newCount: number; updatedCount: number }> {
  let newCount = 0;
  let updatedCount = 0;

  for (const product of products) {
    try {
      // Check if product exists (by external_id or name)
      let existingQuery = supabase
        .from('competitor_products')
        .select('id, monthly_price, once_off_price')
        .eq('provider_id', providerId)
        .eq('is_current', true);

      if (product.external_id) {
        existingQuery = existingQuery.eq('external_id', product.external_id);
      } else {
        existingQuery = existingQuery.eq('product_name', product.product_name);
      }

      const { data: existing } = await existingQuery.single();

      if (existing) {
        // Check if price changed
        const priceChanged =
          existing.monthly_price !== product.monthly_price ||
          existing.once_off_price !== product.once_off_price;

        if (priceChanged) {
          // Record price history
          await supabase.from('competitor_price_history').insert({
            competitor_product_id: existing.id,
            monthly_price: product.monthly_price,
            once_off_price: product.once_off_price,
          });
        }

        // Update existing product
        await supabase
          .from('competitor_products')
          .update({
            product_name: product.product_name,
            product_type: product.product_type,
            monthly_price: product.monthly_price,
            once_off_price: product.once_off_price,
            price_includes_vat: product.price_includes_vat,
            contract_term: product.contract_term,
            data_bundle: product.data_bundle,
            data_gb: product.data_gb,
            speed_mbps: product.speed_mbps,
            device_name: product.device_name,
            technology: product.technology,
            source_url: product.source_url,
            raw_data: product.raw_data,
            scraped_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        updatedCount++;
      } else {
        // Create new product
        const { data: newProduct } = await supabase
          .from('competitor_products')
          .insert({
            provider_id: providerId,
            external_id: product.external_id,
            product_name: product.product_name,
            product_type: product.product_type,
            monthly_price: product.monthly_price,
            once_off_price: product.once_off_price,
            price_includes_vat: product.price_includes_vat,
            contract_term: product.contract_term,
            data_bundle: product.data_bundle,
            data_gb: product.data_gb,
            speed_mbps: product.speed_mbps,
            device_name: product.device_name,
            technology: product.technology,
            source_url: product.source_url,
            raw_data: product.raw_data,
            is_current: true,
          })
          .select('id')
          .single();

        if (newProduct) {
          // Record initial price history
          await supabase.from('competitor_price_history').insert({
            competitor_product_id: newProduct.id,
            monthly_price: product.monthly_price,
            once_off_price: product.once_off_price,
          });
        }

        newCount++;
      }
    } catch (error) {
      console.error('[Scrape] Failed to save product:', product.product_name, error);
    }
  }

  return { newCount, updatedCount };
}
