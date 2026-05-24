## Why

The consumer KYC page (`/dashboard/kyc`) currently uses a manual document upload form where customers upload ID photos and selfies through a custom form. This approach has three problems:

1. **Low verification quality** — manual uploads lack liveness detection, face matching, and OCR extraction. Admin staff must visually inspect documents, creating bottlenecks and human error.
2. **Layout inconsistency** — the page uses `max-w-4xl`, `text-3xl font-bold` headers, a back button, and sequential card layout — none of which match the `/dashboard/billing` page pattern (full-width, `text-2xl font-semibold`, ModernStatCard grid, Tabs with orange active state).
3. **Wrong auth pattern** — the page uses `createClient()` directly instead of `useCustomerAuth()`, which is the standard consumer auth pattern used on billing and all other dashboard pages.

Didit provides a hosted verification flow with OCR + Passive Liveness + Face Match + IP Analysis at 500 free verifications per feature per month. Replacing manual upload with a Didit redirect flow eliminates admin document review overhead and produces structured verification results (approved/declined/pending_review) with risk scores.

## What Changes

- **Replace manual upload with Didit redirect flow.** Backend creates a Didit session via the existing `lib/integrations/didit/client.ts` → frontend redirects the customer to Didit's hosted verification UI → Didit webhook sends the decision back → `kyc_sessions` table is updated.
- **Redesign page layout to match `/dashboard/billing`.** Full-width layout, `text-2xl font-semibold` header, 4 ModernStatCards (Verification Status, Documents Verified, Identity Check, Risk Score), 3 Tabs (Verification, Documents, Timeline) with the same orange active state styling.
- **Fix auth to use `useCustomerAuth()`.** Replace direct `createClient()` with the correct consumer auth pattern.
- **Add consumer session creation endpoint.** New `POST /api/dashboard/kyc/create-session` that creates a Didit session using the customer's Supabase auth user ID as `vendor_data`.
- **Extend webhook handler for consumer sessions.** The existing webhook at `/api/compliance/webhook/didit` currently only handles B2B quote-based sessions. Add a branch for `user_type = 'consumer'` sessions.

## Capabilities

### New Capabilities

- `consumer-kyc-verification`: Didit-powered identity verification flow for consumer dashboard users. Covers session creation, redirect flow, webhook processing, and status display.

### Modified Capabilities

- `didit-webhook-processing`: Extend existing B2B webhook handler to also process consumer KYC sessions (identified by `user_type = 'consumer'` in `kyc_sessions` table).

## Impact

- **Files modified**: `app/dashboard/kyc/page.tsx` (full rewrite), `lib/integrations/didit/session-manager.ts`, `lib/integrations/didit/types.ts`, `lib/integrations/didit/webhook-handler.ts`, `app/api/compliance/webhook/didit/route.ts`, `.env.example`
- **Files created**: `app/api/dashboard/kyc/create-session/route.ts`, `app/api/dashboard/kyc/status/route.ts`
- **No database migration needed**: `kyc_sessions` table already exists with `customer_id`, `flow_type`, `user_type`, `status`, `verification_result` columns (migration `20251101000001_create_kyc_system.sql`)
- **No new dependencies**: Reuses existing Didit client (`axios`-based), ModernStatCard, Tabs, shadcn/ui components
- **Env vars required**: `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET`, `DIDIT_WORKFLOW_CONSUMER_LIGHT_KYC` (none currently in `.env.local`)
- **Risk**: Low — new API routes and page rewrite. Existing B2B Didit flows unaffected (separate `flow_type` and `quote_id`-based logic).
