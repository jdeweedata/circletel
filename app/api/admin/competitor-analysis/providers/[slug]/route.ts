/**
 * Single Competitor Provider API
 *
 * GET /api/admin/competitor-analysis/providers/[slug]
 * Returns a single provider with full details and products.
 *
 * PATCH /api/admin/competitor-analysis/providers/[slug]
 * Updates a provider's configuration.
 *
 * DELETE /api/admin/competitor-analysis/providers/[slug]
 * Deletes a provider and all associated data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { UpdateProviderRequest } from '@/lib/competitor-analysis/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    // Get provider with stats
    const { data: provider, error: providerError } = await supabase
      .from('v_competitor_provider_stats')
      .select('*')
      .eq('slug', slug)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get full provider details (including scrape_urls and scrape_config)
    const { data: fullProvider } = await supabase
      .from('competitor_providers')
      .select('scrape_urls, scrape_config')
      .eq('slug', slug)
      .single();

    // Get recent products for this provider
    const { data: products } = await supabase
      .from('competitor_products')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_current', true)
      .order('product_name')
      .limit(50);

    // Get recent scrape logs
    const { data: scrapeLogs } = await supabase
      .from('competitor_scrape_logs')
      .select('*')
      .eq('provider_id', provider.id)
      .order('started_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      ...provider,
      scrape_urls: fullProvider?.scrape_urls || [],
      scrape_config: fullProvider?.scrape_config || {},
      recent_products: products || [],
      scrape_history: scrapeLogs || [],
    });
  } catch (error) {
    apiLogger.error('[Provider API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();
    const body: UpdateProviderRequest = await request.json();

    // Verify provider exists
    const { data: existing, error: existError } = await supabase
      .from('competitor_providers')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existError || !existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.website !== undefined) updates.website = body.website;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.provider_type !== undefined) {
      if (!['mobile', 'fibre', 'both'].includes(body.provider_type)) {
        return NextResponse.json(
          { error: 'provider_type must be: mobile, fibre, or both' },
          { status: 400 }
        );
      }
      updates.provider_type = body.provider_type;
    }
    if (body.scrape_urls !== undefined) updates.scrape_urls = body.scrape_urls;
    if (body.scrape_config !== undefined) updates.scrape_config = body.scrape_config;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.scrape_frequency !== undefined) {
      if (!['daily', 'weekly', 'manual'].includes(body.scrape_frequency)) {
        return NextResponse.json(
          { error: 'scrape_frequency must be: daily, weekly, or manual' },
          { status: 400 }
        );
      }
      updates.scrape_frequency = body.scrape_frequency;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the provider
    const { data, error } = await supabase
      .from('competitor_providers')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Provider API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update provider' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    apiLogger.error('[Provider API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    // Verify provider exists
    const { data: existing, error: existError } = await supabase
      .from('competitor_providers')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (existError || !existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Delete the provider (cascade will handle related records)
    const { error } = await supabase
      .from('competitor_providers')
      .delete()
      .eq('slug', slug);

    if (error) {
      apiLogger.error('[Provider API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete provider' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Provider "${existing.name}" deleted successfully`,
    });
  } catch (error) {
    apiLogger.error('[Provider API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
}
