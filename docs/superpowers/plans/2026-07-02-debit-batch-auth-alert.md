# Debit Batch Authorisation Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email the finance team the moment a NetCash debit batch is submitted and needs manual authorisation, so batches stop missing their collection dates while Auto Auth is pending.

**Architecture:** One new pure-ish helper module (`lib/billing/debit-batch-alert.ts`) that sends a Resend email; two existing cron routes call it after batch submission. Bank-DO cron always alerts (no auto-authorise exists on main); CC cron alerts only when its `authoriseBatch()` call fails or never ran.

**Tech Stack:** Next.js 15 API routes (existing crons), Resend HTTP API via native `fetch`, Jest for unit tests.

**Spec:** `docs/superpowers/specs/2026-07-02-debit-batch-auth-alert-design.md`

## Global Constraints

- Work on branch `feat/debit-batch-auth-alert` off `origin/main` in an isolated worktree — the main working tree has unrelated in-flight work (`fix/offers-build-time-db`).
- Sender must be exactly `CircleTel Billing <billing@notify.circletel.co.za>` (verified Resend domain).
- Default recipients, exact: `jeffrey.de.wee@circletel.co.za`, `jeffrey@newgengroup.co.za`, `finance@circletel.co.za`. Env override var name: `DEBIT_BATCH_ALERT_EMAILS` (comma-separated).
- The alert email must NEVER throw or fail the cron — every failure path returns `{ success: false, error }`.
- Do not change `SubmissionResult` / `CCSubmissionResult` shapes or any batch submission/authorisation logic.
- Amounts are in Rands (`amount: number` on both item types). `actionDate` on batch items is a `Date`, not a string.
- `cronLogger` comes from `@/lib/logging` (already imported in both cron routes).
- Type-check command: `npm run type-check:memory`. Test command: `npx jest lib/billing/__tests__/debit-batch-alert.test.ts`.

---

### Task 0: Worktree + branch + commit design docs

**Files:**
- Create: worktree at `.worktrees/debit-batch-alert` on branch `feat/debit-batch-auth-alert`
- Commit: `docs/superpowers/specs/2026-07-02-debit-batch-auth-alert-design.md`, `docs/superpowers/plans/2026-07-02-debit-batch-auth-alert.md`

- [ ] **Step 1: Create the worktree** (or use superpowers:using-git-worktrees if executing interactively)

```bash
cd /home/circletel
git fetch origin main
git worktree add .worktrees/debit-batch-alert -b feat/debit-batch-auth-alert origin/main
```

- [ ] **Step 2: Copy the spec + plan from the main working tree (they are untracked there) and commit**

```bash
mkdir -p .worktrees/debit-batch-alert/docs/superpowers/specs .worktrees/debit-batch-alert/docs/superpowers/plans
cp docs/superpowers/specs/2026-07-02-debit-batch-auth-alert-design.md .worktrees/debit-batch-alert/docs/superpowers/specs/
cp docs/superpowers/plans/2026-07-02-debit-batch-auth-alert.md .worktrees/debit-batch-alert/docs/superpowers/plans/
cd .worktrees/debit-batch-alert
git add docs/superpowers
git commit -m "docs(spec+plan): debit batch authorisation alert email

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

All subsequent tasks run inside `.worktrees/debit-batch-alert`.

---

### Task 1: Alert helper module with unit tests

**Files:**
- Create: `lib/billing/debit-batch-alert.ts`
- Test: `lib/billing/__tests__/debit-batch-alert.test.ts`

**Interfaces:**
- Consumes: `cronLogger` from `@/lib/logging`; `process.env.RESEND_API_KEY`, `process.env.DEBIT_BATCH_ALERT_EMAILS`.
- Produces (used by Tasks 2 and 3):
  ```typescript
  export interface BatchAuthorisationAlertDetails {
    batchType: 'bank_debit_order' | 'credit_card';
    batchName: string;
    fileToken?: string;
    itemCount: number;
    totalAmount: number;      // Rands
    actionDate: string;       // YYYY-MM-DD
    loadReportStatus?: string;
    reason?: string;
  }
  export function resolveAlertRecipients(raw?: string): string[]
  export async function sendBatchAuthorisationAlert(
    details: BatchAuthorisationAlertDetails
  ): Promise<{ success: boolean; error?: string }>
  ```

- [ ] **Step 1: Write the failing tests**

Create `lib/billing/__tests__/debit-batch-alert.test.ts`:

```typescript
/**
 * Tests for debit-batch-alert
 *
 * Covers: recipient resolution (defaults, env override, garbage fallback),
 * email payload construction, and non-throwing failure paths.
 */

import {
  resolveAlertRecipients,
  sendBatchAuthorisationAlert,
  type BatchAuthorisationAlertDetails,
} from '../debit-batch-alert';

const DETAILS: BatchAuthorisationAlertDetails = {
  batchType: 'bank_debit_order',
  batchName: 'CircleTel-2026-07-03-1751500000000',
  fileToken: 'FT-12345',
  itemCount: 9,
  totalAmount: 4050,
  actionDate: '2026-07-03',
  loadReportStatus: 'SUCCESSFUL',
};

describe('resolveAlertRecipients', () => {
  test('returns the three default recipients when env is unset', () => {
    expect(resolveAlertRecipients(undefined)).toEqual([
      'jeffrey.de.wee@circletel.co.za',
      'jeffrey@newgengroup.co.za',
      'finance@circletel.co.za',
    ]);
  });

  test('parses a comma-separated override, trimming whitespace', () => {
    expect(resolveAlertRecipients(' a@x.co.za , b@y.co.za ')).toEqual([
      'a@x.co.za',
      'b@y.co.za',
    ]);
  });

  test('falls back to defaults when the override contains no valid addresses', () => {
    expect(resolveAlertRecipients(' , not-an-email, ')).toEqual([
      'jeffrey.de.wee@circletel.co.za',
      'jeffrey@newgengroup.co.za',
      'finance@circletel.co.za',
    ]);
  });
});

describe('sendBatchAuthorisationAlert', () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = { ...originalEnv, RESEND_API_KEY: 'test-key' };
    delete process.env.DEBIT_BATCH_ALERT_EMAILS;
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-id-1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('sends one Resend email to the default recipients with correct sender and subject', async () => {
    const result = await sendBatchAuthorisationAlert(DETAILS);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(init.body);
    expect(body.from).toBe('CircleTel Billing <billing@notify.circletel.co.za>');
    expect(body.to).toEqual([
      'jeffrey.de.wee@circletel.co.za',
      'jeffrey@newgengroup.co.za',
      'finance@circletel.co.za',
    ]);
    expect(body.subject).toContain('Action required');
    expect(body.subject).toContain('CircleTel-2026-07-03-1751500000000');
    expect(body.subject).toContain('9 items');
    expect(body.tags).toEqual([{ name: 'type', value: 'debit-batch-auth-alert' }]);
  });

  test('body contains action date, file token, total, and load report status', async () => {
    await sendBatchAuthorisationAlert(DETAILS);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).toContain('2026-07-03');
    expect(body.html).toContain('FT-12345');
    expect(body.html).toContain('4,050.00');
    expect(body.html).toContain('SUCCESSFUL');
  });

  test('includes the failure reason for credit-card batches', async () => {
    await sendBatchAuthorisationAlert({
      ...DETAILS,
      batchType: 'credit_card',
      loadReportStatus: undefined,
      reason: 'Auto-authorisation failed: error 322',
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).toContain('Auto-authorisation failed: error 322');
    expect(body.html).toContain('Credit card');
  });

  test('respects DEBIT_BATCH_ALERT_EMAILS override', async () => {
    process.env.DEBIT_BATCH_ALERT_EMAILS = 'ops@circletel.co.za';
    await sendBatchAuthorisationAlert(DETAILS);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['ops@circletel.co.za']);
  });

  test('returns failure without calling fetch when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendBatchAuthorisationAlert(DETAILS);
    expect(result.success).toBe(false);
    expect(result.error).toContain('RESEND_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns failure (does not throw) on non-2xx response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'invalid recipient' }),
    });
    const result = await sendBatchAuthorisationAlert(DETAILS);
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid recipient');
  });

  test('returns failure (does not throw) when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const result = await sendBatchAuthorisationAlert(DETAILS);
    expect(result.success).toBe(false);
    expect(result.error).toContain('network down');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest lib/billing/__tests__/debit-batch-alert.test.ts`
Expected: FAIL — `Cannot find module '../debit-batch-alert'`

- [ ] **Step 3: Write the implementation**

Create `lib/billing/debit-batch-alert.ts`:

```typescript
/**
 * Debit Batch Authorisation Alert
 *
 * Interim measure while NetCash Auto Auth is pending (error 322,
 * feat/netcash-batch-authorise unmerged): emails the finance team when a
 * submitted debit batch requires MANUAL authorisation in the NetCash portal.
 *
 * The NetCash account (52552945156) has "Auto forward action date" OFF —
 * a batch not authorised before cut-off silently misses its collection date.
 *
 * A notification failure must never fail the calling cron: this module
 * never throws; all failures resolve to { success: false, error }.
 *
 * @module lib/billing/debit-batch-alert
 */

import { cronLogger } from '@/lib/logging';

const DEFAULT_RECIPIENTS = [
  'jeffrey.de.wee@circletel.co.za',
  'jeffrey@newgengroup.co.za',
  'finance@circletel.co.za',
];

const FROM = 'CircleTel Billing <billing@notify.circletel.co.za>';
const NETCASH_PORTAL_URL = 'https://merchant.netcash.co.za';

export interface BatchAuthorisationAlertDetails {
  batchType: 'bank_debit_order' | 'credit_card';
  batchName: string;
  fileToken?: string;
  itemCount: number;
  totalAmount: number;      // Rands
  actionDate: string;       // YYYY-MM-DD — the collection date at risk
  loadReportStatus?: string;
  reason?: string;          // e.g. why auto-authorisation failed
}

export function resolveAlertRecipients(
  raw: string | undefined = process.env.DEBIT_BATCH_ALERT_EMAILS
): string[] {
  if (!raw) return DEFAULT_RECIPIENTS;
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.includes('@'));
  return parsed.length > 0 ? parsed : DEFAULT_RECIPIENTS;
}

function formatRands(amount: number): string {
  // en-US grouping (comma thousands, dot decimal) — en-ZA formats as
  // "4 050,00" which reads ambiguously in email clients.
  return `R${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildAlertHtml(details: BatchAuthorisationAlertDetails): string {
  const typeLabel =
    details.batchType === 'credit_card' ? 'Credit card' : 'Bank debit order';
  const submittedAt = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows: Array<[string, string]> = [
    ['Batch type', typeLabel],
    ['Batch name', details.batchName],
    ['File token', details.fileToken || 'n/a'],
    ['Items', String(details.itemCount)],
    ['Total', formatRands(details.totalAmount)],
    ['Action date', details.actionDate],
    ['Submitted', `${submittedAt} (SAST)`],
  ];
  if (details.loadReportStatus) {
    rows.push(['Load report', details.loadReportStatus]);
  }
  if (details.reason) {
    rows.push(['Reason', details.reason]);
  }

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;">${label}</td><td style="padding:4px 0;font-weight:600;">${value}</td></tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4A;">
      <h2 style="color:#E87A1E;">Debit batch awaiting authorisation</h2>
      <p>A ${typeLabel.toLowerCase()} batch was submitted to NetCash and
      <strong>requires manual authorisation</strong> before the cut-off for its action date.</p>
      <table style="border-collapse:collapse;font-size:14px;">${tableRows}</table>
      <p style="margin-top:16px;">
        <a href="${NETCASH_PORTAL_URL}"
           style="background:#E87A1E;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">
          Authorise in NetCash portal
        </a>
      </p>
      <p style="font-size:12px;color:#999;">
        Auto forward action date is OFF on this account — if the batch is not
        authorised in time, the collection is missed (not rolled forward).
        This alert is an interim measure until NetCash Auto Auth is enabled.
      </p>
    </div>
  `;
}

export async function sendBatchAuthorisationAlert(
  details: BatchAuthorisationAlertDetails
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    cronLogger.warn('[DebitBatchAlert] RESEND_API_KEY not configured, skipping alert email');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const subject = `⚠ Action required: authorise debit batch ${details.batchName} — ${formatRands(details.totalAmount)} (${details.itemCount} items)`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: resolveAlertRecipients(),
        subject,
        html: buildAlertHtml(details),
        tags: [{ name: 'type', value: 'debit-batch-auth-alert' }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as { message?: string }));
      const error = errorData.message || `HTTP ${response.status}`;
      cronLogger.warn('[DebitBatchAlert] Resend rejected alert email', { error });
      return { success: false, error };
    }

    cronLogger.info('[DebitBatchAlert] Authorisation alert sent', {
      batchName: details.batchName,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cronLogger.warn('[DebitBatchAlert] Failed to send alert email', { error: message });
    return { success: false, error: message };
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest lib/billing/__tests__/debit-batch-alert.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: Commit**

```bash
git add lib/billing/debit-batch-alert.ts lib/billing/__tests__/debit-batch-alert.test.ts
git commit -m "feat(billing): debit batch authorisation alert email helper

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Wire into bank debit-order cron (always alert)

**Files:**
- Modify: `app/api/cron/submit-debit-orders/route.ts` (import block ~line 19-26; load-report section ~lines 345-362)

**Interfaces:**
- Consumes: `sendBatchAuthorisationAlert`, `BatchAuthorisationAlertDetails` from Task 1. In scope at the call site: `batchName` (string), `batchResult.fileToken` (string|undefined), `batchResult.itemsSubmitted` (number), `eligibleItems` (`DebitOrderItem[]` — `amount: number` Rands, `actionDate: Date`).
- Produces: nothing new — `SubmissionResult` unchanged.

- [ ] **Step 1: Add the import**

In the import block at the top of `app/api/cron/submit-debit-orders/route.ts`, after the `PayNowBillingService` import:

```typescript
import { sendBatchAuthorisationAlert } from '@/lib/billing/debit-batch-alert';
```

- [ ] **Step 2: Capture the load-report status and send the alert**

The existing step-5 block reads:

```typescript
  if (batchResult.fileToken) {
    const reportResult = await netcashDebitBatchService.requestLoadReport(batchResult.fileToken);

    if (reportResult.result !== 'SUCCESSFUL' && reportResult.result !== 'SUCCESSFUL WITH ERRORS') {
```

Hoist a status variable and add the alert immediately after the block, before the `// 6. Record batch submission in database` comment:

```typescript
  let loadReportStatus: string | undefined;

  if (batchResult.fileToken) {
    const reportResult = await netcashDebitBatchService.requestLoadReport(batchResult.fileToken);
    loadReportStatus = reportResult.result;

    if (reportResult.result !== 'SUCCESSFUL' && reportResult.result !== 'SUCCESSFUL WITH ERRORS') {
      result.errors.push(`Load report status: ${reportResult.result || 'unknown'}`);
      if (reportResult.errors.length > 0) {
        result.errors.push(...reportResult.errors.map(e => e.message));
      }
      cronLogger.warn('Batch submitted but load report indicates issues', { result: reportResult.result });
    } else {
      cronLogger.info(`Batch ${batchResult.fileToken} load report: ${reportResult.result}`);
    }
  }

  // ============================================================================
  // 5b. Alert finance: batch requires MANUAL authorisation (interim measure
  // until NetCash Auto Auth is enabled — see docs/superpowers/specs/
  // 2026-07-02-debit-batch-auth-alert-design.md)
  // ============================================================================

  await sendBatchAuthorisationAlert({
    batchType: 'bank_debit_order',
    batchName,
    fileToken: batchResult.fileToken,
    itemCount: batchResult.itemsSubmitted,
    totalAmount: eligibleItems.reduce((sum, item) => sum + item.amount, 0),
    actionDate: eligibleItems[0].actionDate.toISOString().split('T')[0],
    loadReportStatus,
  });
```

Note: `sendBatchAuthorisationAlert` never throws (Task 1 contract), so no try/catch is needed at the call site, and `result` is not touched on alert failure.

- [ ] **Step 3: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "submit-debit-orders\|debit-batch-alert"`
Expected: no output (no new errors in these files; the repo has ~295 pre-existing errors elsewhere)

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/submit-debit-orders/route.ts
git commit -m "feat(billing): alert finance when bank debit batch awaits manual authorisation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Wire into CC debit-order cron (alert only on auto-authorise failure)

**Files:**
- Modify: `app/api/cron/submit-cc-debit-orders/route.ts` (import block ~line 19-25; authorise section ~lines 275-289)

**Interfaces:**
- Consumes: `sendBatchAuthorisationAlert` from Task 1. In scope at the call site: `batchName` (string), `batchResult.batchId` (string|undefined), `batchResult.itemsSubmitted` (number), `eligibleItems` (`amount: number` Rands, `actionDate: Date`), `result.warnings` (string[]).
- Produces: nothing new — result shape unchanged (only pushes to the existing `warnings` array).

- [ ] **Step 1: Add the import**

In the import block at the top of `app/api/cron/submit-cc-debit-orders/route.ts`:

```typescript
import { sendBatchAuthorisationAlert } from '@/lib/billing/debit-batch-alert';
```

- [ ] **Step 2: Replace step 6 with alert-on-failure logic**

The existing step-6 block reads:

```typescript
  if (batchResult.batchId) {
    const authResult = await netcashCCDebitBatchService.authoriseBatch(batchResult.batchId);

    if (!authResult.success) {
      result.errors.push(`Batch authorisation failed: ${authResult.error}`);
      cronLogger.warn('[CC Debit Cron] Batch not authorised', { error: authResult.error });
    } else {
      cronLogger.info(`[CC Debit Cron] Batch ${batchResult.batchId} authorised`);
    }
  }
```

Replace with (existing behaviour preserved; alert added on both manual-action paths):

```typescript
  let authFailureReason: string | undefined;

  if (batchResult.batchId) {
    const authResult = await netcashCCDebitBatchService.authoriseBatch(batchResult.batchId);

    if (!authResult.success) {
      authFailureReason = `Auto-authorisation failed: ${authResult.error}`;
      result.errors.push(`Batch authorisation failed: ${authResult.error}`);
      cronLogger.warn('[CC Debit Cron] Batch not authorised', { error: authResult.error });
    } else {
      cronLogger.info(`[CC Debit Cron] Batch ${batchResult.batchId} authorised`);
    }
  } else {
    authFailureReason = 'No batch ID returned — auto-authorisation never ran';
  }

  if (authFailureReason) {
    const alertResult = await sendBatchAuthorisationAlert({
      batchType: 'credit_card',
      batchName,
      fileToken: batchResult.batchId,
      itemCount: batchResult.itemsSubmitted,
      totalAmount: eligibleItems.reduce((sum, item) => sum + item.amount, 0),
      actionDate: eligibleItems[0].actionDate.toISOString().split('T')[0],
      reason: authFailureReason,
    });
    if (!alertResult.success) {
      result.warnings.push(`Authorisation alert email failed: ${alertResult.error}`);
    }
  }
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "submit-cc-debit-orders\|debit-batch-alert"`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/submit-cc-debit-orders/route.ts
git commit -m "feat(billing): alert finance when CC debit batch auto-authorisation fails

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Live verification script + full test run

**Files:**
- Create: `scripts/test-debit-batch-alert.ts`

**Interfaces:**
- Consumes: `sendBatchAuthorisationAlert` from Task 1; `.env.local` for `RESEND_API_KEY`.
- Produces: a real email in the three inboxes (manual confirmation step).

- [ ] **Step 1: Write the script**

Create `scripts/test-debit-batch-alert.ts`:

```typescript
/**
 * One-off live test for the debit batch authorisation alert email.
 *
 * Run (loads .env.local for RESEND_API_KEY):
 *   set -a && source .env.local && set +a && npx tsx scripts/test-debit-batch-alert.ts
 */

import { sendBatchAuthorisationAlert } from '../lib/billing/debit-batch-alert';

async function main() {
  const result = await sendBatchAuthorisationAlert({
    batchType: 'bank_debit_order',
    batchName: `CircleTel-TEST-${new Date().toISOString().split('T')[0]}`,
    fileToken: 'TEST-FILE-TOKEN',
    itemCount: 3,
    totalAmount: 1350,
    actionDate: new Date().toISOString().split('T')[0],
    loadReportStatus: 'SUCCESSFUL',
    reason: 'TEST EMAIL — no action required, please ignore',
  });
  console.log(result);
  process.exit(result.success ? 0 : 1);
}

main();
```

- [ ] **Step 2: Run the script and confirm delivery**

Run: `set -a && source ../../.env.local && set +a && npx tsx scripts/test-debit-batch-alert.ts`
(Path note: from the worktree, `.env.local` lives in the main checkout `/home/circletel/.env.local` — adjust the source path accordingly.)
Expected: `{ success: true }`, exit 0. Then confirm with the user that the email arrived at all three addresses before merging.

- [ ] **Step 3: Run the full unit test file once more**

Run: `npx jest lib/billing/__tests__/debit-batch-alert.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 4: Commit**

```bash
git add scripts/test-debit-batch-alert.ts
git commit -m "chore(billing): live test script for debit batch alert email

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Ship

- [ ] **Step 1: Push to staging first** (project deploy rule: staging precedes prod)

```bash
git push origin feat/debit-batch-auth-alert:staging
```

Note: staging shares the prod Supabase DB and prod NetCash account — do NOT manually trigger the cron endpoints as a test; the unit tests + live email script are the verification.

- [ ] **Step 2: Open the PR**

```bash
git push origin feat/debit-batch-auth-alert
gh pr create --base main --title "feat(billing): email finance when a debit batch awaits manual authorisation" --body "$(cat <<'EOF'
## Summary
Interim measure while NetCash Auto Auth (error 322) is pending and feat/netcash-batch-authorise is unmerged:
- New lib/billing/debit-batch-alert.ts — Resend email to jeffrey.de.wee@circletel.co.za, jeffrey@newgengroup.co.za, finance@circletel.co.za (override: DEBIT_BATCH_ALERT_EMAILS)
- submit-debit-orders cron: always alerts after batch upload (no auto-authorise exists on main)
- submit-cc-debit-orders cron: alerts only when authoriseBatch fails or never ran
- Alert failures never fail the cron

Spec: docs/superpowers/specs/2026-07-02-debit-batch-auth-alert-design.md

## Test plan
- 10 unit tests (lib/billing/__tests__/debit-batch-alert.test.ts)
- Live email verified to all 3 recipients via scripts/test-debit-batch-alert.ts

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: After merge, verify the first real alert**

The bank-DO cron runs daily at 04:00 UTC (06:00 SAST). On the next morning with eligible debit orders, confirm the alert email arrives and the batch gets authorised before cut-off. Check `gh run list --branch main --workflow deploy.yml` after merge (deploy failures don't page anyone).
