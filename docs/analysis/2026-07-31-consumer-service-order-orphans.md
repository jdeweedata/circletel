# Consumer service ↔ billable order orphan audit

**Date:** 2026-07-31  
**Script:** `scripts/billing/audit-consumer-service-order-orphans.ts`  
**Workstream:** Near-term BSS floor (Task C1)

## Definition

- **Consumer service:** `customer_services` with `active=true` and `status=active`, excluding clinic/corporate categories (`corporate`, `business_connectivity`) and Unjani packages.
- **Billable order:** `consumer_orders.billing_active = true` for the same `customer_id`.
- **Orphan:** active consumer service with no billable order.

## Dry-run results (live DB, 2026-07-31)

| Metric | Count |
|--------|------:|
| Active services (all) | 24 |
| Active consumer services | 4 |
| Customers with `billing_active` order | 3 |
| Matched | 3 |
| **Orphans** | **1** |
| Reverse gaps | 0 |

### Matched (OK)

| Customer | Service package | Billable order |
|----------|-----------------|----------------|
| Shaun Robertson | SkyFibre Home Plus | ORD-20251108-9841 |
| Prins Mhlanga | SkyFibre Home Plus | ORD-20251210-6408 |
| Ashwyn Watkins | CircleConnect 5G 35 Mbps | ORD-20260508-5728 |

### Orphan (needs ops decision — **not auto-fixed**)

| Field | Value |
|-------|--------|
| Service ID | `59e7c744-2ad8-4911-97a7-a537242c749e` |
| Customer | Raymund Watson (`412b8047-47eb-4d01-9328-431ac0e360dc`) |
| Package | CircleConnect 5G 60 Mbps @ R649 |
| Activation | 2026-06-04 |
| Last invoice | 2026-07-02 |
| Invoices | INV-2026-00012 (paid R605.64); INV-2026-00036 (sent R649) |
| Candidate order | ORD-20260529-1561 (`413ebaa8-1b0c-4e6a-8098-eb38567801f1`) status=`payment_method_pending` |
| Other order | ORD-20260519-0313 cancelled |

**Suggested fix:** link (set `billing_active=true` on ORD-20260529-1561) **after** ops confirms payment method / mandate state. Do **not** deactivate: customer has paid invoices.

```bash
# After ops sign-off only:
set -a && source .env.local && set +a && \
  npx tsx scripts/billing/audit-consumer-service-order-orphans.ts \
    --action=link \
    --service-id=59e7c744-2ad8-4911-97a7-a537242c749e \
    --order-id=413ebaa8-1b0c-4e6a-8098-eb38567801f1 \
    --execute
```

## Execute status

`--execute` was **not** used. Dry-run only. Re-run audit after ops applies link to confirm zero orphans.
