# Customer Referral & Rewards System - Task Breakdown

**Spec ID**: `20251201-customer-referral-rewards`
**Total Story Points**: 47
**Estimated Duration**: 3-4 weeks

---

## Task Groups Overview

| Group | Engineer | Tasks | Story Points | Duration |
|-------|----------|-------|--------------|----------|
| Group 1 | Database Engineer | Schema, migrations, RLS | 5 | 2 days |
| Group 2 | Backend Engineer | Services, business logic | 14 | 5 days |
| Group 3 | API Engineer | Endpoints, validation | 10 | 4 days |
| Group 4 | Frontend Engineer | UI components, dashboard | 10 | 4 days |
| Group 5 | Testing Engineer | Tests, fraud prevention | 8 | 3 days |
| **TOTAL** | - | **23 tasks** | **47** | **3-4 weeks** |

---

## Group 1: Database Engineer

**Responsible**: Database Engineer
**Story Points**: 5
**Duration**: 2 days

### Tasks

#### Task 1.1: Create Database Migration
**Story Points**: 2
**Priority**: Critical (blocking)

Create migration file: `supabase/migrations/20251201_create_referral_system.sql`

**Deliverables**:
- [ ] Create `customer_referrals` table with all fields
- [ ] Create `referral_rewards` table with all fields
- [ ] Add `referral_code` column to `customers` table
- [ ] Add `is_free_month` and `referral_reward_id` columns to `customer_invoices` table
- [ ] Create auto-generation trigger for referral codes
- [ ] Create all indexes for performance
- [ ] Add proper foreign key constraints

**Validation**:
- Migration runs without errors
- All tables created with correct schema
- Referral codes auto-generated on customer insert

---

#### Task 1.2: Implement RLS Policies
**Story Points**: 2
**Priority**: Critical

Create Row Level Security policies for referral tables.

**Deliverables**:
- [ ] Enable RLS on `customer_referrals` table
- [ ] Customer SELECT policy (own referrals only)
- [ ] Admin ALL policy (with permission check)
- [ ] Enable RLS on `referral_rewards` table
- [ ] Customer SELECT policy (own rewards only)
- [ ] Admin ALL policy (with permission check)
- [ ] Test policies with different user contexts

**Validation**:
- Customers can only see their own referrals/rewards
- Admins can see all referrals/rewards
- Unauthenticated users have no access

---

#### Task 1.3: Create Database Indexes
**Story Points**: 1
**Priority**: High

Add performance indexes for common queries.

**Deliverables**:
- [ ] Index on `customer_referrals(referrer_id, status)`
- [ ] Index on `customer_referrals(referral_code)`
- [ ] Index on `customer_referrals(referred_customer_id)`
- [ ] Index on `referral_rewards(customer_id, status)`
- [ ] Index on `referral_rewards(applied_to_invoice_id)`
- [ ] Index on `customers(referral_code)`
- [ ] Index on `customer_invoices(referral_reward_id)`

**Validation**:
- EXPLAIN ANALYZE shows index usage on queries
- Query performance < 50ms for typical referral lookups

---

## Group 2: Backend Engineer

**Responsible**: Backend Engineer
**Story Points**: 14
**Duration**: 5 days

### Tasks

#### Task 2.1: Implement ReferralService
**Story Points**: 5
**Priority**: Critical (blocking)

Create `lib/rewards/referral-service.ts`

**Deliverables**:
- [ ] `getOrCreateReferralCode(customerId)` - Generate/retrieve code
- [ ] `validateReferralCode(code)` - Check code exists and is valid
- [ ] `createReferral(params)` - Create referral record
- [ ] `activateReferral(referralId)` - Mark referral active on service activation
- [ ] `checkAndGrantReward(customerId)` - Check if 2+ active referrals, create reward
- [ ] `getReferralStats(customerId)` - Count total/active/pending referrals
- [ ] `getCustomerReferrals(customerId, status?)` - List referrals with filtering
- [ ] Error handling and logging
- [ ] TypeScript types for all functions

**Validation**:
- All functions work with test data
- Referral codes unique and non-guessable
- Reward granted after 2nd active referral
- Stats calculations accurate

---

#### Task 2.2: Implement FreeMonthCalculator
**Story Points**: 5
**Priority**: Critical

Create `lib/rewards/free-month-calculator.ts`

**Deliverables**:
- [ ] `getPendingRewards(customerId)` - Fetch pending free month rewards
- [ ] `shouldApplyFreeMonth(customerId, serviceId)` - Check eligibility
- [ ] `applyFreeMonth(invoiceId, rewardId)` - Apply reward to invoice
- [ ] `calculateProRata(monthlyPrice, periodStart, periodEnd)` - Pro-rata calculation
- [ ] `expireOldRewards()` - Mark rewards expired after 12 months
- [ ] Integration with `CompliantBillingService`
- [ ] Error handling
- [ ] TypeScript types

**Validation**:
- Free month correctly applied to invoices
- Pro-rata calculation accurate (test with mid-month scenarios)
- Rewards expire after 12 months
- Only one reward applied per billing cycle

---

#### Task 2.3: Implement FraudDetection
**Story Points**: 4
**Priority**: High

Create `lib/rewards/fraud-detection.ts`

**Deliverables**:
- [ ] `isSelfReferral(referrerId, referredEmail)` - Check email/phone/address match
- [ ] `isDuplicateReferral(referralCode, email)` - Check duplicate referrals
- [ ] `isRateLimited(customerId)` - Enforce 10 referrals/month limit
- [ ] `isSuspiciousIP(referrerId, ipAddress)` - Check IP patterns
- [ ] `flagForReview(referralId, reason)` - Flag suspicious referrals
- [ ] `isEligibleReferrer(customerId)` - Validate referrer has active service
- [ ] Error handling
- [ ] TypeScript types

**Validation**:
- Self-referral blocked (email match)
- Self-referral blocked (phone match)
- Duplicate referrals blocked
- Rate limiting enforced (11th referral rejected)
- Suspicious IPs flagged

---

## Group 3: API Engineer

**Responsible**: API Engineer
**Story Points**: 10
**Duration**: 4 days

### Tasks

#### Task 3.1: Customer Referral Endpoints
**Story Points**: 4
**Priority**: Critical

Create customer-facing API endpoints.

**Deliverables**:
- [ ] `POST /api/customer/referrals` - Generate/get referral code
- [ ] `GET /api/customer/referrals` - List customer's referrals
- [ ] `GET /api/customer/referral-balance` - Get reward balance
- [ ] Authentication middleware (customer session required)
- [ ] Input validation
- [ ] Error handling (404, 401, 500)
- [ ] Response formatting (consistent JSON structure)

**Validation**:
- Authenticated requests succeed
- Unauthenticated requests return 401
- Response format matches spec
- Error messages are clear

---

#### Task 3.2: Admin Referral Endpoints
**Story Points**: 4
**Priority**: High

Create admin management endpoints.

**Deliverables**:
- [ ] `GET /api/admin/customers/[id]/referrals` - View customer referrals
- [ ] `POST /api/admin/customers/[id]/referrals/grant` - Grant manual reward
- [ ] `POST /api/admin/customers/[id]/referrals/revoke` - Revoke reward
- [ ] Admin authentication (RBAC check for `billing:manage_invoices`)
- [ ] Input validation (required fields)
- [ ] Audit logging for all admin actions
- [ ] Error handling

**Validation**:
- Admin with permission can access endpoints
- Admin without permission gets 403
- Audit log entries created for all actions
- Email notifications sent on grant/revoke

---

#### Task 3.3: Referral Code Validation in Order Flow
**Story Points**: 2
**Priority**: Critical

Integrate referral code validation into order creation.

**Deliverables**:
- [ ] Update `app/(public)/packages/[leadId]/page.tsx` - Capture `?ref=` param
- [ ] Store referral code in localStorage if not signed up
- [ ] Update `app/order/account/page.tsx` - Validate code during signup
- [ ] Create referral record on successful order
- [ ] Error handling (invalid code, expired code)
- [ ] Display referrer name during signup

**Validation**:
- Referral code captured from URL
- Code persists in localStorage across pages
- Invalid codes show error message
- Valid codes create referral record
- Referrer receives email notification

---

## Group 4: Frontend Engineer

**Responsible**: Frontend Engineer
**Story Points**: 10
**Duration**: 4 days

### Tasks

#### Task 4.1: Referral Widget Component
**Story Points**: 5
**Priority**: Critical

Create `components/dashboard/ReferralWidget.tsx`

**Deliverables**:
- [ ] Card component with referral code display
- [ ] Copy to clipboard button (referral code)
- [ ] Full referral link with copy button
- [ ] Progress indicator (e.g., "1/2 referrals")
- [ ] List of referred customers with statuses (badges)
- [ ] Reward balance display
- [ ] Share buttons (WhatsApp, Email) - optional phase 2
- [ ] Framer Motion animations
- [ ] Mobile responsive design
- [ ] Loading and error states

**Validation**:
- Widget displays correctly on dashboard
- Copy buttons work
- Progress updates in real-time
- Mobile layout looks good
- Animations smooth

---

#### Task 4.2: Integrate Widget into Dashboard
**Story Points**: 2
**Priority**: Critical

Update `app/dashboard/page.tsx`

**Deliverables**:
- [ ] Import and add `ReferralWidget` component
- [ ] Position widget (below stats cards, above quick actions)
- [ ] Fetch referral data from API
- [ ] Handle loading state
- [ ] Handle error state (show fallback message)
- [ ] Mobile responsive layout

**Validation**:
- Widget appears on dashboard
- Data loads correctly
- No layout shift on load
- Works on mobile

---

#### Task 4.3: Admin Referral Management Interface
**Story Points**: 3
**Priority**: High

Create admin referral management components.

**Deliverables**:
- [ ] `components/admin/customers/ReferralManagement.tsx` - Main component
- [ ] Display customer's referral code
- [ ] Table of referrals with filtering (status dropdown)
- [ ] Stats cards (total, active, rewards)
- [ ] Grant reward button with modal (reason input required)
- [ ] Revoke reward button with confirmation dialog
- [ ] Audit log section (read-only table)
- [ ] Create `app/admin/customers/[id]/referrals/page.tsx` - Full page view
- [ ] Three-tab layout (Referrals, Rewards, Audit Log)

**Validation**:
- Admin can view customer referrals
- Grant/revoke buttons work
- Confirmation modals prevent accidental actions
- Audit log displays correctly
- Table filtering works

---

## Group 5: Testing Engineer

**Responsible**: Testing Engineer
**Story Points**: 8
**Duration**: 3 days

### Tasks

#### Task 5.1: Unit Tests
**Story Points**: 3
**Priority**: High

Write comprehensive unit tests for services.

**Deliverables**:
- [ ] `lib/rewards/referral-service.test.ts` (8+ tests)
  - Generate unique referral codes
  - Validate referral codes
  - Create referral records
  - Activate referrals
  - Grant rewards after 2 active referrals
- [ ] `lib/rewards/free-month-calculator.test.ts` (6+ tests)
  - Get pending rewards
  - Apply free month to invoice
  - Calculate pro-rata amounts
  - Expire old rewards
- [ ] `lib/rewards/fraud-detection.test.ts` (8+ tests)
  - Detect self-referral (email)
  - Detect self-referral (phone)
  - Detect duplicate referrals
  - Enforce rate limiting
  - Flag suspicious IPs
- [ ] Achieve >80% code coverage

**Validation**:
- All tests pass
- Code coverage >80%
- Edge cases covered

---

#### Task 5.2: Integration Tests
**Story Points**: 2
**Priority**: High

Write API integration tests.

**Deliverables**:
- [ ] `app/api/customer/referrals/route.test.ts` (5+ tests)
  - Generate referral code (authenticated)
  - Reject unauthenticated requests
  - Return existing code if already exists
- [ ] `app/api/admin/customers/[id]/referrals/grant/route.test.ts` (5+ tests)
  - Grant reward with admin auth
  - Reject without admin permissions
  - Create audit log entry
  - Send email notification
- [ ] Mock Supabase client for testing

**Validation**:
- All integration tests pass
- Authentication properly enforced
- Error handling works

---

#### Task 5.3: E2E Tests
**Story Points**: 3
**Priority**: Critical

Write end-to-end tests for critical flows.

**Deliverables**:
- [ ] `tests/e2e/referral-flow.spec.ts` (6+ scenarios)
  - Complete referral flow (signup → activate → reward)
  - Dashboard displays referral code
  - Referral link works in signup flow
  - Reward appears after 2 referrals
  - Free month applied to next invoice
  - Email notifications sent
- [ ] `tests/e2e/admin-referrals.spec.ts` (5+ scenarios)
  - Admin views customer referrals
  - Admin grants manual reward
  - Admin revokes unused reward
  - Audit log displays actions
- [ ] `tests/fraud/self-referral.spec.ts` (4+ scenarios)
  - Block self-referral (same email)
  - Block self-referral (same phone)
  - Block referral from suspended account
- [ ] `tests/fraud/rate-limiting.spec.ts` (3+ scenarios)
  - Block 11th referral in same month
  - Allow referrals in new month

**Validation**:
- All E2E tests pass
- Fraud prevention works
- Email notifications sent
- No regressions

---

## Dependencies & Sequencing

### Critical Path

```
Group 1 (Database) → Group 2 (Backend) → Group 3 (API) → Group 4 (Frontend)
                                      ↓
                                  Group 5 (Testing)
```

### Parallel Work Opportunities

- **Week 1**: Database Engineer (Group 1) + Testing Engineer starts test setup
- **Week 2**: Backend Engineer (Group 2) + API Engineer (Group 3) work in parallel
- **Week 3**: Frontend Engineer (Group 4) + Testing Engineer (Group 5) work in parallel
- **Week 4**: Integration testing, bug fixes, deployment

### Blocking Dependencies

| Task | Blocks | Reason |
|------|--------|--------|
| Task 1.1 (Migration) | All other tasks | Database schema required |
| Task 1.2 (RLS) | Group 3, 4 | Security required before API |
| Task 2.1 (ReferralService) | Task 3.1, 3.3 | Business logic required |
| Task 2.2 (FreeMonthCalculator) | Task 3.2 | Billing logic required |
| Task 3.1 (Customer API) | Task 4.1, 4.2 | API needed for widget |
| Task 3.2 (Admin API) | Task 4.3 | API needed for admin UI |

---

## Daily Standup Template

### Day 1 (Database Engineer)
- **Yesterday**: N/A (project start)
- **Today**: Create migration file (Task 1.1)
- **Blockers**: None

### Day 2 (Database Engineer)
- **Yesterday**: Created migration
- **Today**: Implement RLS policies (Task 1.2) + indexes (Task 1.3)
- **Blockers**: None

### Day 3 (Backend Engineer)
- **Yesterday**: Migration deployed to staging
- **Today**: Start ReferralService (Task 2.1)
- **Blockers**: Waiting for migration in local env

### Day 4-5 (Backend Engineer)
- **Yesterday**: ReferralService in progress
- **Today**: Complete ReferralService, start FreeMonthCalculator (Task 2.2)
- **Blockers**: None

### Day 6-7 (Backend + API Engineer)
- **Yesterday**: Backend services complete
- **Today**: API Engineer starts customer endpoints (Task 3.1), Backend starts FraudDetection (Task 2.3)
- **Blockers**: None

### Day 8-10 (API + Frontend Engineer)
- **Yesterday**: Customer API complete
- **Today**: Frontend starts ReferralWidget (Task 4.1), API works on admin endpoints (Task 3.2)
- **Blockers**: None

### Day 11-14 (Frontend + Testing)
- **Yesterday**: Widget integrated
- **Today**: Admin UI (Task 4.3), E2E tests (Task 5.3)
- **Blockers**: None

### Day 15-18 (Testing + Bug Fixes)
- **Yesterday**: All features complete
- **Today**: Final testing, bug fixes, staging deployment
- **Blockers**: Any critical bugs from testing

---

## Definition of Done (DoD)

Each task is considered "done" when:

- [ ] Code implemented and follows project conventions
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written (if applicable)
- [ ] Code reviewed by peer
- [ ] Documentation updated (JSDoc comments)
- [ ] Tested in local environment
- [ ] Deployed to staging
- [ ] QA validation passed
- [ ] No console errors or warnings
- [ ] TypeScript types properly defined
- [ ] Accessibility checked (WCAG AA)
- [ ] Mobile responsive (tested on 3 screen sizes)

---

## Success Criteria (Final Checklist)

### Functional
- [ ] Customers can generate referral codes
- [ ] Referral tracking works end-to-end
- [ ] Rewards granted after 2 active referrals
- [ ] Free month applied to billing correctly
- [ ] Admin can manage referrals and rewards
- [ ] Fraud prevention rules enforced

### Technical
- [ ] Database migration successful (staging + production)
- [ ] RLS policies secure data access
- [ ] API endpoints authenticated and authorized
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance: Queries < 200ms
- [ ] No regressions in existing features

### User Experience
- [ ] Dashboard widget displays correctly
- [ ] Referral code copy works (one-click)
- [ ] Progress indicator accurate
- [ ] Email notifications sent
- [ ] Admin interface intuitive
- [ ] Mobile responsive

---

**Document Version**: 1.0
**Maintained By**: Development Team + Claude Code
**Last Updated**: 2025-12-01
