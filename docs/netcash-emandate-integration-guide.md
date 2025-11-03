# NetCash eMandate Integration - Implementation Guide

## Task 4.3: NetCash eMandate Service (8 story points, HIGH RISK)

### Overview
The NetCash eMandate integration uses a batch file upload system with SOAP web services. Unlike typical REST APIs, it processes batch files containing multiple mandate requests.

## API Architecture

### Web Service Details
- **URL**: `https://ws.netcash.co.za/niws/niws_nif.svc`
- **Method**: `BatchFileUpload`
- **Service Key**: `NETCASH_EMANDATE_KEY` (from environment)
- **Format**: Tab-delimited text file with specific record structure

### File Structure (Required)
Every upload file must contain:
1. **H** - Header record (file purpose and metadata)
2. **K** - Key record (defines field structure)
3. **T** - Transaction records (one per mandate)
4. **F** - Footer record (file completion indicator)

## Implementation Plan for CircleTel

### 1. Extend Existing NetCash Service

```typescript
// lib/payments/netcash-service.ts (extend existing)
export class NetCashEMandateService {
  private serviceKey: string;
  private baseUrl: string;
  private isvKey: string = '24ade73c-98cf-47b3-99be-cc7b867b3080';

  constructor() {
    this.serviceKey = process.env.NETCASH_EMANDATE_KEY!;
    this.baseUrl = 'https://ws.netcash.co.za/niws/niws_nif.svc';
  }
}
```

### 2. Create Mandate Method

```typescript
async createMandate(mandateData: MandateRequest): Promise<MandateResponse> {
  // 1. Build batch file content
  const fileContent = this.buildMandateFile([mandateData]);
  
  // 2. Upload to NetCash
  const response = await this.uploadBatchFile(fileContent);
  
  // 3. Parse response for file token
  const fileToken = this.extractFileToken(response);
  
  // 4. Generate approval URL for customer
  const approvalUrl = `https://netcash.co.za/emandate/approve/${fileToken}`;
  
  return {
    mandate_id: mandateData.accountReference,
    file_token: fileToken,
    approval_url: approvalUrl,
    status: 'pending'
  };
}
```

### 3. Batch File Builder

```typescript
private buildMandateFile(mandates: MandateRequest[]): string {
  const batchName = `CTMANDATE_${Date.now()}`;
  const actionDate = new Date().toISOString().slice(0,10).replace(/-/g, '');
  
  // Header Record (H)
  const header = `H\t${this.serviceKey}\t1\tMandates\t${batchName}\t${actionDate}\t${this.isvKey}`;
  
  // Key Record (K) - Only required fields for CircleTel
  const key = 'K\t101\t102\t110\t113\t114\t131\t132\t133\t134\t135\t136\t161\t202\t530\t531\t532\t533\t534\t535\t540';
  
  // Transaction Records (T) - One per mandate
  const transactions = mandates.map(mandate => 
    this.buildTransactionRecord(mandate)
  ).join('\n');
  
  // Footer Record (F)
  const footer = `F\t${mandates.length}\t${this.calculateTotalAmount(mandates)}\t9999`;
  
  return [header, key, transactions, footer].join('\n');
}
```

### 4. Transaction Record Builder

```typescript
private buildTransactionRecord(mandate: MandateRequest): string {
  const fields = {
    // 101: Account reference (mandate reference)
    101: mandate.accountReference,
    
    // 102: Mandate name (customer readable name)
    102: mandate.displayName || `CircleTel Mandate - ${mandate.customerName}`,
    
    // 110: Is Consumer (1 = Individual, 0 = Company)
    110: mandate.customerType === 'individual' ? '1' : '0',
    
    // 113: Surname
    113: mandate.surname || mandate.customerName.split(' ').pop(),
    
    // 114: First name
    114: mandate.firstName || mandate.customerName.split(' ')[0],
    
    // 131: Mandate type (1 = Bank account)
    131: '1',
    
    // 132: Bank account name (customer's bank name)
    132: mandate.bankName,
    
    // 133: Bank account type (1 = Current, 2 = Savings)
    133: mandate.accountType === 'savings' ? '2' : '1',
    
    // 134: Branch code (6 digits, zero-padded)
    134: mandate.branchCode.padStart(6, '0'),
    
    // 135: Filler (always 0 for bank accounts)
    135: '0',
    
    // 136: Bank account number
    136: mandate.accountNumber,
    
    // 161: Default mandate amount (in cents, for CircleTel monthly billing)
    161: (mandate.maximumAmount * 100).toString(),
    
    // 202: Mobile number
    202: mandate.mobileNumber.replace(/[^0-9]/g, ''),
    
    // 530: Debit frequency (1 = Monthly for CircleTel)
    530: '1',
    
    // 531: Commencement month (MM)
    531: mandate.startDate.slice(5, 7),
    
    // 532: Commencement day (billing date - CircleTel supports 1, 5, 25, 30)
    532: mandate.billingDate.toString(),
    
    // 533: December debit day (same as billing date)
    533: mandate.billingDate.toString(),
    
    // 534: Agreement date (YYYYMMDD)
    534: mandate.startDate,
    
    // 535: Agreement reference number
    535: mandate.agreementReference || mandate.accountReference,
    
    // 540: Send mandate (1 = Auto-send for signature)
    540: '1'
  };
  
  // Build tab-delimited transaction record in key order
  const keyOrder = [101, 102, 110, 113, 114, 131, 132, 133, 134, 135, 136, 161, 202, 530, 531, 532, 533, 534, 535, 540];
  return 'T\t' + keyOrder.map(key => fields[key] || '').join('\t');
}
```

### 5. SOAP Web Service Integration

```typescript
private async uploadBatchFile(fileContent: string): Promise<string> {
  // NetCash uses SOAP, we need a SOAP client for Node.js
  // Using 'soap' npm package or fetch with XML payload
  const soap = require('soap');
  
  const wsdlUrl = 'https://ws.netcash.co.za/niws/niws_nif.svc?wsdl';
  const client = await soap.createClientAsync(wsdlUrl);
  
  try {
    const response = await client.BatchFileUploadAsync({
      ServiceKey: this.serviceKey,
      File: fileContent
    });
    
    return response[0]; // Returns file token if successful
  } catch (error) {
    throw new Error(`NetCash upload failed: ${error.message}`);
  }
}
```

### 6. Webhook Handler for Status Updates

```typescript
// New webhook endpoint: app/api/webhooks/netcash/emandate/route.ts
async handleMandateWebhook(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('x-netcash-signature');
  const payload = await request.text();
  
  // Verify webhook signature (similar to existing NetCash pattern)
  if (!verifyNetcashSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Parse CSV/Tab-delimited webhook payload
  const records = parseNetcashWebhook(payload);
  
  for (const record of records) {
    if (record.type === 'mandate_status') {
      await this.updateMandateStatus(record.reference, record.status, record.details);
    }
  }
  
  return NextResponse.json({ received: true });
}

private async updateMandateStatus(accountReference: string, status: string, details: any) {
  const supabase = await createClient();
  
  // Update customer_payment_methods table
  await supabase
    .from('customer_payment_methods')
    .update({ 
      mandate_status: status,
      mandate_response: details,
      updated_at: new Date().toISOString()
    })
    .eq('display_name', `NetCash Mandate - ${accountReference}`);
  
  // Send notification to customer
  if (status === 'active') {
    await this notificationService.sendMandateActiveNotification(accountReference);
  } else if (status === 'cancelled') {
    await this.notificationService.sendMandateCancelledNotification(accountReference);
  }
}
```

### 7. Database Schema Updates

```sql
-- Extend customer_payment_methods table for eMandate
ALTER TABLE customer_payment_methods ADD COLUMN IF NOT EXISTS 
  mandate_id TEXT,
  mandate_status TEXT DEFAULT 'pending' CHECK (mandate_status IN ('pending', 'active', 'cancelled', 'expired')),
  mandate_response JSONB,
  file_token TEXT,
  approval_url TEXT,
  maximum_debit_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
```

### 8. API Endpoints

```typescript
// POST /api/dashboard/payment-methods/emandate/request
async requestMandate(request: NextRequest) {
  const { bankName, accountType, branchCode, accountNumber, maximumAmount, billingDate } = await request.json();
  
  const customerId = await getCurrentCustomerId();
  const accountReference = `CT-${customerId}-${Date.now()}`;
  
  const mandateResponse = await this.netcashService.createMandate({
    accountReference,
    customerName: 'Customer Name', // From customers table
    bankName,
    accountType: accountType === 'savings' ? 'savings' : 'current',
    branchCode,
    accountNumber,
    maximumAmount,
    billingDate,
    startDate: new Date().toISOString().slice(0,10),
    mobileNumber: '0721234567', // From customers table
    customerType: 'individual'
  });
  
  // Store payment method with pending status
  await this.insertPaymentMethodWithMandate(customerId, mandateResponse);
  
  return NextResponse.json({
    mandate_id: mandateResponse.mandate_id,
    approval_url: mandateResponse.approval_url,
    status: mandateResponse.status
  });
}

// POST /api/admin/mandates/process-debit-order
async processDebitOrder(request: NextRequest) {
  const { invoice_id, amount, customer_id, payment_method_id } = await request.json();
  
  // Create debit order batch file with single transaction
  const debitResponse = await this.netcashService.processDebitOrder({
    accountReference: payment_method_id,
    amount: amount * 100, // Convert to cents
    invoice_id
  });
  
  // Record transaction attempt
  await this.recordPaymentTransaction({
    invoice_id,
    customer_id,
    payment_method_id,
    amount,
    status: 'pending',
    netcash_reference: debitResponse.file_token
  });
  
  return NextResponse.json({
    transaction_id: debitResponse.file_token,
    status: 'pending'
  });
}
```

### 9. Environment Variables Required

```env
# Add to .env.local
NETCASH_EMANDATE_KEY=your-emandate-service-key-here
NETCASH_WEBHOOK_SECRET=your-webhook-secret-here
```

### 10. Testing Strategy

```typescript
// __tests__/netcash-emandate.test.ts
describe('NetCash eMandate Service', () => {
  test('mandate file format', () => {
    const mandate = createTestMandate();
    const fileContent = service.buildMandateFile([mandate]);
    
    // Verify file structure
    expect(fileContent).toStartWith('H\t');
    expect(fileContent).toContain('\tK\t');
    expect(fileContent).toContain('\tT\t');
    expect(fileContent).toEndWith('\tF\t');
  });
  
  test('SOAP upload integration', async () => {
    // Mock SOAP client for testing
    const response = await service.createMandate(mockMandateData);
    expect(response.approval_url).toMatch(/netcash\.co\.za\/emandate\/approve/);
  });
  
  test('debit order processing', async () => {
    const response = await service.processDebitOrder({
      amount: 79900, // R799.00 in cents
      accountReference: 'CT-12345-001'
    });
    expect(response).toHaveProperty('file_token');
  });
});
```

### 11. Error Handling & Retry Logic

```typescript
private async uploadWithRetry(fileContent: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.uploadBatchFile(fileContent);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Upload failed after retries');
}
```

## Implementation Considerations

### 1. Security
- All bank details are encrypted in database
- Masked display: `${bankName} ***${lastFour}`
- Webhook signature verification mandatory
- No sensitive data logged

### 2. Compliance
- South African banking regulations
- PCI DSS considerations (though tokens used for cards)
- Customer consent required (approval URL)

### 3. User Experience
- Customer receives approval URL via SMS/Email
- Real-time status updates via webhook
- Clear error messages for failed validations

### 4. Integration Points
- Extends existing `lib/payments/netcash-service.ts`
- Integrates with customer dashboard payment methods
- Works with invoice generation (Task 2.x)
- Connected to debit order cron job (Task 4.4)

### 5. Monitoring
- Log all upload attempts with tokens
- Monitor webhook delivery success rates
- Track mandate approval conversion rates
- Alert on batch processing failures

## Development Checklist

- [ ] Extend existing NetCash service with eMandate methods
- [ ] Implement batch file builder with correct NetCash format
- [ ] Add SOAP client for batch file uploads
- [ ] Create webhook handler for mandate status updates
- [ ] Add eMandate columns to customer_payment_methods table
- [ ] Build API endpoints for mandate request and debit processing
- [ ] Implement comprehensive error handling and retry logic
- [ ] Add unit tests for file format and integration tests
- [ ] Configure environment variables and webhook URL
- [ ] Test with NetCash sandbox environment

## Risk Mitigation

1. **External API Dependency**: Implement proper retry logic and fallback mechanisms
2. **Batch File Format**: Rigorous testing of file structure and validation
3. **SOAP Complexity**: Use proven SOAP library and mock tests
4. **Webhook Reliability**: Queue failed webhooks for retry
5. **Security**: Bank details never stored in plaintext, masked in UI

## Success Metrics

- Mandate approval rate >85%
- Upload success rate >95%
- Webhook delivery >98%
- Average mandate processing time <5 minutes
- Zero security breaches of bank data

This implementation provides a robust, secure integration with NetCash eMandate while maintaining CircleTel's existing payment architecture patterns.
