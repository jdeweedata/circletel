# CircleTel Next.js - Project Structure

**Last Updated**: 2025-10-20
**Version**: 2.0 (Phase 2 Extensions Complete)
**Status**: Production-Ready B2C Platform

---

## Overview

CircleTel is a full-stack ISP platform built with Next.js 15, TypeScript, and Supabase. The platform supports B2C customer journeys (complete) with B2B/Enterprise expansion planned.

**Tech Stack**:
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Zustand
- **Auth**: Supabase Auth + RBAC
- **Payments**: Netcash Gateway
- **Email**: Resend API
- **Testing**: Playwright (E2E)
- **Deployment**: Vercel

---

## Directory Structure

```
circletel-nextjs/
├── .claude/                          # Claude Code configuration
│   ├── memory/                       # Domain-specific contexts
│   ├── agents/                       # Agent-OS templates
│   └── skills/                       # Custom skills
│       ├── sql-assistant/            # Natural language SQL queries
│       ├── deployment-check/         # Pre-deployment validation
│       ├── coverage-check/           # Multi-provider coverage testing
│       ├── product-import/           # Excel product imports
│       ├── admin-setup/              # RBAC role configuration
│       └── supabase-fetch/           # Database queries
│
├── app/                              # Next.js 15 App Router
│   ├── (public)/                     # Public routes
│   │   ├── page.tsx                  # Homepage
│   │   ├── coverage/                 # Coverage checker
│   │   ├── wireless/                 # Wireless packages showcase
│   │   ├── promotions/               # Marketing promotions page
│   │   ├── marketing/[slug]/         # Dynamic marketing landing pages
│   │   └── campaigns/[slug]/         # Campaign pages
│   │
│   ├── admin/                        # Admin panel (protected)
│   │   ├── layout.tsx                # Admin layout with sidebar
│   │   ├── login/                    # Admin authentication
│   │   ├── signup/                   # Admin registration
│   │   ├── dashboard/                # Admin dashboard home
│   │   ├── products/                 # Product management
│   │   ├── coverage/                 # Coverage management module
│   │   │   ├── page.tsx              # Dashboard & monitoring
│   │   │   ├── analytics/            # Performance metrics
│   │   │   ├── testing/              # API testing tools
│   │   │   └── providers/            # Network provider CRUD
│   │   ├── billing/                  # Billing integration
│   │   ├── zoho/                     # Zoho CRM integration
│   │   └── orders/                   # Order management
│   │       ├── consumer/             # Consumer orders dashboard
│   │       └── business/             # Business orders (future)
│   │
│   ├── order/                        # Order flows
│   │   ├── consumer/                 # B2C 3-step order form
│   │   └── business/                 # B2B order form (future)
│   │
│   ├── orders/[orderId]/             # Order tracking page
│   │
│   ├── payments/                     # Payment processing
│   │   ├── [orderId]/                # Payment page for order
│   │   └── return/                   # Payment return/callback page
│   │
│   ├── quotes/                       # Quote system (future)
│   │   ├── request/                  # Quote request form
│   │   └── approve/[quoteId]/        # Quote approval page
│   │
│   └── api/                          # API routes
│       ├── coverage/                 # Coverage checking APIs
│       │   ├── check/                # Coverage check endpoint
│       │   ├── packages/             # Package recommendations
│       │   ├── mtn/                  # MTN provider integration
│       │   └── geo-validate/         # Geographic validation
│       │
│       ├── orders/                   # Order management
│       │   └── consumer/             # Consumer orders CRUD
│       │
│       ├── payments/                 # Payment processing
│       │   ├── initiate/             # Start payment process
│       │   ├── callback/             # Netcash webhook handler
│       │   └── status/[transactionId]/ # Check payment status
│       │
│       ├── admin/                    # Admin APIs
│       │   ├── orders/               # Order management
│       │   │   └── consumer/         # Consumer order updates
│       │   └── providers/            # Network provider management
│       │
│       └── zoho/                     # Zoho integration endpoints
│
├── components/                       # React components
│   ├── ui/                           # shadcn/ui component library
│   │   ├── button.tsx                # Button component
│   │   ├── card.tsx                  # Card component
│   │   ├── dialog.tsx                # Dialog/modal component
│   │   ├── table.tsx                 # Table component
│   │   ├── sidebar/                  # Sidebar navigation
│   │   └── ...                       # 40+ UI components
│   │
│   ├── admin/                        # Admin-specific components
│   │   ├── layout/                   # Admin layouts
│   │   │   ├── Sidebar.tsx           # Admin sidebar navigation
│   │   │   └── Header.tsx            # Admin header
│   │   └── orders/                   # Order management components
│   │       └── StatusUpdateModal.tsx # Order status update modal
│   │
│   ├── coverage/                     # Coverage checking components
│   │   ├── CoverageChecker.tsx       # Main coverage checker
│   │   ├── CoverageMap.tsx           # Google Maps integration
│   │   └── PackageResults.tsx        # Package recommendation display
│   │
│   ├── order/                        # Order form components
│   │   ├── OrderWizard.tsx           # Multi-step wizard navigation
│   │   ├── Step1PackageConfirmation.tsx  # Package review step
│   │   ├── Step2CustomerDetails.tsx      # Customer info form
│   │   ├── Step3OrderConfirmation.tsx    # Final review step
│   │   └── OrderTimeline.tsx         # Order status timeline
│   │
│   ├── marketing/                    # Marketing content components
│   │   ├── PromotionCard.tsx         # Promotion display card
│   │   ├── PromotionGrid.tsx         # Promotion grid with filters
│   │   ├── MarketingHero.tsx         # Hero banner component
│   │   └── MarketingSections.tsx     # Dynamic section renderer
│   │
│   ├── providers/                    # React context providers
│   │   ├── QueryProvider.tsx         # React Query provider
│   │   ├── PWAProvider.tsx           # PWA functionality
│   │   └── TooltipProvider.tsx       # Tooltip context
│   │
│   └── rbac/                         # RBAC components
│       ├── PermissionGate.tsx        # Conditional rendering by permission
│       └── RoleTemplateSelector.tsx  # Role selection component
│
├── lib/                              # Utility functions & services
│   ├── coverage/                     # Multi-provider coverage system
│   │   ├── aggregation-service.ts    # Coverage aggregation logic
│   │   ├── types.ts                  # Coverage type definitions
│   │   └── mtn/                      # MTN provider integration
│   │       ├── wms-client.ts         # MTN WMS API client
│   │       ├── wms-parser.ts         # Response parser
│   │       ├── validation.ts         # JSON schema validation
│   │       ├── monitoring.ts         # Performance monitoring
│   │       ├── geo-validation.ts     # Geographic validation
│   │       └── test-data.ts          # Mock data for development
│   │
│   ├── payments/                     # Payment processing services
│   │   └── netcash-service.ts        # Netcash payment gateway
│   │
│   ├── notifications/                # Notification services
│   │   └── notification-service.ts   # Email notification service
│   │
│   ├── rbac/                         # Role-Based Access Control
│   │   ├── permissions.ts            # 100+ permission definitions
│   │   ├── role-templates.ts         # 17 role templates
│   │   └── types.ts                  # RBAC type definitions
│   │
│   ├── auth/                         # Authentication services
│   │   └── auth-service.ts           # Supabase auth utilities
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── customer-journey.ts       # Customer journey types
│   │   ├── coverage-providers.ts     # Network provider types
│   │   ├── strapi.ts                 # Strapi CMS types
│   │   ├── zoho.ts                   # Zoho integration types
│   │   └── ...                       # Domain-specific types
│   │
│   ├── supabase/                     # Supabase client configuration
│   │   ├── client.ts                 # Client-side Supabase client
│   │   └── server.ts                 # Server-side Supabase client
│   │
│   ├── strapi-client.ts              # Strapi CMS client
│   └── utils.ts                      # General utilities
│
├── hooks/                            # Custom React hooks
│   ├── useAdminAuth.ts               # Admin authentication hook
│   ├── usePermissions.ts             # RBAC permission checking
│   ├── use-promotions.ts             # Marketing promotions data
│   ├── use-marketing-pages.ts        # Marketing pages data
│   ├── use-campaigns.ts              # Campaign data
│   ├── use-zoho-mcp.ts               # Zoho MCP integration
│   └── use-strapi.ts                 # Strapi data fetching
│
├── supabase/                         # Database configuration
│   ├── migrations/                   # Database migrations
│   │   ├── 20250201000005_create_rbac_system.sql             # RBAC system
│   │   ├── 20251019000001_enhance_provider_management.sql    # Provider health
│   │   ├── 20251020000001_create_payment_transactions.sql    # Payment tracking
│   │   └── ...                       # All migrations
│   │
│   └── functions/                    # Supabase Edge Functions
│
├── docs/                             # Documentation
│   ├── features/                     # Feature documentation
│   │   ├── PHASE_1_COMPLETE.md       # Phase 1: Database foundation
│   │   ├── PHASE_2_DAY_1_COMPLETE.md # Day 1: Lead capture
│   │   ├── PHASE_2_DAY_2_COMPLETE.md # Day 2: Order form
│   │   ├── PHASE_2_DAY_3_COMPLETE.md # Day 3: Admin dashboard
│   │   └── PHASE_2_EXTENSIONS_COMPLETE.md  # Extensions: Payments
│   │
│   ├── roadmap/                      # Product roadmap
│   │   └── B2B_ENTERPRISE_ROADMAP.md # B2B/Enterprise expansion plan
│   │
│   ├── marketing/                    # Marketing team documentation
│   │   ├── README.md                 # Full user guide
│   │   ├── quick-start-guide.md      # 5-minute quickstart
│   │   └── SETUP.md                  # Technical setup
│   │
│   ├── rbac/                         # RBAC documentation
│   │   └── RBAC_SYSTEM_GUIDE.md      # Complete RBAC guide
│   │
│   ├── integrations/                 # Integration documentation
│   │   ├── MTN_INTEGRATION.md        # MTN coverage API
│   │   ├── ZOHO_INTEGRATION.md       # Zoho CRM
│   │   └── STRAPI_INTEGRATION.md     # Strapi CMS
│   │
│   ├── setup/                        # Setup guides
│   │   ├── SUPABASE_AUTH_USER_CREATION.md   # Auth setup
│   │   └── QUICK_START_PRODUCTION_AUTH.md   # Production auth
│   │
│   └── PROJECT_STRUCTURE.md          # This file
│
├── scripts/                          # Utility scripts
│   ├── workflow-morning.ps1          # Morning memory optimization
│   ├── workflow-cleanup.ps1          # End-of-day cleanup
│   ├── check-memory.ps1              # Quick memory check
│   └── ...                           # Development scripts
│
├── strapi-cms/                       # Strapi CMS backend (separate)
│   ├── src/api/                      # API collections
│   │   ├── promotion/                # Promotions content type
│   │   ├── marketing-page/           # Marketing pages
│   │   └── campaign/                 # Campaigns
│   └── ...                           # Strapi configuration
│
├── public/                           # Static assets
│   ├── uploads/                      # User uploads (logos, files)
│   └── ...                           # Images, fonts, icons
│
├── .claude/                          # Claude Code configuration
├── .env.local                        # Environment variables (gitignored)
├── .env.netcash.example              # Netcash config template
├── tailwind.config.ts                # Tailwind configuration
├── next.config.mjs                   # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
└── CLAUDE.md                         # Project instructions for Claude
```

---

## Key Directories Explained

### `/app` - Next.js App Router

**Public Routes** (no auth required):
- `/` - Homepage
- `/coverage` - Coverage checker with Google Maps
- `/wireless` - Wireless packages showcase
- `/promotions` - Marketing promotions page
- `/marketing/[slug]` - Dynamic marketing landing pages
- `/campaigns/[slug]` - Campaign pages with linked promotions
- `/orders/[orderId]` - Customer order tracking
- `/payments/[orderId]` - Payment page
- `/payments/return` - Payment return handler

**Protected Routes** (admin auth required):
- `/admin/*` - All admin routes
- `/admin/dashboard` - Admin home
- `/admin/products` - Product management
- `/admin/coverage` - Coverage management
- `/admin/orders/consumer` - Consumer orders dashboard
- `/admin/billing` - Billing integration
- `/admin/zoho` - Zoho CRM integration

**API Routes**:
- `/api/coverage/*` - Coverage checking endpoints
- `/api/orders/*` - Order management
- `/api/payments/*` - Payment processing
- `/api/admin/*` - Admin operations

### `/components` - React Components

**UI Components** (`/components/ui`):
- Built on Radix UI primitives
- Styled with Tailwind CSS
- shadcn/ui component library (40+ components)
- Consistent design system (CircleTel branding)

**Feature Components**:
- **Coverage**: Google Maps integration, address search
- **Order**: Multi-step wizard, form validation
- **Admin**: Sidebar navigation, status update modal
- **Marketing**: Promotion cards, dynamic content sections

**Provider Components**:
- React Query provider (server state)
- PWA provider (offline functionality)
- Tooltip provider (UI tooltips)

### `/lib` - Business Logic & Services

**Coverage System** (`/lib/coverage`):
- Multi-provider aggregation
- MTN integration (Business + Consumer APIs)
- Geographic validation for South Africa
- Performance monitoring and health checks
- Fallback system (MTN Business → MTN Consumer → Mock)

**Payment System** (`/lib/payments`):
- Netcash gateway integration
- Payment form generation
- Webhook callback processing
- Transaction tracking

**RBAC System** (`/lib/rbac`):
- 17 role templates (Executive, Management, Staff, Support)
- 100+ granular permissions
- Permission checking utilities
- Database-enforced access control

**Type Definitions** (`/lib/types`):
- Customer journey types
- Coverage provider types
- Strapi CMS response types
- Zoho integration types

### `/hooks` - Custom React Hooks

**Authentication**:
- `useAdminAuth()` - Admin session management
- `usePermissions()` - RBAC permission checking

**Data Fetching**:
- `use-promotions()` - Marketing promotions
- `use-marketing-pages()` - Dynamic landing pages
- `use-campaigns()` - Marketing campaigns
- `use-strapi()` - Strapi CMS data

**Integrations**:
- `use-zoho-mcp()` - Zoho CRM via MCP

### `/supabase` - Database Layer

**Migrations** (`/supabase/migrations`):
- All database schema changes tracked
- Applied via Supabase Dashboard SQL Editor
- Idempotent migrations (safe to re-run)

**Key Migrations**:
1. `20250201000005_create_rbac_system.sql` - RBAC with 17 roles ✅
2. `20251019000001_enhance_provider_management.sql` - Provider health ✅
3. `20251020000001_create_payment_transactions.sql` - Payment tracking ✅

**Tables**:
- `consumer_orders` - B2C customer orders
- `coverage_leads` - Coverage check submissions
- `service_packages` - Product packages
- `payment_transactions` - Payment tracking
- `fttb_network_providers` - Network providers
- `admin_users` - Admin user accounts
- `role_templates` - RBAC role definitions

### `/docs` - Documentation

**Feature Docs** (`/docs/features`):
- Phase completion documents
- Implementation details
- Success criteria tracking

**Roadmap** (`/docs/roadmap`):
- B2B/Enterprise expansion plan
- Timeline and resource allocation

**Integration Guides** (`/docs/integrations`):
- MTN coverage API
- Zoho CRM integration
- Strapi CMS setup

**Setup Guides** (`/docs/setup`):
- Production authentication
- Supabase configuration
- Environment setup

---

## Data Flow Architecture

### Coverage Check Flow
```
User Input (Address)
    ↓
Coverage Checker Component
    ↓
POST /api/coverage/check
    ↓
Aggregation Service
    ↓
MTN WMS Client → MTN API
    ↓
WMS Parser → Validation
    ↓
Package Recommendations
    ↓
Coverage Results Page
    ↓
Lead stored in coverage_leads table
```

### Order Flow
```
Coverage Results → Select Package
    ↓
3-Step Order Form
    ↓ (Step 1: Package Confirmation)
    ↓ (Step 2: Customer Details)
    ↓ (Step 3: Order Review)
    ↓
POST /api/orders/consumer
    ↓
consumer_orders table
    ↓
Order Confirmation Email
    ↓
Redirect to /payments/{orderId}
```

### Payment Flow
```
Payment Page (/payments/{orderId})
    ↓
POST /api/payments/initiate
    ↓
payment_transactions table (pending)
    ↓
Redirect to Netcash Gateway
    ↓
Customer Completes Payment
    ↓
Netcash calls POST /api/payments/callback
    ↓
Update payment_transactions (completed)
    ↓
Update consumer_orders (status: payment, payment_status: paid)
    ↓
Send Payment Confirmation Email
    ↓
Redirect to /payments/return (success)
    ↓
Auto-redirect to /orders/{orderId}
```

### Admin Status Update Flow
```
Admin Dashboard (/admin/orders/consumer)
    ↓
Click "Update Status" on order
    ↓
StatusUpdateModal opens
    ↓
Select new status + add notes
    ↓
PATCH /api/admin/orders/consumer
    ↓
Update consumer_orders (status, timestamps)
    ↓
Append to internal_notes
    ↓
Send Status Change Email (future)
    ↓
Refresh order list
```

---

## Key Features by Module

### Coverage Management
- **Multi-provider aggregation** (MTN Business, MTN Consumer, future providers)
- **Geographic validation** (South Africa bounds checking)
- **Performance monitoring** (success rates, response times)
- **Health tracking** (provider status: healthy, degraded, down)
- **Admin dashboard** with real-time metrics
- **API testing tools** for debugging

### Order Management (B2C)
- **3-step order wizard** (package, details, confirmation)
- **Lead capture** from coverage checks
- **Order tracking page** with timeline
- **Admin dashboard** with filtering and search
- **Status update modal** with validation
- **Email notifications** (order confirmation, payment confirmation)

### Payment Processing
- **Netcash integration** (card, EFT, budget payments)
- **Payment initiation API**
- **Webhook callback handler**
- **Transaction tracking** (audit trail)
- **Payment status checking**
- **Customer payment pages** (payment, return)
- **Email confirmations** on successful payment

### Admin Panel
- **Role-Based Access Control** (17 roles, 100+ permissions)
- **Product management** (CRUD operations)
- **Order management** (consumer orders dashboard)
- **Coverage management** (provider CRUD, analytics)
- **Billing integration** (placeholder)
- **Zoho CRM integration** (demo mode)

### Marketing System
- **Strapi CMS integration** (promotions, campaigns, pages)
- **Dynamic landing pages** (`/marketing/[slug]`)
- **Promotion showcase** (`/promotions`)
- **Campaign pages** (`/campaigns/[slug]`)
- **Content editor role** for marketing team

---

## Environment Configuration

### Required Environment Variables

**Supabase**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
```

**Netcash Payment Gateway**:
```env
NETCASH_MERCHANT_ID=52340889417
NETCASH_WEBHOOK_SECRET=<secret>
NETCASH_PAYMENT_URL=https://sandbox.netcash.co.za/paynow/process
NEXT_PUBLIC_BASE_URL=https://circletel.co.za
```

**Google Maps**:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>
```

**Email**:
```env
RESEND_API_KEY=<key>
```

**Strapi CMS** (Optional):
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<token>
```

**Zoho CRM** (Optional):
```env
ZOHO_CLIENT_ID=<id>
ZOHO_CLIENT_SECRET=<secret>
```

---

## Database Schema Summary

### Core Tables

**Orders**:
- `consumer_orders` - B2C customer orders (58 columns)
- `business_orders` - B2B enterprise orders (future)

**Leads**:
- `coverage_leads` - Coverage check submissions

**Products**:
- `service_packages` - Product catalog

**Payments**:
- `payment_transactions` - Payment tracking (all providers)

**Providers**:
- `fttb_network_providers` - Network provider master data
- `provider_api_logs` - API request/response logs
- `provider_logos` - Provider logo storage
- `coverage_files` - KML/KMZ coverage file metadata

**Admin**:
- `admin_users` - Admin accounts with RBAC
- `role_templates` - 17 predefined roles
- `order_status_history` - Audit trail for status changes

---

## Code Quality & Standards

### TypeScript
- **Strict mode enabled**
- **No `any` types** (except where unavoidable)
- **Interface-first** type definitions
- **Proper null handling** with optional chaining

### Component Patterns
- **Client components**: `'use client'` for interactivity
- **Server components**: Default for static content
- **Props interfaces**: Explicitly typed props
- **Error boundaries**: Graceful error handling

### API Design
- **RESTful conventions** (GET, POST, PATCH, DELETE)
- **Consistent responses**: `{ success: boolean, error?: string, data?: T }`
- **Validation**: Server-side validation on all inputs
- **Error codes**: HTTP status codes (400, 404, 500)

### Database
- **Migrations**: All schema changes tracked
- **Indexes**: Strategic indexing on queries
- **Constraints**: Foreign keys, check constraints
- **Triggers**: Auto-update timestamps

---

## Development Workflow

### Pre-Commit Checklist
1. Run `npm run type-check` to catch TypeScript errors
2. Fix any errors reported
3. Run `npm run type-check` again to verify
4. Commit and push

### Memory Management (16GB Systems)
1. **Morning**: Run `npm run workflow:start`
2. **Development**: Use `npm run dev:memory`
3. **End of Day**: Run `npm run workflow:cleanup`

### Testing
- **E2E Testing**: Playwright via MCP integration
- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint`

---

## Deployment

### Platform: Vercel

**Build Commands**:
- `npm run build` - Standard build
- `npm run build:memory` - Build with increased memory

**Environment**:
- All environment variables configured in Vercel dashboard
- Preview deployments for branches
- Production deployment on `main` branch

**Database Migrations**:
- Applied manually via Supabase Dashboard SQL Editor
- Migrations tracked in git (`/supabase/migrations`)

---

## Future Expansions (Planned)

### Phase 3A: B2B Foundation (2 weeks)
- Business order flow
- Quote system with PDF generation
- Account management

### Phase 3B: Enterprise Features (3 weeks)
- Multi-site management
- Custom pricing tiers
- SLA tracking and reporting

### Phase 3C: Advanced Features (2 weeks)
- Technician management
- Multi-channel notifications
- Integration APIs and webhooks

See `/docs/roadmap/B2B_ENTERPRISE_ROADMAP.md` for complete plan.

---

## Resources

### Documentation
- **Feature Docs**: `/docs/features/`
- **Setup Guides**: `/docs/setup/`
- **API Guides**: `/docs/integrations/`
- **Roadmap**: `/docs/roadmap/`

### Key Files
- **Main Config**: `CLAUDE.md` (project instructions)
- **Structure**: `docs/PROJECT_STRUCTURE.md` (this file)
- **Environment**: `.env.netcash.example` (payment config)

### External Links
- **Supabase Dashboard**: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
- **Vercel Dashboard**: https://vercel.com/circletel
- **Netcash Docs**: https://netcash.co.za/support/knowledge-base/

---

**Status**: ✅ Production-Ready (B2C)
**Next**: Phase 3 - B2B/Enterprise Features
**Maintained By**: Development Team + Claude Code
