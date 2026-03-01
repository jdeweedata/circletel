# CircleTel - AI Quick Start

This document helps AI assistants quickly understand and work with the CircleTel codebase.

## What This Project Does

**CircleTel** is a B2B/B2C ISP platform for South African businesses and consumers. It handles coverage checks (MTN, DFA, Tarana, Fibre), product selection, payments (NetCash Pay Now), customer management, and partner/reseller onboarding.

**Production**: https://www.circletel.co.za
**Staging**: https://circletel-staging.vercel.app

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | 3 contexts (Consumer/Partner/Admin) |
| Payments | NetCash Pay Now | 20+ methods |
| Hosting | Vercel | Edge functions |
| Background Jobs | Inngest | Event-driven |

## Project Structure

```
circletel/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── admin/                # Admin dashboard (RBAC protected)
│   ├── partners/             # Partner portal (FICA/CIPC)
│   ├── (consumer)/           # Consumer-facing pages
│   └── layout.tsx            # Root layout
│
├── components/               # React components
│   ├── ui/                   # Reusable UI (Button, Card, etc.)
│   ├── admin/                # Admin-specific
│   ├── checkout/             # Payment flow
│   └── business-dashboard/   # B2B dashboard
│
├── lib/                      # Core business logic
│   ├── supabase/             # Database clients
│   ├── coverage/             # Coverage check services
│   ├── billing/              # Billing & payments
│   ├── auth/                 # Auth utilities
│   └── integrations/         # ZOHO, MTN, NetCash
│
├── types/                    # TypeScript types
│   └── database.ts           # Generated from Supabase
│
├── supabase/
│   └── migrations/           # Database migrations
│
├── .claude/
│   ├── skills/               # 40+ Claude skills
│   └── tools/                # MCP executors
│
└── docs/                     # Full documentation
    ├── architecture/         # System design docs
    └── api/                  # API documentation
```

## Key Entry Points

| Purpose | File | Notes |
|---------|------|-------|
| Root layout | `app/layout.tsx` | Providers, metadata |
| Middleware | `middleware.ts` | Auth, redirects |
| DB (server) | `lib/supabase/server.ts` | API routes, RSC |
| DB (client) | `lib/supabase/client.ts` | Browser components |
| Types | `types/database.ts` | All DB types |
| Coverage | `lib/coverage/aggregation-service.ts` | Multi-provider checks |
| Billing | `lib/billing/paynow-billing-service.ts` | Invoice generation |
| Admin auth | `lib/admin/permissions.ts` | RBAC (17 roles) |

## Quick Commands

```bash
# Development (ALWAYS use :memory variants)
npm run dev:memory           # Start dev server (8GB heap)
npm run type-check:memory    # TypeScript validation (4GB heap)

# Quality (run before commits)
npm run type-check           # Must pass
npm run lint                 # ESLint

# Build
npm run build:memory         # Production build (8GB heap)

# Database
# Migrations via Supabase dashboard or MCP tools
```

## Three Auth Contexts

| Context | Cookie/Header | Tables | RLS |
|---------|---------------|--------|-----|
| **Consumer** | `sb-access-token` cookie | `customers`, `consumer_orders` | Yes |
| **Partner** | Same + FICA docs | `partners`, `partner_compliance_documents` | Yes |
| **Admin** | Authorization header | `admin_users`, RBAC tables | Service role bypasses |

**Critical Pattern**: API routes must check BOTH cookies AND Authorization header:
```typescript
const authHeader = request.headers.get('authorization')
if (authHeader?.startsWith('Bearer ')) {
  // Token auth
} else {
  // Cookie auth
}
```

## Database Tables (Key)

| Table | Purpose |
|-------|---------|
| `customers` | Consumer accounts |
| `customer_invoices` | Billing (NOT `invoices`) |
| `consumer_orders` | Order tracking |
| `coverage_leads` | Coverage check results |
| `service_packages` | Products/plans |
| `admin_users` | Admin accounts |
| `partners` | Reseller accounts (CTPL-YYYY-NNN) |
| `business_quotes` | B2B quotes |
| `kyc_sessions` | B2B KYC workflow |

## Common Patterns

### Next.js 15 API Routes
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params  // MUST await
}
```

### Supabase Join Returns Array
```typescript
const customer = Array.isArray(invoice.customer)
  ? invoice.customer[0]
  : invoice.customer
```

### Loading States
```typescript
try {
  setLoading(true)
  await fetchData()
} catch (error) {
  setError(error)
} finally {
  setLoading(false)  // ALWAYS in finally
}
```

## Before Making Changes

1. **Read CLAUDE.md** - Full conventions and patterns
2. **Check .context-notes.md** - Large file loading guide
3. **Run type-check** before committing
4. **Check existing patterns** in similar files
5. **Use :memory scripts** to prevent OOM crashes

## Current Focus

<!-- Update this section with current work -->
**Active**: [Current feature/sprint]
**Recent**: B2B Feasibility Portal, CPQ Wizard
**Next**: [Upcoming work]

## Related Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Full AI configuration (739 lines) |
| `.context-notes.md` | Large file loading guide |
| `docs/architecture/SYSTEM_OVERVIEW.md` | System design |
| `docs/architecture/AUTHENTICATION_SYSTEM.md` | Auth details |
| `.claude/skills/USER_GUIDE.md` | Skills documentation |

---

**Last Updated**: 2026-03-01
