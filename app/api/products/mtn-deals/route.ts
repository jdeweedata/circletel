import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const contractTerm = searchParams.get('contract_term');
    const platform = searchParams.get('platform');
    
    // Build query
    let query = supabase
      .from('mtn_business_deals')
      .select('*', { count: 'exact' })
      .eq('active', true)
      .order('monthly_price_incl_vat', { ascending: true });
    
    // Apply filters
    if (search) {
      query = query.or(`device_name.ilike.%${search}%,price_plan.ilike.%${search}%,deal_id.ilike.%${search}%`);
    }
    
    if (contractTerm) {
      query = query.eq('contract_term', parseInt(contractTerm));
    }
    
    if (platform === 'helios') {
      query = query.eq('available_helios', true);
    } else if (platform === 'ilula') {
      query = query.eq('available_ilula', true);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: deals, error, count } = await query;
    
    if (error) {
      console.error('Error fetching MTN deals:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      deals: deals || [],
      total: count || 0,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('Error in MTN deals API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data: deal, error } = await supabase
      .from('mtn_business_deals')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating deal:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      deal
    });
    
  } catch (error) {
    console.error('Error in MTN deals POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
