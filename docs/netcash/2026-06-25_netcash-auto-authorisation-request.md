# NetCash Support Request — Enable Auto Authorisation (web-service batch authorisation)

**Date:** 2026-06-25
**From:** CircleTel (Circle Tel SA)
**NetCash profile / account:** Circle Tel SA — **52552945156**
**Service:** Debit Orders (NIWS_NIF web service)
**Service key (debit orders):** 3213bddd-…4116 *(last 4)*

---

## Subject
Please enable **Auto Authorisation** (web-service batch authorisation) on our Debit Orders service key.

## What we need
We submit debit-order batches programmatically via the **`BatchFileUpload`** web-service method (Two Day service). We then want to **authorise/release those batches programmatically** via **`RequestBatchAuthorise`**, so the whole cycle is automated for our monthly recurring billing.

Currently `RequestBatchAuthorise` returns response code **`322` (`AutoAuthNotAllowed`)** — i.e. Auto Authorisation is not enabled for our service key/profile.

**Please enable Auto Authorisation on profile 52552945156 / our debit-order service key** so that `RequestBatchAuthorise` succeeds.

## Evidence
- `BatchFileUpload` → succeeds; `RequestFileUploadReport` returns **SUCCESSFUL** (batch loads correctly).
- `RetrieveUnauthorisedBatches` → correctly lists the uploaded batch with its BatchIndicator GUID.
- `RequestBatchAuthorise(ServiceKey, BatchIndicator, SendEmail, FromName, FromAddress, SendSMS, ReleaseFunds, BankTransfer)` → returns **`322`** every time (tested with `ReleaseFunds` true and false; tested on a freshly uploaded batch with a comfortable action date).

## Business impact
Without web-service authorisation, every batch must be **manually authorised in the NetCash portal** within the Two-Day lead window. Several of our debit batches have already **expired unauthorised** ("Date expired") and did not collect, because they were not manually authorised in time. Enabling Auto Authorisation removes this manual step and lets our system run recurring clinic billing reliably.

## Questions for NetCash
1. Can you enable **Auto Authorisation** (so `RequestBatchAuthorise` works) on service key 3213bddd-…4116 / profile 52552945156? Is there any agreement, limit, or risk acknowledgement required?
2. Are there **collection limits** (per-batch / per-day rand value) on this profile we should be aware of for auto-authorised batches?
3. Is **account validation (AVS / CDV)** enabled on this profile? (We have seen "Account details could not be validated" rejections — we want to confirm the validation rules so we validate account numbers up-front.)
4. Once enabled, are there any required parameter values for `RequestBatchAuthorise` (e.g. `ReleaseFunds`, `BankTransfer`) for a standard Two-Day collection?

## Observed profile configuration (from NetCash portal, 2026-06-27)

Captured from **Debit orders profile and fee** page (profile 52552945156). These are the live
constraints the `RequestBatchAuthorise` / batch-submission code must respect:

| Setting | Value | Code implication |
|---|---|---|
| **Number of authorisers** | **1** | A single `RequestBatchAuthorise` call fully authorises a batch — no second-signer step. |
| **Lock batch enabled (Debit Order)** | **False** | Batches are not locked → API authorise won't hit a lock conflict. |
| **Service active** | True | Debit-order service live. |
| **Allow DebiCheck** | **False** | Collections run as **standard debit orders (RMS/DO)**, NOT DebiCheck/TT1/TT2. Matches electronic-mandate path (electronic mandate fee R0.00). |
| **Days to settlement** | 2 days | Two-Day service is the profile default (R3.66/order); same-day available (R4.16). |
| **Settlement type** | Retention | Surety retention 10.00%, retention period 22 days. |
| **Line limit** | **R1,500.00 per item** | Each debit-order line must be ≤ R1,500. R450/clinic is well under. |
| **Daily limit** | **R20,000.00 total/day** | ⚠️ Hard ceiling. 22 clinics × R450 = R9,900 (safe). But only allows ~**44 × R450** orders/day — once a single day's batch exceeds R20k it will be capped/rejected. **The submit/authorise code should guard against, or at least log, batches whose total exceeds R20,000** until NetCash raises this limit. |

**Answers Question 2 above (collection limits):** Line limit R1,500/item, Daily limit R20,000/day.
Still open: confirm whether these limits apply to *auto-authorised* batches specifically, and the
AVS/CDV validation rules (Question 3).

## Contact
Jeffrey — CircleTel — jeffrey@newgengroup.co.za

*(Reference for your team: NetCash Web Service Response Codes — 322 = AutoAuthNotAllowed, listed between 321 BatchAuthRMSNotAllowed and 323 InsufficientFundsAvailable.)*
