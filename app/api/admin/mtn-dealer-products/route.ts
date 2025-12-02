import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  MTNDealerProduct, 
  MTNDealerProductFilters, 
  MTNDealerProductFormData 
} from '@/lib/types/mtn-dealer-products';

// GET /api/admin/mtn-dealer-products - List products with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: MTNDealerProductFilters = {
      technology: searchParams.get('technology') as any || undefined,
      contract_term: searchParams.get('contract_term') ? parseInt(searchParams.get('contract_term')!) as any : undefined,
      has_device: searchParams.get('has_device') === 'true' ? true : searchParams.get('has_device') === 'false' ? false : undefined,
      status: searchParams.get('status') as any || undefined,
      commission_tier: searchParams.get('commission_tier') || undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      is_current_deal: searchParams.get('is_current_deal') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      promo_start_date: searchParams.get('promo_start_date') || undefined,
      promo_end_date: searchParams.get('promo_end_date') || undefined,
      device_status: searchParams.get('device_status') as any || undefined,
    };
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '50');
    const offset = (page - 1) * per_page;
    
    // Sort
    const sort_by = searchParams.get('sort_by') || 'mtn_price_incl_vat';
    const sort_order = searchParams.get('sort_order') === 'desc' ? false : true;
    
    // Build query
    let query = supabase
      .from('mtn_dealer_products')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.technology) {
      query = query.eq('technology', filters.technology);
    }
    if (filters.contract_term !== undefined) {
      query = query.eq('contract_term', filters.contract_term);
    }
    if (filters.has_device !== undefined) {
      query = query.eq('has_device', filters.has_device);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.commission_tier) {
      query = query.eq('commission_tier', filters.commission_tier);
    }
    if (filters.min_price !== undefined) {
      query = query.gte('mtn_price_incl_vat', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('mtn_price_incl_vat', filters.max_price);
    }
    if (filters.is_current_deal) {
      // Filter for current deals using date comparison
      const today = new Date().toISOString().split('T')[0];
      query = query.lte('promo_start_date', today);
      query = query.or(`promo_end_date.is.null,promo_end_date.gte.${today}`);
    }
    if (filters.promo_start_date) {
      query = query.gte('promo_start_date', filters.promo_start_date);
    }
    if (filters.promo_end_date) {
      query = query.lte('promo_end_date', filters.promo_end_date);
    }
    if (filters.device_status) {
      query = query.eq('device_status', filters.device_status);
    }
    if (filters.search) {
      query = query.or(`deal_id.ilike.%${filters.search}%,price_plan.ilike.%${filters.search}%,device_name.ilike.%${filters.search}%`);
    }
    
    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order })
      .range(offset, offset + per_page - 1);
    
    const { data: products, error, count } = await query;
    
    if (error) {
      console.error('[MTN Dealer Products API] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        products,
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    });
  } catch (error) {
    console.error('[MTN Dealer Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/mtn-dealer-products - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: MTNDealerProductFormData = await request.json();
    
    // Validate required fields
    if (!body.deal_id || !body.price_plan || !body.technology || body.contract_term === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: deal_id, price_plan, technology, contract_term' },
        { status: 400 }
      );
    }
    
    // Check for duplicate deal_id
    const { data: existing } = await supabase
      .from('mtn_dealer_products')
      .select('id')
      .eq('deal_id', body.deal_id)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Deal ID ${body.deal_id} already exists` },
        { status: 409 }
      );
    }
    
    // Parse bundle values to numeric
    const data_bundle_gb = body.data_bundle ? parseFloat(body.data_bundle.replace(/[^0-9.]/g, '')) || null : null;
    const anytime_minutes_value = body.anytime_minutes ? parseInt(body.anytime_minutes.replace(/[^0-9]/g, '')) || null : null;
    const on_net_minutes_value = body.on_net_minutes ? parseInt(body.on_net_minutes.replace(/[^0-9]/g, '')) || null : null;
    const sms_bundle_value = body.sms_bundle ? parseInt(body.sms_bundle.replace(/[^0-9]/g, '')) || null : null;
    
    const { data: product, error } = await supabase
      .from('mtn_dealer_products')
      .insert({
        ...body,
        data_bundle_gb,
        anytime_minutes_value,
        on_net_minutes_value,
        sms_bundle_value,
        status: body.status || 'draft',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[MTN Dealer Products API] Create error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Log audit
    await supabase.from('mtn_dealer_product_audit_log').insert({
      product_id: product.id,
      deal_id: product.deal_id,
      action: 'create',
      new_values: product,
    });
    
    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[MTN Dealer Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
