/**
 * Customer Search API for Device Linking
 * GET /api/admin/search/customers?q=<query>
 *
 * Searches both consumer_orders and corporate_sites tables
 * Returns unified results for device-customer linking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

interface SearchResult {
  id: string;
  type: 'consumer' | 'corporate';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        error: 'Search query must be at least 2 characters'
      }, { status: 400 });
    }

    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for admin check and DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchPattern = `%${query}%`;
    const results: SearchResult[] = [];

    // Search consumer orders
    const { data: consumerOrders, error: consumerError } = await supabaseAdmin
      .from('consumer_orders')
      .select('id, first_name, last_name, email, phone, street_address, suburb, city')
      .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`)
      .eq('status', 'active')
      .limit(10);

    if (consumerError) {
      apiLogger.error('[Search] Consumer search failed', { error: consumerError.message });
    } else if (consumerOrders) {
      for (const order of consumerOrders) {
        results.push({
          id: order.id,
          type: 'consumer',
          name: `${order.first_name} ${order.last_name}`,
          email: order.email,
          phone: order.phone,
          address: [order.street_address, order.suburb, order.city].filter(Boolean).join(', '),
        });
      }
    }

    // Search corporate sites
    const { data: corporateSites, error: corporateError } = await supabaseAdmin
      .from('corporate_sites')
      .select('id, site_name, site_contact_email, site_contact_phone, address, suburb, city')
      .or(`site_name.ilike.${searchPattern},site_contact_email.ilike.${searchPattern},address.ilike.${searchPattern}`)
      .eq('status', 'active')
      .limit(10);

    if (corporateError) {
      apiLogger.error('[Search] Corporate search failed', { error: corporateError.message });
    } else if (corporateSites) {
      for (const site of corporateSites) {
        results.push({
          id: site.id,
          type: 'corporate',
          name: site.site_name,
          email: site.site_contact_email,
          phone: site.site_contact_phone,
          address: [site.address, site.suburb, site.city].filter(Boolean).join(', '),
        });
      }
    }

    // Sort by name and limit total results
    results.sort((a, b) => a.name.localeCompare(b.name));
    const limitedResults = results.slice(0, 15);

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Search] Customer search API error', { error: message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
