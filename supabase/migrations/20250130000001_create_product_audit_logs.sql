-- Migration: Create Product Audit Logs System
-- Date: 2025-01-30
-- Purpose: Track all product changes with complete audit trail including user attribution

-- Create product_audit_logs table
CREATE TABLE IF NOT EXISTS product_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  table_name TEXT DEFAULT 'products',
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),

  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],

  -- User attribution (will integrate with auth.users once real auth is implemented)
  changed_by UUID,  -- Future: REFERENCES auth.users(id)
  changed_by_email TEXT,
  changed_by_name TEXT,

  -- Context information
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_product_id ON product_audit_logs(product_id);
CREATE INDEX idx_audit_changed_at ON product_audit_logs(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON product_audit_logs(changed_by);
CREATE INDEX idx_audit_changed_by_email ON product_audit_logs(changed_by_email);
CREATE INDEX idx_audit_action ON product_audit_logs(action);
CREATE INDEX idx_audit_changed_fields ON product_audit_logs USING GIN(changed_fields);

-- Add comments for documentation
COMMENT ON TABLE product_audit_logs IS 'Comprehensive audit trail for all product changes including pricing, features, and status updates';
COMMENT ON COLUMN product_audit_logs.old_values IS 'Complete snapshot of row before change (JSONB format)';
COMMENT ON COLUMN product_audit_logs.new_values IS 'Complete snapshot of row after change (JSONB format)';
COMMENT ON COLUMN product_audit_logs.changed_fields IS 'Array of field names that were modified';
COMMENT ON COLUMN product_audit_logs.change_reason IS 'Optional explanation provided by user for why change was made';

-- Create trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_array TEXT[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Calculate which fields changed
    SELECT ARRAY(
      SELECT key FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
    ) INTO changed_fields_array;

    -- Only log if there are actual changes
    IF array_length(changed_fields_array, 1) > 0 THEN
      INSERT INTO product_audit_logs (
        product_id,
        action,
        old_values,
        new_values,
        changed_fields
      ) VALUES (
        OLD.id,
        'UPDATE',
        to_jsonb(OLD),
        to_jsonb(NEW),
        changed_fields_array
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO product_audit_logs (
      product_id,
      action,
      new_values
    ) VALUES (
      NEW.id,
      'INSERT',
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO product_audit_logs (
      product_id,
      action,
      old_values
    ) VALUES (
      OLD.id,
      'DELETE',
      to_jsonb(OLD)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on products table
DROP TRIGGER IF EXISTS products_audit_trigger ON products;
CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_changes();

-- Create trigger on promotions table (for promotional pricing changes)
DROP TRIGGER IF EXISTS promotions_audit_trigger ON promotions;
CREATE TRIGGER promotions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION log_product_changes();

-- Create view for easy audit querying with price changes highlighted
CREATE OR REPLACE VIEW product_price_changes AS
SELECT
  pal.id,
  pal.product_id,
  p.name as product_name,
  p.slug as product_slug,
  pal.action,
  (pal.old_values->>'monthly_price')::numeric as old_monthly_price,
  (pal.new_values->>'monthly_price')::numeric as new_monthly_price,
  (pal.old_values->>'setup_fee')::numeric as old_setup_fee,
  (pal.new_values->>'setup_fee')::numeric as new_setup_fee,
  CASE
    WHEN (pal.new_values->>'monthly_price')::numeric > (pal.old_values->>'monthly_price')::numeric
    THEN 'INCREASE'
    WHEN (pal.new_values->>'monthly_price')::numeric < (pal.old_values->>'monthly_price')::numeric
    THEN 'DECREASE'
    ELSE 'NO_CHANGE'
  END as price_trend,
  pal.changed_by_email,
  pal.changed_by_name,
  pal.change_reason,
  pal.changed_at
FROM product_audit_logs pal
JOIN products p ON p.id = pal.product_id
WHERE 'monthly_price' = ANY(pal.changed_fields)
   OR 'setup_fee' = ANY(pal.changed_fields)
ORDER BY pal.changed_at DESC;

COMMENT ON VIEW product_price_changes IS 'Simplified view showing only pricing-related changes with trend indicators';
