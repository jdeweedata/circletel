-- =====================================================================
-- Fix Notifications Table Schema Conflict
-- =====================================================================
-- Description: Resolves schema mismatch between old and new notifications tables
-- Issue: Two migrations created different notification schemas
-- Solution: Drop old table and recreate with proper schema
-- =====================================================================

-- Drop old table (safe because it's not in production use yet)
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop old enum types if they exist
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;

-- Recreate enum types
CREATE TYPE notification_type AS ENUM (
  'product_approval',
  'price_change',
  'system_update',
  'user_activity',
  'error_alert',
  'performance_warning'
);

CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Recreate notifications table with correct schema
CREATE TABLE notifications (
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

-- Recreate indexes
CREATE INDEX idx_notifications_user_id
  ON notifications(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_created_at
  ON notifications(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read)
  WHERE deleted_at IS NULL AND is_dismissed = false;

CREATE INDEX idx_notifications_type
  ON notifications(type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_priority
  ON notifications(priority)
  WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
  ON notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;

-- Comment on table
COMMENT ON TABLE notifications IS 'User notifications with soft delete support';
