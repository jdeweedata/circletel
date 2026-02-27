/**
 * CPQ Rule Engine
 *
 * Business rules engine for pricing, discounts, and eligibility
 */

import { createClient } from '@/lib/supabase/server';
import {
  RoleType,
  PartnerTier,
  AdminRole,
  PricingRule,
  DiscountLimit,
  DiscountLimitsResult,
  RuleConditions,
  CheckEligibilityRequest,
  CheckEligibilityResponse,
  ValidatePricingRequest,
  ValidatePricingResponse,
  ServicePackage,
  CPQSessionItem,
} from './types';

// ============================================================================
// 1. GET DISCOUNT LIMITS
// ============================================================================

/**
 * Get discount limits for a specific role
 */
export async function getDiscountLimits(
  roleType: RoleType,
  roleName: PartnerTier | AdminRole | string
): Promise<DiscountLimitsResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cpq_discount_limits')
    .select('*')
    .eq('role_type', roleType)
    .eq('role_name', roleName)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('[cpq-rule-engine] Failed to get discount limits:', error);
    return null;
  }

  const limit = data as DiscountLimit;

  // Determine approvers based on role hierarchy
  const approvers: string[] = [];
  if (roleType === 'partner' || !limit.can_approve_discounts) {
    // Partners and non-approving roles need sales_manager or director
    approvers.push('sales_manager', 'director', 'super_admin');
  } else if (limit.can_approve_discounts && limit.max_approvable_discount < 50) {
    // Managers can approve up to their limit, higher needs director/super_admin
    approvers.push('director', 'super_admin');
  }

  return {
    max_discount: Number(limit.max_discount_percent),
    approval_threshold: Number(limit.approval_threshold_percent),
    can_approve_discounts: limit.can_approve_discounts,
    max_approvable_discount: Number(limit.max_approvable_discount),
    category_limits: limit.category_limits || undefined,
    approvers,
  };
}

// ============================================================================
// 2. CHECK ELIGIBILITY
// ============================================================================

/**
 * Check if a package is eligible for a user based on rules
 */
export async function checkEligibility(
  request: CheckEligibilityRequest
): Promise<CheckEligibilityResponse> {
  const supabase = await createClient();

  // Get the package details
  const { data: packageData, error: packageError } = await supabase
    .from('service_packages')
    .select('*')
    .eq('id', request.package_id)
    .single();

  if (packageError || !packageData) {
    return {
      eligible: false,
      reasons: ['Package not found'],
    };
  }

  const pkg = packageData as ServicePackage;

  // Check if package is active
  if (!pkg.active) {
    return {
      eligible: false,
      reasons: ['Package is not active'],
    };
  }

  // Get applicable rules
  const applicableRules = await getApplicableRules(
    request.package_id,
    pkg.product_category || undefined,
    pkg.customer_type || undefined,
    {
      quantity: request.quantity,
      contract_months: request.contract_term_months,
      role_type: request.user_type,
      role_name: request.role_name,
    }
  );

  // Calculate estimated discount from applicable rules
  let estimatedDiscount = 0;
  for (const rule of applicableRules) {
    // Database uses adjustment_type='percentage' and adjustment_value is negative for discounts
    if (rule.adjustment_type === 'percentage') {
      const discountValue = Math.abs(Number(rule.adjustment_value));
      if (rule.can_stack) {
        estimatedDiscount += discountValue;
      } else if (discountValue > estimatedDiscount) {
        estimatedDiscount = discountValue;
      }
    }
  }

  // Get discount limits
  const limits = await getDiscountLimits(request.user_type, request.role_name);
  if (limits) {
    estimatedDiscount = Math.min(estimatedDiscount, limits.max_discount);
  }

  return {
    eligible: true,
    applicable_rules: applicableRules,
    estimated_discount: estimatedDiscount,
  };
}

// ============================================================================
// 3. VALIDATE PRICING
// ============================================================================

/**
 * Validate requested discounts against user limits
 */
export async function validatePricing(
  request: ValidatePricingRequest
): Promise<ValidatePricingResponse> {
  // Get user's discount limits
  const limits = await getDiscountLimits(request.user_type, request.role_name);

  if (!limits) {
    return {
      valid: false,
      requires_approval: false,
      errors: ['Could not determine discount limits for this role'],
    };
  }

  const errors: string[] = [];
  const approvalRequired: ValidatePricingResponse['approval_required_for'] = [];
  let requiresApproval = false;

  for (const discount of request.discounts) {
    // Check if discount exceeds maximum
    if (discount.discount_percent > limits.max_discount) {
      errors.push(
        `Discount of ${discount.discount_percent}% for package ${discount.package_id} ` +
          `exceeds maximum allowed (${limits.max_discount}%)`
      );
      continue;
    }

    // Check if discount requires approval
    if (discount.discount_percent > limits.approval_threshold) {
      requiresApproval = true;
      approvalRequired.push({
        package_id: discount.package_id,
        site_index: discount.site_index,
        discount_percent: discount.discount_percent,
        max_allowed: limits.approval_threshold,
      });
    }
  }

  return {
    valid: errors.length === 0,
    requires_approval: requiresApproval,
    approval_required_for: approvalRequired.length > 0 ? approvalRequired : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ============================================================================
// 4. GET APPLICABLE RULES
// ============================================================================

interface RuleContext {
  quantity?: number;
  num_sites?: number;
  contract_months?: number;
  bundle_product_ids?: string[];
  bundle_categories?: string[];
  role_type?: RoleType;
  role_name?: string;
  customer_type?: string;
}

/**
 * Get all pricing rules applicable to a package/context
 */
export async function getApplicableRules(
  packageId?: string,
  productCategory?: string,
  customerType?: string,
  context?: RuleContext
): Promise<PricingRule[]> {
  const supabase = await createClient();

  // Get all active rules (database uses is_active and stack_priority)
  const { data: rules, error } = await supabase
    .from('cpq_pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('stack_priority', { ascending: true });

  if (error || !rules) {
    console.error('[cpq-rule-engine] Failed to get pricing rules:', error);
    return [];
  }

  const applicableRules: PricingRule[] = [];

  for (const rule of rules) {
    const pricingRule = rule as PricingRule;

    // Check product applicability (database uses applies_to_product_ids)
    if (
      pricingRule.applies_to_product_ids &&
      pricingRule.applies_to_product_ids.length > 0 &&
      packageId &&
      !pricingRule.applies_to_product_ids.includes(packageId)
    ) {
      continue;
    }

    // Check customer type applicability
    if (
      pricingRule.applies_to_customer_types &&
      pricingRule.applies_to_customer_types.length > 0 &&
      customerType &&
      !pricingRule.applies_to_customer_types.includes(customerType as 'business' | 'residential' | 'enterprise')
    ) {
      continue;
    }

    // Check partner tier applicability
    if (
      pricingRule.applies_to_partner_tiers &&
      pricingRule.applies_to_partner_tiers.length > 0 &&
      context?.role_type === 'partner' &&
      context?.role_name &&
      !pricingRule.applies_to_partner_tiers.includes(context.role_name as PartnerTier)
    ) {
      continue;
    }

    // Check conditions
    if (!checkRuleConditions(pricingRule.conditions, context)) {
      continue;
    }

    // Check validity period
    const now = new Date();
    if (pricingRule.valid_from && new Date(pricingRule.valid_from) > now) {
      continue;
    }
    if (pricingRule.valid_until && new Date(pricingRule.valid_until) < now) {
      continue;
    }

    applicableRules.push(pricingRule);
  }

  return applicableRules;
}

/**
 * Check if rule conditions are met
 */
function checkRuleConditions(conditions: RuleConditions, context?: RuleContext): boolean {
  if (!context) return true;
  if (!conditions || Object.keys(conditions).length === 0) return true;

  // Volume/site conditions (database uses min_sites)
  if (conditions.min_sites !== undefined && context.quantity !== undefined) {
    if (context.quantity < conditions.min_sites) return false;
  }
  if (conditions.min_quantity !== undefined && context.quantity !== undefined) {
    if (context.quantity < conditions.min_quantity) return false;
  }
  if (conditions.max_quantity !== undefined && context.quantity !== undefined) {
    if (context.quantity > conditions.max_quantity) return false;
  }

  // Contract conditions (database uses min_contract_term)
  if (conditions.min_contract_term !== undefined && context.contract_months !== undefined) {
    if (context.contract_months < conditions.min_contract_term) return false;
  }
  if (conditions.max_contract_term !== undefined && context.contract_months !== undefined) {
    if (context.contract_months > conditions.max_contract_term) return false;
  }

  // Bundle conditions (database uses requires_services)
  if (conditions.requires_services && conditions.requires_services.length > 0) {
    if (!context.bundle_categories) return false;
    const hasAllServices = conditions.requires_services.every((service) =>
      context.bundle_categories?.includes(service)
    );
    if (!hasAllServices) return false;
  }

  if (conditions.bundle_categories && conditions.bundle_categories.length > 0) {
    if (!context.bundle_categories) return false;
    const hasAllCategories = conditions.bundle_categories.every((cat) =>
      context.bundle_categories?.includes(cat)
    );
    if (!hasAllCategories) return false;
  }

  if (conditions.bundle_products && conditions.bundle_products.length > 0) {
    if (!context.bundle_product_ids) return false;
    const hasAllProducts = conditions.bundle_products.every((prod) =>
      context.bundle_product_ids?.includes(prod)
    );
    if (!hasAllProducts) return false;
  }

  // Customer type condition
  if (conditions.customer_type && context.customer_type) {
    if (context.customer_type !== conditions.customer_type) return false;
  }

  // Partner tier conditions
  if (conditions.partner_tiers && conditions.partner_tiers.length > 0) {
    if (context.role_type !== 'partner') return false;
    if (!context.role_name || !conditions.partner_tiers.includes(context.role_name as PartnerTier)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// 5. CALCULATE FINAL PRICE
// ============================================================================

interface CalculatePriceResult {
  original_price: number;
  discount_amount: number;
  discount_percent: number;
  final_price: number;
  applied_rules: Array<{
    rule_id: string;
    rule_name: string;
    discount_value: number;
  }>;
}

/**
 * Calculate final price after applying all applicable rules and manual discounts
 */
export async function calculateFinalPrice(
  basePrice: number,
  quantity: number,
  manualDiscountPercent: number,
  applicableRules: PricingRule[]
): Promise<CalculatePriceResult> {
  const originalPrice = basePrice * quantity;
  let totalDiscountPercent = 0;
  const appliedRules: CalculatePriceResult['applied_rules'] = [];

  // Apply rules in priority order (already sorted by stack_priority)
  for (const rule of applicableRules) {
    // Database uses adjustment_type and adjustment_value (negative for discounts)
    if (rule.adjustment_type === 'percentage') {
      // adjustment_value is negative for discounts (e.g., -5.00 for 5% off)
      const discountValue = Math.abs(Number(rule.adjustment_value));

      if (rule.can_stack) {
        totalDiscountPercent += discountValue;
      } else if (discountValue > totalDiscountPercent) {
        // Non-stackable rule replaces if higher
        totalDiscountPercent = discountValue;
      }

      appliedRules.push({
        rule_id: rule.id,
        rule_name: rule.name,
        discount_value: discountValue,
      });
    }
  }

  // Add manual discount
  totalDiscountPercent += manualDiscountPercent;

  // Cap discount at reasonable maximum (100%)
  totalDiscountPercent = Math.min(totalDiscountPercent, 100);

  const discountAmount = (originalPrice * totalDiscountPercent) / 100;
  const finalPrice = originalPrice - discountAmount;

  return {
    original_price: originalPrice,
    discount_amount: discountAmount,
    discount_percent: totalDiscountPercent,
    final_price: Math.max(finalPrice, 0), // Never negative
    applied_rules: appliedRules,
  };
}

// ============================================================================
// 6. CHECK APPROVAL REQUIRED
// ============================================================================

interface ApprovalCheckResult {
  requires_approval: boolean;
  reason?: string;
  approvers?: string[];
  threshold_exceeded_by?: number;
}

/**
 * Check if approval is required for a specific discount
 */
export async function checkApprovalRequired(
  discountPercent: number,
  roleType: RoleType,
  roleName: PartnerTier | AdminRole | string
): Promise<ApprovalCheckResult> {
  const limits = await getDiscountLimits(roleType, roleName);

  if (!limits) {
    return {
      requires_approval: true,
      reason: 'Could not determine discount limits - approval required by default',
    };
  }

  // Check if exceeds maximum allowed
  if (discountPercent > limits.max_discount) {
    return {
      requires_approval: true,
      reason: `Discount of ${discountPercent}% exceeds maximum allowed (${limits.max_discount}%)`,
      approvers: limits.approvers,
      threshold_exceeded_by: discountPercent - limits.max_discount,
    };
  }

  // Check if exceeds approval threshold
  if (discountPercent > limits.approval_threshold) {
    return {
      requires_approval: true,
      reason: `Discount of ${discountPercent}% exceeds approval threshold (${limits.approval_threshold}%)`,
      approvers: limits.approvers,
      threshold_exceeded_by: discountPercent - limits.approval_threshold,
    };
  }

  return {
    requires_approval: false,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total price for multiple session items
 */
export async function calculateSessionTotal(
  items: CPQSessionItem[],
  roleType: RoleType,
  roleName: string
): Promise<{
  subtotal: number;
  total_discount: number;
  total: number;
  requires_approval: boolean;
}> {
  let subtotal = 0;
  let totalDiscount = 0;
  let requiresApproval = false;

  for (const item of items) {
    const itemSubtotal = item.base_price * item.quantity;
    subtotal += itemSubtotal;
    totalDiscount += item.discount_amount;

    // Check if any item requires approval
    const approvalCheck = await checkApprovalRequired(
      item.discount_percent,
      roleType,
      roleName
    );
    if (approvalCheck.requires_approval) {
      requiresApproval = true;
    }
  }

  return {
    subtotal,
    total_discount: totalDiscount,
    total: subtotal - totalDiscount,
    requires_approval: requiresApproval,
  };
}

/**
 * Get all discount limits for display purposes
 */
export async function getAllDiscountLimits(): Promise<DiscountLimit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cpq_discount_limits')
    .select('*')
    .eq('is_active', true)
    .order('role_type')
    .order('max_discount_percent', { ascending: true });

  if (error || !data) {
    console.error('[cpq-rule-engine] Failed to get all discount limits:', error);
    return [];
  }

  return data as DiscountLimit[];
}

/**
 * Get all active pricing rules for display purposes
 */
export async function getAllPricingRules(): Promise<PricingRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cpq_pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('stack_priority', { ascending: true });

  if (error || !data) {
    console.error('[cpq-rule-engine] Failed to get all pricing rules:', error);
    return [];
  }

  return data as PricingRule[];
}
