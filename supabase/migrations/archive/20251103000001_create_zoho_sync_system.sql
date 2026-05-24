-- Migration: Create ZOHO Sync System
-- Creates tables for ZOHO CRM integration, token management, and sync logging
-- Date: 2025-11-03
-- Related: Task Group 8 - ZOHO CRM Sync with KYC Fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: zoho_tokens
-- Stores ZOHO OAuth tokens (single row table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zoho_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one row allowed (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_zoho_tokens_singleton ON zoho_tokens ((1));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_zoho_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_zoho_tokens_updated_at
  BEFORE UPDATE ON zoho_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_zoho_tokens_updated_at();

-- RLS Policies: Admin only access
ALTER TABLE zoho_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view ZOHO tokens"
  ON zoho_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can insert ZOHO tokens"
  ON zoho_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can update ZOHO tokens"
  ON zoho_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- TABLE 2: zoho_sync_logs
-- Audit trail for all sync operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS zoho_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('quote', 'contract', 'invoice', 'customer')),
  entity_id UUID NOT NULL,
  zoho_entity_type TEXT CHECK (zoho_entity_type IN ('Estimates', 'Deals', 'Invoices', 'Contacts')),
  zoho_entity_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')) DEFAULT 'pending',
  attempt_number INTEGER DEFAULT 1 CHECK (attempt_number >= 1 AND attempt_number <= 3),
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_zoho_sync_entity ON zoho_sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_status ON zoho_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_created_at ON zoho_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_zoho_entity ON zoho_sync_logs(zoho_entity_type, zoho_entity_id);

-- RLS Policies: Admin only access
ALTER TABLE zoho_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view ZOHO sync logs"
  ON zoho_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service can insert ZOHO sync logs"
  ON zoho_sync_logs FOR INSERT
  WITH CHECK (true); -- Allow service role to insert logs

CREATE POLICY "Admin users can update ZOHO sync logs"
  ON zoho_sync_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- TABLE 3: zoho_entity_mappings
-- Bidirectional mapping between CircleTel and ZOHO entities
-- ============================================================================
CREATE TABLE IF NOT EXISTS zoho_entity_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circletel_type TEXT NOT NULL CHECK (circletel_type IN ('quote', 'contract', 'invoice', 'customer')),
  circletel_id UUID NOT NULL,
  zoho_type TEXT NOT NULL CHECK (zoho_type IN ('Estimates', 'Deals', 'Invoices', 'Contacts')),
  zoho_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique mappings
  CONSTRAINT unique_circletel_entity UNIQUE(circletel_type, circletel_id),
  CONSTRAINT unique_zoho_entity UNIQUE(zoho_type, zoho_id)
);

-- Indexes for bidirectional lookups
CREATE INDEX IF NOT EXISTS idx_zoho_mapping_circletel ON zoho_entity_mappings(circletel_type, circletel_id);
CREATE INDEX IF NOT EXISTS idx_zoho_mapping_zoho ON zoho_entity_mappings(zoho_type, zoho_id);
CREATE INDEX IF NOT EXISTS idx_zoho_mapping_last_synced ON zoho_entity_mappings(last_synced_at DESC);

-- Trigger to update last_synced_at
CREATE OR REPLACE FUNCTION update_zoho_mapping_last_synced()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_synced_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_zoho_mapping_last_synced
  BEFORE UPDATE ON zoho_entity_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_zoho_mapping_last_synced();

-- RLS Policies: Admin only access
ALTER TABLE zoho_entity_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view ZOHO mappings"
  ON zoho_entity_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service can insert ZOHO mappings"
  ON zoho_entity_mappings FOR INSERT
  WITH CHECK (true); -- Allow service role to create mappings

CREATE POLICY "Service can update ZOHO mappings"
  ON zoho_entity_mappings FOR UPDATE
  USING (true); -- Allow service role to update mappings

CREATE POLICY "Admin users can delete ZOHO mappings"
  ON zoho_entity_mappings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get ZOHO ID from CircleTel ID
CREATE OR REPLACE FUNCTION get_zoho_id(
  p_circletel_type TEXT,
  p_circletel_id UUID
)
RETURNS TEXT AS $$
  SELECT zoho_id
  FROM zoho_entity_mappings
  WHERE circletel_type = p_circletel_type
    AND circletel_id = p_circletel_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to get CircleTel ID from ZOHO ID
CREATE OR REPLACE FUNCTION get_circletel_id(
  p_zoho_type TEXT,
  p_zoho_id TEXT
)
RETURNS UUID AS $$
  SELECT circletel_id
  FROM zoho_entity_mappings
  WHERE zoho_type = p_zoho_type
    AND zoho_id = p_zoho_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to check if entity is synced
CREATE OR REPLACE FUNCTION is_entity_synced(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM zoho_entity_mappings
    WHERE circletel_type = p_entity_type
      AND circletel_id = p_entity_id
  );
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE zoho_tokens IS 'Stores ZOHO OAuth access and refresh tokens (singleton table)';
COMMENT ON TABLE zoho_sync_logs IS 'Audit trail for all ZOHO CRM sync operations';
COMMENT ON TABLE zoho_entity_mappings IS 'Bidirectional mapping between CircleTel and ZOHO entities';

COMMENT ON COLUMN zoho_sync_logs.attempt_number IS 'Retry attempt number (1-3)';
COMMENT ON COLUMN zoho_sync_logs.request_payload IS 'JSON payload sent to ZOHO API';
COMMENT ON COLUMN zoho_sync_logs.response_payload IS 'JSON response from ZOHO API';

COMMENT ON FUNCTION get_zoho_id IS 'Get ZOHO entity ID from CircleTel entity';
COMMENT ON FUNCTION get_circletel_id IS 'Get CircleTel entity ID from ZOHO entity';
COMMENT ON FUNCTION is_entity_synced IS 'Check if CircleTel entity has been synced to ZOHO';
