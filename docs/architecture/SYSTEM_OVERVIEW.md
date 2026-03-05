---
type: architecture
domain: [platform, all]
tags: [overview, database, api, components, agent-os, integrations, inngest, skills, design-system, typography]
status: current
last_updated: 2026-03-05
dependencies: []
priority: high
description: Main hub document for understanding the CircleTel platform architecture
---

# CircleTel System Overview

Comprehensive reference for the CircleTel platform architecture, features, and codebase structure.

**Last Updated**: 2026-03-05
**Version**: 2.2

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
| Frontend | Next.js 15.1.9, React 18, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | Supabase PostgreSQL (`agyjovdugmtopasyvlng`) |
| Auth | Supabase Auth (3-context: Consumer/Partner/Admin) |
| Background Jobs | Inngest (event-driven, durable functions) |
| Payments | NetCash Pay Now (20+ methods) |
| CRM | ZOHO (async sync) |
| SMS | Clickatell |
| KYC | Didit |
| E-Signatures | ZOHO Sign |
| CMS | Prismic (headless CMS for product pages) |
| Image Generation | Google Gemini (marketing assets) |

### Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | https://www.circletel.co.za | main |
| Staging | https://circletel-staging.vercel.app | staging |

### Design System

**Documentation**: `docs/design-system/README.md`

#### Typography Scale (1.32× modular)

| Token | Desktop | Mobile | Weight | Usage |
|-------|---------|--------|--------|-------|
| `display-1` | 48px | 40px | 700 | H1, hero titles |
| `display-2` | 36px | 30px | 700 | H2, section headings |
| `display-3` | 28px | 24px | 600 | H3, card titles |
| `display-4` | 21px | 18px | 600 | H4, minor headings |
| Body | 16px | 16px | 400 | Paragraphs |

**CSS Classes**: `.page-title`, `.section-heading`, `.card-title`
**Tailwind**: `text-display-1`, `text-display-2`, `text-display-3`, `text-display-4`

#### Font Families

| Family | Variable | Tailwind | Usage |
|--------|----------|----------|-------|
| Poppins | `--font-poppins` | `font-heading` | Headings, nav, buttons |
| Montserrat | `--font-montserrat` | `font-body` | Body text |
| Manrope | `--font-manrope` | `font-data` | Data-heavy interfaces |
| Space Mono | `--font-space-mono` | `font-mono` | Code, technical |

#### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `circleTel-orange` | #E87A1E | Primary brand, CTAs |
| `circleTel-orange-dark` | #C45A30 | Hover states |
| `circleTel-navy` | #1B2A4A | Headlines, dark UI |
| `circleTel-charcoal` | #2D3436 | Footer, dark sections |

#### Icon Library (Phosphor Icons)

**Status**: Migration completed 2026-03-05
**Package**: `react-icons/pi` (Phosphor Icons Bold weight)
**Convention**: All icons use `PiXxxBold` naming pattern

```tsx
// Import pattern
import { PiCheckBold, PiXBold, PiUserBold } from 'react-icons/pi';

// Usage
<PiCheckBold className="w-5 h-5 text-green-600" />
```

| Use Case | Icon |
|----------|------|
| Close/Dismiss | `PiXBold` |
| Confirm/Check | `PiCheckBold` |
| Loading | `PiSpinnerBold` |
| Search | `PiMagnifyingGlassBold` |
| Settings | `PiGearBold` |
| User/Profile | `PiUserBold` |
| Location/Map | `PiMapPinBold` |
| Home | `PiHouseBold` |
| WiFi/Signal | `PiWifiHighBold` |
| Security/Shield | `PiShieldBold` |
| Link | `PiLinkBold` |
| File/Document | `PiFileTextBold` |
| Calendar | `PiCalendarBold` |
| Package | `PiPackageBold` |

**Full mapping**: `docs/design-system/ICON_MAPPING.md`
**Migration scripts**: `scripts/migrate-to-phosphor.js`, `scripts/final-icon-fix.js`

**Note**: Previous libraries (Lucide React, Heroicons) have been removed from dependencies.

#### Gradient Presets

| Token | Usage |
|-------|-------|
| `gradient-hero` | Orange to navy diagonal |
| `gradient-cta` | Orange to burnt orange |
| `gradient-card` | White to light gray |
| `gradient-card-selected` | Navy gradient (selected state) |

#### CTA Button Variants

```tsx
<Button variant="cta">Primary CTA</Button>
<Button variant="cta-outline">Secondary CTA</Button>
<Button variant="cta-gradient">Gradient CTA</Button>
<Button variant="cta-navy">Navy CTA</Button>
```

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

### Admin Sections (28 Total)

| Section | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin/dashboard` | Overview stats, recent activity |
| Orders | `/admin/orders` | Order management, workflow |
| Customers | `/admin/customers` | Customer records, services |
| Products | `/admin/products` | Product catalog, pricing |
| Products Approvals | `/admin/products/approvals` | Product approval workflow |
| MTN Deals | `/admin/products/mtn-deals` | MTN business deals |
| **Sales Feasibility** | `/admin/sales/feasibility` | B2B quick entry, multi-site coverage (NEW) |
| CMS | `/admin/cms` | Page builder, content |
| CMS Builder | `/admin/cms/builder` | Drag-drop page editor |
| CMS Media | `/admin/cms/media` | Media library |
| Partners | `/admin/partners` | Partner management |
| Quotes | `/admin/quotes` | B2B quotations |
| Billing | `/admin/billing` | Invoice management, SMS reminders |
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
| `customer_invoices` | Invoice records (NOT `invoices`) | INV-YYYY-NNN |
| `rica_submissions` | RICA compliance | UUID |

### Supplier Tables (NEW - Feb 2026)

| Table | Purpose |
|-------|---------|
| `suppliers` | Supplier records (Miro, Nology, etc.) |
| `supplier_sync_logs` | Supplier sync audit trail |

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
│   ├── sync-types.md         # /sync-types
│   └── compound.md           # /compound - capture session learnings
├── skills/                   # Packaged SOPs (13+ skills)
│   ├── context-manager/      # Token optimization
│   ├── bug-fixing/           # Debugging workflow
│   ├── database-migration/   # Migration tooling
│   ├── prompt-optimizer/     # Prompt engineering
│   ├── session-manager/      # Named sessions, resume (v2.0.64)
│   ├── async-runner/         # Background tasks (v2.0.64)
│   ├── rules-organizer/      # Modular .claude/rules/ (v2.0.64)
│   ├── stats-tracker/        # Usage analytics (v2.0.64)
│   ├── compound-learnings/   # Transform insights into capabilities
│   ├── brand-design/         # CircleTel brand guidelines for AI
│   ├── solution-design/      # Product management patterns
│   └── promotional-campaigns/ # Campaign response templates
├── agents/                   # AI agent definitions
│   ├── api-engineer.md       # API development
│   └── prompt-optimizer.md   # Prompt optimization
├── tools/                    # MCP code execution
│   ├── supabase-executor.ts  # Database queries (80% token savings)
│   └── README.md             # Tool documentation
├── rules/                    # Modular instruction files
│   ├── verify-schema-first.md
│   ├── api-param-documentation.md
│   └── type-guards-optionals.md
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

### Inngest (Background Jobs)

- **Location**: `lib/inngest/`
- **Dashboard**: Vercel Integrations → Inngest
- **Use Cases**: Supplier sync, coverage checks, notifications, billing
- **Pattern**: Dual triggers (cron + manual event)

**Key Functions**:
| Function | Schedule | Purpose |
|----------|----------|---------|
| `supplier-sync` | Daily 2am | Sync Miro/Nology products |
| `coverage-check` | On-demand | Parallel provider coverage |
| `invoice-generation` | Monthly 1st | Generate customer invoices |
| `sms-reminders` | Daily 10pm | Overdue invoice reminders |

**Conflict Detection Pattern**:
```typescript
const { data: running } = await supabase.from('sync_logs')
  .select('id').in('status', ['pending', 'running']).single();
if (running) return { status: 409, error: 'Already running' };
```

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

## Recent Updates (2026)

### March 2026
- **Phosphor Icons Migration** (2026-03-05): Migrated all icons from Lucide React/Heroicons to Phosphor Icons Bold (`react-icons/pi`). Removed `lucide-react` and `@heroicons/react` dependencies. ~300 files updated, 0 type errors.
- **Design System v1.0**: Typography scale (1.32× modular), color tokens, gradient presets, CTA button variants
- Platform stabilization: TypeScript errors reduced from 1,005 → 0
- Added B2B Sales Feasibility Portal (`/admin/sales/feasibility`)
- Homepage CRO optimizations (Cell C-inspired patterns)
- Segment-aware homepage (business/wfh/home tabs)
- SkyFibre Home residential products added
- 13+ Claude Code skills documented
- Legacy components cleanup: Deleted Hero.tsx, HeroWithTabs.tsx, package-card.tsx
- Token migration: darkNeutral → navy (157+ files)

### February 2026
- Miro/Nology supplier integrations
- Inngest background job system
- Bulk quote generation API
- Invoice SMS reminders via Clickatell

### January 2026
- Prismic CMS integration for product pages
- AI image generation workflows (Gemini)
- Partner compliance document system complete

---

**Document Version**: 2.2
**Last Updated**: 2026-03-05
**Maintained By**: Development Team + Claude Code
