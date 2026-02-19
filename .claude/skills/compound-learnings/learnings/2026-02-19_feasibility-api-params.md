# Feasibility Portal API Parameter Fix (2026-02-19)

## Summary
Fixed Sales Feasibility Portal showing consumer products instead of business products by correcting query parameter name.

## Root Cause
**API parameter mismatch:**
```typescript
// Frontend was sending
fetch(`/api/coverage/packages?leadId=${id}&coverageType=business`)

// API expected
const coverageType = searchParams.get('type') || 'residential'
```

Since `coverageType` wasn't recognized, it defaulted to `residential` → `customer_type='consumer'`.

## Fix
```typescript
// Correct parameter name
fetch(`/api/coverage/packages?leadId=${id}&type=business`)
```

## Coverage Packages API Contract

| Parameter | Expected Name | Values | Default |
|-----------|---------------|--------|---------|
| Lead ID | `leadId` | UUID | required |
| Customer Type | `type` | `business` / `residential` | `residential` |

## Business Packages Available

| Product | Service Type | Speed | Price |
|---------|--------------|-------|-------|
| SkyFibre SME Essential | SkyFibre | 50 Mbps | R1,129.57 |
| SkyFibre SME Professional | SkyFibre | 100 Mbps | R1,651.30 |
| SkyFibre SME Premium | SkyFibre | 200 Mbps | R2,520.87 |
| BizFibre Connect Lite | BizFibreConnect | 10 Mbps | R1,954.00 |
| BizFibre Connect Starter | BizFibreConnect | 25 Mbps | R2,184.00 |
| BizFibre Connect Plus | BizFibreConnect | 50 Mbps | R2,874.00 |
| BizFibre Connect Pro | BizFibreConnect | 100 Mbps | R3,449.00 |

## Debugging Pattern

When "wrong data displays" in a list/grid:

1. **Check API call**: What params are being sent?
2. **Check API handler**: What params is it reading? Any defaults?
3. **Check DB query**: What WHERE clause is generated?
4. **Verify DB data**: Do the expected records exist?

```bash
# Quick check for business packages
SELECT name, customer_type, price FROM service_packages
WHERE customer_type = 'business' AND active = true;
```

## Prevention

1. **Document API contracts** in JSDoc or OpenAPI
2. **Grep for all callers** when changing API parameter names
3. **Add TypeScript types** for API request params
4. **Log received params** in APIs during development

## Related Files

- `app/api/coverage/packages/route.ts` - Packages API
- `app/admin/sales/feasibility/components/SingleSiteStepper.tsx` - Single site stepper
- `app/admin/sales/feasibility/page.tsx` - Multiple sites mode

## Tags
#api #parameters #debugging #feasibility #packages
