#!/usr/bin/env node

/**
 * CircleTel Homepage Wireframe Generator
 * 
 * Uses Gemini API (Nano Banana Pro) to generate high-fidelity UI wireframes
 * for each section of the homepage refactor.
 * 
 * Usage in Claude Code:
 *   node scripts/generate-wireframe.js --section hero --viewport desktop
 *   node scripts/generate-wireframe.js --section all --viewport desktop
 *   node scripts/generate-wireframe.js --section full-page --viewport mobile
 * 
 * Prerequisites:
 *   npm install @google/genai
 *   Set GEMINI_API_KEY in your .env or environment
 */

const { GoogleGenAI } = require("@google/genai");
const fs = require("node:fs");
const path = require("node:path");

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const MODEL = "gemini-2.5-flash-image"; // Use gemini-3-pro-image-preview for higher quality text rendering
const OUTPUT_DIR = path.join(process.cwd(), "wireframes");

const BRAND = {
  primary: "#E87A1E",
  primaryAccessible: "#AE5B16",
  primaryDark: "#C45A30",
  navy: "#1B2A4A",
  charcoal: "#2D3436",
  grey600: "#7F8C8D",
  grey200: "#F0F0F0",
  white: "#FFFFFF",
  success: "#27AE60",
  warning: "#F39C12",
  error: "#E74C3C",
  info: "#3498DB",
  headingFont: "Poppins",
  bodyFont: "Montserrat",
};

// Shared design system context injected into every prompt
const DESIGN_SYSTEM_CONTEXT = `
DESIGN SYSTEM (apply precisely):
- Brand: CircleTel — a South African ISP
- Primary orange: ${BRAND.primary} (buttons, icons, badges — NEVER as text on white)
- Accessible orange: ${BRAND.primaryAccessible} (for text on light backgrounds)
- Navy: ${BRAND.navy} (all headings, body text — replaces black)
- Charcoal: ${BRAND.charcoal} (footer background)
- Grey: ${BRAND.grey600} (secondary text, large only)
- Light grey: ${BRAND.grey200} (page background, alternating sections)
- White: ${BRAND.white} (cards, inputs)
- Success green: ${BRAND.success}
- Heading font: Poppins (bold, modern, geometric sans-serif)
- Body font: Montserrat (clean, readable sans-serif)
- Cards: white, rounded corners (8px), subtle shadow
- Buttons: rounded (8px), minimum 48px height, bold text
- Spacing: generous whitespace, 4px grid system
- Style: Clean, modern, professional — NOT startup-playful, NOT corporate-boring
- Think: Stripe meets a friendly ISP. Trustworthy but approachable.
`.trim();

// ─────────────────────────────────────────────
// SECTION PROMPTS
// ─────────────────────────────────────────────

const SECTIONS = {

  // ── NAVIGATION ──────────────────────────────
  "nav-desktop": {
    prompt: `Generate a high-fidelity UI mockup of a website navigation bar for "CircleTel" (a South African internet service provider).

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide):
- Full-width bar, white background, thin light grey bottom border
- LEFT: CircleTel logo (stylized text, the "Circle" part in navy, "Tel" in orange ${BRAND.primary})
- CENTER: Navigation links in navy ${BRAND.navy} text, Poppins font, medium weight:
  "Products" (with small dropdown chevron), "Solutions" (with dropdown chevron), "Pricing", "Support", "About"
- RIGHT: "Login" as a text link in navy, and "Get Started" as a solid orange ${BRAND.primary} button with white text, rounded corners, 48px height
- The nav has a subtle bottom shadow suggesting it's sticky

Show this as a pixel-perfect UI screenshot, not a wireframe sketch. It should look like a real website navigation. Crisp text, proper spacing, professional quality. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  "nav-mobile": {
    prompt: `Generate a high-fidelity UI mockup of a mobile website navigation for "CircleTel" (a South African ISP).

${DESIGN_SYSTEM_CONTEXT}

Show TWO states side by side on a light grey background:

STATE 1 — COLLAPSED (left side, 375px phone frame):
- White nav bar at top
- LEFT: CircleTel logo (small)
- RIGHT: Small orange "Get Started" button + hamburger menu icon (3 lines) in navy

STATE 2 — EXPANDED (right side, 375px phone frame):
- A slide-out panel from the right covering 80% of screen width
- White background, subtle shadow on left edge
- Top: "X" close button aligned right
- Navigation items stacked vertically, navy text, generous 48px row height:
  "Products" with expand arrow, "Solutions" with expand arrow, "Pricing", "Support", "About"
- Divider line
- Bottom: "Login" text link and small "Get Started" orange button

Show this as a realistic mobile UI screenshot. Crisp rendering, proper touch target sizes. Aspect ratio 9:16.`,
    aspectRatio: "9:16",
    resolution: "2K",
  },

  // ── HERO SECTION ────────────────────────────
  "hero-desktop": {
    prompt: `Generate a high-fidelity UI mockup of a homepage hero section for "CircleTel" (a South African ISP).

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, on light grey ${BRAND.grey200} background):

TOP:
- Centered H1: "Connect Your World" in navy ${BRAND.navy}, Poppins bold, very large (48-56px)
- Centered subtitle below: "Fast, reliable internet for every need" in grey ${BRAND.grey600}, Montserrat, 18px

SEGMENT TABS (centered, max-width ~800px):
- Three horizontal tab buttons in a row, pill-shaped group:
  LEFT: "Business" (inactive — transparent background, navy text)
  CENTER: "Work from Home" (inactive — transparent background, navy text) 
  RIGHT: "Home" (ACTIVE — solid orange ${BRAND.primary} background, white text, rounded)
- Each tab is ~48px tall with clean Poppins text

HERO CARD (centered below tabs, max-width ~1100px):
- White card, rounded corners, subtle shadow, generous padding
- SPLIT INTO TWO COLUMNS (60% left, 40% right):

  LEFT COLUMN:
  - Small home icon (simple line icon) in orange ${BRAND.primary}, 40px
  - H2: "Home Connectivity" in navy, Poppins semibold, 28px
  - Tags row: "Streaming · Gaming · Smart home · Family WiFi" in grey, small Montserrat
  - Large price: "From R299/month" in navy, Poppins bold, 36px (this is the LOUDEST element)
  - Small orange badge pill: "Netflix-ready" — orange background, white text, small rounded pill
  - Below price: "Fibre · 5G · LTE options available" in small grey text

  RIGHT COLUMN:
  - Address input field: tall input (48px), rounded, light border, with a small map pin icon on the left and placeholder text "Enter your home address"
  - Below input: solid orange button full-width: "Check Availability" with a small arrow icon, white text
  - Below button: small microcopy: "Free installation · No contracts · Cancel anytime" in grey, centered

TRUST BAR (below card, centered):
- Four items in a horizontal row with subtle vertical separators between them:
  "🖥 Netflix-ready" · "🎮 Gaming ping <20ms" · "🔧 Free installation" · "📅 Month-to-month"
  (use simple icons, navy text, small Montserrat, all on one line)

Render as a pixel-perfect UI screenshot that looks like a real, production-quality website. NOT a sketch or wireframe — this should look like a Figma export. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  "hero-mobile": {
    prompt: `Generate a high-fidelity UI mockup of a mobile homepage hero section for "CircleTel" (a South African ISP).

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (375px mobile, on light grey ${BRAND.grey200} background):

TOP:
- Centered H1: "Connect Your World" in navy ${BRAND.navy}, Poppins bold, 32px
- Centered subtitle: "Fast, reliable internet for every need" in grey, 16px

SEGMENT TABS:
- Three tabs fitting in one row at 375px, compact:
  "Business" | "Work from Home" | "Home" (ACTIVE — orange background, white text)
- Tabs are small enough to fit on one line, ~40px height

HERO CARD (full width with 16px side margins):
- White card, rounded corners, shadow
- STACKED LAYOUT (single column):
  - Home icon (orange) + "Home Connectivity" heading (navy, bold)
  - Tags: "Streaming · Gaming · Smart home" in grey
  - "From R299/month" large and bold in navy
  - Orange "Netflix-ready" badge pill
  - Full-width address input with map pin icon
  - Full-width orange "Check Availability" button
  - "Free installation · No contracts · Cancel anytime" microcopy

TRUST BAR (below card):
- 2x2 grid: four items in two rows of two
  "Netflix-ready" | "Gaming <20ms"
  "Free installation" | "Month-to-month"

Render as a realistic mobile UI screenshot in an iPhone frame. Crisp, production-quality. Aspect ratio 9:16.`,
    aspectRatio: "9:16",
    resolution: "2K",
  },

  "hero-business": {
    prompt: `Generate a high-fidelity UI mockup of the CircleTel homepage hero section with the BUSINESS tab active.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, light grey background):

TOP: "Connect Your World" heading centered, navy, bold. Subtitle below in grey.

TABS: Three tabs — "Business" is ACTIVE (orange background, white text), "Work from Home" and "Home" are inactive (transparent, navy text).

HERO CARD (white, shadowed, two columns):
  LEFT:
  - Building icon in orange, 40px
  - "Enterprise Solutions" in navy, bold, 28px
  - "Dedicated lines · SLA guarantee · 24/7 support" in grey
  - "From R1,499/month" — navy, bold, 36px (LOUDEST)
  - Badge: "99.9% Uptime SLA" in outlined orange pill
  - "Fibre · 5G · LTE options available" small grey

  RIGHT:
  - Address input: "Enter your business address" placeholder
  - Orange "Check Availability" button
  - "Free installation · No contracts · Cancel anytime"

TRUST BAR: "99.9% SLA" · "24/7 Support" · "Local NOC" · "Same-day response"

Pixel-perfect UI screenshot, production-quality website rendering. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  // ── PLAN CARDS ──────────────────────────────
  "plans-desktop": {
    prompt: `Generate a high-fidelity UI mockup of a pricing/plan cards section for "CircleTel" ISP homepage.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, white background):

SECTION HEADER:
- LEFT: H2 "Featured Home Deals" in navy, Poppins bold, 32px
- RIGHT: "View all plans →" as a link in accessible orange ${BRAND.primaryAccessible}

FOUR PLAN CARDS in a horizontal row (equal width, ~280px each, gap 24px):

CARD 1 — "Essential":
- White card, rounded, subtle shadow
- "Essential" in navy, Poppins semibold, 20px
- "R299/mo" in navy, Poppins bold, 32px (LOUDEST)
- "Fibre 25Mbps" in grey, small
- "Browsing & streaming for 1-2 people" in navy, small
- Secondary button: navy outlined border, "Learn More", full width

CARD 2 — "Family" (FEATURED — elevated):
- White card, rounded, STRONGER shadow, thin 2px orange ${BRAND.primary} border ring
- Slightly scaled up (2% larger than others)
- BADGE: "Most Popular" pill in orange background, white text, positioned overlapping top-right
- "Family" heading, "R399/mo" bold price, "Fibre 50Mbps", "Netflix on 3 screens + gaming"
- Secondary button: "Learn More"

CARD 3 — "Power Home":
- Standard card
- BADGE: "Uncapped" in outlined orange pill
- "R599/mo", "5G 100Mbps", "Whole-house coverage, work from home ready"
- Secondary button

CARD 4 — "Stay Connected":
- Standard card
- BADGE: "Loadshedding-proof" in green ${BRAND.success} background, white text
- "R199/mo", "LTE Backup", "Never lose internet during power cuts"
- Secondary button

The "Family" card should clearly stand out as the recommended option. Prices should be the visually loudest element on each card. Render as pixel-perfect UI, not a wireframe. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  "plans-mobile": {
    prompt: `Generate a high-fidelity UI mockup of a mobile pricing cards section for "CircleTel" ISP.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (375px mobile, white background):

HEADER: "Featured Home Deals" in navy bold, with "View all plans →" link below in orange.

PLAN CARDS — horizontal scrollable carousel (show 1.2 cards visible, suggesting scroll):
- The first card (Family, featured) is fully visible with a peek of the next card's edge
- "Family" card has orange border ring and "Most Popular" badge
- "R399/mo" is the loudest element
- Full-width "Learn More" button on each card

Below carousel: 4 small dots indicating scroll position (first dot filled orange, rest grey)

Show this in an iPhone frame. Realistic mobile UI screenshot. Aspect ratio 9:16.`,
    aspectRatio: "9:16",
    resolution: "2K",
  },

  // ── HOW IT WORKS ────────────────────────────
  "how-it-works": {
    prompt: `Generate a high-fidelity UI mockup of a "How It Works" section for CircleTel ISP homepage.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, light grey ${BRAND.grey200} background):

HEADING: "Get connected in 3 simple steps" — centered, navy, Poppins bold, 32px

THREE STEPS in a horizontal row, connected by a dashed line:

STEP 1:
- Orange circle with white "1" inside (48px circle)
- Map pin icon above in orange
- "Check your address" — navy, Poppins semibold, 20px
- "Enter your address to see which plans are available in your area." — grey, Montserrat, 14px

--- dashed connecting line (grey, horizontal) ---

STEP 2:
- Orange circle with white "2"
- Package icon above in orange
- "Choose your plan"
- "Pick the plan that fits your household or office. No contracts."

--- dashed connecting line ---

STEP 3:
- Orange circle with white "3"
- WiFi icon above in orange
- "We install, you connect"
- "Free professional installation within 7 days. Plug in and go."

BELOW: Centered orange "Check Availability" button

Clean, modern, professional. Pixel-perfect UI screenshot. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  // ── LOADSHEDDING ────────────────────────────
  "loadshedding": {
    prompt: `Generate a high-fidelity UI mockup of a "Loadshedding Resilience" section for CircleTel ISP homepage.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, DARK NAVY ${BRAND.navy} background):

LEFT COLUMN (60%):
- H2: "Stay online when the lights go out" — white text, Poppins bold, 32px
- Subtitle: "Loadshedding doesn't have to mean disconnection" — white/70% opacity

- Three feature rows, each with:
  FEATURE 1: Lightning bolt icon in orange ${BRAND.primary} | "LTE Backup from R199/mo" in white bold | "Automatic failover when power drops" in white/80%
  FEATURE 2: Battery icon in orange | "Battery-ready routers" in white bold | "Keep your connection alive" in white/80%
  FEATURE 3: Refresh icon in orange | "Instant switchover" in white bold | "No manual intervention needed" in white/80%

- White outlined button: "Add LTE Backup" with white border, white text
- Below button: "Works with any CircleTel plan" in white/60%

RIGHT COLUMN (40%):
- A rounded rectangle placeholder area with white/10% opacity background
- Suggesting where an illustration would go (subtle rounded box with a lightning bolt and router outline sketch in white/20%)

This section should feel authoritative and trustworthy — dark navy conveys reliability. The orange icons pop against the dark background. Pixel-perfect UI screenshot. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  // ── TESTIMONIALS ────────────────────────────
  "testimonials": {
    prompt: `Generate a high-fidelity UI mockup of a testimonials section for CircleTel ISP homepage.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, white background):

HEADING: "What our customers say" — centered, navy, Poppins bold, 32px

THREE TESTIMONIAL CARDS in a horizontal row (equal width, gap 24px):

CARD 1:
- White card, rounded, subtle shadow, generous padding (24px)
- Five star icons in a row, filled in yellow/amber ${BRAND.warning}
- Italic quote: "Finally, internet that just works. My kids game, I stream, my wife works — all at the same time." in navy, Montserrat, 14px
- Bottom: grey circle avatar placeholder (48px) + "Thandi M." in navy bold + "Sandton" in grey small

CARD 2:
- Same layout
- Five stars
- "I switched from a competitor after one too many dropped Zoom calls. CircleTel's symmetric upload is a game changer."
- "Sipho K." + "Cape Town"

CARD 3:
- Same layout
- Five stars
- "The SLA and same-day support response sold us. We haven't had a single outage in 8 months."
- "Naledi P." + "Pretoria"

TRUST METRICS BAR (centered below cards):
"10,000+ homes connected · 99.9% uptime · 4.7★ on Hellopeter" — in navy, Montserrat medium, with subtle separators

Clean, trustworthy feel. Pixel-perfect UI screenshot. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  // ── FAQ ─────────────────────────────────────
  "faq": {
    prompt: `Generate a high-fidelity UI mockup of an FAQ accordion section for CircleTel ISP homepage.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, light grey ${BRAND.grey200} background):

HEADING: "Frequently asked questions" — centered, navy, Poppins bold, 32px

FAQ ACCORDION (centered, max-width ~768px):
- 5 visible items, clean vertical stack

ITEM 1 (EXPANDED — showing answer):
- Question row: "How do I check if CircleTel is available at my address?" — navy, Poppins semibold, 16px
- RIGHT: chevron icon rotated upward (orange)
- Answer below: "Enter your address in our coverage checker at the top of this page. You'll see all available plans and technologies (Fibre, 5G, LTE) for your location within seconds." — navy, Montserrat, 14px, with slightly lighter weight
- Subtle top/bottom border separating items

ITEM 2 (COLLAPSED): "What happens during loadshedding?" — chevron pointing down (grey)
ITEM 3 (COLLAPSED): "Is there a contract or lock-in period?" — chevron down
ITEM 4 (COLLAPSED): "What speeds can I expect?" — chevron down
ITEM 5 (COLLAPSED): "How long does installation take?" — chevron down

BELOW: Centered text link "Show more questions ↓" in accessible orange ${BRAND.primaryAccessible}

Minimum 48px height per accordion row (touch-friendly). Clean, professional. Pixel-perfect UI screenshot. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  // ── FOOTER ──────────────────────────────────
  "footer": {
    prompt: `Generate a high-fidelity UI mockup of a website footer for CircleTel ISP.

${DESIGN_SYSTEM_CONTEXT}

LAYOUT (desktop, 1440px wide, charcoal/dark ${BRAND.charcoal} background):

FOUR COLUMNS (equal width, white text):

COLUMN 1:
- CircleTel logo (white version — "Circle" in white, "Tel" in orange ${BRAND.primary})
- Below: "Reliable connectivity for every need" in white/70%, small, Montserrat
- Social icons row: Facebook, X/Twitter, LinkedIn, Instagram — small circle icons in white/50%, 32px

COLUMN 2 — "Products":
- Column heading "Products" in white, Poppins semibold, small caps feel
- Links stacked: "Home Internet", "SOHO Internet", "Business Internet", "LTE Backup" — white/70%, Montserrat, 14px, generous line spacing

COLUMN 3 — "Company":
- "About", "Careers", "Press", "Contact" — same styling

COLUMN 4 — "Support":
- "Help Centre", "Coverage Map", "Report a Fault", "System Status"

BOTTOM BAR (full width, below columns):
- Thin white/10% top border
- "© 2026 CircleTel · Privacy Policy · Terms of Service · POPIA Compliance" — white/50%, small Montserrat

The footer should feel solid and professional. Pixel-perfect UI screenshot. Aspect ratio 16:9.`,
    aspectRatio: "16:9",
    resolution: "2K",
  },

  // ── FULL PAGE COMPOSITES ────────────────────
  "full-page-desktop": {
    prompt: `Generate a high-fidelity, full-length UI mockup showing the COMPLETE CircleTel homepage from top to bottom. This is a South African ISP website.

${DESIGN_SYSTEM_CONTEXT}

Show the ENTIRE page scrolled out as one tall image, with these sections stacked vertically:

1. NAVIGATION BAR: White, sticky — logo "CircleTel" left, nav links center (Products, Solutions, Pricing, Support, About), "Login" + orange "Get Started" button right.

2. HERO SECTION (light grey ${BRAND.grey200} background):
   - "Connect Your World" large heading centered
   - Three segment tabs: Business | Work from Home | [Home] (active, orange)
   - White hero card with two columns: left shows "Home Connectivity" details with "From R299/month" price, right shows address input + "Check Availability" orange button
   - Trust bar: four icons with labels below card

3. PLAN CARDS (white background):
   - "Featured Home Deals" heading with "View all plans →" link
   - Four plan cards in a row: Essential R299, Family R399 (featured, orange border), Power R599, Stay Connected R199

4. HOW IT WORKS (light grey background):
   - "Get connected in 3 simple steps"
   - Three steps with numbered circles connected by dashed line

5. LOADSHEDDING (dark navy ${BRAND.navy} background):
   - "Stay online when the lights go out" with orange icons and white text
   - Three feature rows on left, placeholder on right

6. TESTIMONIALS (white background):
   - "What our customers say" with three quote cards and star ratings

7. FAQ (light grey background):
   - Accordion with 5 questions, first one expanded

8. FOOTER (charcoal ${BRAND.charcoal} background):
   - Four columns: brand info, Products, Company, Support
   - Copyright bar at bottom

The backgrounds should alternate: grey → white → grey → navy → white → grey → charcoal. This creates a clear visual rhythm.

Render as one TALL continuous page screenshot. This should look like a real, professional, production-quality website — like a Dribbble or Behance showcase. Crisp text, proper spacing, modern aesthetic. Aspect ratio 9:16 (tall).`,
    aspectRatio: "9:16",
    resolution: "2K",
  },

  "full-page-mobile": {
    prompt: `Generate a high-fidelity mobile UI mockup showing the COMPLETE CircleTel homepage in an iPhone frame. South African ISP.

${DESIGN_SYSTEM_CONTEXT}

Show the page at 375px width with ALL sections stacked vertically:

1. NAV: Logo left, small orange button + hamburger right
2. HERO: "Connect Your World" (32px), three compact tabs, stacked card with price + address input + button
3. PLAN CARDS: Horizontal carousel showing 1.2 cards with scroll dots
4. HOW IT WORKS: Vertical steps (1, 2, 3) stacked, no connecting line
5. LOADSHEDDING: Navy section, stacked features, orange icons
6. TESTIMONIALS: Carousel with one card visible + dots
7. FAQ: Accordion, compact rows
8. FOOTER: Stacked columns
9. STICKY CTA BAR: Fixed at bottom — orange "Check Availability" full-width button with white shadow

Background alternation: grey → white → grey → navy → white → grey → charcoal

Render as a tall mobile screenshot. Production-quality mobile UI. Aspect ratio 9:16.`,
    aspectRatio: "9:16",
    resolution: "2K",
  },

};

// ─────────────────────────────────────────────
// GENERATOR
// ─────────────────────────────────────────────

async function generateWireframe(sectionKey) {
  const section = SECTIONS[sectionKey];
  if (!section) {
    console.error(`Unknown section: ${sectionKey}`);
    console.log(`Available sections: ${Object.keys(SECTIONS).join(", ")}`);
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set. Set it in your .env or environment.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`🎨 Generating: ${sectionKey}...`);

  try {
    const config = {
      responseModalities: ["TEXT", "IMAGE"],
    };

    // Add imageConfig for aspect ratio and resolution
    if (section.aspectRatio || section.resolution) {
      config.imageConfig = {};
      if (section.aspectRatio) config.imageConfig.aspectRatio = section.aspectRatio;
      if (section.resolution) config.imageConfig.imageSize = section.resolution;
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: section.prompt,
      config,
    });

    if (!response.candidates || !response.candidates[0]) {
      console.error(`❌ No response for ${sectionKey}`);
      return null;
    }

    let imageCount = 0;
    let textOutput = "";

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        textOutput += part.text + "\n";
      } else if (part.inlineData) {
        imageCount++;
        const filename = `${sectionKey}${imageCount > 1 ? `-${imageCount}` : ""}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(filepath, buffer);
        console.log(`  ✅ Saved: ${filepath}`);
      }
    }

    if (textOutput.trim()) {
      const notesPath = path.join(OUTPUT_DIR, `${sectionKey}-notes.txt`);
      fs.writeFileSync(notesPath, textOutput.trim());
      console.log(`  📝 Notes: ${notesPath}`);
    }

    if (imageCount === 0) {
      console.log(`  ⚠️  No image generated for ${sectionKey}. Text response:`);
      console.log(`  ${textOutput.trim().substring(0, 200)}`);
    }

    return imageCount;
  } catch (err) {
    console.error(`  ❌ Error generating ${sectionKey}:`, err.message);
    if (err.message.includes("429")) {
      console.log("  ⏳ Rate limited — waiting 60 seconds...");
      await new Promise((r) => setTimeout(r, 60000));
      return generateWireframe(sectionKey); // Retry once
    }
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse args
  let sectionArg = "all";
  let viewportArg = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--section" && args[i + 1]) sectionArg = args[i + 1];
    if (args[i] === "--viewport" && args[i + 1]) viewportArg = args[i + 1];
    if (args[i] === "--help") {
      console.log(`
CircleTel Wireframe Generator

Usage:
  node generate-wireframe.js --section <name> [--viewport <desktop|mobile>]

Sections:
  ${Object.keys(SECTIONS).join("\n  ")}

Special:
  --section all        Generate all sections
  --section full-page  Generate full-page composites only

Examples:
  node generate-wireframe.js --section hero-desktop
  node generate-wireframe.js --section all
  node generate-wireframe.js --section plans --viewport mobile
      `);
      process.exit(0);
    }
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Determine which sections to generate
  let sectionsToGenerate = [];

  if (sectionArg === "all") {
    sectionsToGenerate = Object.keys(SECTIONS);
  } else if (sectionArg === "full-page") {
    sectionsToGenerate = ["full-page-desktop", "full-page-mobile"];
  } else if (viewportArg) {
    // e.g., --section hero --viewport mobile → hero-mobile
    const key = `${sectionArg}-${viewportArg}`;
    if (SECTIONS[key]) {
      sectionsToGenerate = [key];
    } else {
      sectionsToGenerate = [sectionArg];
    }
  } else {
    // Direct section name
    if (SECTIONS[sectionArg]) {
      sectionsToGenerate = [sectionArg];
    } else {
      // Try matching prefix (e.g., "hero" → "hero-desktop", "hero-mobile")
      const matches = Object.keys(SECTIONS).filter((k) => k.startsWith(sectionArg));
      if (matches.length > 0) {
        sectionsToGenerate = matches;
      } else {
        console.error(`Unknown section: ${sectionArg}`);
        console.log(`Available: ${Object.keys(SECTIONS).join(", ")}`);
        process.exit(1);
      }
    }
  }

  console.log(`\n🚀 CircleTel Wireframe Generator`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Output: ${OUTPUT_DIR}`);
  console.log(`   Sections: ${sectionsToGenerate.length}\n`);

  let success = 0;
  let failed = 0;

  for (const section of sectionsToGenerate) {
    const result = await generateWireframe(section);
    if (result && result > 0) {
      success++;
    } else {
      failed++;
    }

    // Rate limit buffer between requests
    if (sectionsToGenerate.length > 1) {
      console.log("  ⏳ Waiting 6s (rate limit buffer)...\n");
      await new Promise((r) => setTimeout(r, 6000));
    }
  }

  console.log(`\n✅ Done. ${success} generated, ${failed} failed.`);
  console.log(`📁 Files in: ${OUTPUT_DIR}\n`);
}

main().catch(console.error);
