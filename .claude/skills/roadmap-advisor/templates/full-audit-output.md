# Full Audit Output Template

Use this template for `/roadmap full` command output.

---

```markdown
# CircleTel Roadmap Analysis

**Analysis Date**: YYYY-MM-DD
**Mode**: Full Audit
**Analyst**: roadmap-advisor v1.0.0

---

## Codebase Snapshot

| Metric | Count | Change |
|--------|-------|--------|
| Database Tables | X | - |
| API Routes | Y | - |
| Services | Z | - |
| Components | W | - |
| Active Integrations | N | - |

---

## Executive Summary

[2-3 paragraphs summarizing:
1. Overall platform health and maturity
2. Top 3 critical gaps requiring immediate attention
3. Strategic recommendation for next quarter]

---

## Maturity Scorecard

| Domain | Score | Industry Avg | Status | Trend |
|--------|-------|--------------|--------|-------|
| Billing & Payments | X/10 | 8/10 | [✅/⚠️/❌] | [↑/→/↓] |
| Network & Service | X/10 | 8/10 | [✅/⚠️/❌] | [↑/→/↓] |
| Customer Experience | X/10 | 7/10 | [✅/⚠️/❌] | [↑/→/↓] |
| Operations | X/10 | 7/10 | [✅/⚠️/❌] | [↑/→/↓] |
| Partner/Reseller | X/10 | 6/10 | [✅/⚠️/❌] | [↑/→/↓] |
| Analytics | X/10 | 7/10 | [✅/⚠️/❌] | [↑/→/↓] |
| Admin & Security | X/10 | 8/10 | [✅/⚠️/❌] | [↑/→/↓] |
| **Overall** | **X/10** | **7.3/10** | - | - |

**Legend**: ✅ Above Average | ⚠️ Below Average | ❌ Critical Gap

---

## Priority 1: Critical Gaps (This Quarter)

### 1.1 [Feature Name]

**Gap ID**: GAP-YYYY-001
**Category**: [Network/Billing/CX/etc.]

| Metric | Score |
|--------|-------|
| Business Impact | X/10 |
| Customer Impact | Y/10 |
| Technical Enablement | Z/10 |
| Complexity | W/10 |
| **Priority Score** | **P.PP** |

**Current State**:
[What exists today - be specific about files, tables, routes]

**Target State**:
[Industry-standard capability description]

**Why Critical**:
[Business justification for priority]

**Effort**: [Size] ([X] story points, [Y] weeks)
**Risk**: [Safe/Moderate/Significant]
**Dependencies**: [Prerequisites or "None"]

**Implementation Approach**:

| Step | Owner | Effort | Description |
|------|-------|--------|-------------|
| 1 | database-engineer | X days | [Database changes] |
| 2 | backend-engineer | Y days | [API/service work] |
| 3 | frontend-engineer | Z days | [UI implementation] |
| 4 | testing-engineer | W days | [Test coverage] |

**Related Spec**: `agent-os/specs/[spec-id]/` (if exists)

---

### 1.2 [Next Critical Feature]

[Same format as 1.1]

---

## Priority 2: High-Value Improvements (Next Quarter)

### 2.1 [Feature Name]

**Gap ID**: GAP-YYYY-00X
**Category**: [Category]
**Priority Score**: X.XX

**Summary**: [1-2 sentences describing the gap and its impact]

**Effort**: [Size] ([X] points, [Y] weeks)
**Dependencies**: [Any P1 items that must complete first]

**Quick Description**:
- Current: [Brief current state]
- Target: [Brief target state]
- Value: [Why this matters]

---

### 2.2 [Next Feature]

[Same format as 2.1]

---

## Priority 3: Strategic Enhancements (Future Quarters)

| # | Feature | Category | Priority | Effort | Dependencies |
|---|---------|----------|----------|--------|--------------|
| 3.1 | [Feature] | [Cat] | X.XX | [Size] | [Deps] |
| 3.2 | [Feature] | [Cat] | X.XX | [Size] | [Deps] |
| 3.3 | [Feature] | [Cat] | X.XX | [Size] | [Deps] |

---

## Quick Wins (This Week)

| # | Feature | Effort | Impact | Owner | Notes |
|---|---------|--------|--------|-------|-------|
| QW.1 | [Feature] | XS (1d) | Medium | [Role] | [Brief note] |
| QW.2 | [Feature] | XS (0.5d) | Low | [Role] | [Brief note] |
| QW.3 | [Feature] | S (2d) | Medium | [Role] | [Brief note] |

---

## Technical Debt Items

| # | Item | Location | Effort | Trigger | Risk |
|---|------|----------|--------|---------|------|
| TD.1 | [Description] | `path/to/file.ts` | [Time] | When touching X | [Risk] |
| TD.2 | [Description] | `path/to/file.ts` | [Time] | When touching Y | [Risk] |

---

## Dependency Map

```
                    ┌─────────────────────────────────────┐
                    │         DEPENDENCY GRAPH            │
                    └─────────────────────────────────────┘

    [Foundation Items]              [Dependent Items]

    ┌──────────────┐
    │   GAP-001    │───────────┐
    │ [Feature A]  │           │
    └──────────────┘           │    ┌──────────────┐
                               ├───►│   GAP-003    │
    ┌──────────────┐           │    │ [Feature C]  │
    │   GAP-002    │───────────┘    └──────────────┘
    │ [Feature B]  │
    └──────────────┘

    Legend:
    ───► = "unlocks" / "is prerequisite for"
```

---

## Not Recommended

| # | Feature | Reason |
|---|---------|--------|
| NR.1 | [Feature] | [Why it's not recommended at this time] |
| NR.2 | [Feature] | [Reason] |

---

## Appendix A: Codebase Inventory

### Database Tables by Domain

| Domain | Tables | Key Tables |
|--------|--------|------------|
| Billing | X | `customer_invoices`, `payment_transactions` |
| Customer | Y | `customers`, `customer_services` |
| Coverage | Z | `coverage_leads`, `service_packages` |
| Partner | W | `partners`, `partner_compliance_documents` |
| Admin | N | `admin_users`, `admin_roles` |

### API Routes by Category

| Category | Count | Key Endpoints |
|----------|-------|---------------|
| Admin | X | `/api/admin/*` |
| Customer | Y | `/api/customer/*` |
| Billing | Z | `/api/billing/*` |
| Webhooks | W | `/api/webhooks/*` |

### Service Modules

| Domain | Count | Health |
|--------|-------|--------|
| Billing | X | [Good/Needs Work/Critical] |
| Coverage | Y | [Good/Needs Work/Critical] |
| Integration | Z | [Good/Needs Work/Critical] |

---

## Appendix B: Analysis Methodology

**Phase 1**: Codebase Inventory - Scanned X files, Y routes, Z tables
**Phase 2**: Industry Benchmark - Compared against 82 ISP capabilities
**Phase 3**: Gap Identification - Found N gaps across M categories
**Phase 4**: Prioritization - Applied weighted scoring formula
**Phase 5**: Effort Estimation - Used CircleTel calibration (1.2x factor)
**Phase 6**: Dependency Mapping - Validated DAG with no cycles
**Phase 7**: Output Generation - Formatted per template

**RSI Corrections Applied**: [Yes/No] (X corrections from extracted-rules/)

---

**Generated By**: roadmap-advisor v1.0.0
**Confidence**: [High/Medium/Low]
**Analysis Duration**: [X] minutes
```
