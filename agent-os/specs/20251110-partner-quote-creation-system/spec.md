# Partner Quote Creation & Technical Resources System

**Spec ID:** 20251110-partner-quote-creation-system
**Created:** 2025-11-10
**Status:** Planning
**Priority:** CRITICAL
**Estimated Effort:** 66 Story Points (6 weeks)

---

## Executive Summary

Enable CircleTel sales partners to create and manage B2B quotes independently, with self-service access to technical product information and training resources. This addresses critical partner feedback indicating current admin-only quote creation is blocking sales.

**Business Impact:**
- Reduce quote turnaround time from days to hours
- Enable partners to respond to clients in real-time
- Scale sales capacity without increasing admin overhead
- Improve partner confidence through technical knowledge access

**Key Partner (Erhard) Requirements:**
1. Create quotes for multiple locations without full client details
2. Present costings to clients directly (partner-controlled)
3. Access technical information: on-net vs off-net, contention ratios, network aggregation
4. Product and network training resources

---

## Table of Contents

1. [User Stories](#user-stories)
2. [Current State Analysis](#current-state-analysis)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Implementation Phases](#implementation-phases)
6. [Task Breakdown](#task-breakdown)
7. [API Specifications](#api-specifications)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)
10. [Risks & Mitigations](#risks--mitigations)

---

## User Stories

### Epic 1: Partner Quote Creation

**US-1.1: Create Draft Quote**
```
As a sales partner
I want to create draft B2B quotes with partial customer information
So that I can quickly respond to client inquiries without waiting for admin
```

**Acceptance Criteria:**
- Partner can access quote creation form at `/partners/quotes/new`
- Form allows partial customer details (company name only, can add full details later)
- Partner can add multiple service line items (primary, secondary, additional)
- Quote saves as draft status
- Partner can see all their quotes in `/partners/quotes`

**US-1.2: Submit Quote for Approval**
```
As a sales partner
I want to submit draft quotes for admin approval
So that pricing can be reviewed before sending to clients
```

**Acceptance Criteria:**
- Partner can submit draft quote for approval
- Admin receives notification of pending quote
- Quote status changes from 'draft' to 'pending_approval'
- Partner can add notes explaining special requirements or discount requests
- Partner cannot modify quote while pending approval

**US-1.3: Multi-Location Quoting**
```
As a sales partner
I want to create quotes for multiple client locations simultaneously
So that I can efficiently quote enterprise clients with multi-site requirements
```

**Acceptance Criteria:**
- Partner can duplicate existing quotes
- Partner can bulk-select service packages for multiple addresses
- Each location tracked as separate quote with shared customer details
- Partner can see grouped view of multi-location opportunities

### Epic 2: Quote Management & Sharing

**US-2.1: Admin Approval Workflow**
```
As an admin
I want to review and approve partner-created quotes
So that pricing and terms meet company standards
```

**Acceptance Criteria:**
- Admin can access approval queue at `/admin/partners/quotes/pending`
- Admin can view full quote details
- Admin can edit pricing/discounts before approval
- Admin can approve or reject with feedback
- Partner receives email notification of approval/rejection

**US-2.2: Send Approved Quote to Client**
```
As a sales partner
I want to send admin-approved quotes directly to clients
So that I control the sales process and timing
```

**Acceptance Criteria:**
- Partner can generate shareable link for approved quote
- Partner can email quote directly from portal
- Quote includes partner branding (logo, contact info)
- Partner receives notification when client views quote
- Partner can track quote analytics (views, time spent, device)

### Epic 3: Technical Knowledge Base

**US-3.1: On-Net Coverage Lookup**
```
As a sales partner
I want to check if an address is on-net or off-net
So that I can advise clients on deployment timelines and costs
```

**Acceptance Criteria:**
- Partner can search address at `/partners/resources/technical/coverage`
- System shows: on-net status, network provider, estimated activation days
- Partner can see what "on-net" means (definition + diagram)
- Results explain if third-party provider required

**US-3.2: Contention Ratio Information**
```
As a sales partner
I want to understand contention ratios for each product
So that I can explain service levels to clients and compare with competitors
```

**Acceptance Criteria:**
- Partner can view contention guide at `/partners/resources/technical/contention`
- Each product shows contention ratio (e.g., 1:10, 1:1)
- Interactive explainer shows what contended vs uncontended means
- Partner can see when to recommend each type

**US-3.3: Network Architecture Knowledge**
```
As a sales partner
I want to understand CircleTel's network topology
So that I can answer client questions about aggregation and redundancy
```

**Acceptance Criteria:**
- Partner can view network diagram at `/partners/resources/technical/network`
- Diagram shows ENNI, GNNI, and interconnections
- Partner can see aggregation options for multi-site clients
- Documentation explains failover and redundancy capabilities

### Epic 4: Partner Training

**US-4.1: Product Certifications**
```
As a sales partner
I want to complete product training modules
So that I can confidently position CircleTel solutions
```

**Acceptance Criteria:**
- Partner can access training at `/partners/resources/training`
- Training modules cover: BizFibre, HomeFibre, MTN 5G/LTE, SkyFibre
- Partner progress tracked per module
- Partner receives certificate upon module completion
- Quizzes validate understanding

**US-4.2: Sales Playbooks**
```
As a sales partner
I want access to sales playbooks
So that I can follow proven discovery and positioning frameworks
```

**Acceptance Criteria:**
- Partner can download playbooks as PDF
- Playbooks cover: discovery questions, needs assessment, objection handling
- Competitive positioning guides included
- Case studies and success stories available

---

## Current State Analysis

### Partner Portal Infrastructure: 95% Complete

**✅ Existing Features:**
- 9 partner pages (dashboard, registration, leads, commissions, resources, profile)
- Authentication & authorization (needs debugging)
- FICA/CIPC compliance onboarding (13 document categories)
- Lead assignment and tracking
- Commission tracking
- Activity logging (calls, emails, meetings)
- RLS policies isolating partner data
- Private Supabase Storage bucket for compliance documents

**❌ Missing Features:**
- Self-service quote creation (admin-only currently)
- Quote presentation/sharing for partners
- Technical knowledge base (on-net/off-net, contention, network)
- Structured training resources

### B2B Quote System: 100% Admin, 0% Partner

**✅ Admin Capabilities:**
- Comprehensive quote builder (`/admin/quotes/new`)
- Quote detail/edit pages
- Quote analytics dashboard
- Quote sharing system with tracking
- Multi-service line items
- Custom discount capability
- Quote versioning
- Digital signature capture

**❌ Partner Gaps:**
- No partner quote creation
- No partner quote management
- No partner-branded quotes
- No partner sharing capability

### Technical Documentation: 79 Product Files, Unorganized

**✅ Existing Documentation:**
- 79 product specification files in `docs/products/01_ACTIVE_PRODUCTS/`
- Categories: BizFibre, HomeFibre, MTN 5G/LTE, SkyFibre, Managed Services
- Detailed technical specs, pricing guidelines, SLAs

**❌ Missing for Partners:**
- Not organized for partner consumption
- No searchable knowledge base
- No training modules or certifications
- No competitive positioning guides
- On-net vs off-net info not exposed
- Contention ratios not labeled

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Partner Portal UI                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │   Quotes    │  │  Technical  │  │   Training   │   │
│  │  Management │  │  Resources  │  │    Portal    │   │
│  └─────────────┘  └─────────────┘  └──────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    ┌────▼────┐            ┌──────▼──────┐
    │ Partner  │            │   Admin     │
    │  Quote   │            │  Approval   │
    │   API    │◄───────────┤    API      │
    └────┬────┘            └──────┬──────┘
         │                        │
    ┌────▼─────────────────────────▼────┐
    │      Supabase PostgreSQL           │
    │  ┌────────────┐  ┌──────────────┐ │
    │  │business_   │  │ partner_     │ │
    │  │  quotes    │  │  permissions │ │
    │  └────────────┘  └──────────────┘ │
    │  ┌────────────┐  ┌──────────────┐ │
    │  │service_    │  │  partner_    │ │
    │  │ packages   │  │  training    │ │
    │  └────────────┘  └──────────────┘ │
    └────────────────────────────────────┘
```

### Authentication Flow

```
Partner Login
     │
     ▼
PartnerAuthProvider
     │
     ├─ Checks auth.uid()
     │
     ├─ Queries partners table
     │
     ├─ Loads permissions
     │
     └─ Sets session context
          │
          ▼
     Partner Dashboard
          │
          ├─ Create Quote?
          │   └─> Check: can_create_quotes = TRUE
          │
          ├─ View Technical Docs?
          │   └─> Check: partner.tier (all have access)
          │
          └─ Complete Training?
              └─> Check: partner.status = 'verified'
```

### Quote Creation Flow

```
Partner Creates Quote (Draft)
         │
         ▼
    Saves to DB
  (partner_id tracked)
         │
         ▼
Partner Submits for Approval
         │
         ▼
Admin Receives Notification
         │
         ├─ Approve ─────────┐
         │                   │
         ├─ Reject           │
         │   │               │
         │   ▼               ▼
         │  Partner      Quote Status
         │  Notified     = 'approved'
         │               │
         │               ▼
         │       Partner Generates
         │       Share Link
         │               │
         │               ▼
         │       Partner Sends
         │       to Client
         │               │
         │               ▼
         │       Client Views
         │       (Tracking)
         │               │
         │               ▼
         │       Client Accepts/
         │       Rejects
         │               │
         │               ▼
         └───────► Admin Creates
                   Order (if accepted)
```

---

## Database Schema

### New Tables

#### partner_training_progress
```sql
CREATE TABLE partner_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL,
  module_name VARCHAR(200),
  status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    -- not_started | in_progress | completed
  score INTEGER CHECK (score >= 0 AND score <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(partner_id, module_id)
);

CREATE INDEX idx_partner_training_partner ON partner_training_progress(partner_id);
CREATE INDEX idx_partner_training_status ON partner_training_progress(status);
```

#### partner_quote_activities
```sql
CREATE TABLE partner_quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
    -- created | submitted | approved | rejected | modified | sent | viewed_by_client
  admin_id UUID REFERENCES admin_users(id),
  notes TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_quote_activities_quote ON partner_quote_activities(quote_id);
CREATE INDEX idx_partner_quote_activities_partner ON partner_quote_activities(partner_id);
CREATE INDEX idx_partner_quote_activities_type ON partner_quote_activities(activity_type);
```

### Modified Tables

#### business_quotes (add partner tracking)
```sql
ALTER TABLE business_quotes
  ADD COLUMN partner_id UUID REFERENCES partners(id),
  ADD COLUMN is_draft BOOLEAN DEFAULT TRUE,
  ADD COLUMN partner_notes TEXT,
  ADD COLUMN admin_approval_status VARCHAR(50) DEFAULT 'pending',
    -- pending | approved | rejected | changes_requested
  ADD COLUMN approved_by UUID REFERENCES admin_users(id),
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN partner_share_token TEXT UNIQUE,
  ADD COLUMN partner_share_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN partner_share_expires_at TIMESTAMPTZ;

CREATE INDEX idx_business_quotes_partner ON business_quotes(partner_id);
CREATE INDEX idx_business_quotes_approval_status ON business_quotes(admin_approval_status);
CREATE INDEX idx_business_quotes_partner_share_token ON business_quotes(partner_share_token);
```

#### partners (add quote permissions)
```sql
ALTER TABLE partners
  ADD COLUMN can_create_quotes BOOLEAN DEFAULT TRUE,
  ADD COLUMN quote_approval_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN max_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN max_quote_value DECIMAL(10,2),
  ADD COLUMN monthly_quote_limit INTEGER DEFAULT 50;

-- Update existing partners
UPDATE partners
SET can_create_quotes = TRUE,
    quote_approval_required = TRUE
WHERE status = 'verified';
```

#### service_packages (add technical fields)
```sql
ALTER TABLE service_packages
  ADD COLUMN contention_ratio VARCHAR(10), -- e.g., "1:10", "1:1", "Uncontended"
  ADD COLUMN is_contended BOOLEAN DEFAULT TRUE,
  ADD COLUMN contention_notes TEXT,
  ADD COLUMN delivery_method VARCHAR(50), -- 'on-net', 'off-net', 'third-party'
  ADD COLUMN aggregation_type VARCHAR(50), -- 'ENNI', 'GNNI', 'direct'
  ADD COLUMN aggregation_notes TEXT,
  ADD COLUMN partner_visible BOOLEAN DEFAULT TRUE;

-- Populate existing BizFibre packages
UPDATE service_packages
SET
  contention_ratio = '1:10',
  is_contended = TRUE,
  contention_notes = 'Shared bandwidth with guaranteed minimum speed',
  delivery_method = 'on-net',
  aggregation_type = 'ENNI'
WHERE service_type = 'BizFibreConnect';

CREATE INDEX idx_service_packages_contention ON service_packages(is_contended);
CREATE INDEX idx_service_packages_delivery ON service_packages(delivery_method);
```

#### fttb_coverage_areas (add on-net flag)
```sql
ALTER TABLE fttb_coverage_areas
  ADD COLUMN is_on_net BOOLEAN DEFAULT FALSE,
  ADD COLUMN delivery_type VARCHAR(50), -- 'direct', 'third_party', 'wholesale'
  ADD COLUMN on_net_notes TEXT;

CREATE INDEX idx_fttb_coverage_on_net ON fttb_coverage_areas(is_on_net);
```

#### fttb_network_providers (add partner info)
```sql
ALTER TABLE fttb_network_providers
  ADD COLUMN is_on_net BOOLEAN DEFAULT FALSE,
  ADD COLUMN aggregation_details JSONB,
    -- {type: 'ENNI', capacity: '10Gbps', redundancy: 'dual'}
  ADD COLUMN partner_visible BOOLEAN DEFAULT TRUE,
  ADD COLUMN partner_notes TEXT;
```

### RLS Policies

#### business_quotes - Partner Access
```sql
-- Partners can view their own quotes
CREATE POLICY "partners_view_own_quotes"
  ON business_quotes FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can create quotes
CREATE POLICY "partners_create_quotes"
  ON business_quotes FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id = auth.uid()
      AND can_create_quotes = TRUE
      AND status = 'verified'
    )
  );

-- Partners can update their draft quotes
CREATE POLICY "partners_update_draft_quotes"
  ON business_quotes FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
    AND is_draft = TRUE
    AND admin_approval_status = 'pending'
  );

-- Admins can view all quotes (existing policy retained)
-- Admins can approve/reject (new policy)
CREATE POLICY "admins_manage_partner_quotes"
  ON business_quotes FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = TRUE
    )
  );
```

#### partner_training_progress - Partner Access
```sql
-- Partners can view their own training progress
CREATE POLICY "partners_view_own_training"
  ON partner_training_progress FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can update their own training progress
CREATE POLICY "partners_update_own_training"
  ON partner_training_progress FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all training records
CREATE POLICY "service_role_all_training"
  ON partner_training_progress FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## Implementation Phases

### Phase 1: Critical MVP (Week 1) - 24 Story Points

**Goal:** Unblock partner Erhard with minimum viable quote creation capability

#### Sprint 1.1: Fix Partner Authentication (Day 1) - 3 SP

**Objective:** Resolve partner portal blank page issues

**Tasks:**
- Debug CustomerAuthProvider conflicts with partner pages
- Add partner page exclusions to CustomerAuthProvider
- Test all 9 partner pages with clean browser session
- Verify session persistence across page navigation

**Acceptance Criteria:**
- [ ] Partner can log in successfully
- [ ] All 9 partner pages load without blank screens
- [ ] No Supabase client conflicts in console
- [ ] Session persists across page refreshes

#### Sprint 1.2: Partner Quote Database (Day 1-2) - 5 SP

**Objective:** Extend database for partner quote tracking

**Tasks:**
- Create migration: Add partner_id to business_quotes
- Create migration: Add approval workflow columns
- Create migration: Add partner permissions to partners table
- Update RLS policies for partner quote access
- Test policies with partner and admin accounts

**Acceptance Criteria:**
- [ ] Migrations run successfully on local
- [ ] Migrations run successfully on staging
- [ ] RLS policies tested with both partner and admin users
- [ ] Partners can only see their own quotes
- [ ] Admins can see all quotes

#### Sprint 1.3: Partner Quote Creation UI (Days 2-4) - 13 SP

**Objective:** Build partner-facing quote creation interface

**Tasks:**
- Create `/partners/quotes/page.tsx` - Quote list page
  - Show partner's quotes grouped by status (draft, pending, approved, rejected)
  - Filter by date range, customer, status
  - Search by quote number or company name
  - Card-based layout with key metrics

- Create `/partners/quotes/new/page.tsx` - Quote builder
  - Clone admin quote form, simplify for partner use
  - Company/contact information section
  - Address autocomplete (Google Maps integration)
  - Service package selection (multi-item)
  - Save as draft functionality
  - Submit for approval button
  - Client-side validation

- Create API route `POST /api/partners/quotes/create`
  - Validate partner permissions
  - Create quote with partner_id
  - Set is_draft = true
  - Set admin_approval_status = 'pending' if submitted
  - Return quote ID and number

- Create API route `GET /api/partners/quotes/list`
  - Fetch partner's quotes
  - Include pagination
  - Include filter/search parameters
  - Return quote summaries with item counts

**Acceptance Criteria:**
- [ ] Partner can access `/partners/quotes` and see empty state
- [ ] Partner can click "Create Quote" and see form
- [ ] Partner can fill company name, contact info, address
- [ ] Partner can add 3+ service line items
- [ ] Partner can save as draft (not submitted)
- [ ] Partner can submit for approval
- [ ] Quote appears in partner's quote list
- [ ] Quote shows correct status badge

#### Sprint 1.4: Admin Approval Queue (Day 5) - 3 SP

**Objective:** Enable admins to approve/reject partner quotes

**Tasks:**
- Create `/admin/partners/quotes/pending` page
  - List all pending partner quotes
  - Show partner name, company, total value
  - Filter by partner, date submitted
  - Card-based layout with quick actions

- Add approve/reject functionality
  - Approve: Sets admin_approval_status = 'approved', approved_by, approved_at
  - Reject: Sets admin_approval_status = 'rejected', rejection_reason
  - Send email notification to partner

- Create API route `POST /api/admin/partners/quotes/[id]/approve`
  - Validate admin permissions
  - Update quote status
  - Log activity in partner_quote_activities
  - Trigger email notification

- Create API route `POST /api/admin/partners/quotes/[id]/reject`
  - Validate admin permissions
  - Update quote status with reason
  - Log activity
  - Trigger email notification

**Acceptance Criteria:**
- [ ] Admin can access approval queue
- [ ] Admin sees all pending partner quotes
- [ ] Admin can click "View Details" to see full quote
- [ ] Admin can approve quote
- [ ] Admin can reject quote with reason
- [ ] Partner receives email notification of approval
- [ ] Partner receives email notification of rejection
- [ ] Quote status updates in partner's list

**Phase 1 Deliverables:**
- Partner can create draft quotes ✅
- Partner can submit quotes for approval ✅
- Admin can approve/reject quotes ✅
- Email notifications working ✅

---

### Phase 2: Complete Quote System (Weeks 2-3) - 21 Story Points

**Goal:** Full-featured quote management and sharing for partners

#### Sprint 2.1: Partner Quote Management (Week 2) - 13 SP

**Tasks:**
- Create `/partners/quotes/[id]/page.tsx` - Quote detail/edit
  - View full quote details
  - Edit draft quotes (before submission)
  - View approval status and feedback
  - Activity timeline (created, submitted, approved, viewed by client)
  - Version history

- Add quote editing capability
  - Partner can modify draft quotes only
  - Cannot edit after submission (pending approval)
  - Can edit after rejection (must resubmit)
  - Save changes with version tracking

- Add quote duplication
  - "Duplicate Quote" button on quote detail
  - Copies all details except quote number
  - Creates new draft quote
  - Useful for multi-location quoting

- Add bulk quote creation
  - "Create Multi-Location Quote" wizard
  - Step 1: Enter customer details (shared across all)
  - Step 2: Add locations (addresses)
  - Step 3: Select services per location
  - Creates separate quote for each location
  - Links quotes together (parent_quote_id)

- Create `/partners/quotes/[id]/preview/page.tsx`
  - Public-facing preview (what client will see)
  - Partner-branded layout
  - Print-friendly CSS
  - PDF download button

**Acceptance Criteria:**
- [ ] Partner can view full quote details
- [ ] Partner can edit draft quotes
- [ ] Partner cannot edit pending/approved quotes
- [ ] Partner can duplicate existing quote
- [ ] Partner can create bulk quotes (3+ locations)
- [ ] Partner can preview quote before sending
- [ ] Activity timeline shows all status changes

#### Sprint 2.2: Partner Quote Sharing (Week 3) - 8 SP

**Tasks:**
- Enable share link generation for partners
  - Add "Share Quote" button to approved quotes
  - Generate crypto-secure token (partner_share_token)
  - Set expiration date (configurable, default 30 days)
  - Store in database

- Create partner-branded quote preview
  - Modify `/quotes/share/[token]` to detect partner quotes
  - Show partner logo and contact info
  - CircleTel branding secondary
  - Professional PDF generation

- Add email sending from partner portal
  - "Send Quote" button on approved quotes
  - Email composer with template
  - Subject: "Quote from [Partner Name] via CircleTel"
  - Body includes personalized message + quote link
  - BCC partner and optionally admin

- Implement quote tracking for partners
  - Track when client opens email (tracking pixel)
  - Track when client views quote (page load)
  - Track time spent on quote page
  - Track device/browser
  - Dashboard showing quote analytics

- Add notifications
  - Partner receives email when client views quote
  - Partner receives notification in portal
  - Partner dashboard shows "Recent Activity"

**Acceptance Criteria:**
- [ ] Partner can generate share link for approved quote
- [ ] Partner can copy link to clipboard
- [ ] Partner can send email directly from portal
- [ ] Client receives email with personalized message
- [ ] Client can view quote (partner-branded)
- [ ] Partner receives notification when client views
- [ ] Partner can see quote analytics (views, time)
- [ ] Partner can download PDF with partner branding

**Phase 2 Deliverables:**
- Quote editing and versioning ✅
- Multi-location bulk quoting ✅
- Partner quote sharing with tracking ✅
- Partner-branded PDFs ✅
- Email integration ✅

---

### Phase 3: Technical Resources & Training (Weeks 4-6) - 21 Story Points

**Goal:** Empower partners with technical knowledge and structured training

#### Sprint 3.1: On-Net Coverage Lookup (Week 4) - 5 SP

**Tasks:**
- Create `/partners/resources/technical/coverage/page.tsx`
  - Address search with Google Maps autocomplete
  - Show coverage results:
    - On-net: CircleTel-owned network
    - Off-net: Third-party provider (DFA, Vumatel, etc.)
    - Not available: No coverage
  - Display provider name, technology, speeds
  - Show estimated activation days
  - Explain what on-net vs off-net means

- Update database with on-net flags
  - Migration: Add is_on_net to fttb_coverage_areas
  - Migration: Add is_on_net to fttb_network_providers
  - Populate data for existing coverage areas
  - Mark DFA Business Fibre as on-net
  - Mark consumer providers as off-net

- Create API route `POST /api/partners/coverage/lookup`
  - Accept address string
  - Geocode address (Google Maps)
  - Query fttb_coverage_areas
  - Return coverage details with on-net flag
  - Include provider information

- Create educational content
  - "What is On-Net?" explainer with diagram
  - "What is Off-Net?" explainer
  - Benefits/drawbacks of each
  - Pricing implications
  - Activation timeline differences

**Acceptance Criteria:**
- [ ] Partner can search any address
- [ ] System returns on-net/off-net status
- [ ] Partner can see which provider serves address
- [ ] Partner can view estimated activation timeline
- [ ] Educational content explains terminology
- [ ] Diagram shows network topology

#### Sprint 3.2: Contention Ratio Guide (Week 4-5) - 5 SP

**Tasks:**
- Create `/partners/resources/technical/contention/page.tsx`
  - Product list showing contention ratios
  - Filter by product category (BizFibre, HomeFibre, etc.)
  - Color-coded badges (Uncontended, 1:1, 1:10, 1:20)
  - Click to see details per product

- Add contention fields to database
  - Migration: Add contention_ratio to service_packages
  - Migration: Add is_contended boolean
  - Populate data for existing packages
  - BizFibre = 1:10 contended
  - MTN 5G = Uncontended (dedicated)
  - Consumer fibre = 1:20 contended

- Create interactive explainer
  - "What is Contention?" animated diagram
  - Show bandwidth sharing visually
  - Compare 1:1, 1:10, 1:20 scenarios
  - When to recommend contended vs uncontended
  - Price/performance trade-offs

- Add comparison tool
  - Side-by-side comparison of similar products
  - Highlight contention differences
  - Show price differences
  - Competitive positioning (vs DFA, Vumatel)

**Acceptance Criteria:**
- [ ] Partner can view all products with contention ratios
- [ ] Partner can filter by contention type
- [ ] Interactive explainer demonstrates bandwidth sharing
- [ ] Partner can compare products side-by-side
- [ ] Competitive positioning guides included

#### Sprint 3.3: Network Architecture (Week 5) - 3 SP

**Tasks:**
- Create `/partners/resources/technical/network/page.tsx`
  - Network topology diagram (high-level)
  - Explain ENNI (External NNI) for business fibre
  - Explain GNNI (Gateway NNI) for consumer fibre
  - Show interconnections with providers
  - Explain aggregation options for multi-site

- Add aggregation fields to database
  - Migration: Add aggregation_type to service_packages
  - Migration: Add aggregation_details JSONB
  - Populate for business products
  - ENNI for BizFibre
  - Direct for MTN 5G

- Create redundancy explainer
  - "What is Failover?" diagram
  - Dual-connection options
  - Load balancing vs failover
  - Enterprise redundancy scenarios

**Acceptance Criteria:**
- [ ] Partner can view network topology diagram
- [ ] Partner understands ENNI vs GNNI
- [ ] Partner can see aggregation options per product
- [ ] Redundancy options explained for enterprise clients

#### Sprint 3.4: Training Portal Structure (Week 5-6) - 8 SP

**Tasks:**
- Create `/partners/resources/training/page.tsx`
  - Training dashboard showing modules
  - Progress indicators per module
  - Certificates earned
  - Recommended next steps

- Create module structure (5 modules):
  1. **BizFibre Connect** (30 min)
     - Product overview, speeds, pricing
     - Contention ratios and SLAs
     - Target customers (SMEs, enterprises)
     - Competitive positioning vs DFA
     - Quiz (10 questions, 80% to pass)

  2. **HomeFibre Connect** (20 min)
     - Consumer fibre overview
     - Coverage and activation process
     - Pricing tiers and router options
     - Target customers (residential)
     - Quiz (8 questions, 80% to pass)

  3. **MTN 5G & LTE** (25 min)
     - Wireless technology overview
     - Coverage and speeds
     - Best use cases (backup, rural, temporary)
     - Data caps and fair usage
     - Quiz (10 questions, 80% to pass)

  4. **SkyFibre Solutions** (25 min)
     - Fixed wireless overview
     - Residential vs Business vs Township
     - Coverage limitations
     - Installation requirements
     - Quiz (10 questions, 80% to pass)

  5. **Sales Fundamentals** (40 min)
     - Discovery questions framework
     - Needs assessment matrix
     - Objection handling scripts
     - Closing techniques
     - Quiz (12 questions, 80% to pass)

- Migrate existing product docs
  - Organize 79 docs from `docs/products/` into modules
  - Create module structure in database
  - Add learning objectives per module
  - Create quiz questions

- Implement progress tracking
  - Record module starts
  - Track time spent per module
  - Record quiz scores
  - Issue certificates for passing scores
  - Track overall certification status

- Create certificate generation
  - PDF certificate with partner name
  - Module name and completion date
  - Unique certificate ID
  - Digital signature
  - Downloadable/shareable

**Acceptance Criteria:**
- [ ] Partner can view all training modules
- [ ] Partner can start module and see content
- [ ] Partner progress tracked (started, in_progress, completed)
- [ ] Partner can take quiz after completing module
- [ ] Partner receives certificate after passing quiz (80%+)
- [ ] Partner dashboard shows overall progress
- [ ] Certificates downloadable as PDF

**Phase 3 Deliverables:**
- On-net coverage lookup tool ✅
- Contention ratio guide with interactive explainer ✅
- Network architecture documentation ✅
- 5 structured training modules ✅
- Progress tracking and certification ✅

---

## Task Breakdown

### Task Group 1: Partner Authentication Fix (3 SP)

**Task 1.1: Debug CustomerAuthProvider**
- **Assigned To:** Frontend Engineer
- **Story Points:** 2
- **Dependencies:** None
- **Description:** Investigate why CustomerAuthProvider runs on partner pages causing blank screens
- **Acceptance Criteria:**
  - [ ] Identify root cause of multiple GoTrueClient instances
  - [ ] Document auth provider conflict
  - [ ] Propose solution (exclude partner pages)
- **Files to Modify:**
  - `components/providers/CustomerAuthProvider.tsx`
- **Testing:**
  - Test login as partner
  - Verify all 9 partner pages load
  - Check console for Supabase client warnings

**Task 1.2: Implement Partner Page Exclusions**
- **Assigned To:** Frontend Engineer
- **Story Points:** 1
- **Dependencies:** Task 1.1
- **Description:** Update CustomerAuthProvider to skip initialization on partner routes
- **Acceptance Criteria:**
  - [ ] CustomerAuthProvider checks if pathname starts with `/partners`
  - [ ] Sets loading=false and returns early on partner pages
  - [ ] No interference with PartnerAuthProvider (if created separately)
- **Files to Modify:**
  - `components/providers/CustomerAuthProvider.tsx` (lines 64-76)
- **Testing:**
  - Clean browser session test
  - Test all 9 partner pages load correctly
  - Verify session persistence

---

### Task Group 2: Database Schema Extensions (5 SP)

**Task 2.1: Partner Quote Tracking Migration**
- **Assigned To:** Database Engineer
- **Story Points:** 2
- **Dependencies:** None
- **Description:** Add partner_id and approval workflow to business_quotes
- **SQL:**
```sql
-- Migration: 20251110000001_add_partner_quote_tracking.sql
ALTER TABLE business_quotes
  ADD COLUMN partner_id UUID REFERENCES partners(id),
  ADD COLUMN is_draft BOOLEAN DEFAULT TRUE,
  ADD COLUMN partner_notes TEXT,
  ADD COLUMN admin_approval_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN approved_by UUID REFERENCES admin_users(id),
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN partner_share_token TEXT UNIQUE,
  ADD COLUMN partner_share_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN partner_share_expires_at TIMESTAMPTZ;

CREATE INDEX idx_business_quotes_partner ON business_quotes(partner_id);
CREATE INDEX idx_business_quotes_approval_status ON business_quotes(admin_approval_status);
```
- **Testing:**
  - Run migration on local database
  - Verify columns added successfully
  - Test indexes created

**Task 2.2: Partner Permissions Migration**
- **Assigned To:** Database Engineer
- **Story Points:** 1
- **Dependencies:** None
- **Description:** Add quote creation permissions to partners table
- **SQL:**
```sql
-- Migration: 20251110000002_add_partner_quote_permissions.sql
ALTER TABLE partners
  ADD COLUMN can_create_quotes BOOLEAN DEFAULT TRUE,
  ADD COLUMN quote_approval_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN max_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN max_quote_value DECIMAL(10,2),
  ADD COLUMN monthly_quote_limit INTEGER DEFAULT 50;

UPDATE partners
SET can_create_quotes = TRUE,
    quote_approval_required = TRUE
WHERE status = 'verified';
```
- **Testing:**
  - Verify existing verified partners get quote permissions
  - Test new partner registration sets defaults correctly

**Task 2.3: RLS Policies for Partner Quotes**
- **Assigned To:** Database Engineer
- **Story Points:** 2
- **Dependencies:** Task 2.1, Task 2.2
- **Description:** Create RLS policies allowing partners to manage their quotes
- **SQL:**
```sql
-- Migration: 20251110000003_partner_quote_rls_policies.sql
CREATE POLICY "partners_view_own_quotes"
  ON business_quotes FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "partners_create_quotes"
  ON business_quotes FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners
      WHERE user_id = auth.uid()
      AND can_create_quotes = TRUE
      AND status = 'verified'
    )
  );

CREATE POLICY "partners_update_draft_quotes"
  ON business_quotes FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
    AND is_draft = TRUE
    AND admin_approval_status IN ('pending', 'rejected')
  );
```
- **Testing:**
  - Test partner can only see their own quotes
  - Test partner cannot see admin quotes or other partner quotes
  - Test partner can create new quotes
  - Test partner can update draft quotes only
  - Test admin can see all quotes (existing policy)

---

### Task Group 3: Partner Quote Creation UI (13 SP)

**Task 3.1: Quote List Page**
- **Assigned To:** Frontend Engineer
- **Story Points:** 3
- **Dependencies:** Task 2.1, Task 2.2, Task 2.3
- **Description:** Build `/partners/quotes/page.tsx` to display partner's quotes
- **Features:**
  - Grouped by status tabs (Draft, Pending, Approved, Rejected)
  - Card-based layout with key info (quote number, company, value, date)
  - Search by company name or quote number
  - Filter by date range
  - "Create Quote" button prominently displayed
  - Empty state with helpful guidance
- **Files to Create:**
  - `app/partners/quotes/page.tsx`
  - `components/partners/QuoteCard.tsx`
- **API Integration:**
  - Fetch from `GET /api/partners/quotes/list`
- **Testing:**
  - Test empty state (no quotes yet)
  - Test with 10+ quotes in different statuses
  - Test search functionality
  - Test filters

**Task 3.2: Quote Creation Form - Basic Info**
- **Assigned To:** Frontend Engineer
- **Story Points:** 4
- **Dependencies:** Task 3.1
- **Description:** Build company/contact information section of quote builder
- **Features:**
  - Company name (required)
  - Registration number (optional)
  - VAT number (optional)
  - Contact name (required)
  - Contact email (required)
  - Contact phone (required)
  - Service address with autocomplete
  - Client-side validation
  - Save as draft functionality
- **Files to Create:**
  - `app/partners/quotes/new/page.tsx`
  - `components/partners/QuoteBuilderForm.tsx`
- **Reusable Components:**
  - Clone from `app/admin/quotes/new/page.tsx`
  - Simplify for partner use (remove admin-only features)
- **Testing:**
  - Test form validation
  - Test save as draft
  - Test address autocomplete

**Task 3.3: Quote Creation Form - Service Selection**
- **Assigned To:** Frontend Engineer
- **Story Points:** 4
- **Dependencies:** Task 3.2
- **Description:** Build service package selection with multi-item support
- **Features:**
  - Search/filter service packages
  - Display package cards with key info (name, speed, price)
  - Add multiple items (primary, secondary, additional)
  - Quantity input per item
  - Real-time price calculation
  - Contract term selector (12, 24, 36 months)
  - Notes field per item
- **Files to Modify:**
  - `app/partners/quotes/new/page.tsx`
  - `components/partners/QuoteBuilderForm.tsx`
- **Components:**
  - Reuse `components/admin/quotes/ServicePackageSelector.tsx`
- **Testing:**
  - Test adding 5+ service items
  - Test quantity adjustments
  - Test price calculations
  - Test contract term changes

**Task 3.4: Submit for Approval**
- **Assigned To:** Frontend Engineer
- **Story Points:** 2
- **Dependencies:** Task 3.3
- **Description:** Add quote submission functionality
- **Features:**
  - "Submit for Approval" button
  - Confirmation modal explaining approval process
  - Partner can add notes for admin
  - Validation ensures required fields complete
  - Success message + redirect to quote detail
  - Error handling and user feedback
- **Files to Modify:**
  - `app/partners/quotes/new/page.tsx`
  - `components/partners/QuoteBuilderForm.tsx`
- **API Integration:**
  - POST to `/api/partners/quotes/create`
- **Testing:**
  - Test submission with complete data
  - Test validation prevents submission with incomplete data
  - Test partner notes save correctly
  - Test redirect after success

---

### Task Group 4: Partner Quote API Routes (6 SP)

**Task 4.1: Create Quote API**
- **Assigned To:** Backend Engineer
- **Story Points:** 3
- **Dependencies:** Task 2.3
- **Description:** Build API endpoint for partner quote creation
- **Endpoint:** `POST /api/partners/quotes/create`
- **Authentication:** Partner session required
- **Request Body:**
```typescript
{
  company_name: string
  registration_number?: string
  vat_number?: string
  contact_name: string
  contact_email: string
  contact_phone: string
  service_address: string
  coordinates?: { lat: number, lng: number }
  contract_term: 12 | 24 | 36
  partner_notes?: string
  items: Array<{
    package_id: string
    quantity: number
    item_type: 'primary' | 'secondary' | 'additional'
    notes?: string
  }>
  is_draft: boolean
}
```
- **Response:**
```typescript
{
  success: true,
  quote: {
    id: string
    quote_number: string
    status: string
    admin_approval_status: string
  }
}
```
- **Logic:**
  - Authenticate partner
  - Validate partner has can_create_quotes = TRUE
  - Check monthly_quote_limit not exceeded
  - Generate quote_number (BQ-YYYY-NNN)
  - Calculate pricing using quote calculator
  - Create quote record with partner_id
  - Create quote items
  - Set admin_approval_status based on is_draft
  - Log activity in partner_quote_activities
  - Return quote details
- **Files to Create:**
  - `app/api/partners/quotes/create/route.ts`
- **Testing:**
  - Test with valid data
  - Test validation errors
  - Test quote number generation
  - Test price calculations
  - Test monthly limit enforcement

**Task 4.2: List Quotes API**
- **Assigned To:** Backend Engineer
- **Story Points:** 2
- **Dependencies:** Task 2.3
- **Description:** Build API endpoint to list partner's quotes
- **Endpoint:** `GET /api/partners/quotes/list`
- **Query Parameters:**
```typescript
{
  limit?: number (default 20)
  offset?: number (default 0)
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
  search?: string (company name or quote number)
  date_from?: string (ISO date)
  date_to?: string (ISO date)
}
```
- **Response:**
```typescript
{
  success: true,
  quotes: Array<{
    id: string
    quote_number: string
    company_name: string
    contact_name: string
    total_monthly: number
    status: string
    admin_approval_status: string
    created_at: string
    updated_at: string
    item_count: number
  }>,
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}
```
- **Logic:**
  - Authenticate partner
  - Query business_quotes filtered by partner_id
  - Apply status filter if provided
  - Apply search filter (company_name, quote_number)
  - Apply date range filter
  - Join with business_quote_items to get item counts
  - Order by created_at DESC
  - Apply pagination
  - Return quotes with metadata
- **Files to Create:**
  - `app/api/partners/quotes/list/route.ts`
- **Testing:**
  - Test pagination
  - Test filters (status, search, dates)
  - Test ordering
  - Test item count calculation
  - Test partner isolation (can't see other partner quotes)

**Task 4.3: Get Quote Details API**
- **Assigned To:** Backend Engineer
- **Story Points:** 1
- **Dependencies:** Task 2.3
- **Description:** Build API endpoint to fetch single quote with items
- **Endpoint:** `GET /api/partners/quotes/[id]`
- **Response:**
```typescript
{
  success: true,
  quote: {
    id: string
    quote_number: string
    // ... all quote fields
    items: Array<{
      id: string
      package_id: string
      service_name: string
      quantity: number
      monthly_price: number
      installation_price: number
      // ... all item fields
    }>,
    activities: Array<{
      activity_type: string
      notes: string
      created_at: string
      admin_name?: string
    }>
  }
}
```
- **Logic:**
  - Authenticate partner
  - Verify quote belongs to partner
  - Fetch quote with items
  - Fetch recent activities
  - Return complete quote data
- **Files to Create:**
  - `app/api/partners/quotes/[id]/route.ts`
- **Testing:**
  - Test with valid quote ID
  - Test 404 for non-existent quote
  - Test 403 if quote belongs to different partner
  - Test items included
  - Test activities included

---

### Task Group 5: Admin Approval Queue (3 SP)

**Task 5.1: Approval Queue Page**
- **Assigned To:** Frontend Engineer
- **Story Points:** 2
- **Dependencies:** Task 4.2
- **Description:** Build admin page to view pending partner quotes
- **Features:**
  - List all quotes with admin_approval_status = 'pending'
  - Card layout showing:
    - Partner name and logo
    - Company name
    - Quote number
    - Total value
    - Item count
    - Submitted date
    - Partner notes
  - Filter by partner
  - Sort by date, value
  - "View Details" button
  - Quick approve/reject actions
- **Files to Create:**
  - `app/admin/partners/quotes/pending/page.tsx`
  - `components/admin/PartnerQuoteApprovalCard.tsx`
- **API Integration:**
  - Fetch from `GET /api/admin/partners/quotes/pending`
- **Testing:**
  - Test empty state (no pending quotes)
  - Test with 10+ pending quotes
  - Test filters and sorting
  - Test quick actions

**Task 5.2: Approve/Reject API**
- **Assigned To:** Backend Engineer
- **Story Points:** 1
- **Dependencies:** Task 2.3, Task 5.1
- **Description:** Build API endpoints for quote approval workflow
- **Endpoints:**
  - `POST /api/admin/partners/quotes/[id]/approve`
  - `POST /api/admin/partners/quotes/[id]/reject`
- **Approve Request Body:**
```typescript
{
  notes?: string
  modifications?: {
    custom_discount_percent?: number
    custom_discount_amount?: number
    custom_discount_reason?: string
  }
}
```
- **Reject Request Body:**
```typescript
{
  rejection_reason: string
}
```
- **Logic:**
  - Authenticate admin
  - Verify admin has permission
  - Update quote admin_approval_status
  - Set approved_by / approved_at
  - Apply modifications if provided
  - Recalculate pricing if modified
  - Log activity
  - Send email notification to partner
  - Return updated quote
- **Email Templates:**
  - Approval: "Your quote BQ-YYYY-NNN has been approved"
  - Rejection: "Your quote BQ-YYYY-NNN requires changes"
- **Files to Create:**
  - `app/api/admin/partners/quotes/[id]/approve/route.ts`
  - `app/api/admin/partners/quotes/[id]/reject/route.ts`
  - `lib/email/templates/partner-quote-approved.ts`
  - `lib/email/templates/partner-quote-rejected.ts`
- **Testing:**
  - Test approve updates status correctly
  - Test reject with reason
  - Test email notifications sent
  - Test activity logged
  - Test discount modifications apply correctly

---

### Task Group 6: Technical Fields Migration (3 SP)

**Task 6.1: Add Contention Fields**
- **Assigned To:** Database Engineer
- **Story Points:** 1
- **Dependencies:** None
- **Description:** Add contention ratio fields to service_packages
- **SQL:**
```sql
-- Migration: 20251110000004_add_contention_fields.sql
ALTER TABLE service_packages
  ADD COLUMN contention_ratio VARCHAR(10),
  ADD COLUMN is_contended BOOLEAN DEFAULT TRUE,
  ADD COLUMN contention_notes TEXT;

-- Populate existing packages
UPDATE service_packages
SET
  contention_ratio = '1:10',
  is_contended = TRUE,
  contention_notes = 'Shared bandwidth with guaranteed minimum speed'
WHERE service_type = 'BizFibreConnect';

UPDATE service_packages
SET
  contention_ratio = 'Uncontended',
  is_contended = FALSE,
  contention_notes = 'Dedicated bandwidth, no sharing'
WHERE service_type LIKE 'MTN%';

CREATE INDEX idx_service_packages_contention ON service_packages(is_contended);
```
- **Testing:**
  - Verify fields added
  - Verify existing packages updated
  - Test index created

**Task 6.2: Add Network Delivery Fields**
- **Assigned To:** Database Engineer
- **Story Points:** 1
- **Dependencies:** None
- **Description:** Add on-net and aggregation fields
- **SQL:**
```sql
-- Migration: 20251110000005_add_network_delivery_fields.sql
ALTER TABLE service_packages
  ADD COLUMN delivery_method VARCHAR(50),
  ADD COLUMN aggregation_type VARCHAR(50),
  ADD COLUMN aggregation_notes TEXT,
  ADD COLUMN partner_visible BOOLEAN DEFAULT TRUE;

ALTER TABLE fttb_coverage_areas
  ADD COLUMN is_on_net BOOLEAN DEFAULT FALSE,
  ADD COLUMN delivery_type VARCHAR(50),
  ADD COLUMN on_net_notes TEXT;

ALTER TABLE fttb_network_providers
  ADD COLUMN is_on_net BOOLEAN DEFAULT FALSE,
  ADD COLUMN aggregation_details JSONB,
  ADD COLUMN partner_visible BOOLEAN DEFAULT TRUE,
  ADD COLUMN partner_notes TEXT;

-- Populate delivery methods
UPDATE service_packages
SET
  delivery_method = 'on-net',
  aggregation_type = 'ENNI'
WHERE service_type = 'BizFibreConnect';

-- Mark DFA as on-net
UPDATE fttb_network_providers
SET is_on_net = TRUE
WHERE name = 'DFA';

CREATE INDEX idx_fttb_coverage_on_net ON fttb_coverage_areas(is_on_net);
CREATE INDEX idx_service_packages_delivery ON service_packages(delivery_method);
```
- **Testing:**
  - Verify fields added to all tables
  - Verify DFA marked as on-net
  - Verify BizFibre has ENNI aggregation
  - Test indexes created

**Task 6.3: Partner Training Tables**
- **Assigned To:** Database Engineer
- **Story Points:** 1
- **Dependencies:** None
- **Description:** Create tables for training progress tracking
- **SQL:**
```sql
-- Migration: 20251110000006_create_partner_training_tables.sql
CREATE TABLE partner_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL,
  module_name VARCHAR(200),
  status VARCHAR(50) NOT NULL DEFAULT 'not_started',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, module_id)
);

CREATE TABLE partner_quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  admin_id UUID REFERENCES admin_users(id),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_training_partner ON partner_training_progress(partner_id);
CREATE INDEX idx_partner_training_status ON partner_training_progress(status);
CREATE INDEX idx_partner_quote_activities_quote ON partner_quote_activities(quote_id);
CREATE INDEX idx_partner_quote_activities_partner ON partner_quote_activities(partner_id);

-- RLS policies for training
CREATE POLICY "partners_view_own_training"
  ON partner_training_progress FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "service_role_all_training"
  ON partner_training_progress FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```
- **Testing:**
  - Verify tables created
  - Verify RLS policies work
  - Test unique constraint on partner_id + module_id

---

## API Specifications

### Partner Quote Creation API

**Endpoint:** `POST /api/partners/quotes/create`

**Authentication:** Partner session token in cookies or Authorization header

**Request Headers:**
```
Authorization: Bearer <partner_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "company_name": "Acme Corp",
  "registration_number": "2020/123456/07",
  "vat_number": "4123456789",
  "contact_name": "John Smith",
  "contact_email": "john@acme.com",
  "contact_phone": "0821234567",
  "service_address": "123 Main St, Cape Town",
  "coordinates": {
    "lat": -33.9249,
    "lng": 18.4241
  },
  "contract_term": 12,
  "partner_notes": "Client needs dual connection for redundancy",
  "items": [
    {
      "package_id": "uuid-of-bizfibre-package",
      "quantity": 1,
      "item_type": "primary",
      "notes": "Primary link"
    },
    {
      "package_id": "uuid-of-bizfibre-package",
      "quantity": 1,
      "item_type": "secondary",
      "notes": "Backup link"
    }
  ],
  "is_draft": false
}
```

**Response (Success - 201 Created):**
```json
{
  "success": true,
  "quote": {
    "id": "uuid",
    "quote_number": "BQ-2025-042",
    "company_name": "Acme Corp",
    "status": "draft",
    "admin_approval_status": "pending",
    "total_monthly": 2088.00,
    "total_installation": 0,
    "created_at": "2025-11-10T14:30:00Z",
    "item_count": 2
  },
  "message": "Quote submitted for approval. You'll be notified when approved."
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "contact_email": "Invalid email format",
    "items": "At least one service item required"
  }
}
```

**Response (Error - 403 Forbidden):**
```json
{
  "success": false,
  "error": "Quote creation not allowed",
  "details": "Partner must be verified and have can_create_quotes permission"
}
```

**Response (Error - 429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Monthly quote limit exceeded",
  "details": "You have created 50 quotes this month. Limit: 50"
}
```

---

### Partner Quote List API

**Endpoint:** `GET /api/partners/quotes/list`

**Authentication:** Partner session token

**Query Parameters:**
```
?limit=20
&offset=0
&status=pending
&search=acme
&date_from=2025-11-01
&date_to=2025-11-30
&sort_by=created_at
&sort_order=desc
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "quotes": [
    {
      "id": "uuid",
      "quote_number": "BQ-2025-042",
      "company_name": "Acme Corp",
      "contact_name": "John Smith",
      "contact_email": "john@acme.com",
      "total_monthly": 2088.00,
      "total_installation": 0,
      "status": "draft",
      "admin_approval_status": "pending",
      "created_at": "2025-11-10T14:30:00Z",
      "updated_at": "2025-11-10T14:30:00Z",
      "item_count": 2,
      "can_edit": true,
      "can_submit": true
    }
  ],
  "pagination": {
    "total": 142,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "filters_applied": {
    "status": "pending",
    "search": "acme"
  }
}
```

---

### Admin Approval API

**Endpoint:** `POST /api/admin/partners/quotes/[id]/approve`

**Authentication:** Admin session token with quotes:write permission

**Request Body:**
```json
{
  "notes": "Approved with standard pricing",
  "modifications": {
    "custom_discount_percent": 5.0,
    "custom_discount_reason": "Loyal partner discount"
  }
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "quote": {
    "id": "uuid",
    "quote_number": "BQ-2025-042",
    "admin_approval_status": "approved",
    "approved_by": "admin-uuid",
    "approved_at": "2025-11-10T15:00:00Z",
    "custom_discount_percent": 5.0,
    "total_monthly": 1983.60
  },
  "message": "Quote approved successfully. Partner has been notified."
}
```

**Endpoint:** `POST /api/admin/partners/quotes/[id]/reject`

**Request Body:**
```json
{
  "rejection_reason": "Pricing outside approved range. Please resubmit with standard rates or request exception."
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "quote": {
    "id": "uuid",
    "quote_number": "BQ-2025-042",
    "admin_approval_status": "rejected",
    "rejection_reason": "Pricing outside approved range...",
    "rejected_at": "2025-11-10T15:00:00Z"
  },
  "message": "Quote rejected. Partner has been notified with feedback."
}
```

---

## Testing Strategy

### Unit Tests

**Partner Quote Creation:**
- Test quote number generation uniqueness
- Test pricing calculation accuracy
- Test partner permission validation
- Test monthly quote limit enforcement
- Test item validation (minimum 1 item)
- Test contract term validation (12, 24, 36 only)

**Admin Approval:**
- Test approval updates status correctly
- Test rejection requires reason
- Test discount modifications recalculate pricing
- Test approval notification sent
- Test rejection notification sent

**RLS Policies:**
- Test partner can only view own quotes
- Test partner cannot view other partner quotes
- Test admin can view all quotes
- Test partner can create quotes when verified
- Test partner cannot create when unverified

### Integration Tests

**Quote Creation Flow:**
1. Partner creates quote with 3 items
2. Verify quote saved with correct status
3. Verify items saved with correct relationships
4. Verify pricing calculated correctly
5. Verify admin receives notification

**Approval Workflow:**
1. Admin approves quote with 5% discount
2. Verify status updated
3. Verify discount applied
4. Verify pricing recalculated
5. Verify partner notified

**Quote Sharing Flow:**
1. Partner generates share link for approved quote
2. Verify token generated and saved
3. Client opens quote link
4. Verify view tracked
5. Verify partner notified of view

### E2E Tests (Playwright)

**Partner Quote Journey:**
```typescript
test('partner can create and submit quote', async ({ page }) => {
  // Login as partner
  await page.goto('/partners/login')
  await page.fill('[name="email"]', 'partner@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to quote creation
  await page.goto('/partners/quotes/new')

  // Fill company details
  await page.fill('[name="company_name"]', 'Test Corp')
  await page.fill('[name="contact_name"]', 'John Doe')
  await page.fill('[name="contact_email"]', 'john@test.com')
  await page.fill('[name="contact_phone"]', '0821234567')
  await page.fill('[name="service_address"]', '123 Test St, Cape Town')

  // Select service package
  await page.click('[data-testid="add-service-button"]')
  await page.click('[data-package-id="bizfibre-100"]')

  // Submit for approval
  await page.click('[data-testid="submit-button"]')

  // Verify success
  await expect(page.locator('.success-message')).toContainText('submitted for approval')

  // Verify redirected to quote list
  await expect(page).toHaveURL('/partners/quotes')

  // Verify quote appears in list
  await expect(page.locator('[data-testid="quote-card"]')).toBeVisible()
})
```

**Admin Approval Journey:**
```typescript
test('admin can approve partner quote', async ({ page }) => {
  // Login as admin
  await page.goto('/admin/login')
  await page.fill('[name="email"]', 'admin@circletel.co.za')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to approval queue
  await page.goto('/admin/partners/quotes/pending')

  // Verify quote appears
  await expect(page.locator('[data-quote-number="BQ-2025-042"]')).toBeVisible()

  // Open quote details
  await page.click('[data-quote-id="uuid"]')

  // Approve quote
  await page.click('[data-testid="approve-button"]')
  await page.fill('[name="notes"]', 'Approved')
  await page.click('[data-testid="confirm-approve"]')

  // Verify success
  await expect(page.locator('.success-message')).toContainText('approved')

  // Verify quote removed from pending
  await page.goto('/admin/partners/quotes/pending')
  await expect(page.locator('[data-quote-number="BQ-2025-042"]')).not.toBeVisible()
})
```

### Performance Tests

**Quote List Loading:**
- Target: < 500ms for 100 quotes
- Test with 1000+ quotes in database
- Verify pagination works efficiently
- Check for N+1 query issues

**Quote Creation:**
- Target: < 1000ms to create quote with 10 items
- Test with various item counts (1, 5, 10, 20)
- Verify pricing calculation performance

**Coverage Lookup:**
- Target: < 300ms for address search
- Test with geocoding
- Test with database query
- Verify caching works

---

## Deployment Plan

### Pre-Deployment Checklist

**Database:**
- [ ] All migrations tested on staging
- [ ] RLS policies verified for both partner and admin
- [ ] Indexes created and tested
- [ ] Data backups completed

**Code:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests passing
- [ ] Type check clean (`npm run type-check`)
- [ ] Build succeeds (`npm run build:memory`)
- [ ] No console errors or warnings

**Documentation:**
- [ ] API documentation updated
- [ ] Partner guide created
- [ ] Admin guide updated
- [ ] Training materials prepared

### Phase 1 Deployment (Week 1)

**Day 1:**
1. Deploy auth fixes to staging
2. Test partner login thoroughly
3. Deploy to production if stable

**Day 2:**
1. Run database migrations on staging
2. Verify migrations successful
3. Test RLS policies with test accounts
4. Deploy migrations to production
5. Monitor for errors

**Day 3-4:**
1. Deploy partner quote UI to staging
2. Test quote creation end-to-end
3. Deploy admin approval queue
4. Test approval workflow
5. Deploy to production in evening

**Day 5:**
1. Monitor production for issues
2. Partner testing with Erhard
3. Gather feedback
4. Hot fixes if needed

### Phase 2 Deployment (Week 3)

**Week 2:**
- Deploy quote management features to staging
- Test editing, duplication, bulk creation
- Deploy to production Friday

**Week 3:**
- Deploy quote sharing features to staging
- Test email integration
- Test tracking
- Deploy to production Friday

### Phase 3 Deployment (Week 6)

**Week 4:**
- Deploy technical resources pages to staging
- Test coverage lookup
- Test contention guide
- Deploy to production Friday

**Week 5-6:**
- Deploy training portal structure
- Upload training content
- Test progress tracking
- Test certificate generation
- Deploy to production Friday

### Rollback Procedures

**Database Rollback:**
```sql
-- If migration fails, rollback using down migration
-- Example: Rollback partner quote tracking
ALTER TABLE business_quotes
  DROP COLUMN IF EXISTS partner_id,
  DROP COLUMN IF EXISTS is_draft,
  DROP COLUMN IF EXISTS partner_notes,
  -- ... etc
```

**Application Rollback:**
1. Revert to previous Git commit
2. Redeploy via Vercel
3. Verify previous version working
4. Investigate issue in separate branch

### Monitoring

**Metrics to Track:**
- Quote creation rate (per day)
- Approval turnaround time (submission to approval)
- Partner engagement (logins, time on site)
- Quote conversion rate (created to approved)
- Training completion rate (modules completed)
- Technical resource page views

**Alerts:**
- Quote creation failures > 5% error rate
- Approval queue > 50 pending quotes
- Email notification failures
- Database query timeouts (>5s)
- RLS policy violations

---

## Risks & Mitigations

### Risk 1: Aggressive Timeline (Critical Priority = This Week)

**Impact:** High
**Probability:** High

**Description:** Partner needs functionality "this week" but Phase 1 is 24 story points (5 days of focused work). Real-world interruptions, bugs, and testing will likely extend timeline.

**Mitigation:**
- Focus ruthlessly on MVP (auth fix + basic quote creation + approval)
- Defer non-essential features to Phase 2 (bulk creation, detailed analytics)
- Deploy to staging midweek, production Friday
- Schedule partner testing over weekend
- Be transparent about limitations in MVP

**Fallback:**
- If Week 1 delivery impossible, propose interim solution:
  - Admin creates quotes on partner's behalf (existing flow)
  - Admin shares link with partner to send to client
  - Logs all requests in spreadsheet for prioritization

### Risk 2: Partner Training Content Creation Time

**Impact:** Medium
**Probability:** Medium

**Description:** Creating 5 training modules with quizzes is time-consuming. 79 existing product docs need organization, not creation from scratch, but still significant effort.

**Mitigation:**
- Phase 3 (training) is 6 weeks out, plenty of time
- Leverage existing 79 product docs as base content
- Use AI (Claude) to help draft quiz questions from docs
- Start with 1-2 modules, expand based on feedback
- Consider video creation as separate project (Phase 4)

**Fallback:**
- Launch training portal with existing docs organized by category
- Add quizzes and certificates incrementally
- Prioritize BizFibre module first (most important for Erhard)

### Risk 3: Quote Approval Bottleneck

**Impact:** Medium
**Probability:** Medium

**Description:** If all partner quotes require admin approval, admin becomes bottleneck. Could slow down sales process, defeating purpose.

**Mitigation:**
- Phase 1: All quotes require approval (safe start)
- Phase 2: Introduce tier-based auto-approval
  - Gold/Platinum partners: Auto-approve up to R10k monthly
  - Silver partners: Auto-approve up to R5k monthly
  - Bronze partners: Require approval
- Monitor approval queue daily
- Set SLA: Approve/reject within 4 hours (business hours)
- Consider weekend admin on-call for urgent quotes

**Metrics to Track:**
- Average approval turnaround time
- Queue depth (pending count)
- Partner complaints about approval delays

### Risk 4: Partner Discount Authority Scope Creep

**Impact:** Low
**Probability:** Medium

**Description:** User answered "Requires admin approval for discounts" but partners may push for discount authority. Could cause feature requests and tension.

**Mitigation:**
- Be clear in Phase 1: Partners quote at standard pricing only
- Partner can add notes requesting discount
- Admin applies discount during approval
- Phase 2: Consider tier-based discount limits (5-10%)
- Document policy clearly in partner guide

**Communication:**
- "To maintain pricing consistency and protect margins, discounts require admin approval"
- "You can request discounts in the partner notes field when submitting"
- "Most quotes approved within 4 hours during business hours"

### Risk 5: Database Query Performance

**Impact:** Medium
**Probability:** Low

**Description:** Quote list queries with filters, joins, and pagination could become slow with 1000+ quotes.

**Mitigation:**
- Add strategic indexes (already in schema)
- Test with 10,000+ quotes in staging
- Monitor query performance in production
- Use database query analyzer to identify slow queries
- Consider read replicas if needed

**Performance Targets:**
- Quote list: < 500ms for 100 quotes
- Quote creation: < 1000ms
- Coverage lookup: < 300ms

### Risk 6: Partner vs Customer Auth Conflicts

**Impact:** High
**Probability:** Low (if Task 1.1 done correctly)

**Description:** Partner and customer authentication both use Supabase. If CustomerAuthProvider runs on partner pages, causes blank screens.

**Mitigation:**
- Task 1.1 specifically addresses this (highest priority)
- Test thoroughly with multiple browsers
- Clear browser cache/cookies between tests
- Consider separate partner subdomain (partners.circletel.co.za) if conflicts persist
- Document auth architecture clearly

**Testing:**
- Login as customer, navigate site, verify works
- Login as partner, navigate partner pages, verify works
- Login as admin, verify can access admin + partner dashboards

---

## Success Metrics

### Phase 1 Success Criteria (Week 1)

**Functionality:**
- [ ] Partner can log in without blank pages (0 Supabase client errors)
- [ ] Partner can create draft quote with 1+ line items
- [ ] Partner can submit quote for approval
- [ ] Admin receives notification of pending quote within 1 minute
- [ ] Admin can approve quote
- [ ] Admin can reject quote with feedback
- [ ] Partner receives approval/rejection notification within 1 minute

**Performance:**
- [ ] Quote creation < 1 second
- [ ] Quote list loads < 500ms
- [ ] Admin approval queue loads < 300ms

**Partner Feedback:**
- [ ] Erhard successfully creates 3+ quotes
- [ ] Erhard reports "significantly faster than emailing admin"
- [ ] Erhard comfortable using interface (< 5 min training needed)

### Phase 2 Success Criteria (Week 3)

**Functionality:**
- [ ] Partner can edit draft quotes
- [ ] Partner can duplicate quotes
- [ ] Partner can create bulk quotes (5+ locations)
- [ ] Partner can generate share link for approved quote
- [ ] Partner can send email directly from portal
- [ ] Client can view quote (partner-branded)
- [ ] Partner receives notification when client views quote
- [ ] Partner can download PDF with partner branding

**Performance:**
- [ ] Bulk quote creation (10 locations) < 5 seconds
- [ ] PDF generation < 2 seconds
- [ ] Email sending < 1 second

**Business Impact:**
- [ ] Quote turnaround time reduced 80% (from 2 days to 4 hours)
- [ ] Partner creates 20+ quotes in first month
- [ ] 50%+ of quotes approved within 4 hours
- [ ] Client view rate > 70% (70% of sent quotes are opened)

### Phase 3 Success Criteria (Week 6)

**Functionality:**
- [ ] Partner can look up on-net status for any address
- [ ] Partner can view contention ratios for all products
- [ ] Partner can access network architecture diagrams
- [ ] Partner can start training module
- [ ] Partner can complete quiz
- [ ] Partner receives certificate after passing
- [ ] Partner can download certificate PDF

**Engagement:**
- [ ] 80%+ of partners complete at least 1 module
- [ ] 50%+ of partners complete BizFibre certification
- [ ] Average quiz score > 85%
- [ ] Coverage lookup used 100+ times per month
- [ ] Technical resources page views > 500/month

**Business Impact:**
- [ ] Partner confidence score +30% (self-reported survey)
- [ ] "Need technical info from admin" requests -50%
- [ ] Quote accuracy improved (fewer rejections for technical errors)

---

## Appendix A: File Structure

```
circletel-nextjs/
├── app/
│   ├── partners/
│   │   ├── quotes/
│   │   │   ├── page.tsx                    # Quote list (NEW)
│   │   │   ├── new/
│   │   │   │   └── page.tsx                # Quote builder (NEW)
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Quote detail/edit (NEW)
│   │   │       └── preview/
│   │   │           └── page.tsx            # Quote preview (NEW)
│   │   └── resources/
│   │       ├── technical/
│   │       │   ├── page.tsx                # Tech resources hub (NEW)
│   │       │   ├── coverage/
│   │       │   │   └── page.tsx            # On-net lookup (NEW)
│   │       │   ├── contention/
│   │       │   │   └── page.tsx            # Contention guide (NEW)
│   │       │   └── network/
│   │       │       └── page.tsx            # Network topology (NEW)
│   │       └── training/
│   │           ├── page.tsx                # Training dashboard (NEW)
│   │           └── [moduleId]/
│   │               └── page.tsx            # Module content (NEW)
│   ├── admin/
│   │   └── partners/
│   │       └── quotes/
│   │           └── pending/
│   │               └── page.tsx            # Approval queue (NEW)
│   └── api/
│       ├── partners/
│       │   ├── quotes/
│       │   │   ├── create/
│       │   │   │   └── route.ts            # Create quote API (NEW)
│       │   │   ├── list/
│       │   │   │   └── route.ts            # List quotes API (NEW)
│       │   │   └── [id]/
│       │   │       └── route.ts            # Get quote API (NEW)
│       │   ├── coverage/
│       │   │   └── lookup/
│       │   │       └── route.ts            # Coverage lookup API (NEW)
│       │   └── training/
│       │       ├── progress/
│       │       │   └── route.ts            # Training progress API (NEW)
│       │       └── [moduleId]/
│       │           └── complete/
│       │               └── route.ts        # Complete module API (NEW)
│       └── admin/
│           └── partners/
│               └── quotes/
│                   ├── pending/
│                   │   └── route.ts        # Pending quotes API (NEW)
│                   └── [id]/
│                       ├── approve/
│                       │   └── route.ts    # Approve quote API (NEW)
│                       └── reject/
│                           └── route.ts    # Reject quote API (NEW)
├── components/
│   ├── partners/
│   │   ├── QuoteCard.tsx                   # Quote display card (NEW)
│   │   ├── QuoteBuilderForm.tsx            # Quote creation form (NEW)
│   │   ├── TechnicalInfoCard.tsx           # Tech info display (NEW)
│   │   └── TrainingModuleCard.tsx          # Training module card (NEW)
│   └── admin/
│       └── PartnerQuoteApprovalCard.tsx    # Approval card (NEW)
├── lib/
│   ├── email/
│   │   └── templates/
│   │       ├── partner-quote-approved.ts   # Approval email (NEW)
│   │       └── partner-quote-rejected.ts   # Rejection email (NEW)
│   └── training/
│       ├── modules.ts                      # Training module definitions (NEW)
│       └── quiz-generator.ts               # Quiz question generator (NEW)
└── supabase/
    └── migrations/
        ├── 20251110000001_add_partner_quote_tracking.sql        # Partner quote fields (NEW)
        ├── 20251110000002_add_partner_quote_permissions.sql     # Quote permissions (NEW)
        ├── 20251110000003_partner_quote_rls_policies.sql        # RLS policies (NEW)
        ├── 20251110000004_add_contention_fields.sql             # Contention fields (NEW)
        ├── 20251110000005_add_network_delivery_fields.sql       # Network fields (NEW)
        └── 20251110000006_create_partner_training_tables.sql    # Training tables (NEW)
```

**Total New Files:** 38
**Total Modified Files:** 3
**Total Database Migrations:** 6

---

## Appendix B: Email Templates

### Partner Quote Approved Email

**Subject:** Your Quote BQ-{quote_number} Has Been Approved ✅

**Body:**
```html
Hi {partner_name},

Great news! Your quote has been approved and is ready to send to your client.

Quote Details:
- Quote Number: BQ-{quote_number}
- Company: {company_name}
- Total Monthly: R {total_monthly}
- Total Installation: R {total_installation}

Next Steps:
1. Review the approved quote in your portal
2. Generate a share link or send via email
3. Track when your client views the quote

[View Quote] [Send to Client]

Admin Notes: {approval_notes}

Need help? Contact support@circletel.co.za

CircleTel Partner Team
```

### Partner Quote Rejected Email

**Subject:** Your Quote BQ-{quote_number} Needs Changes ⚠️

**Body:**
```html
Hi {partner_name},

Your quote requires changes before it can be approved.

Quote Details:
- Quote Number: BQ-{quote_number}
- Company: {company_name}
- Submitted: {submitted_date}

Feedback from Admin:
{rejection_reason}

Next Steps:
1. Review the feedback carefully
2. Edit the quote in your portal
3. Resubmit for approval

[Edit Quote] [Contact Support]

If you have questions about the feedback, please contact support@circletel.co.za

CircleTel Partner Team
```

---

**End of Specification**

**Version:** 1.0
**Last Updated:** 2025-11-10
**Author:** CircleTel Development Team
**Approved By:** [Pending]
**Implementation Start Date:** [TBD]
**Estimated Completion:** 6 weeks from start
