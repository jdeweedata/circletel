# W0 — NetCash Debit-Order Verification Request

**Purpose:** External blocker for the debit-order pipeline (gates go-live, W5). Owner: Jeffrey (account holder).
**How to use:** Send §A to NetCash support; complete §B (internal Coolify check); record answers in §C and paste back into `docs/plans/2026-06-03-debit-order-pipeline-fix.md` as "W0 Verified".

---

## A. Email to NetCash Support

> **To:** support@netcash.co.za
> **Subject:** Debit Order / DebiCheck eMandate configuration verification — CircleTel (account/merchant ref: __________)
>
> Hi NetCash team,
>
> We are activating recurring debit-order collections via your eMandate (BatchFileUpload, Instruction = "Mandates") and NIWS web service, and want to confirm our account is correctly configured before we go live. Please confirm the following for our account:
>
> 1. **Debit Order service** — Is our **Debit Order service key** active and contracted for collections? We have a dedicated service key separate from our Pay Now key; please confirm the Debit Order service is enabled (not just Pay Now).
> 2. **DebiCheck** — Is **DebiCheck (authenticated mandates)** enabled on our account, or are mandates issued as **Registered Mandates (RM)** only? We want DebiCheck so collections within the agreed amount/date/frequency are non-disputable. If RM-only, what is required to enable DebiCheck?
> 3. **Mandate postback URL** — Please confirm (or set) our **eMandate result postback/notification URL** to:
>    `https://www.circletel.co.za/api/webhooks/netcash/emandate`
>    This is where we receive the signed/declined mandate result.
> 4. **Mandate signing delivery** — Confirm mandates submitted with auto-send (field 540) are sent to the customer for signing via SMS/email, and the customer authenticates via their bank (DebiCheck).
> 5. **Test environment** — Please confirm we can run **BatchFileUpload + RequestFileUploadReport** in test mode against the Debit Order service key, and provide any test-mode credentials/sandbox notes.
> 6. **Mandate retention** — Confirm where the **signed mandate PDF** is available for download (we retain our own copy for 5 years per PASA) and how long your hosted link remains valid.
>
> Our integration uses NIWS endpoint `https://ws.netcash.co.za/NIWS/niws_nif.svc`. Thank you.

---

## B. Internal check (Coolify / prod env) — no NetCash needed

Confirm in the production environment (Coolify → CircleTel app → Environment):
- [ ] `NETCASH_DEBIT_ORDER_SERVICE_KEY` is set in **prod** and matches the contracted Debit Order service key (distinct from `NETCASH_SERVICE_KEY` / Pay Now).
- [ ] `NETCASH_WS_URL` = `https://ws.netcash.co.za/NIWS/niws_nif.svc`.
- [ ] The `debit-orders` Inngest function is registered & synced (it is in `lib/inngest/index.ts`) — but **leave the daily cron OFF** until W5 passes.

> Note: `NETCASH_DEBIT_ORDER_SERVICE_KEY` is already present in `.env.local` (36-char GUID) and documented in `.env.example`. The open item is confirming the **prod** value + that it maps to a contracted Debit Order service.

---

## C. Answers to record (feeds W4.3 + go-live decision)

| Ref | Question | Answer | Date | By |
|-----|----------|--------|------|----|
| W0.1 | Debit Order key in prod + contracted? | | | |
| W0.2 | DebiCheck/Debit Order product enabled? | | | |
| W0.3 | Postback URL set to `/api/webhooks/netcash/emandate`? | | | |
| W0.4 | Mandate type: **DebiCheck** or **RM**? | | | |
| W0.5 | Test-mode batch submit + load report OK? | | | |

**Why W0.4 matters:** from **13 April 2026**, debit-order disputes within 60 days are fully automated with no chance for the business to defend non-authenticated (RM) collections. DebiCheck-authenticated mandates are non-disputable when collections stay within the agreed terms. If the answer is RM-only, raise a risk flag before scaling collections (see plan W4.3).
