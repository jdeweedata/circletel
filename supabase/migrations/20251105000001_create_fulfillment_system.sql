-- =============================================================================
-- Migration: Create Fulfillment System
-- Created: 2025-11-05
-- Description: Installation schedules, site surveys, technician assignments,
--              service completion records, and SLA tracking tables with RLS
-- Task Group: 11 - Database Layer - Fulfillment System
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: installation_schedules
-- =============================================================================
CREATE TABLE IF NOT EXISTS installation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE,

  -- Scheduling
  technician_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT CHECK (time_slot IN ('morning', 'afternoon', 'full_day')),

  -- Completion
  completed_date TIMESTAMPTZ,
  completion_notes TEXT,
  installation_photos JSONB, -- Array of photo URLs
  customer_signature TEXT, -- Base64 signature

  -- Equipment
  equipment_serials JSONB, -- { "router": "SN123", "ont": "ONT456" }
  speed_test_results JSONB, -- { "download": 98.5, "upload": 95.2, "latency": 12 }

  -- Status
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: site_surveys
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Survey Details
  survey_date DATE NOT NULL,
  survey_notes TEXT,
  photos JSONB, -- Array of photo URLs

  -- Technical Feasibility
  feasibility_status TEXT CHECK (feasibility_status IN ('feasible', 'not_feasible', 'requires_work')) DEFAULT 'feasible',
  required_work TEXT, -- Description of work needed
  estimated_cost DECIMAL(10,2), -- Cost for additional work

  -- Measurements
  cable_run_distance INTEGER, -- meters
  equipment_location_notes TEXT,

  -- Status
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: technician_assignments
-- =============================================================================
CREATE TABLE IF NOT EXISTS technician_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES admin_users(id) ON DELETE CASCADE NOT NULL,
  installation_schedule_id UUID REFERENCES installation_schedules(id) ON DELETE CASCADE,
  site_survey_id UUID REFERENCES site_surveys(id) ON DELETE CASCADE,

  -- Assignment Details
  assignment_type TEXT CHECK (assignment_type IN ('survey', 'installation', 'maintenance')) NOT NULL,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  accepted_date TIMESTAMPTZ,

  -- Status
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Must reference EITHER installation OR survey (exclusive OR)
  CONSTRAINT check_assignment_ref CHECK (
    (installation_schedule_id IS NOT NULL AND site_survey_id IS NULL) OR
    (installation_schedule_id IS NULL AND site_survey_id IS NOT NULL)
  )
);

-- =============================================================================
-- TABLE: service_completion_records
-- =============================================================================
CREATE TABLE IF NOT EXISTS service_completion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_schedule_id UUID REFERENCES installation_schedules(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE,

  -- Completion Details
  completed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL, -- Technician
  completed_at TIMESTAMPTZ NOT NULL,

  -- Quality Checks
  speed_test_passed BOOLEAN DEFAULT FALSE,
  equipment_registered BOOLEAN DEFAULT FALSE,
  customer_training_completed BOOLEAN DEFAULT FALSE,

  -- Customer Feedback
  customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating BETWEEN 1 AND 5),
  customer_comments TEXT,

  -- Documentation
  completion_photos JSONB, -- Array of photo URLs
  handover_document_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: sla_tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE NOT NULL,

  -- SLA Milestones
  order_placed_at TIMESTAMPTZ NOT NULL,
  payment_confirmed_at TIMESTAMPTZ,
  installation_scheduled_at TIMESTAMPTZ,
  installation_completed_at TIMESTAMPTZ,
  service_activated_at TIMESTAMPTZ,

  -- SLA Targets (in hours)
  target_installation_schedule INTEGER DEFAULT 48, -- 48 hours to schedule
  target_installation_complete INTEGER DEFAULT 168, -- 7 days to complete
  target_service_activation INTEGER DEFAULT 192, -- 8 days total

  -- SLA Status (calculated by trigger)
  installation_schedule_sla_met BOOLEAN,
  installation_complete_sla_met BOOLEAN,
  service_activation_sla_met BOOLEAN,
  overall_sla_status TEXT CHECK (overall_sla_status IN ('met', 'at_risk', 'breached', 'pending')) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- installation_schedules indexes
CREATE INDEX IF NOT EXISTS idx_installation_schedules_order ON installation_schedules(order_id);
CREATE INDEX IF NOT EXISTS idx_installation_schedules_technician ON installation_schedules(technician_id);
CREATE INDEX IF NOT EXISTS idx_installation_schedules_status ON installation_schedules(status);
CREATE INDEX IF NOT EXISTS idx_installation_schedules_date ON installation_schedules(scheduled_date);

-- site_surveys indexes
CREATE INDEX IF NOT EXISTS idx_site_surveys_order ON site_surveys(order_id);
CREATE INDEX IF NOT EXISTS idx_site_surveys_technician ON site_surveys(technician_id);
CREATE INDEX IF NOT EXISTS idx_site_surveys_status ON site_surveys(status);

-- technician_assignments indexes
CREATE INDEX IF NOT EXISTS idx_technician_assignments_technician ON technician_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_status ON technician_assignments(status);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_installation ON technician_assignments(installation_schedule_id);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_survey ON technician_assignments(site_survey_id);

-- service_completion_records indexes
CREATE INDEX IF NOT EXISTS idx_service_completion_order ON service_completion_records(order_id);
CREATE INDEX IF NOT EXISTS idx_service_completion_technician ON service_completion_records(completed_by);
CREATE INDEX IF NOT EXISTS idx_service_completion_installation ON service_completion_records(installation_schedule_id);

-- sla_tracking indexes
CREATE INDEX IF NOT EXISTS idx_sla_tracking_order ON sla_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_status ON sla_tracking(overall_sla_status);

-- =============================================================================
-- TRIGGER: update_sla_status()
-- =============================================================================
CREATE OR REPLACE FUNCTION update_sla_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if installation scheduling SLA met
  IF NEW.installation_scheduled_at IS NOT NULL THEN
    NEW.installation_schedule_sla_met :=
      EXTRACT(EPOCH FROM (NEW.installation_scheduled_at - NEW.order_placed_at)) / 3600 <= NEW.target_installation_schedule;
  END IF;

  -- Check if installation completion SLA met
  IF NEW.installation_completed_at IS NOT NULL THEN
    NEW.installation_complete_sla_met :=
      EXTRACT(EPOCH FROM (NEW.installation_completed_at - NEW.order_placed_at)) / 3600 <= NEW.target_installation_complete;
  END IF;

  -- Check if service activation SLA met
  IF NEW.service_activated_at IS NOT NULL THEN
    NEW.service_activation_sla_met :=
      EXTRACT(EPOCH FROM (NEW.service_activated_at - NEW.order_placed_at)) / 3600 <= NEW.target_service_activation;
  END IF;

  -- Set overall SLA status
  IF NEW.service_activated_at IS NOT NULL THEN
    -- Service is activated, check if all SLAs met
    IF NEW.installation_schedule_sla_met AND NEW.installation_complete_sla_met AND NEW.service_activation_sla_met THEN
      NEW.overall_sla_status := 'met';
    ELSE
      NEW.overall_sla_status := 'breached';
    END IF;
  ELSIF NEW.installation_completed_at IS NOT NULL THEN
    -- Installation completed but not activated yet
    IF NEW.installation_complete_sla_met THEN
      NEW.overall_sla_status := 'pending';
    ELSE
      NEW.overall_sla_status := 'at_risk';
    END IF;
  ELSIF NEW.installation_scheduled_at IS NOT NULL THEN
    -- Installation scheduled
    IF NEW.installation_schedule_sla_met THEN
      NEW.overall_sla_status := 'pending';
    ELSE
      NEW.overall_sla_status := 'at_risk';
    END IF;
  ELSE
    -- Not yet scheduled
    NEW.overall_sla_status := 'pending';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to sla_tracking table
DROP TRIGGER IF EXISTS before_update_sla_tracking ON sla_tracking;
CREATE TRIGGER before_update_sla_tracking
  BEFORE INSERT OR UPDATE ON sla_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_status();

-- =============================================================================
-- TRIGGER: update_updated_at_column()
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_installation_schedules_updated_at ON installation_schedules;
CREATE TRIGGER update_installation_schedules_updated_at
  BEFORE UPDATE ON installation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_surveys_updated_at ON site_surveys;
CREATE TRIGGER update_site_surveys_updated_at
  BEFORE UPDATE ON site_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_technician_assignments_updated_at ON technician_assignments;
CREATE TRIGGER update_technician_assignments_updated_at
  BEFORE UPDATE ON technician_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_completion_records_updated_at ON service_completion_records;
CREATE TRIGGER update_service_completion_records_updated_at
  BEFORE UPDATE ON service_completion_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE installation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_completion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES: installation_schedules
-- =============================================================================

-- Operations managers SELECT all installations
CREATE POLICY "operations_managers_select_all_installations" ON installation_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- Technicians SELECT own assignments
CREATE POLICY "technicians_select_own_installations" ON installation_schedules
FOR SELECT USING (technician_id = auth.uid());

-- Technicians UPDATE own assignments
CREATE POLICY "technicians_update_own_installations" ON installation_schedules
FOR UPDATE USING (technician_id = auth.uid());

-- Customers SELECT own order installations
CREATE POLICY "customers_select_own_installations" ON installation_schedules
FOR SELECT USING (
  order_id IN (
    SELECT id FROM consumer_orders WHERE email = auth.email()
  )
);

-- Service role for system operations
CREATE POLICY "service_role_all_installations" ON installation_schedules
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Operations managers INSERT installations
CREATE POLICY "operations_managers_insert_installations" ON installation_schedules
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- =============================================================================
-- RLS POLICIES: site_surveys
-- =============================================================================

-- Operations managers SELECT all surveys
CREATE POLICY "operations_managers_select_all_surveys" ON site_surveys
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- Technicians SELECT own surveys
CREATE POLICY "technicians_select_own_surveys" ON site_surveys
FOR SELECT USING (technician_id = auth.uid());

-- Technicians UPDATE own surveys
CREATE POLICY "technicians_update_own_surveys" ON site_surveys
FOR UPDATE USING (technician_id = auth.uid());

-- Customers SELECT own order surveys
CREATE POLICY "customers_select_own_surveys" ON site_surveys
FOR SELECT USING (
  order_id IN (
    SELECT id FROM consumer_orders WHERE email = auth.email()
  )
);

-- Service role for system operations
CREATE POLICY "service_role_all_surveys" ON site_surveys
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Operations managers INSERT surveys
CREATE POLICY "operations_managers_insert_surveys" ON site_surveys
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- =============================================================================
-- RLS POLICIES: technician_assignments
-- =============================================================================

-- Operations managers SELECT all assignments
CREATE POLICY "operations_managers_select_all_assignments" ON technician_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- Technicians SELECT own assignments
CREATE POLICY "technicians_select_own_assignments" ON technician_assignments
FOR SELECT USING (technician_id = auth.uid());

-- Technicians UPDATE own assignments (accept/decline)
CREATE POLICY "technicians_update_own_assignments" ON technician_assignments
FOR UPDATE USING (technician_id = auth.uid());

-- Service role for system operations
CREATE POLICY "service_role_all_assignments" ON technician_assignments
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Operations managers INSERT assignments
CREATE POLICY "operations_managers_insert_assignments" ON technician_assignments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- =============================================================================
-- RLS POLICIES: service_completion_records
-- =============================================================================

-- Operations managers SELECT all completion records
CREATE POLICY "operations_managers_select_all_completions" ON service_completion_records
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- Technicians SELECT own completion records
CREATE POLICY "technicians_select_own_completions" ON service_completion_records
FOR SELECT USING (completed_by = auth.uid());

-- Customers SELECT own order completion records
CREATE POLICY "customers_select_own_completions" ON service_completion_records
FOR SELECT USING (
  order_id IN (
    SELECT id FROM consumer_orders WHERE email = auth.email()
  )
);

-- Service role for system operations
CREATE POLICY "service_role_all_completions" ON service_completion_records
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Technicians INSERT completion records
CREATE POLICY "technicians_insert_completions" ON service_completion_records
FOR INSERT WITH CHECK (completed_by = auth.uid());

-- =============================================================================
-- RLS POLICIES: sla_tracking
-- =============================================================================

-- Operations managers SELECT all SLA records
CREATE POLICY "operations_managers_select_all_sla" ON sla_tracking
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator', 'executive_manager')
  )
);

-- Customers SELECT own order SLA tracking
CREATE POLICY "customers_select_own_sla" ON sla_tracking
FOR SELECT USING (
  order_id IN (
    SELECT id FROM consumer_orders WHERE email = auth.email()
  )
);

-- Service role for system operations
CREATE POLICY "service_role_all_sla" ON sla_tracking
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Operations managers INSERT SLA tracking
CREATE POLICY "operations_managers_insert_sla" ON sla_tracking
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- Operations managers UPDATE SLA tracking
CREATE POLICY "operations_managers_update_sla" ON sla_tracking
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('operations_manager', 'admin', 'super_admin', 'fulfillment_coordinator')
  )
);

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE installation_schedules IS 'Installation scheduling and completion tracking for customer orders';
COMMENT ON TABLE site_surveys IS 'Pre-installation site surveys for technical feasibility assessment';
COMMENT ON TABLE technician_assignments IS 'Assignment of technicians to installations or surveys';
COMMENT ON TABLE service_completion_records IS 'Quality checks and customer feedback after service completion';
COMMENT ON TABLE sla_tracking IS 'Service Level Agreement tracking for order fulfillment milestones';

COMMENT ON COLUMN installation_schedules.time_slot IS 'Time of day: morning (8am-12pm), afternoon (12pm-5pm), full_day (8am-5pm)';
COMMENT ON COLUMN installation_schedules.equipment_serials IS 'JSONB: {"router": "SN123", "ont": "ONT456"}';
COMMENT ON COLUMN installation_schedules.speed_test_results IS 'JSONB: {"download": 98.5, "upload": 95.2, "latency": 12}';

COMMENT ON COLUMN site_surveys.feasibility_status IS 'Technical feasibility: feasible, not_feasible, requires_work';
COMMENT ON COLUMN site_surveys.cable_run_distance IS 'Distance in meters from network point to equipment location';

COMMENT ON COLUMN technician_assignments.assignment_type IS 'Type: survey (pre-install), installation, maintenance';
COMMENT ON CONSTRAINT check_assignment_ref ON technician_assignments IS 'Must reference EITHER installation_schedule_id OR site_survey_id (exclusive OR)';

COMMENT ON COLUMN service_completion_records.customer_satisfaction_rating IS '1-5 rating: 1=Very Dissatisfied, 5=Very Satisfied';

COMMENT ON COLUMN sla_tracking.target_installation_schedule IS 'Hours from order to installation scheduled (default: 48)';
COMMENT ON COLUMN sla_tracking.target_installation_complete IS 'Hours from order to installation completed (default: 168 = 7 days)';
COMMENT ON COLUMN sla_tracking.target_service_activation IS 'Hours from order to service activated (default: 192 = 8 days)';
COMMENT ON COLUMN sla_tracking.overall_sla_status IS 'Calculated by trigger: met, at_risk, breached, pending';

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (Commented)
-- =============================================================================
-- To rollback this migration, run these commands:

/*
-- Drop triggers
DROP TRIGGER IF EXISTS before_update_sla_tracking ON sla_tracking;
DROP TRIGGER IF EXISTS update_installation_schedules_updated_at ON installation_schedules;
DROP TRIGGER IF EXISTS update_site_surveys_updated_at ON site_surveys;
DROP TRIGGER IF EXISTS update_technician_assignments_updated_at ON technician_assignments;
DROP TRIGGER IF EXISTS update_service_completion_records_updated_at ON service_completion_records;

-- Drop functions
DROP FUNCTION IF EXISTS update_sla_status();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop policies (RLS)
DROP POLICY IF EXISTS "operations_managers_select_all_installations" ON installation_schedules;
DROP POLICY IF EXISTS "technicians_select_own_installations" ON installation_schedules;
DROP POLICY IF EXISTS "technicians_update_own_installations" ON installation_schedules;
DROP POLICY IF EXISTS "customers_select_own_installations" ON installation_schedules;
DROP POLICY IF EXISTS "service_role_all_installations" ON installation_schedules;
DROP POLICY IF EXISTS "operations_managers_insert_installations" ON installation_schedules;

DROP POLICY IF EXISTS "operations_managers_select_all_surveys" ON site_surveys;
DROP POLICY IF EXISTS "technicians_select_own_surveys" ON site_surveys;
DROP POLICY IF EXISTS "technicians_update_own_surveys" ON site_surveys;
DROP POLICY IF EXISTS "customers_select_own_surveys" ON site_surveys;
DROP POLICY IF EXISTS "service_role_all_surveys" ON site_surveys;
DROP POLICY IF EXISTS "operations_managers_insert_surveys" ON site_surveys;

DROP POLICY IF EXISTS "operations_managers_select_all_assignments" ON technician_assignments;
DROP POLICY IF EXISTS "technicians_select_own_assignments" ON technician_assignments;
DROP POLICY IF EXISTS "technicians_update_own_assignments" ON technician_assignments;
DROP POLICY IF EXISTS "service_role_all_assignments" ON technician_assignments;
DROP POLICY IF EXISTS "operations_managers_insert_assignments" ON technician_assignments;

DROP POLICY IF EXISTS "operations_managers_select_all_completions" ON service_completion_records;
DROP POLICY IF EXISTS "technicians_select_own_completions" ON service_completion_records;
DROP POLICY IF EXISTS "customers_select_own_completions" ON service_completion_records;
DROP POLICY IF EXISTS "service_role_all_completions" ON service_completion_records;
DROP POLICY IF EXISTS "technicians_insert_completions" ON service_completion_records;

DROP POLICY IF EXISTS "operations_managers_select_all_sla" ON sla_tracking;
DROP POLICY IF EXISTS "customers_select_own_sla" ON sla_tracking;
DROP POLICY IF EXISTS "service_role_all_sla" ON sla_tracking;
DROP POLICY IF EXISTS "operations_managers_insert_sla" ON sla_tracking;
DROP POLICY IF EXISTS "operations_managers_update_sla" ON sla_tracking;

-- Drop indexes
DROP INDEX IF EXISTS idx_installation_schedules_order;
DROP INDEX IF EXISTS idx_installation_schedules_technician;
DROP INDEX IF EXISTS idx_installation_schedules_status;
DROP INDEX IF EXISTS idx_installation_schedules_date;

DROP INDEX IF EXISTS idx_site_surveys_order;
DROP INDEX IF EXISTS idx_site_surveys_technician;
DROP INDEX IF EXISTS idx_site_surveys_status;

DROP INDEX IF EXISTS idx_technician_assignments_technician;
DROP INDEX IF EXISTS idx_technician_assignments_status;
DROP INDEX IF EXISTS idx_technician_assignments_installation;
DROP INDEX IF EXISTS idx_technician_assignments_survey;

DROP INDEX IF EXISTS idx_service_completion_order;
DROP INDEX IF EXISTS idx_service_completion_technician;
DROP INDEX IF EXISTS idx_service_completion_installation;

DROP INDEX IF EXISTS idx_sla_tracking_order;
DROP INDEX IF EXISTS idx_sla_tracking_status;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS sla_tracking CASCADE;
DROP TABLE IF EXISTS service_completion_records CASCADE;
DROP TABLE IF EXISTS technician_assignments CASCADE;
DROP TABLE IF EXISTS site_surveys CASCADE;
DROP TABLE IF EXISTS installation_schedules CASCADE;
*/
