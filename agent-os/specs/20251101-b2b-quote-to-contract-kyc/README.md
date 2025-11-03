# B2B Quote-to-Contract Workflow with KYC Compliance

## Overview

This specification defines a complete automation system from B2B quote generation through service activation with integrated FICA-compliant KYC verification and RICA pairing.

## Documents

- **[spec.md](./spec.md)** - Complete specification (16 sections, 61 story points)
- **Source Documents**:
  - `docs/journeys/b2b-quote-to-contract/USER_STORIES.md` - User stories and acceptance criteria
  - `docs/journeys/b2b-quote-to-contract/Quote-to-Contract Workflow.md` - Technical implementation guide

## Quick Stats

- **Timeline**: 14 days (fast-track implementation)
- **Story Points**: 61 (across 4 sprints)
- **Integrations**: 7 (Didit, ZOHO CRM, ZOHO Sign, NetCash, RICA, Resend, Supabase)
- **Database Tables**: 8 new tables (kyc_sessions, contracts, invoices, rica_submissions, etc.)
- **API Endpoints**: 25+ new routes

## Key Features

1. **Didit KYC Integration** - Frictionless FICA verification (<3 min for SMEs)
2. **Automated Contract Generation** - ZOHO Sign digital signatures
3. **RICA Paired Submission** - Zero manual data entry using KYC data
4. **Real-Time ZOHO CRM Sync** - KYC status, contract tracking, deal management
5. **NetCash Payment Processing** - Multi-method payment support
6. **Admin Compliance Queue** - High-risk KYC review with full context
7. **Recurring Billing Automation** - Monthly invoices and auto-payment

## Success Metrics (30 days)

- **86% faster onboarding** (7 days → <1 day)
- **67% higher conversion** (40% → 55%)
- **R0 KYC cost** (Didit free tier)
- **95% RICA accuracy** (first-time approval)
- **100% FICA/RICA compliance**

## Implementation Phases

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: KYC Foundation** | Days 1-3 | Didit integration, webhook handlers, compliance queue |
| **Phase 2: Contracts** | Days 4-5 | Contract generation, ZOHO Sign, PDF with KYC badge |
| **Phase 3: ZOHO CRM** | Days 6-7 | OAuth setup, sync service, custom fields |
| **Phase 4: Invoicing** | Days 8-10 | Invoice generation, NetCash, recurring billing |
| **Phase 5: Fulfillment** | Days 11-12 | RICA pairing, service activation |
| **Phase 6: Testing** | Days 13-14 | E2E tests, email automation, deployment |

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **KYC**: Didit.me Core API (free tier)
- **CRM**: ZOHO CRM REST API v2
- **Signatures**: ZOHO Sign API
- **Payments**: NetCash Pay Now API
- **Email**: Resend + React Email

## Reusable Components

**Existing**:
- `lib/quotes/pdf-generator-v2.ts` - Quote PDF generator (421 lines)
- `lib/quotes/types.ts` - Comprehensive TypeScript types (534 lines)
- `lib/payment/netcash-service.ts` - NetCash integration
- `lib/notifications/quote-notifications.ts` - Event-driven notifications (150+ lines)

**New**:
- `lib/integrations/didit/` - KYC API client and webhook handler
- `lib/contracts/` - Contract generation and PDF with KYC badge
- `lib/integrations/zoho/` - CRM sync and Sign integration
- `lib/compliance/rica-paired-submission.ts` - RICA automation

## Development Notes

- **No code in spec** - This document describes requirements only
- **Leverage existing assets** - Extend quote system, payment integration
- **Follow standards** - See `agent-os/standards/` for conventions
- **TypeScript strict mode** - All new code must pass `npm run type-check`

## Status

- **Version**: 1.0
- **Created**: 2025-11-01
- **Status**: Ready for Development
- **Approval**: Pending stakeholder sign-off

## Next Steps

1. Review spec with stakeholders
2. Assign implementation owner
3. Set up third-party accounts (Didit, ZOHO)
4. Begin Phase 1 implementation
