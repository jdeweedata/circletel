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

  /** Whether provider is configured */
  configured?: boolean;

  /** Whether provider is available */
  available?: boolean;
}

// ============================================================================
// Webhook Logs
// ============================================================================

/**
 * Webhook log record (payment_webhook_logs table)
 */
export interface WebhookLog {
  /** Unique identifier */
  id: string;

  /** Webhook identifier */
  webhook_id: string;

  /** Payment provider */
  provider: PaymentProviderType;

  /** Event type */
  event_type: string;

  /** HTTP method */
  http_method: string;

  /** Request headers */
  headers: Record<string, any>;

  /** Query parameters */
  query_params?: Record<string, any> | null;

  /** Raw request body */
  body: string;

  /** Parsed request body */
  body_parsed: Record<string, any> | null;

  /** Webhook signature */
  signature?: string | null;

  /** Whether signature was verified */
  signature_verified: boolean;

  /** Signature algorithm used */
  signature_algorithm?: string | null;

  /** Processing status */
  status: 'received' | 'processing' | 'processed' | 'failed' | 'retrying';

  /** Processing started timestamp */
  processing_started_at?: string | null;

  /** Processing completed timestamp */
  processing_completed_at?: string | null;

  /** Processing duration in milliseconds */
  processing_duration_ms?: number | null;

  /** Related transaction ID */
  transaction_id?: string | null;

  /** Order/invoice reference */
  reference?: string | null;

  /** Whether processing was successful */
  success?: boolean | null;

  /** Error message */
  error_message?: string | null;

  /** Error stack trace */
  error_stack?: string | null;

  /** Actions taken during processing */
  actions_taken?: string[] | null;

  /** Response status code */
  response_status_code?: number | null;

  /** Response body */
  response_body?: Record<string, any> | null;

  /** Number of retry attempts */
  retry_count: number;

  /** Maximum number of retries */
  max_retries: number;

  /** Last retry timestamp */
  last_retry_at?: string | null;

  /** Next retry timestamp */
  next_retry_at?: string | null;

  /** Source IP address */
  source_ip?: string | null;

  /** User agent */
  user_agent?: string | null;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** When webhook was received */
  received_at: string;

  /** Created timestamp */
  created_at: string;

  /** Updated timestamp */
  updated_at: string;
}

// ============================================================================
// Payment Provider Settings
// ============================================================================

/**
 * Payment provider settings (payment_provider_settings table)
 */
export interface PaymentProviderSettings {
  /** Unique identifier */
  id: string;

  /** Payment provider */
  provider: PaymentProviderType;

  /** Whether provider is enabled */
  enabled: boolean;

  /** Provider priority (higher = tried first) */
  priority: number;

  /** Encrypted provider credentials */
  credentials?: Record<string, any> | null;

  /** Provider-specific settings */
  settings?: Record<string, any> | null;

  /** Capabilities override */
  capabilities_override?: Record<string, any> | null;

  /** Minimum transaction amount */
  min_amount?: number | null;

  /** Maximum transaction amount */
  max_amount?: number | null;

  /** Daily transaction limit */
  daily_limit?: number | null;

  /** Whether in test mode */
  test_mode: boolean;

  /** Test credentials */
  test_credentials?: Record<string, any> | null;

  /** Webhook URL */
  webhook_url?: string | null;

  /** Webhook secret (encrypted) */
  webhook_secret?: string | null;

  /** Subscribed webhook events */
  webhook_events?: string[] | null;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** Created timestamp */
  created_at: string;

  /** Updated timestamp */
  updated_at: string;

  /** Created by user ID */
  created_by?: string | null;

  /** Updated by user ID */
  updated_by?: string | null;
}
