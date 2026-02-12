# Backend Services Rubric

Evaluate backend service maturity for gap analysis.

## Scoring Criteria

| Criterion | Weight | 10 | 5 | 1 |
|-----------|--------|----|----|---|
| **Completeness** | 25% | Full CRUD + business logic + validation | Basic CRUD only | Stub/missing |
| **Abstraction** | 20% | Clean interfaces, DI, single responsibility | Some coupling, mixed concerns | Spaghetti, no separation |
| **Error Handling** | 20% | Comprehensive, typed errors, recovery | Basic try/catch, generic errors | Swallowed/missing errors |
| **Testability** | 15% | Fully tested, mocked dependencies | Some unit tests | No tests |
| **Integration Quality** | 20% | Proper clients, retry, timeout, circuit breaker | Basic API calls | Fragile, no error handling |

## CircleTel Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 8-10 | Excellent | No action needed |
| 6-7 | Good | Minor improvements when touching code |
| 4-5 | Needs Work | Schedule for tech debt sprint |
| 1-3 | Critical | Prioritize for next quarter |

## Domain-Specific Expectations

### Billing Services
- Must handle payment state transitions atomically
- Must log all financial operations to audit table
- Must integrate with NetCash webhook handlers
- Expected score: 8+ for production readiness

### Coverage Services
- Must implement fallback chain correctly
- Must cache responses appropriately
- Must handle provider timeouts gracefully
- Expected score: 7+ due to external dependencies

### Auth Services
- Must validate tokens on every request
- Must implement proper session management
- Must handle multi-context (consumer/partner/admin)
- Expected score: 9+ for security compliance

### Integration Services (Zoho, Didit, etc.)
- Must implement async sync patterns
- Must track sync status in database
- Must handle rate limiting
- Expected score: 7+ (external dependencies lower bar)

## Evaluation Prompt

When scoring a backend service:

1. Check for service file existence: `lib/[domain]/[name]-service.ts`
2. Verify CRUD operations if data-backed
3. Check for error handling patterns (try/catch, custom errors)
4. Look for integration with related services
5. Check for test coverage in `__tests__/` or `.test.ts` files
6. Verify logging using domain logger (`billingLogger`, `apiLogger`, etc.)

## Quick Assessment

```
Service: [Name]
Domain: [billing/coverage/auth/integration/etc.]

Completeness:    _/10 × 0.25 = _
Abstraction:     _/10 × 0.20 = _
Error Handling:  _/10 × 0.20 = _
Testability:     _/10 × 0.15 = _
Integration:     _/10 × 0.20 = _
─────────────────────────────
Total Score:     _/10
Status:          [Excellent/Good/Needs Work/Critical]
```
