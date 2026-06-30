# Admin-Assisted B2B Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-assisted B2B onboarding path where admins can create a new business customer record or select an existing one, capture emailed business details and documents, send a customer-owned Service Order signoff link, and make the service debit-order billable only after the correct gates pass.

**Architecture:** Extend the existing Unjani/B2B onboarding system instead of building a parallel workflow. Use `customers`, `customer_services`, `onboarding_submissions`, `kyc_documents`, `customer_payment_methods`, `onboarding_tokens`, and the existing document-vetting workbench. Add a manual-intake page/API, purpose-scoped signoff tokens, a customer-facing Service Order acceptance page, and a shared Service Order issuer used after acceptance.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind/shadcn, Supabase service-role admin routes, Zod, Resend 6.1 attachments, Vitest/Jest, existing CircleTel onboarding/document-vetting helpers.

---

## Verified Starting Points

- Existing admin surfaces:
  - `/admin/unjani/onboarding` pipeline already manages Unjani clinic onboarding.
  - `/admin/b2b/vetting` and `/admin/b2b/vetting/[submissionId]` already handle document vetting.
  - `components/admin/layout/Sidebar.tsx` already has a `B2B Customers` menu group.
- Existing APIs:
  - `POST /api/admin/b2b/upload-document` uploads emailed documents but is documents-only and defaults new shells to `segment: 'unjani'`.
  - `POST /api/admin/b2b/issue-service-order` generates/uploads the PDF, but its email says the PDF is attached while not sending an attachment.
  - `POST /api/admin/kyc/verify` rolls up onboarding document status and calls `maybeMarkBillingReady`.
- Existing gates:
  - `lib/onboarding/billing-ready.ts` currently requires approved docs, active service, and debit-order bank details.
  - This plan adds Service Order acceptance/final PDF issuance to that gate.

## File Structure

- Create `lib/customers/account-number.ts` for reusable CT account number generation.
- Create `lib/onboarding/manual-intake.ts` for schema validation and manual-intake persistence.
- Create `app/api/admin/b2b/manual-intake/route.ts` for admin create/update.
- Create `app/admin/b2b/manual-intake/page.tsx` for the admin workflow.
- Create `app/api/admin/b2b/service-order-signoff/send/route.ts` for the signoff email.
- Create `app/onboarding/service-order/[token]/page.tsx` and `app/api/onboarding/service-order/accept/route.ts` for customer acceptance.
- Create `lib/onboarding/service-order-issuer.ts` to generate, upload, and email accepted PDFs.
- Modify `lib/onboarding/onboarding-service.ts`, `lib/onboarding/service-order-terms.ts`, `lib/onboarding/billing-ready.ts`, `components/admin/onboarding/UploadDocumentModal.tsx`, `app/api/admin/b2b/upload-document/route.ts`, `app/api/admin/b2b/issue-service-order/route.ts`, `app/api/admin/b2b/onboarding-pipeline/route.ts`, `app/admin/unjani/onboarding/page.tsx`, `components/admin/layout/Sidebar.tsx`.

## Global Constraints

- Creating a new business customer must create a **pending, non-billable shell**. Never mark `customers.onboarding_status = 'billing_ready'` during manual intake.
- New customer shell defaults: `customers.account_type = 'business'`, `customers.status = 'pending'`, `customers.account_status = 'pending'`, `customers.onboarding_status = 'in_progress'`.
- If a service row is created during intake, it must default to `customer_services.status = 'pending'`, `active = false`, and no `activation_date`.
- Billing-ready requires all four conditions: documents approved, Service Order accepted and final PDF issued, active service, and active debit-order payment method with `account_number` and `branch_code`.
- Service Order signoff is customer-owned via secure link. Do not add admin attestation as a billing-ready substitute.
- For Resend 6.1.1, PDF attachments use `attachments: [{ filename, content: Buffer, contentType: 'application/pdf' }]`.

---

### Task 1: Purpose-Scoped Onboarding Tokens

**Files:**
- Create: `supabase/migrations/20260630090000_onboarding_token_purpose.sql`
- Modify: `lib/onboarding/onboarding-service.ts`
- Test: `lib/onboarding/__tests__/onboarding-service-token-purpose.test.ts`

- [ ] **Step 1: Add token-purpose migration**

```sql
ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'onboarding'
    CHECK (purpose IN ('onboarding', 'service_order_signoff'));

ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS onboarding_submission_id uuid REFERENCES onboarding_submissions(id);

ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_purpose_submission
  ON onboarding_tokens(purpose, onboarding_submission_id)
  WHERE used_at IS NULL;
```

- [ ] **Step 2: Extend token issuing/resolution**

Update `issueToken` in `lib/onboarding/onboarding-service.ts` to accept optional purpose metadata while preserving existing callers:

```ts
export type OnboardingTokenPurpose = 'onboarding' | 'service_order_signoff';

export interface IssueTokenOptions {
  purpose?: OnboardingTokenPurpose;
  onboardingSubmissionId?: string;
  metadata?: Record<string, unknown>;
}

export async function issueToken(
  customerId: string,
  sentVia: string,
  options: IssueTokenOptions = {}
): Promise<string> {
  const supabase = svc();
  const token = generateToken();
  const { error } = await supabase.from('onboarding_tokens').insert({
    customer_id: customerId,
    token_hash: hashToken(token),
    expires_at: tokenExpiry(),
    sent_via: sentVia,
    sent_at: new Date().toISOString(),
    purpose: options.purpose ?? 'onboarding',
    onboarding_submission_id: options.onboardingSubmissionId ?? null,
    metadata: options.metadata ?? {},
  });
  if (error) throw new Error(`Failed to issue token: ${error.message}`);
  return token;
}
```

Add a resolver for signoff:

```ts
export async function resolveTokenForPurpose(
  token: string,
  purpose: OnboardingTokenPurpose
): Promise<{ customerId: string; tokenId: string; onboardingSubmissionId: string | null } | null> {
  const supabase = svc();
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('id, customer_id, expires_at, used_at, purpose, onboarding_submission_id')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error || !data) return null;
  if (data.used_at) return null;
  if (data.purpose !== purpose) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return {
    customerId: data.customer_id,
    tokenId: data.id,
    onboardingSubmissionId: data.onboarding_submission_id ?? null,
  };
}
```

- [ ] **Step 3: Test**

Add tests that verify:

```ts
expect(await resolveTokenForPurpose(serviceOrderToken, 'service_order_signoff')).toMatchObject({
  customerId: 'customer-1',
  onboardingSubmissionId: 'submission-1',
});
expect(await resolveTokenForPurpose(serviceOrderToken, 'onboarding')).toBeNull();
expect(await resolveTokenForPurpose(expiredToken, 'service_order_signoff')).toBeNull();
expect(await resolveTokenForPurpose(usedToken, 'service_order_signoff')).toBeNull();
```

Run: `npx jest lib/onboarding/__tests__/onboarding-service-token-purpose.test.ts`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260630090000_onboarding_token_purpose.sql lib/onboarding/onboarding-service.ts lib/onboarding/__tests__/onboarding-service-token-purpose.test.ts
git commit -m "feat(onboarding): scope tokens for service order signoff"
```

---

### Task 2: Manual Intake Domain Service

**Files:**
- Create: `lib/customers/account-number.ts`
- Create: `lib/onboarding/manual-intake.ts`
- Test: `lib/onboarding/__tests__/manual-intake.test.ts`

- [ ] **Step 1: Extract account number generation**

Create `lib/customers/account-number.ts` from the existing Unjani register-clinic logic:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

const RESERVED_SUFFIX_FLOOR = 9000;

export async function nextCustomerAccountNumber(supabase: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CT-${year}-`;
  const { data, error } = await supabase
    .from('customers')
    .select('account_number')
    .like('account_number', `${prefix}%`);
  if (error) throw new Error(`Failed to read account sequence: ${error.message}`);

  let max = 0;
  for (const row of data || []) {
    const value = String(row.account_number || '');
    const match = value.match(/^CT-\d{4}-(\d{5})$/);
    if (!match) continue;
    const n = parseInt(match[1], 10);
    if (n >= RESERVED_SUFFIX_FLOOR) continue;
    if (n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(5, '0')}`;
}
```

- [ ] **Step 2: Add manual-intake schema**

Create `lib/onboarding/manual-intake.ts` with:

```ts
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addBusinessDays, now } from '@/lib/dates';
import { nextCustomerAccountNumber } from '@/lib/customers/account-number';
import { step2Schema, step5Schema } from './schemas';

export const manualIntakeSegmentSchema = z.enum(['unjani', 'smb', 'edu']);

export const manualIntakeCustomerSchema = z.object({
  businessName: z.string().min(2),
  contactFirstName: z.string().min(1),
  contactLastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(9),
});

export const manualIntakeSiteSchema = z.object({
  siteName: z.string().min(2),
  province: z.string().min(2),
  siteAddress: z.string().min(5),
  contactName: z.string().min(2),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export const manualIntakeBankingSchema = z.object({
  accHolder: z.string().min(2),
  bank: z.string().min(2),
  accType: z.string().min(2),
  accNumber: z.string().min(6),
  branchCode: z.string().min(5),
});

export const manualIntakeServiceSchema = z.object({
  serviceId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  packageName: z.string().min(2).default('Business Connectivity'),
  serviceType: z.string().min(2).default('business_connectivity'),
  productCategory: z.string().min(2).default('business'),
  monthlyPriceExVat: z.number().nonnegative(),
  setupFee: z.number().nonnegative().default(0),
  contractMonths: z.number().int().min(0).default(24),
  billingDay: z.enum(['1', '15', '20', '25']),
});

export const manualIntakeSchema = z.object({
  mode: z.enum(['existing_customer', 'new_customer']),
  customerId: z.string().uuid().optional(),
  segment: manualIntakeSegmentSchema.default('smb'),
  customer: manualIntakeCustomerSchema.optional(),
  site: manualIntakeSiteSchema,
  business: step2Schema,
  banking: manualIntakeBankingSchema,
  service: manualIntakeServiceSchema.optional(),
  step5: step5Schema.pick({ paymentDate: true }),
}).superRefine((value, ctx) => {
  if (value.mode === 'existing_customer' && !value.customerId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Existing customer mode requires customerId' });
  }
  if (value.mode === 'new_customer' && !value.customer) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customer'], message: 'New customer mode requires customer details' });
  }
});

export type ManualIntakeInput = z.infer<typeof manualIntakeSchema>;
```

- [ ] **Step 3: Add persistence function**

In the same file, add `saveManualIntake(supabase, input, adminEmail)`. Required behavior:

- If `mode === 'new_customer'`, insert a pending business customer with a new account number.
- If `service` is present for a new customer, insert a pending inactive `customer_services` row.
- If `mode === 'existing_customer'`, update contact/business/site fields and optionally update the selected service billing day.
- Upsert one debit-order `customer_payment_methods` row linked to the submission.
- Create or update the latest `onboarding_submissions` row with `segment`, `status: 'submitted'`, `document_vetting_status: 'documents_pending'`, `submitted_at`, `vetting_due_date`, and `submission_data`.

The stored `submission_data` shape must be:

```ts
{
  manual: true,
  source: 'admin_manual_intake',
  uploaded_by: adminEmail,
  step1: {
    clinicName: input.site.siteName,
    province: input.site.province,
    contact: input.site.contactName,
    phone: resolvedCustomer.phone,
    email: resolvedCustomer.email,
    siteAddress: input.site.siteAddress,
    lat: input.site.lat,
    lng: input.site.lng,
  },
  step2: input.business,
  step3: {
    accHolder: input.banking.accHolder,
    bank: input.banking.bank,
    accType: input.banking.accType,
    accNumber: `****${input.banking.accNumber.slice(-4)}`,
    branchCode: input.banking.branchCode,
  },
  step5: { paymentDate: input.step5.paymentDate },
  manual_intake: {
    captured_at: now().toISOString(),
    captured_by: adminEmail,
  },
}
```

- [ ] **Step 4: Test**

Write tests for:

```ts
expect(newCustomerInsert).toMatchObject({
  account_type: 'business',
  status: 'pending',
  account_status: 'pending',
  onboarding_status: 'in_progress',
});
expect(newServiceInsert).toMatchObject({ status: 'pending', active: false });
expect(paymentMethodInsert).toMatchObject({
  method_type: 'debit_order',
  mandate_status: 'pending',
  is_primary: true,
  is_active: true,
});
expect(submissionUpsert.submission_data.manual).toBe(true);
```

Run: `npx jest lib/onboarding/__tests__/manual-intake.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/customers/account-number.ts lib/onboarding/manual-intake.ts lib/onboarding/__tests__/manual-intake.test.ts
git commit -m "feat(onboarding): add admin manual intake persistence"
```

---

### Task 3: Admin Manual Intake API

**Files:**
- Create: `app/api/admin/b2b/manual-intake/route.ts`
- Test: `app/api/admin/b2b/__tests__/manual-intake.test.ts`

- [ ] **Step 1: Add route**

Create `POST /api/admin/b2b/manual-intake`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { manualIntakeSchema, saveManualIntake } from '@/lib/onboarding/manual-intake';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const body = await request.json().catch(() => null);
  const parsed = manualIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await saveManualIntake(svc(), parsed.data, auth.adminUser.email);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    apiLogger.error('[Manual Intake] save failed', { error, admin: auth.adminUser.email });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Manual intake failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Test**

Test status codes:

```ts
expect(await postWithoutAdmin()).toHaveStatus(401);
expect(await postWithoutPermission()).toHaveStatus(403);
expect(await postInvalidPayload()).toHaveStatus(400);
expect(await postValidNewCustomer()).toMatchObject({
  success: true,
  customerId: expect.any(String),
  submissionId: expect.any(String),
});
```

Run: `npx jest app/api/admin/b2b/__tests__/manual-intake.test.ts`

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/b2b/manual-intake/route.ts app/api/admin/b2b/__tests__/manual-intake.test.ts
git commit -m "feat(admin): add B2B manual intake API"
```

---

### Task 4: Admin Manual Intake UI And Menu

**Files:**
- Create: `app/admin/b2b/manual-intake/page.tsx`
- Modify: `components/admin/layout/Sidebar.tsx`

- [ ] **Step 1: Add menu item**

Under `B2B Customers` in `components/admin/layout/Sidebar.tsx`, add:

```ts
{ name: 'Manual Intake', href: '/admin/b2b/manual-intake', icon: PiClipboardTextBold },
```

Import `PiClipboardTextBold` from `react-icons/pi`.

- [ ] **Step 2: Add page**

Create a client page with:

- Mode segmented control: `Create new business` and `Use existing customer`.
- Segment select: `Unjani`, `SMB`, `Education`.
- Existing customer search by account number/business name for existing mode.
- New customer fields: business name, first name, last name, email, phone.
- Site/contact fields: site name, province, contact name, site address, lat, lng.
- Business fields matching `step2Schema`: entity name, entity type, reg number, VAT yes/no, VAT number, registered address.
- Banking fields matching manual banking schema: account holder, bank, account type, account number, branch code.
- Billing fields: payment date `1/15/20/25`, optional package/service details for new shell.
- Submit button calls `POST /api/admin/b2b/manual-intake`.
- Success state links to `/admin/b2b/vetting/[submissionId]` and opens document upload.

- [ ] **Step 3: UI acceptance checks**

Manual browser checks:

- New customer mode refuses submit until business/contact/site/business/banking fields are valid.
- Existing customer mode refuses submit without `customerId`.
- Successful submit shows the created `accountNumber` and a link to the vetting submission.

- [ ] **Step 4: Commit**

```bash
git add app/admin/b2b/manual-intake/page.tsx components/admin/layout/Sidebar.tsx
git commit -m "feat(admin): add B2B manual intake workspace"
```

---

### Task 5: Email Provenance For Manual Document Uploads

**Files:**
- Modify: `components/admin/onboarding/UploadDocumentModal.tsx`
- Modify: `app/api/admin/b2b/upload-document/route.ts`

- [ ] **Step 1: Extend upload modal**

Add optional props:

```ts
showEmailProvenance?: boolean;
defaultReceivedAt?: string;
```

When `showEmailProvenance` is true, render fields:

- Received from email
- Received at
- Email subject
- Email reference/note

Append these to `FormData`:

```ts
fd.append('emailFrom', emailFrom.trim());
fd.append('emailReceivedAt', emailReceivedAt);
fd.append('emailSubject', emailSubject.trim());
fd.append('emailReference', emailReference.trim());
```

- [ ] **Step 2: Extend upload route**

In `app/api/admin/b2b/upload-document/route.ts`, read:

```ts
const segment = (form.get('segment') as string | null) || 'unjani';
const emailFrom = (form.get('emailFrom') as string | null)?.trim() || null;
const emailReceivedAt = (form.get('emailReceivedAt') as string | null)?.trim() || null;
const emailSubject = (form.get('emailSubject') as string | null)?.trim() || null;
const emailReference = (form.get('emailReference') as string | null)?.trim() || null;
```

Use `segment` when creating a shell instead of hardcoded `unjani`. Write metadata:

```ts
metadata: {
  source: 'admin_email',
  uploaded_by: adminEmail,
  email_from: emailFrom,
  email_received_at: emailReceivedAt,
  email_subject: emailSubject,
  email_reference: emailReference,
}
```

- [ ] **Step 3: Wire manual intake page**

On the manual intake page, call `UploadDocumentModal` with `showEmailProvenance` and pass the newly created `submissionId`.

- [ ] **Step 4: Commit**

```bash
git add components/admin/onboarding/UploadDocumentModal.tsx app/api/admin/b2b/upload-document/route.ts app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(onboarding): record email provenance for admin-uploaded documents"
```

---

### Task 6: Customer-Owned Service Order Signoff

**Files:**
- Modify: `lib/onboarding/service-order-terms.ts`
- Create: `app/api/admin/b2b/service-order-signoff/send/route.ts`
- Create: `app/onboarding/service-order/[token]/page.tsx`
- Create: `app/api/onboarding/service-order/accept/route.ts`
- Create: `lib/onboarding/service-order-issuer.ts`
- Modify: `app/api/admin/b2b/issue-service-order/route.ts`
- Test: `lib/onboarding/__tests__/service-order-issuer.test.ts`

- [ ] **Step 1: Make terms segment-aware**

Add:

```ts
export type ServiceOrderSegment = 'unjani' | 'smb' | 'edu';

export function getServiceOrderTermsContext(segment: ServiceOrderSegment | string) {
  const isUnjani = segment === 'unjani';
  return {
    title: SERVICE_ORDER_TERMS_TITLE,
    version: SERVICE_ORDER_TERMS_VERSION,
    terms: SERVICE_ORDER_TERMS,
    msaReference: isUnjani
      ? SERVICE_ORDER_MSA_REFERENCE
      : 'This Service Order is issued under CircleTel standard business service terms and the service-specific terms accepted in this workflow.',
    msaReferenceUi: isUnjani
      ? SERVICE_ORDER_MSA_REFERENCE_UI
      : 'These terms apply to the business service described in this Service Order and are accepted electronically by the authorised customer representative.',
  };
}
```

Update current Unjani self-service acceptance hashing to use `getServiceOrderTermsContext('unjani')`, preserving the current hash inputs for Unjani.

- [ ] **Step 2: Add signoff-send route**

`POST /api/admin/b2b/service-order-signoff/send` must:

- Require `customers:write` and `kyc:verify`.
- Accept `{ customerId: string; submissionId?: string }`.
- Load customer, latest submission, service, and `submission_data.step2/step3/step5`.
- Refuse with 409 if business, banking, or payment date details are missing.
- Issue token with `purpose: 'service_order_signoff'` and `onboardingSubmissionId`.
- Email link `${NEXT_PUBLIC_APP_URL}/onboarding/service-order/${token}`.
- Update `submission_data.service_order_signoff` with `sent_at`, `sent_by`, and `sent_to`.

- [ ] **Step 3: Add customer signoff page**

`app/onboarding/service-order/[token]/page.tsx` must:

- Resolve token with `resolveTokenForPurpose(token, 'service_order_signoff')`.
- Show read-only customer, site, business, service fee, billing day, masked bank details, and terms.
- Show an acceptance checkbox: `I accept the CircleTel Service Order terms and confirm I am authorised to sign for this business.`
- POST to `/api/onboarding/service-order/accept`.

- [ ] **Step 4: Add accept route**

`POST /api/onboarding/service-order/accept` must:

- Accept `{ token: string; accepted: true }`.
- Resolve service-order token and reject used/expired/wrong-purpose tokens.
- Write `submission_data.acceptance` with `accepted_at`, `ip`, `user_agent`, `token_id`, `terms_version`, `terms_hash`, `terms_snapshot`, and `msa_reference`.
- Mark token `used_at`.
- Call `issueAcceptedServiceOrder(supabase, { customerId, submissionId })`.
- Call `maybeMarkBillingReady(supabase, customerId)`.

- [ ] **Step 5: Extract final PDF issuer**

Create `lib/onboarding/service-order-issuer.ts` by moving the PDF/upload/email logic from `issue-service-order`.

Use `generateServiceOrderBuffer` for the email attachment:

```ts
attachments: [
  {
    filename: `SO-${customer.account_number}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  },
],
```

The helper must update:

```ts
service_order_pdf_path: uploadResult.path,
service_order_issued_at: new Date().toISOString(),
submission_data: {
  ...submissionData,
  service_order_pdf_sha256: pdfSha256,
}
```

- [ ] **Step 6: Guard old admin issue endpoint**

Modify `POST /api/admin/b2b/issue-service-order` so it:

- Loads latest submission.
- Returns 409 with message `Service Order must be accepted by the customer before final PDF issue.` when `submission_data.acceptance.accepted_at` is missing.
- Calls `issueAcceptedServiceOrder` when accepted.

- [ ] **Step 7: Test**

Test:

```ts
expect(signoffTokenForWrongPurpose).toReturnStatus(401);
expect(acceptanceWrite.submission_data.acceptance.accepted_at).toEqual(expect.any(String));
expect(emailPayload.attachments[0]).toMatchObject({
  filename: expect.stringContaining('SO-'),
  contentType: 'application/pdf',
});
expect(adminIssueWithoutAcceptance).toReturnStatus(409);
```

Run: `npx jest lib/onboarding/__tests__/service-order-issuer.test.ts`

- [ ] **Step 8: Commit**

```bash
git add lib/onboarding/service-order-terms.ts app/api/admin/b2b/service-order-signoff/send/route.ts app/onboarding/service-order/[token]/page.tsx app/api/onboarding/service-order/accept/route.ts lib/onboarding/service-order-issuer.ts app/api/admin/b2b/issue-service-order/route.ts lib/onboarding/__tests__/service-order-issuer.test.ts
git commit -m "feat(onboarding): add customer service order signoff flow"
```

---

### Task 7: Billing-Ready Gate Update

**Files:**
- Modify: `lib/onboarding/billing-ready.ts`
- Modify: `lib/onboarding/__tests__/billing-ready.test.ts`
- Modify: `app/api/admin/kyc/verify/route.ts`

- [ ] **Step 1: Require Service Order acceptance and issued PDF**

Update the submission select:

```ts
.select('id, document_vetting_status, submission_data, service_order_issued_at, service_order_pdf_path')
```

Add:

```ts
const acceptance = (submission.submission_data as any)?.acceptance;
if (!acceptance?.accepted_at) return false;
if (!submission.service_order_issued_at || !submission.service_order_pdf_path) return false;
```

- [ ] **Step 2: Keep document approval behavior**

Leave `app/api/admin/kyc/verify/route.ts` calling `maybeMarkBillingReady` after vetting rollup. With the new gate, docs approved before Service Order acceptance will not mark billing-ready; the accept route will call the same gate after final PDF issuance.

- [ ] **Step 3: Test**

Extend tests:

```ts
expect(await gate({ docs: 'approved', service: 'active', bank: true, acceptance: false })).toBe(false);
expect(await gate({ docs: 'approved', service: 'active', bank: true, acceptance: true, pdfIssued: false })).toBe(false);
expect(await gate({ docs: 'approved', service: 'active', bank: true, acceptance: true, pdfIssued: true })).toBe(true);
```

Run: `npx jest lib/onboarding/__tests__/billing-ready.test.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/onboarding/billing-ready.ts lib/onboarding/__tests__/billing-ready.test.ts app/api/admin/kyc/verify/route.ts
git commit -m "fix(onboarding): require service order acceptance before billing ready"
```

---

### Task 8: Pipeline Actions And Status Visibility

**Files:**
- Modify: `app/api/admin/b2b/onboarding-pipeline/route.ts`
- Modify: `app/admin/unjani/onboarding/page.tsx`
- Modify: `app/admin/b2b/vetting/[submissionId]/page.tsx`

- [ ] **Step 1: Return Service Order state in pipeline API**

Add to each pipeline row:

```ts
service_order_accepted_at: submission?.submission_data?.acceptance?.accepted_at || null,
service_order_pdf_path: submission?.service_order_pdf_path || null,
```

Extend `PipelineClinic` in the UI with these fields.

- [ ] **Step 2: Update next action logic**

In `/admin/unjani/onboarding`:

- For `docs_approved` with no `service_order_accepted_at`, next action is `Send Service Order signoff`.
- For accepted but no PDF path, next action is `Issue accepted Service Order`.
- For accepted + PDF path + billing-ready, show `Handed over`.

- [ ] **Step 3: Add vetting detail action**

On `/admin/b2b/vetting/[submissionId]`, add an inspector action after all required docs are approved:

- `Send Service Order signoff`
- calls `POST /api/admin/b2b/service-order-signoff/send`
- disabled until `document_vetting_status === 'approved'`

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/b2b/onboarding-pipeline/route.ts app/admin/unjani/onboarding/page.tsx app/admin/b2b/vetting/[submissionId]/page.tsx
git commit -m "feat(admin): surface service order signoff in B2B pipeline"
```

---

### Task 9: Verification, Docs, And Rollout

**Files:**
- Modify: `docs/onboarding/UNJANI_ONBOARDING_SALES_ADMIN_GUIDE.md`
- Optionally create: `docs/features/2026-06-30_admin-assisted-b2b-onboarding/README.md`

- [ ] **Step 1: Run targeted tests**

```bash
npx jest lib/onboarding/__tests__/manual-intake.test.ts
npx jest lib/onboarding/__tests__/billing-ready.test.ts
npx jest lib/onboarding/__tests__/service-order-issuer.test.ts
npx jest app/api/admin/b2b/__tests__/manual-intake.test.ts
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check:memory
```

Expected: no new TypeScript errors in touched files. If the repo still has unrelated pre-existing errors, document the first unrelated file and run a filtered `tsc`/test pass for the touched files.

- [ ] **Step 3: Browser verification**

Run the dev server:

```bash
npm run dev:memory
```

Manually verify:

- `/admin/b2b/manual-intake` creates a new pending business customer.
- The created customer is not billable before gates pass.
- Admin uploads an emailed document with provenance.
- Vetting approves documents.
- Admin sends Service Order signoff.
- Customer accepts via `/onboarding/service-order/[token]`.
- Final PDF is stored and emailed with an attachment.
- Customer becomes `billing_ready` only after service is active and bank details exist.

- [ ] **Step 4: Update docs**

Document the admin process:

1. Create/select customer.
2. Capture business/site/banking details.
3. Upload emailed documents.
4. Vet documents.
5. Send Service Order signoff.
6. Confirm billing-ready only after service activation and acceptance.

- [ ] **Step 5: Final commit**

```bash
git add docs/onboarding/UNJANI_ONBOARDING_SALES_ADMIN_GUIDE.md docs/features/2026-06-30_admin-assisted-b2b-onboarding/README.md
git commit -m "docs(onboarding): document admin-assisted B2B intake"
```

## Self-Review

- Spec coverage: new business customer creation, existing customer support, emailed document upload, manual business/banking capture, customer-owned Service Order signoff, final PDF issue, debit-order billing-ready gate, and admin menu placement are all mapped to tasks.
- Placeholder scan: no task relies on unspecified tables or invented routes; all new paths are named.
- Type consistency: `segment`, `submission_data.step1/step2/step3/step5`, `onboarding_submission_id`, `service_order_pdf_path`, `service_order_issued_at`, and token `purpose` are used consistently across tasks.
