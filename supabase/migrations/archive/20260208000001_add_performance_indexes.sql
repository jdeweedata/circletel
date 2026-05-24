-- ============================================================================
-- Performance Indexes Migration
-- DEBT-017: Add missing database indexes for admin dashboard optimization
--
-- This migration adds indexes based on observed query patterns in:
-- - Admin dashboard (/admin/*)
-- - Customer dashboard (/dashboard/*)
-- - Business dashboard (/business-dashboard/*)
-- - Cron jobs and background tasks
-- ============================================================================

-- ============================================================================
-- CUSTOMERS TABLE
-- Frequent lookups: auth_user_id, email, created_at, zoho_sync_status
-- ============================================================================

-- Index for customer dashboard authentication (lookup by Supabase auth user)
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id
  ON public.customers(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Index for order creation (lookup by email)
CREATE INDEX IF NOT EXISTS idx_customers_email
  ON public.customers(email);

-- Index for new customers this month (created_at range queries)
CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON public.customers(created_at DESC);

-- Index for Zoho sync monitoring (failed syncs)
CREATE INDEX IF NOT EXISTS idx_customers_zoho_sync_status
  ON public.customers(zoho_sync_status)
  WHERE zoho_sync_status IS NOT NULL AND zoho_sync_status != 'synced';

-- Index for customer type filtering
CREATE INDEX IF NOT EXISTS idx_customers_account_type
  ON public.customers(account_type)
  WHERE account_type IS NOT NULL;

-- ============================================================================
-- BUSINESS_QUOTES TABLE
-- Frequent lookups: status, customer_email, agent_id, created_at
-- ============================================================================

-- Index for status filtering (pending_approval, accepted, etc.)
CREATE INDEX IF NOT EXISTS idx_business_quotes_status
  ON public.business_quotes(status);

-- Index for customer email lookups (business dashboard)
CREATE INDEX IF NOT EXISTS idx_business_quotes_customer_email
  ON public.business_quotes(customer_email);

-- Index for sales agent performance queries
CREATE INDEX IF NOT EXISTS idx_business_quotes_agent_id
  ON public.business_quotes(agent_id)
  WHERE agent_id IS NOT NULL;

-- Index for date range queries (recent quotes)
CREATE INDEX IF NOT EXISTS idx_business_quotes_created_at
  ON public.business_quotes(created_at DESC);

-- Composite index for common pattern: status + created_at
CREATE INDEX IF NOT EXISTS idx_business_quotes_status_created
  ON public.business_quotes(status, created_at DESC);

-- Partial index for active quotes (draft, pending, sent)
CREATE INDEX IF NOT EXISTS idx_business_quotes_active
  ON public.business_quotes(status, customer_email, created_at)
  WHERE status IN ('draft', 'pending', 'pending_approval', 'sent', 'viewed');

-- ============================================================================
-- COVERAGE_LEADS TABLE
-- Frequent lookups: status, created_at, customer_type
-- ============================================================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_coverage_leads_status
  ON public.coverage_leads(status);

-- Index for new leads this month
CREATE INDEX IF NOT EXISTS idx_coverage_leads_created_at
  ON public.coverage_leads(created_at DESC);

-- Index for customer type filtering
CREATE INDEX IF NOT EXISTS idx_coverage_leads_customer_type
  ON public.coverage_leads(customer_type);

-- Composite index for common pattern: status + created_at
CREATE INDEX IF NOT EXISTS idx_coverage_leads_status_created
  ON public.coverage_leads(status, created_at DESC);

-- Index for lead source analytics
CREATE INDEX IF NOT EXISTS idx_coverage_leads_lead_source
  ON public.coverage_leads(lead_source)
  WHERE lead_source IS NOT NULL;

-- ============================================================================
-- ZOHO_SYNC_LOGS TABLE
-- Frequent lookups: status, entity_type, created_at
-- ============================================================================

-- Index for status filtering (success/failed/pending)
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_status
  ON public.zoho_sync_logs(status);

-- Index for entity type filtering
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_entity_type
  ON public.zoho_sync_logs(entity_type);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_created_at
  ON public.zoho_sync_logs(created_at DESC);

-- Composite index for common pattern: status + created_at (failed logs in time range)
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_status_created
  ON public.zoho_sync_logs(status, created_at DESC);

-- Partial index for failed syncs (frequently queried for monitoring)
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_failed
  ON public.zoho_sync_logs(entity_type, entity_id, created_at)
  WHERE status = 'failed';

-- ============================================================================
-- ADMIN_USERS TABLE
-- Frequent lookups: email, role_id, status
-- ============================================================================

-- Index for login lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email
  ON public.admin_users(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id
  ON public.admin_users(role_id)
  WHERE role_id IS NOT NULL;

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_admin_users_status
  ON public.admin_users(status);

-- Partial index for active admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_active
  ON public.admin_users(email, role_id)
  WHERE status = 'active';

-- ============================================================================
-- CONSUMER_ORDERS TABLE (additional indexes)
-- Some indexes already exist, adding missing ones
-- ============================================================================

-- Index for customer dashboard (lookup by customer_id)
CREATE INDEX IF NOT EXISTS idx_consumer_orders_customer_id
  ON public.consumer_orders(customer_id)
  WHERE customer_id IS NOT NULL;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_consumer_orders_created_at
  ON public.consumer_orders(created_at DESC);

-- Composite index for common pattern: status + created_at
CREATE INDEX IF NOT EXISTS idx_consumer_orders_status_created
  ON public.consumer_orders(status, created_at DESC);

-- Index for order number lookups
CREATE INDEX IF NOT EXISTS idx_consumer_orders_order_number
  ON public.consumer_orders(order_number)
  WHERE order_number IS NOT NULL;

-- Partial index for pending orders (frequently queried)
CREATE INDEX IF NOT EXISTS idx_consumer_orders_pending
  ON public.consumer_orders(customer_email, created_at)
  WHERE status = 'pending' OR status = 'payment_pending';

-- ============================================================================
-- SERVICE_PACKAGES TABLE (additional indexes)
-- ============================================================================

-- Index for customer type filtering
CREATE INDEX IF NOT EXISTS idx_service_packages_customer_type
  ON public.service_packages(customer_type);

-- Composite index for common pattern: active + customer_type
CREATE INDEX IF NOT EXISTS idx_service_packages_active_type
  ON public.service_packages(customer_type, price)
  WHERE active = true AND status = 'active';

-- ============================================================================
-- CUSTOMER_SERVICES TABLE
-- Dashboard service management queries
-- ============================================================================

-- Index for customer service lookups
CREATE INDEX IF NOT EXISTS idx_customer_services_customer_id
  ON public.customer_services(customer_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_customer_services_status
  ON public.customer_services(status);

-- Composite index for active services by customer
CREATE INDEX IF NOT EXISTS idx_customer_services_customer_active
  ON public.customer_services(customer_id, status)
  WHERE status = 'active';

-- ============================================================================
-- CUSTOMER_INVOICES TABLE
-- Billing and payment queries
-- ============================================================================

-- Index for customer invoice lookups
CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer_id
  ON public.customer_invoices(customer_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_customer_invoices_status
  ON public.customer_invoices(status);

-- Index for due date queries (overdue invoice detection)
CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_date
  ON public.customer_invoices(due_date);

-- Partial index for unpaid invoices
CREATE INDEX IF NOT EXISTS idx_customer_invoices_unpaid
  ON public.customer_invoices(customer_id, due_date, amount_due)
  WHERE status IN ('draft', 'sent', 'viewed', 'overdue') AND amount_due > 0;

-- ============================================================================
-- CONTRACTS TABLE
-- B2B contract management
-- ============================================================================

-- Index for customer contract lookups
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id
  ON public.contracts(customer_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_contracts_status
  ON public.contracts(status);

-- Index for contract number lookups
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number
  ON public.contracts(contract_number);

-- ============================================================================
-- PARTNERS TABLE
-- Partner portal queries
-- ============================================================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_partners_status
  ON public.partners(status);

-- Index for partner code lookups
CREATE INDEX IF NOT EXISTS idx_partners_partner_code
  ON public.partners(partner_code);

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_customers_auth_user_id IS 'DEBT-017: Customer dashboard auth lookup';
COMMENT ON INDEX idx_customers_email IS 'DEBT-017: Order creation email lookup';
COMMENT ON INDEX idx_business_quotes_status_created IS 'DEBT-017: Admin dashboard quotes filter';
COMMENT ON INDEX idx_coverage_leads_status_created IS 'DEBT-017: Coverage analytics queries';
COMMENT ON INDEX idx_zoho_sync_logs_failed IS 'DEBT-017: Zoho sync monitoring';
COMMENT ON INDEX idx_consumer_orders_status_created IS 'DEBT-017: Orders dashboard filter';
