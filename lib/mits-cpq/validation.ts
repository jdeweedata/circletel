/**
 * MITS CPQ Validation
 *
 * Step-level validation functions for the MITS wizard.
 * Each function returns a MITSValidationResult with valid flag and error messages.
 */

import type {
  MITSWizardStep,
  MITSStepData,
  MITSTier,
  MITSValidationResult,
} from './types';

// ============================================================================
// HELPERS
// ============================================================================

function result(errors: string[]): MITSValidationResult {
  return { valid: errors.length === 0, errors };
}

/** Basic email format check */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Basic South African mobile / landline check (10 digits, starts 0) */
function isValidPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone.replace(/[\s\-()]/g, ''));
}

// ============================================================================
// STEP VALIDATORS
// ============================================================================

/**
 * Tier Selection — user must pick at least 1 user and select a tier.
 */
export function validateTierSelection(
  data: MITSStepData,
  tiers: MITSTier[]
): MITSValidationResult {
  const errors: string[] = [];
  const step = data.tier_selection;

  if (!step) {
    errors.push('Tier selection data is missing.');
    return result(errors);
  }

  if (!step.user_count || step.user_count < 1) {
    errors.push('User count must be at least 1.');
  }

  if (!step.selected_tier_code) {
    errors.push('Please select a service tier.');
  } else {
    const tierExists = tiers.some(
      (t) => t.tier_code === step.selected_tier_code && t.is_active
    );
    if (!tierExists) {
      errors.push('Selected tier is not available.');
    }
  }

  return result(errors);
}

/**
 * M365 Config — additional licences cannot be negative; domain must be valid if provided.
 */
export function validateM365Config(data: MITSStepData): MITSValidationResult {
  const errors: string[] = [];
  const step = data.m365_config;

  if (!step) {
    errors.push('Microsoft 365 configuration data is missing.');
    return result(errors);
  }

  if (step.additional_licences < 0) {
    errors.push('Additional licences cannot be negative.');
  }

  if (step.domain !== undefined && step.domain.trim() !== '') {
    // Basic domain validation: at least one dot, no spaces, no protocol prefix
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(step.domain.trim())) {
      errors.push('Domain name is not valid (e.g. company.co.za).');
    }
  }

  return result(errors);
}

/**
 * Add-Ons — any selected module must have a quantity of at least 1.
 */
export function validateAddOns(data: MITSStepData): MITSValidationResult {
  const errors: string[] = [];
  const step = data.add_ons;

  // Add-ons are entirely optional — if the section is missing or empty, that's fine
  if (!step || step.selected_modules.length === 0) {
    return result(errors);
  }

  step.selected_modules.forEach((mod, idx) => {
    if (mod.quantity < 1) {
      errors.push(
        `Module "${mod.module_name}" (index ${idx + 1}) must have a quantity of at least 1.`
      );
    }
  });

  return result(errors);
}

/**
 * Pricing — discount must be 0–100%, contract term at least 1 month.
 */
export function validatePricing(data: MITSStepData): MITSValidationResult {
  const errors: string[] = [];
  const step = data.pricing;

  if (!step) {
    errors.push('Pricing data is missing.');
    return result(errors);
  }

  if (step.discount_percent < 0 || step.discount_percent > 100) {
    errors.push('Discount must be between 0% and 100%.');
  }

  if (!step.contract_term_months || step.contract_term_months < 1) {
    errors.push('Contract term must be at least 1 month.');
  }

  return result(errors);
}

/**
 * Customer Details — company name, contact details, address and coverage check required.
 */
export function validateCustomer(data: MITSStepData): MITSValidationResult {
  const errors: string[] = [];
  const step = data.customer;

  if (!step) {
    errors.push('Customer details are missing.');
    return result(errors);
  }

  if (!step.company_name || step.company_name.trim().length < 2) {
    errors.push('Company name is required (minimum 2 characters).');
  }

  if (!step.contact_name || step.contact_name.trim().length < 2) {
    errors.push('Contact name is required.');
  }

  if (!step.contact_email || !isValidEmail(step.contact_email)) {
    errors.push('A valid contact email address is required.');
  }

  if (!step.contact_phone || !isValidPhone(step.contact_phone)) {
    errors.push('A valid 10-digit South African phone number is required.');
  }

  if (!step.billing_address || step.billing_address.trim().length < 5) {
    errors.push('Billing address is required.');
  }

  if (!step.city || step.city.trim().length < 2) {
    errors.push('City is required.');
  }

  if (!step.province || step.province.trim().length < 2) {
    errors.push('Province is required.');
  }

  if (!step.postal_code || !/^\d{4}$/.test(step.postal_code.trim())) {
    errors.push('A valid 4-digit postal code is required.');
  }

  if (!step.coverage_checked) {
    errors.push('Coverage / feasibility must be confirmed before proceeding.');
  }

  return result(errors);
}

/**
 * Review — terms must be accepted before generating a quote.
 */
export function validateReview(data: MITSStepData): MITSValidationResult {
  const errors: string[] = [];
  const step = data.review;

  if (!step) {
    errors.push('Review data is missing.');
    return result(errors);
  }

  if (!step.terms_accepted) {
    errors.push('You must accept the terms and conditions to proceed.');
  }

  return result(errors);
}

/**
 * Route to the correct validator for a given step.
 */
export function validateStep(
  step: MITSWizardStep,
  data: MITSStepData,
  tiers: MITSTier[] = []
): MITSValidationResult {
  switch (step) {
    case 'tier_selection':
      return validateTierSelection(data, tiers);
    case 'm365_config':
      return validateM365Config(data);
    case 'add_ons':
      return validateAddOns(data);
    case 'pricing':
      return validatePricing(data);
    case 'customer':
      return validateCustomer(data);
    case 'review':
      return validateReview(data);
    default: {
      // Exhaustive check — TypeScript will warn if a new step is added without a case
      const _exhaustive: never = step;
      return { valid: false, errors: [`Unknown step: ${_exhaustive}`] };
    }
  }
}
