# Admin Route Auth Audit

**Generated**: 2026-05-09
**Total routes**: 310
**Protected** (uses `authenticateAdmin()`): 14
**Unprotected**: 292 (excludes 4 intentionally public auth routes)
**Unprotected with write methods**: 183

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Routes with `authenticateAdmin()` | 14 | OK |
| Intentionally public (login, logout, signup, forgot-password) | 4 | OK — no auth needed |
| Unprotected read-only (GET) | 109 | **GAP** — needs `authenticateAdmin()` |
| Unprotected write (POST/PUT/PATCH/DELETE) | 183 | **CRITICAL** — needs `authenticateAdmin()` |

## Currently Protected Routes

| Route | Methods | Domain |
|-------|---------|--------|
| `cms/templates` | GET | CMS |
| `contracts` | GET | Contracts |
| `contracts/wizard` | POST | Contracts |
| `field-ops` | GET | Field Ops |
| `field-ops/jobs` | GET,POST | Field Ops |
| `field-ops/jobs/[id]` | GET,PUT,DELETE | Field Ops |
| `field-ops/technicians` | GET,POST | Field Ops |
| `field-ops/technicians/[id]` | GET,PUT,DELETE | Field Ops |
| `partners` | GET | Partners |
| `partners/[id]` | GET,PUT | Partners |
| `whatsapp-campaign/diagnose` | GET | WhatsApp |
| `whatsapp-campaign/report` | GET | WhatsApp |
| `zoho/billing/health` | GET | Zoho |
| `zoho/sign/health` | GET | Zoho |

## Intentionally Public Routes

These routes handle authentication itself — no `authenticateAdmin()` needed:

- `admin/login` (POST)
- `admin/logout` (POST)
- `admin/signup` (POST)
- `admin/forgot-password` (POST)

---

## Hardening Priority: Batch 1 — CRITICAL Write Routes

Routes with POST/PUT/PATCH/DELETE that perform financial, customer, or infrastructure mutations.

### P0: Financial Operations (billing, payments, invoices)

| Route | Methods | Risk |
|-------|---------|------|
| `billing/credit-notes` | POST,GET | Creates credit notes |
| `billing/generate-invoices-now` | POST | Triggers invoice generation |
| `billing/generate-order-invoice` | POST | Generates order invoice |
| `billing/invoices/[id]/send` | POST | Sends invoice to customer |
| `billing/invoices/[id]/void` | POST | Voids invoice |
| `billing/payments/manual` | POST | Records manual payment |
| `billing/reconciliation/queue/[id]/approve` | POST | Approves reconciliation |
| `billing/reconciliation/queue/[id]/reject` | POST | Rejects reconciliation |
| `billing/reconciliation/trigger` | POST | Triggers reconciliation |
| `billing/run` | POST,GET | Runs billing cycle |
| `billing/trigger` | POST,GET | Triggers billing |
| `billing/send-emandate-reminder` | POST | Sends eMandate reminder |
| `billing/send-invoice` | POST | Sends invoice |
| `billing/send-reminders` | POST,GET | Sends payment reminders |
| `billing/send-sms-reminders` | POST,GET | Sends SMS reminders |
| `billing/whatsapp/send` | POST | Sends WhatsApp message |
| `invoices/[id]/send` | POST | Sends invoice |
| `invoices/[id]/update-number` | PATCH | Updates invoice number |
| `invoices/sync-from-zoho` | POST,GET | Syncs from Zoho |
| `payments/verify` | POST,GET | Verifies payment |
| `settings/billing/[key]` | GET,PUT | Modifies billing settings |
| `settings/billing` | GET,PUT | Modifies billing settings |

### P0: Customer & Order Mutations

| Route | Methods | Risk |
|-------|---------|------|
| `customers/[id]/billing-services/[serviceId]` | PATCH | Modifies billing service |
| `customers/[id]/generate-invoice` | POST | Generates customer invoice |
| `customers/[id]/send-paynow` | POST | Sends PayNow link |
| `customers/[id]/services/activate` | POST | Activates service |
| `customers/[id]/services/cancel` | POST | Cancels service |
| `customers/[id]/services/reactivate` | POST | Reactivates service |
| `customers/[id]/services/suspend` | POST | Suspends service |
| `orders/[orderId]/activate` | POST | Activates order |
| `orders/[orderId]/approve-validation` | POST | Approves validation |
| `orders/[orderId]/complete-installation` | POST | Completes installation |
| `orders/[orderId]/installation/assign` | POST,DELETE | Assigns installer |
| `orders/[orderId]/payment-method` | POST,GET | Sets payment method |
| `orders/[orderId]/status` | GET,PATCH | Changes order status |
| `orders/consumer` | GET,PATCH | Modifies consumer orders |
| `orders/installations/bulk-reschedule` | POST | Bulk reschedule |

### P0: Infrastructure & Network

| Route | Methods | Risk |
|-------|---------|------|
| `network/mikrotik/[id]/backup` | POST | Triggers device backup |
| `network/mikrotik/[id]/reboot` | POST | Reboots device |
| `network/mikrotik/[id]` | GET,PATCH,DELETE | Modifies/deletes device |
| `network/mikrotik/[id]/sync` | POST | Syncs device |
| `network/mikrotik/[id]/wifi` | GET,PATCH | Modifies WiFi config |
| `network/mikrotik` | GET,POST | Adds device |
| `network/outages/[id]` | GET,PATCH,POST | Manages outage |
| `network/outages` | GET,POST | Creates outage |
| `pppoe/credentials/[id]/regenerate` | POST | Regenerates PPPoE creds |
| `pppoe/credentials/[id]/notify` | POST | Sends PPPoE notification |
| `pppoe/credentials/[id]` | GET,DELETE | Deletes PPPoE creds |
| `pppoe/credentials` | GET,POST | Creates PPPoE creds |
| `pppoe/provision/[serviceId]` | POST,DELETE | Provisions/deprovisions |
| `tarana/sync` | POST | Triggers Tarana sync |
| `tarana/predict` | POST | Runs prediction |

### P1: Access Control & User Management

| Route | Methods | Risk |
|-------|---------|------|
| `roles/[id]` | GET,PUT,DELETE | Modifies/deletes roles |
| `roles` | GET,POST | Creates roles |
| `users/pending/[id]/approve` | POST | Approves admin user |
| `users/pending/[id]/reject` | POST | Rejects admin user |
| `partners/[id]/approve` | POST | Approves partner |
| `kyc/verify` | POST | Verifies KYC |
| `kyb/directors/[directorId]/start-kyc` | POST | Starts director KYC |
| `kyb/ubos/[uboId]/start-kyc` | POST | Starts UBO KYC |

### P1: Product & Pricing

| Route | Methods | Risk |
|-------|---------|------|
| `products/[id]` | GET,PUT,PATCH,DELETE | Modifies/deletes product |
| `products/[id]/publish` | POST | Publishes product |
| `products/[id]/cost-components` | GET,POST | Adds cost component |
| `products/[id]/cost-components/[componentId]` | GET,PUT,DELETE | Modifies cost component |
| `products/[id]/cost-components/bulk` | POST | Bulk cost components |
| `products/[id]/relationships` | GET,POST,DELETE | Manages relationships |
| `price-changes/[id]/cancel` | POST | Cancels price change |
| `price-changes/[id]/publish` | POST | Publishes price change |
| `price-changes/[id]` | GET,PUT,DELETE | Modifies price change |
| `price-changes` | GET,POST | Creates price change |
| `product-approvals/[id]/approve` | POST | Approves product |
| `product-approvals/[id]/reject` | POST | Rejects product |
| `mtn-dealer-products/[id]` | GET,PUT,DELETE | Modifies MTN product |
| `mtn-dealer-products/apply-markup` | POST,GET | Applies markup |
| `mtn-dealer-products/auto-curate` | POST | Auto-curates products |
| `mtn-dealer-products/commission` | GET,POST | Sets commission |
| `mtn-dealer-products/import` | POST | Imports products |

### P2: Integration & Sync Operations

| Route | Methods | Risk |
|-------|---------|------|
| `integrations/[slug]/health` | POST | Triggers health check |
| `integrations/[slug]` | GET,PATCH | Modifies integration |
| `integrations/ai-assistant` | POST,GET | AI assistant query |
| `integrations/cron/[id]/trigger` | POST | Manually triggers cron |
| `integrations/interstellio/sessions/[sessionId]` | DELETE | Deletes session |
| `integrations/interstellio/subscribers/[id]/sessions` | GET,DELETE | Deletes sessions |
| `integrations/oauth/[slug]/refresh` | POST | Refreshes OAuth |
| `integrations/oauth/[slug]/revoke` | DELETE | Revokes OAuth |
| `integrations/webhooks/[id]/replay` | POST | Replays webhook |
| `integrations/webhooks/[id]/test` | POST | Tests webhook |
| `integrations/zoho/init-token` | POST,GET | Inits Zoho token |
| `integrations/zoho/retry-queue` | POST,GET | Retries Zoho queue |
| `zoho/books/reset` | POST | Resets Zoho Books |
| `zoho/books/retry-all` | POST | Retries all failed |
| `zoho/books/retry` | POST | Retries single |
| `zoho/books/sync` | POST | Triggers sync |
| `zoho-sync/retry` | POST | Retries sync |

### P2: Remaining Write Routes

| Route | Methods | Domain |
|-------|---------|--------|
| `b2b-customers/[id]/portal-users/[userId]` | DELETE | B2B |
| `b2b-customers/[id]/portal-users` | GET,POST | B2B |
| `b2b-customers/site-details/[id]/activate` | PATCH | B2B |
| `b2b-customers/site-details/[id]/approve` | POST | B2B |
| `b2b-customers/site-details/[id]/reject` | POST | B2B |
| `cms/generate/image` | POST | CMS |
| `cms/generate` | POST,GET | CMS |
| `cms/media/[id]` | GET,PATCH,DELETE | CMS |
| `cms/media` | GET,POST | CMS |
| `cms/pages/[id]/publish` | POST | CMS |
| `cms/pages/[id]/restore` | POST | CMS |
| `cms/pages/[id]` | GET,PUT,PATCH,DELETE | CMS |
| `cms/pages/[id]/schedule` | POST | CMS |
| `cms/pages` | GET,POST,PUT | CMS |
| `cms/preview` | POST,GET,DELETE | CMS |
| `competitor-analysis/matches/[id]` | GET,PATCH,DELETE | Analytics |
| `competitor-analysis/matches` | GET,POST | Analytics |
| `competitor-analysis/providers/[slug]` | GET,PATCH,DELETE | Analytics |
| `competitor-analysis/providers` | GET,POST | Analytics |
| `competitor-analysis/scrape` | GET,POST | Analytics |
| `competitor-analysis/test-scrape` | POST | Analytics |
| `contracts/[id]` | GET,PATCH,DELETE | Contracts |
| `corporate/[id]/pppoe/generate` | POST,GET | Corporate |
| `corporate/[id]` | GET,PATCH | Corporate |
| `corporate/[id]/sites/[siteId]` | GET,PATCH,DELETE | Corporate |
| `corporate/[id]/sites/bulk` | POST | Corporate |
| `corporate/[id]/sites` | GET,POST | Corporate |
| `corporate` | GET,POST | Corporate |
| `cost-component-templates` | GET,POST | Products |
| `coverage-leads/[id]` | GET,PATCH,DELETE | Coverage |
| `coverage-leads` | GET,POST | Coverage |
| `coverage/dfa-buildings/sync` | POST,GET | Coverage |
| `coverage/dfa` | POST | Coverage |
| `coverage/maps` | POST,GET | Coverage |
| `coverage/monitoring` | GET,POST | Coverage |
| `diagnostics/[id]` | GET,POST | Diagnostics |
| `diagnostics/sync` | POST | Diagnostics |
| `finance/ar-analytics` | GET,POST | Finance |
| `finance/outstanding-invoices` | GET,POST | Finance |
| `marketing/announcements/[id]` | GET,PUT,DELETE | Marketing |
| `marketing/announcements` | GET,POST | Marketing |
| `marketing/assets/[id]` | GET,PUT,DELETE | Marketing |
| `marketing/assets` | GET,POST | Marketing |
| `marketing/no-coverage-leads` | GET,PATCH | Marketing |
| `marketing/promotions/[id]` | GET,PUT,DELETE | Marketing |
| `marketing/promotions` | GET,POST | Marketing |
| `network/health/alerts/[id]/acknowledge` | POST | Network |
| `network/mikrotik/test-connection` | POST | Network |
| `notifications/[id]/read` | POST | Notifications |
| `orders/[orderId]/installation/notify` | POST | Orders |
| `orders/[orderId]/payment-method/notify` | POST | Orders |
| `orders/[orderId]/resend-mandate` | POST | Orders |
| `orders/[orderId]/send-mandate-sms` | POST,GET | Orders |
| `orders/[orderId]/upload-installation-document` | POST | Orders |
| `providers/[id]/coverage-files` | POST,GET,DELETE | Providers |
| `providers/[id]/logo` | POST,DELETE | Providers |
| `providers/[id]` | GET,POST | Providers |
| `providers` | GET,POST,PATCH,DELETE | Providers |
| `quotes/preview-pdf` | POST | Quotes |
| `reminders` | GET,POST | Reminders |
| `sales-engine/briefing/slack` | POST | Sales |
| `sales-engine/capital-tracker` | GET,POST | Sales |
| `sales-engine/demographics/import` | POST | Sales |
| `sales-engine/demographics/poi-import` | POST | Sales |
| `sales-engine/leads` | GET,POST | Sales |
| `sales-engine/msc` | GET,PUT | Sales |
| `sales-engine/pipeline` | GET,POST,PUT | Sales |
| `sales-engine/scorecard` | GET,POST | Sales |
| `sales-engine/zone-discovery/[id]` | GET,PUT | Sales |
| `sales-engine/zone-discovery/bulk` | POST | Sales |
| `sales-engine/zone-discovery` | GET,POST | Sales |
| `sales-engine/zones/[id]/coverage` | GET,POST | Sales |
| `sales-engine/zones/[id]/demographics` | GET,POST | Sales |
| `sales-engine/zones/[id]` | GET,PUT,DELETE | Sales |
| `sales-engine/zones` | GET,POST | Sales |
| `sales/feasibility/parse-email` | GET,POST | Sales |
| `search/customers` | GET | Search |
| `suppliers/[id]/enrich` | POST,GET | Suppliers |
| `suppliers/[id]` | GET,PUT,DELETE | Suppliers |
| `suppliers/[id]/sync` | POST | Suppliers |
| `suppliers` | GET,POST | Suppliers |
| `support/attachments` | POST,DELETE,GET | Support |
| `support/send-email` | POST,GET | Support |
| `tarana/metrics` | GET,POST | Tarana |
| `technicians/[id]` | GET,PATCH,DELETE | Technicians |
| `technicians` | GET,POST | Technicians |
| `workflow/approvals` | GET,PATCH | Workflow |

---

## Hardening Template

Every admin route handler should follow this pattern:

```typescript
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  // For RBAC (optional, add when permissions are mapped):
  // const permError = requirePermission(authResult.adminUser, 'billing:write');
  // if (permError) return permError;

  const supabase = await createClient(); // service role OK after auth check
  // ... route logic
}
```

## Execution Strategy

1. **Batch 1 (P0)**: Financial + Customer + Infrastructure write routes (~50 routes)
2. **Batch 2 (P1)**: Access Control + Product/Pricing write routes (~25 routes)
3. **Batch 3 (P2)**: All remaining write routes (~108 routes)
4. **Batch 4**: Read-only routes (~109 routes)

Each batch: apply template → type-check → test affected flows.

## Verification

```bash
# After hardening, this should return only login/logout/signup/forgot-password:
grep -rL "authenticateAdmin" app/api/admin/ --include="route.ts" | \
  grep -v "login\|logout\|signup\|forgot-password"
```
