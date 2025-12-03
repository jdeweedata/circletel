/**
 * NetCash Credit Card Debit Order Batch Service
 *
 * Service for submitting credit card debit order batches to NetCash.
 * Uses PCI Vault tokens for recurring credit card charges.
 *
 * Credit Card Debit Order Keys:
 * - Key 131 = 2 (Credit Card type)
 * - Key 132 = Card holder name
 * - Key 133 = Card type (1=Visa, 2=MasterCard, 3=Amex)
 * - Key 134 = Expiry month
 * - Key 135 = Expiry year
 * - Key 136 = Token (from PCI Vault)
 * - Key 137 = Masked card number
 *
 * @module lib/payments/netcash-cc-debit-batch-service
 */

import { parseStringPromise } from 'xml2js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreditCardDebitItem {
  /** Unique reference (e.g., invoice number) */
  accountReference: string;
  /** Amount in Rands (e.g., 899.00) */
  amount: number;
  /** Date to process the charge */
  actionDate: Date;
  /** Customer ID for tracking */
  customerId: string;
  /** Card token from PCI Vault */
  cardToken: string;
  /** Cardholder name */
  cardHolderName: string;
  /** Card type: visa, mastercard, amex */
  cardType: string;
  /** Card expiry month (1-12) */
  expiryMonth: number;
  /** Card expiry year (4 digits) */
  expiryYear: number;
  /** Masked card number */
  maskedNumber: string;
  /** Invoice ID if applicable */
  invoiceId?: string;
}

export interface CCBatchSubmissionResult {
  success: boolean;
  batchId?: string;
  batchReference?: string;
  itemsSubmitted: number;
  errors: string[];
  warnings: string[];
}

export interface CCBatchItem {
  /** Account reference */
  AccountReference: string;
  /** Amount in decimal format */
  Amount: string;
  /** Date in CCYYMMDD format */
  ActionDate: string;
  /** 2 = Credit Card */
  PaymentType: string;
  /** Card holder name */
  CardHolderName: string;
  /** 1=Visa, 2=MasterCard, 3=Amex */
  CardType: string;
  /** Expiry month MM */
  ExpiryMonth: string;
  /** Expiry year YYYY */
  ExpiryYear: string;
  /** PCI Vault token */
  Token: string;
  /** Masked card number */
  MaskedCardNumber: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NetCashCCDebitBatchService {
  private serviceKey: string;
  private pciVaultKey: string;
  private webServiceUrl: string;

  constructor() {
    this.serviceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.pciVaultKey = process.env.NETCASH_PCI_VAULT_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';

    if (!this.serviceKey) {
      console.warn('[CC Debit Batch] Service key not configured');
    }
    if (!this.pciVaultKey) {
      console.warn('[CC Debit Batch] PCI Vault key not configured');
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.serviceKey && this.pciVaultKey);
  }

  /**
   * Submit a batch of credit card debits for collection
   *
   * @param items - Array of credit card debit items
   * @param batchName - Optional name for the batch
   * @returns Batch submission result
   */
  async submitBatch(
    items: CreditCardDebitItem[],
    batchName?: string
  ): Promise<CCBatchSubmissionResult> {
    const result: CCBatchSubmissionResult = {
      success: false,
      itemsSubmitted: 0,
      errors: [],
      warnings: [],
    };

    if (!this.isConfigured()) {
      result.errors.push('NetCash Credit Card Debit service not configured');
      return result;
    }

    if (items.length === 0) {
      result.warnings.push('No items to submit');
      result.success = true;
      return result;
    }

    try {
      // Validate and format items
      const batchItems: CCBatchItem[] = [];
      for (const item of items) {
        const validation = this.validateItem(item);
        if (!validation.valid) {
          result.warnings.push(`Skipping ${item.accountReference}: ${validation.error}`);
          continue;
        }
        batchItems.push(this.formatDebitItem(item));
      }

      if (batchItems.length === 0) {
        result.errors.push('No valid items after validation');
        return result;
      }

      // Build batch XML
      const batchXml = this.buildBatchXml(batchItems, batchName);

      console.log(`[CC Debit Batch] Submitting batch with ${batchItems.length} items`);

      // Submit to NetCash
      const response = await this.submitToNetCash(batchXml);

      if (response.success) {
        result.success = true;
        result.batchId = response.batchId;
        result.batchReference = response.batchReference;
        result.itemsSubmitted = batchItems.length;

        console.log('[CC Debit Batch] Batch submitted successfully:', {
          batchId: response.batchId,
          itemsSubmitted: batchItems.length,
        });
      } else {
        result.errors.push(response.error || 'Unknown error submitting batch');
      }

      return result;
    } catch (error) {
      console.error('[CC Debit Batch] Error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Validate a debit item before submission
   */
  private validateItem(item: CreditCardDebitItem): { valid: boolean; error?: string } {
    if (!item.cardToken) {
      return { valid: false, error: 'Missing card token' };
    }
    if (!item.accountReference) {
      return { valid: false, error: 'Missing account reference' };
    }
    if (item.amount <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }
    if (!item.expiryMonth || !item.expiryYear) {
      return { valid: false, error: 'Missing expiry date' };
    }

    // Check if card is expired
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (item.expiryYear < currentYear ||
       (item.expiryYear === currentYear && item.expiryMonth < currentMonth)) {
      return { valid: false, error: 'Card is expired' };
    }

    return { valid: true };
  }

  /**
   * Format a debit item for the batch
   */
  private formatDebitItem(item: CreditCardDebitItem): CCBatchItem {
    return {
      AccountReference: item.accountReference.substring(0, 22),
      Amount: item.amount.toFixed(2),
      ActionDate: this.formatDate(item.actionDate),
      PaymentType: '2', // Credit Card
      CardHolderName: item.cardHolderName.substring(0, 50),
      CardType: this.getCardTypeCode(item.cardType),
      ExpiryMonth: String(item.expiryMonth).padStart(2, '0'),
      ExpiryYear: String(item.expiryYear),
      Token: item.cardToken,
      MaskedCardNumber: item.maskedNumber || '',
    };
  }

  /**
   * Convert card type to NetCash code
   */
  private getCardTypeCode(cardType: string): string {
    switch (cardType.toLowerCase()) {
      case 'visa': return '1';
      case 'mastercard': return '2';
      case 'amex': return '3';
      default: return '1'; // Default to Visa
    }
  }

  /**
   * Build batch XML for submission
   */
  private buildBatchXml(items: CCBatchItem[], batchName?: string): string {
    const timestamp = Date.now();
    const defaultBatchName = batchName || `CircleTel-CC-Batch-${timestamp}`;

    // Build items XML with credit card specific fields
    const itemsXml = items.map((item) => `
      <DebitOrderItem>
        <AccountReference>${this.escapeXml(item.AccountReference)}</AccountReference>
        <Amount>${item.Amount}</Amount>
        <ActionDate>${item.ActionDate}</ActionDate>
        <Key131>${item.PaymentType}</Key131>
        <Key132>${this.escapeXml(item.CardHolderName)}</Key132>
        <Key133>${item.CardType}</Key133>
        <Key134>${item.ExpiryMonth}</Key134>
        <Key135>${item.ExpiryYear}</Key135>
        <Key136>${this.escapeXml(item.Token)}</Key136>
        <Key137>${this.escapeXml(item.MaskedCardNumber)}</Key137>
      </DebitOrderItem>
    `).join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:UploadDebitOrderBatch>
      <tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey>
      <tem:BatchName>${this.escapeXml(defaultBatchName)}</tem:BatchName>
      <tem:DebitOrderItems>
        ${itemsXml}
      </tem:DebitOrderItems>
    </tem:UploadDebitOrderBatch>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Submit batch to NetCash API
   */
  private async submitToNetCash(batchXml: string): Promise<{
    success: boolean;
    batchId?: string;
    batchReference?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/INIWS_NIF/UploadDebitOrderBatch',
        },
        body: batchXml,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('[CC Debit Batch] API error:', {
          status: response.status,
          body: responseText.substring(0, 1000),
        });
        return {
          success: false,
          error: `NetCash API returned ${response.status}: ${response.statusText}`,
        };
      }

      return this.parseUploadResponse(responseText);
    } catch (error) {
      console.error('[CC Debit Batch] Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Parse upload response from NetCash
   */
  private async parseUploadResponse(xmlResponse: string): Promise<{
    success: boolean;
    batchId?: string;
    batchReference?: string;
    error?: string;
  }> {
    try {
      const parsed = await parseStringPromise(xmlResponse, { explicitArray: false });

      const envelope = parsed['s:Envelope'] || parsed['soap:Envelope'] || parsed['SOAP-ENV:Envelope'];
      const body = envelope?.['s:Body'] || envelope?.['soap:Body'] || envelope?.['SOAP-ENV:Body'];

      const response = body?.['UploadDebitOrderBatchResponse'];
      let result = response?.['UploadDebitOrderBatchResult'];

      result = Array.isArray(result) ? result[0] : result;

      console.log('[CC Debit Batch] Response:', {
        result,
        rawResponse: xmlResponse.substring(0, 500),
      });

      // Check for error codes
      if (['100', '200', '311', '312', '313', '314', '315', '316'].includes(result)) {
        return {
          success: false,
          error: this.getErrorMessage(result),
        };
      }

      // Success - result contains batch ID
      const parts = result?.split('|') || [];

      return {
        success: true,
        batchId: parts[0],
        batchReference: parts[1] || parts[0],
      };
    } catch (error) {
      console.error('[CC Debit Batch] Parse error:', error);
      return {
        success: false,
        error: 'Failed to parse NetCash response',
      };
    }
  }

  /**
   * Authorise a batch for processing
   */
  async authoriseBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:AuthoriseBatch>
      <tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey>
      <tem:BatchId>${this.escapeXml(batchId)}</tem:BatchId>
    </tem:AuthoriseBatch>
  </soap:Body>
</soap:Envelope>`;

      const response = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/INIWS_NIF/AuthoriseBatch',
        },
        body: soapEnvelope,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `NetCash API returned ${response.status}: ${response.statusText}`,
        };
      }

      const responseText = await response.text();
      const parsed = await parseStringPromise(responseText, { explicitArray: false });

      const envelope = parsed['s:Envelope'] || parsed['soap:Envelope'];
      const body = envelope?.['s:Body'] || envelope?.['soap:Body'];
      const result = body?.['AuthoriseBatchResponse']?.['AuthoriseBatchResult'];

      if (result === '0' || result === 'Success') {
        return { success: true };
      }

      return {
        success: false,
        error: this.getErrorMessage(result),
      };
    } catch (error) {
      console.error('[CC Debit Batch] Authorise error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get customers with active card tokens for billing
   */
  async getCustomersWithCardTokens(): Promise<CreditCardDebitItem[]> {
    try {
      const { createClient } = await import('@supabase/supabase-js');

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Get active card payment methods
      const { data: paymentMethods, error } = await supabase
        .from('customer_payment_methods')
        .select(`
          id,
          customer_id,
          card_token,
          card_holder_name,
          card_type,
          card_expiry_month,
          card_expiry_year,
          card_masked_number,
          customer:customers(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('method_type', 'credit_card')
        .eq('is_active', true)
        .eq('token_status', 'active')
        .not('card_token', 'is', null);

      if (error) {
        console.error('[CC Debit Batch] Error fetching payment methods:', error);
        return [];
      }

      // Filter out expired cards
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const validMethods = (paymentMethods || []).filter(pm => {
        if (!pm.card_expiry_year || !pm.card_expiry_month) return false;
        if (pm.card_expiry_year < currentYear) return false;
        if (pm.card_expiry_year === currentYear && pm.card_expiry_month < currentMonth) return false;
        return true;
      });

      return validMethods.map(pm => {
        const customer = Array.isArray(pm.customer) ? pm.customer[0] : pm.customer;
        return {
          accountReference: '', // Will be set per invoice
          amount: 0, // Will be set per invoice
          actionDate: new Date(),
          customerId: pm.customer_id,
          cardToken: pm.card_token,
          cardHolderName: pm.card_holder_name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
          cardType: pm.card_type || 'visa',
          expiryMonth: pm.card_expiry_month,
          expiryYear: pm.card_expiry_year,
          maskedNumber: pm.card_masked_number || '',
        };
      });
    } catch (error) {
      console.error('[CC Debit Batch] Error:', error);
      return [];
    }
  }

  /**
   * Format date to CCYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get error message for NetCash error codes
   */
  private getErrorMessage(code: string): string {
    switch (code) {
      case '100': return 'Authentication failure. Check service key.';
      case '200': return 'General code exception. Contact NetCash support.';
      case '311': return 'Service key not valid for this service.';
      case '312': return 'Batch name already exists.';
      case '313': return 'Invalid batch format.';
      case '314': return 'Batch is empty.';
      case '315': return 'Invalid action date.';
      case '316': return 'Account reference not found in masterfile.';
      case '317': return 'Invalid credit card token.';
      case '318': return 'Credit card expired.';
      default: return `Unknown error: ${code}`;
    }
  }
}

// Export singleton instance
export const netcashCCDebitBatchService = new NetCashCCDebitBatchService();
