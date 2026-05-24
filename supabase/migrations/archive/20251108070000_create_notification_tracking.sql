-- =====================================================
-- CircleTel Notification Tracking System
-- Created: 2025-11-08
-- Purpose: Track email and SMS delivery, opens, clicks
-- =====================================================

-- =====================================================
-- 1. NOTIFICATION TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Message identifiers
  message_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'delayed', 'opened', 'clicked', 'bounced', 'failed')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms')),

  -- Recipient information
  email TEXT,
  phone TEXT,

  -- Related records
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Event details
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notification_tracking_message_id ON notification_tracking(message_id);
CREATE INDEX idx_notification_tracking_order_id ON notification_tracking(order_id);
CREATE INDEX idx_notification_tracking_customer_id ON notification_tracking(customer_id);
CREATE INDEX idx_notification_tracking_event_type ON notification_tracking(event_type);
CREATE INDEX idx_notification_tracking_notification_type ON notification_tracking(notification_type);
CREATE INDEX idx_notification_tracking_timestamp ON notification_tracking(timestamp DESC);
CREATE INDEX idx_notification_tracking_email ON notification_tracking(email);
CREATE INDEX idx_notification_tracking_phone ON notification_tracking(phone);

COMMENT ON TABLE notification_tracking IS 'Tracks delivery, opens, clicks for emails and SMS notifications';
COMMENT ON COLUMN notification_tracking.message_id IS 'Unique message ID from provider (Resend, Clickatell)';
COMMENT ON COLUMN notification_tracking.event_type IS 'Event type: sent, delivered, delayed, opened, clicked, bounced, failed';
COMMENT ON COLUMN notification_tracking.metadata IS 'Additional event data (link clicked, bounce reason, etc.)';

-- =====================================================
-- 2. NOTIFICATION SUMMARY VIEW
-- =====================================================

CREATE OR REPLACE VIEW v_order_notifications AS
SELECT
  co.id AS order_id,
  co.order_number,
  co.first_name || ' ' || co.last_name AS customer_name,
  co.email,
  co.phone,

  -- Email tracking metrics
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'sent' AND nt.notification_type = 'email') AS emails_sent,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'delivered' AND nt.notification_type = 'email') AS emails_delivered,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'opened' AND nt.notification_type = 'email') AS emails_opened,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'clicked' AND nt.notification_type = 'email') AS emails_clicked,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'bounced' AND nt.notification_type = 'email') AS emails_bounced,

  -- SMS tracking metrics
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'sent' AND nt.notification_type = 'sms') AS sms_sent,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'delivered' AND nt.notification_type = 'sms') AS sms_delivered,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'failed' AND nt.notification_type = 'sms') AS sms_failed,

  -- Engagement rates (percentage)
  CASE
    WHEN COUNT(nt.id) FILTER (WHERE nt.event_type = 'delivered' AND nt.notification_type = 'email') > 0
    THEN (COUNT(nt.id) FILTER (WHERE nt.event_type = 'opened' AND nt.notification_type = 'email')::DECIMAL /
          COUNT(nt.id) FILTER (WHERE nt.event_type = 'delivered' AND nt.notification_type = 'email')::DECIMAL) * 100
    ELSE 0
  END AS email_open_rate,

  CASE
    WHEN COUNT(nt.id) FILTER (WHERE nt.event_type = 'delivered' AND nt.notification_type = 'email') > 0
    THEN (COUNT(nt.id) FILTER (WHERE nt.event_type = 'clicked' AND nt.notification_type = 'email')::DECIMAL /
          COUNT(nt.id) FILTER (WHERE nt.event_type = 'delivered' AND nt.notification_type = 'email')::DECIMAL) * 100
    ELSE 0
  END AS email_click_rate,

  -- Latest activity timestamps
  MAX(nt.timestamp) FILTER (WHERE nt.event_type = 'sent' AND nt.notification_type = 'email') AS last_email_sent,
  MAX(nt.timestamp) FILTER (WHERE nt.event_type = 'opened') AS last_email_opened,
  MAX(nt.timestamp) FILTER (WHERE nt.event_type = 'clicked') AS last_link_clicked,
  MAX(nt.timestamp) AS last_notification_event

FROM consumer_orders co
LEFT JOIN notification_tracking nt ON co.id = nt.order_id
GROUP BY co.id, co.order_number, co.first_name, co.last_name, co.email, co.phone;

COMMENT ON VIEW v_order_notifications IS 'Summary of notification tracking metrics per order';

-- =====================================================
-- 3. CUSTOMER NOTIFICATION ENGAGEMENT VIEW
-- =====================================================

CREATE OR REPLACE VIEW v_customer_notification_engagement AS
SELECT
  c.id AS customer_id,
  c.email,
  c.phone,

  -- Total notifications
  COUNT(DISTINCT nt.message_id) AS total_notifications,
  COUNT(DISTINCT nt.message_id) FILTER (WHERE nt.notification_type = 'email') AS total_emails,
  COUNT(DISTINCT nt.message_id) FILTER (WHERE nt.notification_type = 'sms') AS total_sms,

  -- Engagement metrics
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'opened') AS email_opens,
  COUNT(nt.id) FILTER (WHERE nt.event_type = 'clicked') AS link_clicks,

  -- Engagement scores (0-100)
  CASE
    WHEN COUNT(DISTINCT nt.message_id) FILTER (WHERE nt.notification_type = 'email') > 0
    THEN (COUNT(nt.id) FILTER (WHERE nt.event_type = 'opened')::DECIMAL /
          COUNT(DISTINCT nt.message_id) FILTER (WHERE nt.notification_type = 'email')::DECIMAL) * 100
    ELSE 0
  END AS engagement_score,

  -- Latest activity
  MAX(nt.timestamp) AS last_notification,
  MAX(nt.timestamp) FILTER (WHERE nt.event_type = 'opened') AS last_opened_email,
  MAX(nt.timestamp) FILTER (WHERE nt.event_type = 'clicked') AS last_clicked_link

FROM customers c
LEFT JOIN notification_tracking nt ON c.id = nt.customer_id
GROUP BY c.id, c.email, c.phone;

COMMENT ON VIEW v_customer_notification_engagement IS 'Customer notification engagement metrics';

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to get notification timeline for an order
CREATE OR REPLACE FUNCTION get_order_notification_timeline(p_order_id UUID)
RETURNS TABLE (
  event_time TIMESTAMPTZ,
  event_type TEXT,
  notification_type TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.timestamp AS event_time,
    nt.event_type,
    nt.notification_type,
    CASE
      WHEN nt.event_type = 'clicked' THEN 'Clicked: ' || COALESCE(nt.metadata->>'link', 'Unknown link')
      WHEN nt.event_type = 'bounced' THEN 'Bounced: ' || COALESCE(nt.metadata->>'bounce_reason', 'Unknown reason')
      WHEN nt.event_type = 'opened' THEN 'Opened email'
      WHEN nt.event_type = 'delivered' THEN 'Successfully delivered'
      ELSE nt.event_type
    END AS details
  FROM notification_tracking nt
  WHERE nt.order_id = p_order_id
  ORDER BY nt.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_order_notification_timeline IS 'Get chronological notification events for an order';

-- Function to check if customer is engaged (opened recent emails)
CREATE OR REPLACE FUNCTION is_customer_engaged(p_customer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_opens INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO recent_opens
  FROM notification_tracking
  WHERE customer_id = p_customer_id
    AND event_type = 'opened'
    AND timestamp >= NOW() - INTERVAL '30 days';

  RETURN recent_opens > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_customer_engaged IS 'Check if customer has opened any emails in the last 30 days';

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE notification_tracking ENABLE ROW LEVEL SECURITY;

-- Admin users can view all notification tracking
CREATE POLICY "Admin users can view all notification tracking"
  ON notification_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Service role can insert notification tracking (for webhooks)
CREATE POLICY "Service role can insert notification tracking"
  ON notification_tracking
  FOR INSERT
  TO authenticated
  USING (true);

-- Customers can view their own notification tracking
CREATE POLICY "Customers can view their own notification tracking"
  ON notification_tracking
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- =====================================================
-- 6. SAMPLE QUERIES (DOCUMENTATION)
-- =====================================================

-- Query 1: Get all notifications for a specific order
-- SELECT * FROM get_order_notification_timeline('order-uuid-here');

-- Query 2: Get notification summary for all orders
-- SELECT * FROM v_order_notifications ORDER BY last_notification_event DESC LIMIT 20;

-- Query 3: Find orders with high email engagement (>50% open rate)
-- SELECT * FROM v_order_notifications WHERE email_open_rate > 50 ORDER BY email_open_rate DESC;

-- Query 4: Get customers who never opened emails
-- SELECT * FROM v_customer_notification_engagement WHERE total_emails > 0 AND email_opens = 0;

-- Query 5: Track a specific email's journey
-- SELECT event_type, timestamp, metadata FROM notification_tracking
-- WHERE message_id = 'resend-message-id-here' ORDER BY timestamp;

-- Query 6: Get daily notification stats
-- SELECT
--   DATE(timestamp) AS date,
--   notification_type,
--   event_type,
--   COUNT(*) AS count
-- FROM notification_tracking
-- WHERE timestamp >= NOW() - INTERVAL '30 days'
-- GROUP BY DATE(timestamp), notification_type, event_type
-- ORDER BY date DESC, notification_type, event_type;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verification
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_tracking') THEN
    RAISE NOTICE '✅ notification_tracking table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create notification_tracking table';
  END IF;

  -- Check if views exist
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_order_notifications') THEN
    RAISE NOTICE '✅ v_order_notifications view created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create v_order_notifications view';
  END IF;

  RAISE NOTICE '🎉 Notification tracking system ready!';
END $$;
