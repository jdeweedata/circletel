# Specification: Customer Dashboard Production Readiness

## 1. Executive Summary

### Overview
Transform the CircleTel customer dashboard from a prototype to a production-ready system with full database integration, automated billing, service management, and third-party integrations.

### Business Objectives
- Enable customers to manage services, view billing, and track usage self-service
- Automate recurring billing with NetCash eMandate integration
- Provide real-time usage tracking via Interstellio API
- Reduce customer support load by 40% through self-service capabilities
- Ensure FICA compliance with proper customer identification

### Scope
- Database schema enhancements (foreign keys, account numbers, service tracking)
- Legacy table consolidation (deprecate `orders`, use `consumer_orders`)
- Automated billing system (invoice generation, payment processing, pro-rata calculations)
- Service lifecycle management (activation, suspension, cancellation)
- Third-party integrations (Interstellio, NetCash eMandate, Clickatell SMS)
- Admin controls for service management
- Customer-facing dashboard updates

### Out of Scope
- B2B partner portal enhancements
- New payment gateway integrations (focus on NetCash only)
- Custom ISP equipment management
- Advanced analytics and reporting

---

## 2. Business Requirements

### BR-1: Customer Account Management
**Priority**: Critical
**Description**: Every customer must have a unique account number and proper database linkage.

**Requirements**:
- Account number format: `CT-YYYY-NNNNN` (e.g., CT-2025-00001)
- Continuous counter (no annual reset)
- Generated when customer record created
- Returning customers keep original account number
- Link customers to Supabase Auth via `auth_user_id`

### BR-2: Billing System
**Priority**: Critical
**Description**: Automated monthly recurring billing with configurable billing dates.

**Requirements**:
- User-selectable billing dates: 1st, 5th, 25th, 30th of month
- Invoices auto-generated 7 days before billing date
- Payment grace period: 3 days before marking overdue
- Pro-rata billing for mid-cycle activations
- Automatic debit order processing via NetCash eMandate
- Manual invoice generation for admins

### BR-3: Service Lifecycle
**Priority**: Critical
**Description**: Clear service states from order to cancellation.

**Service States**:
1. **pending** - Order completed, awaiting admin activation
2. **active** - Service activated, generating recurring invoices
3. **suspended** - Temporarily disabled (non-payment or request)
4. **cancelled** - Permanently terminated

**Activation Workflow**:
- Admin manually activates service with mandatory reason/notes
- Immediate pro-rata invoice generation on activation
- Service status tracked in `customer_services` table

### BR-4: Usage Tracking
**Priority**: High
**Description**: Real-time data usage tracking integrated from Interstellio API.

**Requirements**:
- Daily usage metrics (upload, download, total)
- Historical usage data stored locally
- Hourly batch sync for all active services
- Dashboard displays current billing cycle usage
- Usage warnings at 80% and 95% thresholds

### BR-5: Payment Method Management
**Priority**: High
**Description**: Customers manage payment methods with secure storage.

**Requirements**:
- NetCash eMandate/DebiCheck for debit orders
- Support multiple payment methods per customer
- One primary method for recurring billing
- Display masked details (last 4 digits only)
- OTP verification for updates
- Store in JSONB field for flexibility

### BR-6: SMS Notifications
**Priority**: Medium
**Description**: Critical event notifications via Clickatell SMS.

**10 Notification Triggers**:
1. Order confirmation
2. Service activated
3. Invoice generated
4. Payment received
5. Payment failed
6. Service suspended (non-payment)
7. Service suspended (request)
8. Payment reminder (3 days before due)
9. Payment overdue
10. Data usage warning (80%, 95%)

**Cost Optimization**:
- R0.29 per SMS
- Expected 4-6 SMS per customer/month
- R1.16-R1.74 per customer/month

---

## 3. User Stories

### Customer Stories

**US-1**: As a customer, I want to view my account number so I can reference it when contacting support.

**US-2**: As a customer, I want to see all my active services in one place so I can track what I'm paying for.

**US-3**: As a customer, I want to view my current balance and next payment date so I know when to expect charges.

**US-4**: As a customer, I want to download invoices as PDFs so I can keep records for accounting.

**US-5**: As a customer, I want to see my data usage for the current billing cycle so I know if I'm approaching my limit.

**US-6**: As a customer, I want to update my payment method so I can switch banks or cards.

**US-7**: As a customer, I want to receive SMS notifications when invoices are due so I don't miss payments.

**US-8**: As a customer, I want to see my order history and status so I can track new installations.

### Admin Stories

**US-9**: As an admin, I want to activate customer services manually so I can verify installation completion.

**US-10**: As an admin, I want to suspend services with a reason so I can handle non-payment or customer requests.

**US-11**: As an admin, I want to generate invoices on-demand so I can handle mid-cycle charges.

**US-12**: As an admin, I want to view customer billing history so I can assist with payment inquiries.

**US-13**: As an admin, I want to see an audit trail of service changes so I can track who made what changes.

### System Stories

**US-14**: As the system, I want to automatically generate invoices 7 days before billing date so customers have time to pay.

**US-15**: As the system, I want to process debit orders automatically so recurring payments happen without manual intervention.

**US-16**: As the system, I want to sync usage data hourly so dashboard data is near real-time.

**US-17**: As the system, I want to send SMS notifications for critical events so customers stay informed.

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Customer Dashboard Layer                     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Services   │   Billing    │    Usage     │   Orders     │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Layer                           │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │  /dashboard  │   /admin     │    /cron     │  /webhooks   │  │
│  │  /summary    │ /customers   │  /generate   │  /netcash    │  │
│  │  /services   │ /activate    │  /invoices   │  /payment    │  │
│  │  /billing    │ /suspend     │  /sync-usage │  /mandate    │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer (lib/)                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │  Billing     │  Service     │   Usage      │  Notification│  │
│  │  Service     │  Manager     │   Tracker    │   Service    │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   Supabase DB    │ │ Interstellio │ │  NetCash API     │
│  (PostgreSQL)    │ │     API      │ │  (eMandate)      │
└──────────────────┘ └──────────────┘ └──────────────────┘
            │                                   │
            ▼                                   ▼
┌──────────────────┐                 ┌──────────────────┐
│  Resend Email    │                 │ Clickatell SMS   │
└──────────────────┘                 └──────────────────┘
```

### 4.2 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 15, React, TypeScript | Customer dashboard UI |
| Backend | Next.js API Routes | RESTful API endpoints |
| Database | Supabase PostgreSQL | Customer data, billing, usage |
| Auth | Supabase Auth | Customer authentication |
| Payments | NetCash Pay Now + eMandate | Payment processing, debit orders |
| Usage API | Interstellio API | Real-time usage tracking |
| SMS | Clickatell | Transactional notifications |
| Email | Resend | Invoice delivery |
| Scheduling | Vercel Cron | Daily invoice generation |
| State | Zustand | Client-side state management |

### 4.3 Data Flow Diagrams

#### Invoice Generation Flow
```
┌──────────────────────────────────────────────────────────────┐
│ 1. Vercel Cron Trigger (02:00 SAST daily)                   │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Query active services with billing_date in next 7 days   │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. For each service:                                         │
│    - Calculate pro-rata amount (if applicable)               │
│    - Generate invoice with line items                        │
│    - Store in customer_invoices table                        │
│    - Auto-number: INV-YYYY-NNNNN                            │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Send invoice email (Resend)                               │
│    + SMS notification (Clickatell)                           │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Log generation in cron_execution_log                      │
└──────────────────────────────────────────────────────────────┘
```

#### Service Activation Flow
```
┌──────────────────────────────────────────────────────────────┐
│ 1. Admin clicks "Activate Service" button                   │
│    - Enter reason/notes (mandatory)                          │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. API: /api/admin/customers/[id]/services/activate          │
│    - Validate admin permissions                              │
│    - Update status: pending → active                         │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Calculate pro-rata invoice                                │
│    - Days from activation to billing date                    │
│    - Generate immediate invoice                              │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Log action in service_action_log                          │
│    - Admin user ID, timestamp, reason                        │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Send activation SMS + Email                               │
└──────────────────────────────────────────────────────────────┘
```

#### Payment Processing Flow
```
┌──────────────────────────────────────────────────────────────┐
│ 1. NetCash webhook: /api/webhooks/netcash/payment           │
│    - Verify HMAC-SHA256 signature                            │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Extract payload:                                          │
│    - Invoice ID (Extra1)                                     │
│    - Amount, TransactionAccepted, RequestTrace               │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Create payment_transaction record                         │
│    - status: completed or failed                             │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Update invoice status                                     │
│    - If accepted: paid, amount_paid, paid_date               │
│    - If failed: unpaid                                       │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Update customer_billing.account_balance                   │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Send payment confirmation SMS + Email                     │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Security Architecture

**Authentication**:
- Supabase Auth for customer login
- JWT tokens for API authentication
- RLS policies for data access control

**Authorization**:
- Customer RLS: `auth.uid() = customers.auth_user_id`
- Admin RLS: Service role access
- Permission gates for admin actions

**Data Protection**:
- Encrypted payment method storage (JSONB)
- Masked card/bank details in UI (last 4 digits)
- HTTPS only for all communications
- HMAC-SHA256 webhook signature verification

**Compliance**:
- FICA requirements for account creation
- POPIA-compliant data handling
- Audit trails for all service changes
- Data retention policies (7 years)

---

## 5. Database Schema

### 5.1 Schema Changes

#### Add Foreign Keys to consumer_orders
```sql
-- Add customer relationship columns
ALTER TABLE consumer_orders
ADD COLUMN customer_id UUID REFERENCES customers(id),
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX idx_consumer_orders_customer_id ON consumer_orders(customer_id);
CREATE INDEX idx_consumer_orders_auth_user_id ON consumer_orders(auth_user_id);
```

#### Enhance customers Table
```sql
-- Add account number system
ALTER TABLE customers
ADD COLUMN account_number VARCHAR(20) UNIQUE,
ADD COLUMN account_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
ADD COLUMN account_type VARCHAR(20) DEFAULT 'residential';

-- Create account number counter table
CREATE TABLE account_number_counter (
  id SERIAL PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate account number
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  account_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());

  -- Get or create counter for current year
  INSERT INTO account_number_counter (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET counter = account_number_counter.counter + 1,
      updated_at = NOW()
  RETURNING counter INTO next_counter;

  -- Format: CT-YYYY-NNNNN
  account_num := 'CT-' || current_year || '-' || LPAD(next_counter::TEXT, 5, '0');

  RETURN account_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate account number
CREATE TRIGGER generate_account_number_trigger
BEFORE INSERT ON customers
FOR EACH ROW
WHEN (NEW.account_number IS NULL)
EXECUTE FUNCTION assign_account_number();
```

### 5.2 New Tables

#### customer_services
```sql
CREATE TABLE customer_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES consumer_orders(id),

  -- Service details
  service_type VARCHAR(50) NOT NULL, -- 'fibre' | 'lte' | 'wireless'
  package_id UUID REFERENCES service_packages(id),
  package_name VARCHAR(255) NOT NULL,
  speed_down INTEGER, -- Mbps
  speed_up INTEGER, -- Mbps

  -- Installation
  installation_address TEXT NOT NULL,
  coordinates JSONB,
  connection_id VARCHAR(100), -- Interstellio subscriber ID

  -- Lifecycle
  status VARCHAR(50) DEFAULT 'pending', -- pending | active | suspended | cancelled
  activation_date TIMESTAMPTZ,
  suspension_date TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,

  -- Billing
  monthly_price DECIMAL(10,2) NOT NULL,
  billing_date INTEGER NOT NULL, -- 1, 5, 25, 30
  next_billing_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_billing_date CHECK (billing_date IN (1, 5, 25, 30)),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'cancelled'))
);

CREATE INDEX idx_customer_services_customer_id ON customer_services(customer_id);
CREATE INDEX idx_customer_services_status ON customer_services(status);
CREATE INDEX idx_customer_services_connection_id ON customer_services(connection_id);
CREATE INDEX idx_customer_services_billing_date ON customer_services(billing_date);
```

#### customer_billing
```sql
CREATE TABLE customer_billing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE UNIQUE,

  -- Balance
  account_balance DECIMAL(10,2) DEFAULT 0.00,
  credit_limit DECIMAL(10,2) DEFAULT 0.00,

  -- Payment method
  primary_payment_method_id UUID,
  payment_method_type VARCHAR(50), -- 'debit_order' | 'card' | 'eft'
  payment_method_details JSONB, -- Encrypted, masked details

  -- Billing preferences
  preferred_billing_date INTEGER DEFAULT 1,
  auto_pay_enabled BOOLEAN DEFAULT false,
  email_invoices BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_preferred_billing_date CHECK (preferred_billing_date IN (1, 5, 25, 30))
);

CREATE INDEX idx_customer_billing_customer_id ON customer_billing(customer_id);
```

#### customer_invoices
```sql
CREATE TABLE customer_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,

  -- Relationships
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES customer_services(id),

  -- Invoice details
  invoice_type VARCHAR(50) NOT NULL, -- 'installation' | 'recurring' | 'pro_rata' | 'adjustment'
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 15.00,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  amount_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

  -- Line items
  items JSONB NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft | sent | unpaid | partial | paid | overdue | cancelled
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  paid_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'sent', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled'))
);

-- Auto-number invoices
CREATE SEQUENCE customer_invoice_number_seq;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' ||
                        TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(nextval('customer_invoice_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
BEFORE INSERT ON customer_invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

CREATE INDEX idx_customer_invoices_customer_id ON customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX idx_customer_invoices_due_date ON customer_invoices(due_date);
```

#### customer_payment_methods
```sql
CREATE TABLE customer_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Method details
  method_type VARCHAR(50) NOT NULL, -- 'debit_order' | 'card' | 'eft'
  provider VARCHAR(100), -- 'netcash' | 'manual'

  -- Masked details (for display only)
  display_name VARCHAR(255), -- "Debit Order - FNB ***1234"
  last_four VARCHAR(4),

  -- Encrypted full details (JSONB)
  encrypted_details JSONB,

  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMPTZ,

  -- NetCash eMandate details
  mandate_id VARCHAR(255),
  mandate_status VARCHAR(50), -- 'pending' | 'active' | 'cancelled'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);
CREATE INDEX idx_customer_payment_methods_is_primary ON customer_payment_methods(is_primary);
```

#### payment_transactions
```sql
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  invoice_id UUID REFERENCES customer_invoices(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  payment_method_id UUID REFERENCES customer_payment_methods(id),

  -- Transaction details
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  payment_method VARCHAR(50),

  -- Status
  status VARCHAR(50) NOT NULL, -- 'pending' | 'completed' | 'failed' | 'refunded'

  -- NetCash details
  netcash_reference VARCHAR(255),
  netcash_response JSONB,

  -- Timestamps
  webhook_received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

#### usage_history
```sql
CREATE TABLE usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  service_id UUID NOT NULL REFERENCES customer_services(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Usage metrics
  date DATE NOT NULL,
  upload_mb DECIMAL(12,2) DEFAULT 0.00,
  download_mb DECIMAL(12,2) DEFAULT 0.00,
  total_mb DECIMAL(12,2) GENERATED ALWAYS AS (upload_mb + download_mb) STORED,

  -- Billing cycle
  billing_cycle_start DATE,
  billing_cycle_end DATE,

  -- Source
  source VARCHAR(50) DEFAULT 'interstellio', -- 'interstellio' | 'manual'
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_service_date UNIQUE (service_id, date)
);

CREATE INDEX idx_usage_history_service_id ON usage_history(service_id);
CREATE INDEX idx_usage_history_customer_id ON usage_history(customer_id);
CREATE INDEX idx_usage_history_date ON usage_history(date);
```

#### service_action_log
```sql
CREATE TABLE service_action_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  service_id UUID NOT NULL REFERENCES customer_services(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES admin_users(id),

  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'activated' | 'suspended' | 'cancelled' | 'reactivated'
  reason TEXT NOT NULL,
  notes TEXT,

  -- Previous/new state
  previous_status VARCHAR(50),
  new_status VARCHAR(50),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_action_log_service_id ON service_action_log(service_id);
CREATE INDEX idx_service_action_log_action_type ON service_action_log(action_type);
```

#### service_suspensions
```sql
CREATE TABLE service_suspensions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  service_id UUID NOT NULL REFERENCES customer_services(id) ON DELETE CASCADE,

  -- Suspension details
  suspension_type VARCHAR(50) NOT NULL, -- 'non_payment' | 'customer_request' | 'technical'
  reason TEXT NOT NULL,

  -- Dates
  suspended_at TIMESTAMPTZ NOT NULL,
  reactivated_at TIMESTAMPTZ,

  -- Billing
  skip_billing BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_suspensions_service_id ON service_suspensions(service_id);
```

#### cron_execution_log
```sql
CREATE TABLE cron_execution_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Job details
  job_name VARCHAR(100) NOT NULL, -- 'generate_invoices' | 'sync_usage' | 'process_debit_orders'
  execution_start TIMESTAMPTZ NOT NULL,
  execution_end TIMESTAMPTZ,

  -- Results
  status VARCHAR(50) NOT NULL, -- 'running' | 'success' | 'failed'
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_execution_log_job_name ON cron_execution_log(job_name);
CREATE INDEX idx_cron_execution_log_created_at ON cron_execution_log(created_at);
```

### 5.3 RLS Policies

#### customer_services
```sql
-- Customers view own services
CREATE POLICY "Customers view own services" ON customer_services
  FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Admins manage all services
CREATE POLICY "Admins manage services" ON customer_services
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

#### customer_billing
```sql
-- Customers view own billing
CREATE POLICY "Customers view own billing" ON customer_billing
  FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Customers update own payment preferences
CREATE POLICY "Customers update own billing" ON customer_billing
  FOR UPDATE
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Admins manage all billing
CREATE POLICY "Admins manage billing" ON customer_billing
  FOR ALL
  USING (auth.role() = 'service_role');
```

#### customer_invoices
```sql
-- Customers view own invoices
CREATE POLICY "Customers view own invoices" ON customer_invoices
  FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Admins manage all invoices
CREATE POLICY "Admins manage invoices" ON customer_invoices
  FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 6. API Specifications

### 6.1 Customer Dashboard APIs

#### GET /api/dashboard/summary
**Description**: Fetch complete dashboard overview

**Authentication**: Bearer token (Supabase JWT)

**Request Headers**:
```typescript
{
  "Authorization": "Bearer <access_token>"
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "0821234567",
      "accountNumber": "CT-2025-00001",
      "accountStatus": "active",
      "customerSince": "2024-01-15"
    },
    "services": [
      {
        "id": "uuid",
        "packageName": "100Mbps Fibre",
        "serviceType": "fibre",
        "status": "active",
        "monthlyPrice": 799.00,
        "installationAddress": "123 Main Street, Cape Town",
        "speedDown": 100,
        "speedUp": 100,
        "billingDate": 1,
        "nextBillingDate": "2025-12-01",
        "activationDate": "2024-01-20"
      }
    ],
    "billing": {
      "accountBalance": -150.00,
      "paymentMethod": "Debit Order - FNB ***1234",
      "paymentStatus": "overdue",
      "nextBillingDate": "2025-12-01",
      "daysOverdue": 3
    },
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-2024-00123",
        "status": "completed",
        "totalAmount": 898.00,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "invoices": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-2025-00045",
        "invoiceDate": "2025-11-01",
        "totalAmount": 918.85,
        "amountDue": 150.00,
        "status": "overdue"
      }
    ],
    "stats": {
      "activeServices": 1,
      "totalOrders": 1,
      "pendingOrders": 0,
      "overdueInvoices": 1,
      "accountBalance": -150.00
    }
  }
}
```

**Error Response**:
```typescript
{
  "success": false,
  "error": "Unauthorized"
}
```

---

#### GET /api/dashboard/services
**Description**: List customer's services with usage data

**Authentication**: Bearer token

**Response**:
```typescript
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "packageName": "100Mbps Fibre",
      "serviceType": "fibre",
      "status": "active",
      "monthlyPrice": 799.00,
      "installationAddress": "123 Main Street, Cape Town",
      "connectionId": "INT-123456",
      "usageThisCycle": {
        "uploadMb": 15000,
        "downloadMb": 85000,
        "totalMb": 100000,
        "percentUsed": 0, // Unlimited
        "billingCycleStart": "2025-11-01",
        "billingCycleEnd": "2025-11-30"
      }
    }
  ]
}
```

---

#### GET /api/dashboard/billing
**Description**: Billing summary and payment history

**Authentication**: Bearer token

**Response**:
```typescript
{
  "success": true,
  "data": {
    "summary": {
      "accountBalance": -150.00,
      "creditLimit": 0.00,
      "nextBillingDate": "2025-12-01",
      "autoPayEnabled": true
    },
    "paymentMethod": {
      "id": "uuid",
      "type": "debit_order",
      "displayName": "Debit Order - FNB ***1234",
      "lastFour": "1234",
      "isPrimary": true,
      "mandateStatus": "active"
    },
    "recentTransactions": [
      {
        "id": "uuid",
        "date": "2025-10-25",
        "type": "payment",
        "amount": 918.85,
        "status": "completed",
        "invoiceNumber": "INV-2025-00044"
      }
    ]
  }
}
```

---

#### GET /api/dashboard/invoices
**Description**: List customer invoices

**Query Parameters**:
- `status` (optional): Filter by status (unpaid, paid, overdue)
- `limit` (optional): Number of records (default: 10)
- `offset` (optional): Pagination offset

**Authentication**: Bearer token

**Response**:
```typescript
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-2025-00045",
        "invoiceDate": "2025-11-01",
        "dueDate": "2025-11-10",
        "totalAmount": 918.85,
        "amountPaid": 0.00,
        "amountDue": 918.85,
        "status": "overdue",
        "items": [
          {
            "description": "100Mbps Fibre - November 2025",
            "quantity": 1,
            "unitPrice": 799.00,
            "total": 799.00
          }
        ],
        "subtotal": 799.00,
        "vatAmount": 119.85,
        "pdfUrl": "/api/dashboard/invoices/uuid/pdf"
      }
    ],
    "pagination": {
      "total": 12,
      "limit": 10,
      "offset": 0
    }
  }
}
```

---

#### GET /api/dashboard/invoices/[id]/pdf
**Description**: Download invoice PDF

**Authentication**: Bearer token

**Response**: PDF file (Content-Type: application/pdf)

---

#### GET /api/dashboard/usage
**Description**: Usage data for current billing cycle

**Query Parameters**:
- `serviceId` (required): Service UUID
- `startDate` (optional): Start date (default: billing cycle start)
- `endDate` (optional): End date (default: today)

**Authentication**: Bearer token

**Response**:
```typescript
{
  "success": true,
  "data": {
    "service": {
      "id": "uuid",
      "packageName": "100Mbps Fibre",
      "connectionId": "INT-123456"
    },
    "billingCycle": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    },
    "totals": {
      "uploadMb": 15000,
      "downloadMb": 85000,
      "totalMb": 100000
    },
    "dailyUsage": [
      {
        "date": "2025-11-01",
        "uploadMb": 500,
        "downloadMb": 3500,
        "totalMb": 4000
      }
    ]
  }
}
```

---

#### POST /api/dashboard/payment-methods
**Description**: Add new payment method

**Authentication**: Bearer token

**Request Body**:
```typescript
{
  "methodType": "debit_order", // 'debit_order' | 'card' | 'eft'
  "displayName": "Debit Order - FNB ***1234",
  "lastFour": "1234",
  "encryptedDetails": {
    "accountNumber": "encrypted",
    "accountType": "cheque",
    "bank": "FNB",
    "branchCode": "250655"
  },
  "isPrimary": true
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "methodType": "debit_order",
    "displayName": "Debit Order - FNB ***1234",
    "isPrimary": true,
    "mandateId": "MANDATE-123456",
    "mandateStatus": "pending"
  }
}
```

---

### 6.2 Admin APIs

#### POST /api/admin/customers/[id]/services/activate
**Description**: Manually activate a service

**Authentication**: Admin session (service role)

**Permission**: `services:activate`

**Request Body**:
```typescript
{
  "serviceId": "uuid",
  "reason": "Installation completed by Technician A",
  "notes": "Fiber ONT MAC: AA:BB:CC:DD:EE:FF",
  "activationDate": "2025-11-02" // Optional, defaults to now
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "serviceId": "uuid",
    "status": "active",
    "activationDate": "2025-11-02T14:30:00Z",
    "invoice": {
      "id": "uuid",
      "invoiceNumber": "INV-2025-00046",
      "totalAmount": 645.16, // Pro-rata for remaining days
      "dueDate": "2025-11-09"
    }
  }
}
```

---

#### POST /api/admin/customers/[id]/services/suspend
**Description**: Suspend a service

**Authentication**: Admin session

**Permission**: `services:suspend`

**Request Body**:
```typescript
{
  "serviceId": "uuid",
  "suspensionType": "non_payment", // 'non_payment' | 'customer_request' | 'technical'
  "reason": "Payment overdue by 10 days",
  "skipBilling": true
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "serviceId": "uuid",
    "status": "suspended",
    "suspendedAt": "2025-11-02T15:00:00Z",
    "suspensionType": "non_payment"
  }
}
```

---

#### POST /api/admin/billing/generate-invoices-now
**Description**: Manually trigger invoice generation

**Authentication**: Admin session

**Permission**: `billing:manage`

**Request Body**:
```typescript
{
  "serviceIds": ["uuid1", "uuid2"], // Optional, all services if empty
  "invoiceDate": "2025-11-02" // Optional, defaults to today
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "generated": 25,
    "failed": 0,
    "invoices": [
      {
        "serviceId": "uuid",
        "invoiceNumber": "INV-2025-00047",
        "totalAmount": 918.85
      }
    ]
  }
}
```

---

#### GET /api/admin/customers/[id]/billing
**Description**: View customer billing details

**Authentication**: Admin session

**Permission**: `customers:view`

**Response**:
```typescript
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "accountNumber": "CT-2025-00001",
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "billing": {
      "accountBalance": -150.00,
      "creditLimit": 0.00
    },
    "invoices": [...],
    "transactions": [...],
    "services": [...]
  }
}
```

---

### 6.3 Cron Job APIs

#### POST /api/cron/generate-invoices
**Description**: Daily invoice generation (Vercel Cron)

**Schedule**: `0 2 * * *` (02:00 SAST daily)

**Authentication**: Vercel Cron secret header

**Process**:
1. Query active services with `billing_date` in next 7 days
2. Generate invoices for each service
3. Calculate pro-rata amounts if needed
4. Send email and SMS notifications
5. Log execution in `cron_execution_log`

**Response**:
```typescript
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "processed": 150,
    "failed": 2,
    "duration": "12.5s"
  }
}
```

---

#### POST /api/cron/sync-usage-data
**Description**: Hourly usage sync from Interstellio

**Schedule**: `0 * * * *` (Every hour)

**Process**:
1. Query all active services with `connection_id`
2. Fetch usage data from Interstellio API
3. Store in `usage_history` table
4. Check usage thresholds (80%, 95%)
5. Send SMS warnings if thresholds exceeded

---

#### POST /api/cron/process-debit-orders
**Description**: Process recurring debit orders

**Schedule**: `0 6 * * *` (06:00 SAST daily)

**Process**:
1. Query invoices with `due_date = today` and `status = 'unpaid'`
2. Filter customers with `auto_pay_enabled = true`
3. Submit debit orders to NetCash eMandate API
4. Update invoice status based on response

---

### 6.4 Webhook APIs

#### POST /api/webhooks/netcash/payment
**Description**: NetCash payment webhook

**Authentication**: HMAC-SHA256 signature verification

**Request Headers**:
```typescript
{
  "x-netcash-signature": "sha256_hash"
}
```

**Request Body**:
```typescript
{
  "TransactionAccepted": "true",
  "Amount": "91885", // Cents
  "Reference": "INV-2025-00045",
  "Extra1": "invoice_uuid",
  "Extra2": "INV-2025-00045",
  "RequestTrace": "NC-12345678"
}
```

**Process**:
1. Verify HMAC signature
2. Create `payment_transactions` record
3. Update invoice status
4. Update customer balance
5. Send confirmation SMS/email

**Response**:
```typescript
{
  "success": true
}
```

---

#### POST /api/webhooks/netcash/mandate
**Description**: NetCash eMandate status webhook

**Authentication**: HMAC signature

**Request Body**:
```typescript
{
  "MandateId": "MANDATE-123456",
  "Status": "active", // 'pending' | 'active' | 'cancelled'
  "CustomerId": "uuid",
  "BankAccount": "***1234"
}
```

**Process**:
1. Update `customer_payment_methods.mandate_status`
2. Send SMS notification to customer

---

## 7. Frontend Components

### 7.1 Component Hierarchy

```
app/dashboard/
├── page.tsx                           # Main dashboard
├── layout.tsx                         # Dashboard layout
├── services/page.tsx                  # Services list
├── billing/page.tsx                   # Billing overview
├── usage/page.tsx                     # Usage tracking
├── payment-method/page.tsx            # Payment methods
├── invoices/page.tsx                  # Invoice list
├── invoices/[id]/page.tsx            # Invoice detail
└── orders/page.tsx                    # Order history

components/dashboard/
├── stats/
│   ├── StatsCards.tsx                # Stats overview cards
│   └── AccountSummary.tsx            # Account number, balance
├── services/
│   ├── ServiceCard.tsx               # Individual service card
│   ├── ServiceList.tsx               # List of services
│   ├── UsageChart.tsx                # Usage visualization
│   └── ServiceManageDropdown.tsx     # Existing dropdown
├── billing/
│   ├── BillingSummary.tsx            # Balance, next payment
│   ├── InvoiceList.tsx               # Invoice table
│   ├── InvoiceCard.tsx               # Individual invoice
│   ├── PaymentMethodCard.tsx         # Payment method display
│   └── AddPaymentMethodModal.tsx     # Add payment method
├── orders/
│   ├── OrderList.tsx                 # Order history
│   └── OrderStatusBadge.tsx          # Status badges
└── usage/
    ├── UsageOverview.tsx             # Current cycle summary
    ├── DailyUsageChart.tsx           # Daily usage bar chart
    └── UsageWarningBanner.tsx        # 80%/95% warnings

components/admin/customers/
├── ServiceActionModal.tsx            # Activate/Suspend modal
├── GenerateInvoiceModal.tsx          # Manual invoice generation
├── CustomerBillingView.tsx           # Billing details
└── ServiceAuditLog.tsx               # Action history
```

### 7.2 Key Components

#### StatsCards.tsx
```typescript
interface StatsCardsProps {
  stats: {
    activeServices: number;
    accountBalance: number;
    nextBillingDate: string;
    dataUsed: number; // Percentage for capped services
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Services</CardTitle>
          <Wifi className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeServices}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.accountBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
            R {Math.abs(stats.accountBalance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.accountBalance < 0 ? 'Overdue' : 'Credit'}
          </p>
        </CardContent>
      </Card>

      {/* More stat cards... */}
    </div>
  );
}
```

---

#### ServiceCard.tsx
```typescript
interface ServiceCardProps {
  service: {
    id: string;
    packageName: string;
    status: string;
    monthlyPrice: number;
    installationAddress: string;
    speedDown: number;
    speedUp: number;
    usageThisCycle?: {
      totalMb: number;
      percentUsed: number;
    };
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{service.packageName}</CardTitle>
            <p className="text-sm text-muted-foreground">{service.installationAddress}</p>
          </div>
          <Badge className={statusColors[service.status]}>
            {service.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm">Speed</span>
            <span className="text-sm font-semibold">
              {service.speedDown}Mbps ↓ / {service.speedUp}Mbps ↑
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm">Monthly Fee</span>
            <span className="text-sm font-semibold">R {service.monthlyPrice.toFixed(2)}</span>
          </div>

          {service.usageThisCycle && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Usage This Cycle</span>
                <span className="text-sm font-semibold">
                  {(service.usageThisCycle.totalMb / 1024).toFixed(2)} GB
                </span>
              </div>
              {service.usageThisCycle.percentUsed > 0 && (
                <Progress value={service.usageThisCycle.percentUsed} className="h-2" />
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/dashboard/usage?serviceId=${service.id}`}>
            <Button variant="outline" size="sm">View Usage</Button>
          </Link>
          <ServiceManageDropdown serviceId={service.id} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### InvoiceList.tsx
```typescript
interface InvoiceListProps {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    amountDue: number;
    status: string;
  }>;
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const statusBadges = {
    paid: <Badge className="bg-green-100 text-green-800">Paid</Badge>,
    unpaid: <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>,
    overdue: <Badge className="bg-red-100 text-red-800">Overdue</Badge>,
    partial: <Badge className="bg-blue-100 text-blue-800">Partial</Badge>
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Amount Due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
            <TableCell className="text-right">R {invoice.totalAmount.toFixed(2)}</TableCell>
            <TableCell className="text-right">R {invoice.amountDue.toFixed(2)}</TableCell>
            <TableCell>{statusBadges[invoice.status]}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/invoices/${invoice.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/api/dashboard/invoices/${invoice.id}/pdf`} target="_blank">
                      Download PDF
                    </Link>
                  </DropdownMenuItem>
                  {invoice.amountDue > 0 && (
                    <DropdownMenuItem>Pay Now</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

#### ServiceActionModal.tsx (Admin)
```typescript
interface ServiceActionModalProps {
  serviceId: string;
  actionType: 'activate' | 'suspend' | 'cancel';
  onSuccess: () => void;
}

export function ServiceActionModal({ serviceId, actionType, onSuccess }: ServiceActionModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [suspensionType, setSuspensionType] = useState<'non_payment' | 'customer_request' | 'technical'>('non_payment');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const endpoint = `/api/admin/customers/[id]/services/${actionType}`;
    const body = actionType === 'suspend'
      ? { serviceId, suspensionType, reason, skipBilling: true }
      : { serviceId, reason, notes };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      toast.success(`Service ${actionType}d successfully`);
      onSuccess();
    } else {
      const error = await response.json();
      toast.error(error.error || `Failed to ${actionType} service`);
    }

    setLoading(false);
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'activate' && 'Activate Service'}
            {actionType === 'suspend' && 'Suspend Service'}
            {actionType === 'cancel' && 'Cancel Service'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {actionType === 'suspend' && (
            <div>
              <Label>Suspension Type</Label>
              <Select value={suspensionType} onValueChange={setSuspensionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_payment">Non-Payment</SelectItem>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Reason (Required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this action..."
              required
            />
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm {actionType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 8. Integration Requirements

### 8.1 Interstellio API Integration

**Purpose**: Real-time usage tracking and service management

**API Documentation**: https://docs.interstellio.io/subscriber/api/telemetry

**Endpoints**:
- `GET /api/subscribers/{connection_id}/telemetry` - Get usage data
- `GET /api/subscribers/{connection_id}/profile` - Get service details

**Authentication**: Bearer token (API key)

**Implementation**:
```typescript
// lib/integrations/interstellio/usage-service.ts

interface InterstellioUsageResponse {
  subscriber_id: string;
  date: string;
  upload_bytes: number;
  download_bytes: number;
  total_bytes: number;
}

export class InterstellioUsageService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.INTERSTELLIO_API_KEY || '';
    this.baseUrl = process.env.INTERSTELLIO_BASE_URL || 'https://api.interstellio.io';
  }

  async getUsageData(connectionId: string, startDate: string, endDate: string) {
    const response = await fetch(
      `${this.baseUrl}/api/subscribers/${connectionId}/telemetry?start=${startDate}&end=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Interstellio API error: ${response.status}`);
    }

    const data: InterstellioUsageResponse[] = await response.json();
    return data;
  }

  async syncUsageForService(serviceId: string) {
    const supabase = await createClient();

    // Get service details
    const { data: service } = await supabase
      .from('customer_services')
      .select('id, customer_id, connection_id')
      .eq('id', serviceId)
      .single();

    if (!service?.connection_id) {
      throw new Error('Service has no connection_id');
    }

    // Get last sync date
    const { data: lastUsage } = await supabase
      .from('usage_history')
      .select('date')
      .eq('service_id', serviceId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const startDate = lastUsage?.date || getServiceActivationDate(serviceId);
    const endDate = new Date().toISOString().split('T')[0];

    // Fetch usage from Interstellio
    const usageData = await this.getUsageData(service.connection_id, startDate, endDate);

    // Store in database
    const records = usageData.map(day => ({
      service_id: serviceId,
      customer_id: service.customer_id,
      date: day.date,
      upload_mb: day.upload_bytes / (1024 * 1024),
      download_mb: day.download_bytes / (1024 * 1024),
      source: 'interstellio'
    }));

    await supabase
      .from('usage_history')
      .upsert(records, { onConflict: 'service_id,date' });

    return { synced: records.length };
  }
}
```

**Cron Job Implementation**:
```typescript
// app/api/cron/sync-usage-data/route.ts

export async function POST(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const usageService = new InterstellioUsageService();

  // Get all active services with connection_id
  const { data: services } = await supabase
    .from('customer_services')
    .select('id, connection_id')
    .eq('status', 'active')
    .not('connection_id', 'is', null);

  let processed = 0;
  let failed = 0;

  for (const service of services || []) {
    try {
      await usageService.syncUsageForService(service.id);
      processed++;
    } catch (error) {
      console.error(`Failed to sync usage for service ${service.id}:`, error);
      failed++;
    }
  }

  // Log execution
  await supabase.from('cron_execution_log').insert({
    job_name: 'sync_usage_data',
    execution_start: new Date().toISOString(),
    execution_end: new Date().toISOString(),
    status: 'success',
    records_processed: processed,
    records_failed: failed
  });

  return NextResponse.json({ success: true, processed, failed });
}
```

---

### 8.2 NetCash eMandate Integration

**Purpose**: Recurring debit order processing

**API Documentation**: NetCash eMandate API

**Key Endpoints**:
- `POST /mandate/create` - Create new debit order mandate
- `GET /mandate/{id}/status` - Check mandate status
- `POST /mandate/{id}/debit` - Process debit order

**Implementation**:
```typescript
// lib/integrations/netcash/emandate-service.ts

interface CreateMandateRequest {
  customerId: string;
  accountNumber: string;
  accountType: 'cheque' | 'savings' | 'transmission';
  bank: string;
  branchCode: string;
  amount: number; // Maximum debit amount
  frequency: 'monthly';
  startDate: string;
}

export class NetCashEMandateService {
  private serviceKey: string;
  private baseUrl: string;

  constructor() {
    this.serviceKey = process.env.NETCASH_SERVICE_KEY || '';
    this.baseUrl = process.env.NETCASH_BASE_URL || 'https://gateway.netcash.co.za';
  }

  async createMandate(request: CreateMandateRequest) {
    const response = await fetch(`${this.baseUrl}/mandate/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.serviceKey}`
      },
      body: JSON.stringify({
        customer_id: request.customerId,
        account_number: request.accountNumber,
        account_type: request.accountType,
        bank: request.bank,
        branch_code: request.branchCode,
        maximum_amount: request.amount,
        frequency: request.frequency,
        start_date: request.startDate
      })
    });

    if (!response.ok) {
      throw new Error(`NetCash API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      mandateId: data.mandate_id,
      status: data.status, // 'pending_approval'
      approvalUrl: data.approval_url // Customer approves mandate
    };
  }

  async processDebitOrder(mandateId: string, invoiceId: string, amount: number) {
    const response = await fetch(`${this.baseUrl}/mandate/${mandateId}/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.serviceKey}`
      },
      body: JSON.stringify({
        amount: amount,
        reference: invoiceId,
        description: `Invoice Payment - ${invoiceId}`
      })
    });

    if (!response.ok) {
      throw new Error(`Debit order failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      transactionId: data.transaction_id,
      status: data.status // 'pending' | 'completed' | 'failed'
    };
  }
}
```

---

### 8.3 Clickatell SMS Integration

**Purpose**: Transactional SMS notifications

**Existing Implementation**: `lib/integrations/clickatell/sms-service.ts`

**10 Notification Templates**:

```typescript
// lib/notifications/sms-templates.ts

export const smsTemplates = {
  orderConfirmation: (orderNumber: string) =>
    `Thank you for your order ${orderNumber}! We'll notify you when installation is scheduled. CircleTel`,

  serviceActivated: (packageName: string) =>
    `Your ${packageName} service is now active! Welcome to CircleTel.`,

  invoiceGenerated: (invoiceNumber: string, amount: number, dueDate: string) =>
    `Invoice ${invoiceNumber} for R${amount.toFixed(2)} is ready. Due: ${dueDate}. Pay at circletel.co.za/billing`,

  paymentReceived: (amount: number, invoiceNumber: string) =>
    `Payment of R${amount.toFixed(2)} received for ${invoiceNumber}. Thank you! CircleTel`,

  paymentFailed: (invoiceNumber: string, amount: number) =>
    `Payment failed for ${invoiceNumber} (R${amount.toFixed(2)}). Please update your payment method at circletel.co.za/payment-method`,

  serviceSuspendedNonPayment: (daysOverdue: number) =>
    `Your service has been suspended due to non-payment (${daysOverdue} days overdue). Pay now to restore service.`,

  serviceSuspendedRequest: () =>
    `Your service has been suspended as requested. Contact us to reactivate.`,

  paymentReminder: (amount: number, dueDate: string) =>
    `Reminder: Payment of R${amount.toFixed(2)} due on ${dueDate}. Pay at circletel.co.za/billing to avoid suspension.`,

  paymentOverdue: (amount: number, daysOverdue: number) =>
    `URGENT: Payment of R${amount.toFixed(2)} is ${daysOverdue} days overdue. Service will be suspended if not paid within 3 days.`,

  dataUsageWarning: (percentUsed: number, packageName: string) =>
    `Data usage warning: You've used ${percentUsed}% of your ${packageName} allocation this month.`
};
```

**Notification Service**:
```typescript
// lib/notifications/notification-service.ts

import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
import { smsTemplates } from './sms-templates';

export class NotificationService {
  async sendOrderConfirmation(phone: string, orderNumber: string) {
    const message = smsTemplates.orderConfirmation(orderNumber);
    return await clickatellService.sendSMS({ to: phone, text: message });
  }

  async sendInvoiceNotification(phone: string, invoice: { number: string, amount: number, dueDate: string }) {
    const message = smsTemplates.invoiceGenerated(invoice.number, invoice.amount, invoice.dueDate);
    return await clickatellService.sendSMS({ to: phone, text: message });
  }

  async sendPaymentReminder(phone: string, amount: number, dueDate: string) {
    const message = smsTemplates.paymentReminder(amount, dueDate);
    return await clickatellService.sendSMS({ to: phone, text: message });
  }

  async sendDataUsageWarning(phone: string, percentUsed: number, packageName: string) {
    const message = smsTemplates.dataUsageWarning(percentUsed, packageName);
    return await clickatellService.sendSMS({ to: phone, text: message });
  }

  // ... more notification methods
}

export const notificationService = new NotificationService();
```

---

### 8.4 Resend Email Integration

**Purpose**: Invoice delivery and transactional emails

**Implementation**:
```typescript
// lib/integrations/resend/email-service.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(
  to: string,
  invoice: {
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    pdfUrl: string;
  }
) {
  await resend.emails.send({
    from: 'billing@circletel.co.za',
    to: to,
    subject: `Invoice ${invoice.invoiceNumber} - R${invoice.totalAmount.toFixed(2)}`,
    html: `
      <h2>Invoice ${invoice.invoiceNumber}</h2>
      <p>Dear Customer,</p>
      <p>Your invoice for R${invoice.totalAmount.toFixed(2)} is now available.</p>
      <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
      <p><a href="${invoice.pdfUrl}">Download PDF</a></p>
      <p>Thank you for choosing CircleTel!</p>
    `
  });
}
```

---

## 9. Security & Compliance

### 9.1 Data Protection

**Encryption**:
- Payment method details stored in JSONB with application-level encryption
- Sensitive fields (account numbers, card details) encrypted at rest
- TLS 1.3 for all API communications

**Masking**:
- Display last 4 digits only for card/account numbers
- Full details never returned to frontend
- Admin view requires explicit permission

**PII Handling**:
- Customer data access logged in audit trail
- POPIA-compliant data retention (7 years for financial records)
- Right to deletion process for non-active customers

### 9.2 Authentication & Authorization

**Customer Auth**:
- Supabase Auth with email/password
- Optional OTP for payment method updates
- Session timeout: 24 hours

**Admin Auth**:
- Supabase Auth with service role
- RBAC permissions enforced at API and UI layers
- Session timeout: 8 hours

**RLS Policies**:
- All customer tables filtered by `auth.uid()`
- Admin access requires `service_role`
- No direct customer access to admin tables

### 9.3 Webhook Security

**Signature Verification**:
```typescript
// All webhooks use HMAC-SHA256 verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Idempotency**:
- Transaction IDs used to prevent duplicate processing
- `payment_transactions` table enforces unique `transaction_id`

**Rate Limiting**:
- Webhook endpoints limited to 100 requests/minute per IP
- Vercel Edge Functions handle DDoS protection

### 9.4 FICA Compliance

**Requirements**:
- ID number stored in `customers.id_number`
- Proof of residence verified during onboarding
- Bank account verification for debit orders

**Audit Trail**:
- All service status changes logged in `service_action_log`
- Payment transactions stored for 7 years
- Admin actions tracked with user ID and timestamp

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Coverage Target**: 80%

**Key Test Files**:
```
lib/billing/__tests__/invoice-generator.test.ts
lib/billing/__tests__/pro-rata-calculator.test.ts
lib/integrations/interstellio/__tests__/usage-service.test.ts
lib/integrations/netcash/__tests__/emandate-service.test.ts
lib/notifications/__tests__/notification-service.test.ts
```

**Example Test**:
```typescript
// lib/billing/__tests__/invoice-generator.test.ts

describe('Invoice Generator', () => {
  it('should generate pro-rata invoice for mid-cycle activation', async () => {
    const service = {
      monthlyPrice: 799.00,
      activationDate: '2025-11-15',
      billingDate: 1
    };

    const invoice = await generateProRataInvoice(service);

    // 16 days from Nov 15 to Nov 30 (activation to next billing cycle)
    const expectedAmount = (799.00 / 30) * 16; // ~426.93
    const expectedVat = expectedAmount * 0.15; // ~64.04
    const expectedTotal = expectedAmount + expectedVat; // ~490.97

    expect(invoice.subtotal).toBeCloseTo(expectedAmount, 2);
    expect(invoice.vatAmount).toBeCloseTo(expectedVat, 2);
    expect(invoice.totalAmount).toBeCloseTo(expectedTotal, 2);
  });

  it('should generate full monthly invoice for billing date', async () => {
    const service = {
      id: 'uuid',
      monthlyPrice: 799.00,
      billingDate: 1
    };

    const invoice = await generateMonthlyInvoice(service);

    expect(invoice.subtotal).toBe(799.00);
    expect(invoice.vatAmount).toBe(119.85);
    expect(invoice.totalAmount).toBe(918.85);
  });
});
```

### 10.2 Integration Tests

**Test Scenarios**:

1. **Service Activation Flow**:
   - Admin activates service → Pro-rata invoice generated → SMS sent → Service status updated

2. **Payment Processing Flow**:
   - NetCash webhook received → Signature verified → Payment recorded → Invoice updated → Customer notified

3. **Usage Sync Flow**:
   - Cron job triggered → Interstellio API called → Usage data stored → Thresholds checked → Warnings sent

4. **Billing Cycle Flow**:
   - Cron job triggered → Services queried → Invoices generated → Emails sent → SMS sent

**Example Test**:
```typescript
// tests/api/service-activation.test.ts

describe('Service Activation Integration', () => {
  it('should complete full activation flow', async () => {
    const service = await createTestService({ status: 'pending' });

    // 1. Admin activates service
    const response = await fetch('/api/admin/customers/123/services/activate', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: service.id,
        reason: 'Installation completed',
        activationDate: '2025-11-15'
      })
    });

    expect(response.status).toBe(200);

    // 2. Verify service status updated
    const updatedService = await getServiceById(service.id);
    expect(updatedService.status).toBe('active');
    expect(updatedService.activationDate).toBe('2025-11-15');

    // 3. Verify pro-rata invoice generated
    const invoices = await getInvoicesByService(service.id);
    expect(invoices.length).toBe(1);
    expect(invoices[0].invoiceType).toBe('pro_rata');

    // 4. Verify action logged
    const logs = await getServiceActionLog(service.id);
    expect(logs[0].actionType).toBe('activated');
    expect(logs[0].reason).toBe('Installation completed');

    // 5. Verify SMS sent (mock)
    expect(mockClickatell.sendSMS).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('service is now active')
      })
    );
  });
});
```

### 10.3 End-to-End Tests

**Playwright Test Suite**:

```typescript
// tests/e2e/customer-dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Customer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'customer@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display account number and services', async ({ page }) => {
    await expect(page.locator('[data-testid="account-number"]')).toContainText('CT-2025-');
    await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
  });

  test('should download invoice PDF', async ({ page }) => {
    await page.goto('/dashboard/billing');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-invoice-btn"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/INV-\d{4}-\d{5}\.pdf/);
  });

  test('should view usage data', async ({ page }) => {
    await page.goto('/dashboard/usage');

    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-usage"]')).toContainText('GB');
  });
});
```

### 10.4 Load Testing

**Scenarios**:
- 100 concurrent invoice generations
- 500 concurrent usage syncs
- 1000 webhook requests per minute

**Tools**: k6, Artillery

---

## 11. Deployment Plan

### 11.1 Pre-Deployment Checklist

**Database**:
- [ ] Run migrations on staging environment
- [ ] Backfill `consumer_orders` customer_id and auth_user_id
- [ ] Verify RLS policies
- [ ] Test account number generation

**Environment Variables**:
- [ ] INTERSTELLIO_API_KEY
- [ ] INTERSTELLIO_BASE_URL
- [ ] NETCASH_EMANDATE_KEY
- [ ] NETCASH_WEBHOOK_SECRET
- [ ] CLICKATELL_API_KEY
- [ ] RESEND_API_KEY
- [ ] CRON_SECRET

**Integrations**:
- [ ] Test Interstellio API connection
- [ ] Test NetCash eMandate sandbox
- [ ] Test Clickatell SMS delivery
- [ ] Test Resend email delivery

**Cron Jobs**:
- [ ] Configure Vercel Cron jobs (generate-invoices, sync-usage, process-debit-orders)
- [ ] Set up cron monitoring alerts

### 11.2 Migration Strategy

**Phase 1: Database Schema (Week 1)**
1. Deploy schema changes to staging
2. Test migrations with production data snapshot
3. Deploy to production (low-traffic window)
4. Verify data integrity

**Phase 2: Backfill Data (Week 1)**
1. Run backfill script for `consumer_orders` foreign keys
2. Handle orphaned orders (manual review queue)
3. Verify all orders linked to customers

**Phase 3: API Deployment (Week 2)**
1. Deploy new API endpoints
2. Enable feature flags for dashboard modules
3. Monitor error rates and performance

**Phase 4: Cron Jobs (Week 2)**
1. Deploy cron job endpoints
2. Enable Vercel Cron schedules
3. Monitor first execution cycles

**Phase 5: Customer Rollout (Week 3)**
1. Enable dashboard for beta customers (10%)
2. Collect feedback and fix issues
3. Gradual rollout to 100%

### 11.3 Rollback Plan

**Database Rollback**:
- Keep migration reversal scripts ready
- Snapshot database before each phase
- 4-hour rollback window

**API Rollback**:
- Use Vercel deployment rollback
- Feature flags to disable new modules
- Keep legacy endpoints running in parallel

**Monitoring**:
- Sentry for error tracking
- Vercel Analytics for performance
- Custom dashboard for cron job execution

### 11.4 Post-Deployment Verification

**Day 1**:
- [ ] Verify invoice generation cron job runs successfully
- [ ] Check usage sync cron job logs
- [ ] Monitor webhook processing (NetCash)
- [ ] Verify SMS notifications sent

**Week 1**:
- [ ] Review customer support tickets for dashboard issues
- [ ] Analyze usage patterns and performance metrics
- [ ] Verify debit order processing
- [ ] Check invoice delivery rates (email + SMS)

**Week 2**:
- [ ] Review billing accuracy
- [ ] Verify pro-rata calculations
- [ ] Check payment reconciliation
- [ ] Analyze cron job performance

---

## 12. Success Metrics

### 12.1 Business Metrics

**Customer Satisfaction**:
- **Target**: 90% dashboard satisfaction rating
- **Measurement**: Post-login survey

**Support Reduction**:
- **Target**: 40% reduction in billing-related support tickets
- **Measurement**: Zendesk ticket analysis

**Payment Efficiency**:
- **Target**: 80% of invoices paid within 7 days
- **Measurement**: Invoice aging report

**Service Activation**:
- **Target**: Average 24-hour activation time
- **Measurement**: Time from order completion to service activation

### 12.2 Technical Metrics

**API Performance**:
- **Target**: 95th percentile response time < 500ms
- **Measurement**: Vercel Analytics

**Cron Job Success Rate**:
- **Target**: 99.5% successful executions
- **Measurement**: `cron_execution_log` table

**Webhook Processing**:
- **Target**: 100% webhook signature verification
- **Measurement**: Webhook error logs

**Usage Sync Accuracy**:
- **Target**: < 1% discrepancy between Interstellio and local data
- **Measurement**: Daily reconciliation report

### 12.3 Financial Metrics

**Debit Order Success Rate**:
- **Target**: 85% successful debit orders
- **Measurement**: NetCash transaction reports

**SMS Cost Optimization**:
- **Target**: Average 5 SMS per customer/month (R1.45/month)
- **Measurement**: Clickatell billing reports

**Revenue Collection**:
- **Target**: 95% of billed revenue collected within 30 days
- **Measurement**: Accounts receivable aging

---

## 13. Appendices

### 13.1 Reusable Components

**Existing Components to Leverage**:
- `lib/invoices/invoice-generator.ts` - Invoice generation logic
- `lib/payments/payment-processor.ts` - NetCash webhook processing
- `lib/integrations/clickatell/sms-service.ts` - SMS delivery
- `components/dashboard/QuickActionCards.tsx` - Dashboard cards
- `components/dashboard/ServiceManageDropdown.tsx` - Service actions
- `lib/types/billing.ts` - Billing type definitions

**New Components Required**:
- `lib/billing/billing-service.ts` - Billing logic (pro-rata, recurring)
- `lib/services/service-manager.ts` - Service lifecycle management
- `lib/integrations/interstellio/usage-service.ts` - Usage tracking
- `lib/integrations/netcash/emandate-service.ts` - Debit order processing
- `lib/notifications/notification-service.ts` - Multi-channel notifications

### 13.2 Database Migration Scripts

**Migration 1: Add Foreign Keys**:
```sql
-- File: 20251110000001_add_consumer_orders_foreign_keys.sql
ALTER TABLE consumer_orders
ADD COLUMN customer_id UUID REFERENCES customers(id),
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_consumer_orders_customer_id ON consumer_orders(customer_id);
CREATE INDEX idx_consumer_orders_auth_user_id ON consumer_orders(auth_user_id);
```

**Migration 2: Backfill Customer IDs**:
```sql
-- File: 20251110000002_backfill_consumer_orders_customers.sql
WITH matched_customers AS (
  SELECT
    co.id AS order_id,
    c.id AS customer_id,
    c.auth_user_id
  FROM consumer_orders co
  JOIN customers c ON c.email = co.email
)
UPDATE consumer_orders
SET
  customer_id = mc.customer_id,
  auth_user_id = mc.auth_user_id
FROM matched_customers mc
WHERE consumer_orders.id = mc.order_id;
```

**Migration 3: Account Number System**:
```sql
-- File: 20251110000003_add_account_number_system.sql
-- (See section 5.1 for full script)
```

**Migration 4: Create Service Tables**:
```sql
-- File: 20251110000004_create_customer_services.sql
-- (See section 5.2 for full script)
```

### 13.3 API Request/Response Examples

See Section 6 for comprehensive API specifications with request/response examples.

### 13.4 Glossary

- **Pro-rata**: Proportional billing for partial billing periods
- **eMandate**: Electronic debit order authorization (NetCash)
- **DebiCheck**: PASA-approved debit order authentication system
- **RLS**: Row Level Security (Supabase PostgreSQL)
- **FICA**: Financial Intelligence Centre Act (South African compliance)
- **POPIA**: Protection of Personal Information Act (South African data protection)
- **SAST**: South African Standard Time (UTC+2)
- **VAT**: Value Added Tax (15% in South Africa)
- **MRR**: Monthly Recurring Revenue

---

## Document Control

**Version**: 1.0
**Date**: 2025-11-02
**Author**: Spec Writer Agent
**Spec ID**: 2025-11-01-customer-dashboard-production
**Status**: Ready for Implementation

**Change Log**:
- 2025-11-02: Initial specification created
- Requirements gathered from planning phase
- Technical decisions documented
- Integration requirements specified
- Database schema designed
- API specifications completed

**Approval Required From**:
- Product Owner
- Technical Lead
- DevOps Engineer (infrastructure requirements)
- Security Officer (compliance review)

---

**End of Specification**
