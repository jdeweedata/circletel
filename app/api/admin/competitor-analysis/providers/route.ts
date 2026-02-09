/**
 * Competitor Providers API
 *
 * GET /api/admin/competitor-analysis/providers
 * Returns list of all competitor providers with stats.
 *
 * POST /api/admin/competitor-analysis/providers
 * Creates a new competitor provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { CreateProviderRequest, ProviderStats } from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query params
    const activeOnly = searchParams.get('active') === 'true';
    const providerType = searchParams.get('type'); // 'mobile' | 'fibre' | 'both'

    // Use the stats view for comprehensive data
    let query = supabase
      .from('v_competitor_provider_stats')
      .select('*')
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (providerType) {
      query = query.eq('provider_type', providerType);
    }

    const { data, error } = await query;

    if (error) {
      apiLogger.error('[Providers API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch providers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data as ProviderStats[],
      total: data?.length || 0,
    });
  } catch (error) {
    apiLogger.error('[Providers API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateProviderRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.website || !body.provider_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, website, provider_type' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    // Validate provider_type
    if (!['mobile', 'fibre', 'both'].includes(body.provider_type)) {
      return NextResponse.json(
        { error: 'provider_type must be: mobile, fibre, or both' },
        { status: 400 }
      );
    }

    // Validate scrape_frequency if provided
    if (body.scrape_frequency && !['daily', 'weekly', 'manual'].includes(body.scrape_frequency)) {
      return NextResponse.json(
        { error: 'scrape_frequency must be: daily, weekly, or manual' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('competitor_providers')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A provider with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the provider
    const { data, error } = await supabase
      .from('competitor_providers')
      .insert({
        name: body.name,
        slug: body.slug,
        website: body.website,
        logo_url: body.logo_url || null,
        provider_type: body.provider_type,
        scrape_urls: body.scrape_urls || [],
        scrape_config: body.scrape_config || {},
        is_active: body.is_active ?? true,
        scrape_frequency: body.scrape_frequency || 'weekly',
      })
      .select()
      .single();

    if (error) {
      apiLogger.error('[Providers API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create provider' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    apiLogger.error('[Providers API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}
