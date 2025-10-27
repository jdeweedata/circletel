# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Context Management

**BEFORE STARTING ANY WORK, RUN:**
```powershell
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
```

This analyzes token usage and prevents context overflows. See [Getting Started](#getting-started-new-session) for details.

**Budget Zones**: 🟢 Green (<70%) | 🟡 Yellow (70-85%) | 🔴 Red (>85%)

## Project Overview

**CircleTel** - Enterprise telecommunications platform (B2B/B2C ISP) for South Africa
**Stack**: Next.js 15, TypeScript, Supabase PostgreSQL, Tailwind CSS, Strapi CMS, NetCash Pay Now
**Supabase Project**: `agyjovdugmtopasyvlng`
**Payment Gateway**: NetCash Pay Now (20+ payment methods)

## Essential Commands

```bash
# Development (ALWAYS use :memory variant - prevents out-of-memory crashes)
npm run dev:memory          # Start dev server with 8GB heap
npm run dev:low             # Lower memory variant (4GB)

# Type Checking (MANDATORY before commits)
npm run type-check          # TypeScript validation
npm run type-check:memory   # Type check with increased memory

# Build
npm run build:memory        # Production build with 8GB heap
npm run build:ci            # CI build with 6GB heap

# Testing
npm run lint                # ESLint
npm run test:e2e            # Playwright E2E tests

# Utilities
npm run clean               # Clear .next and cache
npm run orchestrate         # Run multi-agent orchestrator
```

### Pre-Commit Checklist (CRITICAL)

1. `npm run type-check` → Fix all errors
2. `npm run type-check` again → Verify clean
3. Commit and push

**Why**: Prevents Vercel build failures by catching TypeScript errors locally.

## Architecture Overview

### Multi-Layer Coverage System

CircleTel uses a 4-layer fallback system for coverage checking:

1. **MTN Business API** (WMS) - Primary provider
2. **MTN Consumer API** - Fallback
3. **Provider-Specific APIs** (DFA, Vumatel, etc.)
4. **Mock Data** - Development/testing

**Key Files**:
- `lib/coverage/aggregation-service.ts` - Orchestrates fallback
- `lib/coverage/mtn/wms-realtime-client.ts` - MTN integration
- `lib/coverage/mtn/cache.ts` - 5-minute response caching

### Order State Management

3-stage order flow with centralized state:

1. **Coverage** → Check address availability
2. **Package** → Select product
3. **Account** → Customer details + payment

**Implementation**:
- `components/order/context/OrderContext.tsx` - Zustand store
- `lib/order/types.ts` - TypeScript interfaces
- State persists in localStorage for user session

### Payment System (NetCash Pay Now)

Modern payment interface supporting 20+ payment methods:

**Payment Methods**:
1. **Card Payments** - 3D Secure (Visa, Mastercard, Amex, Diners)
2. **Instant EFT** - Real-time bank payments via Ozow
3. **Capitec Pay** - Fast payments for Capitec customers
4. **Bank EFT** - Traditional online banking transfers
5. **Scan to Pay** - Universal QR codes (SnapScan, Zapper)
6. **Payflex** - Buy Now Pay Later (4 installments)
7. **1Voucher** - Cash voucher payments (29M customers)
8. **paymyway** - Available at 24,000+ stores
9. **SCode Retail** - Barcode payments at 6,000+ outlets

**Implementation**:
- `components/checkout/InlinePaymentForm.tsx` - Modern inline payment form
- `components/order/stages/PaymentStage.tsx` - Existing NetCash redirect flow
- `app/order/payment/demo/page.tsx` - Interactive payment method showcase
- Framer Motion animations for smooth UX

### Partner Portal & Compliance System

B2B partner management with FICA/CIPC compliance for South African regulations:

**Onboarding Flow**:
1. **Registration** (`/partners/onboarding`) - Business details, banking info
2. **Document Upload** (`/partners/onboarding/verify`) - FICA/CIPC compliance documents
3. **Admin Review** - Compliance verification, partner number generation
4. **Approval** - Status: `incomplete` → `submitted` → `under_review` → `verified`

**Document Categories** (13 total):
- FICA: Identity, Proof of Address
- CIPC: Registration (CK1), Company Profile, Directors (CM1), MOI
- SARS: Tax Clearance, VAT Registration
- Banking: Confirmation Letter, Bank Statement
- Business: Proof of Address, Authorization

**Business Type Requirements**:
- `sole_proprietor`: 5 required, 2 optional
- `company`: 11 required, 1 optional
- `partnership`: 7 required, 2 optional

**Partner Number Format**: `CTPL-YYYY-NNN` (e.g., `CTPL-2025-001`)

**Key Files**:
- `lib/partners/compliance-requirements.ts` - Document requirements logic
- `app/partners/onboarding/page.tsx` - Registration form
- `app/partners/onboarding/verify/page.tsx` - Document upload UI
- `app/api/partners/compliance/upload/route.ts` - File upload to Supabase Storage
- `supabase/storage/partner-compliance-documents` - Private bucket (20MB limit, PDF/JPG/PNG/ZIP)

**Storage Structure**: `{partner_id}/{category}/{timestamp}_{filename}`

**RLS Policies** (4 total):
1. Partners upload own documents (INSERT)
2. Partners view own documents (SELECT)
3. Partners delete own unverified documents (DELETE)
4. Admins access all documents (ALL)

### RBAC Permission System

- **17 role templates** (Account Manager, Sales Rep, Tech Support, etc.)
- **100+ granular permissions** (products:read, orders:create, etc.)
- **Row Level Security** (RLS) enforced in Supabase

**Key Files**:
- `lib/rbac/permissions.ts` - Permission definitions
- `lib/rbac/role-templates.ts` - Role configurations
- `hooks/useAdminAuth.ts` - Permission checking hook

### Component Architecture

UI follows shadcn/ui patterns with CircleTel customizations:

- **Base**: shadcn/ui components (`components/ui/`)
- **Domain**: Feature-specific (`components/admin/`, `components/coverage/`)
- **Providers**: Context/state (`components/providers/`)

**Package Cards Example**:
- `CompactPackageCard.tsx` - Grid view (compact)
- `EnhancedPackageCard.tsx` - Detail view (full features)
- `PackageDetailSidebar.tsx` - Side panel with benefits

## TypeScript Patterns

### Next.js 15 API Routes (REQUIRED)

```typescript
// ✅ CORRECT: Async params pattern
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  // ... rest of handler
}

// ❌ WRONG: Old synchronous pattern
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // This will fail in Next.js 15
}
```

### Supabase Client Patterns

```typescript
// Server-side (API routes)
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient() // Service role client
  const { data } = await supabase.from('table').select()
}

// Client-side (components)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient() // Anonymous client with RLS
```

### Order State Updates

```typescript
import { useOrderContext } from '@/components/order/context/OrderContext'

const { state, actions } = useOrderContext()

// ✅ CORRECT: Update proper section
actions.updateOrderData({
  package: {
    selectedPackage: packageDetails,
    pricing: { monthly: 799, onceOff: 0 }
  }
})

// ❌ WRONG: Don't put package data in coverage
actions.updateOrderData({
  coverage: {
    selectedPackage: packageDetails // Type error!
  }
})
```

## Common Debugging Patterns

### Infinite Loading States

**Symptom**: Component stuck on "Loading..." indefinitely

**Cause**: Async callbacks without error handling

**Solution**:
```typescript
// ❌ BAD
useEffect(() => {
  const callback = async () => {
    const data = await fetchData() // If throws, loading stays true
    setState(data)
    setLoading(false)
  }
  onAuthStateChange(callback)
}, [])

// ✅ GOOD
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

**Real Example**: `CustomerAuthProvider` (commit `24547cb`)

### Auth Provider Page Exclusions

**Critical Pattern**: Auth providers must skip initialization on pages with different auth systems to prevent competing Supabase clients.

```typescript
// CustomerAuthProvider.tsx
const isAdminPage = pathname?.startsWith('/admin');
const isPartnerPage = pathname?.startsWith('/partners');
const isAuthPage = pathname?.startsWith('/auth/reset-password') || pathname?.startsWith('/auth/callback');

useEffect(() => {
  // Skip initialization on admin, partner, and auth pages
  if (isAdminPage || isPartnerPage || isAuthPage) {
    setLoading(false);
    return;
  }
  // ... initialize customer auth
}, [isAdminPage, isPartnerPage, isAuthPage]);
```

**Why**: Different auth contexts (customer, admin, partner) should not interfere with each other. Each system has its own provider and should only run on its designated pages.

**File**: `components/providers/CustomerAuthProvider.tsx:64-76`

### MTN API Anti-Bot Detection

MTN APIs require specific headers to avoid bot detection:

```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.mtn.co.za/',
  'Origin': 'https://www.mtn.co.za'
}
```

See `lib/coverage/mtn/wms-realtime-client.ts:89-103`

### TypeScript Memory Issues

Large projects may hit heap limits during type checking:

```bash
# If you see "JavaScript heap out of memory":
npm run type-check:memory  # Use increased heap (4GB)
npm run build:memory       # Use 8GB heap for builds
```

## File Organization Rules

### Root Directory (Configuration Only)

**Allowed**:
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`
- `.env*`, `.gitignore`, `.eslintrc.json`
- `CLAUDE.md`, `README.md`, `ROADMAP.md`, `AGENTS.md`

**Never**: Source code, migrations, tests, documentation, screenshots

### Directory Structure

| File Type | Location | Example |
|-----------|----------|---------|
| Pages | `app/[page]/page.tsx` | `app/packages/[leadId]/page.tsx` |
| API Routes | `app/api/[endpoint]/route.ts` | `app/api/coverage/packages/route.ts` |
| Components | `components/[domain]/` | `components/admin/products/` |
| UI Library | `components/ui/` | `components/ui/button.tsx` |
| Hooks | `hooks/use-[name].ts` | `hooks/useAdminAuth.ts` |
| Services | `lib/[service]/` | `lib/coverage/aggregation-service.ts` |
| Types | `lib/types/` | `lib/types/location-type.ts` |
| Migrations | `supabase/migrations/` | `supabase/migrations/20251024_*.sql` |
| Docs | `docs/[category]/` | `docs/implementation/` |
| Scripts | `scripts/` | `scripts/verify-provider-logos.js` |

### Naming Conventions

- **Components**: PascalCase (`CompactPackageCard.tsx`)
- **Pages**: `page.tsx`, `layout.tsx`, `route.ts`
- **Hooks**: `use-[name].ts` (kebab-case)
- **Services**: `[name]-service.ts` (kebab-case)
- **Migrations**: `YYYYMMDDHHMMSS_description.sql`
- **Docs**: `SCREAMING_SNAKE_CASE.md`

## Import Conventions

```typescript
// ✅ GOOD: Organized by category
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useOrderContext } from '@/components/order/context/OrderContext'
import type { Package } from '@/lib/types'

// ✅ GOOD: Use @ alias for project imports
import { createClient } from '@/lib/supabase/server'

// ❌ BAD: Relative imports
import { createClient } from '../../../lib/supabase/server'
```

## Brand Guidelines

### Colors (Tailwind Config)

```typescript
'circleTel-orange': '#F5831F'           // Primary brand
'circleTel-darkNeutral': '#1F2937'      // Dark text
'circleTel-secondaryNeutral': '#4B5563' // Secondary text
'circleTel-lightNeutral': '#E6E9EF'     // Light backgrounds
'circleTel-white': '#FFFFFF'            // White
```

### Typography

- **Primary**: Arial, Helvetica, sans-serif
- **Monospace**: Consolas, "Courier New", monospace
- **Font Weights**: Use `font-semibold` (600), `font-bold` (700), `font-extrabold` (800)

### Package Card Design (Recent Update)

- **Unselected**: Orange gradient (`from-[#F5831F] to-[#e67516]`)
- **Selected**: Dark blue (`#1E4B85`)
- **Shadows**: Use color-matched shadows (not grey borders)
- **Hover**: `scale-[1.02]` with `duration-300 ease-in-out`
- **Touch Targets**: Minimum 44px × 44px on mobile

### Dashboard Component Patterns

**Consumer Dashboard** (`/dashboard`):
- **Quick Action Cards**: 6 cards in responsive grid (2 cols mobile → 3 cols tablet → 6 cols desktop)
- **Service Management Dropdown**: Color-coded icons for 6 actions (View Usage, Upgrade, Downgrade, Cancel, Relocate, Log Issue)
- **Service Card States**: Empty state with CTA, Active state with gradient + status indicator
- **Stats Cards**: Always use `shadow-md` default, `shadow-xl` on hover, `border-2` for prominence

**Service Management Pages**:
- `/dashboard/usage` - Usage stats with speed test integration
- `/dashboard/services/upgrade` - Package comparison with "Recommended" badge
- `/dashboard/services/downgrade` - Includes warning notice and alternative options
- All use Suspense for loading states and mock data for development

## Key Integrations

### NetCash Pay Now Payment Gateway

```typescript
// Payment method selection and processing
import InlinePaymentForm from '@/components/checkout/InlinePaymentForm'

const orderSummary = {
  subtotal: 799.00,
  shipping: 0.00,
  discount: 100.00,
  total: 699.00,
  items: 2,
  delivery: "Standard (3-5 days)"
}

// Demo page: /order/payment/demo
<InlinePaymentForm 
  orderSummary={orderSummary}
  onSubmit={handlePayment}
  isProcessing={false}
/>
```

### MTN Coverage API

```typescript
// Real-time coverage check
import { WMSRealtimeClient } from '@/lib/coverage/mtn/wms-realtime-client'

const client = new WMSRealtimeClient()
const result = await client.getCoverageDetailedRealtime(
  { lat: -26.1234, lng: 28.5678 },
  'fibre'
)
```

### Supabase Database

**Core Tables**:
- `service_packages` - Products/packages
- `coverage_leads` - Coverage check results
- `customers` - Customer accounts
- `orders` - Order records
- `admin_users` - Admin accounts with RBAC
- `fttb_network_providers` - Provider metadata

**Partner Tables**:
- `partners` - Partner business details, compliance status, partner number
- `partner_compliance_documents` - FICA/CIPC document records
- `partner_leads` - Leads assigned to partners
- `partner_commissions` - Commission tracking

**Partner Table Key Columns**:
```sql
partners:
  - partner_number TEXT UNIQUE  -- CTPL-YYYY-NNN
  - compliance_status TEXT      -- incomplete|submitted|under_review|verified|rejected
  - compliance_verified_at TIMESTAMPTZ
  - commission_rate DECIMAL(5,2)
  - tier TEXT                   -- bronze|silver|gold|platinum
  - status TEXT                 -- pending|active|suspended|terminated

partner_compliance_documents:
  - document_category TEXT      -- 13 FICA/CIPC categories
  - verification_status TEXT    -- pending|approved|rejected
  - document_number TEXT        -- ID/Registration numbers
  - expiry_date DATE           -- For documents with expiry
  - is_required BOOLEAN
  - is_sensitive BOOLEAN
```

**Storage Buckets**:
- `partner-compliance-documents` - Private bucket (20MB, PDF/JPG/PNG/ZIP)

**Views**:
- `v_providers_with_logos` - Providers with logo data

### Environment Variables

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>

# Google Maps (REQUIRED)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>

# NetCash Pay Now (REQUIRED for payments)
NETCASH_SERVICE_KEY=<key>
NETCASH_MERCHANT_ID=<id>
NETCASH_ACCOUNT_SERVICE_KEY=<key>

# Strapi CMS (Optional)
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<token>

# Zoho CRM (Optional)
ZOHO_CLIENT_ID=<id>
ZOHO_CLIENT_SECRET=<secret>
```

See `.env.example` for complete list.

## Agent Skills System

CircleTel includes custom automation skills:

| Skill | Purpose | Command |
|-------|---------|---------|
| **context-manager** 🔥 | Token usage optimization (USE FIRST!) | `powershell -File .claude/skills/context-manager/run-context-analyzer.ps1` |
| **sql-assistant** | Natural language to SQL | See `.claude/skills/sql-assistant/` |
| **deployment-check** | Pre-deployment validation | See `.claude/skills/deployment-check/` |
| **coverage-check** | Test multi-provider coverage | See `.claude/skills/coverage-check/` |
| **product-import** | Import products from Excel | See `.claude/skills/product-import/` |
| **admin-setup** | Configure RBAC roles/users | See `.claude/skills/admin-setup/` |
| **supabase-fetch** | Query database with pre-built operations | See `.claude/skills/supabase-fetch/` |

**Documentation**: `.claude/skills/README.md`

### Context Manager Skill (CRITICAL - Use at Start of Every Session)

**Purpose**: Analyze token usage and prevent context overflows

```powershell
# Check current token usage (run this FIRST!)
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1

# Analyze specific directory before working on it
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path app/admin
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path components

# Get JSON output for scripting
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Json
```

**Provides**:
- Total estimated tokens in codebase/directory
- Budget usage percentage (Green/Yellow/Red zones)
- Top 10 largest files
- Specific optimization recommendations

**CircleTel-specific patterns**: `.claude/skills/context-manager/CIRCLETEL_GUIDE.md`

## Documentation Structure

```
docs/
├── implementation/         # Implementation guides (color schemes, features)
├── features/              # Feature specifications
│   └── customer-journey/  # Customer journey maps and optimizations
├── integrations/          # API integration docs (MTN, Netcash, Zoho)
├── testing/               # Test reports and results
├── deployment/            # Deployment guides (Vercel, Netlify)
├── admin/                 # Admin panel documentation
├── architecture/          # System architecture decisions
├── migrations/            # Database migration instructions
└── templates/             # Document templates (FEATURE_PROPOSAL.md)
```

**Key Docs**:
- `docs/RECENT_CHANGES.md` - Latest implementation status
- `docs/analysis/PRIORITY_1_COMPLETE_SUMMARY.md` - Consumer dashboard Quick Wins
- `docs/analysis/PRIORITY_2A_IMPLEMENTATION.md` - Service management implementation
- `docs/analysis/CONSUMER_DASHBOARD_COMPARISON.md` - CircleTel vs Supersonic analysis
- `docs/implementation/COMPACT_PACKAGE_CARD_*` - Package card design docs
- `docs/features/customer-journey/VISUAL_CUSTOMER_JOURNEY.md` - Journey maps
- `docs/integrations/DFA_INTEGRATION_FINAL_STATUS.md` - DFA coverage integration

## Getting Started (New Session)

### MANDATORY: Context Analysis First

**ALWAYS run context analysis before starting work:**

```powershell
# Analyze entire project
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1

# Or analyze specific area of work
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path app/admin
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path components
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1 -Path lib
```

This will show:
- Total token usage estimation
- Budget usage percentage (Green/Yellow/Red zones)
- Largest files requiring line ranges
- Optimization recommendations

### Context Budget Zones

- **🟢 Green (<70%)**: Normal operation - load files as needed
- **🟡 Yellow (70-85%)**: Be selective - use line ranges for large files
- **🔴 Red (>85%)**: Load essentials only - consider starting fresh session

### Workflow

1. **Run context analysis** (MANDATORY)
2. `npm run type-check` to see current compilation state
3. Check `docs/RECENT_CHANGES.md` for latest updates
4. Review relevant documentation in `docs/` for your task
5. **Load files progressively** - don't load entire directories
6. Make changes following patterns in this file
7. Run `npm run type-check` before committing
8. Test locally with `npm run dev:memory`

### Progressive Loading Pattern

**✅ CORRECT**:
```
"Show me the admin layout structure"        # Overview, no files loaded
"Load app/admin/layout.tsx"                 # Specific file
"Show me lines 50-100"                      # Section only
"Update line 75 to add new menu item"      # Targeted change
```

**❌ WRONG**:
```
"Load all admin files"                      # Too broad
"Show me everything in app/"                # Context overflow
"Help me understand this codebase"          # Vague, loads too much
```

## Memory Management

Node.js heap limits prevent out-of-memory crashes:

- **Development**: Use `npm run dev:memory` (8GB heap)
- **Type Checking**: Use `npm run type-check:memory` (4GB heap)
- **Building**: Use `npm run build:memory` (8GB heap)
- **CI/CD**: Use `npm run build:ci` (6GB heap)

If you see "JavaScript heap out of memory", always use `:memory` variants.

---

**Last Updated**: 2025-10-27
**Version**: 4.4
**Maintained By**: Development Team + Claude Code

## Recent Updates (Oct 27, 2025)

### Partner Portal & Compliance System (COMPLETE)
- ✅ **Partner Registration** - Business details, banking info (`/partners/onboarding`)
- ✅ **FICA/CIPC Document Upload** - 13 SA-specific compliance categories (`/partners/onboarding/verify`)
- ✅ **Business-Type Requirements** - Dynamic requirements (5-11 documents) based on business type
- ✅ **Supabase Storage Integration** - Private bucket with RLS policies for document security
- ✅ **Real-time Progress Tracking** - Visual progress bar (0-100%) as documents uploaded
- ✅ **Compliance Requirements Logic** - `lib/partners/compliance-requirements.ts` (452 lines)
- ✅ **E2E Testing** - Automated test suite (7/7 tests passing ✅)
- ✅ **Auth Provider Fix** - CustomerAuthProvider skips partner pages to prevent conflicts

### Consumer Dashboard Enhancement (Priority 2A)
- ✅ **Service Management Dropdown** - 1-click access to 6 service actions (`components/dashboard/ServiceManageDropdown.tsx`)
- ✅ **Usage Tracking Page** - Data usage stats & speed test history (`/dashboard/usage`)
- ✅ **Upgrade/Downgrade Flows** - Self-service package changes (`/dashboard/services/upgrade`, `/dashboard/services/downgrade`)
- ✅ **66% Navigation Reduction** - From 3 clicks to 1 click for service management
- ✅ **Supersonic-Inspired UX** - Matches competitor efficiency while maintaining CircleTel branding

### Payment System Enhancement (Oct 26, 2025)
- ✅ **NetCash Pay Now Integration** - Added support for 20+ payment methods
- ✅ **Inline Payment Form** - Modern alternative to redirect flow (`components/checkout/InlinePaymentForm.tsx`)
- ✅ **Payment Demo Page** - Interactive showcase at `/order/payment/demo`
- ✅ **Framer Motion Animations** - Smooth payment UI transitions
- ✅ **Payment Method Selection** - Visual interface for 9 core payment options

## Skills System (7 Total)

All skills auto-load when relevant keywords are mentioned. Manual invocation: `/skill <skill-name>`

1. **context-manager** 🔥 - Token optimization (USE FIRST! Keywords: "token usage", "context limit")
2. **sql-assistant** - Natural language SQL (Keywords: "query database", "show data")
3. **deployment-check** - Pre-deploy validation (Keywords: "deploy", "ready")
4. **coverage-check** - Multi-provider coverage testing
5. **product-import** - Excel imports to Supabase
6. **admin-setup** - RBAC configuration
7. **supabase-fetch** - Database queries

**Full documentation**: `.claude/skills/README.md`
