# Architecture Discovery

**Generated**: 2026-05-09 | **Method**: Automated codebase inspection | **Scope**: Full repo at `/home/circletel`

---

## 1. Executive Summary

CircleTel is a **single-repo Next.js 15 monolithic application** serving as a B2B/B2C ISP platform for South Africa. It combines a marketing site, customer self-service portal, admin dashboard (100+ routes), partner/reseller portal, B2B quoting system, and extensive API layer — all in one Next.js app with 254 pages.

The system integrates with 15+ external services (Zoho CRM/Desk/Books/Sign, NetCash payments, MTN/Tarana/Ruijie/Interstellio network equipment, DiDiT KYC, Clickatell SMS, Resend email, Google Maps/Gemini, WhatsApp Business). Background work is orchestrated via Inngest (27+ functions) and 22 Vercel-style cron endpoints.

Production runs on **Coolify (Docker) on a self-hosted VPS** (94.72.104.81) after migration from Vercel in April 2026. Supabase (hosted) provides PostgreSQL, auth, storage, and 17 edge functions. The CI/CD pipeline builds on a self-hosted GitHub Actions runner on the same VPS due to the app's memory requirements (~12GB heap for builds).

A **Vue admin SPA** (`admin.circletel.co.za`) was scaffolded but has no source in the main repo — it is deployed separately on Coolify per project memory.

---

## 2. Repo Map

### Monorepo or Single Repo
**Single repo** — no workspace config (no turbo.json, nx.json, lerna.json, or pnpm-workspace.yaml). One `package.json` at root.

### Main App
- **Framework**: Next.js 15.1.9 (App Router, `output: 'standalone'`)
- **Language**: TypeScript 5.5.3
- **UI**: React 18.3.1, Tailwind 3.4.11, Radix UI, shadcn/ui, Framer Motion
- **State**: Zustand (orders/UI), React Query (server state), React Hook Form + Zod
- **Database**: Supabase (project `agyjovdugmtopasyvlng`)
- **Jobs**: Inngest 3.46.0
- **Payments**: NetCash Pay Now
- **Email**: Resend + React Email templates
- **Package manager**: npm (`package-lock.json`)

### Important Scripts (`package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev:memory` | `NODE_OPTIONS='--max-old-space-size=8192' next dev` | Dev server (8GB heap) |
| `build:memory` | `NODE_OPTIONS='--max-old-space-size=8192' next build` | Local build |
| `build:ci` | `NODE_OPTIONS='--max-old-space-size=6144' next build` | CI build (self-hosted runner) |
| `type-check:memory` | `NODE_OPTIONS='--max-old-space-size=4096' tsc --noEmit` | Type check |
| `test` | `jest` | Unit tests |
| `test:e2e:staging` | `playwright test -c playwright.staging.config.ts` | E2E staging |
| `analyze` | `ANALYZE=true next build` | Bundle analysis |

### Dependencies
- **Runtime**: 103 packages
- **Dev**: 14 packages
- **Notable**: puppeteer-core (PDF generation), cheerio (HTML parsing), jsPDF (invoice PDF), recharts (charts)

---

## 3. Important Structure

```
/home/circletel/
├── app/                              # Next.js App Router (254 pages)
│   ├── api/                          # API route handlers (~570 endpoints)
│   │   ├── admin/                    # Admin-only endpoints (~229 routes)
│   │   ├── cron/                     # 22 scheduled job endpoints
│   │   ├── coverage/                 # Coverage check APIs
│   │   ├── payments/                 # Payment processing (NetCash)
│   │   ├── webhooks/                 # Third-party webhook receivers
│   │   ├── dashboard/               # Customer self-service APIs
│   │   ├── partners/                # Reseller partner APIs
│   │   ├── quotes/                  # B2B quoting (CPQ)
│   │   ├── compliance/             # KYC/KYB verification
│   │   ├── contracts/              # Digital contract signing
│   │   ├── orders/                 # Order flow APIs
│   │   ├── auth/                   # Authentication callbacks
│   │   ├── inngest/                # Inngest webhook handler
│   │   ├── portal/                 # B2B portal APIs
│   │   ├── ruijie/                 # Network device management
│   │   └── ...                     # 18+ additional groups
│   ├── admin/                        # Admin dashboard pages (100+)
│   ├── dashboard/                    # Customer portal pages
│   ├── order/                        # Order flow pages
│   ├── products/                     # Product pages (public)
│   ├── packages/                     # Package selection
│   ├── auth/                         # Login/signup/reset
│   ├── portal/                       # B2B customer portal
│   ├── partners/                     # Partner/reseller portal
│   ├── ambassadors/                  # Ambassador portal
│   └── ...                           # 59 route directories total
├── components/                       # React components (50+ subdirs)
│   ├── admin/                        # Admin dashboard components
│   ├── checkout/                     # Payment flow UI
│   ├── coverage/                     # Coverage check widgets
│   ├── dashboard/                    # Customer portal components
│   ├── products/                     # Product page components
│   ├── navigation/                   # Header, footer, menus
│   ├── ui/                           # shadcn base components
│   ├── billing/                      # Finance UIs
│   ├── partners/                     # Partner components
│   └── ...
├── lib/                              # Service layer (66 modules)
│   ├── supabase/                     # DB client contexts (server.ts, client.ts)
│   ├── inngest/                      # Job orchestration
│   │   ├── client.ts                 # Inngest client + 58 event types
│   │   ├── index.ts                  # Function registry
│   │   └── functions/                # 27+ background job functions
│   ├── integrations/                 # External API clients
│   │   ├── zoho/                     # Zoho CRM/Desk/Books/Sign
│   │   ├── didit/                    # KYC verification
│   │   ├── clickatell/              # SMS delivery
│   │   └── whatsapp/                # WhatsApp Business
│   ├── payments/                     # NetCash services
│   ├── billing/                      # Invoice generation
│   ├── coverage/                     # Coverage aggregation (MTN, Echo)
│   ├── tarana/                       # Fixed wireless API
│   ├── ruijie/                       # WiFi AP management
│   ├── interstellio/                # PPPoE/RADIUS
│   ├── orders/                       # Order processing
│   ├── products/                     # Product catalog
│   ├── cpq/                          # Configure-price-quote
│   └── ...
├── middleware.ts                      # 5-step request pipeline
├── middleware/                        # Middleware handlers
│   ├── admin-auth.ts
│   ├── portal-auth.ts
│   ├── ambassador-auth.ts
│   ├── subdomain-handler.ts
│   └── supabase-client.ts
├── supabase/                         # Supabase project
│   ├── migrations/                   # 262 SQL migration files
│   └── functions/                    # 17 Edge functions
├── data/                             # Static product/content data
│   └── exports/
├── emails/                           # React Email templates
│   ├── contract-ready.tsx
│   ├── kyc-completed.tsx
│   ├── service-activated.tsx
│   └── templates/
├── products/                         # Product bundles/pricing docs
│   ├── wholesale/                    # MTN, Arlan, DFA pricing
│   ├── bundles/
│   ├── cloud-hosting/
│   └── managed-it/
├── scripts/                          # Utility scripts (TS, Python, SQL)
├── docs/                             # Documentation (73 subdirs)
│   ├── architecture/                 # System overview, schemas
│   ├── api/                          # API documentation
│   ├── features/                     # Feature specs by date
│   ├── implementation/               # Implementation guides
│   ├── integrations/                 # Third-party integration docs
│   └── deployment/                   # Deployment guides
├── __tests__/                        # Jest unit tests
├── tests/                            # E2E and integration tests
├── designs/                          # Pencil CLI design files (.pen)
├── public/                           # Static assets
├── .github/workflows/                # 10 CI/CD pipelines
├── .claude/                          # Claude Code skills, rules, memory
├── memory-os/                        # Memory OS (persistent AI context)
├── agent-os/                         # Agent specs
├── openspec/                         # OpenSpec changes/specs
│
├── next.config.js                    # Build config (standalone, PWA, webpack)
├── vercel.json                       # Vercel/cron config (40 functions, 22 crons)
├── Dockerfile                        # Production container (node:20-alpine + Chromium)
├── nixpacks.toml                     # Coolify build config
├── tailwind.config.ts                # Design system tokens
├── DESIGN.md                         # Design system spec
├── CLAUDE.md                         # AI assistant instructions
├── .env.example                      # Env template (50+ vars)
└── .mcp.json                         # MCP server config (8 servers)
```

---

## 4. Runtime Surfaces

| Surface | Purpose | Runtime | Repo Path | Hosting | Access | Auth |
|---------|---------|---------|-----------|---------|--------|------|
| Marketing site | Public marketing, SEO | Next.js SSG/SSR | `app/(marketing pages)` | Coolify/VPS | Public | None |
| Product pages | Product catalog, CRO | Next.js SSG | `app/products/` | Coolify/VPS | Public | None |
| Coverage check | Address coverage lookup | Next.js + API | `app/coverage/`, `app/api/coverage/` | Coolify/VPS | Public | None |
| Order flow | 3-step checkout | Next.js + API | `app/order/`, `app/packages/` | Coolify/VPS | Public | Optional (guest checkout) |
| Customer dashboard | Self-service portal | Next.js + API | `app/dashboard/`, `app/api/dashboard/` | Coolify/VPS | Private | Supabase cookie auth + RLS |
| Admin dashboard | Business operations | Next.js + API | `app/admin/`, `app/api/admin/` | Coolify/VPS | Private | RBAC (17 roles) |
| B2B portal | Corporate customer portal | Next.js + API | `app/portal/`, `app/api/portal/` | Coolify/VPS | Private | Supabase cookie auth |
| Partner portal | Reseller management | Next.js + API | `app/partners/`, `app/api/partners/` | Coolify/VPS | Private | Partner auth |
| Ambassador portal | Referral tracking | Next.js + API | `app/ambassadors/` | Coolify/VPS | Private | Ambassador auth |
| Vue admin SPA | Admin UI (new) | Vue 3 + Vite | Separate repo/deploy | Coolify/VPS | Private | Unknown |
| API service | REST endpoints | Next.js route handlers | `app/api/` (~570 routes) | Coolify/VPS | Mixed | Per-route |
| Webhook receivers | Third-party callbacks | Next.js route handlers | `app/api/webhooks/`, `app/api/payments/*/webhook` | Coolify/VPS | Public | HMAC-SHA256 |
| Inngest handler | Background job receiver | Next.js route handler | `app/api/inngest/route.ts` | Coolify/VPS | Private | Inngest signing key |
| Cron endpoints | Scheduled jobs | Next.js route handlers | `app/api/cron/` (22 routes) | Coolify/VPS | Private | Auth header |
| Supabase edge functions | Serverless functions | Deno (Supabase) | `supabase/functions/` (17 functions) | Supabase (hosted) | Private | Service role |

---

## 5. Endpoint Inventory

### 5.1 Cron Jobs (22 endpoints)

| Method | Path | File | Purpose | Frequency | External Calls |
|--------|------|------|---------|-----------|----------------|
| GET | `/api/cron/generate-invoices` | `app/api/cron/generate-invoices/route.ts` | Daily invoice generation | Daily midnight | None |
| GET | `/api/cron/generate-invoices-25th` | `app/api/cron/generate-invoices-25th/route.ts` | Monthly invoice batch | 25th @ 04:00 | Resend (email) |
| GET | `/api/cron/generate-monthly-invoices` | `app/api/cron/generate-monthly-invoices/route.ts` | Full monthly billing | 1st @ 04:00 | Resend, Clickatell |
| GET | `/api/cron/expire-deals` | `app/api/cron/expire-deals/route.ts` | Expire old deals | Daily @ 02:00 | None |
| GET | `/api/cron/price-changes` | `app/api/cron/price-changes/route.ts` | Apply scheduled price changes | Daily @ 02:00 | None |
| GET | `/api/cron/zoho-sync` | `app/api/cron/zoho-sync/route.ts` | CRM data sync | Daily midnight | Zoho CRM |
| GET | `/api/cron/zoho-books-sync` | `app/api/cron/zoho-books-sync/route.ts` | Accounting sync | Daily @ 03:00 | Zoho Books |
| GET | `/api/cron/zoho-books-retry` | `app/api/cron/zoho-books-retry/route.ts` | Retry failed syncs | Every 15 min | Zoho Books |
| GET | `/api/cron/integrations-health-check` | `app/api/cron/integrations-health-check/route.ts` | Health check all integrations | Every 30 min | All providers |
| GET | `/api/cron/cleanup-webhook-logs` | `app/api/cron/cleanup-webhook-logs/route.ts` | Prune old logs | Weekly Sunday @ 03:00 | None |
| GET | `/api/cron/competitor-scrape` | `app/api/cron/competitor-scrape/route.ts` | Scrape competitor pricing | Daily @ 01:00 | Firecrawl |
| GET | `/api/cron/payment-reconciliation` | `app/api/cron/payment-reconciliation/route.ts` | Reconcile payments | Daily @ 07:00 | NetCash |
| GET | `/api/cron/payment-sync-retry` | `app/api/cron/payment-sync-retry/route.ts` | Retry failed payment syncs | Every 4 hours | NetCash |
| GET | `/api/cron/payment-sync-monitor` | `app/api/cron/payment-sync-monitor/route.ts` | Payment sync monitoring | 6x daily | NetCash |
| GET | `/api/cron/invoice-sms-reminders` | `app/api/cron/invoice-sms-reminders/route.ts` | SMS invoice reminders | Daily @ 08:00 | Clickatell |
| GET | `/api/cron/ar-snapshot` | `app/api/cron/ar-snapshot/route.ts` | Accounts receivable snapshot | Daily @ 21:00 | None |
| GET | `/api/cron/submit-debit-orders` | `app/api/cron/submit-debit-orders/route.ts` | EFT debit orders | Daily @ 06:00 | NetCash |
| GET | `/api/cron/submit-cc-debit-orders` | `app/api/cron/submit-cc-debit-orders/route.ts` | Credit card debits | Daily @ 06:00 | NetCash |
| GET | `/api/cron/process-billing-day` | `app/api/cron/process-billing-day/route.ts` | Billing day processing | Daily @ 05:00 | None |
| GET | `/api/cron/stats-snapshot` | `app/api/cron/stats-snapshot/route.ts` | Business stats capture | Daily @ 01:00 | None |
| GET | `/api/cron/diagnostics-health-check` | `app/api/cron/diagnostics-health-check/route.ts` | Network diagnostics | Every 6 hours | Tarana, Ruijie |
| GET | `/api/cron/paynow-reconciliation` | `app/api/cron/paynow-reconciliation/route.ts` | PayNow reconciliation | Daily @ 06:00 | NetCash |

### 5.2 Webhooks (6+ endpoints)

| Method | Path | File | Source | Purpose | Verification |
|--------|------|------|--------|---------|--------------|
| POST | `/api/webhooks/netcash/emandate` | `app/api/webhooks/netcash/emandate/route.ts` | NetCash | eMandate callbacks | HMAC-SHA256 |
| POST | `/api/webhooks/netcash/zoho-billing` | `app/api/webhooks/netcash/zoho-billing/route.ts` | NetCash | Payment→Zoho sync | HMAC-SHA256 |
| POST | `/api/webhooks/clickatell/delivery` | `app/api/webhooks/clickatell/delivery/route.ts` | Clickatell | SMS delivery reports | Signature |
| POST | `/api/webhooks/interstellio/diagnostics` | `app/api/webhooks/interstellio/diagnostics/route.ts` | Interstellio | Device diagnostics | HMAC-SHA256 |
| POST | `/api/webhooks/resend` | `app/api/webhooks/resend/route.ts` | Resend | Email delivery status | Signature |
| POST | `/api/webhooks/whatsapp` | `app/api/webhooks/whatsapp/route.ts` | WhatsApp/Meta | Inbound messages | Meta signature |
| POST | `/api/compliance/webhook/didit` | `app/api/compliance/webhook/didit/route.ts` | DiDiT | KYC verification results | HMAC-SHA256 |
| POST | `/api/contracts/webhook/zoho-sign` | `app/api/contracts/webhook/zoho-sign/route.ts` | Zoho Sign | Signature status | HMAC-SHA256 |
| POST | `/api/payments/netcash/webhook` | `app/api/payments/netcash/webhook/route.ts` | NetCash | Payment notifications | HMAC-SHA256 |

### 5.3 Customer-Facing APIs (grouped)

**Coverage & Products (~17 routes)**

| Method | Path | Purpose | Supabase | External |
|--------|------|---------|----------|----------|
| POST | `/api/coverage/check` | Sync coverage check | Write (coverage_leads) | MTN WMS, Echo, DFA |
| POST | `/api/coverage/check-async` | Async coverage check | Write | MTN, Echo, DFA |
| GET | `/api/coverage/packages` | Available packages at address | Read | None |
| POST | `/api/coverage/lead-capture` | Capture no-coverage lead | Write | None |
| GET | `/api/coverage/products` | Product availability | Read | None |
| POST | `/api/coverage/mtn/check` | MTN network check | Write | MTN WMS |
| POST | `/api/coverage/mtn/consumer-check` | MTN public API | Write | MTN Consumer API |
| GET | `/api/products` | Product catalog | Read | None |
| GET | `/api/products/[slug]` | Product details | Read | None |
| GET | `/api/products/addons` | Add-on products | Read | None |

**Orders & Checkout (~6 routes)**

| Method | Path | Purpose | Supabase | External |
|--------|------|---------|----------|----------|
| POST | `/api/orders/create` | Create consumer order | Write (consumer_orders) | None |
| GET | `/api/orders/pending` | Pending orders | Read | None |
| POST | `/api/orders/create-pending` | Save draft order | Write | None |
| POST | `/api/orders/mobile-deal` | MTN mobile deal | Write | MTN |

**Payments (~22 routes)**

| Method | Path | Purpose | Supabase | External |
|--------|------|---------|----------|----------|
| POST | `/api/payments/initiate` | Start payment | Write | NetCash |
| GET | `/api/payments/status/[id]` | Check payment | Read | NetCash |
| POST | `/api/payments/tokenize` | Tokenize card | Write | NetCash PCI Vault |
| GET | `/api/payments/callback` | Payment callback | Write | NetCash |
| POST | `/api/payment/emandate/initiate` | eMandate request | Write | NetCash |
| POST | `/api/payment/netcash/initiate` | NetCash Pay Now | Write | NetCash |
| GET | `/api/pay/[invoiceNumber]` | Invoice payment page | Read | None |

**Dashboard / Customer Portal (~15 routes)**

| Method | Path | Purpose | Supabase | External |
|--------|------|---------|----------|----------|
| GET | `/api/dashboard/summary` | Account overview | Read (session) | None |
| GET | `/api/dashboard/invoices` | Invoice list | Read (session) | None |
| GET | `/api/dashboard/invoices/[id]/pdf` | Invoice PDF | Read (session) | None |
| POST | `/api/dashboard/invoices/[id]/pay` | Pay invoice | Write (session) | NetCash |
| GET | `/api/dashboard/services` | Active services | Read (session) | None |
| GET | `/api/dashboard/payment-methods` | Saved payment methods | Read (session) | None |

**B2B Quoting & Compliance (~35 routes)**

| Method | Path | Purpose | Supabase | External |
|--------|------|---------|----------|----------|
| POST | `/api/quotes/business/create` | Create B2B quote | Write (service role) | None |
| GET | `/api/quotes/business/[id]` | Quote details | Read | None |
| POST | `/api/quotes/business/[id]/approve` | Accept quote | Write | None |
| GET | `/api/quotes/business/[id]/pdf` | Quote PDF | Read | jsPDF |
| POST | `/api/compliance/create-kyc-session` | Start KYC | Write | DiDiT |
| POST | `/api/contracts/create-from-quote` | Quote→Contract | Write | None |
| POST | `/api/contracts/[id]/send-for-signature` | Send for e-sign | Write | Zoho Sign |

### 5.4 Admin APIs (~229 routes, all require admin RBAC)

**Major groups** (all use service role Supabase):

| Group | Route Prefix | Approx Routes | Key External Calls |
|-------|-------------|---------------|-------------------|
| Billing | `/api/admin/billing/` | 36 | NetCash, Resend, Clickatell |
| B2B Customers | `/api/admin/b2b-customers/` | 17 | None |
| CMS | `/api/admin/cms/` | 12 | Google Gemini |
| Customers | `/api/admin/customers/` | 16 | NetCash, Resend |
| Orders | `/api/admin/orders/` | 17 | Clickatell (SMS) |
| Network | `/api/admin/network/` | 18 | Ruijie, Tarana, Interstellio |
| Integrations | `/api/admin/integrations/` | 33 | All providers |
| Coverage | `/api/admin/coverage/` | 13 | DFA, MTN |
| Products | `/api/admin/products/` | 12 | None |
| Sales Engine | `/api/admin/sales-engine/` | 28 | None |
| Marketing | `/api/admin/marketing/` | 11 | None |
| Competitors | `/api/admin/competitor-analysis/` | 8 | Firecrawl |
| KYC/KYB | `/api/admin/kyc/`, `/api/admin/kyb/` | 6 | DiDiT |
| Finance | `/api/admin/finance/` | 4 | None |
| Other (auth, roles, contracts, etc.) | `/api/admin/...` | 56 | Various |

### 5.5 Network Device APIs (~22 routes)

| Method | Path | Purpose | External |
|--------|------|---------|----------|
| GET | `/api/ruijie/devices` | List WiFi APs | Ruijie Cloud |
| GET | `/api/ruijie/devices/[sn]` | AP details | Ruijie Cloud |
| GET | `/api/ruijie/devices/[sn]/clients` | Connected clients | Ruijie Cloud |
| POST | `/api/ruijie/reboot/[sn]` | Reboot device | Ruijie Cloud |
| POST | `/api/ruijie/sync` | Sync all devices | Ruijie Cloud |

### 5.6 Supabase Edge Functions (17 functions)

| Function | Purpose | Location |
|----------|---------|----------|
| `admin-approval-workflow` | Admin user approval pipeline | `supabase/functions/admin-approval-workflow/` |
| `admin-auth` | Admin authentication | `supabase/functions/admin-auth/` |
| `admin-product-management` | Product CRUD | `supabase/functions/admin-product-management/` |
| `admin-signup` | Admin registration | `supabase/functions/admin-signup/` |
| `approve-admin-user` | Approval workflow | `supabase/functions/approve-admin-user/` |
| `billing-auto-generate` | Auto invoice generation | `supabase/functions/billing-auto-generate/` |
| `check-coverage` | Coverage feasibility | `supabase/functions/check-coverage/` |
| `check-fttb-coverage` | FTTB coverage checks | `supabase/functions/check-fttb-coverage/` |
| `invoice-reminder` | Invoice reminders | `supabase/functions/invoice-reminder/` |
| `send-admin-notification` | Admin notifications | `supabase/functions/send-admin-notification/` |
| `send-audit-notification` | Audit event alerts | `supabase/functions/send-audit-notification/` |
| `unjani-form-submission` | Unjani partner forms | `supabase/functions/unjani-form-submission/` |
| `zoho-callback` | Zoho webhook handler | `supabase/functions/zoho-callback/` |
| `zoho-crm` | Zoho CRM sync | `supabase/functions/zoho-crm/` |
| `_shared` | Shared utilities | `supabase/functions/_shared/` |

---

## 6. Integrations

| Service | Purpose | Where Used | Direction | Trigger | Secrets | Owner Runtime |
|---------|---------|------------|-----------|---------|---------|---------------|
| **Supabase** | DB, Auth, Storage | Everywhere | Both | All types | `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*` | Next.js + Edge Functions |
| **NetCash Pay Now** | Payment processing (20+ methods) | `lib/payments/`, `app/api/payments/` | Both | User-request + webhook | `NETCASH_*` (6 vars), `NEXT_PUBLIC_NETCASH_*` (4 vars) | Next.js API routes |
| **Zoho CRM** | Lead/customer management | `lib/integrations/zoho/crm-service.ts` | Both | Event-driven + scheduled | `ZOHO_CLIENT_ID/SECRET`, `ZOHO_REFRESH_TOKEN` | Inngest + API routes |
| **Zoho Desk** | Support ticketing | `lib/integrations/zoho/desk-service.ts` | Both | Event-driven + scheduled | `ZOHO_DESK_REFRESH_TOKEN`, `ZOHO_DESK_ORG_ID` | Inngest |
| **Zoho Books** | Accounting, invoicing | `lib/integrations/zoho/books-api-client.ts` | Both | Event-driven + scheduled | `ZOHO_BILLING_*` (4 vars) | Inngest + cron |
| **Zoho Sign** | Digital contract signing | `lib/integrations/zoho/sign-service.ts` | Both | Event-driven + webhook | `ZOHO_SIGN_*` (4 vars) | API routes |
| **DiDiT** | KYC/AML verification | `lib/integrations/didit/` | Both | User-request + webhook | `DIDIT_API_KEY/SECRET`, `DIDIT_WEBHOOK_SECRET` | API routes |
| **Resend** | Transactional email | `lib/emails/` | Outbound | Event-driven | `RESEND_API_KEY` | Inngest + API routes |
| **Clickatell** | SMS (OTP, reminders) | `lib/integrations/clickatell/` | Outbound | Event-driven + scheduled | `CLICKATELL_API_KEY`, `CLICKATELL_API_ID` | API routes + Inngest |
| **Inngest** | Job orchestration | `lib/inngest/` (27+ functions) | Both | Event-driven + scheduled | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Next.js API handler |
| **Google Maps** | Geocoding, address lookup | `components/coverage/`, `lib/coverage/` | Outbound | User-request | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client + API routes |
| **Google Gemini** | AI content generation | `lib/cms/ai-service.ts` | Outbound | Admin-triggered | `GEMINI_API_KEY` | API routes |
| **MTN WMS** | Network coverage data | `lib/coverage/` | Outbound | User-request + scheduled | Browser-like headers (no API key) | API routes |
| **MTN Consumer** | Consumer API fallback | `lib/coverage/` | Outbound | User-request | Browser-like headers | API routes |
| **Tarana TCS** | Fixed wireless metrics | `lib/tarana/` | Outbound | Scheduled + admin | `TARANA_USERNAME`, `TARANA_PASSWORD` | Inngest + API routes |
| **Ruijie Cloud** | WiFi AP management | `lib/ruijie/` | Both | Scheduled + admin | `RUIJIE_APP_ID`, `RUIJIE_SECRET` | Inngest + API routes |
| **Interstellio/Nebular** | PPPoE/RADIUS provisioning | `lib/interstellio/` | Both | Event-driven + webhook | `INTERSTELLIO_API_TOKEN`, `INTERSTELLIO_*` (6 vars) | API routes + Inngest |
| **MikroTik** | Router management | `lib/inngest/functions/mikrotik-sync.ts` | Outbound | Scheduled | HTTP Basic credentials | Inngest |
| **WhatsApp Business** | Messaging campaigns | `lib/integrations/whatsapp/` | Both | Event-driven + webhook | Meta Graph API token | Inngest + webhooks |
| **Firecrawl** | Competitor web scraping | `lib/competitor-analysis/` | Outbound | Scheduled | `FIRECRAWL_API_KEY` | Inngest |
| **Prismic** | Headless CMS | Scripts, API routes | Both | Admin-triggered | `PRISMIC_WRITE_TOKEN` | Scripts |

---

## 7. Supabase Usage

### Access Patterns
- **Service role** (`createClient()` in `lib/supabase/server.ts`): Used by admin routes, cron jobs, Inngest functions, webhooks. Bypasses RLS. ~20+ files.
- **Session-aware** (`createClientWithSession()` in `lib/supabase/server.ts`): Used by customer dashboard, B2B portal. Reads cookies, respects RLS.
- **Client/anon** (`createClient()` in `lib/supabase/client.ts`): Used by browser components. `NEXT_PUBLIC_SUPABASE_ANON_KEY`. RLS enforced.
- **719 references** across `lib/` to Supabase client functions.

### Database
- **262 SQL migration files** in `supabase/migrations/` (2024-12-28 through 2025-10-21)
- **20 migrations** explicitly define RLS policies
- Key tables: `customers`, `consumer_orders`, `service_packages`, `customer_invoices`, `business_quotes`, `kyc_sessions`, `contracts`, `partners`, `admin_users`, `coverage_leads`, `zoho_tokens`

### Edge Functions
- **17 functions** in `supabase/functions/` (Deno runtime, hosted by Supabase)
- Purposes: Admin auth/signup/approval, billing, coverage checks, Zoho integration, notifications

### Storage
- **kyc-documents** bucket: Partner KYC compliance docs (PDF/JPG/PNG/ZIP, 20MB max, private)
- Upload service: `lib/storage/supabase-upload.ts`

### Realtime
- **Not used** — no Supabase realtime/channel subscriptions found in codebase

### Auth
- Supabase Auth with multiple providers: email/password, Google OAuth, phone/OTP
- Cookie-based session management via middleware (`middleware/supabase-client.ts`)
- Admin auth uses separate `admin_users` table with RBAC (17 roles)

---

## 8. Hosting and Deployment

### Production: Coolify on VPS
- **Host**: VPS at 94.72.104.81 (24GB RAM, 8 cores)
- **Container**: Docker (`node:20-alpine` + Chromium for PDF generation)
- **Port**: 3000 (bound to 0.0.0.0)
- **Domain**: `www.circletel.co.za`
- **Subdomain**: `admin.circletel.co.za` (Vue admin SPA, separate deploy)
- **Subdomain routing**: `studio.circletel.co.za` → `/admin/cms` (via middleware rewrite)
- **Health check**: `GET /api/health` (30s interval, 120s start-period)
- **Config**: `nixpacks.toml` (12GB heap build), `Dockerfile` (runtime)
- **Coolify API**: Token `3|circletel-env-sync-token-2026`, app UUID `b7ukn3c76rd46dsl19oqq59e`

### Legacy: Vercel (disabled)
- **Status**: Builds disabled (`exit 1` in build command per project memory)
- **Config**: `vercel.json` still present with 40 function configs and 22 cron schedules
- **Build machine**: Enhanced (16GB) was required; Standard/Elastic both OOM
- **Note**: Staging may still use Vercel for PR previews

### CI/CD Pipeline (`/.github/workflows/`)
- **`deploy.yml`**: Production deploy on push to `main`
  - Runs on **self-hosted runner** (same VPS, 24GB RAM)
  - Node.js 20, npm ci, tar-based node_modules cache
  - `npm run build:ci` (6GB heap)
  - Deploys to Coolify via API
  - 40-minute timeout
- **`pr-checks.yml`**: Type-check + lint on PRs (continue-on-error: true)
  - Validates Dockerfile has `--max-old-space-size >= 8192`
  - Validates `output: 'standalone'` in next.config.js
- **`staging-deployment.yml`**: Auto-pushes PR branch to `staging`

### Background Jobs
- **Inngest**: 27+ functions for event-driven + scheduled work
  - Invoice generation, payment reconciliation, Zoho sync, device monitoring
  - Served via `/api/inngest` route handler
  - `BILLING_USE_INNGEST=false` — cron endpoints are primary for billing currently
- **Cron**: 22 endpoints in `/api/cron/` (scheduled via vercel.json, now triggered by Coolify/external scheduler)

### Monitoring
- **UptimeRobot**: 2 monitors (health endpoint: 802769548, homepage: 802769549)
- **Health endpoint**: `/api/health` (Docker healthcheck + UptimeRobot)
- **No APM**: No Sentry, DataDog, LogRocket, or PostHog detected
- **Integration health**: `/api/cron/integrations-health-check` (every 30 min)

---

## 9. Trust Boundaries and Risks Observed

### Secret Exposure
1. **`NEXT_PUBLIC_NETCASH_SERVICE_KEY`** and **`NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY`** are browser-exposed. Values in `.env.example` are test keys (`7928c6de-...`, `3143ee79-...`). If production uses the same pattern, these are visible in client bundles. NetCash requires client-side keys for the inline payment form, so this may be by design — verify with NetCash documentation.
2. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** is browser-exposed. Should have domain restrictions in GCP console. Unverifiable from repo alone.
3. **`NEXT_PUBLIC_ZOHO_MCP_KEY`** appears in env example — purpose unclear, may be an admin-only key exposed unnecessarily.

### Privileged Access
4. **Service role key** used in ~20+ files including all admin routes, all cron endpoints, and all Inngest functions. This is the expected pattern for a monolithic app but means a compromised API route has full DB access.
5. **Zoho tokens stored in Supabase** (`zoho_tokens` table) — plaintext. DB breach would expose Zoho access. Tokens are short-lived (45-60 min) but refresh tokens are long-lived.
6. **Tarana portal credentials** (`TARANA_USERNAME`/`TARANA_PASSWORD`) are plain username/password for browser-like auth. Compromise grants full portal access.

### Auth Boundaries
7. **Middleware pipeline** protects admin/portal/ambassador routes, but protection is at the page level. API routes under `/api/admin/` must independently verify admin auth — not all routes were inspected for this.
8. **Admin auth and customer auth are separate systems**: admin uses `admin_users` table with RBAC; customers use Supabase Auth. Compromise of one system shouldn't affect the other.
9. **Cron endpoints** are protected by auth headers (not verified in detail which header/secret).

### Architecture Risks
10. **Single container** hosts all 570+ endpoints. No runtime isolation between customer-facing, admin, and background job workloads.
11. **Self-hosted runner** builds and deploys on the same VPS that hosts production. Build failures or resource contention during builds could affect production.
12. **22 cron jobs** defined in `vercel.json` — unclear how they're triggered now that production runs on Coolify (not Vercel). If not migrated to an external scheduler, they may not be running.
13. **Inngest vs cron dual system**: `BILLING_USE_INNGEST=false` means billing uses cron endpoints, but Inngest functions also exist for the same purpose. Potential for drift or missed executions.
14. **17 Supabase edge functions** overlap with Next.js API routes (admin-auth, billing, coverage). May be legacy or secondary path — unclear which is canonical.

---

## 10. Unknowns

1. **Vue admin SPA location**: Per project memory, a Vue 3 app exists at `admin.circletel.co.za` deployed on Coolify, but its source code is not in this repo. Separate repo or sub-directory unknown.
2. **Cron scheduling on Coolify**: `vercel.json` defines 22 cron schedules, but Coolify doesn't use vercel.json for crons. How these are triggered post-migration is unknown from repo contents alone.
3. **Supabase edge function vs API route ownership**: Some functionality exists in both Supabase functions (`check-coverage`, `admin-auth`, `billing-auto-generate`) and Next.js API routes. Which is canonical and whether both are active is unclear.
4. **Production NetCash keys**: Whether production uses the test keys visible in `.env.example` or has separate production keys loaded via Coolify env vars cannot be determined from the repo.
5. **Google Maps API restrictions**: Whether the browser-exposed Maps API key has domain/referrer restrictions configured in GCP cannot be verified from repo.
6. **Inngest hosting**: Whether Inngest Cloud (hosted) or self-hosted Inngest is used. The client config doesn't specify explicitly.
7. **MTN WMS authentication**: Coverage checks use browser-like headers (User-Agent, Referer, Origin) suggesting screen-scraping rather than a formal API agreement. Terms of service compliance is unknown.
8. **WhatsApp Business API token storage**: Where the Meta Graph API bearer token is stored (env var name or Supabase) is not clear from the integration code.
9. **MikroTik credentials**: Referenced in Inngest sync function but credential storage mechanism not inspected.
10. **SSL/TLS termination**: Whether Coolify handles SSL or there's a reverse proxy (nginx, Cloudflare) in front is not visible in the repo.
