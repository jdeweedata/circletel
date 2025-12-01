/**
 * Competitor Analysis Scheduled Scrape (Inngest-powered)
 *
 * Vercel cron job that triggers Inngest to scrape competitor prices.
 * This is a lightweight trigger - the actual work is done by Inngest functions
 * which handle retries, timeouts, and reliable execution.
 *
 * Schedule: Daily at 3 AM SAST (1 AM UTC)
 *
 * @version 2.0.0 - Now uses Inngest for reliable background processing
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { isProviderSupported } from '@/lib/competitor-analysis';
import type { CompetitorProvider } from '@/lib/competitor-analysis/types';

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

  console.log('[CronCompetitorScrape] Starting scheduled competitor scrape via Inngest...');

  try {
    const supabase = await createClient();

    // Get all active providers
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

    // Filter to only supported providers
    const supportedProviders = providersToScrape.filter((p) => isProviderSupported(p.slug));

    if (supportedProviders.length === 0) {
      console.log('[CronCompetitorScrape] No supported providers to scrape');
      return NextResponse.json({
        message: 'No supported providers to scrape',
        checked: providersToScrape.length,
        supported: 0,
      });
    }

    console.log(`[CronCompetitorScrape] Queueing ${supportedProviders.length} providers for scraping`);

    // Create scrape log entries and queue Inngest events
    const scrapeLogIds: string[] = [];
    const inngestEvents: Array<{
      name: 'competitor/scrape.requested';
      data: {
        provider_id: string;
        provider_slug: string;
        provider_name: string;
        scrape_log_id: string;
        scrape_urls: string[];
        triggered_by: string;
      };
    }> = [];

    for (const provider of supportedProviders) {
      const { data: logEntry, error: logError } = await supabase
        .from('competitor_scrape_logs')
        .insert({
          provider_id: provider.id,
          status: 'pending',
          trigger_type: 'scheduled',
        })
        .select('id')
        .single();

      if (logError) {
        console.error(`[CronCompetitorScrape] Failed to create log for ${provider.name}:`, logError);
        continue;
      }

      scrapeLogIds.push(logEntry.id);

      inngestEvents.push({
        name: 'competitor/scrape.requested',
        data: {
          provider_id: provider.id,
          provider_slug: provider.slug,
          provider_name: provider.name,
          scrape_log_id: logEntry.id,
          scrape_urls: provider.scrape_urls || [],
          triggered_by: 'cron',
        },
      });
    }

    // Send all events to Inngest
    if (inngestEvents.length > 0) {
      try {
        await inngest.send(inngestEvents);
        console.log(`[CronCompetitorScrape] Sent ${inngestEvents.length} jobs to Inngest`);
      } catch (inngestError) {
        console.error('[CronCompetitorScrape] Failed to send to Inngest:', inngestError);
        
        // Mark jobs as failed
        for (const logId of scrapeLogIds) {
          await supabase
            .from('competitor_scrape_logs')
            .update({
              status: 'failed',
              error_message: 'Failed to queue background job',
              completed_at: new Date().toISOString(),
            })
            .eq('id', logId);
        }
        
        return NextResponse.json(
          { error: 'Failed to queue scrape jobs' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${inngestEvents.length} providers for scraping`,
      providers: supportedProviders.map((p) => p.name),
      scrape_ids: scrapeLogIds,
      queue: 'inngest',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CronCompetitorScrape] Error:', message);
    return NextResponse.json({ error: 'Failed to trigger scrapes', details: message }, { status: 500 });
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
      case 'hourly':
        return hoursSinceLastScrape >= 1;
      case 'daily':
        return hoursSinceLastScrape >= 22;
      case 'weekly':
        return hoursSinceLastScrape >= 166;
      case 'monthly':
        return hoursSinceLastScrape >= 720;
      case 'manual':
        return false;
      default:
        return hoursSinceLastScrape >= 166;
    }
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export const runtime = 'nodejs';
export const maxDuration = 30; // Only needs 30s now - just queues jobs
