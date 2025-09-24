/**
 * TypeScript interfaces for Admin Products Integration
 *
 * This file defines all types and interfaces for the admin products
 * system integration with the coverage checking functionality.
 *
 * @see specs/001-admin-products-integration/data-model.md
 */

import type { TechnologyType } from '@/services/multiProviderCoverage';

// =============================================================================
// Core Admin Product Entities (Database Schema Interfaces)
// =============================================================================

/**
 * Admin Product entity from admin_products table
 *
 * Represents the core product catalog maintained by the admin system.
 * All products must have status='approved' and is_current=true to be customer-facing.
 */
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  category: AdminProductCategory;
  service_type: string;
  description: string;
  long_description: string;
  speed_down: number;
  speed_up: number;
  is_symmetrical: boolean;
  contract_terms: number[];
  status: AdminProductStatus;
  version: number;
  is_current: boolean;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Admin Product Pricing entity from admin_product_pricing table
 *
 * Contains pricing information including promotional offers.
 * Supports time-based promotional pricing with approval workflow.
 */
export interface AdminProductPricing {
  id: string;
  product_id: string;
  price_regular: number;
  price_promo?: number;
  installation_fee: number;
  hardware_contribution: number;
  router_rental: number;
  is_promotional: boolean;
  promo_start_date?: string;
  promo_end_date?: string;
  effective_from: string;
  effective_to?: string;
  approval_status: ApprovalStatus;
  approved_at?: string;
}

/**
 * Admin Product Feature entity from admin_product_features table
 *
 * Individual feature items associated with products for customer display.
 */
export interface AdminProductFeature {
  id: string;
  product_id: string;
  feature_name: string;
  feature_value?: string;
  feature_category: string;
  is_highlighted: boolean;
  sort_order: number;
}

// =============================================================================
// Enum Types and Constants
// =============================================================================

/**
 * Admin product categories that map to technology types
 */
export type AdminProductCategory =
  | 'business_fibre'
  | 'fixed_wireless_business'
  | 'fixed_wireless_residential';

/**
 * Admin product status workflow states
 */
export type AdminProductStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'archived';

/**
 * Approval workflow status
 */
export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

/**
 * Technology mapping from admin categories to customer-facing technology types
 *
 * Used to filter products based on coverage availability.
 */
export const ADMIN_CATEGORY_TO_TECHNOLOGY: Record<AdminProductCategory, TechnologyType> = {
  'business_fibre': 'FIBRE',
  'fixed_wireless_business': 'FIXED_WIRELESS',
  'fixed_wireless_residential': 'FIXED_WIRELESS'
} as const;

/**
 * Reverse mapping from technology type to admin categories
 *
 * Used to query products by technology type.
 */
export const TECHNOLOGY_TO_ADMIN_CATEGORIES: Record<TechnologyType, AdminProductCategory[]> = {
  'FIBRE': ['business_fibre'],
  'FIXED_WIRELESS': ['fixed_wireless_business', 'fixed_wireless_residential'],
  'LTE': [] // LTE products not yet in admin system
} as const;

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Request parameters for the admin-products-coverage Edge Function
 */
export interface AdminProductsCoverageRequest {
  technologies: TechnologyType[];
  coverageArea?: string;
}

/**
 * Success response from the admin-products-coverage Edge Function
 */
export interface AdminProductsCoverageResponse {
  success: true;
  data: ServicePackage[];
  meta: {
    count: number;
    technologies: TechnologyType[];
  };
}

/**
 * Error response from the admin-products-coverage Edge Function
 */
export interface AdminProductsCoverageError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Union type for all possible Edge Function responses
 */
export type AdminProductsCoverageApiResponse =
  | AdminProductsCoverageResponse
  | AdminProductsCoverageError;

// =============================================================================
// Transformation Types
// =============================================================================

/**
 * Joined database query result containing product with pricing and features
 *
 * This represents the shape of data returned from the optimized database query
 * that joins admin_products, admin_product_pricing, and admin_product_features.
 */
export interface AdminProductWithPricingAndFeatures {
  // Product fields
  id: string;
  name: string;
  slug: string;
  category: AdminProductCategory;
  service_type: string;
  description: string;
  long_description: string;
  speed_down: number;
  speed_up: number;
  is_symmetrical: boolean;
  contract_terms: number[];
  status: AdminProductStatus;
  version: number;
  is_current: boolean;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;

  // Pricing fields (from current_pricing CTE)
  price_regular: number;
  price_promo?: number;
  installation_fee: number;
  hardware_contribution: number;
  router_rental: number;
  is_promotional: boolean;
  promo_start_date?: string;
  promo_end_date?: string;

  // Features array (from product_features CTE)
  features: string[];
}

/**
 * Intermediate pricing calculation result
 *
 * Used during transformation to ServicePackage format.
 */
export interface PricingCalculationResult {
  price: number;
  originalPrice?: number;
  installation: number;
  originalInstallation?: number;
  router: number;
  originalRouter?: number;
  promotionalOffer?: {
    freeInstallation: boolean;
    freeRouter: boolean;
    discountedPrice?: number;
    validUntil?: string;
  };
}

// =============================================================================
// ServicePackage Interface (Existing - Must Remain Unchanged)
// =============================================================================

/**
 * ServicePackage interface - EXISTING INTERFACE - DO NOT MODIFY
 *
 * This interface is used throughout the existing codebase and must remain
 * unchanged to maintain backward compatibility. Admin products will be
 * transformed to this format.
 *
 * @see src/components/coverage/EnhancedCoverageCheck.tsx
 */
export interface ServicePackage {
  id: string;
  name: string;
  technology: TechnologyType;
  provider: string;
  speed: string;
  price: number;
  originalPrice?: number;
  installation: number;
  originalInstallation?: number;
  router: number;
  originalRouter?: number;
  contract: number;
  features: string[];
  available: boolean;
  isRecommended?: boolean;
  promotionalOffer?: {
    freeInstallation: boolean;
    freeRouter: boolean;
    discountedPrice?: number;
    validUntil?: string;
  };
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse(
  response: AdminProductsCoverageApiResponse
): response is AdminProductsCoverageResponse {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(
  response: AdminProductsCoverageApiResponse
): response is AdminProductsCoverageError {
  return response.success === false;
}

/**
 * Type for valid promotional pricing
 */
export interface ValidPromotionalPricing {
  price_promo: number;
  promo_start_date: string;
  promo_end_date: string;
  is_promotional: true;
}

/**
 * Type guard to check if promotional pricing is valid and active
 */
export function hasValidPromotionalPricing(
  pricing: AdminProductPricing
): pricing is AdminProductPricing & ValidPromotionalPricing {
  if (!pricing.is_promotional || !pricing.price_promo) return false;
  if (!pricing.promo_start_date || !pricing.promo_end_date) return false;

  const now = new Date();
  const startDate = new Date(pricing.promo_start_date);
  const endDate = new Date(pricing.promo_end_date);

  return startDate <= now && now <= endDate;
}

/**
 * Helper type for technology filtering in queries
 */
export interface TechnologyFilterOptions {
  technologies: TechnologyType[];
  includeInactive?: boolean;
  sortBy?: 'sort_order' | 'is_featured' | 'price_regular';
  sortDirection?: 'asc' | 'desc';
}