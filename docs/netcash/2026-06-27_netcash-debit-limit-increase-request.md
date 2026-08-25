# NetCash Support Request — Increase Debit Order Limits (line + daily)

**Date:** 2026-06-27
**From:** CircleTel (Circle Tel SA (PTY) LTD)
**NetCash profile / account:** Circle Tel SA — **52552945156**
**Service:** Debit Orders (NIWS_NIF web service / TwoDay)

---

## Subject
Please increase the **per-item line limit** and the **daily collection limit** on our
Debit Orders profile so we can collect our higher-value business-fibre products by debit order.

## Current profile limits (per the Debit Orders profile & fee page)
| Limit | Current value |
|---|---|
| Line limit (per debit-order item) | **R1,500.00** |
| Daily limit (per action date) | **R20,000.00** |
| Number of authorisers | 1 |
| Surety retention | 10.00% (22-day period) |

## What we need

### 1. Line limit: R1,500 → **R10,000**
Our recurring billing collects monthly subscription invoices by debit order. Our consumer /
clinic products are small (R450–R999 incl. VAT), but our **business-fibre catalogue is materially
higher** and currently **exceeds the R1,500 line limit**, so those debit-order lines would be
rejected. Active products today include:

| Product | Monthly (excl. VAT) | Debited (incl. VAT, ≈) |
|---|---|---|
| DFA BizFibreConnect 200Mbps | R4,373 | ~R5,029 |
| BizFibre Connect Pro | R3,449 | ~R3,966 |
| DFA BizFibreConnect 100Mbps | R2,999 | ~R3,449 |
| BizFibre Connect Plus | R2,874 | ~R3,305 |
| SkyFibre SME Premium | R2,521 | ~R2,899 |
| DFA BizFibreConnect 50Mbps | R2,499 | ~R2,874 |
| BizFibre Connect Starter | R2,184 | ~R2,512 |
| BizFibre Connect Lite | R1,954 | ~R2,247 |
| DFA BizFibreConnect 25Mbps | R1,899 | ~R2,184 |
| SkyFibre SME Professional | R1,651 | ~R1,899 |

Debits are **VAT-inclusive** (we collect the invoice total), so the limit must clear the highest
product plus VAT plus headroom for future tiers — hence **R10,000**.

### 2. Daily limit: R20,000 → **R500,000** *(figure to confirm against our debit-volume forecast)*
Our recurring debit run is submitted for a **single action date**, so the daily limit must cover the
**entire monthly debit book on that day**, not an individual customer. As we onboard clinics and
business-fibre customers our monthly debit run will grow well past R20,000. We are requesting a daily
limit of **R500,000** to support planned recurring-billing growth. Please advise if a phased increase
or additional surety is required to support this.

## Business impact
Without these increases:
- Our **business-fibre customers cannot be collected by debit order at all** (every line > R1,500 is rejected), forcing manual collection.
- Our monthly debit run will **breach the R20,000 daily cap** as soon as the book grows past ~40 small accounts, causing batch rejections / failed collections.

## Questions for NetCash
1. Can you raise the **line limit to R10,000** and the **daily limit to R500,000** on profile 52552945156?
2. What do you require from us to support these (additional **surety / retention**, risk review, FSCA/registration, signed acknowledgement)?
3. Are increases applied immediately or is there a phased / probationary period?
4. Do these limits apply identically to **auto-authorised** batches (we are separately requesting Auto Authorisation — see the `RequestBatchAuthorise` / code 322 request)?

## Contact
Jeffrey — CircleTel — jeffrey@newgengroup.co.za

*(Related open request: enable Auto Authorisation so `RequestBatchAuthorise` succeeds — see `docs/netcash/2026-06-25_netcash-auto-authorisation-request.md`.)*
