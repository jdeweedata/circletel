# Customer Referral & Rewards System - Architecture

**Spec ID**: `20251201-customer-referral-rewards`
**Version**: 1.0
**Created**: 2025-12-01

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Database Schema Relationships](#database-schema-relationships)
5. [API Architecture](#api-architecture)
6. [Service Layer Architecture](#service-layer-architecture)
7. [Integration Points](#integration-points)
8. [Sequence Diagrams](#sequence-diagrams)

---

## System Overview

The Customer Referral & Rewards System is a modular feature that integrates with existing CircleTel systems:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CircleTel Platform                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │
│  │   Customer   │   │   Partner    │   │    Admin     │          │
│  │  Dashboard   │   │   Portal     │   │    Portal    │          │
│  └──────┬───────┘   └──────────────┘   └──────┬───────┘          │
│         │                                       │                  │
│         │          ┌──────────────────────┐    │                  │
│         └─────────►│  Referral & Rewards  │◄───┘                  │
│                    │      System          │                        │
│                    └──────────┬───────────┘                        │
│                               │                                    │
│         ┌─────────────────────┼─────────────────────┐              │
│         │                     │                     │              │
│         ▼                     ▼                     ▼              │
│  ┌─────────────┐       ┌─────────────┐      ┌─────────────┐      │
│  │   Billing   │       │    Order    │      │    Email    │      │
│  │   System    │       │   System    │      │    System   │      │
│  └─────────────┘       └─────────────┘      └─────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
├──────────────────────────┬──────────────────────────────────────────────┤
│  Customer Components     │  Admin Components                            │
│  ┌─────────────────┐     │  ┌─────────────────────────────────────┐    │
│  │ ReferralWidget  │     │  │  ReferralManagement                  │    │
│  │  - Code display │     │  │   - Customer referrals table         │    │
│  │  - Copy buttons │     │  │   - Grant/revoke rewards             │    │
│  │  - Progress bar │     │  │   - Audit log viewer                 │    │
│  │  - Referred list│     │  │   - Stats cards                      │    │
│  └─────────────────┘     │  └─────────────────────────────────────┘    │
└──────────────────────────┴──────────────────────────────────────────────┘
                                         │
                                         │ API Calls
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                     │
├──────────────────────────┬──────────────────────────────────────────────┤
│  Customer Endpoints      │  Admin Endpoints                             │
│  ┌─────────────────┐     │  ┌─────────────────────────────────────┐    │
│  │ POST /referrals │     │  │ GET /customers/[id]/referrals       │    │
│  │ GET /referrals  │     │  │ POST /customers/[id]/referrals/grant│    │
│  │ GET /balance    │     │  │ POST /customers/[id]/referrals/revoke│   │
│  └─────────────────┘     │  └─────────────────────────────────────┘    │
└──────────────────────────┴──────────────────────────────────────────────┘
                                         │
                                         │ Service Calls
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
├──────────────────┬───────────────────────┬──────────────────────────────┤
│ ReferralService  │ FreeMonthCalculator   │ FraudDetection               │
│ ┌──────────────┐ │ ┌──────────────────┐  │ ┌──────────────────────────┐│
│ │ - Generate   │ │ │ - Get pending    │  │ │ - Self-referral check    ││
│ │   codes      │ │ │   rewards        │  │ │ - Duplicate check        ││
│ │ - Validate   │ │ │ - Apply free     │  │ │ - Rate limiting          ││
│ │   codes      │ │ │   month          │  │ │ - IP validation          ││
│ │ - Create     │ │ │ - Calculate      │  │ │ - Flag suspicious        ││
│ │   referrals  │ │ │   pro-rata       │  │ │ - Eligibility check      ││
│ │ - Activate   │ │ │ - Expire old     │  │ │                          ││
│ │   referrals  │ │ │   rewards        │  │ │                          ││
│ │ - Grant      │ │ └──────────────────┘  │ └──────────────────────────┘│
│ │   rewards    │ │                       │                              │
│ └──────────────┘ │                       │                              │
└──────────────────┴───────────────────────┴──────────────────────────────┘
                                         │
                                         │ Database Queries
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
├──────────────────────────┬──────────────────────────────────────────────┤
│  Supabase PostgreSQL     │  Row Level Security (RLS)                    │
│  ┌──────────────────┐    │  ┌────────────────────────────────────┐     │
│  │ customer_referrals│   │  │ - Customers see own data only      │     │
│  │ referral_rewards │    │  │ - Admins see all with permissions  │     │
│  │ customers        │    │  │ - Service role bypasses RLS        │     │
│  │ customer_invoices│    │  └────────────────────────────────────┘     │
│  └──────────────────┘    │                                              │
└──────────────────────────┴──────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Referral Code Generation

```
┌──────────┐
│ Customer │
│ Dashboard│
└─────┬────┘
      │
      │ 1. Click "Get Referral Code"
      ▼
┌──────────────────────┐
│ ReferralWidget       │
│ (React Component)    │
└─────┬────────────────┘
      │
      │ 2. POST /api/customer/referrals
      ▼
┌──────────────────────────────┐
│ API Route                    │
│ /api/customer/referrals      │
└─────┬────────────────────────┘
      │
      │ 3. Authenticate customer (JWT)
      │ 4. Call ReferralService
      ▼
┌──────────────────────────────────┐
│ ReferralService                  │
│ .getOrCreateReferralCode()       │
└─────┬────────────────────────────┘
      │
      │ 5. Check if code exists
      │    SELECT referral_code FROM customers WHERE id = ?
      │
      ├──── Code exists ──────┐
      │                       │
      │                       ▼
      │               ┌──────────────┐
      │               │ Return code  │
      │               └──────────────┘
      │
      └──── Code missing ────┐
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Generate unique code │
                    │ CT-REF-XXXXXXXX      │
                    └─────┬────────────────┘
                          │
                          │ 6. UPDATE customers SET referral_code = ?
                          ▼
                    ┌──────────────┐
                    │ Return code  │
                    └──────────────┘
                          │
                          │ 7. Response
                          ▼
                    ┌──────────────────┐
                    │ {                │
                    │   code: "...",   │
                    │   link: "...",   │
                    │   stats: {...}   │
                    │ }                │
                    └──────────────────┘
                          │
                          │ 8. Display in UI
                          ▼
                    ┌──────────────────┐
                    │ ReferralWidget   │
                    │ - Show code      │
                    │ - Copy button    │
                    │ - Progress bar   │
                    └──────────────────┘
```

---

### Flow 2: Referral Signup & Tracking

```
┌──────────────┐
│  New User    │
│ (Referred)   │
└──────┬───────┘
       │
       │ 1. Clicks referral link
       │    https://circletel.co.za/?ref=CT-REF-XXXXXXXX
       ▼
┌────────────────────────┐
│ Public Package Page    │
│ /packages/[leadId]     │
└──────┬─────────────────┘
       │
       │ 2. Capture ?ref= param from URL
       │ 3. Store in localStorage
       │    localStorage.setItem('referral_code', 'CT-REF-XXXXXXXX')
       ▼
┌────────────────────────┐
│ User browses packages  │
│ and creates order      │
└──────┬─────────────────┘
       │
       │ 4. Proceeds to account creation
       ▼
┌────────────────────────────┐
│ Order Account Page         │
│ /order/account             │
└──────┬─────────────────────┘
       │
       │ 5. Retrieve referral code from localStorage
       │ 6. Submit order with referral_code field
       ▼
┌─────────────────────────────────┐
│ POST /api/orders/create         │
└──────┬──────────────────────────┘
       │
       │ 7. Validate referral code
       ▼
┌────────────────────────────────────┐
│ ReferralService.validateReferralCode│
└──────┬─────────────────────────────┘
       │
       ├──── Invalid ──────┐
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │ Show error   │
       │            │ Continue w/o │
       │            │ referral     │
       │            └──────────────┘
       │
       └──── Valid ───────┐
                          │
                          ▼
              ┌──────────────────────────┐
              │ Create customer record   │
              │ INSERT INTO customers    │
              └─────┬────────────────────┘
                    │
                    │ 8. Create referral record
                    ▼
              ┌─────────────────────────────────┐
              │ ReferralService.createReferral()│
              │ INSERT INTO customer_referrals  │
              │ - referrer_id (from code)       │
              │ - referred_customer_id          │
              │ - status: 'pending'             │
              │ - ip_address (fraud check)      │
              └─────┬───────────────────────────┘
                    │
                    │ 9. Send email to referrer
                    ▼
              ┌──────────────────────────────┐
              │ EmailNotificationService     │
              │ "John Doe signed up using    │
              │  your referral code!"        │
              └──────────────────────────────┘
                    │
                    │ 10. Order continues normally
                    ▼
              ┌──────────────────────┐
              │ Order created        │
              │ status: 'pending'    │
              └──────────────────────┘
```

---

### Flow 3: Service Activation & Reward Granting

```
┌─────────────────┐
│ Admin/System    │
│ Activates Order │
└────────┬────────┘
         │
         │ 1. Order status: 'installing' → 'active'
         ▼
┌──────────────────────────┐
│ Order fulfillment logic  │
└────────┬─────────────────┘
         │
         │ 2. Create customer_services record
         │    INSERT INTO customer_services
         │    - status: 'active'
         ▼
┌───────────────────────────────────┐
│ Service Activation Webhook/Event  │
└────────┬──────────────────────────┘
         │
         │ 3. Check if customer was referred
         │    SELECT * FROM customer_referrals
         │    WHERE referred_customer_id = ?
         ▼
┌──────────────────────────┐
│ Referral record found?   │
└────┬─────────────────────┘
     │
     ├──── No referral ─────┐
     │                      │
     │                      ▼
     │               ┌───────────────┐
     │               │ Skip referral │
     │               │ processing    │
     │               └───────────────┘
     │
     └──── Has referral ────┐
                            │
                            ▼
                ┌────────────────────────────┐
                │ ReferralService            │
                │ .activateReferral()        │
                │ UPDATE customer_referrals  │
                │ SET status = 'active'      │
                │     activated_at = NOW()   │
                └────────┬───────────────────┘
                         │
                         │ 4. Send email to referrer
                         ▼
                ┌────────────────────────────┐
                │ EmailNotificationService   │
                │ "Good news! John Doe       │
                │  activated their service!" │
                └────────┬───────────────────┘
                         │
                         │ 5. Check if referrer earned reward
                         ▼
                ┌─────────────────────────────────┐
                │ ReferralService                 │
                │ .checkAndGrantReward(referrerId)│
                │ - Count active referrals        │
                │ - If >= 2, create reward        │
                └────────┬────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    < 2 referrals                 >= 2 referrals
          │                             │
          ▼                             ▼
    ┌──────────┐              ┌───────────────────────┐
    │ No reward│              │ Create reward record  │
    │ (wait)   │              │ INSERT INTO           │
    └──────────┘              │ referral_rewards      │
                              │ - customer_id         │
                              │ - reward_type: 'free_month'│
                              │ - status: 'pending'   │
                              │ - referral_1_id       │
                              │ - referral_2_id       │
                              └────────┬──────────────┘
                                       │
                                       │ 6. Send congratulations email
                                       ▼
                              ┌────────────────────────────┐
                              │ EmailNotificationService   │
                              │ "Congrats! You've earned   │
                              │  a free month of service!" │
                              └────────────────────────────┘
```

---

### Flow 4: Billing Cycle & Free Month Application

```
┌──────────────────┐
│ Billing Cron Job │
│ (Monthly)        │
└────────┬─────────┘
         │
         │ 1. Trigger: 1st of month
         ▼
┌────────────────────────────────┐
│ Billing Service                │
│ Generate invoices for all      │
│ active services                │
└────────┬───────────────────────┘
         │
         │ 2. For each customer service
         ▼
┌──────────────────────────────────────┐
│ CompliantBillingService              │
│ .generateInvoice()                   │
└────────┬─────────────────────────────┘
         │
         │ 3. Check for pending free month rewards
         ▼
┌─────────────────────────────────────────┐
│ FreeMonthCalculator                     │
│ .shouldApplyFreeMonth(customerId, svcId)│
│ SELECT * FROM referral_rewards          │
│ WHERE customer_id = ?                   │
│   AND status = 'pending'                │
│   AND expires_at > NOW()                │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
No reward   Has pending reward
    │         │
    │         ▼
    │   ┌────────────────────────────────┐
    │   │ FreeMonthCalculator            │
    │   │ .applyFreeMonth()              │
    │   │ - Calculate pro-rata if needed │
    │   │ - Set invoice amount = 0       │
    │   │ - Add adjustment line item     │
    │   └────────┬───────────────────────┘
    │            │
    │            ▼
    │   ┌────────────────────────────────┐
    │   │ INSERT INTO customer_invoices  │
    │   │ - total_amount: 0.00           │
    │   │ - is_free_month: true          │
    │   │ - referral_reward_id: uuid     │
    │   │ - line_items: [                │
    │   │     {                          │
    │   │       description: "Referral   │
    │   │         Reward - Free Month",  │
    │   │       amount: -799.00          │
    │   │     }                          │
    │   │   ]                            │
    │   └────────┬───────────────────────┘
    │            │
    │            │ 4. Update reward status
    │            ▼
    │   ┌────────────────────────────────┐
    │   │ UPDATE referral_rewards        │
    │   │ SET status = 'applied'         │
    │   │     applied_at = NOW()         │
    │   │     applied_to_invoice_id = ?  │
    │   └────────┬───────────────────────┘
    │            │
    │            │ 5. Send email confirmation
    │            ▼
    │   ┌────────────────────────────────┐
    │   │ EmailNotificationService       │
    │   │ "Your free month has been      │
    │   │  applied to invoice INV-..."   │
    │   └────────────────────────────────┘
    │            │
    └────────────┼─────────────────────────┐
                 │                         │
                 ▼                         ▼
         ┌──────────────┐          ┌──────────────┐
         │ Send invoice │          │ Send invoice │
         │ (R799.00)    │          │ (R0.00)      │
         └──────────────┘          └──────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │    customers     │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ email            │
                            │ first_name       │
                            │ last_name        │
                            │ phone            │
                            │ referral_code ◄──────── Auto-generated (CT-REF-XXXXXXXX)
                            │ created_at       │
                            └────┬─────────┬───┘
                                 │         │
                    ┌────────────┘         └────────────┐
                    │ referrer_id                       │ customer_id
                    │                                   │
                    ▼                                   ▼
        ┌─────────────────────┐            ┌──────────────────────┐
        │ customer_referrals  │            │  referral_rewards    │
        ├─────────────────────┤            ├──────────────────────┤
        │ id (PK)             │            │ id (PK)              │
        │ referrer_id (FK) ───┼────────────┼─► customer_id (FK)   │
        │ referred_customer_id│            │ reward_type          │
        │ referral_code       │            │ status               │
        │ status ◄────────────┼────┐       │ applied_to_service_id│
        │ referred_email      │    │       │ applied_to_invoice_id│
        │ ip_address          │    │       │ referral_1_id (FK) ──┼──┐
        │ referred_at         │    │       │ referral_2_id (FK) ──┼──┼──► References
        │ activated_at        │    │       │ amount_waived        │  │    customer_referrals
        │ created_at          │    │       │ manually_granted     │  │
        └─────────────────────┘    │       │ granted_by (FK)      │  │
                                   │       │ revoked_by (FK)      │  │
        Status values:             │       │ expires_at           │  │
        - pending ◄────────────────┘       │ created_at           │  │
        - active                           └──────────┬───────────┘  │
        - expired                                     │              │
        - cancelled                                   │ FK           │
                                                      ▼              │
                                         ┌──────────────────────┐   │
                                         │ customer_invoices    │   │
                                         ├──────────────────────┤   │
                                         │ id (PK)              │   │
                                         │ customer_id (FK)     │   │
                                         │ invoice_number       │   │
                                         │ total_amount         │   │
                                         │ is_free_month ◄──────┼───┘
                                         │ referral_reward_id(FK)   Set to TRUE
                                         │ line_items (JSONB)   │   when reward applied
                                         │ created_at           │
                                         └──────────────────────┘

INDEXES:
- customer_referrals(referrer_id, status) - Fast lookup of active referrals
- customer_referrals(referral_code) - Quick code validation
- referral_rewards(customer_id, status) - Pending rewards check
- customers(referral_code) - Unique constraint + fast lookup
```

---

## API Architecture

### API Endpoint Organization

```
/api
├── customer/                          # Customer-facing endpoints (authenticated)
│   ├── referrals/
│   │   ├── route.ts                   # POST - Generate/get referral code
│   │   └── [GET with params]          # GET - List customer's referrals
│   └── referral-balance/
│       └── route.ts                   # GET - Get reward balance
│
└── admin/                             # Admin endpoints (RBAC protected)
    └── customers/
        └── [id]/
            └── referrals/
                ├── route.ts           # GET - View customer referrals
                ├── grant/
                │   └── route.ts       # POST - Grant manual reward
                └── revoke/
                    └── route.ts       # POST - Revoke reward

AUTHENTICATION:
- Customer endpoints: Require Supabase customer session (JWT)
- Admin endpoints: Require admin session + RBAC permission check
  - Permissions: 'customers:view', 'billing:manage_invoices'

AUTHORIZATION FLOW:
1. Extract JWT from Authorization header or cookies
2. Validate with Supabase Auth
3. For admin: Check admin_users table + permissions
4. Apply RLS policies automatically on database queries
```

---

## Service Layer Architecture

### Service Dependencies & Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   ReferralService        │
│  (Core orchestration)    │
├──────────────────────────┤
│ - getOrCreateReferralCode│
│ - validateReferralCode   │◄────────┐
│ - createReferral         │         │ Uses for validation
│ - activateReferral       │         │
│ - checkAndGrantReward    │         │
│ - getReferralStats       │         │
└────────┬─────────────────┘         │
         │                           │
         │ Calls                     │
         ▼                           │
┌──────────────────────────┐         │
│   FraudDetection         │─────────┘
│  (Validation & security) │
├──────────────────────────┤
│ - isSelfReferral         │
│ - isDuplicateReferral    │
│ - isRateLimited          │
│ - isSuspiciousIP         │
│ - isEligibleReferrer     │
└──────────────────────────┘

┌──────────────────────────────┐
│   FreeMonthCalculator        │
│  (Billing integration)       │
├──────────────────────────────┤
│ - getPendingRewards          │
│ - shouldApplyFreeMonth       │
│ - applyFreeMonth             │◄─────┐
│ - calculateProRata           │      │
│ - expireOldRewards           │      │ Called during
└──────────────────────────────┘      │ invoice generation
                                      │
┌─────────────────────────────────────┴────────────────┐
│   CompliantBillingService                            │
│  (Existing service - MODIFIED)                       │
├──────────────────────────────────────────────────────┤
│ - generateInvoice() ◄─── MODIFIED:                  │
│     1. Check for pending rewards                     │
│     2. Apply free month if available                 │
│     3. Create invoice with is_free_month = true      │
└──────────────────────────────────────────────────────┘

SERVICE INTERACTION EXAMPLE:

Order Activation Flow:
1. activateReferral(referralId)
   ├─► isSelfReferral() - fraud check
   ├─► UPDATE customer_referrals status = 'active'
   └─► checkAndGrantReward(referrerId)
       ├─► Count active referrals
       └─► If >= 2: INSERT INTO referral_rewards

Billing Flow:
1. generateInvoice(customerId, serviceId)
   ├─► shouldApplyFreeMonth()
   │   └─► SELECT FROM referral_rewards WHERE status = 'pending'
   ├─► applyFreeMonth(invoiceId, rewardId)
   │   ├─► calculateProRata() if mid-month
   │   ├─► UPDATE invoice SET is_free_month = true
   │   └─► UPDATE reward SET status = 'applied'
   └─► EmailNotificationService.send()
```

---

## Integration Points

### Integration with Existing CircleTel Systems

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────┘

1. BILLING SYSTEM INTEGRATION
   ┌────────────────────────────────┐
   │ CompliantBillingService        │
   │ (lib/billing/)                 │
   └────────┬───────────────────────┘
            │
            │ MODIFICATION: generateInvoice()
            ▼
   ┌─────────────────────────────────────────┐
   │ Before creating invoice:                │
   │ 1. Call FreeMonthCalculator             │
   │    .shouldApplyFreeMonth()              │
   │ 2. If reward exists:                    │
   │    - Set is_free_month = true           │
   │    - Set total_amount = 0               │
   │    - Add adjustment line item           │
   │ 3. Update reward status = 'applied'     │
   └─────────────────────────────────────────┘

2. ORDER SYSTEM INTEGRATION
   ┌────────────────────────────────┐
   │ Order Creation Flow            │
   │ (app/order/account/page.tsx)   │
   └────────┬───────────────────────┘
            │
            │ MODIFICATION: Capture referral code
            ▼
   ┌─────────────────────────────────────────┐
   │ 1. Retrieve code from localStorage      │
   │ 2. Submit with order data               │
   │ 3. Validate code during order creation  │
   │ 4. Create customer_referrals record     │
   └─────────────────────────────────────────┘

   ┌────────────────────────────────┐
   │ Service Activation             │
   │ (Order fulfillment)            │
   └────────┬───────────────────────┘
            │
            │ ADDITION: Activate referral
            ▼
   ┌─────────────────────────────────────────┐
   │ After service activated:                │
   │ 1. Check for customer_referrals record  │
   │ 2. Call activateReferral()              │
   │ 3. Check if reward should be granted    │
   └─────────────────────────────────────────┘

3. CUSTOMER DASHBOARD INTEGRATION
   ┌────────────────────────────────┐
   │ Customer Dashboard             │
   │ (app/dashboard/page.tsx)       │
   └────────┬───────────────────────┘
            │
            │ ADDITION: Referral widget
            ▼
   ┌─────────────────────────────────────────┐
   │ <ReferralWidget />                      │
   │ - Display below stats cards             │
   │ - Fetch referral data via API           │
   │ - Show progress and balance             │
   └─────────────────────────────────────────┘

4. ADMIN PORTAL INTEGRATION
   ┌────────────────────────────────┐
   │ Admin Customer Detail          │
   │ (/admin/customers/[id])        │
   └────────┬───────────────────────┘
            │
            │ ADDITION: Referrals tab
            ▼
   ┌─────────────────────────────────────────┐
   │ New tab: "Referrals"                    │
   │ - View customer's referrals             │
   │ - Grant/revoke rewards                  │
   │ - View audit log                        │
   └─────────────────────────────────────────┘

5. EMAIL NOTIFICATION INTEGRATION
   ┌────────────────────────────────┐
   │ EmailNotificationService       │
   │ (lib/notifications/)           │
   └────────┬───────────────────────┘
            │
            │ NEW TEMPLATES:
            ▼
   ┌─────────────────────────────────────────┐
   │ - referral_signup: "[Name] signed up!"  │
   │ - referral_activated: "Service active!" │
   │ - reward_earned: "Free month earned!"   │
   │ - reward_applied: "Applied to invoice"  │
   │ - reward_granted: "Manual grant"        │
   │ - reward_revoked: "Reward revoked"      │
   └─────────────────────────────────────────┘

6. RBAC INTEGRATION
   ┌────────────────────────────────┐
   │ RBAC Permissions               │
   │ (lib/rbac/permissions.ts)      │
   └────────┬───────────────────────┘
            │
            │ NEW PERMISSION:
            ▼
   ┌─────────────────────────────────────────┐
   │ REFERRALS: {                            │
   │   VIEW: 'referrals:view',               │
   │   MANAGE: 'referrals:manage'            │
   │ }                                       │
   └─────────────────────────────────────────┘
```

---

## Sequence Diagrams

### Sequence 1: Complete Referral Flow (Happy Path)

```
Customer A  ReferralWidget  API  ReferralSvc  Database  Email
(Referrer)
    │
    │ 1. Click "Get Code"
    ├──────────────►│
    │               │ 2. POST /api/customer/referrals
    │               ├──────────►│
    │               │           │ 3. getOrCreateReferralCode()
    │               │           ├─────────────►│
    │               │           │              │ 4. SELECT referral_code
    │               │           │              ├──────►│
    │               │           │              │       │
    │               │           │              │◄──────┤ Code exists
    │               │           │◄─────────────┤       │
    │               │◄──────────┤              │       │
    │◄──────────────┤           │              │       │
    │ Display code: │           │              │       │
    │ CT-REF-ABC123 │           │              │       │
    │               │           │              │       │
    │ 5. Share link with Customer B           │       │
    │                                          │       │

Customer B  Browser  PackagePage  OrderAPI  ReferralSvc  Database  Email
(Referred)
    │
    │ 6. Click: https://circletel.co.za/?ref=CT-REF-ABC123
    ├──────────►│
    │           │ 7. Extract ?ref param
    │           ├──────────►│
    │           │           │ 8. localStorage.setItem('referral_code')
    │           │           │
    │           │           │ ... User browses and creates order ...
    │           │           │
    │           │           │ 9. POST /api/orders/create
    │           │           │    { referral_code: 'CT-REF-ABC123' }
    │           │           ├────────────►│
    │           │           │             │ 10. validateReferralCode()
    │           │           │             ├──────────────►│
    │           │           │             │               │ 11. SELECT
    │           │           │             │               ├──────►│
    │           │           │             │               │       │ Valid
    │           │           │             │◄──────────────┤       │
    │           │           │             │ 12. createReferral()  │
    │           │           │             ├──────────────►│       │
    │           │           │             │               │ INSERT│
    │           │           │             │               ├──────►│
    │           │           │             │               │       │
    │           │           │             │               │       │
    │           │           │             ├───────────────────────┴──►│
    │           │           │             │   13. Send email           │
    │           │           │             │   "Customer B signed up!"  │
    │           │           │◄────────────┤                            │
    │           │◄──────────┤             │                            │
    │◄──────────┤           │             │                            │
    │ Order created         │             │                            │
    │                       │             │                            │
    │ ... Order processing, installation ...                           │
    │                       │             │                            │
    │ 14. Service activated │             │                            │
    ├──────────────────────────────►│     │                            │
    │                       │       │ 15. activateReferral()           │
    │                       │       ├────────────►│                    │
    │                       │       │             │ UPDATE status=active
    │                       │       │             ├──────►│            │
    │                       │       │             │       │            │
    │                       │       │ 16. checkAndGrantReward()        │
    │                       │       ├────────────►│       │            │
    │                       │       │             │ COUNT active refs  │
    │                       │       │             ├──────►│            │
    │                       │       │             │       │ Count = 2  │
    │                       │       │             │◄──────┤            │
    │                       │       │             │ INSERT reward      │
    │                       │       │             ├──────►│            │
    │                       │       │             │       │            │
    │                       │       │             ├────────────────────┴──►│
    │                       │       │             │   17. Email Customer A  │
    │                       │       │             │   "Free month earned!"  │
    │                       │       │◄────────────┤                         │
    │                       │◄──────┤             │                         │
    │                                                                        │
    │ ... Billing cycle (1st of next month) ...                             │
    │                                                                        │
BillingSvc  FreeMonthCalc  Database  Email
    │
    │ 18. generateInvoice(Customer A)
    ├──────────────►│
    │               │ 19. shouldApplyFreeMonth()
    │               ├──────────────►│
    │               │               │ SELECT pending rewards
    │               │               ├──────►│
    │               │               │       │ 1 pending reward
    │               │◄──────────────┤       │
    │               │ 20. applyFreeMonth()  │
    │               ├──────────────►│       │
    │               │               │ UPDATE invoice (free)
    │               │               ├──────►│
    │               │               │ UPDATE reward (applied)
    │               │               ├──────►│
    │               │               │       │
    │               │               ├───────┴───────────►│
    │               │               │   21. Email         │
    │               │               │   "Free month applied!"
    │◄──────────────┤               │                     │
    │ Invoice created (R0.00)       │                     │
```

---

## Performance Considerations

### Query Optimization

```
CRITICAL QUERIES & OPTIMIZATION:

1. Referral Code Validation (High frequency)
   Query: SELECT id FROM customers WHERE referral_code = ?
   Optimization:
   - UNIQUE index on referral_code
   - Cache valid codes (5-min TTL)
   - Expected: <10ms

2. Active Referral Count (Medium frequency)
   Query: SELECT COUNT(*) FROM customer_referrals
          WHERE referrer_id = ? AND status = 'active'
   Optimization:
   - Composite index on (referrer_id, status)
   - Expected: <20ms

3. Pending Rewards Check (Low frequency - monthly billing)
   Query: SELECT * FROM referral_rewards
          WHERE customer_id = ? AND status = 'pending'
          AND expires_at > NOW()
   Optimization:
   - Composite index on (customer_id, status)
   - Expected: <50ms

4. Fraud Detection - IP Check (High frequency)
   Query: SELECT COUNT(*) FROM customer_referrals
          WHERE referrer_id = ? AND ip_address = ?
          AND created_at > NOW() - INTERVAL '1 day'
   Optimization:
   - Index on (referrer_id, ip_address, created_at)
   - Expected: <30ms

CACHING STRATEGY:
- Referral codes: Redis cache, 5-min TTL
- Referral stats: Cache in-memory, invalidate on update
- Reward balance: No cache (low frequency, must be accurate)
```

---

## Security Architecture

### Multi-Layer Security

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────────┘

LAYER 1: AUTHENTICATION
┌──────────────────────────────┐
│ Supabase Auth (JWT)          │
│ - Customer session required  │
│ - Admin session + RBAC       │
└──────────────────────────────┘

LAYER 2: ROW LEVEL SECURITY (RLS)
┌──────────────────────────────────────────────────┐
│ Database Level                                   │
│ - Customers: SELECT own referrals only           │
│ - Admins: ALL with permission check              │
│ - Automatic enforcement (cannot be bypassed)     │
└──────────────────────────────────────────────────┘

LAYER 3: API AUTHORIZATION
┌──────────────────────────────────────────────────┐
│ Route Level                                      │
│ - Verify JWT signature                           │
│ - Check admin_users table for admin routes       │
│ - Validate RBAC permissions                      │
└──────────────────────────────────────────────────┘

LAYER 4: BUSINESS LOGIC VALIDATION
┌──────────────────────────────────────────────────┐
│ Service Level                                    │
│ - Self-referral prevention (email, phone)        │
│ - Duplicate referral check                       │
│ - Rate limiting (10 referrals/month)             │
│ - IP address tracking                            │
│ - Referrer eligibility (active service)          │
└──────────────────────────────────────────────────┘

LAYER 5: AUDIT LOGGING
┌──────────────────────────────────────────────────┐
│ Tracking Level                                   │
│ - All admin actions logged (grant/revoke)        │
│ - IP addresses recorded                          │
│ - Suspicious activity flagged                    │
│ - 90-day retention                               │
└──────────────────────────────────────────────────┘

FRAUD PREVENTION WORKFLOW:
┌───────────────┐
│ Referral      │
│ Attempt       │
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│ Validation Checks │
├───────────────────┤
│ 1. Code exists?   │
│ 2. Self-referral? │
│ 3. Duplicate?     │
│ 4. Rate limited?  │
│ 5. Suspicious IP? │
└────┬──────────────┘
     │
     ├─── All pass ──────► Allow referral
     │
     └─── Any fail ──────► Block + Log
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-01
**Maintained By**: Development Team + Claude Code
