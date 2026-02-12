# Maturity Assessment Heuristics

Score feature completeness using consistent criteria.

---

## Maturity Levels

| Level | Score | Description | Indicators |
|-------|-------|-------------|------------|
| **Complete** | 9-10 | Production-ready, industry-standard | Full CRUD, tested, documented, monitored |
| **Functional** | 7-8 | Works but has gaps | Core features work, missing edge cases |
| **Basic** | 4-6 | MVP implementation | Minimal viable, needs iteration |
| **Partial** | 2-3 | Started but incomplete | Some code exists, not usable |
| **Missing** | 0-1 | Not implemented | No code or only stubs |

---

## Assessment Checklist

### Database Layer (0-10)

| Criterion | Points | Check |
|-----------|--------|-------|
| Table exists | 2 | Migration file present |
| Schema complete | 2 | All necessary columns |
| Relationships defined | 2 | Foreign keys, indexes |
| RLS policies | 2 | Row-level security |
| Audit trail | 2 | Created/updated timestamps |

### API Layer (0-10)

| Criterion | Points | Check |
|-----------|--------|-------|
| Routes exist | 2 | `/api/[domain]/` files |
| CRUD operations | 2 | GET, POST, PUT, DELETE |
| Validation | 2 | Input validation, error responses |
| Authentication | 2 | Auth checks, RBAC |
| Error handling | 2 | Structured errors, logging |

### Service Layer (0-10)

| Criterion | Points | Check |
|-----------|--------|-------|
| Service file | 2 | `lib/[domain]/*-service.ts` |
| Business logic | 2 | Non-trivial processing |
| Abstraction | 2 | Clean interfaces |
| Error recovery | 2 | Retry, fallback |
| Testability | 2 | Unit tests exist |

### UI Layer (0-10)

| Criterion | Points | Check |
|-----------|--------|-------|
| Components exist | 2 | `components/[domain]/` |
| Full UI coverage | 2 | List, detail, forms |
| Loading states | 2 | Skeleton/spinner |
| Error handling | 2 | User-friendly errors |
| Mobile responsive | 2 | Breakpoint handling |

### Integration (0-10)

| Criterion | Points | Check |
|-----------|--------|-------|
| Integration exists | 2 | Service file with API calls |
| Webhook handlers | 2 | Event-driven updates |
| Sync status | 2 | Tracking table |
| Monitoring | 2 | Health checks |
| Documentation | 2 | API docs, flow diagrams |

---

## Domain Scoring Matrix

### Billing Domain

| Component | Weight | Complete | Functional | Basic | Partial | Missing |
|-----------|--------|----------|------------|-------|---------|---------|
| Invoice generation | 25% | 10 | 8 | 5 | 3 | 0 |
| Payment processing | 25% | 10 | 8 | 5 | 3 | 0 |
| Dunning workflow | 20% | 10 | 8 | 5 | 3 | 0 |
| Reconciliation | 15% | 10 | 8 | 5 | 3 | 0 |
| Reporting | 15% | 10 | 8 | 5 | 3 | 0 |

**CircleTel Current**:
- Invoice generation: Functional (8)
- Payment processing: Complete (10)
- Dunning workflow: Partial (3)
- Reconciliation: Basic (5)
- Reporting: Basic (4)
- **Weighted Score**: 7.0/10

### Customer Experience Domain

| Component | Weight | Complete | Functional | Basic | Partial | Missing |
|-----------|--------|----------|------------|-------|---------|---------|
| Self-service portal | 25% | 10 | 8 | 5 | 3 | 0 |
| Billing management | 20% | 10 | 8 | 5 | 3 | 0 |
| Service management | 20% | 10 | 8 | 5 | 3 | 0 |
| Support access | 20% | 10 | 8 | 5 | 3 | 0 |
| Communication | 15% | 10 | 8 | 5 | 3 | 0 |

**CircleTel Current**:
- Self-service portal: Functional (8)
- Billing management: Complete (9)
- Service management: Basic (5)
- Support access: Partial (3)
- Communication: Functional (7)
- **Weighted Score**: 6.5/10

### Network Domain

| Component | Weight | Complete | Functional | Basic | Partial | Missing |
|-----------|--------|----------|------------|-------|---------|---------|
| Uptime monitoring | 30% | 10 | 8 | 5 | 3 | 0 |
| SLA tracking | 25% | 10 | 8 | 5 | 3 | 0 |
| Diagnostics | 20% | 10 | 8 | 5 | 3 | 0 |
| Alerting | 15% | 10 | 8 | 5 | 3 | 0 |
| Reporting | 10% | 10 | 8 | 5 | 3 | 0 |

**CircleTel Current**:
- Uptime monitoring: Missing (0)
- SLA tracking: Missing (0)
- Diagnostics: Missing (0)
- Alerting: Partial (3)
- Reporting: Missing (0)
- **Weighted Score**: 0.5/10

---

## Quick Assessment Template

```markdown
## [Domain] Maturity Assessment

| Layer | Score | Evidence |
|-------|-------|----------|
| Database | X/10 | [Tables, migrations] |
| API | X/10 | [Routes, endpoints] |
| Service | X/10 | [Service files] |
| UI | X/10 | [Components, pages] |
| Integration | X/10 | [External services] |
| **Overall** | **X/10** | - |

**Status**: [Complete/Functional/Basic/Partial/Missing]
**Trend**: [↑ Improving / → Stable / ↓ Declining]
```

---

## Comparison to Industry

| Score | vs Industry |
|-------|-------------|
| 9-10 | Above average (competitive advantage) |
| 7-8 | At industry standard |
| 5-6 | Below average (catch-up needed) |
| 3-4 | Significantly below (prioritize) |
| 0-2 | Critical gap (urgent) |
