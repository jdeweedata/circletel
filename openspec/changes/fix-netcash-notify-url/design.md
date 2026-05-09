## Context

NetCash Pay Now payments are stuck in "Created" status because the server-to-server notification URL (`m5` parameter) is never included in the form data sent to the gateway. The `notifyUrl` is loaded from environment variables in `NetCashProvider` (line 120) and passed from the initiate route (line 96), but the `initiate()` method on lines 172-184 omits it from the `NetCashFormData` object.

Additionally, the initiate route (lines 116-119) constructs a GET URL with query parameters instead of returning form data for a POST submission. NetCash Pay Now recommends POST for reliability and to avoid URL length limits.

**Files involved:**
- `lib/payments/providers/netcash/netcash-provider.ts` — Provider that builds form data
- `app/api/payment/netcash/initiate/route.ts` — API route that calls the provider and returns payment URL
- `app/order/checkout/page.tsx` — Checkout page that redirects to NetCash

**Constraints:**
- NetCash expects `m5` as a publicly reachable URL for POST callbacks
- The webhook handler at `/api/payment/netcash/webhook` already exists and processes callbacks correctly
- The `notifyUrl` from the initiate route (`${baseUrl}/api/payment/netcash/webhook`) should take precedence over the provider's default (`/api/payments/webhook` — note the different path)

## Goals / Non-Goals

**Goals:**
- Include `m5` (notify URL) in NetCash form data so payment confirmations flow back to CircleTel
- Switch from GET redirect to POST form submission for reliability
- Return structured `{ formData, paymentUrl }` from the initiate API so the client can build a POST form

**Non-Goals:**
- Changing the webhook handler logic (it already works correctly)
- Adding new payment methods or modifying the provider abstraction
- Changing the R1.00 validation charge amount or order creation flow
- Addressing the webhook handler's `Amount / 100` conversion (separate investigation)

## Decisions

### Decision 1: Add `m5` to `NetCashFormData` interface and `initiate()` method

Add `m5?: string` to the `NetCashFormData` interface (line 45) and set `m5: params.notifyUrl || this.notifyUrl` in the form data object (after line 183).

**Why**: This is the minimal fix — one field addition. The `notifyUrl` is already passed through the provider abstraction via `PaymentInitiationParams`; it just needs to be included in the output.

**Alternative considered**: Hardcoding the webhook URL directly. Rejected because the provider already receives `notifyUrl` as a parameter, and the initiate route already constructs it correctly from `NEXT_PUBLIC_BASE_URL`.

### Decision 2: Switch initiate route from GET URL to POST form data response

Change the API response from `{ paymentUrl: "https://paynow...?m1=...&m2=..." }` to `{ paymentUrl: "https://paynow.netcash.co.za/site/paynow.aspx", formData: { m1: "...", m2: "...", ... } }`.

**Why**: NetCash recommends POST submission. GET puts credentials (service key, PCI vault key) in the URL which may be logged by proxies, browser history, and analytics. POST keeps them in the request body.

**Alternative considered**: Keep GET but just add `m5`. This would work functionally but leaves credentials exposed in URLs and risks hitting URL length limits.

### Decision 3: Client-side hidden form POST instead of `window.location.href`

Replace `window.location.href = paymentUrl` in checkout with a dynamically created hidden form that POSTs to `paymentUrl` with the form data fields.

**Why**: The browser natively handles POST redirects via form submission. No additional dependencies needed. This is the standard pattern for payment gateway integrations.

### Decision 4: Fix the provider's default `notifyUrl` path

The provider constructor sets `notifyUrl` to `/api/payments/webhook` (line 121) but the actual webhook handler is at `/api/payment/netcash/webhook`. The initiate route overrides this correctly (line 96), but the default should also be correct as a safety net.

**Why**: If any future code path calls `provider.initiate()` without explicitly passing `notifyUrl`, it would point to the wrong endpoint.

## Risks / Trade-offs

**[Risk] POST form creates a visible flash before redirect** → Acceptable UX trade-off; the form submits immediately. Can add a loading overlay if needed post-launch.

**[Risk] Existing unprocessed transactions won't retroactively complete** → These R1.00 validation charges in "Created" status must be manually reconciled or voided in NetCash. Only new transactions will include `m5`.

**[Risk] `NEXT_PUBLIC_BASE_URL` must be set correctly in production** → Already verified: `.env.production.local` has `NEXT_PUBLIC_BASE_URL="https://www.circletel.co.za"`. The webhook endpoint must be publicly reachable.

**[Risk] API response shape change breaks any other callers** → Grep for `/api/payment/netcash/initiate` to verify only the checkout page calls this endpoint. If other callers exist, they need updating too.
