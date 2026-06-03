/**
 * Payment Method Mapper
 *
 * Bridges the two payment-method representations during the debit-order cutover
 * (see docs/plans/2026-06-03-debit-order-implementation-plan.md, W1.1):
 *
 *  - NetCash eMandate postback  →  `customer_payment_methods` write shape (source of truth)
 *  - `customer_payment_methods` row  →  admin display shape (PaymentMethodStatus component)
 *
 * The legacy `payment_methods` table stored bank/mandate fields as top-level columns;
 * `customer_payment_methods` stores them inside the `encrypted_details` jsonb. These pure
 * functions centralise that mapping so writers and readers stay consistent.
 *
 * Pure + side-effect free (timestamps are passed in) so they are fully unit-testable.
 *
 * @module lib/payments/payment-method-mapper
 */

import type { EMandatePostback } from '@/lib/payments/netcash-emandate-service';

// ============================================================================
// TYPES
// ============================================================================

/** Subset of `customer_payment_methods` columns this mapper writes. */
export interface CustomerPaymentMethodWrite {
  customer_id: string;
  method_type: 'debit_order';
  display_name: string;
  last_four: string | null;
  mandate_id: string | null;
  mandate_status: 'active';
  mandate_created_at: string;
  mandate_approved_at: string;
  max_debit_amount: number | null;
  is_primary: boolean;
  is_active: boolean;
  // Card fields (populated only when the mandate is backed by a credit card)
  card_token: string | null;
  card_holder_name: string | null;
  card_type: string | null;
  card_masked_number: string | null;
  card_expiry_month: number | null;
  card_expiry_year: number | null;
  token_status: string | null;
  token_verified_at: string | null;
  encrypted_details: MandateEncryptedDetails;
}

/** Contents of `customer_payment_methods.encrypted_details` for a debit-order mandate. */
export interface MandateEncryptedDetails {
  verified: true;
  provider: 'netcash';
  is_credit_card: boolean;
  mandate_reference: string;
  mandate_pdf_link: string | null;
  /** Set by W4.1 once the PDF is downloaded to Supabase storage. */
  mandate_pdf_path?: string | null;
  /** DebiCheck | registered_mandate — confirmed via W0.4; null until known. */
  mandate_type: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number_masked: string | null;
  bank_account_type: string | null;
  branch_code: string | null;
  debit_day: number;
  agreement_date: string | null;
  monthly_amount: number | null;
}

/** Shape the admin UI (PaymentMethodStatus) expects. */
export interface PaymentMethodDisplay {
  id: string;
  method_type: string;
  status: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number_masked: string | null;
  bank_account_type: string | null;
  branch_code: string | null;
  mandate_amount: number | null;
  mandate_frequency: 'monthly';
  mandate_debit_day: number;
  mandate_signed_at: string | null;
  netcash_mandate_pdf_link: string | null;
  created_at: string | null;
  _provider?: string;
  _verified?: boolean;
  _is_primary?: boolean;
}

/** A `customer_payment_methods` row (only the fields the display mapper reads). */
export interface CustomerPaymentMethodRow {
  id: string;
  method_type: string;
  display_name?: string | null;
  last_four?: string | null;
  mandate_status?: string | null;
  mandate_approved_at?: string | null;
  max_debit_amount?: number | null;
  is_primary?: boolean | null;
  created_at?: string | null;
  encrypted_details?: Partial<MandateEncryptedDetails> & Record<string, unknown> | null;
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Map a SUCCESSFUL NetCash eMandate postback into a `customer_payment_methods` write.
 *
 * @param postback   Parsed NetCash postback (MandateSuccessful expected to be '1').
 * @param customerId Target customer.
 * @param signedAt   ISO timestamp to stamp (caller supplies — keeps this pure/testable).
 */
export function mapPostbackToPaymentMethod(
  postback: EMandatePostback,
  customerId: string,
  signedAt: string
): CustomerPaymentMethodWrite {
  const isCreditCard = postback.IsCreditCard === 'True';
  const maskedAccount = isCreditCard ? postback.CCAccountNo : postback.BankAccountNo;
  const lastFour = extractLastFour(maskedAccount);
  const debitDay = normaliseDebitDay(postback.DebitDay);
  const monthlyAmount = parseAmount(postback.DefaultAmount);

  const displayName = isCreditCard
    ? `${postback.CCType || 'Card'} ****${lastFour ?? ''}`.trim()
    : `Debit Order - ${postback.BankName || 'Bank'}`.trim();

  const encrypted_details: MandateEncryptedDetails = {
    verified: true,
    provider: 'netcash',
    is_credit_card: isCreditCard,
    mandate_reference: postback.MandateReferenceNumber,
    mandate_pdf_link: postback.MandatePDFLink || null,
    mandate_pdf_path: null,
    mandate_type: null,
    bank_name: postback.BankName || null,
    bank_account_name: postback.BankAccountName || null,
    bank_account_number_masked: postback.BankAccountNo || null,
    bank_account_type: postback.BankAccountType?.toLowerCase() || null,
    branch_code: postback.BranchCode || null,
    debit_day: debitDay,
    agreement_date: postback.AgreementDate || null,
    monthly_amount: monthlyAmount,
  };

  return {
    customer_id: customerId,
    method_type: 'debit_order',
    display_name: displayName,
    last_four: lastFour,
    mandate_id: postback.MandateReferenceNumber || null,
    mandate_status: 'active',
    mandate_created_at: signedAt,
    mandate_approved_at: signedAt,
    max_debit_amount: monthlyAmount,
    is_primary: true,
    is_active: true,
    card_token: isCreditCard ? postback.CCToken || null : null,
    card_holder_name: isCreditCard ? postback.CCAccountName || null : null,
    card_type: isCreditCard ? postback.CCType?.toLowerCase() || null : null,
    card_masked_number: isCreditCard ? postback.CCAccountNo || null : null,
    card_expiry_month: isCreditCard ? parseIntOrNull(postback.CCExpMM) : null,
    card_expiry_year: isCreditCard ? parseIntOrNull(postback.CCExpYYYY) : null,
    token_status: isCreditCard ? 'active' : null,
    token_verified_at: isCreditCard ? signedAt : null,
    encrypted_details,
  };
}

/**
 * Map a `customer_payment_methods` row into the shape the admin UI expects.
 * Mirrors (and enriches) the historical transform in the admin payment-method GET route.
 */
export function mapPaymentMethodToDisplay(row: CustomerPaymentMethodRow): PaymentMethodDisplay {
  const ed = row.encrypted_details || {};

  return {
    id: row.id,
    method_type: row.method_type === 'debit_order' ? 'bank_account' : row.method_type,
    status: row.mandate_status || 'active',

    bank_name: (ed.bank_name as string) || (ed.provider === 'netcash' ? 'NetCash' : null),
    bank_account_name: (ed.bank_account_name as string) || row.display_name || 'Debit Order',
    bank_account_number_masked:
      (ed.bank_account_number_masked as string) || row.last_four || 'XXXX',
    bank_account_type: (ed.bank_account_type as string) || 'cheque',
    branch_code: (ed.branch_code as string) || null,

    mandate_amount: (ed.monthly_amount as number) ?? row.max_debit_amount ?? null,
    mandate_frequency: 'monthly',
    mandate_debit_day: (ed.debit_day as number) || 1,
    mandate_signed_at: row.mandate_approved_at || row.created_at || null,
    netcash_mandate_pdf_link:
      (ed.mandate_pdf_path as string) || (ed.mandate_pdf_link as string) || null,

    created_at: row.created_at || null,

    _provider: ed.provider as string | undefined,
    _verified: ed.verified as boolean | undefined,
    _is_primary: row.is_primary ?? undefined,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/** Extract the last up-to-4 numeric digits from a (possibly masked) account string. */
export function extractLastFour(masked?: string | null): string | null {
  if (!masked) return null;
  const digits = (masked.match(/\d/g) || []).join('');
  if (!digits) return null;
  return digits.slice(-4);
}

/** NetCash debit day must be one of {1,5,25,30}; fall back to 1. */
export function normaliseDebitDay(raw?: string | number | null): number {
  const day = typeof raw === 'number' ? raw : parseInt(raw || '1', 10);
  return [1, 5, 25, 30].includes(day) ? day : 1;
}

/**
 * Build an ACTIVE debit-order `customer_payment_methods` write for the manual
 * admin-approval path (approve-validation), where there is no full NetCash postback —
 * only an account reference / netcash reference and the request payload amount/day.
 */
export function buildActiveDebitOrderMethod(params: {
  customerId: string;
  mandateRef: string;
  amount: number | null;
  debitDay: number;
  signedAt: string;
  bankName?: string | null;
}): CustomerPaymentMethodWrite {
  const debitDay = normaliseDebitDay(params.debitDay);
  return {
    customer_id: params.customerId,
    method_type: 'debit_order',
    display_name: `Debit Order - ${params.bankName || 'Bank'}`.trim(),
    last_four: null,
    mandate_id: params.mandateRef || null,
    mandate_status: 'active',
    mandate_created_at: params.signedAt,
    mandate_approved_at: params.signedAt,
    max_debit_amount: params.amount,
    is_primary: true,
    is_active: true,
    card_token: null,
    card_holder_name: null,
    card_type: null,
    card_masked_number: null,
    card_expiry_month: null,
    card_expiry_year: null,
    token_status: null,
    token_verified_at: null,
    encrypted_details: {
      verified: true,
      provider: 'netcash',
      is_credit_card: false,
      mandate_reference: params.mandateRef,
      mandate_pdf_link: null,
      mandate_pdf_path: null,
      mandate_type: null,
      bank_name: params.bankName || null,
      bank_account_name: null,
      bank_account_number_masked: null,
      bank_account_type: null,
      branch_code: null,
      debit_day: debitDay,
      agreement_date: null,
      monthly_amount: params.amount,
    },
  };
}

function parseAmount(raw?: string | null): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function parseIntOrNull(raw?: string | null): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
