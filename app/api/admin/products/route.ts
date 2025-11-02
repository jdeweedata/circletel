/**
 * Admin Products API Route
 * GET /api/admin/products - Fetch products with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const category = searchParams.get('category');
    const serviceType = searchParams.get('service_type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_desc';
    const contractTerm = searchParams.get('contract_term');
    const deviceType = searchParams.get('device_type');

    // Build query - using service_packages as single source of truth
    let query = supabase
      .from('service_packages')
      .select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('product_category', category);
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    if (status) {
      // Map status filter to service_packages fields
      if (status === 'active') {
        query = query.eq('active', true);
      } else if (status === 'inactive') {
        query = query.eq('active', false);
      } else {
        query = query.eq('status', status);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    // Filter by contract term
    if (contractTerm) {
      const term = parseInt(contractTerm);
      // Check both contract_term field and metadata->contract_months
      query = query.or(`contract_term.eq.${term},metadata->contract_months.eq.${term}`);
    }

    // Filter by device type
    if (deviceType) {
      if (deviceType === 'sim_only') {
        // SIM-only products (Use Your Own device)
        query = query.or(`device.ilike.%Use Your Own%,device.is.null`);
      } else if (deviceType === 'cpe') {
        // CPE/Router devices
        query = query.or(`device.ilike.%CPE%,device.ilike.%router%,device.ilike.%modem%,device.ilike.%Tozed%,device.ilike.%Huawei H%`);
      } else if (deviceType === 'handset') {
        // Handset/phone devices
        query = query.or(`device.ilike.%iPhone%,device.ilike.%Samsung%,device.ilike.%Galaxy%,device.ilike.%Oppo%,device.ilike.%Vivo%,device.ilike.%Huawei Nova%`);
      } else if (deviceType === 'other') {
        // Other devices (not SIM-only, CPE, or handset)
        query = query.not('device', 'ilike', '%Use Your Own%')
          .not('device', 'ilike', '%CPE%')
          .not('device', 'ilike', '%router%')
          .not('device', 'ilike', '%iPhone%')
          .not('device', 'ilike', '%Samsung%')
          .not('device', 'is', null);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'created_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'created_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'updated_desc':
        query = query.order('updated_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const start = (page - 1) * perPage;
    const end = start + perPage - 1;
    query = query.range(start, end);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch products',
          details: error.message
        },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / perPage);

    // Map service_packages fields to match frontend expectations
    const mappedProducts = (products || []).map(pkg => ({
      ...pkg,
      // Ensure frontend-compatible field names
      category: pkg.product_category || 'connectivity',
      service: pkg.service_type,
      is_active: pkg.active,
      // Ensure pricing object exists
      pricing: pkg.pricing || {
        monthly: pkg.base_price_zar || 0,
        installation: pkg.cost_price_zar || 0,
        download_speed: pkg.speed_download || 0,
        upload_speed: pkg.speed_upload || 0
      }
    }));

    return NextResponse.json({
      success: true,
      products: mappedProducts,
      data: {
        products: mappedProducts,
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: totalPages
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
