/**
 * Product Category Constants
 * Aligned with the documented portfolio structure from /products/
 */

export const PRODUCT_CATEGORIES = {
  // Consumer Products
  CONNECTIVITY_FWB: 'fixed_wireless_business',      // SkyFibre SMB, SkyFibre Home
  CONNECTIVITY_FIBRE: 'business_fibre',             // BizFibreConnect
  CONNECTIVITY_SOHO: 'soho',                        // WorkConnect
  CONNECTIVITY_LTE: 'lte_5g',                       // CircleConnect Wireless

  // Managed Services
  WIFI_AS_A_SERVICE: 'wifi_as_a_service',           // CloudWiFi WaaS
  MANAGED_IT: 'managed_it',                         // Managed IT Services
  CLOUD_HOSTING: 'cloud_hosting',                   // CircleCloud Hosting

  // Enterprise/Niche
  ENTERPRISE_MMWAVE: 'enterprise_mmwave',           // ParkConnect DUNE
  HEALTHCARE: 'healthcare',                         // ClinicConnect
  AFFORDABLE: 'affordable',                         // UmojaLink
  SELF_MANAGED: 'self_managed',                     // AirLink FWA
} as const;

export type ProductCategoryKey = keyof typeof PRODUCT_CATEGORIES;
export type ProductCategoryValue = typeof PRODUCT_CATEGORIES[ProductCategoryKey];

export const CATEGORY_GROUPS = {
  'Consumer Connectivity': ['connectivity', 'fixed_wireless_business', 'business_fibre', 'soho', 'lte_5g'],
  'Managed Services': ['services', 'wifi_as_a_service', 'managed_it', 'cloud_hosting', 'it_services'],
  'Enterprise & Niche': ['enterprise_mmwave', 'healthcare', 'affordable', 'self_managed'],
  'Hardware & Bundles': ['hardware', 'bundles', 'bundle', 'add_on', 'software'],
} as const;

export type CategoryGroupName = keyof typeof CATEGORY_GROUPS;

export const CATEGORY_GROUP_COLORS: Record<CategoryGroupName, { bg: string; border: string; text: string }> = {
  'Consumer Connectivity': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  'Managed Services': {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  'Enterprise & Niche': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  'Hardware & Bundles': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
};

/**
 * Get the category group for a given product category
 */
export function getCategoryGroup(category: string): CategoryGroupName | null {
  for (const [groupName, categories] of Object.entries(CATEGORY_GROUPS)) {
    if ((categories as readonly string[]).includes(category)) {
      return groupName as CategoryGroupName;
    }
  }
  return null;
}

/**
 * Group products by their category group
 */
export function groupProductsByCategory<T extends { category: string }>(
  products: T[]
): Record<CategoryGroupName, T[]> {
  const grouped: Record<CategoryGroupName, T[]> = {
    'Consumer Connectivity': [],
    'Managed Services': [],
    'Enterprise & Niche': [],
    'Hardware & Bundles': [],
  };

  for (const product of products) {
    const group = getCategoryGroup(product.category);
    if (group) {
      (grouped[group] as T[]).push(product);
    } else {
      // Default to Hardware & Bundles for unknown categories
      (grouped['Hardware & Bundles'] as T[]).push(product);
    }
  }

  return grouped;
}
