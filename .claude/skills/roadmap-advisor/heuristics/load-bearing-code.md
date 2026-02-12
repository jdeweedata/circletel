# Load-Bearing Code Inventory

Critical files that require extra caution when recommending changes.

---

## Tier 1: Critical Infrastructure (Never Recommend Replacing)

These files are foundational. Any recommendations involving them should be enhancements, not replacements.

| File | Purpose | Risk |
|------|---------|------|
| `lib/supabase/server.ts` | All server-side DB access | All API routes depend on this |
| `lib/supabase/client.ts` | All client-side DB access | All components depend on this |
| `components/providers/CustomerAuthProvider.tsx` | Customer auth state | Breaks customer portal |
| `components/providers/PartnerAuthProvider.tsx` | Partner auth state | Breaks partner portal |
| `components/providers/AdminAuthProvider.tsx` | Admin auth state | Breaks admin panel |
| `lib/auth/admin-auth.ts` | RBAC validation | All admin routes depend on this |
| `middleware.ts` | Route protection | All auth depends on this |

**Policy**: Only recommend changes when there's a critical bug or security issue.

---

## Tier 2: Revenue-Critical (High Caution)

These files directly impact revenue. Changes require thorough testing.

| File | Purpose | Impact |
|------|---------|--------|
| `lib/coverage/aggregation-service.ts` | Coverage checking | Order flow depends on coverage |
| `lib/billing/paynow-billing-service.ts` | Payment generation | Revenue collection |
| `lib/payments/netcash-service.ts` | Payment processing | Revenue collection |
| `lib/payments/emandate-service.ts` | Debit orders | Recurring revenue |
| `app/api/webhooks/netcash/*.ts` | Payment webhooks | Payment confirmation |
| `components/checkout/InlinePaymentForm.tsx` | Payment UI | Conversion |

**Policy**: Changes allowed but require:
- Explicit test plan
- Staging verification
- Rollback plan documented

---

## Tier 3: Customer-Impacting (Moderate Caution)

These files affect customer experience directly.

| File | Purpose | Impact |
|------|---------|--------|
| `app/(dashboard)/*` | Customer portal | CX and retention |
| `components/dashboard/*` | Dashboard components | Self-service |
| `lib/customer/*` | Customer services | Account management |
| `app/api/customer/*` | Customer APIs | Data access |

**Policy**: Changes allowed with standard review process.

---

## Tier 4: Admin/Internal (Standard Caution)

These files affect internal operations.

| File | Purpose | Impact |
|------|---------|--------|
| `app/admin/*` | Admin panel | Ops efficiency |
| `components/admin/*` | Admin components | Staff productivity |
| `lib/admin/*` | Admin services | Internal tools |

**Policy**: Standard development practices apply.

---

## Integration Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                 DEPENDENCY HIERARCHY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TIER 1: INFRASTRUCTURE                                        │
│   ┌─────────────────┐  ┌─────────────────┐                       │
│   │ lib/supabase/*  │  │   middleware.ts │                       │
│   └────────┬────────┘  └────────┬────────┘                       │
│            │                    │                                │
│            └─────────┬──────────┘                                │
│                      │                                           │
│                      ▼                                           │
│   TIER 2: REVENUE                                               │
│   ┌─────────────────┐  ┌─────────────────┐                       │
│   │ lib/coverage/*  │  │ lib/payments/*  │                       │
│   └────────┬────────┘  └────────┬────────┘                       │
│            │                    │                                │
│            └─────────┬──────────┘                                │
│                      │                                           │
│                      ▼                                           │
│   TIER 3: CUSTOMER                                              │
│   ┌─────────────────┐  ┌─────────────────┐                       │
│   │ app/(dashboard) │  │ lib/customer/*  │                       │
│   └────────┬────────┘  └────────┬────────┘                       │
│            │                    │                                │
│            └─────────┬──────────┘                                │
│                      │                                           │
│                      ▼                                           │
│   TIER 4: ADMIN                                                 │
│   ┌─────────────────┐  ┌─────────────────┐                       │
│   │    app/admin/*  │  │   lib/admin/*   │                       │
│   └─────────────────┘  └─────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Safe Zones (Low Risk)

These areas can be modified more freely:

| Area | Notes |
|------|-------|
| `components/ui/*` | UI primitives, well-tested |
| `app/admin/cms/*` | Content management, isolated |
| `lib/cms/*` | CMS services, non-critical |
| `docs/*` | Documentation only |
| `.claude/*` | Claude tooling |
| `scripts/*` | Dev scripts |

---

## Red Flags for Recommendations

**Do NOT recommend**:
- Replacing auth providers
- Rewriting Supabase clients
- Changing payment webhook handlers
- Modifying middleware logic
- Restructuring coverage service

**Instead recommend**:
- Adding new functionality alongside existing
- Creating adapter layers
- Enhancing existing services
- Adding monitoring/logging

---

## Change Impact Assessment

Before recommending changes to load-bearing code:

1. **Dependency Check**: What depends on this file?
2. **Blast Radius**: If it breaks, what stops working?
3. **Test Coverage**: Are there tests for this?
4. **Rollback Plan**: How to revert quickly?
5. **Staging Validation**: Can we test in staging first?

| Score | Risk Level | Approval Required |
|-------|------------|-------------------|
| 0-2 | Low | Standard review |
| 3-4 | Medium | Senior review |
| 5-6 | High | Architecture review |
| 7+ | Critical | CTO approval |

---

## Emergency Contacts

If load-bearing code breaks:

1. **Check Vercel logs**: Dashboard → Deployments → Logs
2. **Rollback deployment**: Promote last working deployment
3. **Check Supabase**: Dashboard → Logs
4. **Verify webhooks**: Payment provider dashboards
