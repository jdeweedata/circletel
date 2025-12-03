-- Migration: Create invoice notification tracking system
-- Date: 2025-12-03
-- Description: Tracks all notifications sent for overdue invoices (SMS, Email)
--              Supports AR analytics, DSO tracking, and collection effectiveness

-- =============================================================================
-- Drop existing tables if they exist (clean slate)
-- =============================================================================
DROP TABLE IF EXISTS invoice_collection_activity CASCADE;
DROP TABLE IF EXISTS invoice_notification_log CASCADE;
DROP TABLE IF EXISTS ar_aging_snapshots CASCADE;
DROP VIEW IF EXISTS v_ar_dashboard_summary CASCADE;
DROP VIEW IF EXISTS v_notification_analytics CASCADE;

-- =============================================================================
-- Invoice Notification Log Table
-- =============================================================================
CREATE TABLE invoice_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invoice reference
  invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  
  -- Customer reference (optional, can be derived from invoice)
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'email', 'whatsapp', 'call')),
  notification_template TEXT, -- e.g., 'first_reminder', 'second_reminder', 'final_notice'
  
  -- Delivery details
  recipient TEXT NOT NULL, -- Phone number or email address
  message_content TEXT, -- Actual message sent (for audit)
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  provider TEXT, -- 'clickatell', 'resend', etc.
  provider_message_id TEXT, -- External message ID from provider
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Financial context at time of notification
  amount_due DECIMAL(10,2) NOT NULL,
  days_overdue INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_log_invoice ON invoice_notification_log(invoice_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_customer ON invoice_notification_log(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON invoice_notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON invoice_notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON invoice_notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_days_overdue ON invoice_notification_log(days_overdue);

-- =============================================================================
-- AR Aging Snapshot Table (Daily snapshots for trend analysis)
-- =============================================================================
CREATE TABLE ar_aging_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  
  -- Total AR
  total_outstanding DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_invoices INTEGER NOT NULL DEFAULT 0,
  
  -- Aging buckets
  current_amount DECIMAL(12,2) DEFAULT 0, -- Not yet due
  overdue_1_30_amount DECIMAL(12,2) DEFAULT 0, -- 1-30 days overdue
  overdue_31_60_amount DECIMAL(12,2) DEFAULT 0, -- 31-60 days overdue
  overdue_61_90_amount DECIMAL(12,2) DEFAULT 0, -- 61-90 days overdue
  overdue_90_plus_amount DECIMAL(12,2) DEFAULT 0, -- 90+ days overdue
  
  -- Invoice counts per bucket
  current_count INTEGER DEFAULT 0,
  overdue_1_30_count INTEGER DEFAULT 0,
  overdue_31_60_count INTEGER DEFAULT 0,
  overdue_61_90_count INTEGER DEFAULT 0,
  overdue_90_plus_count INTEGER DEFAULT 0,
  
  -- DSO metrics
  dso_current DECIMAL(6,2), -- Days Sales Outstanding
  dso_best_possible DECIMAL(6,2), -- Best Possible DSO
  
  -- Collection metrics
  collection_effectiveness_index DECIMAL(5,2), -- CEI percentage
  average_days_delinquent DECIMAL(6,2), -- ADD
  
  -- Notification metrics
  sms_sent_count INTEGER DEFAULT 0,
  email_sent_count INTEGER DEFAULT 0,
  total_notifications INTEGER DEFAULT 0,
  
  -- Payment metrics
  payments_received_amount DECIMAL(12,2) DEFAULT 0,
  payments_received_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ar_snapshots_date ON ar_aging_snapshots(snapshot_date DESC);

-- =============================================================================
-- Collection Activity Summary (Per invoice tracking)
-- =============================================================================
CREATE TABLE invoice_collection_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
  
  -- Collection status
  collection_status TEXT DEFAULT 'active' CHECK (collection_status IN ('active', 'paid', 'written_off', 'disputed', 'payment_plan')),
  
  -- Notification counts
  sms_count INTEGER DEFAULT 0,
  email_count INTEGER DEFAULT 0,
  call_count INTEGER DEFAULT 0,
  total_contact_attempts INTEGER DEFAULT 0,
  
  -- First and last contact
  first_contact_date TIMESTAMPTZ,
  last_contact_date TIMESTAMPTZ,
  next_scheduled_contact TIMESTAMPTZ,
  
  -- Response tracking
  customer_responded BOOLEAN DEFAULT FALSE,
  response_date TIMESTAMPTZ,
  response_notes TEXT,
  
  -- Payment promise
  promised_payment_date DATE,
  promised_amount DECIMAL(10,2),
  
  -- Escalation
  escalation_level INTEGER DEFAULT 0, -- 0=normal, 1=urgent, 2=final, 3=collections
  escalated_at TIMESTAMPTZ,
  
  -- Outcome
  days_to_payment INTEGER, -- Days from first contact to payment
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(invoice_id)
);

CREATE INDEX idx_collection_activity_status ON invoice_collection_activity(collection_status);
CREATE INDEX idx_collection_activity_escalation ON invoice_collection_activity(escalation_level);

-- =============================================================================
-- Function to update collection activity on notification
-- =============================================================================
CREATE OR REPLACE FUNCTION update_collection_activity_on_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invoice_collection_activity (
    invoice_id,
    first_contact_date,
    last_contact_date,
    sms_count,
    email_count,
    total_contact_attempts
  )
  VALUES (
    NEW.invoice_id,
    NEW.sent_at,
    NEW.sent_at,
    CASE WHEN NEW.notification_type = 'sms' THEN 1 ELSE 0 END,
    CASE WHEN NEW.notification_type = 'email' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (invoice_id) DO UPDATE SET
    last_contact_date = NEW.sent_at,
    sms_count = invoice_collection_activity.sms_count + CASE WHEN NEW.notification_type = 'sms' THEN 1 ELSE 0 END,
    email_count = invoice_collection_activity.email_count + CASE WHEN NEW.notification_type = 'email' THEN 1 ELSE 0 END,
    total_contact_attempts = invoice_collection_activity.total_contact_attempts + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update collection activity
DROP TRIGGER IF EXISTS trg_update_collection_activity ON invoice_notification_log;
CREATE TRIGGER trg_update_collection_activity
  AFTER INSERT ON invoice_notification_log
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION update_collection_activity_on_notification();

-- =============================================================================
-- View for AR Dashboard Summary
-- =============================================================================
CREATE OR REPLACE VIEW v_ar_dashboard_summary AS
SELECT
  COUNT(*) FILTER (WHERE ci.status IN ('unpaid', 'overdue', 'partial')) AS total_outstanding_invoices,
  COALESCE(SUM(ci.amount_due) FILTER (WHERE ci.status IN ('unpaid', 'overdue', 'partial')), 0) AS total_outstanding_amount,
  
  -- Aging buckets
  COUNT(*) FILTER (WHERE ci.due_date >= CURRENT_DATE) AS current_count,
  COALESCE(SUM(ci.amount_due) FILTER (WHERE ci.due_date >= CURRENT_DATE), 0) AS current_amount,
  
  COUNT(*) FILTER (WHERE ci.due_date < CURRENT_DATE AND ci.due_date >= CURRENT_DATE - INTERVAL '30 days') AS overdue_1_30_count,
  COALESCE(SUM(ci.amount_due) FILTER (WHERE ci.due_date < CURRENT_DATE AND ci.due_date >= CURRENT_DATE - INTERVAL '30 days'), 0) AS overdue_1_30_amount,
  
  COUNT(*) FILTER (WHERE ci.due_date < CURRENT_DATE - INTERVAL '30 days' AND ci.due_date >= CURRENT_DATE - INTERVAL '60 days') AS overdue_31_60_count,
  COALESCE(SUM(ci.amount_due) FILTER (WHERE ci.due_date < CURRENT_DATE - INTERVAL '30 days' AND ci.due_date >= CURRENT_DATE - INTERVAL '60 days'), 0) AS overdue_31_60_amount,
  
  COUNT(*) FILTER (WHERE ci.due_date < CURRENT_DATE - INTERVAL '60 days' AND ci.due_date >= CURRENT_DATE - INTERVAL '90 days') AS overdue_61_90_count,
  COALESCE(SUM(ci.amount_due) FILTER (WHERE ci.due_date < CURRENT_DATE - INTERVAL '60 days' AND ci.due_date >= CURRENT_DATE - INTERVAL '90 days'), 0) AS overdue_61_90_amount,
  
  COUNT(*) FILTER (WHERE ci.due_date < CURRENT_DATE - INTERVAL '90 days') AS overdue_90_plus_count,
  COALESCE(SUM(ci.amount_due) FILTER (WHERE ci.due_date < CURRENT_DATE - INTERVAL '90 days'), 0) AS overdue_90_plus_amount,
  
  -- Average days overdue
  COALESCE(AVG(CURRENT_DATE - ci.due_date) FILTER (WHERE ci.due_date < CURRENT_DATE AND ci.status IN ('unpaid', 'overdue', 'partial')), 0) AS avg_days_overdue
  
FROM public.customer_invoices ci
WHERE ci.status IN ('unpaid', 'overdue', 'partial', 'sent');

-- =============================================================================
-- View for Notification Analytics
-- =============================================================================
CREATE OR REPLACE VIEW v_notification_analytics AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS date,
  notification_type,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'opened') AS opened,
  COUNT(*) FILTER (WHERE status = 'clicked') AS clicked,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  SUM(amount_due) AS total_amount_notified,
  AVG(days_overdue) AS avg_days_overdue
FROM invoice_notification_log
GROUP BY DATE_TRUNC('day', created_at)::DATE, notification_type
ORDER BY date DESC;

-- =============================================================================
-- Permissions
-- =============================================================================
GRANT SELECT, INSERT, UPDATE ON invoice_notification_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ar_aging_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON invoice_collection_activity TO authenticated;
GRANT SELECT ON v_ar_dashboard_summary TO authenticated;
GRANT SELECT ON v_notification_analytics TO authenticated;

GRANT ALL ON invoice_notification_log TO service_role;
GRANT ALL ON ar_aging_snapshots TO service_role;
GRANT ALL ON invoice_collection_activity TO service_role;

-- Comments
COMMENT ON TABLE invoice_notification_log IS 'Tracks all notifications sent for overdue invoices';
COMMENT ON TABLE ar_aging_snapshots IS 'Daily snapshots of AR aging for trend analysis';
COMMENT ON TABLE invoice_collection_activity IS 'Per-invoice collection activity summary';
COMMENT ON VIEW v_ar_dashboard_summary IS 'Real-time AR dashboard summary';
COMMENT ON VIEW v_notification_analytics IS 'Notification analytics by day and type';
