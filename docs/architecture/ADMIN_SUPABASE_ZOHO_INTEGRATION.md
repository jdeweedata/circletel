---
type: architecture
domain: [admin, integrations]
tags: [supabase, zoho, crm, billing, sync, async, audit]
status: current
last_updated: 2025-11-16
dependencies: [SYSTEM_OVERVIEW.md, AUTHENTICATION_SYSTEM.md]
priority: high
description: Supabase-first architecture with async Zoho CRM/Billing sync
---

# Admin-Supabase-Zoho Integration Architecture

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Status**: Production
**Owner**: Development Team

---

## Executive Summary

CircleTel uses a **Supabase-first architecture** where all admin workflows write to PostgreSQL as the single source of truth, then asynchronously sync to Zoho CRM and Zoho Billing for external business intelligence and billing automation.

**Key Architectural Principles**:
- ✅ **Supabase is Source of Truth** - All business data lives in PostgreSQL
- ✅ **Admin UI with RBAC** - 100+ granular permissions, 17 role templates
- ✅ **Async Zoho Sync** - Best-effort integration with retry logic
- ✅ **Resilient Design** - CircleTel operates even if Zoho is down
- ✅ **Comprehensive Audit Trail** - All syncs logged for debugging

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Database Schema](#database-schema)
4. [RBAC Permission System](#rbac-permission-system)
5. [Zoho CRM Integration](#zoho-crm-integration)
6. [Zoho Billing Integration](#zoho-billing-integration)
7. [Key Admin Workflows](#key-admin-workflows)
8. [Authentication & Authorization](#authentication--authorization)
9. [Sync System Design](#sync-system-design)
10. [Integration Monitoring](#integration-monitoring)
11. [Code References](#code-references)
12. [Architectural Decisions](#architectural-decisions)

---

## Architecture Overview

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN INTERFACE                          │
│  (Next.js 15 Pages - /app/admin/*)                             │
│  - Products Management                                          │
│  - Quote Generation                                             │
│  - Order Management                                             │
│  - Customer Management                                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ (1) Admin submits data via UI
                 │     - RBAC permission check
                 │     - Form validation
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTES (RBAC Protected)                  │
│  (/app/api/admin/*)                                             │
│  - Authentication via cookies + SSR                             │
│  - Permission checks via usePermissions hook                    │
│  - Service role Supabase client (bypasses RLS)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ (2) Write to Supabase (source of truth)
                 │     - INSERT/UPDATE/DELETE operations
                 │     - Transaction guarantees
                 │     ✅ ALWAYS SUCCEEDS (or fails fast)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                           │
│  Primary Tables:                                                │
│  - business_quotes (B2B quotes)                                 │
│  - service_packages (runtime product catalogue)                 │
│  - admin_products (draft products, approvals)                   │
│  - consumer_orders (B2C orders)                                 │
│  - customers (customer accounts)                                │
│  - contracts (B2B contracts with KYC)                           │
│  - invoices (billing)                                           │
│                                                                 │
│  Integration Tables:                                            │
│  - zoho_entity_mappings (CircleTel ↔ Zoho ID mapping)          │
│  - zoho_sync_logs (audit trail)                                │
│  - product_integrations (product sync status)                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ (3) Async sync (best-effort, with retries)
                 │     - Non-blocking background operation
                 │     - Retry on transient failures
                 │     - Log all attempts
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              ZOHO INTEGRATION LAYER                             │
│  (/lib/integrations/zoho/)                                      │
│                                                                 │
│  ┌─────────────────────┐    ┌────────────────────────┐        │
│  │   Zoho CRM Service  │    │ Zoho Billing Service   │        │
│  │  (crm-service.ts)   │    │ (billing-sync-service) │        │
│  │                     │    │                        │        │
│  │  - Estimates (Quote)│    │  - Plans (Recurring)   │        │
│  │  - Deals (Contract) │    │  - Items (One-time)    │        │
│  │  - Contacts         │    │  - Products            │        │
│  │  - Custom KYC fields│    │  - Subscriptions       │        │
│  └─────────────────────┘    └────────────────────────┘        │
│                                                                 │
│  Sync Orchestrator (sync-service.ts):                          │
│  - Retry logic (3 attempts, exponential backoff)               │
│  - Logging to zoho_sync_logs                                   │
│  - Mapping table updates                                       │
│  - Error handling with graceful degradation                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ (4) External API calls (HTTPS)
                 │     - OAuth 2.0 authentication
                 │     - Auto token refresh
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ZOHO CLOUD SERVICES                          │
│  - Zoho CRM (Quotes, Deals, Contacts, custom KYC fields)       │
│  - Zoho Billing (Plans, Items, Subscriptions, Invoices)        │
│  - OAuth token management (auto-refresh)                       │
│  - US Data Center (zoho.com)                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Architectural Pattern

**Supabase Write ALWAYS Completes First**:

```typescript
// CORRECT PATTERN - Used throughout CircleTel
async function publishProduct(productId: string) {
  // 1. Write to Supabase (blocking, critical path)
  const servicePackage = await supabase
    .from('service_packages')
    .insert(payload)
    .select()
    .single();

  // ✅ Product now exists in CircleTel - customers can order it

  // 2. Sync to Zoho (async, best-effort, non-blocking)
  try {
    await syncToZohoCRM(servicePackage);
    await syncToZohoBilling(servicePackage);
  } catch (error) {
    // Log error but don't fail the operation
    console.error('[Zoho Sync] Failed:', error);
    await logSyncFailure('service_package', servicePackage.id, error);
  }

  // ✅ Return success even if Zoho sync failed
  return { success: true, data: servicePackage };
}
```

---

## Core Components

### 1. Admin Interface Structure

**Location**: `/app/admin/`

| Page | Route | Purpose | Key Features |
|------|-------|---------|--------------|
| Dashboard | `/admin` | Overview & quick actions | 8 stat cards, navigation hub |
| Products | `/admin/products` | Product catalogue management | Grid/list views, filtering, bulk actions |
| Product Approvals | `/admin/products/approvals` | Approve imported products | Review queue, approve/reject workflow |
| Quotes | `/admin/quotes` | B2B quote management | Create, edit, approve quotes |
| Quote Detail | `/admin/quotes/[id]` | Quote editor | Line items, pricing, approval workflow |
| Orders | `/admin/orders` | Order management | View consumer orders, status tracking |
| Order Detail | `/admin/orders/[id]` | Order details | 8 comprehensive sections, export |
| Customers | `/admin/customers` | Customer management | Accounts, services, billing |
| Billing | `/admin/billing` | Invoice management | Generate invoices, payment tracking |
| KYC | `/admin/kyc` | KYC compliance | Didit integration, verification status |

### 2. Admin Navigation (Sidebar)

```typescript
// From /app/admin/layout.tsx
const adminNavigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  {
    label: 'Products',
    icon: Package,
    submenu: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'Product Approvals', href: '/admin/products/approvals', badge: pendingCount },
      { label: 'MTN Deals', href: '/admin/products/mtn-deals' }
    ]
  },
  {
    label: 'Quotes',
    icon: FileText,
    submenu: [
      { label: 'All Quotes', href: '/admin/quotes' },
      { label: 'Pending', href: '/admin/quotes?status=pending_approval' },
      { label: 'Accepted', href: '/admin/quotes?status=accepted' }
    ]
  },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Billing', href: '/admin/billing', icon: CreditCard },
  { label: 'Coverage', href: '/admin/coverage', icon: Map },
  { label: 'CMS', href: '/admin/cms', icon: FileText },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell }
];
```

### 3. API Routes Structure

**Location**: `/app/api/admin/`

| Endpoint | Method | Purpose | RBAC Required |
|----------|--------|---------|---------------|
| `/api/admin/products` | GET | List products with filters | `products:read` |
| `/api/admin/products/[id]` | GET | Get product details | `products:read` |
| `/api/admin/products/[id]/publish` | POST | Publish product to runtime | `products:publish` |
| `/api/admin/product-approvals/[id]/approve` | POST | Approve imported product | `products:approve` |
| `/api/admin/quotes/business` | POST | Create B2B quote | `quotes:create` |
| `/api/admin/quotes/[id]` | PUT | Update quote | `quotes:edit` |
| `/api/admin/quotes/[id]/approve` | POST | Approve quote | `quotes:approve` |
| `/api/admin/orders` | GET | List orders | `orders:read` |
| `/api/admin/orders/[id]` | GET | Get order details | `orders:read` |

---

## Database Schema

### Business Data Tables

#### `admin_products` - Draft Products & Approval Pipeline

Products pending approval before publishing to runtime catalogue.

```sql
CREATE TABLE admin_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Details
  name TEXT NOT NULL,
  sku TEXT,
  service_type TEXT CHECK (service_type IN ('fibre', '5g', 'lte', 'wifi')),
  product_category TEXT,

  -- Pricing
  regular_price DECIMAL(10,2),
  special_price DECIMAL(10,2),
  installation_fee DECIMAL(10,2),

  -- Approval Workflow
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'archived')) DEFAULT 'draft',
  created_by UUID REFERENCES admin_users(id),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Features & Metadata
  features JSONB,
  specifications JSONB,
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_products_status ON admin_products(status);
CREATE INDEX idx_admin_products_created_by ON admin_products(created_by);
```

#### `service_packages` - Runtime Product Catalogue

Published products available to customers (single source of truth).

```sql
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source Reference
  source_admin_product_id UUID REFERENCES admin_products(id),

  -- Product Identity
  name TEXT NOT NULL,
  sku TEXT,
  slug TEXT UNIQUE,

  -- Pricing
  price DECIMAL(10,2),
  pricing JSONB, -- { monthly, setup, download_speed, upload_speed }

  -- Classification
  category TEXT,
  service_type TEXT,
  technology TEXT,
  market_segment TEXT CHECK (market_segment IN ('consumer', 'business', 'enterprise')),

  -- Provider
  provider TEXT,
  fttb_network_provider_id UUID REFERENCES fttb_network_providers(id),

  -- Status
  status TEXT DEFAULT 'active',
  active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Features & Metadata
  features JSONB,
  metadata JSONB, -- { contract_months, hardware, terms_url, etc. }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_service_packages_active ON service_packages(active);
CREATE INDEX idx_service_packages_category ON service_packages(category);
CREATE INDEX idx_service_packages_sku ON service_packages(sku);
CREATE INDEX idx_service_packages_source ON service_packages(source_admin_product_id);
```

#### `business_quotes` - B2B SMME Quotes

Quotes generated for business customers.

```sql
CREATE TABLE business_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quote Identity
  quote_number TEXT UNIQUE, -- Auto-generated: Q-YYYY-NNNN

  -- Customer Details
  company_name TEXT NOT NULL,
  contact_person TEXT,
  customer_email TEXT,
  customer_phone TEXT,

  -- Addresses
  billing_address TEXT,
  installation_address TEXT,

  -- Pricing
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),

  -- Validity
  valid_until DATE,

  -- Status Workflow
  status TEXT CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'sent',
    'accepted', 'rejected', 'expired', 'cancelled'
  )) DEFAULT 'draft',

  -- Approval Tracking
  created_by UUID REFERENCES admin_users(id),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,

  -- Customer Interaction
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Notes
  admin_notes TEXT,
  customer_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote line items stored separately
CREATE TABLE business_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,
  service_package_id UUID REFERENCES service_packages(id),

  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `contracts` - B2B Contracts with KYC Integration

Contracts generated from accepted quotes, integrated with Didit KYC.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contract Identity
  contract_number TEXT UNIQUE, -- Format: CT-YYYY-NNN

  -- Relationships
  customer_id UUID REFERENCES customers(id),
  quote_id UUID REFERENCES business_quotes(id),
  kyc_session_id UUID REFERENCES kyc_sessions(id),

  -- Financial
  total_contract_value DECIMAL(10,2),
  monthly_recurring_revenue DECIMAL(10,2),
  contract_term_months INTEGER,

  -- Contract Status
  status TEXT CHECK (status IN (
    'draft', 'pending_signature', 'partially_signed',
    'fully_signed', 'active', 'cancelled', 'expired'
  )) DEFAULT 'draft',

  -- Signature Tracking
  customer_signed_at TIMESTAMPTZ,
  circletel_signed_at TIMESTAMPTZ,
  fully_signed_date TIMESTAMPTZ,

  -- Zoho Integration
  zoho_deal_id TEXT,
  zoho_estimate_id TEXT,

  -- KYC Badge (embedded in PDF)
  kyc_verified BOOLEAN DEFAULT false,
  kyc_badge_text TEXT,

  -- Document
  pdf_url TEXT,
  pdf_storage_path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_zoho_deal ON contracts(zoho_deal_id);
```

#### `consumer_orders` - B2C Consumer Orders

Simplified order flow for consumer customers.

```sql
CREATE TABLE consumer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order Identity
  order_number TEXT UNIQUE,

  -- Customer Info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,

  -- Addresses
  installation_address TEXT,
  billing_same_as_installation BOOLEAN DEFAULT true,
  billing_address TEXT,

  -- Product Selection
  service_package_id UUID REFERENCES service_packages(id),
  package_name TEXT,
  package_speed TEXT,
  package_price DECIMAL(10,2),
  installation_fee DECIMAL(10,2),
  router_included BOOLEAN DEFAULT false,

  -- Payment
  payment_method TEXT CHECK (payment_method IN ('eft', 'card', 'debit_order', 'cash')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'partial', 'failed', 'refunded')) DEFAULT 'pending',
  payment_reference TEXT,
  total_paid DECIMAL(10,2) DEFAULT 0,

  -- Order Status (12 states)
  status order_status DEFAULT 'pending',

  -- Installation Timeline
  preferred_installation_date DATE,
  installation_scheduled_date DATE,
  installation_completed_date DATE,
  activation_date DATE,

  -- Tracking
  lead_source TEXT,
  account_number TEXT,
  connection_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE order_status AS ENUM (
  'pending', 'payment_pending', 'payment_confirmed',
  'kyc_pending', 'kyc_completed', 'order_confirmed',
  'installation_scheduled', 'installation_in_progress', 'installation_completed',
  'activation_pending', 'active', 'cancelled'
);
```

### Integration Tables

#### `zoho_entity_mappings` - Bidirectional ID Mapping

Maps CircleTel entities to their Zoho counterparts.

```sql
CREATE TABLE zoho_entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CircleTel Entity
  circletel_type TEXT CHECK (circletel_type IN (
    'quote', 'contract', 'invoice', 'customer',
    'service_package', 'subscription'
  )),
  circletel_id UUID NOT NULL,

  -- Zoho Entity
  zoho_type TEXT CHECK (zoho_type IN (
    'Estimates', 'Deals', 'Invoices', 'Contacts',
    'Products', 'Plans', 'Items', 'Subscriptions'
  )),
  zoho_id TEXT NOT NULL,

  -- Sync Metadata
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IN ('circletel_to_zoho', 'zoho_to_circletel', 'bidirectional')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique Constraints
  UNIQUE(circletel_type, circletel_id),
  UNIQUE(zoho_type, zoho_id)
);

CREATE INDEX idx_zoho_mappings_circletel ON zoho_entity_mappings(circletel_type, circletel_id);
CREATE INDEX idx_zoho_mappings_zoho ON zoho_entity_mappings(zoho_type, zoho_id);
```

#### `zoho_sync_logs` - Comprehensive Audit Trail

Logs all Zoho sync attempts for debugging and monitoring.

```sql
CREATE TABLE zoho_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity Being Synced
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Zoho Entity
  zoho_entity_type TEXT,
  zoho_entity_id TEXT,

  -- Sync Attempt
  status TEXT CHECK (status IN ('pending', 'success', 'failed', 'retrying')) DEFAULT 'pending',
  attempt_number INTEGER CHECK (attempt_number >= 1 AND attempt_number <= 3) DEFAULT 1,

  -- Error Details
  error_message TEXT,
  error_code TEXT,
  error_stack TEXT,

  -- Request/Response
  request_payload JSONB,
  response_payload JSONB,

  -- HTTP Details
  http_method TEXT,
  http_status INTEGER,
  http_url TEXT,

  -- Timing
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zoho_sync_logs_entity ON zoho_sync_logs(entity_type, entity_id);
CREATE INDEX idx_zoho_sync_logs_status ON zoho_sync_logs(status);
CREATE INDEX idx_zoho_sync_logs_created ON zoho_sync_logs(created_at DESC);
```

#### `product_integrations` - Product Sync Status Tracking

Tracks sync status for products to both Zoho CRM and Zoho Billing.

```sql
CREATE TABLE product_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product References
  admin_product_id UUID REFERENCES admin_products(id),
  service_package_id UUID REFERENCES service_packages(id),

  -- Zoho CRM Product ID
  zoho_crm_product_id TEXT,
  zoho_crm_sync_status TEXT CHECK (zoho_crm_sync_status IN ('pending', 'ok', 'failed')),
  zoho_crm_last_synced_at TIMESTAMPTZ,
  zoho_crm_last_sync_error TEXT,

  -- Zoho Billing IDs
  zoho_billing_product_id TEXT,
  zoho_billing_plan_id TEXT,       -- Recurring monthly plan
  zoho_billing_item_id TEXT,       -- Installation item (one-time)
  zoho_billing_hardware_item_id TEXT, -- Hardware item (optional)

  zoho_billing_sync_status TEXT CHECK (zoho_billing_sync_status IN ('pending', 'ok', 'failed')),
  zoho_billing_last_synced_at TIMESTAMPTZ,
  zoho_billing_last_sync_error TEXT,

  -- Overall Status
  sync_status TEXT CHECK (sync_status IN ('pending', 'partial', 'complete', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_integrations_service_package ON product_integrations(service_package_id);
CREATE INDEX idx_product_integrations_status ON product_integrations(sync_status);
```

---

## RBAC Permission System

### Permission Structure

CircleTel uses **100+ granular permissions** organized into 17 categories:

```typescript
// From /lib/rbac/permissions.ts
export const PERMISSIONS = {
  // Dashboard (5 permissions)
  DASHBOARD: {
    VIEW: 'dashboard:view',
    VIEW_ANALYTICS: 'dashboard:view_analytics',
    VIEW_REPORTS: 'dashboard:view_reports',
    EXPORT_DATA: 'dashboard:export_data',
    MANAGE_WIDGETS: 'dashboard:manage_widgets'
  },

  // Products (8 permissions)
  PRODUCTS: {
    VIEW: 'products:read',
    CREATE: 'products:create',
    EDIT: 'products:edit',
    DELETE: 'products:delete',
    APPROVE: 'products:approve',
    PUBLISH: 'products:publish',
    MANAGE_PRICING: 'products:manage_pricing',
    VIEW_COSTS: 'products:view_costs'
  },

  // Coverage (6 permissions)
  COVERAGE: {
    VIEW: 'coverage:read',
    EDIT: 'coverage:edit',
    MANAGE_PROVIDERS: 'coverage:manage_providers',
    RUN_TESTS: 'coverage:run_tests',
    VIEW_ANALYTICS: 'coverage:view_analytics',
    EXPORT_DATA: 'coverage:export_data'
  },

  // Customers (6 permissions)
  CUSTOMERS: {
    VIEW: 'customers:read',
    CREATE: 'customers:create',
    EDIT: 'customers:edit',
    DELETE: 'customers:delete',
    VIEW_PERSONAL_INFO: 'customers:view_pii',
    EXPORT: 'customers:export'
  },

  // Orders (7 permissions)
  ORDERS: {
    VIEW: 'orders:read',
    CREATE: 'orders:create',
    EDIT: 'orders:edit',
    CANCEL: 'orders:cancel',
    PROCESS: 'orders:process',
    REFUND: 'orders:refund',
    VIEW_PAYMENT_INFO: 'orders:view_payment'
  },

  // Billing (8 permissions)
  BILLING: {
    VIEW: 'billing:read',
    MANAGE_INVOICES: 'billing:manage_invoices',
    PROCESS_PAYMENTS: 'billing:process_payments',
    ISSUE_REFUNDS: 'billing:issue_refunds',
    VIEW_REVENUE: 'billing:view_revenue',
    EXPORT_FINANCIAL: 'billing:export_financial',
    MANAGE_SUBSCRIPTIONS: 'billing:manage_subscriptions',
    CONFIGURE_PAYMENT_METHODS: 'billing:configure_payment_methods'
  },

  // Quotes (6 permissions)
  QUOTES: {
    VIEW: 'quotes:read',
    CREATE: 'quotes:create',
    EDIT: 'quotes:edit',
    DELETE: 'quotes:delete',
    APPROVE: 'quotes:approve',
    SEND: 'quotes:send'
  },

  // Contracts (6 permissions)
  CONTRACTS: {
    VIEW: 'contracts:read',
    CREATE: 'contracts:create',
    EDIT: 'contracts:edit',
    APPROVE: 'contracts:approve',
    SIGN: 'contracts:sign',
    TERMINATE: 'contracts:terminate'
  },

  // KYC Compliance (5 permissions)
  COMPLIANCE: {
    VIEW: 'compliance:read',
    MANAGE_KYC: 'compliance:manage_kyc',
    APPROVE_DOCUMENTS: 'compliance:approve_documents',
    MANAGE_RICA: 'compliance:manage_rica',
    VIEW_AUDIT_LOGS: 'compliance:view_audit_logs'
  },

  // Integrations (6 permissions)
  INTEGRATIONS: {
    VIEW: 'integrations:read',
    CONFIGURE: 'integrations:configure',
    MANAGE_ZOHO: 'integrations:manage_zoho',
    MANAGE_API_KEYS: 'integrations:manage_api_keys',
    VIEW_SYNC_LOGS: 'integrations:view_sync_logs',
    TRIGGER_MANUAL_SYNC: 'integrations:trigger_sync'
  },

  // ... 8 more categories (Users, Roles, Reports, CMS, etc.)
};
```

### Role Templates

**17 predefined role templates** with permission bundles:

```typescript
// From /lib/rbac/role-templates.ts
export const ROLE_TEMPLATES = {
  super_admin: {
    name: 'Super Administrator',
    description: 'Full system access',
    permissions: ALL_PERMISSIONS
  },

  product_manager: {
    name: 'Product Manager',
    description: 'Manage product catalogue and approvals',
    permissions: [
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.CREATE,
      PERMISSIONS.PRODUCTS.EDIT,
      PERMISSIONS.PRODUCTS.APPROVE,
      PERMISSIONS.PRODUCTS.PUBLISH,
      PERMISSIONS.PRODUCTS.MANAGE_PRICING,
      PERMISSIONS.INTEGRATIONS.VIEW_SYNC_LOGS
    ]
  },

  sales_manager: {
    name: 'Sales Manager',
    description: 'Manage quotes, leads, and pipeline',
    permissions: [
      PERMISSIONS.QUOTES.VIEW,
      PERMISSIONS.QUOTES.CREATE,
      PERMISSIONS.QUOTES.EDIT,
      PERMISSIONS.QUOTES.APPROVE,
      PERMISSIONS.QUOTES.SEND,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.CREATE,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.DASHBOARD.VIEW
    ]
  },

  finance_manager: {
    name: 'Finance Manager',
    description: 'Manage billing, invoices, and revenue',
    permissions: [
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.MANAGE_INVOICES,
      PERMISSIONS.BILLING.PROCESS_PAYMENTS,
      PERMISSIONS.BILLING.ISSUE_REFUNDS,
      PERMISSIONS.BILLING.VIEW_REVENUE,
      PERMISSIONS.BILLING.EXPORT_FINANCIAL,
      PERMISSIONS.ORDERS.VIEW_PAYMENT_INFO,
      PERMISSIONS.DASHBOARD.VIEW_REPORTS
    ]
  },

  customer_support: {
    name: 'Customer Support',
    description: 'Handle customer inquiries and tickets',
    permissions: [
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.DASHBOARD.VIEW
    ]
  },

  tech_support: {
    name: 'Technical Support',
    description: 'Technical troubleshooting and coverage testing',
    permissions: [
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.COVERAGE.RUN_TESTS,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.DASHBOARD.VIEW
    ]
  }

  // ... 12 more roles (account_manager, sales_rep, finance_clerk, etc.)
};
```

### Permission Enforcement Patterns

#### Client-Side (UI Components)

```typescript
// From /app/admin/products/page.tsx
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export default function ProductsPage() {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div>
      {/* Conditional rendering based on permission */}
      {hasPermission(PERMISSIONS.PRODUCTS.CREATE) && (
        <Button onClick={handleCreate}>Create Product</Button>
      )}

      {/* Component wrapper (hides if no permission) */}
      <PermissionGate permission={PERMISSIONS.PRODUCTS.EDIT}>
        <Button onClick={handleEdit}>Edit Product</Button>
      </PermissionGate>

      {/* Check multiple permissions (OR logic) */}
      {hasAnyPermission([
        PERMISSIONS.PRODUCTS.APPROVE,
        PERMISSIONS.PRODUCTS.PUBLISH
      ]) && (
        <ApprovalWorkflowPanel />
      )}
    </div>
  );
}
```

#### Server-Side (API Routes)

```typescript
// From /app/api/admin/products/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate admin user (via cookies)
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Check admin_users table
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active, permissions')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminUser?.is_active) {
    return NextResponse.json(
      { error: 'Account inactive' },
      { status: 403 }
    );
  }

  // 3. Role-based authorization (check specific permission)
  const hasPermission = checkUserPermission(
    adminUser,
    PERMISSIONS.PRODUCTS.PUBLISH
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // 4. Execute admin action (service role client bypasses RLS)
  const { id } = await context.params;

  const supabaseAdmin = await createClient(); // Service role

  const { data: product } = await supabaseAdmin
    .from('admin_products')
    .select('*')
    .eq('id', id)
    .single();

  // ... publish product logic

  return NextResponse.json({ success: true });
}

function checkUserPermission(adminUser: any, permission: string): boolean {
  // Check role template permissions
  const rolePermissions = ROLE_TEMPLATES[adminUser.role]?.permissions || [];
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check custom user permissions (overrides)
  const customPermissions = adminUser.permissions || [];
  return customPermissions.includes(permission);
}
```

---

## Zoho CRM Integration

### Entity Mapping

CircleTel entities sync to corresponding Zoho CRM modules:

| CircleTel Entity | Zoho CRM Module | Sync Trigger | Bidirectional? |
|------------------|-----------------|--------------|----------------|
| `business_quotes` | Estimates | Quote approval | ✅ Yes |
| `contracts` | Deals | Contract signed | ✅ Yes |
| `customers` | Contacts | Customer creation | ✅ Yes |
| `invoices` | Invoices | Invoice generation | → One-way |
| `service_packages` | Products | Product publish | → One-way |

### Custom CircleTel Fields in Zoho CRM

These fields must be **manually created** in Zoho CRM Settings before syncing:

**Module: Deals (Contracts)**

| Field Name | Type | Values | Purpose |
|------------|------|--------|---------|
| `KYC_Status` | Picklist | Completed, In Progress, Not Started, Declined | Track KYC verification status |
| `KYC_Verified_Date` | Date | - | Date KYC completed |
| `Risk_Tier` | Picklist | Low, Medium, High | Risk assessment from Didit |
| `RICA_Status` | Picklist | Approved, Pending, Submitted, Rejected | RICA compliance status |
| `Contract_Number` | Text | CT-YYYY-NNN | CircleTel contract reference |
| `Contract_Signed_Date` | Date | - | Date contract fully signed |
| `MRR` | Currency | - | Monthly Recurring Revenue |

**Module: Estimates (Quotes)**

| Field Name | Type | Values | Purpose |
|------------|------|--------|---------|
| `Quote_Number` | Text | Q-YYYY-NNNN | CircleTel quote reference |
| `Installation_Address` | Text | - | Service delivery address |
| `Special_Instructions` | Text Area | - | Customer-specific notes |

### Zoho CRM Service

**Location**: `/lib/integrations/zoho/crm-service.ts`

```typescript
import { ZohoApiClient } from '@/lib/zoho-api-client';

export class ZohoCRMService {
  private client: ZohoApiClient;

  constructor() {
    this.client = new ZohoApiClient();
  }

  /**
   * Create Estimate (Quote) in Zoho CRM
   */
  async createEstimate(quote: BusinessQuote): Promise<string> {
    const payload = {
      Subject: `Quote for ${quote.company_name}`,
      Deal_Name: quote.company_name,
      Amount: quote.total_amount,
      Stage: 'Quotation',

      // Custom CircleTel fields
      Quote_Number: quote.quote_number,
      Installation_Address: quote.installation_address,

      // Line Items
      Product_Details: quote.items.map(item => ({
        product: { id: item.zoho_product_id },
        quantity: item.quantity,
        list_price: item.unit_price,
        total: item.line_total
      }))
    };

    const response = await this.client.request('/crm/v2/Quotes', 'POST', {
      data: [payload]
    });

    return response.data[0].details.id;
  }

  /**
   * Create Deal (Contract) in Zoho CRM with KYC fields
   */
  async createDeal(contract: Contract): Promise<string> {
    const payload = {
      Deal_Name: `Contract ${contract.contract_number}`,
      Amount: contract.total_contract_value,
      Stage: 'Closed Won',
      Closing_Date: contract.fully_signed_date,

      // Custom CircleTel KYC fields
      KYC_Status: contract.kyc_verified ? 'Completed' : 'Not Started',
      KYC_Verified_Date: contract.kyc_session?.verified_at,
      Risk_Tier: contract.kyc_session?.risk_tier || 'Low',
      RICA_Status: contract.rica_submission?.status || 'Pending',
      Contract_Number: contract.contract_number,
      Contract_Signed_Date: contract.fully_signed_date,
      MRR: contract.monthly_recurring_revenue,

      // Link to Contact (customer)
      Contact_Name: { id: contract.zoho_contact_id }
    };

    const response = await this.client.request('/crm/v2/Deals', 'POST', {
      data: [payload]
    });

    return response.data[0].details.id;
  }

  /**
   * Update Deal with KYC status change
   */
  async updateDealKYCStatus(
    dealId: string,
    kycStatus: string,
    riskTier: string
  ): Promise<void> {
    await this.client.request(`/crm/v2/Deals/${dealId}`, 'PUT', {
      data: [{
        KYC_Status: kycStatus,
        Risk_Tier: riskTier,
        KYC_Verified_Date: new Date().toISOString().split('T')[0]
      }]
    });
  }
}
```

---

## Zoho Billing Integration

### Entity Mapping

CircleTel products map to multiple Zoho Billing entities:

| CircleTel Entity | Zoho Billing Entity | Purpose | Example |
|------------------|---------------------|---------|---------|
| `service_packages` | Product | Top-level grouping | "MTN 5G Connectivity" |
| `service_packages` | Plan | Recurring subscription | "R799/month - 100GB" |
| `service_packages` | Item (Installation) | One-time fee | "R500 installation" |
| `service_packages` (hardware) | Item (Hardware) | Router/CPE | "R800 - WiFi 6 Router" |

### Zoho Billing Sync Service

**Location**: `/lib/integrations/zoho/billing-sync-service.ts`

```typescript
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';

export async function syncServicePackageToZohoBilling(
  servicePackage: ServicePackage
): Promise<BillingSyncResult> {
  const client = new ZohoBillingClient();

  try {
    console.log(`[Zoho Billing Sync] Syncing package: ${servicePackage.name}`);

    // =========================================================================
    // STEP 1: Sync Product (required for Plan creation)
    // =========================================================================
    const productPayload = {
      name: servicePackage.name,
      description: `CircleTel service package - ${servicePackage.category}`
    };

    const productId = await client.upsertProduct(
      servicePackage.name,
      productPayload
    );

    console.log(`[Zoho Billing Sync] Product synced: ${productId}`);

    // =========================================================================
    // STEP 2: Sync Plan (recurring monthly subscription)
    // =========================================================================
    const planPayload = {
      plan_code: servicePackage.sku,
      name: servicePackage.name,
      product_id: productId,

      // Pricing
      recurring_price: servicePackage.pricing.monthly,
      setup_fee: servicePackage.pricing.setup || 0,
      currency_code: 'ZAR',

      // Billing Frequency
      interval: 1,
      interval_unit: 'months',

      // Contract Terms
      billing_cycles: servicePackage.metadata?.contract_months || -1, // -1 = month-to-month

      // Status
      status: 'active',

      // Metadata
      description: `Monthly subscription for ${servicePackage.name}`,
      custom_fields: [
        { label: 'Download Speed', value: servicePackage.pricing.download_speed },
        { label: 'Upload Speed', value: servicePackage.pricing.upload_speed },
        { label: 'Technology', value: servicePackage.technology }
      ]
    };

    const planId = await client.upsertPlan(
      servicePackage.sku,
      planPayload
    );

    console.log(`[Zoho Billing Sync] Plan synced: ${planId}`);

    // =========================================================================
    // STEP 3: Sync Installation Item (one-time fee)
    // =========================================================================
    const installationPayload = {
      name: `${servicePackage.name} - Installation`,
      rate: servicePackage.pricing.setup || 500,
      description: 'One-time installation and activation fee',
      sku: `${servicePackage.sku}-INSTALL`,
      item_type: 'service'
    };

    const installationItemId = await client.upsertItem(
      installationPayload.sku,
      installationPayload
    );

    console.log(`[Zoho Billing Sync] Installation item synced: ${installationItemId}`);

    // =========================================================================
    // STEP 4: Sync Hardware Item (if applicable)
    // =========================================================================
    let hardwareItemId: string | null = null;

    if (servicePackage.metadata?.hardware?.included) {
      const hardwarePayload = {
        name: `${servicePackage.name} - Hardware`,
        rate: servicePackage.metadata.hardware.cost || 0,
        sku: `${servicePackage.sku}-HARDWARE`,
        description: servicePackage.metadata.hardware.description || 'Router/CPE hardware',
        item_type: 'goods'
      };

      hardwareItemId = await client.upsertItem(
        hardwarePayload.sku,
        hardwarePayload
      );

      console.log(`[Zoho Billing Sync] Hardware item synced: ${hardwareItemId}`);
    }

    // =========================================================================
    // SUCCESS: Return all Zoho IDs
    // =========================================================================
    return {
      success: true,
      productId,
      planId,
      installationItemId,
      hardwareItemId
    };

  } catch (error) {
    console.error('[Zoho Billing Sync] Error:', error);
    throw error;
  }
}

export interface BillingSyncResult {
  success: boolean;
  productId: string;
  planId: string;
  installationItemId: string;
  hardwareItemId?: string | null;
}
```

---

## Key Admin Workflows

### Workflow 1: Product Publish Pipeline

**Scenario**: Admin publishes approved product to runtime catalogue

**Data Flow**:

```
1. Admin navigates to /admin/products/[id]
   ↓
2. Admin clicks "Publish to Catalogue" button
   ↓
3. POST /api/admin/products/[id]/publish
   ├─ RBAC Check: User has products:publish permission?
   └─ Load admin_product with full context
   ↓
4. Validate Product for Publish
   ├─ Status must be 'approved'
   ├─ Pricing must be complete (regular_price set)
   ├─ Features must be defined
   └─ Category must be set
   ↓
5. Build service_packages Payload
   ├─ Map admin_product fields → service_package schema
   ├─ Calculate pricing JSONB: { monthly, setup, download_speed, upload_speed }
   ├─ Set metadata: { contract_months, hardware, terms_url }
   └─ Set source_admin_product_id reference
   ↓
6. Upsert into service_packages
   ├─ If SKU exists: Update existing record
   ├─ If new SKU: Insert new record
   └─ Return service_package with ID
   ↓
7. Archive Previous Versions (if SKU exists)
   ├─ Find all service_packages with same SKU and earlier published_at
   ├─ Set active = false, archived_at = NOW()
   └─ Preserve historical records for reporting
   ↓
8. Log Audit Trail
   ├─ Insert into service_packages_audit_logs
   ├─ Record: admin_user_id, action='published', old_value, new_value
   └─ Timestamp and metadata
   ↓
9. ✅ RETURN SUCCESS TO CLIENT
   (Product now live - customers can order it)
   ↓
10. ASYNC: Sync to Zoho CRM Product (best-effort)
    ├─ Create/update Product in Zoho CRM
    ├─ Retry up to 3 times on failure (exponential backoff: 1s, 2s, 4s)
    ├─ Log to zoho_sync_logs (status, request/response, error)
    └─ Update product_integrations.zoho_crm_product_id
    ↓
11. ASYNC: Sync to Zoho Billing (best-effort)
    ├─ Create/update Product (top-level grouping)
    ├─ Create/update Plan (recurring subscription)
    ├─ Create/update Item - Installation (one-time fee)
    ├─ Create/update Item - Hardware (if applicable)
    ├─ Retry up to 3 times on failure
    ├─ Log to zoho_sync_logs
    └─ Update product_integrations with all Zoho IDs
    ↓
12. Sync Complete (or logged as failed for manual retry)
```

**Code Example**:

```typescript
// From /app/api/admin/products/[id]/publish/route.ts
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { market_segment, provider } = await request.json();

  // 1-2: Authenticate and authorize
  const adminUser = await authenticateAdminUser();
  if (!hasPermission(adminUser, PERMISSIONS.PRODUCTS.PUBLISH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3: Load product context
  const ctx = await getAdminProductContext(id);

  // 4: Validate
  const errors = validateAdminProductForPublish(ctx);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Not ready to publish', errors }, { status: 400 });
  }

  // 5: Build payload
  const payload = buildServicePackagePayload(ctx, { market_segment, provider });

  // 6: Upsert into service_packages
  const { servicePackage, wasCreated } = await upsertServicePackage(payload);

  // 7: Archive previous versions
  await archivePreviousVersions(servicePackage, payload);

  // 8: Log audit
  await logPublishAudit(adminUser, servicePackage, 'Published from admin catalogue');

  // 9: ✅ RETURN SUCCESS (product now live)
  const response = {
    success: true,
    data: servicePackage,
    metadata: { wasCreated, zoho_sync: null }
  };

  // 10-11: Async Zoho sync (non-blocking)
  syncToZohoAsync(servicePackage).catch(err => {
    console.error('[publish] Zoho sync failed:', err);
  });

  return NextResponse.json(response);
}

async function syncToZohoAsync(servicePackage: ServicePackage) {
  try {
    // Sync to Zoho CRM
    const crmResult = await syncWithRetry(servicePackage, 0);

    // Sync to Zoho Billing
    const billingResult = await syncServicePackageToZohoBilling(servicePackage);

    // Update product_integrations
    await supabase
      .from('product_integrations')
      .upsert({
        service_package_id: servicePackage.id,
        zoho_crm_product_id: crmResult.productId,
        zoho_billing_plan_id: billingResult.planId,
        zoho_billing_item_id: billingResult.installationItemId,
        zoho_billing_hardware_item_id: billingResult.hardwareItemId,
        sync_status: 'complete',
        last_synced_at: new Date().toISOString()
      });

  } catch (error) {
    // Log failure but don't throw (async operation)
    await logSyncFailure('service_package', servicePackage.id, error);
  }
}
```

### Workflow 2: Product Approval Queue

**Scenario**: Admin approves imported product from Excel/CSV import

**Data Flow**:

```
1. Admin navigates to /admin/products/approvals
   ↓
2. View pending products in approval queue
   ├─ Query product_approval_queue WHERE status = 'pending'
   ├─ Display: product_name, regular_price, category, imported_by
   └─ Show product_data preview
   ↓
3. Admin clicks "Approve" on product
   ↓
4. POST /api/admin/product-approvals/[id]/approve
   ├─ Request body: { approval_notes, map_to_existing_package (optional) }
   └─ RBAC Check: User has products:approve permission?
   ↓
5. Validate Approval Queue Item
   ├─ Status must be 'pending'
   ├─ Import must exist and be valid
   └─ Product data must be complete
   ↓
6. Decision: Create New or Map to Existing?
   ├─ If map_to_existing_package provided:
   │   └─ Use existing service_package_id
   └─ Else:
       ├─ Extract product_data from approval queue
       ├─ Create new service_package
       └─ Return new service_package_id
   ↓
7. Update Approval Queue Status
   ├─ Set status = 'approved'
   ├─ Set reviewed_by = admin_user_id
   ├─ Set reviewed_at = NOW()
   ├─ Set approval_notes
   └─ Set service_package_id (link to product)
   ↓
8. Log Approval Activity
   ├─ Insert into product_approval_activity_log
   ├─ Record: import_id, approval_queue_id, user_id, action='approved'
   └─ Store approval_notes in details JSONB
   ↓
9. Create Notification for Importer
   ├─ Insert into notifications table
   ├─ Recipient: import.imported_by
   ├─ Message: "Your product '{name}' has been approved"
   └─ Type: 'success'
   ↓
10. Return Success Response
```

**Code Example**:

```typescript
// From /app/api/admin/product-approvals/[id]/approve/route.ts
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { approval_notes, map_to_existing_package } = await request.json();

  // Authenticate and authorize
  const adminUser = await authenticateAdminUser();
  if (!hasPermission(adminUser, PERMISSIONS.PRODUCTS.APPROVE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get approval queue item
  const { data: approval } = await supabase
    .from('product_approval_queue')
    .select('*, import:product_imports(*)')
    .eq('id', id)
    .single();

  if (approval.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 });
  }

  let servicePackageId = map_to_existing_package;

  // Create new service_package if not mapping to existing
  if (!map_to_existing_package) {
    const { data: newPackage } = await supabase
      .from('service_packages')
      .insert({
        name: approval.product_data.name,
        price: approval.product_data.regularPrice,
        category: approval.import?.product_category || 'BizFibre Connect',
        is_active: true,
        metadata: { importedFrom: approval.import?.source_file }
      })
      .select()
      .single();

    servicePackageId = newPackage.id;
  }

  // Update approval status
  await supabase
    .from('product_approval_queue')
    .update({
      status: 'approved',
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
      approval_notes,
      service_package_id: servicePackageId
    })
    .eq('id', id);

  // Log activity
  await supabase.from('product_approval_activity_log').insert({
    import_id: approval.import_id,
    approval_queue_id: id,
    user_id: adminUser.id,
    action: 'approved',
    details: { approval_notes, service_package_id: servicePackageId }
  });

  // Notify importer
  await supabase.from('notifications').insert({
    user_id: approval.import.imported_by,
    title: 'Product Approved',
    message: `Your product "${approval.product_name}" has been approved.`,
    type: 'success'
  });

  return NextResponse.json({ success: true, service_package_id: servicePackageId });
}
```

### Workflow 3: B2B Quote Generation & Zoho Sync

**Scenario**: Admin creates B2B quote, manager approves, syncs to Zoho CRM Estimate

**Data Flow**:

```
1. Admin navigates to /admin/quotes/new
   ↓
2. Fill quote form
   ├─ Company details (name, contact, email, phone)
   ├─ Addresses (billing, installation)
   ├─ Add line items (service packages)
   └─ Set validity period
   ↓
3. POST /api/quotes/business
   ├─ RBAC Check: User has quotes:create permission?
   ├─ Validate: company_name, total_amount, valid_until
   └─ Auto-generate quote_number (Q-YYYY-NNNN)
   ↓
4. Insert into business_quotes
   ├─ Status = 'draft'
   ├─ Created_by = admin_user_id
   └─ Return quote_id
   ↓
5. Insert Quote Line Items
   ├─ Insert into business_quote_items
   ├─ Link to quote_id
   └─ Calculate line_total for each item
   ↓
6. Admin submits for approval
   ├─ PUT /api/quotes/business/[id]
   ├─ Update status = 'pending_approval'
   └─ Create notification for manager
   ↓
7. Manager reviews quote
   ├─ Navigate to /admin/quotes/[id]
   ├─ Review line items, pricing, addresses
   └─ Click "Approve Quote"
   ↓
8. POST /api/quotes/business/[id]/approve
   ├─ RBAC Check: User has quotes:approve permission?
   ├─ Update status = 'approved'
   ├─ Set approved_by, approved_at
   └─ ✅ Quote now ready to send to customer
   ↓
9. TRIGGER: Sync Quote to Zoho CRM Estimate
   ├─ Check if already synced (zoho_entity_mappings)
   ├─ If not synced:
   │   ├─ Build Zoho Estimate payload
   │   ├─ POST to Zoho CRM /crm/v2/Quotes
   │   ├─ Retry up to 3 times on failure
   │   └─ Return zoho_estimate_id
   └─ Else: Update existing Estimate
   ↓
10. Create Entity Mapping
    ├─ Insert into zoho_entity_mappings
    ├─ circletel_type = 'quote', circletel_id = quote_id
    ├─ zoho_type = 'Estimates', zoho_id = zoho_estimate_id
    └─ Set last_synced_at = NOW()
    ↓
11. Log Sync Attempt
    ├─ Insert into zoho_sync_logs
    ├─ Record: entity_type, entity_id, status, request_payload, response_payload
    └─ Store any errors for debugging
    ↓
12. Generate PDF Quote for Customer
    ├─ Use contract generator template
    ├─ Upload to Supabase Storage
    └─ Return pdf_url
    ↓
13. Admin sends quote to customer
    ├─ POST /api/quotes/business/[id]/send
    ├─ Update status = 'sent', sent_at = NOW()
    ├─ Send email with PDF attachment
    └─ Update Zoho Estimate status
```

**Code Example (Zoho Sync)**:

```typescript
// From /lib/integrations/zoho/sync-service.ts
export class ZohoSyncService {
  async syncQuoteWithKYC(quoteId: string): Promise<SyncResult> {
    return this.retry(async () => {
      console.log('[ZohoSync] Syncing quote:', quoteId);

      // 1. Fetch quote data from Supabase
      const quote = await this.fetchQuoteData(quoteId);

      // 2. Check if already synced
      const existingMapping = await this.getMapping('quote', quoteId);
      if (existingMapping) {
        console.log('[ZohoSync] Quote already synced:', existingMapping.zoho_id);
        return { success: true, zohoEntityId: existingMapping.zoho_id };
      }

      // 3. Build Zoho Estimate payload
      const payload = {
        Subject: `Quote for ${quote.company_name}`,
        Deal_Name: quote.company_name,
        Amount: quote.total_amount,
        Stage: 'Quotation',
        Quote_Number: quote.quote_number,
        Installation_Address: quote.installation_address,
        Product_Details: quote.items.map(item => ({
          product: { id: item.zoho_product_id },
          quantity: item.quantity,
          list_price: item.unit_price,
          total: item.line_total
        }))
      };

      // 4. Create Estimate in Zoho CRM
      const response = await this.crmService.createEstimate(payload);
      const zohoId = response.data[0].details.id;

      // 5. Create mapping
      await this.createMapping('quote', quoteId, 'Estimates', zohoId);

      console.log('[ZohoSync] Quote synced successfully:', zohoId);

      return { success: true, zohoEntityId: zohoId };
    }, 'quote', quoteId);
  }

  /**
   * Retry with exponential backoff
   * Attempts: 3 (1s, 2s, 4s delays)
   */
  private async retry<T>(
    operation: () => Promise<T>,
    entityType: string,
    entityId: string,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();

        // Log success
        await this.logSyncSuccess(entityType, entityId, attempt, result);

        return result;
      } catch (error) {
        if (attempt < maxRetries) {
          // Log retry
          await this.logSyncRetry(entityType, entityId, attempt, error);

          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        } else {
          // Final failure - log and throw
          await this.logSyncFailure(entityType, entityId, attempt, error);
          throw error;
        }
      }
    }
  }

  private async logSyncSuccess(entityType: string, entityId: string, attempt: number, result: any) {
    await supabase.from('zoho_sync_logs').insert({
      entity_type: entityType,
      entity_id: entityId,
      status: 'success',
      attempt_number: attempt,
      response_payload: result
    });
  }

  private async logSyncRetry(entityType: string, entityId: string, attempt: number, error: any) {
    await supabase.from('zoho_sync_logs').insert({
      entity_type: entityType,
      entity_id: entityId,
      status: 'retrying',
      attempt_number: attempt,
      error_message: error.message,
      error_stack: error.stack
    });
  }

  private async logSyncFailure(entityType: string, entityId: string, attempt: number, error: any) {
    await supabase.from('zoho_sync_logs').insert({
      entity_type: entityType,
      entity_id: entityId,
      status: 'failed',
      attempt_number: attempt,
      error_message: error.message,
      error_stack: error.stack
    });
  }
}
```

---

## Authentication & Authorization

### Admin Authentication Flow

```
1. Admin visits /admin/login
   ↓
2. Submit credentials (email + password)
   ↓
3. POST /api/admin/login
   ├─ Hash password and compare
   ├─ Query admin_users table
   └─ Validate is_active = true
   ↓
4. Create Supabase Auth Session
   ├─ supabase.auth.signInWithPassword()
   ├─ Set httpOnly cookies (secure)
   └─ Store session in localStorage (for client checks)
   ↓
5. Fetch Admin Permissions
   ├─ Load role template permissions
   ├─ Load custom user permissions (overrides)
   └─ Return permissions array
   ↓
6. Redirect to /admin/dashboard
```

### Session Validation (Middleware)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Only protect /admin/* routes
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const supabase = createClientWithSession(); // Reads cookies
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Check admin_users table (service role)
    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (!adminUser?.is_active) {
      // Account inactive - force logout
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### API Authorization Pattern

**All admin API routes follow this standard pattern:**

```typescript
export async function GET/POST/PUT/DELETE(request, context) {
  // =========================================================================
  // STEP 1: Authenticate via cookies
  // =========================================================================
  const supabase = await createSSRClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // =========================================================================
  // STEP 2: Check admin_users table
  // =========================================================================
  const supabaseAdmin = await createClient(); // Service role
  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, role, is_active, permissions')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminUser?.is_active) {
    return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
  }

  // =========================================================================
  // STEP 3: Check role permissions (if needed)
  // =========================================================================
  const hasPermission = checkUserPermission(adminUser, REQUIRED_PERMISSION);

  if (!hasPermission) {
    // Log unauthorized attempt
    await logUnauthorizedAccess(adminUser.id, request.url);

    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // =========================================================================
  // STEP 4: Execute admin operation (service role bypasses RLS)
  // =========================================================================
  const { data } = await supabaseAdmin
    .from('table')
    .select('*')
    .eq('id', id);

  // =========================================================================
  // STEP 5: Log audit trail
  // =========================================================================
  await logAdminAction(adminUser.id, 'read', 'table', id);

  return NextResponse.json({ success: true, data });
}
```

---

## Sync System Design

### Retry Logic with Exponential Backoff

```typescript
// Pattern: 3 attempts with exponential backoff
// Attempt 1: Immediate
// Attempt 2: 1 second delay
// Attempt 3: 2 second delay
// Attempt 4: 4 second delay (max)

async function syncWithRetry<T>(
  operation: () => Promise<T>,
  entityType: string,
  entityId: string,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();

      // Log success
      await supabase.from('zoho_sync_logs').insert({
        entity_type: entityType,
        entity_id: entityId,
        status: 'success',
        attempt_number: attempt,
        response_payload: result
      });

      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      // Log failure/retry
      await supabase.from('zoho_sync_logs').insert({
        entity_type: entityType,
        entity_id: entityId,
        status: isLastAttempt ? 'failed' : 'retrying',
        attempt_number: attempt,
        error_message: error.message,
        error_code: error.code,
        error_stack: error.stack
      });

      if (isLastAttempt) {
        throw error; // Final failure
      }

      // Exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Sync Failure Handling

**Failed syncs are logged for manual retry:**

```sql
-- View failed syncs from last 24 hours
SELECT
  entity_type,
  entity_id,
  error_message,
  attempt_number,
  created_at
FROM zoho_sync_logs
WHERE
  status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Admin can manually retry failed syncs:**

```typescript
// POST /api/admin/integrations/zoho/retry-queue/[id]/retry
export async function POST(request, context) {
  const { id } = await context.params;

  // Get failed sync log
  const { data: syncLog } = await supabase
    .from('zoho_sync_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (syncLog.status !== 'failed') {
    return NextResponse.json({ error: 'Not a failed sync' }, { status: 400 });
  }

  // Retry sync operation
  try {
    await syncToZoho(syncLog.entity_type, syncLog.entity_id);
    return NextResponse.json({ success: true, message: 'Sync retried successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Integration Monitoring

### Check Product Sync Status

**Admin API endpoint to view integration status:**

```typescript
// GET /api/admin/products/integration-status?service_package_id={id}
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const servicePackageId = searchParams.get('service_package_id');

  const { data: integration } = await supabase
    .from('product_integrations')
    .select('*')
    .eq('service_package_id', servicePackageId)
    .single();

  return NextResponse.json({
    service_package_id: servicePackageId,
    zoho_crm: {
      synced: !!integration?.zoho_crm_product_id,
      product_id: integration?.zoho_crm_product_id,
      last_synced_at: integration?.zoho_crm_last_synced_at,
      sync_status: integration?.zoho_crm_sync_status,
      error: integration?.zoho_crm_last_sync_error
    },
    zoho_billing: {
      synced: !!integration?.zoho_billing_plan_id,
      plan_id: integration?.zoho_billing_plan_id,
      item_id: integration?.zoho_billing_item_id,
      hardware_item_id: integration?.zoho_billing_hardware_item_id,
      last_synced_at: integration?.zoho_billing_last_synced_at,
      sync_status: integration?.zoho_billing_sync_status,
      error: integration?.zoho_billing_last_sync_error
    }
  });
}
```

### Sync Failure Alerting

**Future Enhancement (Epic 4.3):**

```typescript
// Email alert for repeated sync failures
async function checkSyncHealth() {
  const failedSyncs = await supabase
    .from('zoho_sync_logs')
    .select('entity_type, entity_id, error_message')
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

  if (failedSyncs.data.length > 10) {
    // Send alert email to admins
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Zoho Sync Failures Detected',
      body: `${failedSyncs.data.length} sync failures in the last hour.\n\nView logs: ${process.env.NEXT_PUBLIC_APP_URL}/admin/integrations/zoho/logs`
    });
  }
}
```

---

## Code References

### Key Files to Review

**Admin Pages**:
- `/app/admin/products/page.tsx` - Product management UI
- `/app/admin/products/approvals/page.tsx` - Product approval queue
- `/app/admin/quotes/page.tsx` - Quote management UI
- `/app/admin/quotes/[id]/page.tsx` - Quote detail/editor
- `/app/admin/orders/page.tsx` - Order management UI
- `/app/admin/orders/[id]/page.tsx` - Order detail view

**API Routes**:
- `/app/api/admin/products/[id]/publish/route.ts` - Product publish pipeline
- `/app/api/admin/product-approvals/[id]/approve/route.ts` - Product approval workflow
- `/app/api/admin/products/route.ts` - Product listing with filters
- `/app/api/quotes/business/route.ts` - Create B2B quote
- `/app/api/quotes/business/[id]/route.ts` - Update quote
- `/app/api/quotes/business/[id]/approve/route.ts` - Approve quote

**Zoho Integration**:
- `/lib/integrations/zoho/sync-service.ts` - Sync orchestrator (retry logic, logging)
- `/lib/integrations/zoho/crm-service.ts` - Zoho CRM API client
- `/lib/integrations/zoho/billing-client.ts` - Zoho Billing API client
- `/lib/integrations/zoho/billing-sync-service.ts` - Zoho Billing sync logic
- `/lib/integrations/zoho/auth-service.ts` - OAuth token management
- `/lib/zoho-api-client.ts` - Base API client with auto token refresh

**RBAC**:
- `/lib/rbac/permissions.ts` - Permission definitions (100+ permissions)
- `/lib/rbac/role-templates.ts` - Role configurations (17 roles)
- `/hooks/usePermissions.ts` - Permission checking hook
- `/components/rbac/PermissionGate.tsx` - Component wrapper for permission gates

**Database Migrations**:
- `/supabase/migrations/20251103000001_create_zoho_sync_system.sql` - Zoho sync tables
- `/supabase/migrations/20251115000001_create_product_integrations.sql` - Product integration tracking

---

## Architectural Decisions

### Why Supabase-First?

**Decision**: Make Supabase PostgreSQL the single source of truth, sync to Zoho asynchronously.

**Rationale**:
- ✅ **Business Continuity**: CircleTel operates even if Zoho is down
- ✅ **Data Integrity**: PostgreSQL ACID guarantees, transactions, constraints
- ✅ **Performance**: No blocking on external API calls during critical user flows
- ✅ **Auditability**: Full history in PostgreSQL, immutable audit logs
- ✅ **Flexibility**: Can change external integrations without data migration

**Alternative Considered**: Zoho-first (rejected due to API rate limits, downtime risk)

---

### Why Service Role for Admin APIs?

**Decision**: Admin API routes use service role Supabase client (bypasses RLS).

**Rationale**:
- ✅ **Cross-Tenant Visibility**: Admins need to view all customers, orders, quotes
- ✅ **Simplified Queries**: No complex RLS policies for admin operations
- ✅ **RBAC Enforcement**: Application-layer authorization via role templates
- ✅ **Audit Logging**: All admin actions logged to audit tables

**Security Measures**:
- ✅ Authentication required (cookies + session validation)
- ✅ admin_users.is_active check
- ✅ Role-based permission checks
- ✅ Comprehensive audit logging

---

### Why Dual Zoho Integration?

**Decision**: Integrate with both Zoho CRM and Zoho Billing.

**Rationale**:
- ✅ **Zoho CRM**: Sales pipeline, customer relationships, quotes/deals
- ✅ **Zoho Billing**: Subscription billing, invoicing, payment automation
- ✅ **Different Use Cases**: CRM for sales team, Billing for finance team
- ✅ **Business Intelligence**: Comprehensive view across sales + finance

**Sync Strategy**:
- Products sync to **both** CRM (Product) and Billing (Product + Plan + Items)
- Quotes sync to **CRM** (Estimates)
- Contracts sync to **CRM** (Deals with custom KYC fields)
- Subscriptions sync to **Billing** (Subscriptions + Invoices)

---

### Why Retry Logic with Exponential Backoff?

**Decision**: Retry failed Zoho API calls up to 3 times with exponential backoff.

**Rationale**:
- ✅ **Transient Failures**: Network blips, temporary API downtime
- ✅ **Rate Limiting**: Exponential backoff prevents hammering API
- ✅ **Success Rate**: Most failures are transient, retry fixes 80%+
- ✅ **Graceful Degradation**: Log persistent failures for manual review

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay (final)

---

### Why Entity Mapping Table?

**Decision**: Maintain `zoho_entity_mappings` table for bidirectional ID mapping.

**Rationale**:
- ✅ **Fast Lookups**: Query CircleTel ID → Zoho ID (and vice versa)
- ✅ **Prevent Duplicates**: Check if entity already synced before creating
- ✅ **Update vs Create**: Determine whether to update or create Zoho entity
- ✅ **Sync Direction Tracking**: Support bidirectional sync in future

**Alternative Considered**: Store Zoho IDs in business tables (rejected - pollutes schema with integration details)

---

## Summary

CircleTel's admin architecture is built on these core principles:

✅ **Supabase-First Design** - PostgreSQL is the single source of truth
✅ **Async External Sync** - Zoho CRM & Billing sync in background (best-effort)
✅ **Strong RBAC** - 100+ permissions, 17 roles, granular access control
✅ **Comprehensive Audit Trail** - All admin actions and sync attempts logged
✅ **Resilient Integration** - Retry logic, error logging, manual retry queue
✅ **Business Continuity** - CircleTel operates independently of Zoho availability

This architecture ensures **data integrity**, **system resilience**, and **operational flexibility** for CircleTel's growing ISP platform.

---

**Document Changelog**:
- **2025-11-16**: Initial version created, comprehensive research completed
