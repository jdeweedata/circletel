#!/usr/bin/env node

/**
 * CircleTel Hero Refinement — Gemini Image Generation
 * 
 * Uses the uploaded screenshot as a reference image and applies
 * the annotated design changes via Gemini 3.1 Flash Image Preview.
 * 
 * Usage:
 *   node scripts/refine-hero.js
 * 
 * Requires:
 *   - GEMINI_API_KEY in .env or environment
 *   - npm install @google/genai
 *   - The current homepage screenshot at wireframes/current-homepage.png
 */

const { GoogleGenAI } = require("@google/genai");
const fs = require("node:fs");
const path = require("node:path");

const MODEL = "gemini-3.1-flash-image-preview"; // Nano Banana 2 — best for UI refinement
const OUTPUT_DIR = path.join(process.cwd(), "wireframes");

// ─────────────────────────────────────────────
// PROMPTS — Each generates a different view
// ─────────────────────────────────────────────

const PROMPTS = {

  // ── PROMPT 1: Hero with Business tab active (matches screenshot + fixes) ──
  "hero-refined-business": `You are redesigning a section of an ISP website called CircleTel. I'm providing the current screenshot as reference. Generate a refined, high-fidelity UI mockup applying these SPECIFIC changes while keeping the overall layout and brand identity:

CHANGES TO APPLY:

1. SEGMENT TABS — Redesign the three tabs (Business, Work from Home, Home):
   - ACTIVE TAB (Business): Solid filled orange #E87A1E background, white text, rectangular shape with subtle rounded corners (8px radius), subtle shadow-sm, icon on the left (Building2 icon in white)
   - INACTIVE TABS (Work from Home, Home): Light grey background #F0F0F0, navy #1B2A4A text, rectangular shape with subtle rounded corners (8px radius), each with a left-aligned icon (Briefcase for WFH, Home for Home). On hover state, show one tab with a light orange tint #FDF2E9 to imply interactivity.
   - All three tabs same height (48px), evenly spaced in a centered row, with 8px gap between them
   - Each tab has: [icon] [label] — the icon is 20px, label is Manrope Medium (500) 15px

2. ADDRESS SEARCH BAR — Position ABOVE the text content, full width across the hero card:
   - LAYOUT CHANGE: The address bar should span the FULL WIDTH of the hero card, positioned ABOVE the two-column content (above "Enterprise Solutions" heading and all other text)
   - INPUT STYLING: Large input field (56px height), white background with subtle grey border #E5E7EB, rounded corners (12px), left-aligned map pin icon in orange #E87A1E, placeholder text "Enter your business address" in grey #7F8C8D, Manrope Medium (500) 16px. Add a subtle inner shadow for depth.
   - To the RIGHT of the input (same row): LARGE "Check Availability" orange #E87A1E button (200px width, 56px height matching input, Manrope SemiBold (600) 16px, white text, rounded 10px, shadow-md)
   - Below the input row: "Use my location" link with pin icon on left, AND "Can't find your address? Use our map" link on right, both in accessible orange #AE5B16
   - The two-column content (left: Enterprise Solutions text, right: trust badges/features) should appear BELOW the address bar section

KEEP UNCHANGED:
- Navigation bar at top (CircleTel logo, menu items, Request Quote + Customer Login buttons)
- "Fast, reliable internet for every need" subtitle text
- Segment content: Building icon, "Enterprise Solutions" heading, "Dedicated lines · SLA guarantee · 24/7 support" tags, "From R1,499/month" price (bold, largest text), "99.9% Uptime SLA" orange badge, "Fibre · 5G · LTE options available"
- Trust bar at bottom: "99.9% SLA · 24/7 Support · Local NOC · Same-day response" with icons
- WhatsApp green floating button (bottom right)
- Overall page background: light grey #F0F0F0
- Hero card: white background, rounded corners, subtle shadow

LAYOUT CHANGE:
- Address bar at TOP of hero card (full width)
- Segment content BELOW address bar (can be single column or two-column as needed)

BRAND COLORS (use precisely):
- Primary orange: #E87A1E (active tab, buttons, badges, icons)
- Accessible orange text: #AE5B16 (links on light backgrounds)
- Navy: #1B2A4A (headings, body text)
- Inactive tab background: #F0F0F0 (light grey)
- Tab hover: #FDF2E9 (light orange, show on ONE inactive tab to demonstrate hover)
- Grey: #7F8C8D (secondary text)
- Light grey page bg: #F0F0F0
- White: #FFFFFF (cards, inputs)

FONTS: Manrope throughout — SemiBold (600) for headings/tabs/buttons, Regular (400) for body text, Medium (500) for labels, Bold (700) for prices.

RENDER: Pixel-perfect, production-quality website screenshot at 1440px desktop width. This should look like a real website, not a wireframe. Crisp text, precise spacing, professional. Show the full hero section from nav bar to trust bar.`,

  // ── PROMPT 2: Hero with Home tab active + same fixes ──
  "hero-refined-home": `You are redesigning a section of an ISP website called CircleTel. I'm providing the current screenshot as reference. Generate a refined, high-fidelity UI mockup with the same nav bar and overall structure, but with the HOME TAB ACTIVE and these design changes:

CHANGES TO APPLY:

1. SEGMENT TABS:
   - "Home" tab is now ACTIVE: Solid orange #E87A1E background, white text, rectangular shape with subtle rounded corners (8px radius), Home icon in white
   - "Business" and "Work from Home" are INACTIVE: Light grey background #F0F0F0, navy text, rectangular shape with subtle rounded corners (8px radius), with their respective icons (Building2, Briefcase) in navy
   - Show "Work from Home" tab with a light orange hover tint #FDF2E9 to show interactivity

2. ADDRESS INPUT moved to TOP of right column (same change as before)

3. LEFT COLUMN content changes for Home tab:
   - Home icon (house) in orange #E87A1E, 40px
   - H2: "Home Connectivity" in navy #1B2A4A, Manrope SemiBold (600)
   - Tags: "Streaming · Gaming · Smart home · Family WiFi" in grey
   - Price: "From R299/month" — navy, Manrope Bold (700), LARGEST text element
   - Badge: "Netflix-ready" small orange pill
   - "Fibre · 5G · LTE options available" small grey text

4. ADDRESS SEARCH BAR — Position ABOVE the text content, full width:
   - LAYOUT CHANGE: Address bar spans FULL WIDTH of hero card, positioned ABOVE the segment content
   - Large input field (56px height) + "Check Availability" button (200px) on same row
   - Below: "Use my location" and "Use our map" links
   - The Home segment content (icon, heading, tags, price) appears BELOW the address bar

5. TRUST BAR changes for Home tab:
   - TV icon "Netflix-ready" · Gamepad "Gaming ping <20ms" · Wrench "Free installation" · Calendar "Month-to-month"

KEEP: Nav bar, page background, card layout, WhatsApp button, overall structure.

BRAND COLORS: #E87A1E (primary), #AE5B16 (accessible orange text), #1B2A4A (navy), #F0F0F0 (inactive tab bg + page bg), #FDF2E9 (tab hover), #7F8C8D (grey), #FFFFFF (card).

RENDER: Pixel-perfect production-quality website screenshot, 1440px desktop, real website appearance.`,

  // ── PROMPT 3: Mobile hero with tab fixes ──
  "hero-refined-mobile": `Generate a high-fidelity MOBILE UI mockup (375px width, iPhone frame) of the CircleTel homepage hero section with these specific design changes applied:

LAYOUT (375px, light grey #F0F0F0 background):

NAV: CircleTel logo left, small orange "Get Started" button + hamburger icon right. White background.

SUBTITLE: "Fast, reliable internet for every need" centered, grey #7F8C8D, 16px

SEGMENT TABS (key design change):
- Three tabs fitting on one row at 375px width
- ACTIVE TAB (Home): Solid orange #E87A1E background, white text, rectangular shape with subtle rounded corners (6px radius), Home icon
- INACTIVE TABS: Light grey #F0F0F0 background, navy #1B2A4A text, rectangular shape with subtle rounded corners (6px radius). On hover: light orange #FDF2E9.
- All tabs 44px height (touch-friendly), compact horizontal spacing
- Icons 16px on mobile, labels Manrope Medium (500) 13px

HERO CARD (full width minus 16px margins, white, rounded, shadow):
- STACKED single column layout:
  - ADDRESS INPUT (FIRST — at very top of card, before any text):
    - Full-width large input (52px height) with orange map pin icon left, placeholder "Enter your home address", white bg with subtle grey border, rounded 10px, inner shadow for depth
    - Full-width LARGE orange "Check Availability" button (48px height, shadow-md, Manrope SemiBold (600)) directly below input
    - "Use my location" link centered below button
  - Home icon orange, "Home Connectivity" heading navy bold (BELOW address section)
  - "Streaming · Gaming · Smart home" tags grey
  - "From R299/month" large bold navy
  - "Netflix-ready" orange badge pill
  - "Free installation · No contracts · Cancel anytime" microcopy

TRUST BAR (2×2 grid below card):
  "Netflix-ready" | "Gaming <20ms"
  "Free installation" | "Month-to-month"

WhatsApp green button floating bottom-right.

BRAND COLORS: #E87A1E (primary), #F0F0F0 (inactive tabs + page bg), #FDF2E9 (tab hover), #1B2A4A (navy), #7F8C8D (grey), #FFFFFF (card).
FONTS: Manrope throughout — SemiBold (600) headings, Regular (400) body.

RENDER: Pixel-perfect mobile UI in iPhone frame. Production-quality, crisp, realistic.`,

  // ── PROMPT 4: Tab states close-up (component detail) ──
  "tab-states-detail": `Generate a UI component detail sheet showing the CircleTel segment tab states. Clean white background, centered composition. Show exactly this:

THREE ROWS, each showing the tabs in a different configuration:

ROW 1 — "Business Active":
Three horizontal rectangular tabs with subtle rounded corners (8px radius):
[Business — ACTIVE: solid #E87A1E orange bg, white text, white Building2 icon, subtle shadow]
[Work from Home — INACTIVE: #F0F0F0 light grey bg, #1B2A4A navy text, navy Briefcase icon]
[Home — INACTIVE: #F0F0F0 light grey bg, navy text, navy Home icon]

ROW 2 — "Work from Home Active":
[Business — INACTIVE: #F0F0F0 light grey bg, navy text]
[Work from Home — ACTIVE: solid #E87A1E bg, white text, white Briefcase icon]
[Home — HOVER STATE: #FDF2E9 light orange bg, navy text — demonstrating hover]

ROW 3 — "Home Active":
[Business — INACTIVE: #F0F0F0 light grey bg]
[Work from Home — INACTIVE: #F0F0F0 light grey bg]
[Home — ACTIVE: solid #E87A1E bg, white text, white Home icon]

BELOW EACH ROW: Small label text identifying the state ("Business Active", "WFH Active + Home Hover", "Home Active")

Each tab: 48px height, rectangular shape with 8px rounded corners, 8px gap between tabs, Manrope Medium (500) 15px text, icon 20px left of label.

RENDER: Clean component spec sheet style. Sharp, vector-quality. Modern design system documentation aesthetic. White background. Aspect ratio 16:9.`,

};

// ─────────────────────────────────────────────
// GENERATOR
// ─────────────────────────────────────────────

async function generate(key, referenceImagePath) {
  const prompt = PROMPTS[key];
  if (!prompt) {
    console.error(`Unknown prompt key: ${key}`);
    console.log(`Available: ${Object.keys(PROMPTS).join(", ")}`);
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build content parts
  const contents = [{ text: prompt }];

  // If reference image exists, include it
  if (referenceImagePath && fs.existsSync(referenceImagePath)) {
    const imageData = fs.readFileSync(referenceImagePath);
    const base64Image = imageData.toString("base64");
    const ext = path.extname(referenceImagePath).toLowerCase();
    const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

    contents.push({
      inlineData: {
        mimeType,
        data: base64Image,
      },
    });
    console.log(`  📎 Reference image attached: ${referenceImagePath}`);
  }

  console.log(`  🎨 Generating: ${key}...`);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: key.includes("mobile") ? "9:16" : "16:9",
          imageSize: "2K",
        },
      },
    });

    if (!response.candidates?.[0]) {
      console.error(`  ❌ No response for ${key}`);
      return;
    }

    let imageCount = 0;
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        const notesPath = path.join(OUTPUT_DIR, `${key}-notes.txt`);
        fs.writeFileSync(notesPath, part.text);
        console.log(`  📝 ${notesPath}`);
      } else if (part.inlineData) {
        imageCount++;
        const filename = `${key}${imageCount > 1 ? `-${imageCount}` : ""}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(filepath, buffer);
        console.log(`  ✅ Saved: ${filepath}`);
      }
    }

    if (imageCount === 0) {
      console.log(`  ⚠️  No image generated. Check prompt or try again.`);
    }
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    if (err.message.includes("429")) {
      console.log("  ⏳ Rate limited — wait 60s and retry.");
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  let key = args[0] || "hero-refined-business";
  let refImage = args[1] || path.join(OUTPUT_DIR, "current-homepage.png");

  if (key === "--help") {
    console.log(`
Usage: node refine-hero.js [prompt-key] [reference-image-path]

Prompt keys:
  hero-refined-business  — Business tab active with tab + address bar fixes (default)
  hero-refined-home      — Home tab active with same fixes
  hero-refined-mobile    — Mobile version with fixes
  tab-states-detail      — Component spec sheet of all tab states

  all                    — Generate all variants

Examples:
  node refine-hero.js hero-refined-business wireframes/current-homepage.png
  node refine-hero.js all
  node refine-hero.js tab-states-detail
    `);
    process.exit(0);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (key === "all") {
    for (const k of Object.keys(PROMPTS)) {
      // Only attach reference image for hero refinements, not the tab detail sheet
      const useRef = k !== "tab-states-detail" ? refImage : null;
      await generate(k, useRef);
      console.log("  ⏳ Waiting 8s...\n");
      await new Promise((r) => setTimeout(r, 8000));
    }
  } else {
    const useRef = key !== "tab-states-detail" ? refImage : null;
    await generate(key, useRef);
  }
}

main().catch(console.error);
