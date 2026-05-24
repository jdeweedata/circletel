# consumer-kyc-verification

Didit-powered identity verification flow for consumer dashboard users.

## Requirements

1. Consumer can start KYC verification from `/dashboard/kyc` with a single button click
2. Backend creates a Didit session using the consumer's Supabase auth user ID as `vendor_data`
3. Consumer is redirected to Didit's hosted verification UI (not popup, not iframe)
4. Didit workflow includes: OCR, Passive Liveness, Face Match, IP Analysis
5. After completing verification, Didit redirects consumer back to `/dashboard/kyc?status=completed`
6. Didit sends webhook to `/api/compliance/webhook/didit` with verification result
7. Webhook handler updates `kyc_sessions` table for consumer sessions (`user_type = 'consumer'`)
8. Page displays status: not_started, in_progress, approved, declined, pending_review
9. If a consumer already has an active session (`not_started` or `in_progress`), return that session instead of creating a new one
10. Declined consumers can retry verification (creates a new session)

## API Contracts

### POST /api/dashboard/kyc/create-session

**Auth:** Bearer token via `useCustomerAuth()` session
**Request:** No body required
**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "verificationUrl": "https://verify.didit.me/session/...",
    "message": "Consumer KYC session created"
  }
}
```

### GET /api/dashboard/kyc/status

**Auth:** Bearer token via `useCustomerAuth()` session
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "not_started | in_progress | approved | declined | pending_review",
    "session": {
      "id": "uuid",
      "didit_session_id": "uuid",
      "verification_url": "https://...",
      "status": "not_started | in_progress | completed | abandoned",
      "verification_result": "approved | declined | pending_review | null",
      "risk_score": 25,
      "created_at": "2026-05-18T...",
      "completed_at": "2026-05-18T... | null"
    }
  }
}
```

## Page Layout

Must match `/dashboard/billing` exactly:
- Wrapper: `<div className="space-y-8">`
- Header: `<h1 className="text-2xl font-semibold text-gray-900">`
- Stat cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` using `ModernStatCard`
- Tabs: `TabsList` with `bg-gray-100 border border-gray-200 rounded-xl`, active state `bg-white text-circleTel-orange shadow-md`
- Content cards: `border border-gray-200 bg-white shadow-sm rounded-lg`
- List items: `p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all`
- CTA buttons: `bg-circleTel-orange hover:bg-circleTel-orange-dark text-white`

## Environment Variables

| Variable | Required | Source |
|----------|----------|--------|
| `DIDIT_API_KEY` | Yes | Didit console or programmatic register |
| `DIDIT_WEBHOOK_SECRET` | Yes | POST /v3/webhook/destinations/ response |
| `DIDIT_WORKFLOW_CONSUMER_LIGHT_KYC` | Yes | POST /v3/workflows/ with OCR+LIVENESS+FACE_MATCH+IP_ANALYSIS |
| `DIDIT_API_URL` | No | Default: `https://verification.didit.me/v2` |

## Didit Features (Free Tier: 500/month each)

| Feature | Post-free cost | Purpose |
|---------|---------------|---------|
| OCR | $0.15 | Extract data from SA ID/passport |
| Passive Liveness | $0.10 | Confirm real person, not photo |
| Face Match | $0.05 | Match selfie to ID photo |
| IP Analysis | $0.03 | Check VPN/proxy/risk signals |
| **Total** | **$0.33/verification** | After free tier |
