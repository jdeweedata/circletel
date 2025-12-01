/**
 * Competitor Scrape Inngest Function
 *
 * Handles long-running competitor scraping jobs with:
 * - Automatic retries on failure
 * - Step-based execution for reliability
 * - Progress tracking via database updates
 * - Price change detection and alerts
 *
 * This replaces the fire-and-forget background job approach
 * with a robust, observable, and retryable system.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  createProvider,
  isProviderSupported,
  getSessionCreditsUsed,
} from '@/lib/competitor-analysis';
import type {
  CompetitorProvider,
  NormalizedProduct,
} from '@/lib/competitor-analysis/types';

// =============================================================================
// SCRAPE FUNCTION
// =============================================================================

/**
 * Main competitor scrape function.
 * Triggered by 'competitor/scrape.requested' events.
 */
export const competitorScrapeFunction = inngest.createFunction(
  {
    id: 'competitor-scrape',
    name: 'Competitor Product Scrape',
    // Retry configuration
    retries: 2,
    // Cancel if running too long (10 minutes max)
    cancelOn: [
      {
        event: 'competitor/scrape.cancelled',
        match: 'data.scrape_log_id',
      },
    ],
  },
  { event: 'competitor/scrape.requested' },
  async ({ event, step }) => {
    const { provider_id, provider_slug, provider_name, scrape_log_id, scrape_urls } = event.data;

    // Step 1: Update status to running
    await step.run('update-status-running', async () => {
      const supabase = await createClient();
      await supabase
        .from('competitor_scrape_logs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', scrape_log_id);

      console.log(`[Inngest] Started scrape for ${provider_name} (${scrape_log_id})`);
    });

    // Step 2: Get provider details
    const provider = await step.run('get-provider', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('competitor_providers')
        .select('*')
        .eq('id', provider_id)
        .single();

      if (error || !data) {
        throw new Error(`Provider not found: ${provider_id}`);
      }

      return data as CompetitorProvider;
    });

    // Step 3: Check if provider is supported
    await step.run('validate-provider', async () => {
      if (!isProviderSupported(provider_slug)) {
        throw new Error(`No scraper implementation for ${provider_slug}`);
      }
    });

    // Step 4: Run the scrape (this is the long-running part)
    const scrapeResult = await step.run('execute-scrape', async () => {
      const scraper = createProvider(provider);
      if (!scraper) {
        throw new Error(`Failed to create scraper for ${provider_slug}`);
      }

      const result = await scraper.runScrapeJob();
      return result;
    });

    // Step 5: Get scraped products if successful
    let products: NormalizedProduct[] = [];
    if (scrapeResult.products_found > 0) {
      products = await step.run('get-products', async () => {
        const scraper = createProvider(provider);
        if (!scraper) return [];

        try {
          const rawProducts = await scraper.scrape();
          return rawProducts.map((raw) => scraper.normalizeProduct(raw));
        } catch {
          return [];
        }
      });
    }

    // Step 6: Save products to database
    const saveResult = await step.run('save-products', async () => {
      if (products.length === 0) {
        return { newCount: 0, updatedCount: 0, priceChanges: [] };
      }

      const supabase = await createClient();
      let newCount = 0;
      let updatedCount = 0;
      const priceChanges: Array<{
        product_name: string;
        old_price: number;
        new_price: number;
        product_url?: string;
      }> = [];

      for (const product of products) {
        try {
          // Check if product exists
          let existingQuery = supabase
            .from('competitor_products')
            .select('id, monthly_price, once_off_price')
            .eq('provider_id', provider_id)
            .eq('is_current', true);

          if (product.external_id) {
            existingQuery = existingQuery.eq('external_id', product.external_id);
          } else {
            existingQuery = existingQuery.eq('product_name', product.product_name);
          }

          const { data: existing } = await existingQuery.single();

          if (existing) {
            // Check for price changes
            const priceChanged =
              existing.monthly_price !== product.monthly_price ||
              existing.once_off_price !== product.once_off_price;

            if (priceChanged && existing.monthly_price && product.monthly_price) {
              priceChanges.push({
                product_name: product.product_name,
                old_price: existing.monthly_price,
                new_price: product.monthly_price,
                product_url: product.source_url || undefined,
              });

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
                provider_id: provider_id,
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
          console.error('[Inngest] Failed to save product:', product.product_name, error);
        }
      }

      return { newCount, updatedCount, priceChanges };
    });

    // Step 7: Update scrape log with results
    await step.run('update-scrape-log', async () => {
      const supabase = await createClient();
      await supabase
        .from('competitor_scrape_logs')
        .update({
          status: scrapeResult.status,
          products_found: scrapeResult.products_found,
          products_new: saveResult.newCount,
          products_updated: saveResult.updatedCount,
          firecrawl_credits_used: scrapeResult.credits_used,
          completed_at: new Date().toISOString(),
          error_message: scrapeResult.errors.length > 0 ? scrapeResult.errors.join('; ') : null,
        })
        .eq('id', scrape_log_id);

      // Update provider's last_scraped_at
      if (scrapeResult.status === 'completed') {
        await supabase
          .from('competitor_providers')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', provider_id);
      }
    });

    // Step 8: Send price change alerts if any
    if (saveResult.priceChanges.length > 0) {
      await step.run('send-price-alerts', async () => {
        for (const change of saveResult.priceChanges) {
          const changePercent = ((change.new_price - change.old_price) / change.old_price) * 100;

          // Only alert on significant changes (>5%)
          if (Math.abs(changePercent) >= 5) {
            await inngest.send({
              name: 'competitor/price.alert',
              data: {
                provider_id,
                provider_name,
                product_name: change.product_name,
                old_price: change.old_price,
                new_price: change.new_price,
                change_percent: changePercent,
                product_url: change.product_url,
              },
            });
          }
        }
      });
    }

    // Step 9: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'competitor/scrape.completed',
        data: {
          provider_id,
          provider_slug,
          scrape_log_id,
          products_found: scrapeResult.products_found,
          products_new: saveResult.newCount,
          products_updated: saveResult.updatedCount,
          credits_used: scrapeResult.credits_used,
          duration_ms: scrapeResult.duration_ms,
        },
      });
    });

    console.log(
      `[Inngest] Completed scrape for ${provider_name}: ` +
        `${scrapeResult.products_found} found, ${saveResult.newCount} new, ${saveResult.updatedCount} updated`
    );

    return {
      success: true,
      provider: provider_name,
      products_found: scrapeResult.products_found,
      products_new: saveResult.newCount,
      products_updated: saveResult.updatedCount,
      price_changes: saveResult.priceChanges.length,
    };
  }
);

// =============================================================================
// PRICE ALERT FUNCTION
// =============================================================================

/**
 * Handle price change alerts.
 * Could send emails, Slack notifications, etc.
 */
export const priceAlertFunction = inngest.createFunction(
  {
    id: 'competitor-price-alert',
    name: 'Competitor Price Alert',
  },
  { event: 'competitor/price.alert' },
  async ({ event, step }) => {
    const { provider_name, product_name, old_price, new_price, change_percent } = event.data;

    await step.run('log-price-alert', async () => {
      const direction = change_percent > 0 ? 'increased' : 'decreased';
      console.log(
        `[Price Alert] ${provider_name} - ${product_name}: ` +
          `R${old_price} → R${new_price} (${direction} ${Math.abs(change_percent).toFixed(1)}%)`
      );

      // TODO: Send email notification
      // TODO: Send Slack notification
      // TODO: Update dashboard alerts
    });

    return { alerted: true };
  }
);

// =============================================================================
// SCHEDULED SCRAPE FUNCTION
// =============================================================================

/**
 * Scheduled function to scrape all providers based on their frequency.
 * Runs daily and checks which providers are due for scraping.
 */
export const scheduledScrapeFunction = inngest.createFunction(
  {
    id: 'competitor-scheduled-scrape',
    name: 'Scheduled Competitor Scrape',
  },
  // Run daily at 6 AM SAST (4 AM UTC)
  { cron: '0 4 * * *' },
  async ({ step }) => {
    // Get providers due for scraping
    const providers = await step.run('get-due-providers', async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('competitor_providers')
        .select('*')
        .eq('is_active', true);

      if (!data) return [];

      const now = new Date();
      return data.filter((provider) => {
        if (!provider.last_scraped_at) return true;

        const lastScraped = new Date(provider.last_scraped_at);
        const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);

        switch (provider.scrape_frequency) {
          case 'hourly':
            return hoursSinceLastScrape >= 1;
          case 'daily':
            return hoursSinceLastScrape >= 24;
          case 'weekly':
            return hoursSinceLastScrape >= 168;
          case 'monthly':
            return hoursSinceLastScrape >= 720;
          default:
            return hoursSinceLastScrape >= 24;
        }
      });
    });

    if (providers.length === 0) {
      return { message: 'No providers due for scraping', count: 0 };
    }

    // Create scrape jobs for each provider
    const jobs = await step.run('create-scrape-jobs', async () => {
      const supabase = await createClient();
      const createdJobs: string[] = [];

      for (const provider of providers) {
        if (!isProviderSupported(provider.slug)) continue;

        // Create scrape log entry
        const { data: logEntry } = await supabase
          .from('competitor_scrape_logs')
          .insert({
            provider_id: provider.id,
            status: 'pending',
            trigger_type: 'scheduled',
          })
          .select('id')
          .single();

        if (logEntry) {
          createdJobs.push(logEntry.id);

          // Send scrape event
          await inngest.send({
            name: 'competitor/scrape.requested',
            data: {
              provider_id: provider.id,
              provider_slug: provider.slug,
              provider_name: provider.name,
              scrape_log_id: logEntry.id,
              scrape_urls: provider.scrape_urls || [],
            },
          });
        }
      }

      return createdJobs;
    });

    return {
      message: `Triggered ${jobs.length} scrape jobs`,
      count: jobs.length,
      job_ids: jobs,
    };
  }
);
