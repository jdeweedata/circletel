---
type: architecture
domain: [platform, all]
tags: [overview, database, api, components, agent-os, integrations]
status: current
last_updated: 2025-11-29
dependencies: []
priority: high
description: Main hub document for understanding the CircleTel platform architecture
---

# CircleTel System Overview

Comprehensive reference for the CircleTel platform architecture, features, and codebase structure.

**Last Updated**: 2025-11-29
**Version**: 1.0

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Application Structure](#application-structure)
3. [Database Schema](#database-schema)
4. [Admin System](#admin-system)
5. [CMS / Page Builder](#cms--page-builder)
6. [API Routes](#api-routes)
7. [Service Modules](#service-modules)
8. [Component Structure](#component-structure)
9. [Claude Code Configuration](#claude-code-configuration)
10. [Agent-OS System](#agent-os-system)
11. [Integration Points](#integration-points)

---

## Platform Overview

**CircleTel** is a B2B/B2C ISP platform for South Africa providing:
- Fibre connectivity services
- Business solutions (VoIP, Cloud Hosting, Virtual Desktops)
- Partner portal for resellers
- Full admin management system

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | Supabase PostgreSQL (`agyjovdugmtopasyvlng`) |
| Auth | Supabase Auth (3-context: Consumer/Partner/Admin) |
| Payments | NetCash Pay Now (20+ methods) |
| CRM | ZOHO (async sync) |
| SMS | Clickatell |
| KYC | Didit |
| E-Signatures | ZOHO Sign |

### Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | https://www.circletel.co.za | main |
| Staging | https://circletel-staging.vercel.app | staging |

---

## Application Structure

### Pages (`app/`)

```
app/
├── (public)/                    # Public marketing pages
│   ├── page.tsx                 # Homepage
│   ├── packages/                # Package selection flow
│   ├── fibre/                   # Fibre product pages
│   ├── business/                # Business solutions
│   ├── about/                   # About pages
│   └── contact/                 # Contact page
│
├── admin/                       # Admin portal (26 sections)
│   ├── dashboard/               # Admin dashboard
│   ├── orders/                  # Order management
│   ├── customers/               # Customer management
│   ├── products/                # Product catalog
│   ├── cms/                     # Page builder (NEW)
│   ├── partners/                # Partner management
│   ├── quotes/                  # B2B quotations
│   ├── users/                   # Admin user management
│   ├── settings/                # System settings
│   ├── integrations/            # Third-party integrations
│   ├── reports/                 # Analytics & reports
│   ├── audit-logs/              # Audit trail
│   ├── compliance/              # KYB compliance
│   └── workflow/                # Workflow orchestration
│
├── dashboard/                   # Customer dashboard
│   ├── page.tsx                 # Dashboard home
│   ├── services/                # Service management
│   ├── billing/                 # Billing & invoices
│   ├── support/                 # Support tickets
│   └── profile/                 # Profile settings
│
├── partners/                    # Partner portal
│   ├── dashboard/               # Partner dashboard
│   ├── quotes/                  # Quote creation
│   ├── customers/               # Customer management
│   ├── compliance/              # FICA/CIPC documents
│   └── commissions/             # Commission tracking
│
├── order/                       # Order flow
│   ├── account/                 # Account creation
│   ├── payment/                 # Payment processing
│   └── confirmation/            # Order confirmation
│
└── api/                         # API routes (260+ endpoints)
```

### Admin Sections (26 Total)

| Section | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin/dashboard` | Overview stats, recent activity |
| Orders | `/admin/orders` | Order management, workflow |
| Customers | `/admin/customers` | Customer records, services |
| Products | `/admin/products` | Product catalog, pricing |
| Products Approvals | `/admin/products/approvals` | Product approval workflow |
| MTN Deals | `/admin/products/mtn-deals` | MTN business deals |
| CMS | `/admin/cms` | Page builder, content |
| CMS Builder | `/admin/cms/builder` | Drag-drop page editor |
| CMS Media | `/admin/cms/media` | Media library |
| Partners | `/admin/partners` | Partner management |
| Quotes | `/admin/quotes` | B2B quotations |
| Users | `/admin/users` | Admin user accounts |
| User Roles | `/admin/users/roles` | RBAC role management |
| User Activity | `/admin/users/activity` | Activity audit |
| Settings | `/admin/settings` | System configuration |
| Notifications | `/admin/settings/notifications` | Notification prefs |
| Integrations | `/admin/integrations` | Integration hub |
| API Health | `/admin/integrations/api-health` | API monitoring |
| Cron Jobs | `/admin/integrations/cron-jobs` | Scheduled tasks |
| OAuth | `/admin/integrations/oauth` | OAuth connections |
| Webhooks | `/admin/integrations/webhooks` | Webhook management |
| Reports | `/admin/reports` | Analytics, exports |
| Audit Logs | `/admin/audit-logs` | System audit trail |
| Compliance KYB | `/admin/compliance/kyb` | Know Your Business |
| Workflow | `/admin/workflow` | Workflow orchestration |
| Coverage | `/admin/coverage` | Coverage management |

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `customers` | Customer records | id, email, phone, zoho_contact_id |
| `consumer_orders` | Order records | id, customer_id, status, package_id |
| `service_packages` | Product catalog | id, name, price, provider, speed |
| `coverage_leads` | Coverage checks | id, address, coordinates, provider_results |
| `admin_users` | Admin accounts | id, email, role_id, permissions |
| `business_quotes` | B2B quotations | id, quote_number, customer_id, status |

### B2B KYC Tables

| Table | Purpose | Format |
|-------|---------|--------|
| `kyc_sessions` | KYC verification sessions | UUID |
| `contracts` | Business contracts | CT-YYYY-NNN |
| `invoices` | Invoice records | INV-YYYY-NNN |
| `rica_submissions` | RICA compliance | UUID |

### Partner Tables

| Table | Purpose | Format |
|-------|---------|--------|
| `partners` | Partner accounts | CTPL-YYYY-NNN |
| `partner_compliance_documents` | FICA/CIPC docs | 13 categories |
| `partner_commissions` | Commission tracking | UUID |

### Customer Dashboard Tables

| Table | Purpose |
|-------|---------|
| `customer_services` | Active services |
| `customer_billing` | Billing records |
| `customer_invoices` | Invoice history |
| `usage_history` | Usage tracking |
| `support_tickets` | Support requests |

### CMS / Page Builder Tables (NEW - Nov 2025)

| Table | Purpose |
|-------|---------|
| `pb_pages` | Page content, metadata, SEO |
| `pb_templates` | Page templates |
| `pb_media` | Media library assets |
| `pb_ai_usage` | AI generation tracking |

### Product Cost Tables (NEW - Nov 2025)

| Table | Purpose |
|-------|---------|
| `product_cost_components` | Cost breakdown (wholesale, infrastructure, hardware) |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `zoho_sync_logs` | ZOHO CRM sync status |
| `payment_webhooks` | Payment webhook logs |
| `email_templates` | Email template system |
| `notification_logs` | Notification tracking |
| `api_health_checks` | API health monitoring |
| `cron_job_logs` | Scheduled task logs |

### Admin Tables

| Table | Purpose |
|-------|---------|
| `admin_roles` | RBAC roles (17 roles) |
| `admin_permissions` | Permissions (100+) |
| `admin_role_permissions` | Role-permission mapping |
| `audit_logs` | System audit trail |
| `admin_sessions` | Session management |

---

## CMS / Page Builder

**Status**: Production Ready (Nov 2025)
**Location**: `app/admin/cms/`, `components/cms/`, `lib/cms/`

### Features

- **AI-Powered Generation**: Google Gemini Pro for content, Nano Banana for images
- **Drag-and-Drop Editor**: Tiptap-based block editor
- **Media Library**: Upload, organize, search media assets
- **SEO Management**: Meta tags, OG images, sitemap
- **Publishing Workflow**: Draft → In Review → Scheduled → Published → Archived
- **Version History**: Page versioning with restore capability
- **AI Usage Tracking**: Rate limiting and usage analytics

### Page Builder Blocks

| Block Type | Description |
|------------|-------------|
| Hero | Full-width hero sections |
| Text | Rich text content |
| Image | Single/gallery images |
| CTA | Call-to-action buttons |
| Features | Feature grids |
| Pricing | Pricing tables |
| Testimonials | Customer testimonials |
| FAQ | Accordion FAQ sections |
| Contact | Contact forms |
| Custom HTML | Raw HTML blocks |

### API Endpoints

```
/api/admin/cms/pages          # Page CRUD
/api/admin/cms/pages/[id]     # Single page operations
/api/admin/cms/templates      # Template management
/api/admin/cms/media          # Media library
/api/admin/cms/media/upload   # File uploads
/api/admin/cms/ai/generate    # AI content generation
/api/admin/cms/ai/usage       # AI usage stats
/api/admin/cms/publish        # Publishing workflow
/api/admin/cms/versions       # Version management
/api/admin/cms/seo            # SEO management
/api/admin/cms/preview        # Page preview
```

---

## API Routes

### Route Categories (260+ endpoints)

#### Admin APIs (`/api/admin/*`)

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| `/api/admin/orders` | 10+ | Order management |
| `/api/admin/customers` | 8+ | Customer CRUD |
| `/api/admin/products` | 12+ | Product catalog |
| `/api/admin/cms` | 11 | Page builder |
| `/api/admin/partners` | 6+ | Partner management |
| `/api/admin/quotes` | 8+ | B2B quotations |
| `/api/admin/users` | 6+ | Admin users |
| `/api/admin/settings` | 4+ | System settings |
| `/api/admin/reports` | 5+ | Analytics |
| `/api/admin/integrations` | 8+ | Third-party integrations |

#### Public APIs

| Category | Purpose |
|----------|---------|
| `/api/coverage` | Coverage checking (MTN, Openserve, Vumatel) |
| `/api/packages` | Package listing and details |
| `/api/orders` | Order creation and status |
| `/api/auth` | Authentication endpoints |
| `/api/contact` | Contact form submission |

#### Integration APIs

| Category | Purpose |
|----------|---------|
| `/api/zoho` | ZOHO CRM sync |
| `/api/webhooks/netcash` | Payment webhooks |
| `/api/webhooks/didit` | KYC webhooks |
| `/api/activation` | Service activation |
| `/api/rica` | RICA submission |

#### Partner APIs

| Category | Purpose |
|----------|---------|
| `/api/partners/quotes` | Quote creation |
| `/api/partners/customers` | Customer management |
| `/api/partners/commissions` | Commission data |
| `/api/partners/compliance` | Document upload |

---

## Service Modules

### Library Structure (`lib/`)

```
lib/
├── supabase/                   # Supabase clients
│   ├── client.ts               # Browser client (anon key + RLS)
│   ├── server.ts               # Server client (service role)
│   └── middleware.ts           # Auth middleware
│
├── auth/                       # Authentication
│   ├── customer-auth.ts        # Consumer auth
│   ├── partner-auth.ts         # Partner auth
│   └── admin-auth.ts           # Admin auth + RBAC
│
├── coverage/                   # Coverage services
│   ├── aggregation-service.ts  # Multi-provider aggregation
│   ├── mtn-service.ts          # MTN API integration
│   ├── openserve-service.ts    # Openserve API
│   └── vumatel-service.ts      # Vumatel API
│
├── orders/                     # Order management
│   ├── order-service.ts        # Order CRUD
│   ├── workflow-service.ts     # Status workflow
│   └── fulfillment-service.ts  # Fulfillment logic
│
├── payments/                   # Payment processing
│   ├── netcash-service.ts      # NetCash Pay Now
│   ├── payment-service.ts      # Payment orchestration
│   └── webhook-handler.ts      # Webhook processing
│
├── cms/                        # CMS services (NEW)
│   ├── page-service.ts         # Page management
│   ├── media-service.ts        # Media library
│   ├── ai-service.ts           # AI generation
│   └── publish-service.ts      # Publishing workflow
│
├── partners/                   # Partner services
│   ├── partner-service.ts      # Partner management
│   ├── compliance-requirements.ts # FICA/CIPC rules
│   └── commission-service.ts   # Commission calculation
│
├── quotes/                     # Quotation system
│   ├── quote-service.ts        # Quote CRUD
│   ├── pricing-service.ts      # Price calculation
│   └── pdf-service.ts          # PDF generation
│
├── integrations/               # Third-party integrations
│   ├── zoho/                   # ZOHO CRM
│   ├── didit/                  # KYC service
│   ├── clickatell/             # SMS service
│   └── interstellio/           # Interstellio API
│
├── activation/                 # Service activation
│   ├── activation-service.ts   # Activation workflow
│   └── rica-service.ts         # RICA submission
│
├── billing/                    # Billing services
│   ├── billing-service.ts      # Billing management
│   ├── invoice-service.ts      # Invoice generation
│   └── emandate-service.ts     # NetCash eMandate
│
├── catalog/                    # Product catalog
│   ├── catalog-service.ts      # Product listing
│   └── pricing-service.ts      # Dynamic pricing
│
├── compliance/                 # Compliance
│   ├── kyb-service.ts          # Know Your Business
│   └── document-service.ts     # Document management
│
├── contracts/                  # Contract management
│   ├── contract-service.ts     # Contract CRUD
│   └── signing-service.ts      # ZOHO Sign integration
│
├── fulfillment/                # Order fulfillment
│   ├── fulfillment-service.ts  # Fulfillment logic
│   └── installation-service.ts # Installation scheduling
│
├── analytics/                  # Analytics
│   ├── analytics-service.ts    # Event tracking
│   └── report-service.ts       # Report generation
│
└── utils/                      # Utilities
    ├── validation.ts           # Input validation
    ├── formatting.ts           # Data formatting
    └── errors.ts               # Error handling
```

---

## Component Structure

### Component Categories (`components/`)

```
components/
├── admin/                      # Admin UI components
│   ├── orders/                 # Order management
│   ├── customers/              # Customer management
│   ├── products/               # Product catalog
│   ├── partners/               # Partner management
│   ├── quotes/                 # Quotation system
│   ├── users/                  # User management
│   ├── settings/               # Settings panels
│   ├── reports/                # Report components
│   ├── integrations/           # Integration UI
│   └── shared/                 # Shared admin components
│
├── cms/                        # CMS components (NEW)
│   ├── PageBuilder.tsx         # Main builder
│   ├── BlockEditor.tsx         # Block editing
│   ├── MediaLibrary.tsx        # Media management
│   ├── AIGenerator.tsx         # AI content generation
│   ├── SEOPanel.tsx            # SEO settings
│   └── PublishPanel.tsx        # Publishing controls
│
├── dashboard/                  # Customer dashboard
│   ├── ServiceCard.tsx         # Service display
│   ├── UsageChart.tsx          # Usage graphs
│   ├── BillingTable.tsx        # Billing history
│   └── SupportWidget.tsx       # Support access
│
├── checkout/                   # Checkout flow
│   ├── InlinePaymentForm.tsx   # Payment form
│   ├── OrderSummary.tsx        # Order summary
│   └── PaymentMethods.tsx      # Method selection
│
├── coverage/                   # Coverage checking
│   ├── AddressSearch.tsx       # Address input
│   ├── CoverageResults.tsx     # Results display
│   └── ProviderCard.tsx        # Provider info
│
├── packages/                   # Package selection
│   ├── PackageCard.tsx         # Package display
│   ├── PackageGrid.tsx         # Package listing
│   └── CompareTable.tsx        # Comparison table
│
├── partners/                   # Partner portal
│   ├── ComplianceUpload.tsx    # Document upload
│   ├── QuoteBuilder.tsx        # Quote creation
│   └── CommissionTable.tsx     # Commission display
│
├── products/                   # Product display
│   ├── ProductCard.tsx         # Product card
│   ├── PricingTable.tsx        # Pricing display
│   └── FeatureList.tsx         # Feature listing
│
├── navigation/                 # Navigation
│   ├── Header.tsx              # Main header
│   ├── Footer.tsx              # Main footer
│   ├── AdminSidebar.tsx        # Admin navigation
│   └── MobileMenu.tsx          # Mobile navigation
│
├── providers/                  # Context providers
│   ├── CustomerAuthProvider.tsx
│   ├── PartnerAuthProvider.tsx
│   ├── AdminAuthProvider.tsx
│   └── ThemeProvider.tsx
│
├── ui/                         # UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Card.tsx
│   └── ... (shadcn/ui components)
│
└── shared/                     # Shared components
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    ├── EmptyState.tsx
    └── ConfirmDialog.tsx
```

---

## Claude Code Configuration

**Location**: `.claude/`
**Purpose**: Automation, productivity tools, and development workflows

### Directory Structure

```
.claude/
├── hooks/                    # Event-driven automation
│   ├── session-start.ps1     # Auto-run context analyzer
│   ├── backup-before-edit.ps1 # Backup files before edits
│   └── log-bash-commands.ps1 # Audit trail for commands
├── commands/                 # Custom slash commands
│   ├── new-migration.md      # /new-migration <name>
│   ├── health-check.md       # /health-check
│   └── sync-types.md         # /sync-types
├── skills/                   # Packaged SOPs (7 skills)
│   ├── context-manager/      # Token optimization
│   ├── bug-fixing/           # Debugging workflow
│   ├── database-migration/   # Migration tooling
│   └── prompt-optimizer/     # Prompt engineering
├── agents/                   # AI agent definitions
│   ├── api-engineer.md       # API development
│   └── prompt-optimizer.md   # Prompt optimization
├── tools/                    # MCP code execution
│   ├── supabase-executor.ts  # Database queries (80% token savings)
│   └── README.md             # Tool documentation
├── backups/                  # Pre-edit file backups
├── logs/                     # Bash audit logs
└── settings.local.json       # Hooks & permissions config
```

### Event Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| SessionStart | New session | Context analysis, budget zone display |
| PreToolUse (Edit/Write) | Before file edits | Backup to `.claude/backups/` |
| PostToolUse (Bash) | After commands | Audit log to `.claude/logs/` |

### Custom Commands

| Command | Description |
|---------|-------------|
| `/new-migration <name>` | Create timestamped Supabase migration |
| `/health-check` | Type-check + context analysis + advisors |
| `/sync-types` | Generate TypeScript from Supabase schema |

### Architecture Docs with YAML Headers

All architecture docs now include YAML metadata for better searchability:

```yaml
---
type: architecture
domain: [auth, coverage, admin, etc.]
tags: [searchable keywords]
status: current | deprecated | draft
last_updated: YYYY-MM-DD
dependencies: [related docs]
priority: high | medium | low
description: Brief description
---
```

---

## Agent-OS System

**Location**: `agent-os/specs/`
**Purpose**: Structured task specifications for complex feature development

### Active Specifications

| Spec ID | Feature | Status | Points |
|---------|---------|--------|--------|
| `20251101-b2b-quote-to-contract-kyc` | B2B KYC Workflow | 64% Complete | 61 |
| `2025-11-01-customer-dashboard-production` | Customer Dashboard | Ready | 147 |
| `20251110-partner-quote-creation-system` | Partner Quotations | In Progress | TBD |

### Spec Structure

```
agent-os/specs/[spec-id]/
├── SPEC.md              # Main specification
├── TASKS.md             # Task breakdown
├── PROGRESS.md          # Progress tracking
├── DECISIONS.md         # Design decisions
└── TESTING.md           # Test requirements
```

### Subagent Roles

| Agent | Responsibility |
|-------|----------------|
| database-engineer | Schema design, migrations, RLS |
| backend-engineer | API routes, services |
| api-engineer | API design, documentation |
| frontend-engineer | UI components, pages |
| testing-engineer | Test coverage, E2E |

---

## Integration Points

### ZOHO CRM

- **Sync Direction**: Supabase → ZOHO (async)
- **Entities**: Contacts, Accounts, Deals, Quotes
- **Trigger**: Order completion, customer creation
- **Logs**: `zoho_sync_logs` table

### NetCash Pay Now

- **Methods**: 20+ (Card, EFT, Mobicred, Payflex, etc.)
- **Webhook**: `/api/webhooks/netcash`
- **Component**: `components/checkout/InlinePaymentForm.tsx`

### Didit KYC

- **Flow**: Quote → KYC Session → Verification → Contract
- **Webhook**: `/api/webhooks/didit`
- **Tables**: `kyc_sessions`

### Clickatell SMS

- **Use Cases**: Order confirmation, OTP, notifications
- **Service**: `lib/integrations/clickatell/`

### MTN APIs

- **WMS API**: Wholesale coverage checking
- **Consumer API**: Fallback coverage
- **Anti-Bot Headers**: Required for all requests

---

## Quick Reference

### Account Number Formats

| Type | Format | Example |
|------|--------|---------|
| Customer | CT-YYYY-NNNNN | CT-2025-00001 |
| Contract | CT-YYYY-NNN | CT-2025-001 |
| Invoice | INV-YYYY-NNN | INV-2025-001 |
| Partner | CTPL-YYYY-NNN | CTPL-2025-001 |
| Quote | Q-YYYY-NNN | Q-2025-001 |

### Status Workflows

**Order Status**:
```
pending → confirmed → processing → installing → active → completed
                   ↘ cancelled
                   ↘ failed
```

**Quote Status**:
```
draft → sent → viewed → accepted → contract_pending → completed
           ↘ rejected
           ↘ expired
```

**KYC Status**:
```
pending → in_progress → completed → approved
                     ↘ failed
                     ↘ expired
```

---

**Document Version**: 1.0
**Maintained By**: Development Team + Claude Code
