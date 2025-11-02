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
    const technology = searchParams.get('technology');
    const dataPackage = searchParams.get('data_package');

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
    if (contractTerm && contractTerm !== 'all') {
      const term = parseInt(contractTerm);
      // Check metadata->contractTerm (MTN import uses camelCase)
      // Using contains for JSONB field matching
      query = query.contains('metadata', { contractTerm: term });
    }

    // Filter by device type
    // Device info is stored in product name and metadata->oemDevice
    if (deviceType && deviceType !== 'all') {
      if (deviceType === 'sim_only') {
        // SIM-only products - products WITHOUT "+ Device" in name
        // SIM-only format: "MTN Made For Business S"
        // Handset format: "MTN Made For Business M+ + Apple iPhone Air"
        query = query.not('name', 'ilike', '%+%');
      } else if (deviceType === 'cpe') {
        // CPE/Router devices - search in product name
        query = query.or('name.ilike.%CPE%,name.ilike.%router%,name.ilike.%modem%,name.ilike.%Tozed%,name.ilike.%Huawei H155%');
      } else if (deviceType === 'handset') {
        // Handset/phone devices - search in product name
        query = query.or('name.ilike.%iPhone%,name.ilike.%Samsung%,name.ilike.%Galaxy%,name.ilike.%Oppo%,name.ilike.%Vivo%,name.ilike.%Huawei Nova%');
      }
    }

    // Filter by technology
    if (technology && technology !== 'all') {
      if (technology === '5g') {
        query = query.ilike('service_type', '%5g%');
      } else if (technology === 'lte') {
        query = query.ilike('service_type', '%lte%');
      } else if (technology === 'fibre') {
        // Fibre products
        query = query.or('service_type.ilike.%Fibre%,service_type.eq.HomeFibreConnect,service_type.eq.BizFibreConnect');
      } else if (technology === 'wireless') {
        // Wireless products
        query = query.or('service_type.ilike.%Wireless%,service_type.eq.SkyFibre');
      }
    }

    // Filter by data package (simplified - use name/description search)
    if (dataPackage && dataPackage !== 'all') {
      if (dataPackage === 'uncapped') {
        query = query.or('name.ilike.%Uncapped%,description.ilike.%Uncapped%');
      } else if (dataPackage === '0-10') {
        query = query.or('name.ilike.%1GB%,name.ilike.%2GB%,name.ilike.%5GB%,name.ilike.%10GB%');
      } else if (dataPackage === '10-50') {
        query = query.or('name.ilike.%20GB%,name.ilike.%30GB%,name.ilike.%40GB%,name.ilike.%50GB%');
      } else if (dataPackage === '50-100') {
        query = query.or('name.ilike.%60GB%,name.ilike.%70GB%,name.ilike.%80GB%,name.ilike.%90GB%,name.ilike.%100GB%');
      } else if (dataPackage === '100-500') {
        query = query.or('name.ilike.%150GB%,name.ilike.%200GB%,name.ilike.%300GB%,name.ilike.%400GB%,name.ilike.%500GB%');
      } else if (dataPackage === '500+') {
        query = query.or('name.ilike.%600GB%,name.ilike.%700GB%,name.ilike.%1000GB%,name.ilike.%1TB%');
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
