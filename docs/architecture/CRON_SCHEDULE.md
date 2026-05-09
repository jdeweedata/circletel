# Canonical Cron Schedule

**Scheduler of Record**: VPS crontab (Coolify container, VPS 94.72.104.81)
**Decision Date**: 2026-05-09
**Rationale**: Crontab is provably running with 22 entries. Inngest Cloud is connected (env vars present) but creates dual-fire risk. Inngest is retained as a step-function runtime only — cron triggers will be removed from Inngest function definitions.

---

## Active Dual-Fire Risks (TO BE RESOLVED)

These functions fire from BOTH VPS crontab AND Inngest Cloud cron triggers:

| Domain | Crontab Route | Crontab Schedule | Inngest Function | Inngest Cron | Risk |
|--------|---------------|------------------|------------------|--------------|------|
| **Billing** | `process-billing-day` | `0 5 * * *` | `billing-day` | `0 5 * * *` | **CRITICAL** — same time, financial ops |
| **Debit Orders** | `submit-debit-orders` | `0 6 * * *` | `debit-orders` | `0 4 * * *` | HIGH — same domain, different times |
| **Pay Now Recon** | `paynow-reconciliation` | `0 6 * * *` | `paynow-reconciliation` | `0 7 * * *` | HIGH — crontab route also sends Inngest event (triple fire) |
| **Competitor Scrape** | `competitor-scrape` | `0 1 * * *` | `competitor-scrape` | `0 4 * * *` | MEDIUM — crontab route also sends Inngest event (triple fire) |
| **Payment Recon** | `payment-reconciliation` | `0 7 * * *` | `eft-reconciliation` | `30 7 * * *` | MEDIUM — similar domain, 30min apart |

### Resolution: Remove `cron:` from Inngest function configs

Keep Inngest functions as event-triggered step functions. Remove their cron schedules. The bridge pattern (crontab → curl → route sends Inngest event) is the canonical trigger path for functions that need Inngest's step orchestration.

---

## VPS Crontab Entries (Canonical)

| Schedule (UTC) | SAST | Endpoint | Domain | Notes |
|----------------|------|----------|--------|-------|
| `0 0 * * *` | 02:00 | `generate-invoices` | Billing | Monthly invoice generation |
| `0 0 * * *` | 02:00 | `zoho-sync` | Integration | Zoho CRM product sync |
| `0 1 * * *` | 03:00 | `competitor-scrape` | Analytics | Bridges to Inngest |
| `0 1 * * *` | 03:00 | `stats-snapshot` | Analytics | Daily stats |
| `0 2 * * *` | 04:00 | `expire-deals` | Sales | Expire stale deals |
| `0 2 * * *` | 04:00 | `price-changes` | Products | Price update processing |
| `0 3 * * *` | 05:00 | `zoho-books-sync` | Integration | Zoho Books sync |
| `0 4 1 * *` | 06:00 1st | `generate-monthly-invoices` | Billing | Monthly batch |
| `0 4 25 * *` | 06:00 25th | `generate-invoices-25th` | Billing | 25th generation, bridges to Inngest |
| `0 5 * * *` | 07:00 | `process-billing-day` | Billing | Pay Now for non-eMandate customers |
| `0 6 * * *` | 08:00 | `submit-debit-orders` | Billing | NetCash debit batch |
| `0 6 * * *` | 08:00 | `submit-cc-debit-orders` | Billing | Credit card debit batch |
| `0 6 * * *` | 08:00 | `paynow-reconciliation` | Billing | Bridges to Inngest |
| `0 7 * * *` | 09:00 | `payment-reconciliation` | Billing | NetCash statement recon |
| `0 8 * * *` | 10:00 | `invoice-sms-reminders` | Billing | SMS payment reminders |
| `0 21 * * *` | 23:00 | `ar-snapshot` | Finance | Accounts receivable snapshot |
| `0 0,6,12,18 * * *` | 4x/day | `diagnostics-health-check` | Ops | System health |
| `0 2,6,10,14,18,22 * * *` | 6x/day | `payment-sync-monitor` | Billing | Monitor payment sync |
| `0 */4 * * *` | 6x/day | `payment-sync-retry` | Billing | Retry failed syncs |
| `*/15 * * * *` | every 15m | `zoho-books-retry` | Integration | Retry failed Zoho syncs |
| `*/30 * * * *` | every 30m | `integrations-health-check` | Ops | Integration health |
| `0 3 * * 0` | Sun 05:00 | `cleanup-webhook-logs` | Ops | Weekly cleanup |

## Inngest-Only Functions (Need Crontab Routes)

These functions currently only fire via Inngest Cloud cron. They need `/api/cron/*` routes so crontab can trigger them:

| Schedule (UTC) | SAST | Inngest Function | Domain | Priority |
|----------------|------|------------------|--------|----------|
| `*/15 * * * *` | every 15m | `tarana-metrics-collection` | Network | HIGH — monitoring |
| `*/30 * * * *` | every 30m | `mikrotik-sync` | Network | HIGH — device sync |
| `*/30 * * * *` | every 30m | `ruijie-sync` | Network | HIGH — device sync |
| `*/45 * * * *` | every 45m | `zoho-desk-token-refresh` | Integration | MEDIUM |
| `0 * * * *` | hourly | `ruijie-tunnel-cleanup` | Network | MEDIUM |
| `0 0 * * *` | 02:00 | `dfa-sync` | Network | MEDIUM |
| `0 0 * * *` | 02:00 | `supplier-sync` | Products | MEDIUM |
| `0 3 */7 * *` | every 7d 05:00 | `ruijie-token-refresh` | Network | LOW |
| `0 6 * * *` | 08:00 | `whatsapp-campaign-report` | Marketing | LOW |
| `0 6 * * *` | 08:00 | `whatsapp-notifications` | Comms | LOW |
| `0 22 * * *` | 00:00+1 | `tarana-sync` | Network | MEDIUM |
| `30 3 * * *` | 05:30 | `sales-engine-orchestrator` | Sales | LOW |
| `0 8 * * 1` | Mon 10:00 | `marketing-triggers` | Marketing | LOW |
| `0 1 * * 0` | Sun 03:00 | `zone-demographic-enrichment` | Analytics | LOW |
| `0 0 1 * *` | 1st 02:00 | `osm-poi-sync` | Analytics | LOW |
| `0 6 3 * *` | 3rd 08:00 | `reconciliation-monthly-sweep` | Billing | MEDIUM |

## Bridge Pattern

For functions that need Inngest's step orchestration (retries, fan-out, cancellation):

```
VPS crontab → curl /api/cron/X → route handler → inngest.send({ name: 'domain/action.requested' }) → Inngest runs steps
```

Currently used by: `competitor-scrape`, `paynow-reconciliation`, `generate-invoices-25th`
