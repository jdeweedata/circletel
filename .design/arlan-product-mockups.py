#!/usr/bin/env python3
"""Generate CircleTel Arlan product page mockups using Gemini AI."""

import os
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
BASE_DIR = Path("/home/circletel/.design/mockups/arlan-products")

# CircleTel brand
# Primary orange: #E87A1E | Accessible orange text: #AE5B16
# Navy/dark: #111827 | White: #FFFFFF | Light gray bg: #F8F9FA
# Competitor intel: MTN = yellow+red pill buttons; Vodacom = red+teal pill buttons
# CircleTel differentiator: warmer, local, single-account, one-invoice

BRAND = """
CIRCLETEL BRAND:
- Primary orange: #E87A1E (buttons, badges, highlights)
- Dark orange hover: #C45A30
- Body text: #111827 (near-black)
- Secondary text: #6B7280 (gray)
- Background: #FFFFFF (main), #F8F9FA (section alternates)
- Navy accent: #1E293B (headers, dark sections)
- Font: Clean geometric sans-serif (Inter/Geist style)
- Buttons: pill-shaped (9999px radius), orange fill, white text
- Cards: white, 12px radius, subtle shadow (0 2px 8px rgba(0,0,0,0.08))
- Section padding: 80px top/bottom desktop, 48px mobile
LOGO: "CircleTel" wordmark with a small orange circle as the dot on the 'i'
TAGLINE: "Connecting Today, Creating Tomorrow"
QUALITY: Figma production design, pixel-perfect, real UI — not wireframe
"""

COMPETITOR_CONTEXT = """
COMPETITOR DESIGN PATTERNS (for reference — do better):
- MTN Business: Yellow card grid, filter tabs top, basic plan cards, dated feel
- Vodacom Business: Red hero banner, text-heavy, corporate/enterprise tone
- CircleTel advantage: Warmer SME tone, bundled value clear, single account, local support
"""

SHARED_NAV = """
TOP NAVIGATION:
- White background, 1px bottom border #E5E7EB
- Left: CircleTel logo (orange wordmark)
- Center: Products | Business | Support | About
- Right: WhatsApp button (green, 082 487 3900) | orange "Get Started" pill button
- Height: 64px, sticky
"""

SHARED_FOOTER = """
FOOTER (dark navy #1E293B):
- Logo, tagline, © 2026 CircleTel (Pty) Ltd
- Links: Products | Support | WhatsApp | Privacy
- Trust: "ICASA Licensed | MTN Authorised Reseller | New Generation Group"
"""


def generate(prompt: str, filename: str, aspect_ratio: str = "16:9", resolution: str = "2K"):
    output_dir = BASE_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    print(f"Generating: {filename} ({aspect_ratio}, {resolution})...")

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size=resolution,
                ),
            ),
        )
        for part in response.parts:
            if part.inline_data:
                img = part.as_image()
                img.save(str(output_path))
                print(f"  Saved: {output_path}")
                return filename, str(output_path)
            elif part.text and len(part.text) > 20:
                print(f"  Note: {part.text[:80]}")
        print(f"  No image for {filename}")
        return filename, None
    except Exception as e:
        print(f"  Error {filename}: {e}")
        return filename, None


MOCKUPS = [
    # ─────────────────────────────────────────────────────────────────────────
    # 1. ALL BUNDLES OVERVIEW PAGE (hero + 4 bundle cards)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "filename": "01-arlan-bundles-overview.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": f"""
High-fidelity desktop UI mockup of a product landing page for CircleTel's MTN Business bundles.
{BRAND}
{COMPETITOR_CONTEXT}
{SHARED_NAV}

HERO SECTION (full width, white background):
- Small eyebrow label: "MTN Business · Powered by CircleTel" (orange pill tag)
- Large heading (40px bold): "One Account. One Invoice. All Your Business Connectivity."
- Subheading (18px gray): "MTN Business contracts — managed by us, so you don't have to deal with the queue."
- Two CTAs side by side: Orange "Get a Quote" pill button | Ghost "Talk to Us on WhatsApp" with WhatsApp icon
- Hero right side: isometric illustration of office building with connected devices, phones, SIM cards — orange palette

BUNDLE CARDS GRID (4 cards, 2×2 grid, below hero on light gray #F8F9FA background):

CARD 1 — "Business Mobility Starter" (orange top border accent):
- Icon: smartphone with signal bars
- Badge: "VOLUME DRIVER" in orange
- Headline: "Upgrade your team's phones"
- Price: "From R455/mo" large, gray "per line" below
- Features (3 bullet checkmarks): MTN Business rates • Zero queue • 36-mo contract
- CTA: Orange "View Deals" button
- Sub-note: "~R87 commission/deal"

CARD 2 — "Connected Office" (highlighted "MOST POPULAR" ribbon):
- Icon: office building with WiFi signal
- Badge: "HIGH VALUE" in green
- Headline: "Internet + phones for 3–10 staff"
- Price: "From R1,269/mo" large, gray "3 lines combined" below
- Features: Free Tozed CPE • Single invoice • 24-month connectivity
- CTA: Orange "View Bundles" button
- Sub-note: "~R294/bundle/mo"

CARD 3 — "WorkConnect + Mobile":
- Icon: house + briefcase combo
- Badge: "CROSS-SELL" in blue
- Headline: "Your office internet + mobile"
- Price: "R1,800–R2,500/mo" combined
- Features: WorkConnect FWB internet • MTN mobile add-on • One account
- CTA: Orange "View Packages" button
- Sub-note: "~R635–R1,035/mo earned"

CARD 4 — "Fleet Connect":
- Icon: truck/van with location pin
- Badge: "IoT/M2M" in purple
- Headline: "Track your fleet, connect your sensors"
- Price: "From R375/mo" (5-SIM fleet)
- Features: IoT chip SIMs • Manager data SIM • MTN national coverage
- CTA: Orange "Get Fleet Quote" button
- Sub-note: "~R66–R120/SIM/mo"

TRUST STRIP (below cards, white background):
- 5 trust badges with icons: "MTN Authorised Reseller" | "ICASA Licensed" | "Zero CAPEX" | "One Invoice" | "Mon-Fri Support"

BOTTOM CALLOUT BANNER (navy #1E293B background):
- "Not sure which bundle fits your business?"
- Orange "WhatsApp 082 487 3900" button
- Small: "Mon–Fri 8am–5pm · contactus@circletel.co.za"

{SHARED_FOOTER}

STYLE REQUIREMENTS:
- Real production-quality UI (not wireframe)
- Generous whitespace, no clutter
- Orange used ONLY for CTAs, badges, accents — not overwhelming
- Clean card shadows, consistent 12px radius
- Professional B2B tone with local warmth
- Pixel-perfect, Figma-quality
"""
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 2. BUSINESS MOBILITY STARTER — Full product page
    # ─────────────────────────────────────────────────────────────────────────
    {
        "filename": "02-business-mobility-starter.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": f"""
High-fidelity MOBILE UI mockup (iPhone 15 Pro frame) of the CircleTel "Business Mobility Starter" product page.
{BRAND}
{SHARED_NAV}

HERO (white bg, top of page):
- Back arrow "<  Business Bundles"
- Orange eyebrow pill: "MTN Business Device Upgrade"
- Heading (28px bold): "Business Mobility Starter"
- Subheading: "Get your team on MTN Business rates — we handle everything"
- Price highlight: "From R455/mo per line" (large orange number)
- Orange pill CTA: "Get This Deal"
- Ghost CTA: "WhatsApp for a Quote"

WHAT YOU GET (white card, rounded):
- Section title: "What's Included"
- 5 rows with green checkmark icons:
  ✓ MTN Business device upgrade contract
  ✓ 36-month fixed term
  ✓ CircleTel manages the paperwork
  ✓ Single monthly invoice from CircleTel
  ✓ Mon-Fri business support

RECOMMENDED DEALS (gray background section):
- Section: "March 2026 Featured Deals"
- Small orange notice pill: "Prices valid — refresh before quoting"
- 5 deal rows (card per deal):
  [Vivo Y31 5G] MFB S+ · R455/mo · 36mo · 2.3GB data
  [Vivo V60 Lite 5G] MFB S+ · R535/mo · 36mo · 2.3GB
  [Samsung Galaxy A26 5G] MFB S+ · R525/mo · 36mo · 2.3GB
  [Oppo A5 Pro 4G] MFB M · R459–R509/mo · 36mo · 6.5GB
  [Oppo A6 Pro 5G] MFB L · R649–R759/mo · 36mo · 23GB
- Each row has device name, plan name, price, data amount, small "Select" link

HOW IT WORKS (3-step, icons):
1. Choose a device deal
2. We submit to Arlan
3. Device delivered in 2–5 days

WHO IT'S FOR (light orange bg card):
- "Perfect for:" tags: Professional services • Retail • Trades • Any SME

STICKY BOTTOM BAR:
- "From R455/mo" | Orange "Get Started" button (full width)

{SHARED_FOOTER}

MOBILE-SPECIFIC:
- Stacked single-column layout
- Large 48px touch targets
- Bottom safe area respected
- Thumb-friendly CTA at bottom
- iOS-native feel with custom CircleTel orange
"""
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 3. CONNECTED OFFICE — Desktop full page
    # ─────────────────────────────────────────────────────────────────────────
    {
        "filename": "03-connected-office.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": f"""
High-fidelity DESKTOP UI mockup of the CircleTel "Connected Office" product landing page.
{BRAND}
{COMPETITOR_CONTEXT}
{SHARED_NAV}

HERO (full width, white background):
- Left column (60%):
  - Orange pill eyebrow: "For 3–10 Staff · MTN Business"
  - H1 (42px bold): "One Bill. One Provider.\nOne Support Number."
  - Body: "Office internet + business phones for your whole team — managed by CircleTel."
  - Two CTAs: Orange "Get Connected Office" | Ghost WhatsApp icon "Chat with Us"
  - Trust badges below CTAs: "Free Tozed CPE included" · "Zero hardware cost" · "Single invoice"
- Right column (40%):
  - Clean illustration: modern office desk with a router/CPE, 2 smartphones, connected lines — orange/white palette
  - "Most Popular Bundle" badge in top-right of illustration

3-TIER PRICING (white background, 3 columns center):
Section header: "Choose Your Office Bundle"

COLUMN 1 — "Starter Office":
- Price: "~R1,269/mo" (3 lines)
- Shesha 10Mbps connectivity
- Free Tozed ZLT X100 Pro 5G CPE
- + 2× Vivo Y31 5G phones
- Data: 100GB+100GB bonus
- Orange "Select Starter" button

COLUMN 2 — "Standard Office" (HIGHLIGHTED, orange border, "Most Popular" badge):
- Price: "~R1,347/mo" (3 lines)
- Shesha 20Mbps connectivity
- Free Tozed ZLT X100 Pro 5G CPE
- + 2× Oppo A5 Pro 4G phones
- Data: 300GB+300GB bonus
- Orange "Select Standard" button (darker shade)

COLUMN 3 — "Premium Office":
- Price: "~R1,947/mo" (3 lines)
- 5G FWA 500GB
- Free Tozed ZLT X100 Pro 5G CPE
- + 2× Oppo A6 Pro 5G phones
- High-speed 5G connection
- Orange "Select Premium" button

HOW IT WORKS (gray section, 3-step horizontal):
Step 1 icon → "Sign 3 lines together" | Step 2 → "We order from Arlan" | Step 3 → "CPE + devices delivered"

WHY NOT MTN DIRECT? (navy background, white text, 3 comparison columns):
| | MTN Store | Vodacom | CircleTel |
|---|---|---|---|
| Queue time | 45-90 min | 45-90 min | Zero — we handle it |
| Single invoice | ❌ 3 bills | ❌ 3 bills | ✅ One invoice |
| Account manager | ❌ | ❌ | ✅ Named contact |
| Local support | ❌ Call centre | ❌ Call centre | ✅ WhatsApp 8am-5pm |

BOTTOM CTA BANNER (orange gradient):
- "Ready to connect your office?"
- White "WhatsApp 082 487 3900" button | White ghost "contactus@circletel.co.za"

{SHARED_FOOTER}
"""
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 4. FLEET CONNECT — Desktop
    # ─────────────────────────────────────────────────────────────────────────
    {
        "filename": "04-fleet-connect.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": f"""
High-fidelity DESKTOP UI mockup of the CircleTel "Fleet Connect" IoT/M2M product landing page.
{BRAND}
{SHARED_NAV}

HERO (navy #1E293B dark background, white text — contrast with competitors' boring white):
- Left side:
  - Orange pill eyebrow: "MTN IoT · M2M · Fleet"
  - H1 (42px bold, white): "Track Your Fleet.\nConnect Your Sensors."
  - Body (light gray): "MTN Business IoT SIMs for logistics, field services, and asset monitoring. Managed through CircleTel — one account, one invoice."
  - Orange "Get Fleet Quote" pill button | Ghost white "See SIM Pricing" button
  - Stats row (white text, orange numbers): "R6/SIM/mo starting" · "MTN National Coverage" · "5+ SIMs minimum"
- Right side:
  - Dark navy card with orange accent illustration: delivery truck outline + location pins + signal waves + SIM card chip icons, orange/white on navy

3 FLEET SIZES (white background, card grid):
Section: "Choose Your Fleet Size"

CARD 1 — "Starter Fleet (5 SIMs)":
- Icon: 5 truck dots
- Price: "~R375/mo" total
- 5× IoT chip SIMs at R6–R26/SIM
- 1× MFB Data+ XL manager SIM R345
- CircleTel earns: ~R72/mo
- Orange "Get Starter Quote" button

CARD 2 — "Mid Fleet (10 SIMs)" — highlighted with orange border:
- Icon: 10 truck dots
- Price: "~R495/mo" total
- 10× IoT SIMs avg R15/SIM
- 1× Manager SIM R345
- CircleTel earns: ~R90/mo
- Orange "Get Mid Quote" button

CARD 3 — "Large Fleet (20 SIMs)":
- Icon: 20 truck dots
- Price: "~R745/mo" total
- 20× IoT SIMs avg R20/SIM
- 1× Manager SIM R345
- CircleTel earns: ~R110/mo
- Orange "Get Large Quote" button

SIM SPECS (gray section, 2 columns):
Left column "IoT Chip SIM (CONSMD64K)":
- M2M certified chip format
- Data only (no voice/SMS)
- APN configuration supported
- Use for: trackers, sensors, vending, alarms

Right column "Manager Data SIM":
- MFB Data+ XL 30GB
- Supervisor handset / fleet modem
- Standard nano/micro SIM
- R325–R345/mo

USE CASES (light orange bg, 4 icon cards in a row):
🚛 Fleet Tracking | 📡 Remote Sensors | 🏪 Vending Machines | 🔒 Security Systems

HOW TO ORDER (3-step timeline):
1. "Tell us fleet size + APN requirements"
2. "We submit bulk order to Arlan"
3. "SIM cards couriered, bulk activation"

{SHARED_FOOTER}
"""
    },

    # ─────────────────────────────────────────────────────────────────────────
    # 5. DATA & CONNECTIVITY STANDALONE — Full page desktop
    # ─────────────────────────────────────────────────────────────────────────
    {
        "filename": "05-data-connectivity.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": f"""
High-fidelity DESKTOP UI mockup of the CircleTel "Data & Connectivity" product page for standalone MTN Business data plans.
{BRAND}
{SHARED_NAV}

HERO (white background):
- Orange eyebrow pill: "MTN Business Data · Fixed Wireless · Mobile"
- H1 (40px): "Business Internet Without the Fibre Wait"
- Subheading: "Fixed wireless, 5G, and uncapped data plans from MTN — set up in 2-5 days."
- CTA: Orange "Check Availability" | Ghost "Compare Plans"
- Stats row: "Free CPE on select plans" · "100GB–Uncapped" · "24-month contracts"

PLAN FILTER TABS (pill tabs, sticky below hero):
[ All Plans ] [ Shesha Fixed Speed ] [ 5G Uncapped ] [ Mobile Data SIMs ]

PLAN CARDS GRID (3 columns, gray section background):
Section: "All Data & Connectivity Plans"
Small notice: "⚠️ Prices from March 2026 promo sheet — verify before quoting"

ROW 1 (Shesha plans — teal/green accent):
CARD: "Shesha 10Mbps"
- Badge: "FREE CPE"
- Price: R359/mo · 24mo
- Data: 100GB + 100GB bonus
- Device: Tozed ZLT X100 Pro 5G (free)
- Best for: Small office backup
- Orange "Get This Plan" button

CARD: "Shesha 20Mbps" — POPULAR badge
- Price: R429/mo · 24mo
- Data: 300GB + 300GB bonus
- Device: Tozed ZLT X100 Pro 5G (free)
- Best for: Small office primary

CARD: "5G FWA 500GB"
- Badge: "FREE CPE"
- Price: R649/mo · 24mo
- Data: 500GB
- Device: Tozed ZLT X100 Pro 5G (free)
- Best for: Fixed wireless primary

ROW 2 (Uncapped 5G — blue accent):
CARD: "Uncapped 5G 35Mbps"
- Price: R489/mo · 24mo
- Data: 500GB FUP then throttle
- Device: Use your own CPE
- Best for: Medium office

CARD: "Uncapped 5G 60Mbps"
- Price: R709/mo · 24mo
- Data: 800GB FUP then throttle
- Best for: High-usage office

CARD: "Uncapped Wireless 50Mbps" — ZYXEL badge
- Price: R499/mo · 24mo
- Data: Uncapped (FUP applies)
- Device: ZYXEL Router (ICT delivery)
- Best for: ZYXEL infrastructure offices

ROW 3 (Mobile Data SIMs — purple accent):
CARD: "MFB Data+ XXL 50GB"
- Price: R459–R479/mo · 36mo
- Data: 50GB
- Device: MiFi included

CARD: "Data+ Pro 150GB Diamond"
- Price: R519–R579/mo · 24–36mo
- Data: 200GB
- Device: MiFi/CPE

IMPORTANT NOTICE (amber/orange card):
"⚠️ Important: 'Uncapped' plans are subject to Fair Usage Policy.
After data threshold, speeds are reduced. We disclose this in writing before every sale."

HOW TO CHOOSE (comparison table, white bg):
| | Shesha | 5G Uncapped | Mobile SIM |
| Best for | Office (fixed address) | Medium/heavy usage | Mobile workers |
| CPE | Free Tozed | Own device | MiFi included |
| Speed | Fixed 10-20Mbps | Up to 60Mbps | Varies (LTE/5G) |
| Coverage check | Required | Required | Always covered |

BOTTOM CTA (navy bg):
"Not sure which plan fits your office? Let us help."
Orange "WhatsApp for Recommendation" button

{SHARED_FOOTER}
"""
    },
]


def main():
    print("=" * 60)
    print("CircleTel Arlan Product Page Mockup Generator")
    print("=" * 60)
    print(f"Output: {BASE_DIR}")
    print(f"Generating {len(MOCKUPS)} mockups in parallel...\n")

    results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(
                generate,
                m["prompt"],
                m["filename"],
                m["aspect_ratio"],
                m["resolution"],
            ): m["filename"]
            for m in MOCKUPS
        }
        for future in as_completed(futures):
            name, path = future.result()
            results.append((name, path))
            status = "✅" if path else "❌"
            print(f"{status} {name}")

    print("\n" + "=" * 60)
    print("RESULTS")
    success = sum(1 for _, p in results if p)
    print(f"Success: {success}/{len(MOCKUPS)}")
    print(f"Files in: {BASE_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
