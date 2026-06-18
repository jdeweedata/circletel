# Admin Manual Document Upload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin upload a clinic's emailed compliance documents into the existing vetting flow, from both the onboarding drawer and the vetting detail page, creating a minimal "submitted via email" vetting record when the clinic has no submission yet.

**Architecture:** One admin-auth endpoint find-or-creates the clinic's `onboarding_submissions` row (a manual shell mirroring the wizard when none exists), uploads the file to the `kyc-documents` bucket, and inserts a pending `kyc_documents` row tagged `source: 'admin_email'`. A shared modal drives it from the drawer and the vetting page. No schema changes; reuses the existing `/api/admin/kyc/verify` review flow.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (service role), Jest, React, Tailwind, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-06-18-admin-manual-document-upload-design.md`

**Verification model:** pure validation logic is Jest-unit-tested; the endpoint and UI are verified via `npm run type-check:memory` + a real upload on staging (this repo doesn't unit-test React or hit live Supabase in Jest).

---

### Task 1: Document-upload validation helper (pure logic, TDD)

**Files:**
- Create: `lib/onboarding/document-upload.ts`
- Test: `__tests__/lib/onboarding/document-upload.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/onboarding/document-upload.test.ts
import {
  ALLOWED_DOC_TYPES,
  validateDocumentUpload,
  MAX_DOC_BYTES,
} from '@/lib/onboarding/document-upload';

describe('validateDocumentUpload', () => {
  const ok = { documentType: 'company_registration', fileType: 'application/pdf', fileSize: 1000 };

  it('accepts a valid pdf of an allowed type', () => {
    expect(validateDocumentUpload(ok)).toEqual({ valid: true });
  });
  it('rejects an unknown document type', () => {
    expect(validateDocumentUpload({ ...ok, documentType: 'nope' }).valid).toBe(false);
  });
  it('rejects a disallowed file type', () => {
    expect(validateDocumentUpload({ ...ok, fileType: 'text/csv' }).valid).toBe(false);
  });
  it('rejects a file over the size limit', () => {
    expect(validateDocumentUpload({ ...ok, fileSize: MAX_DOC_BYTES + 1 }).valid).toBe(false);
  });
  it('exposes the allowed types list', () => {
    expect(ALLOWED_DOC_TYPES).toContain('vat_certificate');
    expect(ALLOWED_DOC_TYPES).toContain('proof_of_address');
  });
});
```

- [ ] **Step 2: Run test, verify it FAILS**

Run: `cd /tmp/ct-docup-wt && npx jest __tests__/lib/onboarding/document-upload.test.ts`
Expected: FAIL — "Cannot find module".

- [ ] **Step 3: Write the helper**

```ts
// lib/onboarding/document-upload.ts
/**
 * Shared validation for admin manual document uploads. Mirrors the wizard's
 * upload limits (jpg/png/pdf, <=5MB) and the kyc_documents.document_type enum.
 */
export const ALLOWED_DOC_TYPES = [
  'company_registration',
  'vat_certificate',
  'tax_certificate',
  'bank_statement',
  'id_document',
  'director_id',
  'proof_of_address',
  'shareholder_agreement',
  'other',
] as const;

export type DocType = (typeof ALLOWED_DOC_TYPES)[number];

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

/** Friendly labels for the admin picker (subset shown in the modal). */
export const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'company_registration', label: 'Company registration (CIPC)' },
  { value: 'vat_certificate', label: 'VAT certificate' },
  { value: 'tax_certificate', label: 'Tax certificate' },
  { value: 'bank_statement', label: 'Bank confirmation / statement' },
  { value: 'id_document', label: 'Owner / Director ID' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'other', label: 'Other' },
];

export function validateDocumentUpload(input: {
  documentType: string;
  fileType: string;
  fileSize: number;
}): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_DOC_TYPES.includes(input.documentType as DocType)) {
    return { valid: false, error: `Invalid document type: ${input.documentType}` };
  }
  if (!ALLOWED_FILE_TYPES.includes(input.fileType)) {
    return { valid: false, error: 'File must be a JPG, PNG, or PDF' };
  }
  if (input.fileSize > MAX_DOC_BYTES) {
    return { valid: false, error: 'File must be 5MB or smaller' };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Run test, verify it PASSES**

Run: `cd /tmp/ct-docup-wt && npx jest __tests__/lib/onboarding/document-upload.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /tmp/ct-docup-wt
git add lib/onboarding/document-upload.ts __tests__/lib/onboarding/document-upload.test.ts docs/superpowers/specs/2026-06-18-admin-manual-document-upload-design.md docs/superpowers/plans/2026-06-18-admin-manual-document-upload.md
git commit -m "feat(vetting): document-upload validation helper + spec/plan"
```

---

### Task 2: Admin upload endpoint (find-or-create submission)

**Files:**
- Create: `app/api/admin/b2b/upload-document/route.ts`

Reference (the token-auth wizard equivalent to mirror): `app/api/onboarding/upload-document/route.ts`. `uploadFile` (`@/lib/storage/supabase-upload`) returns `{ success, path?, error? }`. `addBusinessDays` + `now` come from `@/lib/dates`.

- [ ] **Step 1: Write the route**

```ts
// app/api/admin/b2b/upload-document/route.ts
/**
 * POST /api/admin/b2b/upload-document  (multipart)
 * Admin uploads a compliance document received by email on a clinic's behalf.
 * Find-or-creates the clinic's onboarding_submissions row (a manual shell when
 * none exists), uploads to the kyc-documents bucket, inserts a pending
 * kyc_documents row tagged source: 'admin_email'. Documents-only — no banking.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { validateDocumentUpload } from '@/lib/onboarding/document-upload';
import { addBusinessDays, now } from '@/lib/dates';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['kyc:verify', 'customers:write']);
  if (perm) return perm;

  const form = await request.formData();
  const customerId = form.get('customerId') as string | null;
  const documentType = form.get('documentType') as string | null;
  const submissionIdIn = (form.get('submissionId') as string | null) || null;
  const file = form.get('file') as File | null;

  if (!customerId || !documentType || !file) {
    return NextResponse.json({ success: false, error: 'customerId, documentType, file required' }, { status: 400 });
  }
  const v = validateDocumentUpload({ documentType, fileType: file.type, fileSize: file.size });
  if (!v.valid) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }

  const supabase = svc();
  const adminEmail = auth.adminUser.email;

  const { data: customer } = await supabase
    .from('customers')
    .select('business_name, email, phone, onboarding_status')
    .eq('id', customerId)
    .single();
  if (!customer) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
  }

  // Find-or-create submission
  let submissionId = submissionIdIn;
  let createdShell = false;
  if (!submissionId) {
    const { data: existing } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('customer_id', customerId)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      submissionId = existing.id;
    } else {
      const { data: shell, error: shellErr } = await supabase
        .from('onboarding_submissions')
        .insert({
          customer_id: customerId,
          segment: 'unjani',
          status: 'submitted',
          document_vetting_status: 'documents_pending',
          submitted_at: now().toISOString(),
          vetting_due_date: addBusinessDays(now(), 2).toISOString(),
          submission_data: { manual: true, source: 'admin_email', uploaded_by: adminEmail },
        })
        .select('id')
        .single();
      if (shellErr || !shell) {
        apiLogger.error('[Admin Upload] shell create failed', { customerId, error: shellErr });
        return NextResponse.json({ success: false, error: shellErr?.message || 'Failed to create submission' }, { status: 500 });
      }
      submissionId = shell.id;
      createdShell = true;
      // Move the clinic into the vetting queue (same as the wizard does).
      await supabase
        .from('customers')
        .update({ onboarding_status: 'submitted' })
        .eq('id', customerId)
        .neq('onboarding_status', 'submitted');
    }
  }

  // Upload then insert (only persist the row on a successful upload)
  const up = await uploadFile(file, {
    bucket: 'kyc-documents',
    folder: `onboarding/${customerId}/${documentType}`,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    supabaseClient: supabase,
  });
  if (!up.success) {
    return NextResponse.json({ success: false, error: up.error }, { status: 500 });
  }

  const { data: doc, error: docErr } = await supabase
    .from('kyc_documents')
    .insert({
      customer_type: 'smme',
      customer_id: customerId,
      onboarding_submission_id: submissionId,
      customer_name: customer.business_name ?? 'Clinic',
      company_name: customer.business_name ?? null,
      customer_email: customer.email ?? null,
      customer_phone: customer.phone ?? null,
      document_type: documentType,
      document_title: documentType,
      file_name: file.name,
      file_path: up.path,
      file_size: file.size,
      file_type: file.type,
      verification_status: 'pending',
      is_sensitive: true,
      metadata: { source: 'admin_email', uploaded_by: adminEmail },
    })
    .select('id')
    .single();
  if (docErr || !doc) {
    apiLogger.error('[Admin Upload] kyc_documents insert failed', { customerId, error: docErr });
    return NextResponse.json({ success: false, error: docErr?.message || 'Failed to record document' }, { status: 500 });
  }

  apiLogger.info('[Admin Upload] document uploaded', { customerId, submissionId, documentType, createdShell, by: adminEmail });
  return NextResponse.json({ success: true, documentId: doc.id, submissionId, createdShell });
}
```

- [ ] **Step 2: Type-check**

Run: `cd /tmp/ct-docup-wt && npm run type-check:memory 2>&1 | grep "b2b/upload-document/route" || echo CLEAN`
Expected: CLEAN. (If `auth.adminUser.email` or `addBusinessDays`/`now` signatures differ, open `app/api/admin/unjani/send-mandate-reminder/route.ts` and `app/api/onboarding/submit/route.ts` to match the real usage.)

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/b2b/upload-document/route.ts
git commit -m "feat(vetting): admin manual document upload endpoint (find-or-create submission)"
```

---

### Task 3: Shared UploadDocumentModal component

**Files:**
- Create: `components/admin/onboarding/UploadDocumentModal.tsx`

Check the existing dialog primitives the dashboard uses (`@/components/ui/dialog` — `Dialog`,`DialogContent`,`DialogHeader`,`DialogTitle`,`DialogFooter`) and `@/components/ui/button`. The onboarding page already imports these, so they exist.

- [ ] **Step 1: Write the component**

```tsx
// components/admin/onboarding/UploadDocumentModal.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DOC_TYPE_OPTIONS,
  ALLOWED_FILE_TYPES,
  MAX_DOC_BYTES,
  type DocType,
} from '@/lib/onboarding/document-upload';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  clinicName: string;
  submissionId?: string;
  /** Auth headers for admin API calls (same helper the page uses). */
  authHeaders: () => Record<string, string>;
  /** Called after Done, with how many docs were uploaded. */
  onUploaded: (count: number) => void;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  customerId,
  clinicName,
  submissionId,
  authHeaders,
  onUploaded,
}: UploadDocumentModalProps) {
  const [docType, setDocType] = useState<DocType>('company_registration');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ type: string; name: string }[]>([]);

  const reset = () => {
    setDocType('company_registration');
    setFile(null);
    setUploaded([]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file first');
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('File must be a JPG, PNG, or PDF');
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      toast.error('File must be 5MB or smaller');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('customerId', customerId);
      fd.append('documentType', docType);
      if (submissionId) fd.append('submissionId', submissionId);
      fd.append('file', file);
      const res = await fetch('/api/admin/b2b/upload-document', {
        method: 'POST',
        headers: { ...authHeaders() }, // do NOT set Content-Type; browser sets multipart boundary
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const label = DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;
        setUploaded((u) => [...u, { type: label, name: file.name }]);
        toast.success(`Uploaded ${label}`);
        setFile(null);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    onUploaded(uploaded.length);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload documents — {clinicName}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500">
          For documents received by email. Pick a type, choose the file, and upload. Repeat for each file.
        </p>

        <div className="space-y-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full rounded border border-gray-300 px-2 py-2 text-sm"
          >
            {DOC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />

          <Button
            className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
            disabled={uploading || !file}
            onClick={handleUpload}
          >
            {uploading ? 'Uploading…' : 'Upload this document'}
          </Button>
        </div>

        {uploaded.length > 0 && (
          <div className="rounded border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">Uploaded ({uploaded.length})</p>
            <ul className="space-y-1">
              {uploaded.map((u, i) => (
                <li key={i} className="text-gray-600">✓ {u.type} — {u.name}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd /tmp/ct-docup-wt && npm run type-check:memory 2>&1 | grep "UploadDocumentModal" || echo CLEAN`
Expected: CLEAN. (If `@/components/ui/dialog` doesn't export `DialogFooter`, read that file and use whatever footer pattern exists, or drop the footer wrapper and place the Done button directly.)

- [ ] **Step 3: Commit**

```bash
git add components/admin/onboarding/UploadDocumentModal.tsx
git commit -m "feat(vetting): shared UploadDocumentModal component"
```

---

### Task 4: Wire the modal into the clinic drawer

**Files:**
- Modify: `app/admin/unjani/onboarding/page.tsx`

- [ ] **Step 1: Import the modal** (with the other imports near the top)

```tsx
import { UploadDocumentModal } from '@/components/admin/onboarding/UploadDocumentModal';
```

- [ ] **Step 2: Add open-state** (next to the `drawerClinic` state)

```tsx
  const [uploadFor, setUploadFor] = useState<PipelineClinic | null>(null);
```

- [ ] **Step 3: Add the drawer button** — in the pipeline-drawer footer, alongside the existing secondary actions (e.g. just above or below the "📩 Remind: approve DebiCheck" block), shown while onboarding/vetting is still relevant:

```tsx
                {!['mandate_active', 'billing_ready'].includes(drawerClinic.stage) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setUploadFor(drawerClinic)}
                  >
                    📎 Upload documents
                  </Button>
                )}
```

- [ ] **Step 4: Render the modal** — near the other drawer/dialog renders at the end of the returned JSX:

```tsx
      {uploadFor && (
        <UploadDocumentModal
          open={!!uploadFor}
          onOpenChange={(o) => { if (!o) setUploadFor(null); }}
          customerId={uploadFor.customer_id}
          clinicName={uploadFor.business_name}
          submissionId={uploadFor.submission_id ?? undefined}
          authHeaders={authHeaders}
          onUploaded={(count) => { if (count > 0) fetchPipeline(); }}
        />
      )}
```

- [ ] **Step 5: Type-check**

Run: `cd /tmp/ct-docup-wt && npm run type-check:memory 2>&1 | grep "unjani/onboarding/page" || echo CLEAN`
Expected: CLEAN.

- [ ] **Step 6: Commit**

```bash
git add app/admin/unjani/onboarding/page.tsx
git commit -m "feat(vetting): upload-documents action in clinic drawer"
```

---

### Task 5: Wire the modal + manual banner into the vetting detail page

**Files:**
- Modify: `app/admin/b2b/vetting/[submissionId]/page.tsx`

- [ ] **Step 1: Import the modal + add the manual flag to the type**

Add import:
```tsx
import { UploadDocumentModal } from '@/components/admin/onboarding/UploadDocumentModal';
```
In the `SubmissionDetail['submission_data']` type (the `submission_data: { ... }` block ~line 72), add:
```tsx
    manual?: boolean;
    source?: string;
```

- [ ] **Step 2: Add open-state** (with the other `useState`s)

```tsx
  const [uploadOpen, setUploadOpen] = useState(false);
```

- [ ] **Step 3: Find the load/refetch function.** Read the file to find how it fetches the submission (a function like `loadSubmission`/`fetchSubmission`, or an effect using `submissionId`/`docRefreshKey`). Note its name — used in Step 5's `onUploaded`. If refresh is driven by `setDocRefreshKey`, use `setDocRefreshKey((k) => k + 1)` instead.

- [ ] **Step 4: Add an "Add document" button** in the page's header/action area (near the approve/reject actions or the page title). Use `submission` (the loaded `SubmissionDetail`):

```tsx
            {submission && (
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                Add document
              </Button>
            )}
```
(Match the existing button component import in this file — it already uses buttons for verify/reject.)

- [ ] **Step 5: Render the modal** (near the end of the JSX, only when `submission` is loaded)

```tsx
      {submission && (
        <UploadDocumentModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          customerId={submission.customer_id}
          clinicName={submission.submission_data?.business_name || 'Clinic'}
          submissionId={submissionId}
          authHeaders={authHeaders}
          onUploaded={(count) => { if (count > 0) /* refetch */ setDocRefreshKey((k) => k + 1); }}
        />
      )}
```
Replace the `setDocRefreshKey((k) => k + 1)` call with the actual refetch identified in Step 3 if different. Confirm an `authHeaders` helper exists in this file; if not, read how its other admin `fetch` calls attach auth and pass an equivalent inline function `() => ({ Authorization: ... })` matching them.

- [ ] **Step 6: Add the manual-shell banner** — where the business-detail section renders (the block that reads `submission.submission_data.entityName` / business fields), wrap so that when `submission.submission_data?.manual` is true it shows the banner instead:

```tsx
              {submission.submission_data?.manual ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  📧 Submitted via email — business &amp; banking details pending. Documents below were uploaded by an admin for vetting.
                </div>
              ) : (
                /* existing business-detail JSX block goes here unchanged */
              )}
```
Read the file to place this around the actual business-detail block; keep the existing block intact inside the `: ( ... )` branch.

- [ ] **Step 7: Type-check**

Run: `cd /tmp/ct-docup-wt && npm run type-check:memory 2>&1 | grep "vetting/\[submissionId\]/page" || echo CLEAN`
Expected: CLEAN.

- [ ] **Step 8: Commit**

```bash
git add 'app/admin/b2b/vetting/[submissionId]/page.tsx'
git commit -m "feat(vetting): add-document action + manual-email banner on vetting detail"
```

---

### Task 6: Verify on staging + open PR

- [ ] **Step 1: Full type-check (touched files only)**

Run: `cd /tmp/ct-docup-wt && npm run type-check:memory 2>&1 | grep -E "document-upload|upload-document/route|UploadDocumentModal|unjani/onboarding/page|vetting/\[submissionId\]" || echo "ALL CLEAN"`
Expected: ALL CLEAN.

- [ ] **Step 2: Run the unit test**

Run: `cd /tmp/ct-docup-wt && npx jest __tests__/lib/onboarding/document-upload.test.ts`
Expected: 5 passed.

- [ ] **Step 3: Push branch + staging**

```bash
cd /tmp/ct-docup-wt
git push -u origin feat/admin-doc-upload
git push origin feat/admin-doc-upload:staging --force
```

- [ ] **Step 4: Browser-verify on staging** (after deploy lands)
  - No-submission clinic ("Awaiting invite") → drawer → 📎 Upload documents → upload 2 files (e.g. Company registration + Bank confirmation) → Done → the clinic moves to "Docs submitted"; it appears in `/admin/b2b/vetting`; opening it shows both docs pending + the "Submitted via email" banner; verify/reject works.
  - Existing submission ("Changes requested") → vetting detail → Add document → replacement appears pending; no banner.

- [ ] **Step 5: Spot-check provenance**

```sql
select document_type, verification_status, metadata->>'source' src, metadata->>'uploaded_by' by
from kyc_documents where metadata->>'source' = 'admin_email' order by created_at desc limit 5;
```
Expected: rows with `src = admin_email` and the admin email.

- [ ] **Step 6: Open PR**

```bash
gh pr create --base main --head feat/admin-doc-upload --title "feat(vetting): admin manual document upload for compliance vetting" --body "Implements docs/superpowers/specs/2026-06-18-admin-manual-document-upload-design.md"
```

---

## Self-review notes

- **Spec coverage:** endpoint find-or-create + provenance (T2), validation helper (T1), shared modal (T3), drawer entry (T4), vetting entry + manual banner (T5), staging verification incl. both scenarios + provenance (T6). All spec sections mapped.
- **Type consistency:** `validateDocumentUpload`/`ALLOWED_DOC_TYPES`/`DOC_TYPE_OPTIONS`/`MAX_DOC_BYTES`/`ALLOWED_FILE_TYPES`/`DocType` exported in T1 and consumed identically in T2/T3. Endpoint field names mirror the wizard route (`kyc_documents` insert) and the shell mirrors the submit route (`segment:'unjani'`, `status:'submitted'`, `document_vetting_status:'documents_pending'`).
- **No placeholders:** every code step shows code; the two "read the file to place this" steps (vetting refetch fn + business-detail block anchor) are unavoidable integration points in an unfamiliar file and name exactly what to find and how to wire it.
