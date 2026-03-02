# CircleTel Platform Stabilization Plan

**Created**: 2026-03-02
**Status**: In Progress
**Owner**: Development Team + Claude Code

---

## Executive Summary

CircleTel has grown to 4,500+ source files with 1,005 TypeScript errors blocking clean deployments. This plan systematically addresses technical debt while establishing sustainable management practices.

## Progress Summary (Updated: 2026-03-02)

| Checkpoint | Errors | Reduction |
|------------|--------|-----------|
| Initial | 1,005 | - |
| After Task 1 (Logger Pattern) | 507 | -498 (50%) |
| After Task 2 (ProductFormData) | 491 | -16 |
| After Task 3 (Lucide Imports) | 484 | -7 |
| After Task 4 (Quote Types) | 468 | -16 |
| After Task 5 (Parallel Agents) | **336** | -132 |
| **Total Reduction** | | **67%** |

## Current State Assessment

| Metric | Value | Status |
|--------|-------|--------|
| TSX Files | 1,504 | Large |
| TS Files | 2,009 | Large |
| Pages | 258 | Comprehensive |
| Components | 418 | Needs audit |
| Lib Services | 356 | Good organization |
| Migrations | 210 | Healthy |
| TypeScript Errors | ~~1,005~~ **336** | **Improved** |
| Uncommitted Changes | 33+ files | Needs commit |

---

## Phase 1: Stabilize TypeScript (Priority: Critical)

### Task 1.1: Fix Logger Context Pattern
**Errors Fixed**: ~50 errors
**Time Estimate**: 1-2 hours

The `apiLogger` expects `LogContext` (object), but many API routes pass strings or `PostgrestError` directly.

**Pattern to fix:**
```typescript
// ❌ WRONG
apiLogger.error('[API] Error:', error.message);
apiLogger.error('[API] Failed', postgrestError);

// ✅ CORRECT
apiLogger.error('[API] Error', { error: error.message });
apiLogger.error('[API] Failed', { error: postgrestError.message, code: postgrestError.code });
```

**Files to update:**
- `app/api/admin/billing/*.ts` (15+ files)
- `app/api/admin/quotes/*.ts`
- `app/api/admin/orders/*.ts`

### Task 1.2: Fix ProductFormData Interface
**Errors Fixed**: ~25 errors
**Time Estimate**: 30 minutes

Update `ProductFormData` interface to include missing fields:
- `type`
- `target_market`
- `speed_down`
- `speed_up`
- `data_limit`
- `price`
- `contract_term`
- `availability`

**File**: `app/admin/products/new/page.tsx` or create `types/product-form.ts`

### Task 1.3: Add Missing Lucide Imports
**Errors Fixed**: ~8 errors
**Time Estimate**: 15 minutes

**Missing imports:**
```typescript
import { ShieldCheck, ShieldAlert, RotateCcw } from 'lucide-react';
```

**Files:**
- `app/admin/sales/feasibility/page.tsx`
- `app/admin/sales/feasibility/components/SingleSiteStepper.tsx`

**Also missing:** `mapDarkStyle` - needs to be defined or imported from Google Maps styles.

### Task 1.4: Sync Quote Types with Database
**Errors Fixed**: ~15 errors
**Time Estimate**: 1 hour

Update `QuoteDetails` and `BusinessQuoteItem` interfaces:
```typescript
interface QuoteDetails {
  // Add missing fields:
  signed_at?: string;
  metadata?: Record<string, unknown>;
}

interface BusinessQuoteItem {
  // Add missing fields:
  package_name?: string;
  package_speed?: string;
}

interface BusinessQuoteVersion {
  // Add missing fields:
  change_notes?: string;
}
```

### Task 1.5: Fix Remaining Type Errors
**Errors Fixed**: ~900+ errors
**Time Estimate**: 4-6 hours

Run iterative fixes:
```bash
npm run type-check:memory 2>&1 | head -50
```

**Common patterns:**
- `Type 'undefined' is not assignable` → Add optional chaining or defaults
- `Property does not exist` → Add to interface or use type guard
- `Argument of type 'X' is not assignable` → Cast or update signature

---

## Phase 2: Commit & Deploy Checkpoint

### Task 2.1: Commit Uncommitted Changes
**Time Estimate**: 30 minutes

Review and commit the 33 pending files:
```bash
git add -p  # Interactive staging
git commit -m "feat: platform stabilization checkpoint"
```

### Task 2.2: Verify Staging Deployment
**Time Estimate**: 15 minutes

```bash
git push origin main:staging
# Monitor Vercel deployment
```

---

## Phase 3: Systematic Type Management

### Task 3.1: Set Up Type Auto-Sync
**Time Estimate**: 1 hour

Create automated workflow:
```bash
# Generate types from Supabase
npx supabase gen types typescript --project-id agyjovdugmtopasyvlng > types/database.generated.ts

# Create npm script
npm run sync-types
```

### Task 3.2: Create Shared Type Definitions
**Time Estimate**: 2 hours

Centralize commonly used types:
```
types/
├── database.generated.ts   # Auto-generated from Supabase
├── api-responses.ts        # Shared API response types
├── forms/
│   ├── product-form.ts
│   ├── quote-form.ts
│   └── order-form.ts
└── index.ts                # Re-exports
```

### Task 3.3: Add Type Check to CI/CD
**Time Estimate**: 30 minutes

Update `vercel.json` or GitHub Actions:
```json
{
  "buildCommand": "npm run type-check && npm run build"
}
```

---

## Phase 4: Component Audit & Consolidation

### Task 4.1: Identify Duplicate Components
**Time Estimate**: 2 hours

Run component similarity analysis:
```bash
# Find similar component names
find ./components -name "*.tsx" -exec basename {} \; | sort | uniq -c | sort -rn | head -20

# Look for common patterns
grep -r "className=\"flex items-center" ./components | wc -l
```

### Task 4.2: Create Shared UI Layer
**Time Estimate**: 4 hours

Consolidate into `components/ui/`:
- Buttons (primary, secondary, ghost, danger)
- Cards (product, stat, info)
- Forms (input, select, checkbox, radio)
- Feedback (toast, alert, badge)
- Layout (container, grid, stack)

### Task 4.3: Document Component Library
**Time Estimate**: 2 hours

Create `docs/components/COMPONENT_CATALOG.md` with:
- Component inventory
- Usage examples
- Props documentation
- Visual examples (Storybook or screenshots)

---

## Phase 5: API Route Standardization

### Task 5.1: Create Route Middleware Pattern
**Time Estimate**: 2 hours

Standardize authentication and error handling:
```typescript
// lib/api/middleware.ts
export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context: RouteContext) => {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorized();
    return handler(req, context, user);
  };
}
```

### Task 5.2: Standardize API Response Format
**Time Estimate**: 1 hour

Create consistent response helpers:
```typescript
// lib/api/responses.ts
export const apiResponse = {
  success: <T>(data: T) => NextResponse.json({ success: true, data }),
  error: (message: string, status = 400) => NextResponse.json({ success: false, error: message }, { status }),
  paginated: <T>(data: T[], total: number, page: number, limit: number) => ...
};
```

### Task 5.3: Audit API Routes for Consistency
**Time Estimate**: 3 hours

Check all 100+ API routes for:
- Consistent error handling
- Proper authentication
- Response format
- Logging patterns

---

## Phase 6: Documentation & Onboarding

### Task 6.1: Update SYSTEM_OVERVIEW.md
**Time Estimate**: 2 hours

Ensure `docs/architecture/SYSTEM_OVERVIEW.md` reflects current state:
- Database schema (210 migrations)
- API routes inventory
- Service modules map
- Component structure

### Task 6.2: Create Developer Onboarding Guide
**Time Estimate**: 2 hours

`docs/ONBOARDING.md`:
- Setup instructions
- Key files to understand
- Common patterns
- Debugging tips

### Task 6.3: Skills Catalog Documentation
**Time Estimate**: 1 hour

Document all 62 Claude skills in `docs/SKILLS_CATALOG.md`:
- Skill name and purpose
- Trigger keywords
- Example usage

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| TypeScript Errors | 1,005 | 0 | ⏳ |
| Type Check in CI | No | Yes | ⏳ |
| Uncommitted Files | 33 | 0 | ⏳ |
| Component Duplicates | Unknown | <10% | ⏳ |
| API Response Consistency | ~60% | 100% | ⏳ |
| Documentation Coverage | ~40% | 80% | ⏳ |

---

## Execution Timeline

| Phase | Tasks | Est. Time | Week |
|-------|-------|-----------|------|
| Phase 1 | TypeScript Fixes | 8-10 hours | Week 1 |
| Phase 2 | Commit & Deploy | 1 hour | Week 1 |
| Phase 3 | Type Management | 3.5 hours | Week 1 |
| Phase 4 | Component Audit | 8 hours | Week 2 |
| Phase 5 | API Standardization | 6 hours | Week 2 |
| Phase 6 | Documentation | 5 hours | Week 2 |

**Total Estimated Effort**: ~32 hours over 2 weeks

---

## Progress Tracking

Use Claude Code tasks to track:
```
/tasks                    # View all tasks
TaskUpdate taskId=X status=completed  # Mark complete
```

Or update this document:
- [ ] Task 1.1: Fix Logger Context Pattern
- [ ] Task 1.2: Fix ProductFormData Interface
- [ ] Task 1.3: Add Missing Lucide Imports
- [ ] Task 1.4: Sync Quote Types with Database
- [ ] Task 1.5: Fix Remaining Type Errors
- [ ] Task 2.1: Commit Uncommitted Changes
- [ ] Task 2.2: Verify Staging Deployment
- [ ] Task 3.1: Set Up Type Auto-Sync
- [ ] Task 3.2: Create Shared Type Definitions
- [ ] Task 3.3: Add Type Check to CI/CD
- [ ] Task 4.1: Identify Duplicate Components
- [ ] Task 4.2: Create Shared UI Layer
- [ ] Task 4.3: Document Component Library
- [ ] Task 5.1: Create Route Middleware Pattern
- [ ] Task 5.2: Standardize API Response Format
- [ ] Task 5.3: Audit API Routes for Consistency
- [ ] Task 6.1: Update SYSTEM_OVERVIEW.md
- [ ] Task 6.2: Create Developer Onboarding Guide
- [ ] Task 6.3: Skills Catalog Documentation

---

**Next Action**: Start with Task 1.1 (Logger Context Pattern) - highest impact, fixes 50+ errors.
