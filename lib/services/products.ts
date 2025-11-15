import { createClient } from '@/lib/supabase/server';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  ProductsResponse
} from '@/lib/types/products';

// Helper to get Supabase client (lazy initialization)
async function getSupabase() {
  return await createClient();
}

/**
 * @deprecated This service uses the legacy `products` table which is being phased out.
 * Use `service_packages` table instead via the publish pipeline:
 * admin_products → publish → service_packages
 *
 * See: docs/admin/PRODUCTS_TABLE_DEPRECATION.md
 * Epic 1.6 - Refactor consumer flows to rely only on service_packages
 */
export class ProductsService {
  /**
   * Get all products with filtering and pagination
   */
  static async getProducts(
    filters: ProductFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<ProductsResponse> {
    try {
      const supabase = await getSupabase();
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.service_type) {
        query = query.eq('service_type', filters.service_type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
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

      // Apply sorting
      switch (filters.sort_by) {
        case 'price_asc':
          query = query.order('base_price_zar', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('base_price_zar', { ascending: false });
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
          query = query.order('created_at', { ascending: false });
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
      console.error('ProductsService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(id: string): Promise<Product | null> {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return data as Product;
    } catch (error) {
      console.error('ProductsService.getProduct error:', error);
      return null;
    }
  }

  /**
   * Get a product by slug
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching product by slug:', error);
        return null;
      }

      return data as Product;
    } catch (error) {
      console.error('ProductsService.getProductBySlug error:', error);
      return null;
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: CreateProductData): Promise<Product> {
    try {
      // Generate slug from name if not provided
      const slug = productData.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

      const newProduct = {
        ...productData,
        slug,
        base_price_zar: productData.base_price_zar.toString(),
        cost_price_zar: productData.cost_price_zar.toString(),
        is_active: true,
        status: productData.status || 'draft',
        is_featured: productData.is_featured || false,
        is_popular: productData.is_popular || false,
        features: productData.features || [],
        bundle_components: productData.bundle_components || [],
        metadata: productData.metadata || {
          contract_months: 1,
          installation_days: 3,
          availability_zones: []
        }
      };

      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      return data as Product;
    } catch (error) {
      console.error('ProductsService.createProduct error:', error);
      throw error;
    }
  }

  /**
   * Update a product
   */
  static async updateProduct(productData: UpdateProductData): Promise<Product> {
    try {
      const updateData: Record<string, unknown> = { ...productData };
      delete updateData.id;

      // Convert prices to strings if provided
      if (updateData.base_price_zar !== undefined) {
        updateData.base_price_zar = updateData.base_price_zar.toString();
      }
      if (updateData.cost_price_zar !== undefined) {
        updateData.cost_price_zar = updateData.cost_price_zar.toString();
      }

      // Update slug if name changed
      if (updateData.name) {
        updateData.slug = updateData.name
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

      return data as Product;
    } catch (error) {
      console.error('ProductsService.updateProduct error:', error);
      throw error;
    }
  }

  /**
   * Delete a product (soft delete by setting status to archived)
   */
  static async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'archived',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('ProductsService.deleteProduct error:', error);
      return false;
    }
  }

  /**
   * Toggle product active status
   */
  static async toggleProductStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_active: isActive,
          status: isActive ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error toggling product status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('ProductsService.toggleProductStatus error:', error);
      return false;
    }
  }

  /**
   * Duplicate a product
   */
  static async duplicateProduct(id: string): Promise<Product | null> {
    try {
      const originalProduct = await this.getProduct(id);
      if (!originalProduct) return null;

      const duplicateData: CreateProductData = {
        name: `${originalProduct.name} (Copy)`,
        sku: `${originalProduct.sku}-COPY-${Date.now()}`,
        category: originalProduct.category,
        description: originalProduct.description || undefined,
        base_price_zar: parseFloat(originalProduct.base_price_zar),
        cost_price_zar: parseFloat(originalProduct.cost_price_zar),
        service_type: originalProduct.service_type || undefined,
        features: [...originalProduct.features],
        pricing: originalProduct.pricing || undefined,
        bundle_components: [...originalProduct.bundle_components],
        status: 'draft',
        is_featured: false,
        is_popular: false,
        metadata: { ...originalProduct.metadata }
      };

      return await this.createProduct(duplicateData);
    } catch (error) {
      console.error('ProductsService.duplicateProduct error:', error);
      return null;
    }
  }

  /**
   * Get product analytics/stats
   */
  static async getProductStats(): Promise<{
    total: number;
    active: number;
    draft: number;
    archived: number;
    featured: number;
    popular: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('status, is_active, is_featured, is_popular');

      if (error) {
        console.error('Error fetching product stats:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        active: data.filter(p => p.is_active).length,
        draft: data.filter(p => p.status === 'draft').length,
        archived: data.filter(p => p.status === 'archived').length,
        featured: data.filter(p => p.is_featured).length,
        popular: data.filter(p => p.is_popular).length,
      };

      return stats;
    } catch (error) {
      console.error('ProductsService.getProductStats error:', error);
      throw error;
    }
  }
}