# Spec: Credit vetting on consumer and business journeys

**Date:** 2026-08-27  
**Status:** Agreed (grilling complete)  
**Glossary:** [CONTEXT.md](../../../CONTEXT.md)  
**Netcash API:** [docs/integrations/NETCASH_RISK_REPORTS_API.md](../../integrations/NETCASH_RISK_REPORTS_API.md)  
**Sales SOP:** [docs/guides/CREDIT_RISK_SALES_SOP.md](../../guides/CREDIT_RISK_SALES_SOP.md)

---

## Problem Statement

CircleTel offered Ishmael (ORD-20260821-9026) a Contract Router Deal before anyone pulled credit. He paid R149. TransUnion then showed live **debt review**. Netcash printed Clear. NCA s88 forbids a further credit agreement until a clearance certificate (or court exit). Sales had already welcomed him onto 24-month + router.

Compliance is a person remembering (join J5). Checkout still shows 24-month and subsidised router. The admin Credit risk tab and activate/kit block (PR #794) exist, but the Netcash client does not match the public API (it posts ID/name into `RequestCreditDataReport`; the documented method takes a **FileToken** after `BatchFileUpload`). Risk Reports is now **service active** on Circle Tel SA `52552945156` (test mode off). Bureau PDFs are async. AVS can be real-time.

KYC documents prove identity and consent. They do not replace the bureau.

## Solution

Vet **after** account + KYC (consumer) or **signed quote + T&Cs** (business), **before** we process a credit Deal or a formal contract. Spend bureau money only when we are about to take credit risk. Tell the customer an outcome and a plain reason. Keep flags on admin. Activate and kit still re-check. HARD_FAIL does not become PASS unless **MD and CFO** both sign the override.

Ship order: shared Netcash client → consumer gate → business signed-quote pull.

## User Stories

1. As a consumer who uploaded ID + proof of address, I want a clear pass / SIM-only-or-cash / cannot-take-credit result, so I know what I can buy.
2. As a consumer on prepaid SIM-only or Cash CPE, I do not want a R46.20 bureau pull, so we do not spend on no-credit Deals.
3. As a consumer who wants a Contract Router Deal or 24-month, I want that Deal held until CD11 returns, so I am never welcomed onto financed kit first.
4. As ops, I want activate and financed kit blocked on HARD_FAIL/FAIL unless hardware is prepaid, so Ishmael cannot be provisioned on CON-060.
5. As a business contact, I want no CIPC pull until I have signed the quote and accepted T&Cs, so we do not spend R48.30 on every sent quote.
6. As finance, I want a formal contract blocked until the company result is on the quote, so we do not enter an agreement under s88-equivalent credit risk.
7. As sales, I want the customer-facing copy to stay free of bureau words and dates, so we do not issue an informal NCA letter.
8. As MD/CFO, I want a Dual Control Override (both must sign) if we ever process past HARD_FAIL, so one person cannot waive NCA risk.
9. As engineering, I want the NIWS client to upload a NIF, poll FileToken, and store the PDF, so pulls match Netcash’s spec.
10. As finance, I want one bureau per person/company (never TransUnion + Experian), so we do not double-pay.

## Implementation Decisions

### Triggers and spend (Netcash fees 2026-08-27, live account)

| Who | When we pull | Instruction | Fee | Skip |
|---|---|---|---|---|
| Consumer | Account exists, KYC (ID + POR) uploaded, consent ticked, **and** Deal is credit (24-month, Contract Router Deal, on-account) | CD11 TransUnion | R46.20 | Prepaid / SIM-only / Cash CPE / BYO |
| Consumer | Before first debit | AVSRealtimeQuery | R5.20 | Cash-only, no debit |
| Business | `business_quote_signatures.signed_at` set **and** `terms_accepted` | CD32 CIPC | R48.30 | Draft or sent unsigned quote |
| Business | Quote is on-account or includes CPE, after director/FICA docs | CD31 (+ CD23 if director is payer) | R58.00 / R48.30 | SIM-only prepaid company |
| Either | High exposure SMB / large CPE only | Mini company | R205.00 | Default — never |
| Either | Uploaded ID already checked | ID verification | R18.00 | Default — skip |

Never run two consumer bureaus on the same ID. Reason code **450** is numeric (credit application **32**), not free text.

### Bind (policy C, KYC-first)

- Browse and draft orders are allowed.
- **Process** means: Helios indent, activate, kit release, Contract Router Deal confirmation, formal business contract.
- Process is blocked until a credit review exists when the Deal/quote is a credit path.
- Do not hang Pay Now on CD11. Fire the pull in the background after consent. Timeout ~3 minutes → leave them on SIM-only / Cash CPE; SMS when ready. Never unlock term on timeout.
- Activate and device assign still call the existing `canReleaseFinancedHardware` / 422 rules.

### Customer feedback (B)

Customer and quote portal see only:

- Approved for this Deal
- We can do month-to-month or you buy the router
- We cannot take this on credit

No score, no “debt review”, no bureau dates. Admin Credit risk tab keeps full flags. NCA adverse letter is MD-only.

### Dual Control Override

Default: HARD_FAIL stays HARD_FAIL until a clearance certificate, or the customer switches to prepaid / cash / BYO.

Exception: **MD and CFO** both record sign-off on the review (`override_by` must be two distinct admin users, roles MD + CFO). Even then, financed router stays blocked unless `hardware_prepaid`. Sales cannot mark PASS. Existing rule remains: cannot PASS while `debt_review` unless hardware prepaid.

### Netcash client

Replace the undocumented `RequestCreditDataReport(IdNumber, FirstName, LastName)` call with:

1. `BatchFileUpload` NIF (H/K/T/F), instruction CD11/CD32/CD31/CD23/CD35
2. Poll `RequestFileUploadReport` until ready (`FILE NOT READY` is not failure)
3. `RequestCreditDataReport` / `RequestAVSReport` with FileToken
4. Store base64 PDF under `.private` / private storage (not git)
5. Parse flags from load report / PDF text; do not treat Netcash **Clear** as PASS

AVSRealtimeQuery stays sync for debit checks. `NETCASH_RISK_SERVICE_KEY` required. Service is active; test mode is off — use a test ID in staging only.

### Reuse

- `lib/credit-risk/*` decision, flags, `order_credit_reviews`
- Admin Credit risk tab
- `business_quote_signatures` (`signed_at`, `terms_accepted`, `signer_id_number`, `cipc_documents_confirmed`)
- `/admin/b2b/vetting` queue

Add a quote-level credit review (same decision enum) keyed by `business_quotes.id`. Do not invent a second score language.

## Testing Decisions

- NIF builder + FileToken poll: fixtures only, no live Netcash in CI
- CD11 not requested for SIM-only / Cash CPE / BYO
- CD32 not requested until signature + T&Cs
- Customer JSON/UI never contains `debt_review`, score, or report dates
- Process/activate/kit 422 on HARD_FAIL without Dual Control Override + hardware_prepaid where required
- Dual Control Override rejected if only one of MD/CFO signed
- `Clear` in PDF comments + debt review text → HARD_FAIL
- AVS Acc Exists / Id Match = No → HARD_FAIL

## Out of Scope (this slice)

- Affordability (NCA s79 income pack)
- Didit KYC (can attach later; docs upload is enough to start)
- Experian/XDS as default bureau
- Mini company R205 as default
- Checkout toast redesign beyond hold + outcome message
- Full journey analytics platform (emit events on review create/update only)

## Later (agreed, not first tickets)

- Business portal “quote signed → waiting for company check → contract”
- SMS when a timed-out CD11 lands
- Risk Tier → Subsidised Price / Clawback on storefront (see Esquire later slice)

## Further Notes

- Ishmael: do not merge with Kassim. Do not quote 2017-12-19 to the customer.
- Cash H155 from SkyTel is `202606EOP0110`, not a plan. Bundled-router plans are `202604EBU0000`–`0005` / `202606EBU2502`.
