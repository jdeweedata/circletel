-- Allow system-generated audit entries (offline alerts, auto-sync, etc.)
-- These entries have no associated admin user

ALTER TABLE ruijie_audit_log
ALTER COLUMN admin_user_id DROP NOT NULL;

COMMENT ON COLUMN ruijie_audit_log.admin_user_id IS 'Admin user who performed action, NULL for system-generated entries (offline alerts, cron jobs)';

-- Update RLS policy to allow service_role inserts for system events
CREATE POLICY "Service role can insert audit log" ON ruijie_audit_log
  FOR INSERT TO service_role WITH CHECK (true);
