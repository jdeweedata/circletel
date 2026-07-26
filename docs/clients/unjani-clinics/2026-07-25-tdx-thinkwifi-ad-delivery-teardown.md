# TDX / ThinkWiFi Ad-Delivery Teardown

**Date:** 2026-07-25
**Author:** Claude Code (session 499dbc2d)
**Status:** Analysis / teardown only — no live ad capture, no build plan, no revenue model (named as next steps)
**Purpose:** CircleTel owns the MikroTik routers at the Unjani clinics; TDX (ThinkDigitalX / ThinkWiFi) manages them under an MSA and runs an ad-supported captive portal on the patient WiFi VLAN, earning ad revenue on CircleTel-owned hardware. Before any move to **take over that ad revenue**, this document maps exactly how TDX delivers ads — from evidence gathered read-only on 2026-07-25.
**Related:** `TDX_Circle_Tel_MSA_Final.pdf`, `TDX_CIRCLE_TEL_MSA_KEY_COMMERCIAL_TERMS.md`, `2026-07-25-ruijie-offline-oukasie-jabulani-nokaneng.md`, `docs/plans/2026-07-25-mikrotik-access-probe-scope.md`, `products/captive ad portal/*`, `mikrotik-access-state` memory.

---

## 1. Executive answer — "are they running Google Ads?"

**Yes — but as a _publisher_, not an advertiser.** TDX is not *buying* Google Ads to promote something. They are *selling* the patient-WiFi captive-portal inventory and monetizing it through:

- **Google Ad Manager (GAM)** as the primary ad server (Google Publisher Tag / GPT), with
- **AdSense** and **Google AdExchange (AdX)** as demand, and
- a **programmatic header-bidding / SSP stack** (PubMatic, Smaato, RTB House, IPONWEB, AdRoll, Opera Ads, Mintegral, Bedrock, nRich, GoNet) layered on for additional demand.

The captive portal itself (splash, login, surveys, consent) is built by **Gorite / GDT** and **ThinkWiFi**, hosted on **Google Cloud + Microsoft Azure**, with **Cookiebot** for consent and **Firebase** for identity.

The one thing this teardown **cannot** establish from the network fingerprint alone is *whose* Google publisher account receives the money (the `ca-pub-…` AdSense ID or GAM network code). That identifier only loads on the post-connect page behind a live clinic hotspot — see §8.

---

## 2. Evidence base (all read-only, 2026-07-25)

| Source | What it is | How obtained |
|--------|-----------|--------------|
| `twurl.rsc` v2026.07.15 | TDX's nightly config push — a public RouterOS script, **1049 lines, walled-garden only** | `curl -s https://storage.googleapis.com/twurl/twurl.rsc` |
| MikroTik config script | Per-site router provisioning template (VLANs, RADIUS, hotspot, scheduler) | `.docs/Mikrotik Router Config Script-v2026.02 [CircleTel _ Unjani] - v2026.03.csv` (in repo) |
| Egress ownership | Who owns the clinics' internet-egress IPs | `whois` on cached WAN IPs |
| Live sessions | PPPoE framed/NAS IPs for the Echo-uplink clinics | Interstellio `getSubscriber` / `listSessions` |

The ad-stack picture below is derived almost entirely from the **walled-garden** in `twurl.rsc`: to show ads on a captive portal, every ad/measurement/portal host must be allow-listed *before* the user authenticates. That allow-list is therefore a near-complete inventory of the adtech TDX uses.

---

## 3. The ad stack (from the `twurl.rsc` walled-garden)

### 3.1 Google core — the ad server + Google demand
| Host fingerprint | Role |
|------------------|------|
| `securepubads.g.doubleclick.net`, `pubads.g.doubleclick.net` | **Google Ad Manager** ad requests (Google Publisher Tag) |
| `www.googletagservices.com`, `www.googletagmanager.com` | GPT / GTM tag loaders |
| `pagead2.googlesyndication.com`, `*.googlesyndication.com`, `tpc.googlesyndication.com`, `video-ad-stats.googlesyndication.com` | **AdSense** (incl. video) |
| `adx.adwords.google.com`, `admanager.google.com`, `adservice.google.com`, `googleads.g.doubleclick.net`, `bid.g.doubleclick.net` | **Google AdExchange (AdX)** programmatic demand into GAM |
| `*.2mdn.net`, `s0.2mdn.net`, `gcdn.2mdn.net` | DoubleClick creative CDN |
| `*.adtrafficquality.google`, `ep1/ep2.adtrafficquality.google` | Google ad traffic-quality / fraud |
| `*.googleadservices.com`, `partner.googleadservices.com` | Conversion / ad services |

This is the signature of a **Google Ad Manager publisher** with AdSense + AdX demand — the standard monetization path for ad-supported WiFi.

### 3.2 Programmatic SSPs / header bidding (extra demand)
PubMatic (`ads.pubmatic.com`, `pubmatic.edgekey.net`), Smaato (`*.smaato.com`, `s.ad.smaato.net`), RTB House (`ans101.rtbhouse.net`, `*.rtbhouse.com`, `creativecdn.com`), IPONWEB (`*.iponweb.net`, `zagreb.geo.iponweb.net`), AdRoll (`adx-winners-…rtb.adroll.com`), Opera Ads (`*.adx.opera.com`), Mintegral / Rayjump (`*.rayjump.com`), Bedrock (`sync.bedrockplatform.bid`), nRich (`dsp.nrich.ai`), GoNet (`sync.gonet-ads.com`), Ingage (`ingage.tech`).

### 3.3 Measurement / verification / data
IAS — Integral Ad Science (`*.adsafeprotected.com`, viewability + verification), Quantcast (`content.quantcount.com`, `creative-measurement.quantcount.com`), Salesforce Krux DMP (`cdn.krxd.net`).

### 3.4 Consent / auth / portal infrastructure
Cookiebot (`*.cookiebot.com`) — GDPR/POPIA consent management (required by Google); Firebase Identity Toolkit (`identitytoolkit.googleapis.com`) — portal login; Google Cloud Run (`captiveportal-m6hruoixia-bq.a.run.app`) — portal backend.

---

## 4. Portal & session architecture

Patient traffic path (from the config script's VLAN split):

```
Patient device ──> VLAN20 (HOTSPOT-VLAN20) ──> think-hs-bridge (192.168.77.0/24, 25M queue, 7M/7M per user)
                                                     │  /ip hotspot  profile=think-hs-prof (use-radius=yes)
                                                     ▼
                                     Hotspot RADIUS 34.79.51.25  (TDX, GCP — secret "thinkzone")
                                                     │  captive-portal redirect
                                                     ▼
                          Splash / login: freewifi.thinkwifizone.com, connected.thinkwifizone.com,
                                          welcome.gorite.co.za, captive.gorite.co.za
                                                     │  after accept/login
                                                     ▼
                          Post-auth page loads GAM (GPT) + AdSense/AdX + programmatic SSP tags (§3)
```

- The **walled-garden pre-authorises** every ad/portal/measurement host so an *unauthenticated* patient can load the splash page and its ads before completing login. It also **rejects everything else** (`walled-garden ip add action=reject` for tcp 1-79/81-442/444-65535 and udp) until authenticated — the classic captive-portal clamp.
- The nightly **`twurl` scheduler (02:00)** wipes and re-imports the walled-garden and the `trusted` management address-list from the public GCS bucket, so TDX can update the ad allow-list fleet-wide without touching the routers directly.
- **VLAN separation:** VLAN10 (`UNJANI-CLINIC-VLAN10`, 192.168.10.0/24) is the clinic/staff network on **CircleTel's Interstellio RADIUS via the CircleTel PPPoE**; VLAN20 is the **patient ad-WiFi on TDX's RADIUS**. The two never mix — which is exactly why a takeover only needs to touch VLAN20 (§7).

---

## 5. Data & tracking flow

Beyond ad serving, TDX runs a **survey + tracking layer** under the Gorite/GDT brand: `t.gdt.co.za`, `api.survey.gdt.co.za`, `gdt-survey-api.azurewebsites.net`, `gdt-tracking-api.azurewebsites.net`, `gorite-welcome/gorite-captive.azurewebsites.net`. Firebase Identity Toolkit captures the login identity; Cookiebot manages consent. In a **clinic** context this is POPIA-sensitive (patients on the patient VLAN), which is a compliance factor for any CircleTel-run replacement.

---

## 6. Hosting / infrastructure map

| Provider | TDX components |
|----------|----------------|
| **Google Cloud (GCP)** | Captive-portal backend (Cloud Run `…run.app`), hotspot RADIUS `34.79.51.25`, L2TP concentrator / management `34.35.85.28` + `34.35.29.236`, plus all Google ad serving |
| **Microsoft Azure** | Gorite/GDT welcome, captive, survey and tracking APIs (`*.azurewebsites.net`) |
| **Public GCS bucket** | `storage.googleapis.com/twurl/twurl.rsc` — nightly fleet config push |

Brands in play: **ThinkDigitalX / ThinkWiFi** (`thinkwifizone.com`, `thinkwifi.online`, `mikrotik.thinkwifizone.com`, `apigw.thinkwifizone.com`, `logs.thinkwifizone.com`) and **Gorite / GDT** (`gorite.co.za`, `gdt.co.za`).

TDX management source IPs (the router `trusted` list, from `twurl.rsc`): `102.68.120.1/.2`, `102.219.170.101/.105` (public), `34.35.29.236`, `34.35.85.28` (GCP), `10.200.1.0/24`, `10.125.0.0/24` (internal/L2TP).

---

## 7. Revenue-capture implications (the takeover lens)

| Layer | Controlled by | Notes |
|-------|--------------|-------|
| Physical MikroTik routers | **CircleTel** | CircleTel-owned hardware; TDX manages under MSA |
| Internet uplink / BNG | **CircleTel** (via ECHO) | ECHO SP wholesale — `41.198.128.0/18`, AS327693 |
| VLAN10 clinic RADIUS | **CircleTel** (Interstellio) | Untouched by any ad takeover |
| **VLAN20 hotspot RADIUS** | **TDX** (`34.79.51.25`) | ← the swap point |
| **Walled-garden + captive portal** | **TDX** (Gorite/ThinkWiFi) | ← the swap point |
| **Google/programmatic publisher accounts** | **TDX** | ← where the revenue lands |

**The swap surface is small and self-contained:** repoint VLAN20's hotspot RADIUS + walled-garden + splash at a CircleTel-controlled ad platform, leaving VLAN10/Interstellio and the WAN untouched. CircleTel has already specced this around **Powerlynx**:
- `products/captive ad portal/CircleTel WiFi Ads Platform Specification.md` — CircleTel owns the commercial/reporting/revenue-share layer; Powerlynx runs captive portal + ad execution; pilot hardware = MikroTik hAP ax S + Reyee RG-RAP62X.
- `products/captive ad portal/with our current relationship with ECHO that provi.md` — dual-RADIUS on the same MikroTik: **Interstellio on VLAN10 (nurse), Powerlynx on VLAN20 (patient)**. This maps **1:1** onto TDX's existing VLAN10/VLAN20 split.

So architecturally the replacement is ready; it is gated by MikroTik device access (see `docs/plans/2026-07-25-mikrotik-access-probe-scope.md`).

**Open questions a revenue takeover hinges on (flagged, not resolved here):**
1. **Whose GAM/AdSense/AdX account earns the money?** — the publisher ID (`ca-pub-…` / GAM network code) is only visible on the post-connect page behind a live hotspot. Determines whether CircleTel currently receives any share and whether the inventory must be re-registered under a CircleTel Google Ad Manager account.
2. **Revenue quantum** — unknown; TDX has not shared per-site ad earnings. Needed to size the opportunity vs the R450/site connectivity revenue.
3. **MSA rights** — does `TDX_Circle_Tel_MSA_Final.pdf` grant TDX the patient-WiFi ad inventory, and on what terms? A takeover is a contractual question first, a technical one second.
4. **POPIA** — patient-context data collection at clinics; any CircleTel-run portal inherits this obligation.

---

## 8. Next steps (out of scope of this teardown)

1. **Live ad-call capture** — connect to a clinic hotspot (or a bench MikroTik running the TDX config), complete the portal flow, and capture the network requests to obtain the publisher ID + real demand chain. Answers Open Question #1.
2. **Powerlynx VLAN20 replacement plan** — turn the existing spec into an executable plan (dual-RADIUS config, walled-garden, splash, revenue engine), gated on MikroTik access.
3. **Revenue model** — size CircleTel's ad upside once the publisher/quantum are known.
4. **MSA legal review** — confirm CircleTel's rights to the ad inventory before acting.

---

## 9. Reproducibility appendix

All findings above are re-derivable read-only:

```bash
# 1. TDX nightly config push (public GCS bucket)
curl -s https://storage.googleapis.com/twurl/twurl.rsc -o twurl.rsc
wc -l twurl.rsc                      # 1049 lines, ver 2026.07.15-wlupdate
grep -c "walled-garden" twurl.rsc    # ~1032 — confirms walled-garden-only
# ad-host fingerprint inventory:
grep -oE 'dst-host=[a-zA-Z0-9._*-]+' twurl.rsc | sed 's/dst-host=//' | sort -u | \
  grep -iE 'syndication|doubleclick|2mdn|admanager|adx|adservice|googletag|adtrafficquality|pubmatic|smaato|rtbhouse|iponweb|adsafe|quantc|krxd|gorite|gdt|thinkwifi|cookiebot|identitytoolkit|run.app'

# 2. Egress ownership (from ruijie_device_cache WAN IPs)
whois 41.198.151.153   # Echotel Pty Ltd / ECHO ISP, 41.198.128.0/18, AS327693 (9 clinics — fixed uplink)
whois 41.123.42.152    # MTNSA Mobile Broadband (12 clinics — LTE/CGNAT)

# 3. Live PPPoE sessions for the Echo clinics (framed/NAS IP) — creds in .env, NOT .env.local
#    Interstellio client: getSubscriber(uuid) + listSessions(uuid) by stored interstellio_uuid.
#    (listSubscribers({username:'CT-UNJ'}) filter returns 0 — a filter-format quirk.)
```

Config-script topology reference (`.docs/Mikrotik Router Config Script-v2026.02 …csv`): VLAN10 clinic (192.168.10.0/24), VLAN20 hotspot (192.168.77.0/24), Reyee AP mgmt (192.168.250.0/30), hotspot RADIUS `34.79.51.25`, L2TP to `34.35.85.28`.

> **Security note (tracked separately, not detailed here):** the config-script CSV contains plaintext credentials and is in git history. Rotation is tracked in the `mikrotik-access-state` memory, not this document.
