# CircleTel Next.js - Claude Code Guide

> **Navigation Hub**: This file provides quick orientation. For detailed context, load domain-specific memory files in `.claude/memory/`.

## Quick Start

**Project**: Enterprise telecommunications platform (B2B/B2C ISP)
**Stack**: Next.js 15, TypeScript, Supabase, Tailwind CSS, Strapi CMS
**Supabase Project**: `agyjovdugmtopasyvlng`

### Essential Commands
```bash
npm run dev:memory       # Start dev server (ALWAYS use :memory variant)
npm run type-check       # REQUIRED before every commit
npm run build:memory     # Production build with memory allocation
```

### Pre-Commit Checklist (MANDATORY)
1. `npm run type-check` → Fix all errors
2. `npm run type-check` again → Verify clean
3. Commit and push

**Why**: This prevents Vercel build failures by catching TypeScript errors locally.

## Memory Architecture

### Load ONE Domain Context Per Task

| Domain | Load When | Memory File |
|--------|-----------|-------------|
| **Frontend** | UI components, pages, styling, UX | `.claude/memory/frontend/CLAUDE.md` |
| **Backend** | API routes, server logic, data processing | `.claude/memory/backend/CLAUDE.md` |
| **Infrastructure** | Deployment, builds, CI/CD, performance | `.claude/memory/infrastructure/CLAUDE.md` |
| **Integrations** | External APIs (MTN, Zoho, Strapi, Maps) | `.claude/memory/integrations/CLAUDE.md` |
| **Testing** | Playwright E2E, validation, test scripts | `.claude/memory/testing/CLAUDE.md` |
| **CMS** | Strapi content, marketing pages | `.claude/memory/cms/CLAUDE.md` |
| **Product** | Features, roadmap, business logic | `.claude/memory/product/CLAUDE.md` |

### Context Switching Protocol
1. **Identify task domain**: What layer are you working on?
2. **Load ONE memory file**: Import only the relevant context
3. **Work on task**: Make changes, test, validate
4. **Switch domains**: Run `/compact preserve active-layer` before loading new context

### Memory Guidelines
- **Token Budget**: Each domain file ≤ 2,000 tokens
- **No Log Pollution**: Never include console output, test results, or traces
- **Update Triggers**: Update memories after architectural changes only, not every code change
- **Cross-Reference**: Memories can reference other domains (e.g., "See backend memory for API patterns")

## Quick Reference

### Tech Stack
- **Framework**: Next.js 15 (App Router), TypeScript (strict mode)
- **Database**: Supabase PostgreSQL with RLS
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **State**: React Query (server) + Zustand (client)
- **Auth**: Supabase Auth + RBAC (17 role templates, 100+ permissions)
- **Testing**: Playwright via MCP
- **Deployment**: Vercel (primary) + Netlify (backup)
- **PWA**: next-pwa with offline support

### Brand Colors (Tailwind Config)
```typescript
'circleTel-orange': '#F5831F'      // Primary brand
'circleTel-darkNeutral': '#1F2937' // Dark text
'circleTel-lightNeutral': '#E6E9EF' // Light backgrounds
```

### Project Structure (High-Level)
```
circletel-nextjs/
├── .claude/
│   ├── memory/              # Domain-specific contexts (LOAD THESE)
│   ├── agents/              # AI agent templates
│   ├── skills/              # Automation skills
│   └── CLAUDE.md            # Session starter guide
├── app/                     # Next.js App Router
│   ├── admin/               # Protected admin panel
│   ├── api/                 # API routes
│   ├── coverage/            # Coverage checker
│   └── [...public pages]
├── components/              # React components
│   ├── ui/                  # shadcn/ui library
│   ├── admin/               # Admin components
│   └── [...domain components]
├── lib/                     # Services, utilities, types
│   ├── coverage/            # Multi-provider coverage
│   ├── rbac/                # Permission system
│   ├── types/               # TypeScript definitions
│   └── auth/                # Authentication services
├── hooks/                   # Custom React hooks
├── supabase/                # Database migrations
├── docs/                    # Documentation
│   ├── features/            # Feature specs
│   ├── integrations/        # API integration docs
│   ├── testing/             # Test reports
│   └── RECENT_CHANGES.md    # Implementation status log
└── scripts/                 # Utility scripts
```

### Key File Locations

| Purpose | Path |
|---------|------|
| Session Starter | `.claude/CLAUDE.md` |
| Recent Changes | `docs/RECENT_CHANGES.md` |
| Admin Auth | `hooks/useAdminAuth.ts` |
| Customer Auth | `lib/auth/customer-auth-service.ts` |
| RBAC Permissions | `lib/rbac/permissions.ts` |
| Coverage Aggregator | `lib/coverage/aggregation-service.ts` |
| MTN Integration | `lib/coverage/mtn/wms-client.ts` |

### Environment Variables (Critical)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>

# Strapi CMS (optional)
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<token>
```

See `.env.example` for complete list.

## File Organization Rules (CRITICAL)

### Configuration Files (Root Only)
**Allowed in root**:
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`
- `.env*`, `.gitignore`, `.eslintrc.json`
- `CLAUDE.md`, `README.md`, `LICENSE`, `.mcp.json`

**Never in root**: Source code (`.ts`, `.tsx`), migrations (`.sql`), tests, screenshots

### Directory Placement

| File Type | Location |
|-----------|----------|
| Pages | `/app/[page]/page.tsx` |
| API Routes | `/app/api/[endpoint]/route.ts` |
| Components | `/components/[domain]/[Component].tsx` |
| Hooks | `/hooks/use-[name].ts` |
| Types | `/lib/types/[domain].ts` |
| Services | `/lib/[service]/[class].ts` |
| Migrations | `/supabase/migrations/[timestamp]_*.sql` |
| Documentation | `/docs/[category]/[DOC].md` |
| Test Files | `/docs/testing/[test].js` |
| Screenshots | `/docs/screenshots/[image].png` |
| Archive | `/docs/archive/[old-file]` |

### File Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Pages**: `page.tsx`, `layout.tsx`, `route.ts`
- **Hooks**: `use-[name].ts` (kebab-case)
- **Services**: `[name]-service.ts` (kebab-case)
- **Migrations**: `YYYYMMDDHHMMSS_description.sql`
- **Docs**: `SCREAMING_SNAKE_CASE.md` or `Title_Case.md`

## Architecture Principles

1. **Type Safety First**: Strict TypeScript, no `any`, mandatory type checking pre-commit
2. **Modular Design**: Clear separation of concerns (see domain memories)
3. **Multi-Provider Fallback**: 4-layer coverage fallback (MTN Business → Consumer → Provider APIs → Mock)
4. **RBAC Everywhere**: Permission gates on all admin features
5. **Progressive Enhancement**: PWA with offline support, graceful degradation
6. **Documentation Co-location**: Keep docs near code (`/docs` mirrors `/app` structure)

## TypeScript Patterns (Quick Reference)

```typescript
// Next.js 15 API Route Params (REQUIRED pattern)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
}

// Strapi Response Types (use correct one)
type StrapiResponse<T> = { data: T }              // Single entity
type StrapiCollectionResponse<T> = { data: T[] }  // Collection

// API Response Pattern (always use)
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
```

## Import Conventions

```typescript
// ✅ GOOD: Organized imports
import React, { useState } from 'react'           // React
import { useQuery } from '@tanstack/react-query'  // External
import { Button } from '@/components/ui/button'   // Internal
import type { User } from '@/lib/types'           // Types

// ✅ GOOD: Use @ alias for all project imports
import { createClient } from '@/lib/supabase/server'

// ❌ BAD: Relative imports
import { createClient } from '../../../lib/supabase/server'
```

## Agent Skills System

| Skill | Purpose | Auto-Load Trigger |
|-------|---------|-------------------|
| **deployment-check** | Pre-deployment validation | "ready to deploy", "check deployment" |
| **coverage-check** | Test coverage APIs | "test coverage", "check MTN" |
| **sql-assistant** | Natural language to SQL | "show me data", "query database" |
| **product-import** | Import products from Excel | "import products", "load Excel" |
| **admin-setup** | Configure RBAC roles | "setup admin", "create role" |
| **supabase-fetch** | Query database | "fetch from Supabase" |

**Full Documentation**: `.claude/skills/README.md`

## Common Debugging Patterns

### Infinite Loading States
**Symptom**: Component stuck on "Loading..." indefinitely

**Cause**: Async callbacks without error handling

**Solution**:
```typescript
// ❌ BAD: No error handling
useEffect(() => {
  const callback = async () => {
    const data = await fetchData() // If throws, loading never becomes false
    setState(data)
    setLoading(false)
  }
  someListener(callback)
}, [])

// ✅ GOOD: Proper error handling
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
  someListener(callback)
}, [])
```

**Real Example**: `CustomerAuthProvider` (components/providers/CustomerAuthProvider.tsx:107-113)
- See commit `24547cb` for implementation

### Authentication Flow Debugging
**Tools**:
- Browser console: Check for "Auth state changed:" logs
- Network tab: Look for `/auth/v1/token` requests
- LocalStorage: Inspect `sb-agyjovdugmtopasyvlng-auth-token`
- Database: Query `customers` table to verify records exist

## Documentation

### Core Documentation
- **Session Starter**: `.claude/CLAUDE.md` - Start here for new sessions
- **Recent Changes**: `docs/RECENT_CHANGES.md` - Implementation status and updates
- **Memory Guide**: `docs/claude-docs/MEMORY_HIERARCHY_GUIDE.md` - How to use domain memories
- **Skills Guide**: `.claude/skills/README.md` - Automation skills reference

### Domain-Specific Documentation
- **RBAC System**: `docs/rbac/RBAC_SYSTEM_GUIDE.md`
- **Customer Journey**:
  - **Visual Journey Maps**: `docs/features/customer-journey/VISUAL_CUSTOMER_JOURNEY.md` ⭐ NEW - Mermaid diagrams
  - **Improvements & Optimizations**: `docs/features/customer-journey/JOURNEY_IMPROVEMENTS.md` ⭐ NEW - 70+ recommendations
  - **Pain Points Analysis**: `docs/features/customer-journey/PAIN_POINTS_ANALYSIS.md` ⭐ NEW - Prioritized issues
  - Implementation Plan: `docs/features/customer-journey/IMPLEMENTATION_PLAN.md`
- **Architecture**:
  - **Auth Decision**: `docs/architecture/SUPABASE_VS_CLERK_AUTH_ANALYSIS.md` ⭐ NEW - Stay with Supabase (detailed analysis)
- **Multi-Provider Coverage**: `docs/features/customer-journey/MULTI_PROVIDER_ARCHITECTURE.md`
- **MTN Integration**: `docs/integrations/DFA_INTEGRATION_FINAL_STATUS.md`
- **Marketing CMS**: `docs/marketing/README.md`
- **Netcash Payments**: `docs/integrations/NETCASH_MIGRATION_CHECKLIST.md`

## Getting Started (New Session)

1. **Read This File**: Orient yourself with project structure
2. **Load `.claude/CLAUDE.md`**: Get session-specific context and decision log
3. **Check `docs/RECENT_CHANGES.md`**: See latest implementation status
4. **Identify Task Domain**: What are you working on?
5. **Load ONE Memory File**: Import only the relevant domain context (frontend/backend/etc.)
6. **Run Type Check**: `npm run type-check` to see current state
7. **Make Changes**: Implement feature/fix
8. **Validate**: `npm run type-check` again before committing
9. **Switch Domains**: Run `/compact preserve active-layer` before loading new context

---

**Last Updated**: 2025-10-24
**Memory Version**: 3.0 (Optimized Navigation Hub)
**Root File Token Count**: ~3,000 tokens (reduced from ~15,000)
**Maintained By**: Development Team + Claude Code
