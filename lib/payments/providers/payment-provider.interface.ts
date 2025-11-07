/**
 * Payment Provider Interface
 *
 * Core abstraction layer for all payment providers (NetCash, ZOHO Billing, etc.).
 * Ensures consistency across different payment gateways and makes adding new
 * providers straightforward.
 *
 * @module lib/payments/providers/payment-provider.interface
 */

import {
  PaymentInitiationParams,
  PaymentInitiationResult,
  WebhookProcessingResult,
  PaymentStatusResult,
  RefundParams,
  RefundResult,
  PaymentProviderType
} from '@/lib/types/payment.types';

// ============================================================================
// Payment Provider Interface
// ============================================================================

/**
 * Payment Provider Interface
 *
 * All payment providers must implement this interface to ensure consistent
 * behavior across the application.
 *
 * @example
 * ```typescript
 * class NetCashProvider implements IPaymentProvider {
 *   readonly name = 'netcash';
 *
 *   async initiate(params) {
 *     // NetCash-specific implementation
 *   }
 *
 *   // ... implement other methods
 * }
 * ```
 */
export interface IPaymentProvider {
  /**
   * Unique identifier for the provider
   * Used for logging, debugging, and provider selection
   */
  readonly name: PaymentProviderType;

  /**
   * Initialize a payment transaction
   *
   * This method prepares a payment for the customer. Depending on the provider,
   * it may return:
   * - A redirect URL (hosted payment page)
   * - Form data for POST redirect
   * - An embedded payment token
   *
   * @param params - Payment initiation parameters
   * @returns Payment initiation result with URL or form data
   *
   * @example
   * ```typescript
   * const result = await provider.initiate({
   *   amount: 799.00,
   *   currency: 'ZAR',
   *   reference: 'ORDER-001',
   *   customerEmail: 'customer@example.com',
   *   returnUrl: 'https://circletel.co.za/payment/success',
   *   notifyUrl: 'https://circletel.co.za/api/payments/webhook'
   * });
   *
   * if (result.success) {
   *   // Redirect customer to result.paymentUrl
   *   // Or submit result.formData to result.paymentUrl
   * }
   * ```
   */
  initiate(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;

  /**
   * Process a webhook notification from the payment provider
   *
   * Handles incoming webhook events (payment completed, failed, etc.).
   * Must verify signature before processing to prevent fraud.
   *
   * @param payload - Raw webhook payload (provider-specific format)
   * @param signature - Webhook signature for verification
   * @returns Processing result with normalized transaction data
   *
   * @example
   * ```typescript
   * const result = await provider.processWebhook(
   *   webhookBody,
   *   request.headers['x-webhook-signature']
   * );
   *
   * if (result.success && result.status === 'completed') {
   *   // Update invoice to paid
   *   // Trigger order creation
   *   // Send confirmation email
   * }
   * ```
   */
  processWebhook(
    payload: unknown,
    signature: string
  ): Promise<WebhookProcessingResult>;

  /**
   * Verify the signature of a webhook request
   *
   * Uses HMAC-SHA256 or provider-specific algorithm to verify webhook
   * authenticity. CRITICAL for security - prevents webhook spoofing.
   *
   * @param payload - Raw webhook payload as string
   * @param signature - Signature provided by payment gateway
   * @returns True if signature is valid
   *
   * @example
   * ```typescript
   * const payload = await request.text();
   * const signature = request.headers.get('x-webhook-signature');
   *
   * if (!provider.verifySignature(payload, signature)) {
   *   return new Response('Invalid signature', { status: 401 });
   * }
   * ```
   */
  verifySignature(payload: string, signature: string): boolean;

  /**
   * Get the current status of a payment transaction
   *
   * Queries the payment provider's API to get real-time transaction status.
   * Useful for:
   * - Checking payment status before webhook arrives
   * - Reconciliation
   * - Admin dashboards
   *
   * @param transactionId - Transaction identifier
   * @returns Current payment status and details
   *
   * @example
   * ```typescript
   * const status = await provider.getStatus('CT-ORDER-001-1234567890');
   *
   * if (status.status === 'completed') {
   *   console.log(`Payment of R${status.amount} completed`);
   * }
   * ```
   */
  getStatus(transactionId: string): Promise<PaymentStatusResult>;

  /**
   * Initiate a refund for a completed transaction
   *
   * Refunds can be:
   * - Full refund (entire amount)
   * - Partial refund (specified amount)
   *
   * @param params - Refund parameters
   * @returns Refund result with refund ID and status
   *
   * @example
   * ```typescript
   * const result = await provider.refund({
   *   transactionId: 'CT-ORDER-001-1234567890',
   *   amount: 799.00,
   *   reason: 'Customer requested refund',
   *   requestedBy: 'admin-user-id'
   * });
   *
   * if (result.success) {
   *   console.log(`Refund ID: ${result.refundId}`);
   * }
   * ```
   */
  refund(params: RefundParams): Promise<RefundResult>;

  /**
   * Check if the provider is properly configured
   *
   * Verifies that all required credentials and configuration are present.
   * Called before any provider operation to ensure it can function.
   *
   * @returns True if provider has all required credentials
   *
   * @example
   * ```typescript
   * if (!provider.isConfigured()) {
   *   throw new Error('Payment provider not configured');
   * }
   * ```
   */
  isConfigured(): boolean;

  /**
   * Get provider capabilities
   *
   * Returns information about what features this provider supports.
   * Optional method - providers can override to specify capabilities.
   *
   * @returns Provider capability information
   */
  getCapabilities?(): PaymentProviderCapabilities;

  /**
   * Health check for the provider
   *
   * Tests connectivity to the payment provider's API.
   * Optional method - useful for monitoring and admin dashboards.
   *
   * @returns Health check result
   */
  healthCheck?(): Promise<ProviderHealthCheckResult>;
}

// ============================================================================
// Provider Capabilities
// ============================================================================

// Note: PaymentProviderCapabilities and ProviderHealthCheckResult interfaces
// are defined in @/lib/types/payment.types.ts and imported above

// ============================================================================
// Base Payment Provider Class
// ============================================================================

/**
 * Base Payment Provider
 *
 * Abstract base class with common functionality for payment providers.
 * Providers should extend this class to inherit utility methods.
 *
 * @example
 * ```typescript
 * export class NetCashProvider extends BasePaymentProvider {
 *   readonly name = 'netcash';
 *
 *   // Implement required methods...
 * }
 * ```
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  /**
   * Provider name (must be implemented by subclass)
   */
  abstract readonly name: PaymentProviderType;

  /**
   * Initialize a payment (must be implemented by subclass)
   */
  abstract initiate(
    params: PaymentInitiationParams
  ): Promise<PaymentInitiationResult>;

  /**
   * Process webhook (must be implemented by subclass)
   */
  abstract processWebhook(
    payload: unknown,
    signature: string
  ): Promise<WebhookProcessingResult>;

  /**
   * Verify webhook signature (must be implemented by subclass)
   */
  abstract verifySignature(payload: string, signature: string): boolean;

  /**
   * Get payment status (must be implemented by subclass)
   */
  abstract getStatus(transactionId: string): Promise<PaymentStatusResult>;

  /**
   * Refund a payment (must be implemented by subclass)
   */
  abstract refund(params: RefundParams): Promise<RefundResult>;

  /**
   * Check configuration (must be implemented by subclass)
   */
  abstract isConfigured(): boolean;

  // ============================================================================
  // Utility Methods (Available to All Providers)
  // ============================================================================

  /**
   * Generate a unique transaction reference
   *
   * Format: CT-{orderId}-{timestamp}
   *
   * @param orderId - Order or invoice ID
   * @returns Unique transaction reference
   *
   * @protected
   */
  protected generateTransactionReference(orderId: string): string {
    const timestamp = Date.now();
    return `CT-${orderId}-${timestamp}`;
  }

  /**
   * Validate required parameters
   *
   * Throws an error if any required parameters are missing.
   *
   * @param params - Parameters object to validate
   * @param required - Array of required parameter names
   * @throws Error if required parameters are missing
   *
   * @protected
   */
  protected validateParams(
    params: Record<string, unknown>,
    required: string[]
  ): void {
    const missing = required.filter((key) => {
      const value = params[key];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing required parameters: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Convert Rands to cents
   *
   * Most payment gateways work in cents/smallest currency unit.
   *
   * @param rands - Amount in Rands
   * @returns Amount in cents
   *
   * @protected
   */
  protected randsToCents(rands: number): number {
    return Math.round(rands * 100);
  }

  /**
   * Convert cents to Rands
   *
   * @param cents - Amount in cents
   * @returns Amount in Rands
   *
   * @protected
   */
  protected centsToRands(cents: number): number {
    return Number((cents / 100).toFixed(2));
  }

  /**
   * Sanitize metadata for storage
   *
   * Ensures metadata can be safely stored in JSONB columns.
   *
   * @param metadata - Raw metadata object
   * @returns Sanitized metadata
   *
   * @protected
   */
  protected sanitizeMetadata(
    metadata?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Skip functions, symbols, undefined
      if (
        typeof value === 'function' ||
        typeof value === 'symbol' ||
        value === undefined
      ) {
        continue;
      }

      // Convert dates to ISO strings
      if (value instanceof Date) {
        sanitized[key] = value.toISOString();
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Log provider activity
   *
   * Centralized logging for all provider operations.
   *
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data
   *
   * @protected
   */
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    const logEntry = {
      provider: this.name,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };

    switch (level) {
      case 'error':
        console.error('[PaymentProvider]', logEntry);
        break;
      case 'warn':
        console.warn('[PaymentProvider]', logEntry);
        break;
      case 'info':
      default:
        console.log('[PaymentProvider]', logEntry);
        break;
    }
  }

  /**
   * Handle provider error
   *
   * Standardized error handling with logging.
   *
   * @param error - Error object
   * @param context - Error context
   * @returns Formatted error message
   *
   * @protected
   */
  protected handleError(error: unknown, context: string): string {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    this.log('error', `${context}: ${errorMessage}`, {
      error: error instanceof Error ? error.stack : String(error)
    });

    return errorMessage;
  }

  /**
   * Default capability implementation
   *
   * Override in subclass to specify actual capabilities.
   */
  getCapabilities(): PaymentProviderCapabilities {
    return {
      refunds: false,
      partial_refunds: false,
      recurring_payments: false,
      status_queries: false,
      webhooks: true,
      payment_methods: []
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

// Note: PaymentProviderCapabilities and ProviderHealthCheckResult are exported
// from @/lib/types/payment.types.ts to avoid circular dependencies
