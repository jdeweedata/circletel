-- Product Approval System Migration
-- Creates tables for product imports, approvals, notifications, and reminders
-- Version: 1.0
-- Date: 2025-10-19

-- ============================================
-- 1. Product Imports Table
-- ============================================
CREATE TABLE IF NOT EXISTS product_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  product_category TEXT NOT NULL, -- e.g., 'BizFibre Connect', 'Wireless', 'Enterprise'
  import_date TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  total_products INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Store Excel metadata, version info
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Product Approval Queue Table
-- ============================================
CREATE TABLE IF NOT EXISTS product_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES product_imports(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_data JSONB NOT NULL, -- Full product details from Excel
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  approval_deadline TIMESTAMPTZ,

  -- Approval workflow
  reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approval_notes TEXT,
  rejection_reason TEXT,

  -- Product mapping
  service_package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL, -- Once approved

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Notifications Table
-- ============================================
-- DEPRECATED: This table creation is now handled by 20251024150316_create_notifications_system.sql
-- and fixed by 20251106210000_fix_notifications_schema.sql
-- Commenting out to prevent schema conflicts
/*
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
  category TEXT DEFAULT 'general', -- 'product_approval', 'order', 'system', 'reminder'

  -- Link to related entities
  related_entity_type TEXT, -- 'product_import', 'product_approval', 'order', etc.
  related_entity_id UUID,

  -- Notification state
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT FALSE,

  -- Action links
  action_url TEXT,
  action_label TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- ============================================
-- 4. Reminders Table
-- ============================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,

  -- Reminder configuration
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('one_time', 'recurring')),
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', JSON for complex patterns

  -- Link to related entities
  related_entity_type TEXT,
  related_entity_id UUID,

  -- Reminder state
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,

  -- Notification preferences
  notify_email BOOLEAN DEFAULT FALSE,
  notify_in_app BOOLEAN DEFAULT TRUE,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Activity Log for Audit Trail
-- ============================================
CREATE TABLE IF NOT EXISTS product_approval_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID REFERENCES product_imports(id) ON DELETE CASCADE,
  approval_queue_id UUID REFERENCES product_approval_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'assigned', 'approved', 'rejected', 'commented'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_imports_status ON product_imports(status);
CREATE INDEX IF NOT EXISTS idx_product_imports_category ON product_imports(product_category);
CREATE INDEX IF NOT EXISTS idx_product_imports_date ON product_imports(import_date DESC);

CREATE INDEX IF NOT EXISTS idx_product_approval_queue_status ON product_approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_product_approval_queue_import ON product_approval_queue(import_id);
CREATE INDEX IF NOT EXISTS idx_product_approval_queue_assigned ON product_approval_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_product_approval_queue_deadline ON product_approval_queue(approval_deadline);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(related_entity_type, related_entity_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

CREATE INDEX IF NOT EXISTS idx_activity_log_import ON product_approval_activity_log(import_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_approval ON product_approval_activity_log(approval_queue_id);

-- ============================================
-- 7. Triggers for Updated Timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_imports_updated_at
  BEFORE UPDATE ON product_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_approval_queue_updated_at
  BEFORE UPDATE ON product_approval_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Notification Trigger Functions
-- ============================================
CREATE OR REPLACE FUNCTION create_product_import_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_product_managers UUID[];
BEGIN
  -- Get all users with product management permissions
  SELECT ARRAY_AGG(id) INTO v_product_managers
  FROM admin_users
  WHERE role_template_id IN (
    SELECT id FROM role_templates
    WHERE name IN ('Super Admin', 'Product Manager', 'Admin')
  );

  -- Create notification for each product manager
  INSERT INTO notifications (user_id, title, message, type, category, related_entity_type, related_entity_id, action_url, action_label)
  SELECT
    unnest(v_product_managers),
    'New Product Import Ready for Review',
    format('A new product import from %s with %s products is ready for your review.', NEW.product_category, NEW.total_products),
    'info',
    'product_approval',
    'product_import',
    NEW.id,
    format('/admin/products/approvals/%s', NEW.id),
    'Review Products';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_product_import
  AFTER INSERT ON product_imports
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION create_product_import_notification();

-- ============================================
-- 9. Reminder Creation for Approaching Deadlines
-- ============================================
CREATE OR REPLACE FUNCTION create_approval_deadline_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminder if deadline is set and assigned to someone
  IF NEW.approval_deadline IS NOT NULL AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO reminders (
      user_id,
      title,
      description,
      due_date,
      reminder_type,
      related_entity_type,
      related_entity_id,
      notify_in_app
    ) VALUES (
      NEW.assigned_to,
      format('Product Approval Deadline: %s', NEW.product_name),
      format('This product approval is due on %s', NEW.approval_deadline::DATE),
      NEW.approval_deadline - INTERVAL '1 day', -- Remind 1 day before
      'one_time',
      'product_approval',
      NEW.id,
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_deadline_reminder
  AFTER INSERT ON product_approval_queue
  FOR EACH ROW
  WHEN (NEW.approval_deadline IS NOT NULL AND NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION create_approval_deadline_reminder();

-- ============================================
-- 10. RLS Policies
-- ============================================
ALTER TABLE product_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_approval_activity_log ENABLE ROW LEVEL SECURITY;

-- Product Imports: Product managers can view/edit
CREATE POLICY product_imports_policy ON product_imports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Admin', 'Product Manager', 'Admin', 'Product Analyst')
      )
    )
  );

-- Product Approval Queue: Assigned users + product managers
CREATE POLICY product_approval_queue_policy ON product_approval_queue
  FOR ALL
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Admin', 'Product Manager', 'Admin')
      )
    )
  );

-- Notifications: Users can only see their own
CREATE POLICY notifications_policy ON notifications
  FOR ALL
  USING (user_id = auth.uid());

-- Reminders: Users can only see their own
CREATE POLICY reminders_policy ON reminders
  FOR ALL
  USING (user_id = auth.uid());

-- Activity Log: Product managers can view
CREATE POLICY activity_log_policy ON product_approval_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Admin', 'Product Manager', 'Admin')
      )
    )
  );

-- ============================================
-- 11. Helper Functions
-- ============================================

-- Get pending approvals count for a user
CREATE OR REPLACE FUNCTION get_pending_approvals_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM product_approval_queue
    WHERE assigned_to = p_user_id
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql;

-- Get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = p_user_id
    AND read = FALSE
    AND archived = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = p_notification_id
  AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Complete a reminder
CREATE OR REPLACE FUNCTION complete_reminder(p_reminder_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE reminders
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_reminder_id
  AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
COMMENT ON TABLE product_imports IS 'Stores product import batches from Excel files';
COMMENT ON TABLE product_approval_queue IS 'Queue for products pending approval before adding to database';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE reminders IS 'User reminders for tasks and deadlines';
COMMENT ON TABLE product_approval_activity_log IS 'Audit trail for product approval workflow';
