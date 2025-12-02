---
type: specification
domain: [customer, rewards, billing]
tags: [referral, rewards, free-month, incentives, customer-acquisition]
status: planning
created: 2025-12-01
priority: high
story_points: 47
estimated_duration: 3-4 weeks
---

# Customer Referral & Rewards System - Technical Specification

**Spec ID**: `20251201-customer-referral-rewards`
**Version**: 1.0
**Created**: 2025-12-01
**Last Updated**: 2025-12-01

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Non-Goals](#goals--non-goals)
3. [Success Criteria](#success-criteria)
4. [User Stories](#user-stories)
5. [Technical Specification](#technical-specification)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Service Layer](#service-layer)
9. [Frontend Components](#frontend-components)
10. [Architecture](#architecture)
11. [Security & Fraud Prevention](#security--fraud-prevention)
12. [Billing Integration](#billing-integration)
13. [Testing Strategy](#testing-strategy)
14. [Risk Assessment](#risk-assessment)
15. [Deployment Plan](#deployment-plan)

---

## Overview

### Description

Implement a customer referral and rewards system where existing CircleTel customers can earn a free month of service by referring new customers. The reward is triggered when a customer successfully refers 2 or more new customers who sign up, activate service, and maintain active service for at least 30 days.

### Business Value

- **Customer Acquisition**: Incentivize word-of-mouth marketing
- **Reduced CAC**: Lower customer acquisition costs through referrals
- **Customer Retention**: Existing customers stay engaged with rewards
- **Viral Growth**: Create organic growth loop
- **Loyalty Building**: Reward brand advocates

### Key Metrics

- Referral conversion rate
- Average referrals per customer
- Reward redemption rate
- Customer acquisition cost (CAC) reduction
- Referral fraud rate

---

## Goals & Non-Goals

### Goals

✅ Allow customers to generate unique referral codes
✅ Track referrals from initial signup through service activation
✅ Automatically apply free month reward after 2 successful referrals
✅ Support pro-rata free month calculation on billing cycles
✅ Provide admin interface for referral management
✅ Implement fraud prevention and validation rules
✅ Display referral status and balance in customer dashboard
✅ Send email notifications for referral milestones

### Non-Goals

❌ Multi-tier referral programs (referral of referrals)
❌ Cash/monetary rewards (only service credits)
❌ Partner/reseller referral programs (separate system)
❌ Retroactive referral tracking (only new referrals)
❌ Referral marketplace or public sharing features
❌ Integration with social media sharing APIs (phase 2)

---

## Success Criteria

### Functional Requirements

- [ ] Customers can generate a unique, shareable referral code
- [ ] System tracks referrals through entire lifecycle (signup → active)
- [ ] Reward automatically granted after 2 successful referrals
- [ ] Free month applied correctly to next billing cycle
- [ ] Pro-rata calculation for mid-cycle activations
- [ ] Admin can view all referrals and rewards
- [ ] Admin can manually grant/revoke rewards with audit trail
- [ ] Fraud prevention rules prevent self-referral and abuse

### Technical Requirements

- [ ] All database queries use proper RLS policies
- [ ] API endpoints secured with authentication
- [ ] Referral codes are unique and non-guessable (min 8 chars)
- [ ] Billing integration doesn't break existing flows
- [ ] Performance: Referral checks < 200ms
- [ ] All critical paths have error handling
- [ ] Comprehensive test coverage (>80%)

### User Experience Requirements

- [ ] Referral widget visible on dashboard homepage
- [ ] One-click copy referral code/link
- [ ] Real-time referral progress tracking
- [ ] Email notifications for milestones
- [ ] Clear messaging about reward requirements
- [ ] Mobile-responsive design

---

## User Stories

### US-1: Generate Referral Code

**As a** CircleTel customer
**I want to** generate a unique referral code
**So that** I can share it with friends and family to earn rewards

**Acceptance Criteria**:
- Customer can access referral widget from dashboard
- Clicking "Get Referral Code" generates unique code (if not exists)
- Code format: `CT-REF-XXXXXXXX` (8 random alphanumeric)
- Code is permanent (not regenerated)
- Full referral link provided: `https://www.circletel.co.za/?ref=CT-REF-XXXXXXXX`
- One-click copy to clipboard functionality
- Share buttons for email and WhatsApp (optional phase 2)

**Story Points**: 3

---

### US-2: View Referral Progress

**As a** CircleTel customer
**I want to** see my referral progress and status
**So that** I know how many more referrals I need to earn a reward

**Acceptance Criteria**:
- Dashboard shows referral count (e.g., "1/2 referrals")
- List of referred customers with statuses:
  - Pending (signed up, not activated)
  - Active (service activated, counting toward reward)
  - Expired (didn't activate within 30 days)
- Visual progress indicator (progress bar or circular)
- Clear messaging: "Refer 1 more friend to earn a free month!"
- Display reward balance (e.g., "1 free month available")

**Story Points**: 5

---

### US-3: Referral Signup Flow

**As a** new customer
**I want to** sign up using a referral code
**So that** my friend gets credit for referring me

**Acceptance Criteria**:
- Referral code captured from URL parameter `?ref=CT-REF-XXXXXXXX`
- Code stored in localStorage if user doesn't complete signup immediately
- Code validated during order creation (exists, valid, not expired)
- Referral attribution recorded in `customer_referrals` table
- New customer sees message: "You were referred by [Name]"
- Referrer gets email notification: "Good news! [Name] signed up using your referral code"

**Story Points**: 5

---

### US-4: Automatic Reward Granting

**As a** CircleTel customer
**I want to** automatically receive my free month reward
**So that** I don't have to manually claim it

**Acceptance Criteria**:
- System checks referral count after each successful service activation
- When 2nd referral activates, create reward record in `referral_rewards`
- Reward type: `free_month`
- Reward status: `pending` (until applied to invoice)
- Email notification sent: "Congrats! You've earned a free month"
- Dashboard shows: "1 free month available"
- Both referrals must be active for 30+ days (fraud prevention)

**Story Points**: 8

---

### US-5: Apply Free Month to Billing

**As a** CircleTel customer
**I want to** have my free month automatically applied to my bill
**So that** I don't pay for one billing cycle

**Acceptance Criteria**:
- During billing cycle, check for pending free month rewards
- If reward exists, apply to next invoice:
  - Set `is_free_month = true` on invoice
  - Set `amount_due = 0` (waived)
  - Add line item: "Referral Reward - Free Month"
- Update reward status: `pending` → `applied`
- Record application date and invoice ID
- Pro-rata support: If service started mid-month, waive only used portion
- Email notification: "Your free month has been applied to invoice [INV-YYYY-NNN]"

**Story Points**: 8

---

### US-6: Admin View Referrals

**As an** admin user
**I want to** view all customer referrals and rewards
**So that** I can monitor the program and handle support requests

**Acceptance Criteria**:
- Admin page: `/admin/customers/[id]/referrals`
- Display referrer's referral code
- Table of referred customers with columns:
  - Name, Email, Signup Date, Status, Service Status
- Referral stats card:
  - Total referrals, Active referrals, Pending rewards, Applied rewards
- Filter by status (pending, active, expired)
- Search by customer name/email

**Story Points**: 5

---

### US-7: Admin Grant/Revoke Reward

**As an** admin user
**I want to** manually grant or revoke referral rewards
**So that** I can handle edge cases and support requests

**Acceptance Criteria**:
- Admin can click "Grant Free Month" button
- Modal prompts for reason (required for audit)
- Creates reward record with `manually_granted = true`
- Admin can click "Revoke" on unused rewards
- Revoke requires reason (audit trail)
- Updates reward status to `revoked`
- All actions logged in `audit_logs` table
- Email notification sent to customer for both actions

**Story Points**: 5

---

### US-8: Fraud Prevention

**As a** system administrator
**I want to** prevent referral fraud
**So that** the program is sustainable and fair

**Acceptance Criteria**:
- Validation rules:
  - Cannot refer yourself (email, phone, address match)
  - Referrer must have active service (not cancelled/suspended)
  - Referred customer must maintain service for 30 days
  - Max 10 referrals per customer per month (rate limiting)
  - Referral code cannot be used more than once per email
  - IP address tracking for abuse detection (same IP = suspicious)
- Suspicious referrals flagged for manual review
- Admin dashboard shows flagged referrals
- Automated email alerts for suspicious activity

**Story Points**: 8

---

## Technical Specification

### Technology Stack

- **Backend**: Next.js 15 API Routes, TypeScript
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (customer context)
- **Notifications**: Email via existing `EmailNotificationService`
- **Frontend**: React 18, Tailwind CSS, Framer Motion
- **State Management**: React useState/useEffect (no global state needed)

### File Changes Summary

**New Files (12)**:
- `supabase/migrations/20251201_create_referral_system.sql`
- `lib/rewards/referral-service.ts`
- `lib/rewards/free-month-calculator.ts`
- `lib/rewards/fraud-detection.ts`
- `app/api/customer/referrals/route.ts`
- `app/api/customer/referral-balance/route.ts`
- `app/api/admin/customers/[id]/referrals/route.ts`
- `app/api/admin/customers/[id]/referrals/grant/route.ts`
- `app/api/admin/customers/[id]/referrals/revoke/route.ts`
- `components/dashboard/ReferralWidget.tsx`
- `components/admin/customers/ReferralManagement.tsx`
- `app/admin/customers/[id]/referrals/page.tsx`

**Modified Files (8)**:
- `lib/billing/compliant-billing-service.ts` (free month check)
- `app/dashboard/page.tsx` (add referral widget)
- `app/(public)/packages/[leadId]/page.tsx` (capture referral code)
- `app/order/account/page.tsx` (validate & store referral)
- `lib/rbac/permissions.ts` (add MANAGE_REFERRALS)
- `types/database.ts` (add table types)
- `lib/email/templates/referral-earned.ts` (new template)
- `lib/email/templates/referral-applied.ts` (new template)

---

## Database Schema

### Table: `customer_referrals`

Tracks individual referral relationships.

```sql
CREATE TABLE customer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referrer (existing customer)
  referrer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL, -- e.g., CT-REF-XXXXXXXX

  -- Referred customer (new customer)
  referred_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  referred_email VARCHAR(255), -- Captured even before customer created
  referred_name VARCHAR(255),

  -- Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending: Signed up, not activated
    -- active: Service activated, counts toward reward
    -- expired: Didn't activate within 30 days
    -- cancelled: Cancelled service before 30 days

  -- Metadata
  referral_source VARCHAR(50), -- 'url_param', 'manual_entry', 'admin_override'
  ip_address INET, -- For fraud detection
  user_agent TEXT, -- For fraud detection

  -- Lifecycle dates
  referred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Signup date
  activated_at TIMESTAMPTZ, -- Service activation date
  expired_at TIMESTAMPTZ, -- If expired without activation

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_referrer_referred UNIQUE(referrer_id, referred_email),
  INDEX idx_referrer_status ON customer_referrals(referrer_id, status),
  INDEX idx_referred_customer ON customer_referrals(referred_customer_id),
  INDEX idx_referral_code ON customer_referrals(referral_code)
);

-- RLS Policies
ALTER TABLE customer_referrals ENABLE ROW LEVEL SECURITY;

-- Customers can view their own referrals
CREATE POLICY "Customers can view own referrals"
  ON customer_referrals FOR SELECT
  USING (referrer_id = auth.uid()::uuid);

-- Admins can view all
CREATE POLICY "Admins can view all referrals"
  ON customer_referrals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::uuid
      AND has_permission(id, 'customers:view')
    )
  );
```

### Table: `referral_rewards`

Tracks earned rewards and their application status.

```sql
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer who earned the reward
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Reward details
  reward_type VARCHAR(20) NOT NULL DEFAULT 'free_month',
    -- free_month: One month waived recurring fee

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending: Earned, not yet applied
    -- applied: Applied to invoice
    -- expired: Not used within 12 months
    -- revoked: Manually revoked by admin

  -- Application tracking
  applied_to_service_id UUID REFERENCES customer_services(id),
  applied_to_invoice_id UUID REFERENCES customer_invoices(id),
  applied_at TIMESTAMPTZ,

  -- Billing period (for free month)
  period_start DATE, -- Billing period start
  period_end DATE,   -- Billing period end
  amount_waived DECIMAL(10,2), -- Actual amount waived (pro-rata)

  -- Referral tracking (which 2 referrals triggered this reward)
  referral_1_id UUID REFERENCES customer_referrals(id),
  referral_2_id UUID REFERENCES customer_referrals(id),

  -- Admin override
  manually_granted BOOLEAN DEFAULT FALSE,
  granted_by UUID REFERENCES admin_users(id),
  grant_reason TEXT,

  revoked_by UUID REFERENCES admin_users(id),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,

  -- Expiry
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 months'),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_customer_status ON referral_rewards(customer_id, status),
  INDEX idx_applied_invoice ON referral_rewards(applied_to_invoice_id)
);

-- RLS Policies
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Customers can view their own rewards
CREATE POLICY "Customers can view own rewards"
  ON referral_rewards FOR SELECT
  USING (customer_id = auth.uid()::uuid);

-- Admins can view and manage all
CREATE POLICY "Admins can manage all rewards"
  ON referral_rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::uuid
      AND has_permission(id, 'billing:manage_invoices')
    )
  );
```

### Table Updates

#### Update `customers` table

Add referral code generation:

```sql
ALTER TABLE customers
ADD COLUMN referral_code VARCHAR(20) UNIQUE;

-- Create index
CREATE INDEX idx_customers_referral_code ON customers(referral_code);

-- Function to auto-generate referral code on insert
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'CT-REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
```

#### Update `customer_invoices` table

Add free month tracking:

```sql
ALTER TABLE customer_invoices
ADD COLUMN is_free_month BOOLEAN DEFAULT FALSE,
ADD COLUMN referral_reward_id UUID REFERENCES referral_rewards(id);

CREATE INDEX idx_invoices_referral_reward ON customer_invoices(referral_reward_id);
```

---

## API Endpoints

### Customer Endpoints

#### POST /api/customer/referrals

Generate or retrieve customer's referral code.

**Auth**: Customer session required

**Request**: None (uses authenticated customer ID)

**Response**:
```json
{
  "success": true,
  "data": {
    "referral_code": "CT-REF-A3F8B2E1",
    "referral_link": "https://www.circletel.co.za/?ref=CT-REF-A3F8B2E1",
    "referral_count": 1,
    "referral_count_active": 1,
    "reward_balance": 0,
    "next_reward_progress": "1/2 referrals"
  }
}
```

**Logic**:
1. Get customer from auth session
2. Return existing referral code or generate new one
3. Count active referrals
4. Calculate reward balance

---

#### GET /api/customer/referrals

List customer's referrals and their statuses.

**Auth**: Customer session required

**Query Params**:
- `status` (optional): Filter by status (pending, active, expired)

**Response**:
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": "uuid",
        "referred_name": "John Doe",
        "referred_email": "john@example.com",
        "status": "active",
        "referred_at": "2025-11-15T10:00:00Z",
        "activated_at": "2025-11-20T14:30:00Z"
      }
    ],
    "stats": {
      "total": 2,
      "active": 1,
      "pending": 1,
      "expired": 0
    }
  }
}
```

---

#### GET /api/customer/referral-balance

Get customer's available free month rewards.

**Auth**: Customer session required

**Response**:
```json
{
  "success": true,
  "data": {
    "available_rewards": 1,
    "pending_rewards": [
      {
        "id": "uuid",
        "reward_type": "free_month",
        "status": "pending",
        "created_at": "2025-11-25T10:00:00Z",
        "expires_at": "2026-11-25T10:00:00Z"
      }
    ],
    "applied_rewards": [
      {
        "id": "uuid",
        "applied_at": "2025-10-01T00:00:00Z",
        "invoice_number": "INV-2025-123",
        "amount_waived": 799.00
      }
    ]
  }
}
```

---

### Admin Endpoints

#### GET /api/admin/customers/[id]/referrals

View all referrals for a specific customer.

**Auth**: Admin session with `customers:view` permission

**Response**:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "name": "Jane Smith",
      "referral_code": "CT-REF-A3F8B2E1"
    },
    "referrals": [...],
    "rewards": [...],
    "stats": {
      "total_referrals": 5,
      "active_referrals": 4,
      "rewards_earned": 2,
      "rewards_applied": 1
    }
  }
}
```

---

#### POST /api/admin/customers/[id]/referrals/grant

Manually grant a free month reward.

**Auth**: Admin session with `billing:manage_invoices` permission

**Request**:
```json
{
  "reason": "Customer service recovery - compensation for outage"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reward_id": "uuid",
    "status": "pending",
    "manually_granted": true
  }
}
```

**Logic**:
1. Validate admin permissions
2. Create reward record with `manually_granted = true`
3. Log in audit trail
4. Send email notification to customer

---

#### POST /api/admin/customers/[id]/referrals/revoke

Revoke an unused reward.

**Auth**: Admin session with `billing:manage_invoices` permission

**Request**:
```json
{
  "reward_id": "uuid",
  "reason": "Fraudulent referral activity detected"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reward_id": "uuid",
    "status": "revoked",
    "revoked_at": "2025-12-01T10:00:00Z"
  }
}
```

**Logic**:
1. Validate admin permissions
2. Check reward is pending (not already applied)
3. Update status to revoked
4. Log in audit trail
5. Send email notification to customer

---

## Service Layer

### lib/rewards/referral-service.ts

Core referral tracking logic.

**Key Functions**:

```typescript
export class ReferralService {
  // Generate or get referral code
  static async getOrCreateReferralCode(customerId: string): Promise<string>

  // Validate referral code
  static async validateReferralCode(code: string): Promise<boolean>

  // Create referral record
  static async createReferral(params: CreateReferralParams): Promise<Referral>

  // Mark referral as activated (when service goes live)
  static async activateReferral(referralId: string): Promise<void>

  // Check if customer has earned reward (2+ active referrals)
  static async checkAndGrantReward(customerId: string): Promise<Reward | null>

  // Get referral stats
  static async getReferralStats(customerId: string): Promise<ReferralStats>

  // Get customer's referrals
  static async getCustomerReferrals(customerId: string, status?: string): Promise<Referral[]>
}
```

---

### lib/rewards/free-month-calculator.ts

Free month billing calculation logic.

**Key Functions**:

```typescript
export class FreeMonthCalculator {
  // Get pending free month rewards for customer
  static async getPendingRewards(customerId: string): Promise<Reward[]>

  // Apply free month to invoice
  static async applyFreeMonth(invoiceId: string, rewardId: string): Promise<void>

  // Calculate pro-rata free month amount
  static calculateProRata(
    monthlyPrice: number,
    periodStart: Date,
    periodEnd: Date
  ): number

  // Check if invoice qualifies for free month
  static async shouldApplyFreeMonth(
    customerId: string,
    serviceId: string
  ): Promise<Reward | null>

  // Expire old unused rewards (12 months)
  static async expireOldRewards(): Promise<number>
}
```

---

### lib/rewards/fraud-detection.ts

Fraud prevention validation.

**Key Functions**:

```typescript
export class FraudDetection {
  // Check for self-referral (email, phone, address match)
  static async isSelfReferral(referrerId: string, referredEmail: string): Promise<boolean>

  // Check for duplicate referrals (same email/customer)
  static async isDuplicateReferral(referralCode: string, email: string): Promise<boolean>

  // Check referral rate limiting (max 10/month)
  static async isRateLimited(customerId: string): Promise<boolean>

  // Check IP address patterns (same IP = suspicious)
  static async isSuspiciousIP(referrerId: string, ipAddress: string): Promise<boolean>

  // Flag referral for manual review
  static async flagForReview(referralId: string, reason: string): Promise<void>

  // Validate referrer eligibility (active service)
  static async isEligibleReferrer(customerId: string): Promise<boolean>
}
```

---

## Frontend Components

### components/dashboard/ReferralWidget.tsx

Dashboard widget showing referral progress and code.

**Props**: None (uses customer auth context)

**Features**:
- Display referral code with copy button
- Referral link with copy button
- Progress indicator (e.g., "1/2 referrals")
- List of referred customers with statuses
- Reward balance display
- Call-to-action: "Share with friends"

**Design**:
- Card component with orange accent (brand color)
- Framer Motion animations for progress updates
- Mobile-responsive layout
- Share buttons (WhatsApp, Email)

---

### components/admin/customers/ReferralManagement.tsx

Admin interface for managing customer referrals.

**Props**:
```typescript
interface ReferralManagementProps {
  customerId: string;
}
```

**Features**:
- Display customer's referral code
- Table of referrals with filtering
- Stats cards (total, active, rewards)
- Grant reward button with modal
- Revoke reward button with confirmation
- Audit log of admin actions

---

### app/admin/customers/[id]/referrals/page.tsx

Full-page admin view of customer referrals.

**Features**:
- Header with customer info and referral code
- Three-tab layout:
  - **Referrals**: Table of all referrals
  - **Rewards**: Table of earned/applied rewards
  - **Audit Log**: Admin action history
- Quick actions: Grant reward, View customer profile

---

## Architecture

See `architecture.md` for detailed diagrams.

**Key Flows**:

1. **Referral Signup Flow**:
   ```
   New User → URL with ?ref=CODE → localStorage → Order Creation
   → Validate Code → Create Referral Record → Email Referrer
   ```

2. **Service Activation Flow**:
   ```
   Order Completed → Service Activated → Check Referrals
   → Mark Referral Active → Check Reward Eligibility
   → Create Reward if 2+ Active → Email Notification
   ```

3. **Billing Application Flow**:
   ```
   Billing Cycle → Check Pending Rewards → Apply Free Month
   → Create Invoice (amount = 0) → Update Reward Status
   → Email Confirmation
   ```

---

## Security & Fraud Prevention

### Validation Rules

1. **Self-Referral Prevention**:
   - Check email, phone, installation address
   - Flag if any match existing customer

2. **Rate Limiting**:
   - Max 10 referrals per customer per month
   - Prevents bulk abuse

3. **Duplicate Prevention**:
   - Unique constraint on (referrer_id, referred_email)
   - Referral code can only be used once per email

4. **IP Tracking**:
   - Record IP address on signup
   - Flag if same IP used for multiple referrals

5. **Activation Requirement**:
   - Referred customer must activate service within 30 days
   - Service must remain active for 30 days to count

6. **Referrer Eligibility**:
   - Referrer must have active service (not cancelled/suspended)
   - Referrer account must be in good standing (no overdue invoices)

### Admin Controls

- Manual reward granting/revocation with audit trail
- Flagged referrals dashboard for review
- Email alerts for suspicious activity (>5 referrals in 24 hours)

---

## Billing Integration

### Integration Points

#### 1. CompliantBillingService.generateInvoice()

**Location**: `lib/billing/compliant-billing-service.ts`

**Changes**:
```typescript
// Before creating invoice, check for pending free month rewards
const reward = await FreeMonthCalculator.shouldApplyFreeMonth(customer_id, service_id);

if (reward) {
  // Apply free month
  invoice.is_free_month = true;
  invoice.referral_reward_id = reward.id;
  invoice.total_amount = 0;
  invoice.line_items.push({
    description: 'Referral Reward - Free Month',
    quantity: 1,
    unit_price: -monthly_price,
    amount: -monthly_price,
    type: 'adjustment'
  });

  // Update reward status
  await FreeMonthCalculator.applyFreeMonth(invoice.id, reward.id);
}
```

#### 2. Pro-Rata Calculation

For customers who started service mid-month:

```typescript
const daysInMonth = getDaysInMonth(billingMonth);
const daysUsed = getDaysUsed(serviceStartDate, billingMonth);
const proRataAmount = (monthlyPrice / daysInMonth) * daysUsed;

// Waive only the pro-rata amount
invoice.total_amount = 0;
invoice.line_items.push({
  description: `Referral Reward - Free Month (Pro-rata: ${daysUsed}/${daysInMonth} days)`,
  quantity: 1,
  unit_price: -proRataAmount,
  amount: -proRataAmount,
  type: 'adjustment'
});
```

---

## Testing Strategy

### Unit Tests

**lib/rewards/referral-service.test.ts**:
- ✅ Generate unique referral codes
- ✅ Validate referral codes
- ✅ Create referral records
- ✅ Activate referrals
- ✅ Grant rewards after 2 active referrals
- ✅ Calculate referral stats

**lib/rewards/free-month-calculator.test.ts**:
- ✅ Get pending rewards
- ✅ Apply free month to invoice
- ✅ Calculate pro-rata amounts
- ✅ Expire old rewards (12 months)

**lib/rewards/fraud-detection.test.ts**:
- ✅ Detect self-referral (email match)
- ✅ Detect self-referral (phone match)
- ✅ Detect duplicate referrals
- ✅ Enforce rate limiting (10/month)
- ✅ Flag suspicious IPs

### Integration Tests

**app/api/customer/referrals/route.test.ts**:
- ✅ Generate referral code (authenticated)
- ✅ Reject unauthenticated requests
- ✅ Return existing code if already exists

**app/api/admin/customers/[id]/referrals/grant/route.test.ts**:
- ✅ Grant reward with admin auth
- ✅ Reject without admin permissions
- ✅ Create audit log entry

### E2E Tests

**tests/e2e/referral-flow.spec.ts**:
- ✅ Complete referral flow (signup → activate → reward)
- ✅ Dashboard displays referral code
- ✅ Referral link works in signup flow
- ✅ Reward appears in balance after 2 referrals
- ✅ Free month applied to next invoice

**tests/e2e/admin-referrals.spec.ts**:
- ✅ Admin views customer referrals
- ✅ Admin grants manual reward
- ✅ Admin revokes unused reward
- ✅ Audit log displays actions

### Fraud Prevention Tests

**tests/fraud/self-referral.spec.ts**:
- ✅ Block self-referral (same email)
- ✅ Block self-referral (same phone)
- ✅ Block referral from suspended account

**tests/fraud/rate-limiting.spec.ts**:
- ✅ Block 11th referral in same month
- ✅ Allow referrals in new month

---

## Risk Assessment

### Risk Level: Medium

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Referral Fraud** | High | Medium | Comprehensive fraud detection, IP tracking, manual review |
| **Billing Integration Bugs** | High | Low | Thorough testing, staged rollout, easy rollback |
| **Performance (Referral Checks)** | Medium | Low | Indexed queries, caching, async processing |
| **Email Delivery Failures** | Low | Medium | Non-blocking, retry logic, audit log |
| **Database Migration Errors** | High | Low | Test in staging, backup before migration |

### Mitigation Strategies

1. **Fraud Prevention**:
   - Implement all validation rules from day 1
   - Admin dashboard for flagged referrals
   - Automated email alerts for suspicious activity

2. **Billing Safety**:
   - Feature flag to disable free month application
   - Dry-run mode in staging
   - Rollback script prepared

3. **Performance**:
   - Database indexes on all query paths
   - Cache referral counts (5-minute TTL)
   - Async reward granting (not blocking service activation)

4. **Monitoring**:
   - Track referral conversion rate
   - Monitor fraud flag rate
   - Alert on billing errors

---

## Deployment Plan

### Phase 1: Database (Week 1)

1. Create migration file
2. Test in local environment
3. Deploy to staging
4. Validate schema and RLS policies
5. Deploy to production (off-hours)

### Phase 2: Backend Services (Week 2)

1. Implement referral service
2. Implement free month calculator
3. Implement fraud detection
4. Unit tests (>80% coverage)
5. Deploy to staging
6. Integration testing

### Phase 3: API Endpoints (Week 2-3)

1. Implement customer endpoints
2. Implement admin endpoints
3. API tests
4. Deploy to staging
5. Postman/API testing

### Phase 4: Frontend (Week 3)

1. Build referral widget
2. Integrate into dashboard
3. Build admin interface
4. Mobile responsive testing
5. Deploy to staging

### Phase 5: Billing Integration (Week 3-4)

1. Update CompliantBillingService
2. Add free month logic
3. Pro-rata calculation
4. Unit tests
5. Staging testing with test invoices
6. Production deployment (behind feature flag)

### Phase 6: Testing & Launch (Week 4)

1. E2E testing on staging
2. Load testing (simulate 100 concurrent referrals)
3. Security review
4. Fraud prevention validation
5. Production deployment
6. Monitor for 48 hours
7. Full release (remove feature flag)

### Rollback Plan

- Feature flag: `ENABLE_REFERRAL_REWARDS`
- If critical bug: Set flag to `false` (disables reward application)
- Database rollback: `20251201_rollback_referral_system.sql`

---

## Open Questions

1. **Reward Stacking**: Can customer use multiple free months consecutively?
   - **Decision**: Yes, but only one per billing cycle

2. **Partial Refunds**: If customer cancels mid-month during free month, any refund?
   - **Decision**: No, free month is non-refundable

3. **Service Upgrades**: Does free month apply to upgraded service price?
   - **Decision**: Yes, applied to current monthly price at billing time

4. **Multiple Services**: Can customer earn rewards across multiple services?
   - **Decision**: Yes, referrals count toward customer account (not per service)

5. **Retroactive Referrals**: Should we honor referrals from before system launch?
   - **Decision**: No, only new referrals after launch date

---

## Success Metrics (Post-Launch)

**Week 1-2**:
- Referral code generation rate
- Referral signup conversion rate
- Fraud flag rate

**Month 1**:
- Total referrals created
- Active referral rate (30-day retention)
- Rewards earned vs. rewards applied
- Customer acquisition cost (CAC) reduction

**Month 3**:
- Viral coefficient (K-factor)
- Customer lifetime value (LTV) of referred customers
- Program ROI
- Fraud rate

---

**Document Version**: 1.0
**Maintained By**: Development Team + Claude Code
**Last Updated**: 2025-12-01
