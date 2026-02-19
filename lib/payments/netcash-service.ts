import crypto from 'crypto';
import { buildInvoiceDescription } from './description-builder';

/**
 * Netcash Payment Service
 * Handles payment initiation, callback processing, and transaction status checking
 * Documentation: https://netcash.co.za/support/knowledge-base/paynow-integration-guide/
 */

export interface PaymentInitiationParams {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number; // Amount in cents (e.g., R100.00 = 10000)
  description: string;
}

export interface NetcashPaymentFormData {
  m1: string; // Service Key
  m2: string; // Service ID (Account Number)
  m3: string; // Software Vendor Key
  m4: string; // Extra field 1 (Transaction Ref)
  m5: string; // Extra field 2 (Order ID)
  m6: string; // Extra field 3 (Order Number)
  m9: string; // Extra field 4 (Customer Name)
  p2: string; // Return URL
  p3: string; // Description of goods
  Budget: string; // 'Y' or 'N' - Allow budget payments
  CardPayment: string; // 'Y' or 'N' - Allow card payments
  EFTPayment: string; // 'Y' or 'N' - Allow EFT payments
  TestMode: string; // '1' for test, '0' for production
  Amount: string; // Transaction amount in cents
}

export interface NetcashCallback {
  TransactionAccepted?: string; // 'true' or 'false'
  Complete?: string; // 'true' or 'false'
  Amount?: string; // Amount in cents
  Reference?: string; // Unique transaction reference (likely m4/Extra1 or internal ref)
  Reason?: string; // Approval/decline reason
  TransactionDate?: string; // Date of transaction
  Extra1?: string; // m4: Transaction Ref
  Extra2?: string; // m5: Order ID
  Extra3?: string; // m6: Order Number
  RequestTrace?: string; // Netcash trace number
}

export class NetcashPaymentService {
  private serviceKey: string;
  private merchantId: string;
  private webhookSecret: string;
  private paymentUrl: string;
  private returnUrl: string;
  private notifyUrl: string;
  private testMode: boolean;

  constructor() {
    // m1 = Service Key (Pay Now integration key)
    this.serviceKey = process.env.NETCASH_SERVICE_KEY || '';
    // m2 = Merchant ID (Account Number)
    this.merchantId = process.env.NETCASH_MERCHANT_ID || '';
    this.webhookSecret = process.env.NETCASH_WEBHOOK_SECRET || '';
    this.paymentUrl = process.env.NETCASH_PAYMENT_URL || 'https://paynow.netcash.co.za/site/paynow.aspx';
    this.returnUrl = process.env.NETCASH_RETURN_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/netcash/redirect`;
    this.notifyUrl = process.env.NETCASH_NOTIFY_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/netcash/webhook`;
    this.testMode = process.env.NODE_ENV === 'development';

    if (!this.serviceKey || !this.merchantId) {
      console.warn('Netcash service key or merchant ID not configured. Payment processing will not work.');
    }
  }

  /**
   * Generate payment form data for initiating a payment
   * This data is used to POST to Netcash payment gateway
   */
  generatePaymentFormData(params: PaymentInitiationParams): NetcashPaymentFormData {
    // Generate unique transaction reference
    const transactionRef = this.generateTransactionReference(params.orderId);

    // Amount must be in cents (integer)
    const amountInCents = Math.round(params.amount * 100);

    const formData: NetcashPaymentFormData = {
      m1: this.serviceKey,   // Service Key (Pay Now integration key)
      m2: this.merchantId,   // Merchant ID (Account Number)
      m3: 'circletel-nextjs', // Vendor key / software identifier
      m4: transactionRef,     // Extra 1: Transaction Ref
      m5: params.orderId,     // Extra 2: Order ID
      m6: params.orderNumber, // Extra 3: Order Number
      m9: params.customerName, // Extra 4: Customer Name
      p2: this.returnUrl,
      p3: params.description || `CircleTel Order ${params.orderNumber}`,
      Budget: 'Y', // Allow budget payments
      CardPayment: 'Y', // Allow card payments
      EFTPayment: 'Y', // Allow EFT payments
      TestMode: this.testMode ? '1' : '0',
      Amount: amountInCents.toString(),
    };

    return formData;
  }

  /**
   * Generate payment URL with form data
   * Returns the full URL to redirect customer to for payment
   */
  generatePaymentUrl(formData: NetcashPaymentFormData): string {
    const params = new URLSearchParams(formData as any);
    return `${this.paymentUrl}?${params.toString()}`;
  }

  /**
   * Process payment callback from Netcash
   * Validates the callback and extracts payment status
   */
  processCallback(callbackData: NetcashCallback): {
    success: boolean;
    orderId?: string;
    orderNumber?: string;
    amount?: number;
    reference?: string;
    reason?: string;
    transactionDate?: string;
    netcashTrace?: string;
    error?: string;
  } {
    try {
      // Check if transaction was accepted
      const accepted = callbackData.TransactionAccepted === 'true';
      const complete = callbackData.Complete === 'true';

      if (!complete) {
        return {
          success: false,
          error: 'Transaction not complete',
        };
      }

      if (!accepted) {
        return {
          success: false,
          error: callbackData.Reason || 'Transaction declined',
          reference: callbackData.Reference,
        };
      }

      // Extract amount (convert from cents to Rands)
      const amountInCents = parseInt(callbackData.Amount || '0');
      const amount = amountInCents / 100;

      return {
        success: true,
        orderId: callbackData.Extra2, // m5 mapped to Extra2
        orderNumber: callbackData.Extra3, // m6 mapped to Extra3
        amount,
        reference: callbackData.Reference || callbackData.Extra1, // m4 mapped to Extra1
        reason: callbackData.Reason,
        transactionDate: callbackData.TransactionDate,
        netcashTrace: callbackData.RequestTrace,
      };
    } catch (error) {
      console.error('Error processing Netcash callback:', error);
      return {
        success: false,
        error: 'Failed to process payment callback',
      };
    }
  }

  /**
   * Generate unique transaction reference
   * Format: CT-{orderId}-{timestamp}
   */
  private generateTransactionReference(orderId: string): string {
    const timestamp = Date.now();
    return `CT-${orderId}-${timestamp}`;
  }

  /**
   * Validate webhook signature (if Netcash supports it)
   * This is a placeholder - implement based on Netcash documentation
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.NETCASH_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('Webhook secret not configured, skipping signature validation');
      return true; // Skip validation if secret not configured
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature validation error:', error);
      return false;
    }
  }

  /**
   * Get payment gateway URL
   */
  getPaymentGatewayUrl(): string {
    return this.paymentUrl;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.serviceKey && !!this.merchantId;
  }

  /**
   * Initiate payment for invoice
   * Fetches invoice details and generates payment form data
   *
   * @param invoiceId - UUID of the invoice
   * @returns Payment URL and transaction reference
   */
  async initiatePaymentForInvoice(invoiceId: string): Promise<{
    paymentUrl: string;
    transactionReference: string;
    formData: NetcashPaymentFormData;
  }> {
    // Import createClient dynamically to avoid circular dependencies
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Fetch invoice details from customer_invoices table
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select('*, customer:customers(*)')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Build customer-friendly description for bank statement
    const description = buildInvoiceDescription({
      invoice_number: invoice.invoice_number
    });

    // Generate payment form data
    const formData = this.generatePaymentFormData({
      orderId: invoice.id,
      orderNumber: invoice.invoice_number,
      customerName: invoice.customer.company_name || invoice.customer.name || 'Customer',
      customerEmail: invoice.customer.email,
      amount: invoice.total_amount, // Already in Rands, will be converted to cents
      description
    });

    // Generate payment URL
    const paymentUrl = this.generatePaymentUrl(formData);

    return {
      paymentUrl,
      transactionReference: formData.m5,
      formData
    };
  }
}

// Export singleton instance
export const netcashService = new NetcashPaymentService();
