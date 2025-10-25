# Circle Tel Business Requirements Specification (BRS)

## 1. Executive Summary
Circle Tel is redefining South Africa’s connectivity landscape by evolving from a traditional Internet Service Provider (ISP) into a holistic Digital Service Provider (DSP). The objective is to deliver a unified digital ecosystem for residential and business markets that integrates broadband, cloud, communication, and ICT services through a scalable, automated platform.

The goal for the next 12 months is to:
- Deploy a customer-centric digital platform (Next.js 15 + Supabase).
- Integrate core business systems (Zoho MCP, Netcash, MTN WMS, Strapi, Resend).
- Enable multi-channel service management for residential, business, and partner users.
- Establish a foundation for future expansion into digital and managed ICT services.

---

## 2. Scope and Objectives
### 2.1 Scope
The scope includes the design, development, and deployment of the Circle Tel Digital Platform with integrated backend and automation capabilities:
- **Digital Frontend:** Customer and Partner Portals with PWA support.
- **Backend Integration:** Supabase Edge Functions and Next.js APIs for automation.
- **Third-Party Systems:** Integration with Netcash, Zoho MCP, MTN WMS, Resend, and Strapi.
- **Automation:** Workflows for KYC, billing, CRM sync, and support ticketing.
- **Reporting:** Real-time analytics and BI dashboards.

### 2.2 Out of Scope
- Physical network infrastructure build.
- External marketing campaigns.
- Hardware inventory management.

### 2.3 Objectives
- Deliver a unified platform for customer management, billing, and support.
- Enhance efficiency through automation and integration.
- Enable real-time visibility into network and customer operations.

---

## 3. Technology Stack
(As previously defined in canvas)

---

## 4. System Overview
### 4.1 System Components
- **Customer Portal (Next.js 15 + Supabase):** Self-service, billing, and support.
- **Partner Portal:** Lead, commission, and product access.
- **Admin Console:** Catalog, pricing, content (Strapi), and order management.
- **Supabase Backend:** Auth, DB, storage, and Edge Functions.
- **Zoho MCP:** CRM, Billing, and CPQ integration.
- **Netcash:** Payment gateway.
- **Resend:** Transactional emails.
- **MTN WMS:** Coverage validation.
- **Strapi:** Content management.

### 4.2 Key Features
- Feasibility lookup using MTN WMS.
- Online ordering and secure payment with Netcash.
- CRM synchronization with Zoho MCP.
- Automated ticketing and email notifications via Resend.
- Scalable content management via Strapi.

### 4.3 API Routes Overview
(Existing section retained)

---

## 5. Customer and Operational Journeys (Updated Framework)
Each journey follows: **Purpose → User Story → Acceptance Criteria → Process Flow**.

### 5.1 Residential Customer Journeys
#### 5.1.1 Feasibility Check
**Purpose:** Allow residential users to check broadband availability by address.
**User Story:** As a resident, I want to verify coverage at my location so I can know which packages are available.
**Acceptance Criteria:** Address input with Google Maps; MTN WMS API returns available ISPs; if unavailable, user registered as lead.
**Process Flow:** User → API /coverage/check → MTN WMS → results displayed.

#### 5.1.2 Product Search & Selection
**Purpose:** Enable product discovery.
**User Story:** As a customer, I want to browse available products with pricing and details.
**Acceptance Criteria:** Location-based product filtering; category display from Supabase & Strapi.
**Process Flow:** Customer Portal → Product API → Supabase + Strapi.

#### 5.1.3 Order & Payment
**Purpose:** Simplify checkout.
**User Story:** As a customer, I want to place an order and make a payment online.
**Acceptance Criteria:** Payment via Netcash; order saved to Supabase; confirmation email via Resend.
**Process Flow:** Checkout → /orders → /payments/netcash-webhook → Zoho MCP sync.

#### 5.1.4 Account & Billing Management
**Purpose:** Manage billing and account information.
**User Story:** As a customer, I want to view bills, make payments, and update my details.
**Acceptance Criteria:** Dashboard shows invoices (Zoho MCP), payment status, and download option.
**Process Flow:** /orders + /payments → Supabase + Zoho MCP.

#### 5.1.5 Customer Feedback
**Purpose:** Capture service feedback.
**User Story:** As a customer, I want to rate services and submit reviews.
**Acceptance Criteria:** Feedback stored in Supabase; notifications sent to admin.
**Process Flow:** Feedback form → /admin/notifications.

---

### 5.2 Business Customer (SMME) Journeys
#### 5.2.1 Sales Quote Request
**Purpose:** Provide tailored quotes.
**User Story:** As an SMME, I want to request a quote based on my location.
**Acceptance Criteria:** Address lookup via MTN WMS; quote generated through Zoho MCP.
**Process Flow:** /coverage → /orders → Zoho MCP quote module.

#### 5.2.2 KYC & Credit Check
**Purpose:** Simplify compliance.
**User Story:** As an SMME, I want to upload my FICA documents and undergo a credit check.
**Acceptance Criteria:** Secure upload (Supabase storage); MCP integration for verification.
**Process Flow:** /admin/kyc/documents → /admin/kyc/verify.

#### 5.2.3 Onboarding
**Purpose:** Register new SMME clients.
**User Story:** As an SMME, I want an onboarding form to finalize setup.
**Acceptance Criteria:** Details synced to Zoho MCP; confirmation email sent.
**Process Flow:** /orders/consumer → MCP + Resend.

#### 5.2.4 Account & Billing
**Purpose:** Manage SMME accounts.
**User Story:** As an SMME, I want to view my invoices and make payments.
**Acceptance Criteria:** Linked billing to MCP; secure payments via Netcash.
**Process Flow:** /orders → /payments/netcash-webhook → MCP.

#### 5.2.5 Support
**Purpose:** Ensure reliable assistance.
**User Story:** As an SMME, I want to submit and track support tickets.
**Acceptance Criteria:** Ticket created in Supabase; notifications via Resend.
**Process Flow:** /admin/notifications + MCP case.

---

### 5.3 Sales Partner Journeys
#### 5.3.1 Partner Onboarding
**Purpose:** Streamline onboarding for partners.
**User Story:** As a partner, I want to register and upload verification documents.
**Acceptance Criteria:** Supabase user creation; KYC upload; approval notification.
**Process Flow:** /admin/kyc/documents → RBAC role=partner.

#### 5.3.2 Lead Management
**Purpose:** Track and convert leads.
**User Story:** As a partner, I want to manage leads through the portal.
**Acceptance Criteria:** Leads fetched from Supabase; status updates reflected in Zoho MCP.
**Process Flow:** /admin/coverage-leads → MCP.

#### 5.3.3 Commission Tracking
**Purpose:** Provide commission transparency.
**User Story:** As a partner, I want to view commission history.
**Acceptance Criteria:** Data from MCP synced to Supabase dashboard.
**Process Flow:** MCP → /admin/products.

#### 5.3.4 Resource Access
**Purpose:** Provide marketing and sales materials.
**User Story:** As a partner, I want to access brochures and media.
**Acceptance Criteria:** Resources fetched from Strapi CMS.
**Process Flow:** /admin/providers/logo → Strapi.

---

### 5.4 Network Management & Customer Support Journeys
#### 5.4.1 Network Monitoring
**Purpose:** Enable proactive monitoring.
**User Story:** As an engineer, I want to monitor uptime and performance.
**Acceptance Criteria:** API endpoint /admin/coverage/monitoring returns metrics.
**Process Flow:** Dashboard → Supabase logs → MCP notifications.

#### 5.4.2 Issue Resolution
**Purpose:** Diagnose and resolve outages.
**User Story:** As an engineer, I want to identify root causes.
**Acceptance Criteria:** Tickets auto-linked to impacted sites; updates logged.
**Process Flow:** /admin/notifications → /health.

#### 5.4.3 Support Ticket Handling
**Purpose:** Manage customer issues.
**User Story:** As support staff, I want to manage incoming tickets.
**Acceptance Criteria:** Ticket creation, update, and closure workflows.
**Process Flow:** /admin/notifications → MCP + Resend.

---

### 5.5 Sales & Marketing Journeys
#### 5.5.1 Campaign Management
**Purpose:** Create and monitor campaigns.
**User Story:** As a marketer, I want to manage promotional campaigns.
**Acceptance Criteria:** Campaigns created in Strapi; results logged to Supabase.
**Process Flow:** /admin/products → Strapi → Supabase.

#### 5.5.2 Lead Nurturing
**Purpose:** Convert potential customers.
**User Story:** As a sales rep, I want to track lead engagement.
**Acceptance Criteria:** Leads synced between Supabase and MCP.
**Process Flow:** /admin/coverage-leads → MCP CRM.

#### 5.5.3 Post-Campaign Analysis
**Purpose:** Review performance.
**User Story:** As a marketing analyst, I want to analyze campaign metrics.
**Acceptance Criteria:** Data visualized in Supabase BI dashboard.
**Process Flow:** /admin/products/audit-logs.

---

### 5.6 Finance Journeys
#### 5.6.1 Invoice Generation & Distribution
**Purpose:** Automate billing.
**User Story:** As a billing clerk, I want invoices to generate automatically.
**Acceptance Criteria:** Netcash webhook triggers invoice in MCP; receipt emailed.
**Process Flow:** /payments/netcash-webhook → MCP + Resend.

#### 5.6.2 Financial Tracking & Reporting
**Purpose:** Maintain accurate financial data.
**User Story:** As a finance manager, I want consolidated reports.
**Acceptance Criteria:** Reconciled data between MCP and Supabase.
**Process Flow:** MCP → Supabase → /admin/reminders.

---

### 5.7 Product Management Journeys
#### 5.7.1 Product Development & Launch
**Purpose:** Create and release new services.
**User Story:** As a product manager, I want to launch new products.
**Acceptance Criteria:** Product added via /admin/products; approved workflow.
**Process Flow:** /admin/product-approvals/[id]/approve.

#### 5.7.2 Product Performance Analysis
**Purpose:** Evaluate offerings.
**User Story:** As a product manager, I want to review performance metrics.
**Acceptance Criteria:** Product usage stats stored in Supabase.
**Process Flow:** /admin/products/audit-logs.

---

## 6. Functional Requirements
(As defined earlier)

## 7. Non-Functional Requirements
(As defined earlier)

## 8. Dependencies
(As defined earlier)

## 9. Risk Management
(As defined earlier)

## 10. RBAC Overview
(As defined earlier)

## 11. Interface Specifications
(As defined earlier)

## 12. System Sequence Diagram
(As defined earlier)

## 13. Approval
Prepared for review and formal approval by project sponsors and stakeholders.

