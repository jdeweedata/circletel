/**
 * Policy Version Constants
 *
 * Centralized policy version tracking for legal compliance.
 * Update these versions whenever policy pages are modified.
 *
 * Used by:
 * - Payment consent tracking (payment_consents table)
 * - Policy page metadata
 * - Audit logs
 */

export const POLICY_VERSIONS = {
  /**
   * Terms & Conditions version
   * Last updated: 2026-03-06
   * Location: /terms-of-service
   */
  TERMS: '2026-03-06',

  /**
   * Privacy Policy version
   * Last updated: 2025-01-20
   * Location: /privacy-policy
   */
  PRIVACY: '2025-01-20',

  /**
   * Payment Terms version
   * Last updated: 2025-01-20
   * Location: /payment-terms
   */
  PAYMENT_TERMS: '2025-01-20',

  /**
   * Refund & Cancellation Policy version
   * Last updated: 2025-01-20
   * Location: /refund-policy
   */
  REFUND_POLICY: '2025-01-20',
} as const;

/**
 * Policy URLs for linking in consent forms
 */
export const POLICY_URLS = {
  TERMS: '/terms-of-service',
  PRIVACY: '/privacy-policy',
  PAYMENT_TERMS: '/payment-terms',
  REFUND_POLICY: '/refund-policy',
} as const;

/**
 * Policy names for display
 */
export const POLICY_NAMES = {
  TERMS: 'Terms & Conditions',
  PRIVACY: 'Privacy Policy',
  PAYMENT_TERMS: 'Payment Terms',
  REFUND_POLICY: 'Refund & Cancellation Policy',
} as const;

/**
 * Helper function to get all current policy versions
 */
export function getCurrentPolicyVersions() {
  return {
    terms_version: POLICY_VERSIONS.TERMS,
    privacy_version: POLICY_VERSIONS.PRIVACY,
    payment_terms_version: POLICY_VERSIONS.PAYMENT_TERMS,
    refund_policy_version: POLICY_VERSIONS.REFUND_POLICY,
  };
}

/**
 * Type for policy consent object
 */
export interface PolicyConsent {
  terms_version: string;
  privacy_version: string;
  payment_terms_version: string;
  refund_policy_version: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  payment_terms_accepted: boolean;
  refund_policy_acknowledged: boolean;
  recurring_payment_authorized?: boolean;
  marketing_consent?: boolean;
}

/**
 * UI consent interface (used by payment forms)
 */
export interface UIPaymentConsents {
  terms: boolean;
  privacy: boolean;
  paymentTerms: boolean;
  refundPolicy: boolean;
  recurringPayment?: boolean;
  marketing?: boolean;
  whatsappNotifications?: boolean;
  // B2B specific
  dataProcessing?: boolean;
  thirdPartyDisclosure?: boolean;
  businessVerification?: boolean;
}

/**
 * Validate that all required consents are accepted
 * Supports both PolicyConsent and UI consent formats
 */
export function validateConsents(consents: Partial<PolicyConsent> | UIPaymentConsents): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if this is UI format (has 'terms' as boolean) or PolicyConsent format
  if ('terms' in consents && typeof consents.terms === 'boolean') {
    // UI format validation
    const uiConsents = consents as UIPaymentConsents;
    if (!uiConsents.terms) {
      errors.push('You must accept the Terms & Conditions');
    }
    if (!uiConsents.privacy) {
      errors.push('You must accept the Privacy Policy');
    }
    if (!uiConsents.paymentTerms) {
      errors.push('You must accept the Payment Terms');
    }
  } else {
    // PolicyConsent format validation
    const policyConsents = consents as Partial<PolicyConsent>;
    if (!policyConsents.terms_accepted) {
      errors.push('You must accept the Terms & Conditions');
    }
    if (!policyConsents.privacy_accepted) {
      errors.push('You must accept the Privacy Policy');
    }
    if (!policyConsents.payment_terms_accepted) {
      errors.push('You must accept the Payment Terms');
    }
  }

  // Refund policy acknowledgment is optional (not required)

  return {
    valid: errors.length === 0,
    errors,
  };
}
