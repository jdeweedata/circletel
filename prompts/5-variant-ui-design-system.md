# 5-Variant UI Design Prompt System

Generate 5 distinct UI designs for rapid A/B comparison. Adapt the master formula for **Marketing Pages** (conversion-focused) or **App Dashboards** (utility-focused).

---

## The Master Formula

```markdown
I am building a **[APP TYPE]** named **[NAME]**. It is a **[DESCRIPTION]**.

**Tech Stack:** React/Next.js with Tailwind CSS. TypeScript required.

Your task is to build a **[SPECIFIC UI COMPONENT]**. I want it to be **[DESIGN GOAL]**.

**CRITICAL REQUIREMENTS:**

1. Create five (5) different designs hosted on routes `/1`, `/2`, `/3`, `/4`, and `/5`.

2. Each design must **[VARIATION STRATEGY]**.

3. **Avoid these clichés:**
   - Glassmorphism with blurred backgrounds
   - Default Tailwind blue (#3B82F6)
   - Generic gradient blobs
   - Stock illustration styles (undraw, humaaans)
   - Excessive drop shadows on every element

4. **Accessibility:** All variants must meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for UI).

5. **Error Recovery:** If any route fails to render, regenerate that specific variant only.

Use /frontend-design to ensure production-grade implementation with exceptional attention to detail.
```

---

## Option 1: Marketing Page Prompt

*For landing pages, product sites, and public-facing content. Goal: **impact and conversion**.*

### Ready-to-Use Prompt

```markdown
I am building a **productivity mobile app** named **FlowState**. It is a **time-blocking tool that helps users enter deep work by blocking distractions and tracking focus sessions**.

**Tech Stack:** React/Next.js with Tailwind CSS. TypeScript required. Use Framer Motion for animations.

Your task is to build an **immersive marketing landing page** with hero, features, testimonials, and CTA sections. I want it to be **visually striking, emotionally resonant, and optimized for conversion**.

**CRITICAL REQUIREMENTS:**

1. Create five (5) different designs hosted on routes `/1`, `/2`, `/3`, `/4`, and `/5`.

2. Each design must explore a **completely different art direction**:
   - `/1`: **Minimalist** — generous whitespace, single accent color, typography-driven
   - `/2`: **Brutalist** — raw edges, monospace fonts, anti-design aesthetic
   - `/3`: **3D/Immersive** — depth, parallax, subtle 3D elements (CSS only, no WebGL)
   - `/4`: **Editorial/Magazine** — grid layouts, large imagery, sophisticated type hierarchy
   - `/5`: **Dark Mode Premium** — deep blacks, neon accents, luxury tech feel

3. **Avoid these clichés:**
   - Glassmorphism with blurred backgrounds
   - Default Tailwind blue (#3B82F6)
   - Generic gradient blobs or mesh gradients
   - Stock illustration styles (undraw, humaaans)
   - "Hero image left, text right" default layout on every variant

4. **Accessibility:** All variants must meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for UI).

5. **Conversion elements required:** Clear value prop above fold, social proof, urgency/scarcity where appropriate, single primary CTA per section.

6. **Error Recovery:** If any route fails to render, regenerate that specific variant only.

Use /frontend-design to ensure production-grade implementation with exceptional attention to detail.
```

---

## Option 2: Dashboard Prompt

*For admin panels, SaaS interfaces, and data-heavy views. Goal: **utility and information density**.*

### Ready-to-Use Prompt

```markdown
I am building a **server management SaaS** named **OpsControl**. It is a **comprehensive dashboard for DevOps engineers to monitor server health, view logs, manage deployments, and respond to incidents in real-time**.

**Tech Stack:** React/Next.js with Tailwind CSS. TypeScript required. Use Recharts or similar for data visualization.

Your task is to build the **main application dashboard view** showing server status, recent alerts, deployment history, and resource utilization. I want it to be **information-dense, scannable, and highly functional for power users who spend 8+ hours daily in the interface**.

**CRITICAL REQUIREMENTS:**

1. Create five (5) different designs hosted on routes `/1`, `/2`, `/3`, `/4`, and `/5`.

2. Each design must use a **different navigation and layout paradigm**:
   - `/1`: **Vertical Sidebar** — collapsible, icon+label, nested menu support
   - `/2`: **Horizontal Top Nav** — dropdown menus, breadcrumbs, tabs for sub-sections
   - `/3`: **Command-Palette Driven** — minimal chrome, ⌘K interface, keyboard-first navigation
   - `/4`: **Bento-Box Grid** — modular widgets, drag-to-reorder capability, customizable layout
   - `/5`: **Terminal/Bloomberg Style** — dark theme, monospace fonts, maximum data density, keyboard shortcuts displayed

3. **Avoid these clichés:**
   - Glassmorphism cards with excessive blur
   - Default Tailwind blue for all interactive elements
   - Oversized padding that wastes screen real estate
   - Decorative illustrations that don't convey data
   - Hiding critical info behind hover states

4. **Accessibility:** All variants must meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for UI). Keyboard navigation must work for all interactive elements.

5. **Power user features required:** Keyboard shortcuts visible, bulk actions available, density/compact mode toggle, persistent filters.

6. **Error Recovery:** If any route fails to render, regenerate that specific variant only.

Use /frontend-design to ensure production-grade implementation with exceptional attention to detail.
```

---

## Quick Reference: Variable Swap Guide

| Variable | Marketing (Conversion) | Dashboard (Utility) |
|----------|------------------------|---------------------|
| **[APP TYPE]** | Landing Page, Marketing Site, Portfolio | Admin Dashboard, SaaS Interface, Settings Panel |
| **[DESCRIPTION]** | Focus on *feeling* and *value proposition* | Focus on *data types* and *user workflows* |
| **[DESIGN GOAL]** | Striking, Emotional, Story-driven, Converting | Dense, Scannable, Frictionless, Keyboard-friendly |
| **[VARIATION STRATEGY]** | Change **Art Direction** (colors, typography, mood) | Change **UX Layout** (navigation, information hierarchy) |
| **Animation** | Encouraged (parallax, reveals, micro-interactions) | Minimal (only for state changes, loading) |
| **Whitespace** | Generous, dramatic | Efficient, purposeful |

---

## Workflow: Building a Complete App

Don't combine marketing + dashboard in one prompt. Use this sequence:

### Step 1: Establish Brand (Marketing First)
Run the Marketing prompt to generate 5 art directions. Pick the winner based on:
- Emotional resonance with target audience
- Distinctiveness from competitors
- Scalability of the visual system

### Step 2: Extract Design Tokens
From your winning marketing design, document:
- Primary, secondary, accent colors (hex values)
- Font families and scale
- Border radius values
- Shadow styles
- Spacing rhythm

### Step 3: Apply to Dashboard
Run the Dashboard prompt with this addition:

```markdown
**Brand Continuity:** Use the design tokens from Marketing Design #[X]:
- Colors: [list extracted colors]
- Typography: [list fonts]
- Border radius: [value]

Adapt these for a dense, functional dashboard while maintaining brand recognition.
```

### Step 4: Iterate
After selecting winners from both, you may need a refinement pass:

```markdown
Combine the navigation pattern from Dashboard #[X] with the color treatment from Dashboard #[Y]. Maintain the brand consistency from Marketing #[Z].
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| All 5 variants look too similar | Add: "Each variant must be immediately distinguishable in a 5-second glance test" |
| Too much visual noise | Add: "Limit accent color usage to 10% of surface area" |
| Variants ignore accessibility | Add: "Run axe-core audit. Fix all critical/serious issues before presenting" |
| One route fails to build | Regenerate only that route: "Route /3 failed. Regenerate /3 only with the same requirements" |
| Designs feel generic | Be more specific about anti-patterns to avoid for your industry |