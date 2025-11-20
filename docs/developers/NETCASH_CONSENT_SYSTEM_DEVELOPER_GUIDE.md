# NetCash Consent System - Developer Guide

**Version:** 1.0
**Last Updated:** 2025-01-20
**Audience:** Developers, Technical Leads

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Components](#components)
3. [API Integration](#api-integration)
4. [Database Schema](#database-schema)
5. [Implementation Examples](#implementation-examples)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  - PaymentConsentCheckboxes Component                  │
│  - PaymentDisclaimerCard Component                     │
│  - Form Integration (4 forms)                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Service Layer                           │
│  - consent-logger.ts                                    │
│  - policy-versions.ts                                   │
│  - validateConsents()                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer                              │
│  - /api/payments/initiate                              │
│  - /api/payment/netcash/initiate                       │
│  - /api/quotes/business/create                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Database Layer                           │
│  - payment_consents table                              │
│  - RLS policies                                        │
│  - Indexes for performance                             │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend:** React 18, Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, TypeScript
- **Database:** Supabase (PostgreSQL)
- **Validation:** Zod (via policy-versions.ts)
- **UI Components:** shadcn/ui, lucide-react

## Components

### 1. PaymentConsentCheckboxes

**Location:** `components/payments/PaymentConsentCheckboxes.tsx`

**Purpose:** Reusable consent checkbox component supporting both B2C and B2B flows

**Props:**
```typescript
interface PaymentConsentCheckboxesProps {
  consents: PaymentConsents | B2BConsents;
  onConsentChange: (consents: PaymentConsents | B2BConsents) => void;
  showRecurringPayment?: boolean;
  showMarketing?: boolean;
  variant?: 'consumer' | 'b2b';
  errors?: string[];
}
```

**Types:**
```typescript
export interface PaymentConsents {
  terms: boolean;
  privacy: boolean;
  paymentTerms: boolean;
  refundPolicy: boolean;
  recurringPayment?: boolean;
  marketing?: boolean;
}

export interface B2BConsents extends PaymentConsents {
  dataProcessing: boolean;
  thirdPartyDisclosure: boolean;
  businessVerification: boolean;
}
```

**Usage Example:**
```typescript
import { PaymentConsentCheckboxes, type PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';

const [consents, setConsents] = useState<PaymentConsents>({
  terms: false,
  privacy: false,
  paymentTerms: false,
  refundPolicy: false,
  recurringPayment: false,
  marketing: false,
});

const [errors, setErrors] = useState<string[]>([]);

<PaymentConsentCheckboxes
  consents={consents}
  onConsentChange={setConsents}
  showRecurringPayment={true}
  showMarketing={true}
  errors={errors}
/>
```

**For B2B Flows:**
```typescript
import { PaymentConsentCheckboxes, type B2BConsents } from '@/components/payments/PaymentConsentCheckboxes';

const [consents, setConsents] = useState<B2BConsents>({
  terms: false,
  privacy: false,
  paymentTerms: false,
  refundPolicy: false,
  dataProcessing: false,
  thirdPartyDisclosure: false,
  businessVerification: false,
  marketing: false,
});

<PaymentConsentCheckboxes
  consents={consents}
  onConsentChange={setConsents}
  variant="b2b"
  showMarketing={true}
  errors={errors}
/>
```

### 2. PaymentDisclaimerCard

**Location:** `components/payments/PaymentDisclaimerCard.tsx`

**Purpose:** Displays NetCash PCI DSS security information

**Props:**
```typescript
interface PaymentDisclaimerCardProps {
  variant?: 'default' | 'compact';
  showRefundPolicy?: boolean;
}
```

**Usage:**
```typescript
import { PaymentDisclaimerCard } from '@/components/payments/PaymentDisclaimerCard';

// Compact variant for sidebars
<PaymentDisclaimerCard variant="compact" />

// Full variant for dedicated sections
<PaymentDisclaimerCard variant="default" showRefundPolicy={true} />
```

### 3. Policy Version Management

**Location:** `lib/constants/policy-versions.ts`

**Purpose:** Centralized policy version tracking

**Key Exports:**
```typescript
// Current policy versions (update when policies change)
export const POLICY_VERSIONS = {
  TERMS: '2025-01-20',
  PRIVACY: '2025-01-20',
  PAYMENT_TERMS: '2025-01-20',
  REFUND_POLICY: '2025-01-20',
} as const;

// Policy URLs
export const POLICY_URLS = {
  TERMS: '/terms',
  PRIVACY: '/privacy-policy',
  PAYMENT_TERMS: '/payment-terms',
  REFUND_POLICY: '/refund-policy',
} as const;

// Helper functions
export function getCurrentPolicyVersions(): PolicyVersions;
export function validateConsents(consents: Partial<PolicyConsent>): {
  valid: boolean;
  errors: string[];
};
```

**Updating Policy Versions:**

When you update a policy page, you MUST update the version:

```typescript
// Before (old version)
export const POLICY_VERSIONS = {
  TERMS: '2025-01-20',
  // ...
}

// After (new version - example)
export const POLICY_VERSIONS = {
  TERMS: '2025-02-15',  // Updated
  // ...
}
```

## API Integration

### 1. Consent Logger Service

**Location:** `lib/payments/consent-logger.ts`

**Main Function:**
```typescript
export async function logPaymentConsents(
  request: ConsentLogRequest
): Promise<{ success: boolean; consent_id?: string; error?: string }>;
```

**Request Type:**
```typescript
export interface ConsentLogRequest {
  // Transaction References (at least one required)
  payment_transaction_id?: string;
  order_id?: string;
  quote_id?: string;

  // Customer Info (required)
  customer_email: string;
  customer_id?: string;

  // Consents (required)
  consents: PaymentConsents | B2BConsents;

  // Audit Trail (optional but recommended)
  ip_address?: string;
  user_agent?: string;

  // Metadata
  consent_type?: 'payment' | 'quote' | 'subscription';
}
```

**Helper Functions:**
```typescript
// Extract IP from request
export function extractIpAddress(request: Request): string | undefined;

// Extract User-Agent from request
export function extractUserAgent(request: Request): string | undefined;

// Get customer consent history
export async function getCustomerConsents(
  customerEmail: string,
  limit?: number
): Promise<{ success: boolean; consents?: any[]; error?: string }>;

// Get consent for specific transaction
export async function getTransactionConsent(
  transactionId: string
): Promise<{ success: boolean; consent?: any; error?: string }>;
```

### 2. Payment API Integration

**Example: Payment Initiation**

```typescript
import { logPaymentConsents, extractIpAddress, extractUserAgent } from '@/lib/payments/consent-logger';
import type { PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderId, consents } = body;

  // ... payment initiation logic ...

  // Log consents if provided
  if (consents) {
    const consentLog = await logPaymentConsents({
      payment_transaction_id: transaction.id,
      order_id: orderId,
      customer_email: customerEmail,
      customer_id: customerId,
      consents: consents as PaymentConsents,
      ip_address: extractIpAddress(request),
      user_agent: extractUserAgent(request),
      consent_type: 'payment'
    });

    if (!consentLog.success) {
      console.error('Failed to log payment consents:', consentLog.error);
      // Don't fail the payment if consent logging fails
    }
  }

  return NextResponse.json({ success: true, ... });
}
```

**Example: Business Quote Creation**

```typescript
import { logPaymentConsents, extractIpAddress, extractUserAgent } from '@/lib/payments/consent-logger';
import type { B2BConsents } from '@/components/payments/PaymentConsentCheckboxes';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { consents, ...quoteRequest } = body;

  const quote = await createBusinessQuote(quoteRequest);

  // Log B2B consents
  if (consents && quote.id) {
    await logPaymentConsents({
      quote_id: quote.id,
      customer_email: quoteRequest.contact_email,
      consents: consents as B2BConsents,
      ip_address: extractIpAddress(request),
      user_agent: extractUserAgent(request),
      consent_type: 'quote'
    });
  }

  return NextResponse.json({ success: true, quote });
}
```

## Database Schema

### payment_consents Table

**Location:** `supabase/migrations/20250120000001_create_payment_consents.sql`

**Schema:**
```sql
CREATE TABLE payment_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction References
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES business_quotes(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Policy Versions
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  payment_terms_version TEXT NOT NULL,
  refund_policy_version TEXT NOT NULL,

  -- Consent Flags
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  payment_terms_accepted BOOLEAN NOT NULL DEFAULT false,
  refund_policy_acknowledged BOOLEAN NOT NULL DEFAULT false,
  recurring_payment_authorized BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,

  -- B2B-specific Consents
  data_processing_consent BOOLEAN DEFAULT false,
  third_party_disclosure_consent BOOLEAN DEFAULT false,
  business_verification_consent BOOLEAN DEFAULT false,

  -- Audit Trail
  ip_address TEXT,
  user_agent TEXT,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  consent_type TEXT DEFAULT 'payment',
  additional_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_payment_consents_transaction ON payment_consents(payment_transaction_id);
CREATE INDEX idx_payment_consents_order ON payment_consents(order_id);
CREATE INDEX idx_payment_consents_quote ON payment_consents(quote_id);
CREATE INDEX idx_payment_consents_email ON payment_consents(customer_email);
CREATE INDEX idx_payment_consents_customer ON payment_consents(customer_id);
CREATE INDEX idx_payment_consents_timestamp ON payment_consents(consent_timestamp);
CREATE INDEX idx_payment_consents_type ON payment_consents(consent_type);
```

**RLS Policies:**

1. **Customers can view own consents:**
```sql
CREATE POLICY "Customers can view own consents" ON payment_consents
  FOR SELECT
  USING (
    customer_email = auth.jwt() ->> 'email'
    OR customer_id = auth.uid()
  );
```

2. **Service role can insert:**
```sql
CREATE POLICY "Service role can insert consents" ON payment_consents
  FOR INSERT
  WITH CHECK (true);
```

3. **Admin users can view all:**
```sql
CREATE POLICY "Admin users can view all consents" ON payment_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
      AND admin_users.is_active = true
    )
  );
```

## Implementation Examples

### Full Payment Form Integration

**Step 1: Import Required Components**
```typescript
import { PaymentConsentCheckboxes, type PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { PaymentDisclaimerCard } from '@/components/payments/PaymentDisclaimerCard';
import { validateConsents } from '@/lib/constants/policy-versions';
```

**Step 2: Add State Management**
```typescript
const [formData, setFormData] = useState({
  // ... other form fields ...
  consents: {
    terms: false,
    privacy: false,
    paymentTerms: false,
    refundPolicy: false,
    recurringPayment: false,
    marketing: false,
  } as PaymentConsents,
});

const [consentErrors, setConsentErrors] = useState<string[]>([]);
```

**Step 3: Add Consent Change Handler**
```typescript
const handleConsentChange = (consents: PaymentConsents) => {
  setFormData((prev) => ({ ...prev, consents }));
  if (consentErrors.length > 0) {
    setConsentErrors([]);
  }
};
```

**Step 4: Update Validation**
```typescript
const validateForm = (): boolean => {
  // ... validate other fields ...

  // Validate consents
  const consentValidation = validateConsents(formData.consents);
  setConsentErrors(consentValidation.errors);

  return formFieldsValid && consentValidation.valid;
};
```

**Step 5: Add UI Components**
```typescript
<form onSubmit={handleSubmit}>
  {/* ... payment form fields ... */}

  {/* Payment Security Disclaimer */}
  <div className="mb-6">
    <PaymentDisclaimerCard variant="compact" />
  </div>

  {/* Legal Consents */}
  <div className="mb-6">
    <PaymentConsentCheckboxes
      consents={formData.consents}
      onConsentChange={handleConsentChange}
      showRecurringPayment={true}
      showMarketing={true}
      errors={consentErrors}
    />
  </div>

  <Button type="submit">Submit Payment</Button>
</form>
```

**Step 6: Send Consents to API**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: orderId,
      consents: formData.consents
    })
  });

  // Handle response...
};
```

## Testing

### 1. Automated Tests

**Test Script:** `scripts/test-consent-system.js`

**Run Tests:**
```bash
node scripts/test-consent-system.js
```

**What it tests:**
- ✅ Policy pages are accessible
- ✅ Consent components exist
- ✅ Forms are properly integrated
- ✅ Database migration is applied
- ✅ B2B variant is configured

### 2. Manual Testing Checklist

**B2C Payment Flow:**
1. [ ] Navigate to payment form
2. [ ] Verify consent checkboxes appear
3. [ ] Click policy links - verify they open in new tabs
4. [ ] Try submitting without consents - verify validation errors
5. [ ] Accept all required consents
6. [ ] Submit form - verify payment proceeds
7. [ ] Check database - verify consent record was created

**B2B Quote Flow:**
1. [ ] Navigate to business quote request
2. [ ] Verify 3 additional B2B checkboxes appear
3. [ ] Try submitting without B2B consents - verify validation
4. [ ] Accept all consents
5. [ ] Submit quote - verify quote is created
6. [ ] Check database - verify consent record includes B2B fields

### 3. Database Verification

**Check Recent Consents:**
```sql
SELECT
  id,
  customer_email,
  consent_type,
  terms_accepted,
  privacy_accepted,
  payment_terms_accepted,
  data_processing_consent,
  consent_timestamp,
  ip_address
FROM payment_consents
ORDER BY consent_timestamp DESC
LIMIT 10;
```

**Check B2B Consents:**
```sql
SELECT
  customer_email,
  data_processing_consent,
  third_party_disclosure_consent,
  business_verification_consent,
  consent_timestamp
FROM payment_consents
WHERE data_processing_consent = true
ORDER BY consent_timestamp DESC;
```

## Deployment

### 1. Environment Variables

Ensure these are set:
```env
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 2. Database Migration

**Apply Migration:**
```bash
# Via Supabase CLI
npx supabase db push

# Or manually via Supabase SQL Editor
# Run: supabase/migrations/20250120000001_create_payment_consents.sql
```

**Verify Migration:**
```sql
SELECT * FROM payment_consents LIMIT 1;
```

### 3. Deployment Checklist

- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Policy pages are accessible
- [ ] Forms are rendering correctly
- [ ] Consent logging is working
- [ ] RLS policies are active
- [ ] Indexes are created

### 4. Rollback Plan

If issues occur:

1. **Disable Consent Validation (Temporary):**
   - Comment out consent validation in forms
   - Allow payments to proceed without consents
   - Log warning for missing consents

2. **Rollback Database (If Necessary):**
   ```sql
   DROP TABLE IF EXISTS payment_consents CASCADE;
   ```

3. **Revert Code:**
   ```bash
   git revert <commit-hash>
   git push
   ```

## Troubleshooting

### Issue: Consents Not Being Logged

**Symptoms:**
- Payments succeed but no consent records in database
- Console errors about consent logging

**Diagnosis:**
```typescript
// Check API logs
console.log('Consent log result:', consentLog);

// Check Supabase logs
// Go to Supabase Dashboard > Logs > API Logs
```

**Solutions:**
1. Verify service role key is configured
2. Check RLS policies allow insertion
3. Verify consent data structure matches interface
4. Check for console errors in browser

### Issue: Validation Not Working

**Symptoms:**
- Form submits without required consents
- No validation errors displayed

**Diagnosis:**
```typescript
// Add debug logging
const consentValidation = validateConsents(formData.consents);
console.log('Validation result:', consentValidation);
```

**Solutions:**
1. Verify `validateConsents()` is being called
2. Check consent state is being updated
3. Verify errors are being set in state
4. Check error display component is rendered

### Issue: B2B Checkboxes Not Appearing

**Symptoms:**
- Only standard consents show for business customers
- Missing data processing, third-party, business verification

**Diagnosis:**
```typescript
// Check variant prop
console.log('Consent variant:', variant);
console.log('Is B2B:', variant === 'b2b');
```

**Solutions:**
1. Verify `variant="b2b"` prop is set
2. Check B2BConsents type is used
3. Verify component is importing correctly

## Best Practices

### 1. Always Log Consents

**Do:**
```typescript
if (consents) {
  await logPaymentConsents({ ... });
}
```

**Don't:**
```typescript
// Skipping consent logging
// This violates compliance requirements!
```

### 2. Never Fail Payments for Consent Logging Errors

**Do:**
```typescript
if (!consentLog.success) {
  console.error('Failed to log consents:', consentLog.error);
  // Continue with payment - don't fail customer transaction
}
```

**Don't:**
```typescript
if (!consentLog.success) {
  throw new Error('Consent logging failed');
  // This would prevent legitimate payments!
}
```

### 3. Always Extract Audit Trail

**Do:**
```typescript
await logPaymentConsents({
  // ...
  ip_address: extractIpAddress(request),
  user_agent: extractUserAgent(request),
});
```

**Don't:**
```typescript
await logPaymentConsents({
  // Missing IP and User-Agent
  // Reduces audit trail quality
});
```

### 4. Keep Policy Versions Updated

**Do:**
```typescript
// When updating policy
export const POLICY_VERSIONS = {
  TERMS: '2025-02-15',  // New version
  // ...
}
```

**Don't:**
```typescript
// Forgetting to update version after policy change
// This creates incorrect audit trail
```

## Performance Considerations

### 1. Consent Logging is Async

Consent logging happens after payment initiation:
- Payment success is not blocked by consent logging
- Consent logging failures are logged but don't fail payment
- This ensures customer experience is not impacted

### 2. Database Indexes

All key fields are indexed for performance:
- Transaction ID lookups are fast
- Customer email searches are optimized
- Date range queries are efficient

### 3. RLS Policy Impact

RLS policies add minimal overhead:
- Indexes support RLS policy conditions
- Customer views only query their own data
- Admin views use efficient email lookup

## Code Style & Conventions

### TypeScript Types

Always use proper types:
```typescript
// Good
const consents: PaymentConsents = { ... };

// Bad
const consents: any = { ... };
```

### Error Handling

Always catch and log errors:
```typescript
try {
  const result = await logPaymentConsents({ ... });
  if (!result.success) {
    console.error('Consent logging failed:', result.error);
  }
} catch (error) {
  console.error('Exception in consent logging:', error);
}
```

### Comments

Add context for future developers:
```typescript
// Log consents if provided (optional but recommended for compliance)
if (consents) {
  await logPaymentConsents({ ... });
}
```

## Additional Resources

- **Legal Compliance Guide:** `/docs/legal/NETCASH_LEGAL_COMPLIANCE.md`
- **Admin Guide:** `/docs/admin/NETCASH_CONSENT_SYSTEM_ADMIN_GUIDE.md`
- **POPIA Guidelines:** https://popia.co.za/
- **NetCash Documentation:** https://netcash.co.za/developers/

## Support

For technical questions or issues:
1. Check this developer guide
2. Review code comments in relevant files
3. Check Supabase logs for database errors
4. Consult with CircleTel technical lead

---

**Maintained By:** CircleTel Development Team
**Last Updated:** 2025-01-20
**Version:** 1.0
