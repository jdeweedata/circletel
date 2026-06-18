# Spec: Admin manual document upload for compliance vetting

**Date:** 2026-06-18
**Surfaces:** `/admin/unjani/onboarding` (clinic drawer) and `/admin/b2b/vetting/[submissionId]` (vetting detail)
**Status:** Implemented (PR #563, live)

## Problem

Clinic compliance documents (CIPC registration, VAT/tax certificate, bank confirmation, owner/director ID, proof of address) normally arrive through the onboarding wizard's upload step (`/api/onboarding/upload-document`, token-authenticated as the nurse). Some clinics instead **email** these documents directly to the admin. There is currently no way for an admin to put emailed documents into the system, so those clinics can't be vetted.

## Goals

- Let an admin upload documents on a clinic's behalf so they enter the **existing** compliance-vetting flow (queue + detail page + `/api/admin/kyc/verify`).
- Work in **both** states: a clinic that already has a submission (add/replace a doc) and a clinic that never used the wizard (create a minimal vetting record so it enters the queue at "Docs submitted").
- Make uploads available from **both** the clinic drawer and the vetting detail page, via one shared component.
- Keep manually-added items clearly **distinguishable** from nurse-submitted data.

## Non-goals (YAGNI)

- Capturing business details / banking / payment date, or triggering the DebiCheck mandate (separate flow — "documents only").
- OCR / auto-classifying the document type.
- Bulk drag-and-drop of many files at once (one type per file, repeatable in the modal).
- Schema changes — reuse existing tables/bucket.

## Decisions (from brainstorming)

- Support **both** scenarios (existing submission + no submission).
- **Documents only.**
- **Both** entry points (drawer + vetting page), one shared modal.
- **Approach A:** a single upload endpoint that **finds-or-creates** a lightweight submission shell, so everything flows through the existing vetting machinery.

## Architecture

### 1. Upload endpoint — `POST /api/admin/b2b/upload-document`

Admin-authenticated (`authenticateAdmin` + `requirePermission(['kyc:verify', 'customers:write'])`). Multipart form: `customerId` (required), `documentType` (required, must be a valid `kyc_documents.document_type` enum value), `file` (required), `submissionId` (optional).

Steps:
1. Validate `file`: type ∈ {`image/jpeg`,`image/jpg`,`image/png`,`application/pdf`}, size ≤ 5 MB (same limits as the wizard). Validate `documentType` ∈ the enum.
2. Fetch the customer (`business_name`, `email`, `phone`); 404 if missing.
3. **Find-or-create submission:**
   - If `submissionId` provided → use it.
   - Else find the clinic's latest `onboarding_submissions` row for `customerId` (most recent `submitted_at`/`created_at`).
   - Else **create a shell** (mirrors the wizard's submission row):
     ```ts
     {
       customer_id,
       segment: 'unjani',
       status: 'submitted',
       document_vetting_status: 'documents_pending',
       submitted_at: now().toISOString(),
       vetting_due_date: addBusinessDays(now(), 2).toISOString(),
       submission_data: { manual: true, source: 'admin_email', uploaded_by: <admin.email> },
     }
     ```
     and set `customers.onboarding_status = 'submitted'` (same as the wizard) so the clinic moves to "Docs submitted" on the pipeline.
4. Upload via `uploadFile` (`@/lib/storage/supabase-upload`) to bucket `kyc-documents`, folder `onboarding/${customerId}/${documentType}` (same convention as the wizard).
5. Insert the `kyc_documents` row (mirroring the wizard insert) with:
   - `customer_type: 'smme'`, `customer_id`, `onboarding_submission_id: <found/created>`,
   - `customer_name`/`company_name`/`customer_email`/`customer_phone` from the customer,
   - `document_type`, `document_title: documentType`, `file_name`, `file_path`, `file_size`, `file_type`,
   - `verification_status: 'pending'`, `is_sensitive: true`,
   - `metadata: { source: 'admin_email', uploaded_by: <admin.email> }`.
6. Return `{ success: true, documentId, submissionId, createdShell: boolean }`.

Uses the service-role client (`svc()` from `@/lib/onboarding/onboarding-service`) like the sibling unjani admin routes.

### 2. Shared component — `components/admin/onboarding/UploadDocumentModal.tsx`

Props: `{ open, onOpenChange, customerId, submissionId?, clinicName, onUploaded }`.

- A **document-type select** with friendly labels mapped to the enum:
  | Label | enum |
  |---|---|
  | Company registration (CIPC) | `company_registration` |
  | VAT certificate | `vat_certificate` |
  | Tax certificate | `tax_certificate` |
  | Bank confirmation / statement | `bank_statement` |
  | Owner / Director ID | `id_document` |
  | Proof of address | `proof_of_address` |
  | Other | `other` |
- A **file input** (accept `image/*,application/pdf`).
- On submit → POST multipart to the endpoint → on success push to an in-modal **"uploaded" list** (type + filename), reset the type/file inputs so the admin can add the next emailed file. A **Done** button closes and calls `onUploaded(uploadedDocs)`.
- Client-side guard: file ≤ 5 MB and allowed type before sending (server re-validates).
- Uses `authHeaders()` for admin auth, `toast` for feedback (match existing admin components).

### 3. Clinic drawer wiring — `app/admin/unjani/onboarding/page.tsx`

- Add an **"📎 Upload documents"** secondary button in the pipeline-drawer footer, shown when `stage` ∉ {`mandate_active`,`billing_ready`} (onboarding/vetting still relevant).
- Opens `<UploadDocumentModal customerId={drawerClinic.customer_id} submissionId={drawerClinic.submission_id ?? undefined} clinicName={drawerClinic.business_name} />`.
- `onUploaded` → `fetchPipeline()` so a no-submission clinic visibly moves to "Docs submitted".

### 4. Vetting detail wiring — `app/admin/b2b/vetting/[submissionId]/page.tsx`

- Add an **"Add document"** button (header/action area) opening the same modal with the existing `submissionId` + `customerId`.
- `onUploaded` → re-fetch the submission's documents so the new doc appears in the review list.
- **Manual-shell banner:** when the submission's `submission_data.manual === true`, render a notice — "📧 Submitted via email — business & banking details pending" — in place of the (empty) business-detail section, so reviewers aren't confused by blanks. Documents render normally.

### 5. Provenance

Every manually-added document carries `metadata.source = 'admin_email'` + the admin's email; every shell carries `submission_data.manual = true` + `source` + `uploaded_by`. This keeps the email path always distinguishable from the nurse-wizard path (for audit and for the banner).

## Data flow

```
Admin (drawer OR vetting page) ─► UploadDocumentModal
   └─ POST /api/admin/b2b/upload-document (customerId, documentType, file[, submissionId])
        ├─ find-or-create onboarding_submissions  (shell if none → customers.onboarding_status='submitted')
        ├─ uploadFile → kyc-documents bucket
        └─ insert kyc_documents (pending, source: admin_email)
   ◄─ { documentId, submissionId, createdShell }
Drawer: fetchPipeline() → clinic now "Docs submitted"
Vetting page: re-fetch docs → new doc in review list → existing /api/admin/kyc/verify approve/reject
```

## Error handling

- Invalid file type/size or bad `documentType` → 400 with a clear message; modal shows the error, keeps the form.
- Customer not found → 404.
- Storage upload failure → 500, **no** `kyc_documents` row inserted (insert only after a successful upload).
- Find-or-create avoids duplicate shells by checking for an existing submission first; if a shell is created but the subsequent doc insert fails, the endpoint returns 500 (a harmless empty shell may remain — acceptable; re-upload reuses it).
- All actions permission-gated.

## Testing / verification

- **Endpoint logic:** unit-test the doc-type/file validation and the find-or-create decision (existing submissionId → use it; existing latest → use it; none → shell) by extracting a small pure helper where practical; otherwise verify on staging.
- **Staging browse:**
  1. No-submission clinic (e.g. "Awaiting invite") → drawer → Upload documents → upload 2 files → clinic moves to "Docs submitted"; both docs appear in the vetting queue/detail; manual banner shows; verify/reject works.
  2. Existing submission ("Changes requested") → vetting page → Add document → replacement appears pending.
  3. Provenance: `kyc_documents.metadata.source = 'admin_email'`, shell `submission_data.manual = true`.
- `type-check:memory` clean on touched files.

## Files touched

- Create: `app/api/admin/b2b/upload-document/route.ts`
- Create: `components/admin/onboarding/UploadDocumentModal.tsx`
- Modify: `app/admin/unjani/onboarding/page.tsx` (drawer button + modal)
- Modify: `app/admin/b2b/vetting/[submissionId]/page.tsx` (Add-document button + manual banner)
- Reuse (no change): `@/lib/storage/supabase-upload` (`uploadFile`), `@/lib/dates` (`addBusinessDays`,`now`), `@/lib/onboarding/onboarding-service` (`svc`), `kyc_documents` table, `kyc-documents` bucket, `/api/admin/kyc/verify`.
