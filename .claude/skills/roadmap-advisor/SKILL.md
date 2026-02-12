---
name: roadmap-advisor
description: Analyzes codebase and generates prioritized feature recommendations based on ISP industry best practices. Supports full audit, quick scan, and domain-specific analysis modes.
version: 1.0.0
author: CircleTel Engineering
dependencies: compound-learnings, stats-tracker, error-registry
---

# Roadmap Advisor

> "Strategic feature planning informed by codebase reality and industry best practices."

A comprehensive analysis skill that examines the CircleTel platform, identifies capability gaps against ISP industry standards, and generates prioritized, actionable roadmap recommendations with effort estimates and dependencies.

**Philosophy**: Not every feature needs building, but every significant gap needs surfacing. Engineering time is finite—prioritize improvements that maximize business value per hour invested.

## When This Skill Activates

This skill automatically activates when you:
- Need to plan the next development cycle or sprint
- Want to identify missing features or capabilities
- Compare CircleTel against industry standards
- Prioritize technical improvements
- Assess a specific domain (billing, customer experience, network, etc.)
- Plan quarterly or annual product roadmaps
- Evaluate build vs. buy decisions
- Ask "what should we build next?"

**Keywords**: roadmap, feature planning, what should we build, gaps, priorities, audit, capability assessment, industry comparison, strategic planning, product roadmap, feature analysis, next sprint, improvements, recommendations

## Commands

| Command | Duration | Output |
|---------|----------|--------|
| `/roadmap full` | 15-30 min | Complete platform audit across all domains |
| `/roadmap quick` | 5-10 min | Top 10 prioritized recommendations with quick wins |
| `/roadmap [domain]` | 10-15 min | Deep-dive on specific domain |
| `/roadmap compare [competitor]` | 10-15 min | Gap analysis vs competitor features |
| `/roadmap status` | 2 min | Show in-progress recommendations from specs |

### Available Domains

| Domain | Focus Areas |
|--------|-------------|
| `billing` | Invoicing, payments, dunning, reconciliation, usage-based |
| `customer` | Self-service, dashboard, support, communication, onboarding |
| `network` | Monitoring, diagnostics, health, SLA, uptime |
| `operations` | Provisioning, activation, technician workflows, inventory |
| `analytics` | Reporting, forecasting, churn prediction, dashboards |
| `partner` | Commission, onboarding, portal, compliance, white-label |
| `integration` | CRM, accounting, provider APIs, webhooks |

## Core Analysis Methodology

### Phase 1: Codebase Inventory (Automated)

Scan and categorize existing capabilities:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODEBASE INVENTORY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATABASE ──► Count tables, analyze schema coverage              │
│      │        supabase/migrations/*.sql                          │
│      ▼                                                           │
│  API ROUTES ──► Categorize endpoints by domain                   │
│      │          app/api/**/*.ts                                  │
│      ▼                                                           │
│  SERVICES ──► Map service modules and capabilities               │
│      │        lib/*/*.ts                                         │
│      ▼                                                           │
│  COMPONENTS ──► Identify UI coverage per portal                  │
│      │          components/**/*.tsx                              │
│      ▼                                                           │
│  INTEGRATIONS ──► List external services and maturity            │
│                   lib/integrations/, webhooks/                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Inventory Metrics**:
- Tables: Count by domain, schema completeness
- API Routes: Endpoints per category, coverage gaps
- Services: Business logic coverage, abstraction quality
- Components: UI feature parity across portals (admin/customer/partner)
- Integrations: Provider count, sync health, depth

### Phase 2: Schema Analysis

Understand data model completeness:

1. Extract table schemas from migrations
2. Identify relationships and foreign keys
3. Map tables to business domains using `heuristics/domain-detection.md`
4. Flag orphaned or incomplete tables

### Phase 3: Industry Benchmark Comparison

Compare against ISP standards using `benchmarks/isp-industry-standard.md`:

| Category | CircleTel Status | Industry Standard | Gap Score |
|----------|------------------|-------------------|-----------|
| Network Monitoring | Partial | Real-time dashboards, alerting | Medium |
| Usage Billing | Basic | Usage-based, tiered, overage | High |
| Self-Service | Good | 90% issues resolvable | Low |
| SLA Management | Missing | Uptime tracking, credit automation | Critical |
| Churn Prevention | Missing | Predictive analytics, intervention | High |

**Status Legend**:
- ✅ Complete - Full implementation
- ⚠️ Partial - Basic implementation, gaps remain
- ❌ Missing - No implementation

### Phase 4: Gap Prioritization

For each identified gap, evaluate using rubrics in `rubrics/`:

| Factor | Weight | Question |
|--------|--------|----------|
| **Business Impact** | 40% | Revenue, efficiency, compliance (1-10) |
| **Customer Impact** | 30% | Satisfaction, retention, NPS (1-10) |
| **Technical Enablement** | 20% | Unlocks future features (1-10) |
| **Complexity** | -10% | Effort, risk, dependencies (1-10) |

**Priority Score Formula**:
```
PRIORITY = (Business × 0.4) + (Customer × 0.3) + (Enablement × 0.2) - (Complexity × 0.1)
```

### Phase 5: Effort Estimation

Apply CircleTel-calibrated estimates from `heuristics/effort-calibration.md`:

| Size | Story Points | Days | Description |
|------|--------------|------|-------------|
| XS | 1-2 | 0.5-1 | Config change, simple UI tweak |
| S | 3-5 | 2-3 | Single feature, API endpoint + UI |
| M | 8-13 | 1-2 weeks | Multi-component feature, integration |
| L | 21-34 | 3-4 weeks | New subsystem, major workflow |
| XL | 55+ | 6+ weeks | Platform capability, architecture change |

**Calibration Factor**: Apply 1.2x to all estimates based on historical CircleTel data.

### Phase 6: Dependency Mapping

Build dependency graph to ensure valid sequencing:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY EXAMPLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    SLA Tracking ◄──── Uptime Monitoring                          │
│         │                   ▲                                    │
│         │                   │                                    │
│         ▼                   │                                    │
│    Auto Credits ◄──── Network Health DB ◄──── Provider API       │
│                                                                  │
│    (Can't build SLA without uptime, can't credit without SLA)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Validate:
- [ ] No circular dependencies
- [ ] Prerequisites listed for each recommendation
- [ ] Critical path identified

### Phase 7: Roadmap Generation

Output structured recommendations following templates in `templates/`:

1. Executive summary with maturity scorecard
2. Priority tiers (Critical → High → Strategic)
3. Quick wins (<1 week items)
4. Dependency map
5. Not Recommended section with reasoning

## Output Format

See `templates/full-audit-output.md` for complete format. Key sections:

```markdown
# CircleTel Roadmap Analysis

**Analysis Date**: YYYY-MM-DD
**Mode**: [Full Audit / Quick Scan / Domain: X]
**Codebase State**: X tables, Y routes, Z services

---

## Executive Summary

[2-3 paragraphs: key findings, top gaps, strategic recommendation]

### Maturity Scorecard

| Domain | Score | Industry Avg | Status |
|--------|-------|--------------|--------|
| Billing | 7/10 | 8/10 | ⚠️ Below |
| Customer | 8/10 | 7/10 | ✅ Above |
| Network | 3/10 | 8/10 | ❌ Critical |

---

## Priority 1: Critical Gaps (This Quarter)

### 1.1 [Feature Name]

**Current State**: [What exists today]
**Target State**: [Industry-standard capability]
**Business Impact**: X/10 | **Customer Impact**: Y/10
**Effort**: [Size] ([points], [weeks])
**Dependencies**: [Prerequisites]

**Implementation Approach**:
1. [Database work] (database-engineer)
2. [API work] (backend-engineer)
3. [UI work] (frontend-engineer)

---

## Quick Wins (This Week)

| Feature | Effort | Impact | Owner |
|---------|--------|--------|-------|
| [Item] | XS (1d) | Medium | [Role] |

---

## Not Recommended

| Feature | Reason |
|---------|--------|
| [Feature] | [Why not now] |
```

## CircleTel-Specific Patterns

### Strength Indicators (Don't Recommend Replacing)

- **Coverage system**: 4-layer fallback (MTN WMS → Consumer → Provider → Mock)
- **Billing automation**: NetCash Pay Now + eMandate + SMS (complete)
- **Three-context auth**: Consumer/Partner/Admin separation
- **B2B KYC workflow**: 7-stage pipeline (64% complete)
- **Admin panel**: 36 sections, RBAC with 17 roles, 100+ permissions

### Gap Indicators (Check First)

Look for missing tables/features in these areas:
- **Network monitoring**: No `network_health`, `uptime_logs`, `provider_status`
- **SLA management**: No `sla_violations`, `service_credits`
- **Usage tracking**: Basic `usage_history`, no real-time or alerts
- **Churn**: No `churn_predictions`, `at_risk_customers`
- **Knowledge base**: No `kb_articles`, `faq_categories`

### Load-Bearing Code (Be Conservative)

Require extra caution when recommendations touch:
- `lib/supabase/server.ts` - All server-side DB access
- `lib/coverage/aggregation-service.ts` - Revenue-critical coverage
- `components/providers/*AuthProvider.tsx` - Auth state management
- `app/api/webhooks/**/*.ts` - Payment and integration flows

### Estimation Calibration

Use these CircleTel benchmarks for comparison:

| Feature Type | Example | Typical Effort |
|--------------|---------|----------------|
| New DB table + API + UI | Dashboard tab | M (13 pts) |
| New integration | Clickatell SMS | S-M (5-8 pts) |
| New admin section | Workflow orchestration | L (21 pts) |
| New customer feature | Usage alerts | M (8-13 pts) |
| Platform capability | Network monitoring | XL (55+ pts) |

## RSI Integration

This skill integrates with the RSI (Recursive Self-Improvement) system:

### Learning from Corrections

```
┌─────────────────────────────────────────────────────────────────┐
│                    RSI FEEDBACK LOOP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GENERATE ROADMAP ──► USER REVIEWS ──► CORRECTION?               │
│                                              │                   │
│                               NO            YES                  │
│                               │              │                   │
│                               ▼              ▼                   │
│                         SUCCESS         STORE CORRECTION         │
│                      (stats-tracker)   (compound-learnings)      │
│                                              │                   │
│                                              ▼                   │
│                                    UPDATE HEURISTICS             │
│                                    (extracted-rules/)            │
│                                              │                   │
│         IMPROVED FUTURE ◄─────────────────────┘                  │
│         RECOMMENDATIONS                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Correction Types

| Type | Example | Learning |
|------|---------|----------|
| Priority Override | "SLA should be P2, not P1" | Adjust scoring weights |
| Effort Correction | "This took 3 weeks, not 1" | Calibrate estimates |
| Missing Dependency | "Needed X before Y" | Add dependency rule |
| Invalid Recommendation | "We already have X" | Improve inventory scan |
| Business Context | "Can't do X due to regulation" | Add constraint |

When corrected, store the learning in:
- `corrections/roadmap/YYYY-MM-DD_description.md`
- Extract rules to `extracted-rules/` for future runs

### Stats Tracking

Track these metrics via `stats-tracker`:
- Activation count per mode (full/quick/domain)
- Recommendation acceptance rate
- Correction rate
- Most common domains analyzed
- Average analysis duration

## Validation Checklist

After generating a roadmap:

- [ ] Codebase inventory matches reality (spot-check 3 items)
- [ ] No recommendations for features that already exist
- [ ] Dependencies form valid DAG (no cycles)
- [ ] Effort estimates align with similar past work
- [ ] Quick wins are genuinely quick (<2 days)
- [ ] Critical items are genuinely critical (high business/customer impact)
- [ ] Output follows template format
- [ ] CircleTel-specific patterns considered
- [ ] RSI corrections applied (if any exist in `extracted-rules/`)

## Best Practices

1. **Verify Before Recommending**: Always check `docs/architecture/SYSTEM_OVERVIEW.md` and Supabase tables before claiming something is missing

2. **Contextualize Effort**: Reference similar completed work for calibration (check recent commits)

3. **Consider Constraints**: Note regulatory (RICA, POPIA), resource, and technical constraints

4. **Balance Innovation vs Stability**: Don't recommend changing load-bearing systems unless gap is critical

5. **Include Quick Wins**: Every analysis should have 2-3 items achievable in <1 week

6. **Link to Specs**: Reference existing Agent-OS specs in `agent-os/specs/` when relevant

7. **Document Trade-offs**: Explain why recommendation A over alternative B

8. **Update on Corrections**: When corrected, store learning for future analyses

## Related Skills

- `refactor` - For code quality analysis within existing features
- `quality-gates` - For evaluating output quality of specific documents
- `compound-learnings` - For storing corrections and extracted rules
- `stats-tracker` - For tracking skill effectiveness metrics
- `error-registry` - For linking gaps to known recurring issues

---

**Version**: 1.0.0
**Last Updated**: 2026-02-12
**Maintained By**: CircleTel Engineering
**Based On**: ISP Industry Best Practices + CircleTel Operational Knowledge
