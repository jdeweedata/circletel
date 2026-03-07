/**
 * TMF620 Data Mapper
 *
 * Transforms CircleTel's internal data model to TMF620-compliant schema
 * for B2B partner integrations.
 */

import type { AdminProduct, AdminProductPricing, AdminProductFeature } from '@/lib/types/admin-products';
import type { ProductRelationship, ProductRelationshipWithTarget } from '@/lib/types/product-relationships';
import type {
  TMF620ProductOffering,
  TMF620ProductOfferingPrice,
  TMF620ProductOfferingRelationship,
  TMF620ProductSpecCharacteristic,
  TMF620Category,
  TMF620LifecycleStatus,
  TMF620CategoryRef,
} from '@/lib/types/tmf620';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';

/**
 * Map CircleTel status to TMF620 lifecycle status
 */
export function mapStatusToLifecycle(status: string): TMF620LifecycleStatus {
  const statusMap: Record<string, TMF620LifecycleStatus> = {
    draft: 'In design',
    pending: 'In test',
    approved: 'Active',
    archived: 'Retired',
  };
  return statusMap[status] || 'In study';
}

/**
 * Map CircleTel category to TMF620 category reference
 */
export function mapCategoryToRef(category: string): TMF620CategoryRef {
  const categoryNames: Record<string, string> = {
    business_fibre: 'Business Fibre',
    fixed_wireless_business: 'Fixed Wireless Business',
    fixed_wireless_residential: 'Fixed Wireless Residential',
  };

  return {
    id: category,
    href: `${BASE_URL}/api/catalog/category/${category}`,
    name: categoryNames[category] || category,
  };
}

/**
 * Map AdminProductPricing to TMF620 ProductOfferingPrice
 */
export function mapPricingToTMF620(
  productId: string,
  pricing: AdminProductPricing
): TMF620ProductOfferingPrice[] {
  const prices: TMF620ProductOfferingPrice[] = [];

  // Monthly recurring price
  if (pricing.price_regular) {
    prices.push({
      id: `${pricing.id}-monthly`,
      href: `${BASE_URL}/api/catalog/productOffering/${productId}/price/${pricing.id}-monthly`,
      name: 'Monthly Subscription',
      priceType: 'recurring',
      recurringChargePeriodType: 'month',
      recurringChargePeriodLength: 1,
      lifecycleStatus: mapStatusToLifecycle(pricing.approval_status),
      validFor: {
        startDateTime: pricing.effective_from,
        endDateTime: pricing.effective_to || undefined,
      },
      price: {
        unit: 'ZAR',
        value: pricing.price_regular,
      },
      '@type': 'ProductOfferingPrice',
    });
  }

  // Promotional price (if active)
  if (pricing.is_promotional && pricing.price_promo) {
    prices.push({
      id: `${pricing.id}-promo`,
      href: `${BASE_URL}/api/catalog/productOffering/${productId}/price/${pricing.id}-promo`,
      name: 'Promotional Price',
      priceType: 'recurring',
      recurringChargePeriodType: 'month',
      recurringChargePeriodLength: 1,
      lifecycleStatus: 'Active',
      validFor: {
        startDateTime: pricing.promo_start_date || pricing.effective_from,
        endDateTime: pricing.promo_end_date || undefined,
      },
      price: {
        unit: 'ZAR',
        value: pricing.price_promo,
      },
      '@type': 'ProductOfferingPrice',
    });
  }

  // Installation fee (one-time)
  if (pricing.installation_fee > 0) {
    prices.push({
      id: `${pricing.id}-install`,
      href: `${BASE_URL}/api/catalog/productOffering/${productId}/price/${pricing.id}-install`,
      name: 'Installation Fee',
      priceType: 'oneTime',
      lifecycleStatus: mapStatusToLifecycle(pricing.approval_status),
      price: {
        unit: 'ZAR',
        value: pricing.installation_fee,
      },
      '@type': 'ProductOfferingPrice',
    });
  }

  // Router rental (recurring)
  if (pricing.router_rental > 0) {
    prices.push({
      id: `${pricing.id}-router`,
      href: `${BASE_URL}/api/catalog/productOffering/${productId}/price/${pricing.id}-router`,
      name: 'Router Rental',
      priceType: 'recurring',
      recurringChargePeriodType: 'month',
      recurringChargePeriodLength: 1,
      lifecycleStatus: mapStatusToLifecycle(pricing.approval_status),
      price: {
        unit: 'ZAR',
        value: pricing.router_rental,
      },
      '@type': 'ProductOfferingPrice',
    });
  }

  return prices;
}

/**
 * Map AdminProductFeature to TMF620 ProductSpecCharacteristic
 */
export function mapFeaturesToCharacteristics(
  features: AdminProductFeature[]
): TMF620ProductSpecCharacteristic[] {
  return features.map((feature) => ({
    id: feature.id,
    name: feature.feature_name,
    description: feature.feature_category,
    valueType: 'string',
    configurable: false,
    productSpecCharacteristicValue: feature.feature_value
      ? [
          {
            isDefault: true,
            value: feature.feature_value,
          },
        ]
      : undefined,
    '@type': 'ProductSpecCharacteristic',
  }));
}

/**
 * Map ProductRelationship to TMF620 ProductOfferingRelationship
 */
export function mapRelationshipToTMF620(
  relationship: ProductRelationshipWithTarget
): TMF620ProductOfferingRelationship {
  return {
    id: relationship.target_product_id,
    href: `${BASE_URL}/api/catalog/productOffering/${relationship.target_product_id}`,
    name: relationship.target_product?.name,
    relationshipType: relationship.relationship_type,
    '@type': 'ProductOfferingRelationship',
  };
}

/**
 * Map AdminProduct to TMF620 ProductOffering
 */
export function mapProductToTMF620(
  product: AdminProduct,
  pricing?: AdminProductPricing | null,
  features?: AdminProductFeature[],
  relationships?: ProductRelationshipWithTarget[]
): TMF620ProductOffering {
  return {
    id: product.id,
    href: `${BASE_URL}/api/catalog/productOffering/${product.id}`,
    name: product.name,
    description: product.description || undefined,
    version: product.version.toString(),
    isBundle: false,
    isSellable: product.status === 'approved' && product.is_current,
    lifecycleStatus: mapStatusToLifecycle(product.status),
    lastUpdate: product.updated_at,

    // Category
    category: [mapCategoryToRef(product.category)],

    // Product specification reference
    productSpecification: {
      id: product.slug,
      href: `${BASE_URL}/products/${product.slug}`,
      name: product.name,
    },

    // Pricing
    productOfferingPrice: pricing
      ? mapPricingToTMF620(product.id, pricing)
      : undefined,

    // Characteristics (features)
    prodSpecCharValueUse: features?.length
      ? mapFeaturesToCharacteristics(features)
      : undefined,

    // Relationships (add-ons, prerequisites, etc.)
    productOfferingRelationship: relationships?.length
      ? relationships.map(mapRelationshipToTMF620)
      : undefined,

    // Contract terms
    productOfferingTerm: product.contract_terms?.length
      ? product.contract_terms.map((months) => ({
          name: `${months} Month Contract`,
          duration: {
            amount: months,
            units: 'month',
          },
          '@type': 'ProductOfferingTerm',
        }))
      : undefined,

    '@type': 'ProductOffering',
  };
}

/**
 * Map category enum to TMF620 Category
 */
export function mapCategoryToTMF620(
  categoryId: string,
  productCount?: number
): TMF620Category {
  const categories: Record<string, { name: string; description: string }> = {
    business_fibre: {
      name: 'Business Fibre',
      description: 'Dedicated fibre connectivity for business premises',
    },
    fixed_wireless_business: {
      name: 'Fixed Wireless Business',
      description: 'Wireless connectivity solutions for business customers',
    },
    fixed_wireless_residential: {
      name: 'Fixed Wireless Residential',
      description: 'Wireless connectivity for residential customers',
    },
  };

  const categoryInfo = categories[categoryId] || {
    name: categoryId,
    description: '',
  };

  return {
    id: categoryId,
    href: `${BASE_URL}/api/catalog/category/${categoryId}`,
    name: categoryInfo.name,
    description: categoryInfo.description,
    isRoot: true,
    lifecycleStatus: 'Active',
    '@type': 'Category',
  };
}

/**
 * Build TMF620 error response
 */
export function buildTMF620Error(
  code: string,
  reason: string,
  message: string,
  status?: number
) {
  return {
    code,
    reason,
    message,
    status: status?.toString(),
    '@type': 'Error' as const,
  };
}
