/**
 * Quote Notification System - Extends existing notification system
 *
 * Adds email/SMS notification templates and tracking for business quote events
 * Does not conflict with existing admin notification system
 */

-- Quote-specific notification events enum
CREATE TYPE quote_notification_event AS ENUM (
  'quote_created',
  'quote_approved',
  'quote_sent',
  'quote_viewed',
  'quote_accepted',
  'quote_rejected',
  'quote_expired'
);

-- Notification delivery type (email/sms)
CREATE TYPE notification_delivery_type AS ENUM (
  'email',
  'sms',
  'push'
);

-- Notification delivery status
CREATE TYPE notification_delivery_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced'
);

-- Email/SMS notification templates table
CREATE TABLE quote_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event quote_notification_event NOT NULL,
  delivery_type notification_delivery_type NOT NULL,
  subject TEXT, -- For email only
  body TEXT NOT NULL, -- Template with {{variables}}
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event, delivery_type)
);

-- Notification delivery log table
CREATE TABLE quote_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event quote_notification_event NOT NULL,
  delivery_type notification_delivery_type NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  status notification_delivery_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES sales_agents(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE quote_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL, -- 'agent', 'customer', 'admin'
  user_id UUID NOT NULL,
  event quote_notification_event NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_type, user_id, event)
);

-- Indexes
CREATE INDEX idx_quote_notification_log_quote_id ON quote_notification_log(quote_id);
CREATE INDEX idx_quote_notification_log_agent_id ON quote_notification_log(agent_id);
CREATE INDEX idx_quote_notification_log_status ON quote_notification_log(status);
CREATE INDEX idx_quote_notification_log_created_at ON quote_notification_log(created_at DESC);
CREATE INDEX idx_quote_notification_preferences_user ON quote_notification_preferences(user_type, user_id);

-- Updated at trigger
CREATE TRIGGER update_quote_notification_templates_updated_at
  BEFORE UPDATE ON quote_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_notification_log_updated_at
  BEFORE UPDATE ON quote_notification_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_notification_preferences_updated_at
  BEFORE UPDATE ON quote_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates (skip if already exists)
INSERT INTO quote_notification_templates (event, delivery_type, subject, body, enabled) VALUES

-- Quote Created (to admin)
('quote_created'::quote_notification_event, 'email'::notification_delivery_type,
 'New Quote Request: {{quote_number}}',
 'A new quote request has been submitted.

Quote Number: {{quote_number}}
Company: {{company_name}}
Contact: {{contact_name}} ({{contact_email}})
Total Monthly: R{{total_monthly}}
Agent: {{agent_name}}

View quote in admin panel: {{admin_url}}

--
CircleTel Business Solutions',
 TRUE),

-- Quote Approved (to agent)
('quote_approved'::quote_notification_event, 'email'::notification_delivery_type,
 'Quote Approved: {{quote_number}}',
 'Great news! Your quote has been approved by our team.

Quote Number: {{quote_number}}
Company: {{company_name}}
Total Monthly: R{{total_monthly}}
Commission: R{{commission_amount}}

The quote has been sent to the customer. You''ll be notified when they view or accept it.

View in your dashboard: {{agent_dashboard_url}}

--
CircleTel Sales Team',
 TRUE),

-- Quote Approved (to customer)
('quote_approved', 'email',
 'Your CircleTel Quote: {{quote_number}}',
 'Dear {{contact_name}},

Thank you for your interest in CircleTel business connectivity solutions.

Your quote is ready for review:

Quote Number: {{quote_number}}
Company: {{company_name}}
Total Monthly: R{{total_monthly}}
Installation: R{{total_installation}}
Contract Term: {{contract_term}} months

View and accept your quote: {{acceptance_url}}

This quote is valid until {{valid_until}}.

If you have any questions, please contact your sales representative or reply to this email.

Best regards,
CircleTel Business Solutions

Phone: 087 087 6305
Email: contactus@circletel.co.za',
 TRUE),

-- Quote Viewed (to agent)
('quote_viewed'::quote_notification_event, 'email'::notification_delivery_type,
 'Quote Viewed: {{quote_number}}',
 'Your customer has viewed their quote!

Quote Number: {{quote_number}}
Company: {{company_name}}
Viewed At: {{viewed_at}}

This is a great time to follow up with {{contact_name}} at {{contact_email}} or {{contact_phone}}.

View in your dashboard: {{agent_dashboard_url}}

--
CircleTel Sales Team',
 TRUE),

-- Quote Accepted (to agent)
('quote_accepted'::quote_notification_event, 'email'::notification_delivery_type,
 'Quote Accepted: {{quote_number}} - Commission Earned!',
 'Congratulations! Your quote has been accepted.

Quote Number: {{quote_number}}
Company: {{company_name}}
Total Monthly: R{{total_monthly}}
Your Commission: R{{commission_amount}} ({{commission_rate}}%)

The customer has signed and accepted the quote. Our operations team will begin the installation process.

View in your dashboard: {{agent_dashboard_url}}

Keep up the great work!

--
CircleTel Sales Team',
 TRUE),

-- Quote Accepted (to admin)
('quote_accepted'::quote_notification_event, 'email'::notification_delivery_type,
 'Quote Accepted: {{quote_number}}',
 'A quote has been accepted and is ready for processing.

Quote Number: {{quote_number}}
Company: {{company_name}}
Contact: {{contact_name}} ({{contact_email}})
Total Monthly: R{{total_monthly}}
Installation: R{{total_installation}}
Agent: {{agent_name}}
Accepted At: {{accepted_at}}

View in admin panel: {{admin_url}}

Next Steps:
1. Create customer account
2. Schedule installation
3. Process payment
4. Activate service

--
CircleTel Operations',
 TRUE),

-- Quote Rejected (to agent)
('quote_rejected'::quote_notification_event, 'email'::notification_delivery_type,
 'Quote Declined: {{quote_number}}',
 'Unfortunately, the customer has declined your quote.

Quote Number: {{quote_number}}
Company: {{company_name}}
Reason: {{rejection_reason}}

You may want to reach out to {{contact_name}} to understand their concerns and potentially create a revised quote.

View in your dashboard: {{agent_dashboard_url}}

--
CircleTel Sales Team',
 TRUE),

-- Quote Expired (to agent)
('quote_expired'::quote_notification_event, 'email'::notification_delivery_type,
 'Quote Expired: {{quote_number}}',
 'This quote has expired without acceptance.

Quote Number: {{quote_number}}
Company: {{company_name}}
Expired On: {{valid_until}}

If the customer is still interested, you can create a new quote with updated pricing.

View in your dashboard: {{agent_dashboard_url}}

--
CircleTel Sales Team',
 TRUE)
ON CONFLICT (event, delivery_type) DO NOTHING;

-- Insert default SMS templates (shorter versions, skip if already exists)
INSERT INTO quote_notification_templates (event, delivery_type, subject, body, enabled) VALUES

('quote_created'::quote_notification_event, 'sms'::notification_delivery_type, NULL,
 'CircleTel: New quote {{quote_number}} submitted by {{company_name}}. Check admin panel.',
 FALSE),

('quote_approved'::quote_notification_event, 'sms'::notification_delivery_type, NULL,
 'CircleTel: Quote {{quote_number}} approved! Commission: R{{commission_amount}}. Customer notified.',
 FALSE),

('quote_viewed'::quote_notification_event, 'sms'::notification_delivery_type, NULL,
 'CircleTel: {{company_name}} viewed quote {{quote_number}}. Great time to follow up!',
 FALSE),

('quote_accepted'::quote_notification_event, 'sms'::notification_delivery_type, NULL,
 'CircleTel: Quote {{quote_number}} accepted! Commission earned: R{{commission_amount}}. Congratulations!',
 FALSE),

('quote_rejected'::quote_notification_event, 'sms'::notification_delivery_type, NULL,
 'CircleTel: Quote {{quote_number}} declined by {{company_name}}. Reach out to discuss.',
 FALSE),

('quote_expired'::quote_notification_event, 'sms'::notification_delivery_type, NULL,
 'CircleTel: Quote {{quote_number}} expired. Contact {{company_name}} to create a new quote.',
 FALSE)
ON CONFLICT (event, delivery_type) DO NOTHING;

-- RLS policies
ALTER TABLE quote_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates (for now)
CREATE POLICY "Anyone can view quote notification templates"
  ON quote_notification_templates FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage templates
CREATE POLICY "Service role can manage quote notification templates"
  ON quote_notification_templates FOR ALL
  TO service_role
  WITH CHECK (true);

-- Agents can view their own notification logs
CREATE POLICY "Agents can view their quote notifications"
  ON quote_notification_log FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR recipient_email = (SELECT email FROM sales_agents WHERE id = auth.uid())
  );

-- Service role can view all notification logs (for admin API)
CREATE POLICY "Service can view all quote notifications"
  ON quote_notification_log FOR SELECT
  TO service_role
  USING (true);

-- Service role can create and update logs
CREATE POLICY "Service can manage quote notification logs"
  ON quote_notification_log FOR ALL
  TO service_role
  WITH CHECK (true);

-- Users can manage their own preferences
CREATE POLICY "Users can manage own quote notification preferences"
  ON quote_notification_preferences FOR ALL
  TO authenticated
  USING (
    (user_type = 'agent' AND user_id = auth.uid())
    OR (user_type = 'admin' AND user_id = auth.uid())
  );

-- Comments
COMMENT ON TABLE quote_notification_templates IS 'Email/SMS templates for business quote events';
COMMENT ON TABLE quote_notification_log IS 'Audit log of all quote-related notifications sent';
COMMENT ON TABLE quote_notification_preferences IS 'Per-user notification preferences for quote events';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON quote_notification_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quote_notification_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quote_notification_preferences TO authenticated;
