# Effort Calibration Heuristics

CircleTel-specific effort estimates based on historical data.

---

## Base Effort Matrix

| Task Type | Base Estimate | CircleTel Factor | Adjusted |
|-----------|---------------|------------------|----------|
| New DB table + API + UI | 13 points (2 weeks) | 1.2x | 16 points |
| New integration service | 8 points (1 week) | 1.3x | 10 points |
| New admin section | 21 points (3 weeks) | 1.1x | 23 points |
| New customer feature | 8 points (1 week) | 1.2x | 10 points |
| Platform capability | 55 points (8 weeks) | 1.3x | 72 points |
| Bug fix | 2 points (0.5 days) | 1.0x | 2 points |
| Refactoring | 5 points (3 days) | 1.1x | 6 points |

---

## Size Categories (Calibrated)

| Size | Raw Points | Adjusted | Days | Weeks |
|------|------------|----------|------|-------|
| XS | 1-2 | 1-2 | 0.5-1 | <0.5 |
| S | 3-5 | 4-6 | 2-3 | 0.5-1 |
| M | 8-13 | 10-16 | 5-10 | 1-2 |
| L | 21-34 | 25-41 | 15-25 | 3-5 |
| XL | 55+ | 66+ | 40+ | 6+ |

---

## Historical Benchmarks

### Completed Features (Actual Effort)

| Feature | Estimated | Actual | Factor |
|---------|-----------|--------|--------|
| B2B KYC workflow | 40 pts | 61 pts | 1.53 |
| Admin orders redesign | 21 pts | 28 pts | 1.33 |
| Billing automation | 34 pts | 42 pts | 1.24 |
| Partner portal | 21 pts | 25 pts | 1.19 |
| Pay Now integration | 13 pts | 15 pts | 1.15 |
| Corporate accounts | 21 pts | 24 pts | 1.14 |
| Design system | 8 pts | 8 pts | 1.00 |

**Average Factor**: 1.23x (round to 1.2x for planning)

---

## Effort by Engineer Type

| Engineer | Typical Tasks | Velocity Modifier |
|----------|---------------|-------------------|
| database-engineer | Migrations, RLS, triggers | 1.0x |
| backend-engineer | API routes, services | 1.2x |
| frontend-engineer | Components, pages | 1.1x |
| integration-engineer | External APIs, webhooks | 1.3x |
| testing-engineer | E2E, unit tests | 1.0x |

---

## Complexity Multipliers

### Technical Complexity

| Factor | Multiplier | When to Apply |
|--------|------------|---------------|
| New technology | 1.5x | First time using a library/service |
| Complex state | 1.3x | Multi-step workflows, state machines |
| Performance-critical | 1.2x | Must optimize for scale |
| Security-sensitive | 1.3x | Auth, payments, PII |
| External dependency | 1.3x | Relying on 3rd party APIs |
| Database migration | 1.2x | Changing existing tables |

### Team Factors

| Factor | Multiplier | When to Apply |
|--------|------------|---------------|
| Solo developer | 1.0x | Single person working |
| Pair programming | 0.8x | Two people collaborating |
| Context switching | 1.3x | Developer splitting time |
| New to codebase | 1.5x | First time contributor |

---

## Task Breakdown Templates

### New Feature (M - 10-16 points)

| Phase | Effort | Owner |
|-------|--------|-------|
| Database schema | 2 pts | database-engineer |
| API endpoints | 4 pts | backend-engineer |
| Service logic | 3 pts | backend-engineer |
| UI components | 4 pts | frontend-engineer |
| Testing | 2 pts | testing-engineer |
| Documentation | 1 pt | any |
| **Total** | **16 pts** | - |

### Integration (S-M - 8-12 points)

| Phase | Effort | Owner |
|-------|--------|-------|
| API client | 2 pts | backend-engineer |
| Webhook handler | 3 pts | backend-engineer |
| Sync service | 3 pts | backend-engineer |
| Status table | 1 pt | database-engineer |
| Admin UI | 2 pts | frontend-engineer |
| Testing | 1 pt | testing-engineer |
| **Total** | **12 pts** | - |

### Admin CRUD (M - 13 points)

| Phase | Effort | Owner |
|-------|--------|-------|
| Database table | 2 pts | database-engineer |
| List endpoint + UI | 3 pts | full-stack |
| Create endpoint + form | 3 pts | full-stack |
| Edit endpoint + form | 2 pts | full-stack |
| Delete endpoint | 1 pt | backend-engineer |
| Permissions | 1 pt | backend-engineer |
| Testing | 1 pt | testing-engineer |
| **Total** | **13 pts** | - |

---

## Risk-Adjusted Estimates

| Confidence | Multiplier | Use When |
|------------|------------|----------|
| High (>80%) | 1.0x | Well-understood, done before |
| Medium (60-80%) | 1.2x | Some unknowns, similar work done |
| Low (40-60%) | 1.5x | New territory, external deps |
| Very Low (<40%) | 2.0x | First of its kind, research needed |

---

## Estimation Formula

```
Final Estimate = Base Points × CircleTel Factor × Complexity Multipliers × Risk Adjustment

Example:
- Task: New payment reconciliation feature
- Base: 13 points (M)
- CircleTel Factor: 1.2
- Complexity: External dependency (1.3), Database migration (1.2)
- Risk: Medium confidence (1.2)

Final = 13 × 1.2 × 1.3 × 1.2 × 1.2 = 29 points (~L)
```

---

## Quick Reference Card

| Feature Type | Quick Estimate |
|--------------|----------------|
| Simple config change | XS (1 day) |
| New API endpoint | S (3 days) |
| New page with form | S-M (1 week) |
| New admin section | M (2 weeks) |
| New integration | M (2 weeks) |
| New workflow | L (3-4 weeks) |
| Platform capability | XL (6+ weeks) |
