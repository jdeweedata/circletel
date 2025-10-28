/**
 * Quote Validation
 *
 * Validates quote data, business rules, and state transitions
 */

import type {
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteStatus,
  SignQuoteRequest,
  BusinessQuote,
  ContractTerm
} from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate create quote request
 */
export function validateCreateQuoteRequest(
  request: CreateQuoteRequest
): ValidationResult {
  const errors: string[] = [];

  // Company details
  if (!request.company_name || request.company_name.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (request.company_name && request.company_name.length > 200) {
    errors.push('Company name must be 200 characters or less');
  }

  // Registration number (optional but validated if provided)
  if (
    request.registration_number &&
    !/^\d{4}\/\d{6}\/\d{2}$/.test(request.registration_number)
  ) {
    errors.push(
      'Registration number must be in format YYYY/NNNNNN/NN (e.g., 2020/123456/07)'
    );
  }

  // VAT number (optional but validated if provided)
  if (request.vat_number && !/^\d{10}$/.test(request.vat_number)) {
    errors.push('VAT number must be 10 digits');
  }

  // Contact details
  if (!request.contact_name || request.contact_name.trim().length === 0) {
    errors.push('Contact name is required');
  }

  if (!request.contact_email || !isValidEmail(request.contact_email)) {
    errors.push('Valid contact email is required');
  }

  if (!request.contact_phone || !isValidSAPhone(request.contact_phone)) {
    errors.push('Valid South African phone number is required');
  }

  // Service address
  if (!request.service_address || request.service_address.trim().length === 0) {
    errors.push('Service address is required');
  }

  // Contract term
  if (![12, 24, 36].includes(request.contract_term)) {
    errors.push('Contract term must be 12, 24, or 36 months');
  }

  // Items
  if (!request.items || request.items.length === 0) {
    errors.push('At least one service item is required');
  }

  if (request.items && request.items.length > 10) {
    errors.push('Maximum 10 service items allowed per quote');
  }

  // Validate items
  request.items?.forEach((item, index) => {
    if (!item.package_id) {
      errors.push(`Item ${index + 1}: Package ID is required`);
    }

    if (item.quantity && (item.quantity < 1 || item.quantity > 100)) {
      errors.push(`Item ${index + 1}: Quantity must be between 1 and 100`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate update quote request
 */
export function validateUpdateQuoteRequest(
  request: UpdateQuoteRequest
): ValidationResult {
  const errors: string[] = [];

  // Company name
  if (request.company_name !== undefined) {
    if (request.company_name.trim().length === 0) {
      errors.push('Company name cannot be empty');
    }
    if (request.company_name.length > 200) {
      errors.push('Company name must be 200 characters or less');
    }
  }

  // Registration number
  if (
    request.registration_number &&
    !/^\d{4}\/\d{6}\/\d{2}$/.test(request.registration_number)
  ) {
    errors.push('Invalid registration number format');
  }

  // VAT number
  if (request.vat_number && !/^\d{10}$/.test(request.vat_number)) {
    errors.push('VAT number must be 10 digits');
  }

  // Contact email
  if (request.contact_email && !isValidEmail(request.contact_email)) {
    errors.push('Invalid email address');
  }

  // Contact phone
  if (request.contact_phone && !isValidSAPhone(request.contact_phone)) {
    errors.push('Invalid phone number');
  }

  // Contract term
  if (
    request.contract_term &&
    ![12, 24, 36].includes(request.contract_term)
  ) {
    errors.push('Contract term must be 12, 24, or 36 months');
  }

  // Discount validation
  if (
    request.custom_discount_percent !== undefined &&
    (request.custom_discount_percent < 0 || request.custom_discount_percent > 100)
  ) {
    errors.push('Discount percentage must be between 0 and 100');
  }

  if (
    request.custom_discount_amount !== undefined &&
    request.custom_discount_amount < 0
  ) {
    errors.push('Discount amount cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate sign quote request
 */
export function validateSignQuoteRequest(
  request: SignQuoteRequest
): ValidationResult {
  const errors: string[] = [];

  if (!request.signer_name || request.signer_name.trim().length === 0) {
    errors.push('Signer name is required');
  }

  if (!request.signer_email || !isValidEmail(request.signer_email)) {
    errors.push('Valid signer email is required');
  }

  if (!request.signer_id_number || !isValidSAIDNumber(request.signer_id_number)) {
    errors.push('Valid South African ID number is required');
  }

  if (!request.signature_data || request.signature_data.trim().length === 0) {
    errors.push('Signature is required');
  }

  if (!request.terms_accepted) {
    errors.push('Terms and conditions must be accepted');
  }

  if (!request.fica_documents_confirmed) {
    errors.push('FICA documents must be confirmed');
  }

  if (!request.cipc_documents_confirmed) {
    errors.push('CIPC documents must be confirmed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate quote status transition
 */
export function validateStatusTransition(
  currentStatus: QuoteStatus,
  newStatus: QuoteStatus
): ValidationResult {
  const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
    draft: ['pending_approval', 'rejected'],
    pending_approval: ['approved', 'rejected', 'draft'],
    approved: ['sent', 'rejected'],
    sent: ['viewed', 'rejected', 'expired'],
    viewed: ['accepted', 'rejected', 'expired'],
    accepted: [], // Terminal state
    rejected: ['draft'], // Can recreate
    expired: ['draft'] // Can recreate
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      errors: [
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
      ]
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Check if quote can be edited
 */
export function canEditQuote(quote: BusinessQuote): boolean {
  return ['draft', 'pending_approval', 'approved'].includes(quote.status);
}

/**
 * Check if quote can be deleted
 */
export function canDeleteQuote(quote: BusinessQuote): boolean {
  return ['draft', 'rejected', 'expired'].includes(quote.status);
}

/**
 * Check if quote can be sent
 */
export function canSendQuote(quote: BusinessQuote): boolean {
  return quote.status === 'approved';
}

/**
 * Check if quote can be signed
 */
export function canSignQuote(quote: BusinessQuote): boolean {
  return ['sent', 'viewed'].includes(quote.status) && !isQuoteExpired(quote);
}

/**
 * Check if quote is expired
 */
export function isQuoteExpired(quote: BusinessQuote): boolean {
  const validUntil = new Date(quote.valid_until);
  const now = new Date();
  return now > validUntil;
}

/**
 * Get days until quote expires
 */
export function getDaysUntilExpiry(quote: BusinessQuote): number {
  const validUntil = new Date(quote.valid_until);
  const now = new Date();
  const diffTime = validUntil.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate South African phone number
 */
export function isValidSAPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // SA phone formats:
  // Mobile: 0XX XXX XXXX (10 digits starting with 0)
  // International: +27XX XXX XXXX (12 digits with +27)
  return /^(0\d{9}|\+27\d{9})$/.test(cleaned);
}

/**
 * Validate South African ID number
 */
export function isValidSAIDNumber(idNumber: string): boolean {
  // Remove spaces
  const cleaned = idNumber.replace(/\s/g, '');

  // Must be 13 digits
  if (!/^\d{13}$/.test(cleaned)) {
    return false;
  }

  // Basic date validation (YYMMDD)
  const year = parseInt(cleaned.substring(0, 2), 10);
  const month = parseInt(cleaned.substring(2, 4), 10);
  const day = parseInt(cleaned.substring(4, 6), 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Luhn algorithm check
  let sum = 0;
  let alternate = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Validate South African company registration number
 */
export function isValidCompanyRegistration(registration: string): boolean {
  // Format: YYYY/NNNNNN/NN
  return /^\d{4}\/\d{6}\/\d{2}$/.test(registration);
}

/**
 * Validate VAT number
 */
export function isValidVATNumber(vat: string): boolean {
  // Remove spaces
  const cleaned = vat.replace(/\s/g, '');
  // Must be 10 digits
  return /^\d{10}$/.test(cleaned);
}
