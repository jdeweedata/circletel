# Architectural & Business Decisions

> Long-term memory: Record every significant decision with reasoning so Claude never re-debates settled choices.

## Format
[YYYY-MM-DD] Decision Title
Context: Why this came up
Decision: What was chosen
Reasoning: Why this option won
Alternatives rejected: What was considered and discarded
Impact: What this affects going forward

---

### [2025-10-24] Database: Use `customer_invoices` not `invoices`
**Context**: Billing table naming caused confusion across multiple sessions
**Decision**: The canonical billing table is `customer_invoices` — never use `invoices`
**Reasoning**: `invoices` doesn't exist in the Supabase schema. Previous sessions wasted time debugging queries against the wrong table name.
**Alternatives rejected**: Renaming the table (too risky with existing references)
**Impact**: Every billing query, API route, and component must reference `customer_invoices`

### [2025-10-24] Stack: Next.js 15 App Router + Supabase + Tailwind + shadcn/ui
**Context**: Initial platform architecture selection
**Decision**: Next.js 15 (App Router), TypeScript strict mode, Supabase (PostgreSQL), Tailwind CSS, shadcn/ui, Zustand + React Query
**Reasoning**: App Router for server components and streaming. Supabase for auth + RLS + edge functions in one. shadcn/ui for accessible, customizable components without vendor lock-in.
**Alternatives rejected**: Pages Router (legacy), Firebase (vendor lock-in), Prisma (extra ORM layer when Supabase client suffices)
**Impact**: All new features follow App Router conventions. No Pages Router patterns.

### [2025-10-24] Auth: Three-context pattern
**Context**: Admin dashboard needs granular permissions across 14 modules
**Decision**: Three-context auth with header + cookie checks and RBAC (100+ permissions, 17 role templates)
**Reasoning**: Single auth context was insufficient for admin vs customer vs API access patterns
**Alternatives rejected**: Simple JWT-only auth (insufficient for RBAC granularity)
**Impact**: See `.claude/rules/auth-patterns.md` for implementation details

### [2025-10-24] Coverage: 4-layer fallback system
**Context**: SA coverage data is unreliable from any single provider
**Decision**: MTN WMS → MTN Consumer → Provider APIs → Mock data fallback chain
**Reasoning**: No single API has complete coverage data for SA. Fallback ensures users always get a result.
**Alternatives rejected**: Single provider API (too unreliable)
**Impact**: Coverage components must handle all 4 states gracefully

### [2025-10-24] Payments: NetCash Pay Now
**Context**: SA market requires diverse payment options
**Decision**: NetCash Pay Now integration supporting 20+ payment methods
**Reasoning**: Best coverage of SA-specific payment methods (EFT, Ozow, SnapScan, etc.)
**Alternatives rejected**: Stripe (limited SA support), PayFast (fewer methods)
**Impact**: Payment flow in `components/checkout/InlinePaymentForm.tsx`

### [2025-10-24] Deployment: 2-branch strategy
**Context**: Need safe deployment pipeline
**Decision**: Feature branches push to staging first, then PR to main
**Reasoning**: Prevents broken deploys to production.
**Alternatives rejected**: Direct to main (too risky), 3-branch with develop (unnecessary overhead)
**Impact**: `git push origin feature/xyz:staging` → test → `gh pr create --base main`

### [2025-10-24] Products: Dual table architecture
**Context**: Product data needs to serve both admin and customer-facing views
**Decision**: Two tables (`products` + `service_packages`) that must stay in sync (known tech debt — Roadmap 2.2)
**Reasoning**: Historical architecture decision. Sync solution is Phase 2 priority.
**Alternatives rejected**: Single table (would require major refactor)
**Impact**: Any product update must consider both tables until sync is built.

---

> **Rule**: When a new architectural decision is made, add it here BEFORE implementing. Future sessions read this first.
