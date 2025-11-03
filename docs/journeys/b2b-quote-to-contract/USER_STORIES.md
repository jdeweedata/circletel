# User Stories: B2B Quote-to-Contract Workflow with KYC Compliance

**Feature**: Complete automation from quote generation through service activation with integrated Didit KYC compliance and RICA pairing.

**Epic**: B2B Quote-to-Contract Automation & Compliance

**Document Version**: 1.0
**Created**: 2025-11-01
**Status**: Ready for Sprint Planning
**Related Spec**: `Quote-to-Contract Workflow.md` (Version 3.0)

---

## Table of Contents

1. [Primary User Stories](#primary-user-stories)
2. [Technical Stories](#technical-stories)
3. [Edge Cases & Error Handling](#edge-cases--error-handling)
4. [RBAC Summary](#rbac-summary)
5. [Story Point Estimates](#story-point-estimates)

---

## CircleTel User Personas

### Customer Personas

1. **B2C Customer (Residential)**
   - Needs: Simple coverage check, affordable packages, easy ordering
   - Tech savvy: Medium
   - Primary concerns: Price, speed, coverage availability

2. **B2B Customer (SME)**
   - Needs: Reliable connectivity, SLA guarantees, business packages
   - Tech savvy: Medium to High
   - Primary concerns: Uptime, support, scalability

3. **Enterprise Customer**
   - Needs: Custom solutions, dedicated support, volume discounts
   - Tech savvy: High
   - Primary concerns: Security, compliance, integration

### Internal Personas

4. **Admin User (CircleTel Staff)**
   - Roles: Super Admin, Product Manager, Sales Rep, Support Agent
   - Needs: Product management, customer management, analytics
   - Tech savvy: High
   - Primary concerns: Efficiency, data accuracy, RBAC

5. **Sales Representative**
   - Needs: Lead tracking, package comparison, quick quotes
   - Tech savvy: Medium
   - Primary concerns: Conversion, commission tracking, CRM integration

6. **Operations Manager**
   - Needs: Fulfillment tracking, SLA monitoring, RICA compliance
   - Tech savvy: High
   - Primary concerns: Service delivery, compliance, efficiency

7. **Compliance Officer (Admin)**
   - Needs: KYC review queue, risk assessment, audit trails
   - Tech savvy: High
   - Primary concerns: FICA/RICA compliance, fraud prevention

---

## Primary User Stories

### Story 1: Frictionless KYC Verification for SME Customers

**Story ID**: `B2B-KYC-001`
**Priority**: Critical
**Story Points**: 13

**As a** B2B Customer (SME)
**I want to** complete identity and company verification in under 3 minutes during quote acceptance
**So that** I can proceed to contract signing without delays or manual document submission

#### Acceptance Criteria

- [ ] After accepting quote, KYC session automatically created based on quote value (<R500k = light KYC, >R500k = full KYC)
- [ ] Customer redirected to Didit verification page (embedded iframe or new tab)
- [ ] Guided upload process for 3-5 documents (ID, company registration CK1, proof of address)
- [ ] AI extraction completes within 30 seconds per document
- [ ] Real-time progress indicator shows "ID Scanned ✓", "Company Verified ✓", "Address Confirmed ✓"
- [ ] Liveness detection (passive - no user action) completes automatically for high-risk cases
- [ ] Low-risk customers (liveness >80%, no AML flags) auto-approved → contract generation triggered
- [ ] High-risk customers escalated to admin review queue with flagged reason
- [ ] Declined customers shown "Retry Verification" button with explanation
- [ ] KYC status visible in customer email: "✅ Verification Complete - Contract Ready"
- [ ] Average completion time <3 minutes for SME, <2 minutes for sole proprietors

#### RBAC Considerations

- **Access**: B2B Customer (public-facing), Admin (compliance queue)
- **Permissions**: `kyc:submit` (customer), `kyc:review` (admin), `kyc:override` (super admin)
- **Data Visibility**: Customers see own KYC status only; admins see all pending reviews

#### Technical Notes

- Didit webhook `verification.completed` triggers risk scoring
- Extracted data stored in `kyc_sessions.extracted_data` (JSONB)
- Auto-generate contract if `verification_result = 'approved' AND risk_tier = 'low'`

#### Dependencies

- Didit API integration (Didit account setup, webhook configuration)
- `kyc_sessions` database table
- Risk scoring algorithm implementation

#### Testing Scenarios

1. **Happy Path**: SME customer completes light KYC, auto-approved in <3 min
2. **High-Risk Path**: Enterprise customer flagged for manual review, admin approves
3. **Declined Path**: Customer with invalid ID, shown retry option
4. **Timeout Path**: Customer closes browser mid-verification, resumes later

---

### Story 2: Automated Contract Generation with Digital Signatures

**Story ID**: `B2B-CONTRACT-001`
**Priority**: Critical
**Story Points**: 8

**As a** Sales Representative
**I want** contracts to auto-generate with KYC-verified customer data and send to ZOHO Sign immediately after approval
**So that** I can close deals faster without manual contract creation or chasing signatures

#### Acceptance Criteria

- [ ] Contract auto-generates within 2 seconds of KYC approval
- [ ] Contract number follows format `CT-YYYY-NNN` (auto-incrementing)
- [ ] Contract PDF includes "✅ KYC Verified by Didit" badge with verification date
- [ ] Customer details (name, email, ID number) pre-populated from Didit-extracted data
- [ ] Service details, pricing, SLAs pulled from approved quote
- [ ] T&Cs template applied based on service type (fibre/wireless/hybrid)
- [ ] ZOHO Sign request created automatically with 2 signers: Customer (order 1) → CircleTel (order 2)
- [ ] Customer receives ZOHO Sign email within 1 minute with "Sign Contract" link
- [ ] Sales rep notified via dashboard alert: "Contract sent to [Customer Name]"
- [ ] ZOHO CRM deal updated with custom fields: `KYC_Verified: true`, `Contract_Status: pending_signature`
- [ ] If customer doesn't sign within 48 hours, automated reminder email sent
- [ ] Once fully signed, contract status updates to `fully_signed` and invoice generation triggers

#### RBAC Considerations

- **Access**: Sales Rep (view contracts for own quotes), Manager (view all), Admin (full CRUD)
- **Permissions**: `contracts:create` (sales rep if quote approved), `contracts:view_all` (manager), `contracts:edit` (admin only)
- **Data Visibility**: Sales reps see contracts linked to their quotes; managers see team contracts

#### Technical Notes

- Trigger: `kyc_sessions.status = 'completed' AND verification_result = 'approved'`
- ZOHO Sign webhook `request.completed` updates `contracts.status` and `contracts.fully_signed_date`
- Signed PDF stored in Supabase Storage with public URL in `contracts.signed_pdf_url`

#### Dependencies

- ZOHO Sign API integration (OAuth setup, webhook configuration)
- `contracts` database table
- PDF generator service (`lib/contracts/pdf-generator.ts`)
- Email service (Resend integration)

#### Testing Scenarios

1. **Happy Path**: KYC approved → Contract sent → Customer signs within 24h
2. **Delayed Signature**: Customer receives reminder after 48h, signs on day 3
3. **Expired Contract**: Customer doesn't sign within 30 days, contract expired
4. **ZOHO Sign Downtime**: Retry mechanism queues contract for sending

---

### Story 3: RICA Auto-Submission Using KYC Data

**Story ID**: `B2B-RICA-001`
**Priority**: High
**Story Points**: 13

**As an** Operations Manager
**I want** RICA submissions to auto-populate using Didit-extracted KYC data after installation
**So that** we achieve 100% RICA compliance without manual data entry or delays

#### Acceptance Criteria

- [ ] After installation marked complete, system retrieves KYC data from `kyc_sessions` table
- [ ] RICA payload auto-built with:
  - ICCID(s): From installation equipment (SIM card IDs)
  - ID Number: From `extracted_data.id_number` (Didit)
  - Company Reg: From `extracted_data.company_reg` (if business)
  - Proof of Address: From `extracted_data.proof_of_address` (Didit)
  - Directors: From `extracted_data.directors[]` (if business)
- [ ] Submission to RICA system (ICASA API or vendor) completes within 5 seconds
- [ ] `rica_submissions` record created with `status: 'submitted'` and tracking ID
- [ ] Admin receives dashboard notification: "RICA submitted for Order ORD-2025-001"
- [ ] If RICA approved (webhook received), service activates automatically within 1 hour
- [ ] If RICA rejected, order flagged with reason and admin notified for manual review
- [ ] Zero manual data entry required if KYC data complete (90%+ cases)
- [ ] Admin can view RICA status in fulfillment dashboard with color-coded badges (Pending/Submitted/Approved/Rejected)
- [ ] Audit trail links KYC session → Installation → RICA submission → Activation

#### RBAC Considerations

- **Access**: Operations Manager (view all RICA submissions), Admin (full access), Technician (view own installations)
- **Permissions**: `rica:submit` (system auto-trigger), `rica:view` (ops manager), `rica:override` (admin for manual fixes)
- **Data Visibility**: Operations sees all submissions; technicians see only assigned installations

#### Technical Notes

- Trigger: `installation_schedules.status = 'completed' AND service_completion_records.customer_signed_off = true`
- RICA webhook `rica.approved` triggers `activateService(order_id)`
- If KYC data incomplete (missing PoA), fallback to manual admin form with pre-filled fields

#### Dependencies

- RICA API integration (vendor selection, credentials setup)
- `rica_submissions` database table
- Fulfillment system (installation tracking)
- Webhook handler for RICA approvals

#### Testing Scenarios

1. **Happy Path**: Installation complete → RICA auto-submitted → Approved → Service activated
2. **Incomplete KYC Data**: Missing PoA → Admin prompted to manually add → Resubmitted
3. **RICA Rejection**: ID mismatch → Admin corrects → Resubmitted → Approved
4. **Webhook Failure**: RICA approved but webhook not received → Manual status check triggers activation

---

### Story 4: Real-Time ZOHO CRM Sync with KYC Status

**Story ID**: `B2B-ZOHO-001`
**Priority**: High
**Story Points**: 8

**As a** Sales Manager
**I want** all quote, KYC, and contract data to sync to ZOHO CRM in real-time
**So that** I can track deal progression and team performance without switching systems

#### Acceptance Criteria

- [ ] When quote approved, ZOHO Estimate created with quote number, customer, line items, totals
- [ ] When KYC completed, ZOHO custom fields updated: `KYC_Status: approved/declined`, `KYC_Verified_Date`, `Risk_Tier: low/medium/high`
- [ ] When contract sent to ZOHO Sign, ZOHO Deal created/updated with stage: `Negotiation`
- [ ] When contract fully signed, ZOHO Deal stage updated to `Closed Won`
- [ ] When RICA approved, ZOHO Deal custom field updated: `RICA_Status: approved`, `RICA_Approved_Date`
- [ ] All syncs complete within 5 seconds of CircleTel event
- [ ] Bidirectional sync: If ZOHO Deal updated manually, CircleTel contract updated (for specific fields like "Close Date")
- [ ] Sync failures logged to `zoho_sync_logs` table with retry mechanism (3 attempts, exponential backoff)
- [ ] Sales Manager can view sync status in admin dashboard: "Last synced: 2 min ago ✓"
- [ ] Manual "Force Sync" button available for admins if webhook missed
- [ ] ZOHO CRM reports show: Conversion by KYC status, Average KYC completion time, Risk tier distribution

#### RBAC Considerations

- **Access**: Sales Manager (view ZOHO sync status), Admin (manual sync trigger), Super Admin (edit ZOHO config)
- **Permissions**: `zoho:view_status` (sales manager), `zoho:sync_manual` (admin), `zoho:config` (super admin)
- **Data Visibility**: Sales managers see team-wide sync stats; sales reps see own deal sync status

#### Technical Notes

- ZOHO OAuth token refreshed automatically via `zoho_tokens` table
- Webhook endpoint: `POST /api/integrations/zoho/webhook` validates ZOHO signature
- Custom fields created in ZOHO CRM: `KYC_Status`, `KYC_Verified_Date`, `Risk_Tier`, `RICA_Status`, `Contract_Number`, `MRR`

#### Dependencies

- ZOHO CRM API integration (OAuth app creation, custom fields setup)
- ZOHO Sign integration
- `zoho_sync_logs` database table
- Webhook handlers for bidirectional sync

#### Testing Scenarios

1. **Happy Path**: Quote approved → ZOHO Estimate created → KYC complete → Fields updated in <5s
2. **Sync Failure**: ZOHO API down → Logged to sync_logs → Retried successfully after 5 min
3. **Bidirectional Sync**: ZOHO Deal closed date updated → CircleTel contract updated
4. **Manual Sync**: Admin clicks "Force Sync" → All data re-synced to ZOHO

---

### Story 5: Admin Compliance Queue for High-Risk KYC

**Story ID**: `B2B-ADMIN-001`
**Priority**: High
**Story Points**: 5

**As an** Admin User (Compliance Officer)
**I want** a dedicated queue to review high-risk or declined KYC sessions with full context
**So that** I can make informed approval decisions while maintaining 100% FICA compliance

#### Acceptance Criteria

- [ ] Admin compliance dashboard (`/admin/compliance`) shows 3 tabs: "Pending Review", "Approved", "Declined"
- [ ] "Pending Review" tab lists all KYC sessions with `verification_result = 'pending_review'` or `risk_tier = 'high'`
- [ ] Each row shows: Quote #, Customer Name, Company, KYC Status, Risk Tier, Submitted Date, Review Deadline (7 days)
- [ ] Clicking row opens detail panel with:
  - Extracted data (ID number, company reg, PoA details)
  - Didit raw response (liveness score, AML flags, document authenticity)
  - Quote details (amount, services, contract term)
  - Risk score breakdown (liveness 40%, AML 30%, doc validity 30%)
- [ ] Admin actions available: "Approve", "Request More Info", "Decline"
- [ ] If "Approve" clicked, contract generation triggers immediately
- [ ] If "Request More Info", email sent to customer with specific document requests
- [ ] If "Decline", customer notified with reason and "Retry Verification" link
- [ ] All actions logged to audit trail with admin user ID and timestamp
- [ ] Dashboard shows KPIs: "Pending: 5 | Avg Review Time: 2.3 hours | Auto-Approval Rate: 85%"
- [ ] Filter options: Risk Tier, Date Range, Customer Type (SME/Enterprise)
- [ ] Bulk actions: "Approve Selected" (with confirmation modal)

#### RBAC Considerations

- **Access**: Admin (compliance queue), Super Admin (override decisions), Sales Rep (read-only for own quotes)
- **Permissions**: `compliance:review` (admin), `compliance:approve` (admin), `compliance:override` (super admin)
- **Data Visibility**: Admins see all pending reviews; sales reps see KYC status for their quotes only

#### Technical Notes

- Queue powered by view: `v_pending_kyc_reviews` joining `kyc_sessions`, `business_quotes`, `customers`
- WebSocket updates for real-time queue refresh when new KYC sessions added
- SLA tracking: Flag orders red if pending >5 days, send escalation email to manager

#### Dependencies

- Admin dashboard UI
- Audit trail system
- Email notification service
- Real-time updates (WebSocket or Server-Sent Events)

#### Testing Scenarios

1. **Happy Path**: Admin reviews high-risk KYC, approves, contract generated
2. **Request More Info**: Admin requests updated PoA, customer uploads, auto-resubmits
3. **Decline**: Admin declines due to fraudulent ID, customer notified
4. **SLA Breach**: KYC pending >5 days, escalation email sent to manager

---

## Technical Stories

### Technical Story 1: Didit Webhook Handling & Retry Logic

**Story ID**: `B2B-TECH-001`
**Priority**: Critical
**Story Points**: 5

**As a** Developer
**I need to** implement robust Didit webhook handling with signature verification and retry logic
**So that** KYC verifications are reliably processed even during API downtime

#### Acceptance Criteria

- [ ] Webhook endpoint `POST /api/compliance/webhook/didit` validates HMAC-SHA256 signature using `DIDIT_WEBHOOK_SECRET`
- [ ] Invalid signatures return `401 Unauthorized` with error logged to Sentry
- [ ] Valid webhooks parsed and routed by event type: `verification.completed`, `verification.failed`, `session.abandoned`
- [ ] For `verification.completed`, update `kyc_sessions` table with extracted data, verification result, risk tier
- [ ] If database update fails, webhook payload stored in `webhook_failures` table for manual retry
- [ ] Idempotency enforced using `raw_webhook_payload` comparison (prevent duplicate processing)
- [ ] Automatic retry for failed database operations (3 attempts, 5s delay between)
- [ ] If all retries fail, alert sent to Slack `#engineering-alerts` channel
- [ ] Webhook processing latency <1 second (measured via CloudWatch)
- [ ] Unit tests cover: Valid signature, invalid signature, duplicate webhook, database failure scenarios

#### Technical Notes

- Use `crypto.timingSafeEqual()` for signature comparison to prevent timing attacks
- Store raw webhook payload in `kyc_sessions.raw_webhook_payload` for debugging
- Monitor webhook failures via Datadog dashboard

#### Dependencies

- Didit webhook secret configured in `.env`
- `webhook_failures` database table
- Error monitoring (Sentry)
- Alerting (Slack webhook)

#### Testing Scenarios

1. **Valid Webhook**: Signature valid → Payload processed → KYC session updated
2. **Invalid Signature**: Signature mismatch → 401 returned → Error logged
3. **Duplicate Webhook**: Same payload received twice → Second request ignored
4. **Database Failure**: DB down → Webhook stored in failures table → Retried successfully

---

### Technical Story 2: Database Migrations for KYC & RICA Tables

**Story ID**: `B2B-TECH-002`
**Priority**: Critical
**Story Points**: 3

**As a** Developer
**I need to** create Supabase migrations for `kyc_sessions` and `rica_submissions` tables with proper RLS
**So that** KYC data is securely stored with row-level access control

#### Acceptance Criteria

- [ ] Migration file `20251101000001_create_kyc_system.sql` creates:
  - `kyc_sessions` table (11 columns: id, quote_id, didit_session_id, flow_type, status, extracted_data JSONB, etc.)
  - `rica_submissions` table (8 columns: id, kyc_session_id, order_id, iccid[], status, icasa_response JSONB, etc.)
- [ ] Foreign key constraints: `kyc_sessions.quote_id → business_quotes.id` (CASCADE delete), `rica_submissions.kyc_session_id → kyc_sessions.id`
- [ ] Indexes: `kyc_sessions(didit_session_id)` UNIQUE, `kyc_sessions(quote_id)`, `rica_submissions(icasa_tracking_id)`
- [ ] Trigger `trigger_kyc_session()` auto-creates KYC session when `business_quotes.status = 'approved'`
- [ ] RLS policies:
  - Customers: SELECT own KYC sessions (via `auth.uid()` matching customer)
  - Admins: ALL operations on all KYC sessions (via `admin_users.role` check)
  - System: INSERT for webhook handlers (service role key)
- [ ] CHECK constraints: `status IN ('not_started', 'in_progress', 'completed', 'abandoned', 'declined')`
- [ ] Default values: `created_at = NOW()`, `status = 'not_started'`
- [ ] Migration rollback tested: `supabase db reset` restores pre-migration state
- [ ] Applied to staging environment successfully before production

#### Technical Notes

- Use `JSONB` for `extracted_data` to support flexible Didit response schema
- Enable `pgcrypto` extension for UUID generation
- RLS policy function: `user_is_admin()` checks `auth.uid()` in `admin_users` table

#### Dependencies

- Supabase CLI installed
- Staging environment for testing
- `business_quotes` table exists
- `admin_users` table exists

#### Testing Scenarios

1. **Migration Up**: Applied successfully, tables created with correct schema
2. **Migration Down**: Rollback successful, tables dropped, no orphaned data
3. **RLS Customer**: Customer can SELECT own KYC session, cannot SELECT others
4. **RLS Admin**: Admin can SELECT/UPDATE/DELETE all KYC sessions
5. **Trigger**: Quote approved → KYC session auto-created with correct flow_type

---

## Edge Cases & Error Handling

### Edge Case 1: KYC Session Timeout

**Story ID**: `B2B-EDGE-001`
**Priority**: Medium
**Story Points**: 3

**As a** B2B Customer with slow internet connection
**I need** the ability to resume KYC verification if my session times out
**So that** I don't lose progress and can complete verification later

#### Acceptance Criteria

- [ ] If customer closes browser mid-verification, Didit session remains valid for 24 hours
- [ ] Customer can return to quote acceptance page and click "Resume Verification"
- [ ] Existing `kyc_sessions` record reused (no duplicate creation)
- [ ] If session expired (>24 hours), new session created with "Retrying verification" notice
- [ ] Partial progress saved in `extracted_data` (e.g., ID verified but PoA pending)
- [ ] Email sent to customer after 6 hours of inactivity: "Complete your verification to proceed"
- [ ] After 7 days of inactivity, session marked `abandoned` and quote expires

#### Testing Scenarios

1. **Resume Within 24h**: Customer closes browser after ID upload → Returns next day → Resumes successfully
2. **Session Expired**: Customer returns after 3 days → New session created → Starts fresh
3. **Reminder Email**: Customer inactive for 6h → Email sent → Customer completes verification

---

### Edge Case 2: RICA Rejection Due to Data Mismatch

**Story ID**: `B2B-EDGE-002`
**Priority**: Medium
**Story Points**: 3

**As an** Admin User
**I need** tools to manually correct RICA submissions when auto-submission fails
**So that** customers aren't blocked from activation due to minor data discrepancies

#### Acceptance Criteria

- [ ] If RICA rejected with reason "ID mismatch", admin sees edit form pre-filled with Didit data
- [ ] Admin can override: ID number, address fields, director details
- [ ] Override reason required (dropdown: "Customer typo", "Didit extraction error", "Updated documents")
- [ ] Manual resubmission logs admin user ID and override reason to audit trail
- [ ] If resubmission approved, service activates normally
- [ ] Customer notified: "We've corrected your details and resubmitted RICA. Expect activation within 24 hours."

#### Testing Scenarios

1. **Manual Correction**: RICA rejected (typo) → Admin corrects ID → Resubmitted → Approved
2. **Multiple Rejections**: RICA rejected twice → Admin escalates to customer for document update
3. **Audit Trail**: Manual correction logged with admin ID, reason, timestamp

---

## RBAC Summary

| Persona | Key Permissions | Data Access | Pages/Features |
|---------|----------------|-------------|----------------|
| **B2B Customer (SME)** | `kyc:submit`, `quotes:view_own`, `contracts:view_own` | Own KYC sessions, quotes, contracts | Quote acceptance, KYC verification, contract signing |
| **Sales Representative** | `quotes:create`, `quotes:view_own`, `contracts:view_own`, `zoho:view_status` | Own quotes/contracts, team KYC status (read-only) | Quote creation, contract list, ZOHO sync status |
| **Sales Manager** | `quotes:view_all`, `contracts:view_all`, `zoho:view_status`, `compliance:view_queue` | All team quotes/contracts, KYC queue (read-only) | Team dashboard, contracts list, compliance queue (read-only) |
| **Admin (Compliance)** | `compliance:review`, `compliance:approve`, `kyc:override`, `rica:override` | All KYC sessions, RICA submissions (full CRUD) | Compliance queue, KYC detail view, RICA manual correction |
| **Operations Manager** | `rica:view`, `rica:submit`, `fulfillment:manage`, `sla:view` | All RICA submissions, installations, SLA tracking | Fulfillment dashboard, RICA status, installation calendar |
| **Super Admin** | `*:*` (all permissions) | All data (unrestricted) | All admin pages, system configuration |

---

## Story Point Estimates

### Story Point Legend (Fibonacci)
- **1**: Trivial change (1-2 hours)
- **2**: Simple feature (half day)
- **3**: Moderate feature (1 day)
- **5**: Complex feature (2-3 days)
- **8**: Large feature (1 week)
- **13**: Epic feature (2 weeks)

### Story Breakdown by Sprint

#### Sprint 1: KYC Foundation (Total: 21 points)
- `B2B-KYC-001`: Frictionless KYC Verification (13 points)
- `B2B-TECH-001`: Didit Webhook Handling (5 points)
- `B2B-TECH-002`: Database Migrations (3 points)

#### Sprint 2: Contracts & CRM Integration (Total: 16 points)
- `B2B-CONTRACT-001`: Automated Contract Generation (8 points)
- `B2B-ZOHO-001`: Real-Time ZOHO CRM Sync (8 points)

#### Sprint 3: RICA & Admin Tools (Total: 18 points)
- `B2B-RICA-001`: RICA Auto-Submission (13 points)
- `B2B-ADMIN-001`: Admin Compliance Queue (5 points)

#### Sprint 4: Polish & Edge Cases (Total: 6 points)
- `B2B-EDGE-001`: KYC Session Timeout (3 points)
- `B2B-EDGE-002`: RICA Manual Correction (3 points)

### Total Effort
- **Total Story Points**: 61
- **Estimated Duration**: 4 sprints (8 weeks with 2-week sprints)
- **Team Velocity Assumption**: 15-20 points per sprint (3-4 developers)

---

## Success Metrics

### Business KPIs (30 days post-launch)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Quote-to-Contract Conversion** | 40% | 55% | Track quote acceptance → contract signed |
| **KYC Completion Rate** | N/A | 90% | KYC sessions completed / started |
| **Average KYC Time** | N/A | <3 min | Median time from start → completion |
| **Auto-Approval Rate** | N/A | 85% | Low-risk KYC auto-approved / total |
| **RICA Submission Accuracy** | 70% (manual) | 95% | RICA approved first time / total |
| **Contract-to-Activation Time** | 10 days | <1 day | Contract signed → service activated |
| **ZOHO Sync Success Rate** | N/A | 98% | Successful syncs / total attempts |

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Didit Webhook Latency** | <1s | Average webhook processing time |
| **Contract Generation Time** | <2s | Time from KYC approval → PDF generated |
| **RICA Submission Time** | <5s | Time from installation → RICA submitted |
| **ZOHO Sync Latency** | <5s | Time from CircleTel event → ZOHO updated |
| **API Uptime** | 99.9% | Uptime monitoring (Datadog) |

---

## Dependencies & Risks

### External Dependencies

| Dependency | Risk Level | Mitigation |
|------------|-----------|------------|
| **Didit API Availability** | Medium | Implement webhook retry logic, cache extracted data |
| **ZOHO CRM/Sign API Limits** | Low | Rate limiting, exponential backoff |
| **RICA API Vendor** | High | Identify vendor early, have fallback manual process |
| **NetCash Payment Gateway** | Low | Already integrated, stable |

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **KYC Extraction Accuracy <95%** | High | Medium | Manual review queue for high-risk, escalation process |
| **RICA API Downtime** | High | Low | Queue submissions, retry mechanism, manual fallback |
| **ZOHO Sync Failures** | Medium | Medium | Retry logic, manual sync button, sync status dashboard |
| **Database Performance (JSONB queries)** | Medium | Low | Index JSONB fields, optimize queries, caching |

---

## Appendix: Related Documentation

- **Technical Spec**: `Quote-to-Contract Workflow.md` (Version 3.0)
- **Database Schema**: See spec Section 3 (Complete Workflow Stages)
- **API Documentation**: See spec Section 4 (Integration Details)
- **Implementation Timeline**: See spec Section 6 (14-day plan)
- **Testing Strategy**: See spec Section 9 (E2E test scenarios)

---

**Document Maintained By**: Product Team
**Last Review**: 2025-11-01
**Next Review**: Before Sprint 1 kickoff
**Approval Status**: Pending stakeholder sign-off
