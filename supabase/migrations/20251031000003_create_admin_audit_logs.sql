-- Migration: Create Admin Audit Logs Table
-- Description: Track all admin activities including password resets, login attempts, and system changes
-- Date: 2025-10-31
-- Author: CircleTel Development Team

-- ============================================
-- Create admin_audit_logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User Information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Action Details
  action TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN (
    'authentication',
    'password',
    'user_management',
    'system',
    'data_access',
    'configuration',
    'security'
  )),

  -- Request Context
  ip_address TEXT,
  user_agent TEXT,
  request_method TEXT,
  request_path TEXT,

  -- Action Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('success', 'failure', 'pending', 'warning')),
  error_message TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Security Flag
  is_suspicious BOOLEAN DEFAULT false,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low'
);

-- ============================================
-- Create Indexes for Performance
-- ============================================

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_email ON admin_audit_logs(user_email);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_category ON admin_audit_logs(action_category);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Index for security monitoring
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_is_suspicious ON admin_audit_logs(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_severity ON admin_audit_logs(severity) WHERE severity IN ('high', 'critical');

-- Index for IP address tracking (for rate limiting and security)
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_ip_address ON admin_audit_logs(ip_address);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_action_time ON admin_audit_logs(user_id, action, created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND admin_users.is_active = true
        AND (
          admin_users.role = 'super_admin'
          OR admin_users.role_template_id = 'super_admin'
        )
    )
  );

-- Policy: System can insert audit logs (service role)
CREATE POLICY "Service role can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_action_category TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_status TEXT DEFAULT 'success',
  p_severity TEXT DEFAULT 'low'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Get admin_user_id if exists
  SELECT id INTO v_admin_user_id
  FROM admin_users
  WHERE email = p_user_email
  LIMIT 1;

  -- Insert audit log
  INSERT INTO admin_audit_logs (
    user_id,
    user_email,
    admin_user_id,
    action,
    action_category,
    ip_address,
    user_agent,
    metadata,
    status,
    severity
  ) VALUES (
    p_user_id,
    p_user_email,
    v_admin_user_id,
    p_action,
    p_action_category,
    p_ip_address,
    p_user_agent,
    p_metadata,
    p_status,
    p_severity
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_failures INTEGER;
  v_different_ips INTEGER;
BEGIN
  -- Check for multiple failures from same user in last 15 minutes
  SELECT COUNT(*)
  INTO v_recent_failures
  FROM admin_audit_logs
  WHERE user_email = NEW.user_email
    AND status = 'failure'
    AND action_category IN ('authentication', 'password')
    AND created_at > NOW() - INTERVAL '15 minutes';

  -- Check for requests from multiple IPs in last 5 minutes
  SELECT COUNT(DISTINCT ip_address)
  INTO v_different_ips
  FROM admin_audit_logs
  WHERE user_email = NEW.user_email
    AND created_at > NOW() - INTERVAL '5 minutes'
    AND ip_address IS NOT NULL;

  -- Flag as suspicious if conditions met
  IF v_recent_failures >= 3 THEN
    NEW.is_suspicious := true;
    NEW.severity := 'high';
  ELSIF v_different_ips >= 3 THEN
    NEW.is_suspicious := true;
    NEW.severity := 'medium';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect suspicious activity
CREATE TRIGGER detect_suspicious_activity_trigger
  BEFORE INSERT ON admin_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_activity();

-- ============================================
-- Create View for Common Queries
-- ============================================

CREATE OR REPLACE VIEW v_admin_audit_logs_recent AS
SELECT
  aal.id,
  aal.user_email,
  au.full_name,
  aal.action,
  aal.action_category,
  aal.status,
  aal.severity,
  aal.is_suspicious,
  aal.ip_address,
  aal.created_at,
  aal.metadata
FROM admin_audit_logs aal
LEFT JOIN admin_users au ON au.id = aal.admin_user_id
WHERE aal.created_at > NOW() - INTERVAL '30 days'
ORDER BY aal.created_at DESC;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE admin_audit_logs IS 'Comprehensive audit trail for all admin activities';
COMMENT ON COLUMN admin_audit_logs.action IS 'Specific action taken (e.g., password_reset_requested, login_success)';
COMMENT ON COLUMN admin_audit_logs.action_category IS 'Category of action for filtering and reporting';
COMMENT ON COLUMN admin_audit_logs.is_suspicious IS 'Automatically flagged if suspicious patterns detected';
COMMENT ON COLUMN admin_audit_logs.severity IS 'Risk level of the action';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'Additional context data in JSON format';

-- ============================================
-- Sample Data for Testing (Optional)
-- ============================================

-- INSERT INTO admin_audit_logs (
--   user_email,
--   action,
--   action_category,
--   ip_address,
--   user_agent,
--   metadata,
--   status
-- ) VALUES (
--   'admin@circletel.co.za',
--   'password_reset_requested',
--   'password',
--   '192.168.1.1',
--   'Mozilla/5.0',
--   '{"reason": "forgot_password"}'::jsonb,
--   'success'
-- );

-- ============================================
-- Verification Queries
-- ============================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'admin_audit_logs'
-- ORDER BY ordinal_position;

-- View recent audit logs
-- SELECT * FROM v_admin_audit_logs_recent LIMIT 10;

-- Check for suspicious activity
-- SELECT user_email, action, ip_address, created_at
-- FROM admin_audit_logs
-- WHERE is_suspicious = true
-- ORDER BY created_at DESC;
