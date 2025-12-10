/**
 * NetCash eMandate Service
 *
 * Wrapper for NetCash eMandate Synchronous API
 * Documentation: https://api.netcash.co.za/inbound-payments/emandate/emandate-synchronous/
 *
 * @module lib/payments/netcash-emandate-service
 */

import { parseStringPromise, Builder } from 'xml2js';

// ============================================================================
// TYPES
// ============================================================================

export interface EMandateRequest {
  // Required fields
  ServiceKey: string;
  AccountReference: string; // Unique reference (2-22 chars) - use order_number
  MandateName: string; // Customer name
  MandateAmount: number; // Decimal (e.g., 100.00)
  IsConsumer: boolean; // true = Individual, false = Business
  FirstName: string;
  Surname: string;
  TradingName: string; // For business (blank for individual)
  RegistrationNumber: string; // For business (blank for individual)
  RegisteredName: string; // For business (blank for individual)
  MobileNumber: string; // e.g., "0825551234"
  DebitFrequency: 'Monthly' | 'Bimonthly' | 'ThreeMonthly' | 'SixMonthly' | 'Annually' | 'Weekly' | 'Biweekly';
  CommencementMonth: number; // MM (1-12)
  CommencementDay: string; // "01-31" or "LDOM" or forward-slash separated list
  AgreementDate: string; // CCYYMMDD
  AgreementReferenceNumber: string; // Max 50 chars

  // Optional fields
  CancellationNoticePeriod?: number; // 01-60 days
  PublicHolidayOption?: 'PrecedingOrdinaryBusinessDay' | 'VeryNextOrdinaryBusinessDay';
  Notes?: string;
  Field1?: string; // Custom user-defined data (max 50 chars)
  Field2?: string;
  Field3?: string;
  Field4?: string;
  Field5?: string;
  Field6?: string;
  Field7?: string;
  Field8?: string;
  Field9?: string;
  AllowVariableDebitAmounts?: boolean;

  // Bank account details (optional - if provided, all 6 fields required)
  BankDetailType?: 1 | 2; // 1 = Bank account, 2 = Credit card
  BankAccountName?: string;
  BankAccountNumber?: string;
  BranchCode?: string; // 6 digits
  BankAccountType?: 'Current' | 'Savings' | 'Transmission';

  // Credit card details (optional)
  CreditCardToken?: string;
  CreditCardType?: 1 | 2; // 1 = Mastercard, 2 = Visa
  ExpiryMonth?: number; // MM
  ExpiryYear?: number; // CCYY

  // Additional fields
  IsIdNumber?: boolean;
  Title?: 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr' | 'Prof' | 'Rabbi' | 'Ds' | 'Adv' | 'NotSet';
  EmailAddress?: string;
  PhoneNumber?: string; // e.g., "0115551234"
  DateOfBirth?: string; // CCYYMMDD
  DecemberDebitDay?: string;
  DebitMasterfileGroup?: string;
  PhysicalAddressLine1?: string;
  PhysicalAddressLine2?: string;
  PhysicalAddressLine3?: string;
  PhysicalSuburb?: string;
  PhysicalCity?: string;
  PhysicalProvince?: string;
  PhysicalPostalCode?: string;
  MandateActive?: boolean;
  RequestAVS?: boolean; // Not recommended for AddMandate
  AVSCheckNumber?: string; // ID number for AVS
  IncludeDebiCheck?: boolean;
  DebiCheckMandateTemplateId?: string;
  DebiCheckCollectionAmount?: number;
  DebiCheckFirstCollectionDiffers?: boolean;
  DebiCheckFirstCollectionAmount?: number;
  DebiCheckCollectionDayCode?: string; // CCYYMMDD
  AddToMasterFile?: boolean;
}

export interface EMandateResponse {
  ErrorCode: string;
  MandateUrl?: string;
  Errors?: string[];
  Warnings?: string[];
}

export interface EMandatePostback {
  MandateSuccessful: '0' | '1';
  ReasonForDecline?: string;

  AccountRef: string;
  AccountName: string;
  DefaultAmount: string;
  AllowVariableAmounts: 'True' | 'False';
  IsActive: 'True' | 'False';
  IsValid: 'True' | 'False';
  IsFromWebService: 'True' | 'False';
  MandateStatus: string;

  // Company details (if business)
  CompTradingName?: string;
  CompRegName?: string;
  CompRegNo?: string;

  // Personal details
  FirstName: string;
  LastName: string;
  ContactPerson: string;
  Email: string;
  CellNo: string;
  TelephoneNumber?: string;
  IsRSAId: 'True' | 'False';
  IdentityNumber?: string;

  // Address
  PhysicalComplex?: string;
  PhysicalStreetAddress?: string;
  PhysicalSuburb?: string;
  PhysicalCity?: string;
  PhysicalAddressPostcode?: string;

  // Custom fields
  Field1?: string;
  Field2?: string;
  Field3?: string;
  Field4?: string;
  Field5?: string;
  Field6?: string;
  Field7?: string;
  Field8?: string;
  Field9?: string;

  // Notifications
  NotificationEmail?: string;
  NotificationByEmailActive: 'True' | 'False';
  NotificationCellNo?: string;
  NotificationByCellNoActive: 'True' | 'False';

  // Mandate details
  AgreementDate: string;
  DebitDay: string;
  DecemberDebitDay: string;
  DebitOnLastDay: 'True' | 'False';
  MandateReferenceNumber: string;
  NoticeDays: string;
  LuMandatePublicHolidayOptionId: string;
  DoAVS: 'True' | 'False';
  MandateDebitFrequencyId: string;

  // Signatory details
  SignBy_FirstName: string;
  SignBy_LastName: string;
  SignBy_Email: string;
  SignBy_CellNo: string;

  // Bank/Card details
  IsCreditCard: 'True' | 'False';
  BankName?: string;
  BankAccountName?: string;
  BankAccountNo?: string; // Masked (e.g., "321*****7")
  BranchCode?: string;
  BankAccountType?: 'Current' | 'Savings' | 'Transmission';
  CCAccountName?: string;
  CCAccountNo?: string;
  CCType?: string;
  CCExpYYYY?: string;
  CCExpMM?: string;
  CCToken?: string;

  // Result
  IsDeclined: '0' | '1';
  AdditionalClauses?: string;
  MandatePDFLink: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NetCashEMandateService {
  private serviceKey: string;
  private webServiceUrl: string;
  private isTestMode: boolean;

  constructor() {
    this.serviceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/niws/niws_nif.svc';
    this.isTestMode = process.env.NETCASH_TEST_MODE === 'true';

    if (!this.serviceKey) {
      console.warn('NetCash Debit Order Service Key not configured');
    }
  }

  /**
   * Create a new eMandate request
   * Calls the AddMandate synchronous web service
   */
  async createMandate(request: Omit<EMandateRequest, 'ServiceKey'>): Promise<EMandateResponse> {
    try {
      // Add service key
      const fullRequest: EMandateRequest = {
        ...request,
        ServiceKey: this.serviceKey,
      };

      // Validate request
      this.validateRequest(fullRequest);

      // Build SOAP envelope
      const soapEnvelope = this.buildSoapEnvelope(fullRequest);

      // Log request details (without sensitive data)
      console.log('[eMandate] Calling NetCash API:', {
        url: this.webServiceUrl,
        accountReference: fullRequest.AccountReference,
        mandateName: fullRequest.MandateName,
        mandateAmount: fullRequest.MandateAmount,
        isConsumer: fullRequest.IsConsumer,
        debitFrequency: fullRequest.DebitFrequency,
        commencementMonth: fullRequest.CommencementMonth,
        commencementDay: fullRequest.CommencementDay,
        agreementDate: fullRequest.AgreementDate,
        hasBankDetails: !!fullRequest.BankAccountNumber,
        hasServiceKey: !!fullRequest.ServiceKey,
      });

      // Call NetCash API
      // SOAPAction from WSDL: http://tempuri.org/INIWS_NIF/AddMandate
      const response = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/INIWS_NIF/AddMandate',
        },
        body: soapEnvelope,
      });

      // Log response status
      console.log('[eMandate] NetCash API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[eMandate] NetCash API error response:', errorBody.substring(0, 500));
        throw new Error(`NetCash API returned ${response.status}: ${response.statusText}`);
      }

      // Parse SOAP response
      const responseText = await response.text();
      const parsedResponse = await this.parseSoapResponse(responseText);

      return parsedResponse;
    } catch (error) {
      console.error('NetCash eMandate createMandate error:', error);
      throw error;
    }
  }

  /**
   * Validate eMandate request
   */
  private validateRequest(request: EMandateRequest): void {
    const errors: string[] = [];

    // Required fields
    if (!request.ServiceKey) errors.push('ServiceKey is required');
    if (!request.AccountReference) errors.push('AccountReference is required');
    if (request.AccountReference && (request.AccountReference.length < 2 || request.AccountReference.length > 22)) {
      errors.push('AccountReference must be 2-22 characters');
    }
    if (!request.MandateName) errors.push('MandateName is required');
    if (!request.MandateAmount || request.MandateAmount <= 0) errors.push('MandateAmount must be greater than 0');
    if (request.IsConsumer === undefined) errors.push('IsConsumer is required');
    if (!request.FirstName) errors.push('FirstName is required');
    if (!request.Surname) errors.push('Surname is required');
    if (!request.MobileNumber) errors.push('MobileNumber is required');
    if (!request.DebitFrequency) errors.push('DebitFrequency is required');
    if (!request.CommencementMonth || request.CommencementMonth < 1 || request.CommencementMonth > 12) {
      errors.push('CommencementMonth must be between 1-12');
    }
    if (!request.CommencementDay) errors.push('CommencementDay is required');
    if (!request.AgreementDate) errors.push('AgreementDate is required');
    if (!request.AgreementReferenceNumber) errors.push('AgreementReferenceNumber is required');

    // Business fields (required if IsConsumer = false)
    if (!request.IsConsumer) {
      if (!request.TradingName) errors.push('TradingName is required for business accounts');
      if (!request.RegistrationNumber) errors.push('RegistrationNumber is required for business accounts');
      if (!request.RegisteredName) errors.push('RegisteredName is required for business accounts');
    }

    // Bank/Card details validation (all or nothing)
    const bankFields = [
      request.BankDetailType,
      request.BankAccountName,
      request.BankAccountNumber,
      request.BranchCode,
      request.BankAccountType,
    ];
    const providedBankFields = bankFields.filter(f => f !== undefined).length;
    if (providedBankFields > 0 && providedBankFields < 5) {
      errors.push('If providing bank details, all 5 fields (BankDetailType, BankAccountName, BankAccountNumber, BranchCode, BankAccountType) must be provided');
    }

    if (errors.length > 0) {
      throw new Error(`eMandate validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Build SOAP envelope for AddMandate request
   */
  private buildSoapEnvelope(request: EMandateRequest): string {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'utf-8' },
      renderOpts: { pretty: false },
    });

    // WSDL namespace is http://tempuri.org/
    const envelope = {
      'soap:Envelope': {
        $: {
          'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
          'xmlns:tem': 'http://tempuri.org/',
        },
        'soap:Body': {
          'tem:AddMandate': {
            'tem:MethodParameters': this.buildMethodParameters(request),
          },
        },
      },
    };

    return builder.buildObject(envelope);
  }

  /**
   * Build method parameters for AddMandate
   */
  private buildMethodParameters(request: EMandateRequest): any {
    const params: any = {};

    // Required fields
    params['tem:ServiceKey'] = request.ServiceKey;
    params['tem:AccountReference'] = request.AccountReference;
    params['tem:MandateName'] = request.MandateName;
    // NetCash expects amount in cents for batch file, but decimal for synchronous API
    params['tem:MandateAmount'] = request.MandateAmount.toFixed(2);
    params['tem:IsConsumer'] = request.IsConsumer;
    params['tem:FirstName'] = request.FirstName;
    params['tem:Surname'] = request.Surname;
    params['tem:TradingName'] = request.TradingName || '';
    params['tem:RegistrationNumber'] = request.RegistrationNumber || '';
    params['tem:RegisteredName'] = request.RegisteredName || '';
    params['tem:MobileNumber'] = request.MobileNumber;
    params['tem:DebitFrequency'] = request.DebitFrequency;
    params['tem:CommencementMonth'] = request.CommencementMonth;
    params['tem:CommencementDay'] = request.CommencementDay;
    params['tem:AgreementDate'] = request.AgreementDate;
    params['tem:AgreementReferenceNumber'] = request.AgreementReferenceNumber;

    // Optional fields (only include if provided)
    if (request.CancellationNoticePeriod) params['tem:CancellationNoticePeriod'] = request.CancellationNoticePeriod;
    if (request.PublicHolidayOption) params['tem:PublicHolidayOption'] = request.PublicHolidayOption;
    if (request.Notes) params['tem:Notes'] = request.Notes;
    if (request.Field1) params['tem:Field1'] = request.Field1;
    if (request.Field2) params['tem:Field2'] = request.Field2;
    if (request.Field3) params['tem:Field3'] = request.Field3;
    if (request.Field4) params['tem:Field4'] = request.Field4;
    if (request.Field5) params['tem:Field5'] = request.Field5;
    if (request.Field6) params['tem:Field6'] = request.Field6;
    if (request.Field7) params['tem:Field7'] = request.Field7;
    if (request.Field8) params['tem:Field8'] = request.Field8;
    if (request.Field9) params['tem:Field9'] = request.Field9;
    if (request.AllowVariableDebitAmounts !== undefined) params['tem:AllowVariableDebitAmounts'] = request.AllowVariableDebitAmounts;

    // Bank/Card details
    if (request.BankDetailType) params['tem:BankDetailType'] = request.BankDetailType;
    if (request.BankAccountName) params['tem:BankAccountName'] = request.BankAccountName;
    if (request.BankAccountNumber) params['tem:BankAccountNumber'] = request.BankAccountNumber;
    if (request.BranchCode) params['tem:BranchCode'] = request.BranchCode;
    if (request.BankAccountType) {
      // Convert string to numeric code: 1 = Current, 2 = Savings, 3 = Transmission
      const accountTypeMap: Record<string, number> = { 'Current': 1, 'Savings': 2, 'Transmission': 3 };
      params['tem:BankAccountType'] = accountTypeMap[request.BankAccountType] || 1;
    }
    if (request.CreditCardToken) params['tem:CreditCardToken'] = request.CreditCardToken;
    if (request.CreditCardType) params['tem:CreditCardType'] = request.CreditCardType;
    if (request.ExpiryMonth) params['tem:ExpiryMonth'] = request.ExpiryMonth;
    if (request.ExpiryYear) params['tem:ExpiryYear'] = request.ExpiryYear;

    // Additional fields
    if (request.IsIdNumber !== undefined) params['tem:IsIdNumber'] = request.IsIdNumber;
    if (request.Title) params['tem:Title'] = request.Title;
    if (request.EmailAddress) params['tem:EmailAddress'] = request.EmailAddress;
    if (request.PhoneNumber) params['tem:PhoneNumber'] = request.PhoneNumber;
    if (request.DateOfBirth) params['tem:DateOfBirth'] = request.DateOfBirth;
    if (request.DecemberDebitDay) params['tem:DecemberDebitDay'] = request.DecemberDebitDay;
    if (request.DebitMasterfileGroup) params['tem:DebitMasterfileGroup'] = request.DebitMasterfileGroup;
    if (request.PhysicalAddressLine1) params['tem:PhysicalAddressLine1'] = request.PhysicalAddressLine1;
    if (request.PhysicalAddressLine2) params['tem:PhysicalAddressLine2'] = request.PhysicalAddressLine2;
    if (request.PhysicalAddressLine3) params['tem:PhysicalAddressLine3'] = request.PhysicalAddressLine3;
    if (request.PhysicalSuburb) params['tem:PhysicalSuburb'] = request.PhysicalSuburb;
    if (request.PhysicalCity) params['tem:PhysicalCity'] = request.PhysicalCity;
    if (request.PhysicalProvince) params['tem:PhysicalProvince'] = request.PhysicalProvince;
    if (request.PhysicalPostalCode) params['tem:PhysicalPostalCode'] = request.PhysicalPostalCode;
    if (request.MandateActive !== undefined) params['tem:MandateActive'] = request.MandateActive;
    if (request.RequestAVS !== undefined) params['tem:RequestAVS'] = request.RequestAVS;
    if (request.AVSCheckNumber) params['tem:AVSCheckNumber'] = request.AVSCheckNumber;
    if (request.IncludeDebiCheck !== undefined) params['tem:IncludeDebiCheck'] = request.IncludeDebiCheck;
    if (request.DebiCheckMandateTemplateId) params['tem:DebiCheckMandateTemplateId'] = request.DebiCheckMandateTemplateId;
    if (request.DebiCheckCollectionAmount) params['tem:DebiCheckCollectionAmount'] = request.DebiCheckCollectionAmount;
    if (request.DebiCheckFirstCollectionDiffers !== undefined) params['tem:DebiCheckFirstCollectionDiffers'] = request.DebiCheckFirstCollectionDiffers;
    if (request.DebiCheckFirstCollectionAmount) params['tem:DebiCheckFirstCollectionAmount'] = request.DebiCheckFirstCollectionAmount;
    if (request.DebiCheckCollectionDayCode) params['tem:DebiCheckCollectionDayCode'] = request.DebiCheckCollectionDayCode;
    if (request.AddToMasterFile !== undefined) params['tem:AddToMasterFile'] = request.AddToMasterFile;

    return params;
  }

  /**
   * Parse SOAP response from NetCash
   */
  private async parseSoapResponse(xmlResponse: string): Promise<EMandateResponse> {
    try {
      const parsed = await parseStringPromise(xmlResponse);

      // Navigate through SOAP envelope
      const body = parsed['soap:Envelope']['soap:Body'][0];
      const response = body['AddMandateResponse'][0]['AddMandateResult'][0];

      const errorCode = response['ErrorCode']?.[0] || '999';
      const mandateUrl = response['MandateUrl']?.[0];
      const errors = response['Errors']?.[0]?.['StringArray'] || [];
      const warnings = response['Warnings']?.[0]?.['StringArray'] || [];

      return {
        ErrorCode: errorCode,
        MandateUrl: mandateUrl,
        Errors: errors,
        Warnings: warnings,
      };
    } catch (error) {
      console.error('Error parsing SOAP response:', error);
      throw new Error('Failed to parse NetCash response');
    }
  }

  /**
   * Parse postback data from NetCash (form-encoded data)
   */
  static parsePostback(formData: Record<string, string>): EMandatePostback {
    // Runtime validation for required fields
    if (!formData.MandateSuccessful || !formData.AccountRef) {
      console.error('Invalid postback data received:', Object.keys(formData));
      throw new Error('Invalid postback data: missing required fields (MandateSuccessful, AccountRef)');
    }
    return formData as unknown as EMandatePostback;
  }

  /**
   * Helper: Generate account reference from order number
   */
  static generateAccountReference(orderNumber: string): string {
    // NetCash requires 2-22 characters
    // Use order number (e.g., "CTD-2025-001234")
    return orderNumber.substring(0, 22);
  }

  /**
   * Helper: Format date to CCYYMMDD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Helper: Get next debit day (1st of next month)
   */
  static getNextDebitDay(): { month: number; day: string } {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      month: nextMonth.getMonth() + 1,
      day: '01', // First day of month
    };
  }
}
