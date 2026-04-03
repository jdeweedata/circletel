---
name: order-flow-auth-oauth-fixes
description: Order flow 2-step refactor, Supabase client 401 root cause, signup 500 edge cases, Google OAuth exchange error, sanity/image-url deprecation
type: session
---

# Order Flow, Auth & OAuth Fixes — Session Learnings

**Date**: 2026-04-03
**Duration**: ~3 hours (continued across context compaction)

---

## 1. Supabase Client Selection — 401 Root Cause (Correction)

### Pattern
`/api/order-drafts` was returning 401 on every call despite valid user sessions.

**Root cause**: Route was using `createClient()` (service role, `persistSession: false`) instead of `createClientWithSession()`. The service role client has no access to cookies, so `supabase.auth.getUser()` always returns `null`.

```typescript
// ❌ WRONG — getUser() always returns null, 401 on every request
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
await supabase.auth.getUser() // null!

// ✅ CORRECT — reads session from httpOnly cookies
import { createClientWithSession } from '@/lib/supabase/server'
const supabase = await createClientWithSession()
await supabase.auth.getUser() // returns logged-in user
```

**Rule**: If ANY handler in an API route calls `supabase.auth.getUser()`, the entire route MUST use `createClientWithSession()`. This applies to ALL three HTTP methods (GET, PUT, DELETE) — all must use the same client.

**Already documented in**: `.claude/rules/auth-patterns.md`

---

## 2. Supabase Signup — Two Distinct 500 Failure Modes

Supabase returns HTTP 500 for two completely different failures during `signUp()`:

| Message contains | Cause | Correct handling |
|-----------------|-------|-----------------|
| `"Database error saving new user"` | Duplicate email (user already exists) | Return friendly "already registered" message |
| `"Error sending confirmation email"` / SMTP keywords | SMTP misconfiguration / Resend not yet active | Attempt `signInWithPassword` recovery — user was likely created |

```typescript
// Detection pattern
const lowerErr = authError.message.toLowerCase();
const isDuplicate = lowerErr.includes('already registered') ||
  lowerErr.includes('database error saving new user') ||
  (authError.status === 500 && !lowerErr.includes('smtp') && !lowerErr.includes('sending'));

const isEmailError = lowerErr.includes('error sending') ||
  lowerErr.includes('smtp') ||
  lowerErr.includes('email');
```

**Key insight**: `"Database error saving new user"` is Supabase's opaque 500 for duplicate accounts — it doesn't say "already registered". The old check only matched `"already registered"`.

**File**: `lib/auth/customer-auth-service.ts`

---

## 3. Multi-Step Form — Removing a Step (Architecture Pattern)

### Context
Removed `/order/coverage` as a step from the 3-step flow (Coverage → Packages → Checkout) to make it 2-step (Packages → Checkout). The coverage check now happens on the homepage before the order flow begins.

### Decisions Made

**Keep the old page as a server-side redirect** (not delete it):
```typescript
// app/order/coverage/page.tsx — now a redirect
export default async function CoveragePage({ searchParams }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
  }
  redirect(qs.toString() ? `/?${qs}` : '/');
}
```
Reason: Preserves bookmarks, email links, marketing URLs. Old `?product=slug` params forward cleanly.

**Move data capture to the next step** (not eliminate it):
Property type (residential/business sub-type) was only collected on `/order/coverage`. Since it's still needed by the order API, it was moved to checkout as a required field in a new `ServiceAddressSection` component.

**Validate before submit, not on mount**:
Property type validation runs in `validateBeforeOrder()` called from all three submit handlers (new user, existing user, phone OTP), not as a blocking gate on page load.

### Checklist for removing a step from a multi-step flow

1. **Convert old page to redirect** — never delete, forward query params
2. **Audit what data was collected there** — find every field, move each one
3. **Update the progress bar type** — remove the stage from the union type
4. **Add stage migration** — clamp persisted state (localStorage) to new max
5. **Update all link references** — grep for the old path, update ~15 files
6. **Update auth allowed-redirect list** — remove old path from login page
7. **Update `app/order/page.tsx`** — it often redirects to the first step

**Files pattern**: grep for old path in `*.tsx,*.ts` — check: `app/`, `components/`, `lib/`, `app/auth/login/page.tsx` (allowed redirects)

---

## 4. Google OAuth "Unable to exchange external code" — Client Secret Mismatch

### Symptom
After Google sign-in redirect, Supabase returns:
```
{"code":500,"error_code":"unexpected_failure","msg":"Unable to exchange external code: ..."}
```

### Cause
The Client Secret stored in Supabase (Auth → Providers → Google) didn't match the current secret in GCP Console. This happens when the secret is rotated in GCP (manually or as part of re-verification) without updating Supabase.

### Fix
1. GCP Console → APIs & Services → Credentials → OAuth 2.0 Client → copy Client Secret
2. Supabase Dashboard → Authentication → Providers → Google → paste new secret → Save

**Why it's easy to miss**: GCP doesn't notify you when you rotate a secret. The error message ("exchange external code") doesn't mention "secret" anywhere — it looks like a network or callback URL error.

---

## 5. `@sanity/image-url` Deprecation

Default export `imageUrlBuilder` is deprecated. Use named export:

```typescript
// ❌ WRONG (deprecation warning)
import imageUrlBuilder from '@sanity/image-url';
const builder = imageUrlBuilder(client);

// ✅ CORRECT
import { createImageUrlBuilder } from '@sanity/image-url';
const builder = createImageUrlBuilder(client);
```

**File**: `lib/sanity/image.ts`

---

## 6. CheckoutProgressBar — Type Safety for Stage Removal

When removing a stage from a union type used as a prop (`CheckoutStage`), also update:
- The `STEPS` array (remove the step object)
- The `stepNumberToStage` fallback value (was `'coverage'`, changed to `'packages'`)
- All usages of the old stage string across the codebase

The `CheckoutStage` type is used as a prop on `CheckoutProgressBar` — TypeScript will catch usages of the removed stage immediately on type-check.

---

## Patterns → Artifacts

| Pattern | Signal | Artifact | Status |
|---------|--------|----------|--------|
| `createClientWithSession` for user auth | 2+ sessions | Already in `auth-patterns.md` | Existing |
| Supabase signup 500 dual modes | 1 session | Consider adding to auth docs | Skipped (in code) |
| Step removal architecture | 1 session | This file | Captured |
| Google OAuth secret mismatch | 1 session | This file | Captured |
| `@sanity/image-url` named export | 1 session | This file | Captured |
