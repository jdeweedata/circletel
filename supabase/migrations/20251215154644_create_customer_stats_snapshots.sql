-- Migration: Create customer_stats_snapshots table for dashboard trend tracking
-- Purpose: Store daily snapshots of customer stats to calculate period-over-period trends

-- Create the snapshots table
CREATE TABLE IF NOT EXISTS public.customer_stats_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Core metrics (matches dashboard stats)
  active_services INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  pending_orders INTEGER NOT NULL DEFAULT 0,
  overdue_invoices INTEGER NOT NULL DEFAULT 0,
  account_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Additional metrics for future use
  total_invoiced_mtd DECIMAL(10, 2) DEFAULT 0,
  total_paid_mtd DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One snapshot per customer per day
  CONSTRAINT customer_stats_snapshots_unique UNIQUE(customer_id, snapshot_date)
);

-- Index for trend queries (get recent snapshots for a customer)
CREATE INDEX IF NOT EXISTS idx_customer_stats_snapshots_customer_date
  ON public.customer_stats_snapshots(customer_id, snapshot_date DESC);

-- Index for cron job queries (find customers without today's snapshot)
CREATE INDEX IF NOT EXISTS idx_customer_stats_snapshots_date
  ON public.customer_stats_snapshots(snapshot_date);

-- Enable RLS
ALTER TABLE public.customer_stats_snapshots ENABLE ROW LEVEL SECURITY;

-- Customers can view their own snapshots
CREATE POLICY "Customers can view own snapshots"
  ON public.customer_stats_snapshots
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role has full access (for cron job)
CREATE POLICY "Service role has full access to snapshots"
  ON public.customer_stats_snapshots
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.customer_stats_snapshots IS 'Daily snapshots of customer statistics for trend tracking on dashboard';
COMMENT ON COLUMN public.customer_stats_snapshots.active_services IS 'Count of services with status = active';
COMMENT ON COLUMN public.customer_stats_snapshots.total_orders IS 'Total consumer orders for customer';
COMMENT ON COLUMN public.customer_stats_snapshots.pending_orders IS 'Orders with status pending or awaiting_payment';
COMMENT ON COLUMN public.customer_stats_snapshots.overdue_invoices IS 'Invoices past due_date with status unpaid or partial';
COMMENT ON COLUMN public.customer_stats_snapshots.account_balance IS 'Current account balance (negative = customer owes money)';
COMMENT ON COLUMN public.customer_stats_snapshots.total_invoiced_mtd IS 'Total amount invoiced month-to-date';
COMMENT ON COLUMN public.customer_stats_snapshots.total_paid_mtd IS 'Total amount paid month-to-date';
