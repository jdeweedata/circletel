# CLAUDE.md

Guidance for Claude Code when working with CircleTel codebase.

## ⚠️ MANDATORY: Claude Code Rules

> **STOP. Before ANY code change, you MUST follow these rules.**

### Planning & Execution

1. **Always slow down and think first**
   - Read through ALL relevant files in the codebase before making changes
   - Build a complete, step-by-step to-do list for every task
   - Identify all files that will be affected by the changes
   - Think through potential side effects and edge cases

2. **Explain before implementing**
   - Stop and explain your approach before making ANY code changes
   - Describe what you're about to change and why
   - Outline which files will be modified and how they connect
   - Wait for confirmation before proceeding with implementation

3. **Keep it simple**
   - Make every task and code change as simple as humanly possible
   - Only touch the files and code that absolutely need to be changed
   - Avoid over-engineering or adding unnecessary complexity
   - Don't modify or "improve" code that isn't part of the current task

### Quality Standards

4. **Never be lazy**
   - Always provide complete, production-ready solutions
   - Never skip steps or take shortcuts
   - Don't rush through implementations
   - Maintain focus even when context window is filling up

5. **No temporary fixes**
   - Only implement long-term solutions that address root causes
   - Avoid band-aid fixes, workarounds, or "TODO" items
   - If you identify a problem, fix it properly the first time
   - Don't create technical debt

6. **No hallucinations**
   - Only reference files, functions, and variables that actually exist
   - If you're unsure, check the codebase first
   - Never assume code exists - verify it
   - Ask for clarification rather than guessing

### Code Changes

7. **Minimize blast radius**
   - Isolate changes to prevent breaking existing features
   - Test that your changes don't impact unrelated functionality
   - Avoid refactoring code outside the scope of the current task
   - Keep changes focused and contained

8. **Be thorough but concise**
   - Provide complete solutions without unnecessary verbosity
   - Write clean, readable, well-documented code
   - Follow existing code patterns and conventions in the project
   - Remove any dead code or unused imports

9. **Confirm understanding**
   - If requirements are unclear or ambiguous, ask questions first
   - Propose multiple approaches when there are trade-offs
   - Highlight any assumptions you're making
   - Never proceed with major changes without explicit confirmation

10. **Know the system**
    - ALWAYS read `docs/architecture/SYSTEM_OVERVIEW.md` before working on unfamiliar areas
    - This file contains: database schema, API routes, service modules, component structure
    - Reference it to understand how systems connect and where code belongs
    - Don't assume - verify against the documented architecture

11. **Respect file placement**
    - **Root-level files ONLY**: Config files (`package.json`, `tsconfig.json`, `next.config.js`, `.env*`, `tailwind.config.*`, `vercel.json`, `CLAUDE.md`, `README.md`, `.gitignore`, `.eslintrc.*`, `.prettierrc.*`)
    - **All other files MUST go in appropriate subdirectories**:
      - Source code → `app/`, `components/`, `lib/`, `hooks/`, `types/`
      - Documentation → `docs/` (see Documentation Structure below)
      - Database migrations → `supabase/migrations/`
      - Scripts → `scripts/`
      - Tests → `__tests__/` or alongside source files
      - Claude/MCP tools → `.claude/`
    - **Create folders if they don't exist** - Don't use root as a shortcut; create the proper directory structure first
    - Never create random `.md`, `.ts`, `.js`, or other files in the project root
    - If unsure where a file belongs, check the File Organization section or ask

**Remember: Simplicity, thoroughness, and no shortcuts. Think first, explain second, code third.**

---

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

## MCP Code Execution Tools

**Location**: `.claude/tools/`
**Purpose**: Reduce token usage by 75% through programmatic execution instead of text-based interaction
**Documentation**: See `.claude/tools/README.md` for full details

### Quick Reference

**Supabase Query Executor** (✅ Production Ready):
```typescript
import { executeQuery, quickSelect, quickCount, quickFind } from './.claude/tools/supabase-executor';

// Find failed ZOHO syncs
await executeQuery({
  table: 'customers',
  operation: 'select',
  filters: [{ column: 'zoho_sync_status', operator: 'eq', value: 'failed' }],
  limit: 10
});

// Count active services
const count = await quickCount('customer_services', [
  { column: 'status', operator: 'eq', value: 'active' }
]);

// Find customer by ID
const customer = await quickFind('customers', 'cust_123');
```

**Token Savings**: 80% reduction (15K → 3K tokens per database operation)

**Common Use Cases**:
- Admin panel debugging (customer records, failed orders)
- ZOHO sync health monitoring
- Payment transaction lookups
- Coverage lead analysis

**Safety Features**:
- UPDATE/DELETE require explicit filters
- Input validation prevents SQL injection
- 30-second timeout protection
- Audit logging to `executor_audit_logs` table

**Configuration**:
```typescript
await executeQuery(request, {
  timeout: 60000,        // 60 seconds
  cacheEnabled: true,    // Enable caching
  cacheTTL: 600,         // Cache for 10 minutes
  retries: 2             // Retry twice on failure
});
```

**Planned Tools** (Phases 2-4):
- Coverage Executor (Phase 2) - 75% token reduction on coverage queries
- ZOHO Health Executor (Phase 2) - 85% reduction on integration monitoring
- Migration Validator (Phase 3) - 70% reduction on migration checks
- Workflow Executor (Phase 3) - Multi-step automation
- Analytics Dashboard (Phase 4) - Performance tracking

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

### Build-Time Errors from External Services

Services that throw in constructor when env vars missing break Next.js builds. Use lazy-load:
```typescript
// ❌ BAD: Throws at module load
constructor() { if (!process.env.API_KEY) throw new Error('Missing'); }

// ✅ GOOD: Lazy-load, check at runtime
private getConfig() {
  if (!this.config) this.config = { apiKey: process.env.API_KEY || '' };
  return this.config;
}
```

### External URL Redirects

Next.js `redirect()` in Server Components doesn't work for external URLs with query params. Use API route:
```typescript
// app/api/redirect/[ref]/route.ts
return NextResponse.redirect(externalUrl); // Works for external URLs
```

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

### Source Code Structure

| Type | Location | Example |
|------|----------|---------|
| Pages | `app/[page]/page.tsx` | `app/packages/[leadId]/page.tsx` |
| API | `app/api/[endpoint]/route.ts` | `app/api/coverage/packages/route.ts` |
| Components | `components/[domain]/` | `components/admin/products/` |
| Services | `lib/[service]/` | `lib/coverage/aggregation-service.ts` |
| Migrations | `supabase/migrations/` | `supabase/migrations/20251024_*.sql` |

### Documentation Structure

**⚠️ CRITICAL: Never create documentation files in the project root!**

| Type | Location | Example |
|------|----------|---------|
| Architecture Docs | `docs/architecture/` | `docs/architecture/AUTHENTICATION_SYSTEM.md` |
| Feature Specs | `docs/features/YYYY-MM-DD_feature-name/` | `docs/features/2025-11-23_cms_no_code/` |
| Implementation Guides | `docs/implementation/` | `docs/implementation/MCP_CODE_EXECUTION.md` |
| Optimization Guides | `docs/guides/` | `docs/guides/MCP_OPTIMIZATION.md` |
| API Documentation | `docs/api/` | `docs/api/ADMIN_ENDPOINTS.md` |
| Claude-Specific | `.claude/docs/` | `.claude/docs/EXECUTOR_PATTERNS.md` |
| Agent Specs | `agent-os/specs/[spec-id]/` | `agent-os/specs/20251101-b2b-kyc/` |

### MCP/Claude Code Tools

| Type | Location | Example |
|------|----------|---------|
| Executors | `.claude/tools/` | `.claude/tools/supabase-executor.ts` |
| Tool Types | `.claude/tools/types.ts` | Type definitions for all tools |
| Tool Utils | `.claude/tools/utils.ts` | Shared utility functions |
| Tool Docs | `.claude/tools/README.md` | Tool documentation |
| Skills | `.claude/skills/[skill-name]/` | `.claude/skills/context-manager/` |
| Custom Commands | `.claude/commands/` | `.claude/commands/deploy.md` |

### Temporary/Working Files

| Type | Location | Notes |
|------|----------|-------|
| Test Scripts | `scripts/test-*.ts` | Temporary test files (gitignored) |
| Working Docs | `docs/working/` | WIP documentation (create folder as needed) |
| Batch Files | `scripts/*.bat` | Temporary automation (gitignored) |

**Naming Conventions**:
- Components: PascalCase
- Hooks: use-name.ts
- Services: name-service.ts
- Documentation: SCREAMING_SNAKE.md
- Feature Folders: YYYY-MM-DD_feature-name

**Examples of Correct File Placement**:
```
✅ docs/implementation/MCP_CODE_EXECUTION_IMPLEMENTATION.md
✅ docs/guides/MCP_OPTIMIZATION_GUIDE.md
✅ docs/features/2025-11-24_mcp-code-execution/PHASE1_COMPLETE.md
✅ .claude/docs/EXECUTOR_PATTERNS.md
✅ docs/api/SUPABASE_EXECUTOR_API.md

❌ MCP_CODE_EXECUTION_IMPLEMENTATION.md (root folder)
❌ MCP_OPTIMIZATION_GUIDE.md (root folder)
❌ IMPLEMENTATION_NOTES.md (root folder)
```

**When Creating New Documentation**:
1. **Architecture changes**: Use `docs/architecture/`
2. **New features**: Create `docs/features/YYYY-MM-DD_feature-name/`
3. **Implementation guides**: Use `docs/implementation/`
4. **Optimization/how-to guides**: Use `docs/guides/`
5. **MCP/Claude-specific**: Use `.claude/docs/`
6. **API documentation**: Use `docs/api/`

**Before Creating Files**:
- Check if appropriate folder exists
- If not, create the folder first
- Use descriptive folder names
- Follow naming conventions above

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

**B2B KYC Tables**: `kyc_sessions`, `contracts` (CT-YYYY-NNN), `rica_submissions`

**Billing Tables**: `customer_invoices` (NOT `invoices`), `customer_payment_methods` - Always use `customer_invoices` for billing queries

**Partner Tables**: `partners` (CTPL-YYYY-NNN), `partner_compliance_documents` (13 FICA/CIPC categories)

**Customer Dashboard Tables**: `customer_services`, `customer_billing`, `usage_history`

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

# Email (Resend) - Verified domain: notify.circletel.co.za
RESEND_API_KEY=<key>
# Use: billing@notify.circletel.co.za (NOT circletel.co.za)

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

## Claude Code Business OS

### Event Hooks (Auto-Triggered)

| Hook | Trigger | Purpose |
|------|---------|---------|
| **Session Start** | New session | Auto-run context analyzer, show budget zone |
| **Pre-Edit Backup** | Before Edit/Write | Backup files to `.claude/backups/` |
| **Post-Bash Logging** | After Bash commands | Audit log to `.claude/logs/bash-audit.log` |

**Location**: `.claude/hooks/` | **Config**: `.claude/settings.local.json`

### Custom Commands

| Command | Purpose |
|---------|---------|
| `/new-migration <name>` | Create timestamped Supabase migration with template |
| `/health-check` | Run type-check + context-analyzer + Supabase advisors |
| `/sync-types` | Generate TypeScript types from Supabase schema |

**Location**: `.claude/commands/`

### Skills System (13 Total)

#### Core Skills
| Skill | Purpose | Command |
|-------|---------|---------|
| **context-manager** 🔥 | Token optimization (USE FIRST!) | `powershell -File .claude/skills/context-manager/run-context-analyzer.ps1` |
| **bug-fixing** | Systematic debugging workflow | Auto-activates on errors |
| **database-migration** | Supabase migrations & RLS | `/new-migration <name>` |
| **prompt-optimizer** | Transform prompts for CircleTel | Auto-activates |

#### v2.0.64 Skills (NEW)
| Skill | Purpose | Key Commands |
|-------|---------|--------------|
| **session-manager** 🆕 | Named sessions, resume work | `/rename`, `/resume <name>` |
| **async-runner** 🆕 | Background tasks & parallel agents | `Ctrl+B`, `/tasks` |
| **rules-organizer** 🆕 | Modular `.claude/rules/` standards | Create `.claude/rules/*.md` |
| **stats-tracker** 🆕 | Usage analytics & streaks | `/stats`, `/usage` |
| **screenshot-analyzer** 🆕 | UI debugging with coordinates | Paste screenshot + ask |

#### Utility Skills
| Skill | Purpose | Command |
|-------|---------|---------|
| **filesystem-context** 🆕 | Session continuity & context persistence | See `.claude/context/`, `.claude/memory/` |
| **project-sync** 🆕 | Check local vs remote git alignment | `powershell -File .claude/skills/project-sync/check-sync.ps1` |
| **session-checker** 🆕 | Interstellio PPPoE session status | `powershell -File .claude/skills/session-checker/check-session.ps1` |
| **sql-assistant** | Natural language to SQL | See `.claude/skills/sql-assistant/` |
| **deployment-check** | Pre-deploy validation | See `.claude/skills/deployment-check/` |
| **coverage-check** | Multi-provider coverage | See `.claude/skills/coverage-check/` |
| **mobile-testing** | Playwright mobile UI/UX | `npm run test:mobile` |

**User Guide**: See `.claude/skills/USER_GUIDE.md` for complete documentation.

**Auto-load**: Skills activate on keyword mentions. Manual: `/skill <skill-name>`

## Getting Started (New Session)

### Quick Start (v2.0.64+)

```bash
# 1. Check stats and name your session
/stats                              # Check streak, usage
/rename feature-name                # Name this session

# 2. Run context analysis
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1

# 3. Start dev server in background
npm run dev:memory &                # Non-blocking

# 4. Begin work!
```

### Resume Previous Work

```bash
# Resume by name
claude --resume feature-name

# Or use picker
/resume                             # P=preview, R=rename
```

### MANDATORY: Context Analysis First

```powershell
# Analyze project/directory
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path app/admin
```

### Full Workflow

1. **Check stats & name session** - `/stats`, `/rename feature-x`
2. **Run context analysis** (MANDATORY)
3. **Start dev server in background** - `npm run dev:memory &`
4. **Read `docs/architecture/SYSTEM_OVERVIEW.md`** - Understand system structure
5. `npm run type-check` - Check compilation state
6. **Load files progressively** - Don't load entire directories
7. Make changes following patterns in this file
8. `npm run type-check` before committing
9. Test with dev server (already running in background)

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

**Version**: 5.8 | **Updated**: 2026-02-10 | **Team**: Development + Claude Code

**Major Changes in v5.8**:
- Added billing automation patterns (Pay Now, SMS, email)
- Added lazy-load pattern for external services (prevents build errors)
- Added external URL redirect pattern (use API routes)
- Added Resend domain config (notify.circletel.co.za)
- Added Billing Tables section to Database Schema

**Major Changes in v5.7**:
- Added Claude Code Business OS framework (Event Hooks, Custom Commands)
- Session start hook for automatic context analysis
- Pre-edit backup hook for file protection
- Post-bash logging hook for audit trail
- Custom commands: `/new-migration`, `/health-check`, `/sync-types`
- YAML metadata headers added to architecture docs for better searchability

**Major Changes in v5.6**:
- Admin Order Details page refactored to tabbed workflow interface
- Improved UX with focused sections (Overview, Installation/Service, Financials, History/Notes)
- Persistent header and workflow stepper for continuous status visibility
