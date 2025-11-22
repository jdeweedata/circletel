# CircleTel - Comprehensive Project Overview

**Document Version**: 1.1.0
**Created**: 2025-01-22
**Last Updated**: 2025-01-22 15:00 SAST
**Status**: Current
**Maintainer**: Development Team + Claude Code

---

## 📋 Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1.0 | 2025-01-22 | Expanded third-party integrations section with reference to comprehensive guide | Claude Code |
| 1.0.0 | 2025-01-22 | Initial comprehensive project overview | Claude Code |

---

## 🏢 **Project Overview**

### **Project Identity**
- **Name**: CircleTel
- **Type**: B2B/B2C ISP (Internet Service Provider) Platform
- **Market**: South Africa
- **Industry**: Telecommunications / Internet Services

### **Deployment Endpoints**
- **Production**: https://www.circletel.co.za
- **Staging**: https://circletel-staging.vercel.app
- **Hosting Provider**: Vercel
- **Deployment Strategy**: 2-Branch (Feature → Staging → Main)

---

## 🛠️ **Technology Stack**

### **Frontend Framework**
- **Next.js 15.0.0** (App Router, React Server Components)
- **React 18.3.1** (with React DOM)
- **TypeScript 5.5.3** (Strict mode enabled)
- **Build System**: Webpack (customized for chunk optimization)

### **Styling & UI Libraries**
- **Tailwind CSS 3.4.11**
  - Custom CircleTel color palette
  - Custom animations (fade-in, scale-in, blob, float, pulse-glow)
  - Responsive design system
- **Radix UI** (27+ primitive component libraries)
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog
  - Dropdown Menu, Hover Card, Popover, Select, Tabs
  - Tooltip, Toast, Toggle, Navigation Menu
- **shadcn/ui** Components (Built on Radix UI)
- **Framer Motion 12.23.24** (Page transitions & animations)
- **Motion 12.23.22** (Additional animation utilities)
- **Lucide React 0.462.0** (Primary icon library - 462+ icons)
- **Tabler Icons 3.35.0** (Supplementary icon set)
- **React Icons 5.5.0** (Additional icon support)

### **Backend & Infrastructure**
- **Supabase** (Primary backend)
  - **Project ID**: `agyjovdugmtopasyvlng`
  - **Database**: PostgreSQL with Row Level Security (RLS)
  - **Authentication**: JWT + httpOnly cookies
  - **Storage**: File uploads (partner compliance, contracts)
  - **Realtime**: WebSocket subscriptions
  - **Edge Functions**: Deno-based serverless functions
  - **CLI Version**: 2.45.5

### **State Management Architecture**
- **Zustand 4.4.7** (Global application state)
  - Order flow state
  - Coverage checking state
  - User preferences
- **TanStack React Query 5.56.2** (Server state management)
  - API data caching
  - Background refetching
  - Optimistic updates
- **React Hook Form 7.63.0** (Form state)
  - Validation with Zod 3.25.76
  - @hookform/resolvers 3.10.0
- **Dexie 4.0.8** + Dexie React Hooks 1.1.7 (IndexedDB)
  - Offline-first PWA support
  - Local data persistence

### **Payment Processing**
- **NetCash Pay Now** (Primary payment gateway)
  - 20+ payment methods supported
  - PCI Vault tokenization
  - HMAC-SHA256 webhook verification
  - Test and production environment support
- **Payment Methods**: Credit/Debit, EFT, Instant EFT, SnapScan, Zapper, Mobicred, etc.

### **Content Management Systems**
- **Sanity CMS** (Primary CMS)
  - @sanity/client 7.12.0
  - @sanity/image-url 1.2.0
  - @portabletext/react 4.0.3 (Rich text rendering)
- **Strapi CMS** (Legacy - being phased out)
  - @strapi/client 1.5.0
  - Running on localhost:1337 (development)

### **Maps & Geolocation**
- **Google Maps API**
  - @googlemaps/js-api-loader 1.16.10
  - @react-google-maps/api 2.20.7
  - use-places-autocomplete 4.0.1
- **Features**: Coverage checking, service area validation, geocoding

### **Data Visualization & Charts**
- **Chart.js 4.5.1** (Primary charting library)
  - react-chartjs-2 5.3.1 (React wrapper)
- **Recharts 2.15.4** (Admin dashboard analytics)
- **Use Cases**: Admin analytics, usage tracking, billing visualizations

### **Email & Communication**
- **Resend 6.1.1** (Transactional email service)
- **React Email**
  - @react-email/components 0.5.7
  - @react-email/render 1.4.0
- **Email Templates**: Order confirmations, KYC notifications, contract signing

### **Document Generation**
- **jsPDF 3.0.3** (PDF generation)
  - jspdf-autotable 5.0.2 (Table generation)
- **Use Cases**: Invoices, contracts, quotes, reports

### **File Processing**
- **XLSX 0.18.5** (Excel file handling)
- **JSZip 3.10.1** (ZIP compression)
- **adm-zip 0.5.16** (ZIP extraction)
- **Sharp 0.34.4** (Image optimization)

### **External Integrations** (15+ Third-Party Services)

**📄 Comprehensive Documentation**: See `docs/THIRD_PARTY_INTEGRATIONS.md` for complete details on all integrations including authentication, rate limits, webhooks, and troubleshooting.

#### **Summary by Category**

**Backend Infrastructure**
- **Supabase** (✅ Active): PostgreSQL database, auth, storage, edge functions
- **Vercel** (✅ Active): Hosting, serverless functions, cron jobs

**Payment Gateway**
- **NetCash Pay Now** (✅ Active): 20+ payment methods, PCI-compliant tokenization

**CRM & Business Automation**
- **Zoho CRM** (✅ Active): Customer management, quotes, deals
- **Zoho Billing** (✅ Active): Subscriptions, invoicing
- **Zoho Sign** (✅ Active): E-signature for contracts
- **Zoho Desk** (🚧 Planned Q1 2025): Support tickets

**Identity & Compliance**
- **Didit KYC** (✅ Active): B2B/B2C identity verification
- **ICASA RICA** (🚧 In Development): Telecom compliance (64% complete)

**Communication Services**
- **Resend** (✅ Active): Transactional emails (20+ templates)
- **Clickatell** (🚧 Planned Q1 2025): SMS notifications, OTPs

**Maps & Geolocation**
- **Google Maps Platform** (✅ Active): Coverage checking, autocomplete, geocoding

**Content Management**
- **Sanity CMS** (✅ Active): Primary headless CMS
- **Strapi CMS** (⚠️ Deprecated): Legacy CMS (migration in progress)

**Analytics & Monitoring**
- **Vercel Analytics** (✅ Active): Real user monitoring, Core Web Vitals

**Development & Testing**
- **Playwright** (✅ Active): E2E testing, browser automation

#### **Integration Health Monitoring**
- **Health Check Cron**: Every 30 minutes (`/api/cron/integrations-health-check`)
- **Dashboard**: `/admin/integrations`
- **Alerts**: Email notifications on integration failures
- **Metrics**: Response time, uptime, error rates

#### **Key Integration Patterns**

**Supabase-First Sync** (Zoho CRM/Billing):
```
User Action → Supabase (immediate) → User Success
              ↓ (async background)
         zoho_sync_queue
              ↓ (cron every 30 min)
         Zoho API Sync
              ↓
         zoho_sync_logs
```

**Webhook Verification** (NetCash, Didit, Zoho Sign):
- HMAC-SHA256 signature verification
- Idempotent webhook handling
- Automatic retry with exponential backoff

**OAuth 2.0 Token Management** (Zoho, Google):
- Refresh tokens in environment variables
- Access tokens cached (1 hour TTL)
- Automatic token refresh
- Custom rate limiting (token bucket algorithm)

**Rate Limiting**:
- Per-integration rate limiters
- Token bucket algorithm
- Request queuing
- Automatic retry on rate limit exceeded

#### **Integration Environment Variables**
**Total**: 150+ environment variables across all integrations

See `docs/THIRD_PARTY_INTEGRATIONS.md` for complete configuration details.

### **Testing & Quality Assurance**
- **Playwright 1.56.1** (E2E testing)
  - @playwright/test 1.55.1
  - playwright-core 1.56.1
- **Jest** (Unit testing)
  - Coverage reporting
  - CI/CD integration
- **ESLint 9.9.0** (Code linting)
  - @eslint/js 9.9.0
  - eslint-config-next 15.0.0

### **Progressive Web App (PWA)**
- **next-pwa 5.6.0**
  - Service worker registration
  - Runtime caching strategies
  - Offline support
  - Asset caching (fonts, images, JS/CSS)
  - Supabase API caching

### **Development Tools**
- **TypeScript 5.5.3** (Type checking)
- **PostCSS 8.4.47** (CSS processing)
- **Autoprefixer 10.4.20** (CSS vendor prefixing)
- **Cross-env** (Environment variable handling)
- **TSX** (TypeScript execution)

### **Additional Libraries**
- **axios 1.12.2** (HTTP client)
- **date-fns 3.6.0** (Date manipulation)
- **clsx 2.1.1** + **tailwind-merge 2.6.0** (Conditional classes)
- **class-variance-authority 0.7.1** (Component variants)
- **cmdk 1.0.0** (Command menu)
- **sonner 1.7.4** (Toast notifications)
- **vaul 0.9.3** (Drawer component)
- **input-otp 1.2.4** (OTP input)
- **embla-carousel-react 8.3.0** (Carousel)
- **react-resizable-panels 2.1.3** (Resizable layouts)
- **canvas-confetti 1.9.3** (Celebration effects)
- **cronstrue 3.9.0** (Cron expression parsing)

---

## 📁 **Project Structure**

```
circletel-nextjs/
│
├── 📱 app/                          # Next.js 15 App Router
│   ├── (payload)/                   # Payload CMS routes (future)
│   ├── admin/                       # Admin Portal (RBAC)
│   │   ├── dashboard/              # Admin dashboard
│   │   ├── orders/                 # Order management
│   │   ├── quotes/                 # B2B quote management
│   │   ├── products/               # Product catalog admin
│   │   ├── users/                  # User management
│   │   ├── partners/               # Partner management
│   │   ├── payments/               # Payment settings
│   │   ├── integrations/           # Integration management
│   │   └── [17 more sections]
│   │
│   ├── api/                         # API Routes (37+ endpoints)
│   │   ├── admin/                  # Admin APIs
│   │   ├── auth/                   # Authentication APIs
│   │   ├── coverage/               # Coverage checking
│   │   ├── orders/                 # Order management
│   │   ├── quotes/                 # B2B quoting
│   │   ├── payments/               # Payment processing
│   │   ├── webhooks/               # External webhooks
│   │   ├── cron/                   # Scheduled jobs (6 crons)
│   │   ├── kyc/                    # KYC verification
│   │   ├── contracts/              # Contract generation
│   │   ├── invoices/               # Invoice generation
│   │   ├── partners/               # Partner APIs
│   │   ├── customers/              # Customer management
│   │   └── [25 more categories]
│   │
│   ├── dashboard/                   # Customer Dashboard
│   │   ├── services/               # Service management
│   │   ├── billing/                # Billing & invoices
│   │   ├── usage/                  # Usage tracking
│   │   ├── support/                # Support tickets
│   │   └── settings/               # Account settings
│   │
│   ├── business/                    # B2B Quote Portal
│   │   ├── quote/                  # Quote request flow
│   │   └── [id]/                   # Quote detail pages
│   │
│   ├── partner/                     # Partner Portal
│   │   ├── registration/           # Partner registration
│   │   ├── compliance/             # Document upload (FICA/CIPC)
│   │   └── dashboard/              # Partner dashboard
│   │
│   ├── checkout/                    # Order Checkout Flow
│   │   ├── [leadId]/               # Checkout page
│   │   └── success/                # Order confirmation
│   │
│   ├── packages/                    # Service Package Selection
│   ├── fibre/                       # Fibre Products
│   ├── wireless/                    # Wireless Products
│   ├── voip/                        # VoIP Products
│   ├── cloud/                       # Cloud Hosting
│   ├── cloud-hosting/               # Cloud Hosting (alternate)
│   ├── virtual-desktops/            # Virtual Desktop Services
│   ├── bundles/                     # Product Bundles
│   ├── devices/                     # Hardware Devices
│   ├── connectivity/                # Connectivity Solutions
│   │
│   ├── auth/                        # Authentication Pages
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   │
│   ├── marketing/                   # Marketing Pages
│   ├── campaigns/                   # Campaign Landing Pages
│   ├── promotions/                  # Promotional Pages
│   ├── cms-blog/                    # Blog (CMS-driven)
│   ├── cms-pages/                   # Dynamic CMS Pages
│   ├── cms-products/                # CMS Product Pages
│   ├── resources/                   # Resource Center
│   ├── contact/                     # Contact Form
│   ├── terms/                       # Terms & Conditions
│   ├── privacy-policy/              # Privacy Policy
│   ├── refund-policy/               # Refund Policy
│   ├── terms-of-service/            # Terms of Service
│   ├── payment-terms/               # Payment Terms
│   │
│   ├── demo/                        # Demo Pages
│   ├── test/                        # Test Pages
│   ├── forms/                       # Standalone Forms
│   └── agents/                      # Agent Portal (future)
│
├── 🧩 components/                   # React Components (500+)
│   ├── admin/                       # Admin UI Components
│   │   ├── orders/                 # Order management components
│   │   ├── products/               # Product management
│   │   ├── analytics/              # Analytics dashboards
│   │   └── [more admin sections]
│   ├── dashboard/                   # Customer Dashboard Components
│   ├── checkout/                    # Checkout Flow Components
│   ├── coverage/                    # Coverage Checker Components
│   ├── quotes/                      # B2B Quote Components
│   ├── partners/                    # Partner Portal Components
│   ├── payment/                     # Payment Components
│   ├── payments/                    # Payment Processing
│   ├── billing/                     # Billing Components
│   ├── compliance/                  # Compliance Document Upload
│   ├── contact/                     # Contact Forms
│   ├── forms/                       # Reusable Forms
│   ├── marketing/                   # Marketing Components
│   ├── navigation/                  # Navigation Components
│   ├── order/                       # Order Flow Components
│   ├── packages/                    # Package Selection
│   ├── pricing-cards/               # Pricing Components
│   ├── products/                    # Product Components
│   ├── providers/                   # ISP Provider Components
│   ├── wireless/                    # Wireless Product Components
│   ├── cloud-hosting/               # Cloud Hosting Components
│   ├── virtual-desktops/            # Virtual Desktop Components
│   ├── partner-landing/             # Partner Landing Page
│   ├── customer-journey/            # Customer Journey Components
│   ├── home/                        # Homepage Components
│   ├── demo/                        # Demo Components
│   ├── sanity/                      # Sanity CMS Components
│   ├── zoho/                        # Zoho Integration Components
│   ├── rbac/                        # RBAC Components
│   ├── layout/                      # Layout Components
│   ├── common/                      # Common Utilities
│   └── ui/                          # shadcn/ui Base Components
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── [50+ ui primitives]
│
├── 🔧 lib/                          # Business Logic & Services (35 modules)
│   ├── supabase/                    # Supabase Integration
│   │   ├── client.ts               # Client-side Supabase
│   │   ├── server.ts               # Server-side Supabase
│   │   └── middleware.ts           # Auth middleware
│   ├── coverage/                    # Coverage System
│   │   ├── aggregation-service.ts  # 4-layer fallback
│   │   ├── mtn-wms-service.ts      # MTN Wholesale
│   │   ├── mtn-consumer-service.ts # MTN Consumer
│   │   └── provider-api-service.ts # Other providers
│   ├── payment/                     # Payment Services
│   │   ├── netcash-service.ts      # NetCash integration
│   │   └── webhook-verification.ts # HMAC verification
│   ├── zoho/                        # Zoho Integration
│   │   ├── crm-service.ts          # CRM API
│   │   ├── billing-service.ts      # Billing API
│   │   ├── sign-service.ts         # E-signature API
│   │   └── sync-service.ts         # Background sync
│   ├── auth/                        # Authentication Utilities
│   ├── rbac/                        # Role-Based Access Control
│   │   ├── permissions.ts          # 100+ permissions
│   │   └── roles.ts                # 17 role definitions
│   ├── orders/                      # Order Processing
│   ├── quotes/                      # B2B Quote Generation
│   ├── contracts/                   # Contract Management
│   ├── invoices/                    # Invoice Generation
│   ├── notifications/               # Email/SMS Notifications
│   ├── activation/                  # Service Activation
│   ├── fulfillment/                 # Order Fulfillment
│   ├── compliance/                  # Compliance Utilities
│   ├── partners/                    # Partner Management
│   ├── products/                    # Product Catalog
│   ├── product-import/              # Excel Import Tools
│   ├── pricing/                     # Pricing Engine
│   ├── billing/                     # Billing Logic
│   ├── analytics/                   # Analytics Utilities
│   ├── services/                    # Service Management
│   ├── sales-agents/                # Sales Agent Tools
│   ├── catalog/                     # Product Catalog
│   ├── email/                       # Email Utilities
│   ├── emails/                      # Email Templates
│   ├── storage/                     # File Storage
│   ├── integrations/                # External Integrations
│   ├── prismic/                     # Prismic CMS (legacy)
│   ├── sanity/                      # Sanity CMS Utilities
│   ├── agents/                      # Agent Tools
│   ├── constants/                   # Constants & Config
│   ├── types/                       # TypeScript Types
│   └── utils/                       # General Utilities
│
├── 🗄️ supabase/
│   ├── migrations/                  # Database Migrations (100+)
│   │   ├── 20241228_*.sql          # Product tables
│   │   ├── 20250101_*.sql          # Coverage system
│   │   ├── 20250120_*.sql          # Payment consents
│   │   └── [100+ migration files]
│   └── functions/                   # Edge Functions
│       ├── approve-admin-user/
│       └── send-admin-notification/
│
├── 🎭 contexts/                     # React Contexts
│   ├── CustomerAuthProvider.tsx    # Consumer authentication
│   ├── AdminAuthProvider.tsx       # Admin authentication
│   ├── OrderFlowContext.tsx        # Order state management
│   └── [additional contexts]
│
├── 🪝 hooks/                        # Custom React Hooks
│   ├── use-auth.ts
│   ├── use-toast.ts
│   ├── use-coverage.ts
│   └── [custom hooks]
│
├── 📦 types/                        # TypeScript Definitions
│   ├── database.types.ts           # Supabase types
│   ├── api.types.ts
│   ├── zoho.types.ts
│   └── [type definitions]
│
├── 📧 emails/                       # Email Templates
│   ├── order-confirmation.tsx
│   ├── kyc-notification.tsx
│   └── [email templates]
│
├── 📚 docs/                         # Documentation
│   ├── architecture/               # Architecture Documentation
│   │   ├── AUTHENTICATION_SYSTEM.md
│   │   ├── ADMIN_SUPABASE_ZOHO_INTEGRATION.md
│   │   └── [architecture docs]
│   ├── features/                   # Feature Specifications
│   │   └── Master - Circle Tel App Features.md
│   ├── products/                   # Product Documentation
│   │   ├── 01_ACTIVE_PRODUCTS/
│   │   └── active/
│   ├── admin/                      # Admin Guides
│   │   └── PRODUCT_CATALOGUE_ZOHO_INTEGRATION_PLAN.md
│   ├── competitors/                # Competitor Analysis
│   ├── resources/                  # Resources
│   ├── legal/                      # Legal Documents
│   └── PROJECT_OVERVIEW.md         # This document
│
├── 🤖 agent-os/                     # Claude Code Agent Specs
│   └── specs/                      # Implementation Specifications
│       ├── 20251101-b2b-quote-to-contract-kyc/  # 64% complete
│       └── 2025-11-01-customer-dashboard-production/  # Ready
│
├── 🎨 .claude/                      # Claude Code Configuration
│   ├── skills/                     # 7 Custom Skills
│   │   ├── context-manager/       # Token optimization
│   │   ├── sql-assistant/         # Natural language SQL
│   │   ├── deployment-check/      # Pre-deploy validation
│   │   ├── coverage-check/        # Coverage testing
│   │   ├── product-import/        # Excel import
│   │   ├── admin-setup/           # RBAC configuration
│   │   └── supabase-fetch/        # Database queries
│   └── CLAUDE.md                   # Project instructions
│
├── 🔧 scripts/                      # Utility Scripts
│   ├── zoho-*.ts                   # Zoho sync scripts
│   ├── test-*.js                   # Testing scripts
│   ├── check-*.js                  # Validation scripts
│   ├── workflow-*.ps1              # PowerShell workflows
│   └── optimize-*.ps1              # Optimization scripts
│
├── 🧪 tests/                        # Test Suites
│   └── e2e/                        # End-to-End Tests
│       └── quote-request-flow.spec.ts
│
├── 🏭 integrations/                 # External Integrations
├── 📊 services/                     # Business Services
├── 🎬 slices/                       # CMS Slices (Prismic)
├── 🎨 sanity-studio/                # Sanity CMS Studio
├── 📦 strapi-cms/                   # Strapi CMS (legacy)
├── 📋 strapi-schemas/               # Strapi Schemas
│
├── 🖼️ public/                       # Static Assets
│   ├── images/                     # Images
│   ├── icons/                      # Icons & favicons
│   ├── fonts/                      # Web fonts
│   └── manifest.json               # PWA manifest
│
├── 📸 screenshots/                  # Test Screenshots
├── 📊 test-results/                 # Test Results
├── 📈 playwright-report/            # Playwright Reports
├── 🗂️ test-output/                  # Test Output
│
├── ⚙️ Configuration Files
│   ├── next.config.js              # Next.js configuration
│   ├── tailwind.config.ts          # Tailwind CSS config
│   ├── tsconfig.json               # TypeScript config
│   ├── vercel.json                 # Vercel deployment config
│   ├── .env.example                # Environment variables template
│   ├── .env.local                  # Local environment (gitignored)
│   ├── .eslintrc.json              # ESLint config
│   ├── postcss.config.js           # PostCSS config
│   ├── package.json                # NPM dependencies
│   ├── package-lock.json           # Dependency lock file
│   └── CLAUDE.md                   # Claude Code instructions
│
└── 📁 Special Directories
    ├── .next/                      # Next.js build output
    ├── node_modules/               # NPM packages
    ├── .vercel/                    # Vercel deployment data
    ├── .github/                    # GitHub Actions workflows
    ├── .vscode/                    # VS Code settings
    ├── .cache/                     # Build cache
    ├── .backup/                    # Backup files
    └── .factory/                   # Factory patterns (future)
```

---

## 🗄️ **Database Architecture**

### **Database Provider**
- **PostgreSQL** via Supabase
- **Project ID**: `agyjovdugmtopasyvlng`
- **Security**: Row Level Security (RLS) policies on all tables
- **Migrations**: Version-controlled SQL migrations

### **Core Tables** (80+ total)

#### **Products & Catalog**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `service_packages` | ISP product catalog | `id`, `name`, `type`, `provider`, `speed_down`, `speed_up`, `price_monthly` |
| `package_pricing` | Pricing variations | `package_id`, `contract_period`, `price`, `setup_fee` |
| `product_categories` | Category taxonomy | `id`, `name`, `parent_id` |
| `product_features` | Feature definitions | `package_id`, `feature_name`, `feature_value` |

#### **Coverage & Lead Capture**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `coverage_leads` | Coverage check results | `id`, `address`, `lat`, `lng`, `providers_available` |
| `mtn_wms_coverage` | MTN wholesale coverage data | `address`, `technology`, `bandwidth`, `availability` |
| `coverage_cache` | Coverage API cache | `location_hash`, `provider`, `result`, `cached_at` |

#### **Orders & Sales**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `consumer_orders` | Customer orders | `order_id` (ORD-YYYYMMDD-NNNN), `customer_id`, `status`, `total_amount` |
| `order_items` | Order line items | `order_id`, `package_id`, `quantity`, `price` |
| `order_drafts` | Incomplete orders | `lead_id`, `draft_data`, `expires_at` |

#### **Customers & Accounts**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `customers` | Customer accounts | `id`, `email`, `account_number` (CT-YYYY-NNNNN), `status` |
| `customer_services` | Active services | `customer_id`, `package_id`, `status`, `activation_date` |
| `customer_billing` | Billing information | `customer_id`, `billing_day`, `payment_method` |
| `customer_invoices` | Invoice records | `invoice_number` (INV-YYYY-NNNNN), `customer_id`, `amount`, `status` |
| `usage_history` | Usage tracking | `service_id`, `usage_date`, `data_used`, `cost` |

#### **B2B Quotes & Contracts**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `business_quotes` | B2B quotations | `quote_id` (QTE-YYYY-NNNN), `company_name`, `status`, `total_amount` |
| `quote_items` | Quote line items | `quote_id`, `package_id`, `quantity`, `monthly_cost` |
| `contracts` | Legal agreements | `contract_number` (CT-YYYY-NNN), `quote_id`, `status`, `signed_at` |
| `contract_documents` | Contract PDFs | `contract_id`, `document_url`, `version` |

#### **KYC & Identity Verification**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `kyc_sessions` | KYC verification sessions | `session_id`, `quote_id`, `provider` (Didit), `status`, `risk_score` |
| `kyc_documents` | Uploaded KYC documents | `session_id`, `document_type`, `file_url`, `verified` |
| `kyc_verifications` | Verification results | `session_id`, `verification_type`, `result`, `timestamp` |

#### **Partners**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `partners` | Partner accounts | `partner_id` (CTPL-YYYY-NNNN), `company_name`, `status` |
| `partner_compliance_documents` | FICA/CIPC documents (13 types) | `partner_id`, `document_category`, `file_url`, `status`, `verified_at` |
| `partner_sales` | Partner sales tracking | `partner_id`, `order_id`, `commission_amount` |

#### **Payments & Transactions**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `payment_consents` | NetCash payment consents | `consent_id`, `customer_id`, `consent_token`, `status` |
| `payment_transactions` | Payment records | `transaction_id`, `order_id`, `amount`, `status`, `gateway_response` |
| `payment_methods` | Saved payment methods | `customer_id`, `method_type`, `token`, `is_default` |
| `refunds` | Refund records | `transaction_id`, `refund_amount`, `reason`, `status` |

#### **Invoices & Billing**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `invoices` | Invoice records | `invoice_number` (INV-YYYY-NNNNN), `customer_id`, `amount_due`, `status` |
| `invoice_line_items` | Invoice line items | `invoice_id`, `description`, `amount`, `tax_amount` |
| `billing_cycles` | Billing cycle tracking | `customer_id`, `cycle_start`, `cycle_end`, `amount` |

#### **Admin & RBAC**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `admin_users` | Admin accounts | `id`, `email`, `role_id`, `status` |
| `admin_roles` | Role definitions (17 roles) | `role_id`, `role_name`, `description` |
| `admin_permissions` | Permission definitions (100+) | `permission_id`, `permission_name`, `resource` |
| `admin_role_permissions` | Role-permission mapping | `role_id`, `permission_id` |
| `admin_audit_logs` | Audit trail | `admin_id`, `action`, `resource`, `timestamp` |

#### **Zoho Integration & Sync**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `zoho_customers` | Zoho CRM customer mapping | `supabase_customer_id`, `zoho_contact_id`, `sync_status` |
| `zoho_subscriptions` | Zoho Billing subscriptions | `supabase_service_id`, `zoho_subscription_id`, `status` |
| `zoho_invoices` | Zoho invoice mapping | `supabase_invoice_id`, `zoho_invoice_id`, `sync_status` |
| `zoho_sync_logs` | Sync operation logs | `operation_type`, `record_id`, `status`, `error_message`, `timestamp` |
| `zoho_sync_queue` | Async sync queue | `record_type`, `record_id`, `operation`, `priority`, `retry_count` |

#### **Compliance & RICA**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `rica_submissions` | ICASA RICA submissions | `submission_id`, `customer_id`, `status`, `submitted_at` |
| `rica_documents` | RICA documents | `submission_id`, `document_type`, `file_url` |

#### **Webhooks & Integrations**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `webhook_logs` | Webhook audit trail | `webhook_source`, `event_type`, `payload`, `status`, `timestamp` |
| `integration_health` | Integration monitoring | `integration_name`, `status`, `last_check`, `error_count` |
| `api_rate_limits` | Rate limiting tracking | `api_key`, `endpoint`, `request_count`, `reset_at` |

#### **Notifications**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `email_queue` | Outbound email queue | `recipient`, `template`, `variables`, `status`, `sent_at` |
| `sms_queue` | Outbound SMS queue | `phone_number`, `message`, `status`, `sent_at` |
| `notification_preferences` | User notification settings | `user_id`, `email_enabled`, `sms_enabled`, `channels` |

#### **Support & Tickets**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `support_tickets` | Support tickets | `ticket_id`, `customer_id`, `subject`, `status`, `priority` |
| `ticket_messages` | Ticket conversation | `ticket_id`, `user_id`, `message`, `timestamp` |

#### **Analytics & Reporting**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `admin_metrics` | Admin analytics | `metric_name`, `metric_value`, `timestamp` |
| `customer_activity` | Customer activity logs | `customer_id`, `activity_type`, `metadata`, `timestamp` |

---

## 🔐 **Authentication & Authorization Architecture**

### **Three-Context Authentication System**

#### **1. Consumer Authentication**
- **Target**: Customer portal (`/dashboard`)
- **Auth Method**: JWT tokens in httpOnly cookies
- **Database Access**: RLS-protected queries with anon key
- **Provider**: `CustomerAuthProvider`
- **Pattern**: Excludes `/admin` and `/partner` routes
- **Session Duration**: 7 days
- **Features**:
  - Email/password login
  - Magic link login
  - OAuth providers (Google, Facebook)
  - Password reset flow
  - Email verification

#### **2. Partner Authentication**
- **Target**: Partner portal (`/partner`)
- **Auth Method**: Same as consumer + compliance checks
- **Additional Requirements**: FICA/CIPC document verification (13 categories)
- **Storage**: Supabase Storage (`partner-compliance-documents`)
- **File Limits**: 20MB per file, PDF/JPG/PNG/ZIP
- **Document Categories**:
  1. Company Registration (CIPC)
  2. Tax Clearance Certificate
  3. VAT Certificate
  4. Bank Confirmation Letter
  5. Director/Member IDs
  6. Proof of Address
  7. FICA Compliance Certificate
  8. BEE Certificate
  9. Company Profile
  10. Financial Statements
  11. Board Resolution
  12. Power of Attorney
  13. Other Supporting Documents

#### **3. Admin Authentication**
- **Target**: Admin portal (`/admin`)
- **Auth Method**: Email/password with RBAC
- **Database Access**: Service role (bypasses RLS)
- **Authorization Pattern**: Check BOTH Authorization header AND cookies
- **RBAC System**:
  - **17 Roles**: Super Admin, Admin, Manager, Sales Agent, Support Agent, Finance, Operations, etc.
  - **100+ Permissions**: Granular resource-based permissions
  - **Hierarchical**: Roles can inherit permissions
- **Audit Logging**: All admin actions logged to `admin_audit_logs`

### **Authorization Header Pattern (Fixes 401 Errors)**
```typescript
// Server-side API routes
const authHeader = request.headers.get('authorization')
if (authHeader?.startsWith('Bearer ')) {
  // Use token from header
  const token = authHeader.split(' ')[1]
  const { data: user } = await supabase.auth.getUser(token)
} else {
  // Fall back to cookie-based session
  const session = await createClientWithSession()
}
```

### **RLS (Row Level Security) Policies**
- **Consumer Tables**: User can only access their own records
- **Partner Tables**: Partner can only access their own data
- **Admin Tables**: No RLS (accessed via service role)
- **Public Tables**: Read-only access for unauthenticated users

---

## 🚀 **Key Business Workflows**

### **1. Consumer Order Flow (3 Stages)**

**Stage 1: Coverage Check**
1. User enters address in coverage checker
2. System queries 4-layer fallback:
   - MTN WMS API (primary)
   - MTN Consumer API (fallback 1)
   - Provider APIs (fallback 2)
   - Mock data (fallback 3)
3. Coverage result cached to `coverage_cache`
4. Lead created in `coverage_leads`

**Stage 2: Package Selection**
1. Display available packages for coverage area
2. User selects package & contract term
3. Calculate pricing with setup fees
4. Store selection in `order_drafts`

**Stage 3: Account Creation & Payment**
1. User creates account or logs in
2. Complete order details
3. Select payment method (NetCash Pay Now)
4. Process payment
5. Create record in `consumer_orders`
6. Send order confirmation email
7. Trigger fulfillment workflow

### **2. B2B Quote-to-Contract Workflow (7 Stages, 64% Complete)**

**Stage 1: Quote Request**
- Business submits quote request via `/business/quote`
- Quote created in `business_quotes` table
- Quote ID generated (QTE-YYYY-NNNN)
- Sales notification sent to `SALES_TEAM_EMAIL`

**Stage 2: KYC Verification (Didit)**
- KYC session initiated via Didit API
- Customer verifies identity via Didit portal
- Results stored in `kyc_sessions` table
- Risk scoring applied (Low/Medium/High)
- Auto-approval for low-risk (<70 score)
- Manual review for medium-risk (40-70)
- Auto-decline for high-risk (>40)

**Stage 3: Contract Generation**
- Contract auto-generated from quote
- Contract number assigned (CT-YYYY-NNN)
- PDF generated with jsPDF
- Stored in Supabase Storage

**Stage 4: E-Signature (Zoho Sign)**
- Contract sent for signature via Zoho Sign API
- Customer receives signature request email
- Signed contract stored back to Supabase
- Status updated to 'signed'

**Stage 5: Invoice Generation**
- Invoice created in `invoices` table
- Invoice number assigned (INV-YYYY-NNNNN)
- Line items added to `invoice_line_items`
- VAT calculated (15% South Africa rate)
- Invoice PDF generated
- Invoice email sent to customer

**Stage 6: Payment Processing**
- Customer receives payment link
- Payment via NetCash Pay Now
- Payment confirmation via webhook
- Invoice status updated to 'paid'

**Stage 7: RICA & Activation**
- RICA submission to ICASA (in progress)
- Service activation
- Account number generated (ACC-YYYY-NNNNN)
- Credentials created
- Welcome email sent
- Service goes live

**Current Status**: Stages 1-6 complete (64%), Stage 7 in development

### **3. Coverage System (4-Layer Fallback Architecture)**

```
Layer 1: MTN WMS API (Primary)
         ↓ (if fails or no coverage)
Layer 2: MTN Consumer API (Fallback 1)
         ↓ (if fails or no coverage)
Layer 3: Provider APIs (Fallback 2)
         - Afrihost API
         - WebAfrica API
         - Vumatel API
         - Frogfoot API
         ↓ (if all fail)
Layer 4: Mock Data (Development/Demo)
```

**Coverage Types**:
- Fibre (FTTB/FTTH)
- Fixed Wireless (LTE/5G)
- ADSL (legacy)
- Wireless Broadband

**Anti-Bot Protection** (MTN APIs):
```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.mtn.co.za/',
  'Origin': 'https://www.mtn.co.za'
}
```

### **4. Payment Processing (NetCash Pay Now)**

**Supported Payment Methods** (20+):
- Credit Cards (Visa, Mastercard, Amex)
- Debit Cards
- Instant EFT (Bank transfer)
- EFT Pro
- SnapScan
- Zapper
- Mobicred (Buy now, pay later)
- SCode
- Masterpass
- Samsung Pay
- Apple Pay
- Google Pay
- And 8 more...

**Payment Flow**:
1. User selects payment method
2. Frontend collects payment details via inline form
3. Payment submitted to NetCash PCI Vault (tokenized)
4. Payment processed via NetCash gateway
5. Webhook received at `/api/webhooks/netcash`
6. HMAC-SHA256 signature verified
7. Order status updated
8. Confirmation email sent

**Webhook Verification**:
```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

### **5. Admin-Zoho Sync Architecture**

**Philosophy**: Supabase-first, async sync to Zoho

**Pattern**:
1. User action triggers Supabase record creation
2. Record created immediately in Supabase
3. User receives instant confirmation
4. Background job added to `zoho_sync_queue`
5. Cron job processes sync queue every 30 minutes
6. Record synced to Zoho CRM/Billing
7. Sync status updated in `zoho_sync_logs`
8. Failures retry with exponential backoff

**Sync Entities**:
- Customers → Zoho CRM Contacts
- Orders → Zoho CRM Deals
- Services → Zoho Billing Subscriptions
- Invoices → Zoho Billing Invoices
- Payments → Zoho Billing Payments

**Conflict Resolution**:
- Supabase is source of truth
- Zoho updates sync back via webhooks
- Last-write-wins for conflicts
- Manual resolution for critical conflicts

---

## 📊 **API Routes (37+ Endpoints)**

### **Admin APIs** (`/api/admin/*`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/orders` | GET | List all orders | Admin |
| `/api/admin/orders/[id]` | GET | Get order details | Admin |
| `/api/admin/orders/[id]/activate` | POST | Activate order | Admin |
| `/api/admin/quotes` | GET | List B2B quotes | Admin |
| `/api/admin/quotes/[id]` | GET/PUT | Get/update quote | Admin |
| `/api/admin/users` | GET/POST | Manage admin users | Super Admin |
| `/api/admin/products` | GET/POST/PUT | Manage products | Admin |
| `/api/admin/partners` | GET | List partners | Admin |
| `/api/admin/payments/settings` | GET/PUT | Payment gateway settings | Super Admin |
| `/api/admin/integrations` | GET | Integration status | Admin |
| `/api/admin/price-changes` | GET/POST | Price change management | Admin |
| `/api/admin/webhooks` | GET/POST | Webhook configuration | Admin |

### **Coverage APIs** (`/api/coverage/*`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/coverage/lead` | POST | Create coverage lead | Public |
| `/api/coverage/check` | POST | Check address coverage | Public |
| `/api/coverage/packages` | GET | Get available packages | Public |

### **Order APIs** (`/api/orders/*`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/orders/create` | POST | Create new order | Customer |
| `/api/orders/[id]` | GET | Get order details | Customer |
| `/api/orders/[id]/activate` | POST | Activate service | Admin |
| `/api/orders/[id]/cancel` | POST | Cancel order | Customer/Admin |
| `/api/order-drafts` | GET/POST | Manage order drafts | Customer |

### **Quote APIs** (`/api/quotes/*`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/quotes/business/list` | GET | List B2B quotes | Admin |
| `/api/quotes/business/[id]` | GET/PUT | Get/update quote | Customer/Admin |
| `/api/quotes/business/[id]/email` | POST | Email quote to customer | Admin |
| `/api/quotes/business/create` | POST | Create new quote | Public |

### **Payment APIs** (`/api/payments/*`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/payment/consent` | POST | Create payment consent | Customer |
| `/api/payment/process` | POST | Process payment | Customer |
| `/api/payment/verify` | GET | Verify payment status | Customer |
| `/api/payments/methods` | GET | List saved methods | Customer |
| `/api/payments/methods/[id]` | DELETE | Delete payment method | Customer |
| `/api/payments/settings` | GET/PUT | Payment settings (admin) | Super Admin |

### **Webhook APIs** (`/api/webhooks/*`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/webhooks/netcash` | POST | NetCash payment webhooks | HMAC |
| `/api/webhooks/didit` | POST | Didit KYC webhooks | HMAC |
| `/api/webhooks/zoho-sign` | POST | Zoho Sign webhooks | HMAC |
| `/api/webhooks/zoho-crm` | POST | Zoho CRM webhooks | HMAC |

### **Cron Jobs** (`/api/cron/*`)
| Endpoint | Schedule | Description | Timeout |
|----------|----------|-------------|---------|
| `/api/cron/generate-invoices` | 0 0 * * * (daily) | Generate recurring invoices | 300s |
| `/api/cron/expire-deals` | 0 2 * * * (daily) | Expire old deals/quotes | 60s |
| `/api/cron/price-changes` | 0 2 * * * (daily) | Apply price changes | 60s |
| `/api/cron/zoho-sync` | 0 0 * * * (daily) | Sync to Zoho CRM/Billing | 600s |
| `/api/cron/integrations-health-check` | */30 * * * * (every 30 min) | Check integration health | 60s |
| `/api/cron/cleanup-webhook-logs` | 0 3 * * 0 (weekly) | Clean old webhook logs | 60s |

### **Other APIs**
| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | `/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password` | Authentication |
| **Customers** | `/api/customers/profile`, `/api/customers/services` | Customer management |
| **KYC** | `/api/kyc/initiate`, `/api/kyc/status` | KYC verification |
| **Contracts** | `/api/contracts/generate`, `/api/contracts/[id]/sign` | Contract management |
| **Invoices** | `/api/invoices/[id]`, `/api/invoices/[id]/pdf` | Invoice management |
| **Partners** | `/api/partners/register`, `/api/partners/compliance` | Partner portal |
| **Support** | `/api/support/tickets`, `/api/support/tickets/[id]` | Support tickets |

---

## 🎨 **Brand & Design System**

### **Color Palette**

#### **Primary Brand Colors**
```typescript
colors: {
  'circleTel-orange': '#F5831F',        // Primary brand color
  'circleTel-white': '#FFFFFF',         // White
  'circleTel-darkNeutral': '#1F2937',   // Dark text/UI
  'circleTel-secondaryNeutral': '#4B5563', // Secondary text
  'circleTel-lightNeutral': '#E6E9EF',  // Light backgrounds
}
```

#### **Verizon-Inspired Modern Colors**
```typescript
'circleTel-red': '#D52B1E',
'circleTel-red-light': '#EF4444',
'circleTel-red-dark': '#B91C1C',
'circleTel-gray': {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
},
'circleTel-blue': {
  50: '#EFF6FF',
  100: '#DBEAFE',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
}
```

#### **WebAfrica-Inspired Colors** (Adapted)
```typescript
'webafrica-pink': '#E91E63',
'webafrica-pink-light': '#F48FB1',
'webafrica-pink-dark': '#C2185B',
'webafrica-blue': '#1E4B85',          // Package cards (selected state)
'webafrica-blue-light': '#CDD6F4',
'webafrica-blue-lighter': '#E8F0FF',
'webafrica-blue-bg': '#F5F9FF',
'webafrica-blue-dark': '#163a6b',
```

### **Typography**

**Font Families**:
```typescript
fontFamily: {
  'sans': ['var(--font-inter)', 'ui-sans-serif', 'system-ui',
           '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
           'Helvetica', 'Arial', 'sans-serif'],
  'mono': ['var(--font-space-mono)', 'ui-monospace',
           'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
}
```

**Font Weights**:
- 600 (semibold) - Body text emphasis
- 700 (bold) - Headings
- 800 (extrabold) - Hero text, CTAs

### **Animations**

#### **Custom Keyframes**
```typescript
keyframes: {
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' }
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' }
  },
  'fade-in': {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  },
  'scale-in': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' }
  },
  'blob': {
    '0%': { transform: 'translate(0px, 0px) scale(1)' },
    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
    '100%': { transform: 'translate(0px, 0px) scale(1)' }
  },
  'float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' }
  },
  'spin-slow': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  'pulse-glow': {
    '0%, 100%': { boxShadow: '0 0 5px rgba(245, 131, 31, 0.5)' },
    '50%': { boxShadow: '0 0 20px rgba(245, 131, 31, 0.8)' }
  }
}
```

#### **Animation Classes**
```typescript
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
  'fade-in': 'fade-in 0.3s ease-out',
  'scale-in': 'scale-in 0.2s ease-out',
  'blob': 'blob 7s infinite',
  'float': 'float 3s ease-in-out infinite',
  'spin-slow': 'spin-slow 8s linear infinite',
  'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
}
```

### **Component Design Patterns**

#### **Package Cards**
- **Unselected**: Orange gradient (`#F5831F`)
- **Selected**: Dark blue (`#1E4B85`)
- **Shadow**: Color-matched to state
- **Hover**: Scale + shadow animation

#### **Buttons**
- **Primary**: CircleTel Orange
- **Secondary**: Dark Neutral
- **Ghost**: Transparent with orange hover
- **Destructive**: Red for dangerous actions

#### **Forms**
- **Input Fields**: Rounded corners, subtle shadow
- **Focus State**: Orange ring
- **Error State**: Red border + error message
- **Success State**: Green checkmark

---

## ⚙️ **Development Workflow**

### **Essential Commands**

#### **Development**
```bash
# ALWAYS use :memory variants to prevent heap crashes
npm run dev:memory          # Start dev server (8GB heap)
npm run dev:low             # Low memory mode (4GB heap)
```

#### **Type Checking** (MANDATORY before commit)
```bash
npm run type-check          # Standard type check
npm run type-check:memory   # Type check with 4GB heap
```

#### **Building**
```bash
npm run build               # Standard build
npm run build:memory        # Build with 8GB heap
npm run build:ci            # CI build (6GB heap)
npm run analyze             # Build with bundle analyzer
```

#### **Testing**
```bash
npm run test                # Run Jest tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:payment        # Payment integration tests
npm run test:types          # Type definition tests
npm run test:ci             # CI test mode
npm run test:e2e:staging    # E2E tests on staging
npm run test:e2e:prod       # E2E smoke tests on production
```

#### **Zoho Sync Operations**
```bash
npm run zoho:backfill:customers      # Backfill customers to Zoho
npm run zoho:backfill:subscriptions  # Backfill subscriptions
npm run zoho:backfill:invoices       # Backfill invoices
npm run zoho:backfill:payments       # Backfill payments
npm run zoho:backfill                # Backfill all entities
npm run zoho:retry-failed            # Retry failed syncs
npm run zoho:health-check            # Check Zoho integration health
npm run zoho:alert-failed            # Alert on failed syncs
npm run zoho:generate-skus           # Generate missing SKUs
npm run zoho:generate-skus:dry-run   # Dry run SKU generation
npm run zoho:backfill-billing        # Backfill billing data
npm run zoho:backfill-billing:dry-run # Dry run billing backfill
```

#### **Development Environment Optimization**
```bash
npm run memory:check        # Check memory usage
npm run memory:detail       # Detailed memory report
npm run workflow:start      # Morning workflow startup
npm run workflow:start:auto # Auto-cleanup startup
npm run workflow:cleanup    # Cleanup resources
npm run optimize:vscode     # Optimize VS Code settings
npm run optimize:vscode:apply # Apply VS Code optimizations
npm run optimize:windows    # Optimize Windows settings
npm run optimize:browser    # Optimize browser settings
npm run optimize:all        # Optimize entire dev environment
npm run optimize:all:apply  # Apply all optimizations
npm run extensions:analyze  # Analyze VS Code extensions
npm run vscode:force-cleanup # Force cleanup VS Code
```

#### **Utilities**
```bash
npm run clean               # Clean build artifacts
npm run lint                # Run ESLint
npm run predeploy:check     # Pre-deployment checks
npm run statusline:update   # Update TypeScript cache
npm run orchestrate         # Run agent orchestrator
```

### **Git Workflow**

#### **Branch Strategy**
```
feature/xyz → staging → main (production)
```

#### **Deployment Process**
1. **Test in staging first**:
   ```bash
   git push origin feature/xyz:staging
   ```

2. **Verify staging deployment**: https://circletel-staging.vercel.app

3. **Merge to main via PR**:
   ```bash
   gh pr create --base main
   ```

4. **Auto-deploy to production**: https://www.circletel.co.za

#### **Pre-Deploy Checklist**
- ✅ `npm run type-check` passes
- ✅ `npm run build:memory` succeeds
- ✅ Staging tests pass
- ✅ Database migrations applied
- ✅ Environment variables configured

#### **Rollback Procedure**
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find last working deployment
4. Click "Promote to Production"
5. Rollback completes in <2 minutes

---

## 🔧 **Critical Configuration**

### **Next.js Configuration** (`next.config.js`)

**Key Features**:
- PWA support (disabled in development)
- Service worker with caching strategies
- Webpack optimization for Google Maps
- Image domains: Supabase, Afrihost, Canva
- ESLint/TypeScript build error tolerance (production)

**Cache Strategies**:
- Google Fonts: CacheFirst (365 days)
- Images: StaleWhileRevalidate (24 hours)
- JS/CSS: StaleWhileRevalidate (24 hours)
- Supabase API: NetworkFirst (1 hour, 10s timeout)

### **TypeScript Configuration** (`tsconfig.json`)

**Compiler Options**:
- Strict mode enabled
- Target: ES2020
- Module: ESNext (bundler resolution)
- Path aliases: `@/*` → `./*`
- Incremental compilation
- Next.js plugin enabled

### **Vercel Configuration** (`vercel.json`)

**Function Timeouts**:
- Admin quotes pages: 60s, 1024MB
- Business quotes: 60s, 1024MB
- Coverage lead: 15s, 512MB
- Zoho sync: 600s (10 min), 1024MB
- Default: 10s, 256MB

**Cron Jobs**: 6 scheduled tasks (see API Routes section)

### **Environment Variables** (`.env.example`)

**Total**: 150+ environment variables documented

**Categories**:
- Supabase (8 variables)
- Google Maps (3 variables)
- NetCash Payment Gateway (6 variables)
- Zoho CRM/Billing (8 variables)
- Didit KYC (4 variables)
- Zoho Sign (4 variables)
- ICASA RICA (4 variables)
- Resend Email (2 variables)
- Admin Notifications (7 variables)
- Strapi CMS (2 variables)
- Feature Flags (7 variables)
- And 90+ more...

---

## 📈 **Project Metrics**

### **Codebase Statistics**
- **Total Lines of Code**: ~150,000+ (TypeScript/React/SQL)
- **Database Tables**: 80+ tables
- **API Endpoints**: 37+ routes
- **React Components**: 500+ components
- **Database Migrations**: 100+ migration files
- **Environment Variables**: 150+ variables
- **Production Dependencies**: 60+ packages
- **Dev Dependencies**: 20+ tools
- **Custom Hooks**: 30+ hooks
- **Context Providers**: 10+ contexts
- **Type Definitions**: 50+ type files
- **Email Templates**: 20+ templates
- **Test Suites**: 50+ test files

### **Performance Metrics** (Targets)
- **Lighthouse Score**: 90+ (all categories)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **API Response Time**: <500ms (p95)
- **Database Query Time**: <100ms (p95)

### **Business Metrics**
- **Active Products**: 50+ ISP packages
- **Coverage Providers**: 10+ ISPs
- **Payment Methods**: 20+ methods
- **Admin Roles**: 17 roles
- **Admin Permissions**: 100+ permissions
- **Document Categories**: 13 compliance categories
- **KYC Providers**: 1 (Didit)
- **Email Templates**: 20+ templates
- **Webhook Integrations**: 4 providers

---

## 🎯 **Current Development Status (January 2025)**

### **Active Projects**

#### **1. B2B Quote-to-Contract KYC Workflow**
- **Status**: In Progress
- **Completion**: 64% (61 points completed)
- **Location**: `agent-os/specs/20251101-b2b-quote-to-contract-kyc/`
- **Timeline**: 4 weeks estimated
- **Completed Sprints**:
  - ✅ Sprint 1: KYC Foundation (20 points) - 100%
  - 🔄 Sprint 2: Contracts & CRM (8/16 points) - 50%
  - 🔄 Sprint 3: Invoicing (3/13 points) - 23%
- **Remaining Work**:
  - RICA auto-submission integration
  - Service activation automation
  - Email notification templates
  - Admin workflow refinements

#### **2. Customer Dashboard Production Readiness**
- **Status**: Ready for Implementation
- **Completion**: 0% (147 points total)
- **Location**: `agent-os/specs/2025-11-01-customer-dashboard-production/`
- **Timeline**: 4 weeks estimated
- **Scope**:
  - 10 database tables
  - Account number system (CT-YYYY-NNNNN)
  - Billing automation
  - NetCash eMandate integration
  - Interstellio API (service provisioning)
  - Clickatell SMS notifications
- **Blocked**: Awaiting B2B workflow completion

### **Completed Projects**

#### **1. Admin Orders Management** ✅
- **Status**: Complete (100%)
- **Features**:
  - Orders list page (`/admin/orders`)
  - Order detail page (`/admin/orders/[id]`)
  - 8-section responsive layout
  - Real-time stats
  - Advanced search & filters
  - CSV export
  - Bulk actions

#### **2. Partner Portal** ✅
- **Status**: Complete (100%)
- **Features**:
  - Partner registration flow
  - 13 FICA/CIPC document upload categories
  - Supabase Storage integration with RLS
  - Document verification workflow
  - Partner dashboard
  - E2E tests: 7/7 passing

#### **3. Consumer Dashboard Enhancement** ✅
- **Status**: Complete (100%)
- **Features**:
  - Service management dropdown (1-click navigation)
  - 66% navigation reduction
  - Usage tracking
  - Upgrade/downgrade flows
  - Supersonic-inspired UX

#### **4. Payment System Enhancement** ✅
- **Status**: Complete (100%)
- **Features**:
  - NetCash Pay Now integration (20+ methods)
  - Inline payment form with Framer Motion
  - PCI-compliant tokenization
  - HMAC-SHA256 webhook verification
  - Demo page (`/order/payment/demo`)

---

## 🛡️ **Security Features**

### **Authentication Security**
- JWT tokens with httpOnly cookies (XSS prevention)
- CSRF protection via SameSite cookies
- Session expiration (7 days)
- Refresh token rotation
- Password hashing (bcrypt)
- Email verification required
- Password reset with time-limited tokens

### **Authorization Security**
- Row Level Security (RLS) on all consumer/partner tables
- Service role isolation for admin operations
- Granular RBAC (100+ permissions)
- Admin action audit logging
- IP-based rate limiting
- Request throttling per API key

### **Data Security**
- HTTPS everywhere (TLS 1.3)
- Database encryption at rest
- Encrypted file uploads (AES-256)
- PCI-compliant payment tokenization
- HMAC-SHA256 webhook verification
- Secure environment variable handling

### **Application Security**
- SQL injection prevention (parameterized queries)
- XSS protection (React escaping + CSP headers)
- CSRF protection (token-based)
- Input validation (Zod schemas)
- Output sanitization
- Clickjacking prevention (X-Frame-Options)
- Content Security Policy (CSP)

### **Compliance & Privacy**
- POPIA compliance (South African data protection)
- GDPR-ready (data export, right to deletion)
- FICA/CIPC document encryption
- RICA telecom compliance
- Audit trail for all sensitive operations
- Data retention policies
- Privacy policy enforcement

### **Monitoring & Alerting**
- Integration health monitoring (every 30 min)
- Failed webhook alert system
- Admin action audit logs
- Error tracking (Vercel Analytics)
- Performance monitoring
- Security incident logging

---

## 📚 **Documentation Structure**

### **Technical Documentation**
| Location | Content | Status |
|----------|---------|--------|
| `docs/architecture/AUTHENTICATION_SYSTEM.md` | Three-context auth architecture | Current |
| `docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md` | Zoho sync architecture | Current |
| `docs/PROJECT_OVERVIEW.md` | This document | Current |
| `CLAUDE.md` | Project conventions (5.5k tokens) | Current v5.5 |

### **Feature Specifications**
| Location | Content | Status |
|----------|---------|--------|
| `agent-os/specs/20251101-b2b-quote-to-contract-kyc/` | B2B workflow spec | 64% complete |
| `agent-os/specs/2025-11-01-customer-dashboard-production/` | Customer dashboard spec | Ready |
| `docs/features/Master - Circle Tel App Features.md` | Feature master list | Current |

### **Product Documentation**
| Location | Content | Status |
|----------|---------|--------|
| `docs/products/01_ACTIVE_PRODUCTS/` | Active product catalog | Current |
| `docs/products/active/MTN Deals/` | MTN special offers | Current |
| `docs/admin/PRODUCT_CATALOGUE_ZOHO_INTEGRATION_PLAN.md` | Product sync plan | Current |

### **API Documentation**
- Inline JSDoc comments in all API routes
- Type definitions in `types/` directory
- Supabase database types auto-generated

### **Database Documentation**
- Schema documented in migration files
- `supabase/migrations/` directory
- RLS policies documented inline
- Table relationships documented

---

## 🔄 **Integration Health**

### **Active Integrations**
| Integration | Status | Monitoring | Last Sync |
|-------------|--------|------------|-----------|
| Supabase | ✅ Active | Real-time | N/A |
| NetCash Pay Now | ✅ Active | Webhooks | Real-time |
| Zoho CRM | ✅ Active | Cron (30 min) | Daily |
| Zoho Billing | ✅ Active | Cron (30 min) | Daily |
| Zoho Sign | ✅ Active | Webhooks | On-demand |
| Didit KYC | ✅ Active | Webhooks | On-demand |
| Google Maps | ✅ Active | Real-time | N/A |
| Resend Email | ✅ Active | Real-time | N/A |

### **Planned Integrations**
| Integration | Purpose | Timeline |
|-------------|---------|----------|
| ICASA RICA | RICA compliance automation | Q1 2025 |
| Interstellio | Service provisioning | Q1 2025 |
| Clickatell | SMS notifications | Q1 2025 |
| NetCash eMandate | Recurring payments | Q1 2025 |

---

## 🚨 **Known Issues & Limitations**

### **Technical Debt**
1. **Memory Usage**: Requires `:memory` scripts to prevent heap crashes (addressed via optimization)
2. **Strapi CMS**: Legacy CMS being phased out in favor of Sanity
3. **Type Errors**: Some build errors ignored for production builds (to be addressed)
4. **ESLint Warnings**: Some linting errors ignored during builds (to be addressed)

### **Feature Gaps**
1. **RICA Auto-Submission**: Manual process, automation in progress
2. **Customer Dashboard**: Production-ready features pending (147 points)
3. **Interstellio Integration**: Service provisioning not yet automated
4. **SMS Notifications**: Email-only currently, SMS pending

### **Performance Considerations**
1. **Large Bundle Size**: Optimize with lazy loading and code splitting
2. **Database Query Performance**: Add indexes for frequent queries
3. **Image Optimization**: Implement Sharp for better compression
4. **PWA Offline Support**: Limited offline functionality

---

## 🎓 **Getting Started (New Developers)**

### **Prerequisites**
- Node.js 18+ (recommended: 20 LTS)
- npm 9+
- Git
- VS Code (recommended)
- Supabase CLI
- Vercel CLI (optional)

### **Initial Setup**

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-org/circletel-nextjs.git
   cd circletel-nextjs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run database migrations**:
   ```bash
   npx supabase db push
   ```

5. **Start development server**:
   ```bash
   npm run dev:memory
   ```

6. **Open browser**: http://localhost:3000

### **First Session Checklist**

1. ✅ Run `npm run type-check` to verify compilation
2. ✅ Read `CLAUDE.md` for project conventions
3. ✅ Review `docs/architecture/` for system design
4. ✅ Check `docs/RECENT_CHANGES.md` for latest updates
5. ✅ Explore codebase structure (see Project Structure section)
6. ✅ Run tests: `npm run test`
7. ✅ Try example workflow (e.g., coverage check)

### **Development Best Practices**

#### **Progressive Loading Pattern**
✅ **CORRECT**: Load specific files → Show specific lines → Make targeted changes
```bash
# Load single file
Read: app/admin/layout.tsx

# Show specific section
Lines 50-100

# Update specific line
Edit: Line 75
```

❌ **WRONG**: Load entire directories → Show everything
```bash
# Don't do this
Read: app/admin/**/*
```

#### **Type Checking Before Commit** (MANDATORY)
```bash
npm run type-check:memory
```

#### **Testing Before Push**
```bash
npm run test
npm run test:e2e:staging
```

#### **Memory Management**
Always use `:memory` variants for development:
```bash
npm run dev:memory
npm run type-check:memory
npm run build:memory
```

---

## 🤝 **Contributing**

### **Code Style**
- **TypeScript**: Strict mode, explicit types
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes (no inline styles)
- **File Naming**:
  - Components: PascalCase (e.g., `OrderCard.tsx`)
  - Hooks: kebab-case with `use-` prefix (e.g., `use-auth.ts`)
  - Services: kebab-case with `-service` suffix (e.g., `payment-service.ts`)
  - Docs: SCREAMING_SNAKE_CASE (e.g., `AUTHENTICATION_SYSTEM.md`)

### **Commit Messages**
Follow conventional commits:
```
feat: Add NetCash webhook verification
fix: Resolve 401 error in admin dashboard
docs: Update API documentation
refactor: Simplify coverage aggregation logic
test: Add E2E tests for partner registration
chore: Update dependencies
```

### **Pull Request Process**
1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run type-check:memory`
4. Push to staging for testing
5. Create PR with description
6. Request review from team
7. Address feedback
8. Merge after approval

---

## 📞 **Support & Contact**

### **Internal Team**
- **Development Team**: Available in Slack #development
- **DevOps**: Available in Slack #devops
- **Product Team**: Available in Slack #product

### **External Resources**
- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
- **NetCash Support**: https://netcash.co.za/support
- **Zoho Support**: https://www.zoho.com/support/

### **Documentation Links**
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Radix UI Docs**: https://www.radix-ui.com/docs

---

## 🏆 **Acknowledgments**

This project utilizes:
- **Next.js 15** by Vercel
- **Supabase** for backend infrastructure
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **Framer Motion** for animations
- And 60+ other amazing open-source packages

---

## 📄 **License**

Proprietary - CircleTel (Pty) Ltd. All rights reserved.

---

**End of Document**

---

*This document serves as the comprehensive source of truth for the CircleTel project architecture, technology stack, and development workflows. Keep it updated as the project evolves.*

*For questions or updates to this document, contact the Development Team or Claude Code.*
