/**
 * Competitor Analysis Dashboard API
 *
 * GET /api/admin/competitor-analysis
 * Returns dashboard statistics, alerts, and pricing opportunities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DashboardStats, DashboardAlert, PricingOpportunity } from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all stats in parallel
    const [
      providersResult,
      productsResult,
      matchesResult,
      scrapeLogsResult,
      priceChangesResult,
    ] = await Promise.all([
      // Provider counts
      supabase
        .from('competitor_providers')
        .select('id, is_active, last_scraped_at'),

      // Product counts
      supabase
        .from('competitor_products')
        .select('id, is_current, monthly_price, provider_id'),

      // Match count
      supabase
        .from('product_competitor_matches')
        .select('id', { count: 'exact', head: true }),

      // Recent scrapes (last 7 days)
      supabase
        .from('competitor_scrape_logs')
        .select('id, status, started_at, provider_id, error_message')
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false }),

      // Price history for change detection (last 7 days)
      supabase
        .from('competitor_price_history')
        .select('id, competitor_product_id, monthly_price, recorded_at')
        .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Calculate provider stats
    const providers = providersResult.data || [];
    const totalProviders = providers.length;
    const activeProviders = providers.filter((p) => p.is_active).length;

    // Find last scrape time
    const lastScrapedProvider = providers
      .filter((p) => p.last_scraped_at)
      .sort((a, b) => new Date(b.last_scraped_at!).getTime() - new Date(a.last_scraped_at!).getTime())[0];
    const lastScrapeAt = lastScrapedProvider?.last_scraped_at || null;

    // Calculate product stats
    const products = productsResult.data || [];
    const totalProducts = products.length;
    const currentProducts = products.filter((p) => p.is_current).length;

    // Match count
    const totalMatches = matchesResult.count || 0;

    // Scrape stats
    const scrapeLogs = scrapeLogsResult.data || [];
    const scrapesLast7Days = scrapeLogs.length;

    // Price change count (simplified - count unique products with price history)
    const priceHistory = priceChangesResult.data || [];
    const uniqueProductsWithChanges = new Set(priceHistory.map((h) => h.competitor_product_id)).size;

    // Generate alerts
    const alerts: DashboardAlert[] = [];

    // Check for failed scrapes
    const failedScrapes = scrapeLogs.filter((s) => s.status === 'failed');
    for (const scrape of failedScrapes.slice(0, 3)) {
      alerts.push({
        id: scrape.id,
        type: 'scrape_failed',
        severity: 'warning',
        title: 'Scrape Failed',
        message: scrape.error_message || 'Unknown error during scrape',
        created_at: scrape.started_at,
      });
    }

    // Check for stale providers (not scraped in 14+ days)
    const staleThreshold = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const staleProviders = providers.filter(
      (p) => p.is_active && (!p.last_scraped_at || new Date(p.last_scraped_at).getTime() < staleThreshold)
    );
    if (staleProviders.length > 0) {
      alerts.push({
        id: 'stale-providers',
        type: 'scrape_failed',
        severity: 'info',
        title: 'Stale Data',
        message: `${staleProviders.length} provider(s) haven't been scraped in 14+ days`,
        created_at: new Date().toISOString(),
      });
    }

    // Pricing opportunities (placeholder - would need CircleTel product data)
    const opportunities: PricingOpportunity[] = [];

    const stats: DashboardStats = {
      total_providers: totalProviders,
      active_providers: activeProviders,
      total_products: totalProducts,
      current_products: currentProducts,
      total_matches: totalMatches,
      last_scrape_at: lastScrapeAt,
      scrapes_last_7_days: scrapesLast7Days,
      price_changes_last_7_days: uniqueProductsWithChanges,
      alerts,
      opportunities,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Competitor Analysis API] Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
