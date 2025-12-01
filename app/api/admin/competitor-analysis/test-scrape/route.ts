/**
 * Test Scrape API Endpoint
 *
 * Allows manual testing of competitor scraping for a single provider.
 * For development/testing only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProvider } from '@/lib/competitor-analysis/providers';
import type { CompetitorProvider } from '@/lib/competitor-analysis/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider_slug, limit_urls } = body;

    if (!provider_slug) {
      return NextResponse.json(
        { error: 'provider_slug is required' },
        { status: 400 }
      );
    }

    console.log(`[TestScrape] Starting test scrape for: ${provider_slug}`);

    const supabase = await createClient();

    // Get provider from database
    const { data: provider, error: providerError } = await supabase
      .from('competitor_providers')
      .select('*')
      .eq('slug', provider_slug)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: `Provider not found: ${provider_slug}` },
        { status: 404 }
      );
    }

    console.log(`[TestScrape] Provider found: ${provider.name}`);
    console.log(`[TestScrape] Scrape URLs: ${provider.scrape_urls?.join(', ')}`);

    // Optionally limit URLs for testing
    let providerToUse = provider as CompetitorProvider;
    if (limit_urls && provider.scrape_urls?.length > limit_urls) {
      providerToUse = {
        ...provider,
        scrape_urls: provider.scrape_urls.slice(0, limit_urls),
      };
      console.log(`[TestScrape] Limited to ${limit_urls} URL(s)`);
    }

    // Create provider instance
    const providerInstance = createProvider(providerToUse);

    if (!providerInstance) {
      return NextResponse.json(
        { error: `No scraper implementation for: ${provider_slug}` },
        { status: 400 }
      );
    }

    // Run the scrape
    const startTime = Date.now();
    const rawProducts = await providerInstance.scrape();
    const scrapeTime = Date.now() - startTime;

    console.log(`[TestScrape] Scraped ${rawProducts.length} raw products in ${scrapeTime}ms`);

    // Normalize products
    const normalizedProducts = rawProducts.map((raw) => {
      try {
        return providerInstance.normalizeProduct(raw);
      } catch (e) {
        console.error(`[TestScrape] Failed to normalize: ${raw.name}`, e);
        return null;
      }
    }).filter(Boolean);

    console.log(`[TestScrape] Normalized ${normalizedProducts.length} products`);

    return NextResponse.json({
      success: true,
      provider: {
        name: provider.name,
        slug: provider.slug,
        urls_scraped: providerToUse.scrape_urls?.length || 0,
      },
      timing: {
        scrape_ms: scrapeTime,
        total_ms: Date.now() - startTime,
      },
      results: {
        raw_count: rawProducts.length,
        normalized_count: normalizedProducts.length,
        raw_products: rawProducts.slice(0, 10), // First 10 raw
        normalized_products: normalizedProducts.slice(0, 10), // First 10 normalized
      },
    });
  } catch (error) {
    console.error('[TestScrape] Error:', error);
    return NextResponse.json(
      {
        error: 'Scrape failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for testing
