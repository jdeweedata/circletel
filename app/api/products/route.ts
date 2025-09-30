// API Route: /api/products
// Purpose: Fetch products with filtering, search, and pagination
// Part of CJF-001-02 Product Catalog System

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Product, ProductFilters } from '@/lib/types/products';

// Fallback mock data based on real CircleTel products
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'SkyFibre Essential',
    slug: 'skyfibre-essential',
    category: 'connectivity',
    service_type: 'SkyFibre',
    description: 'Primary launch product - affordable Fixed Wireless Access for businesses. MTN Tarana G1 infrastructure with 10/10 Mbps uncapped data.',
    short_description: 'Essential business internet via fixed wireless',
    monthly_price: 1299.00,
    setup_fee: 1999.00,
    currency: 'ZAR',
    vat_inclusive: true,
    download_speed: 10,
    upload_speed: 10,
    features: ['Uncapped data', 'Month-to-month contract', '24/7 support', 'MTN Tarana G1 network', 'Quick setup 24-48 hours', 'Dedicated business line'],
    specifications: {},
    requirements: [],
    is_bundle: false,
    bundle_components: [],
    bundle_savings: 0,
    status: 'active',
    availability_zones: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
    min_contract_months: 1,
    sort_order: 1,
    is_featured: true,
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active_promotion: {
      id: 'promo-1',
      product_id: '1',
      name: 'MVP Launch Special',
      description: 'Limited time launch pricing for first 25 customers',
      discount_type: 'percentage',
      discount_value: 15,
      promo_code: 'LAUNCH15',
      valid_from: new Date().toISOString(),
      valid_until: '2025-01-31T23:59:59Z',
      max_uses: 25,
      used_count: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    final_price: 1104.15
  },
  {
    id: '2',
    name: 'SkyFibre SME 50',
    slug: 'skyfibre-sme-50',
    category: 'connectivity',
    service_type: 'SkyFibre',
    description: 'Small to medium business Fixed Wireless Access solution. 50 Mbps uncapped for growing businesses without fibre access.',
    short_description: 'SME wireless internet - 50 Mbps',
    monthly_price: 749.00,
    setup_fee: 2500.00,
    currency: 'ZAR',
    vat_inclusive: true,
    download_speed: 50,
    upload_speed: 25,
    features: ['Uncapped data', 'Business-grade service', '24/7 technical support', 'MTN network', 'Self-install option', 'SLA included'],
    specifications: {},
    requirements: [],
    is_bundle: false,
    bundle_components: [],
    bundle_savings: 0,
    status: 'active',
    availability_zones: ['Johannesburg', 'Cape Town', 'Pretoria', 'Centurion', 'Sandton', 'Randburg'],
    min_contract_months: 12,
    sort_order: 2,
    is_featured: false,
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    final_price: 749.00
  },
  {
    id: '3',
    name: 'BizFibre Connect Lite',
    slug: 'bizfibre-connect-lite',
    category: 'connectivity',
    service_type: 'BizFibreConnect',
    description: 'Enterprise-grade fibre connectivity for micro businesses. DFA wholesale infrastructure with Reyee cloud-managed router included.',
    short_description: 'Business fibre - 10/10 Mbps',
    monthly_price: 1699.00,
    setup_fee: 0.00,
    currency: 'ZAR',
    vat_inclusive: true,
    download_speed: 10,
    upload_speed: 10,
    features: ['Symmetrical speeds', '99.5% uptime SLA', 'Enterprise router included', 'Professional installation', '24/7 local support', 'Low contention 1:10'],
    specifications: {},
    requirements: [],
    is_bundle: false,
    bundle_components: [],
    bundle_savings: 0,
    status: 'active',
    availability_zones: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
    min_contract_months: 24,
    sort_order: 5,
    is_featured: false,
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    final_price: 1699.00
  },
  {
    id: '4',
    name: 'BizFibre Connect Pro',
    slug: 'bizfibre-connect-pro',
    category: 'connectivity',
    service_type: 'BizFibreConnect',
    description: 'Medium business fibre with 100 Mbps symmetrical speeds. Ideal for heavy cloud usage and video conferencing.',
    short_description: 'Medium business fibre - 100/100 Mbps',
    monthly_price: 2999.00,
    setup_fee: 0.00,
    currency: 'ZAR',
    vat_inclusive: true,
    download_speed: 100,
    upload_speed: 100,
    features: ['Symmetrical 100 Mbps', 'Premium router rental available', '99.5% uptime SLA', 'Priority technical support', 'Heavy cloud usage optimized', 'Video conferencing ready'],
    specifications: {},
    requirements: [],
    is_bundle: false,
    bundle_components: [],
    bundle_savings: 0,
    status: 'active',
    availability_zones: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    min_contract_months: 24,
    sort_order: 8,
    is_featured: true,
    is_popular: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    final_price: 2999.00
  },
  {
    id: '5',
    name: 'Microsoft 365 Business Standard',
    slug: 'microsoft-365-business-standard',
    category: 'it_services',
    service_type: 'Cloud_Services',
    description: 'Complete Microsoft 365 suite for businesses. Includes Office apps, Exchange email, Teams, SharePoint, and OneDrive with 1TB storage.',
    short_description: 'Microsoft 365 for business teams',
    monthly_price: 329.00,
    setup_fee: 0.00,
    currency: 'ZAR',
    vat_inclusive: true,
    download_speed: undefined,
    upload_speed: undefined,
    features: ['Office apps (Word, Excel, PowerPoint)', 'Outlook email hosting', 'Microsoft Teams', '1TB OneDrive storage', 'SharePoint collaboration', 'Mobile apps included'],
    specifications: {},
    requirements: [],
    is_bundle: false,
    bundle_components: [],
    bundle_savings: 0,
    status: 'active',
    availability_zones: ['National', 'All Regions'],
    min_contract_months: 12,
    sort_order: 12,
    is_featured: true,
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    final_price: 329.00
  },
  {
    id: '6',
    name: 'CircleComplete Starter',
    slug: 'circle-complete-starter',
    category: 'bundle',
    service_type: undefined,
    description: 'Perfect bundle for small businesses combining SkyFibre Essential connectivity, Microsoft 365, and Basic IT Support.',
    short_description: 'Complete small business solution',
    monthly_price: 2199.00,
    setup_fee: 1999.00,
    currency: 'ZAR',
    vat_inclusive: true,
    download_speed: 10,
    upload_speed: 10,
    features: ['SkyFibre Essential 10/10 Mbps', 'Microsoft 365 Business Standard', 'Basic IT Support', 'Save R428/month', 'Single monthly bill', 'Unified support'],
    specifications: {},
    requirements: [],
    is_bundle: true,
    bundle_components: ['SkyFibre Essential', 'Microsoft 365 Business Standard', 'Basic IT Support'],
    bundle_savings: 428.00,
    status: 'active',
    availability_zones: ['Johannesburg', 'Cape Town', 'Pretoria', 'Durban'],
    min_contract_months: 12,
    sort_order: 16,
    is_featured: true,
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active_promotion: {
      id: 'promo-6',
      product_id: '6',
      name: 'MVP Launch Special',
      description: 'Limited time launch pricing for first 25 customers',
      discount_type: 'percentage',
      discount_value: 15,
      promo_code: 'LAUNCH15',
      valid_from: new Date().toISOString(),
      valid_until: '2025-01-31T23:59:59Z',
      max_uses: 25,
      used_count: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    final_price: 1869.15
  }
];

// Initialize Supabase client (fallback to mock data if not available)
let supabase: any = null;
try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
} catch (error) {
  console.log('Supabase connection failed, using mock data');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query params
    const filters: ProductFilters = {
      category: searchParams.get('category') as any,
      service_type: searchParams.get('service_type') as any,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      min_speed: searchParams.get('min_speed') ? Number(searchParams.get('min_speed')) : undefined,
      max_speed: searchParams.get('max_speed') ? Number(searchParams.get('max_speed')) : undefined,
      is_featured: searchParams.get('featured') === 'true',
      is_popular: searchParams.get('popular') === 'true',
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort') as any || 'popular',
    };

    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 12);
    const offset = (page - 1) * limit;

    let products: Product[] = [];
    let count = 0;

    // Try to fetch from Supabase first, fall back to mock data
    if (supabase) {
      try {
        // Build the query
        let query = supabase
          .from('products')
          .select(`*`, { count: 'exact' })
          .eq('status', 'active');

        // Apply filters
        if (filters.category) {
          query = query.eq('category', filters.category);
        }

        if (filters.service_type) {
          query = query.eq('service_type', filters.service_type);
        }

        if (filters.min_price !== undefined) {
          query = query.gte('monthly_price', filters.min_price);
        }

        if (filters.max_price !== undefined) {
          query = query.lte('monthly_price', filters.max_price);
        }

        if (filters.min_speed !== undefined) {
          query = query.gte('download_speed', filters.min_speed);
        }

        if (filters.max_speed !== undefined) {
          query = query.lte('download_speed', filters.max_speed);
        }

        if (filters.is_featured) {
          query = query.eq('is_featured', true);
        }

        if (filters.is_popular) {
          query = query.eq('is_popular', true);
        }

        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Apply sorting
        switch (filters.sort_by) {
          case 'price_asc':
            query = query.order('monthly_price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('monthly_price', { ascending: false });
            break;
          case 'speed_asc':
            query = query.order('download_speed', { ascending: true, nullsFirst: false });
            break;
          case 'speed_desc':
            query = query.order('download_speed', { ascending: false, nullsFirst: false });
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'popular':
          default:
            query = query
              .order('is_featured', { ascending: false })
              .order('is_popular', { ascending: false })
              .order('sort_order', { ascending: true });
            break;
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count: dbCount } = await query;

        if (!error && data) {
          products = data;
          count = dbCount || 0;
        } else {
          throw new Error('Database query failed');
        }
      } catch (dbError) {
        console.log('Database error, falling back to mock data:', dbError);
        // Fall through to mock data
      }
    }

    // Use mock data if database failed or not available
    if (products.length === 0) {
      console.log('Using mock product data');
      let filteredProducts = [...mockProducts];

      // Apply filters to mock data
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters.service_type) {
        filteredProducts = filteredProducts.filter(p => p.service_type === filters.service_type);
      }

      if (filters.min_price !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.monthly_price >= filters.min_price!);
      }

      if (filters.max_price !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.monthly_price <= filters.max_price!);
      }

      if (filters.min_speed !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.download_speed && p.download_speed >= filters.min_speed!);
      }

      if (filters.max_speed !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.download_speed && p.download_speed <= filters.max_speed!);
      }

      if (filters.is_featured) {
        filteredProducts = filteredProducts.filter(p => p.is_featured);
      }

      if (filters.is_popular) {
        filteredProducts = filteredProducts.filter(p => p.is_popular);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting to mock data
      switch (filters.sort_by) {
        case 'price_asc':
          filteredProducts.sort((a, b) => a.monthly_price - b.monthly_price);
          break;
        case 'price_desc':
          filteredProducts.sort((a, b) => b.monthly_price - a.monthly_price);
          break;
        case 'speed_asc':
          filteredProducts.sort((a, b) => (a.download_speed || 0) - (b.download_speed || 0));
          break;
        case 'speed_desc':
          filteredProducts.sort((a, b) => (b.download_speed || 0) - (a.download_speed || 0));
          break;
        case 'name_asc':
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'popular':
        default:
          filteredProducts.sort((a, b) => {
            if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
            if (a.is_popular !== b.is_popular) return b.is_popular ? 1 : -1;
            return a.sort_order - b.sort_order;
          });
          break;
      }

      count = filteredProducts.length;
      products = filteredProducts.slice(offset, offset + limit);
    }

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      products: products,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: filters,
      usingMockData: products.length > 0 && products === mockProducts.slice(offset, offset + limit)
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}