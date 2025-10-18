Awesome—Zoho One is a great fit for what you want. Below is a ready-to-ship plan to wire **Zoho CRM CPQ** + **Zoho Billing (Subscriptions)** into your Next.js 15 stack, so the journey from coverage check → package → quote → checkout → provisioning is fully automated.

I’ve split this into: (1) target flow, (2) data model + mapping, (3) integration steps (with concrete tasks), (4) webhooks & automation, and (5) sample endpoint patterns. I’ve cited the exact Zoho docs where it matters.

---

# 1) Target end-to-end flow (consumer + business)

**Front end (Next.js)**

1. User selects a package after coverage check.
2. Click **Continue** → call your API (`/api/cpq/quote`) with `{customer, package, addons, term}`.
3. API creates/updates CRM records (Lead/Contact/Account, Deal), then creates a **Quote**. CPQ rules in Zoho auto-add dependent items, validate bundles, and price correctly. ([Zoho Corporation][1])
4. For “Order now” journeys, API requests a **Zoho Billing Hosted Page** (PCI-compliant checkout). Redirect user to hosted checkout. ([Zoho][2])

**Zoho side**
5) Customer pays; Zoho Billing creates the **Subscription**. ([Zoho][3])
6) Billing webhook → your Next.js webhook endpoint: mark order “Paid”, provision in Supabase, update the CRM Deal/Quote stage.
7) For business quotes (“Request Quote”), skip payment step; send PDF quote from CRM and let CPQ config drive approvals.

**Why this split works**

* **CPQ logic stays in Zoho CRM** (product rules, mandatory add-ons, discounts, price books). ([Zoho Corporation][1])
* **Payments + subscriptions** handled by Zoho Billing Hosted Pages (no card handling in your app). ([Zoho][2])

---

# 2) Data model & mapping

| Your layer                | Zoho module                                          | Notes                                                                    |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Supabase `coverage_leads` | CRM **Leads**                                        | Keep lead enrichment but push to CRM immediately.                        |
| Customer (consumer)       | CRM **Contacts** (+ **Accounts** optional)           | For B2B always create **Accounts** + **Contacts**.                       |
| Selected package          | CRM **Products / Price Books**                       | Manage list pricing & tiers here for CPQ. ([Zoho][4])                    |
| Bundle/kit                | **Zoho Inventory Composite Items / Kits** (optional) | If you want BOM-style bundles that sync to CRM items. ([Zoho][5])        |
| Quote                     | CRM **Quotes** with **Quoted Line Items**            | CPQ auto-adds mandatory items and pricing rules. ([Zoho Corporation][1]) |
| Subscription              | **Zoho Billing** Subscription                        | Created via API/Hosted Page; ties back to customer. ([Zoho][3])          |

---

# 3) Integration steps (actionable tasks)

## A. Platform & security

* [ ] **Register OAuth client(s)** in Zoho (Server-based “Self Client” for backend). Store refresh token securely (Supabase secrets or KMS). ([Zoho][6])
* [ ] Implement **OAuth 2.0 token service** in `/lib/zoho/auth.ts` (refresh flow + token cache). Use Zoho CRM **V8** OAuth docs as reference. ([Zoho][7])

## B. CRM CPQ setup

* [ ] Define **Products**, **Price Books**, taxes/discount rules in CRM. ([Zoho][4])
* [ ] Configure **CPQ rules**: mandatory add-ons, compatibility, auto-bundling (e.g., router + install when 100 Mbps selected). Test that saving a Quote auto-adds required line items. ([Zoho Corporation][1])
* [ ] Create **Quote templates** (consumer vs business) in CRM.

## C. Next.js API endpoints (server actions or route handlers)

* [ ] `POST /api/crm/upsert-customer` → create/update **Lead/Account/Contact**.
* [ ] `POST /api/cpq/quote` → create CRM **Deal** (optional), then **Quote** and **Quoted Line Items**; return Quote ID & URL. (Prefill from Deal products if you use that pattern.) ([Zoho][8])
* [ ] `POST /api/billing/hosted-page` → request Zoho Billing **Hosted Page** for checkout; respond with redirect URL. ([Zoho][2])
* [ ] `POST /api/billing/webhook` → receive subscription/payment events; verify signature; update Supabase order + CRM Deal/Quote stage; trigger provisioning. (Zoho Billing supports full subscription lifecycle via API.) ([Zoho][3])

## D. Front-end wiring (App Router)

* [ ] On package selection, call `/api/cpq/quote`; then if **consumer** → immediately call `/api/billing/hosted-page` and `router.push(hostedUrl)`.
* [ ] For **business journey**, show **Request Quote**; send Resend email with CRM Quote PDF link once created.

## E. Optional inventory/kit logic

* [ ] If you need real kits/BOM, manage them in **Zoho Inventory** as **Composite Items/Kits**; sync to CRM products used in CPQ. ([Zoho][5])

## F. Testing & analytics

* [ ] Playwright E2E: mock Zoho responses; run flows for consumer/biz.
* [ ] Track funnel events (Vercel Analytics) around: Quote created, Hosted page opened, Payment success, Subscription active.

---

# 4) Webhooks, automation & routing

**Zoho Billing → your app (webhook events):**

* `subscription_created`, `payment_success`, `payment_failed`, `subscription_activated/canceled`. Use these to:

  * Mark order **Paid** in Supabase.
  * Update CRM **Deal** to “Closed Won” and **Quote** to “Accepted/Converted”.
  * Kick off provisioning (e.g., create service record, send welcome email via Resend).

**Lead routing:**

* Consumer: auto-provision on payment success.
* Business: on Quote acceptance, route to Sales/Provisioning; use CRM assignment rules.

**Abandoned checkout:**

* Zoho Billing Hosted Pages support **abandoned cart** features you can leverage for recovery sequences. ([Zoho][9])

---

# 5) Endpoint patterns (concise)

> Auth utility (refresh-token flow) follows Zoho’s OAuth 2.0. Store `ZOHO_REFRESH_TOKEN`, `ZOHO_CLIENT_ID/SECRET`, and DC base URL (`https://www.zohoapis.com` or your region). ([Zoho][7])

**Create Quote (CPQ applies rules on save):**

* `POST https://www.zohoapis.com/crm/v8/Quotes` with body including `Account/Contact`, `DealId` (optional), and **line_items** (your base package). CPQ will add mandatory products/adjust pricing per rules. ([Zoho Corporation][1])

**Hosted Checkout (Zoho Billing):**

* `POST https://www.zohoapis.com/billing/v1/hostedpages/newsubscription` with `customer` (+ plan/addons). Response → `hostedpage.url` to redirect. ([Zoho][2])

**Direct Subscription (server-side) (optional):**

* `POST /billing/v1/subscriptions` if you ever create subscriptions without hosted UI. ([Zoho][3])

---

## Concrete to-do list (engineering)

**Backend**

* [ ] Implement `/lib/zoho/auth.ts` (refresh token, cache). ([Zoho][7])
* [ ] Build `/app/api/crm/upsert-customer/route.ts` (Lead→Account/Contact).
* [ ] Build `/app/api/cpq/quote/route.ts` (Deal + Quote + line items). CPQ handles add-ons. ([Zoho Corporation][1])
* [ ] Build `/app/api/billing/hosted-page/route.ts` (Hosted Page create + return URL). ([Zoho][2])
* [ ] Build `/app/api/billing/webhook/route.ts` (verify; update Supabase + CRM). ([Zoho][3])

**CRM configuration**

* [ ] Products, Price Books, taxes, discount tiers. ([Zoho][4])
* [ ] CPQ rules: required accessories, speed→router mapping, install fees, term-based discounts. ([Zoho Corporation][1])
* [ ] Quote templates (consumer, business).

**Front-end**

* [ ] In `CoverageChecker`/packages page: after package select → call CPQ endpoint → on success, call hosted page endpoint and `router.push()`.
* [ ] Business page `/business`: “Request Quote” flow (no payment redirect).

**Data & inventory (optional)**

* [ ] If needed, manage kits in Zoho Inventory (Composite Items) and sync. ([Zoho][5])

---

## Notes for your stack

* **Next.js 15 (App Router)**: keep Zoho calls in **Route Handlers** under `/app/api/*` to protect secrets; React Query handles client → server mutation.
* **Supabase**: store our internal order/provisioning state; also store Zoho IDs (Contact/Account/Deal/Quote/Subscription) for joins.
* **Strapi**: continue to power marketing content; product/pricing for CPQ must live in CRM/Billing to keep a single source of truth.
* **RBAC**: guard admin routes that can trigger CRM/Billing changes.
* **Testing**: Playwright E2E: mock Zoho with MSW during CI; add a staging Zoho org for live smoke tests.

---

If you want, I can draft the actual **TypeScript route handlers** for:

* `POST /api/cpq/quote` (creates CRM Quote and returns Quote + hosted checkout link), and
* `POST /api/billing/webhook` (validates event and updates Supabase + CRM).

Prefer consumer, business, or both first?

[1]: https://help.zoho.com/portal/en/kb/crm/cpq/articles/how-it-works?utm_source=chatgpt.com "CPQ for Zoho CRM — How it works"
[2]: https://www.zoho.com/billing/api/v1/hosted-pages/?utm_source=chatgpt.com "Hosted-Pages | Zoho Billing | API Documentation"
[3]: https://www.zoho.com/billing/api/v1/subscription/?utm_source=chatgpt.com "Subscriptions | Zoho Billing | API Documentation"
[4]: https://www.zoho.com/crm/sales-force-automation/cpq.html?utm_source=chatgpt.com "Custom quoting simplified | CPQ"
[5]: https://www.zoho.com/inventory/api/v1/compositeitems/?utm_source=chatgpt.com "Composite Items | Zoho Inventory | API Documentation"
[6]: https://www.zoho.com/accounts/protocol/oauth-setup.html?utm_source=chatgpt.com "Register Your App | OAuth 2.0"
[7]: https://www.zoho.com/crm/developer/docs/api/v8/oauth-overview.html?utm_source=chatgpt.com "OAuth 2.0 Authentication | Zoho CRM API | V8"
[8]: https://www.zoho.com/crm/resources/solutions/create-quotes-with-products-prefilled-from-their-deal.html?utm_source=chatgpt.com "Create quotes with products pre-filled from their deal"
[9]: https://www.zoho.com/us/billing/features/payment-pages/?utm_source=chatgpt.com "Secure, easy checkouts: Hosted payment pages"
