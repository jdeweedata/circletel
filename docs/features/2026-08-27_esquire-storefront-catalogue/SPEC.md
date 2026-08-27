# Spec: Esquire Procurement Catalogue and Shop-first Storefront

**Date:** 2026-08-27  
**Status:** Agreed (grilling complete)  
**Glossary:** [CONTEXT.md](../../../CONTEXT.md)  
**Slice:** Shop first — Standalone Items at Shop Price. 5G Deal Add-ons, Risk Tiers, and Customer Quote subsidy are later.

---

## Problem Statement

CircleTel has an Esquire Technologies datafeed (about 3,836 SKUs, 653 categories) and wants those items in product management and on a storefront — sold alone, as Deal Add-ons, or inside Bundles and Customer Quotes.

The feed is a general distributor catalogue (candles and phone covers as well as APs and CCTV). Dumping it onto circletel.co.za would bury the ISP catalogue. CircleTel already syncs Scoop, MiRO, Nology, and Rectron into a Procurement Catalogue and **Promotes** selected rows into `circletel_hardware_products` for `/products/hardware`. Esquire is not wired. Today’s promote default (25% markup) is a 20% margin and sits under the 25% floor. Competitor “cheap routers” are often **Subsidised Prices** (Afrihost R1,499 / free-with-plan), not Shop Prices.

Cash position does not allow holding the full feed. Customers must pay (or accept a quote) before CircleTel orders from the supplier (**Indent**).

## Solution

Treat Esquire as a fifth distributor. Sync the full feed into the Procurement Catalogue only. A person **Promotes** SKUs that fit a CircleTel offer and clear the List Price rule. First live slice: those items sell as **Standalone Items** at **Shop Price** on `/products/hardware`. After payment, CircleTel **Indents**. If the supplier misses, the order is a **Backorder** (new lead time; customer may cancel; auto-refund after 10 business days unless ops extends once with customer consent).

Later slices attach the same Storefront Catalogue to Deals and quotes, with Afrihost-style Shop vs Subsidised paths gated by **Risk Tier**.

## User Stories

1. As procurement, I want Esquire SKUs in the same admin catalogue as Scoop/MiRO/Nology/Rectron, so I can compare cost and availability without opening the raw XML.
2. As a product admin, I want suggested Promotes (fit + margin + Shop Benchmark), so I do not wade through 3,836 rows.
3. As a product admin, I want to confirm each Promote and paste Afrihost/Axxess shop URLs, so List Price is competitive and never auto-listed.
4. As a product admin, I want the system to refuse a standalone List Price below 25% margin, so we do not publish loss-making shop SKUs.
5. As a product admin, I want unbenchmarked SKUs (no Afrihost/Axxess shop hit) to stay at 35% until I confirm or reject, so we do not guess the street.
6. As a product admin, I want Esquire “Yes/No” availability mapped clearly, so I do not treat it as warehouse units.
7. As a shopper, I want to browse only curated hardware on `/products/hardware`, so I never see the raw Esquire range.
8. As a shopper, I want VAT-inclusive Shop Price and an honest lead time, so I know when the item will ship.
9. As a shopper, I want to pay in full for a Standalone Item with no credit check, so I can buy without a Deal.
10. As ops, I want Indent only after payment, so CircleTel does not buy stock on a maybe.
11. As a shopper, if my item is not available after I pay, I want a Backorder with a new date and the right to cancel for a refund, so my money is not held forever.
12. As a shopper, if a Backorder is still open after 10 business days, I want an automatic refund unless I agreed to one extension, so there is a cap.
13. As ops, I want to extend a Backorder once with a new date the customer accepts, so a late Esquire shipment can still complete.
14. As finance, I want preferred supplier to be the lowest cost that can Indent the same model, so we do not buy G5TS from Esquire when Helios is cheaper (Esquire does not even list G5TS today).
15. As a product admin, I want Promoted cost to refresh when the Esquire feed moves, so List Price can be re-checked against the floor.
16. As security, I want Esquire credentials in environment variables, not in a URL or the repo, so the leaked procurement password can be rotated.
17. As a future 5G shopper, I want optional Cash CPE (Huawei H155-386) on SIM-only Deals — **out of this slice**.
18. As a future customer, I want Subsidised Price only after credit/Risk Tier — **out of this slice**.

## Implementation Decisions

- **Esquire is supplier code `ESQUIRE`.** Feed type XML. Credentials from env (`ESQUIRE_FEED_USER`, `ESQUIRE_FEED_PASSWORD`). Rotate the password that was pasted in chat. Register the sync next to Scoop/MiRO/Nology/Rectron.
- **Feed shape (verified 2026-08-27):** root `products` / `product` with `ProductCode`, `ProductName`, `Category`, `ProductSummary`, `Price`, `AvailableQty`, `image`. ~3,836 unique codes. `AvailableQty` is Yes/No, not units. Treat `Price` as dealer **excl VAT** unless Esquire confirms otherwise. Display Shop Price **incl VAT**.
- **Reuse Promote → `circletel_hardware_products`.** Do not invent a third product table. Replace the 25% markup default with the List Price formula. Keep `hardware_product_suppliers` so one Storefront item can prefer Helios vs Esquire by lowest COS.
- **List Price:** `target = cost_incl / 0.65` (35%). `floor = cost_incl / 0.75` (25%). Shop Benchmark = min of Afrihost and Axxess **once-off shop** prices for the same OEM+model, VAT incl, not subsidised. If target ≤ benchmark → List = target. If floor ≤ benchmark < target → List = benchmark. If benchmark < floor → cannot Promote as Standalone. If no valid shop hit → List = target, status unbenchmarked, human must confirm or reject. Street (Takealot, GeeWiz) is a note only. Collection in this slice: human pastes URLs + prices at Promote. Do not wait on new scrapers.
- **Fit for suggestions:** ISP-adjacent only (access points, bridges, Approved CPE models, IP camera/CCTV, PoE/ethernet switches, UPS, networking/HDMI/power cable kits). Exclude lifestyle (candles, covers, balloons, Disney). High-price NAS/OTDR is not first-wave unless a person overrides.
- **Shop-first channel:** published Storefront items appear on `/products/hardware` at Shop Price. No Deal Add-on, no Risk Tier, no Clawback in this slice.
- **Checkout:** full payment (existing NetCash path) before Indent. No bureau check on Shop Price.
- **Indent:** create a supplier PO/task after payment. Default displayed lead time 5–7 business days unless overridden at Promote.
- **Backorder:** if Indent cannot fulfil, set Backorder + new lead time; notify customer; they may cancel for full refund. After 10 business days, auto-refund unless ops recorded one customer-accepted extension.
- **No silent substitute.**
- **Existing competitor-analysis module** stays for connectivity. Do not average mixed monthly/subsidy prices for hardware. Later, extend it with `product_type: device` and a shop-vs-subsidised flag.

## Testing Decisions

- Test **external behaviour**: parse a fixture XML (no live password in tests); List Price table (target / match benchmark / block below floor / unbenchmarked); Promote cannot publish below floor; shop listing omits non-promoted Esquire rows; Indent is not created before payment; Backorder cancel refunds; 10-business-day refund; one allowed extension.
- Prior art: Rectron/MiRO parser tests, `promoteFromSupplier`, hardware listing queries, payment/order tests.
- Do not hit `api.esquire.co.za` in CI.

## Out of Scope (this slice)

- 5G Deal page Cash CPE / “Add router” meaning cash (today it switches to a 24-month sibling).
- Approved CPE whitelist enforcement on Deals.
- Subsidised Price, Clawback, Risk Tiers, surety, credit bureau in consumer checkout.
- Customer Quote / Bundle composer using the new catalogue.
- Auto-Promote, auto-scrape of Afrihost/Axxess, holding warehouse stock, Esquire dropship.
- Publishing the raw 3,836-SKU feed.

## Later (agreed, not this spec)

- Optional Cash CPE on SIM-only Deals; default Huawei H155-386; 5G add-ons must be Approved CPE (Afrihost/MTN whitelist).
- Shop vs Subsidised by Risk Tier (low: MTM + 6-month Clawback; medium: 24-month or deposit / B2B surety; high/fail: Shop only or decline on-account).
- Same Storefront SKU as Deal Add-on or quote line; Bundle Price may sit below Shop Price if combined Deal margin holds.

## Further Notes

- G5TS worked example: Helios COS R1,503.48 excl / R1,729 incl; Afrihost/Axxess shop R2,499; List at R2,499 = 30.8% margin. Esquire feed has G5C and G5B, not G5TS.
- Afrihost shop-vs-subsidy sources: [device FAQ](https://help.afrihost.com/entry/can-i-use-the-included-sim-card-in-another-device/), [Pure Wireless FAQs](https://help.afrihost.com/entry/pure-wireless-mtn-faqs), [general T&Cs](https://www2.afrihost.com/terms-and-conditions/general) clause 2.3.
- Tickets: `.scratch/esquire-storefront-catalogue/issues/`.
