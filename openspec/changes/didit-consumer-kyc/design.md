## Context

The consumer dashboard KYC page (`/dashboard/kyc`) needs to be rebuilt to use Didit's hosted verification redirect flow and match the billing page's visual layout. Existing Didit infrastructure in `lib/integrations/didit/` handles B2B flows (quote-based sessions via `createKYCSessionForQuote()`). The consumer flow differs: sessions are keyed by `customer_id` (Supabase auth user ID) rather than `quote_id`, and the frontend uses redirect (not popup) to Didit's hosted UI.

The `kyc_sessions` table already exists with all required columns including `customer_id`, `flow_type`, `user_type`, `status`, `verification_result`, `risk_score`, `extracted_data`, `completed_at`.

**Constraints:**
- Reuse existing `lib/integrations/didit/client.ts` (axios-based, `x-api-key` auth, v2 API)
- Reuse existing `kyc_sessions` database table — no migration needed
- Must not break existing B2B KYC flows (separate `flow_type` and `quote_id` logic)
- Must use `useCustomerAuth()` for consumer session management
- Must use `createClientWithSession()` in API routes that call `supabase.auth.getUser()`
- Layout must match `/dashboard/billing` exactly: full-width, ModernStatCard grid, Tabs with orange active state

## Goals / Non-Goals

**Goals:**
- Replace manual document upload with Didit redirect flow (OCR + Passive Liveness + Face Match + IP Analysis)
- Match billing page layout: `text-2xl font-semibold` header, 4-col ModernStatCard grid, 3 Tabs
- Create consumer-specific session creation API (`POST /api/dashboard/kyc/create-session`)
- Create status polling API (`GET /api/dashboard/kyc/status`)
- Extend webhook handler to process consumer sessions

**Non-Goals:**
- Changing the B2B KYC flow or `createKYCSessionForQuote()`
- Adding AML screening (no free tier, not required for consumer ISP onboarding)
- Creating a Didit account or workflow programmatically (user handles this manually)
- Database migration (table already exists)
- NFC or Active 3D Liveness (require native app)

## Decisions

### 1. Redirect flow, not popup or iframe

**Rationale:** The existing B2B `LightKYCSession.tsx` uses a popup (`window.open()`) and listens for `postMessage`. Popups are blocked by many browsers and require polling. Redirect is simpler: backend creates session → `window.location.href = verificationUrl` → Didit redirects back to `/dashboard/kyc?status=completed` → page polls status API.

**Alternative considered:** Reuse `LightKYCSession.tsx` popup approach — rejected because consumer users on mobile browsers frequently have popups blocked, and the redirect flow is the Didit-recommended pattern for web.

### 2. Separate consumer session creation function rather than modifying `createKYCSessionForQuote()`

**Rationale:** The B2B function takes a `quoteId`, determines flow type by quote amount, and stores the session linked to the quote. The consumer function takes a `customerId`, always uses `consumer_light_kyc`, and has no quote relationship. The two flows share the underlying `createSession()` client call but have different business logic. Separate functions keep both flows maintainable.

**Alternative considered:** Generic `createKYCSession({ type, entityId })` — rejected because the business logic around flow type selection, database storage, and deduplication differs enough that a shared function would be a leaky abstraction.

### 3. Use `customer_id` (Supabase auth user ID) as `vendor_data` in Didit sessions

**Rationale:** Didit's `vendor_data` field links sessions to internal entities. For B2B, this is the `quote_id`. For consumer, the natural key is the Supabase auth user ID from `useCustomerAuth()`. This allows the webhook handler to find the consumer by ID when processing results.

### 4. Deduplicate sessions — return existing active session instead of creating a new one

**Rationale:** If a consumer clicks "Start Verification" twice, we should return the existing `not_started` or `in_progress` session rather than creating a duplicate. The session creation function checks for active sessions first.

### 5. Consumer page uses polling (fetch on mount + return URL) rather than WebSocket

**Rationale:** The billing page uses the same pattern — fetch on mount, no real-time updates. The KYC page adds one extra trigger: when the user returns from Didit via the callback URL with `?status=completed`, it re-fetches status. This is sufficient because verification results arrive via webhook (server-side), and the page can re-fetch to see the updated status.

## Data Flow

```
Consumer Dashboard                CircleTel Backend              Didit API
─────────────────                 ──────────────────              ─────────
1. Click "Start Verification"
   POST /api/dashboard/kyc/       
   create-session ───────────────►
                                  2. createKYCSessionForConsumer()
                                     Check for existing session
                                     POST /v2/sessions ─────────► 3. Create session
                                     ◄──────────────────────────── Return session_id + URL
                                     Store in kyc_sessions
   ◄──────────────────────────────── Return verificationUrl

4. window.location.href = url ──────────────────────────────────► 5. Hosted verification UI
                                                                     OCR → Liveness → Face Match
                                                                  6. Redirect to callback URL
◄────────────────────────────────────────────────────────────────── /dashboard/kyc?status=completed

7. Fetch status                                                   8. Webhook POST
   GET /api/dashboard/kyc/status                                     /api/compliance/webhook/didit
                                  9. Process consumer webhook
                                     Update kyc_sessions
   ◄──────────────────────────────── Return updated status
```

## Component Structure

```
app/dashboard/kyc/page.tsx
├── useCustomerAuth() — session management
├── fetchKYCStatus() — GET /api/dashboard/kyc/status
├── startVerification() — POST /api/dashboard/kyc/create-session → redirect
├── ModernStatCard × 4 (Verification Status, Documents, Identity Check, Risk Score)
└── Tabs
    ├── Verification — CTA states (not_started, in_progress, approved, declined, pending_review)
    ├── Documents — verified document list (populated after approval)
    └── Timeline — chronological verification events
```

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/integrations/didit/types.ts` | Modify | Add `ConsumerKYCSession`, `ConsumerKYCDisplayStatus` |
| `lib/integrations/didit/session-manager.ts` | Modify | Add `createKYCSessionForConsumer()`, `getConsumerKYCSession()` |
| `app/api/dashboard/kyc/create-session/route.ts` | Create | Consumer session creation API |
| `app/api/dashboard/kyc/status/route.ts` | Create | Consumer session status API |
| `lib/integrations/didit/webhook-handler.ts` | Modify | Add consumer session processing branch |
| `app/dashboard/kyc/page.tsx` | Rewrite | Full redesign matching billing layout |
| `.env.example` | Modify | Document Didit env vars |
