# CFC-001-01 Development Environment Setup Guide

**Story**: Payment Integration
**Epic**: CFC-001 Coverage & Feasibility Check System
**Estimate**: 2 days (8 story points)
**Last Updated**: 2025-02-01

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 Minutes)](#quick-start-5-minutes)
3. [Detailed Setup Instructions](#detailed-setup-instructions)
4. [Database Setup](#database-setup)
5. [Netcash Integration Setup](#netcash-integration-setup)
6. [Email Configuration](#email-configuration)
7. [Local Development Workflow](#local-development-workflow)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)
10. [Security Checklist](#security-checklist)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Git for version control
- ✅ Supabase CLI (`npm install -g supabase`)
- ✅ Access to CircleTel Netcash account (sandbox credentials)
- ✅ CircleTel Resend API key
- ✅ Text editor (VS Code recommended)
- ✅ Postman or similar API testing tool

**Development Dependencies Already Installed:**
- ✅ `resend` (v6.1.1) - Email service
- ✅ `sonner` (v1.7.4) - Toast notifications
- ✅ `@radix-ui/react-dialog` (v1.1.2) - Modal components
- ✅ `zod` (v3.25.76) - Form validation
- ✅ `react-hook-form` (v7.63.0) - Form management

**No additional npm packages required!** All dependencies are already configured.

---

## Quick Start (5 Minutes)

### Step 1: Copy Environment Configuration

```bash
# Navigate to project root
cd c:/Projects/circletel-nextjs

# Copy the example environment file
cp .env.local.example .env.local
```

### Step 2: Configure Essential Variables

Edit `.env.local` and update these critical values:

```bash
# Netcash Sandbox (required)
NETCASH_MERCHANT_ID=your_test_merchant_id       # Get from Netcash dashboard
NETCASH_SECRET_KEY=your_test_secret_key         # Get from Netcash dashboard
NETCASH_WEBHOOK_SECRET=your_webhook_secret_key  # Generate a random 32-char string

# Resend (already configured)
RESEND_API_KEY=re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM  # ✅ Already set

# URLs for local development
NEXT_PUBLIC_APP_URL=http://localhost:3006
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3006/order/confirmation
NEXT_PUBLIC_PAYMENT_CANCEL_URL=http://localhost:3006/order/payment
```

### Step 3: Run Database Migration

```bash
# Ensure Supabase is accessible
export SUPABASE_ACCESS_TOKEN=sbp_ae3270d29be1c27eac898e699c1525a93375c0c2

# Apply the orders table migration
supabase db push --project-ref agyjovdugmtopasyvlng
```

### Step 4: Start Development Server

```bash
npm run dev
```

Your development environment is now ready! 🎉

---

## Detailed Setup Instructions

### 1. Environment Variables Configuration

#### Required Variables for CFC-001-01

| Variable | Purpose | Where to Get | Example |
|----------|---------|--------------|---------|
| `NETCASH_MERCHANT_ID` | Your Netcash merchant account ID | Netcash Dashboard → Merchant Profile | `100012345` |
| `NETCASH_SECRET_KEY` | Secret key for signature generation | Netcash Dashboard → API Keys | `abc123def456...` |
| `NETCASH_PAYMENT_URL` | Payment gateway endpoint | Use sandbox URL for testing | `https://sandbox.netcash.co.za/paynow/process` |
| `NETCASH_WEBHOOK_SECRET` | Secret for webhook verification | Generate yourself (32+ chars) | `your_random_32_char_secret` |
| `RESEND_API_KEY` | Email service API key | Already configured ✅ | `re_QhMu7F2n_...` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | Your local dev URL | `http://localhost:3006` |

#### How to Generate Webhook Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://www.random.org/strings/
# Generate 1 string, 32 characters, alphanumeric
```

### 2. Netcash Account Setup

#### Get Sandbox Credentials

1. **Sign up for Netcash Sandbox**:
   - Visit: https://developer.netcash.co.za
   - Create developer account
   - Access sandbox environment

2. **Retrieve Merchant Credentials**:
   - Log in to Netcash sandbox dashboard
   - Navigate to **Settings → API Credentials**
   - Copy your `Merchant ID` and `Secret Key`

3. **Configure Webhook URL** (for production):
   - Add webhook endpoint: `https://yourdomain.com/api/payment/netcash/webhook`
   - Note: In development, you'll use ngrok or similar for webhook testing

#### Test Cards for Sandbox

| Card Number | CVV | Result |
|-------------|-----|--------|
| 4000000000000002 | 123 | Successful payment |
| 5200000000000015 | 456 | Successful payment |
| 4000000000000010 | 123 | Declined payment |
| 4000000000000028 | 123 | Insufficient funds |

---

## Database Setup

### Migration Overview

The migration creates two tables:

1. **`orders`** - Main order records with payment tracking
2. **`payment_audit_logs`** - Audit trail for all payment events

### Apply Migration

```bash
# Set Supabase token (if not already in .env.local)
export SUPABASE_ACCESS_TOKEN=sbp_ae3270d29be1c27eac898e699c1525a93375c0c2

# Push migration to Supabase
supabase db push --project-ref agyjovdugmtopasyvlng

# Verify tables were created
supabase db diff --linked
```

### Verify Migration Success

```bash
# Check if tables exist
supabase db query --project-ref agyjovdugmtopasyvlng \
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('orders', 'payment_audit_logs');"

# Should return:
# table_name
# ------------------
# orders
# payment_audit_logs
```

### Database Schema Overview

**Orders Table Key Fields:**
- `id`: UUID (primary key)
- `lead_id`: References coverage_leads
- `package_id`: References service_packages
- `payment_status`: pending | processing | completed | failed | refunded | cancelled
- `order_status`: pending_payment | payment_received | crm_processing | confirmed | cancelled | failed
- `payment_reference`: Unique payment tracking ID
- `netcash_transaction_id`: Netcash's transaction ID

**Payment Audit Logs:**
- `order_id`: References orders
- `event_type`: payment_initiated | payment_callback | payment_verified | payment_failed | webhook_received
- `netcash_response`: JSONB (full webhook payload)
- `signature_valid`: Boolean (webhook signature verification)

---

## Netcash Integration Setup

### Integration Flow Overview

```
Customer → Coverage Check → Package Selection
    ↓
Order Creation (with payment_reference)
    ↓
Redirect to Netcash Payment Gateway
    ↓
Customer Completes Payment
    ↓
Netcash Webhook → /api/payment/netcash/webhook
    ↓
Verify Signature → Update Order Status → Send Email
    ↓
Redirect to Confirmation Page
```

### Payment Reference Generation

Payment references are automatically generated using this format:

```
CT-{timestamp}-{random4digits}
Example: CT-1738367200-4829
```

**Key Characteristics:**
- Unique per transaction
- 20 characters max (Netcash limit)
- Easy to reference for customer support
- Stored in `orders.payment_reference`

### Signature Verification

Netcash webhooks include a signature for security. Verification algorithm:

```typescript
import crypto from 'crypto';

function verifyNetcashSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```

---

## Email Configuration

### Resend API Setup

**Good News:** Resend is already configured! ✅

**Current Configuration:**
- API Key: `re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM`
- From Email: `orders@circletel.co.za`
- Reply-To: `support@circletel.co.za`

### Email Templates

CFC-001-01 includes a complete HTML email template with:
- CircleTel branding (orange #F5831F)
- Order summary details
- Payment confirmation
- Next steps with timeline
- Support contact information

**Template Location:** Defined in `/app/api/payment/netcash/webhook/route.ts`

### Testing Emails Locally

```bash
# Start dev server
npm run dev

# Use Resend's test mode (automatically enabled in development)
# Emails sent in development appear in Resend Dashboard → Logs

# Test email sending:
curl -X POST http://localhost:3006/api/payment/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

---

## Local Development Workflow

### Development Process for CFC-001-01

#### Phase 1: Setup (30 minutes)
1. ✅ Copy `.env.local.example` → `.env.local`
2. ✅ Configure Netcash sandbox credentials
3. ✅ Apply database migration
4. ✅ Start development server
5. ✅ Verify homepage loads

#### Phase 2: Create Components (4 hours)
1. **PaymentStage.tsx** (2 hours)
   - Create in `/components/order/stages/`
   - Copy code from CFC-001-01 story
   - Test with mock order data

2. **OrderSummary.tsx** (1 hour)
   - Create in `/components/order/`
   - Test with different packages

3. **CompactOrderSummary.tsx** (30 minutes)
   - Create in `/components/order/`

4. **Update OrderContext** (30 minutes)
   - Add payment stage to wizard
   - Test navigation flow

#### Phase 3: Create API Routes (3 hours)
1. **POST /api/orders/create** (1 hour)
   - Create order record
   - Generate payment reference
   - Validate input

2. **POST /api/payment/netcash/initiate** (1 hour)
   - Generate Netcash payment URL
   - Create redirect with signature
   - Log payment initiation

3. **POST /api/payment/netcash/webhook** (1 hour)
   - Verify webhook signature
   - Update order status
   - Send confirmation email
   - Create audit log

#### Phase 4: Testing (2 hours)
1. **Manual Testing** (1 hour)
   - Complete order flow
   - Test with sandbox cards
   - Verify email delivery
   - Check database records

2. **Edge Case Testing** (30 minutes)
   - Payment failure scenarios
   - Invalid webhook signatures
   - Network timeouts
   - Duplicate webhooks

3. **Security Review** (30 minutes)
   - Verify signature validation
   - Check SQL injection protection
   - Validate input sanitization
   - Review error messages

### Daily Development Checklist

**Morning Routine:**
- [ ] Pull latest code from `staging` branch
- [ ] Start dev server: `npm run dev`
- [ ] Check Supabase connection
- [ ] Review Netcash sandbox status

**Before Each Commit:**
- [ ] Run type check: `npm run type-check`
- [ ] Fix any TypeScript errors
- [ ] Test affected features manually
- [ ] Update todo list

**End of Day:**
- [ ] Commit progress with descriptive message
- [ ] Push to feature branch
- [ ] Update story status in BMAD docs
- [ ] Log any blockers or questions

---

## Testing Guide

### Test Scenarios for CFC-001-01

#### Scenario 1: Successful Payment Flow
1. Navigate to `/coverage`
2. Enter address: "18 Rasmus Erasmus, Centurion, 0157"
3. Click "Show me my deals"
4. Select a package (e.g., SkyFibre 50Mbps)
5. Fill in contact details
6. Click "Proceed to Payment"
7. Verify order summary displays correctly
8. Click "Pay with Netcash"
9. Use test card: `4000000000000002`, CVV: `123`
10. Complete payment
11. Verify redirect to confirmation page
12. Check order status in database: `payment_status = 'completed'`
13. Verify email received

**Expected Results:**
- ✅ Order created with status `pending_payment`
- ✅ Payment reference generated (e.g., `CT-1738367200-4829`)
- ✅ Redirect to Netcash successful
- ✅ Webhook received and processed
- ✅ Order status updated to `completed`
- ✅ Email sent with order details
- ✅ Audit log created

#### Scenario 2: Payment Failure
1. Follow steps 1-8 from Scenario 1
2. Use test card: `4000000000000010` (declined)
3. Payment fails at Netcash
4. Verify redirect to payment page with error message
5. Check order status: `payment_status = 'failed'`

#### Scenario 3: Webhook Signature Verification
```bash
# Test invalid signature
curl -X POST http://localhost:3006/api/payment/netcash/webhook \
  -H "Content-Type: application/json" \
  -H "X-Netcash-Signature: invalid_signature" \
  -d '{
    "transaction_id": "TEST123",
    "status": "completed",
    "payment_reference": "CT-1738367200-4829"
  }'

# Expected: 401 Unauthorized
```

### Webhook Testing with Ngrok

For testing webhooks in local development:

```bash
# Install ngrok (if not already)
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3006

# Copy the forwarding URL (e.g., https://abc123.ngrok.io)
# Configure in Netcash dashboard:
# Webhook URL: https://abc123.ngrok.io/api/payment/netcash/webhook
```

### Database Verification Queries

```sql
-- Check latest orders
SELECT
  id,
  payment_reference,
  payment_status,
  order_status,
  total_amount,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Check payment audit logs
SELECT
  order_id,
  event_type,
  status,
  signature_valid,
  created_at
FROM payment_audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- Find orders by payment reference
SELECT * FROM orders WHERE payment_reference = 'CT-1738367200-4829';
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "NETCASH_MERCHANT_ID is not defined"

**Cause:** Environment variable not set or `.env.local` not loaded.

**Solution:**
```bash
# Verify .env.local exists
ls -la .env.local

# Check if variable is set
cat .env.local | grep NETCASH_MERCHANT_ID

# Restart dev server
npm run dev
```

#### Issue 2: Migration Fails with "relation already exists"

**Cause:** Migration was already applied.

**Solution:**
```bash
# Check migration history
supabase db diff --linked

# If tables exist, skip migration
# If tables are incorrect, drop and recreate:
supabase db reset --linked
supabase db push --project-ref agyjovdugmtopasyvlng
```

#### Issue 3: Webhook Returns 401 Unauthorized

**Cause:** Signature verification failed or webhook secret mismatch.

**Solution:**
```bash
# Verify webhook secret matches in both:
# 1. .env.local: NETCASH_WEBHOOK_SECRET
# 2. Netcash dashboard webhook configuration

# Test webhook locally without signature:
# Temporarily comment out signature check in webhook route
# (Only for testing! Re-enable before committing)
```

#### Issue 4: Email Not Sending

**Cause:** Resend API key invalid or rate limit exceeded.

**Solution:**
```bash
# Verify Resend API key
cat .env.local | grep RESEND_API_KEY

# Check Resend dashboard for errors:
# https://resend.com/logs

# Verify from email domain is verified:
# orders@circletel.co.za must be verified in Resend
```

#### Issue 5: Type Errors in PaymentStage.tsx

**Cause:** Missing type definitions or incorrect imports.

**Solution:**
```bash
# Run type check
npm run type-check

# Common fix: Ensure OrderContext types are correct
# Check /components/order/context/OrderContext.tsx

# If types are missing, add to context:
interface OrderState {
  // ... existing fields
  paymentReference?: string;
  orderId?: string;
}
```

### Debug Mode

Enable detailed logging for development:

```typescript
// In any API route, add:
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Environment:', {
    merchantId: process.env.NETCASH_MERCHANT_ID,
    webhookSecret: process.env.NETCASH_WEBHOOK_SECRET?.substring(0, 5) + '...'
  });
}
```

---

## Security Checklist

Before committing or deploying, verify:

### Code Security
- [ ] No hardcoded credentials in code
- [ ] Webhook signature verification enabled
- [ ] Input validation on all API routes
- [ ] SQL injection protection (parameterized queries)
- [ ] Error messages don't leak sensitive data
- [ ] Rate limiting considered (future task)

### Environment Security
- [ ] `.env.local` is in `.gitignore`
- [ ] Production secrets different from sandbox
- [ ] Webhook secret is 32+ characters
- [ ] HTTPS enforced for production webhooks
- [ ] No secrets logged to console

### Database Security
- [ ] Row Level Security (RLS) enabled
- [ ] Service role used for API routes only
- [ ] Sensitive data encrypted at rest (Supabase default)
- [ ] Audit logs capture all payment events
- [ ] No customer payment data stored (PCI DSS)

### Compliance
- [ ] No credit card numbers stored
- [ ] Tokenized payments via Netcash
- [ ] Customer email consent logged
- [ ] Terms & conditions acceptance tracked
- [ ] GDPR-compliant data handling

---

## Next Steps After Setup

Once your development environment is ready:

1. **Review Story Requirements**: Read [CFC-001-01-payment-integration.md](../stories/CFC-001-01-payment-integration.md)

2. **Start Implementation**:
   - Create PaymentStage component
   - Build API routes
   - Test with sandbox cards
   - Verify email delivery

3. **Quality Gate Validation**: Use [CFC-001-epic-quality-gate.yml](../qa/gates/CFC-001-epic-quality-gate.yml) for validation

4. **Submit for Review**: When complete, create PR with:
   - All code changes
   - Type check passing
   - Manual test results
   - Screenshots of payment flow

---

## Support and Resources

### Documentation
- **Netcash API Docs**: https://developer.netcash.co.za
- **Resend API Docs**: https://resend.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **BMAD Framework**: See `.bmad-core/README.md`

### Internal Resources
- **Story Document**: [CFC-001-01-payment-integration.md](../stories/CFC-001-01-payment-integration.md)
- **Epic Overview**: [CFC-001-coverage-feasibility-check-system.md](../epics/CFC-001-coverage-feasibility-check-system.md)
- **Compliance Assessment**: [CFC-001-requirements-compliance.md](../qa/assessments/CFC-001-requirements-compliance.md)

### Getting Help
- **Technical Issues**: Create issue in GitHub repo
- **BMAD Questions**: Check `.bmad-core/README.md`
- **Netcash Support**: support@netcash.co.za
- **Resend Support**: support@resend.com

---

## Appendix: Environment Variable Reference

### Complete .env.local Template

```bash
# ============================================
# CircleTel CFC-001-01 Development Environment
# ============================================

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ACCESS_TOKEN=sbp_ae3270d29be1c27eac898e699c1525a93375c0c2

# Netcash Payment (REQUIRED - get from Netcash dashboard)
NETCASH_MERCHANT_ID=your_sandbox_merchant_id
NETCASH_SECRET_KEY=your_sandbox_secret_key
NETCASH_PAYMENT_URL=https://sandbox.netcash.co.za/paynow/process
NETCASH_WEBHOOK_SECRET=your_random_32_char_webhook_secret

# Resend Email (already configured)
RESEND_API_KEY=re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM
RESEND_FROM_EMAIL=orders@circletel.co.za
RESEND_REPLY_TO_EMAIL=support@circletel.co.za

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3006
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=http://localhost:3006/order/confirmation
NEXT_PUBLIC_PAYMENT_CANCEL_URL=http://localhost:3006/order/payment

# Google Maps (already configured)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU
```

---

**Setup Complete! 🎉**

You're now ready to implement CFC-001-01 Payment Integration. Follow the story document for detailed implementation guidance, and use this setup guide as your reference for configuration and troubleshooting.

**Estimated Setup Time**: 30 minutes
**Next Phase**: Component Implementation (4 hours)
**Total Story Estimate**: 2 days

Happy coding! 🚀
