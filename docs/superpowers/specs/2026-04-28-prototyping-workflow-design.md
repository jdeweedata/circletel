# Design Spec: CircleTel Prototyping Workflow

**Date**: 2026-04-28
**Status**: Approved
**Scope**: Three-tool visual prototyping workflow for new and existing product pages

---

## Overview

A local-first prototyping workflow that runs before any Next.js implementation begins. Three tools cover distinct roles: open-design for full-page visual direction, Stitch MCP for component-level screen generation, and shadcn MCP for accurate component APIs during coding. The workflow slots into the existing brainstorming → spec → plan → implement pipeline — the HTML prototype becomes a visual artifact attached to the spec.

**Trial run**: The `/entertainment` page is used as the learning exercise. Output has no implementation pressure — the goal is to learn the brief-writing and tool-switching loop.

---

## Architecture

### New Files

```
tools/
  README.md                          # "run pnpm dev inside open-design/ for prototyping"
  open-design/                       # gitignored — cloned from nexu-io/open-design

tools/open-design/design-systems/
  circletel.md                       # CircleTel brand context for the agent

docs/superpowers/specs/assets/       # HTML prototype exports live here
```

### Modified Files

```
.gitignore                           # Add: tools/open-design/
```

### No Changes To

- `package.json` — open-design is fully isolated
- `next.config.js` — no build integration
- Any existing CircleTel source files

---

## Tool Roles

| Tool | Role | Trigger |
|------|------|---------|
| **open-design** (`localhost:5173` — Vite default, increments if port is occupied) | Full-page HTML prototype — layout, hierarchy, visual direction | Start of any new page |
| **Stitch MCP** | Screen and component variant generation | After layout direction confirmed |
| **shadcn MCP** (`npx shadcn@latest mcp`) | Accurate component APIs, prop names, install commands | During Next.js implementation |

Both Stitch MCP and shadcn MCP are already configured in `.mcp.json` — no additional setup required.

---

## CircleTel Design System (`circletel.md`)

Placed in `tools/open-design/design-systems/circletel.md`. Loaded by the open-design agent before every prototype generation.

### Brand Tokens

| Token | Value |
|-------|-------|
| Primary (Navy) | `#1B2A4A` |
| Accent (Orange) | `#F5831F` |
| Background | `#FFFFFF` (white), `#F8FAFC` (slate) |
| Text | `#0F172A` (slate-900) |
| Border radius | `0.5rem` |
| Font | System sans-serif (Tailwind default) |

### Component Patterns

- **Primary CTA**: Orange filled button (`bg-[#F5831F]`) — always "Check Coverage" or "Get Started"
- **Secondary CTA**: White outline button — always "WhatsApp Us" with icon
- **Hero**: Navy background (`#1B2A4A`), white text, 2-column split (copy left, image right)
- **Cards**: White background, slate border, rounded-lg, subtle shadow
- **Badges**: Orange background, white text, small pill — "Most Popular", "New"
- **Section spacing**: `py-16 md:py-24` pattern throughout

### Brand Voice

- "No lock-in contracts"
- "Local support"
- "Fast installation"
- South African residential and B2B audience
- Pricing always in Rands (R), VAT-inclusive

### Key Conversion Actions

1. **Check Coverage** → routes into `/packages/[leadId]` order flow
2. **WhatsApp Us** → `https://wa.me/27824873900`

### shadcn/ui Component Vocabulary

Prototypes should reference these component names (already installed in CircleTel):
`Button`, `Badge`, `Card`, `CardHeader`, `CardContent`, `Dialog`, `Input`, `Select`, `Tabs`, `Separator`, `Sheet`, `Tooltip`

---

## Skill-to-Page-Type Mapping

| open-design Skill | CircleTel Page Type |
|-------------------|---------------------|
| `web-prototype` | Entertainment, campaign, one-off landing pages |
| `saas-landing` | Partner landing, business landing (`/become-a-partner`, `/business/mobile`) |
| `pricing-page` | Package/plan pages (`/packages`, product pricing sections) |
| `dashboard` | Admin pages, partner dashboard, customer dashboard |
| `mobile-app` | Mobile-first flows (order flow, coverage check) |
| `invoice` | Invoice PDF layout iteration |

---

## Workflow: New Product Page

```
1. open-design  → brief the agent with CircleTel design system selected
                  skill: web-prototype (or saas-landing / pricing-page)
                  output: sandboxed HTML preview (~60–90s)

2. Review       → check layout, hierarchy, conversion flow in iframe
                  export HTML → save to docs/superpowers/specs/assets/

3. Stitch MCP   → generate component variants for key sections
                  (hero, pricing card, CTA block, feature grid)

4. Spec         → write design spec with HTML export as visual reference
                  path: docs/superpowers/specs/YYYY-MM-DD-<page>-design.md

5. Plan         → invoke superpowers:writing-plans
                  implementation targets confirmed against prototype

6. shadcn MCP   → accurate component APIs during Next.js coding
                  (prop names, install commands, block generation)
```

## Workflow: Existing Sanity CMS Product Page Improvements

```
1. Stitch MCP   → generate section-level variants (skip full-page prototype)
2. Spec update  → document the specific section being changed
3. shadcn MCP   → component APIs during implementation
```

---

## Trial Run: Entertainment Page

**Goal**: Learn the brief-writing and tool-switching loop — no implementation changes required.

**Steps**:
1. Install open-design: `git clone https://github.com/nexu-io/open-design tools/open-design`
2. `cd tools/open-design && pnpm install`
3. `pnpm dev` → open `localhost:5173`
4. Select skill: `web-prototype`
5. Select design system: `circletel`
6. Brief: _"Entertainment bundle landing page for South African ISP. Hero: navy background, headline 'Stream Everything. Pay Less.', orange CTA 'Check Coverage', secondary CTA 'WhatsApp Us'. Below hero: 3-column grid of device+internet bundle cards (Mecool Android TV devices bundled with LTE/5G plans from R499/mo). Each card shows device name, speed, monthly price, 3 feature bullets. Page ends with a coverage check CTA section."_
7. Review iframe output, export HTML
8. Save to `docs/superpowers/specs/assets/2026-04-28-entertainment-prototype.html`

**Success criteria**: Agent produces on-brand output without being corrected on colours, CTAs, or component vocabulary.

---

## Setup Checklist

- [ ] `git clone https://github.com/nexu-io/open-design tools/open-design`
- [ ] Add `tools/open-design/` to `.gitignore`
- [ ] `cd tools/open-design && pnpm install`
- [ ] Create `tools/open-design/design-systems/circletel.md`
- [ ] Create `tools/README.md`
- [ ] Create `docs/superpowers/specs/assets/` directory
- [ ] Run trial: entertainment page brief
- [ ] Export HTML → `docs/superpowers/specs/assets/2026-04-28-entertainment-prototype.html`

---

## Out of Scope

- No integration between open-design and CircleTel's Next.js build
- No automatic component generation — prototypes are reference artifacts, not production code
- No CI/CD for open-design — developer tool only
