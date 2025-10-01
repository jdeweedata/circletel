// Product types matching Supabase database schema
export type ProductCategory = 'connectivity' | 'hardware' | 'software' | 'services' | 'bundles' | 'it_services' | 'bundle' | 'add_on';
export type ServiceType = 'SkyFibre' | 'HomeFibreConnect' | 'BizFibreConnect' | 'VoIP' | 'Hosting' | 'Security' | 'IT_Support' | 'Cloud_Services' | '5G' | 'LTE';
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type SortOrder = 'price_asc' | 'price_desc' | 'name_asc' | 'created_desc' | 'updated_desc' | 'speed_asc' | 'speed_desc' | 'popular';

export interface ProductPricing {
  setup: number;
  monthly: number;
  upload_speed: number;
  download_speed: number;
}

export interface ProductMetadata {
  contract_months: number;
  installation_days: number;
  availability_zones: string[];
  [key: string]: unknown;
}

// Main Product interface matching Supabase schema
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  base_price_zar: string; // stored as decimal in DB
  cost_price_zar: string; // stored as decimal in DB
  is_active: boolean;
  created_at: string;
  updated_at: string;
  slug: string | null;
  service_type: string | null;
  features: string[];
  pricing: ProductPricing | null;
  bundle_components: string[];
  status: ProductStatus;
  is_featured: boolean;
  is_popular: boolean;
  metadata: ProductMetadata;
  // Additional computed/optional properties
  download_speed?: number | null;
  upload_speed?: number | null;
  monthly_price?: number | string | null;
  final_price?: number | null;
  active_promotion?: Promotion | null;
  short_description?: string | null;
  setup_fee?: number | null;
  is_bundle?: boolean;
  bundle_savings?: number | null;
  sort_order?: number | null;
  currency?: string;
  type?: string;
  target_market?: string;
  speed_down?: number | null;
  speed_up?: number | null;
  data_limit?: string | null;
  price?: number | null;
  contract_term?: number | null;
  availability?: string;
}

// Form data interfaces for create/update
export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  description?: string;
  base_price_zar: number;
  cost_price_zar: number;
  service_type?: string;
  features?: string[];
  pricing?: ProductPricing;
  bundle_components?: string[];
  status?: ProductStatus;
  is_featured?: boolean;
  is_popular?: boolean;
  metadata?: ProductMetadata;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Promotion {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  promo_code?: string;
  valid_from: string;
  valid_until?: string;
  max_uses?: number;
  used_count: number;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
  imageUrl?: string; // Optional image URL for promotion
}

export interface ProductComparison {
  id: string;
  session_id: string;
  product_ids: string[];
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  service_type?: string;
  status?: ProductStatus;
  is_active?: boolean;
  is_featured?: boolean;
  is_popular?: boolean;
  search?: string;
  sort_by?: SortOrder;
  min_price?: number | null;
  max_price?: number | null;
  min_speed?: number | null;
  max_speed?: number | null;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Constants for dropdowns and validation
export const PRODUCT_CATEGORIES = [
  'connectivity',
  'hardware',
  'software',
  'services',
  'bundles',
  'it_services',
  'bundle',
  'add_on'
] as const;

export const SERVICE_TYPES = [
  'SkyFibre',
  'BizFibreConnect',
  'HomeFibreConnect',
  'VoIP',
  'Hosting',
  'Security',
  'IT_Support',
  'Cloud_Services',
  '5G',
  'LTE'
] as const;

export const PRODUCT_STATUSES = [
  'active',
  'inactive',
  'draft',
  'archived'
] as const;

export interface CartItem {
  product: Product;
  quantity: number;
  promo_code?: string;
}

export interface ProductComparisonItem {
  product: Product;
  highlighted_features: string[];
}

// Helper functions for pricing
export const calculateFinalPrice = (product: Product, promotion?: Promotion): number => {
  const basePrice = parseFloat(product.base_price_zar);
  if (!promotion) return basePrice;

  const { discount_type, discount_value } = promotion;

  switch (discount_type) {
    case 'percentage':
      return basePrice * (1 - discount_value / 100);
    case 'fixed':
      return Math.max(0, basePrice - discount_value);
    default:
      return basePrice;
  }
};

export const formatPrice = (price: number, currency: string = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatSpeed = (speedMbps: number): string => {
  if (speedMbps >= 1000) {
    return `${speedMbps / 1000}Gbps`;
  }
  return `${speedMbps}Mbps`;
};
