/**
 * Payment Webhook Type Definitions
 *
 * Strong typing for NetCash webhook payloads and payment processing
 * to prevent runtime errors in financial flows.
 */

/**
 * NetCash webhook payload for payment processing
 * Based on NetCash Pay Now API documentation
 */
export interface NetcashPaymentWebhookPayload {
  /** Whether the transaction was accepted ('true' or 'false') */
  TransactionAccepted: string;
  /** Payment amount in cents (e.g., '10000' = R100.00) */
  Amount: string;
  /** Payment reference (usually invoice number) */
  Reference: string;
  /** Extra field 1 - typically Invoice ID */
  Extra1: string;
  /** Extra field 2 - backup reference */
  Extra2?: string;
  /** Extra field 3 - additional data */
  Extra3?: string;
  /** Unique transaction trace ID from NetCash */
  RequestTrace: string;
  /** Transaction ID */
  TransactionID?: string;
  /** Response code from payment gateway */
  ResponseCode?: string;
  /** Human-readable response message */
  ResponseText?: string;
  /** Card type used (Visa, MasterCard, etc.) */
  CardType?: string;
  /** Masked card number (e.g., '411111******1111') */
  CardNumber?: string;
  /** Token for future payments */
  CardToken?: string;
  /** Customer email if provided */
  CustomerEmail?: string;
  /** Customer name if provided */
  CustomerName?: string;
  /** Transaction timestamp */
  TransactionDate?: string;
}

/**
 * Result of processing a payment webhook
 */
export interface PaymentWebhookResult {
  success: boolean;
  transactionId?: string;
  invoiceId?: string;
  message?: string;
  error?: string;
}

/**
 * Payment transaction status
 */
export type PaymentStatus = 'completed' | 'failed' | 'pending' | 'refunded' | 'cancelled';

/**
 * Order record from database (for webhook processing)
 */
export interface OrderRecord {
  id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  payment_reference?: string;
  amount: number;
  created_at: string;
  updated_at?: string;
  // Customer info
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  // Package info
  package_name?: string;
  package_id?: string;
  // Additional fields
  metadata?: Record<string, unknown>;
}

/**
 * Invoice record from database
 */
export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  amount: number;
  amount_paid?: number;
  status: 'unpaid' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date?: string;
  payment_reference?: string;
  payment_method?: string;
  line_items?: InvoiceLineItem[];
  created_at: string;
  updated_at?: string;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  type?: string;
}

/**
 * Payment transaction record for audit
 */
export interface PaymentTransactionRecord {
  id?: string;
  invoice_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: PaymentStatus;
  netcash_reference?: string;
  netcash_response?: NetcashPaymentWebhookPayload;
  webhook_received_at: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * Type guard to check if payload is a valid NetCash payment webhook
 */
export function isValidNetcashPayload(payload: unknown): payload is NetcashPaymentWebhookPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const p = payload as Record<string, unknown>;

  return (
    typeof p.TransactionAccepted === 'string' &&
    typeof p.Amount === 'string' &&
    typeof p.Reference === 'string' &&
    typeof p.Extra1 === 'string' &&
    typeof p.RequestTrace === 'string'
  );
}

/**
 * Parse amount from cents string to Rands number
 */
export function parseAmountFromCents(amountInCents: string): number {
  const parsed = parseFloat(amountInCents);
  if (isNaN(parsed)) {
    throw new Error(`Invalid amount format: ${amountInCents}`);
  }
  return parsed / 100;
}

/**
 * Determine payment status from NetCash response
 */
export function determinePaymentStatus(payload: NetcashPaymentWebhookPayload): PaymentStatus {
  return payload.TransactionAccepted === 'true' ? 'completed' : 'failed';
}
