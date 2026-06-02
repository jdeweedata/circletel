# Billing Cron Remediation — Runbook / Implementation Plan

> **For operators:** This is an ops + data runbook with hard decision gates. Steps use checkbox
> (`- [ ]`) syntax. Several steps create real invoices and notify real customers — do NOT skip the
> dry-run gates. Source of evidence: `docs/audits/2026-06-02-netcash-payment-reconciliation.md` §9.

**Goal:** Restore recurring invoice generation so active customers (19 Unjani sites + 2 consumers) are
billed monthly, and reconcile the immediate June gap — without double-billing or notifying test accounts.

**Confirmed root cause:** The invoice-generation crons have **never executed** in production
(`billing_cron_logs` empty; `cron_execution_log` shows only `payment-reconciliation` + `stats-snapshot`).
The Coolify scheduler itself is healthy (those two ran today) — the billing crons were simply never added
to it. Schedules live only in `vercel.json`, which is dead post-Coolify-migration (2026-04-05).

**Key facts:**
- Coolify cron IS alive: `payment-reconciliation` (94 runs, last 2026-06-02 07:00), `stats-snapshot` (227 runs, last 2026-06-02 03:01).
- 28 active `customer_services`, all `billing_day=1`, all `last_invoice_date=NULL`. Breakdown: 19 Unjani (R450), 2 consumers (Prins R999, Shaun R899), **6 R0 test accounts**.
- Three overlapping invoice generators exist (must enable exactly ONE):
  | Endpoint | Schedule (vercel.json) | Engine | Dedup | dryRun | Audit table |
  |----------|------------------------|--------|-------|--------|-------------|
  | `/api/cron/generate-monthly-invoices` | `0 4 1 * *` | `MonthlyInvoiceGenerator` | `last_invoice_date` | ✅ | `billing_cron_logs` |
  | `/api/cron/generate-invoices-25th` | `0 4 25 * *` | window `[1..5]`, fires Inngest PayNow notif | (verify) | ✅ | `cron_execution_log` |
  | `/api/cron/generate-invoices` | `0 0 * * *` (daily) | older Task 2.4 | (verify) | (verify) | `cron_execution_log` |

---

## DECISION GATE 0 — Choose the authoritative generator (operator/business decision)

Exactly one invoice generator may be scheduled, or customers get double/triple-billed.

- **Recommendation:** Use `generate-monthly-invoices` (bills on the 1st, `billing_day`-matched) as the
  authoritative engine for the **catch-up** and ongoing recurring billing. Rationale: it has the safest
  `dryRun` (returns before any write — verified at `monthly-invoice-generator.ts:332`), idempotent dedup
  via `last_invoice_date` (prevents re-billing within a month), and a dedicated audit table.
- **Alternative (business model "generate 25th / due 1st", per PR #493):** Use `generate-invoices-25th`.
  If chosen, read that route fully and confirm its dedup before enabling — it fires customer PayNow
  notifications on every run.
- **Required action:** Pick ONE. The rest of this plan assumes `generate-monthly-invoices`. If you pick
  the 25th engine, swap the endpoint in Phases 3–5 accordingly.

- [ ] **Decision recorded:** authoritative generator = `__________________`

---

## Phase 1 — Deactivate the 6 test/system services (do FIRST)

Prevents R0 noise invoices + emails to test addresses on the catch-up run.

**Service IDs (verified 2026-06-02):**
`ffd59805-ed3b-4470-b73a-1a957a004ef8` (CTF-02630942), `08509cb3-b9cf-4c2c-85ae-4fc89a6476a5` (CTF-02633590/echo),
`39c268ca-1789-471f-880e-b83cc1a1c7c0` (CTF-03314099), `687694d5-5f9f-42ca-9735-2c0667ddd075` (CTF-35B741C8),
`506f87c9-f88a-4daa-bc83-bbc73322de7c` (CTF-AMOEBA-001), `6786c68b-af29-4026-8e7c-e6248a976f7a` (CTF-TEST-001).

- [ ] **Step 1 — Preview (read-only):**

```sql
SELECT id, customer_id, monthly_price, status FROM customer_services
WHERE id IN ('ffd59805-ed3b-4470-b73a-1a957a004ef8','08509cb3-b9cf-4c2c-85ae-4fc89a6476a5',
             '39c268ca-1789-471f-880e-b83cc1a1c7c0','687694d5-5f9f-42ca-9735-2c0667ddd075',
             '506f87c9-f88a-4daa-bc83-bbc73322de7c','6786c68b-af29-4026-8e7c-e6248a976f7a');
```
Expected: 6 rows, all `monthly_price=0`, `status='active'`.

- [ ] **Step 2 — Deactivate (mutating):**

```sql
UPDATE customer_services SET status = 'inactive', updated_at = now()
WHERE id IN ('ffd59805-ed3b-4470-b73a-1a957a004ef8','08509cb3-b9cf-4c2c-85ae-4fc89a6476a5',
             '39c268ca-1789-471f-880e-b83cc1a1c7c0','687694d5-5f9f-42ca-9735-2c0667ddd075',
             '506f87c9-f88a-4daa-bc83-bbc73322de7c','6786c68b-af29-4026-8e7c-e6248a976f7a')
  AND monthly_price = 0
RETURNING id, status;
```
Expected: 6 rows returned, `status='inactive'`.

- [ ] **Step 3 — Verify the billable set is now 22:**

```sql
SELECT count(*) AS active_billable, count(*) FILTER (WHERE monthly_price>0) AS paid
FROM customer_services WHERE status='active' AND billing_day=1;
```
Expected: 22 active, 21 paid (19 Unjani + Prins + Shaun). (One R0 may remain if not in the CTF set — investigate any R0 still active before proceeding.)

---

## Phase 2 — Dry-run preview of the catch-up run (no writes)

Confirms exactly who would be billed before any invoice is created. `dryRun` returns before all writes
(`monthly-invoice-generator.ts:332`). Run this yourself so `CRON_SECRET` stays in your shell:

- [ ] **Step 1 — Dry run against production (type with the `!` prefix in chat, or run in your terminal):**

```bash
! set -a; source /home/circletel/.env.local; set +a; \
curl -s -X POST https://www.circletel.co.za/api/cron/generate-monthly-invoices \
  -H "Authorization: Bearer $CRON_SECRET" -H "content-type: application/json" \
  -d '{"dryRun":true,"billingDay":1}' | jq '{totalServices,servicesProcessed,invoicesCreated,failed,skipped,dryRun}'
```
Expected: `dryRun:true`, `totalServices` ≈ 21, `invoicesCreated` (preview count) ≈ 21, `failed:0`.

- [ ] **Step 2 — GATE:** If `failed > 0` or `totalServices` is unexpected, STOP and investigate the
  `results[]` array (full response without the `jq` filter). Do not proceed to Phase 3.

---

## Phase 3 — Catch-up run for June (creates real invoices + notifications) — GATED

> ⚠️ This creates ~21 real invoices, syncs them to ZOHO, and sends Pay Now notifications to 19 clinics +
> 2 customers. Requires explicit operator go-ahead AFTER Phase 2 looks correct.

- [ ] **Step 1 — Real run:**

```bash
! set -a; source /home/circletel/.env.local; set +a; \
curl -s -X POST https://www.circletel.co.za/api/cron/generate-monthly-invoices \
  -H "Authorization: Bearer $CRON_SECRET" -H "content-type: application/json" \
  -d '{"billingDay":1}' | jq '{runId,totalServices,invoicesCreated,failed,skipped}'
```
Expected: `invoicesCreated` ≈ 21, `failed:0`.

- [ ] **Step 2 — Verify invoices + audit row:**

```sql
SELECT count(*) AS new_invoices FROM customer_invoices WHERE created_at::date = current_date;
SELECT created_at, services_processed, invoices_created, dry_run FROM billing_cron_logs ORDER BY created_at DESC LIMIT 1;
SELECT count(*) AS still_null FROM customer_services WHERE status='active' AND billing_day=1 AND last_invoice_date IS NULL;
```
Expected: ~21 new invoices; one fresh `billing_cron_logs` row (`dry_run=false`); `still_null = 0`.

- [ ] **Step 3 — Re-run idempotency check:** repeat Step 1. Expected: `invoicesCreated:0`, all `skipped`
  ("Already billed this month"). Confirms no double-billing.

---

## Phase 4 — Restore recurring scheduling on Coolify (operator, infra)

The endpoint works; it just needs to be on the Coolify schedule like `payment-reconciliation` is.

- [ ] **Step 1 — Inspect the working reference task:** In Coolify, open the existing scheduled task for
  `payment-reconciliation` (it ran 2026-06-02 07:00). Note its exact command form (curl to the app +
  `Authorization: Bearer` header) and container.

- [ ] **Step 2 — Create the billing scheduled task**, mirroring that pattern:
  - **Command:** `curl -s -X POST http://localhost:3000/api/cron/generate-monthly-invoices -H "Authorization: Bearer $CRON_SECRET" -H "content-type: application/json" -d '{}'`
    (use the same internal URL the reference task uses; `$CRON_SECRET` from the app env).
  - **Schedule:** `0 4 1 * *` (04:00 UTC = 06:00 SAST on the 1st), matching `vercel.json`.
  - On the 1st, an empty body makes `billingDay` default to today (= 1), matching all `billing_day=1` services.

- [ ] **Step 3 — Smoke test the task:** trigger it manually from Coolify once (it is idempotent — same
  month → all skipped). Confirm a new `billing_cron_logs` row appears with `dry_run=false`, `invoices_created=0`.

---

## Phase 5 — Retire the redundant generators (prevent double-billing)

- [ ] **Step 1 — Ensure ONLY the chosen generator is scheduled on Coolify.** Do NOT create Coolify tasks
  for `generate-invoices` or `generate-invoices-25th` (unless one of them was chosen in Gate 0, in which
  case it is the only one scheduled).

- [ ] **Step 2 — Mark the dead schedules in `vercel.json`** with a comment/PR note that they are
  superseded (vercel.json is inert post-migration, but it misleads readers). Modify
  `vercel.json` to remove or annotate the two non-authoritative invoice-generation cron entries. Commit:

```bash
git add vercel.json
git commit -m "chore(billing): mark non-authoritative invoice crons as superseded (Coolify uses one generator)"
```

- [ ] **Step 3 — Document the decision** in `docs/audits/2026-06-02-netcash-payment-reconciliation.md`
  §9 (which generator is authoritative and why).

---

## Phase 6 — Final verification

- [ ] All 21 billable services have `last_invoice_date = current month`.
- [ ] `billing_cron_logs` has a real (non-dry) run row dated today.
- [ ] Exactly ONE invoice-generation Coolify task exists.
- [ ] Re-running the generator the same month creates 0 invoices (idempotent).
- [ ] (Next cycle) On the next scheduled date, a new `billing_cron_logs` row appears automatically.

---

## Out of scope (track separately)

- **Finding 7** (order-webhook dead branch) and the **order→`customer_services` bridge** — new consumer
  orders still won't auto-create billable services. Separate branch.
- **Transaction↔invoice link gap** (9 orphan `payment_transactions`) — ledger hygiene; separate task.
- **35 stuck `pending` transactions** — PM-VAL validations never confirmed; separate cleanup.
- The `feature/netcash-webhook-auth-hardening` branch (P0 webhook fixes) — still pending PR/merge.
