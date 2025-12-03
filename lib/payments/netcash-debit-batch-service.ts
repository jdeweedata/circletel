/**
 * NetCash Debit Order Batch Service
 *
 * Service for submitting debit order batches to NetCash for collection.
 * This handles the actual collection of recurring payments from customers
 * with active debit order mandates.
 *
 * API Documentation: https://api.netcash.co.za/inbound-payments/debit-orders/
 *
 * @module lib/payments/netcash-debit-batch-service
 */

import { parseStringPromise } from 'xml2js';

// ============================================================================
// TYPES
// ============================================================================

export interface DebitOrderItem {
  accountReference: string;      // Unique reference (order/invoice number)
  amount: number;                // Amount in Rands (e.g., 899.00)
  actionDate: Date;              // Date to process the debit
  customerId: string;            // Internal customer ID
  invoiceId?: string;            // Invoice ID if applicable
  orderId?: string;              // Order ID if applicable
}

export interface BatchSubmissionResult {
  success: boolean;
  batchId?: string;
  batchReference?: string;
  itemsSubmitted: number;
  errors: string[];
  warnings: string[];
}

export interface DebitOrderBatchItem {
  AccountReference: string;      // 2-22 chars, unique per mandate
  Amount: string;                // Decimal format "899.00"
  ActionDate: string;            // CCYYMMDD format
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NetCashDebitBatchService {
  private serviceKey: string;
  private webServiceUrl: string;

  constructor() {
    this.serviceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';

    if (!this.serviceKey) {
      console.warn('NetCash Debit Order Service Key not configured');
    }
  }

  /**
   * Submit a batch of debit orders for collection
   * 
   * @param items - Array of debit order items to collect
   * @param batchName - Optional name for the batch (for tracking)
   * @returns BatchSubmissionResult with batch ID and status
   */
  async submitBatch(
    items: DebitOrderItem[],
    batchName?: string
  ): Promise<BatchSubmissionResult> {
    const result: BatchSubmissionResult = {
      success: false,
      itemsSubmitted: 0,
      errors: [],
      warnings: [],
    };

    if (!this.serviceKey) {
      result.errors.push('NetCash Debit Order Service Key not configured');
      return result;
    }

    if (items.length === 0) {
      result.warnings.push('No items to submit');
      result.success = true;
      return result;
    }

    try {
      // Format items for NetCash API
      const batchItems = items.map(item => this.formatDebitOrderItem(item));
      
      // Build the batch XML
      const batchXml = this.buildBatchXml(batchItems, batchName);
      
      console.log(`Submitting debit order batch with ${items.length} items`);

      // Submit to NetCash
      const response = await this.submitToNetCash(batchXml);
      
      if (response.success) {
        result.success = true;
        result.batchId = response.batchId;
        result.batchReference = response.batchReference;
        result.itemsSubmitted = items.length;
      } else {
        result.errors.push(response.error || 'Unknown error submitting batch');
      }

      return result;
    } catch (error) {
      console.error('Error submitting debit order batch:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Format a single debit order item for the batch
   */
  private formatDebitOrderItem(item: DebitOrderItem): DebitOrderBatchItem {
    return {
      AccountReference: item.accountReference.substring(0, 22), // Max 22 chars
      Amount: item.amount.toFixed(2),
      ActionDate: this.formatDate(item.actionDate),
    };
  }

  /**
   * Build the batch XML for submission
   */
  private buildBatchXml(items: DebitOrderBatchItem[], batchName?: string): string {
    const timestamp = Date.now();
    const defaultBatchName = batchName || `CircleTel-Batch-${timestamp}`;
    
    // Build items XML
    const itemsXml = items.map((item, index) => `
      <DebitOrderItem>
        <AccountReference>${this.escapeXml(item.AccountReference)}</AccountReference>
        <Amount>${item.Amount}</Amount>
        <ActionDate>${item.ActionDate}</ActionDate>
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
        console.error('NetCash API error:', { status: response.status, body: responseText.substring(0, 1000) });
        return {
          success: false,
          error: `NetCash API returned ${response.status}: ${response.statusText}`,
        };
      }

      // Parse response
      return this.parseUploadResponse(responseText);
    } catch (error) {
      console.error('Error calling NetCash API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Parse the upload response from NetCash
   */
  private async parseUploadResponse(xmlResponse: string): Promise<{
    success: boolean;
    batchId?: string;
    batchReference?: string;
    error?: string;
  }> {
    try {
      const parsed = await parseStringPromise(xmlResponse, { explicitArray: false });
      
      // Handle different namespace formats
      const envelope = parsed['s:Envelope'] || parsed['soap:Envelope'] || parsed['SOAP-ENV:Envelope'];
      const body = envelope?.['s:Body'] || envelope?.['soap:Body'] || envelope?.['SOAP-ENV:Body'];
      
      const response = body?.['UploadDebitOrderBatchResponse'];
      let result = response?.['UploadDebitOrderBatchResult'];
      
      // Handle array format
      result = Array.isArray(result) ? result[0] : result;

      console.log('NetCash UploadDebitOrderBatch response:', { result, rawResponse: xmlResponse.substring(0, 500) });

      // Check for error codes
      if (['100', '200', '311'].includes(result)) {
        return {
          success: false,
          error: this.getErrorMessage(result),
        };
      }

      // Success - result should contain batch ID
      // Format: "BatchID|BatchReference" or just "BatchID"
      const parts = result?.split('|') || [];
      
      return {
        success: true,
        batchId: parts[0],
        batchReference: parts[1] || parts[0],
      };
    } catch (error) {
      console.error('Error parsing upload response:', error);
      return {
        success: false,
        error: 'Failed to parse NetCash response',
      };
    }
  }

  /**
   * Authorise a batch for processing
   * Batches must be authorised before they will be processed
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
      console.error('Error authorising batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
      default: return `Unknown error: ${code}`;
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
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.serviceKey;
  }
}

// Export singleton instance
export const netcashDebitBatchService = new NetCashDebitBatchService();
