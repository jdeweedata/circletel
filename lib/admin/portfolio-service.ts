/**
 * Portfolio Service
 * Aggregates product data for portfolio dashboard
 * Unit economics data sourced from /products/ documentation
 */

import { Product } from '@/lib/types/products';
import {
  PortfolioMetrics,
  MarginHealthData,
  ProductUnitEconomics,
  ProductStatusGroup,
  ProductLifecycleStatus,
  MARGIN_THRESHOLDS,
} from '@/lib/types/product-portfolio';
import { CATEGORY_GROUPS, CategoryGroupName } from './product-categories';

/**
 * Calculate portfolio metrics from products
 */
export function getPortfolioMetrics(products: Product[]): PortfolioMetrics {
  const categoryMap: Record<string, Product[]> = {};

  // Group products by category
  products.forEach((product) => {
    const cat = product.category || 'other';
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(product);
  });

  // Calculate category stats
  const categories = Object.entries(categoryMap).map(([name, prods]) => {
    const totalMrr = prods.reduce((sum, p) => sum + parseFloat(p.base_price_zar || '0'), 0);
    const margins = prods
      .filter((p) => parseFloat(p.cost_price_zar || '0') > 0)
      .map((p) => {
        const price = parseFloat(p.base_price_zar || '0');
        const cost = parseFloat(p.cost_price_zar || '0');
        return price > 0 ? ((price - cost) / price) * 100 : 0;
      });
    const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
    const activeCount = prods.filter((p) => p.status === 'active').length;

    return {
      name,
      products: prods.map((p) => p.id),
      totalMrr,
      avgMargin,
      productCount: prods.length,
      activeCount,
    };
  });

  // Calculate margin distribution
  const marginHealth = getMarginHealth(products);
  const marginDistribution = {
    healthy: marginHealth.filter((m) => m.status === 'healthy').length,
    ok: marginHealth.filter((m) => m.status === 'ok').length,
    alert: marginHealth.filter((m) => m.status === 'alert').length,
  };

  return {
    totalProducts: products.length,
    totalMrr: products.reduce((sum, p) => sum + parseFloat(p.base_price_zar || '0'), 0),
    avgMargin:
      categories.length > 0
        ? categories.reduce((sum, c) => sum + c.avgMargin, 0) / categories.length
        : 0,
    categories,
    marginDistribution,
  };
}

/**
 * Get margin health data for all products
 */
export function getMarginHealth(products: Product[]): MarginHealthData[] {
  return products
    .filter((p) => parseFloat(p.cost_price_zar || '0') > 0)
    .map((product) => {
      const price = parseFloat(product.base_price_zar || '0');
      const cost = parseFloat(product.cost_price_zar || '0');
      const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;

      let status: 'healthy' | 'ok' | 'alert' = 'alert';
      if (marginPercent >= MARGIN_THRESHOLDS.healthy) {
        status = 'healthy';
      } else if (marginPercent >= MARGIN_THRESHOLDS.ok) {
        status = 'ok';
      }

      return {
        productId: product.id,
        productName: product.name,
        category: product.category || 'other',
        price,
        cost,
        marginPercent,
        status,
      };
    })
    .sort((a, b) => a.marginPercent - b.marginPercent); // Lowest margin first
}

/**
 * Get unit economics data
 * Hardcoded from /products/ documentation - to be replaced with database values later
 */
export function getUnitEconomics(): ProductUnitEconomics[] {
  // Data from /products/ documentation
  return [
    {
      productId: 'skyfibre-smb',
      productName: 'SkyFibre SMB',
      category: 'connectivity',
      cac: 2550,
      ltv: 18000,
      ltvCacRatio: 7.1,
      paybackMonths: 5,
      monthlyChurn: 1.2,
      arpu: 1499,
    },
    {
      productId: 'bizfibreconnect',
      productName: 'BizFibreConnect',
      category: 'business_fibre',
      cac: 2500,
      ltv: 14280,
      ltvCacRatio: 5.7,
      paybackMonths: 8,
      monthlyChurn: 1.5,
      arpu: 1699,
    },
    {
      productId: 'cloudwifi-waas',
      productName: 'CloudWiFi WaaS',
      category: 'wifi_as_a_service',
      cac: 0,
      ltv: 0,
      ltvCacRatio: 0,
      paybackMonths: 5,
      arpu: 2999,
    },
    {
      productId: 'managed-it',
      productName: 'Managed IT Services',
      category: 'managed_it',
      cac: 3500,
      ltv: 35988,
      ltvCacRatio: 10.3,
      paybackMonths: 4,
      monthlyChurn: 0.8,
      arpu: 999,
    },
    {
      productId: 'parkconnect-dune',
      productName: 'ParkConnect DUNE',
      category: 'enterprise_mmwave',
      cac: 8167,
      ltv: 22788,
      ltvCacRatio: 2.8,
      paybackMonths: 15,
      monthlyChurn: 2.1,
      arpu: 25000,
    },
    {
      productId: 'circleconnect-wireless',
      productName: 'CircleConnect Wireless',
      category: 'lte_5g',
      cac: 1200,
      ltv: 8640,
      ltvCacRatio: 7.2,
      paybackMonths: 4,
      monthlyChurn: 1.8,
      arpu: 599,
    },
    {
      productId: 'umojalink',
      productName: 'UmojaLink',
      category: 'affordable',
      cac: 500,
      ltv: 4320,
      ltvCacRatio: 8.6,
      paybackMonths: 3,
      monthlyChurn: 2.5,
      arpu: 299,
    },
  ];
}

/**
 * Get product lifecycle status groups
 */
export function getProductStatusGroups(products: Product[]): ProductStatusGroup[] {
  // Map product status to lifecycle status
  const lifecycleMap: Record<string, ProductLifecycleStatus> = {};

  products.forEach((p) => {
    if (p.status === 'active') {
      lifecycleMap[p.id] = 'active';
    } else if (p.status === 'draft') {
      lifecycleMap[p.id] = 'development';
    } else if (p.status === 'archived') {
      lifecycleMap[p.id] = 'sunset';
    }
  });

  // Known pilot products (hardcoded for now)
  const pilotProducts = ['clinicconnect', 'parkconnect-dune'];
  pilotProducts.forEach((name) => {
    const product = products.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
    if (product) {
      lifecycleMap[product.id] = 'pilot';
    }
  });

  // Group by status
  const groups: Record<ProductLifecycleStatus, ProductStatusGroup> = {
    active: { status: 'active', label: 'Active', products: [] },
    development: { status: 'development', label: 'In Development', products: [] },
    pilot: { status: 'pilot', label: 'Pilot', products: [] },
    sunset: { status: 'sunset', label: 'Sunset/Archived', products: [] },
  };

  products.forEach((product) => {
    const status = lifecycleMap[product.id] || 'active';
    groups[status].products.push({
      productId: product.id,
      productName: product.name,
      category: product.category || 'other',
      status,
    });
  });

  return Object.values(groups);
}

/**
 * Group products by category group
 */
export function getProductsByCategoryGroup(
  products: Product[]
): Record<CategoryGroupName, Product[]> {
  const result: Record<CategoryGroupName, Product[]> = {
    'Consumer Connectivity': [],
    'Managed Services': [],
    'Enterprise & Niche': [],
    'Hardware & Bundles': [],
  };

  products.forEach((product) => {
    const category = product.category || 'other';
    for (const [groupName, categories] of Object.entries(CATEGORY_GROUPS)) {
      if ((categories as readonly string[]).includes(category)) {
        result[groupName as CategoryGroupName].push(product);
        return;
      }
    }
    // Default to Hardware & Bundles
    result['Hardware & Bundles'].push(product);
  });

  return result;
}
