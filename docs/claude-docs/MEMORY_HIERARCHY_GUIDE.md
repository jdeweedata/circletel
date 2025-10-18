# Claude Memory Hierarchy Guide

> **Version**: 2.0 (Modular Architecture)
> **Last Updated**: 2025-10-17

## Overview

CircleTel Next.js now uses a **modular memory architecture** to improve Claude Code's context efficiency and reduce token usage. Instead of loading one massive CLAUDE.md file (3,000+ tokens), you now load only the relevant domain context for your task (~2,000 tokens each).

## Architecture

### File Structure

```
.claude/
├── CLAUDE.md                           # Main memory root (project overview)
└── memory/                             # Domain-specific contexts
    ├── frontend/CLAUDE.md              # UI, components, pages, styling
    ├── backend/CLAUDE.md               # API routes, services, business logic
    ├── infrastructure/CLAUDE.md        # Deployment, builds, environment
    ├── integrations/CLAUDE.md          # External APIs (MTN, Zoho, Strapi)
    ├── testing/CLAUDE.md               # Playwright, test scripts, validation
    ├── cms/CLAUDE.md                   # Strapi CMS, content management
    └── product/CLAUDE.md               # Features, roadmap, business logic
```

### Memory Allocation

| Domain | Token Budget | Load When |
|--------|--------------|-----------|
| **Main** (`.claude/CLAUDE.md`) | ~1,500 | Always (project overview, global rules) |
| **Frontend** | ~1,850 | Working on UI, components, styling |
| **Backend** | ~1,950 | Working on API routes, business logic |
| **Infrastructure** | ~1,900 | Deployment, builds, environment issues |
| **Integrations** | ~1,950 | External APIs, third-party services |
| **Testing** | ~1,800 | Writing tests, debugging test failures |
| **CMS** | ~1,950 | Content management, marketing pages |
| **Product** | ~1,900 | Feature planning, business requirements |

**Total Available Context**: 200,000 tokens
**Typical Session**: Main (1,500) + 1 Domain (2,000) = 3,500 tokens (~2% of budget)

## Usage Rules

### 1. Single Context Load Rule

**DO**: Load only ONE domain memory per major task.

```typescript
// ✅ Good: Load frontend context for UI work
// Task: "Add a new package card component"
// Context: .claude/CLAUDE.md + .claude/memory/frontend/CLAUDE.md

// ✅ Good: Load backend context for API work
// Task: "Add a new API endpoint for package filtering"
// Context: .claude/CLAUDE.md + .claude/memory/backend/CLAUDE.md

// ❌ Bad: Loading multiple domains unnecessarily
// Task: "Add a new package card component"
// Context: .claude/CLAUDE.md + frontend + backend + testing (wasteful!)
```

### 2. Context Switching Protocol

**When switching domains, use `/compact preserve active-layer` to clean up context.**

```bash
# Example workflow:

# 1. Start with frontend work
# Load: .claude/memory/frontend/CLAUDE.md
# Task: "Update coverage checker UI"
# → Complete task

# 2. Switch to backend work
# Run: /compact preserve active-layer
# Load: .claude/memory/backend/CLAUDE.md
# Task: "Add new coverage API endpoint"
# → Complete task

# 3. Switch to testing
# Run: /compact preserve active-layer
# Load: .claude/memory/testing/CLAUDE.md
# Task: "Write Playwright test for coverage checker"
```

### 3. No Log Pollution Rule

**NEVER include logs, test traces, or console output in memory files.**

```typescript
// ❌ Bad: Polluting memory with logs
// .claude/memory/backend/CLAUDE.md
## MTN API Test Results
```
npm run test:mtn
✅ Coverage check successful
Response: {"coverage": "5G", ...}
[... 500 lines of output]
```

// ✅ Good: Clean documentation
// .claude/memory/backend/CLAUDE.md
## MTN API Testing
- Test script: `npx tsx scripts/test-mtn-enhanced-headers.ts`
- Documentation: `docs/MTN_ANTI_BOT_WORKAROUND_SUCCESS.md`
- Success rate: 100% (as of Oct 4, 2025)
```

### 4. Update Frequency Rule

**Update memory files only for architectural changes, not every code change.**

```typescript
// ✅ Update memory for:
- New major features (RBAC system, dynamic pricing)
- Architecture changes (switching from REST to GraphQL)
- New integrations (adding Vodacom provider)
- Breaking changes (Next.js 15 upgrade)

// ❌ Don't update memory for:
- Bug fixes (fixing button color)
- Minor tweaks (adjusting padding)
- Temporary changes (debugging code)
- Refactoring (renaming variables)
```

## Domain Guide

### Frontend (`memory/frontend/CLAUDE.md`)

**Load when**:
- Creating/editing React components
- Updating page layouts
- Styling changes (Tailwind CSS)
- Form validation (react-hook-form + Zod)
- State management (React Query, Zustand)
- Responsive design work
- RBAC UI implementation (PermissionGate)

**Contains**:
- Component patterns (Server vs Client Components)
- Design system (brand colors, typography)
- Custom hooks usage
- shadcn/ui component library
- Provider hierarchy
- Styling guidelines

**Example tasks**:
- "Add a new promotion card component"
- "Update coverage checker form validation"
- "Make admin sidebar responsive on mobile"
- "Implement permission gate for product editing"

### Backend (`memory/backend/CLAUDE.md`)

**Load when**:
- Writing/updating API routes
- Business logic implementation
- Database queries (Supabase)
- Server-side validation
- File upload handling
- Error handling
- Caching strategies
- Performance optimization

**Contains**:
- API route patterns (Next.js 15)
- Business logic services
- Coverage system architecture
- Database operations (Supabase)
- RBAC permission checking (server-side)
- File upload architecture
- Error handling patterns

**Example tasks**:
- "Add API endpoint for package filtering"
- "Implement dynamic pricing calculation"
- "Add server-side permission check for products API"
- "Optimize coverage aggregation service"

### Infrastructure (`memory/infrastructure/CLAUDE.md`)

**Load when**:
- Deployment issues
- Build failures
- Environment configuration
- Performance optimization
- Memory management
- Database migrations
- CI/CD pipeline work

**Contains**:
- Vercel deployment config
- Environment variables
- Build system (next.config.js, tsconfig.json)
- Memory optimization (`:memory` scripts)
- Database infrastructure (Supabase)
- Performance monitoring
- Security considerations

**Example tasks**:
- "Fix Vercel build failure"
- "Add new environment variable for Netcash"
- "Optimize build time for large codebase"
- "Configure database backup strategy"

### Integrations (`memory/integrations/CLAUDE.md`)

**Load when**:
- Working with external APIs
- MCP server configuration
- Third-party service integration
- API troubleshooting
- Provider-specific logic

**Contains**:
- MTN Coverage API (WMS client, anti-bot workaround)
- Supersonic API (status: disabled)
- Strapi CMS integration
- Zoho CRM integration
- Google Maps integration
- Email (Resend), Payment (Netcash)
- MCP server configs

**Example tasks**:
- "Debug MTN coverage API failures"
- "Investigate Supersonic empty packages issue"
- "Add new Zoho CRM webhook"
- "Integrate new coverage provider"

### Testing (`memory/testing/CLAUDE.md`)

**Load when**:
- Writing E2E tests (Playwright)
- Running test scripts
- Debugging test failures
- Validating functionality
- Quality assurance

**Contains**:
- Playwright E2E testing patterns
- Validation scripts (TypeScript type-check)
- Integration test scripts
- Admin testing tools
- Test data and fixtures
- QA checklists

**Example tasks**:
- "Write Playwright test for order flow"
- "Debug coverage checker test failure"
- "Run integration tests for MTN API"
- "Validate RBAC permissions across all pages"

### CMS (`memory/cms/CLAUDE.md`)

**Load when**:
- Working with Strapi CMS
- Managing marketing content
- Creating promotions/campaigns
- Content type configuration
- Frontend CMS integration

**Contains**:
- Strapi setup and configuration
- Content types (Promotions, Marketing Pages, Campaigns)
- Frontend integration (hooks, components)
- Admin CMS UI
- Marketing Manager RBAC
- API token management

**Example tasks**:
- "Add new promotion content type field"
- "Create campaign landing page"
- "Update promotion card component"
- "Configure Strapi API token permissions"

### Product (`memory/product/CLAUDE.md`)

**Load when**:
- Planning new features
- Understanding business requirements
- Reviewing product strategy
- Updating roadmap
- Analyzing metrics/KPIs

**Contains**:
- Product vision and mission
- Customer journey maps
- Core features (coverage, pricing, RBAC, etc.)
- Product roadmap (phases 1-7)
- Business rules
- Competitive analysis
- Success metrics

**Example tasks**:
- "Plan dynamic pricing feature"
- "Understand coverage detection business rules"
- "Review RBAC role hierarchy"
- "Update product roadmap for Q2 2025"

## Workflow Examples

### Example 1: Frontend Feature

**Task**: Add a new "Featured Packages" section to the homepage.

```bash
# 1. Load frontend context
# Read: .claude/CLAUDE.md + .claude/memory/frontend/CLAUDE.md

# 2. Implement feature
# - Create FeaturedPackages component
# - Add to homepage
# - Style with Tailwind

# 3. Validate
npm run type-check

# 4. Commit
git add .
git commit -m "Add featured packages section to homepage"
git push
```

**Context Used**: ~3,500 tokens (Main + Frontend)

### Example 2: Backend API + Frontend UI

**Task**: Add package filtering API and update UI to use it.

```bash
# 1. Backend work first
# Load: .claude/memory/backend/CLAUDE.md
# - Create /api/packages/filter route
# - Implement filtering logic
# - Add validation

# 2. Switch context
# Run: /compact preserve active-layer
# Load: .claude/memory/frontend/CLAUDE.md
# - Create useFilteredPackages hook
# - Update PackageGrid to use hook
# - Add filter UI controls

# 3. Validate
npm run type-check

# 4. Commit
git add .
git commit -m "Add package filtering API and UI"
git push
```

**Context Used**: ~3,500 tokens (Main + Backend), then ~3,500 tokens (Main + Frontend) after compact

### Example 3: Integration Debugging

**Task**: Debug MTN coverage API returning empty results.

```bash
# 1. Load integrations context
# Read: .claude/memory/integrations/CLAUDE.md

# 2. Review MTN integration details
# - Check anti-bot workaround implementation
# - Review geographic validation
# - Check monitoring metrics

# 3. Run test script
npx tsx scripts/test-mtn-enhanced-headers.ts

# 4. Fix issue (e.g., coordinates outside SA bounds)

# 5. Verify fix
npx tsx scripts/test-mtn-enhanced-headers.ts
```

**Context Used**: ~3,500 tokens (Main + Integrations)

### Example 4: Full-Stack Feature

**Task**: Implement dynamic pricing system (database + API + UI + tests).

```bash
# Phase 1: Database (Infrastructure)
# Load: .claude/memory/infrastructure/CLAUDE.md
# - Write migration for pricing_rules table
# - Apply migration to Supabase

# Run: /compact preserve active-layer

# Phase 2: Backend (Backend)
# Load: .claude/memory/backend/CLAUDE.md
# - Create pricing service
# - Add API routes (/api/products/pricing)
# - Implement pricing calculation logic

# Run: /compact preserve active-layer

# Phase 3: Frontend (Frontend)
# Load: .claude/memory/frontend/CLAUDE.md
# - Create useDynamicPricing hook
# - Add PriceEditor component
# - Integrate into admin products page

# Run: /compact preserve active-layer

# Phase 4: Testing (Testing)
# Load: .claude/memory/testing/CLAUDE.md
# - Write Playwright test for price editing
# - Create validation script
# - Test end-to-end flow

# Validate
npm run type-check

# Commit
git add .
git commit -m "Implement dynamic pricing system"
git push
```

**Context Used**: ~3,500 tokens per phase (4 phases)
**Total Session**: ~14,000 tokens (vs 50,000+ with monolithic memory)

## Maintenance

### When to Update Memory Files

**Quarterly Review** (every 3 months):
- Review all domain memory files
- Remove outdated information
- Add new architectural patterns
- Update token counts

**After Major Features**:
- Update relevant domain file (e.g., RBAC system → frontend + backend)
- Update main CLAUDE.md decision log
- Update product roadmap (product memory)

**After Architecture Changes**:
- Update affected domain files
- Document migration path
- Update global patterns in main CLAUDE.md

### Memory File Checklist

- [ ] Each file ≤ 2,000 tokens
- [ ] No logs, traces, or console output
- [ ] Clear section headers
- [ ] Code examples are concise and illustrative
- [ ] File paths use project root conventions
- [ ] Dates are included for time-sensitive info
- [ ] Cross-references use relative paths

## Migration from Monolithic CLAUDE.md

### What Changed

**Before** (Monolithic):
- Single `CLAUDE.md` at project root
- ~3,000+ tokens
- All domains mixed together
- Loaded every session (wasteful)

**After** (Modular):
- Main `.claude/CLAUDE.md` (project overview)
- 7 domain-specific files in `.claude/memory/`
- ~2,000 tokens each
- Load only relevant domain per task

### Migration Process

1. **Backup**: Original `CLAUDE.md` saved as `CLAUDE.md.backup`
2. **Split**: Content divided into 8 files (main + 7 domains)
3. **Reorganize**: Each domain file structured for quick reference
4. **Optimize**: Removed redundancy, clarified cross-references
5. **Document**: Created this guide

### Backward Compatibility

The original `CLAUDE.md` at project root has been **replaced** with the new modular structure:
- `.claude/CLAUDE.md` (main)
- `.claude/memory/*/CLAUDE.md` (domains)

If you need the old monolithic version, it's backed up as `CLAUDE.md.backup` in the project root.

## Troubleshooting

### "Which memory file should I load?"

**Ask yourself**:
- Am I working on **UI/components**? → Frontend
- Am I working on **API routes/services**? → Backend
- Am I working on **external APIs**? → Integrations
- Am I **deploying/configuring**? → Infrastructure
- Am I **writing tests**? → Testing
- Am I working with **CMS content**? → CMS
- Am I **planning features**? → Product

**Still unsure?** Start with **Main** (`.claude/CLAUDE.md`) and it will guide you.

### "Memory file doesn't have what I need"

1. Check if information exists in another domain file
2. Check project docs (`/docs` directory)
3. Use `Grep` to search codebase
4. Ask Claude to research (will use Task agent if needed)

### "Memory file is outdated"

1. Note what's outdated (e.g., "Supersonic API status changed")
2. Update the relevant section
3. Add update date at bottom
4. Commit with message "docs: update [domain] memory - [what changed]"

## Best Practices

### ✅ DO

- Load main CLAUDE.md + 1 domain file per task
- Use `/compact preserve active-layer` when switching domains
- Keep memory files concise and actionable
- Update memory after architectural changes
- Cross-reference other memory files when needed
- Use code examples sparingly (illustrative only)

### ❌ DON'T

- Load multiple domain files simultaneously
- Include logs, traces, or test output in memory
- Update memory for minor code changes
- Duplicate information across files
- Write verbose explanations (keep it concise)
- Include temporary/debugging notes

## Setup

### First-Time Setup

```bash
# Run the setup script (Windows PowerShell)
.\.claude\setup-memory-hierarchy.ps1

# This will:
# 1. Create .claude/memory/* directories
# 2. Backup existing CLAUDE.md
# 3. Generate domain-specific memory files
```

### Verify Setup

```bash
# Check directory structure
ls .claude/memory/

# Expected output:
# backend/
# cms/
# frontend/
# infrastructure/
# integrations/
# product/
# testing/

# Check each has CLAUDE.md
ls .claude/memory/*/CLAUDE.md
```

## Support

**Questions?** Check:
1. This guide (you're reading it!)
2. Main memory file (`.claude/CLAUDE.md`)
3. Relevant domain memory file
4. Project docs (`/docs` directory)

**Found an issue?** Update the relevant memory file and commit.

---

**Guide Version**: 1.0
**Last Updated**: 2025-10-17
**Maintained By**: Development Team + Claude Code
