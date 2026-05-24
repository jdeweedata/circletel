<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# how would i integrate the Ads platform into this setup or is it already within Powerlynx to set it up?

Great news — **the ads platform is already built into Powerlynx**. You don't need a separate third-party ad platform to get started. Here's exactly how it works and where you'd eventually want to extend it.

## What's Native in Powerlynx

Powerlynx includes a dedicated **Advertising Module** that was specifically built for WiFi hotspot monetisation. Setting up your first ad campaign takes under a minute  and requires **no third-party tools or extra setup**. It plugs directly into the same splash page and session flow you've already configured in the lab.[^1][^2]

### How Ads Trigger in the Flow

```
Patient connects to SSID
        ↓
Redirected to Powerlynx Splash Page
        ↓
Ad displayed (video or image) ← YOUR AD INVENTORY HERE
        ↓
Patient accepts T&Cs
        ↓
Internet access granted (session starts)
```

Ads fire **immediately after connection**, before the patient gets internet access — guaranteeing 100% view-through since access is the incentive.[^3]

## Setting Up Ads in Powerlynx Dashboard

### Step 1 — Create an Ad Campaign

In your Powerlynx dashboard go to **Advertising → Campaigns → New Campaign**:[^3]


| Field | What to Enter |
| :-- | :-- |
| Campaign Name | e.g. "Clinic Free WiFi – April 2026" |
| Start Date | Your go-live date |
| End Date | Campaign end (or leave open) |
| Locations | Select your clinic hotspot location |
| Splash Pages | Select the patient splash page only |
| Ad Type | Video (recommended) or Image |
| Ad Content | Upload your video/image asset |

### Step 2 — Ad Format Specs

- **Video**: MP4, max 30 seconds, auto-plays muted (user must watch before proceeding)
- **Image**: JPEG/PNG banner, shown with a countdown timer before access is granted
- Both formats support a **click-through URL** (send patients to a landing page, app download, or promo)


### Step 3 — Target Groups (Advanced)

Powerlynx's upgraded Advertising Module supports **audience segmentation** using data collected at login:[^2]

- Target by **demographics** (age, gender if collected at sign-in)
- Target by **behaviour** (returning vs. new users, session frequency)
- Target by **custom fields** you define on the splash page (e.g., "Are you a patient or visitor?")

This means you can show a **pharmacy promo** to patients who visit weekly vs. a **health insurance ad** to first-time visitors — directly relevant for a clinic environment.

### Step 4 — Performance Tracking

The dashboard shows per-campaign:

- Impressions (views)
- Click-through rate (CTR)
- Sessions generated
- Location-level breakdown (useful when you scale to multiple clinic sites)


## Revenue Model You Can Run Right Now

Since this is a **clinic site with a captive audience**, you have two immediate monetisation paths:

**1. Self-Serve (Own Ads)**
Use the ad slot to promote CircleTel services, drive app downloads, or promote partner brands (pharmacies, medical aids, health insurance). Zero ad revenue share, full control.

**2. Sell Ad Slots to Local Brands**
Sell monthly ad campaigns to relevant advertisers — pharmaceutical brands, medical aid schemes, health food retailers — who want to reach patients at point-of-care. Charge per location per month or per 1,000 impressions (CPM).

A typical township/clinic CPM in SA runs **R15–R40** depending on audience quality and targeting. At 500 patient sessions/day per site that's roughly **15,000 impressions/month per clinic** — meaningful at scale across multiple sites.[^4]

## When to Add a Separate Programmatic Ad Platform

Powerlynx's native ads module is sufficient for **direct deals** and **self-managed campaigns**. Once you want to plug into **programmatic ad exchanges** (Google AdX, DV360, Meta Audience Network) to fill unsold inventory automatically, you'd build a custom integration layer — which is exactly the platform you're already planning to build. That future platform would:

- Pull audience/session data from Powerlynx via its API
- Push ad requests to a programmatic exchange
- Return winning ad creative back to the splash page renderer
- Feed impression/click data back to advertiser dashboards

For now, **Powerlynx native ads handles everything you need for the clinic pilot** — no extra setup required.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.itweb.co.za/article/powerlynx-enables-businesses-to-monetise-wifi-hotspots-with-adverts/JBwEr7n3KYNM6Db2

[^2]: https://powerlynx.app/blog/how-to-launch-a-captive-wi-fi-network/

[^3]: https://www.youtube.com/watch?v=6uFzY9sJCa8

[^4]: https://www.itweb.co.za/article/turning-wifi-hotspots-into-marketing-gold-in-sa/WnxpEv4YWga7V8XL

[^5]: https://docs.powerlynx.app/getstarted.html

[^6]: https://docs.powerlynx.app

[^7]: https://www.cometly.com/post/ad-platform-api-integration

[^8]: https://github.com/splynx/powerlynx-doc

[^9]: https://www.youtube.com/watch?v=WkuSmw_x9ic

[^10]: https://www.itweb.co.za/article/new-possibility-to-monetise-wifi-hotspots-with-powerlynxs-direct-integration-with-1voucher/Pero37Z3RReMQb6m

[^11]: https://docs.powerlynx.app/system/splash-pages.html

[^12]: https://wiki.splynx.com/addons_modules/powerlynx

[^13]: https://leadsync.me/blog/facebook-lead-ads-integration-ultimate-guide/amp/

[^14]: https://www.youtube.com/watch?v=HFRiOXsVbdA

[^15]: https://improvado.io/data-connectors/linkedin-ads-to-power-bi

