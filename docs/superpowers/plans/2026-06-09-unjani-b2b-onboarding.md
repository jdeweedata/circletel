# Unjani / B2B Self-Service Onboarding — Implementation Plan (Critical Path, Phases 1–7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an already-active Unjani clinic (and, reusably, any B2B customer) complete a magic-link / OTP onboarding that captures entity + banking + DebiCheck mandate + supporting documents, get its documents vetted by an admin, and become billing-ready so the existing recurring-billing engine invoices it.

**Architecture:** Enrich-and-activate, not new-customer creation. All 20 clinic `customers`/`customer_services` rows already exist. The flow writes back the missing fields, inserts a `customer_payment_methods` row + `kyc_documents` rows, triggers a NetCash eMandate, and flips `customers.onboarding_status` to `billing_ready` only once documents are vetted AND the mandate is active. Document vetting reuses the existing `kyc_documents` table and admin KYC UI, generalized from order-scoped to customer/onboarding-scoped so the same backend serves all B2B segments.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (project `agyjovdugmtopasyvlng`), Tailwind/shadcn, NetCash eMandate (SOAP BatchFileUpload), Inngest, Vitest/Jest (`*.test.ts`), Zod, react-hook-form.

**Source spec:** `/root/.claude/plans/now-help-to-brainstorm-replicated-meadow.md` · **Reference UI:** `.docs/onboarding/circletel-onboarding-engine-v2_1 (1).html`

---

## Conventions (read once)

- **Service-role Supabase client** (public/cron/webhook routes, bypasses RLS):
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  ```
- **Admin routes:** `import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';` then `const r = await authenticateAdmin(request); if (!r.success) return r.response; const perm = requirePermission(r.adminUser, 'kyc:verify'); if (perm) return perm;`
- **Migrations are NOT auto-applied by Coolify deploy.** Apply DDL via Supabase MCP `apply_migration`. Run scripts with `set -a && source .env.local && set +a && npx tsx <script>`.
- **Type-check before every commit:** `npm run type-check:memory`.
- **kyc_documents real columns** (verified): `customer_type`, `consumer_order_id`, `business_quote_id`, `customer_name/email/phone`, `company_name`, `document_type`, `document_title`, `file_name`, `file_path`, `file_size`, `file_type`, `verification_status`, `verified_by/at`, `verification_notes`, `rejection_reason`, `is_sensitive`, `encrypted`, `expiry_date`, `metadata`. (The legacy `app/api/kyc/upload/route.ts` writes `order_id/storage_path/storage_url` which do NOT exist — do not copy it; use the columns above.)

---

## Task 1: Database migration (schema foundation)

**Files:**
- Create: `supabase/migrations/20260609120000_unjani_b2b_onboarding.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Onboarding state on existing customers (Unjani clinics live in `customers`)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS onboarding_status text
  DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending','in_progress','submitted','billing_ready','failed'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS clinic_details jsonb DEFAULT '{}'::jsonb;

-- Magic-link tokens (store only the hash; single-use; 7-day expiry)
CREATE TABLE IF NOT EXISTS onboarding_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  sent_via text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_customer ON onboarding_tokens(customer_id);

-- Submission audit + per-account document-vetting rollup
CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment text NOT NULL DEFAULT 'unjani',
  submission_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  netcash_file_token text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft','submitted','approved','rejected')),
  document_vetting_status text NOT NULL DEFAULT 'documents_pending'
    CHECK (document_vetting_status IN ('not_started','documents_pending','under_review','approved','rejected','expired')),
  admin_reviewed_at timestamptz,
  admin_reviewed_by uuid,
  admin_notes text,
  rejection_reason text,
  submitted_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_customer ON onboarding_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_vetting ON onboarding_submissions(document_vetting_status);

-- Generalize kyc_documents so docs can attach to a customer-scoped onboarding (all B2B)
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS onboarding_submission_id uuid REFERENCES onboarding_submissions(id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_onboarding_submission ON kyc_documents(onboarding_submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_customer ON kyc_documents(customer_id);

-- Link a payment method back to the onboarding submission that created it
ALTER TABLE customer_payment_methods ADD COLUMN IF NOT EXISTS onboarding_submission_id uuid REFERENCES onboarding_submissions(id);
```

- [ ] **Step 2: Apply via MCP**

Use Supabase MCP `apply_migration` with name `unjani_b2b_onboarding` and the SQL above.

- [ ] **Step 3: Verify**

Run (MCP `execute_sql`):
```sql
SELECT column_name FROM information_schema.columns WHERE table_name='customers' AND column_name IN ('onboarding_status','onboarding_completed_at','clinic_details');
SELECT to_regclass('public.onboarding_tokens'), to_regclass('public.onboarding_submissions');
SELECT column_name FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name IN ('customer_id','onboarding_submission_id');
```
Expected: 3 customer cols, both tables non-null, both kyc cols present.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260609120000_unjani_b2b_onboarding.sql
git commit -m "feat(onboarding): schema for B2B onboarding tokens, submissions, doc vetting"
```

---

## Task 2: Token service (pure logic, TDD)

**Files:**
- Create: `lib/onboarding/token-service.ts`
- Test: `lib/onboarding/__tests__/token-service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/onboarding/__tests__/token-service.test.ts
import { describe, it, expect } from 'vitest';
import { generateToken, hashToken } from '../token-service';

describe('token-service', () => {
  it('generates a URL-safe token of sufficient length', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });
  it('generates unique tokens', () => {
    expect(generateToken()).not.toEqual(generateToken());
  });
  it('hashes deterministically (same input -> same hash)', () => {
    expect(hashToken('abc')).toEqual(hashToken('abc'));
  });
  it('hashes differently for different input', () => {
    expect(hashToken('abc')).not.toEqual(hashToken('abd'));
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/onboarding/__tests__/token-service.test.ts`
Expected: FAIL — cannot find module `../token-service`.

- [ ] **Step 3: Implement**

```typescript
// lib/onboarding/token-service.ts
import crypto from 'crypto';

/** Generate a 32-byte cryptographically-random URL-safe token (the plaintext sent in the link). */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** SHA-256 hex hash. Only the hash is stored in onboarding_tokens.token_hash. */
export function hashToken(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

export const TOKEN_TTL_DAYS = 7;

/** Expiry timestamp `TOKEN_TTL_DAYS` from `from` (ISO string). */
export function tokenExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/onboarding/__tests__/token-service.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/token-service.ts lib/onboarding/__tests__/token-service.test.ts
git commit -m "feat(onboarding): magic-link token generation + hashing"
```

---

## Task 3: Document-requirements config + vetting rollup (pure logic, TDD)

**Files:**
- Create: `lib/onboarding/document-requirements.ts`
- Test: `lib/onboarding/__tests__/document-requirements.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/onboarding/__tests__/document-requirements.test.ts
import { describe, it, expect } from 'vitest';
import { requiredDocsFor, computeVettingStatus } from '../document-requirements';

describe('requiredDocsFor', () => {
  it('omits vat_certificate when not VAT registered', () => {
    const types = requiredDocsFor('unjani', { vatRegistered: false, entityType: 'Private Company (Pty) Ltd' }).map(d => d.type);
    expect(types).toContain('company_registration');
    expect(types).toContain('bank_statement');
    expect(types).not.toContain('vat_certificate');
  });
  it('includes vat_certificate when VAT registered', () => {
    const types = requiredDocsFor('unjani', { vatRegistered: true, entityType: 'Private Company (Pty) Ltd' }).map(d => d.type);
    expect(types).toContain('vat_certificate');
  });
  it('sole proprietor needs director_id (owner ID) but not company_registration', () => {
    const types = requiredDocsFor('unjani', { vatRegistered: false, entityType: 'Sole Proprietor' }).map(d => d.type);
    expect(types).toContain('director_id');
    expect(types).not.toContain('company_registration');
  });
});

describe('computeVettingStatus', () => {
  const req = ['company_registration', 'bank_statement', 'director_id'] as const;
  it('approved when every required doc approved', () => {
    expect(computeVettingStatus([...req], [
      { document_type: 'company_registration', verification_status: 'approved' },
      { document_type: 'bank_statement', verification_status: 'approved' },
      { document_type: 'director_id', verification_status: 'approved' },
    ])).toBe('approved');
  });
  it('rejected if any required doc rejected', () => {
    expect(computeVettingStatus([...req], [
      { document_type: 'company_registration', verification_status: 'rejected' },
    ])).toBe('rejected');
  });
  it('under_review when some approved, none rejected, not all done', () => {
    expect(computeVettingStatus([...req], [
      { document_type: 'company_registration', verification_status: 'approved' },
      { document_type: 'bank_statement', verification_status: 'pending' },
    ])).toBe('under_review');
  });
  it('documents_pending when nothing uploaded', () => {
    expect(computeVettingStatus([...req], [])).toBe('documents_pending');
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/onboarding/__tests__/document-requirements.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// lib/onboarding/document-requirements.ts
// kyc_document_type enum values: id_document, proof_of_address, bank_statement,
// company_registration, tax_certificate, vat_certificate, director_id, shareholder_agreement, other
export type KycDocType =
  | 'id_document' | 'proof_of_address' | 'bank_statement' | 'company_registration'
  | 'tax_certificate' | 'vat_certificate' | 'director_id' | 'shareholder_agreement' | 'other';

export type B2BSegment = 'unjani' | 'smb' | 'edu';

export interface DocRequirement {
  type: KycDocType;
  label: string;
  required: boolean;
}

export interface EntityContext {
  vatRegistered: boolean;
  entityType: string; // matches wizard step-2 entityType options
}

/** Required supporting documents for a B2B segment, given the entity context. */
export function requiredDocsFor(_segment: B2BSegment, ctx: EntityContext): DocRequirement[] {
  const isSoleProp = ctx.entityType === 'Sole Proprietor';
  const docs: DocRequirement[] = [];
  if (isSoleProp) {
    docs.push({ type: 'director_id', label: 'Owner ID document', required: true });
  } else {
    docs.push({ type: 'company_registration', label: 'CIPC registration certificate', required: true });
    docs.push({ type: 'director_id', label: 'Director / owner ID', required: true });
  }
  docs.push({ type: 'bank_statement', label: 'Bank confirmation letter or statement', required: true });
  docs.push({ type: 'proof_of_address', label: 'Proof of business address', required: true });
  if (ctx.vatRegistered) {
    docs.push({ type: 'vat_certificate', label: 'VAT registration certificate', required: true });
  }
  return docs;
}

export type VettingStatus = 'not_started' | 'documents_pending' | 'under_review' | 'approved' | 'rejected' | 'expired';

interface DocStatusRow { document_type: string; verification_status: string }

/** Roll up per-document statuses into the account-level vetting status. */
export function computeVettingStatus(requiredTypes: string[], docs: DocStatusRow[]): VettingStatus {
  if (docs.length === 0) return 'documents_pending';
  if (docs.some(d => d.verification_status === 'rejected')) return 'rejected';
  const statusByType = new Map(docs.map(d => [d.document_type, d.verification_status]));
  const allApproved = requiredTypes.every(t => statusByType.get(t) === 'approved');
  if (allApproved) return 'approved';
  return 'under_review';
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/onboarding/__tests__/document-requirements.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/document-requirements.ts lib/onboarding/__tests__/document-requirements.test.ts
git commit -m "feat(onboarding): document-requirements config + vetting rollup"
```

---

## Task 4: Pro-rata + eMandate request builder (pure logic, TDD)

**Files:**
- Create: `lib/onboarding/prorata.ts`
- Create: `lib/onboarding/emandate-request.ts`
- Test: `lib/onboarding/__tests__/prorata.test.ts`
- Test: `lib/onboarding/__tests__/emandate-request.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/onboarding/__tests__/prorata.test.ts
import { describe, it, expect } from 'vitest';
import { computeProRata } from '../prorata';

describe('computeProRata', () => {
  it('charges full month when activation is on the billing day', () => {
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2026-07-01', billingDay: 1 });
    expect(r.days).toBe(31);
    expect(r.daysInMonth).toBe(31);
    expect(r.amountInclVat).toBeCloseTo(517.5, 2);
  });
  it('pro-rates a mid-month activation', () => {
    // Activation 2026-07-16, next billing day 1 Aug -> 16 days remaining in July (16..31)
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2026-07-16', billingDay: 1 });
    expect(r.days).toBe(16);
    expect(r.daysInMonth).toBe(31);
    expect(r.amountInclVat).toBeCloseTo(517.5 * 16 / 31, 2);
  });
});
```

```typescript
// lib/onboarding/__tests__/emandate-request.test.ts
import { describe, it, expect } from 'vitest';
import { buildEMandateRequest } from '../emandate-request';

describe('buildEMandateRequest', () => {
  const base = {
    accountNumber: 'CT-2026-00020',
    paymentMethodId: 'pm-uuid',
    submissionId: 'sub-uuid',
    accountHolder: 'Lens Ext 10 Clinic',
    isConsumer: false,
    entityName: 'Lens Ext 10 (Pty) Ltd',
    registrationNumber: '2019/123456/07',
    mobile: '0718988722',
    bank: 'Capitec', accountType: 'Savings', accountNumber2: '1234567890', branchCode: '470010',
    monthlyExVat: 450, vatPct: 15, paymentDay: '1', agreementDate: '2026-07-01',
  };
  it('maps amount incl VAT and carries linkage in custom fields', () => {
    const r = buildEMandateRequest(base as any);
    expect(r.accountReference).toBe('CT-2026-00020');
    expect(r.mandateAmount).toBeCloseTo(517.5, 2);
    expect(r.isConsumer).toBe(false);
    expect(r.field1).toBe('pm-uuid');
    expect(r.field2).toBe('sub-uuid');
    expect(r.commencementDay).toBe('1');
    expect(r.bankDetailType).toBe(1);
    expect(r.bankAccountType).toBe(2); // Savings -> 2
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/onboarding/__tests__/prorata.test.ts lib/onboarding/__tests__/emandate-request.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement prorata**

```typescript
// lib/onboarding/prorata.ts
export interface ProRataInput {
  monthlyExVat: number;
  vatPct: number;
  activationDate: string; // YYYY-MM-DD
  billingDay: number;     // 1..28
}
export interface ProRataResult {
  days: number;
  daysInMonth: number;
  amountExVat: number;
  amountInclVat: number;
}

/**
 * First-invoice pro-rata: days from activation (inclusive) to the end of the
 * activation month, charged as a fraction of that month. Recurring months are full.
 */
export function computeProRata(input: ProRataInput): ProRataResult {
  const act = new Date(input.activationDate + 'T00:00:00Z');
  const year = act.getUTCFullYear();
  const month = act.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const actDay = act.getUTCDate();
  const days = daysInMonth - actDay + 1; // inclusive of activation day
  const inclFull = input.monthlyExVat * (1 + input.vatPct / 100);
  const amountInclVat = inclFull * days / daysInMonth;
  const amountExVat = input.monthlyExVat * days / daysInMonth;
  return { days, daysInMonth, amountExVat, amountInclVat };
}
```

- [ ] **Step 4: Implement emandate-request**

```typescript
// lib/onboarding/emandate-request.ts
import type { EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';

export interface EMandateBuildInput {
  accountNumber: string;       // -> accountReference + field3
  paymentMethodId: string;     // -> field1
  submissionId: string;        // -> field2
  accountHolder: string;
  isConsumer: boolean;
  entityName: string;
  registrationNumber?: string;
  mobile: string;
  bank: string;
  accountType: string;         // 'Cheque / Current' | 'Savings' | 'Transmission'
  accountNumber2: string;      // bank account number
  branchCode: string;
  monthlyExVat: number;
  vatPct: number;
  paymentDay: string;          // '1' | '15' | '20' | '25'
  agreementDate: string;       // YYYY-MM-DD (service activation / acceptance date)
}

/** Map onboarding submission data to a NetCash EMandateBatchRequest. */
export function buildEMandateRequest(i: EMandateBuildInput): EMandateBatchRequest {
  const amountInclVat = Number((i.monthlyExVat * (1 + i.vatPct / 100)).toFixed(2));
  const agreement = new Date(i.agreementDate + 'T00:00:00Z');
  // Commencement month = the month the first debit should run (next month after agreement)
  const commencementMonth = ((agreement.getUTCMonth() + 1) % 12) + 1;
  const [first = '', ...rest] = i.accountHolder.trim().split(/\s+/);
  return {
    accountReference: i.accountNumber.substring(0, 22),
    mandateName: i.accountHolder.substring(0, 50),
    isConsumer: i.isConsumer,
    firstName: first,
    surname: rest.join(' ') || i.entityName.substring(0, 50),
    mobileNumber: i.mobile,
    mandateAmount: amountInclVat,
    debitFrequency: 1, // monthly
    commencementMonth,
    commencementDay: i.paymentDay,
    agreementDate: agreement,
    agreementReference: `CT-UNJ-${i.accountNumber}`.substring(0, 50),
    sendMandate: true,
    tradingName: i.isConsumer ? undefined : i.entityName.substring(0, 50),
    registrationNumber: i.isConsumer ? undefined : i.registrationNumber,
    registeredName: i.isConsumer ? undefined : i.entityName.substring(0, 50),
    bankDetailType: 1,
    bankAccountName: i.accountHolder.substring(0, 50),
    bankAccountType: i.accountType.toLowerCase().startsWith('savings') ? 2 : 1,
    branchCode: i.branchCode,
    bankAccountNumber: i.accountNumber2,
    field1: i.paymentMethodId,
    field2: i.submissionId,
    field3: i.accountNumber,
  };
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run lib/onboarding/__tests__/prorata.test.ts lib/onboarding/__tests__/emandate-request.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/onboarding/prorata.ts lib/onboarding/emandate-request.ts lib/onboarding/__tests__/prorata.test.ts lib/onboarding/__tests__/emandate-request.test.ts
git commit -m "feat(onboarding): pro-rata calc + NetCash eMandate request builder"
```

> **Note:** `buildEMandateRequest` uses NetCash custom fields `field1/field2/field3` to carry `paymentMethodId/submissionId/accountNumber`. Before relying on these in the webhook (Task 8 of the spec / Task 9 below), confirm NetCash echoes custom fields back on the mandate postback. If it does NOT, the webhook must match on `agreementReference`/`accountReference` (`CT-UNJ-<account_number>`) instead — both are present, so this is a safe fallback.

---

## Task 5: Onboarding access — token issue + verify + clinic pre-fill

**Files:**
- Create: `lib/onboarding/onboarding-service.ts` (shared server helpers)
- Create: `app/api/admin/unjani/send-link/route.ts`
- Create: `app/api/onboarding/get-clinic/route.ts`
- Test: `lib/onboarding/__tests__/onboarding-service.test.ts`

- [ ] **Step 1: Write failing test for the link builder helper**

```typescript
// lib/onboarding/__tests__/onboarding-service.test.ts
import { describe, it, expect } from 'vitest';
import { buildMagicLinkUrl } from '../onboarding-service';

describe('buildMagicLinkUrl', () => {
  it('builds an absolute onboarding URL from base + token', () => {
    expect(buildMagicLinkUrl('https://www.circletel.co.za', 'TOK')).toBe(
      'https://www.circletel.co.za/onboarding/TOK'
    );
  });
  it('strips a trailing slash on base', () => {
    expect(buildMagicLinkUrl('https://www.circletel.co.za/', 'TOK')).toBe(
      'https://www.circletel.co.za/onboarding/TOK'
    );
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/onboarding/__tests__/onboarding-service.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement onboarding-service**

```typescript
// lib/onboarding/onboarding-service.ts
import { createClient } from '@supabase/supabase-js';
import { generateToken, hashToken, tokenExpiry } from './token-service';

export function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function buildMagicLinkUrl(base: string, token: string): string {
  return `${base.replace(/\/+$/, '')}/onboarding/${token}`;
}

/** Issue a fresh single-use token for a customer; returns the plaintext token. */
export async function issueToken(customerId: string, sentVia: string): Promise<string> {
  const supabase = svc();
  const token = generateToken();
  const { error } = await supabase.from('onboarding_tokens').insert({
    customer_id: customerId,
    token_hash: hashToken(token),
    expires_at: tokenExpiry(),
    sent_via: sentVia,
    sent_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to issue token: ${error.message}`);
  return token;
}

/** Resolve a plaintext token to a customer id, enforcing expiry + single use. */
export async function resolveToken(token: string): Promise<{ customerId: string; tokenId: string } | null> {
  const supabase = svc();
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('id, customer_id, expires_at, used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return { customerId: data.customer_id, tokenId: data.id };
}

/** Pre-fill payload for the wizard from the existing customer record. */
export async function getClinicPrefill(customerId: string) {
  const supabase = svc();
  const { data: c, error } = await supabase
    .from('customers')
    .select('id, account_number, business_name, business_registration, tax_number, email, phone, onboarding_status, clinic_details')
    .eq('id', customerId)
    .single();
  if (error || !c) return null;
  const { data: svcRow } = await supabase
    .from('customer_services')
    .select('monthly_price, billing_day, activation_date')
    .eq('customer_id', customerId)
    .limit(1)
    .maybeSingle();
  return { customer: c, service: svcRow };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/onboarding/__tests__/onboarding-service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement admin send-link route**

```typescript
// app/api/admin/unjani/send-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { issueToken, buildMagicLinkUrl } from '@/lib/onboarding/onboarding-service';
import { sendSms } from '@/lib/integrations/clickatell/sms-service'; // verify path; see Step 6
import { svc } from '@/lib/onboarding/onboarding-service';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const { customerId, channel = 'sms' } = await request.json();
  if (!customerId) return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 });

  const supabase = svc();
  const { data: customer } = await supabase
    .from('customers').select('id, phone, email, business_name').eq('id', customerId).single();
  if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });

  const token = await issueToken(customerId, channel);
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
  const url = buildMagicLinkUrl(base, token);

  // Send via the chosen channel. SMS shown; swap for WhatsApp/email per project helpers.
  if (channel === 'sms' && customer.phone) {
    await sendSms(customer.phone, `CircleTel: complete your billing setup for ${customer.business_name}: ${url} (link valid 7 days)`);
  }
  await supabase.from('customers').update({ onboarding_status: 'in_progress' }).eq('id', customerId).eq('onboarding_status', 'pending');

  return NextResponse.json({ success: true, url });
}
```

- [ ] **Step 6: Confirm the SMS helper export**

Run: `grep -rn "export" lib/integrations/clickatell/*.ts | grep -i "sms\|send" | head`
If the export name differs (e.g. `ClickatellService.send`), update the import in Step 5 accordingly. Do not invent — use the real export.

- [ ] **Step 7: Implement public get-clinic route (token-scoped)**

```typescript
// app/api/onboarding/get-clinic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveToken, getClinicPrefill } from '@/lib/onboarding/onboarding-service';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
  const resolved = await resolveToken(token);
  if (!resolved) return NextResponse.json({ error: 'invalid_or_expired' }, { status: 401 });
  const prefill = await getClinicPrefill(resolved.customerId);
  if (!prefill) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (prefill.customer.onboarding_status === 'billing_ready') {
    return NextResponse.json({ alreadyComplete: true });
  }
  return NextResponse.json({ ...prefill });
}
```

- [ ] **Step 8: Type-check + commit**

```bash
npm run type-check:memory
git add lib/onboarding/onboarding-service.ts lib/onboarding/__tests__/onboarding-service.test.ts app/api/admin/unjani/send-link/route.ts app/api/onboarding/get-clinic/route.ts
git commit -m "feat(onboarding): token issue/resolve, admin send-link, clinic pre-fill API"
```

---

## Task 6: Wizard UI (magic-link landing + 6 steps)

> Reuse `components/order/OrderWizard.tsx` for the stepper/nav (props: `currentStep`, `steps:{number,title,description}[]`, `onNext`, `onPrevious`, `canGoNext`, `isSubmitting`, `currentStep===steps.length` shows "Complete Order"). Field sets come verbatim from the reference HTML's `unjani` profile. Brand classes already exist (`bg-circleTel-orange`).

**Files:**
- Create: `app/onboarding/[token]/page.tsx` (server: nothing secret; renders client wizard)
- Create: `app/onboarding/components/OnboardingWizard.tsx` (client orchestrator)
- Create: `app/onboarding/components/useOnboardingState.ts` (client state hook)
- Create: `app/onboarding/components/steps/Step1Clinic.tsx`, `Step2Business.tsx`, `Step3Banking.tsx`, `Step4Documents.tsx`, `Step5ServiceOrder.tsx`, `Step6Done.tsx`
- Create: `lib/onboarding/schemas.ts` (Zod per step)

- [ ] **Step 1: Zod schemas (one per step)**

```typescript
// lib/onboarding/schemas.ts
import { z } from 'zod';

export const step1Schema = z.object({
  clinicName: z.string().min(3),
  unjaniAcc: z.string().min(2),
  province: z.string().min(2),
  contact: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email(),
  siteAddress: z.string().min(5),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export const step2Schema = z.object({
  entityName: z.string().min(2),
  entityType: z.string().min(2),
  regNumber: z.string().min(4),         // CIPC reg OR owner ID (sole prop)
  vat: z.enum(['No', 'Yes']),
  vatNumber: z.string().optional(),
  regAddress: z.string().min(5),
}).refine(v => v.vat === 'No' || (v.vatNumber && v.vatNumber.length >= 9), {
  message: 'VAT number required when VAT registered', path: ['vatNumber'],
});

export const step3Schema = z.object({
  accHolder: z.string().min(2),
  bank: z.string().min(2),
  accType: z.string().min(2),
  accNumber: z.string().min(6),
  branchCode: z.string().min(5),
  mandate: z.literal(true),             // DebiCheck consent checkbox
});

export const step5Schema = z.object({
  paymentDate: z.enum(['1', '15', '20', '25']),
  soAccept: z.literal(true),
});

export type Step1 = z.infer<typeof step1Schema>;
export type Step2 = z.infer<typeof step2Schema>;
export type Step3 = z.infer<typeof step3Schema>;
export type Step5 = z.infer<typeof step5Schema>;
```

- [ ] **Step 2: State hook**

```typescript
// app/onboarding/components/useOnboardingState.ts
'use client';
import { useState } from 'react';

export interface OnboardingState {
  clinic: any; service: any;            // from get-clinic
  step1: any; step2: any; step3: any;
  documents: Record<string, { documentId: string; fileName: string } | undefined>;
  step5: { paymentDate: '1'|'15'|'20'|'25'; soAccept: boolean };
}

export function useOnboardingState(prefill: { customer: any; service: any }) {
  const [current, setCurrent] = useState(1);
  const [state, setState] = useState<OnboardingState>({
    clinic: prefill.customer,
    service: prefill.service,
    step1: {
      clinicName: prefill.customer.business_name?.replace('Unjani Clinic - ', '') ?? '',
      unjaniAcc: prefill.customer.clinic_details?.unjani_account ?? '',
      province: prefill.customer.clinic_details?.province ?? '',
      contact: prefill.customer.clinic_details?.nurse_owner_name ?? '',
      phone: prefill.customer.phone ?? '',
      email: prefill.customer.email ?? '',
      siteAddress: prefill.customer.clinic_details?.site_address ?? '',
      lat: '', lng: '',
    },
    step2: { entityName: prefill.customer.business_name ?? '', entityType: '', regNumber: '', vat: 'No', vatNumber: '', regAddress: '' },
    step3: { accHolder: '', bank: '', accType: '', accNumber: '', branchCode: '', mandate: false },
    documents: {},
    step5: { paymentDate: '1', soAccept: false },
  });
  const patch = (key: keyof OnboardingState, value: any) => setState(s => ({ ...s, [key]: value }));
  return { current, setCurrent, state, patch, setState };
}
```

- [ ] **Step 3: Step components**

Build `Step1Clinic`, `Step2Business`, `Step3Banking`, `Step5ServiceOrder` as controlled forms rendering the exact fields from `lib/onboarding/schemas.ts` (and the reference HTML's `unjani` profile), each calling `onChange(patchedValues)` up to the orchestrator. Specifics:
- **Step1:** pre-filled inputs with an "on record" badge; lat/lng optional.
- **Step2:** when `entityType === 'Sole Proprietor'`, relabel `regNumber` to "Owner ID number" (13-digit) per reference. Show `vatNumber` only when `vat==='Yes'`.
- **Step3:** `bank` select (`Absa, Capitec, FNB, Investec, Nedbank, Standard Bank, TymeBank, Other`), `accType` select (`Cheque / Current, Savings, Transmission`), DebiCheck consent checkbox. Show an inline warning if `accHolder` differs from `step2.entityName` (case-insensitive, trimmed): "Account holder should match your registered entity — name mismatches are the main cause of mandate rejection."
- **Step4Documents:** see Step 4 below.
- **Step5ServiceOrder:** payment-date pills (`1/15/20/25`), order line "CircleTel ClinicConnect — R450 ex / R517.50 incl", live pro-rata from `computeProRata({monthlyExVat: service.monthly_price, vatPct:15, activationDate: service.activation_date, billingDay: Number(paymentDate)})`, collapsible Service Order T&Cs (clauses verbatim from reference), accept checkbox.
- **Step6Done:** success tick + `clinic.account_number` + "what happens next" list + "we're vetting your documents".

Each form validates with its Zod schema on Next; `canGoNext` is the schema's `safeParse(...).success`.

- [ ] **Step 4: Documents step (reuse upload pattern)**

```tsx
// app/onboarding/components/steps/Step4Documents.tsx
'use client';
import { useState } from 'react';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';

export function Step4Documents({ token, submissionId, step2, documents, onChange }: {
  token: string; submissionId: string | null; step2: any;
  documents: Record<string, any>; onChange: (docs: Record<string, any>) => void;
}) {
  const required = requiredDocsFor('unjani', { vatRegistered: step2.vat === 'Yes', entityType: step2.entityType });
  const [busy, setBusy] = useState<string | null>(null);

  async function upload(docType: string, file: File) {
    setBusy(docType);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('token', token);
    fd.append('documentType', docType);
    const res = await fetch('/api/onboarding/upload-document', { method: 'POST', body: fd });
    const json = await res.json();
    setBusy(null);
    if (json.success) onChange({ ...documents, [docType]: { documentId: json.documentId, fileName: file.name } });
    else alert(json.error || 'Upload failed');
  }

  return (
    <div className="space-y-4">
      {required.map(d => (
        <div key={d.type} className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-semibold">{d.label}{d.required && <span className="text-red-600"> *</span>}</p>
            {documents[d.type] && <p className="text-sm text-green-600">Uploaded: {documents[d.type].fileName}</p>}
          </div>
          <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy===d.type}
            onChange={e => e.target.files?.[0] && upload(d.type, e.target.files[0])} />
        </div>
      ))}
    </div>
  );
}
```
`canGoNext` for Step 4 = every `required.filter(r=>r.required)` type present in `documents`.

- [ ] **Step 5: Orchestrator + landing page**

`OnboardingWizard.tsx` (client): fetch `/api/onboarding/get-clinic?token=...` on mount; if `alreadyComplete` show "already set up"; else render `OrderWizard` with 6 steps and the active step component; on final "Complete Order" POST `/api/onboarding/submit` (Task 7) and advance to Step6Done with the returned account number. **Documents must attach to a submission** — call submit at the END so the submission exists, but documents upload in Step 4 BEFORE submit. Resolve this ordering by creating a `draft` submission when the wizard loads (POST `/api/onboarding/submit` with `{mode:'draft'}` returns `submissionId`), then uploads reference that `submissionId`, then final submit updates it to `submitted`. The orchestrator stores `submissionId` in state.

`app/onboarding/[token]/page.tsx`:
```tsx
import { OnboardingWizard } from '../components/OnboardingWizard';
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="max-w-3xl mx-auto px-4 py-8"><OnboardingWizard token={token} /></main>;
}
```

- [ ] **Step 6: Type-check + commit**

```bash
npm run type-check:memory
git add app/onboarding lib/onboarding/schemas.ts
git commit -m "feat(onboarding): 6-step clinic wizard (magic-link landing + steps)"
```

---

## Task 7: Submit API + document upload (write-back + create payment method + create kyc_documents + fire eMandate)

**Files:**
- Create: `app/api/onboarding/submit/route.ts`
- Create: `app/api/onboarding/upload-document/route.ts`

- [ ] **Step 1: Implement upload-document (token-scoped, onboarding submission)**

```typescript
// app/api/onboarding/upload-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveToken, svc } from '@/lib/onboarding/onboarding-service';
import { uploadFile } from '@/lib/storage/supabase-upload';

export async function POST(request: NextRequest) {
  const supabase = svc();
  const form = await request.formData();
  const token = form.get('token') as string;
  const documentType = form.get('documentType') as string;
  const submissionId = form.get('submissionId') as string | null;
  const file = form.get('file') as File;
  if (!token || !documentType || !file) return NextResponse.json({ success: false, error: 'token, documentType, file required' }, { status: 400 });

  const resolved = await resolveToken(token);
  if (!resolved) return NextResponse.json({ success: false, error: 'invalid_or_expired' }, { status: 401 });

  const { data: customer } = await supabase
    .from('customers').select('business_name, email, phone').eq('id', resolved.customerId).single();

  const up = await uploadFile(file, {
    bucket: 'kyc-documents',
    folder: `onboarding/${resolved.customerId}/${documentType}`,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    supabaseClient: supabase,
  });
  if (!up.success) return NextResponse.json({ success: false, error: up.error }, { status: 500 });

  const { data: doc, error } = await supabase.from('kyc_documents').insert({
    customer_type: 'business',
    customer_id: resolved.customerId,
    onboarding_submission_id: submissionId || null,
    company_name: customer?.business_name ?? null,
    customer_email: customer?.email ?? null,
    customer_phone: customer?.phone ?? null,
    document_type: documentType,
    file_name: file.name,
    file_path: up.path,
    file_size: file.size,
    file_type: file.type,
    verification_status: 'pending',
    is_sensitive: true,
  }).select('id').single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, documentId: doc.id });
}
```
> If `customer_type` enum rejects `'business'`, run `SELECT enum_range(NULL::kyc_customer_type);` and use the correct label.

- [ ] **Step 2: Implement submit (draft + final modes)**

```typescript
// app/api/onboarding/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveToken, svc } from '@/lib/onboarding/onboarding-service';
import { step1Schema, step2Schema, step3Schema, step5Schema } from '@/lib/onboarding/schemas';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';
import { buildEMandateRequest } from '@/lib/onboarding/emandate-request';
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';

export async function POST(request: NextRequest) {
  const supabase = svc();
  const body = await request.json();
  const { token, mode } = body;
  const resolved = await resolveToken(token);
  if (!resolved) return NextResponse.json({ success: false, error: 'invalid_or_expired' }, { status: 401 });
  const customerId = resolved.customerId;

  // DRAFT: create (or return existing) a submission so document uploads have an anchor
  if (mode === 'draft') {
    const { data: existing } = await supabase.from('onboarding_submissions')
      .select('id').eq('customer_id', customerId).eq('status', 'submitted').maybeSingle();
    if (existing) return NextResponse.json({ success: true, submissionId: existing.id });
    const { data, error } = await supabase.from('onboarding_submissions')
      .insert({ customer_id: customerId, segment: 'unjani', status: 'draft' }).select('id').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, submissionId: data.id });
  }

  // FINAL: validate all steps
  const s1 = step1Schema.safeParse(body.step1);
  const s2 = step2Schema.safeParse(body.step2);
  const s3 = step3Schema.safeParse(body.step3);
  const s5 = step5Schema.safeParse(body.step5);
  if (!s1.success || !s2.success || !s3.success || !s5.success) {
    return NextResponse.json({ success: false, error: 'validation_failed' }, { status: 400 });
  }
  const submissionId = body.submissionId as string;

  // Require all mandatory documents present
  const required = requiredDocsFor('unjani', { vatRegistered: s2.data.vat === 'Yes', entityType: s2.data.entityType });
  const { data: docs } = await supabase.from('kyc_documents')
    .select('document_type').eq('onboarding_submission_id', submissionId);
  const have = new Set((docs ?? []).map(d => d.document_type));
  const missing = required.filter(r => r.required && !have.has(r.type));
  if (missing.length) return NextResponse.json({ success: false, error: 'documents_missing', missing: missing.map(m => m.type) }, { status: 400 });

  // 1) Enrich customer
  await supabase.from('customers').update({
    business_name: s2.data.entityName,
    business_registration: s2.data.regNumber,
    tax_number: s2.data.vat === 'Yes' ? s2.data.vatNumber : null,
    onboarding_status: 'submitted',
    clinic_details: {
      clinic_name: s1.data.clinicName, unjani_account: s1.data.unjaniAcc, province: s1.data.province,
      nurse_owner_name: s1.data.contact, site_address: s1.data.siteAddress, lat: s1.data.lat, lng: s1.data.lng,
    },
  }).eq('id', customerId);

  // 2) Set chosen billing day on the service
  await supabase.from('customer_services').update({ billing_day: Number(s5.data.paymentDate) }).eq('customer_id', customerId);

  // 3) Create payment method (mandate pending, NOT verified yet)
  const { data: pm } = await supabase.from('customer_payment_methods').insert({
    customer_id: customerId,
    onboarding_submission_id: submissionId,
    method_type: 'debit_order',
    display_name: `DebiCheck - ${s3.data.bank} ****${s3.data.accNumber.slice(-4)}`,
    last_four: s3.data.accNumber.slice(-4),
    encrypted_details: {
      bank_name: s3.data.bank, account_holder_name: s3.data.accHolder, account_type: s3.data.accType,
      account_number: s3.data.accNumber, branch_code: s3.data.branchCode, verified: false,
    },
    mandate_status: 'pending', is_primary: true, is_active: true,
  }).select('id').single();

  // 4) Finalize submission
  await supabase.from('onboarding_submissions').update({
    status: 'submitted', document_vetting_status: 'documents_pending',
    submission_data: { step1: s1.data, step2: s2.data, step3: { ...s3.data, accNumber: `****${s3.data.accNumber.slice(-4)}` }, step5: s5.data },
  }).eq('id', submissionId);

  // 5) Mark token used (single-use)
  await supabase.from('onboarding_tokens').update({ used_at: new Date().toISOString() }).eq('id', resolved.tokenId);

  // 6) Fire NetCash eMandate (best-effort; do not fail the submission on transient errors)
  const { data: cust } = await supabase.from('customers').select('account_number').eq('id', customerId).single();
  const { data: svcRow } = await supabase.from('customer_services').select('monthly_price, activation_date').eq('customer_id', customerId).maybeSingle();
  let fileToken: string | undefined;
  try {
    const req = buildEMandateRequest({
      accountNumber: cust!.account_number, paymentMethodId: pm!.id, submissionId,
      accountHolder: s3.data.accHolder, isConsumer: false, entityName: s2.data.entityName,
      registrationNumber: s2.data.regNumber, mobile: s1.data.phone, bank: s3.data.bank,
      accountType: s3.data.accType, accountNumber2: s3.data.accNumber, branchCode: s3.data.branchCode,
      monthlyExVat: Number(svcRow?.monthly_price ?? 450), vatPct: 15, paymentDay: s5.data.paymentDate,
      agreementDate: new Date().toISOString().slice(0, 10),
    });
    const result = await new NetCashEMandateBatchService().submitMandate(req);
    if (result.success) {
      fileToken = result.fileToken;
      await supabase.from('onboarding_submissions').update({ netcash_file_token: fileToken }).eq('id', submissionId);
    }
  } catch (e) {
    console.error('[Onboarding] eMandate submit error', e);
  }

  return NextResponse.json({ success: true, accountNumber: cust!.account_number, eMandateSent: !!fileToken });
}
```

- [ ] **Step 3: Manual verification (one clinic, end to end up to submit)**

Issue a token for `CT-2026-00020` (MCP `execute_sql` to read its `customers.id`, then call send-link or insert a token via the service). Open `/onboarding/<token>`, complete all steps with a test PDF per required doc. Then verify:
```sql
SELECT onboarding_status, business_registration, tax_number FROM customers WHERE account_number='CT-2026-00020';
SELECT mandate_status, is_primary, encrypted_details->>'verified' FROM customer_payment_methods WHERE customer_id=(SELECT id FROM customers WHERE account_number='CT-2026-00020');
SELECT status, document_vetting_status, netcash_file_token FROM onboarding_submissions WHERE customer_id=(SELECT id FROM customers WHERE account_number='CT-2026-00020');
SELECT document_type, verification_status FROM kyc_documents WHERE customer_id=(SELECT id FROM customers WHERE account_number='CT-2026-00020');
```
Expected: customer `submitted` + reg/vat filled; payment method `pending`, `verified=false`; submission `submitted`/`documents_pending`; one `pending` kyc_documents row per required type.

- [ ] **Step 4: Type-check + commit**

```bash
npm run type-check:memory
git add app/api/onboarding/submit/route.ts app/api/onboarding/upload-document/route.ts
git commit -m "feat(onboarding): submit write-back + document upload + eMandate trigger"
```

---

## Task 8: Generalize the admin vetting backend + B2B vetting queue

**Files:**
- Modify: `app/api/admin/kyc/verify/route.ts`
- Create: `app/api/admin/b2b/vetting/route.ts` (queue list)
- Create: `app/api/admin/b2b/vetting/[submissionId]/route.ts` (detail)
- Create: `app/admin/b2b/vetting/page.tsx` (queue UI)
- Create: `app/admin/b2b/vetting/[submissionId]/page.tsx` (detail UI)

- [ ] **Step 1: Generalize the verify route rollup**

The existing route updates document status then, for consumer orders, checks "all approved → `consumer_orders.status='kyc_approved'`". Add a branch: when the document carries an `onboarding_submission_id`, roll up via `computeVettingStatus` over that submission's required docs instead. Replace the post-update block (after the `kyc_documents` update succeeds) with:

```typescript
import { computeVettingStatus, requiredDocsFor } from '@/lib/onboarding/document-requirements';
// ...after the kyc_documents update...

// Re-fetch the document to learn its scope
const { data: scope } = await supabase
  .from('kyc_documents')
  .select('consumer_order_id, onboarding_submission_id')
  .eq('id', documentId).single();

if (scope?.onboarding_submission_id) {
  // B2B onboarding rollup
  const submissionId = scope.onboarding_submission_id;
  const { data: sub } = await supabase
    .from('onboarding_submissions')
    .select('id, customer_id, segment, submission_data')
    .eq('id', submissionId).single();
  const { data: subDocs } = await supabase
    .from('kyc_documents')
    .select('document_type, verification_status')
    .eq('onboarding_submission_id', submissionId);
  const sd = (sub?.submission_data ?? {}) as any;
  const required = requiredDocsFor(sub?.segment ?? 'unjani', {
    vatRegistered: sd?.step2?.vat === 'Yes',
    entityType: sd?.step2?.entityType ?? '',
  }).filter(r => r.required).map(r => r.type);
  const vetting = computeVettingStatus(required, subDocs ?? []);
  await supabase.from('onboarding_submissions').update({
    document_vetting_status: vetting,
    status: vetting === 'approved' ? 'approved' : vetting === 'rejected' ? 'rejected' : 'submitted',
    admin_reviewed_at: new Date().toISOString(),
    admin_reviewed_by: authResult.adminUser.id,
  }).eq('id', submissionId);
  // Attempt to flip billing-ready (only succeeds if mandate already active)
  await maybeMarkBillingReady(supabase, sub!.customer_id);
  return NextResponse.json({ success: true, vetting });
}

// else: existing consumer_orders path (unchanged)
```

Add a shared helper used by both this route and the webhook (Task 9):

```typescript
// lib/onboarding/billing-ready.ts
import type { SupabaseClient } from '@supabase/supabase-js';

/** Set customers.onboarding_status='billing_ready' iff docs approved AND mandate active+verified. */
export async function maybeMarkBillingReady(supabase: SupabaseClient, customerId: string): Promise<boolean> {
  const { data: sub } = await supabase.from('onboarding_submissions')
    .select('document_vetting_status').eq('customer_id', customerId)
    .order('submitted_at', { ascending: false }).limit(1).maybeSingle();
  const { data: pm } = await supabase.from('customer_payment_methods')
    .select('mandate_status, encrypted_details').eq('customer_id', customerId)
    .eq('is_active', true).eq('method_type', 'debit_order').maybeSingle();
  const docsOk = sub?.document_vetting_status === 'approved';
  const mandateOk = (pm?.mandate_status === 'active' || pm?.mandate_status === 'approved')
    && (pm?.encrypted_details?.verified === true || pm?.encrypted_details?.verified === 'true');
  if (docsOk && mandateOk) {
    await supabase.from('customers').update({
      onboarding_status: 'billing_ready', onboarding_completed_at: new Date().toISOString(),
    }).eq('id', customerId);
    return true;
  }
  return false;
}
```
Import `maybeMarkBillingReady` into the verify route. (Note the existing route names its auth result `authResult` — reuse `authResult.adminUser.id`.)

- [ ] **Step 2: Queue list route**

```typescript
// app/api/admin/b2b/vetting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, 'kyc:verify');
  if (perm) return perm;
  const supabase = await createClient();
  const segment = new URL(request.url).searchParams.get('segment');
  let q = supabase.from('onboarding_submissions')
    .select('id, customer_id, segment, status, document_vetting_status, submitted_at, customer:customers(account_number, business_name, onboarding_status)')
    .in('status', ['submitted', 'approved', 'rejected'])
    .order('submitted_at', { ascending: true });
  if (segment) q = q.eq('segment', segment);
  const { data, error } = await q;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, submissions: data ?? [] });
}
```

- [ ] **Step 3: Detail route (documents + entity + banking + name-match)**

```typescript
// app/api/admin/b2b/vetting/[submissionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, ctx: { params: Promise<{ submissionId: string }> }) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, 'kyc:verify');
  if (perm) return perm;
  const { submissionId } = await ctx.params;
  const supabase = await createClient();
  const { data: sub } = await supabase.from('onboarding_submissions')
    .select('*, customer:customers(account_number, business_name, business_registration, tax_number, onboarding_status)')
    .eq('id', submissionId).single();
  const { data: documents } = await supabase.from('kyc_documents')
    .select('id, document_type, file_name, file_path, verification_status, rejection_reason, verified_at')
    .eq('onboarding_submission_id', submissionId);
  const { data: pm } = await supabase.from('customer_payment_methods')
    .select('display_name, last_four, mandate_status, encrypted_details')
    .eq('onboarding_submission_id', submissionId).maybeSingle();
  // name-match flag (account holder vs entity)
  const holder = (pm?.encrypted_details?.account_holder_name ?? '').trim().toLowerCase();
  const entity = (sub?.customer?.business_name ?? '').trim().toLowerCase();
  const nameMatch = holder.length > 0 && holder === entity;
  return NextResponse.json({ success: true, submission: sub, documents: documents ?? [], paymentMethod: pm, nameMatch });
}
```

- [ ] **Step 4: Queue + detail UI**

`app/admin/b2b/vetting/page.tsx`: table of submissions (Account #, Business, Segment, `document_vetting_status` via `components/compliance/KYCStatusBadge.tsx`, doc count, mandate, days waiting), each row links to detail. Use existing admin layout + `StatCard`/`StatusBadge` (props: `StatusBadge` uses `status=`; `StatCard` `icon` is a ReactNode — pass `icon={<PiXxx />}`).

`app/admin/b2b/vetting/[submissionId]/page.tsx`: render the document checklist; per doc, a "View" button calling existing `app/api/admin/kyc/document-url/route.ts` to get a signed URL (reuse `components/admin/kyc/DocumentViewer.tsx`), plus **Approve** / **Reject (reason)** buttons POSTing to `app/api/admin/kyc/verify` with `{ documentId, status, rejectionReason }`. Show read-only entity (reg/VAT) and masked banking with the `nameMatch` warning. Bottom: a status banner reflecting `document_vetting_status`; once `approved` and mandate active, the customer auto-flips to `billing_ready` (no extra button needed because `verify` calls `maybeMarkBillingReady`). Add a "Request changes" control that POSTs `verify` with `status:'under_review'`/reject to set a doc back to re-upload.

- [ ] **Step 5: Manual verification**

In the queue, open the `CT-2026-00020` submission, view each doc, approve all required. Then:
```sql
SELECT document_vetting_status, status FROM onboarding_submissions WHERE customer_id=(SELECT id FROM customers WHERE account_number='CT-2026-00020');
SELECT onboarding_status FROM customers WHERE account_number='CT-2026-00020';
```
Expected: submission `approved`; customer still `submitted` (mandate not yet active — flips after Task 9).

- [ ] **Step 6: Type-check + commit**

```bash
npm run type-check:memory
git add app/api/admin/kyc/verify/route.ts lib/onboarding/billing-ready.ts app/api/admin/b2b app/admin/b2b
git commit -m "feat(vetting): generalize KYC verify to onboarding submissions + B2B vetting queue/detail"
```

---

## Task 9: eMandate webhook fix (mandate active → verified → billing-ready)

**Files:**
- Locate + Modify: the NetCash eMandate postback handler (spec names `lib/payment/netcash-webhook-processor.ts`)
- Possibly Modify: the eMandate webhook route under `app/api/`

- [ ] **Step 1: Locate the handler**

Run:
```bash
grep -rln "mandate" app/api lib/payment lib/payments lib/integrations | grep -i "webhook\|postback\|notify" 
grep -rln "payment_methods\b" lib/payment lib/payments app/api | head
```
Identify the route that receives NetCash mandate postbacks and the function that currently writes `payment_methods`. Read it before editing.

- [ ] **Step 2: On mandate signed/active, write `customer_payment_methods` (the table the batch reads) + set `verified`**

In the handler's "mandate approved/active" branch, resolve the payment method. Prefer the custom field `field1` (the `customer_payment_methods.id`) if NetCash echoes it; otherwise match by account reference (`field3`/`accountReference` = `customers.account_number`). Then:

```typescript
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';

// resolve paymentMethodId (by field1) OR customerId (by account_number from field3/accountReference)
const { data: pm } = await supabase
  .from('customer_payment_methods')
  .select('id, customer_id, encrypted_details')
  .eq(paymentMethodId ? 'id' : 'customer_id', paymentMethodId ?? customerIdFromAccountRef)
  .eq('method_type', 'debit_order').eq('is_active', true)
  .order('created_at', { ascending: false }).limit(1).maybeSingle();

if (pm) {
  await supabase.from('customer_payment_methods').update({
    mandate_id: netcashMandateRef,
    mandate_status: 'active',
    mandate_approved_at: new Date().toISOString(),
    encrypted_details: { ...(pm.encrypted_details ?? {}), verified: true }, // batch requires verified===true
  }).eq('id', pm.id);

  // Keep legacy payment_methods in sync for back-compat (existing behaviour stays)
  // ...existing payment_methods upsert...

  // Flip to billing_ready iff docs already vetted-approved
  await maybeMarkBillingReady(supabase, pm.customer_id);
}
```

On rejection: set `customer_payment_methods.mandate_status='failed'` and `customers.onboarding_status='failed'`, and notify (reuse existing notification service).

- [ ] **Step 3: Verify with a simulated postback**

If the test account still does not deliver postbacks (known blocker), simulate by directly setting the mandate active and calling the helper path. Run via a tsx script or MCP `execute_sql`:
```sql
UPDATE customer_payment_methods
SET mandate_status='active', mandate_approved_at=now(),
    encrypted_details = jsonb_set(coalesce(encrypted_details,'{}'::jsonb),'{verified}','true')
WHERE customer_id=(SELECT id FROM customers WHERE account_number='CT-2026-00020');
```
Then trigger the billing-ready check (call the webhook handler or run a one-off tsx invoking `maybeMarkBillingReady`). Verify:
```sql
SELECT onboarding_status, onboarding_completed_at FROM customers WHERE account_number='CT-2026-00020';
```
Expected: `billing_ready` (because docs were approved in Task 8).

- [ ] **Step 4: Commit**

```bash
npm run type-check:memory
git add <located webhook files> lib/onboarding/billing-ready.ts
git commit -m "fix(emandate): write customer_payment_methods + verified flag on mandate active, flip billing-ready"
```

---

## Task 10: Billing gate + pro-rata first invoice + collection method

**Files:**
- Modify: `lib/billing/monthly-invoice-generator.ts` (eligibility query + first-invoice amount + payment_collection_method)

- [ ] **Step 1: Gate eligibility on billing-ready (inner join)**

In `getServicesDueForBilling` change the customer join to `!inner` and add the filter so only vetted+mandated clinics bill:

```typescript
// in the .select(...) string, change:
//   customer:customers( ... )
// to:
//   customer:customers!inner( id, first_name, last_name, email, phone, account_number, onboarding_status )
// then after .eq('billing_day', billingDay) add:
      .eq('customers.onboarding_status', 'billing_ready');
```
Update the `ServiceToBill` type / mapping to include `customer.onboarding_status` (it is read-only here; no other change).

- [ ] **Step 2: Pro-rata the FIRST invoice and set collection method**

In `processServiceBilling` (where the invoice amount + insert are built), use `last_invoice_date === null` to pick pro-rata vs full, and always set `payment_collection_method='debit_order'`:

```typescript
import { computeProRata } from '@/lib/onboarding/prorata';
// when building the invoice amounts:
const isFirst = service.last_invoice_date === null;
let subtotalExVat = service.monthly_price;
if (isFirst && service.activation_date) {
  subtotalExVat = computeProRata({
    monthlyExVat: service.monthly_price, vatPct: 15,
    activationDate: service.activation_date, billingDay: service.billing_day,
  }).amountExVat;
}
const taxAmount = Number((subtotalExVat * 0.15).toFixed(2));
const totalAmount = Number((subtotalExVat + taxAmount).toFixed(2));
// include in the customer_invoices insert payload:
//   subtotal: subtotalExVat, tax_amount: taxAmount, total_amount: totalAmount,
//   amount_due: totalAmount, amount_paid: 0,
//   payment_collection_method: 'debit_order',
```
Add `activation_date` to the `getServicesDueForBilling` select and to the `ServiceToBill` type if not already present (it is selected as part of `customer_services`; add `activation_date` to the column list).

- [ ] **Step 3: Verify (dry run)**

Run a dry-run generation for `billing_day=1` against the billing-ready clinic only. Use the existing cron/generator entry with `dryRun: true` (e.g. a tsx script calling `new MonthlyInvoiceGenerator().generateMonthlyInvoices({ billingDay: 1, dryRun: true })`). Confirm: only `CT-2026-00020` (billing_ready) is selected; other 19 clinics (`submitted`/`pending`) are excluded; the computed first invoice is pro-rata and carries `payment_collection_method='debit_order'`.

Then confirm the debit-order batch would pick it up (it already filters `payment_collection_method in ('debit_order','Debit Order')` AND requires `customer_payment_methods.encrypted_details.verified===true` + `mandate_status active/approved` — all satisfied after Task 9).

- [ ] **Step 4: Type-check + commit**

```bash
npm run type-check:memory
git add lib/billing/monthly-invoice-generator.ts
git commit -m "feat(billing): gate invoicing on billing_ready + pro-rata first invoice + debit_order collection"
```

---

## End-to-end verification (whole critical path)

1. `git pull` clean; migration applied (Task 1 verify queries pass).
2. Admin issues a magic link to `CT-2026-00020`; open `/onboarding/<token>` → fields pre-filled; `alreadyComplete` is false.
3. Complete all 6 steps incl. a PDF per required document; submit succeeds; Step 6 shows the account number.
4. DB shows: customer `submitted` + reg/VAT filled; `customer_payment_methods` `pending`+`verified=false`; submission `submitted`/`documents_pending`; one `pending` kyc_documents row per required type; `netcash_file_token` set (or eMandate flagged not-sent if blocker active).
5. Admin vetting queue lists the clinic; view each doc via signed URL; reject one → it returns to re-upload and submission stays `submitted`; re-upload + approve all → submission `approved`.
6. Mandate becomes active (real postback or simulated SQL in Task 9) → `customer_payment_methods` `active`+`verified=true` → customer `billing_ready`.
7. Dry-run `generateMonthlyInvoices({billingDay:1, dryRun:true})` → only `billing_ready` clinic selected, pro-rata first invoice, `payment_collection_method='debit_order'`.
8. `npm run type-check:memory` clean; all phase tests pass: `npx vitest run lib/onboarding/__tests__`.

---

## Self-review notes (carry into execution)

- **NetCash postback blocker** (test account not delivering eMandate postbacks) gates Task 9 step 3 and the live half of Task 10. Resolve on a working account or use the documented SQL simulation to prove the chain; do not claim live collection until a real postback flips `verified=true`.
- **Custom-field echo**: confirm NetCash returns `field1/field2/field3` on the postback; the webhook (Task 9) has an account-reference fallback if not.
- **`customer_type` enum**: verify the `'business'` label exists before relying on it (Task 7 step 1 note).
- **Reusability**: nothing above is Unjani-specific except `segment:'unjani'` defaults and copy. `requiredDocsFor`, the vetting rollup, the generalized verify route, and the `app/admin/b2b/vetting` queue serve any segment — a future SMB/EduConnect onboarding sets `segment` and reuses all of it.
