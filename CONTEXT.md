# CircleTel Catalogue

Language for how CircleTel sources hardware, publishes what customers can buy, and attaches equipment to connectivity.

## Language

### Catalogues

**Procurement Catalogue**:
The full supplier feed CircleTel can buy from. Includes Esquire and the existing distributors. Not shown to customers as-is.
_Avoid_: store, shop, product list

**Storefront Catalogue**:
The short, curated set of hardware and accessories a customer can buy on circletel.co.za.
_Avoid_: feed, supplier catalogue, Esquire catalogue

**Promote**:
Copy a Procurement Catalogue item into the Storefront Catalogue after it clears the margin floor and fits a CircleTel offer. The system only suggests; a person confirms and records the Shop Benchmark URLs. Promote does not attach the item to every Deal.
_Avoid_: sync, publish (unqualified), list, auto-list

**Indent**:
CircleTel orders a Storefront Catalogue item from the supplier only after the customer has paid or the Customer Quote is accepted. Lead time is shown; the full feed is not held in a warehouse.
_Avoid_: stock, warehouse, dropship, hold-stock

**Backorder**:
A paid Standalone Item order waiting on the supplier. The customer sees a new lead time and may cancel for a full refund. After 10 business days CircleTel refunds unless ops extends once with a new date the customer accepts. No silent substitute.
_Avoid_: refund-first (rejected), substitute, open-ended hold

**List Price**:
The default Standalone Item price. Start from best supplier cost at a 35% target margin, then cut toward the Shop Benchmark if needed. Never publish a standalone List Price below 25% margin without MD approval.
_Avoid_: markup (markup is not margin), Helios incl-VAT column (that is cost, not our sell), bundle-subsidised competitor price (Afrihost R1,499 / free-with-plan is not standalone)

**Shop Benchmark**:
The lowest once-off, VAT-inclusive Afrihost or Axxess **shop** price for the same model. Street (Takealot, GeeWiz) is a note only. No valid shop hit means unbenchmarked — stay at 35% until a human confirms or rejects.
_Avoid_: average of mixed prices, subsidised plan price, monthly device deal

**Promotion**:
A managed, time-bounded price below List Price.
_Avoid_: List Price, discount (unqualified)

**Bundle Price**:
The price of a Storefront item inside a Bundle or as a Deal Add-on. It may sit below standalone List Price because the Deal carries margin.
_Avoid_: List Price, Promotion

**Shop Price**:
List Price paid in full, with no Deal subsidy. No credit gate beyond taking payment. Combined hardware margin stays at or above 25%.
_Avoid_: subsidised, free router

**Subsidised Price**:
A Bundle Price below Shop Price, granted only after a credit/risk pass and a contractual commitment (term or clawback). Hardware margin may sit below 25% if the Deal’s combined margin holds the floor.
_Avoid_: Shop Price, free router (unless the Deal and risk tier explicitly grant it)

**Clawback**:
The fee charged if the customer cancels or falls into arrears inside the commitment window on a Subsidised Price. Afrihost’s published figure is R999 inside six months.
_Avoid_: cancellation (unqualified), early termination (when you mean this hardware-recovery fee)

**Risk Tier**:
The credit/KYC outcome that chooses the hardware path. **Low**: Subsidised Price on a month-to-month Deal with a 6-month Clawback (including free on selected Deals). **Medium**: 24-month Deal or a deposit. **High / fail**: Shop Price only, or decline if the Deal is on account.
_Avoid_: credit score (unqualified), affordability (a separate NCA test if we ever lend)

### Offers

**Deal**:
A sellable connectivity offer, such as CircleConnect 5G FWA 500 GB.
_Avoid_: package (when you mean the offer a customer buys), product (unqualified)

**SIM-only Deal**:
A Deal with no router in the monthly price. The customer brings a router or buys Cash CPE.
_Avoid_: BYO (as the Deal name)

**Contract Router Deal**:
A 24-month Deal whose monthly price includes a router.
_Avoid_: bundled deal, free router

**Standalone Item**:
A Storefront Catalogue item bought with no Deal. First live slice: Standalone Items at Shop Price on `/products/hardware`, Indent after payment. 5G Deal Add-ons and Customer Quote subsidy stay out of this slice.
_Avoid_: product (unqualified), accessory (when it is the thing being bought)

**Deal Add-on**:
A Storefront Catalogue item offered beside a Deal. Cash CPE is the router case. Not every Storefront item appears on every Deal.
_Avoid_: bundle, upsell (unqualified), Add router (the current 5G button that switches to a Contract Router Deal)

**Cash CPE**:
A Deal Add-on that is a router, paid once, not amortised into the monthly. On a SIM-only Deal it is optional. The default Cash CPE is the Huawei H155-386. Only Approved CPE may be a Deal Add-on on a 5G Deal.
_Avoid_: add-on (unqualified), bundle, free router

**BYO**:
The customer uses their own Approved CPE on a SIM-only Deal.
_Avoid_: SIM-only (that is the Deal, not the equipment path)

**Approved CPE**:
A router model on the MTN fixed 5G / LTE-A whitelist. A SIM in any other device is blocked.
_Avoid_: any 5G router, compatible router (unqualified)

### B2B

**Customer Quote**:
A priced proposal for one customer, built by that customer or a salesperson from Deals and Storefront Catalogue items. The same Risk Tiers apply as consumer. A juristic customer on medium may give a surety instead of a deposit.
_Avoid_: bundle (a quote is for one customer; it is not a reusable offer)

**Bundle**:
A reusable sellable composition of Deals and Storefront Catalogue items with one price and term.
_Avoid_: quote, package
