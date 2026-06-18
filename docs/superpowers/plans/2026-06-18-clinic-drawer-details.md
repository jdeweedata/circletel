# Clinic Drawer Site & Current-Service Details — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each clinic's site address, current (incumbent) ISP + cost, and contract status in the onboarding drawer, and make that drawer work for both pipeline clinics and not-yet-onboarded register clinics with an identical shared card.

**Architecture:** Persist incumbent fields in the existing `customers.clinic_details` JSONB (no migration). A shared server helper derives the fields from the network register. The drawer is refactored to a normalized shape with two modes — `pipeline` (DB-backed, with timeline) and `register` (register-file-backed, with a "Start onboarding" CTA). A new admin read endpoint serves register-clinic details (keeping PII server-side).

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (service role for admin), Jest, React (client dashboard), Tailwind, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-06-18-clinic-drawer-site-service-details-design.md`

**Verification model (per project conventions):** pure logic is unit-tested with Jest; routes and UI are verified with `npm run type-check:memory` + a real send/browse on staging (this repo does not unit-test React components or hit live Supabase in Jest).

---

### Task 1: Shared incumbent helper (pure logic, TDD)

**Files:**
- Create: `lib/onboarding/clinic-incumbent.ts`
- Test: `__tests__/lib/onboarding/clinic-incumbent.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/onboarding/clinic-incumbent.test.ts
import {
  deriveContractStatus,
  normClinicName,
  incumbentForClinic,
} from '@/lib/onboarding/clinic-incumbent';

describe('deriveContractStatus', () => {
  it('maps migration_ready true -> out_of_contract', () => {
    expect(deriveContractStatus(true)).toBe('out_of_contract');
  });
  it('maps migration_ready false -> in_contract', () => {
    expect(deriveContractStatus(false)).toBe('in_contract');
  });
  it('maps missing -> unknown', () => {
    expect(deriveContractStatus(undefined)).toBe('unknown');
    expect(deriveContractStatus(null)).toBe('unknown');
  });
});

describe('normClinicName', () => {
  it('strips the "Unjani Clinic - " prefix and lowercases', () => {
    expect(normClinicName('Unjani Clinic - Barcelona')).toBe('barcelona');
    expect(normClinicName('Barcelona')).toBe('barcelona');
  });
});

describe('incumbentForClinic', () => {
  it('returns register isp/cost/contract for a known clinic', () => {
    // "Lens Ext 10" is the first register entry (MTN, 2500, migration_ready true)
    const r = incumbentForClinic('Lens Ext 10');
    expect(r.incumbent_isp).toBe('MTN');
    expect(r.incumbent_cost).toBe(2500);
    expect(r.contract_status).toBe('out_of_contract');
  });
  it('returns unknown nulls for an unmatched clinic', () => {
    const r = incumbentForClinic('Definitely Not A Real Clinic');
    expect(r.incumbent_isp).toBeNull();
    expect(r.incumbent_cost).toBeNull();
    expect(r.contract_status).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/onboarding/clinic-incumbent.test.ts`
Expected: FAIL — "Cannot find module '@/lib/onboarding/clinic-incumbent'".

- [ ] **Step 3: Write the helper**

```ts
// lib/onboarding/clinic-incumbent.ts
/**
 * Shared mapping from the Unjani network register to the incumbent-connectivity
 * fields stored on customers.clinic_details. Used by the backfill script, the
 * register-clinic creation route, and the register-clinic-details read endpoint
 * so the drawer renders identically for pipeline and register clinics.
 */
import register from '@/lib/data/unjani-network-register.json';

export type ContractStatus = 'in_contract' | 'out_of_contract' | 'unknown';

export interface IncumbentFields {
  incumbent_isp: string | null;
  incumbent_cost: number | null;
  contract_status: ContractStatus;
}

export interface RegisterEntry {
  name: string;
  province: string | null;
  nurse: string | null;
  isp: string | null;
  isp_cost: number | null;
  saving: number | null;
  migration_ready: boolean;
}

/** migration_ready: true = free to switch (out of contract); false = locked in. */
export function deriveContractStatus(
  migrationReady: boolean | null | undefined
): ContractStatus {
  if (migrationReady === true) return 'out_of_contract';
  if (migrationReady === false) return 'in_contract';
  return 'unknown';
}

/** Normalise so pipeline names ("Unjani Clinic - Delmas") match register names ("Delmas"). */
export function normClinicName(s: string): string {
  return s.toLowerCase().replace(/^unjani clinic\s*-\s*/, '').trim();
}

const REGISTER_BY_NAME = new Map<string, RegisterEntry>(
  (register as { clinics: RegisterEntry[] }).clinics.map((c) => [normClinicName(c.name), c])
);

export function registerEntryForClinic(clinicName: string): RegisterEntry | undefined {
  return REGISTER_BY_NAME.get(normClinicName(clinicName));
}

export function incumbentForClinic(clinicName: string): IncumbentFields {
  const e = registerEntryForClinic(clinicName);
  return {
    incumbent_isp: e?.isp ?? null,
    incumbent_cost: e?.isp_cost ?? null,
    contract_status: deriveContractStatus(e?.migration_ready),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/onboarding/clinic-incumbent.test.ts`
Expected: PASS (8 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/clinic-incumbent.ts __tests__/lib/onboarding/clinic-incumbent.test.ts docs/superpowers/specs/2026-06-18-clinic-drawer-site-service-details-design.md docs/superpowers/plans/2026-06-18-clinic-drawer-details.md
git commit -m "feat(onboarding): shared incumbent-connectivity helper + spec/plan"
```

---

### Task 2: Backfill existing pipeline clinics

**Files:**
- Create: `scripts/backfill-clinic-incumbent.ts`

- [ ] **Step 1: Write the backfill script**

```ts
// scripts/backfill-clinic-incumbent.ts
/**
 * One-time, idempotent backfill: merge incumbent_isp / incumbent_cost /
 * contract_status into each Unjani customer's clinic_details, derived from the
 * network register (matched by clinic name). Other clinic_details keys are
 * preserved. Re-runnable.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/backfill-clinic-incumbent.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { incumbentForClinic } from '@/lib/onboarding/clinic-incumbent';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: clinics, error } = await supabase
    .from('customers')
    .select('id, account_number, business_name, clinic_details')
    .ilike('business_name', '%unjani%');
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const c of clinics ?? []) {
    const details = (c.clinic_details ?? {}) as Record<string, unknown>;
    const name = (details.clinic_name as string) || c.business_name || '';
    const inc = incumbentForClinic(name);
    const merged = { ...details, ...inc };
    const { error: upErr } = await supabase
      .from('customers')
      .update({ clinic_details: merged })
      .eq('id', c.id);
    if (upErr) {
      console.error(`✗ ${c.account_number}: ${upErr.message}`);
      continue;
    }
    updated++;
    console.log(`✓ ${c.account_number} (${name}) -> ${inc.incumbent_isp ?? '—'} / ${inc.contract_status}`);
  }
  console.log(`\nBackfilled ${updated}/${clinics?.length ?? 0} clinics.`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check:memory 2>&1 | grep backfill-clinic-incumbent || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 3: Commit**

```bash
git add scripts/backfill-clinic-incumbent.ts
git commit -m "feat(onboarding): backfill script for clinic incumbent fields"
```

(The script is **run on staging in Task 10**, not now — it writes to the shared Supabase.)

---

### Task 3: Seed incumbent fields on new-clinic creation

**Files:**
- Modify: `app/api/admin/unjani/register-clinic/route.ts`

- [ ] **Step 1: Add the import** (top of file, with the other imports)

```ts
import { incumbentForClinic } from '@/lib/onboarding/clinic-incumbent';
```

- [ ] **Step 2: Merge incumbent fields into the clinic_details insert**

Find the `clinic_details` object in the `customers` insert (currently):

```ts
        clinic_details: {
          clinic_name: clinicName,
          province,
          area_type: areaType,
          nurse_owner_name: nurseName || null,
          site_address: siteAddress || null,
        },
```

Replace with:

```ts
        clinic_details: {
          clinic_name: clinicName,
          province,
          area_type: areaType,
          nurse_owner_name: nurseName || null,
          site_address: siteAddress || null,
          ...incumbentForClinic(clinicName),
        },
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "register-clinic/route" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/unjani/register-clinic/route.ts
git commit -m "feat(onboarding): seed incumbent fields when creating a clinic"
```

---

### Task 4: Return incumbent + address from the pipeline API

**Files:**
- Modify: `app/api/admin/b2b/onboarding-pipeline/route.ts`

- [ ] **Step 1: Extend the `PipelineClinic` interface**

In the `interface PipelineClinic {` block (around line 16), add these fields (the `clinic_details` column is already selected in the query):

```ts
  site_address: string | null;
  incumbent_isp: string | null;
  incumbent_cost: number | null;
  contract_status: 'in_contract' | 'out_of_contract' | 'unknown';
```

- [ ] **Step 2: Populate them where each clinic row is mapped**

In the loop that builds each clinic result object (where `clinic_details` is read), pull from `clinic_details`:

```ts
      const cd = (clinic.clinic_details ?? {}) as Record<string, unknown>;
      // ...inside the pushed object:
      site_address: (cd.site_address as string) ?? null,
      incumbent_isp: (cd.incumbent_isp as string) ?? null,
      incumbent_cost: (cd.incumbent_cost as number) ?? null,
      contract_status:
        (cd.contract_status as 'in_contract' | 'out_of_contract' | 'unknown') ?? 'unknown',
```

(Read the existing mapping block first; add these keys alongside the existing ones. If a `cd`/`clinic_details` local already exists, reuse it.)

- [ ] **Step 3: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "onboarding-pipeline/route" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/b2b/onboarding-pipeline/route.ts
git commit -m "feat(onboarding): expose site address + incumbent fields in pipeline API"
```

---

### Task 5: Register-clinic-details read endpoint

**Files:**
- Create: `app/api/admin/unjani/register-clinic-details/route.ts`

- [ ] **Step 1: Write the route**

```ts
// app/api/admin/unjani/register-clinic-details/route.ts
/**
 * GET /api/admin/unjani/register-clinic-details?name=<clinicName>
 *
 * Returns the normalized drawer shape for a NOT-yet-onboarded register clinic:
 * public register fields (province, ISP, cost, contract status, saving) merged
 * with the server-only contact (nurse/phone/email/address). Also reports whether
 * the clinic already exists in the pipeline so the UI can route to pipeline mode.
 * Keeps the contacts file server-side (PII never ships to the browser).
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import {
  registerEntryForClinic,
  incumbentForClinic,
  normClinicName,
} from '@/lib/onboarding/clinic-incumbent';
import registerContacts from '@/lib/data/unjani-register-contacts.json';

interface RegisterContact {
  nurse: string | null;
  phone: string | null;
  email: string | null;
  province: string | null;
  area_type: string | null;
  address: string | null;
}
const CONTACTS = registerContacts as Record<string, RegisterContact>;

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const name = request.nextUrl.searchParams.get('name')?.trim();
  if (!name) {
    return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
  }

  const entry = registerEntryForClinic(name);
  if (!entry) {
    return NextResponse.json({ success: false, error: 'Clinic not found in register' }, { status: 404 });
  }
  const contact = CONTACTS[normClinicName(name)];
  const inc = incumbentForClinic(name);

  // Is this clinic already in the pipeline? (so the UI opens pipeline mode instead)
  const businessName = name.toLowerCase().startsWith('unjani') ? name : `Unjani Clinic - ${name}`;
  const supabase = svc();
  const { data: existing } = await supabase
    .from('customers')
    .select('id, account_number')
    .ilike('business_name', businessName)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    alreadyInPipeline: !!existing,
    accountNumber: existing?.account_number ?? null,
    clinic: {
      registerName: entry.name,
      businessName,
      nurseName: contact?.nurse ?? entry.nurse ?? null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      province: contact?.province ?? entry.province ?? null,
      siteAddress: contact?.address ?? null,
      incumbentIsp: inc.incumbent_isp,
      incumbentCost: inc.incumbent_cost,
      contractStatus: inc.contract_status,
      savingPerMonth: entry.saving ?? null,
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "register-clinic-details" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/unjani/register-clinic-details/route.ts
git commit -m "feat(onboarding): register-clinic-details read endpoint for pre-onboarding drawer"
```

---

### Task 6: Persist incumbent + address edits via update-contact

**Files:**
- Modify: `app/api/admin/unjani/update-contact/route.ts`

- [ ] **Step 1: Read the current route first**

Run: `sed -n '1,80p' app/api/admin/unjani/update-contact/route.ts`
Note how it currently reads `customerId, nurseName, phone, email` and writes `clinic_details` / `customers`.

- [ ] **Step 2: Accept the new fields and merge into clinic_details (read-modify-write)**

In the request body destructuring add:

```ts
  const { customerId, nurseName, phone, email,
          siteAddress, incumbentIsp, incumbentCost, contractStatus } = body;
```

Before updating, read existing `clinic_details`, then merge only the provided keys (so unrelated keys survive). Add near the update:

```ts
  const { data: current } = await supabase
    .from('customers')
    .select('clinic_details')
    .eq('id', customerId)
    .single();
  const details = (current?.clinic_details ?? {}) as Record<string, unknown>;

  const mergedDetails = {
    ...details,
    ...(nurseName !== undefined ? { nurse_owner_name: nurseName } : {}),
    ...(siteAddress !== undefined ? { site_address: siteAddress || null } : {}),
    ...(incumbentIsp !== undefined ? { incumbent_isp: incumbentIsp || null } : {}),
    ...(incumbentCost !== undefined
      ? { incumbent_cost: incumbentCost === '' || incumbentCost == null ? null : Number(incumbentCost) }
      : {}),
    ...(contractStatus !== undefined ? { contract_status: contractStatus } : {}),
  };
```

Then set `clinic_details: mergedDetails` in the `customers` update (keep the existing `phone`/`email` column updates as they are).

(Read the existing update call and slot `clinic_details: mergedDetails` into it; do not remove the existing phone/email handling.)

- [ ] **Step 3: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "update-contact/route" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/unjani/update-contact/route.ts
git commit -m "feat(onboarding): persist site address + incumbent fields via update-contact"
```

---

### Task 7: Drawer — "Site & current service" section + contract badge (pipeline mode)

**Files:**
- Modify: `app/admin/unjani/onboarding/page.tsx`

- [ ] **Step 1: Add the `PipelineClinic` fields** (mirror the API — in the local `interface PipelineClinic` near line 51)

```ts
  site_address: string | null;
  incumbent_isp: string | null;
  incumbent_cost: number | null;
  contract_status: 'in_contract' | 'out_of_contract' | 'unknown';
```

- [ ] **Step 2: Add a contract-status badge helper** (top-level, near `fmtRand`)

```tsx
const CONTRACT_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  in_contract: { label: 'In contract', bg: '#FCF6E5', fg: '#CA8A04' },
  out_of_contract: { label: 'Out of contract', bg: '#EAF7EF', fg: '#16A34A' },
  unknown: { label: 'Contract unknown', bg: '#F1F3F5', fg: '#6B7280' },
};

function ContractBadge({ status }: { status: string }) {
  const b = CONTRACT_BADGE[status] ?? CONTRACT_BADGE.unknown;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: b.bg, color: b.fg }}
    >
      {b.label}
    </span>
  );
}
```

- [ ] **Step 3: Render the section in the drawer** (after the CONTACT block, before the ONBOARDING TIMELINE block)

```tsx
              {/* Site & current service */}
              <div className="px-6 py-4 border-t border-gray-100">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-3">
                  SITE &amp; CURRENT SERVICE
                </p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Site address</dt>
                    <dd className="text-gray-900 text-right">
                      {drawerClinic.site_address || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Current provider</dt>
                    <dd className="text-gray-900 text-right">
                      {drawerClinic.incumbent_isp
                        ? `${drawerClinic.incumbent_isp}${drawerClinic.incumbent_cost ? ` · ${fmtRand(drawerClinic.incumbent_cost)}/mo` : ''}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 items-center">
                    <dt className="text-gray-500">Contract</dt>
                    <dd><ContractBadge status={drawerClinic.contract_status} /></dd>
                  </div>
                </dl>
              </div>
```

- [ ] **Step 4: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "unjani/onboarding/page" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add app/admin/unjani/onboarding/page.tsx
git commit -m "feat(onboarding): site & current-service section in clinic drawer"
```

---

### Task 8: Edit form — make the four fields editable (pipeline mode)

**Files:**
- Modify: `app/admin/unjani/onboarding/page.tsx`

- [ ] **Step 1: Add edit state** (next to `editNurse`/`editPhone`/`editEmail`)

```tsx
  const [editAddress, setEditAddress] = useState('');
  const [editIsp, setEditIsp] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editContract, setEditContract] = useState<'in_contract' | 'out_of_contract' | 'unknown'>('unknown');
```

- [ ] **Step 2: Seed them in `startEditContact`** (where editNurse/editPhone/editEmail are seeded)

```tsx
    setEditAddress(drawerClinic.site_address ?? '');
    setEditIsp(drawerClinic.incumbent_isp ?? '');
    setEditCost(drawerClinic.incumbent_cost != null ? String(drawerClinic.incumbent_cost) : '');
    setEditContract(drawerClinic.contract_status ?? 'unknown');
```

- [ ] **Step 3: Send them in `saveContact`** (add to the POST body)

```tsx
          siteAddress: editAddress.trim(),
          incumbentIsp: editIsp.trim(),
          incumbentCost: editCost.trim(),
          contractStatus: editContract,
```

After a successful save, also reflect them in the open drawer (in the existing `setDrawerClinic((c) => ...)` update) by spreading:

```tsx
        site_address: editAddress.trim() || null,
        incumbent_isp: editIsp.trim() || null,
        incumbent_cost: editCost.trim() ? Number(editCost.trim()) : null,
        contract_status: editContract,
```

- [ ] **Step 4: Add the inputs to the edit form** (inside the contact-edit block, after the email input)

```tsx
                      <input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Site address"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <input
                        value={editIsp}
                        onChange={(e) => setEditIsp(e.target.value)}
                        placeholder="Current provider (e.g. MTN)"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <input
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        inputMode="numeric"
                        placeholder="Current monthly cost (Rands)"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <select
                        value={editContract}
                        onChange={(e) => setEditContract(e.target.value as typeof editContract)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="unknown">Contract: Unknown</option>
                        <option value="in_contract">In contract</option>
                        <option value="out_of_contract">Out of contract</option>
                      </select>
```

- [ ] **Step 5: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "unjani/onboarding/page" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 6: Commit**

```bash
git add app/admin/unjani/onboarding/page.tsx
git commit -m "feat(onboarding): edit site address + incumbent fields in drawer"
```

---

### Task 9: Register-mode drawer + register tab wiring

**Files:**
- Modify: `app/admin/unjani/onboarding/page.tsx`

- [ ] **Step 1: Add register-drawer state**

```tsx
  // Pre-onboarding drawer (register clinic, not yet in pipeline)
  const [registerDrawer, setRegisterDrawer] = useState<null | {
    registerName: string;
    businessName: string;
    nurseName: string | null;
    phone: string | null;
    email: string | null;
    province: string | null;
    siteAddress: string | null;
    incumbentIsp: string | null;
    incumbentCost: number | null;
    contractStatus: 'in_contract' | 'out_of_contract' | 'unknown';
    savingPerMonth: number | null;
  }>(null);
```

- [ ] **Step 2: Add the open handler — routes to pipeline mode if already onboarded**

```tsx
  const openRegisterClinic = async (clinic: RegisterClinic) => {
    // If it's already in the pipeline, open the existing pipeline drawer instead.
    const existing = clinics.find(
      (c) => normName(c.business_name) === normName(clinic.name)
    );
    if (existing) {
      setDrawerClinic(existing);
      return;
    }
    setActingOn(clinic.name);
    try {
      const res = await fetch(
        `/api/admin/unjani/register-clinic-details?name=${encodeURIComponent(clinic.name)}`,
        { headers: { ...authHeaders() } }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.alreadyInPipeline) {
          await fetchPipeline();
          toast.info('This clinic is already in the pipeline — refresh to see it.');
        } else {
          setRegisterDrawer(data.clinic);
        }
      } else {
        toast.error(data.error || 'Could not load clinic details');
      }
    } catch {
      toast.error('Could not load clinic details');
    } finally {
      setActingOn(null);
    }
  };
```

(`normName` and `clinics` already exist in this component. Confirm `normName` is in scope; it is defined at module top.)

- [ ] **Step 3: Make register rows open the drawer**

In the register table body (`view === 'register'`), add an `onClick` to the row (mirroring the pipeline row pattern), keeping the existing "Start onboarding" button:

```tsx
                      onClick={() => openRegisterClinic(c)}
                      className="cursor-pointer hover:bg-gray-50"
```

- [ ] **Step 4: Render the register-mode drawer** (a second `Sheet`, after the existing pipeline drawer `Sheet`)

```tsx
      {/* Pre-onboarding drawer (register clinic) */}
      <Sheet open={!!registerDrawer} onOpenChange={(o) => { if (!o) setRegisterDrawer(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-white">
          {registerDrawer && (
            <>
              <SheetHeader className="bg-circleTel-navy text-white p-6 space-y-1">
                <span className="text-xs uppercase tracking-wide text-white/70">Not in pipeline</span>
                <SheetTitle className="text-white">{registerDrawer.businessName}</SheetTitle>
                <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
                  Awaiting onboarding
                </span>
              </SheetHeader>

              <div className="px-6 py-4">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-3">CONTACT</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Professional nurse</dt><dd className="text-gray-900 text-right">{registerDrawer.nurseName || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Phone</dt><dd className="text-gray-900 text-right">{registerDrawer.phone || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Email</dt><dd className="text-gray-900 text-right">{registerDrawer.email || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Province</dt><dd className="text-gray-900 text-right">{registerDrawer.province || '—'}</dd></div>
                </dl>
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-3">SITE &amp; CURRENT SERVICE</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Site address</dt><dd className="text-gray-900 text-right">{registerDrawer.siteAddress || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Current provider</dt><dd className="text-gray-900 text-right">{registerDrawer.incumbentIsp ? `${registerDrawer.incumbentIsp}${registerDrawer.incumbentCost ? ` · ${fmtRand(registerDrawer.incumbentCost)}/mo` : ''}` : '—'}</dd></div>
                  <div className="flex justify-between gap-4 items-center"><dt className="text-gray-500">Contract</dt><dd><ContractBadge status={registerDrawer.contractStatus} /></dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Saving p/m</dt><dd className="text-right">{savingDisplay(registerDrawer.savingPerMonth)}</dd></div>
                </dl>
              </div>

              <div className="mt-auto border-t border-gray-100 p-4">
                <Button
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                  onClick={() => {
                    const reg = REGISTER.clinics.find((c) => c.name === registerDrawer.registerName);
                    setRegisterDrawer(null);
                    if (reg) openRegisterDialog(reg);
                  }}
                >
                  Start onboarding
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
```

- [ ] **Step 5: Type-check**

Run: `npm run type-check:memory 2>&1 | grep "unjani/onboarding/page" || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 6: Commit**

```bash
git add app/admin/unjani/onboarding/page.tsx
git commit -m "feat(onboarding): pre-onboarding drawer for register clinics"
```

---

### Task 10: Verify on staging

- [ ] **Step 1: Push branch + staging**

```bash
git push -u origin feat/clinic-drawer-details
git push origin feat/clinic-drawer-details:staging --force
```

- [ ] **Step 2: Run the backfill against the shared Supabase**

```bash
set -a && source .env.local && set +a && npx tsx scripts/backfill-clinic-incumbent.ts
```
Expected: `✓` lines per clinic, `Backfilled N/N clinics.`

- [ ] **Step 3: Spot-check the data**

```sql
select account_number, clinic_details->>'incumbent_isp' isp,
       clinic_details->>'incumbent_cost' cost, clinic_details->>'contract_status' status
from customers where business_name ilike '%unjani%' limit 5;
```
Expected: ISP/cost/status populated for register-matched clinics; `unknown` otherwise.

- [ ] **Step 4: Browser-verify on staging** (after the staging deploy lands)
  - Pipeline tab → open a clinic → "Site & current service" shows address, provider, contract badge. Edit each → reopen → persisted.
  - Register tab → open a "Not started" clinic → review card shows contact + incumbent data; "Start onboarding" creates it; reopening shows pipeline mode with timeline.
  - Open a register clinic that's already in the pipeline → opens pipeline mode (no duplicate).

- [ ] **Step 5: Open PR to main**

```bash
gh pr create --base main --head feat/clinic-drawer-details --title "feat(onboarding): clinic drawer site & current-service details (pipeline + pre-onboarding)" --body "Implements docs/superpowers/specs/2026-06-18-clinic-drawer-site-service-details-design.md"
```

---

## Self-review notes

- **Spec coverage:** data model (T1), backfill (T2), new-clinic seed (T3), pipeline API (T4), read endpoint (T5), update-contact (T6), drawer section+badge (T7), edit (T8), register-mode drawer + wiring (T9), verification incl. consistency + dedup (T10). All spec sections mapped.
- **Type consistency:** `ContractStatus` union (`in_contract|out_of_contract|unknown`) and field names (`incumbent_isp`/`incumbent_cost`/`contract_status` in JSONB/API; `incumbentIsp`/`incumbentCost`/`contractStatus` in the register endpoint + register drawer) are used consistently; the camelCase boundary is the register endpoint/register-drawer only, snake_case everywhere persisted.
- **No placeholders:** every code step shows the code; edit steps name exact anchor text to find.
