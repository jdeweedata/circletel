/**
 * CPQ Rule Engine Service
 *
 * Evaluates pricing rules, discount limits, and product eligibility
 * for the CPQ system. Integrates with existing quote infrastructure.
 */

import { createClient } from '@/lib/supabase/server';
import {
  type CPQDiscountLimit,
  type CPQPricingRule,
  type CPQProductEligibility,
  type DiscountLimitsResult,
  type EligibilityCheckResult,
  type ValidatePricingResult,
  type ApplicableRule,
  type RoleType,
  type PartnerTier,
  type AdminRole,
  type CoverageType,
  type CustomerType,
  type PricingRuleConditions,
  type SelectedPackage,
} from './types';

// ============================================================================
// Discount Limits
// ============================================================================

/**
 * Get discount limits for a specific role
 */
export async function getDiscountLimits(
  roleType: RoleType,
  roleName: PartnerTier | AdminRole
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
    console.error('[CPQ] Failed to get discount limits:', error);
    return null;
  }

  const limit = data as CPQDiscountLimit;

  return {
    maxDiscount: Number(limit.max_discount_percent),
    approvalThreshold: Number(limit.approval_threshold_percent),
    canApproveDiscounts: limit.can_approve_discounts,
    maxApprovableDiscount: Number(limit.max_approvable_discount),
  };
}

/**
 * Get all active discount limits (for admin management)
 */
export async function getAllDiscountLimits(): Promise<CPQDiscountLimit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cpq_discount_limits')
    .select('*')
    .eq('is_active', true)
    .order('role_type')
    .order('max_discount_percent');

  if (error) {
    console.error('[CPQ] Failed to get all discount limits:', error);
    return [];
  }

  return data as CPQDiscountLimit[];
}

// ============================================================================
// Product Eligibility
// ============================================================================

/**
 * Check if a product is eligible for a specific context
 */
export async function checkEligibility(
  productId: string,
  coverageType: CoverageType,
  customerType: CustomerType,
  partnerTier?: PartnerTier,
  region?: string,
  quantity: number = 1
): Promise<EligibilityCheckResult> {
  const supabase = await createClient();

  // Get eligibility rules for product
  const { data, error } = await supabase
    .from('cpq_product_eligibility')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();

  // If no eligibility record, product is eligible by default
  if (error?.code === 'PGRST116' || !data) {
    return {
      eligible: true,
      reasons: ['No restrictions defined'],
    };
  }

  if (error) {
    console.error('[CPQ] Failed to check eligibility:', error);
    return {
      eligible: false,
      reasons: ['Unable to check eligibility'],
    };
  }

  const eligibility = data as CPQProductEligibility;
  const reasons: string[] = [];

  // Check coverage type
  if (!eligibility.coverage_types.includes(coverageType)) {
    reasons.push(
      `Product not available for ${coverageType} coverage. Available: ${eligibility.coverage_types.join(', ')}`
    );
  }

  // Check customer type
  if (!eligibility.customer_types.includes(customerType)) {
    reasons.push(
      `Product not available for ${customerType} customers. Available: ${eligibility.customer_types.join(', ')}`
    );
  }

  // Check partner tier (if specified and if restrictions exist)
  if (partnerTier && eligibility.partner_tiers && eligibility.partner_tiers.length > 0) {
    if (!eligibility.partner_tiers.includes(partnerTier)) {
      reasons.push(
        `Product not available for ${partnerTier} partners. Required: ${eligibility.partner_tiers.join(', ')}`
      );
    }
  }

  // Check region (if specified and if restrictions exist)
  if (region) {
    const regionLower = region.toLowerCase();

    // Check excluded regions
    if (eligibility.excluded_regions?.some(r => r.toLowerCase() === regionLower)) {
      reasons.push(`Product not available in ${region}`);
    }

    // Check allowed regions (only if specified)
    if (
      eligibility.allowed_regions &&
      eligibility.allowed_regions.length > 0 &&
      !eligibility.allowed_regions.some(r => r.toLowerCase() === regionLower)
    ) {
      reasons.push(
        `Product only available in: ${eligibility.allowed_regions.join(', ')}`
      );
    }
  }

  // Check quantity
  if (quantity < eligibility.min_quantity) {
    reasons.push(`Minimum quantity: ${eligibility.min_quantity}`);
  }
  if (quantity > eligibility.max_quantity) {
    reasons.push(`Maximum quantity: ${eligibility.max_quantity}`);
  }

  return {
    eligible: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : ['Eligible'],
    restrictions: {
      minQuantity: eligibility.min_quantity,
      maxQuantity: eligibility.max_quantity,
      allowedRegions: eligibility.allowed_regions ?? undefined,
    },
  };
}

// ============================================================================
// Pricing Validation
// ============================================================================

/**
 * Validate if a discount is within allowed limits
 */
export async function validatePricing(
  discountPercent: number,
  roleType: RoleType,
  roleName: PartnerTier | AdminRole,
  productIds?: string[]
): Promise<ValidatePricingResult> {
  const limits = await getDiscountLimits(roleType, roleName);

  if (!limits) {
    return {
      valid: false,
      requires_approval: true,
      max_allowed_discount: 0,
      approval_threshold: 0,
      reasons: ['Unable to determine discount limits for role'],
    };
  }

  const reasons: string[] = [];

  // Check if discount exceeds maximum allowed
  if (discountPercent > limits.maxDiscount) {
    reasons.push(
      `Discount ${discountPercent}% exceeds maximum allowed ${limits.maxDiscount}% for ${roleName}`
    );
  }

  // Determine if approval is required
  const requiresApproval = discountPercent > limits.approvalThreshold;

  if (requiresApproval && reasons.length === 0) {
    reasons.push(
      `Discount ${discountPercent}% exceeds auto-approval threshold of ${limits.approvalThreshold}%`
    );
  }

  return {
    valid: reasons.length === 0 || (reasons.length > 0 && discountPercent <= limits.maxDiscount),
    requires_approval: requiresApproval,
    max_allowed_discount: limits.maxDiscount,
    approval_threshold: limits.approvalThreshold,
    reasons: reasons.length > 0 ? reasons : ['Discount is within allowed limits'],
  };
}

// ============================================================================
// Pricing Rules Evaluation
// ============================================================================

/**
 * Get all applicable pricing rules for a quote context
 */
export async function getApplicableRules(
  context: {
    sites: number;
    contractTerm: number;
    coverageTypes: CoverageType[];
    customerType: CustomerType;
    partnerTier?: PartnerTier;
    productIds: string[];
    monthlyValue: number;
    services?: string[];
  }
): Promise<ApplicableRule[]> {
  const supabase = await createClient();

  // Get all active pricing rules
  const { data: rules, error } = await supabase
    .from('cpq_pricing_rules')
    .select('*')
    .eq('is_active', true)
    .or('valid_until.is.null,valid_until.gt.now()')
    .order('stack_priority', { ascending: false });

  if (error || !rules) {
    console.error('[CPQ] Failed to get pricing rules:', error);
    return [];
  }

  const applicableRules: ApplicableRule[] = [];

  for (const rule of rules as CPQPricingRule[]) {
    const { applicable, reason } = evaluateRuleConditions(rule, context);

    if (applicable) {
      const adjustmentAmount = calculateAdjustment(
        rule.adjustment_type,
        rule.adjustment_value,
        context.monthlyValue
      );

      applicableRules.push({
        rule,
        adjustmentAmount,
        reason,
      });
    }
  }

  return applicableRules;
}

/**
 * Evaluate if a rule's conditions are met
 */
function evaluateRuleConditions(
  rule: CPQPricingRule,
  context: {
    sites: number;
    contractTerm: number;
    coverageTypes: CoverageType[];
    customerType: CustomerType;
    partnerTier?: PartnerTier;
    productIds: string[];
    monthlyValue: number;
    services?: string[];
  }
): { applicable: boolean; reason: string } {
  const conditions = rule.conditions as PricingRuleConditions;

  // Check product applicability
  if (
    rule.applies_to_product_ids &&
    rule.applies_to_product_ids.length > 0 &&
    !context.productIds.some(id => rule.applies_to_product_ids!.includes(id))
  ) {
    return { applicable: false, reason: 'Product not in applicable list' };
  }

  // Check partner tier applicability
  if (
    rule.applies_to_partner_tiers &&
    rule.applies_to_partner_tiers.length > 0 &&
    context.partnerTier &&
    !rule.applies_to_partner_tiers.includes(context.partnerTier)
  ) {
    return { applicable: false, reason: 'Partner tier not eligible' };
  }

  // Check customer type applicability
  if (
    rule.applies_to_customer_types &&
    rule.applies_to_customer_types.length > 0 &&
    !rule.applies_to_customer_types.includes(context.customerType)
  ) {
    return { applicable: false, reason: 'Customer type not eligible' };
  }

  // Evaluate conditions
  if (conditions.min_sites && context.sites < conditions.min_sites) {
    return {
      applicable: false,
      reason: `Requires ${conditions.min_sites}+ sites, have ${context.sites}`,
    };
  }

  if (conditions.max_sites && context.sites > conditions.max_sites) {
    return {
      applicable: false,
      reason: `Maximum ${conditions.max_sites} sites, have ${context.sites}`,
    };
  }

  if (conditions.min_contract_term && context.contractTerm < conditions.min_contract_term) {
    return {
      applicable: false,
      reason: `Requires ${conditions.min_contract_term}+ month contract, have ${context.contractTerm}`,
    };
  }

  if (conditions.max_contract_term && context.contractTerm > conditions.max_contract_term) {
    return {
      applicable: false,
      reason: `Maximum ${conditions.max_contract_term} month contract, have ${context.contractTerm}`,
    };
  }

  if (conditions.coverage_types && conditions.coverage_types.length > 0) {
    const hasMatchingCoverage = conditions.coverage_types.some(ct =>
      context.coverageTypes.includes(ct)
    );
    if (!hasMatchingCoverage) {
      return {
        applicable: false,
        reason: `Requires coverage: ${conditions.coverage_types.join(', ')}`,
      };
    }
  }

  if (conditions.customer_type && context.customerType !== conditions.customer_type) {
    return {
      applicable: false,
      reason: `Requires ${conditions.customer_type} customer`,
    };
  }

  if (conditions.requires_services && conditions.requires_services.length > 0) {
    const services = context.services ?? [];
    const hasAllServices = conditions.requires_services.every(s =>
      services.includes(s)
    );
    if (!hasAllServices) {
      return {
        applicable: false,
        reason: `Requires services: ${conditions.requires_services.join(', ')}`,
      };
    }
  }

  if (conditions.min_monthly_value && context.monthlyValue < conditions.min_monthly_value) {
    return {
      applicable: false,
      reason: `Requires R${conditions.min_monthly_value}+ monthly value`,
    };
  }

  if (conditions.max_monthly_value && context.monthlyValue > conditions.max_monthly_value) {
    return {
      applicable: false,
      reason: `Maximum R${conditions.max_monthly_value} monthly value`,
    };
  }

  // All conditions met
  return {
    applicable: true,
    reason: rule.description ?? rule.name,
  };
}

/**
 * Calculate the adjustment amount based on type and value
 */
function calculateAdjustment(
  adjustmentType: 'percentage' | 'fixed_amount',
  adjustmentValue: number,
  baseAmount: number
): number {
  if (adjustmentType === 'percentage') {
    return (baseAmount * adjustmentValue) / 100;
  }
  return adjustmentValue;
}

// ============================================================================
// Combined Pricing Calculation
// ============================================================================

/**
 * Calculate total pricing with all applicable rules and discounts
 */
export async function calculateTotalPricing(
  selectedPackages: SelectedPackage[],
  context: {
    contractTerm: number;
    customerType: CustomerType;
    coverageTypes: CoverageType[];
    partnerTier?: PartnerTier;
    manualDiscountPercent?: number;
  },
  roleType: RoleType,
  roleName: PartnerTier | AdminRole
): Promise<{
  subtotal: number;
  automaticDiscounts: ApplicableRule[];
  automaticDiscountTotal: number;
  manualDiscount: number;
  totalDiscount: number;
  finalTotal: number;
  requiresApproval: boolean;
  setupFees: number;
}> {
  // Calculate subtotal
  const subtotal = selectedPackages.reduce(
    (sum, pkg) => sum + pkg.monthly_price * pkg.quantity,
    0
  );

  const setupFees = selectedPackages.reduce(
    (sum, pkg) => sum + pkg.setup_fee * pkg.quantity,
    0
  );

  // Get applicable automatic rules
  const automaticDiscounts = await getApplicableRules({
    sites: selectedPackages.length,
    contractTerm: context.contractTerm,
    coverageTypes: context.coverageTypes,
    customerType: context.customerType,
    partnerTier: context.partnerTier,
    productIds: selectedPackages.map(p => p.product_id),
    monthlyValue: subtotal,
  });

  // Calculate automatic discount total
  const automaticDiscountTotal = automaticDiscounts.reduce(
    (sum, rule) => sum + Math.abs(rule.adjustmentAmount),
    0
  );

  // Calculate manual discount
  const manualDiscountPercent = context.manualDiscountPercent ?? 0;
  const manualDiscount = (subtotal * manualDiscountPercent) / 100;

  // Total discount
  const totalDiscount = automaticDiscountTotal + manualDiscount;

  // Calculate total discount percent for validation
  const totalDiscountPercent = (totalDiscount / subtotal) * 100;

  // Validate the total discount
  const validation = await validatePricing(
    totalDiscountPercent,
    roleType,
    roleName
  );

  return {
    subtotal,
    automaticDiscounts,
    automaticDiscountTotal,
    manualDiscount,
    totalDiscount,
    finalTotal: Math.max(0, subtotal - totalDiscount),
    requiresApproval: validation.requires_approval,
    setupFees,
  };
}

// ============================================================================
// Approval Workflow
// ============================================================================

/**
 * Find an appropriate approver for a discount request
 */
export async function findApprover(
  discountPercent: number
): Promise<{ approverId: string; approverRole: string } | null> {
  const supabase = await createClient();

  // Find roles that can approve this discount level
  const { data: limits, error } = await supabase
    .from('cpq_discount_limits')
    .select('role_type, role_name, max_approvable_discount')
    .eq('can_approve_discounts', true)
    .gte('max_approvable_discount', discountPercent)
    .eq('is_active', true)
    .order('max_approvable_discount', { ascending: true })
    .limit(1);

  if (error || !limits || limits.length === 0) {
    return null;
  }

  const requiredRole = limits[0].role_name;

  // Find an admin user with this role
  const { data: admins, error: adminError } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('role', requiredRole)
    .eq('is_active', true)
    .limit(1);

  if (adminError || !admins || admins.length === 0) {
    // Escalate to super_admin if no specific role found
    const { data: superAdmins } = await supabase
      .from('admin_users')
      .select('id')
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .limit(1);

    if (superAdmins && superAdmins.length > 0) {
      return {
        approverId: superAdmins[0].id,
        approverRole: 'super_admin',
      };
    }
    return null;
  }

  return {
    approverId: admins[0].id,
    approverRole: requiredRole,
  };
}
