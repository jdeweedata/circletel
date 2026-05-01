# Prototyping Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install open-design as a local prototyping tool in `tools/open-design/`, configure it with CircleTel's brand, and complete a trial run using the entertainment page brief.

**Architecture:** open-design is cloned into `tools/open-design/` (gitignored), isolated from CircleTel's Next.js build entirely. A `circletel` design system file teaches the agent CircleTel's brand tokens and component vocabulary. The trial run validates the workflow produces on-brand HTML prototypes before using it on real new pages.

**Tech Stack:** open-design (Vite + React + Node daemon), npm, Claude Code (auto-detected by open-design daemon)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `.gitignore` | Exclude `tools/open-design/` from git |
| Create | `tools/README.md` | Quick reference for running open-design |
| Create | `docs/superpowers/specs/assets/.gitkeep` | Directory for HTML prototype exports |
| Clone | `tools/open-design/` | open-design repo (gitignored) |
| Create | `tools/open-design/design-systems/circletel/DESIGN.md` | CircleTel brand context for the agent |

---

## Task 1: Repo Structure Prep

**Files:**
- Modify: `.gitignore`
- Create: `tools/README.md`
- Create: `docs/superpowers/specs/assets/.gitkeep`

- [ ] **Step 1: Add `tools/open-design/` to `.gitignore`**

Open `.gitignore` and append at the end:

```
# Prototyping tool — local only
tools/open-design/
```

- [ ] **Step 2: Create `tools/README.md`**

```markdown
# Tools

Local developer tools — not part of the CircleTel build.

## open-design (Prototyping)

Visual prototyping tool. Run before implementing any new page.

```bash
cd tools/open-design
npm run dev:all
```

Opens at http://localhost:5173

**Skills to use per page type:**

| Page type | Skill |
|-----------|-------|
| Campaign / landing / one-off | `web-prototype` |
| Partner / business landing | `saas-landing` |
| Pricing / package pages | `pricing-page` |
| Admin / dashboard | `dashboard` |
| Mobile flows | `mobile-app` |
| Invoice PDF layout | `invoice` |

Always select **CircleTel** from the Design System dropdown.

**Export:** Click "Save to disk" → artifact lands in `.od/artifacts/`. Copy HTML to `docs/superpowers/specs/assets/` to attach to the spec.
```

- [ ] **Step 3: Create `docs/superpowers/specs/assets/.gitkeep`**

```bash
mkdir -p docs/superpowers/specs/assets
touch docs/superpowers/specs/assets/.gitkeep
```

- [ ] **Step 4: Verify `.gitignore` is correct**

```bash
git check-ignore -v tools/open-design
```

Expected output: `.gitignore:XX:tools/open-design/	tools/open-design`

- [ ] **Step 5: Commit**

```bash
git add .gitignore tools/README.md docs/superpowers/specs/assets/.gitkeep
git commit -m "chore: add prototyping workflow scaffold (open-design gitignored, specs/assets dir)"
```

---

## Task 2: Clone and Install open-design

**Files:**
- Clone: `tools/open-design/` (gitignored — not tracked by CircleTel)

- [ ] **Step 1: Clone the repo**

```bash
git clone https://github.com/nexu-io/open-design tools/open-design
```

Expected: repository clones successfully, `tools/open-design/` directory appears with `package.json`, `daemon/`, `src/`, `design-systems/` etc.

- [ ] **Step 2: Verify it is gitignored**

```bash
git status tools/
```

Expected: no output (directory is ignored). If `tools/open-design/` appears as untracked, recheck `.gitignore`.

- [ ] **Step 3: Install dependencies**

```bash
cd tools/open-design && npm install
```

Expected: dependencies install without errors. Node version 24 is required; CircleTel's Node v24.13.0 satisfies this.

- [ ] **Step 4: Verify Claude Code is detectable**

```bash
which claude
```

Expected: path to `claude` binary (e.g. `/usr/local/bin/claude`). open-design's daemon auto-detects it on PATH — no manual config needed.

---

## Task 3: Create CircleTel Design System

**Files:**
- Create: `tools/open-design/design-systems/circletel/DESIGN.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p tools/open-design/design-systems/circletel
```

- [ ] **Step 2: Create `DESIGN.md`**

```markdown
# CircleTel Design System

> Category: Telecommunications & ISP
> South African ISP. Navy-and-orange brand. Conversion-first layouts with coverage check as primary CTA.

## 1. Visual Theme & Atmosphere

CircleTel is a South African internet service provider targeting both residential consumers and B2B customers. The brand is built on trust and simplicity — a dark navy (`#1B2A4A`) communicates stability and reliability, while a punchy orange (`#F5831F`) signals energy and action. Every page pushes toward a single primary conversion: the coverage check.

Layouts are clean and direct. Heroes use the full navy background with white copy on the left and a product image on the right. Below the hero, content moves to white and light slate backgrounds. Cards are white with subtle borders. There is no illustration style — photography and product images carry the visual weight.

The brand voice is confident and benefit-led: "No lock-in contracts", "Local support", "Fast installation". Pricing is always shown in South African Rands (R), VAT-inclusive, with the monthly figure prominent.

**Key characteristics:**
- Navy hero sections (`#1B2A4A`) with white text — the signature surface
- Orange (`#F5831F`) reserved exclusively for primary CTAs and badges
- Two-column hero split: copy left, image or device right
- White card grids on slate backgrounds for feature/product sections
- WhatsApp as the secondary contact CTA (always paired with primary CTA)
- Pricing displayed as `R499/mo` format, VAT incl. always implied

## 2. Color Palette & Roles

### Primary
- **Navy** (`#1B2A4A`): The brand's primary background for heroes and nav. Used for: hero sections, navbar, footer, dark card backgrounds.
- **Orange** (`#F5831F`): The brand's accent and action colour. Used for: primary CTA buttons, badges ("Most Popular", "New"), pricing highlights, hover states on nav links.

### Surface & Background
- **White** (`#FFFFFF`): Default page and card background. Every section that follows the hero starts here.
- **Slate** (`#F8FAFC`): Subtle alternate section background. Used for alternating sections, feature grids, pricing rows.
- **Light Border** (`#E2E8F0`): Card borders, dividers, input borders.

### Text
- **Slate 900** (`#0F172A`): Primary body text. All headings and body copy on white/slate backgrounds.
- **Slate 600** (`#475569`): Secondary text. Subtitles, card descriptions, supporting copy.
- **White** (`#FFFFFF`): All text on navy backgrounds.
- **White/80** (`rgba(255,255,255,0.8)`): Supporting copy on navy hero — slightly muted to create hierarchy below the headline.

### Semantic
- **Success Green** (`#16A34A`): Feature check icons, "Available" status badges.
- **Warning Amber** (`#D97706`): "Limited availability" signals.
- **Error Red** (`#DC2626`): Form validation errors.

## 3. Typography Rules

### Font Family
System sans-serif stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

This is Tailwind CSS's default `font-sans` stack. No custom typeface — the brand identity comes from colour and layout, not typography.

### Hierarchy

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Hero Headline | 40–48px | 800 (extrabold) | Navy bg, white text, tight leading |
| Section Heading | 28–32px | 700 (bold) | On white bg, slate-900 text |
| Card Title | 18–20px | 600 (semibold) | Product/feature card headings |
| Body | 16px | 400 (regular) | Descriptions, supporting copy |
| Small / Caption | 14px | 400 | Metadata, footnotes, badge labels |
| Button | 14–16px | 600 (semibold) | All button labels |
| Price | 28–36px | 700 (bold) | Orange accent for monthly price |
| Price Unit | 16px | 400 | `/mo` suffix, muted colour |

### Principles
- **Extrabold for hero headlines only.** Everything below 28px uses 600 or 400.
- **Orange for price.** Monthly pricing figures use `#F5831F` to draw the eye.
- **No custom fonts.** System stack ensures fast load times on South African mobile networks.

## 4. Component Patterns

### Primary CTA Button
```
Background: #F5831F
Text: white, 600 weight
Padding: px-8 py-3 (large), px-6 py-2.5 (default)
Border radius: 0.5rem
Hover: darken to #EA7316
Label: "Check Coverage" (primary action) or "Get Started"
```

### Secondary CTA Button
```
Background: transparent
Border: 1px solid rgba(255,255,255,0.4) [on navy] or #E2E8F0 [on white]
Text: white [on navy] or slate-700 [on white], 600 weight
Icon: WhatsApp icon prepended
Label: "WhatsApp Us"
```

### Hero Section
```
Background: #1B2A4A (full width)
Layout: 2-column grid (copy left, image right) on md+; stacked on mobile
Left col: Badge → H1 → supporting copy → CTA row (primary + secondary)
Right col: rounded-2xl image container, object-cover
Padding: py-14 md:py-20
```

### Product / Bundle Card
```
Background: white
Border: 1px solid #E2E8F0
Border radius: 0.75rem (rounded-xl)
Shadow: subtle (shadow-sm)
Badge: absolute top-right, orange pill ("Most Popular")
Content: device/product name → speed/spec → price (large, orange) → feature bullets → CTA
```

### Feature / Benefit Badge
```
Background: #F5831F
Text: white, 600 weight, 12px
Padding: px-3 py-1.5
Border radius: 9999px (pill)
Example: "Most Popular", "New — Entertainment Bundles"
Icon: optional 14px icon prepended (PiSparkle etc.)
```

### Section CTA Banner
```
Background: #1B2A4A (navy, same as hero)
Layout: centered, headline + supporting copy + orange CTA button
Use: closes every page with a conversion push
Padding: py-16 md:py-20
```

## 5. Layout & Spacing

- **Container**: `container mx-auto px-4` — Tailwind default max-width with 16px mobile padding
- **Section padding**: `py-16 md:py-24` for major sections, `py-10 md:py-14` for tighter sections
- **Card grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Hero grid**: `grid grid-cols-1 md:grid-cols-2 gap-10 items-center`

## 6. Key Conversion Actions

Every page must include at least one of these, in priority order:

1. **Check Coverage** → primary orange CTA → opens coverage check modal or routes to `/`
2. **WhatsApp Us** → secondary outline CTA → `https://wa.me/27824873900`
   - WhatsApp message pre-fill: `"Hi, I'm interested in [product/bundle name]"`

## 7. shadcn/ui Component Vocabulary

All prototypes should use these component names — they are already installed in CircleTel:

`Button`, `Badge`, `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Dialog`, `DialogContent`, `Input`, `Select`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Separator`, `Sheet`, `Tooltip`, `TooltipContent`, `TooltipTrigger`

Reference icon library: `react-icons/pi` (Phosphor icons, `Pi` prefix). Common: `PiCheckBold`, `PiWhatsappLogoBold`, `PiSparkle`, `PiWifiHigh`, `PiDeviceMobile`.

## 8. Page Types & Skill Mapping

| CircleTel Page | open-design Skill |
|----------------|-------------------|
| Campaign / one-off landing (entertainment, switch-from-trusc) | `web-prototype` |
| Partner / business landing (`/become-a-partner`, `/business/mobile`) | `saas-landing` |
| Package / pricing pages | `pricing-page` |
| Admin dashboard sections | `dashboard` |
| Mobile order flow screens | `mobile-app` |
| Invoice / PDF layout | `invoice` |
| Locations / coverage pages | `saas-landing` |

## 9. Brand Voice Examples

Headline patterns that work:
- "Stream Everything. Pay Less." (benefit + value)
- "Fast Internet. No Lock-in." (feature + reassurance)
- "South Africa's Most Flexible ISP" (authority)
- "Connected Office from R294/mo" (product + price anchor)

Avoid:
- Technical jargon without explanation
- All-caps headlines
- Pricing without Rand symbol
- Lock-in language (always emphasise no lock-in)
```

- [ ] **Step 3: Verify the file is picked up by the daemon**

The daemon loads design systems from `design-systems/*/DESIGN.md`. Verify the path is correct:

```bash
ls tools/open-design/design-systems/circletel/DESIGN.md
```

Expected: file exists. The daemon will surface "CircleTel" in the Design System dropdown when started.

---

## Task 4: Start open-design and Verify CircleTel Design System

**Files:** None — verification only.

- [ ] **Step 1: Start the tool**

```bash
cd tools/open-design && npm run dev:all
```

Expected output (two lines confirming both processes):
```
[daemon] Listening on http://localhost:7456
[vite]  Local: http://localhost:5173
```

If port 5173 is occupied, Vite auto-increments to 5174 — check terminal output for the actual port.

- [ ] **Step 2: Confirm Claude Code is detected**

Open `http://localhost:5173`. The **Agent** dropdown at the top should show `Claude Code` (auto-detected from PATH). If it shows "no agents found", verify `which claude` returns a path.

- [ ] **Step 3: Confirm CircleTel design system appears**

Click the **Design System** dropdown. Scroll to find `CircleTel`. It should appear under a "Telecommunications" or uncategorised group (from the `Category:` line in `DESIGN.md`).

If it does not appear:
1. Check the daemon terminal for any load errors
2. Confirm `tools/open-design/design-systems/circletel/DESIGN.md` exists (not `.md.md`, not in wrong directory)
3. The daemon hot-reloads design systems — no restart needed after file changes

---

## Task 5: Trial Run — Entertainment Page Brief

**Files:**
- Create: `docs/superpowers/specs/assets/2026-04-28-entertainment-prototype.html`

This task is the learning objective. No code changes to CircleTel — output is a reference artifact only.

- [ ] **Step 1: Configure the session**

In the open-design UI at `http://localhost:5173`:
- **Agent**: Claude Code (should be pre-selected)
- **Skill**: `web-prototype`
- **Design System**: `CircleTel`

- [ ] **Step 2: Submit the entertainment page brief**

Paste this brief into the prompt field and click **Send**:

```
Entertainment bundle landing page for a South African ISP.

Structure:
1. Hero section: navy background, headline "Stream Everything. Pay Less.", supporting copy "Bundle a Mecool Android TV device with CircleTel internet from R499/mo. No lock-in contracts. Free delivery.", primary orange CTA "Check Coverage", secondary outline CTA "WhatsApp Us" with WhatsApp icon.

2. Bundle grid section: white background, heading "Choose Your Bundle", 3-column card grid. Each card shows: device name (e.g. "Mecool KM7 Plus"), device tagline ("Google TV Box"), internet speed badge (e.g. "25Mbps LTE"), monthly bundle price in large orange text (e.g. "R699/mo"), 3 feature bullets, orange "Check Coverage" CTA button. Include a "Most Popular" badge on one card.

3. Closing CTA section: navy background, centered, headline "Ready to Stream?", supporting copy "Check if CircleTel is available at your address.", orange "Check Coverage" button.

Use shadcn/ui component vocabulary: Card, CardContent, Badge, Button, Separator.
```

- [ ] **Step 3: Monitor generation**

The left pane streams the agent's output. Wait for the `<artifact>` tag to appear and the right pane iframe to render (typically 60–120 seconds).

**What good output looks like:**
- Navy hero with white headline and orange CTA
- 3 white cards on a light background, one with an orange "Most Popular" badge
- Large orange price figures
- Navy closing CTA section

**If output is off-brand** (wrong colours, wrong CTA text, no shadcn vocabulary):
1. Check the Design System dropdown still shows `CircleTel`
2. Try adding to the brief: "Use CircleTel brand: navy #1B2A4A hero, orange #F5831F CTAs"

- [ ] **Step 4: Export the HTML artifact**

Click **Save to disk** in the top-right of the preview pane.

The file saves to `tools/open-design/.od/artifacts/<timestamp>-<slug>/index.html`.

Find it:
```bash
ls tools/open-design/.od/artifacts/ | tail -1
```

- [ ] **Step 5: Copy to specs/assets**

```bash
# Replace <timestamp-slug> with the actual directory name from Step 4
cp tools/open-design/.od/artifacts/<timestamp-slug>/index.html \
   docs/superpowers/specs/assets/2026-04-28-entertainment-prototype.html
```

- [ ] **Step 6: Commit the prototype artifact**

```bash
git add docs/superpowers/specs/assets/2026-04-28-entertainment-prototype.html
git commit -m "docs: add entertainment page HTML prototype (open-design trial run)"
```

- [ ] **Step 7: Assess the trial**

Review the exported HTML in a browser:
```bash
open docs/superpowers/specs/assets/2026-04-28-entertainment-prototype.html
```

Ask yourself:
- Does the colour scheme match CircleTel (navy hero, orange CTAs)?
- Are the CTAs "Check Coverage" and "WhatsApp Us"?
- Does the card grid structure match what you'd implement in Next.js?
- Did the brief need corrections, and if so — what should be added to `circletel/DESIGN.md` to prevent that next time?

Update `tools/open-design/design-systems/circletel/DESIGN.md` with any corrections before using open-design on the next real page.

---

## Notes

- **open-design is not committed** — it lives only on the developer's local machine. Any team member who wants to use prototyping must clone it fresh: `git clone https://github.com/nexu-io/open-design tools/open-design && npm install`
- **`circletel/DESIGN.md` is not versioned** — it lives inside the gitignored `tools/open-design/` directory. If you update the brand context (new products, new components), update the file in your local clone. Consider keeping a canonical copy at `tools/open-design/design-systems/circletel/DESIGN.md` — this plan's Task 3 content is the source of truth.
- **Stitch MCP and shadcn MCP** are already configured in `.mcp.json` — no setup needed. Use them directly from Claude Code during implementation after the open-design prototype is approved.
