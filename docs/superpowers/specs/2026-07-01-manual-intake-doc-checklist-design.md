# Manual B2B Onboarding — Document Received/Outstanding Checklist (Design)

**Date:** 2026-07-01
**Route:** `/admin/b2b/manual-intake` (Documents step + Review step)
**Status:** Approved design — ready for implementation plan

---

## Problem

On the manual-intake wizard's **Documents** step, uploads are tracked only as a running **count** (`uploadedCount`). The 6 document-type labels shown are a **static grid** that never changes state, and the modal's `onUploaded(count)` callback drops the per-type information it already collected. So an admin cannot see **which** documents have been received and **which** are still **outstanding**, and the count is **session-only** (reopening a customer that already has documents shows `0`).

## Goal

On the Documents step (and Review), show every expected document as **Received** or **Outstanding**, accurate **across sessions** (reflecting previously uploaded docs), and gate "Documents complete" on all **required** documents being present.

## Decisions (locked in brainstorming)

- **Required set (smart VAT):** `company_registration`, `id_document` (Owner/Director ID), `proof_of_address`, `bank_statement` (Bank confirmation) are **always required**. `vat_certificate` is **required only when `form.vatRegistered` is true**. `tax_certificate` and `other` are **optional/supporting**. "Documents complete" = **all required received**.
- **Cross-session accuracy:** extend the manual-intake **GET prefill** to return already-uploaded document types for the linked customer, reusing the `kyc_documents` read pattern.

---

## Architecture

Four units, each with one responsibility:

### 1. `lib/onboarding/document-checklist.ts` (NEW — pure, unit-tested)

The single source of truth for the required set and the received/outstanding computation. No React, no I/O — pure functions over data, so it is directly unit-testable.

```ts
export type DocRequirement = 'always' | 'ifVat' | 'optional';

export interface DocChecklistDef {
  key: string;            // stable UI key
  label: string;          // display label
  match: string[];        // kyc_documents.document_type values that satisfy this row
  requirement: DocRequirement;
}

// Order = display order.
export const DOC_CHECKLIST: DocChecklistDef[] = [
  { key: 'company_registration', label: 'Company registration', match: ['company_registration'], requirement: 'always' },
  { key: 'id_document',          label: 'Owner / Director ID',  match: ['id_document', 'director_id'], requirement: 'always' },
  { key: 'proof_of_address',     label: 'Proof of address',     match: ['proof_of_address'], requirement: 'always' },
  { key: 'bank_statement',       label: 'Bank confirmation',    match: ['bank_statement'], requirement: 'always' },
  { key: 'vat_certificate',      label: 'VAT certificate',      match: ['vat_certificate'], requirement: 'ifVat' },
  { key: 'tax_certificate',      label: 'Tax certificate',      match: ['tax_certificate'], requirement: 'optional' },
  { key: 'other',                label: 'Other supporting docs', match: ['other', 'shareholder_agreement'], requirement: 'optional' },
];

export interface DocChecklistRow extends DocChecklistDef {
  required: boolean;      // resolved (ifVat -> vatRegistered)
  received: boolean;      // any of match[] is in receivedTypes
}

export interface DocChecklistResult {
  rows: DocChecklistRow[];
  requiredCount: number;
  receivedRequiredCount: number;
  allRequiredReceived: boolean;  // requiredCount === 0 ? true : all required rows received
}

export function computeDocChecklist(
  receivedTypes: string[],
  vatRegistered: boolean,
): DocChecklistResult;
```

Rules:
- `required = requirement === 'always' || (requirement === 'ifVat' && vatRegistered)`.
- `received = row.match.some(t => receivedTypes.includes(t))` (case-sensitive exact enum values).
- `allRequiredReceived` = every `required` row is `received` (vacuously true if no required rows, which cannot happen here since 4 are always-required).

### 2. Manual-intake GET prefill — return uploaded document types (server)

`app/api/admin/b2b/manual-intake/route.ts` GET `?customerId=` (the prefill mode) currently returns `{ customer, form }` via `mapCustomerPrefill(...)`. Add a `documents: string[]` field = **distinct `document_type`** from `kyc_documents` where `customer_id = <customerId>`.

- Query with the service-role Supabase client already used by the route: `select('document_type').eq('customer_id', customerId)`, then de-dupe in JS to distinct values.
- Shape: `prefill = { customer, form, documents }`. `documents` defaults to `[]` when none.
- No change to the POST path or its payload.

### 3. `UploadDocumentModal` — report uploaded types (additive, non-breaking)

Add an **optional** prop `onUploadedTypes?: (types: DocType[]) => void`. On successful upload (where it already calls `onUploaded(uploaded.length)`), also call `onUploadedTypes?.(uploaded.map(u => u.type as DocType))`. The existing `onUploaded(count: number)` prop and all other callers of the modal are **unchanged**.

### 4. Manual-intake page — consume the checklist (client)

- **State:** add `receivedTypes: string[]` (source of truth). Keep it in sync:
  - seed from `prefill.documents` in `loadCustomerPrefill`;
  - merge modal's `onUploadedTypes` results (union, de-duped);
  - reset to `[]` in `clearSelectedCustomer` (alongside the existing resets).
- **Derive:** `const docChecklist = computeDocChecklist(receivedTypes, form.vatRegistered)`. Replace `documentsReady = uploadedCount > 0` with `documentsReady = docChecklist.allRequiredReceived`. This flows unchanged through `stepReadiness.documents`, `missingItems`, the required-items % bar, and submit gating.
- **Documents step UI:** replace the static 6-chip grid with the checklist. Each row: label · a Required/Optional pill · a Received (green check) / Outstanding (amber) status. Header `StatusPill` label becomes `"{receivedRequiredCount}/{requiredCount} required"`. The upload dropzone/button and the "save first to enable upload" behaviour are unchanged.
- **Review step Documents card:** replace the "N uploaded in this session" row with the same received/outstanding summary (list rows, or "All required received" / "Missing: …").
- `uploadedCount` is removed (its only jobs — the status pill label and the readiness gate — are replaced by the checklist). The modal's `onUploaded(count)` is left in place but no longer needed by this page; the page wires `onUploadedTypes` instead.

---

## Data Flow

```
GET prefill (?customerId) ──► { customer, form, documents:[...] }
        │                                         │
        ▼ loadCustomerPrefill                     ▼ seed
   receivedTypes  ◄────── union ────── onUploadedTypes(modal upload)
        │
        ▼ computeDocChecklist(receivedTypes, form.vatRegistered)
        ▼
   rows[] (Received/Outstanding) + allRequiredReceived
        │                                   │
        ▼ Documents step + Review UI        ▼ documentsReady → stepReadiness → % bar / submit gate
```

## Error Handling

- Prefill `documents` query failure: log and default `documents` to `[]` (the checklist simply shows everything outstanding — never blocks loading the customer). Do not fail the whole prefill on a documents-read error.
- `receivedTypes` always an array; `computeDocChecklist` tolerates unknown/extra enum values (they match no row and are ignored).
- VAT toggled off after a VAT cert was required: the checklist recomputes reactively; VAT row becomes optional; `allRequiredReceived` updates. No stale gate.

## Testing

- **`lib/onboarding/__tests__/document-checklist.test.ts`** (new, real unit tests):
  - empty received → 4 required outstanding, `allRequiredReceived=false`;
  - all 4 always-required received → `allRequiredReceived=true` (VAT off);
  - `vatRegistered=true` with VAT cert missing → not complete; with VAT cert → complete;
  - `director_id` satisfies the Owner/Director ID row (id_document/director_id matching);
  - optional rows (tax_certificate, other) never affect `allRequiredReceived`.
- **`app/api/admin/b2b/manual-intake/__tests__/route.test.ts`** (extend): GET prefill returns distinct `documents` for a customer with kyc_documents rows; returns `[]` when none.

## Out of Scope (YAGNI)

- No new document-list endpoint (reuse the prefill).
- No per-file display on the wizard (the modal already lists files during upload); the wizard shows per-**type** status only.
- No change to upload storage, the upload endpoint, or the POST intake payload.
- No re-fetch of documents after in-session save (session uploads already update `receivedTypes`; prefill covers pre-existing).

## Files

- **New:** `lib/onboarding/document-checklist.ts`, `lib/onboarding/__tests__/document-checklist.test.ts`
- **Modified:** `app/api/admin/b2b/manual-intake/route.ts` (GET prefill + `documents`), `app/api/admin/b2b/manual-intake/__tests__/route.test.ts`, `components/admin/onboarding/UploadDocumentModal.tsx` (optional `onUploadedTypes`), `app/admin/b2b/manual-intake/page.tsx` (state + checklist UI, Documents + Review steps)

## Branch / Ship

Feature branch `feat/manual-intake-doc-checklist` off current `main` → push to `staging` for visual QA → PR to `main`.
