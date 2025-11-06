/**
 * NetCash Payment Provider
 *
 * NetCash Pay Now integration for CircleTel.
 * Supports 20+ payment methods including cards, EFT, instant EFT, and more.
 *
 * Documentation: https://netcash.co.za/support/knowledge-base/paynow-integration-guide/
 *
 * @module lib/payments/providers/netcash/netcash-provider
 */

import crypto from 'crypto';
import { BasePaymentProvider } from '../payment-provider.interface';
import type {
  PaymentInitiationParams,
  PaymentInitiationResult,
  WebhookProcessingResult,
  PaymentStatusResult,
  RefundParams,
  RefundResult,
  PaymentStatus,
  PaymentProviderCapabilities
} from '@/lib/types/payment.types';

// ============================================================================
// NetCash-Specific Types
// ============================================================================

/**
 * NetCash payment form data structure
 * Used for POST redirect to NetCash gateway
 */
export interface NetCashFormData {
  m1: string;              // Service key
  m2: string;              // PCI Vault key
  p2: string;              // Transaction reference
  p3: string;              // Description
  p4: string;              // Amount in cents
  Budget: string;          // Budget facility ('Y'/'N')
  CustomerEmailAddress?: string;
  CustomerTelephoneNumber?: string;
  m9?: string;             // Return URL
  m10?: string;            // Cancel URL
  m4?: string;             // Unique transaction ID
}

/**
 * NetCash callback data structure
 */
export interface NetCashCallback {
  TransactionAccepted?: string;     // 'true' or 'false'
  Complete?: string;                // 'true' or 'false'
  Amount?: string;                  // Amount in cents
  Reference?: string;               // Transaction reference
  Reason?: string;                  // Approval/decline reason
  TransactionDate?: string;         // Transaction timestamp
  Extra1?: string;                  // Custom field 1 (NetCash ref)
  PaymentMethod?: string;           // Payment method used
  CardType?: string;                // Card type if card payment
  RequestTrace?: string;            // NetCash trace number
  Result?: string;                  // 'Success', 'Failed', 'Cancelled'
}

// ============================================================================
// NetCash Provider Implementation
// ============================================================================

/**
 * NetCash Payment Provider
 *
 * Implements the IPaymentProvider interface for NetCash Pay Now gateway.
 *
 * @example
 * ```typescript
 * const provider = new NetCashProvider();
 *
 * const result = await provider.initiate({
 *   amount: 799.00,
 *   currency: 'ZAR',
 *   reference: 'ORDER-001',
 *   customerEmail: 'customer@example.com'
 * });
 *
 * // Redirect customer to result.paymentUrl with result.formData
 * ```
 */
export class NetCashProvider extends BasePaymentProvider {
  readonly name = 'netcash' as const;

  private serviceKey: string;
  private pciVaultKey: string;
  private webhookSecret: string;
  private paymentUrl: string;
  private returnUrl: string;
  private cancelUrl: string;
  private notifyUrl: string;

  constructor() {
    super();

    // Load configuration from environment
    this.serviceKey = process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY || '';
    this.pciVaultKey = process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY || '';
    this.webhookSecret = process.env.NETCASH_WEBHOOK_SECRET || '';

    // URLs
    this.paymentUrl =
      process.env.NETCASH_PAYMENT_URL ||
      'https://paynow.netcash.co.za/site/paynow.aspx';
    this.returnUrl =
      process.env.NEXT_PUBLIC_BASE_URL + '/payment/success' ||
      'https://www.circletel.co.za/payment/success';
    this.cancelUrl =
      process.env.NEXT_PUBLIC_BASE_URL + '/payment/cancelled' ||
      'https://www.circletel.co.za/payment/cancelled';
    this.notifyUrl =
      process.env.NEXT_PUBLIC_BASE_URL + '/api/payments/webhook' ||
      'https://www.circletel.co.za/api/payments/webhook';

    // Validate configuration
    if (!this.isConfigured()) {
      this.log(
        'warn',
        'NetCash provider not fully configured. Check environment variables.'
      );
    }
  }

  // ============================================================================
  // IPaymentProvider Implementation
  // ============================================================================

  /**
   * Initialize a NetCash payment
   *
   * Generates form data for POST redirect to NetCash gateway.
   */
  async initiate(
    params: PaymentInitiationParams
  ): Promise<PaymentInitiationResult> {
    try {
      // Validate required parameters
      this.validateParams(params, ['amount', 'reference', 'customerEmail']);

      // Generate unique transaction reference
      const transactionId = this.generateTransactionReference(params.reference);

      // Convert amount to cents (NetCash expects integer cents)
      const amountInCents = this.randsToCents(params.amount);

      // Build NetCash form data
      const formData: NetCashFormData = {
        m1: this.serviceKey,                              // Service key
        m2: this.pciVaultKey,                             // PCI Vault key
        p2: transactionId,                                // Transaction reference
        p3: params.description || 'Payment',              // Description
        p4: amountInCents.toString(),                     // Amount in cents
        Budget: 'N',                                      // Budget facility (No)
        CustomerEmailAddress: params.customerEmail,
        CustomerTelephoneNumber: params.customerPhone || '',
        m9: params.returnUrl || this.returnUrl,           // Return URL
        m10: params.cancelUrl || this.cancelUrl,          // Cancel URL
        m4: transactionId,                                // Unique transaction ID
      };

      this.log('info', 'Payment initiated', {
        transactionId,
        amount: params.amount,
        reference: params.reference
      });

      return {
        success: true,
        paymentUrl: this.paymentUrl,
        formData,
        transactionId,
        metadata: this.sanitizeMetadata(params.metadata)
      };
    } catch (error) {
      const errorMessage = this.handleError(error, 'Payment initiation failed');
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Process NetCash webhook notification
   *
   * Handles payment completed, failed, or cancelled events.
   */
  async processWebhook(
    payload: unknown,
    signature: string
  ): Promise<WebhookProcessingResult> {
    try {
      // Verify signature first
      const payloadString = JSON.stringify(payload);
      if (!this.verifySignature(payloadString, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Parse NetCash callback data
      const data = payload as NetCashCallback;

      // Extract transaction details
      const transactionId = data.Reference || data.m4 || '';
      const amountInCents = parseInt(data.Amount || '0', 10);
      const amount = this.centsToRands(amountInCents);
      const reference = data.Reference || '';

      // Determine payment status
      let status: PaymentStatus = 'pending';
      let failureReason: string | undefined;

      if (data.Result === 'Success' || data.TransactionAccepted === 'true') {
        status = 'completed';
      } else if (data.Result === 'Failed') {
        status = 'failed';
        failureReason = data.Reason || 'Payment failed';
      } else if (data.Result === 'Cancelled') {
        status = 'cancelled';
        failureReason = 'Payment cancelled by user';
      }

      // Check if complete
      if (data.Complete !== 'true') {
        status = 'processing';
      }

      this.log('info', 'Webhook processed', {
        transactionId,
        status,
        amount
      });

      return {
        success: true,
        transactionId,
        status,
        amount,
        reference,
        completedAt: data.TransactionDate ? new Date(data.TransactionDate) : undefined,
        failureReason,
        metadata: {
          netcash_reference: data.Extra1,
          payment_method: data.PaymentMethod,
          card_type: data.CardType,
          request_trace: data.RequestTrace,
          raw_response: data
        }
      };
    } catch (error) {
      const errorMessage = this.handleError(error, 'Webhook processing failed');
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        amount: 0,
        reference: '',
        error: errorMessage
      };
    }
  }

  /**
   * Verify NetCash webhook signature
   *
   * Uses HMAC-SHA256 to verify webhook authenticity.
   */
  verifySignature(payload: string, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        this.log('warn', 'Webhook secret not configured, skipping verification');
        return true; // Skip verification in development
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.log('error', 'Signature verification failed', { error });
      return false;
    }
  }

  /**
   * Get payment status from NetCash
   *
   * NOTE: NetCash Pay Now doesn't provide a real-time status query API.
   * This is a placeholder for future implementation if they add it.
   */
  async getStatus(transactionId: string): Promise<PaymentStatusResult> {
    this.log('warn', 'NetCash status query not supported', { transactionId });

    // Return pending status - actual status comes from webhooks
    return {
      transactionId,
      status: 'pending',
      amount: 0,
      reference: transactionId,
      metadata: {
        note: 'NetCash Pay Now does not support real-time status queries. Status updates come via webhooks.'
      }
    };
  }

  /**
   * Initiate a refund
   *
   * NOTE: NetCash Pay Now refunds must be processed manually via merchant portal.
   * This method logs the refund request for manual processing.
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    this.log('warn', 'NetCash refund requested (manual processing required)', {
      transactionId: params.transactionId,
      amount: params.amount,
      reason: params.reason
    });

    // NetCash Pay Now doesn't support automated refunds via API
    // Refunds must be processed manually in the NetCash merchant portal
    return {
      success: false,
      error: 'NetCash Pay Now does not support automated refunds. Please process this refund manually via the NetCash merchant portal.',
      metadata: {
        transactionId: params.transactionId,
        amount: params.amount,
        reason: params.reason,
        requestedBy: params.requestedBy,
        instruction: 'Log in to NetCash merchant portal → Transactions → Find transaction → Process refund'
      }
    };
  }

  /**
   * Check if NetCash provider is configured
   */
  isConfigured(): boolean {
    return !!(this.serviceKey && this.pciVaultKey);
  }

  /**
   * Get NetCash provider capabilities
   */
  getCapabilities(): PaymentProviderCapabilities {
    return {
      refunds: false,                   // Manual refunds only
      partial_refunds: false,           // Manual refunds only
      recurring_payments: true,         // Supports eMandate debit orders
      status_queries: false,            // No real-time status API
      webhooks: true,                   // Supports webhooks
      payment_methods: [
        'card',                         // 3D Secure cards
        'eft',                          // Bank EFT
        'instant_eft',                  // Ozow instant EFT
        'debit_order',                  // eMandate debit orders
        'scan_to_pay',                  // QR code payments
        'cash',                         // 1Voucher
        'payflex',                      // Buy Now Pay Later
        'capitec_pay',                  // Capitec Pay
        'paymyway',                     // Pay@Store
        'scode_retail'                  // SCode retail
      ],
      supports_3d_secure: true
    };
  }

  /**
   * Health check for NetCash gateway
   */
  async healthCheck(): Promise<{
    provider: 'netcash';
    healthy: boolean;
    response_time_ms?: number;
    error?: string;
    checked_at: Date;
  }> {
    const startTime = Date.now();

    try {
      // Simple connectivity test - check if payment URL is reachable
      const response = await fetch(this.paymentUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;

      return {
        provider: 'netcash',
        healthy: response.ok,
        response_time_ms: responseTime,
        checked_at: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        provider: 'netcash',
        healthy: false,
        response_time_ms: responseTime,
        error: errorMessage,
        checked_at: new Date()
      };
    }
  }

  // ============================================================================
  // NetCash-Specific Helper Methods
  // ============================================================================

  /**
   * Get NetCash payment gateway URL
   */
  getPaymentGatewayUrl(): string {
    return this.paymentUrl;
  }

  /**
   * Generate payment URL with query parameters (GET method)
   *
   * Alternative to POST redirect - useful for testing.
   */
  generatePaymentUrlWithParams(formData: NetCashFormData): string {
    const params = new URLSearchParams(formData as Record<string, string>);
    return `${this.paymentUrl}?${params.toString()}`;
  }
}
