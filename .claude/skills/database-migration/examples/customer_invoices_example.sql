-- Example Migration: Customer Invoices Table
-- This is a real example from the CircleTel customer dashboard system
-- Shows complete table creation with RLS, indexes, and triggers

-- Migration: Create customer invoices table
-- Created: 2025-11-08
-- Purpose: Store generated invoices for customer billing with auto-numbering (INV-YYYY-NNN)

-- ============================================
-- STEP 1: Create Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_invoices (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auto-generated invoice number (INV-YYYY-NNN format)
  invoice_number TEXT UNIQUE NOT NULL,

  -- Foreign keys
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.customer_services(id) ON DELETE SET NULL,

  -- Invoice details
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Financial details
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')
  ),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'partial', 'paid', 'refunded')
  ),

  -- Payment tracking
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('card', 'eft', 'debit_order', 'cash', 'other')),
  payment_reference TEXT,

  -- Additional data
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps (REQUIRED)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 2: Create Indexes
-- ============================================

-- Index on foreign keys (REQUIRED for performance)
CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer_id
  ON public.customer_invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_service_id
  ON public.customer_invoices(service_id);

-- Index on invoice number for lookups
CREATE INDEX IF NOT EXISTS idx_customer_invoices_invoice_number
  ON public.customer_invoices(invoice_number);

-- Composite index for customer + status queries
CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer_status
  ON public.customer_invoices(customer_id, status);

-- Partial index for overdue invoices
CREATE INDEX IF NOT EXISTS idx_customer_invoices_overdue
  ON public.customer_invoices(customer_id, due_date)
WHERE status = 'overdue';

-- Index on due_date for reminders
CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_date
  ON public.customer_invoices(due_date)
WHERE status IN ('issued', 'sent');

-- ============================================
-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS Policies
-- ============================================

-- Service role can do everything (REQUIRED for API routes)
CREATE POLICY "service_role_all" ON public.customer_invoices
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Customers can read their own invoices
CREATE POLICY "customers_select_own" ON public.customer_invoices
  FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all invoices
CREATE POLICY "admins_select_all" ON public.customer_invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- Admins can insert invoices
CREATE POLICY "admins_insert" ON public.customer_invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- Admins can update invoices
CREATE POLICY "admins_update" ON public.customer_invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- Only admins can delete invoices
CREATE POLICY "admins_delete" ON public.customer_invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- STEP 5: Create Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER trigger_customer_invoices_update_timestamp
  BEFORE UPDATE ON public.customer_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Auto-update payment_status based on amount_paid
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid = 0 THEN
    NEW.payment_status = 'unpaid';
  ELSIF NEW.amount_paid >= NEW.total_amount THEN
    NEW.payment_status = 'paid';
    NEW.paid_at = COALESCE(NEW.paid_at, now());
  ELSE
    NEW.payment_status = 'partial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_invoices_payment_status
  BEFORE INSERT OR UPDATE ON public.customer_invoices
  FOR EACH ROW
  WHEN (NEW.amount_paid IS NOT NULL)
  EXECUTE FUNCTION public.update_invoice_payment_status();

-- ============================================
-- STEP 6: Add Comments
-- ============================================

COMMENT ON TABLE public.customer_invoices IS 'Generated invoices for customer billing with auto-numbering (INV-YYYY-NNN format)';
COMMENT ON COLUMN public.customer_invoices.invoice_number IS 'Auto-generated invoice number in format INV-YYYY-NNN';
COMMENT ON COLUMN public.customer_invoices.status IS 'Invoice lifecycle status: draft → issued → sent → paid/overdue';
COMMENT ON COLUMN public.customer_invoices.payment_status IS 'Payment status: unpaid, partial, paid, refunded';
COMMENT ON COLUMN public.customer_invoices.vat_amount IS 'VAT amount (15% in South Africa)';
COMMENT ON COLUMN public.customer_invoices.metadata IS 'Additional invoice data stored as JSON';
