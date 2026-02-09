import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

// Public API for MTN Dealer deals - customer-facing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '24');
    const offset = (page - 1) * per_page;

    // Filters
    const technology = searchParams.get('technology'); // LTE, 5G, LTE/5G
    const contract_term = searchParams.get('contract_term'); // 0, 12, 24, 36
    const has_device = searchParams.get('has_device'); // true, false
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const min_data = searchParams.get('min_data'); // Minimum data in GB
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'price_asc'; // price_asc, price_desc, data_desc
    const customer_type = searchParams.get('customer_type'); // consumer, business

    // Build query - only active products
    let query = supabase
      .from('mtn_dealer_products')
      .select(`
        id,
        deal_id,
        price_plan,
        device_name,
        has_device,
        technology,
        contract_term,
        contract_term_label,
        mtn_price_incl_vat,
        selling_price_incl_vat,
        data_bundle,
        data_bundle_gb,
        anytime_minutes,
        sms_bundle,
        once_off_pay_in_incl_vat,
        freebies_device,
        freebies_priceplan,
        free_sim,
        promo_start_date,
        promo_end_date
      `, { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (technology) {
      query = query.eq('technology', technology);
    }

    if (contract_term !== null && contract_term !== undefined) {
      query = query.eq('contract_term', parseInt(contract_term));
    }

    if (has_device === 'true') {
      query = query.eq('has_device', true);
    } else if (has_device === 'false') {
      query = query.eq('has_device', false);
    }

    if (min_price) {
      query = query.gte('selling_price_incl_vat', parseFloat(min_price));
    }

    if (max_price) {
      query = query.lte('selling_price_incl_vat', parseFloat(max_price));
    }

    if (min_data) {
      query = query.gte('data_bundle_gb', parseFloat(min_data));
    }

    if (search) {
      query = query.or(`price_plan.ilike.%${search}%,device_name.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort_by) {
      case 'price_desc':
        query = query.order('selling_price_incl_vat', { ascending: false });
        break;
      case 'data_desc':
        query = query.order('data_bundle_gb', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
      default:
        query = query.order('selling_price_incl_vat', { ascending: true });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + per_page - 1);

    const { data: deals, error, count } = await query;

    if (error) {
      apiLogger.error('[MTN Deals API] Error', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    // Get filter options for the UI
    const { data: filterOptions } = await supabase
      .from('mtn_dealer_products')
      .select('technology, contract_term, data_bundle_gb, selling_price_incl_vat')
      .eq('status', 'active');

    const technologies = [...new Set(filterOptions?.map(p => p.technology) || [])];
    const contractTerms = [...new Set(filterOptions?.map(p => p.contract_term) || [])].sort((a, b) => a - b);
    const priceRange = {
      min: Math.min(...(filterOptions?.map(p => p.selling_price_incl_vat) || [0])),
      max: Math.max(...(filterOptions?.map(p => p.selling_price_incl_vat) || [0])),
    };
    const dataRange = {
      min: Math.min(...(filterOptions?.map(p => p.data_bundle_gb).filter(Boolean) || [0])),
      max: Math.max(...(filterOptions?.map(p => p.data_bundle_gb).filter(Boolean) || [0])),
    };

    return NextResponse.json({
      success: true,
      data: {
        deals: deals || [],
        pagination: {
          page,
          per_page,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / per_page),
        },
        filters: {
          technologies,
          contract_terms: contractTerms,
          price_range: priceRange,
          data_range: dataRange,
        },
      },
    });
  } catch (error) {
    apiLogger.error('[MTN Deals API] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
