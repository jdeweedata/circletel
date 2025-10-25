# Circle Tel — Living BRS & Delivery Roadmap

**Version:** v0.9 (2025-10-25)  
**Status:** Draft for Engineering Sign‑off  
**Owner:** Product & Engineering (Circle Tel)  
**Source of Truth:** This living document in Canvas. Update here first.

---

## 0) How to Use This Living Document
- **Purpose:** Provide a developer-friendly, concise, and iterable spec that guides delivery.
- **Change Control:** Update the **Changelog** (Section 12) on every edit. Use semantic versions (MAJOR.MINOR.PATCH).
- **Traceability:** Each requirement maps to epics → user stories → acceptance criteria → test cases.
- **Focus:** Core functionality first; integrations hardened behind feature flags.

---

## 1) Executive Summary
Circle Tel is evolving into a Digital Service Provider (DSP) for **residential**, **SMME**, and **sales partner** segments. We’re building a unified platform (Next.js 15 + Supabase) integrated with **Zoho MCP**, **Netcash**, **MTN WMS**, **Strapi**, and **Resend** to offer:
- **Feasibility & Lead Capture** (address-based coverage)
- **Product Catalog by Location** (tailored availability)
- **Ordering & Payments** (Netcash)
- **CRM/CPQ & Billing Sync** (Zoho MCP)
- **Customer Portal** (self-service invoices, payments, support)
- **Partner Portal** (lead & commission tracking)

The roadmap prioritizes a **thin slice** of the full journey to hit production quickly, then iterates in measured releases.

---

## 2) Scope
### 2.1 In‑Scope (Phase 0–1)
1. **Feasibility Check** via MTN WMS & lead capture fallback  
2. **Location‑aware Product Catalog** (packages, pricing, promos)  
3. **Checkout & Payment** using Netcash (card & EFT)  
4. **Zoho MCP Sync**: customers, quotes/orders, invoices  
5. **Customer Portal**: invoices, payments, tickets  
6. **Partner Portal (MVP)**: onboarding, lead submission, basic dashboards  
7. **Admin Console**: product & price management, content via Strapi  
8. **Notifications** via Resend (order, invoice, ticket events)

### 2.2 Out‑of‑Scope (for now)
- Physical network build & field ops  
- Complex inventory/WMS beyond feasibility lookup  
- Advanced marketing automation (beyond basic campaigns)  
- Hardware asset lifecycle management

### 2.3 Objectives & Success Criteria
- TTFP (time‑to‑first‑production): ≤ 8 weeks for Phase 1 core slice.  
- Payment success rate: ≥ 98% across supported methods.  
- Coverage lookup p95 latency: ≤ 1.5s; order checkout p95: ≤ 2.5s.  
- Data sync integrity MCP↔Supabase: ≥ 99.9% reconciliation accuracy.

---

## 3) Architecture & Tech Stack (High Level)
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind + shadcn/ui, PWA
- **State:** React Query (server state), Zustand (client)
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Content:** Strapi (CMS)
- **Integrations:** Zoho MCP (CRM/CPQ/Billing), Netcash (payments), MTN WMS (feasibility), Resend (email)
- **Observability:** Structured logs, app metrics, error tracking (TBD provider)
- **CI/CD:** GitHub Actions (build, test, deploy to Vercel/Railway), feature flags

> **Note:** See Section 11 for integration contracts & retry policies.

---

## 4) Personas & Primary Journeys (Slimmed for Dev)
### P1) Residential Customer
- **Goals:** Check coverage → select product → pay → self‑service billing & support.

### P2) SMME (Business) Customer
- **Goals:** Feasibility → quote → KYC → order → billing → support.

### P3) Sales Partner
- **Goals:** Onboard → submit/manage leads → view commissions/resources.

### P4) Internal Ops (Admin/Support/Product/Finance)
- **Goals:** Manage catalog, pricing, content, orders, invoices, tickets, reports.

---

## 5) Core Functional Requirements (Must‑Have First)
The following **thin slice** is the MLP (Minimum Lovable Product) for Phase 1.

### F‑01 Feasibility Check & Lead Capture
- **Story:** As a visitor, I enter my address and get coverage results. If unavailable, I can submit my details as a lead.
- **Acceptance Criteria:**
  - Address input (autocomplete + map pin)
  - MTN WMS queried; results cached 10–30 min
  - If `no‑coverage`, persist **Lead** with contact + address
  - Basic rate limiting & bot protection

### F‑02 Location‑Aware Product Catalog
- **Story:** As a user, I see products filtered by location and can compare packages.
- **AC:**
  - Query products where `is_active` and `coverage_area` matches
  - Prices, promos, contract terms surfaced
  - SEO‑friendly slugs & filterable facets (speed, price, term)

### F‑03 Checkout & Payment (Netcash)
- **Story:** As a user, I purchase a package securely and receive confirmation.
- **AC:**
  - Cart → order create → pay → webhook confirmation → receipt email
  - Idempotent order creation; duplicate webhook safe
  - PCI‑scope minimized (hosted fields or redirect)

### F‑04 CRM/CPQ & Billing Sync (Zoho MCP)
- **Story:** As ops, I need orders & invoices reflected in MCP.
- **AC:**
  - Customer create/update; quote→order; invoice create
  - Two‑way sync guards & reconciliation job (nightly)

### F‑05 Customer Portal (MVP)
- **Story:** As a customer, I view invoices, pay outstanding, and log tickets.
- **AC:**
  - Auth with Supabase; RBAC role=customer
  - Invoices (from MCP), payment status & history
  - Ticket create/view/update; email notifications via Resend

### F‑06 Partner Portal (MVP)
- **Story:** As a partner, I onboard and submit leads.
- **AC:**
  - Role=partner; KYC upload; lead submission; basic dashboard

### F‑07 Admin Console (Essential)
- **Story:** As admin/product, I manage catalog, pricing, content.
- **AC:**
  - Product CRUD, price books, bundles; Strapi content blocks

---

## 6) Non‑Functional Requirements (Quantified)
- **Security:**
  - OWASP Top 10 mitigations; JWT with short TTL + refresh; least‑privilege RBAC
  - Data at rest (Postgres/Storage) and in transit (TLS 1.2+)
- **Performance:**
  - p95: Feasibility ≤1.5s; Catalog ≤1.2s; Checkout ≤2.5s; Portal pages ≤1.5s
- **Availability:**
  - Core APIs 99.9% monthly; scheduled maintenance windows documented
- **Reliability:**
  - Idempotent webhooks; exponential backoff; circuit breakers for third‑parties
- **Observability:**
  - Correlation IDs, structured JSON logs, error budgets, SLO dashboards
- **Privacy/Compliance:**
  - POPIA compliant consent & data processing; audit trails for CRUD ops

---

## 7) Data Model (Essentials)
> _Detailed ERD to follow; below are key entities/relations used in Phase 1._

- **Customer** (id, role, contact, address, consent_flags)
- **Lead** (id, source, contact, address, coverage_result, status)
- **Product** (id, name, slug, speed_tier, term, price, tags, coverage_areas[])
- **Order** (id, customer_id, items[], total, status, mcp_reference)
- **Invoice** (id, customer_id, order_id, amount, due_date, paid_status, mcp_reference)
- **Payment** (id, order_id, provider=Netcash, status, reference, raw_webhook)
- **Ticket** (id, customer_id, subject, description, status, priority)
- **Partner** (id, org, contact, kyc_docs, approval_status)

**Soft‑delete** via `deleted_at`; all tables include `created_at`, `updated_at`.

---

## 8) API Surface (Developer Inventory)
> _Prefix all internal routes with `/api/v1`. Protect with RBAC middleware. Return problem+json on errors._

### Public/Visitor
- `POST /api/v1/coverage/check` – address → MTN WMS result (cache)  
- `POST /api/v1/leads` – create lead on no‑coverage

### Catalog
- `GET /api/v1/catalog` – location filters → products  
- `GET /api/v1/products/:slug` – product detail

### Orders & Payments
- `POST /api/v1/orders` – create order (idempotent key)  
- `POST /api/v1/payments/intent` – Netcash init/redirect  
- `POST /api/v1/payments/netcash/webhook` – provider webhook (idempotent)

### Accounts & Billing
- `GET /api/v1/me/invoices` – list from MCP mirror  
- `POST /api/v1/me/pay` – settle outstanding via Netcash

### Support
- `POST /api/v1/tickets` – create ticket  
- `GET /api/v1/tickets` – list my tickets

### Partner
- `POST /api/v1/partner/onboard` – KYC submit  
- `POST /api/v1/partner/leads` – create lead

> **Note:** Admin routes (`/api/v1/admin/*`) for product/catalog management, approvals, and audits.

---

## 9) Integration Contracts (MVP‑Level)
### 9.1 MTN WMS
- **Call:** REST (addr → coverage JSON), timeout 3s, retry ×2, cache 30m  
- **Failure Mode:** Degrade to lead capture; log with `coverage_miss=true`.

### 9.2 Netcash
- **Flow:** init → hosted/redirect → webhook → receipt email  
- **Security:** HMAC signature verification; idempotency keys on order & webhook

### 9.3 Zoho MCP
- **Objects:** Contact/Account, Quote/Order, Invoice  
- **Sync:** Event‑driven + nightly full reconciliation; conflict policy = MCP wins for invoices, local wins for session cart  
- **Limits:** Backoff on 429; dead‑letter queue for failed mutations

### 9.4 Strapi & Resend
- **Strapi:** Content blocks (docs, banners, FAQs) via read APIs & webhooks  
- **Resend:** Transactional templates with dynamic payload; retries ×3

---

## 10) RBAC Matrix (Summary)
| Role        | Abilities (Phase 1) |
|-------------|---------------------|
| Visitor     | Feasibility, view catalog, create lead |
| Customer    | Orders, invoices, payments, tickets |
| Partner     | Onboard, submit leads, view basic dashboard |
| Admin       | Product & price CRUD, content, approvals, audits |
| Support     | Ticket triage/update, customer lookup |
| Finance     | Invoice oversight, reconciliation reports |

> Enforce least‑privilege via Supabase policies; all mutations logged.

---

## 11) Operational Playbooks
### 11.1 Error Handling & Retries
- All outbound calls: timeout, retry with jitter, circuit breaker, DLQ on fail.
- Webhooks: verify signature, dedupe by `event_id`.

### 11.2 Observability
- Correlation ID (`x‑req‑id`) across frontend→edge→providers
- p95 dashboards; alerting on error budget burn & webhook failures

### 11.3 Security & Compliance
- POPIA consent records; data minimization; audit log stream  
- Secrets in platform vault; rotating keys; least‑privilege service accounts

---

## 12) Changelog (Living)
| Date       | Version | Author | Change |
|------------|---------|--------|--------|
| 2025‑10‑25 | v0.9    | Prod/Eng | Initial living BRS refactor for core functionality & roadmap |

---

## 13) Roadmap & Delivery Plan
### 13.1 Release Ladder (High‑Level)
- **v0.9 (Today):** Living BRS established; dev kickoff materials ready  
- **v1.0 (T‑8 weeks):** Core slice GA — Feasibility, Catalog, Checkout, MCP/Invoice sync, Customer Portal MVP  
- **v1.1 (T+4 weeks):** Partner Portal MVP, Admin price books, ticket triage improvements  
- **v1.2 (T+4 weeks):** Campaign basics, reports, reconciliation tooling, performance hardening

### 13.2 90‑Day Plan (Epics → Milestones)
**M1 (Weeks 1–3):**
- F‑01 Feasibility & Leads  
- F‑02 Catalog (location filters)  
- Netcash sandbox, Webhook infra  
- Observability baseline, RBAC policies

**M2 (Weeks 4–6):**
- F‑03 Checkout & Payments  
- F‑04 MCP: customers, quotes→orders, invoices  
- Customer Portal invoices & payments  
- Reconciliation job v1

**M3 (Weeks 7–8):**
- Hardening: retries, idempotency, cache strategy  
- Security review, load test  
- Release v1.0 GA

**M4 (Weeks 9–12):**
- Partner Portal MVP  
- Admin price books & bundles  
- Support tickets v1 + email workflows  
- Release v1.1

---

## 14) Backlog (Next Up)
- Referral links & partner attribution on checkout  
- Contract terms & digital signatures  
- BI dashboards (product performance, cohort churn, ARPU)  
- Multi‑currency support (future regional expansion)

---

## 15) Definition of Ready (DoR) & Done (DoD)
**DoR:** Story has user value, AC in Gherkin, designs (if UI), API defined, test notes.  
**DoD:** Unit/integration tests pass, AC met, security checks, logs/metrics added, docs updated.

---

## 16) Example Acceptance Criteria (Gherkin)
```
Feature: Checkout payment
  Scenario: Successful Netcash payment
    Given a customer with an unpaid order
    When they pay via Netcash and the webhook is received
    Then the order status is set to "paid"
    And a receipt email is sent
    And an invoice exists in Zoho MCP
```

---

## 17) Open Questions & Assumptions
- MTN WMS quota & SLA? (assume burst 10 rps, soft limit 100/min)
- Exact MCP objects/fields for quotes vs orders? (confirm mapping)
- Netcash payment methods & settlement timelines? (confirm T+2)

---

## 18) Appendix: UI/UX & Content
- Minimal UI to validate flows; Strapi provides FAQs, banners, and T&Cs.
- Accessibility: WCAG AA targets on forms & contrast.

---

## 19) Appendix: Testing Strategy
- Unit tests on utilities & API handlers  
- Contract tests for MCP/Netcash/WMS stubs  
- E2E smoke (Playwright): feasibility→catalog→checkout happy path  
- Load test: p95 targets per Section 6

---

> **Next Action:** Engineers can now break down Section 13 epics into tasks in the tracker, using Sections 5, 8, 9, and 16 to define AC and contracts.

