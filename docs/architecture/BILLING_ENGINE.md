# Billing Engine

**Module:** `lib/billing/engine/`  
**Since:** Phase 1a (2026-07)  
**Spec:** `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §3  
**Plan:** `docs/superpowers/plans/2026-07-29-whitelabel-phase1-billing-engine.md`  
**Wayfinder locks:** `.scratch/whitelabel-phase1-billing-engine/map.md`

## Purpose

Single public façade for the invoice **ledger** so month-end (generate → collect → apply payment → credit) does not require ad-hoc scripts, and illegal status transitions are rejected in code.

CircleTel is tenant #1 of the whitelabel productization path; this seam is the flagship claim for a sellable BSS.

## Status model (locked)

DB constraint `valid_invoice_status`:

`draft | sent | paid | partial | overdue | cancelled | voided`

| Design term | DB status | Notes |
|-------------|-----------|--------|
| draft | `draft` | Editable |
| issued | `sent` | Locked / customer-visible |
| collecting | `sent` / `overdue` | Operational only (payments/batches) |
| paid / partial / overdue | same | |
| credited | unchanged invoice | via `credit_notes` |
| reconciled | `paid` / `partial` | payment metadata |

Pure rules: `assertTransition` / `canTransition` in `state-machine.ts`.

## Public API

```typescript
import { billingEngine, assertTransition } from '@/lib/billing/engine';
```

| Method | Role | Phase |
|--------|------|-------|
| `transitionStatus` | Load status → assert → update via writer | **1a live** |
| `generateRecurring` | Monthly recurring generate | **1b live** (→ MonthlyInvoiceGenerator) |
| `generateForCustomer` | Single-customer generate | **1b live** |
| `generateInvoice` | Ad-hoc generate | **1b live** (→ CompliantBillingService) |
| `issueInvoice` | draft → sent (+ side effects) | **1b live** |
| `voidInvoice` | Void draft | **1b live** |
| `createCreditNote` | Credit notes | **1b live** |
| `submitDebitCollection` | CollectionRail `netcash_debit` | **1c live** |
| `submitCCDebitCollection` | CollectionRail `netcash_cc_debit` | **1c live** |
| `sendPayLink` | CollectionRail `netcash_paynow` | **1c live** |
| `applyPayment` | Inbound ledger (not a rail) | **1c live** (paynow-recon uses it) |
| `recordCollectionFailure` | FailedDebitHandler | **1c live** |

**Cutover (locked):** delegate-first — call existing services; sole generate path.

## Sole generate cron (1b)

| Path | Status |
|------|--------|
| `POST /api/cron/generate-monthly-invoices` | **Active** — daily `0 4 * * *` UTC; calls `billingEngine.generateRecurring` |
| `/api/cron/generate-invoices` | **Disabled** (410) — removed from vercel.json |
| `/api/cron/generate-invoices-25th` | **Disabled** (410) — removed from vercel.json |

After deploy, regenerate host crontab: `ops/scheduler/generate-crontab.sh | crontab -`

## Writer boundary

- **Target sole writer:** `lib/billing/engine/writer.ts` for ledger mutations.
- **Phase 1 DoD:** façade + CI allowlist ratchet; allowlist shrinks over PRs; zero-exception not required at close (wayfinder ticket 08).
- **Ledger tables:** `customer_invoices`, related `payment_transactions`, `credit_notes`.

## CollectionRail (Phase 1c)

Behind the rail: `netcash_debit`, `netcash_paynow`, `netcash_cc_debit`.  
**Not** CollectionRail: `applyPayment` (inbound ledger).

## Crons / admin

After 1b+: crons and admin generate/send call `billingEngine` only. Sole generate implementation is `MonthlyInvoiceGenerator` via `generateRecurring`; legacy `generate-invoices` / `generate-invoices-25th` (`BillingService`) are disabled (schedule must still cover all `billing_day`s).

## Testing

```bash
npx jest __tests__/lib/billing/engine/
```
