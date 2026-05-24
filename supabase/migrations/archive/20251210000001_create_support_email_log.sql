-- Support Email Log Table
-- Tracks all support emails sent from the admin panel for audit purposes

CREATE TABLE IF NOT EXISTS support_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resend tracking
  resend_message_id TEXT,
  
  -- Recipients
  recipients TEXT[] NOT NULL,
  cc_recipients TEXT[],
  bcc_recipients TEXT[],
  
  -- Content
  subject TEXT NOT NULL,
  
  -- Sender (admin user)
  sent_by_admin_id UUID REFERENCES admin_users(id),
  
  -- Related entities (optional)
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES consumer_orders(id),
  ticket_id UUID, -- For future support ticket system
  
  -- Timestamps
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_support_email_log_sent_at ON support_email_log(sent_at DESC);
CREATE INDEX idx_support_email_log_customer ON support_email_log(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_support_email_log_order ON support_email_log(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_support_email_log_admin ON support_email_log(sent_by_admin_id);

-- RLS Policies
ALTER TABLE support_email_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view support email logs"
  ON support_email_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = TRUE
    )
  );

-- Only admins can insert email logs
CREATE POLICY "Admins can insert support email logs"
  ON support_email_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = TRUE
    )
  );

-- Comment
COMMENT ON TABLE support_email_log IS 'Audit log of all support emails sent from the admin panel';
