-- Service Packages Audit Log System
-- Tracks all changes made to service_packages table for compliance and debugging

-- Create audit log table
CREATE TABLE IF NOT EXISTS service_packages_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (
    action IN ('create', 'update', 'delete', 'activate', 'deactivate', 'price_change')
  ),
  changed_by VARCHAR(255) NOT NULL,
  changed_by_email VARCHAR(255) NOT NULL,
  changes JSONB NOT NULL,
  previous_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_package_id ON service_packages_audit_log(package_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON service_packages_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON service_packages_audit_log(changed_by_email);
CREATE INDEX IF NOT EXISTS idx_audit_action ON service_packages_audit_log(action);

-- Create function to automatically log updates
CREATE OR REPLACE FUNCTION log_service_package_update()
RETURNS TRIGGER AS $$
DECLARE
  changes_json JSONB;
  previous_json JSONB;
BEGIN
  -- Build changes object
  changes_json := jsonb_build_object(
    'name', NEW.name,
    'price', NEW.price,
    'promotion_price', NEW.promotion_price,
    'active', NEW.active,
    'updated_at', NEW.updated_at
  );

  -- Build previous values object
  previous_json := jsonb_build_object(
    'name', OLD.name,
    'price', OLD.price,
    'promotion_price', OLD.promotion_price,
    'active', OLD.active
  );

  -- Insert audit log (if we have user context in session)
  IF current_setting('app.user_email', true) IS NOT NULL THEN
    INSERT INTO service_packages_audit_log (
      package_id,
      action,
      changed_by,
      changed_by_email,
      changes,
      previous_values
    ) VALUES (
      NEW.id,
      CASE
        WHEN OLD.active = false AND NEW.active = true THEN 'activate'
        WHEN OLD.active = true AND NEW.active = false THEN 'deactivate'
        WHEN OLD.price != NEW.price OR OLD.promotion_price != NEW.promotion_price THEN 'price_change'
        ELSE 'update'
      END,
      current_setting('app.user_name', true),
      current_setting('app.user_email', true),
      changes_json,
      previous_json
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on service_packages
DROP TRIGGER IF EXISTS trigger_log_service_package_update ON service_packages;
CREATE TRIGGER trigger_log_service_package_update
  AFTER UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION log_service_package_update();

-- Add updated_at trigger to service_packages if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_service_packages_updated_at ON service_packages;
CREATE TRIGGER trigger_update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON service_packages_audit_log TO authenticated;
GRANT INSERT ON service_packages_audit_log TO authenticated;

-- Add comments
COMMENT ON TABLE service_packages_audit_log IS 'Audit trail for all changes to service_packages table';
COMMENT ON COLUMN service_packages_audit_log.changes IS 'JSON object containing the new values';
COMMENT ON COLUMN service_packages_audit_log.previous_values IS 'JSON object containing the old values before change';
COMMENT ON FUNCTION log_service_package_update() IS 'Automatically logs updates to service_packages table';
