# Payment Description System

## Overview

The payment description system generates customer-friendly descriptions for NetCash payments that appear on:
- NetCash payment gateway page
- Bank statements
- Transaction history

All descriptions are optimized to fit within **35 characters** for maximum bank compatibility.

## Description Formats

### 1. Payment Method Validation (R1.00 test charge)

**Format**: `CircleTel - Payment Verification`
**Length**: 32 characters
**Example**:
```
Before: CircleTel Test Payment - PAYMENT-METHOD-VALIDATION-1763634865462
After:  CircleTel - Payment Verification
```

**Use Case**: When customers add a new payment method to their dashboard

### 2. Order Payments

**Format**: `{account} {package} {city}`
**Length**: 24-35 characters (truncated if needed)
**Examples**:
```
CT-00123 MTN 100Mbps JHB
CT-99999 Vuma 50Mbps CPT
ORD-00456 MTN 50Mbps DBN
```

**Components**:
- **Account Number**: `CT-YYYY-NNNNN` → `CT-NNNNN` (abbreviated)
- **Package Name**: Abbreviated (removes "Fibre", "Uncapped", "Package", etc.)
- **City**: 3-letter code (JHB, CPT, DBN, PTA, etc.)

**Fallback**: If no data available → `CircleTel - Internet Service`

**Use Case**: When customers complete a new order payment

### 3. Invoice Payments

**Format**: `CircleTel - INV-{number}`
**Length**: 21-28 characters
**Example**:
```
Before: Invoice INV-2025-00045
After:  CircleTel - INV-00045
```

**Use Case**: When customers pay monthly invoices

## Implementation

### Usage in Code

```typescript
import {
  buildPaymentMethodDescription,
  buildOrderDescription,
  buildInvoiceDescription,
  validateDescription
} from '@/lib/payments/description-builder';

// Payment method validation
const desc1 = buildPaymentMethodDescription();
// → "CircleTel - Payment Verification"

// Order payment
const desc2 = buildOrderDescription({
  account_number: 'CT-2025-00123',
  package_name: 'MTN 100Mbps Fibre Uncapped',
  city: 'Johannesburg'
});
// → "CT-00123 MTN 100Mbps JHB"

// Invoice payment
const desc3 = buildInvoiceDescription({
  invoice_number: 'INV-2025-00045'
});
// → "CircleTel - INV-00045"

// Validate any description
const validation = validateDescription(desc2);
console.log(validation.valid);   // true
console.log(validation.length);  // 24
console.log(validation.errors);  // []
```

### Helper Functions

```typescript
// Abbreviate city names
abbreviateCity('Johannesburg')     // → 'JHB'
abbreviateCity('Cape Town')        // → 'CPT'

// Abbreviate package names
abbreviatePackage('MTN 100Mbps Fibre Uncapped')  // → 'MTN 100Mbps'
abbreviatePackage('Vumatel 50Mbps Package')      // → 'Vuma 50Mbps'

// Abbreviate account numbers
abbreviateAccountNumber('CT-2025-00123')  // → 'CT-00123'

// Truncate with ellipsis
truncateDescription('Very long description here', 20)
// → 'Very long descri...'
```

## City Abbreviations

| City | Code | City | Code |
|------|------|------|------|
| Johannesburg | JHB | Cape Town | CPT |
| Durban | DBN | Pretoria | PTA |
| Port Elizabeth | PLZ | Bloemfontein | BFN |
| Midrand | MDR | Sandton | SNT |
| Centurion | CEN | East London | ELS |
| Polokwane | POL | Nelspruit | NEL |
| Kimberley | KIM | Pietermaritzburg | PMB |
| Rustenburg | RUS | George | GRG |

**Fallback**: Unknown cities use first 3 uppercase letters (e.g., "Stellenbosch" → "STE")

## Package Abbreviation Rules

1. Remove filler words: "Fibre", "Package", "Uncapped", "Unlimited"
2. Shorten provider names:
   - "Frogfoot" → "Frog"
   - "Vumatel" → "Vuma"
   - "Openserve" → "Open"
3. Keep speed and essential info (e.g., "100Mbps", "Business")

## Validation Rules

- **Max Length**: 35 characters
- **Invalid Characters**: `<`, `>`, `"`, `'`, `\`
- **Empty**: Not allowed
- **Truncation**: Automatic with ellipsis (`...`) if exceeds limit

## Files Modified

1. `lib/payments/description-builder.ts` - Core service (NEW)
2. `app/api/payments/test-initiate/route.ts` - Payment validation endpoint
3. `app/api/payment/netcash/initiate/route.ts` - Order payment endpoint
4. `lib/payments/providers/netcash/netcash-provider.ts` - NetCash provider
5. `lib/payments/netcash-service.ts` - Legacy invoice payments

## Testing

Run the test suite:
```bash
npx tsx scripts/test-payment-descriptions.ts
```

**Test Coverage**:
- ✓ Payment method validation
- ✓ Standard order payments
- ✓ Long package names (truncation)
- ✓ Invoice payments
- ✓ City abbreviations (20 cities)
- ✓ Package abbreviations (5 providers)
- ✓ Account/order number abbreviations
- ✓ Edge cases (missing data)
- ✓ Validation (length, characters, empty)

## Benefits

### Before
```
Description: CircleTel Test Payment - PAYMENT-METHOD-VALIDATION-1763634865462
Bank Statement: CIRCLETEL TEST PAYMENT - PAYMENT-METHOD-V...
Problem: Technical jargon, truncated, meaningless to customers
```

### After
```
Description: CircleTel - Payment Verification
Bank Statement: CIRCLETEL - PAYMENT VERIFICATION
Benefit: Clear, professional, recognizable
```

```
Description: CircleTel Order ORD-2025-00123
Bank Statement: CIRCLETEL ORDER ORD-2025-00123
Problem: No package information
```

```
Description: CT-00123 MTN 100Mbps JHB
Bank Statement: CT-00123 MTN 100MBPS JHB
Benefit: Shows account, service, and location
```

## Customer Support Benefits

1. **Easy to identify**: Customers can quickly find CircleTel charges
2. **Service clarity**: Shows what they paid for (package name)
3. **Account tracking**: Includes account number for reference
4. **Location context**: City code helps multi-property customers
5. **Professional**: Consistent branding across all transactions

## Future Enhancements

- [ ] Add more city abbreviations as needed
- [ ] Support international currencies
- [ ] Add custom descriptions for B2B contracts
- [ ] Implement description templates for marketing campaigns
- [ ] Add analytics tracking for payment gateway abandonment

---

**Version**: 1.0
**Updated**: 2025-01-20
**Maintainer**: Development Team
