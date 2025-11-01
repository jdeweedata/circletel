# Task Breakdown: Customer Dashboard Production Readiness

## Overview

**Total Story Points**: 147
**Total Task Groups**: 20
**Estimated Timeline**: 4 weeks (with parallel work)
**Assigned Implementers**: 5 (database-engineer, backend-engineer, api-engineer, frontend-engineer, testing-engineer)

### Timeline Estimate
- **Phase 1: Foundation** (Week 1) - 34 points
- **Phase 2: Billing Core** (Week 2) - 38 points
- **Phase 3: Service Management** (Week 2-3) - 29 points
- **Phase 4: Integrations** (Week 3) - 23 points
- **Phase 5: Dashboard UI** (Week 3-4) - 18 points
- **Phase 6: Migration & Testing** (Week 4) - 5 points

### Risk Assessment

**HIGH RISK Tasks** (require extra attention):
- Task Group 1.1: Database schema migration (breaking changes)
- Task Group 1.2: Data backfill script (data integrity)
- Task Group 2.2: Pro-rata calculation logic (complex business rules)
- Task Group 3.1: Service activation workflow (multi-step transaction)
- Task Group 6.1: Legacy table consolidation (large data migration)

---

## Phase 1: Foundation (Week 1) - 34 Story Points

### Task Group 1.1: Database Schema Enhancement - Core Tables

**Assigned Implementer:** database-engineer
**Story Points:** 8
**Dependencies:** None
**Priority:** CRITICAL
**Risk Level:** HIGH

#### Description
Enhance existing tables with foreign keys and create account number generation system. This is the foundation for all customer-related features.

#### Tasks
- [ ] 1.1.1 Add customer_id and auth_user_id columns to consumer_orders
  - Add UUID columns with foreign key constraints
  - Create indexes for performance
  - Update existing RLS policies
- [ ] 1.1.2 Create account_number_counter table
  - Implement serial counter with year tracking
  - Add unique constraint on year column
  - Create indexes
- [ ] 1.1.3 Create generate_account_number() function
  - Implement continuous counter logic (no annual reset)
  - Format: CT-YYYY-NNNNN
  - Handle concurrent requests (transaction safety)
- [ ] 1.1.4 Add trigger to customers table
  - Auto-generate account number on INSERT
  - Only trigger when account_number IS NULL
- [ ] 1.1.5 Enhance customers table
  - Add account_number VARCHAR(20) UNIQUE
  - Add account_status VARCHAR(20) DEFAULT 'active'
  - Add auth_user_id UUID REFERENCES auth.users(id) UNIQUE
  - Add account_type VARCHAR(20) DEFAULT 'residential'
- [ ] 1.1.6 Write 4 focused tests
  - Test account number generation format
  - Test concurrent counter increments
  - Test foreign key constraints
  - Test trigger behavior

#### Acceptance Criteria
- [ ] All columns added successfully without downtime
- [ ] Foreign key constraints enforce data integrity
- [ ] Account numbers generate correctly (CT-2025-00001 format)
- [ ] Concurrent requests handled without duplicate numbers
- [ ] 4 tests pass (schema validation, constraint testing)

#### Testing Requirements (4 tests maximum)
1. Account number format validation
2. Concurrent counter increment test (race condition)
3. Foreign key constraint enforcement
4. Trigger auto-generation test

---

### Task Group 1.2: Data Backfill and Validation

**Assigned Implementer:** database-engineer
**Story Points:** 8
**Dependencies:** Task Group 1.1
**Priority:** CRITICAL
**Risk Level:** HIGH

#### Description
Backfill customer_id and auth_user_id in existing consumer_orders records. Handle orphaned records and validate data integrity.

#### Tasks
- [ ] 1.2.1 Write backfill SQL script
  - Match consumer_orders to customers by email
  - Set customer_id and auth_user_id
  - Use CTE for efficient batch processing
- [ ] 1.2.2 Create orphaned orders report query
  - Identify orders with no matching customer
  - Generate CSV for manual review
  - Include order details for context
- [ ] 1.2.3 Create validation_errors table
  - Store unmatched records for admin review
  - Include error reasons and suggested fixes
- [ ] 1.2.4 Write validation script
  - Check all orders have customer_id
  - Verify auth_user_id matches customer record
  - Generate validation report
- [ ] 1.2.5 Document migration process
  - Step-by-step execution instructions
  - Rollback procedures
  - Expected validation results
- [ ] 1.2.6 Write 3 focused tests
  - Test backfill matching logic
  - Test orphaned record detection
  - Test validation completeness

#### Acceptance Criteria
- [ ] 95%+ of consumer_orders matched to customers
- [ ] Orphaned records documented in validation_errors
- [ ] No data loss during backfill
- [ ] Validation script confirms data integrity
- [ ] 3 tests pass (backfill logic, orphan detection, validation)

#### Testing Requirements (3 tests maximum)
1. Backfill email matching accuracy
2. Orphaned record detection
3. Validation script completeness check

---

### Task Group 1.3: Customer Services and Billing Tables

**Assigned Implementer:** database-engineer
**Story Points:** 8
**Dependencies:** Task Group 1.1
**Priority:** CRITICAL
**Risk Level:** MEDIUM

#### Description
Create core tables for service management and billing. These tables are central to the customer dashboard functionality.

#### Tasks
- [ ] 1.3.1 Create customer_services table
  - Service details (type, package, speed, pricing)
  - Installation info (address, coordinates, connection_id)
  - Lifecycle columns (status, activation/suspension/cancellation dates)
  - Billing columns (monthly_price, billing_date, next_billing_date)
  - Add CHECK constraints for valid statuses and billing dates
- [ ] 1.3.2 Create customer_billing table
  - Balance tracking (account_balance, credit_limit)
  - Payment method info (primary_payment_method_id, type, details JSONB)
  - Billing preferences (preferred_billing_date, auto_pay_enabled, notifications)
  - One-to-one relationship with customers (UNIQUE constraint)
- [ ] 1.3.3 Create indexes for performance
  - customer_services: customer_id, status, connection_id, billing_date
  - customer_billing: customer_id
- [ ] 1.3.4 Create RLS policies
  - Customers view/update own services and billing
  - Admins manage all services and billing (service_role)
- [ ] 1.3.5 Write 5 focused tests
  - Test service status transitions (pending→active→suspended→cancelled)
  - Test billing date CHECK constraint (1, 5, 25, 30 only)
  - Test customer-service relationship
  - Test RLS policies (customer access)
  - Test RLS policies (admin access)

#### Acceptance Criteria
- [ ] All tables created with proper constraints
- [ ] Indexes improve query performance (< 100ms)
- [ ] RLS policies enforce proper access control
- [ ] CHECK constraints prevent invalid data
- [ ] 5 tests pass (status transitions, constraints, RLS)

#### Testing Requirements (5 tests maximum)
1. Service status transition validation
2. Billing date CHECK constraint enforcement
3. Customer-service relationship integrity
4. Customer RLS policy (own data only)
5. Admin RLS policy (all data access)

---

### Task Group 1.4: Invoice and Payment Tables

**Assigned Implementer:** database-engineer
**Story Points:** 8
**Dependencies:** Task Group 1.3
**Priority:** CRITICAL
**Risk Level:** MEDIUM

#### Description
Create tables for invoices, payment methods, transactions, and usage tracking. Includes auto-numbering system for invoices.

#### Tasks
- [ ] 1.4.1 Create customer_invoices table
  - Invoice details (number, date, due_date, period)
  - Amounts (subtotal, vat_rate, vat_amount, total_amount, amount_paid)
  - Computed column: amount_due GENERATED ALWAYS AS (total_amount - amount_paid) STORED
  - Line items (JSONB array)
  - Status and payment tracking
- [ ] 1.4.2 Implement invoice auto-numbering
  - Create sequence customer_invoice_number_seq
  - Create generate_invoice_number() function (INV-YYYY-NNNNN format)
  - Create trigger for automatic number assignment
- [ ] 1.4.3 Create customer_payment_methods table
  - Method type (debit_order, card, eft)
  - Masked display details (display_name, last_four)
  - Encrypted full details (encrypted_details JSONB)
  - NetCash mandate tracking (mandate_id, mandate_status)
  - Primary method flag (is_primary)
- [ ] 1.4.4 Create payment_transactions table
  - Transaction details (transaction_id UNIQUE, amount, currency)
  - Relationships (invoice_id, customer_id, payment_method_id)
  - Status tracking (pending, completed, failed, refunded)
  - NetCash details (netcash_reference, netcash_response JSONB)
- [ ] 1.4.5 Create indexes
  - customer_invoices: customer_id, status, due_date, invoice_number
  - payment_transactions: invoice_id, customer_id, status, transaction_id
- [ ] 1.4.6 Create RLS policies
  - Customers view own invoices and payment methods
  - Admins manage all invoices and transactions
- [ ] 1.4.7 Write 5 focused tests
  - Test invoice auto-numbering sequence
  - Test amount_due computed column
  - Test payment method masking
  - Test transaction uniqueness constraint
  - Test RLS policies

#### Acceptance Criteria
- [ ] Invoice numbering works correctly (INV-2025-00001 format)
- [ ] Amount_due calculation accurate
- [ ] Payment method details properly masked
- [ ] Transaction IDs prevent duplicates
- [ ] 5 tests pass (auto-numbering, computed columns, RLS)

#### Testing Requirements (5 tests maximum)
1. Invoice auto-numbering format and sequence
2. Amount_due computed column accuracy
3. Payment method display masking
4. Transaction_id UNIQUE constraint
5. Customer invoice RLS policy

---

### Task Group 1.5: Audit and Tracking Tables

**Assigned Implementer:** database-engineer
**Story Points:** 2
**Dependencies:** Task Group 1.3
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create tables for audit logging, usage history, suspensions, and cron job execution tracking.

#### Tasks
- [ ] 1.5.1 Create usage_history table
  - Daily usage metrics (date, upload_mb, download_mb, total_mb computed)
  - Billing cycle tracking (billing_cycle_start, billing_cycle_end)
  - Source tracking (interstellio, manual)
  - UNIQUE constraint on (service_id, date)
- [ ] 1.5.2 Create service_action_log table
  - Action details (service_id, admin_user_id, action_type, reason, notes)
  - State tracking (previous_status, new_status)
  - Timestamp for audit trail
- [ ] 1.5.3 Create service_suspensions table
  - Suspension type (non_payment, customer_request, technical)
  - Date tracking (suspended_at, reactivated_at)
  - Billing flag (skip_billing)
- [ ] 1.5.4 Create cron_execution_log table
  - Job tracking (job_name, execution_start, execution_end, status)
  - Results (records_processed, records_failed, error_message)
- [ ] 1.5.5 Create indexes
  - usage_history: service_id, customer_id, date
  - service_action_log: service_id, action_type
  - cron_execution_log: job_name, created_at
- [ ] 1.5.6 Write 3 focused tests
  - Test usage_history UNIQUE constraint
  - Test service_action_log audit trail
  - Test cron_execution_log recording

#### Acceptance Criteria
- [ ] All audit tables created successfully
- [ ] UNIQUE constraints prevent duplicate records
- [ ] Indexes optimize query performance
- [ ] 3 tests pass (constraints, audit trails)

#### Testing Requirements (3 tests maximum)
1. Usage_history (service_id, date) UNIQUE constraint
2. Service_action_log audit trail completeness
3. Cron_execution_log status recording

---

## Phase 2: Billing Core (Week 2) - 38 Story Points

### Task Group 2.1: Billing Service - Core Logic

**Assigned Implementer:** backend-engineer
**Story Points:** 8
**Dependencies:** Task Group 1.4
**Priority:** CRITICAL
**Risk Level:** HIGH

#### Description
Implement core billing service with pro-rata calculations, invoice generation, and billing date handling.

#### Tasks
- [ ] 2.1.1 Create lib/billing/billing-service.ts
  - Class structure with Supabase client integration
  - Reuse patterns from lib/invoices/invoice-generator.ts
- [ ] 2.1.2 Implement calculateProRata() method
  - Calculate days between activation and next billing date
  - Pro-rate monthly amount by days
  - Handle month-end edge cases (28, 29, 30, 31 days)
  - Support 4 billing dates (1st, 5th, 25th, 30th)
- [ ] 2.1.3 Implement generateInvoice() method
  - Create invoice with line items (JSONB array)
  - Calculate VAT (15%)
  - Auto-assign invoice number via database trigger
  - Set due_date (7 days from invoice_date)
- [ ] 2.1.4 Implement getNextBillingDate() method
  - Calculate next billing date based on billing_date preference
  - Handle edge cases (Feb 30th → Feb 28/29)
- [ ] 2.1.5 Implement updateAccountBalance() method
  - Adjust customer_billing.account_balance
  - Handle credits and debits
- [ ] 2.1.6 Write 6 focused tests
  - Test pro-rata calculation accuracy (various activation dates)
  - Test invoice generation with VAT
  - Test next billing date calculation (edge cases)
  - Test account balance updates
  - Test billing date edge cases (Feb 30→28/29)
  - Test multiple billing dates (1st, 5th, 25th, 30th)

#### Acceptance Criteria
- [ ] Pro-rata calculations accurate to 2 decimal places
- [ ] Invoice generation includes all required fields
- [ ] VAT calculation correct (15%)
- [ ] Account balance updates transactional (no race conditions)
- [ ] 6 tests pass (pro-rata, VAT, edge cases)

#### Testing Requirements (6 tests maximum)
1. Pro-rata calculation for mid-cycle activation (Nov 15→Dec 1)
2. Full monthly invoice generation
3. VAT calculation accuracy (15%)
4. Next billing date edge case (Feb 30→Feb 28)
5. Account balance debit/credit operations
6. Multiple billing date support (1st, 5th, 25th, 30th)

---

### Task Group 2.2: Invoice Generation Service

**Assigned Implementer:** backend-engineer
**Story Points:** 5
**Dependencies:** Task Group 2.1
**Priority:** CRITICAL
**Risk Level:** HIGH

#### Description
Extend existing invoice generator to support customer invoices with PDF generation. Reuses lib/invoices/invoice-generator.ts.

#### Tasks
- [ ] 2.2.1 Review and extend lib/invoices/invoice-generator.ts
  - Add generateCustomerInvoice() method
  - Support customer_invoices table structure
  - Maintain B2B invoice compatibility
- [ ] 2.2.2 Implement invoice line item builder
  - Service charges (recurring, pro-rata, one-time)
  - Format descriptions clearly
  - Handle multiple line items per invoice
- [ ] 2.2.3 Implement PDF generation
  - Use existing PDF library (likely PDFKit or similar)
  - CircleTel branding (logo, colors)
  - Include customer details, line items, payment info
  - Support download and email delivery
- [ ] 2.2.4 Implement invoice storage
  - Store PDFs in Supabase Storage bucket (customer-invoices)
  - Generate signed URLs for secure access
  - Set expiry on URLs (24 hours)
- [ ] 2.2.5 Write 4 focused tests
  - Test invoice generation with multiple line items
  - Test PDF generation output (basic validation)
  - Test storage and URL generation
  - Test invoice types (installation, recurring, pro_rata)

#### Acceptance Criteria
- [ ] Invoices generate with correct format
- [ ] PDFs include all required information
- [ ] Storage URLs work and expire correctly
- [ ] Reuses existing invoice generator patterns
- [ ] 4 tests pass (generation, PDF, storage, types)

#### Testing Requirements (4 tests maximum)
1. Multi-line item invoice generation
2. PDF generation basic validation
3. Supabase Storage upload and signed URL
4. Invoice type support (installation, recurring, pro_rata)

---

### Task Group 2.3: Payment Method Management Service

**Assigned Implementer:** backend-engineer
**Story Points:** 5
**Dependencies:** Task Group 1.4
**Priority:** HIGH
**Risk Level:** MEDIUM

#### Description
Implement payment method management with encryption, masking, and validation.

#### Tasks
- [ ] 2.3.1 Create lib/billing/payment-method-service.ts
  - Class structure with encryption utilities
  - Reuse encryption patterns from existing codebase
- [ ] 2.3.2 Implement addPaymentMethod() method
  - Encrypt sensitive details (account numbers, card numbers)
  - Store encrypted data in JSONB field
  - Generate masked display name ("Debit Order - FNB ***1234")
  - Extract last 4 digits for display
- [ ] 2.3.3 Implement setPrimaryMethod() method
  - Update is_primary flag
  - Ensure only one primary method per customer
  - Update customer_billing.primary_payment_method_id
- [ ] 2.3.4 Implement removePaymentMethod() method
  - Soft delete (is_active = false)
  - Prevent deletion of primary method with outstanding balance
- [ ] 2.3.5 Implement getPaymentMethods() method
  - Return only active methods
  - Include masked details only
  - Never return encrypted_details to frontend
- [ ] 2.3.6 Write 5 focused tests
  - Test encryption and masking
  - Test primary method enforcement (only one)
  - Test soft delete
  - Test removal restrictions (outstanding balance)
  - Test masked details in responses

#### Acceptance Criteria
- [ ] Payment details properly encrypted at rest
- [ ] Only last 4 digits visible in UI
- [ ] Primary method enforced (only one)
- [ ] Cannot delete method with outstanding balance
- [ ] 5 tests pass (encryption, masking, constraints)

#### Testing Requirements (5 tests maximum)
1. Encryption and decryption of payment details
2. Display name masking ("Bank ***1234")
3. Primary method uniqueness enforcement
4. Soft delete behavior
5. Outstanding balance deletion restriction

---

### Task Group 2.4: Scheduled Job - Invoice Generation

**Assigned Implementer:** backend-engineer
**Story Points:** 8
**Dependencies:** Task Group 2.1, 2.2
**Priority:** CRITICAL
**Risk Level:** MEDIUM

#### Description
Implement Vercel Cron job for daily invoice generation. Runs at 02:00 SAST daily to generate invoices 7 days before billing date.

#### Tasks
- [ ] 2.4.1 Create app/api/cron/generate-invoices/route.ts
  - Implement POST handler with Vercel Cron secret authentication
  - Use Next.js 15 async params pattern
- [ ] 2.4.2 Implement invoice generation logic
  - Query active services with billing_date in next 7 days
  - Generate invoice for each service
  - Handle errors gracefully (continue on individual failures)
  - Log execution in cron_execution_log table
- [ ] 2.4.3 Implement notification triggers
  - Send invoice email (Resend)
  - Send invoice SMS (Clickatell)
  - Handle notification failures without blocking
- [ ] 2.4.4 Implement execution logging
  - Log start time, end time, status
  - Track records_processed and records_failed
  - Store error messages for failed invoices
- [ ] 2.4.5 Configure Vercel Cron in vercel.json
  - Schedule: "0 2 * * *" (02:00 SAST)
  - Set timeout: 60 seconds
  - Configure CRON_SECRET environment variable
- [ ] 2.4.6 Write 4 focused tests
  - Test cron authentication (valid/invalid secret)
  - Test invoice generation batch processing
  - Test error handling (individual failures)
  - Test execution logging

#### Acceptance Criteria
- [ ] Cron job runs at 02:00 SAST daily
- [ ] Invoices generate 7 days before billing date
- [ ] Notifications sent successfully
- [ ] Execution logged with metrics
- [ ] 4 tests pass (auth, batch processing, error handling, logging)

#### Testing Requirements (4 tests maximum)
1. Cron secret authentication
2. Batch invoice generation (100+ services)
3. Individual failure handling (continue processing)
4. Execution log recording

---

### Task Group 2.5: Invoice API Endpoints

**Assigned Implementer:** api-engineer
**Story Points:** 5
**Dependencies:** Task Group 2.2
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Implement customer-facing invoice API endpoints for listing, viewing, and downloading invoices.

#### Tasks
- [ ] 2.5.1 Create GET /api/dashboard/invoices/route.ts
  - List customer's invoices with pagination
  - Support status filter (unpaid, paid, overdue)
  - Return summary with pagination info
  - Use RLS policies for access control
- [ ] 2.5.2 Create GET /api/dashboard/invoices/[id]/route.ts
  - Get single invoice with full details
  - Include line items (JSONB)
  - Use Next.js 15 async params pattern
- [ ] 2.5.3 Create GET /api/dashboard/invoices/[id]/pdf/route.ts
  - Stream PDF file from Supabase Storage
  - Set Content-Type: application/pdf
  - Set Content-Disposition header for download
  - Verify customer owns invoice
- [ ] 2.5.4 Add TypeScript types
  - Define InvoiceListResponse interface
  - Define InvoiceDetailResponse interface
  - Reuse types from lib/types/billing.ts if exists
- [ ] 2.5.5 Write 4 focused tests
  - Test invoice list with pagination
  - Test status filter
  - Test invoice detail retrieval
  - Test PDF download access control

#### Acceptance Criteria
- [ ] Invoice list returns paginated results
- [ ] Status filter works correctly
- [ ] PDF downloads stream correctly
- [ ] RLS policies enforce access control
- [ ] 4 tests pass (list, filter, detail, PDF)

#### Testing Requirements (4 tests maximum)
1. Invoice list pagination (limit/offset)
2. Status filter (unpaid, paid, overdue)
3. Invoice detail with line items
4. PDF download with access control

---

### Task Group 2.6: Payment Method API Endpoints

**Assigned Implementer:** api-engineer
**Story Points:** 5
**Dependencies:** Task Group 2.3
**Priority:** HIGH
**Risk Level:** MEDIUM

#### Description
Implement API endpoints for managing customer payment methods with security controls.

#### Tasks
- [ ] 2.6.1 Create GET /api/dashboard/payment-methods/route.ts
  - List customer's payment methods
  - Return masked details only (never encrypted_details)
  - Mark primary method
- [ ] 2.6.2 Create POST /api/dashboard/payment-methods/route.ts
  - Add new payment method
  - Validate required fields
  - Trigger NetCash eMandate creation (if debit_order)
  - Return masked response
- [ ] 2.6.3 Create PATCH /api/dashboard/payment-methods/[id]/route.ts
  - Set primary method
  - Use Next.js 15 async params pattern
- [ ] 2.6.4 Create DELETE /api/dashboard/payment-methods/[id]/route.ts
  - Soft delete (is_active = false)
  - Prevent deletion of primary method with balance
  - Use Next.js 15 async params pattern
- [ ] 2.6.5 Write 4 focused tests
  - Test add payment method
  - Test set primary method
  - Test delete restrictions
  - Test masked details in responses

#### Acceptance Criteria
- [ ] Payment methods never expose encrypted data
- [ ] Primary method enforcement works
- [ ] Deletion restrictions enforced
- [ ] All endpoints use async params pattern
- [ ] 4 tests pass (add, set primary, delete, masking)

#### Testing Requirements (4 tests maximum)
1. Add payment method with encryption
2. Set primary method (only one primary)
3. Delete restriction (outstanding balance)
4. Response masking (no encrypted_details)

---

### Task Group 2.7: Billing Dashboard API

**Assigned Implementer:** api-engineer
**Story Points:** 2
**Dependencies:** Task Group 2.5, 2.6
**Priority:** MEDIUM
**Risk Level:** LOW

#### Description
Implement comprehensive billing summary endpoint for customer dashboard.

#### Tasks
- [ ] 2.7.1 Create GET /api/dashboard/billing/route.ts
  - Return billing summary (account_balance, credit_limit, next_billing_date)
  - Include primary payment method (masked)
  - Include recent transactions (last 10)
  - Aggregate from customer_billing, payment_methods, payment_transactions
- [ ] 2.7.2 Add TypeScript response type
  - Define BillingSummaryResponse interface
  - Include nested types for payment method and transactions
- [ ] 2.7.3 Write 2 focused tests
  - Test billing summary aggregation
  - Test payment method masking

#### Acceptance Criteria
- [ ] Billing summary returns all required data
- [ ] Payment method properly masked
- [ ] Response typing complete
- [ ] 2 tests pass (aggregation, masking)

#### Testing Requirements (2 tests maximum)
1. Billing summary data aggregation
2. Payment method display masking

---

## Phase 3: Service Management (Week 2-3) - 29 Story Points

### Task Group 3.1: Service Management Service

**Assigned Implementer:** backend-engineer
**Story Points:** 8
**Dependencies:** Task Group 2.1
**Priority:** CRITICAL
**Risk Level:** HIGH

#### Description
Implement service lifecycle management with activation, suspension, cancellation, and reactivation workflows.

#### Tasks
- [ ] 3.1.1 Create lib/services/service-manager.ts
  - Class structure with transaction support
  - Reuse patterns from existing service code
- [ ] 3.1.2 Implement activateService() method
  - Update status: pending → active
  - Set activation_date
  - Generate pro-rata invoice (use BillingService)
  - Update next_billing_date
  - Log action in service_action_log
  - Send notifications (SMS + email)
  - All operations in database transaction
- [ ] 3.1.3 Implement suspendService() method
  - Update status: active → suspended
  - Set suspension_date
  - Create service_suspensions record
  - Log action with reason
  - Pause recurring billing if skip_billing = true
  - Send notifications
- [ ] 3.1.4 Implement reactivateService() method
  - Update status: suspended → active
  - Update reactivated_at in service_suspensions
  - Generate pro-rata invoice for remaining billing cycle
  - Resume recurring billing
  - Log action
  - Send notifications
- [ ] 3.1.5 Implement cancelService() method
  - Update status: active → cancelled
  - Set cancellation_date
  - Generate final invoice (pro-rated to cancellation date)
  - Log action
  - Send notifications
- [ ] 3.1.6 Write 6 focused tests
  - Test activation workflow (full transaction)
  - Test suspension with billing pause
  - Test reactivation with pro-rata
  - Test cancellation with final invoice
  - Test transaction rollback on error
  - Test audit log creation

#### Acceptance Criteria
- [ ] All status transitions work correctly
- [ ] Pro-rata invoices generated accurately
- [ ] Audit logs capture all changes
- [ ] Transactions rollback on error (no partial state)
- [ ] 6 tests pass (activation, suspension, cancellation, rollback)

#### Testing Requirements (6 tests maximum)
1. Activation workflow (pending→active, invoice, log)
2. Suspension with billing pause
3. Reactivation with pro-rata invoice
4. Cancellation with final invoice
5. Transaction rollback on invoice failure
6. Audit log completeness

---

### Task Group 3.2: Admin Service Control API Endpoints

**Assigned Implementer:** api-engineer
**Story Points:** 5
**Dependencies:** Task Group 3.1
**Priority:** CRITICAL
**Risk Level:** MEDIUM

#### Description
Implement admin API endpoints for service activation, suspension, and cancellation with permission checks.

#### Tasks
- [ ] 3.2.1 Create POST /api/admin/customers/[id]/services/activate/route.ts
  - Validate admin permissions (services:activate)
  - Require serviceId, reason, notes in request body
  - Call ServiceManager.activateService()
  - Return service details and generated invoice
  - Use Next.js 15 async params pattern
- [ ] 3.2.2 Create POST /api/admin/customers/[id]/services/suspend/route.ts
  - Validate admin permissions (services:suspend)
  - Require serviceId, suspensionType, reason in request body
  - Call ServiceManager.suspendService()
  - Return updated service details
- [ ] 3.2.3 Create POST /api/admin/customers/[id]/services/reactivate/route.ts
  - Validate admin permissions (services:activate)
  - Require serviceId, reason in request body
  - Call ServiceManager.reactivateService()
  - Return service details and pro-rata invoice
- [ ] 3.2.4 Create POST /api/admin/customers/[id]/services/cancel/route.ts
  - Validate admin permissions (services:cancel)
  - Require serviceId, reason in request body
  - Call ServiceManager.cancelService()
  - Return service details and final invoice
- [ ] 3.2.5 Write 5 focused tests
  - Test activation endpoint
  - Test suspension endpoint
  - Test reactivation endpoint
  - Test cancellation endpoint
  - Test permission enforcement

#### Acceptance Criteria
- [ ] All endpoints require valid admin session
- [ ] Permission checks enforced
- [ ] Mandatory reason/notes validated
- [ ] All endpoints use async params pattern
- [ ] 5 tests pass (activate, suspend, reactivate, cancel, permissions)

#### Testing Requirements (5 tests maximum)
1. Activation endpoint with invoice response
2. Suspension endpoint with type validation
3. Reactivation endpoint with pro-rata invoice
4. Cancellation endpoint with final invoice
5. Permission enforcement (services:activate required)

---

### Task Group 3.3: Service Dashboard API Endpoints

**Assigned Implementer:** api-engineer
**Story Points:** 3
**Dependencies:** Task Group 3.1
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Implement customer-facing service API endpoints for viewing services and usage data.

#### Tasks
- [ ] 3.3.1 Create GET /api/dashboard/services/route.ts
  - List customer's services
  - Include usage data from usage_history (current billing cycle)
  - Calculate percentUsed for capped services
  - Use RLS policies for access control
- [ ] 3.3.2 Create GET /api/dashboard/services/[id]/route.ts
  - Get single service with full details
  - Include historical usage data
  - Use Next.js 15 async params pattern
- [ ] 3.3.3 Write 3 focused tests
  - Test service list with usage data
  - Test service detail retrieval
  - Test RLS access control

#### Acceptance Criteria
- [ ] Service list includes usage data
- [ ] Usage percentage calculated correctly
- [ ] RLS policies enforce customer access
- [ ] 3 tests pass (list, detail, RLS)

#### Testing Requirements (3 tests maximum)
1. Service list with current cycle usage
2. Service detail with historical usage
3. RLS policy enforcement (own services only)

---

### Task Group 3.4: Admin Billing Controls

**Assigned Implementer:** api-engineer
**Story Points:** 3
**Dependencies:** Task Group 2.4
**Priority:** MEDIUM
**Risk Level:** LOW

#### Description
Implement admin endpoints for manual invoice generation and billing management.

#### Tasks
- [ ] 3.4.1 Create POST /api/admin/billing/generate-invoices-now/route.ts
  - Validate admin permissions (billing:manage)
  - Support optional serviceIds filter
  - Call BillingService.generateInvoice() for each service
  - Return summary (generated count, failed count)
- [ ] 3.4.2 Create GET /api/admin/customers/[id]/billing/route.ts
  - Get customer billing details
  - Include invoices, transactions, services
  - Use Next.js 15 async params pattern
- [ ] 3.4.3 Write 3 focused tests
  - Test manual invoice generation
  - Test selective generation (specific services)
  - Test customer billing view

#### Acceptance Criteria
- [ ] Manual generation works correctly
- [ ] Selective generation by serviceIds
- [ ] Customer billing view comprehensive
- [ ] 3 tests pass (manual generation, selective, view)

#### Testing Requirements (3 tests maximum)
1. Manual invoice generation (all services)
2. Selective invoice generation (specific serviceIds)
3. Customer billing view aggregation

---

### Task Group 3.5: Service Audit Log API

**Assigned Implementer:** api-engineer
**Story Points:** 2
**Dependencies:** Task Group 3.1
**Priority:** MEDIUM
**Risk Level:** LOW

#### Description
Implement admin endpoint for viewing service action history (audit trail).

#### Tasks
- [ ] 3.5.1 Create GET /api/admin/customers/[id]/services/[serviceId]/audit/route.ts
  - Query service_action_log for specific service
  - Include admin user details (join admin_users)
  - Order by created_at DESC
  - Use Next.js 15 async params pattern (nested)
- [ ] 3.5.2 Add TypeScript response type
  - Define ServiceAuditLogEntry interface
  - Include admin user info
- [ ] 3.5.3 Write 2 focused tests
  - Test audit log retrieval
  - Test admin user details inclusion

#### Acceptance Criteria
- [ ] Audit log returns all actions for service
- [ ] Admin user details included
- [ ] Chronological order (newest first)
- [ ] 2 tests pass (retrieval, admin details)

#### Testing Requirements (2 tests maximum)
1. Audit log retrieval for service
2. Admin user details inclusion

---

### Task Group 3.6: Usage Tracking API

**Assigned Implementer:** api-engineer
**Story Points:** 3
**Dependencies:** Task Group 1.5
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Implement customer-facing usage API endpoint for viewing data usage.

#### Tasks
- [ ] 3.6.1 Create GET /api/dashboard/usage/route.ts
  - Require serviceId query parameter
  - Support optional startDate and endDate filters
  - Default to current billing cycle
  - Aggregate daily usage from usage_history
  - Calculate totals (upload, download, total)
- [ ] 3.6.2 Add TypeScript response types
  - Define UsageDataResponse interface
  - Include daily usage array and totals
- [ ] 3.6.3 Write 3 focused tests
  - Test current cycle usage retrieval
  - Test custom date range filtering
  - Test usage totals calculation

#### Acceptance Criteria
- [ ] Usage data returns for current billing cycle by default
- [ ] Custom date ranges supported
- [ ] Totals calculated accurately
- [ ] 3 tests pass (current cycle, date range, totals)

#### Testing Requirements (3 tests maximum)
1. Current billing cycle usage
2. Custom date range filtering
3. Usage totals calculation (upload + download)

---

### Task Group 3.7: Dashboard Summary API

**Assigned Implementer:** api-engineer
**Story Points:** 5
**Dependencies:** Task Group 3.3, 2.5, 2.7
**Priority:** HIGH
**Risk Level:** MEDIUM

#### Description
Implement comprehensive dashboard summary endpoint that aggregates all customer data.

#### Tasks
- [ ] 3.7.1 Create GET /api/dashboard/summary/route.ts
  - Aggregate customer details (account_number, account_status)
  - Include services list with current status
  - Include billing summary (balance, next payment)
  - Include recent orders (from consumer_orders)
  - Include recent invoices (last 5)
  - Calculate stats (active services, orders, overdue invoices)
- [ ] 3.7.2 Optimize query performance
  - Use parallel queries where possible
  - Minimize database roundtrips
  - Consider caching strategy (optional)
- [ ] 3.7.3 Add comprehensive TypeScript response type
  - Define DashboardSummaryResponse interface
  - Include all nested interfaces
- [ ] 3.7.4 Write 4 focused tests
  - Test full dashboard summary aggregation
  - Test stats calculation
  - Test query performance (< 500ms)
  - Test RLS access control

#### Acceptance Criteria
- [ ] Dashboard summary returns all required data
- [ ] Response time < 500ms for typical customer
- [ ] Stats calculated correctly
- [ ] RLS policies enforce customer access
- [ ] 4 tests pass (aggregation, stats, performance, RLS)

#### Testing Requirements (4 tests maximum)
1. Dashboard summary data completeness
2. Stats calculation accuracy (counts, balances)
3. Query performance benchmark (< 500ms target)
4. RLS policy enforcement

---

## Phase 4: Integrations (Week 3) - 23 Story Points

### Task Group 4.1: Interstellio Usage Service

**Assigned Implementer:** backend-engineer
**Story Points:** 8
**Dependencies:** Task Group 1.5
**Priority:** HIGH
**Risk Level:** HIGH (external API dependency)

#### Description
Implement integration with Interstellio API for real-time usage tracking and synchronization.

#### Tasks
- [ ] 4.1.1 Create lib/integrations/interstellio/usage-service.ts
  - Class structure with API key authentication
  - Base URL configuration from environment
- [ ] 4.1.2 Implement getUsageData() method
  - Fetch usage data from /api/subscribers/{connection_id}/telemetry
  - Support date range parameters (start_date, end_date)
  - Handle API errors gracefully
  - Parse response to internal format
- [ ] 4.1.3 Implement syncUsageForService() method
  - Get last sync date from usage_history
  - Fetch new data from Interstellio
  - Transform bytes to MB
  - Upsert into usage_history table (ON CONFLICT service_id, date)
  - Return sync statistics
- [ ] 4.1.4 Implement checkUsageThresholds() method
  - Calculate current billing cycle usage
  - Check against 80% and 95% thresholds (for capped services)
  - Return threshold status
- [ ] 4.1.5 Add error handling and retry logic
  - Exponential backoff for API failures
  - Log errors without failing entire sync batch
- [ ] 4.1.6 Write 5 focused tests
  - Test API data fetching (mock Interstellio API)
  - Test data transformation (bytes → MB)
  - Test upsert logic (ON CONFLICT)
  - Test threshold detection (80%, 95%)
  - Test error handling and retry

#### Acceptance Criteria
- [ ] Usage data syncs successfully from Interstellio
- [ ] Data transformation accurate (bytes to MB)
- [ ] Upsert prevents duplicate records
- [ ] Thresholds detected correctly
- [ ] 5 tests pass (fetch, transform, upsert, thresholds, errors)

#### Testing Requirements (5 tests maximum)
1. Interstellio API call (mocked response)
2. Data transformation (bytes to MB conversion)
3. Upsert on conflict behavior
4. Threshold detection (80%, 95%)
5. API error handling with retry

---

### Task Group 4.2: Usage Sync Cron Job

**Assigned Implementer:** backend-engineer
**Story Points:** 5
**Dependencies:** Task Group 4.1
**Priority:** HIGH
**Risk Level:** MEDIUM

#### Description
Implement hourly Vercel Cron job to sync usage data from Interstellio for all active services.

#### Tasks
- [ ] 4.2.1 Create app/api/cron/sync-usage-data/route.ts
  - Implement POST handler with Vercel Cron secret authentication
  - Use Next.js 15 async params pattern
- [ ] 4.2.2 Implement batch sync logic
  - Query all active services with connection_id
  - Call InterstellioUsageService.syncUsageForService() for each
  - Handle individual failures gracefully (continue batch)
  - Track processed and failed counts
- [ ] 4.2.3 Implement usage threshold warnings
  - Check thresholds after sync
  - Send SMS warnings at 80% and 95%
  - Rate limit warnings (max 1 per threshold per day)
- [ ] 4.2.4 Implement execution logging
  - Log in cron_execution_log table
  - Include processed/failed counts
  - Store error messages for debugging
- [ ] 4.2.5 Configure Vercel Cron in vercel.json
  - Schedule: "0 * * * *" (every hour)
  - Timeout: 120 seconds
- [ ] 4.2.6 Write 3 focused tests
  - Test batch sync processing
  - Test threshold warning triggers
  - Test execution logging

#### Acceptance Criteria
- [ ] Cron job runs hourly
- [ ] Batch sync handles 100+ services
- [ ] Threshold warnings sent correctly
- [ ] Execution logged with metrics
- [ ] 3 tests pass (batch sync, warnings, logging)

#### Testing Requirements (3 tests maximum)
1. Batch sync processing (100+ services)
2. Threshold warning trigger logic
3. Execution log recording

---

### Task Group 4.3: NetCash eMandate Service

**Assigned Implementer:** backend-engineer
**Story Points:** 8
**Dependencies:** Task Group 2.3
**Priority:** HIGH
**Risk Level:** HIGH (payment integration)

#### Description
Implement NetCash eMandate integration for recurring debit orders. Extends existing NetCash integration.

#### Tasks
- [ ] 4.3.1 Review and extend lib/payments/netcash-service.ts
  - Add eMandate methods to existing NetCash service
  - Reuse authentication and webhook patterns
- [ ] 4.3.2 Implement createMandate() method
  - POST to /mandate/create endpoint
  - Include customer bank details
  - Set maximum debit amount
  - Return mandate_id and approval_url
- [ ] 4.3.3 Implement getMandateStatus() method
  - GET /mandate/{id}/status endpoint
  - Return current status (pending, active, cancelled)
- [ ] 4.3.4 Implement processDebitOrder() method
  - POST to /mandate/{id}/debit endpoint
  - Include invoice_id and amount
  - Return transaction details
  - Handle insufficient funds error
- [ ] 4.3.5 Implement mandate webhook handler
  - Verify HMAC signature (reuse existing pattern)
  - Update customer_payment_methods.mandate_status
  - Send SMS notification to customer
- [ ] 4.3.6 Write 5 focused tests
  - Test mandate creation
  - Test debit order processing
  - Test webhook signature verification
  - Test mandate status updates
  - Test error handling (insufficient funds)

#### Acceptance Criteria
- [ ] Mandate creation returns approval URL
- [ ] Debit orders process successfully
- [ ] Webhook signature verification works
- [ ] Status updates reflected in database
- [ ] 5 tests pass (create, debit, webhook, status, errors)

#### Testing Requirements (5 tests maximum)
1. Mandate creation with bank details
2. Debit order processing
3. Webhook HMAC signature verification
4. Mandate status update from webhook
5. Insufficient funds error handling

---

### Task Group 4.4: Debit Order Processing Cron Job

**Assigned Implementer:** backend-engineer
**Story Points:** 5
**Dependencies:** Task Group 4.3
**Priority:** HIGH
**Risk Level:** MEDIUM

#### Description
Implement daily Vercel Cron job to process recurring debit orders for customers with auto-pay enabled.

#### Tasks
- [ ] 4.4.1 Create app/api/cron/process-debit-orders/route.ts
  - Implement POST handler with Vercel Cron secret authentication
- [ ] 4.4.2 Implement debit order batch processing
  - Query invoices with due_date = today and status = 'unpaid'
  - Filter customers with auto_pay_enabled = true
  - Get primary payment method (mandate_id)
  - Call NetCashEMandateService.processDebitOrder()
  - Update invoice status based on result
- [ ] 4.4.3 Implement payment transaction recording
  - Create payment_transactions record for each attempt
  - Store NetCash response (transaction_id, status)
  - Update customer_billing.account_balance
- [ ] 4.4.4 Implement notification triggers
  - Send SMS on successful payment
  - Send SMS on failed payment
  - Email invoice receipt on success
- [ ] 4.4.5 Configure Vercel Cron in vercel.json
  - Schedule: "0 6 * * *" (06:00 SAST)
  - Timeout: 180 seconds
- [ ] 4.4.6 Write 3 focused tests
  - Test batch debit order processing
  - Test transaction recording
  - Test notification triggers

#### Acceptance Criteria
- [ ] Cron job runs at 06:00 SAST daily
- [ ] Debit orders process for due invoices
- [ ] Transactions recorded correctly
- [ ] Notifications sent
- [ ] 3 tests pass (batch processing, transactions, notifications)

#### Testing Requirements (3 tests maximum)
1. Batch debit order processing (multiple invoices)
2. Transaction recording and invoice status update
3. Notification triggers (success/failure)

---

### Task Group 4.5: SMS Notification Service Enhancement

**Assigned Implementer:** backend-engineer
**Story Points:** 3
**Dependencies:** Task Group 2.4, 4.2, 4.4
**Priority:** MEDIUM
**Risk Level:** LOW

#### Description
Enhance existing Clickatell SMS service with 10 notification templates and delivery tracking.

#### Tasks
- [ ] 4.5.1 Review and extend lib/integrations/clickatell/sms-service.ts
  - Ensure existing service works
  - Add template support
- [ ] 4.5.2 Create lib/notifications/sms-templates.ts
  - Define 10 notification templates (see spec Section 8.3)
  - Order confirmation, service activated, invoice generated, etc.
  - Parameterized messages
- [ ] 4.5.3 Create lib/notifications/notification-service.ts
  - Wrapper class for multi-channel notifications
  - Methods: sendOrderConfirmation(), sendInvoiceNotification(), etc.
  - Integrate with Clickatell and Resend
- [ ] 4.5.4 Write 2 focused tests
  - Test template rendering
  - Test notification delivery (mock Clickatell)

#### Acceptance Criteria
- [ ] All 10 templates defined
- [ ] Notification service supports SMS and email
- [ ] Templates render correctly with parameters
- [ ] 2 tests pass (templates, delivery)

#### Testing Requirements (2 tests maximum)
1. SMS template rendering (all 10 templates)
2. Notification delivery (mocked Clickatell API)

---

## Phase 5: Dashboard UI (Week 3-4) - 18 Story Points

### Task Group 5.1: Dashboard Stats Cards Component

**Assigned Implementer:** frontend-engineer
**Story Points:** 2
**Dependencies:** Task Group 3.7
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create dashboard stats overview cards showing key metrics. Reuses components/dashboard/QuickActionCards.tsx patterns.

#### Tasks
- [ ] 5.1.1 Create components/dashboard/stats/StatsCards.tsx
  - 4 stat cards (Active Services, Account Balance, Next Billing Date, Data Usage)
  - Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
  - Use shadcn/ui Card component
  - Color-coded balance (red if negative, green if credit)
- [ ] 5.1.2 Add icons (lucide-react)
  - Wifi, CreditCard, Calendar, Database icons
- [ ] 5.1.3 Create components/dashboard/stats/AccountSummary.tsx
  - Display account number prominently
  - Show account status badge
  - Customer since date
- [ ] 5.1.4 Write 2 focused tests
  - Test stats card rendering
  - Test balance color coding

#### Acceptance Criteria
- [ ] Stats cards display correctly on all screen sizes
- [ ] Balance colors correct (red/green)
- [ ] Account number displays with CT-YYYY-NNNNN format
- [ ] 2 tests pass (rendering, colors)

#### Testing Requirements (2 tests maximum)
1. Stats cards responsive rendering
2. Balance color coding logic (negative=red, positive=green)

---

### Task Group 5.2: Service Card Components

**Assigned Implementer:** frontend-engineer
**Story Points:** 3
**Dependencies:** Task Group 3.3
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create service display components with usage visualization. Integrates with existing ServiceManageDropdown.

#### Tasks
- [ ] 5.2.1 Create components/dashboard/services/ServiceCard.tsx
  - Display service details (package name, address, speed, price)
  - Show status badge (active, pending, suspended, cancelled)
  - Include usage progress bar (for current billing cycle)
  - Integrate existing ServiceManageDropdown component
  - Use shadcn/ui Card, Badge, Progress components
- [ ] 5.2.2 Create components/dashboard/services/ServiceList.tsx
  - Grid layout for service cards
  - Empty state (no services)
  - Loading skeleton
- [ ] 5.2.3 Create components/dashboard/services/UsageChart.tsx
  - Bar chart for daily usage (last 30 days)
  - Use Recharts library (existing in project)
  - Show upload/download breakdown
- [ ] 5.2.4 Write 3 focused tests
  - Test service card rendering
  - Test status badge colors
  - Test usage progress bar

#### Acceptance Criteria
- [ ] Service cards display all details
- [ ] Status badges color-coded correctly
- [ ] Usage progress bar accurate
- [ ] Integrates with existing ServiceManageDropdown
- [ ] 3 tests pass (card, badges, progress)

#### Testing Requirements (3 tests maximum)
1. Service card data rendering
2. Status badge color mapping
3. Usage progress bar percentage calculation

---

### Task Group 5.3: Billing Components

**Assigned Implementer:** frontend-engineer
**Story Points:** 3
**Dependencies:** Task Group 2.7
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create billing overview components with payment method display and invoice list.

#### Tasks
- [ ] 5.3.1 Create components/dashboard/billing/BillingSummary.tsx
  - Account balance display (large, prominent)
  - Next payment date
  - Auto-pay status toggle
  - Primary payment method card
- [ ] 5.3.2 Create components/dashboard/billing/PaymentMethodCard.tsx
  - Display masked payment details ("Debit Order - FNB ***1234")
  - Show mandate status badge (active, pending)
  - Primary method indicator
  - Edit/Remove buttons
- [ ] 5.3.3 Create components/dashboard/billing/AddPaymentMethodModal.tsx
  - Form for adding new payment method
  - Support debit_order, card, eft types
  - Bank account fields (bank, account_number, account_type, branch_code)
  - Client-side validation
  - Use shadcn/ui Dialog, Form components
- [ ] 5.3.4 Write 3 focused tests
  - Test billing summary rendering
  - Test payment method masking
  - Test add payment method form validation

#### Acceptance Criteria
- [ ] Billing summary shows balance and payment info
- [ ] Payment methods display masked details only
- [ ] Add payment method form validates inputs
- [ ] 3 tests pass (summary, masking, form validation)

#### Testing Requirements (3 tests maximum)
1. Billing summary data display
2. Payment method masking ("Bank ***1234")
3. Add payment method form validation

---

### Task Group 5.4: Invoice List Component

**Assigned Implementer:** frontend-engineer
**Story Points:** 3
**Dependencies:** Task Group 2.5
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create invoice list and detail components with PDF download functionality.

#### Tasks
- [ ] 5.4.1 Create components/dashboard/billing/InvoiceList.tsx
  - Table view with columns (invoice #, date, due date, amount, status)
  - Status badges (paid, unpaid, overdue, partial)
  - Actions dropdown (View Details, Download PDF, Pay Now)
  - Pagination controls
  - Use shadcn/ui Table, Badge, DropdownMenu components
- [ ] 5.4.2 Create components/dashboard/billing/InvoiceCard.tsx
  - Card view alternative for mobile
  - Same information as table row
  - Stacked layout for smaller screens
- [ ] 5.4.3 Create app/dashboard/invoices/[id]/page.tsx
  - Invoice detail page
  - Show full invoice with line items
  - Download PDF button
  - Payment button (if unpaid)
  - Use Next.js 15 async params pattern
- [ ] 5.4.4 Write 3 focused tests
  - Test invoice list rendering
  - Test status badge colors
  - Test PDF download link

#### Acceptance Criteria
- [ ] Invoice list displays with correct status badges
- [ ] Pagination works correctly
- [ ] Invoice detail page shows full information
- [ ] PDF download link works
- [ ] 3 tests pass (list, badges, download)

#### Testing Requirements (3 tests maximum)
1. Invoice list table rendering
2. Status badge color mapping
3. PDF download link generation

---

### Task Group 5.5: Usage Dashboard Page

**Assigned Implementer:** frontend-engineer
**Story Points:** 3
**Dependencies:** Task Group 3.6
**Priority:** MEDIUM
**Risk Level:** LOW

#### Description
Create usage tracking page with charts and warnings. Extends existing app/dashboard/usage/page.tsx.

#### Tasks
- [ ] 5.5.1 Review and enhance app/dashboard/usage/page.tsx
  - Add service selector dropdown (if multiple services)
  - Show current billing cycle dates
  - Display usage totals (upload, download, total)
- [ ] 5.5.2 Create components/dashboard/usage/UsageOverview.tsx
  - Current cycle summary card
  - Upload/download breakdown
  - Progress bar for capped services
  - Percentage used indicator
- [ ] 5.5.3 Create components/dashboard/usage/DailyUsageChart.tsx
  - Bar chart for daily usage
  - Stacked bars (upload/download)
  - Use Recharts library
  - Responsive design
- [ ] 5.5.4 Create components/dashboard/usage/UsageWarningBanner.tsx
  - Warning at 80% usage (yellow)
  - Critical warning at 95% (red)
  - Conditional rendering based on threshold
- [ ] 5.5.5 Write 3 focused tests
  - Test usage overview calculations
  - Test daily chart rendering
  - Test warning banner thresholds

#### Acceptance Criteria
- [ ] Usage data displays for current billing cycle
- [ ] Charts visualize daily usage correctly
- [ ] Warning banners appear at correct thresholds
- [ ] 3 tests pass (overview, chart, warnings)

#### Testing Requirements (3 tests maximum)
1. Usage overview totals calculation
2. Daily usage chart data mapping
3. Warning banner threshold logic (80%, 95%)

---

### Task Group 5.6: Admin Service Management UI

**Assigned Implementer:** frontend-engineer
**Story Points:** 3
**Dependencies:** Task Group 3.2
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create admin UI components for service activation, suspension, and cancellation.

#### Tasks
- [ ] 5.6.1 Create components/admin/customers/ServiceActionModal.tsx
  - Modal dialog with form
  - Support activate, suspend, cancel actions
  - Reason field (required, textarea)
  - Notes field (optional)
  - Suspension type dropdown (if suspend)
  - Activation date picker (if activate)
  - Use shadcn/ui Dialog, Form, Textarea, Select components
- [ ] 5.6.2 Create components/admin/customers/ServiceAuditLog.tsx
  - Timeline view of service actions
  - Show admin user, action type, reason, timestamp
  - Collapsible notes section
  - Use shadcn/ui Card, Badge components
- [ ] 5.6.3 Integrate into existing admin customer detail page
  - Add service management section
  - Activate/Suspend/Cancel buttons
  - Display audit log below service details
- [ ] 5.6.4 Write 2 focused tests
  - Test service action modal form validation
  - Test audit log rendering

#### Acceptance Criteria
- [ ] Service action modal validates required fields
- [ ] Actions trigger API calls correctly
- [ ] Audit log displays action history
- [ ] 2 tests pass (modal validation, audit log)

#### Testing Requirements (2 tests maximum)
1. Service action modal form validation (reason required)
2. Audit log timeline rendering

---

### Task Group 5.7: Dashboard Main Pages

**Assigned Implementer:** frontend-engineer
**Story Points:** 3
**Dependencies:** Task Group 5.1, 5.2, 5.3
**Priority:** HIGH
**Risk Level:** LOW

#### Description
Create or enhance main dashboard pages with all components integrated.

#### Tasks
- [ ] 5.7.1 Review and enhance app/dashboard/page.tsx
  - Integrate StatsCards component
  - Show ServiceList component
  - Add quick actions section
  - Implement data fetching from /api/dashboard/summary
- [ ] 5.7.2 Create app/dashboard/services/page.tsx
  - Full service list view
  - Service cards with usage data
  - Filter options (status)
- [ ] 5.7.3 Create app/dashboard/billing/page.tsx
  - Billing summary
  - Payment methods section
  - Recent invoices list
- [ ] 5.7.4 Create app/dashboard/payment-method/page.tsx
  - Payment method management
  - Add new method button
  - Edit/remove existing methods
- [ ] 5.7.5 Write 2 focused tests
  - Test dashboard page data fetching
  - Test page navigation

#### Acceptance Criteria
- [ ] All dashboard pages functional
- [ ] Data fetching works correctly
- [ ] Navigation between pages smooth
- [ ] 2 tests pass (data fetching, navigation)

#### Testing Requirements (2 tests maximum)
1. Dashboard page data fetching and rendering
2. Page navigation flow

---

## Phase 6: Migration & Testing (Week 4) - 5 Story Points

### Task Group 6.1: Legacy Table Consolidation

**Assigned Implementer:** database-engineer
**Story Points:** 3
**Dependencies:** All Phase 1-5 task groups
**Priority:** HIGH
**Risk Level:** HIGH

#### Description
Migrate data from legacy orders table to consumer_orders and deprecate legacy table. Final cleanup step.

#### Tasks
- [ ] 6.1.1 Create data migration script
  - Map legacy orders fields to consumer_orders fields
  - Handle missing data gracefully
  - Preserve order numbers and references
- [ ] 6.1.2 Create validation report
  - Compare legacy orders to migrated consumer_orders
  - Identify any unmigrated records
  - Generate CSV for manual review
- [ ] 6.1.3 Rename legacy table
  - Rename orders to orders_legacy
  - Keep for 90 days as backup
  - Document deprecation
- [ ] 6.1.4 Update application code
  - Remove references to orders table
  - Use consumer_orders exclusively
- [ ] 6.1.5 Write 2 focused tests
  - Test migration script accuracy
  - Test validation completeness

#### Acceptance Criteria
- [ ] All migrateable orders moved to consumer_orders
- [ ] No data loss
- [ ] Legacy table renamed (not dropped)
- [ ] Application code updated
- [ ] 2 tests pass (migration, validation)

#### Testing Requirements (2 tests maximum)
1. Migration script data accuracy
2. Validation report completeness

---

### Task Group 6.2: End-to-End Testing

**Assigned Implementer:** testing-engineer
**Story Points:** 5
**Dependencies:** All Phase 1-5 task groups
**Priority:** CRITICAL
**Risk Level:** MEDIUM

#### Description
Comprehensive E2E testing of customer dashboard and admin workflows using Playwright.

#### Tasks
- [ ] 6.2.1 Review existing tests from task groups 1-5
  - Database layer: ~20 tests (from groups 1.1-1.5)
  - Backend/API layer: ~35 tests (from groups 2.1-4.5)
  - Frontend layer: ~21 tests (from groups 5.1-5.7)
  - Total existing: ~76 tests
- [ ] 6.2.2 Analyze test coverage gaps
  - Identify missing end-to-end workflows
  - Focus on critical user journeys
  - Prioritize integration points between layers
- [ ] 6.2.3 Write maximum 10 additional E2E tests
  - Customer: Dashboard login → view services → download invoice (1 test)
  - Customer: Add payment method → set as primary (1 test)
  - Customer: View usage data → check warnings (1 test)
  - Admin: Activate service → verify invoice generated (1 test)
  - Admin: Suspend service → verify billing paused (1 test)
  - Admin: Generate invoices manually → verify notifications sent (1 test)
  - Cron: Invoice generation job → verify emails sent (1 test)
  - Cron: Usage sync job → verify data stored (1 test)
  - Webhook: NetCash payment → verify invoice updated (1 test)
  - Webhook: NetCash mandate → verify status updated (1 test)
- [ ] 6.2.4 Run full test suite
  - Execute all ~86 tests (76 existing + 10 new)
  - Verify critical workflows pass
  - Document any failures
- [ ] 6.2.5 Create test report
  - Summary of test coverage
  - List of passing/failing tests
  - Recommendations for production deployment

#### Acceptance Criteria
- [ ] Maximum 10 new E2E tests added (not more)
- [ ] Total test count: approximately 86 tests
- [ ] All critical workflows covered
- [ ] Test suite passes (>95% pass rate)
- [ ] Test report documents coverage

#### Testing Requirements (10 tests maximum)
1. Customer dashboard login and view services
2. Customer add payment method workflow
3. Customer view usage with warnings
4. Admin activate service workflow
5. Admin suspend service with billing pause
6. Admin manual invoice generation
7. Cron invoice generation job
8. Cron usage sync job
9. NetCash payment webhook processing
10. NetCash mandate webhook processing

---

## Dependency Graph

```
Phase 1: Foundation
┌─────────────────────────────────────────────────────────────┐
│ 1.1: Schema Enhancement → 1.2: Backfill → 1.3: Services    │
│                         ↓                         ↓          │
│                    1.4: Invoices ← 1.3            │          │
│                         ↓                         ↓          │
│                    1.5: Audit                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
Phase 2: Billing Core
┌─────────────────────────────────────────────────────────────┐
│ 2.1: Billing Service → 2.2: Invoice Gen → 2.4: Cron Invoice│
│        ↓                       ↓                             │
│ 2.3: Payment Method → 2.5: Invoice API                      │
│        ↓                       ↓                             │
│ 2.6: Payment API → 2.7: Billing API                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
Phase 3: Service Management
┌─────────────────────────────────────────────────────────────┐
│ 3.1: Service Manager → 3.2: Admin Service API               │
│        ↓                       ↓                             │
│ 3.3: Service API → 3.4: Admin Billing API                   │
│        ↓                       ↓                             │
│ 3.5: Audit API → 3.6: Usage API → 3.7: Dashboard Summary    │
└─────────────────────────────────────────────────────────────┘
                           ↓
Phase 4: Integrations
┌─────────────────────────────────────────────────────────────┐
│ 4.1: Interstellio Service → 4.2: Usage Sync Cron            │
│                                                              │
│ 4.3: NetCash eMandate → 4.4: Debit Order Cron               │
│                                                              │
│ 4.5: SMS Notification Enhancement                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
Phase 5: Dashboard UI
┌─────────────────────────────────────────────────────────────┐
│ 5.1: Stats Cards ──┐                                        │
│ 5.2: Service Cards ├→ 5.7: Main Pages                       │
│ 5.3: Billing Cards ┘                                        │
│ 5.4: Invoice List                                           │
│ 5.5: Usage Page                                             │
│ 5.6: Admin UI                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
Phase 6: Migration & Testing
┌─────────────────────────────────────────────────────────────┐
│ 6.1: Legacy Table Consolidation                             │
│                    ↓                                         │
│ 6.2: End-to-End Testing (all phases)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Path Tasks (Blocking Dependencies)

**Week 1 Critical Path**:
1. Task Group 1.1 → 1.2 → 1.3 → 1.4 (Database foundation - MUST complete first)

**Week 2 Critical Path**:
2. Task Group 2.1 → 2.2 → 2.4 (Billing core - blocks service activation)
3. Task Group 3.1 → 3.2 (Service management - core workflow)

**Week 3 Critical Path**:
4. Task Group 4.1 → 4.2 (Usage tracking - needed for dashboard)
5. Task Group 4.3 → 4.4 (Payment processing - needed for automation)

**Week 4 Critical Path**:
6. Task Group 6.2 (E2E testing - final validation before production)

---

## Risk Mitigation Strategies

### HIGH RISK: Database Schema Migration (Task 1.1)
**Mitigation**:
- Test migration on production snapshot in staging
- Use blue-green deployment strategy
- Run migration during low-traffic window (2am SAST)
- Have rollback script ready
- Monitor for 48 hours post-migration

### HIGH RISK: Data Backfill (Task 1.2)
**Mitigation**:
- Manual review orphaned records (< 5% expected)
- Create validation_errors table for admin review queue
- No auto-fixing of data issues
- Keep legacy data intact during backfill

### HIGH RISK: Pro-rata Calculation Logic (Task 2.1)
**Mitigation**:
- Extensive unit tests with edge cases
- Manual QA review of calculations
- Compare against external calculator
- Start with small customer subset for validation

### HIGH RISK: Service Activation Workflow (Task 3.1)
**Mitigation**:
- Database transactions for atomicity
- Comprehensive error handling
- Rollback on any step failure
- Audit log every step

### EXTERNAL DEPENDENCY RISK: Interstellio API (Task 4.1)
**Mitigation**:
- Implement retry logic with exponential backoff
- Graceful degradation (show cached data if API down)
- Error logging without blocking other syncs
- Rate limiting to prevent API throttling

### EXTERNAL DEPENDENCY RISK: NetCash eMandate (Task 4.3)
**Mitigation**:
- Test extensively in NetCash sandbox
- Handle all error codes documented in API
- Implement idempotency for webhook processing
- Store full response for debugging

---

## Testing Summary

### Test Count by Phase
- **Phase 1 (Foundation)**: 20 tests (groups 1.1-1.5)
- **Phase 2 (Billing Core)**: 25 tests (groups 2.1-2.7)
- **Phase 3 (Service Management)**: 25 tests (groups 3.1-3.7)
- **Phase 4 (Integrations)**: 18 tests (groups 4.1-4.5)
- **Phase 5 (Dashboard UI)**: 18 tests (groups 5.1-5.7)
- **Phase 6 (Migration & Testing)**: 12 tests (groups 6.1-6.2)

**Total Tests**: ~118 tests (within target range of 100-130)

### Test Distribution
- **Database Layer**: 20 tests (schema, constraints, RLS)
- **Backend Services**: 35 tests (business logic, integrations)
- **API Layer**: 25 tests (endpoints, auth, validation)
- **Frontend Layer**: 18 tests (components, pages, forms)
- **End-to-End**: 10 tests (critical workflows)
- **Migration**: 2 tests (data integrity)

### Testing Policy Compliance
✅ Each task group writes 2-8 tests (enforced)
✅ Testing-engineer adds maximum 10 E2E tests (enforced)
✅ Total tests ~118 (within 100-130 target range)
✅ Tests run per task group, not entire suite
✅ Focus on critical paths, not exhaustive edge cases

---

## Reusable Components

### Existing Components to Leverage
- `lib/invoices/invoice-generator.ts` - Extend for customer invoices (Task 2.2)
- `lib/payments/payment-processor.ts` - Extend for debit orders (Task 4.3)
- `lib/integrations/clickatell/sms-service.ts` - Enhance with templates (Task 4.5)
- `components/dashboard/QuickActionCards.tsx` - Pattern for stats cards (Task 5.1)
- `components/dashboard/ServiceManageDropdown.tsx` - Integrate in service cards (Task 5.2)
- `components/ui/*` - All shadcn/ui components (Tasks 5.1-5.7)

### New Components Created (Reusable)
- `lib/billing/billing-service.ts` - Pro-rata calculations (Task 2.1)
- `lib/billing/payment-method-service.ts` - Payment method encryption (Task 2.3)
- `lib/services/service-manager.ts` - Service lifecycle management (Task 3.1)
- `lib/integrations/interstellio/usage-service.ts` - Usage tracking (Task 4.1)
- `lib/integrations/netcash/emandate-service.ts` - Debit orders (Task 4.3)
- `lib/notifications/notification-service.ts` - Multi-channel notifications (Task 4.5)

---

## Implementation Timeline (Parallel Work)

### Week 1: Foundation
**Monday-Tuesday**:
- database-engineer: Task 1.1, 1.2 (schema + backfill)

**Wednesday-Friday**:
- database-engineer: Task 1.3, 1.4, 1.5 (core tables)

### Week 2: Billing Core + Service Management
**Monday-Wednesday**:
- backend-engineer: Task 2.1, 2.2, 2.3 (billing services)
- api-engineer: Task 2.5, 2.6 (invoice/payment APIs)

**Thursday-Friday**:
- backend-engineer: Task 2.4, 3.1 (cron invoice, service manager)
- api-engineer: Task 2.7, 3.2, 3.3 (billing API, admin service API)

### Week 3: Integrations + Dashboard UI
**Monday-Tuesday**:
- backend-engineer: Task 4.1, 4.2, 4.3 (Interstellio, NetCash)
- api-engineer: Task 3.4, 3.5, 3.6, 3.7 (admin controls, dashboard summary)
- frontend-engineer: Task 5.1, 5.2, 5.3 (stats, services, billing components)

**Wednesday-Friday**:
- backend-engineer: Task 4.4, 4.5 (debit order cron, SMS)
- frontend-engineer: Task 5.4, 5.5, 5.6, 5.7 (invoices, usage, admin UI, main pages)

### Week 4: Migration & Testing
**Monday-Tuesday**:
- database-engineer: Task 6.1 (legacy table consolidation)
- testing-engineer: Task 6.2.1, 6.2.2 (review existing tests, gap analysis)

**Wednesday-Friday**:
- testing-engineer: Task 6.2.3, 6.2.4, 6.2.5 (write E2E tests, run suite, report)
- All engineers: Bug fixes and refinements

---

## Success Metrics

### Development Metrics
- [ ] All 20 task groups completed
- [ ] 147 story points delivered
- [ ] ~118 tests passing (>95% pass rate)
- [ ] Zero high-severity bugs in production (first week)
- [ ] API response times < 500ms (95th percentile)

### Business Metrics (Post-Deployment)
- [ ] 90% dashboard satisfaction rating (customer survey)
- [ ] 40% reduction in billing-related support tickets
- [ ] 80% of invoices paid within 7 days
- [ ] 85% debit order success rate
- [ ] Average 24-hour service activation time

### Technical Metrics
- [ ] 99.5% cron job success rate
- [ ] 100% webhook signature verification
- [ ] < 1% usage data discrepancy vs Interstellio
- [ ] Database query performance < 100ms (90th percentile)

---

## Deployment Checklist

### Pre-Deployment (Week 4)
- [ ] All 20 task groups completed and verified
- [ ] ~118 tests passing (>95%)
- [ ] Environment variables configured (INTERSTELLIO_API_KEY, NETCASH_EMANDATE_KEY, CLICKATELL_API_KEY, RESEND_API_KEY, CRON_SECRET)
- [ ] Vercel Cron jobs configured (3 jobs: invoices, usage, debit orders)
- [ ] Database migrations tested on staging
- [ ] Data backfill validated
- [ ] Legacy table consolidated
- [ ] Integration tests pass with external APIs

### Deployment (Week 4 Friday)
- [ ] Deploy database migrations (2am SAST)
- [ ] Run data backfill script
- [ ] Deploy application code (Vercel)
- [ ] Enable Vercel Cron schedules
- [ ] Monitor first cron executions
- [ ] Verify webhooks receiving events

### Post-Deployment (Week 5)
- [ ] Monitor error rates (Sentry)
- [ ] Review cron execution logs
- [ ] Check customer support tickets
- [ ] Verify invoice generation accuracy
- [ ] Confirm debit orders processing
- [ ] Validate usage data sync

---

**End of Task Breakdown**

**Document Control**:
- **Version**: 1.0
- **Date**: 2025-11-02
- **Created By**: Task Breakdown Agent
- **Spec Reference**: 2025-11-01-customer-dashboard-production/spec.md
- **Total Story Points**: 147
- **Total Task Groups**: 20
- **Total Tests**: ~118 (within 100-130 target)
- **Estimated Timeline**: 4 weeks (with parallel work)
