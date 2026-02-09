/**
 * Scrape Trigger API
 *
 * POST /api/admin/competitor-analysis/scrape
 * Triggers a scrape job for one or all providers using Inngest for reliable
 * background processing with automatic retries.
 *
 * GET /api/admin/competitor-analysis/scrape
 * Returns recent scrape logs.
 *
 * @version 2.0.0 - Now uses Inngest for background job processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { isProviderSupported } from '@/lib/competitor-analysis';
import { inngest } from '@/lib/inngest';
import type {
  TriggerScrapeRequest,
  CompetitorProvider,
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
      apiLogger.error('[Scrape API] Query error:', error);
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
    apiLogger.error('[Scrape API] GET error:', error);
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

    // Create scrape log entries and send Inngest events
    const scrapeLogIds: string[] = [];
    const inngestEvents: Array<{
      name: 'competitor/scrape.requested';
      data: {
        provider_id: string;
        provider_slug: string;
        provider_name: string;
        scrape_log_id: string;
        scrape_urls: string[];
        triggered_by?: string;
      };
    }> = [];

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
        apiLogger.error('[Scrape API] Failed to create log entry:', logError);
        continue;
      }

      scrapeLogIds.push(logEntry.id);

      // Queue Inngest event for this provider
      inngestEvents.push({
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

    // Send all events to Inngest for reliable background processing
    if (inngestEvents.length > 0) {
      try {
        await inngest.send(inngestEvents);
        apiLogger.info(`[Scrape API] Sent ${inngestEvents.length} scrape jobs to Inngest`);
      } catch (inngestError) {
        apiLogger.error('[Scrape API] Failed to send to Inngest:', inngestError);
        // Fall back to marking jobs as failed
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
      message: `Started scrape for ${supportedProviders.length} provider(s)`,
      scrape_ids: scrapeLogIds,
      providers: supportedProviders.map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
      queue: 'inngest',
    });
  } catch (error) {
    apiLogger.error('[Scrape API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger scrape' },
      { status: 500 }
    );
  }
}

// =============================================================================
// LEGACY FUNCTIONS REMOVED
// =============================================================================
// The runScrapeJobs, getScrapedProducts, and saveProducts functions have been
// moved to the Inngest function at lib/inngest/functions/competitor-scrape.ts
// This provides reliable background processing with automatic retries.
