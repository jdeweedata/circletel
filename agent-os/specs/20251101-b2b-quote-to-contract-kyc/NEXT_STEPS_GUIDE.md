# B2B Quote-to-Contract - Next Steps Implementation Guide

**Generated**: 2025-11-01  
**Status**: 66% Complete (40/61 SP) → 100% Complete (61/61 SP)  
**Remaining Work**: 21 story points (~13 hours over 2 days)

---

## ✅ COMPLETED (Just Now!)

### Task Group 10: Payment Webhook - UNBLOCKED! 🎉

**Files Created**:
- ✅ `app/api/payments/webhook/route.ts` (300+ lines)
  - NetCash HMAC-SHA256 signature verification
  - Idempotency via payment_webhooks table
  - Auto-creates consumer_orders on payment success
  - Triggers RICA submission if KYC approved
  - Handles all payment statuses (completed, failed, pending)
  
- ✅ `supabase/migrations/20251101120000_add_payment_webhooks_idempotency.sql`
  - payment_webhooks table for duplicate prevention
  - Added contract_id to consumer_orders
  - RLS policies for admin access
  
- ✅ `app/api/payments/webhook/__tests__/webhook.test.ts`
  - 19 comprehensive tests (exceeded 5 required!)
  - Covers signature verification, order creation, RICA trigger, idempotency

**Status**: ✅ COMPLETE - Production flow unblocked!

---

## 🎯 REMAINING TASKS (21 SP - ~10 hours)

### PRIORITY 2: Test Coverage (5 hours)

#### Task Group 11: RICA/Fulfillment Tests (2 hours)
**Status**: 🚧 80% complete (services exist, need tests)

**What to Create**:
```typescript
// lib/compliance/__tests__/rica-submission.test.ts
describe('RICA Auto-Submission', () => {
  it('should auto-populate from Didit KYC data (zero manual entry)')
  it('should pair ICCID with KYC data')
  it('should submit to ICASA API')
  it('should handle ICASA approval webhook')
  it('should handle ICASA rejection webhook')
  it('should update rica_submissions status')
  it('should maintain full audit trail')
})
```

**Files to Test**:
- `lib/compliance/rica-paired-submission.ts` (already exists)
- `lib/compliance/rica-webhook-handler.ts` (already exists)
- `app/api/activation/rica-submit/route.ts` (already exists)
- `app/api/activation/rica-webhook/route.ts` (already exists)

**Estimate**: 2 hours (7 tests)

---

#### Task Group 12: Activation Endpoint Tests (1 hour)
**Status**: 🚧 90% complete (endpoints exist, need tests)

**What to Create**:
```typescript
// app/api/activation/__tests__/activation.test.ts
describe('Service Activation', () => {
  it('should validate RICA approved before activation')
  it('should generate service credentials')
  it('should update order status to active')
  it('should send welcome email with credentials')
  it('should trigger service provisioning')
})
```

**Files to Test**:
- `app/api/activation/activate-service/route.ts` (already exists)
- `lib/activation/service-activator.ts` (already exists)

**Estimate**: 1 hour (5 tests)

---

#### Task Group 10: Payment API Tests (2 hours)
**Status**: ✅ Webhook tests done, need integration tests

**What to Create**:
```typescript
// app/api/invoices/__tests__/payment-flow.test.ts
describe('Invoice Payment Flow E2E', () => {
  it('should create invoice from contract')
  it('should generate NetCash payment URL')
  it('should process payment webhook')
  it('should auto-create order on payment')
  it('should trigger RICA submission')
})
```

**Estimate**: 2 hours (5 E2E integration tests)

---

### PRIORITY 3: Notifications (4 hours)

#### Task Group 13: Notification System (4 hours)
**Status**: ⏳ Not started

**Step 1: Create Email Templates** (2 hours)

```bash
# Create React Email templates
mkdir -p emails
```

**Files to Create**:

1. `emails/kyc-completed.tsx`
```tsx
/**
 * KYC Verification Complete Email
 * Sent when Didit verification completes successfully
 */
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function KYCCompletedEmail({
  customerName,
  verificationDate,
  riskTier,
  contractUrl,
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f5f5f5' }}>
        <Container>
          <Text>Hi {customerName},</Text>
          <Text>Your verification is complete! ✅</Text>
          <Text>Verification Date: {verificationDate}</Text>
          <Text>Risk Assessment: {riskTier}</Text>
          <Button href={contractUrl}>View Your Contract</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

2. `emails/contract-ready.tsx`
```tsx
/**
 * Contract Ready for Signature Email
 * Sent when contract PDF is generated and ready to sign
 */
export default function ContractReadyEmail({
  customerName,
  contractNumber,
  contractUrl,
  zohoSignUrl,
}) {
  return (
    <Html>
      <Body>
        <Text>Hi {customerName},</Text>
        <Text>Your contract {contractNumber} is ready to sign!</Text>
        <Button href={zohoSignUrl}>Sign Contract Now</Button>
      </Body>
    </Html>
  );
}
```

3. `emails/service-activated.tsx`
```tsx
/**
 * Service Activated Email
 * Sent when RICA approved and service is active
 */
export default function ServiceActivatedEmail({
  customerName,
  orderNumber,
  accountNumber,
  packageName,
  username,
  temporaryPassword,
  supportUrl,
}) {
  return (
    <Html>
      <Body>
        <Text>Welcome to CircleTel! 🎉</Text>
        <Text>Your service is now active!</Text>
        <Section>
          <Text>Order: {orderNumber}</Text>
          <Text>Account: {accountNumber}</Text>
          <Text>Package: {packageName}</Text>
        </Section>
        <Section>
          <Text>Login Credentials:</Text>
          <Text>Username: {username}</Text>
          <Text>Password: {temporaryPassword}</Text>
        </Section>
        <Button href={supportUrl}>Support Portal</Button>
      </Body>
    </Html>
  );
}
```

**Step 2: Extend Notification Service** (1 hour)

```typescript
// lib/notifications/quote-notifications.ts (extend existing)

export async function sendKYCCompletedEmail(kycSession) {
  const emailHtml = render(
    <KYCCompletedEmail 
      customerName={kycSession.customer_name}
      verificationDate={kycSession.completed_at}
      riskTier={kycSession.risk_tier}
      contractUrl={`${process.env.NEXT_PUBLIC_APP_URL}/customer/contracts/${kycSession.contract_id}`}
    />
  );

  return resend.emails.send({
    from: 'CircleTel <noreply@circletel.co.za>',
    to: kycSession.customer_email,
    subject: 'Verification Complete ✅',
    html: emailHtml,
  });
}

export async function sendContractReadyEmail(contract) {
  // Similar implementation
}

export async function sendServiceActivatedEmail(order) {
  // Similar implementation
}
```

**Step 3: Hook into Webhooks** (1 hour)

Add notification calls to existing webhook handlers:

```typescript
// lib/integrations/didit/webhook-handler.ts (line ~100)
if (event.event_type === 'verification.completed') {
  // ... existing code ...
  
  // Send email notification
  await sendKYCCompletedEmail(kycSession);
}

// lib/integrations/zoho/sign-webhook-handler.ts (line ~80)
if (event.event_type === 'request.completed') {
  // ... existing code ...
  
  await sendContractReadyEmail(contract);
}

// lib/activation/service-activator.ts (line ~120)
async function activateServiceLine(orderId) {
  // ... existing code ...
  
  await sendServiceActivatedEmail(order);
}
```

**Estimate**: 4 hours total

---

### PRIORITY 4: Deployment Readiness (4 hours)

#### Task Group 14: E2E Testing & Deployment (4 hours)
**Status**: ⏳ Not started

**Step 1: E2E Tests** (2 hours)

```typescript
// tests/e2e/b2b-quote-to-contract-full-flow.spec.ts
test('B2B Quote to Contract Happy Path', async ({ page }) => {
  // 1. Admin creates quote
  await page.goto('/admin/quotes/create');
  // ... fill form ...
  await page.click('button:has-text("Create Quote")');
  
  // 2. Manager approves quote
  await page.goto('/admin/quotes');
  await page.click('text=Approve');
  
  // 3. Customer completes KYC (mock Didit)
  await page.goto('/customer/quote/[id]/kyc');
  // ... mock Didit iframe completion ...
  
  // 4. Contract generated
  await expect(page.locator('text=Contract Generated')).toBeVisible();
  
  // 5. Customer signs (mock Zoho Sign)
  await page.click('text=Sign Contract');
  // ... mock signature ...
  
  // 6. Invoice created
  await expect(page.locator('text=INV-2025-')).toBeVisible();
  
  // 7. Payment completed (mock NetCash)
  // ... mock payment webhook ...
  
  // 8. Order created
  await expect(page.locator('text=Order Created')).toBeVisible();
  
  // 9. RICA submitted
  await expect(page.locator('text=RICA Submitted')).toBeVisible();
  
  // 10. Service activated
  await expect(page.locator('text=Service Active')).toBeVisible();
});
```

```typescript
// tests/e2e/high-risk-kyc-manual-review.spec.ts
test('High-Risk KYC Manual Review Flow', async ({ page }) => {
  // 1. Customer completes KYC with low liveness score
  // ... KYC with risk_tier = 'high' ...
  
  // 2. Admin sees in compliance queue
  await page.goto('/admin/compliance');
  await expect(page.locator('text=High Risk')).toBeVisible();
  
  // 3. Admin manually approves
  await page.click('text=Approve');
  await page.fill('textarea', 'Manual approval - customer verified via phone');
  await page.click('button:has-text("Confirm Approval")');
  
  // 4. Workflow continues
  await expect(page.locator('text=Approved')).toBeVisible();
});
```

**Step 2: Environment Configuration** (1 hour)

Update `.env.example`:
```bash
# Add new variables
NETCASH_WEBHOOK_SECRET=your-webhook-secret-here
DIDIT_API_KEY=your-didit-api-key
DIDIT_WEBHOOK_SECRET=your-didit-webhook-secret
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token
ZOHO_SIGN_API_KEY=your-zoho-sign-api-key
RICA_API_KEY=your-rica-api-key
RICA_WEBHOOK_SECRET=your-rica-webhook-secret
```

**Step 3: Production Webhook Configuration** (30 mins)

Configure webhook URLs in each service:

1. **NetCash**: `https://your-domain.com/api/payments/webhook`
2. **Didit**: `https://your-domain.com/api/compliance/webhook/didit`
3. **Zoho Sign**: `https://your-domain.com/api/contracts/webhook`
4. **Zoho CRM**: `https://your-domain.com/api/integrations/zoho/crm-webhook`
5. **ICASA RICA**: `https://your-domain.com/api/activation/rica-webhook`

**Step 4: Monitoring Setup** (30 mins)

```typescript
// lib/monitoring/slack-alerts.ts
export async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error') {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({
      text: `[${severity.toUpperCase()}] ${message}`,
      channel: '#circletel-alerts',
    }),
  });
}

// Use in webhook handlers
if (webhookError) {
  await sendSlackAlert(`Payment webhook failed: ${error.message}`, 'error');
}
```

**Estimate**: 4 hours total

---

## 📅 RECOMMENDED IMPLEMENTATION SCHEDULE

### Day 1 (6 hours)
- ✅ **DONE**: Payment webhook (Task 10) - 2 hours
- **Morning**: RICA/Activation tests (Tasks 11-12) - 3 hours
- **Afternoon**: Payment integration tests (Task 10) - 2 hours
- **Deploy**: Migration for payment_webhooks table
- **Test**: End-to-end payment flow in staging

### Day 2 (4 hours)
- **Morning**: Email templates (Task 13) - 2 hours
- **Morning**: Hook notifications into webhooks (Task 13) - 1 hour
- **Afternoon**: E2E tests (Task 14) - 2 hours
- **Late Afternoon**: Production webhook configuration (Task 14) - 1 hour
- **Deploy**: Full production deployment

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Run all tests: `npm run test`
- [ ] Run type check: `npm run type-check:memory`
- [ ] Apply migrations in Supabase Dashboard (in order):
  - [ ] `20251101000001_create_kyc_system.sql`
  - [ ] `20251102000001_create_contracts_system.sql`
  - [ ] `20251103000001_create_zoho_sync_system.sql`
  - [ ] `20251104000001_create_invoicing_system.sql`
  - [ ] `20251105000001_create_fulfillment_system.sql`
  - [ ] `20251101120000_add_payment_webhooks_idempotency.sql` ← NEW
- [ ] Update environment variables in Vercel
- [ ] Test webhook endpoints in staging

### During Deployment
- [ ] Deploy to Vercel
- [ ] Configure production webhooks (NetCash, Didit, Zoho, RICA)
- [ ] Test payment flow end-to-end
- [ ] Verify email deliverability (Resend)
- [ ] Monitor Slack alerts channel

### Post-Deployment
- [ ] Create test quote → contract → payment flow
- [ ] Verify RICA submission works
- [ ] Check admin compliance queue
- [ ] Monitor logs for 24 hours
- [ ] Document any issues

---

## 🎯 SUCCESS CRITERIA

### Technical
- ✅ All 61 story points complete
- ✅ All tests passing (50+ tests total)
- ✅ No TypeScript errors
- ✅ All webhooks configured and tested
- ✅ Monitoring/alerting active

### Business
- ✅ End-to-end flow works: Quote → KYC → Contract → Payment → RICA → Activation
- ✅ Zero manual data entry (KYC → RICA)
- ✅ Admin compliance queue functional
- ✅ Email notifications sent at each stage
- ✅ Full audit trail maintained

### Performance
- ✅ Payment webhook responds < 500ms
- ✅ KYC verification < 5 minutes
- ✅ Contract generation < 10 seconds
- ✅ RICA submission < 30 seconds
- ✅ Service activation < 1 hour

---

## 📊 PROGRESS TRACKER

| Priority | Task | Hours | Status | Completion |
|----------|------|-------|--------|------------|
| 1 | Payment Webhook | 2 | ✅ | 100% |
| 2 | RICA Tests | 2 | ⏳ | 0% |
| 2 | Activation Tests | 1 | ⏳ | 0% |
| 2 | Payment Integration Tests | 2 | ⏳ | 0% |
| 3 | Email Templates | 2 | ⏳ | 0% |
| 3 | Notification Hooks | 2 | ⏳ | 0% |
| 4 | E2E Tests | 2 | ⏳ | 0% |
| 4 | Production Config | 2 | ⏳ | 0% |

**Total Remaining**: 11 hours (after payment webhook completion)

---

## 💡 TIPS & BEST PRACTICES

### Testing
- Mock external APIs (Didit, NetCash, Zoho, RICA) in tests
- Use `vi.mock()` for API clients
- Test error scenarios (failed payments, declined KYC, etc.)
- Verify idempotency with duplicate webhook tests

### Email Templates
- Keep subject lines under 50 characters
- Use CircleTel orange (#F5831F) for CTAs
- Include unsubscribe link (POPIA compliance)
- Test rendering in Gmail, Outlook, Apple Mail

### Webhooks
- Always verify signatures (HMAC-SHA256)
- Log all webhook events for debugging
- Return 200 quickly (< 500ms)
- Process async operations in background
- Handle idempotency with unique transaction IDs

### Monitoring
- Set up Slack alerts for failed webhooks
- Monitor payment success rate (target: > 95%)
- Track KYC approval rate (target: > 85%)
- Monitor RICA submission time (target: < 1 day)

---

**Next Action**: Start with RICA tests (Priority 2) since payment webhook is done! 🚀
