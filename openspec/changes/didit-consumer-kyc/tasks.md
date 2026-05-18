## 1. Add consumer KYC types

- [x] 1.1 Add `ConsumerKYCSession` interface and `ConsumerKYCDisplayStatus` type to `lib/integrations/didit/types.ts` — `ConsumerKYCSession` has `id`, `customer_id`, `didit_session_id`, `verification_url`, `flow_type: 'consumer_light_kyc'`, `status: DiditSessionStatus`, `verification_result: DiditVerificationResult | null`, `risk_score: number | null`, `extracted_data: ExtractedKYCData | null`, `created_at`, `completed_at`
- [x] 1.2 Run `npm run type-check:memory` — zero new errors
- [x] 1.3 Commit: `feat(kyc): add consumer KYC session types`

## 2. Add consumer session creation to session manager

- [x] 2.1 Add `createKYCSessionForConsumer(customerId, callbackUrl)` to `lib/integrations/didit/session-manager.ts` — checks for existing active session (`not_started` or `in_progress`) before creating new one, uses `consumer_light_kyc` flow, stores `customer_id` as `vendor_data`, inserts into `kyc_sessions` with `user_type: 'consumer'`
- [x] 2.2 Add `getConsumerKYCSession(customerId)` to same file — fetches latest consumer KYC session ordered by `created_at` desc, handles `PGRST116` (no rows) gracefully
- [x] 2.3 Verify imports: `DiditFlowType`, `DiditSessionRequest`, `KYCSessionCreationResult` from `./types`
- [x] 2.4 Run `npm run type-check:memory` — zero new errors
- [x] 2.5 Commit: `feat(kyc): add consumer session creation and retrieval`

## 3. Create consumer KYC session API endpoint

- [x] 3.1 Create `app/api/dashboard/kyc/create-session/route.ts` — `POST` handler using `createClientWithSession()`, calls `supabase.auth.getUser()` for auth, derives `callbackUrl` from request origin + `/dashboard/kyc?status=completed`, calls `createKYCSessionForConsumer(user.id, callbackUrl)`, returns `{ success, data: { sessionId, verificationUrl, message } }`
- [x] 3.2 Run `npm run type-check:memory` — zero new errors
- [x] 3.3 Commit: `feat(kyc): add consumer KYC session creation API endpoint`

## 4. Create consumer KYC status API endpoint

- [x] 4.1 Create `app/api/dashboard/kyc/status/route.ts` — `GET` handler using `createClientWithSession()`, calls `getConsumerKYCSession(user.id)`, returns `{ success, data: { status, session } }` where `status` is `verification_result || session.status || 'not_started'`
- [x] 4.2 Run `npm run type-check:memory` — zero new errors
- [x] 4.3 Commit: `feat(kyc): add consumer KYC status API endpoint`

## 5. Update webhook handler for consumer sessions

- [x] 5.1 Read `lib/integrations/didit/webhook-handler.ts` to understand current `processDiditWebhook()` structure
- [x] 5.2 Add consumer session branch in `processDiditWebhook()` in `lib/integrations/didit/webhook-handler.ts` — after finding session by `didit_session_id`, check `session.user_type === 'consumer'`, update `status`, `verification_result`, `risk_score`, `extracted_data`, `completed_at` fields. No changes needed to `app/api/compliance/webhook/didit/route.ts` — it already delegates all processing to `processDiditWebhook()`
- [x] 5.3 Run `npm run type-check:memory` — zero new errors
- [x] 5.4 Commit: `feat(kyc): handle consumer KYC sessions in Didit webhook`

## 6. Redesign `/dashboard/kyc` page

- [x] 6.1 Rewrite `app/dashboard/kyc/page.tsx` — full redesign matching `/dashboard/billing` layout: `useCustomerAuth()` for auth, `text-2xl font-semibold` header, 4 `ModernStatCard`s in `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` (Verification Status, Documents Verified, Identity Check, Risk Score), 3 Tabs (Verification, Documents, Timeline) with orange active state styling identical to billing page
- [x] 6.2 Implement Verification tab states: `not_started` (CTA + feature badges + "Start Verification" button), `in_progress` (processing message + "Check Status"), `pending` (continue link to `verification_url`), `approved` (green success + completion date), `declined` (red + "Try Again" button), `pending_review` (yellow + manual review message)
- [x] 6.3 Implement Documents tab: verified state shows ID Document + Biometric Verification items with `p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all`; empty state shows prompt to complete verification
- [x] 6.4 Implement Timeline tab: chronological events (Session Created, Verification Started, Result) with colored circle indicators
- [x] 6.5 Wire `fetchKYCStatus()` on mount + on return from Didit (`?status=completed` query param triggers re-fetch and `window.history.replaceState`)
- [x] 6.6 Wire `startVerification()` — `POST /api/dashboard/kyc/create-session` then `window.location.href = verificationUrl`
- [x] 6.7 Run `npm run type-check:memory` — zero new errors
- [x] 6.8 Start dev server, load `/dashboard/kyc`, verify: header matches billing, 4 stat cards visible, 3 tabs with orange active state, "Start Verification" button renders, no console errors
- [x] 6.9 Commit: `feat(kyc): redesign KYC page with ModernStatCard grid and Tabs matching billing layout`

## 7. Environment variables documentation

- [x] 7.1 Add `DIDIT_API_KEY`, `DIDIT_API_URL`, `DIDIT_WEBHOOK_SECRET`, `DIDIT_WORKFLOW_CONSUMER_LIGHT_KYC` to `.env.example` with comments explaining how to obtain each
- [x] 7.2 Commit: `docs: add Didit consumer KYC env vars to .env.example`

## 8. Full integration verification

- [x] 8.1 Run `npm run type-check:memory` — zero new errors across all modified files
- [x] 8.2 Compare `/dashboard/kyc` and `/dashboard/billing` side by side: same header size, same stat card grid, same tab styling, same content card styling, full width, uses `useCustomerAuth()`
- [x] 8.3 Test without Didit credentials: page loads with "Not Started" status, "Start Verification" shows error toast (expected), no console crashes
- [x] 8.4 Final commit: `feat(kyc): complete Didit consumer KYC integration with billing-style layout`
