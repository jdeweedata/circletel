<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# how difficult would this be build and integrate for both self-serve, sell ad slots and Programmatic Ads?

This is genuinely buildable by you and your team given your Next.js/TypeScript/Supabase stack — but the three modes have **very different complexity levels**. Here's an honest assessment:

## The Three Tiers of Complexity

### Tier 1 — Direct Ad Slot Sales (Difficulty: 3/10)

**Build time: 2–4 weeks | Fully within your current skill set**

This is what Think Digital is already doing for you. You sell an ad slot to a brand (e.g., Discovery Health, Clicks Pharmacy), upload their creative, set the campaign dates and locations, and Powerlynx serves it via its native ad module. Your platform simply needs:

- A campaign management UI (advertiser uploads creative, sets budget, selects clinic locations)
- A revenue split calculator (CircleTel % / Venue % / Platform %)
- A reporting dashboard pulling from Powerlynx API (sessions, impressions, CPM)
- An invoicing workflow (Zoho Books integration you already use)

**Tech stack**: Next.js frontend + Supabase (campaigns, advertisers, revenue records) + Powerlynx API + Zoho Books webhook. Nothing exotic here — this is essentially a CRM with a reporting layer.

***

### Tier 2 — Self-Serve Ad Platform (Difficulty: 6/10)

**Build time: 6–10 weeks | Moderate complexity**

Self-serve means advertisers log in themselves, create their own campaigns, upload creatives, set budgets, and monitor results without you being in the loop. This adds:


| Component | What It Requires |
| :-- | :-- |
| Multi-tenant advertiser portal | Role-based auth (advertisers vs. admins vs. venues) |
| Creative upload \& validation | S3/Cloudflare R2 storage + format/size validation |
| Campaign builder UI | Date picker, location selector, budget allocator |
| Billing \& prepayment | Stripe or Peach Payments integration, wallet/credit system |
| Automated approval workflow | Creative moderation queue (manual or AI-assisted) |
| Real-time spend tracking | Deduct from advertiser wallet per impression served |

The hard part here isn't the UI — it's the **billing logic** (pre-paid vs. post-paid, CPM vs. flat rate, overspend protection) and **creative moderation** (you're serving to clinic patients, so health regulations apply). Everything else is standard Next.js CRUD work.[^1]

***

### Tier 3 — Programmatic Ads (Difficulty: 9/10)

**Build time: 4–9 months | Significant engineering investment**

This is where it gets serious. Programmatic means connecting your WiFi ad inventory to a real-time bidding (RTB) exchange so DSPs (Google DV360, The Trade Desk, etc.) can bid on your impressions in milliseconds. The components are:[^2]

```
Patient connects → Splash page loads → Your SSP fires bid request (OpenRTB 2.x)
                                              ↓
                               Multiple DSPs bid in <100ms
                                              ↓
                               Highest bid wins → Creative returned
                                              ↓
                               Ad displayed → Win notice + impression fired
                                              ↓
                               Revenue logged → Payout to venue
```

What you need to build:

- **SSP (Supply-Side Platform)** — manages your inventory, creates bid requests in OpenRTB 2.5 format, runs the auction, returns winning creative to the splash page[^3]
- **Ad Server** — delivers the actual creative, tracks impressions/clicks, handles frequency capping
- **Floor price engine** — sets minimum CPM per location/audience segment (your R62.14 CPM is a strong floor)
- **Audience data layer** — packages user signals (location, visit frequency, demographics) into bid request objects for DSPs to target against
- **Latency infrastructure** — bid requests must resolve in under 150ms; this means low-latency hosting (closest AWS/GCP region to SA is `af-south-1` Cape Town)
- **Fraud detection** — invalid traffic (IVT) filtering to maintain exchange trust
- **OpenRTB compliance** — IAB Tech Lab certification to connect to major exchanges[^2]

The honest industry benchmark: building a custom SSP before reaching **250–500M monthly impressions** is financially inefficient. At your current scale (186K impressions/month across 22 sites), the math doesn't work for fully custom programmatic yet.[^4]

***

## The Smart Build Path for CircleTel

Rather than building all three from scratch, use a **white-label ad server as your programmatic backbone** and build your differentiation on top:

```
Phase 1 (Now — Month 2)        Phase 2 (Month 3–5)         Phase 3 (Month 6–12)
─────────────────────────      ─────────────────────────    ─────────────────────────
✅ Powerlynx (WiFi layer)      ✅ Self-serve portal          ✅ Programmatic via AdButler
✅ Direct sales dashboard      ✅ Advertiser wallet/billing  ✅ OpenRTB DSP connections
✅ Revenue split reporting     ✅ Creative upload flow        ✅ Audience data packaging
✅ Venue client login          ✅ Campaign builder UI         ✅ Floor price optimization
```

**For programmatic specifically**, use **AdButler** as your ad server — it supports OpenRTB 2.3/2.5, connects to major exchanges natively, and you configure demand sources without building the bidder yourself. You pay AdButler a SaaS fee instead of building the auction engine, and focus your engineering effort on the audience data layer (which is your actual moat — nobody else has clinic patient WiFi signals in SA).[^3]

## Realistic Cost \& Time Summary

| Mode | Build Time | Est. Dev Cost | Ongoing Infrastructure |
| :-- | :-- | :-- | :-- |
| Direct slot sales dashboard | 2–4 weeks | R40K–R80K | R2K/month (Supabase + hosting) |
| Self-serve portal | 6–10 weeks | R120K–R200K | R5K–R10K/month |
| Programmatic (AdButler SSP) | 3–4 months | R200K–R350K | R15K–R30K/month |
| Programmatic (fully custom) | 9–12 months | R800K–R1.5M | R40K+/month |

Given your stack and team, **Phase 1 + 2 is achievable internally**. Phase 3 is where you'd consider a dedicated AdTech engineer or a white-label SSP partner like AdButler to avoid the custom bidder engineering cost.[^5][^4]

The real competitive advantage you have over Think Digital isn't the ad technology — it's the **first-party clinic patient audience data** and your existing WISP infrastructure across SA venues. Build the data layer well, and programmatic buyers will pay a significant premium above your current R62.14 CPM to access it.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://attekmi.com/blog/self-serve-advertising-platforms-empowering-advertisers-with-control

[^2]: https://www.rishabhsoft.com/blog/open-rtb

[^3]: https://www.adbutler.com/help/article/setup-programmatic-openrtb

[^4]: https://www.tuvoc.com/blog/build-vs-buy-adtech-platform-strategy/

[^5]: https://epom.com/blog/ad-server/how-to-build-your-ad-server

[^6]: https://iabtechlab.com/opendirect-2-1-for-the-programmatic-guaranteed-trading-of-both-traditional-and-digital-media/

[^7]: https://www.adformhelp.com/hc/en-us/articles/9739105036177-Set-Up-Custom-Integrations-With-Adform-OpenRTB-Handler

[^8]: https://www.wiconnect.com

[^9]: https://www.reddit.com/r/networking/comments/6efb88/creating_a_captive_portal_management_system/

[^10]: https://aws.amazon.com/solutions/guidance/capturing-advertising-openrtb-real-time-bidding-events-for-analytics-on-aws/

[^11]: https://www.iab.com/wp-content/uploads/2017/04/OpenRTB-Native-Ads-Specification-Draft_1.2_2017-04.pdf

[^12]: https://www.warroominc.com/blog/managed-programmatic-vs-self-serve/

[^13]: https://ucopia.com/en/wifi-marketing/integrating-marketing-into-your-captive-portal-effective-strategies/

[^14]: https://www.aidigital.com/blog/media-planning-and-buying

[^15]: https://developers.google.com/authorized-buyers/rtb/openrtb-guide

