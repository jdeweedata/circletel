# CircleTel B2B/Enterprise Roadmap

## Document Overview
**Version**: 1.0
**Date**: 2025-10-20
**Status**: Planning & Design
**Target Markets**: SME (1-10 sites), Enterprise (10+ sites)

---

## Executive Summary

This roadmap outlines CircleTel's expansion from B2C consumer services to B2B/Enterprise markets. The implementation is structured in 3 phases spanning approximately 6-8 weeks, targeting Small-Medium Enterprises (SME) first, then scaling to large Enterprise clients.

**Business Value**:
- **Revenue Growth**: Enterprise contracts typically 5-10x larger than consumer orders
- **Customer Retention**: B2B contracts have 80%+ retention vs 60% for B2C
- **Market Expansion**: Access to corporate, government, and institutional sectors
- **Competitive Positioning**: Full-service ISP for all market segments

---

## Phase 3A: B2B Foundation (SME Focus)

**Target Segment**: Small-Medium Enterprises (1-10 sites)
**Timeline**: 2 weeks
**Priority**: P0 (MVP for B2B market entry)

### 1. B2B Order Flow

#### Database Schema
**New Table**: `business_orders`

```sql
CREATE TABLE business_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) UNIQUE NOT NULL,

  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  company_registration VARCHAR(100),
  vat_number VARCHAR(50),
  company_type VARCHAR(50), -- 'pty_ltd', 'cc', 'ngo', 'government'
  industry VARCHAR(100),

  -- Billing Contact
  billing_contact_name VARCHAR(255) NOT NULL,
  billing_contact_email VARCHAR(255) NOT NULL,
  billing_contact_phone VARCHAR(50) NOT NULL,

  -- Technical Contact
  tech_contact_name VARCHAR(255),
  tech_contact_email VARCHAR(255),
  tech_contact_phone VARCHAR(50),

  -- Service Locations (JSONB array for multi-site)
  service_locations JSONB NOT NULL, -- Array of {address, city, province, contacts, services}

  -- Package & Pricing
  package_details JSONB NOT NULL, -- Array of packages per site
  total_monthly_cost DECIMAL(10, 2) NOT NULL,
  total_installation_cost DECIMAL(10, 2) DEFAULT 0,

  -- Contract Terms
  contract_term_months INTEGER DEFAULT 12,
  contract_start_date DATE,
  contract_end_date DATE,
  payment_terms VARCHAR(50) DEFAULT 'net_30', -- 'net_30', 'net_60', 'prepaid'

  -- Purchase Order
  po_number VARCHAR(100),
  po_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',

  -- References
  coverage_lead_id UUID,
  quote_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  internal_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_business_orders_company ON business_orders(company_name);
CREATE INDEX idx_business_orders_status ON business_orders(status);
CREATE INDEX idx_business_orders_created ON business_orders(created_at DESC);
```

#### B2B Order Form
**File**: `app/order/business/page.tsx`

**Features**:
- Multi-step wizard (similar to consumer, but adapted for B2B)
- Company information capture (registration, VAT, industry)
- Dual contact system (billing + technical)
- Multi-site support (up to 10 locations in SME tier)
- Per-site service selection
- Contract term selection (12, 24, 36 months)
- Purchase order upload
- Volume discount calculation

**Steps**:
1. **Company Details** - Company info, registration, VAT number
2. **Service Locations** - Add multiple sites with addresses
3. **Package Selection** - Select packages per site
4. **Contacts & Billing** - Billing and technical contacts
5. **Review & Submit** - Contract summary, PO upload

#### API Endpoints
**POST `/api/orders/business`** - Create business order
**GET `/api/orders/business?id={id}`** - Fetch business order
**PATCH `/api/orders/business`** - Update order status

#### Admin Dashboard
**File**: `app/admin/orders/business/page.tsx`

**Features**:
- Business orders table with company names
- Filter by company, status, contract term
- View multi-site details
- Contract management
- PO tracking
- Volume pricing display

---

### 2. Quote System

#### Database Schema
**New Table**: `quotes`

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(100) UNIQUE NOT NULL, -- QTE-YYYYMMDD-XXXX

  -- Customer
  customer_type VARCHAR(50) NOT NULL, -- 'business', 'consumer'
  company_name VARCHAR(255),
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,

  -- Quote Details
  service_locations JSONB NOT NULL, -- Multi-site support
  package_details JSONB NOT NULL,
  total_monthly_cost DECIMAL(10, 2) NOT NULL,
  total_installation_cost DECIMAL(10, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  total_after_discount DECIMAL(10, 2) NOT NULL,

  -- Contract
  contract_term_months INTEGER,
  payment_terms VARCHAR(50),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'approved', 'rejected', 'expired', 'converted'
  valid_until DATE, -- Quote expiry date

  -- Conversion
  converted_to_order_id UUID,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Approval
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- PDF
  pdf_url TEXT, -- Link to generated PDF

  -- Metadata
  metadata JSONB DEFAULT '{}',
  internal_notes TEXT,

  created_by UUID, -- Admin user who created quote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Quote Request Form
**File**: `app/quote/request/page.tsx`

**Features**:
- Public-facing quote request form
- Company + contact information
- Service requirements (bandwidth, sites, features)
- Budget indication (optional)
- Preferred contact method
- File upload for site list (CSV/Excel)

#### Quote Generation
**File**: `app/admin/quotes/[quoteId]/generate/page.tsx`

**Features**:
- Admin interface for creating quotes
- Package selection with volume discounts
- Custom pricing override
- Terms and conditions editor
- PDF generation using `react-pdf`
- Email quote to customer
- Track quote status (sent, viewed, approved)

**PDF Quote Template**:
- CircleTel branding
- Quote number and validity
- Customer details
- Itemized services per site
- Pricing breakdown (monthly, installation, total)
- Volume discounts highlighted
- Contract terms
- Acceptance signature section

#### Quote Approval Workflow
**File**: `app/quotes/approve/[quoteId]/page.tsx`

**Customer Actions**:
- View quote details
- Accept quote → Convert to order
- Reject quote → Provide reason
- Request changes → Send message to sales

**Admin Notifications**:
- Email on quote acceptance
- Auto-create order from approved quote
- Track quote-to-order conversion rate

---

### 3. Account Management (Basic)

#### Database Schema
**New Table**: `business_accounts`

```sql
CREATE TABLE business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company
  company_name VARCHAR(255) NOT NULL,
  company_registration VARCHAR(100),
  vat_number VARCHAR(50),
  industry VARCHAR(100),
  company_size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'

  -- Primary Contact
  primary_contact_name VARCHAR(255) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL UNIQUE,
  primary_contact_phone VARCHAR(50),

  -- Account Manager
  account_manager_id UUID, -- Reference to admin_users

  -- Status
  account_status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'closed'
  onboarding_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'

  -- Billing
  payment_terms VARCHAR(50) DEFAULT 'net_30',
  credit_limit DECIMAL(12, 2),
  current_balance DECIMAL(12, 2) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  internal_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Link Orders to Accounts**:
```sql
ALTER TABLE business_orders ADD COLUMN account_id UUID REFERENCES business_accounts(id);
ALTER TABLE quotes ADD COLUMN account_id UUID REFERENCES business_accounts(id);
```

#### Account Management Features
- Create business account profile
- Link multiple contacts to account
- View all orders/quotes for account
- Track account health (payment history, service status)
- Account timeline (orders, quotes, support tickets)

---

## Phase 3B: Enterprise Features (Large Business)

**Target Segment**: Large Enterprises (10+ sites, complex requirements)
**Timeline**: 3 weeks
**Priority**: P1 (Essential for enterprise deals)

### 1. Multi-Site Management

#### Bulk Site Ordering
**File**: `app/admin/orders/bulk-import/page.tsx`

**Features**:
- CSV/Excel upload for bulk site creation
- Template download with required fields
- Validation and error reporting
- Preview before import
- Auto-generate orders for each site

**CSV Template**:
```
Site Name,Address,City,Province,Postal Code,Contact Name,Contact Email,Contact Phone,Package,Installation Date
Head Office,123 Main Rd,Johannesburg,Gauteng,2001,John Doe,john@company.co.za,0821234567,100Mbps Fiber,2025-11-01
Branch 1,456 Oak St,Cape Town,Western Cape,8001,Jane Smith,jane@company.co.za,0827654321,50Mbps Fiber,2025-11-05
```

#### Site Hierarchy
**Database Enhancement**:
```sql
CREATE TABLE service_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES business_accounts(id),

  site_type VARCHAR(50), -- 'headquarters', 'branch', 'warehouse', 'remote_office'
  parent_site_id UUID REFERENCES service_sites(id), -- For hierarchical structure

  site_name VARCHAR(255) NOT NULL,
  site_code VARCHAR(50), -- Customer's internal code

  -- Address
  address TEXT NOT NULL,
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  coordinates JSONB,

  -- Contacts
  site_manager_name VARCHAR(255),
  site_manager_email VARCHAR(255),
  site_manager_phone VARCHAR(50),

  -- Service
  service_package_id UUID,
  package_name VARCHAR(255),
  monthly_cost DECIMAL(10, 2),
  installation_status VARCHAR(50), -- 'pending', 'scheduled', 'completed', 'failed'
  service_status VARCHAR(50), -- 'active', 'suspended', 'cancelled'

  -- Billing
  billing_method VARCHAR(50), -- 'centralized', 'per_site'
  billing_account_id UUID REFERENCES business_accounts(id), -- For per-site billing

  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Multi-Site Dashboard
**Features**:
- Map view of all sites
- Filter by region, status, package
- Site health overview
- Bulk actions (suspend all, upgrade all)
- Export site list

---

### 2. Advanced Pricing

#### Custom Pricing Tiers
**Database Table**: `custom_pricing`

```sql
CREATE TABLE custom_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES business_accounts(id),

  -- Pricing Rules
  pricing_type VARCHAR(50) NOT NULL, -- 'volume_discount', 'contract_rate', 'custom'

  -- Volume Discounts
  min_sites INTEGER,
  max_sites INTEGER,
  discount_percentage DECIMAL(5, 2),

  -- Package Overrides
  package_id UUID,
  custom_monthly_price DECIMAL(10, 2),
  custom_installation_price DECIMAL(10, 2),

  -- Contract Terms
  locked_until DATE, -- Contract end date (no price changes)

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  approved_by UUID REFERENCES admin_users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Volume Discount Engine
**Logic**:
```typescript
// Auto-calculate discounts based on site count
const calculateVolumeDiscount = (siteCount: number): number => {
  if (siteCount >= 50) return 20; // 20% discount
  if (siteCount >= 20) return 15; // 15% discount
  if (siteCount >= 10) return 10; // 10% discount
  if (siteCount >= 5) return 5;   // 5% discount
  return 0;
};
```

#### Recurring Billing
**File**: `app/admin/billing/recurring/page.tsx`

**Features**:
- Auto-generate monthly invoices
- Consolidated billing per account
- Per-site itemization
- Payment reminders (email/SMS)
- Auto-suspend on non-payment
- Payment history tracking

---

### 3. SLA & Reporting

#### SLA Definitions
**Database Table**: `sla_agreements`

```sql
CREATE TABLE sla_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES business_accounts(id),

  -- SLA Terms
  uptime_guarantee DECIMAL(5, 2), -- e.g., 99.9%
  response_time_minutes INTEGER, -- Support response time
  resolution_time_hours INTEGER, -- Issue resolution time
  maintenance_window VARCHAR(100), -- e.g., "Sundays 2AM-6AM"

  -- Credits
  credit_per_hour_downtime DECIMAL(10, 2), -- Compensation for downtime
  credit_cap_monthly DECIMAL(10, 2), -- Max credits per month

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  effective_from DATE NOT NULL,
  effective_to DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### SLA Tracking
**File**: `app/admin/sla/tracking/page.tsx`

**Features**:
- Real-time uptime monitoring
- Incident tracking (downtime events)
- Auto-calculate SLA credits
- Alert on SLA breaches
- Monthly SLA reports

#### Automated Reporting
**File**: `lib/reporting/enterprise-reports.ts`

**Report Types**:
1. **Monthly Usage Report** (PDF/Excel)
   - Per-site bandwidth usage
   - Service uptime per site
   - Support tickets resolved
   - SLA compliance

2. **Financial Report**
   - Invoice summary
   - Payment history
   - Outstanding balance
   - Projected costs

3. **Performance Report**
   - Network performance metrics
   - Latency, packet loss
   - Speed test results
   - Comparison vs SLA

**Delivery**:
- Email on 1st of month
- Download from customer portal
- API endpoint for integration

---

## Phase 3C: Advanced B2B Features

**Timeline**: 2 weeks
**Priority**: P2 (Nice-to-have, competitive advantage)

### 1. Technician Management

#### Database Schema
**Table**: `technicians`

```sql
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,

  -- Employment
  employee_id VARCHAR(50),
  department VARCHAR(100), -- 'installation', 'maintenance', 'support'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'on_leave', 'inactive'

  -- Skills
  certifications JSONB, -- Array of certifications
  service_types JSONB, -- ['fiber', 'wireless', 'hybrid']

  -- Availability
  working_hours JSONB, -- {monday: {start: "08:00", end: "17:00"}, ...}
  current_location JSONB, -- {lat, lng} for dispatch

  -- Performance
  jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Assignment System
**File**: `app/admin/technicians/assign/page.tsx`

**Features**:
- View available technicians
- Filter by location, skills, availability
- Auto-suggest best match for job
- Manual assignment override
- Team assignment for large installations

#### Schedule Management
**Features**:
- Calendar view of technician schedules
- Drag-and-drop assignment
- Route optimization for multi-site jobs
- Time tracking (check-in/check-out)

---

### 2. Advanced Notifications

#### Multi-Channel System
**Channels**:
- Email (existing)
- SMS via Africa's Talking
- WhatsApp Business API
- Webhooks for API customers

#### Notification Preferences
**Database Table**: `notification_preferences`

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES business_accounts(id),
  contact_id UUID, -- Specific contact if not account-wide

  -- Preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  webhook_enabled BOOLEAN DEFAULT false,

  -- Event Subscriptions
  subscriptions JSONB, -- {order_updates: true, billing: true, incidents: false, ...}

  -- Webhook Config
  webhook_url TEXT,
  webhook_secret VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Escalation Workflows
**Logic**:
```typescript
// SLA breach escalation
const escalateIncident = async (incident) => {
  const sla = await getSLA(incident.account_id);
  const elapsed = Date.now() - incident.created_at;

  if (elapsed > sla.response_time_minutes * 60000) {
    // Breach: Notify account manager
    await sendEmail(accountManager, 'SLA Breach Alert');
    await sendSMS(accountManager, 'Urgent: SLA breach for ' + incident.account);
  }
};
```

---

### 3. Integration APIs

#### REST API
**Base URL**: `/api/v1/enterprise`

**Endpoints**:
```
GET  /api/v1/enterprise/orders              - List orders
POST /api/v1/enterprise/orders              - Create order
GET  /api/v1/enterprise/orders/{id}         - Get order details
GET  /api/v1/enterprise/sites               - List sites
GET  /api/v1/enterprise/invoices            - List invoices
GET  /api/v1/enterprise/usage/{siteId}      - Get usage data
GET  /api/v1/enterprise/sla/{accountId}     - Get SLA status
```

#### Webhook System
**Events**:
- `order.created`
- `order.activated`
- `service.suspended`
- `invoice.generated`
- `sla.breached`
- `incident.created`
- `incident.resolved`

**Payload Example**:
```json
{
  "event": "order.activated",
  "timestamp": "2025-10-20T10:30:00Z",
  "account_id": "uuid",
  "data": {
    "order_id": "uuid",
    "order_number": "BUS-20251020-0001",
    "site_name": "Head Office",
    "package": "100Mbps Fiber",
    "activation_date": "2025-10-20"
  }
}
```

#### API Documentation
**File**: `docs/api/ENTERPRISE_API.md`

**Tool**: Swagger/OpenAPI for interactive docs

**Access Control**:
- API key authentication
- Rate limiting (1000 requests/hour)
- IP whitelisting (optional)
- Audit logging

---

## Implementation Timeline

### Week 1-2: Phase 3A (B2B Foundation)
- **Days 1-3**: Business orders database + form
- **Days 4-6**: Quote system + PDF generation
- **Days 7-10**: Account management basics

### Week 3-5: Phase 3B (Enterprise Core)
- **Days 1-5**: Multi-site management + bulk import
- **Days 6-10**: Custom pricing + recurring billing
- **Days 11-15**: SLA tracking + automated reporting

### Week 6-7: Phase 3C (Advanced Features)
- **Days 1-4**: Technician management + scheduling
- **Days 5-8**: Advanced notifications + escalations
- **Days 9-12**: Integration APIs + webhooks
- **Days 13-14**: Testing + documentation

### Week 8: Polish & Launch
- **Days 1-3**: User acceptance testing
- **Days 4-5**: Performance optimization
- **Day 6-7**: Documentation + training

---

## Resource Requirements

### Development Team
- **2 Full-stack Developers** (6-8 weeks)
- **1 UI/UX Designer** (2 weeks, part-time)
- **1 QA Engineer** (4 weeks, part-time)
- **1 DevOps** (1 week for deployment)

### Third-Party Services
- **react-pdf** - PDF generation (Free)
- **Africa's Talking** - SMS/Voice (~R0.30/SMS)
- **WhatsApp Business API** - Setup fee + per-message cost
- **SendGrid/Twilio** - Transactional email (existing)

### Infrastructure
- **Additional Database Storage** - ~50GB for multi-site data
- **CDN for PDFs** - Cloudflare/Vercel (existing)
- **Background Job Queue** - For billing, reports (Redis recommended)

---

## Success Metrics

### Business KPIs
- **B2B Revenue**: 30% of total revenue within 6 months
- **Average Contract Value**: R50,000+ (vs R1,500 for B2C)
- **Enterprise Accounts**: 10+ signed within 3 months
- **Quote-to-Order Conversion**: >40%
- **Contract Renewal Rate**: >85%

### Product KPIs
- **Quote Generation Time**: <15 minutes
- **Multi-Site Order Time**: <5 minutes per site
- **SLA Compliance**: >99%
- **API Uptime**: 99.9%
- **Support Response**: <1 hour for enterprise

---

## Risk Mitigation

### Technical Risks
1. **Multi-site complexity**
   - Mitigation: Start with 10-site cap, expand gradually

2. **Payment gateway limitations**
   - Mitigation: Research enterprise payment solutions early

3. **Performance degradation**
   - Mitigation: Database indexing, caching layer

### Business Risks
1. **Sales team not ready**
   - Mitigation: B2B sales training, demo accounts

2. **Support scaling issues**
   - Mitigation: Hire enterprise support specialist

3. **Contract legal complexity**
   - Mitigation: Legal review of templates

---

## Next Steps (Immediate Actions)

1. **Get stakeholder buy-in** on roadmap
2. **Allocate development resources** (team + timeline)
3. **Create B2B pricing matrix** (packages, volume discounts)
4. **Design quote/contract templates** (legal review)
5. **Set up demo environment** for sales team
6. **Identify pilot customers** for beta testing

---

**Document End**
**For Questions**: Contact development team or product manager
**Last Updated**: 2025-10-20
