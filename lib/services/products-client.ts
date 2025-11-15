import { createClient } from '@/lib/supabase/client';
import {
  Product,
  ProductFilters,
  ProductsResponse
} from '@/lib/types/products';

// Helper to get Supabase client (lazy initialization)
function getSupabase() {
  return createClient();
}

export class ProductsClientService {
  /**
   * Get all products with filtering and pagination (client-side)
   * Now using service_packages as single source of truth
   */
  static async getProducts(
    filters: ProductFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<ProductsResponse> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('service_packages')
        .select('*', { count: 'exact' });

      // Apply filters (mapped to service_packages fields)
      if (filters.category) {
        query = query.eq('product_category', filters.category);
      }

      if (filters.service_type) {
        query = query.eq('service_type', filters.service_type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('active', filters.is_active);
      }

      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }

      if (filters.is_popular !== undefined) {
        query = query.eq('is_popular', filters.is_popular);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }

      // Apply sorting (mapped to service_packages fields)
      switch (filters.sort_by) {
        case 'price_asc':
          query = query.order('price', { ascending: true }); // service_packages uses 'price' not 'base_price_zar'
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'created_desc':
          query = query.order('created_at', { ascending: false });
          break;
        case 'updated_desc':
          query = query.order('updated_at', { ascending: false });
          break;
        default:
          query = query.order('sort_order', { ascending: true, nullsLast: true }); // service_packages has sort_order
      }

      // Apply pagination
      const start = (page - 1) * perPage;
      const end = start + perPage - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / perPage);

      return {
        products: data as Product[],
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: totalPages
      };
    } catch (error) {
      console.error('ProductsClientService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID (client-side)
   * Migrated to service_packages - Epic 1.6
   */
  static async getProduct(id: string): Promise<Product | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return data as Product;
    } catch (error) {
      console.error('ProductsClientService.getProduct error:', error);
      return null;
    }
  }

  /**
   * Get a product by slug (client-side)
   * Migrated to service_packages - Epic 1.6
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching product by slug:', error);
        return null;
      }

      return data as Product;
    } catch (error) {
      console.error('ProductsClientService.getProductBySlug error:', error);
      return null;
    }
  }

  /**
   * Get products by category (client-side)
   * Migrated to service_packages - Epic 1.6
   */
  static async getProductsByCategory(
    category: string,
    limit: number = 10
  ): Promise<Product[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('product_category', category)  // service_packages uses 'product_category'
        .eq('active', true)                // service_packages uses 'active' instead of 'is_active'
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching products by category:', error);
        throw error;
      }

      return data as Product[];
    } catch (error) {
      console.error('ProductsClientService.getProductsByCategory error:', error);
      throw error;
    }
  }

  /**
   * Get products by service type (client-side)
   * Migrated to service_packages - Epic 1.6
   */
  static async getProductsByServiceType(
    serviceType: string,
    limit: number = 10
  ): Promise<Product[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('service_type', serviceType)
        .eq('active', true)  // service_packages uses 'active' instead of 'is_active'
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching products by service type:', error);
        throw error;
      }

      return data as Product[];
    } catch (error) {
      console.error('ProductsClientService.getProductsByServiceType error:', error);
      throw error;
    }
  }

  /**
   * Get featured products (client-side)
   * Migrated to service_packages - Epic 1.6
   */
  static async getFeaturedProducts(limit: number = 6): Promise<Product[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_featured', true)
        .eq('active', true)  // service_packages uses 'active' instead of 'is_active'
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured products:', error);
        throw error;
      }

      return data as Product[];
    } catch (error) {
      console.error('ProductsClientService.getFeaturedProducts error:', error);
      throw error;
    }
  }

  /**
   * Get popular products (client-side)
   * Migrated to service_packages - Epic 1.6
   */
  static async getPopularProducts(limit: number = 6): Promise<Product[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_popular', true)
        .eq('active', true)  // service_packages uses 'active' instead of 'is_active'
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular products:', error);
        throw error;
      }

      return data as Product[];
    } catch (error) {
      console.error('ProductsClientService.getPopularProducts error:', error);
      throw error;
    }
  }
}