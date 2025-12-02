# Unified Payment & Billing Architecture (Supabase-First with Resend Emails)

**Spec ID**: 20251202-unified-payment-billing
**Status**: Ready for Implementation
**Priority**: High
**Total Story Points**: 29

## Overview

Establish Supabase as the single source of truth for all payment and billing operations, with NetCash Pay Now for payment processing, Resend for transactional emails, and ZOHO Billing demoted to an async reporting/BI mirror. This architecture ensures CircleTel operates independently of external CRM systems while maintaining data consistency for financial reporting.

## Key Deliverables

- [ ] Payment sync service for ZOHO Billing (record offline payments)
- [ ] Enhanced NetCash webhook with Resend email integration
- [ ] Payment receipt React Email template
- [ ] Database schema updates for payment sync tracking
- [ ] Admin visibility into payment sync status
- [ ] Comprehensive audit logging for all payment events

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  PAYMENT FLOW (Supabase-First)                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. NetCash Pay Now → processes payment (20+ ZA methods)        │
│  2. Webhook → /api/webhooks/netcash                             │
│  3. Supabase (SOURCE OF TRUTH) → update invoice, record payment │
│  4. Resend → send payment confirmation email (immediate)        │
│  5. ZOHO Billing → async sync as "offline payment" (best-effort)│
└─────────────────────────────────────────────────────────────────┘
```

## Files to Create

| File | Purpose |
|------|---------|
| `lib/payments/payment-sync-service.ts` | Orchestrate payment sync to ZOHO Billing |
| `lib/payments/types.ts` | Payment-related TypeScript interfaces |
| `emails/templates/payment-receipt.tsx` | React Email payment confirmation template |
| `supabase/migrations/YYYYMMDD_payment_sync_tracking.sql` | Database schema updates |

## Files to Modify

| File | Changes |
|------|---------|
| `lib/payment/netcash-webhook-processor.ts` | Add Resend email + ZOHO sync |
| `lib/integrations/zoho/invoice-sync-service.ts` | Add payment sync function |
| `lib/emails/enhanced-notification-service.ts` | Add sendPaymentReceipt method |
| `lib/emails/email-renderer.ts` | Register payment_receipt template |

## Quick Start

```bash
# Review the full specification
cat agent-os/specs/20251202-unified-payment-billing/SPEC.md

# Check task breakdown
cat agent-os/specs/20251202-unified-payment-billing/TASKS.md

# Track progress
cat agent-os/specs/20251202-unified-payment-billing/PROGRESS.md

# View architecture diagrams
cat agent-os/specs/20251202-unified-payment-billing/architecture.md
```

## Task Groups

| Group | Agent Role | Points | Dependencies |
|-------|------------|--------|--------------|
| TG-1 | database-engineer | 5 | None |
| TG-2 | backend-engineer | 13 | TG-1 |
| TG-3 | frontend-engineer | 3 | TG-2 |
| TG-4 | testing-engineer | 5 | TG-2 |
| TG-5 | ops-engineer | 3 | TG-2, TG-3 |

## Risk Level

**Medium** - Existing infrastructure (NetCash, Resend, ZOHO) is in place. Main risks are ensuring data consistency between payment confirmation and email delivery, and maintaining ZOHO sync resilience for financial reporting.

## Why This Architecture?

### ZOHO Billing Limitation (Confirmed)
NetCash is **not supported** as a payment gateway in ZOHO Billing. The API only supports:
`test_gateway, payflow_pro, stripe, 2checkout, authorize_net, payments_pro, forte, worldpay, wepay`

### Solution: Supabase-First
- **Supabase**: Source of truth for all payment/invoice data
- **NetCash Pay Now**: Payment processing (20+ South African methods)
- **Resend**: Transactional emails (high deliverability)
- **ZOHO Billing**: Reporting/BI mirror via "offline payment" recording
