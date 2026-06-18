# Spec: Unified clinic drawer with site & current-service details

**Date:** 2026-06-18
**Surface:** `/admin/unjani/onboarding` (Clinic Onboarding dashboard)
**Status:** Approved design — pending implementation plan

## Problem

The onboarding drawer shows only contact + onboarding timeline. Admins also need, at a glance:

1. **Site address** of the clinic.
2. **Current (incumbent) connectivity** — which ISP the clinic uses now and its monthly cost — as migration intelligence.
3. **Contract status** — whether the clinic is still locked into its incumbent contract (so we know when we can switch them).

Two gaps:
- These fields aren't shown in the drawer, and the incumbent data isn't persisted on the customer record (it only lives in the network-register file, matched by name).
- The drawer only exists for the **22 clinics already in the pipeline** (those with a `customers` row). The **253 register clinics** that aren't onboarded yet have no drawer — only a "Start onboarding" modal — so an admin can't review a clinic before deciding to onboard it.

## Goals

- Add **Site address**, **Current provider (ISP + cost)**, and **Contract status** to the drawer.
- Make the drawer work for **both** pipeline clinics and not-yet-onboarded register clinics, with an **identical shared card** (the consistency requirement).
- Persist the incumbent fields in the DB for existing clinics (backfill) and seed them for new clinics on creation.

## Non-goals (YAGNI)

- Typed columns / reporting / filtering on incumbent fields (stay in JSONB; promote later if needed).
- Capturing incumbent data in the Start-onboarding modal (auto-seed from register; edit in drawer).
- Incumbent contract **expiry dates** (status is a simple enum from `migration_ready`).

## Decisions (from brainstorming)

- "Existing package / contract" = **incumbent ISP** (migration intel), not the CircleTel service.
- Contract status = **simple enum** `in_contract | out_of_contract | unknown`, admin-editable.
- Storage = existing **`customers.clinic_details` JSONB** (no migration — `site_address` already lives there).
- Include the **pre-onboarding drawer** for register clinics (unified, two-mode drawer).

## Data model

Extend `customers.clinic_details` (JSONB, additive):

```jsonc
{
  // existing keys: clinic_name, province, area_type, site_address, nurse_owner_name, lat, lng
  "incumbent_isp":    "MTN",            // string | null  — current provider
  "incumbent_cost":   2500,             // number | null  — current monthly cost (Rands)
  "contract_status":  "out_of_contract" // "in_contract" | "out_of_contract" | "unknown"
}
```

**Derivation from the register's `migration_ready`:** `true → out_of_contract`, `false → in_contract`, missing/no match → `unknown`.

## Data sources

| Field | Pipeline clinic (has `customers` row) | Register clinic (not onboarded) |
|---|---|---|
| nurse, province | `clinic_details` | public register + contacts file |
| phone, email, **address** | `customers` / `clinic_details` | **server-only** `unjani-register-contacts.json` |
| incumbent ISP, cost, contract status | `clinic_details` (backfilled/seeded) | public `unjani-network-register.json` (`isp`/`isp_cost`/`migration_ready`) |
| saving p/m | name-match to register (existing `SAVING_BY_NAME`) | register entry |

## Components

### 1. Backfill script (one-time, idempotent)
`scripts/backfill-clinic-incumbent.ts` — for each Unjani `customers` row, name-match (`normName`) to `unjani-network-register.json`; merge `incumbent_isp`/`incumbent_cost`/`contract_status` into `clinic_details` **without** clobbering other keys. No match → leave `unknown`. Re-runnable.

### 2. register-clinic route (new clinics)
`app/api/admin/unjani/register-clinic/route.ts` — extend the `clinic_details` insert to also read `isp`/`isp_cost`/`migration_ready` from the public register for the clinic and write the same three fields. New clinics land already populated.

### 3. Pipeline API
`app/api/admin/b2b/onboarding-pipeline/route.ts` — `clinic_details` is already selected. Add `site_address`, `incumbent_isp`, `incumbent_cost`, `contract_status` to the `PipelineClinic` shape and the row mapping.

### 4. Register-clinic-details read endpoint (new)
`GET /api/admin/unjani/register-clinic-details?name=<clinicName>` (admin-auth, `customers:read`/equivalent). Merges the public register entry + server-side contact (nurse/phone/email/address/area_type) and returns the **normalized drawer shape**. Keeps PII server-side (contacts file never ships to the browser). Also reports whether the clinic is already in the pipeline (so the UI can route to pipeline mode).

### 5. Unified drawer (refactor)
`app/admin/unjani/onboarding/page.tsx`. Drawer takes a normalized shape + `mode: 'pipeline' | 'register'`.

Normalized shape:
```ts
interface DrawerData {
  mode: 'pipeline' | 'register';
  businessName: string;
  accountNumber?: string;          // pipeline only
  stage?: string;                  // pipeline only
  customerId?: string;             // pipeline only
  nurseName: string | null;
  phone: string | null;
  email: string | null;
  province: string | null;
  siteAddress: string | null;
  incumbentIsp: string | null;
  incumbentCost: number | null;
  contractStatus: 'in_contract' | 'out_of_contract' | 'unknown';
  savingPerMonth: number | null;
  // pipeline-only extras already in PipelineClinic (timeline/SLA/submission_id) passed through
  registerName?: string;           // register mode — for the Start-onboarding modal
}
```

Drawer layout:
- **Contact** (always): nurse, phone, email, province. Existing `Edit` retained.
- **Site & current service** (always): site address; current provider `MTN · R2 500/mo` (or `—`); contract-status badge — *In contract* (amber) · *Out of contract* (green) · *Unknown* (grey); saving p/m.
- **`pipeline` mode only:** onboarding timeline + stage next-action + channel picker / email button (unchanged).
- **`register` mode only:** primary CTA **"Start onboarding"** → opens the existing confirm modal (`openRegisterDialog`). No timeline/account number.

### 6. Edit capability
`Edit` in the drawer (pipeline mode) extends to edit **site address, incumbent ISP, incumbent cost, contract status** in addition to nurse/phone/email. `POST /api/admin/unjani/update-contact` extended to merge these keys into `clinic_details` (read-modify-write so other keys survive). Register-mode drawer is read-only (no `customers` row to edit yet).

### 7. Register tab wiring
`app/admin/unjani/onboarding/page.tsx` register view (`view === 'register'`):
- Row click → open drawer.
  - Clinic **already in pipeline** (existing pipeline-status lookup) → open in `pipeline` mode (reuse the matched `PipelineClinic`).
  - **Not started** → fetch the read endpoint (#4) → open in `register` mode.
- Keep the row's quick **"Start onboarding"** button (direct to modal) for admins who don't need to review first.

## Data flow

```
Pipeline tab row click ─► PipelineClinic ─► normalize ─► drawer (pipeline mode)
Register tab row click ─┬─ in pipeline? ─► matched PipelineClinic ─► drawer (pipeline mode)
                        └─ not started  ─► GET register-clinic-details ─► drawer (register mode)
                                                                              └─► "Start onboarding" ─► existing modal ─► register-clinic route
                                                                                       (writes clinic_details incl. incumbent fields)
```

Both `clinic_details` (pipeline) and the register endpoint resolve to the **same `DrawerData`**; the shared sections read only from it → identical card pre/post onboarding.

## Error handling

- Read endpoint: unknown clinic name → 404; no contact entry → return register fields with null contact (drawer shows `—`).
- Backfill / seed: no register match → `contract_status: 'unknown'`, null ISP/cost (never throws).
- `update-contact`: read-modify-write `clinic_details` to avoid clobbering unrelated keys; `incumbent_cost` parsed to number or null.
- Drawer fetch failure (register mode) → toast error, drawer doesn't open.

## Testing / verification

- Backfill: run on staging, spot-check 3 clinics' `clinic_details` against the register; re-run to confirm idempotency.
- Pipeline drawer: existing clinic shows address + provider + contract badge; edit each field, reopen, confirm persisted.
- Register drawer: a "Not started" clinic opens the review card with contact + incumbent data; "Start onboarding" creates the clinic; reopening shows pipeline mode with timeline.
- Consistency: same clinic before vs after onboarding renders an identical shared card.
- `type-check:memory` clean on touched files.

## Files touched

- `customers.clinic_details` (JSONB, no migration)
- `scripts/backfill-clinic-incumbent.ts` (new)
- `app/api/admin/unjani/register-clinic/route.ts` (seed incumbent fields)
- `app/api/admin/unjani/register-clinic-details/route.ts` (new read endpoint)
- `app/api/admin/b2b/onboarding-pipeline/route.ts` (PipelineClinic shape + mapping)
- `app/api/admin/unjani/update-contact/route.ts` (merge new clinic_details keys)
- `app/admin/unjani/onboarding/page.tsx` (drawer refactor, register wiring, edit form)
- Data: `lib/data/unjani-network-register.json` (public), `lib/data/unjani-register-contacts.json` (server-only) — read, not modified
