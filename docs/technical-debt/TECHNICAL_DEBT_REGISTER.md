# CircleTel Technical Debt Register

**Generated**: 2026-02-16
**Analyzer**: Claude Code Tech Debt Analyzer
**Codebase Size**: ~349,000 lines across app/lib/components

---

## Executive Summary

| Metric | Count | Severity |
|--------|-------|----------|
| Security Vulnerabilities | 27 (3 critical, 16 high) | 🔴 Critical |
| Type Errors | 45+ | 🔴 High |
| Large Files (>500 lines) | 19 | 🟡 Medium |
| Weak Typing (`any`) | 766 occurrences | 🟡 Medium |
| TODO/FIXME/HACK Markers | 104 | 🟡 Medium |
| Outdated Dependencies | 29+ packages | 🟡 Medium |

**Overall Health Score**: 6.5/10

---

## Critical Issues (Fix Immediately)

### DEBT-001: Security Vulnerabilities in Dependencies

**Category**: Security Debt
**Severity**: 🔴 Critical
**Location**: `package.json` dependencies

**Description**:
NPM audit reports 27 vulnerabilities including 3 critical and 16 high severity issues.

**Impact**:
- Business: Potential security breaches, compliance failures
- Technical: Attack vectors in production code
- Risk: Data exposure, service compromise

**Proposed Solution**:
```bash
npm audit fix
npm audit fix --force  # For breaking changes
```

**Effort Estimate**: 2-4 hours
**Priority**: P0 - Fix immediately
**Owner**: TBD

---

### DEBT-002: Type Errors Blocking Build

**Category**: Code Quality Debt
**Severity**: 🔴 High
**Location**: Multiple files (45+ errors)

**Affected Files**:
| File | Errors | Root Cause |
|------|--------|------------|
| `lib/services/products.ts` | 7 | Missing `supabase` import, null checks |
| `lib/suppliers/product-scraper.ts` | 6 | Firecrawl API type mismatch |
| `slices/*.tsx` (Prismic) | 10+ | Missing Prismic slice types |
| `lib/prismicio.ts` | 4 | Outdated Prismic client API |
| `lib/payments/providers/netcash/*.ts` | 4 | Interface type mismatches |

**Impact**:
- Business: Cannot deploy with strict type checking
- Technical: Hidden runtime errors
- Risk: Production bugs

**Proposed Solution**:
1. Fix missing imports in `products.ts`
2. Update Firecrawl types or pin compatible version
3. Regenerate Prismic types with `npx @slicemachine/init`
4. Align NetCash provider with interface definitions

**Effort Estimate**: 1 day
**Priority**: P0 - Fix before next deploy
**Owner**: TBD

---

## High Priority Issues

### DEBT-003: notification-service.ts God Object (2,388 lines)

**Category**: Architectural Debt
**Severity**: 🟠 High
**Location**: `lib/notifications/notification-service.ts`

**Description**:
Single file handling all notification logic with 2,388 lines. Violates Single Responsibility Principle.

**Impact**:
- Business: Slow feature development for notifications
- Technical: Difficult to test, high coupling
- Risk: Changes break unrelated notification types

**Proposed Solution**:
Split into domain-specific services:
```
lib/notifications/
├── notification-service.ts (orchestrator, <200 lines)
├── email-notifications.ts
├── sms-notifications.ts
├── push-notifications.ts
├── quote-notifications.ts
├── billing-notifications.ts
└── order-notifications.ts
```

**Effort Estimate**: 3 days
**Priority**: P1 - Next sprint
**Target Resolution**: Sprint 25

---

### DEBT-004: admin/products/page.tsx (1,709 lines)

**Category**: Code Quality Debt
**Severity**: 🟠 High
**Location**: `app/admin/products/page.tsx`

**Description**:
Admin products page with 1,709 lines combining data fetching, state management, and complex UI in single file.

**Impact**:
- Business: Slow to add product admin features
- Technical: Component unmaintainable
- Risk: High bug rate on changes

**Proposed Solution**:
Extract into components:
- `ProductsTable.tsx`
- `ProductFiltersPanel.tsx`
- `ProductBulkActions.tsx`
- `useProductsQuery.ts` hook
- Keep page.tsx under 200 lines

**Effort Estimate**: 2 days
**Priority**: P1 - Next sprint
**Target Resolution**: Sprint 25

---

### DEBT-005: Excessive `any` Types (766 occurrences)

**Category**: Code Quality Debt
**Severity**: 🟠 High
**Location**: 343 files across codebase

**Top Offenders**:
| File | `any` Count |
|------|-------------|
| `lib/agents/core/workflow-engine.ts` | 37 |
| `lib/payment/netcash-webhook-processor.ts` | 29 |
| `app/api/contracts/[id]/route.ts` | 24 |
| `lib/coverage/aggregation-service.ts` | 22 |
| `__tests__/notifications/notifications.test.ts` | 20 |
| `services/googleMaps.ts` | 18 |
| `lib/services/products.ts` | 17 |

**Impact**:
- Business: Hidden bugs in production
- Technical: No type safety, harder debugging
- Risk: Runtime errors instead of compile-time errors

**Proposed Solution**:
1. Enable `"strict": true` in tsconfig (if not already)
2. Add ESLint rule: `"@typescript-eslint/no-explicit-any": "error"`
3. Fix top 10 offenders (covers 200+ instances)
4. Gradual migration for remaining files

**Effort Estimate**: 2 weeks (incremental)
**Priority**: P1 - Ongoing
**Target Resolution**: Q1 2026

---

## Medium Priority Issues

### DEBT-006: Large Files (>500 lines) - 19 Files

**Category**: Code Quality Debt
**Severity**: 🟡 Medium

| File | Lines | Recommendation |
|------|-------|----------------|
| `lib/notifications/notification-service.ts` | 2,388 | Split by notification type |
| `app/admin/products/page.tsx` | 1,709 | Extract components |
| `app/terms/page.tsx` | 1,243 | Move to MDX/CMS |
| `app/admin/quotes/new/page.tsx` | 1,201 | Extract form steps |
| `components/.../SiteDetailsForm.tsx` | 1,185 | Split into subforms |
| `lib/integrations/zoho/billing-client.ts` | 1,178 | Split by operation type |
| `app/admin/field-ops/page.tsx` | 1,156 | Extract table/filters |
| `app/admin/orders/[id]/page.tsx` | 1,122 | Already using tabs ✓ |
| `lib/agents/pm/.../product-analysis.ts` | 1,033 | Split by capability |
| `lib/coverage/aggregation-service.ts` | 1,001 | Split by provider |

**Effort Estimate**: 1-2 days per file
**Priority**: P2 - Quarterly
**Target Resolution**: Q2 2026

---

### DEBT-007: TODO/FIXME/HACK Markers (104 occurrences)

**Category**: Code Quality Debt
**Severity**: 🟡 Medium
**Location**: 75 files

**High-Priority Markers** (require attention):
```
lib/payments/payment-provider-factory.ts (3 markers)
lib/integrations/didit/webhook-handler.ts (4 markers)
app/api/admin/orders/[orderId]/status/route.ts (3 markers)
```

**Proposed Solution**:
1. Audit all TODO/FIXME markers
2. Convert to GitHub issues if still relevant
3. Remove if already fixed
4. Document if intentional limitation

**Effort Estimate**: 4 hours
**Priority**: P2 - Monthly review
**Owner**: TBD

---

### DEBT-008: Outdated Dependencies

**Category**: Dependency Debt
**Severity**: 🟡 Medium

**Major Version Updates Needed**:
| Package | Current | Latest | Breaking Changes |
|---------|---------|--------|------------------|
| `@eslint/js` | 9.39.1 | 10.0.1 | Yes |
| `@googlemaps/js-api-loader` | 1.16.10 | 2.0.2 | Yes |
| `@hookform/resolvers` | 3.10.0 | 5.2.2 | Yes |
| `@react-email/components` | 0.5.7 | 1.0.7 | Yes |
| `@react-email/render` | 1.4.0 | 2.0.4 | Yes |
| `@sparticuz/chromium` | 141.0.0 | 143.0.4 | Maybe |
| `@supabase/ssr` | 0.7.0 | 0.8.0 | Maybe |

**Proposed Solution**:
1. Update patch versions: `npm update`
2. Test after each major version bump
3. Schedule breaking change migrations

**Effort Estimate**: 1 day for patch, 1 week for major
**Priority**: P2 - Quarterly
**Target Resolution**: Q1 2026

---

## Low Priority Issues

### DEBT-009: Console Statements in Production Code

**Category**: Code Quality Debt
**Severity**: 🟢 Low
**Status**: Partially resolved (Feb 2026 migration to structured logging)

**Remaining**:
- Test files: OK to keep
- Scripts: OK to keep
- Main app code: Most migrated to `apiLogger`, `cronLogger`, etc.

**Action**: No action needed, monitoring only

---

## Resolved Items

| ID | Description | Resolved Date | Resolution |
|----|-------------|---------------|------------|
| DEBT-R001 | Console.log migration | 2026-02-09 | Migrated to structured loggers |
| DEBT-R002 | Missing Network Monitoring | 2026-02-16 | Implemented Phases 1-3 |

---

## Trends

### Debt by Category

```
Code Quality:    ████████░░ 8 items
Security:        ██░░░░░░░░ 2 items
Dependency:      ██░░░░░░░░ 1 item
Architecture:    ██░░░░░░░░ 1 item
```

### Debt by Severity

```
Critical: ██░░░░░░░░ 2 items (DEBT-001, DEBT-002)
High:     ████░░░░░░ 3 items (DEBT-003, DEBT-004, DEBT-005)
Medium:   ████░░░░░░ 3 items (DEBT-006, DEBT-007, DEBT-008)
Low:      █░░░░░░░░░ 1 item (DEBT-009)
```

---

## Review Schedule

| Frequency | Activity |
|-----------|----------|
| Weekly | Triage new TODO/FIXME markers |
| Monthly | Review debt register, update priorities |
| Quarterly | Full codebase analysis, dependency audit |
| Per Sprint | Allocate 20% capacity to debt reduction |

---

## Recommended Actions (Next 2 Weeks)

1. **Immediate**: Run `npm audit fix` to address security vulnerabilities
2. **This Week**: Fix type errors blocking strict mode (DEBT-002)
3. **Next Sprint**: Split notification-service.ts (DEBT-003)
4. **Ongoing**: Enable ESLint `no-explicit-any` rule, fix incrementally

---

**Last Updated**: 2026-02-16
**Next Review**: 2026-02-23
