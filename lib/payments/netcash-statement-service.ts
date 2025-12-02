/**
 * NetCash Statement Service
 *
 * Service for querying NetCash merchant statements to verify payment status
 * and reconcile debit order collections.
 *
 * API Documentation: https://api.netcash.co.za/standard-integration/netcash-statement/
 *
 * @module lib/payments/netcash-statement-service
 */

import { parseStringPromise } from 'xml2js';

// ============================================================================
// TYPES
// ============================================================================

export interface StatementTransaction {
  date: string;
  transactionCode: string;
  description: string;
  amount: number;
  effect: '+' | '-';
  reference?: string;
  accountReference?: string;
}

export interface StatementResponse {
  success: boolean;
  openingBalance?: number;
  closingBalance?: number;
  transactions: StatementTransaction[];
  error?: string;
}

export interface BatchStatus {
  serviceKey: string;
  batchId: string;
  batchName: string;
  status: BatchStatusCode;
  volume: number;
  value: number;
  createdOn: Date;
  authorisedOn: Date | null;
  unauthorisedOn: Date | null;
}

export type BatchStatusCode = 
  | 'unauthorised'    // 1
  | 'authorised'      // 2
  | 'locked'          // 3
  | 'processed'       // 4
  | 'insufficient_funds'; // 5

export interface DebitOrderResult {
  accountReference: string;
  amount: number;
  status: 'successful' | 'unpaid' | 'pending';
  transactionCode: string;
  unpaidCode?: string;
  unpaidReason?: string;
  transactionDate: string;
}

// Transaction codes for debit orders
export const TRANSACTION_CODES = {
  // Successful debit orders
  TDD: { code: 'TDD', description: 'Two day debit order', type: 'debit_success' },
  SDD: { code: 'SDD', description: 'Same day debit order', type: 'debit_success' },
  TDC: { code: 'TDC', description: 'Two day credit card debit order', type: 'debit_success' },
  SDC: { code: 'SDC', description: 'Same day credit card debit order', type: 'debit_success' },
  DCS: { code: 'DCS', description: 'DebiCheck successful', type: 'debit_success' },
  
  // Unpaid/Failed debit orders
  DRU: { code: 'DRU', description: 'Debit order unpaid', type: 'debit_unpaid' },
  DCX: { code: 'DCX', description: 'DebiCheck unsuccessful', type: 'debit_unpaid' },
  DCD: { code: 'DCD', description: 'DebiCheck disputed', type: 'debit_disputed' },
  DCU: { code: 'DCU', description: 'Debit Order Credit Card Unpaid', type: 'debit_unpaid' },
  
  // Mandate related
  ELM: { code: 'ELM', description: 'Electronic Mandate', type: 'mandate' },
  DCM: { code: 'DCM', description: 'DebiCheck Mandate', type: 'mandate' },
} as const;

// Unpaid reason codes
export const UNPAID_CODES: Record<string, string> = {
  '2': 'Not provided for (Insufficient funds)',
  '3': 'Account closed',
  '4': 'Account does not exist',
  '5': 'Payment stopped',
  '6': 'Account frozen',
  '7': 'Refer to drawer',
  '8': 'Account in dispute',
  '10': 'Invalid account number',
  '12': 'Invalid branch code',
  '14': 'Account dormant',
  '22': 'Account closed',
  '60': 'Blocked account (consecutive failures)',
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NetCashStatementService {
  private accountServiceKey: string;
  private debitOrderServiceKey: string;
  private webServiceUrl: string;

  constructor() {
    this.accountServiceKey = process.env.NETCASH_ACCOUNT_SERVICE_KEY || '';
    this.debitOrderServiceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';

    if (!this.accountServiceKey) {
      console.warn('NetCash Account Service Key not configured');
    }
  }

  /**
   * Request merchant statement for a specific date
   * Full daily statements are available from 08:30 the day after
   */
  async requestStatement(date: Date): Promise<string> {
    const formattedDate = this.formatDate(date);
    
    const soapEnvelope = this.buildSoapEnvelope('RequestMerchantStatement', {
      ServiceKey: this.accountServiceKey,
      FromActionDate: formattedDate,
    });

    console.log('NetCash RequestMerchantStatement request:', { 
      url: this.webServiceUrl, 
      date: formattedDate,
      serviceKeyLength: this.accountServiceKey?.length 
    });

    const response = await fetch(this.webServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://ws.netcash.co.za/NIWS_NIF/NIWS_NIF/RequestMerchantStatement',
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('NetCash API error:', { status: response.status, body: responseText.substring(0, 1000) });
      throw new Error(`NetCash API returned ${response.status}: ${response.statusText}`);
    }

    const pollingId = await this.extractPollingId(responseText);
    
    return pollingId;
  }

  /**
   * Retrieve statement using polling ID
   */
  async retrieveStatement(pollingId: string): Promise<StatementResponse> {
    const soapEnvelope = this.buildSoapEnvelope('RetrieveMerchantStatement', {
      ServiceKey: this.accountServiceKey,
      PollingId: pollingId,
    });

    const response = await fetch(this.webServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://ws.netcash.co.za/NIWS_NIF/NIWS_NIF/RetrieveMerchantStatement',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`NetCash API returned ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    return this.parseStatementResponse(responseText);
  }

  /**
   * Get full statement for a date (request + retrieve with retry)
   */
  async getStatement(date: Date, maxRetries = 5, retryDelayMs = 2000): Promise<StatementResponse> {
    try {
      const pollingId = await this.requestStatement(date);
      
      // Handle error codes
      if (['100', '101', '102', '200'].includes(pollingId)) {
        return {
          success: false,
          transactions: [],
          error: this.getErrorMessage(pollingId),
        };
      }

      // Poll for statement with retries
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        await this.delay(retryDelayMs);
        
        const statement = await this.retrieveStatement(pollingId);
        
        if (statement.success || statement.error !== 'FILE NOT READY') {
          return statement;
        }
      }

      return {
        success: false,
        transactions: [],
        error: 'Statement not ready after maximum retries',
      };
    } catch (error) {
      console.error('Error getting NetCash statement:', error);
      return {
        success: false,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve batch status for last 10 batches
   */
  async getBatchStatus(): Promise<BatchStatus[]> {
    const soapEnvelope = this.buildSoapEnvelope('RetrieveBatchStatus', {
      ServiceKey: this.debitOrderServiceKey,
    });

    const response = await fetch(this.webServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://ws.netcash.co.za/NIWS_NIF/NIWS_NIF/RetrieveBatchStatus',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`NetCash API returned ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    return this.parseBatchStatusResponse(responseText);
  }

  /**
   * Find debit order results for specific account references in a statement
   */
  findDebitOrderResults(
    statement: StatementResponse,
    accountReferences: string[]
  ): DebitOrderResult[] {
    const results: DebitOrderResult[] = [];
    const refSet = new Set(accountReferences.map(r => r.toLowerCase()));

    for (const tx of statement.transactions) {
      const txCode = TRANSACTION_CODES[tx.transactionCode as keyof typeof TRANSACTION_CODES];
      if (!txCode) continue;

      // Check if this transaction matches any of our account references
      const matchedRef = accountReferences.find(ref => 
        tx.description?.toLowerCase().includes(ref.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(ref.toLowerCase()) ||
        tx.accountReference?.toLowerCase() === ref.toLowerCase()
      );

      if (matchedRef) {
        let status: DebitOrderResult['status'] = 'pending';
        let unpaidCode: string | undefined;
        let unpaidReason: string | undefined;

        if (txCode.type === 'debit_success') {
          status = 'successful';
        } else if (txCode.type === 'debit_unpaid' || txCode.type === 'debit_disputed') {
          status = 'unpaid';
          // Extract unpaid code from description if present
          const codeMatch = tx.description.match(/Code\s*(\d+)/i);
          if (codeMatch) {
            unpaidCode = codeMatch[1];
            unpaidReason = UNPAID_CODES[unpaidCode] || 'Unknown reason';
          }
        }

        results.push({
          accountReference: matchedRef,
          amount: tx.amount,
          status,
          transactionCode: tx.transactionCode,
          unpaidCode,
          unpaidReason,
          transactionDate: tx.date,
        });
      }
    }

    return results;
  }

  /**
   * Check if a specific debit order was successful
   */
  async checkDebitOrderStatus(
    accountReference: string,
    actionDate: Date
  ): Promise<DebitOrderResult | null> {
    const statement = await this.getStatement(actionDate);
    
    if (!statement.success) {
      console.error('Failed to get statement:', statement.error);
      return null;
    }

    const results = this.findDebitOrderResults(statement, [accountReference]);
    return results.length > 0 ? results[0] : null;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private buildSoapEnvelope(method: string, params: Record<string, string>): string {
    const paramXml = Object.entries(params)
      .map(([key, value]) => `<${key}>${this.escapeXml(value)}</${key}>`)
      .join('');

    // NetCash uses a specific SOAP format without namespace prefixes on parameters
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://ws.netcash.co.za/NIWS_NIF">
      ${paramXml}
    </${method}>
  </soap:Body>
</soap:Envelope>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private async extractPollingId(xmlResponse: string): Promise<string> {
    try {
      const parsed = await parseStringPromise(xmlResponse, { explicitArray: false });
      
      // Handle different namespace formats
      const envelope = parsed['soap:Envelope'] || parsed['s:Envelope'] || parsed['SOAP-ENV:Envelope'];
      const body = envelope?.['soap:Body'] || envelope?.['s:Body'] || envelope?.['SOAP-ENV:Body'];
      
      // Try different response element names
      const response = body?.['RequestMerchantStatementResponse'] || 
                       body?.['ns:RequestMerchantStatementResponse'] ||
                       body?.['ns1:RequestMerchantStatementResponse'];
      
      const result = response?.['RequestMerchantStatementResult'] ||
                     response?.['ns:RequestMerchantStatementResult'] ||
                     response?.['ns1:RequestMerchantStatementResult'];
      
      // Handle both array and non-array results
      const pollingId = Array.isArray(result) ? result[0] : result;
      
      console.log('NetCash RequestMerchantStatement response:', { pollingId, rawResponse: xmlResponse.substring(0, 500) });
      
      return pollingId || '';
    } catch (error) {
      console.error('Error parsing polling ID:', error, 'Response:', xmlResponse.substring(0, 1000));
      throw new Error('Failed to parse NetCash response');
    }
  }

  private async parseStatementResponse(xmlResponse: string): Promise<StatementResponse> {
    try {
      const parsed = await parseStringPromise(xmlResponse, { explicitArray: false });
      
      // Handle different namespace formats
      const envelope = parsed['soap:Envelope'] || parsed['s:Envelope'] || parsed['SOAP-ENV:Envelope'];
      const body = envelope?.['soap:Body'] || envelope?.['s:Body'] || envelope?.['SOAP-ENV:Body'];
      
      const response = body?.['RetrieveMerchantStatementResponse'] || 
                       body?.['ns:RetrieveMerchantStatementResponse'] ||
                       body?.['ns1:RetrieveMerchantStatementResponse'];
      
      let result = response?.['RetrieveMerchantStatementResult'] ||
                   response?.['ns:RetrieveMerchantStatementResult'] ||
                   response?.['ns1:RetrieveMerchantStatementResult'];
      
      // Handle array format
      result = Array.isArray(result) ? result[0] : result;
      
      console.log('NetCash RetrieveMerchantStatement response:', { resultLength: result?.length, rawResponse: xmlResponse.substring(0, 500) });

      // Check for error responses
      if (['100', '200', 'FILE NOT READY', 'NO CHANGE'].includes(result)) {
        return {
          success: result === 'NO CHANGE',
          transactions: [],
          error: result === 'NO CHANGE' ? undefined : result,
        };
      }

      // Parse tab-delimited statement
      const transactions = this.parseTabDelimitedStatement(result);
      
      return {
        success: true,
        transactions,
        openingBalance: transactions.find(t => t.transactionCode === 'OBL')?.amount,
        closingBalance: transactions.find(t => t.transactionCode === 'CBL')?.amount,
      };
    } catch (error) {
      console.error('Error parsing statement response:', error);
      return {
        success: false,
        transactions: [],
        error: 'Failed to parse statement response',
      };
    }
  }

  private parseTabDelimitedStatement(data: string): StatementTransaction[] {
    const transactions: StatementTransaction[] = [];
    const lines = data.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const fields = line.split('\t');
      if (fields.length < 5) continue;

      const [date, transactionCode, , description, amountStr, effect, , reference, accountRef] = fields;
      
      transactions.push({
        date,
        transactionCode,
        description,
        amount: parseFloat(amountStr) || 0,
        effect: effect === '+' ? '+' : '-',
        reference,
        accountReference: accountRef,
      });
    }

    return transactions;
  }

  private async parseBatchStatusResponse(xmlResponse: string): Promise<BatchStatus[]> {
    try {
      const parsed = await parseStringPromise(xmlResponse);
      const body = parsed['soap:Envelope']?.['soap:Body']?.[0];
      const response = body?.['RetrieveBatchStatusResponse']?.[0];
      const result = response?.['RetrieveBatchStatusResult']?.[0];

      // Check for error codes
      if (['100', '200', '311'].includes(result)) {
        console.error('Batch status error:', this.getErrorMessage(result));
        return [];
      }

      // Parse tab-delimited batch status
      const batches: BatchStatus[] = [];
      const lines = result.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        const fields = line.split('\t');
        if (fields.length < 9) continue;

        const [serviceKey, batchId, batchName, statusCode, volume, value, createdOn, authorisedOn, unauthorisedOn] = fields;

        batches.push({
          serviceKey,
          batchId,
          batchName,
          status: this.mapBatchStatusCode(parseInt(statusCode)),
          volume: parseInt(volume) || 0,
          value: parseFloat(value) || 0,
          createdOn: new Date(createdOn),
          authorisedOn: authorisedOn && !authorisedOn.includes('1900') ? new Date(authorisedOn) : null,
          unauthorisedOn: unauthorisedOn && !unauthorisedOn.includes('1900') ? new Date(unauthorisedOn) : null,
        });
      }

      return batches;
    } catch (error) {
      console.error('Error parsing batch status:', error);
      return [];
    }
  }

  private mapBatchStatusCode(code: number): BatchStatusCode {
    switch (code) {
      case 1: return 'unauthorised';
      case 2: return 'authorised';
      case 3: return 'locked';
      case 4: return 'processed';
      case 5: return 'insufficient_funds';
      default: return 'unauthorised';
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case '100': return 'Authentication failure. Check service key.';
      case '101': return 'Date format error. Use CCYYMMDD format.';
      case '102': return 'Invalid date. Statement not available for this date.';
      case '200': return 'General code exception. Contact NetCash support.';
      case '311': return 'Service key not valid for this service.';
      case 'FILE NOT READY': return 'Statement file not ready yet.';
      case 'NO CHANGE': return 'No new transactions since last request.';
      default: return `Unknown error: ${code}`;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const netcashStatementService = new NetCashStatementService();
