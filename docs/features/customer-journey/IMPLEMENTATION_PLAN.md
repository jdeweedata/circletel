# ⚠️ SUPERSEDED - See MERGED_IMPLEMENTATION_PLAN.md

> **Superseded Date**: 2025-10-21
> **Superseded By**: `MERGED_IMPLEMENTATION_PLAN.md`
> **Reason**: Merged with MTN Product Mapping + Multi-Provider Architecture
>
> **New Documents** (2025-10-24):
> - ⭐ **VISUAL_CUSTOMER_JOURNEY.md** - Complete journey visualization with Mermaid diagrams
> - ⭐ **JOURNEY_IMPROVEMENTS.md** - 70+ UX, performance, and conversion optimizations
> - ⭐ **PAIN_POINTS_ANALYSIS.md** - Prioritized friction points with solutions
> - **MERGED_IMPLEMENTATION_PLAN.md** - Complete unified plan (18-19 days, multi-provider)
> - **TODO_BREAKDOWN.md** - Updated with Phase 1A (250+ tasks)
> - **MULTI_PROVIDER_ARCHITECTURE.md** - Technical architecture
> - **PROVIDER_INTEGRATION_TEMPLATE.md** - How to add new providers
>
> **What Changed**:
> - Added Phase 1A (3-4 days) for multi-provider foundation
> - MTN product catalog expanded (13 products)
> - Provider registry pattern for MetroFibre, Openserve, DFA, Vumatel
> - Timeline updated: 18-19 days (was 15 days)
> - Product mapping functions specified
>
> **Use This Document For**: Historical reference only
>
> **For Current Journey Analysis**: See [VISUAL_CUSTOMER_JOURNEY.md](./VISUAL_CUSTOMER_JOURNEY.md)

---

# CircleTel Customer Journey Implementation Plan (SUPERSEDED)
## BRS Section 4.1-4.3 Compliance Analysis & Roadmap

> **Status**: SUPERSEDED - Reference Only
> **Created**: 2025-10-21
> **Superseded**: 2025-10-21
> **BRS Reference**: Section 4.1 (Availability Check), 4.2 (Product Search), 4.3 (Order & Subscription)

---

## Executive Summary

The CircleTel platform has made significant progress on the customer journey implementation with a solid foundation in place. However, **~15 days of development work** remain to fully meet all requirements from the Business Requirements Specification (BRS) Section 4.1-4.3.

### Current Status Breakdown

| Component | Completion | Status |
|-----------|-----------|---------|
| **4.1 Availability Check** | 85% | ✅ Mostly Complete |
| **4.2 Product Search** | 90% | ✅ Mostly Complete |
| **4.3 Order & Subscription** | 60% | ⚠️ Partial |
| **Overall** | **75%** | ✅ **Foundation Ready** |

### Remaining Work Summary

- **P0 Critical** (5 days): Order tracking, notifications, KYC upload, payment validation
- **P1 High** (5 days): Business customer journey, quote system
- **P2 Medium** (3 days): Subscription management, billing dashboard
- **P3 Low** (2 days): UX optimizations, analytics

**Total Effort**: ~15 days (3 weeks for 1 developer)

---

## BRS Requirements Analysis

### 4.1 High-Speed Internet Availability Check

**Purpose**: Determine availability of high-speed internet services at a specific location

**Acceptance Criteria Status**:

| Requirement | Status | Implementation | File Reference |
|------------|--------|----------------|----------------|
| Enter address or use geolocation | ✅ Complete | Google Places autocomplete + browser geolocation | `/app/coverage/page.tsx:97-100` |
| System checks database for coverage | ✅ Complete | Multi-provider aggregation (MTN, DFA) | `/lib/coverage/aggregation-service.ts` |
| If covered, present packages | ✅ Complete | Dynamic package display with filtering | `/components/coverage/PricingGrid.tsx` |
| If not covered, register lead & notify sales | ⚠️ Partial | Lead created, Zoho sync exists, **no real-time alerts** | `/components/coverage/NoCoverageLeadForm.tsx` |

**Process Flow Implementation**:

```
User visits website ✅
  ↓
Enter address or geolocation ✅
  ↓
System queries database ✅
  → Multi-provider coverage check (MTN Business → MTN Consumer → DFA → Mock)
  ↓
If covered:
  → Display packages ✅ (/components/coverage/PricingGrid.tsx)
  → Filter by service type ✅ (Fibre, Wireless, 5G)
  → Show pricing with promotions ✅
  ↓
If not covered:
  → Register lead ✅ (coverage_leads table)
  → Sync to Zoho CRM ✅ (/lib/zoho/lead-capture.ts)
  → Notify sales team ❌ MISSING (no real-time alerts)
```

**Gaps**:
- ❌ **Real-time sales team notifications** - Email/SMS alerts when lead captured
- ❌ **UTM parameter tracking** - Lead source attribution missing
- ⚠️ **Progress indicators** - Generic spinner during 3-step API flow

---

### 4.2 Product Search and Selection

**Purpose**: Explore and identify best internet packages tailored to user's location

**Acceptance Criteria Status**:

| Requirement | Status | Implementation | File Reference |
|------------|--------|----------------|----------------|
| Enter address to check feasibility | ✅ Complete | Same as 4.1 | `/app/coverage/page.tsx` |
| Display tailored products/packages | ✅ Complete | Location-based filtering via API | `/api/coverage/packages/route.ts` |
| Browse, compare, select products | ✅ Complete | Package comparison tool | `/components/coverage/PackageComparison.tsx` |
| ISP manages order process | ✅ Complete | Multi-stage order wizard | `/components/order/wizard/OrderWizard.tsx` |

**Process Flow Implementation**:

```
User visits website ✅
  ↓
Enter address in Feasibility Engine ✅
  ↓
System displays tailored packages ✅
  → Filter by: Service Type (Fibre/Wireless/5G) ✅
  → Filter by: Speed ✅
  → Filter by: Price Range ✅
  → Promotional pricing display ✅
  ↓
User browses & compares ✅
  → Side-by-side comparison ✅ (/components/coverage/PackageComparison.tsx)
  → Feature lists ✅
  → "Get this deal" CTA ✅
  ↓
ISP manages order process ✅
  → Multi-stage wizard (Coverage → Contact → Installation → Payment → Confirmation)
```

**Gaps**:
- ⚠️ **Business customer differentiation** - SMME/Enterprise packages mixed with consumer
- ❌ **Quote generation for B2B** - No quote system implemented (database schema exists)
- ⚠️ **Package comparison UX** - Floating CTA needed (users must scroll to find button)

---

### 4.3 Order and Subscription

**Purpose**: Easily and securely finalize purchase and transition to subscriber

**Acceptance Criteria Status**:

| Requirement | Status | Implementation | File Reference |
|------------|--------|----------------|----------------|
| View summary of selected products | ✅ Complete | Sticky sidebar with order details | `/components/order/OrderSummary.tsx` |
| Proceed to checkout | ✅ Complete | Multi-stage wizard with progress | `/app/order/coverage/page.tsx` |
| Clear payment process | ⚠️ Partial | Netcash integration exists, **not fully tested** | `/app/order/payment/page.tsx` |
| Service activation instructions | ❌ Missing | **No post-payment email/page** | N/A |
| Potential subscription management | ❌ Missing | **No recurring billing UI** | N/A |

**Process Flow Implementation**:

```
User reviews product summary ✅
  → Order Summary component ✅ (/components/order/OrderSummary.tsx)
  → Pricing breakdown ✅
  → Installation fees ✅
  ↓
User proceeds to checkout ✅
  → Stage 1: Coverage confirmation ✅ (/app/order/coverage/page.tsx)
  → Stage 2: Contact details ✅ (/app/order/contact/page.tsx)
  → Stage 3: Installation scheduling ✅ (/app/order/installation/page.tsx)
  → Stage 4: Payment ⚠️ PARTIAL (/app/order/payment/page.tsx)
  → Stage 5: Confirmation ✅ (/app/order/confirmation/page.tsx)
  ↓
System guides payment process ⚠️
  → Netcash integration exists ✅
  → Payment validation ❌ MISSING
  → Error handling ❌ MISSING
  ↓
Service activation ❌ MISSING
  → No activation email with credentials
  → No customer-facing order status tracker
  → No "Next Steps" page
  ↓
Subscription management ❌ MISSING
  → No service dashboard
  → No upgrade/downgrade flow
  → No payment method management
  → No invoice history
```

**Critical Gaps**:
- ❌ **Order status tracking page** - No `/orders/[orderId]` page
- ❌ **Service activation email** - No post-payment notification with credentials
- ❌ **KYC document upload** - Database schema exists, no UI
- ❌ **Subscription management** - No service dashboard
- ⚠️ **Payment validation** - Netcash not fully tested

---

## Implementation Status by Component

### ✅ What's Already Built (75% Complete)

| Feature | Status | File Reference | Notes |
|---------|--------|----------------|-------|
| Coverage Checker | ✅ Complete | `/app/coverage/page.tsx` | Address autocomplete + geolocation |
| Multi-Provider Coverage | ✅ Complete | `/lib/coverage/aggregation-service.ts` | 4-layer fallback (MTN Business → Consumer → DFA → Mock) |
| Package Display | ✅ Complete | `/components/coverage/PricingGrid.tsx` | Dynamic filtering, promotions |
| Package Comparison | ✅ Complete | `/components/coverage/PackageComparison.tsx` | Side-by-side comparison |
| Lead Capture (No Coverage) | ✅ Complete | `/components/coverage/NoCoverageLeadForm.tsx` | Database + Zoho sync |
| Order Wizard | ✅ Complete | `/components/order/wizard/OrderWizard.tsx` | Multi-stage flow with progress |
| Customer Details Form | ✅ Complete | `/app/order/contact/page.tsx` | Contact info collection |
| Installation Scheduling | ✅ Complete | `/app/order/installation/page.tsx` | Date/time selection |
| Order Confirmation | ✅ Complete | `/app/order/confirmation/page.tsx` | Post-order summary |
| Database Schema | ✅ Complete | `20251019000003_create_customer_journey_system.sql` | 5 tables (coverage_leads, consumer_orders, business_quotes, kyc_documents, order_status_history) |
| Zoho CRM Integration | ✅ Complete | `/lib/zoho/lead-capture.ts` | Lead sync with custom fields |
| Notification Service | ✅ Complete | `/lib/notifications/notification-service.ts` | Email/SMS templates (10 templates ready) |
| Order State Persistence | ✅ Complete | `/components/order/context/OrderContext.tsx` | localStorage integration |

### ❌ What Needs to Be Built (25% Remaining)

#### P0 - Critical (Blocking MVP) - 5 Days

| Feature | Effort | Phase | File to Create | Priority |
|---------|--------|-------|----------------|----------|
| Order Status Tracking Page | 1 day | Phase 1 | `/app/orders/[orderId]/page.tsx` | P0 |
| Service Activation Email | 0.5 days | Phase 1 | Email template update | P0 |
| Sales Team Real-Time Alerts | 0.5 days | Phase 1 | `/lib/notifications/sales-alerts.ts` | P0 |
| KYC Document Upload UI | 1.5 days | Phase 1 | `/components/order/KycDocumentUpload.tsx` | P0 |
| Payment Validation & Testing | 1 day | Phase 1 | Update `/app/order/payment/page.tsx` | P0 |

#### P1 - High (Customer Experience) - 5 Days

| Feature | Effort | Phase | File to Create | Priority |
|---------|--------|-------|----------------|----------|
| Business Landing Page | 0.75 days | Phase 2 | `/app/business/page.tsx` | P1 |
| Quote Request Form | 0.75 days | Phase 2 | `/app/business/quote/page.tsx` | P1 |
| Admin Quote Builder | 1 day | Phase 2 | `/app/admin/quotes/[quoteId]/edit/page.tsx` | P1 |
| Customer Quote View | 0.5 days | Phase 2 | `/app/quotes/[quoteId]/page.tsx` | P1 |
| Business Customer Dashboard | 1 day | Phase 2 | `/app/account/business/page.tsx` | P1 |

#### P2 - Medium (Scale & Retention) - 3 Days

| Feature | Effort | Phase | File to Create | Priority |
|---------|--------|-------|----------------|----------|
| Service Management Dashboard | 1.5 days | Phase 3 | Enhance `/app/account/page.tsx` | P2 |
| Payment Methods Management | 0.5 days | Phase 3 | `/app/account/payment-methods/page.tsx` | P2 |
| Invoice History | 0.5 days | Phase 3 | `/app/account/invoices/page.tsx` | P2 |

#### P3 - Low (Polish) - 2 Days

| Feature | Effort | Phase | File to Create | Priority |
|---------|--------|-------|----------------|----------|
| Multi-Stage Progress Indicator | 0.5 days | Phase 4 | Update `/components/coverage/CoverageChecker.tsx` | P3 |
| Floating CTA Button | 0.25 days | Phase 4 | Update `/components/coverage/PricingGrid.tsx` | P3 |
| UTM Parameter Tracking | 0.25 days | Phase 4 | Update `/app/api/coverage/leads/route.ts` | P3 |

---

## Database Schema Status

### ✅ Implemented Tables (Migration: 20251019000003)

1. **`coverage_leads`** - Lead capture from coverage checker
   - Customer information (name, email, phone, company)
   - Address with coordinates (JSONB)
   - Coverage check details (service type, speed, budget)
   - Zoho CRM integration (lead_id, sync_status, sync_error)
   - Follow-up tracking (next_follow_up_at, contact_preference)
   - **Status**: ✅ Fully implemented

2. **`consumer_orders`** - B2C order tracking
   - Customer contact info
   - Installation & billing addresses
   - Product selection (package_id, speed, price, router)
   - Payment tracking (method, status, reference, total_paid)
   - Order status (16 states: pending → active)
   - Installation details (scheduled_date, technician_notes)
   - Activation details (activation_date, account_number)
   - **Status**: ✅ Fully implemented, ⚠️ No UI for tracking

3. **`business_quotes`** - B2B quote generation
   - Company information (registration, VAT, industry, size)
   - Contact person details
   - Service requirements (package, connections, add-ons)
   - Pricing breakdown (monthly, installation, discounts, VAT, total)
   - Quote lifecycle (sent_at, viewed_at, accepted_at, rejected_at)
   - Sales tracking (sales_rep_id, lead_source, campaign)
   - **Status**: ✅ Database ready, ❌ No UI

4. **`kyc_documents`** - KYC/FICA document storage
   - Document owner (consumer_order_id OR business_quote_id)
   - Document details (type, title, file_path, file_size, mime_type)
   - Document metadata (number, issue_date, expiry_date)
   - Verification status (pending, approved, rejected)
   - Security (is_sensitive, encrypted, access_log)
   - **Status**: ✅ Database ready, ❌ No upload UI

5. **`order_status_history`** - Audit trail for status changes
   - Entity reference (consumer_order, business_quote, coverage_lead)
   - Status change (old_status, new_status, status_changed_at)
   - Change tracking (changed_by, change_reason, automated)
   - Customer notification (notified, sent_at, notification_method)
   - **Status**: ✅ Fully implemented with triggers

---

## Execution Roadmap

### Week 1: Phase 1 - Critical Fixes (MVP Ready)

**Goal**: Make customer journey end-to-end functional for production deployment

**Days**: 5 working days

**Focus**: Fix P0 gaps blocking customer journey

**Deliverables**:
- Order status tracking page
- Service activation email system
- Sales team real-time alerts
- KYC document upload UI
- Payment validation & error handling

**Outcome**: End-to-end B2C journey functional and deploy-ready

**See**: `PHASE_1_CRITICAL_FIXES.md` for detailed tasks

---

### Week 2: Phase 2 - B2B Journey (Revenue Expansion)

**Goal**: Enable business customer journey and quote system

**Days**: 5 working days

**Focus**: Separate B2B flow from B2C, implement quote generation

**Deliverables**:
- Business landing page
- Quote request form
- Admin quote builder with PDF export
- Customer quote view & acceptance
- Business customer dashboard

**Outcome**: Can properly handle B2B customers with quote workflow

**See**: `PHASE_2_B2B_JOURNEY.md` for detailed tasks

---

### Week 3: Phase 3 + 4 - Self-Service & Polish (Retention)

**Goal**: Post-activation customer portal and UX optimizations

**Days**: 5 working days (3 days Phase 3 + 2 days Phase 4)

**Focus**: Customer self-service, subscription management, UX improvements

**Deliverables**:
- Service management dashboard
- Payment methods management
- Invoice history
- Multi-stage progress indicators
- Floating CTA buttons
- UTM tracking

**Outcome**: Customers can manage services independently, improved conversion

**See**: `PHASE_3_SUBSCRIPTION_MGMT.md` and `PHASE_4_UX_OPTIMIZATIONS.md` for detailed tasks

---

## Quality Gates

### Phase 1 Completion Criteria

- [ ] Order status page loads in < 2 seconds
- [ ] Order status updates in real-time (database triggers working)
- [ ] Service activation email sent within 1 minute of order activation
- [ ] Sales team receives email/SMS within 30 seconds of lead capture
- [ ] KYC documents upload successfully to Supabase Storage
- [ ] KYC verification workflow functional (approve/reject)
- [ ] Payment errors display user-friendly messages
- [ ] Payment retry works without restarting flow
- [ ] All Netcash test cases pass (success, decline, abandon)
- [ ] Mobile responsive (tested on 320px, 375px, 768px, 1920px)

### Phase 2 Completion Criteria

- [ ] Business landing page displays SMME packages only
- [ ] Quote request form validates all required fields
- [ ] Quote PDF generates with CircleTel branding
- [ ] Quote email sends with PDF attachment
- [ ] Customer can accept/reject quote
- [ ] Quote acceptance converts to order
- [ ] Business dashboard shows all company orders/quotes
- [ ] Multi-location support works

### Phase 3 + 4 Completion Criteria

- [ ] Customer can view all active services
- [ ] Service upgrade/downgrade calculates prorated pricing
- [ ] Payment method can be added/deleted securely
- [ ] Auto-pay toggle works
- [ ] Invoice PDFs download correctly
- [ ] Progress indicator shows 3 stages during coverage check
- [ ] Floating CTA appears when package selected
- [ ] UTM parameters captured in lead records
- [ ] E2E tests pass for consumer and business journeys

---

## Testing Strategy

### E2E Test Scenarios

**Consumer Journey (4.1 → 4.2 → 4.3)**:
1. Homepage → Coverage checker → Enter address
2. Coverage available → View packages → Select package
3. Order wizard → Contact details → Installation → Payment
4. Order confirmation → Status tracking → Service activation

**Business Journey (4.1 → 4.2 → Quote)**:
1. Business landing → Coverage checker → Enter address
2. Coverage available → View business packages → Request quote
3. Sales team receives quote request → Builds quote → Sends quote
4. Customer views quote → Accepts → Converts to order

**No Coverage Journey (4.1 Lead Capture)**:
1. Homepage → Coverage checker → Enter address
2. No coverage → Lead capture form → Submit
3. Lead created in database → Zoho sync → Sales team alert

### Performance Benchmarks

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Homepage Load | < 2s | ✅ ~1.5s | Pass |
| Coverage Check (3 API calls) | < 3s | ⚠️ 2-4s | Acceptable |
| Package Page Load | < 1s | ✅ ~0.8s | Pass |
| Order Form Load | < 1s | ✅ ~0.9s | Pass |
| Total Time to Order | < 7s | ⚠️ ~6-8s | Needs optimization |

---

## Risk Assessment

### High Risk

1. **Payment Gateway Stability** (P0)
   - **Risk**: Netcash integration not fully tested in production
   - **Mitigation**: Comprehensive test suite (Phase 1, Task 3.2)
   - **Fallback**: Manual payment processing via admin panel

2. **Order Status Real-Time Updates** (P0)
   - **Risk**: Database triggers may have edge cases
   - **Mitigation**: Thorough testing with all status transitions
   - **Fallback**: Manual status updates via admin panel

### Medium Risk

3. **Zoho CRM Sync Reliability** (P1)
   - **Risk**: API rate limits, authentication issues
   - **Mitigation**: Retry logic with exponential backoff
   - **Fallback**: Queue failed syncs for batch retry

4. **KYC Document Security** (P0)
   - **Risk**: Sensitive document storage and access
   - **Mitigation**: Supabase RLS policies, encrypted storage
   - **Fallback**: Manual document collection via email

### Low Risk

5. **Quote PDF Generation** (P1)
   - **Risk**: PDF formatting issues
   - **Mitigation**: Use battle-tested library (react-pdf)
   - **Fallback**: HTML email with quote details

---

## Success Metrics

### Phase 1 Success (Week 1)

- [ ] 100% of orders trackable by customers
- [ ] 100% of new orders receive activation email
- [ ] 100% of no-coverage leads trigger sales alerts
- [ ] 90% payment success rate (Netcash test mode)
- [ ] <5% cart abandonment at payment stage

### Phase 2 Success (Week 2)

- [ ] B2B landing page live with SMME packages
- [ ] Quote generation functional end-to-end
- [ ] First business quote sent to customer
- [ ] Quote acceptance converts to order successfully

### Phase 3 + 4 Success (Week 3)

- [ ] Customer self-service dashboard live
- [ ] Payment method management functional
- [ ] First customer uses service upgrade flow
- [ ] <10% support tickets for order status inquiries

### Overall MVP Success

- [ ] End-to-end consumer journey tested (homepage → order → activation)
- [ ] End-to-end business journey tested (landing → quote → order)
- [ ] No critical bugs in production
- [ ] <2s average page load time
- [ ] >90% customer satisfaction (CSAT survey)

---

## Related Documentation

- **Phase Details**:
  - `PHASE_1_CRITICAL_FIXES.md` - Days 1-5 (Order tracking, notifications, KYC, payment)
  - `PHASE_2_B2B_JOURNEY.md` - Days 6-10 (Business landing, quotes, admin tools)
  - `PHASE_3_SUBSCRIPTION_MGMT.md` - Days 11-13 (Service mgmt, billing, invoices)
  - `PHASE_4_UX_OPTIMIZATIONS.md` - Days 14-15 (Progress indicators, CTAs, UTM)

- **Task Breakdown**:
  - `TODO_BREAKDOWN.md` - Actionable checkbox list organized by phase

- **Existing Documentation**:
  - `customer-journey-phase-1-guide.md` - Phase 1 implementation guide
  - `../../testing/customer-journey/customer-journey-test-plan.md` - Testing plan
  - `../../development/epics/customer-journey-features-roadmap.md` - BMAD epic breakdown

- **Database**:
  - `/supabase/migrations/20251019000003_create_customer_journey_system.sql` - Schema

- **BRS Requirements**:
  - Section 4.1 - High-Speed Internet Availability Check
  - Section 4.2 - Product Search and Selection
  - Section 4.3 - Order and Subscription

---

**Last Updated**: 2025-10-21
**Status**: 75% Complete (Foundation Ready)
**Next Action**: Begin Phase 1, Task 1.1 (Order Status Page)
**Estimated Completion**: 3 weeks (15 working days)
