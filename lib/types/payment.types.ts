/**
 * Payment Type Definitions
 *
 * Comprehensive type system for payment operations across all providers.
 * Used by NetCash, ZOHO Billing, and future payment integrations.
 *
 * @module lib/types/payment.types
 */

// ============================================================================
// Payment Methods
// ============================================================================

/**
 * Supported payment methods across all providers
 */
export type PaymentMethod =
  | 'card'              // Credit/Debit card (3D Secure)
  | 'eft'               // Traditional EFT
  | 'instant_eft'       // Instant EFT (Ozow)
  | 'debit_order'       // Recurring debit order
  | 'scan_to_pay'       // QR code (SnapScan, Zapper)
  | 'cash'              // Cash vouchers (1Voucher)
  | 'payflex'           // Buy Now Pay Later
  | 'capitec_pay'       // Capitec Pay
  | 'paymyway'          // Pay@Store
  | 'scode_retail';     // SCode retail payments

/**
 * Payment transaction statuses
 */
export type PaymentStatus =
  | 'pending'           // Payment initiated, awaiting completion
  | 'processing'        // Payment being processed by gateway
  | 'completed'         // Payment successfully completed
  | 'failed'            // Payment failed
  | 'refunded'          // Payment refunded
  | 'cancelled'         // Payment cancelled by user
  | 'expired';          // Payment session expired

/**
 * Payment provider names
 */
export type PaymentProviderType =
  | 'netcash'
  | 'zoho_billing'
  | 'payfast'           // Future: Alternative SA provider
  | 'paygate';          // Future: Alternative SA provider

// ============================================================================
// Payment Initiation
// ============================================================================

/**
 * Parameters for initiating a payment
 */
export interface PaymentInitiationParams {
  /** Payment amount in Rands (will be converted to cents internally) */
  amount: number;

  /** Currency code (default: ZAR) */
  currency: string;

  /** Unique payment reference (e.g., order ID, invoice number) */
  reference: string;

  /** Human-readable payment description */
  description?: string;

  /** Customer email address */
  customerEmail?: string;

  /** Customer full name */
  customerName?: string;

  /** Customer phone number */
  customerPhone?: string;

  /** URL to redirect after successful payment */
  returnUrl?: string;

  /** URL to redirect after cancelled payment */
  cancelUrl?: string;

  /** URL for webhook notifications */
  notifyUrl?: string;

  /** Additional metadata (stored in JSONB) */
  metadata?: Record<string, unknown>;
}

/**
 * Result of payment initiation
 */
export interface PaymentInitiationResult {
  /** Whether initiation was successful */
  success: boolean;

  /** Payment gateway URL (for redirect flow) */
  paymentUrl?: string;

  /** Form data for POST redirect (NetCash pattern) */
  formData?: Record<string, string>;

  /** Unique transaction ID for tracking */
  transactionId?: string;

  /** Provider-specific payment reference */
  providerReference?: string;

  /** Error message if failed */
  error?: string;

  /** Additional provider-specific data */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Webhook Processing
// ============================================================================

/**
 * Result of webhook processing
 */
export interface WebhookProcessingResult {
  /** Whether webhook was processed successfully */
  success: boolean;

  /** Transaction ID from payment provider */
  transactionId: string;

  /** Current payment status */
  status: PaymentStatus;

  /** Payment amount (in Rands) */
  amount: number;

  /** Original payment reference */
  reference: string;

  /** Payment completion timestamp */
  completedAt?: Date;

  /** Failure reason if applicable */
  failureReason?: string;

  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Payment Status Query
// ============================================================================

/**
 * Result of payment status query
 */
export interface PaymentStatusResult {
  /** Transaction ID */
  transactionId: string;

  /** Current payment status */
  status: PaymentStatus;

  /** Payment amount (in Rands) */
  amount: number;

  /** Original payment reference */
  reference: string;

  /** Payment method used */
  paymentMethod?: PaymentMethod;

  /** When payment was completed */
  completedAt?: Date;

  /** When payment failed */
  failedAt?: Date;

  /** Failure reason if applicable */
  failureReason?: string;

  /** Provider-specific metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Refunds
// ============================================================================

/**
 * Parameters for initiating a refund
 */
export interface RefundParams {
  /** Original transaction ID to refund */
  transactionId: string;

  /** Refund amount (in Rands, must be <= original amount) */
  amount: number;

  /** Reason for refund */
  reason: string;

  /** Admin user ID who requested the refund */
  requestedBy: string;

  /** Additional notes */
  notes?: string;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of refund operation
 */
export interface RefundResult {
  /** Whether refund was successful */
  success: boolean;

  /** Unique refund ID */
  refundId?: string;

  /** Amount refunded */
  refundedAmount?: number;

  /** When refund was processed */
  refundDate?: Date;

  /** Provider-specific refund reference */
  providerReference?: string;

  /** Error message if failed */
  error?: string;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Payment Transactions (Database Model)
// ============================================================================

/**
 * Payment transaction database record
 * Maps to payment_transactions table
 */
export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  invoice_id?: string;
  customer_id?: string;
  order_id?: string;
  amount: number;
  currency: string;
  transaction_date?: Date;
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  provider: PaymentProviderType;
  netcash_reference?: string;
  netcash_response?: Record<string, unknown>;
  processed_at?: Date;
  failed_at?: Date;
  refunded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Payment Configuration
// ============================================================================

/**
 * Payment provider configuration
 * Maps to payment_configuration table
 */
export interface PaymentConfiguration {
  id: string;
  environment: 'test' | 'production';
  provider: PaymentProviderType;
  service_key?: string;
  pci_vault_key?: string;
  merchant_id?: string;
  webhook_secret?: string;
  accept_url?: string;
  decline_url?: string;
  notify_url?: string;
  redirect_url?: string;
  payment_submit_url?: string;
  api_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Webhook Events
// ============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'refund.completed'
  | 'refund.failed';

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: WebhookEventType;
  transactionId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

// ============================================================================
// Payment Method Management
// ============================================================================

/**
 * Stored payment method (for recurring payments)
 * Maps to customer_payment_methods table
 */
export interface StoredPaymentMethod {
  id: string;
  customer_id: string;
  method_type: PaymentMethod;
  display_name: string;
  last_four?: string;
  encrypted_details?: Record<string, unknown>;
  mandate_id?: string;              // For debit orders
  mandate_status?: string;
  max_debit_amount?: number;
  is_primary: boolean;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for PaymentStatus
 */
export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && [
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled', 'expired'
  ].includes(value);
}

/**
 * Type guard for PaymentMethod
 */
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && [
    'card', 'eft', 'instant_eft', 'debit_order', 'scan_to_pay',
    'cash', 'payflex', 'capitec_pay', 'paymyway', 'scode_retail'
  ].includes(value);
}

/**
 * Type guard for PaymentProviderType
 */
export function isPaymentProviderType(value: unknown): value is PaymentProviderType {
  return typeof value === 'string' && [
    'netcash', 'zoho_billing', 'payfast', 'paygate'
  ].includes(value);
}

// ============================================================================
// Payment Provider Capabilities
// ============================================================================

/**
 * Payment provider capabilities
 */
export interface PaymentProviderCapabilities {
  /** Supports refunds */
  refunds: boolean;

  /** Supports partial refunds */
  partial_refunds: boolean;

  /** Supports recurring payments/debit orders */
  recurring_payments: boolean;

  /** Supports payment status queries */
  status_queries: boolean;

  /** Supports webhooks */
  webhooks: boolean;

  /** Supported payment methods */
  payment_methods: string[];

  /** Maximum refund age in days */
  max_refund_age_days?: number;

  /** Supports 3D Secure */
  supports_3d_secure?: boolean;
}

/**
 * Provider health check result
 */
export interface ProviderHealthCheckResult {
  /** Provider name */
  provider: PaymentProviderType;

  /** Whether provider is healthy */
  healthy: boolean;

  /** Response time in milliseconds */
  response_time_ms?: number;

  /** Error message if unhealthy */
  error?: string;

  /** Check timestamp */
  checked_at: Date;
}
