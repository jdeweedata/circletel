#!/usr/bin/env python3
"""Generate CircleTel mockups using Gemini AI with organized folder structure."""

import os
from pathlib import Path
from datetime import datetime

from google import genai
from google.genai import types

# Initialize client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Base output directory
BASE_DIR = Path("/home/circletel/.design/mockups")


def generate_mockup(prompt: str, filename: str, folder: str, aspect_ratio: str = "16:9", resolution: str = "2K"):
    """Generate a single mockup image to the specified folder."""
    output_dir = BASE_DIR / folder
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / filename
    print(f"\n🎨 Generating: {folder}/{filename}")
    print(f"   Aspect: {aspect_ratio}, Resolution: {resolution}")

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size=resolution
                ),
            ),
        )

        for part in response.parts:
            if part.inline_data:
                image = part.as_image()
                image.save(str(output_path))
                print(f"   ✅ Saved: {output_path}")
                return str(output_path)
            elif part.text:
                print(f"   📝 Note: {part.text[:100]}...")

        print("   ⚠️ No image generated")
        return None

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None


# =============================================================================
# MOCKUP DEFINITIONS - Organized by folder structure
# =============================================================================

MOCKUPS = [
    # =========================================================================
    # HOMEPAGE v1
    # =========================================================================
    {
        "folder": "homepage/v1",
        "name": "desktop-hero.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI mockup of a modern ISP website homepage, desktop view, production-ready design.

HEADER:
- Clean white navigation bar at top
- Logo "CircleTel" on left (orange accent color #F5841E)
- Navigation links: Products, Business, Support
- Login button on right (ghost style)
- Subtle bottom border

HERO SECTION (main focus):
- Pure white background, generous whitespace
- Two equal-width cards side by side, centered
- LEFT CARD: "For Your Home" with house icon
  - Subtitle: "Fibre • 5G • LTE"
  - "From R299/month" price
  - Address input field with location pin icon
  - Orange "Check Coverage" button
- RIGHT CARD: "For Your Business" with building icon
  - Subtitle: "Enterprise connectivity"
  - "Tailored solutions" tagline
  - Address input field with location pin icon
  - Orange "Check Coverage" button
- Cards have subtle shadows, rounded corners (12px)
- Below cards: "99.9% Uptime • 24/7 Support • Local SA Team" trust badges

BELOW HERO:
- "Featured Deals" section with 4 product cards in a row
- Each card: product name, price, brief feature

Style: Clean minimalist design, lots of whitespace,
gray tones with orange (#F5841E) only for CTAs and accents,
modern SaaS interface, professional typography, Figma quality.
"""
    },
    {
        "folder": "homepage/v1",
        "name": "mobile-main.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI mockup of an ISP website homepage, iPhone 15 Pro dimensions.

HEADER:
- White background
- CircleTel logo (with orange accent)
- Hamburger menu icon on right

HERO (stacked layout for mobile):
- Large heading: "Get Connected"
- Subheading: "Fibre, 5G & LTE for home and business"

TWO STACKED CARDS:
- CARD 1 (top): "For Your Home"
  - House icon, "From R299/mo"
  - Address input field (full width)
  - Orange "Check Coverage" button (full width)

- CARD 2 (below): "For Your Business"
  - Building icon, "Custom solutions"
  - Address input field (full width)
  - Orange "Check Coverage" button (full width)

TRUST BADGES:
- Row of 3 small icons with labels
- "99.9% Uptime" | "24/7 Support" | "Local Team"

FEATURED DEAL BANNER:
- Horizontal scrollable card preview
- "5G 100Mbps - R599/mo"

Style: Clean mobile-first design, generous touch targets (48px min),
white background, orange #F5841E accents for CTAs only,
professional typography, App Store screenshot quality.
"""
    },
    {
        "folder": "homepage/v1",
        "name": "deals-section.jpg",
        "aspect_ratio": "21:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI mockup of a website deals/pricing cards section, wide banner format.

Section header: "Featured Deals" with "View All" link on right

FOUR PRODUCT CARDS in a row:
1. "5G 100Mbps" - R599/mo - "Uncapped" badge - Orange highlight border
2. "Fibre 50Mbps" - R449/mo - "Most Popular" badge
3. "LTE 20GB" - R399/mo - "Flexible" badge
4. "Business" - "From R899" - "SLA Included" badge

Each card:
- White background with subtle shadow
- Technology icon at top (5G, fiber, LTE, building)
- Product name in bold
- Price prominent
- Feature badge
- "Learn More" link at bottom

Style: Clean grid layout, consistent spacing, white cards on light gray background,
orange #F5841E for highlights and featured badges,
modern e-commerce card design, professional typography.
"""
    },

    # =========================================================================
    # HOMEPAGE v2 - Tabbed Design
    # =========================================================================
    {
        "folder": "homepage/v2-tabbed",
        "name": "desktop-business.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI wireframe mockup of a modern ISP website homepage, desktop view, Figma quality.

HEADER BAR:
- Clean white navigation bar
- Logo "CircleTel" on left with orange circle icon
- Nav links center: Products, Solutions, Support, About
- Right side: "Login" text link, orange "Get Started" button

HERO SECTION:
- Light gray background (#F8F9FA)
- Large headline: "Connect Your World"
- Subheadline: "Fast, reliable internet for every need"

TAB BAR (prominent, below headline):
- Three equal-width tabs in a pill-shaped container
- Tabs: "Business" | "SOHO" | "Home"
- Active tab (Business) has orange background (#F5841E), white text
- Inactive tabs have white background, gray text

ACTIVE TAB CONTENT (Business selected):
- White card with rounded corners (16px), subtle shadow
- Left side: Building icon, "Enterprise Solutions", "From R1,499/month"
- Right side: Address input, orange "Check Availability" button

TRUST INDICATORS:
- "99.9% SLA" | "24/7 Support" | "Local NOC" | "Same-day response"

BELOW: "Trusted by leading SA businesses" with company logos

Style: Clean wireframe aesthetic, professional B2B feel, orange accents only for CTAs.
"""
    },
    {
        "folder": "homepage/v2-tabbed",
        "name": "desktop-soho.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI wireframe mockup of ISP website homepage, desktop, SOHO tab active.

HEADER: CircleTel logo, nav links, Login, Get Started button

HERO:
- Light gray background
- Headline: "Connect Your World"

TAB BAR:
- Three tabs: "Business" | "SOHO" | "Home"
- SOHO tab is ACTIVE (orange background #F5841E, white text)

SOHO TAB CONTENT:
- White card with shadow
- Briefcase + house icon, "Small Office / Home Office"
- "Work from home • Video calls • Cloud backup"
- "From R599/month"
- Address input, orange "Check Availability" button

TRUST: "Zoom-ready speeds" | "Symmetric upload" | "Free router" | "No contracts"

PACKAGES: 3 cards showing SOHO 50/100/200Mbps options

Style: Clean, professional, work-from-home friendly aesthetic.
"""
    },
    {
        "folder": "homepage/v2-tabbed",
        "name": "desktop-home.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI wireframe mockup of ISP website homepage, desktop, Home tab active.

HEADER: CircleTel logo, nav, Login, Get Started

TAB BAR:
- Three tabs: "Business" | "SOHO" | "Home"
- HOME tab is ACTIVE (orange background, white text)

HOME TAB CONTENT:
- House icon, "Home Connectivity"
- "Streaming • Gaming • Smart home • Family WiFi"
- "From R299/month"
- Address input, orange "Check Coverage" button

TRUST: "Netflix-ready" | "Gaming ping <20ms" | "Free installation" | "Month-to-month"

FEATURED DEALS: 4 cards - Fibre 25/50Mbps, 5G 100Mbps, LTE Backup

Style: Friendly consumer feel, clean wireframe, orange accents.
"""
    },
    {
        "folder": "homepage/v2-tabbed/mobile-ux",
        "name": "1-top-tabs.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI wireframe, iPhone 15 Pro, ISP homepage with TOP TAB navigation.

HEADER: CircleTel logo, hamburger menu

TAB BAR (below header, sticky):
- Full-width pill container with 3 equal tabs
- "Business" | "SOHO" | "Home"
- Active tab (Home): orange background, white text
- 48px height touch targets

CONTENT (Home tab active):
- White card with house icon
- "Home Connectivity", "From R299/month"
- Address input, orange "Check Coverage" button

TRUST BADGES: "Free install" | "No contract" | "24/7 support"

ANNOTATION: "UX Option 1: Top Tabs - Familiar pattern, always visible"

Style: Clean mobile wireframe, iOS native feel, orange accents.
"""
    },
    {
        "folder": "homepage/v2-tabbed/mobile-ux",
        "name": "2-segmented.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI wireframe, iPhone 15 Pro, ISP homepage with iOS SEGMENTED CONTROL.

HEADER: CircleTel logo centered

HERO: "Get Connected" headline

SEGMENTED CONTROL (iOS style):
- Rounded rectangle container
- Three segments: "Home" | "SOHO" | "Business"
- Active segment (Home): white background, raised appearance

CONTENT CARD:
- House icon, "Home Internet"
- "From R299/mo"
- Address input, orange "Check Coverage" button

ANNOTATION: "UX Option 2: Segmented Control - iOS native, compact"

Style: Native iOS aesthetic, SF Pro typography, orange accents for CTA only.
"""
    },
    {
        "folder": "homepage/v2-tabbed/mobile-ux",
        "name": "3-swipeable.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI wireframe, iPhone 15 Pro, ISP homepage with SWIPEABLE CARDS carousel.

HEADER: CircleTel logo

HERO: "Find Your Perfect Plan" with "Swipe to explore" hint

SWIPEABLE CARDS CAROUSEL:
- FRONT CARD (Home - centered, full visible):
  - House icon, "Home Internet"
  - "From R299/month"
  - Address input, orange "Check Coverage" button
- SIDE CARDS (peeking from edges): SOHO and Business cards dimmed

PAGINATION DOTS: 3 dots, center filled orange

ANNOTATION: "UX Option 3: Swipeable Cards - Engaging, visual discovery"

Style: Modern app-like feel, card-based UI with depth, orange accents.
"""
    },
    {
        "folder": "homepage/v2-tabbed/mobile-ux",
        "name": "4-bottomsheet.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI wireframe, iPhone 15 Pro, ISP homepage with BOTTOM SHEET selector.

MAIN CONTENT:
- "Get Connected Today" headline
- Selector button showing current selection: "Home Internet" with chevron
- Card with plan details, address input, orange "Check Coverage" button

BOTTOM SHEET (shown as overlay, 40% up):
- Drag handle at top
- "Select your plan type" header
- Three large rows (60px+ each):
  1. Home - "Family internet" - Checkmark (selected)
  2. SOHO - "Work from home"
  3. Business - "Enterprise solutions"

ANNOTATION: "UX Option 4: Bottom Sheet - Clean main view, large touch targets"

Style: iOS bottom sheet pattern, clear hierarchy, orange selection indicator.
"""
    },
    {
        "folder": "homepage/v2-tabbed/mobile-ux",
        "name": "comparison.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
Comparison layout showing 4 mobile UX options side by side.

TITLE: "CircleTel Mobile UX Comparison"

FOUR IPHONE MOCKUPS in a row:
1. "TOP TABS" - Tab bar under header - Rating: 4 stars
2. "SEGMENTED" - iOS segmented control - Rating: 4 stars
3. "SWIPEABLE" - Card carousel - Rating: 3 stars
4. "BOTTOM SHEET" - Sheet selector - Rating: 5 stars

RECOMMENDATION: "Bottom Sheet - Best balance of clean UI + large touch targets"

Style: Clean comparison layout, professional presentation, consistent phone frames.
"""
    },

    # =========================================================================
    # COVERAGE RESULTS v3
    # =========================================================================
    {
        "folder": "coverage/v3",
        "name": "desktop-results.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI mockup of an ISP coverage results page, desktop view.

HEADER: CircleTel logo, nav, Login, Get Started

SUCCESS BANNER:
- Orange gradient (#F5841E to #FF9F43)
- Checkmark icon, "Great News! You're Covered"
- "5 packages available at your address"
- Address: "123 Main Street, Sandton, 2196"

FILTER BAR:
- Tabs: "All (5)" | "Fibre (2)" | "5G (2)" | "LTE (1)"
- Sort dropdown, Filter button

PACKAGE CARDS (3 columns):
- FEATURED: "RECOMMENDED" badge, MTN 5G 100Mbps, R599/mo, orange "Select" button
- Other cards: Fibre 50/100Mbps, LTE 50GB, 5G 50Mbps

TRUST: "Super-Fast Speeds" | "99.9% Uptime" | "24/7 Support"

HELP: Orange banner with WhatsApp "Chat with us"

Style: Clean e-commerce layout, orange accents, Figma quality.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "desktop-filters.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI mockup of ISP coverage results with FILTER PANEL open, desktop.

LAYOUT: Filter sidebar (25%) + Results grid (75%)

LEFT SIDEBAR:
- "Filter Packages" header with X close
- Connection Type: Fibre, 5G, LTE checkboxes
- Speed Range: 25-200Mbps slider
- Price Range: R299-R999 slider
- Features: Uncapped, No contract, Free installation
- Provider: MTN, Vumatel, Openserve
- Orange "Apply Filters" button, "Clear all" link

RIGHT: "3 packages match" with filtered cards

Style: Clean filter UI, touch-friendly checkboxes, orange accents.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "desktop-comparison.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI mockup of ISP package COMPARISON table, desktop.

PAGE HEADER: "Compare Packages" - "Comparing 3 packages"

TABLE (4 columns):
| Feature | 5G 100Mbps R599 | Fibre 50Mbps R449 | LTE 50GB R399 |
| Speed | 100 Mbps (best) | 50 Mbps | 50 Mbps |
| Data | Uncapped (best) | Uncapped | 50GB |
| Contract | None (best) | 12 months | None |
| Router | Included | R500 | Included |

Green checkmarks for best values, orange "Select" buttons

Style: Clean comparison table, clear winner indicators, orange CTAs.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "mobile-results.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI mockup of ISP coverage results, iPhone 15 Pro.

HEADER: Back arrow, "Coverage Results", Filter icon with badge

SUCCESS BANNER: Orange gradient, "You're Covered!", address, "5 packages"

TABS (horizontal scroll): "All (5)" | "Fibre (2)" | "5G (2)" | "LTE (1)"

PACKAGE CARDS (stacked):
- CARD 1: "RECOMMENDED", MTN 5G 100Mbps, R599/mo, feature pills, orange "Select"
- CARD 2: Fibre 50Mbps, R449/mo
- More cards below (scrollable)

STICKY BOTTOM: "Compare (0)" | "Filter" buttons

Style: Mobile-first, thumb-friendly, iOS native feel.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "mobile-filters.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI mockup with BOTTOM SHEET FILTERS open.

BACKGROUND: Dimmed results page

BOTTOM SHEET (70% of screen):
- Drag handle, "Filter Packages" header
- Connection Type: Chip buttons (Fibre, 5G, LTE)
- Speed: Segmented (Any, 50+, 100+, 200+)
- Price Range: Dual slider R299-R699
- Features: Toggle switches
- Provider: Horizontal chip scroll

BOTTOM: "Clear all" | Orange "Show 3 results" button

Style: iOS bottom sheet, large touch targets, orange selections.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "mobile-package-detail.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI mockup of package detail view, iPhone 15 Pro.

HEADER: Back arrow, "Package Details", heart icon

HERO: Light orange background, MTN 5G logo, "5G Home 100Mbps", "RECOMMENDED"

PRICE: "R599/month" large, "No contract - Cancel anytime"

SPEED: Circular gauge showing 100Mbps download, 50Mbps upload

FEATURES (white card):
- Uncapped data
- Free 5G router
- Self-install kit
- 24/7 support
- 14-day guarantee

WHAT'S INCLUDED: Equipment, Installation, Activation expandable rows

STICKY BOTTOM: "R599/mo" | Orange "Select This Package" button

Style: Clean product page, trust-building layout, mobile commerce best practices.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "no-results.jpg",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "prompt": """
High-fidelity UI mockup of ISP "No Coverage" results page, desktop.

CENTERED CONTENT:
- Friendly illustration: location pin with question mark
- "We're Not There Yet" headline
- "But we're expanding fast!" subheadline
- Address shown with "Change address" link

WAITLIST CARD:
- "Join the Waitlist"
- Email and phone inputs
- Orange "Join Waitlist" button

ALTERNATIVES:
- "LTE Backup - From R299"
- "Starlink - Coming soon"

TRUST: "10,000+ on waitlist" | "Average wait: 3-6 months"

Style: Friendly, action-oriented, maintains brand trust.
"""
    },
    {
        "folder": "coverage/v3",
        "name": "loading-skeleton.jpg",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "prompt": """
High-fidelity mobile UI mockup showing LOADING/SKELETON state.

HEADER: CircleTel logo, back arrow

LOADING BANNER:
- Gradient stripes (pulsing implied)
- "Checking coverage..."
- Spinner, address partial

SKELETON CARDS (3 visible):
- Gray placeholder rectangles for logo, title, price, features, button
- Shimmer effect implied
- Proper spacing maintained

PROGRESS: "Checking MTN..." or "Finding best packages..."

Style: Professional skeleton UI, smooth loading experience, modern app pattern.
"""
    },
]


def main():
    print("=" * 60)
    print("🎨 CircleTel Mockup Generator")
    print("=" * 60)
    print(f"Base: {BASE_DIR}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Mockups to generate: {len(MOCKUPS)}")

    results = []
    for mockup in MOCKUPS:
        path = generate_mockup(
            prompt=mockup["prompt"],
            filename=mockup["name"],
            folder=mockup["folder"],
            aspect_ratio=mockup.get("aspect_ratio", "16:9"),
            resolution=mockup.get("resolution", "2K")
        )
        results.append((f"{mockup['folder']}/{mockup['name']}", path))

    print("\n" + "=" * 60)
    print("📊 RESULTS")
    print("=" * 60)

    success = sum(1 for _, p in results if p)
    failed = len(results) - success

    for name, path in results:
        status = "✅" if path else "❌"
        print(f"  {status} {name}")

    print(f"\n📁 Output: {BASE_DIR}")
    print(f"✅ Success: {success} | ❌ Failed: {failed}")
    print("=" * 60)


if __name__ == "__main__":
    main()
