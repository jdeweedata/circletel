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

### Admin Customers Area (learned 2026-06-10, dashboard redesign session)
- `GET /api/admin/customers` is now paginated/searchable (`q`, `filter=overdue|suspended|new`, `limit`, `offset`); returns `outstanding_balance`/`has_overdue` per row + global `stats`
- New endpoints: `[id]/summary` (balance, active service, last payment — fast aggregate) and `[id]/tickets` (Zoho Desk by customer email)
- **Latent bug**: `[id]/billing/route.ts` calls `auth.getUser()` on a service-role client → always 401, endpoint dead. Don't build on it; use `[id]/summary`
- **No package-change endpoint** — services routes are activate/cancel/reactivate/suspend only
- Zoho Desk: `listCustomerTickets(email)` in `lib/integrations/zoho/desk-service.ts`; `createZohoDeskService()` THROWS if `ZOHO_DESK_ORG_ID`/`ZOHO_ACCESS_TOKEN` missing — wrap in try/catch for graceful degradation
- `payment_transactions.status` success value is `'completed'` (check: pending/processing/completed/failed/refunded/cancelled)

### Backend UI Kit (staging commit 1fe59cf, 2026-06-10)
- `components/backend/` is the canonical kit: PageHeader, StatCard, StatusBadge, SectionCard, InfoRow, ConsoleTabs, Loading/Empty/ErrorState. `components/admin/shared/*` are now re-export shims
- Admin layout `<main>` already pads (`p-4 sm:p-6 lg:p-8`) — migrated pages use `space-y-6` container, NOT `container mx-auto py-8 px-4` (double padding)
- Spec: `docs/design/BACKEND_UI_KIT.md`

### Git/CI facts
- Pushing a feature branch to `staging` fails non-fast-forward if staging moved — merge `origin/staging` into the feature branch first, never force-push staging
- `vps-runner` (self-hosted) can sit ~9 min in queue before claiming a job — queued ≠ broken; check `runner_id: 0` on the job to confirm it's just lag
- UPDATE 2026-06-10 (later session work): change-package now EXISTS — `GET/POST /api/admin/customers/[id]/services/change-package` (GET lists active packages, POST applies + audits to `service_action_log` with upgrade/downgrade/edit). UI: `ChangePackageDialog` via summary strip. `customer_services` denormalizes package fields (package_name, service_type, monthly_price, speed_down/up) — keep in sync on package change. The `[id]/billing` route getUser bug is FIXED.
