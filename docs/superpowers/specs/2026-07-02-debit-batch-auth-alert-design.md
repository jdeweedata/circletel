# Debit Batch Authorisation Alert — Design

**Date**: 2026-07-02
**Status**: Approved (interim measure)
**Author**: Claude + Jeffrey

## Problem

Debit order batches are submitted to NetCash automatically every morning (06:00 SAST) by two crons, but **authorisation is still manual**:

- `app/api/cron/submit-debit-orders` (bank debit orders) — no authorisation step at all on `main` (`authoriseBatch` was dropped in `89097bdf`; programmatic `RequestBatchAuthorise` lives on the unmerged `feat/netcash-batch-authorise` branch, blocked on NetCash enabling Auto Auth — error 322).
- `app/api/cron/submit-cc-debit-orders` (credit-card debits) — calls `authoriseBatch()`, but on failure it only logs a warning and continues.

Nobody is notified that a batch is sitting unauthorised. The NetCash account has **Auto forward action date = off**, so a batch not authorised before cut-off silently misses its collection date. This has real cash-flow impact (missed R450 clinic collections, expired batches needing re-collection).

## Goal

Until NetCash enables Auto Auth and `feat/netcash-batch-authorise` merges: **email the people who can authorise, the moment a batch needs manual authorisation**, with enough detail to act immediately.

Explicitly out of scope (per decision 2026-07-02):
- Escalation/reminder cron that polls authorisation status later in the day.
- Any change to batch submission or authorisation logic itself.

## Design

### New module: `lib/billing/debit-batch-alert.ts`

One exported function:

```typescript
export interface BatchAuthorisationAlertDetails {
  batchType: 'bank_debit_order' | 'credit_card';
  batchName: string;          // e.g. CircleTel-2026-07-03-1751...
  fileToken?: string;         // NetCash file token / batch ID
  itemCount: number;
  totalAmount: number;        // Rands
  actionDate: string;         // YYYY-MM-DD — the collection date at risk
  loadReportStatus?: string;  // bank DO cron only
  reason?: string;            // CC cron: why auto-authorise failed
}

export async function sendBatchAuthorisationAlert(
  details: BatchAuthorisationAlertDetails
): Promise<{ success: boolean; error?: string }>
```

Behaviour:
- Sends **one email** via the Resend HTTP API (`https://api.resend.com/emails`), same direct-fetch pattern as `PayNowBillingService.sendPayNowEmail` (`lib/billing/paynow-billing-service.ts:506`).
- **From**: `CircleTel Billing <billing@notify.circletel.co.za>` (verified Resend domain).
- **To** (default, overridable via comma-separated `DEBIT_BATCH_ALERT_EMAILS` env var):
  - `jeffrey.de.wee@circletel.co.za`
  - `jeffrey@newgengroup.co.za`
  - `finance@circletel.co.za`
- **Subject**: `⚠ Action required: authorise debit batch <batchName> — R<total> (<n> items)`
- **Body (HTML)**: batch type, batch name, file token, item count, total amount (en-ZA formatted), action date, submission time in SAST (`Africa/Johannesburg`), load-report status / failure reason when present, link to the NetCash merchant portal, and a one-line warning that Auto forward action date is OFF — an unauthorised batch misses its collection date.
- **Never throws.** All failures (missing `RESEND_API_KEY`, HTTP error, network error) return `{ success: false, error }` and log a warning via `cronLogger`. A notification failure must never fail the cron or the batch.
- Resend `tags`: `{ type: 'debit-batch-auth-alert' }` for filtering in the Resend dashboard.

### Call site 1 — `app/api/cron/submit-debit-orders/route.ts` (bank DO)

After the load-report verification block (step 5) and before `recordBatchSubmission` (step 6): **always** send the alert when `batchResult.success` is true. There is no auto-authorisation on this path, so every submitted batch requires manual action. Pass `loadReportStatus` from the step-5 report. Wrap in try/catch; if the alert email fails, log a warning only — do not touch `result.errors` and do not widen the `SubmissionResult` interface (it has no `warnings` field).

### Call site 2 — `app/api/cron/submit-cc-debit-orders/route.ts` (credit card)

In step 6: send the alert **only when manual action is needed** —
- `batchResult.batchId` is missing (auto-authorise never ran), or
- `authoriseBatch()` returned `success: false` (pass its `error` as `reason`).

If auto-authorisation succeeded, no email (no noise). This route has a `result.warnings` array — push a warning there if the alert email itself fails.

### Convergence with the future Auto Auth work

When `feat/netcash-batch-authorise` merges, the bank-DO cron gains an `authoriseBatch` step and its call site changes to the same conditional shape as the CC cron ("email only on auto-authorise failure"). The helper needs no changes — it becomes the failure-path alert instead of the every-batch alert.

## Error handling summary

| Failure | Behaviour |
|---------|-----------|
| `RESEND_API_KEY` unset | Log warning, return `{ success: false }`, cron unaffected |
| Resend HTTP non-2xx | Log warning with status/message, cron unaffected |
| Network/exception | Caught, logged, cron unaffected |
| Malformed `DEBIT_BATCH_ALERT_EMAILS` | Entries trimmed; empty entries dropped; if the list resolves empty, fall back to defaults |

## Testing

- **Unit tests** (`lib/billing/__tests__/debit-batch-alert.test.ts`, Jest, `global.fetch` mocked):
  - sends to the 3 default recipients with correct from/subject/tags;
  - `DEBIT_BATCH_ALERT_EMAILS` override respected; empty/garbage value falls back to defaults;
  - subject contains batch name, formatted total, item count;
  - body contains action date and file token; includes `reason` when provided;
  - missing `RESEND_API_KEY` → `{ success: false }`, **no fetch call**;
  - fetch rejection / non-2xx → `{ success: false }`, no throw.
- **Live verification** (before merge): one-off script invocation sending a real alert with dummy batch details to the 3 addresses; confirm receipt.
- Existing cron behaviour unchanged: type-check passes; no change to `SubmissionResult` shapes.

## Blast radius

- 1 new file (`lib/billing/debit-batch-alert.ts`)
- 2 cron routes touched, a few lines each, both inside already-guarded success paths
- 1 new test file
- No DB, no migration, no client-side code, no new dependency (uses `fetch` + existing `RESEND_API_KEY`)

## Rollout

Feature branch off `main` → staging push (smoke: manual `POST /api/cron/submit-debit-orders` with a past date on staging is NOT safe — it shares the prod DB; verify via unit tests + live email script instead) → PR to `main`. Optionally set `DEBIT_BATCH_ALERT_EMAILS` in Coolify env if recipients need to change without a deploy.
