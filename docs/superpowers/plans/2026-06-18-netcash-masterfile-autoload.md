> ⚠️ **SUPERSEDED 2026-06-18** by `2026-06-18-netcash-direct-debit-fix.md`. The test-profile spike proved the masterfile load is unnecessary — a `TwoDay` debit with inline bank details collects without signature or masterfile. Task 1's `MandateToMasterfile` code (commit cc28f085) remains but is unused. Kept for history only.

# NetCash Masterfile Auto-Load (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote already-submitted (but unsigned) business-account eMandates into the NetCash Debit Order Masterfile via the `MandateToMasterfile` instruction, so the two live clinics (CT-2026-00016, CT-2026-00017) can be billed without waiting for the eMandate signature.

**Architecture:** NetCash's `MandateToMasterfile` BatchFileUpload instruction takes only the **account reference** of an existing mandate and injects that mandate's captured profile (bank details, amount) into the active masterfile — bypassing the "Awaiting authorisation" signature gate. We add one builder + one method to the existing [netcash-emandate-batch-service.ts](../../../lib/payments/netcash-emandate-batch-service.ts), reusing its SOAP call, vendor key, and load-report polling verbatim. Whether the bypass actually works on an *unsigned* mandate is unproven, so Task 2 is a GO/NO-GO spike on a NetCash **test** profile before any real money moves.

**Tech Stack:** TypeScript, NetCash NIWS_NIF SOAP (`BatchFileUpload`, `RequestFileUploadReport`, `UploadDebitOrderBatch`, `AuthoriseBatch`), Jest, tsx scripts.

## Global Constraints

- Account references max **22 chars**, min 2 (NetCash field 101).
- `MandateToMasterfile` requires **only field 101** (account reference). Do NOT send bank/account-type fields — they come from the existing mandate. (The "account type = 2 = business" claim from the C# sample is wrong and unused.)
- File records: tab-delimited (`\t`), records joined by `\n`, structure `H` / `K` / `T…` / `F`.
- Footer (`F`) for non-financial loads: `F\t<txn count>\t0\t9999`.
- Software vendor key is the existing constant `24ade73c-98cf-47b3-99be-cc7b867b3080` (already in the service).
- Legal basis for collection = the wizard Step-5 click-wrap electronic mandate (user-approved 2026-06-18). eMandate is still fired in parallel for additional proof; it is NOT the collection gate.
- Real-money tasks (3, 4) run only after Task 2 returns GO. Minimal amount on first real cycle.
- Run scripts with creds loaded: `set -a && source .env.local && set +a && npx tsx <script>`. For test-profile runs, override the key inline: `NETCASH_DEBIT_ORDER_SERVICE_KEY=<TEST_KEY> npx tsx <script>`.

---

## Prerequisite (do before Task 2)

- [ ] **Obtain the NetCash TEST debit-order service key** for profile testing. Confirm with the NetCash account manager (profile Circle Tel SA 52552945156) whether a sandbox/test profile + service key exists, or use the documented NetCash test merchant key. Record it as `NETCASH_TEST_DEBIT_ORDER_SERVICE_KEY` in `.env.local` (gitignored). Task 2 cannot run without it.

---

## Task 1: `MandateToMasterfile` file builder + load method

**Files:**
- Modify: `lib/payments/netcash-emandate-batch-service.ts` (add two public methods after `submitBatch`, ~line 145)
- Test: `lib/payments/__tests__/netcash-emandate-batch-service.test.ts` (create)

**Interfaces:**
- Consumes: existing private `callBatchFileUpload(fileContent: string): Promise<EMandateBatchResult>`, private `formatDate(date: Date): string`, fields `this.serviceKey`, `this.softwareVendorKey`.
- Produces:
  - `buildMasterfileLoadFile(accountReferences: string[], batchName?: string): string`
  - `loadMandateToMasterfile(accountReferences: string[], batchName?: string): Promise<EMandateBatchResult>` (returns the existing `EMandateBatchResult` shape — `{ success, fileToken?, errorCode?, errorMessage? }`)
  - Reuses existing `requestLoadReport(fileToken: string): Promise<EMandateLoadReport>` for verification (no change).

- [ ] **Step 1: Write the failing test**

Create `lib/payments/__tests__/netcash-emandate-batch-service.test.ts`:

```ts
import { NetCashEMandateBatchService } from '../netcash-emandate-batch-service';

describe('buildMasterfileLoadFile', () => {
  const svc = new NetCashEMandateBatchService();

  it('builds H/K/T/F with MandateToMasterfile instruction and only field 101', () => {
    const file = svc.buildMasterfileLoadFile(['CT-2026-00016', 'CT-2026-00017'], 'TEST-BATCH');
    const lines = file.split('\n');

    // Header: H \t <serviceKey> \t 1 \t MandateToMasterfile \t <batch> \t <date> \t <vendorKey>
    expect(lines[0].split('\t')[0]).toBe('H');
    expect(lines[0].split('\t')[3]).toBe('MandateToMasterfile');
    expect(lines[0].split('\t')[4]).toBe('TEST-BATCH');

    // Key record: only field 101
    expect(lines[1]).toBe('K\t101');

    // Transaction records: one account reference each
    expect(lines[2]).toBe('T\tCT-2026-00016');
    expect(lines[3]).toBe('T\tCT-2026-00017');

    // Footer: F \t <count> \t 0 \t 9999
    expect(lines[4]).toBe('F\t2\t0\t9999');
  });

  it('truncates account references to 22 chars', () => {
    const file = svc.buildMasterfileLoadFile(['A'.repeat(30)]);
    const tLine = file.split('\n')[2];
    expect(tLine).toBe('T\t' + 'A'.repeat(22));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/payments/__tests__/netcash-emandate-batch-service.test.ts`
Expected: FAIL — `svc.buildMasterfileLoadFile is not a function`

- [ ] **Step 3: Add the two methods**

In `lib/payments/netcash-emandate-batch-service.ts`, after the `submitBatch` method (closes ~line 145), add:

```ts
  /**
   * Build a MandateToMasterfile BatchFileUpload file.
   * Promotes existing mandates (by account reference) into the active masterfile,
   * bypassing the eMandate signature gate. Only field 101 is required.
   */
  buildMasterfileLoadFile(accountReferences: string[], batchName?: string): string {
    const TAB = '\t';
    const NEWLINE = '\n';
    const today = this.formatDate(new Date());
    const name = batchName || `CircleTel-MF-${Date.now()}`;

    const header = [
      'H',
      this.serviceKey,
      '1',                       // Version
      'MandateToMasterfile',     // Instruction
      name,                      // Batch name
      today,                     // Action date (CCYYMMDD)
      this.softwareVendorKey,
    ].join(TAB);

    const key = ['K', '101'].join(TAB); // 101 = account reference (only required field)

    const transactions = accountReferences.map(ref =>
      ['T', ref.substring(0, 22)].join(TAB)
    );

    const footer = ['F', accountReferences.length.toString(), '0', '9999'].join(TAB);

    return [header, key, ...transactions, footer].join(NEWLINE);
  }

  /**
   * Submit a MandateToMasterfile load via BatchFileUpload.
   * Returns a file token; verify the result with requestLoadReport(fileToken).
   */
  async loadMandateToMasterfile(
    accountReferences: string[],
    batchName?: string
  ): Promise<EMandateBatchResult> {
    if (!this.serviceKey) {
      return { success: false, errorCode: 'CONFIG_ERROR', errorMessage: 'NetCash Debit Order Service Key not configured' };
    }
    if (accountReferences.length === 0) {
      return { success: false, errorCode: 'NO_ITEMS', errorMessage: 'No account references provided' };
    }
    const fileContent = this.buildMasterfileLoadFile(accountReferences, batchName);
    console.log('[Masterfile Load] File content:', fileContent);
    return this.callBatchFileUpload(fileContent);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/payments/__tests__/netcash-emandate-batch-service.test.ts`
Expected: PASS (2 passing)

- [ ] **Step 5: Type-check**

Run: `npm run type-check:memory`
Expected: no NEW errors in `netcash-emandate-batch-service.ts` (repo carries ~295 pre-existing errors; only your file matters).

- [ ] **Step 6: Commit**

```bash
git add lib/payments/netcash-emandate-batch-service.ts lib/payments/__tests__/netcash-emandate-batch-service.test.ts
git commit -m "feat(netcash): add MandateToMasterfile masterfile-load to eMandate batch service"
```

---

## Task 2: GO/NO-GO spike on the TEST profile (does the bypass work on an unsigned mandate?)

**Files:**
- Create: `scripts/netcash/verify-masterfile-load.ts`

**Interfaces:**
- Consumes: `NetCashEMandateBatchService.loadMandateToMasterfile`, `.requestLoadReport`, `.submitMandate`; `buildEMandateRequest` from `lib/onboarding/emandate-request.ts`; `netcashDebitBatchService.submitBatch`/`.authoriseBatch` from `lib/payments/netcash-debit-batch-service.ts`.
- Produces: console GO/NO-GO verdict. No code other tasks consume.

- [ ] **Step 1: Write the verification script**

Create `scripts/netcash/verify-masterfile-load.ts`:

```ts
/**
 * GO/NO-GO spike: does MandateToMasterfile promote an UNSIGNED mandate so it
 * becomes collectable? Run against the NetCash TEST profile ONLY.
 *
 * Run:
 *   set -a && source .env.local && set +a && \
 *   NETCASH_DEBIT_ORDER_SERVICE_KEY="$NETCASH_TEST_DEBIT_ORDER_SERVICE_KEY" \
 *   npx tsx scripts/netcash/verify-masterfile-load.ts
 */
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';
import { netcashDebitBatchService } from '@/lib/payments/netcash-debit-batch-service';

const REF = `CTTEST${Date.now()}`.substring(0, 22);

async function main() {
  const svc = new NetCashEMandateBatchService();

  // 1. Submit a fresh test mandate (Mandates instruction) — leave it UNSIGNED.
  console.log(`[1] Submitting test mandate ${REF} (will remain unsigned)...`);
  const mandate = await svc.submitMandate({
    accountReference: REF,
    mandateName: 'Masterfile Spike Test',
    isConsumer: false,
    firstName: 'Spike',
    surname: 'Test',
    mobileNumber: '0820000000',
    mandateAmount: 1.0, // minimal
    debitFrequency: 1,
    commencementMonth: new Date().getMonth() + 1,
    commencementDay: '01',
    agreementDate: new Date(),
    agreementReference: `SPIKE-${REF}`,
    tradingName: 'Spike Test Biz',
    registrationNumber: '0000/000000/07',
    registeredName: 'Spike Test Biz',
    bankDetailType: 1,
    bankAccountName: 'Spike Test Biz',
    bankAccountType: 1, // 1 = Current
    branchCode: '250655',
    bankAccountNumber: '62836392449', // test/dummy — use a NetCash test account number
    sendMandate: false, // do NOT send the signing link in the spike
  });
  console.log('    mandate submit:', mandate);
  if (!mandate.success) return console.log('NO-GO: mandate submit failed.');

  // 2. Promote to masterfile WITHOUT signing.
  console.log('[2] Firing MandateToMasterfile (no signature)...');
  const load = await svc.loadMandateToMasterfile([REF], `SPIKE-MF-${REF}`);
  console.log('    masterfile load:', load);
  if (!load.success || !load.fileToken) return console.log('NO-GO: masterfile load rejected.');

  // 3. Poll the load report.
  console.log('[3] Polling load report (~30-90s)...');
  await new Promise(r => setTimeout(r, 30_000));
  const report = await svc.requestLoadReport(load.fileToken);
  console.log('    load report:', JSON.stringify(report, null, 2));

  // 4. Attempt a minimal collection against the (hopefully) loaded masterfile ref.
  console.log('[4] Attempting R1.00 test collection...');
  const batch = await netcashDebitBatchService.submitBatch(
    [{ accountReference: REF, amount: 1.0, actionDate: new Date(Date.now() + 2 * 864e5), customerId: 'spike' }],
    `SPIKE-COLLECT-${REF}`,
  );
  console.log('    collection submit:', batch);

  const verdict = batch.success && !batch.errors.some(e => e.includes('316'));
  console.log(verdict
    ? '\n=== GO: unsigned mandate was promoted and is collectable. ==='
    : '\n=== NO-GO: collection blocked (likely err 316 — masterfile requires signature first). ===');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
```

- [ ] **Step 2: Run the spike against the TEST profile**

Run:
```bash
set -a && source .env.local && set +a && \
NETCASH_DEBIT_ORDER_SERVICE_KEY="$NETCASH_TEST_DEBIT_ORDER_SERVICE_KEY" \
npx tsx scripts/netcash/verify-masterfile-load.ts
```
Expected: a printed `GO` or `NO-GO` verdict plus the raw load report.

- [ ] **Step 3: Record the outcome + decide**

- If **GO**: proceed to Task 3.
- If **NO-GO**: STOP. The bypass doesn't work on unsigned mandates. Do not proceed to real clinics. Update memory ([netcash-masterfile-emandate-gating.md](../../../../root/.claude/projects/-home-circletel/memory/netcash-masterfile-emandate-gating.md)) with the finding and escalate to NetCash AM for the correct mechanism.

- [ ] **Step 4: Commit the script (regardless of verdict — it's reusable)**

```bash
git add scripts/netcash/verify-masterfile-load.ts
git commit -m "test(netcash): masterfile-load GO/NO-GO spike script"
```

---

## Task 3: Manually promote the two live clinics to the masterfile (real profile — only if Task 2 = GO)

**Files:**
- Create: `scripts/netcash/promote-clinics-to-masterfile.ts`

**Interfaces:**
- Consumes: `NetCashEMandateBatchService.loadMandateToMasterfile`, `.requestLoadReport`.

- [ ] **Step 1: Write the promotion script**

Create `scripts/netcash/promote-clinics-to-masterfile.ts`:

```ts
/**
 * Promote the two live Unjani clinics into the NetCash masterfile.
 * Real profile (52552945156). Run only after the Task 2 spike returns GO.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/netcash/promote-clinics-to-masterfile.ts
 */
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';

const REFS = ['CT-2026-00016', 'CT-2026-00017'];

async function main() {
  const svc = new NetCashEMandateBatchService();
  console.log('Promoting to masterfile:', REFS);
  const load = await svc.loadMandateToMasterfile(REFS, `UNJANI-MF-${Date.now()}`);
  console.log('load result:', load);
  if (!load.success || !load.fileToken) { console.log('FAILED — not loaded.'); process.exit(1); }

  await new Promise(r => setTimeout(r, 30_000));
  const report = await svc.requestLoadReport(load.fileToken);
  console.log('load report:', JSON.stringify(report, null, 2));
  console.log(report.result === 'SUCCESSFUL'
    ? 'BOTH clinics loaded to masterfile.'
    : `Review errors before collecting: ${report.result}`);
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
```

- [ ] **Step 2: Run it**

Run: `set -a && source .env.local && set +a && npx tsx scripts/netcash/promote-clinics-to-masterfile.ts`
Expected: load report `SUCCESSFUL` with no per-account errors.

- [ ] **Step 3: Confirm in the NetCash UI** that CT-2026-00016 and CT-2026-00017 now show **"Add to masterfile" populated / Mandate valid**, or appear under Manage debit orders → Masterfile.

- [ ] **Step 4: Commit**

```bash
git add scripts/netcash/promote-clinics-to-masterfile.ts
git commit -m "chore(netcash): script to promote Unjani clinics to masterfile"
```

---

## Task 4: Manually collect the two clinics (minimal first cycle — only after Task 3 SUCCESSFUL)

**Files:**
- Create: `scripts/netcash/collect-clinics.ts`

**Interfaces:**
- Consumes: `netcashDebitBatchService.submitBatch(items, batchName)`, `.authoriseBatch(batchId)`; `DebitOrderItem` shape from `lib/payments/netcash-debit-batch-service.ts`.

- [ ] **Step 1: Write the collection script**

Create `scripts/netcash/collect-clinics.ts`:

```ts
/**
 * Collect the monthly debit for the two loaded Unjani clinics.
 * Run only after Task 3 load report = SUCCESSFUL.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/netcash/collect-clinics.ts
 */
import { netcashDebitBatchService } from '@/lib/payments/netcash-debit-batch-service';

// R517.50 incl VAT (R450 ex VAT) per clinic. Confirm amount before running.
const ACTION_DATE = new Date(Date.now() + 2 * 864e5); // 2 business days out — adjust to billing day
const ITEMS = [
  { accountReference: 'CT-2026-00016', amount: 517.5, actionDate: ACTION_DATE, customerId: 'CT-2026-00016' },
  { accountReference: 'CT-2026-00017', amount: 517.5, actionDate: ACTION_DATE, customerId: 'CT-2026-00017' },
];

async function main() {
  const batch = await netcashDebitBatchService.submitBatch(ITEMS, `UNJANI-COLLECT-${Date.now()}`);
  console.log('submit:', batch);
  if (!batch.success || !batch.batchId) {
    console.log('Submit failed — if err 316, masterfile load did not take. STOP.');
    process.exit(1);
  }
  const auth = await netcashDebitBatchService.authoriseBatch(batch.batchId);
  console.log('authorise:', auth);
  console.log(auth.success ? 'Batch authorised — collection scheduled.' : 'Authorise FAILED — fix before relying on it.');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
```

- [ ] **Step 2: Verify the amount and action date** with the user before running (real money). Confirm R517.50 and the intended debit day.

- [ ] **Step 3: Run it**

Run: `set -a && source .env.local && set +a && npx tsx scripts/netcash/collect-clinics.ts`
Expected: `submit` returns a batchId, `authorise` returns success. No error 316.

- [ ] **Step 4: Confirm the batch** appears authorised in the NetCash UI under the debit-order batches.

- [ ] **Step 5: Commit**

```bash
git add scripts/netcash/collect-clinics.ts
git commit -m "chore(netcash): manual collection script for first Unjani clinic cycle"
```

---

## Phase 2 (separate plan, after Phase 1 proves GO)

Auto-wire `loadMandateToMasterfile([accountRef])` into the **vetting-approved** handler so every future business-account clinic is promoted to the masterfile the moment vetting completes (branch on `account_type === 'business'` / `isConsumer === false`). This needs the exact vetting-approval code path located first and its own plan; do not build it until Phase 1 returns GO and the two clinics collect cleanly.

## Self-Review

- **Spec coverage:** test-account-first (Task 2 spike) ✓; 2 clinics in prod (Tasks 3-4) ✓; future clinics on vetting (Phase 2, deferred) ✓; collect on click-wrap with eMandate in parallel (Global Constraints + existing `Mandates` flow already fires) ✓.
- **Placeholder scan:** all scripts and the method body are complete; no TODO/TBD. Amount R517.50 is flagged for explicit confirmation, not left blank.
- **Type consistency:** `loadMandateToMasterfile`/`buildMasterfileLoadFile` names consistent across Tasks 1-3; `EMandateBatchResult`/`EMandateLoadReport`/`DebitOrderItem` reused from existing exports; `requestLoadReport` signature unchanged.
