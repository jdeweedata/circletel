# Credit risk — sales SOP (Netcash)

One page. Use this after a TransUnion / AVS pull. Do not treat Netcash **Clear** as approve.

## Portal (until the API key is live)

1. `Services → Risk Reports → Consumer → Consumer credit check`
2. ID, first name, last name, reason **Credit Risk Assessment**
3. TransUnion consumer (~R46). Download the same day (reports expire in 30 days)
4. For debit orders: `Consumer → Bank account verification` (AVS ~R5.20)
5. Capture written consent. Paste the result on **Admin → Orders → [order] → Credit risk** (`/admin/orders/[id]`, Credit risk tab). Filter the list with **Needs review**.

## How to score (CircleTel decision)

- **HARD_FAIL** — debt review, sequestration, admin order, open judgement, or AVS Acc Exists / Id Match = No
- **FAIL** — score under 500, or unpaid defaults
- **MARGINAL** — score 500–599, or no score and no hard flags
- **PASS** — score 600+ and AVS both Yes, no hard flags

Hard legal flags beat a missing score. Ishmael-style “Clear + debt review” is HARD_FAIL.

## What they qualify for

- **Low** (Home LTE ~R149, no kit): service OK if prepaid / already paid. No financed router. AVS before debit.
- **Medium** (SkyFibre Home + included Reyee): HARD_FAIL / FAIL → strip router, BYO or customer pays. No 24-month finance.
- **High** (SkyFibre SMB / CPE): HARD_FAIL → no CircleTel credit. Arlan or 12 months cash. FAIL → 12-month + 2-month deposit.

Never release CPE on HARD_FAIL / FAIL unless hardware is marked prepaid on the order.

## Internal note (copy)

Decision: HARD_FAIL / FAIL / MARGINAL / PASS  
Report id + date  
Flags in one line  
Allowed packages / terms  
Blocked: financed router, 24-month credit  
Owner:

## Customer script

We can provide connectivity month-to-month or prepaid. We cannot supply a router or outdoor unit on credit or fold it into a 24-month deal. Options: use your own router, buy it before install, or pay the first period plus equipment upfront.

Do not quote debt-review dates unless a manager is sending an NCA adverse letter.

## Alternatives (in order)

1. Prepaid / first period in advance  
2. BYO or customer-paid router  
3. Deposit = hardware cost  
4. Month-to-month instead of 24-month discount  
5. Arlan / MTN direct  
6. Decline if they refuse prepaid and need financed hardware  

Do not ask every consumer for 3 months of bank statements. Use that pack only on high exposure or MARGINAL + large CPE.
