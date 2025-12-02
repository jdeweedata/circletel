/**
 * Payment-related TypeScript types
 * Used by payment sync service and webhook processors
 */

// =============================================================================
// ZOHO SYNC TYPES
// =============================================================================

export type PaymentSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'skipped';

/**
 * ZOHO Billing supported payment modes for offline payments
 * @see https://www.zoho.com/billing/api/v1/customer-payments/
 */
export type ZohoPaymentMode =
  | 'check'
  | 'cash'
  | 'creditcard'
  | 'banktransfer'
  | 'bankremittance'
  | 'autotransaction'
  | 'others';

/**
 * Maps NetCash payment methods to ZOHO Billing payment modes
 * NetCash supports 20+ South African payment methods
 */
export const NETCASH_TO_ZOHO_PAYMENT_MODE: Record<string, ZohoPaymentMode> = {
  // Card payments
  'credit_card': 'creditcard',
  'debit_card': 'creditcard',
  'visa': 'creditcard',
  'mastercard': 'creditcard',
  'amex': 'creditcard',

  // Bank transfers
  'eft': 'banktransfer',
  'instant_eft': 'banktransfer',
  'ozow': 'banktransfer',
  'peach_payments': 'banktransfer',
  'capitec_pay': 'banktransfer',
  'snapscan': 'banktransfer',

  // Buy now pay later / alternative methods
  'mobicred': 'others',
  'payflex': 'others',
  'payjustNow': 'others',
  'float': 'others',

  // Vouchers and wallets
  '1voucher': 'others',
  'zapper': 'others',
  'masterpass': 'others',

  // Default fallback
  'default': 'others',
};

/**
 * Get ZOHO payment mode from NetCash payment method
 */
export function getZohoPaymentMode(netcashMethod: string | null | undefined): ZohoPaymentMode {
  if (!netcashMethod) return 'others';
  const normalized = netcashMethod.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return NETCASH_TO_ZOHO_PAYMENT_MODE[normalized] || NETCASH_TO_ZOHO_PAYMENT_MODE['default'];
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return 'Online Payment';

  const methodLabels: Record<string, string> = {
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'amex': 'American Express',
    'eft': 'EFT',
    'instant_eft': 'Instant EFT',
    'ozow': 'Ozow',
    'capitec_pay': 'Capitec Pay',
    'snapscan': 'SnapScan',
    'zapper': 'Zapper',
    'mobicred': 'Mobicred',
    'payflex': 'PayFlex',
    '1voucher': '1Voucher',
  };

  const normalized = method.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return methodLabels[normalized] || method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// =============================================================================
// PAYMENT SYNC REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request to sync a payment to ZOHO Billing
 */
export interface PaymentSyncRequest {
  /** UUID of the payment transaction in Supabase */
  payment_id: string;
  /** UUID of the related invoice */
  invoice_id: string;
  /** UUID of the customer */
  customer_id: string;
  /** Payment amount in ZAR */
  amount: number;
  /** NetCash payment method */
  payment_method: string;
  /** NetCash transaction reference */
  reference: string;
  /** ISO date string when payment was made */
  transaction_date: string;
}

/**
 * Result of a payment sync attempt
 */
export interface PaymentSyncResult {
  success: boolean;
  /** ZOHO payment ID if successfully synced */
  zoho_payment_id?: string;
  /** Error message if sync failed */
  error?: string;
  /** Whether a retry has been scheduled */
  retry_scheduled?: boolean;
  /** Number of attempts made */
  attempt_number?: number;
}

/**
 * Payment record from Supabase
 */
export interface PaymentRecord {
  id: string;
  transaction_id: string;
  reference: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  customer_id: string | null;
  invoice_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  zoho_payment_id: string | null;
  zoho_sync_status: PaymentSyncStatus;
  zoho_last_synced_at: string | null;
  zoho_last_sync_error: string | null;
  initiated_at: string;
  completed_at: string | null;
}

/**
 * Invoice record from Supabase
 */
export interface InvoiceRecord {
  id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  zoho_billing_invoice_id: string | null;
  zoho_invoice_id: string | null;
  customer?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    zoho_billing_customer_id: string | null;
  };
}

// =============================================================================
// PAYMENT RECEIPT EMAIL TYPES
// =============================================================================

/**
 * Props for payment receipt email
 */
export interface PaymentReceiptEmailProps {
  customerName: string;
  invoiceNumber: string;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  remainingBalance: string;
  invoiceUrl: string;
}

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

/**
 * Configuration for payment sync retries
 */
export const PAYMENT_SYNC_RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxAttempts: 3,
  /** Base delay in milliseconds (doubles each attempt) */
  baseDelayMs: 5000,
  /** Statuses that should be retried */
  retryableStatuses: ['failed'] as PaymentSyncStatus[],
};

/**
 * Calculate delay for exponential backoff
 */
export function calculateRetryDelay(attemptNumber: number): number {
  return PAYMENT_SYNC_RETRY_CONFIG.baseDelayMs * Math.pow(2, attemptNumber - 1);
}
