# Agent Context — What AI Agents Know About CircleTel

This file captures project-specific knowledge that AI agents accumulate while working in this codebase. It supplements the human-written files (CLAUDE.md, AGENTS.md, client-context.md) with agent-discovered facts.

## Codebase Facts

### File Locations
- Project root: `/home/circletel`
- AGENTS.md: project root (Hermes context)
- CLAUDE.md: project root (Claude Code context)
- DESIGN.md: project root (design system)
- Architecture docs: `docs/architecture/SYSTEM_OVERVIEW.md`
- Rules: `.claude/rules/` (19 files)
- DB migrations: `supabase/migrations/`
- Product docs: `products/wholesale/dfa/` (DFA pricing and products)
- Plans: `docs/plans/`

### Key Commands
- `npm run dev:memory` — dev server (8GB heap)
- `npm run type-check:memory` — type check (4GB heap)
- `npm run build:memory` — production build (8GB heap)
- Scripts needing .env.local: `set -a && source .env.local && set +a && npx tsx scripts/...`

### Stack
- Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui
- Supabase/PostgreSQL with PostGIS
- Zustand, TanStack Query
- Integrations: MTN coverage APIs, Google Maps, Netcash payments, Zoho, Resend, Strapi CMS

### Database
- Supabase project: `agyjovdugmtopasyvlng`
- Invoice table: `customer_invoices` (NOT `invoices`)
- Key tables: `service_packages`, `coverage_leads`, `customers`, `consumer_orders`, `admin_users`

## Discovered Quirks

_Add quirks as they're discovered — things that would trip up the next agent._

Format:
```
### YYYY-MM-DD: Quirk
- **What:** Description of the unexpected behavior
- **Why:** Root cause if known
- **Workaround:** How to handle it
```

## Agent-Discovered Patterns

_Patterns discovered by agents while working in this codebase._

Format:
```

### 2026-06-16: SkyFibre Combined Orderability Gate
- **Context:** SkyFibre checkout must not rely on Tarana/TCS coverage alone because MTN CSP can reject otherwise covered addresses.
- **Pattern:** Use `POST /api/coverage/skyfibre/orderability` or `lib/coverage/skyfibre/checkSkyFibreOrderability` to combine TCS BN/RN evidence with MTN CSP orderability. CSP credentials must come from `MTN_CSP_USERNAME`, `MTN_CSP_PASSWORD`, and optional `MTN_CSP_API_BASE`.
- **Discovered by:** Codex
- **Notes:** 50/100 Mbps use CSP `feasibilityOld`; 200 Mbps uses `feasibilityCheck`. Active BN with zero active RN evidence downgrades confidence to manual review. Checkout and `/api/orders/create` both gate SkyFibre order creation on final `decision === 'orderable'`.
- **Admin UI:** `/admin/coverage/checker` now includes a SkyFibre Orderability card under Tarana results and auto-runs the combined gate at 100 Mbps after each Tarana address check. Admins can still switch to 50/100/200 Mbps and re-run manually. `/admin/sales/feasibility` single-site review also shows the same card for selected SkyFibre/Tarana packages. Both call the combined endpoint with `segment: "business"` for MTN CSP validation.
### YYYY-MM-DD: Pattern
- **Context:** When this applies
- **Pattern:** The approach that works
- **Discovered by:** Hermes / Claude Code
```

## Known State (updated 2026-05-24)

### DFA Integration
- CircleTel has active DFA reseller agreement
- **GNNI at Teraco data centres** — NOT at a customer building
  - Teraco JB1 (Isando, Johannesburg): cross-connect Echo SP Cabinet J_CH1_CAR065 → MTN Cabinet J_CH5_D16, 131.3m OS2 SM fibre, installed 14 Aug 2025
  - Teraco CT1 (Cape Town): cross-connect Echo SP Cabinet C_DC3_D02 → MTN, installed 15 Aug 2025
  - Echo SP provides Arista L2 switches (no PPPoE termination); MTN provides BNG (Huawei NE8000M14 JHB / S9312 CPT)
- **DFA Business Broadband GNNI**: 1Gbps, NRC R6,050 + MRC R898/mo, upgrade path to 10G (R12,000 NRC + R4,500/mo)
- **MTN FWB NNI** (separate): 2x 1Gbps ports, R7,000 NRC + R2,500 MRC each (includes 100Mbps backhaul)
- **BGP**: AS 327693 (CircleTel / Echo SP), sessions terminate on MTN BNG
- **IP pools**: JHB 100.66.160.0/20 (4,094 usable), CPT 100.66.176.0/20 (4,094 usable)
- **RADIUS/AAA**: 3 servers (102.220.62.161-163), realm circletel.co.za, proxy via echosp.link
- **VLANs**: AAA VLAN (RADIUS) + WWW/IP Transit VLAN (subscriber traffic)
- **Scale**: 1G GNNI supports ~100 subscribers; 10G upgrade at 100+ subs; IP Transit upgrade at 200+ subs
- 1 active broadband link (first customer)
- DFA GIS portal assessed — 49,531 addressable buildings nationally
- Near-Net buildings (21,830) are pre-qualified leads DFA has already surveyed
- Products: BizFibreConnect (25/50/100/200 Mbps)
- FY27 wholesale pricing effective 01 April 2026 — margins compressed
- Pricing review recommended: R1,999/R2,699/R3,299/R4,999

### Unjani
- 22 sites deployed (10 dead, 7 performing, 5 growing)
- R786.46/site OPEX
- Board-gated at 50 sites
- TDX 45-60 day payment lag
- See: `docs/plans/2026-05-24-mrr-growth-strategy.md`

### Financial Reality
- Cash: R86K, Burn: R198K/mo, Runway: 13 days
- Revenue: ~R35K/mo
- R463K intercompany receivables
- See: `memory-os/long-term/client-context.md`

### Team
- Jeffrey (MD, sole sales), TK (marketing), Tamsyn (back office), Jarryd (ops)
- No dedicated sales person — Jeffrey closes ~4/mo
