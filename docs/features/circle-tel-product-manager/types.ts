export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory?: string;
  price: number;
  currency: string;
  billingCycle: string; // e.g., "month"
  status: 'active' | 'inactive' | 'draft' | 'archived';
  syncStatus: 'synced' | 'not_synced' | 'failed';
  description: string;
  tags: string[];
  specs?: {
    download?: string;
    upload?: string;
    dataLimit?: string;
    type?: string; // e.g. Fibre, LTE, 5G
  };
  lastUpdated: string;
  isHidden: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
}

export interface CategoryStats {
  id: string;
  label: string;
  count: number;
}

export interface FilterState {
  search: string;
  category: string;
  status: string;
  viewMode: 'grid' | 'list';
}
