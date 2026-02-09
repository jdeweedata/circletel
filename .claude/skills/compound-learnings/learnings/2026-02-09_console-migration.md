# Learning: 2026-02-09 Console Statement Migration (DEBT-001)

**Session**: DEBT-001 API Routes Migration
**Duration**: ~2 hours
**Complexity**: Medium

---

## Summary

Migrated 107 API route files from console.log/error/warn to structured `apiLogger`, completing the DEBT-001 API routes phase. Deployed successfully to production.

## Context

CircleTel had 12,507 console statements across 305 files. These exposed internal state, degraded performance, and polluted logs. The goal was to replace them with structured logging using domain-specific loggers.

## Key Learnings

### 1. Batch by Domain, Not Alphabetically

**What**: Grouping files by functional domain (cron, payments, admin, etc.) made commits reviewable and rollback-friendly.

**Why It Matters**: If a batch has issues, you know exactly which domain is affected and can revert that specific commit.

**Example**:
```bash
# Good: Domain-based batching
git commit -m "chore(DEBT-001): migrate cron routes to cronLogger"
git commit -m "chore(DEBT-001): migrate payment routes to paymentLogger"

# Bad: Alphabetical batching
git commit -m "chore: migrate routes a-f"  # Mixes unrelated code
```

### 2. Logger Selection by Domain

**What**: Created 12 specialized loggers matching business domains.

**Why It Matters**: When debugging production issues, you can filter logs by domain instantly.

**Loggers Created**:
| Logger | Domain | Use For |
|--------|--------|---------|
| `apiLogger` | API routes | General API requests |
| `cronLogger` | Cron jobs | Scheduled tasks |
| `paymentLogger` | Payments | NetCash, billing |
| `webhookLogger` | Webhooks | External callbacks |
| `authLogger` | Auth | Login, sessions |
| `billingLogger` | Billing | Invoices, charges |
| `zohoLogger` | Zoho | CRM sync |
| `activationLogger` | Activation | Service provisioning |
| `coverageLogger` | Coverage | Address checks |
| `notificationLogger` | Notifications | Emails, SMS |
| `kycLogger` | KYC | Identity verification |

### 3. Parallel Agents for Bulk Work

**What**: Used parallel subagents to migrate multiple route batches simultaneously.

**Why It Matters**: Reduced total migration time by ~70% compared to sequential processing.

**Command Pattern**:
```
"Migrate these routes in parallel using subagents:
1. Batch 1: admin/invoices, admin/mtn-dealer-products
2. Batch 2: admin/partners, admin/products
3. Batch 3: dashboard routes"
```

## Friction Points

### Duplicate Catch Blocks

- **Problem**: Automated migration introduced duplicate `} catch (error) {` blocks
- **Cause**: Find-replace logic didn't account for existing error handling structure
- **Solution**: Manual review and fix of syntax errors
- **Prevention**: Always run `npm run type-check` before committing bulk changes

### Nested if(error) Anti-Pattern

- **Problem**: Some files had `if (error) { if (error) { ... } }` nesting
- **Cause**: Previous edits added error checks without removing duplicates
- **Solution**: Rewrote affected functions with clean structure
- **Prevention**: Use ESLint rule for max nesting depth

## Patterns Identified

| Pattern | Use When | Location |
|---------|----------|----------|
| Logger Import | Any API route | `patterns/structured-logging.md` |
| Error Logging | Catch blocks | `patterns/error-handling.md` |
| Domain Logger Selection | New routes | See logger table above |

## Time Analysis

| Phase | Time Spent | Could Be Reduced By |
|-------|------------|---------------------|
| Setup (loggers) | 30min | Already done |
| Migration | 60min | Parallel agents (already used) |
| Syntax Fixes | 20min | Better validation before commit |
| Deployment | 10min | N/A |

## Files Modified

- 107 API route files across `app/api/**`
- `lib/logging/logger.ts` - Added domain loggers
- `docs/TECHNICAL_DEBT_REGISTER.md` - Updated progress

## Commands Used

```bash
# Stage and commit by domain
git add app/api/cron/**/*.ts
git commit -m "chore(DEBT-001): migrate cron routes to cronLogger"

# Type check before push
npm run type-check

# Push and verify deployment
git push origin main
```

## Follow-up Actions

- [x] Update TECHNICAL_DEBT_REGISTER.md
- [x] Mark DEBT-001 API phase complete
- [ ] Migrate remaining ~500 statements in components/hooks (low priority)
- [ ] Add pre-commit hook to block new console statements

## Tags

`#technical-debt` `#logging` `#api-routes` `#bulk-migration`

---

**Compound Score**: 5/5 - This learning directly enables all future logging work and establishes patterns for bulk migrations.
