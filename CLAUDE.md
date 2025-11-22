# CLAUDE.md

Guidance for Claude Code when working with CircleTel codebase.

## ⚠️ CRITICAL: Context Management

**BEFORE STARTING ANY WORK:**
```powershell
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
```
**Budget Zones**: 🟢 Green (<70%) | 🟡 Yellow (70-85%) | 🔴 Red (>85%)

## Project Overview

**CircleTel** - B2B/B2C ISP platform for South Africa
**Stack**: Next.js 15, TypeScript, Supabase (`agyjovdugmtopasyvlng`), Tailwind, NetCash Pay Now
**Production**: https://www.circletel.co.za
**Staging**: https://circletel-staging.vercel.app

## Essential Commands

```bash
# Development (ALWAYS use :memory - prevents crashes)
npm run dev:memory          # 8GB heap
npm run type-check:memory   # 4GB heap
npm run build:memory        # 8GB heap

# Pre-Commit (MANDATORY)
npm run type-check          # Must pass before commit
```

## Deployment Workflow

**2-Branch Strategy**: Feature → Staging → Main (Production)

```bash
# 1. Test in staging first
git push origin feature/xyz:staging

# 2. Verify, then merge to main via PR
gh pr create --base main
```

**Pre-Deploy Checklist**: ✅ Type check ✅ Build ✅ Staging tests ✅ DB migrations ✅ ENV vars

**Rollback**: Vercel Dashboard → Deployments → Promote last working deployment (<2 min)

## Architecture Overview

### Authentication (Three-Context System)

**Consumer**: Token in httpOnly cookies → RLS-protected queries
**Partner**: Same as consumer + FICA/CIPC compliance docs
**Admin**: RBAC (17 roles, 100+ permissions) → Service role bypasses RLS

**Critical Pattern - Auth Provider Exclusions**:
```typescript
// CustomerAuthProvider must skip admin/partner pages
if (pathname?.startsWith('/admin') || pathname?.startsWith('/partners')) {
  setLoading(false)
  return // Don't initialize customer auth
}
```

**Authorization Header Pattern** (fixes 401 errors):
```typescript
// Server: Check BOTH header and cookies
const authHeader = request.headers.get('authorization')
if (authHeader?.startsWith('Bearer ')) {
  const user = await supabase.auth.getUser(authHeader.split(' ')[1])
} else {
  const session = await createClientWithSession()
}
```

See `docs/architecture/AUTHENTICATION_SYSTEM.md` for details.

### Key Systems

**Coverage**: 4-layer fallback (MTN WMS → MTN Consumer → Provider APIs → Mock)
**Orders**: 3-stage flow (Coverage → Package → Account) via Zustand store
**Payments**: NetCash Pay Now (20+ methods) - See `components/checkout/InlinePaymentForm.tsx`
**B2B KYC**: 7-stage workflow (Quote → Didit KYC → Contract → ZOHO Sign → Payment → Installation → RICA)
**Partners**: FICA/CIPC compliance (13 doc categories) - See `lib/partners/compliance-requirements.ts`
**Admin-Zoho**: Supabase-first → Async sync to CRM/Billing - See `docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md`

## TypeScript Patterns

### Next.js 15 API Routes (REQUIRED)

```typescript
// ✅ CORRECT: Async params
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  // ...
}
```

### Supabase Clients

```typescript
// Server (API routes) - Service role
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client (components) - Anon key + RLS
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### Webhook Signature Verification

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

## Common Debugging Patterns

### Infinite Loading States

```typescript
// ✅ ALWAYS use try/catch/finally
useEffect(() => {
  const callback = async () => {
    try {
      const data = await fetchData()
      setState(data)
    } catch (error) {
      console.error('Failed:', error)
      setState(null)
    } finally {
      setLoading(false) // Always executes
    }
  }
  onAuthStateChange(callback)
}, [])
```

### MTN API Anti-Bot

```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.mtn.co.za/',
  'Origin': 'https://www.mtn.co.za'
}
```

## File Organization

| Type | Location | Example |
|------|----------|---------|
| Pages | `app/[page]/page.tsx` | `app/packages/[leadId]/page.tsx` |
| API | `app/api/[endpoint]/route.ts` | `app/api/coverage/packages/route.ts` |
| Components | `components/[domain]/` | `components/admin/products/` |
| Services | `lib/[service]/` | `lib/coverage/aggregation-service.ts` |
| Migrations | `supabase/migrations/` | `supabase/migrations/20251024_*.sql` |

**Naming**: Components (PascalCase), Hooks (use-name.ts), Services (name-service.ts), Docs (SCREAMING_SNAKE.md)

## Brand Guidelines

```typescript
// Colors (Tailwind)
'circleTel-orange': '#F5831F'           // Primary
'circleTel-darkNeutral': '#1F2937'      // Text
'circleTel-lightNeutral': '#E6E9EF'     // Backgrounds
```

**Typography**: Arial/Helvetica, font-semibold/bold/extrabold (600/700/800)
**Package Cards**: Orange gradient unselected, Dark blue (#1E4B85) selected, color-matched shadows

## Database Schema

**Core Tables**: `service_packages`, `coverage_leads`, `customers`, `consumer_orders`, `admin_users`, `business_quotes`

**B2B KYC Tables**: `kyc_sessions`, `contracts` (CT-YYYY-NNN), `invoices` (INV-YYYY-NNN), `rica_submissions`

**Partner Tables**: `partners` (CTPL-YYYY-NNN), `partner_compliance_documents` (13 FICA/CIPC categories)

**Customer Dashboard Tables**: `customer_services`, `customer_billing`, `customer_invoices`, `usage_history`

**Storage**: `partner-compliance-documents` (private, 20MB, PDF/JPG/PNG/ZIP)

See database schemas in respective migration files.

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>
NETCASH_SERVICE_KEY=<key>

# Optional
ZOHO_CLIENT_ID=<id>
ZOHO_CLIENT_SECRET=<secret>
```

See `.env.example` for complete list.

## Agent-OS Implementation

**Location**: `agent-os/specs/[spec-id]/`
**Process**: Spec → Task Breakdown → Agent Delegation → Verification → Report
**Subagents**: database-engineer, backend-engineer, api-engineer, frontend-engineer, testing-engineer

**Active Specs**:
- `20251101-b2b-quote-to-contract-kyc/` - 64% complete (61 points)
- `2025-11-01-customer-dashboard-production/` - Ready for implementation (147 points)

## Skills System (7 Total)

| Skill | Purpose | Command |
|-------|---------|---------|
| **context-manager** 🔥 | Token optimization (USE FIRST!) | `powershell -File .claude/skills/context-manager/run-context-analyzer.ps1` |
| **sql-assistant** | Natural language to SQL | See `.claude/skills/sql-assistant/` |
| **deployment-check** | Pre-deploy validation | See `.claude/skills/deployment-check/` |
| **coverage-check** | Multi-provider coverage | See `.claude/skills/coverage-check/` |
| **product-import** | Excel to Supabase | See `.claude/skills/product-import/` |
| **admin-setup** | RBAC configuration | See `.claude/skills/admin-setup/` |
| **supabase-fetch** | Database queries | See `.claude/skills/supabase-fetch/` |

**Auto-load**: Skills activate on keyword mentions. Manual: `/skill <skill-name>`

## Getting Started (New Session)

### MANDATORY: Context Analysis First

```powershell
# Analyze project/directory
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path app/admin
```

### Workflow

1. **Run context analysis** (MANDATORY)
2. `npm run type-check` - Check compilation state
3. Check `docs/RECENT_CHANGES.md` for latest updates
4. **Load files progressively** - Don't load entire directories
5. Make changes following patterns in this file
6. `npm run type-check` before committing
7. Test with `npm run dev:memory`

### Progressive Loading Pattern

✅ CORRECT: "Load app/admin/layout.tsx" → "Show lines 50-100" → "Update line 75"
❌ WRONG: "Load all admin files" → "Show everything in app/"

## Recent Bug Fixes (Reference)

**Dashboard 401 Auth** (Commit `ac642e8`): Check BOTH Authorization header AND cookies in API routes
**Quote Edit Save** (Commit `88b821b`): Use `admin_notes` not `notes` column
**Quote Page Timeouts** (Commits `df9cf64-c6df5d4`): Add ALL page routes to `vercel.json` with maxDuration

## Recent Updates (Nov 2025)

### Customer Dashboard Production Readiness
✅ Spec created (1,200+ lines, 147 points, 4-week timeline)
**Scope**: 10 tables, account numbers (CT-YYYY-NNNNN), billing automation, NetCash eMandate, Interstellio API, Clickatell SMS
**Location**: `agent-os/specs/2025-11-01-customer-dashboard-production/`

### B2B Quote-to-Contract KYC (64% Complete)
✅ Sprint 1: KYC Foundation (20 points) - COMPLETE
✅ Sprint 2: Contracts & CRM (8/16 points) - 50%
✅ Sprint 3: Invoicing (3/13 points) - 23%
⏳ Remaining: RICA auto-submission, activation, notifications

### Admin Orders Management (COMPLETE)
✅ Orders list (`/admin/orders`) - Stats, search, filters, export
✅ Order detail (`/admin/orders/[id]`) - Tabbed workflow interface with 4 sections:
  - **Overview**: Customer, Package, Source, Metadata
  - **Installation & Service**: Technician, Schedule, Address, Documents
  - **Financials**: Payment details, Method status, Billing address
  - **History & Notes**: Communication timeline, Internal/Technician notes
✅ Persistent header with Status/Actions and Workflow Stepper across all tabs

### Partner Portal (COMPLETE)
✅ Registration + 13 FICA/CIPC document upload
✅ Supabase Storage integration with RLS
✅ E2E tests (7/7 passing)

### Consumer Dashboard Enhancement (COMPLETE)
✅ Service management dropdown (1-click, 66% navigation reduction)
✅ Usage tracking, upgrade/downgrade flows
✅ Supersonic-inspired UX

### Payment System Enhancement (COMPLETE)
✅ NetCash Pay Now (20+ methods)
✅ Inline payment form with Framer Motion
✅ Demo page (`/order/payment/demo`)

---

**Version**: 5.6 | **Updated**: 2025-11-22 | **Team**: Development + Claude Code

**Major Changes in v5.6**:
- Admin Order Details page refactored to tabbed workflow interface
- Improved UX with focused sections (Overview, Installation/Service, Financials, History/Notes)
- Persistent header and workflow stepper for continuous status visibility

**Major Changes in v5.5**:
- Optimized CLAUDE.md from ~50k to <20k tokens
- Condensed verbose sections while preserving critical patterns
- Moved detailed content to architecture docs
- Removed redundant examples and changelog entries
- Maintained all essential commands, patterns, and references
