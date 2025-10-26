# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Tables**:
- `service_packages` - Products/packages
- `coverage_leads` - Coverage check results
- `customers` - Customer accounts
- `orders` - Order records
- `admin_users` - Admin accounts
- `fttb_network_providers` - Provider metadata

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
| **supabase-fetch** | Query database with pre-built operations | See `.claude/skills/supabase-fetch/` |
| **sql-assistant** | Natural language to SQL | See `.claude/skills/sql-assistant/` |
| **deployment-check** | Pre-deployment validation | See `.claude/skills/deployment-check/` |
| **coverage-check** | Test multi-provider coverage | See `.claude/skills/coverage-check/` |
| **product-import** | Import products from Excel | See `.claude/skills/product-import/` |
| **admin-setup** | Configure RBAC roles/users | See `.claude/skills/admin-setup/` |

**Documentation**: `.claude/skills/README.md`

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
- `docs/implementation/COMPACT_PACKAGE_CARD_*` - Package card design docs
- `docs/features/customer-journey/VISUAL_CUSTOMER_JOURNEY.md` - Journey maps
- `docs/integrations/DFA_INTEGRATION_FINAL_STATUS.md` - DFA coverage integration

## Getting Started (New Session)

1. Run `npm run type-check` to see current compilation state
2. Check `docs/RECENT_CHANGES.md` for latest updates
3. Review relevant documentation in `docs/` for your task
4. Make changes following patterns in this file
5. Run `npm run type-check` before committing
6. Test locally with `npm run dev:memory`

## Memory Management

Node.js heap limits prevent out-of-memory crashes:

- **Development**: Use `npm run dev:memory` (8GB heap)
- **Type Checking**: Use `npm run type-check:memory` (4GB heap)
- **Building**: Use `npm run build:memory` (8GB heap)
- **CI/CD**: Use `npm run build:ci` (6GB heap)

If you see "JavaScript heap out of memory", always use `:memory` variants.

---

**Last Updated**: 2025-10-26
**Version**: 4.1
**Maintained By**: Development Team + Claude Code

## Recent Updates (Oct 26, 2025)

### Payment System Enhancement
- ✅ **NetCash Pay Now Integration** - Added support for 20+ payment methods
- ✅ **Inline Payment Form** - Modern alternative to redirect flow (`components/checkout/InlinePaymentForm.tsx`)
- ✅ **Payment Demo Page** - Interactive showcase at `/order/payment/demo`
- ✅ **Framer Motion Animations** - Smooth payment UI transitions
- ✅ **Payment Method Selection** - Visual interface for 9 core payment options

### Component Architecture
- ✅ **21st Magic MCP Integration** - Rapid UI component generation
- ✅ **Two-Column Payment Layout** - Industry-standard checkout design
- ✅ **CircleTel Design System** - Consistent orange (#F5831F) branding
- ✅ **Mobile-First Responsive** - Optimized for South African connectivity
