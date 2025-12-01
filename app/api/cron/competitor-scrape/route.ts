/**
 * Competitor Analysis Scheduled Scrape
 *
 * Vercel cron job that runs daily/weekly to scrape competitor prices.
 * Triggers scrapes for all active providers based on their configured frequency.
 *
 * Schedule: Daily at 3 AM SAST (1 AM UTC)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProvider } from '@/lib/competitor-analysis/providers';
import { PriceChangeDetector } from '@/lib/competitor-analysis/price-change-detector';
import { CompetitorAlertService } from '@/lib/competitor-analysis/alert-service';
import type {
  CompetitorProvider,
  CompetitorProduct,
  ScrapeJobResult,
  ScrapeStatus,
} from '@/lib/competitor-analysis/types';
import type { PriceChange } from '@/lib/competitor-analysis/price-change-detector';

// =============================================================================
// CRON CONFIGURATION
// =============================================================================

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[CronCompetitorScrape] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CronCompetitorScrape] Starting scheduled competitor scrape...');
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Get all active providers that are due for scraping
    const { data: providers, error: providerError } = await supabase
      .from('competitor_providers')
      .select('*')
      .eq('is_active', true);

    if (providerError) {
      console.error('[CronCompetitorScrape] Failed to fetch providers:', providerError);
      return NextResponse.json(
        { error: 'Failed to fetch providers', details: providerError.message },
        { status: 500 }
      );
    }

    if (!providers || providers.length === 0) {
      console.log('[CronCompetitorScrape] No active providers found');
      return NextResponse.json({ message: 'No active providers to scrape', results: [] });
    }

    // Filter providers based on their scrape frequency
    const providersToScrape = filterByFrequency(providers as CompetitorProvider[]);

    if (providersToScrape.length === 0) {
      console.log('[CronCompetitorScrape] No providers due for scraping');
      return NextResponse.json({
        message: 'No providers due for scraping',
        checked: providers.length,
        due: 0,
      });
    }

    console.log(`[CronCompetitorScrape] Found ${providersToScrape.length} providers due for scraping`);

    const results: ScrapeJobResult[] = [];
    const allPriceChanges: PriceChange[] = [];

    // Scrape each provider
    for (const provider of providersToScrape) {
      console.log(`[CronCompetitorScrape] Scraping ${provider.name}...`);

      const result = await scrapeProvider(provider, supabase);
      results.push(result);

      // Detect price changes if scrape was successful
      if (result.status === 'completed' && result.products_found > 0) {
        // Price changes are detected within scrapeProvider and stored
        // We'll collect them from the result
      }

      // If scrape failed, send alert
      if (result.status === 'failed' && result.errors.length > 0) {
        await CompetitorAlertService.sendScrapeFailureAlert(
          provider,
          result.errors.join(', ')
        );
      }
    }

    // Fetch recent price changes from the last scrape
    const { data: recentHistory } = await supabase
      .from('competitor_price_history')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });

    // Get current products for price change detection
    const { data: currentProducts } = await supabase
      .from('competitor_products')
      .select('*')
      .eq('is_current', true);

    if (currentProducts && recentHistory && providers) {
      const detectionResult = PriceChangeDetector.detectPriceChanges(
        currentProducts as CompetitorProduct[],
        recentHistory,
        providers as CompetitorProvider[]
      );

      // Send alerts for significant price drops
      if (detectionResult.significant_changes.length > 0) {
        await CompetitorAlertService.sendPriceDropAlerts(detectionResult.significant_changes);
        allPriceChanges.push(...detectionResult.significant_changes);
      }
    }

    // Send summary if there were any results
    if (results.length > 0) {
      await CompetitorAlertService.sendScrapesSummary(results, allPriceChanges);
    }

    const duration = Date.now() - startTime;
    console.log(`[CronCompetitorScrape] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `Scraped ${results.length} providers`,
      duration_ms: duration,
      results: results.map((r) => ({
        provider: r.provider_slug,
        status: r.status,
        products_found: r.products_found,
        products_new: r.products_new,
        products_updated: r.products_updated,
        errors: r.errors,
      })),
      price_changes: allPriceChanges.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CronCompetitorScrape] Error:', message);
    return NextResponse.json({ error: 'Scrape failed', details: message }, { status: 500 });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Filter providers based on their scrape frequency and last scrape time.
 */
function filterByFrequency(providers: CompetitorProvider[]): CompetitorProvider[] {
  const now = new Date();

  return providers.filter((provider) => {
    // If never scraped, include it
    if (!provider.last_scraped_at) {
      return true;
    }

    const lastScrape = new Date(provider.last_scraped_at);
    const hoursSinceLastScrape = (now.getTime() - lastScrape.getTime()) / (1000 * 60 * 60);

    switch (provider.scrape_frequency) {
      case 'daily':
        return hoursSinceLastScrape >= 22; // At least 22 hours
      case 'weekly':
        return hoursSinceLastScrape >= 166; // At least ~7 days
      case 'manual':
        return false; // Never auto-scrape manual providers
      default:
        return hoursSinceLastScrape >= 166; // Default to weekly
    }
  });
}

/**
 * Scrape a single provider and save results.
 */
async function scrapeProvider(
  provider: CompetitorProvider,
  supabase: any
): Promise<ScrapeJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Create scrape log entry
  const { data: logEntry, error: logError } = await supabase
    .from('competitor_scrape_logs')
    .insert({
      provider_id: provider.id,
      status: 'running' as ScrapeStatus,
      trigger_type: 'scheduled',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError) {
    console.error(`[CronCompetitorScrape] Failed to create log entry for ${provider.name}:`, logError);
  }

  try {
    // Get provider instance
    const providerInstance = createProvider(provider);

    if (!providerInstance) {
      throw new Error(`No scraper implementation for provider: ${provider.slug}`);
    }

    // Execute scrape and get raw products
    const rawProducts = await providerInstance.scrape();

    if (rawProducts.length === 0) {
      console.log(`[CronCompetitorScrape] No products found for ${provider.name}`);
    }

    // Normalize products using the provider's normalization logic
    const normalizedProducts = rawProducts.map((raw) =>
      providerInstance.normalizeProduct(raw)
    );

    // Get existing products for comparison
    const { data: existingProducts } = await supabase
      .from('competitor_products')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_current', true);

    // Mark old products as not current
    await supabase
      .from('competitor_products')
      .update({ is_current: false })
      .eq('provider_id', provider.id)
      .eq('is_current', true);

    // Insert new products
    let newCount = 0;
    let updatedCount = 0;

    for (const product of normalizedProducts) {
      const existingProduct = (existingProducts || []).find(
        (p: CompetitorProduct) => p.external_id === product.external_id || p.product_name === product.product_name
      );

      // Insert product
      const { data: insertedProduct, error: insertError } = await supabase
        .from('competitor_products')
        .insert({
          provider_id: provider.id,
          ...product,
          is_current: true,
          scraped_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        errors.push(`Failed to insert product ${product.product_name}: ${insertError.message}`);
        continue;
      }

      if (existingProduct) {
        updatedCount++;
      } else {
        newCount++;
      }

      // Record price history
      if (insertedProduct && product.monthly_price) {
        await supabase.from('competitor_price_history').insert({
          competitor_product_id: insertedProduct.id,
          monthly_price: product.monthly_price,
          once_off_price: product.once_off_price,
          recorded_at: new Date().toISOString(),
        });
      }
    }

    // Update provider last_scraped_at
    await supabase
      .from('competitor_providers')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', provider.id);

    // Update scrape log
    const duration = Date.now() - startTime;
    if (logEntry) {
      await supabase
        .from('competitor_scrape_logs')
        .update({
          status: 'completed' as ScrapeStatus,
          products_found: normalizedProducts.length,
          products_new: newCount,
          products_updated: updatedCount,
          completed_at: new Date().toISOString(),
          error_message: errors.length > 0 ? errors.join('; ') : null,
        })
        .eq('id', logEntry.id);
    }

    return {
      provider_id: provider.id,
      provider_slug: provider.slug,
      status: 'completed',
      products_found: normalizedProducts.length,
      products_new: newCount,
      products_updated: updatedCount,
      products_unchanged: normalizedProducts.length - newCount - updatedCount,
      credits_used: 0, // Firecrawl credit tracking handled separately
      duration_ms: duration,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    // Update scrape log with failure
    if (logEntry) {
      await supabase
        .from('competitor_scrape_logs')
        .update({
          status: 'failed' as ScrapeStatus,
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    return {
      provider_id: provider.id,
      provider_slug: provider.slug,
      status: 'failed',
      products_found: 0,
      products_new: 0,
      products_updated: 0,
      products_unchanged: 0,
      credits_used: 0,
      duration_ms: Date.now() - startTime,
      errors,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max
