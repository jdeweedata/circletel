# Story: Extend Zoho MCP with Billing Actions

**Story ID**: ZBI-001-01
**Epic**: Zoho Billing Integration (ZBI-001)
**Created**: September 27, 2025
**Status**: Ready for Development
**Points**: 5 (3 days)
**Assignee**: Full-Stack Developer

## Story Overview

As a **CircleTel developer**, I need to **extend the existing Zoho MCP integration with billing/books actions** so that **the platform can create invoices, track payments, and manage customer billing**.

### Business Value
- Enables automated invoice generation from completed orders
- Provides foundation for customer billing portal
- Reduces manual billing overhead for CircleTel operations

## Context Engineering

### Current Architecture Context
```typescript
// Current MCP integration: lib/zoho-mcp-client.ts
import { ZohoMCPRequest, ZohoMCPResponse } from '@/lib/types/zoho';

class ZohoMCPClient {
  private baseUrl = 'https://circletel-zoho-900485550.zohomcp.com/mcp/message';
  private apiKey = process.env.ZOHO_MCP_API_KEY;

  async execute<T>(request: ZohoMCPRequest): Promise<ZohoMCPResponse<T>> {
    // Current implementation for CRM, Mail, Calendar, Desk, Projects
  }
}
```

### Required Extensions
```typescript
// Target billing types
export interface ZohoInvoice {
  id?: string;
  customerId: string;
  invoiceNumber?: string;
  date: string;
  dueDate: string;
  lineItems: ZohoInvoiceItem[];
  taxAmount?: number;
  totalAmount: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  vatNumber?: string; // South African VAT compliance
}

export interface ZohoInvoiceItem {
  itemId?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number; // VAT rate (15% in South Africa)
}

export interface ZohoPayment {
  id?: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
}
```

### Integration Pattern
```typescript
// Extend existing action types
export type ZohoAction =
  | 'create_lead'      // ✅ Existing
  | 'create_contact'   // ✅ Existing
  | 'create_deal'      // ✅ Existing
  | 'send_email'       // ✅ Existing
  | 'create_event'     // ✅ Existing
  | 'create_ticket'    // ✅ Existing
  | 'create_project'   // ✅ Existing
  | 'create_task'      // ✅ Existing
  | 'get_records'      // ✅ Existing
  | 'update_record'    // ✅ Existing
  | 'search_records'   // ✅ Existing
  // 🆕 Billing actions
  | 'create_invoice'
  | 'get_invoice'
  | 'update_invoice'
  | 'send_invoice'
  | 'get_invoice_status'
  | 'create_payment'
  | 'get_payment_status'
  | 'get_billing_history'
  | 'create_customer_billing';

// Extend app types
export type ZohoApp =
  | 'crm'       // ✅ Existing
  | 'mail'      // ✅ Existing
  | 'calendar'  // ✅ Existing
  | 'desk'      // ✅ Existing
  | 'projects'  // ✅ Existing
  | 'books';    // 🆕 Billing/Books
```

## Technical Implementation

### Step 1: Extend Type Definitions
**File**: `lib/types/zoho.ts`

```typescript
// Add to existing file after line 116
// Zoho Books/Billing Types
export interface ZohoInvoice {
  id?: string;
  customer_id: string;
  invoice_number?: string;
  date: string;
  due_date: string;
  line_items: ZohoInvoiceItem[];
  sub_total?: number;
  tax_total?: number;
  total: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency_code?: 'ZAR'; // South African Rand

  // South African specific fields
  vat_number?: string;
  tax_exemption_id?: string;
  place_of_supply?: string;
}

export interface ZohoInvoiceItem {
  item_id?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number; // 15% VAT in South Africa
}

export interface ZohoCustomerBilling {
  customer_id: string;
  billing_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: 'South Africa';
  };
  currency_code: 'ZAR';
  payment_terms?: number; // Days
  payment_terms_label?: string;
}

export interface ZohoPayment {
  payment_id?: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  date: string;
  payment_mode: string;
  reference_number?: string;
  description?: string;
  status?: 'success' | 'failure' | 'pending';
}
```

### Step 2: Extend MCP Request Types
**File**: `lib/types/zoho.ts` (add to existing ZohoAction type)

```typescript
export type ZohoAction =
  | 'create_lead'
  | 'convert_lead'
  | 'create_contact'
  | 'create_deal'
  | 'send_email'
  | 'create_event'
  | 'create_ticket'
  | 'create_project'
  | 'create_task'
  | 'get_records'
  | 'update_record'
  | 'search_records'
  // Billing actions
  | 'create_invoice'
  | 'get_invoice'
  | 'update_invoice'
  | 'send_invoice'
  | 'get_invoice_status'
  | 'create_payment'
  | 'get_payment_status'
  | 'get_billing_history'
  | 'create_customer_billing'
  | 'get_customer_billing';
```

### Step 3: Test MCP Server Capability
**File**: `lib/zoho-mcp-client.ts` (add test method)

```typescript
// Add to existing ZohoMCPClient class
async testBillingCapability(): Promise<boolean> {
  try {
    const response = await this.execute({
      action: 'get_records',
      app: 'books',
      parameters: { module: 'invoices', per_page: 1 }
    });
    return response.success;
  } catch (error) {
    console.warn('Billing capability not available via MCP:', error);
    return false;
  }
}
```

### Step 4: Create Billing Hook
**File**: `hooks/use-zoho-mcp.ts` (add to existing file)

```typescript
// Add after existing hooks
export function useZohoBilling() {
  const queryClient = useQueryClient();
  const { executeAction, isLoading, error } = useZohoMCP();

  const createInvoice = useMutation({
    mutationFn: (invoice: ZohoInvoice) =>
      executeAction<ZohoInvoice>({
        action: 'create_invoice',
        app: 'books',
        parameters: invoice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoho-invoices'] });
    },
  });

  const getInvoiceStatus = useCallback((invoiceId: string) => {
    return executeAction({
      action: 'get_invoice_status',
      app: 'books',
      parameters: { invoice_id: invoiceId },
    });
  }, [executeAction]);

  const getBillingHistory = useCallback((customerId: string, options?: any) => {
    return executeAction({
      action: 'get_billing_history',
      app: 'books',
      parameters: { customer_id: customerId, ...options },
    });
  }, [executeAction]);

  return {
    createInvoice,
    getInvoiceStatus,
    getBillingHistory,
    isLoading,
    error,
  };
}
```

### Step 5: Create Fallback Direct API Client
**File**: `lib/zoho-books-client.ts` (new file)

```typescript
// Fallback if MCP doesn't support Books
import { ZohoInvoice, ZohoPayment } from '@/lib/types/zoho';

class ZohoBooksClient {
  private baseUrl = 'https://books.zoho.com/api/v3';
  private organizationId = process.env.ZOHO_ORGANIZATION_ID;

  constructor(private accessToken: string) {}

  async createInvoice(invoice: ZohoInvoice): Promise<ZohoInvoice> {
    // Direct API implementation as fallback
    const response = await fetch(
      `${this.baseUrl}/invoices?organization_id=${this.organizationId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create invoice: ${response.statusText}`);
    }

    const data = await response.json();
    return data.invoice;
  }

  // Additional methods as needed
}

export default ZohoBooksClient;
```

## Implementation Steps

1. **Test Current MCP**: Verify if Books app is supported
2. **Extend Types**: Add billing types to existing zoho.ts
3. **Update Hooks**: Add billing hook to existing use-zoho-mcp.ts
4. **Create Fallback**: Direct API client if MCP unsupported
5. **Test Integration**: Validate with sample invoice creation

## Acceptance Criteria

### Functional Requirements
- [ ] MCP client can test billing capability
- [ ] Invoice creation works via MCP or fallback API
- [ ] TypeScript types are properly defined
- [ ] Billing hook follows existing pattern
- [ ] Error handling matches existing MCP client

### Technical Requirements
- [ ] No breaking changes to existing Zoho integration
- [ ] Follows established CircleTel patterns
- [ ] Proper error handling and logging
- [ ] Type safety maintained throughout

### Quality Requirements
- [ ] Unit tests for new types and functions
- [ ] Integration test with Zoho Books API
- [ ] Documentation updated in existing files
- [ ] Performance impact assessed

## Testing Strategy

### Unit Tests
```typescript
// Test new types
describe('ZohoInvoice type', () => {
  it('should validate South African VAT invoice', () => {
    const invoice: ZohoInvoice = {
      customer_id: 'test-customer',
      date: '2025-09-27',
      due_date: '2025-10-27',
      line_items: [{
        name: 'SkyFibre Business 100Mbps',
        quantity: 1,
        rate: 1299,
        amount: 1299,
        tax_percentage: 15
      }],
      total: 1494, // Including 15% VAT
      currency_code: 'ZAR'
    };

    expect(invoice.currency_code).toBe('ZAR');
    expect(invoice.line_items[0].tax_percentage).toBe(15);
  });
});
```

### Integration Tests
```typescript
// Test MCP integration
describe('ZohoBilling MCP', () => {
  it('should create invoice via MCP', async () => {
    const billing = useZohoBilling();
    const result = await billing.createInvoice.mutateAsync(testInvoice);

    expect(result.data?.id).toBeDefined();
    expect(result.data?.status).toBe('draft');
  });
});
```

## Dependencies

### External Dependencies
- **Zoho Books API Access**: Verify API permissions
- **MCP Server Update**: May need CircleTel MCP server update

### Internal Dependencies
- **Environment Variables**: ZOHO_MCP_API_KEY, ZOHO_ORGANIZATION_ID
- **TypeScript Configuration**: Ensure strict mode compatibility

## Risk Mitigation

### Risk: MCP Server Doesn't Support Books
**Probability**: Medium
**Impact**: High
**Mitigation**: Implement direct API fallback client

### Risk: API Rate Limiting
**Probability**: Low
**Impact**: Medium
**Mitigation**: Implement retry logic and caching

## Definition of Done

- [ ] Types extended in lib/types/zoho.ts
- [ ] Billing hook added to hooks/use-zoho-mcp.ts
- [ ] MCP capability test implemented
- [ ] Fallback API client created
- [ ] Unit tests written and passing
- [ ] Integration test with Zoho API successful
- [ ] Code review completed
- [ ] Documentation updated

## Notes

- Maintain backward compatibility with existing Zoho integration
- Follow South African VAT compliance requirements (15% VAT)
- Use existing CircleTel error handling patterns
- Consider rate limiting for Zoho API calls