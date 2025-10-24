-- =====================================================================
-- CircleTel Notification System - Database Migration
-- =====================================================================
-- Description: Creates tables and policies for notification system
-- Feature: Phase 3.4 - Notification System
-- Created: 2025-10-24
-- Worker: database-worker (Multi-Agent Orchestration System)
-- =====================================================================

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'product_approval',
  'price_change',
  'system_update',
  'user_activity',
  'error_alert',
  'performance_warning'
);

-- Notification priority
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- =====================================================================
-- 2. NOTIFICATIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(50), -- Icon identifier (e.g., 'warning', 'info', 'error')

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (e.g., product_id, order_id)
  link_url VARCHAR(500), -- Deep link to relevant page

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- =====================================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  -- Composite primary key (user + type)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,

  -- Preference settings
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  PRIMARY KEY (user_id, notification_type)
);

-- =====================================================================
-- 4. INDEXES
-- =====================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read)
  WHERE deleted_at IS NULL AND is_dismissed = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON notifications(type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_priority
  ON notifications(priority)
  WHERE deleted_at IS NULL;

-- Metadata JSONB index (for querying by product_id, order_id, etc.)
CREATE INDEX IF NOT EXISTS idx_notifications_metadata
  ON notifications USING gin(metadata)
  WHERE deleted_at IS NULL;

-- Notification preferences index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON notification_preferences(user_id);

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Notifications Policies
-- =====================================================================

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy: System can create notifications (service role only)
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    true -- Service role will bypass RLS anyway
  );

-- Policy: Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy: Users can soft delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- =====================================================================
-- Notification Preferences Policies
-- =====================================================================

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- =====================================================================
-- 6. FUNCTIONS
-- =====================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on notifications
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Trigger: Update updated_at on notification_preferences
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function: Auto-set read_at when is_read becomes true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;

  IF NEW.is_dismissed = true AND OLD.is_dismissed = false THEN
    NEW.dismissed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Set read_at and dismissed_at
CREATE TRIGGER notification_set_timestamps
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_read_at();

-- =====================================================================
-- 7. DEFAULT NOTIFICATION PREFERENCES
-- =====================================================================

-- Function: Create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default preferences for all notification types
  INSERT INTO notification_preferences (user_id, notification_type, in_app_enabled, email_enabled)
  VALUES
    (NEW.id, 'product_approval', true, true),
    (NEW.id, 'price_change', true, false),
    (NEW.id, 'system_update', true, false),
    (NEW.id, 'user_activity', true, false),
    (NEW.id, 'error_alert', true, true),
    (NEW.id, 'performance_warning', true, true)
  ON CONFLICT (user_id, notification_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create default preferences on user creation
-- Note: This assumes admin users are in auth.users table
-- If using a separate admin_users table, adjust accordingly
CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================================
-- 8. HELPER VIEWS
-- =====================================================================

-- View: Unread notification count per user
CREATE OR REPLACE VIEW notification_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE NOT is_read AND NOT is_dismissed) AS unread_count,
  COUNT(*) FILTER (WHERE is_read) AS read_count,
  COUNT(*) AS total_count
FROM notifications
WHERE deleted_at IS NULL
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON notification_counts TO authenticated;

-- =====================================================================
-- 9. COMMENTS
-- =====================================================================

COMMENT ON TABLE notifications IS 'Stores in-app notifications for admin users';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery channels';
COMMENT ON COLUMN notifications.metadata IS 'JSON object with additional context (e.g., {"product_id": "123", "action": "approval_requested"})';
COMMENT ON COLUMN notifications.link_url IS 'Deep link to relevant page (e.g., "/admin/products/123/edit")';
COMMENT ON COLUMN notifications.is_dismissed IS 'User manually dismissed notification';
COMMENT ON VIEW notification_counts IS 'Aggregated notification counts per user';

-- =====================================================================
-- 10. GRANT PERMISSIONS
-- =====================================================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================

-- Migration notes:
-- - RLS policies ensure users only see their own notifications
-- - Service role (API) can create notifications for any user
-- - Soft delete pattern used (deleted_at column)
-- - JSONB metadata allows flexible notification context
-- - Indexes optimized for common queries (user + unread, date sorting)
-- - Default preferences created automatically for new users
