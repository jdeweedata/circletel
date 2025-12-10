/**
 * NetCash eMandate Batch Service
 *
 * Service for submitting eMandate requests via BatchFileUpload.
 * This creates mandate requests that NetCash sends to customers for signing.
 *
 * API Documentation: https://api.netcash.co.za/inbound-payments/emandate/
 *
 * File Format: Tab-delimited with H/K/T/F records
 * - H = Header record
 * - K = Key record (defines field order)
 * - T = Transaction record(s)
 * - F = Footer record
 *
 * @module lib/payments/netcash-emandate-batch-service
 */

import { parseStringPromise } from 'xml2js';

// ============================================================================
// TYPES
// ============================================================================

export interface EMandateBatchRequest {
  // Required fields
  accountReference: string;      // 101 - Unique reference (2-22 chars)
  mandateName: string;           // 102 - Customer name on Netcash system
  isConsumer: boolean;           // 110 - true = Individual, false = Company
  firstName: string;             // 114 - Customer first name
  surname: string;               // 113 - Customer surname
  mobileNumber: string;          // 202 - Mobile number (10 digits, e.g., 0825551234)
  mandateAmount: number;         // 161 - Amount in Rands (will be converted to cents)
  debitFrequency: number;        // 530 - 1=Monthly, 2=Bimonthly, 3=Quarterly, etc.
  commencementMonth: number;     // 531 - MM (01-12)
  commencementDay: string;       // 532 - Day or "LDOM" for last day
  agreementDate: Date;           // 534 - Agreement date
  agreementReference: string;    // 535 - Agreement reference number

  // Optional fields
  emailAddress?: string;         // 201 - Email address
  tradingName?: string;          // 121 - Company trading name
  registrationNumber?: string;   // 122 - Company registration number
  registeredName?: string;       // 123 - Company registered name
  sendMandate?: boolean;         // 540 - Auto-send mandate for signature (default: true)
  publicHolidayOption?: number;  // 541 - 0=Preceding day, 1=Next day

  // Bank details (all required if any provided)
  bankDetailType?: number;       // 131 - 1=Bank account, 2=Credit card
  bankAccountName?: string;      // 132 - Account holder name
  bankAccountType?: number;      // 133 - 1=Current, 2=Savings
  branchCode?: string;           // 134 - Branch code (6 digits)
  bankAccountNumber?: string;    // 136 - Account number

  // Custom fields
  field1?: string;               // 311 - Custom data
  field2?: string;               // 312 - Custom data
  field3?: string;               // 313 - Custom data
}

export interface EMandateBatchResult {
  success: boolean;
  fileToken?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface EMandateLoadReport {
  success: boolean;
  batchName?: string;
  result?: 'SUCCESSFUL' | 'UNSUCCESSFUL' | 'SUCCESSFUL WITH ERRORS';
  errors: Array<{
    accountReference: string;
    lineNumber: number;
    message: string;
  }>;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NetCashEMandateBatchService {
  private serviceKey: string;
  private webServiceUrl: string;
  private softwareVendorKey: string = '24ade73c-98cf-47b3-99be-cc7b867b3080';

  constructor() {
    this.serviceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';

    if (!this.serviceKey) {
      console.warn('[eMandate Batch] Debit Order Service Key not configured');
    }
  }

  /**
   * Submit a single eMandate request via BatchFileUpload
   */
  async submitMandate(request: EMandateBatchRequest): Promise<EMandateBatchResult> {
    return this.submitBatch([request], `CircleTel-${request.accountReference}`);
  }

  /**
   * Submit multiple eMandate requests via BatchFileUpload
   */
  async submitBatch(
    requests: EMandateBatchRequest[],
    batchName?: string
  ): Promise<EMandateBatchResult> {
    if (!this.serviceKey) {
      return {
        success: false,
        errorCode: 'CONFIG_ERROR',
        errorMessage: 'NetCash Debit Order Service Key not configured',
      };
    }

    if (requests.length === 0) {
      return {
        success: false,
        errorCode: 'NO_ITEMS',
        errorMessage: 'No mandate requests provided',
      };
    }

    try {
      // Build the batch file content
      const fileContent = this.buildBatchFile(requests, batchName);
      
      console.log('[eMandate Batch] Submitting batch with', requests.length, 'mandate(s)');
      console.log('[eMandate Batch] File content preview:', fileContent.substring(0, 500));

      // Call BatchFileUpload
      const result = await this.callBatchFileUpload(fileContent);
      
      return result;
    } catch (error) {
      console.error('[eMandate Batch] Error submitting batch:', error);
      return {
        success: false,
        errorCode: 'EXCEPTION',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build the tab-delimited batch file content
   */
  private buildBatchFile(requests: EMandateBatchRequest[], batchName?: string): string {
    const TAB = '\t';
    const NEWLINE = '\n';
    const today = new Date();
    const actionDate = this.formatDate(today);
    const defaultBatchName = batchName || `CircleTel-Batch-${Date.now()}`;

    // Determine which fields to include based on requests
    const hasBankDetails = requests.some(r => r.bankDetailType);
    const hasEmail = requests.some(r => r.emailAddress);
    const hasCustomFields = requests.some(r => r.field1 || r.field2 || r.field3);

    // Build key record - define field order
    const keyFields: number[] = [
      101, // Account reference
      102, // Mandate name
      110, // Is Consumer
      114, // First name
      113, // Surname
      202, // Mobile number
      161, // Mandate amount (in cents)
      530, // Debit frequency
      531, // Commencement month
      532, // Commencement day
      534, // Agreement date
      535, // Agreement reference
      540, // Send mandate
      541, // Public holiday option
    ];

    // Add optional field keys
    if (hasEmail) keyFields.push(201);
    if (hasBankDetails) {
      keyFields.push(131, 132, 133, 134, 135, 136);
    }
    if (hasCustomFields) {
      keyFields.push(311, 312, 313);
    }

    // Header record
    const headerRecord = [
      'H',
      this.serviceKey,
      '1',                    // Version
      'Mandates',             // Instruction
      defaultBatchName,       // Batch name
      actionDate,             // Action date
      this.softwareVendorKey, // Software vendor key
    ].join(TAB);

    // Key record
    const keyRecord = 'K' + TAB + keyFields.join(TAB);

    // Transaction records
    const transactionRecords = requests.map(req => {
      const fields: string[] = ['T'];
      
      // Required fields in key order
      fields.push(req.accountReference.substring(0, 22));
      fields.push(req.mandateName.substring(0, 50));
      fields.push(req.isConsumer ? '1' : '0');
      fields.push(req.firstName.substring(0, 50));
      fields.push(req.surname.substring(0, 50));
      fields.push(this.formatMobileNumber(req.mobileNumber));
      fields.push(Math.round(req.mandateAmount * 100).toString()); // Convert to cents
      fields.push(req.debitFrequency.toString());
      fields.push(req.commencementMonth.toString().padStart(2, '0'));
      fields.push(req.commencementDay);
      fields.push(this.formatDate(req.agreementDate));
      fields.push(req.agreementReference.substring(0, 50));
      fields.push(req.sendMandate !== false ? '1' : '0'); // Default to send
      fields.push((req.publicHolidayOption || 0).toString());

      // Optional fields
      if (hasEmail) {
        fields.push(req.emailAddress || '');
      }
      if (hasBankDetails) {
        fields.push((req.bankDetailType || 1).toString());
        fields.push(req.bankAccountName || '');
        fields.push((req.bankAccountType || 1).toString());
        fields.push(req.branchCode || '');
        fields.push('0'); // Filler for bank accounts
        fields.push(req.bankAccountNumber || '');
      }
      if (hasCustomFields) {
        fields.push(req.field1 || '');
        fields.push(req.field2 || '');
        fields.push(req.field3 || '');
      }

      return fields.join(TAB);
    });

    // Footer record
    const totalAmountCents = requests.reduce(
      (sum, req) => sum + Math.round(req.mandateAmount * 100),
      0
    );
    const footerRecord = [
      'F',
      requests.length.toString(),
      totalAmountCents.toString(),
      '9999',
    ].join(TAB);

    // Combine all records
    return [
      headerRecord,
      keyRecord,
      ...transactionRecords,
      footerRecord,
    ].join(NEWLINE);
  }

  /**
   * Call the BatchFileUpload SOAP method
   */
  private async callBatchFileUpload(fileContent: string): Promise<EMandateBatchResult> {
    // Build SOAP envelope for BatchFileUpload
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:BatchFileUpload>
      <tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey>
      <tem:File>${this.escapeXml(fileContent)}</tem:File>
    </tem:BatchFileUpload>
  </soap:Body>
</soap:Envelope>`;

    console.log('[eMandate Batch] Calling BatchFileUpload API');

    const response = await fetch(this.webServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/INIWS_NIF/BatchFileUpload',
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    console.log('[eMandate Batch] Response status:', response.status, response.statusText);
    console.log('[eMandate Batch] Response body:', responseText.substring(0, 500));

    if (!response.ok) {
      return {
        success: false,
        errorCode: response.status.toString(),
        errorMessage: `NetCash API returned ${response.status}: ${response.statusText}`,
      };
    }

    // Parse SOAP response
    return this.parseBatchFileUploadResponse(responseText);
  }

  /**
   * Parse the BatchFileUpload SOAP response
   */
  private async parseBatchFileUploadResponse(xmlResponse: string): Promise<EMandateBatchResult> {
    try {
      const parsed = await parseStringPromise(xmlResponse);

      // Navigate through SOAP envelope
      const envelope = parsed['s:Envelope'] || parsed['soap:Envelope'];
      if (!envelope) {
        console.error('[eMandate Batch] Unknown envelope format:', Object.keys(parsed));
        return {
          success: false,
          errorCode: 'PARSE_ERROR',
          errorMessage: 'Unknown SOAP envelope format',
        };
      }

      const body = envelope['s:Body']?.[0] || envelope['soap:Body']?.[0];
      if (!body) {
        return {
          success: false,
          errorCode: 'PARSE_ERROR',
          errorMessage: 'Could not find SOAP body',
        };
      }

      // Get BatchFileUploadResponse
      const responseWrapper = body['BatchFileUploadResponse']?.[0];
      if (!responseWrapper) {
        console.error('[eMandate Batch] No BatchFileUploadResponse found:', Object.keys(body));
        return {
          success: false,
          errorCode: 'PARSE_ERROR',
          errorMessage: 'BatchFileUploadResponse not found',
        };
      }

      const result = responseWrapper['BatchFileUploadResult']?.[0];
      console.log('[eMandate Batch] Result:', result);

      // Check for error codes
      if (result === '100') {
        return {
          success: false,
          errorCode: '100',
          errorMessage: 'Authentication failure. Check service key.',
        };
      }
      if (result === '101') {
        return {
          success: false,
          errorCode: '101',
          errorMessage: 'Date format error. Dates should be CCYYMMDD.',
        };
      }
      if (result === '102') {
        return {
          success: false,
          errorCode: '102',
          errorMessage: 'Parameter error. Check file format.',
        };
      }
      if (result === '200') {
        return {
          success: false,
          errorCode: '200',
          errorMessage: 'General code exception. Contact NetCash support.',
        };
      }

      // Success - result is the file token
      return {
        success: true,
        fileToken: result,
      };
    } catch (error) {
      console.error('[eMandate Batch] Error parsing response:', error);
      return {
        success: false,
        errorCode: 'PARSE_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  /**
   * Request the load report for a submitted batch
   */
  async requestLoadReport(fileToken: string): Promise<EMandateLoadReport> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:RequestFileUploadReport>
      <tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey>
      <tem:FileToken>${this.escapeXml(fileToken)}</tem:FileToken>
    </tem:RequestFileUploadReport>
  </soap:Body>
</soap:Envelope>`;

    try {
      const response = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/INIWS_NIF/RequestFileUploadReport',
        },
        body: soapEnvelope,
      });

      const responseText = await response.text();
      console.log('[eMandate Batch] Load report response:', responseText.substring(0, 500));

      if (!response.ok) {
        return {
          success: false,
          errors: [{ accountReference: '', lineNumber: 0, message: `API error: ${response.status}` }],
        };
      }

      return this.parseLoadReportResponse(responseText);
    } catch (error) {
      console.error('[eMandate Batch] Error requesting load report:', error);
      return {
        success: false,
        errors: [{ accountReference: '', lineNumber: 0, message: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Parse the load report response
   */
  private async parseLoadReportResponse(xmlResponse: string): Promise<EMandateLoadReport> {
    try {
      const parsed = await parseStringPromise(xmlResponse);
      const envelope = parsed['s:Envelope'] || parsed['soap:Envelope'];
      const body = envelope?.['s:Body']?.[0] || envelope?.['soap:Body']?.[0];
      const responseWrapper = body?.['RequestFileUploadReportResponse']?.[0];
      const result = responseWrapper?.['RequestFileUploadReportResult']?.[0];

      if (!result) {
        return {
          success: false,
          errors: [{ accountReference: '', lineNumber: 0, message: 'Could not parse load report' }],
        };
      }

      // Parse the tab-delimited report
      const lines = result.split('\n');
      const errors: Array<{ accountReference: string; lineNumber: number; message: string }> = [];
      let batchName = '';
      let reportResult: 'SUCCESSFUL' | 'UNSUCCESSFUL' | 'SUCCESSFUL WITH ERRORS' | undefined;

      for (const line of lines) {
        if (line.startsWith('###BEGIN')) {
          const parts = line.split('\t');
          batchName = parts[1] || '';
          if (parts[2]?.includes('SUCCESSFUL WITH ERRORS')) {
            reportResult = 'SUCCESSFUL WITH ERRORS';
          } else if (parts[2]?.includes('UNSUCCESSFUL')) {
            reportResult = 'UNSUCCESSFUL';
          } else if (parts[2]?.includes('SUCCESSFUL')) {
            reportResult = 'SUCCESSFUL';
          }
        } else if (line.startsWith('###ERROR')) {
          const parts = line.split('\t');
          errors.push({
            accountReference: '',
            lineNumber: 0,
            message: parts[1] || 'Unknown error',
          });
        } else if (!line.startsWith('###') && line.trim()) {
          // Error line format: AccountRef \t Line:X \t Error message
          const parts = line.split('\t');
          if (parts.length >= 3) {
            const lineMatch = parts[1]?.match(/Line\s*:\s*(\d+)/);
            errors.push({
              accountReference: parts[0] || '',
              lineNumber: lineMatch ? parseInt(lineMatch[1], 10) : 0,
              message: parts[2] || '',
            });
          }
        }
      }

      return {
        success: reportResult === 'SUCCESSFUL',
        batchName,
        result: reportResult,
        errors,
      };
    } catch (error) {
      console.error('[eMandate Batch] Error parsing load report:', error);
      return {
        success: false,
        errors: [{ accountReference: '', lineNumber: 0, message: 'Failed to parse load report' }],
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Format date as CCYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Format mobile number to 10 digits (remove +27, spaces, etc.)
   */
  private formatMobileNumber(phone: string): string {
    // Remove all non-digits
    let digits = phone.replace(/\D/g, '');
    
    // Convert +27 to 0
    if (digits.startsWith('27') && digits.length === 11) {
      digits = '0' + digits.substring(2);
    }
    
    // Ensure 10 digits
    return digits.substring(0, 10).padStart(10, '0');
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
}
