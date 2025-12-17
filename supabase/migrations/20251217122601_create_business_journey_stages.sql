-- ============================================================================
-- Migration: Create Business Journey Stages Table
-- Description: Track B2B customer journey through the 6-step onboarding process
-- Created: 2025-12-17
-- ============================================================================

-- Create journey stage enum (6 stages)
CREATE TYPE business_journey_stage AS ENUM (
  'quote_request',          -- Step 1: Coverage check & submit business details
  'business_verification',  -- Step 2: CIPC registration & ID verification
  'site_details',           -- Step 3: Confirm property type & equipment location
  'contract',               -- Step 4: Review and digitally sign agreement
  'installation',           -- Step 5: Professional on-site installation
  'go_live'                 -- Step 6: Service activation
);

-- Create stage status enum
CREATE TYPE journey_stage_status AS ENUM (
  'pending',       -- Not yet started
  'in_progress',   -- Currently active
  'completed',     -- Successfully completed
  'blocked',       -- Blocked by an issue
  'skipped'        -- Skipped (not applicable)
);

-- ============================================================================
-- Business Journey Stages Table
-- ============================================================================
CREATE TABLE business_journey_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  business_customer_id UUID NOT NULL REFERENCES business_customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES business_quotes(id) ON DELETE SET NULL,

  -- Stage Information
  stage business_journey_stage NOT NULL,
  status journey_stage_status DEFAULT 'pending',
  step_number INTEGER NOT NULL,  -- 1-6

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,  -- SLA tracking

  -- Details
  notes TEXT,
  blocked_reason TEXT,
  completed_by UUID REFERENCES auth.users(id),  -- Who completed this stage

  -- Required documents tracking
  required_documents JSONB DEFAULT '[]',  -- Array of required doc types
  submitted_documents JSONB DEFAULT '[]', -- Array of submitted doc IDs

  -- Metadata for flexibility
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique stage per customer journey
  UNIQUE(business_customer_id, quote_id, stage)
);

-- ============================================================================
-- Business Journey Summary View
-- Aggregated view of customer journey status
-- ============================================================================
CREATE OR REPLACE VIEW business_journey_summary AS
SELECT
  bc.id AS business_customer_id,
  bc.company_name,
  bc.account_number,
  bc.account_status,
  bc.kyc_status,
  bjs.quote_id,

  -- Current stage (first non-completed stage)
  (
    SELECT stage FROM business_journey_stages
    WHERE business_customer_id = bc.id
    AND status IN ('pending', 'in_progress', 'blocked')
    ORDER BY step_number ASC
    LIMIT 1
  ) AS current_stage,

  -- Current step number
  (
    SELECT step_number FROM business_journey_stages
    WHERE business_customer_id = bc.id
    AND status IN ('pending', 'in_progress', 'blocked')
    ORDER BY step_number ASC
    LIMIT 1
  ) AS current_step,

  -- Completed stages count
  (
    SELECT COUNT(*) FROM business_journey_stages
    WHERE business_customer_id = bc.id
    AND status = 'completed'
  ) AS completed_stages,

  -- Total stages
  6 AS total_stages,

  -- Progress percentage
  ROUND(
    (SELECT COUNT(*) FROM business_journey_stages
     WHERE business_customer_id = bc.id AND status = 'completed')::DECIMAL / 6 * 100
  ) AS progress_percentage,

  -- Is blocked?
  EXISTS (
    SELECT 1 FROM business_journey_stages
    WHERE business_customer_id = bc.id AND status = 'blocked'
  ) AS is_blocked,

  -- Blocked stage (if any)
  (
    SELECT stage FROM business_journey_stages
    WHERE business_customer_id = bc.id AND status = 'blocked'
    LIMIT 1
  ) AS blocked_stage,

  -- Journey started
  (
    SELECT MIN(started_at) FROM business_journey_stages
    WHERE business_customer_id = bc.id
  ) AS journey_started_at,

  -- Journey completed
  CASE
    WHEN (SELECT COUNT(*) FROM business_journey_stages
          WHERE business_customer_id = bc.id AND status = 'completed') = 6
    THEN (SELECT MAX(completed_at) FROM business_journey_stages
          WHERE business_customer_id = bc.id)
    ELSE NULL
  END AS journey_completed_at,

  bc.created_at,
  bc.updated_at

FROM business_customers bc
LEFT JOIN business_journey_stages bjs ON bc.id = bjs.business_customer_id
GROUP BY bc.id, bc.company_name, bc.account_number, bc.account_status,
         bc.kyc_status, bjs.quote_id, bc.created_at, bc.updated_at;

-- ============================================================================
-- Function to initialize journey stages for a new business customer
-- ============================================================================
CREATE OR REPLACE FUNCTION initialize_business_journey(
  p_business_customer_id UUID,
  p_quote_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  stages TEXT[] := ARRAY['quote_request', 'business_verification', 'site_details', 'contract', 'installation', 'go_live'];
  stage_docs JSONB[] := ARRAY[
    '[]'::JSONB,                                                    -- quote_request
    '["cipc_registration", "director_id", "proof_of_address"]'::JSONB, -- business_verification
    '["site_photos", "building_access_info"]'::JSONB,               -- site_details
    '[]'::JSONB,                                                    -- contract
    '[]'::JSONB,                                                    -- installation
    '[]'::JSONB                                                     -- go_live
  ];
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    INSERT INTO business_journey_stages (
      business_customer_id,
      quote_id,
      stage,
      step_number,
      status,
      required_documents
    ) VALUES (
      p_business_customer_id,
      p_quote_id,
      stages[i]::business_journey_stage,
      i,
      CASE WHEN i = 1 THEN 'in_progress' ELSE 'pending' END,
      stage_docs[i]
    )
    ON CONFLICT (business_customer_id, quote_id, stage) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function to advance journey to next stage
-- ============================================================================
CREATE OR REPLACE FUNCTION advance_business_journey(
  p_business_customer_id UUID,
  p_current_stage business_journey_stage,
  p_completed_by UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  next_stage business_journey_stage,
  message TEXT
) AS $$
DECLARE
  v_current_step INTEGER;
  v_next_step INTEGER;
  v_next_stage business_journey_stage;
BEGIN
  -- Get current step number
  SELECT step_number INTO v_current_step
  FROM business_journey_stages
  WHERE business_customer_id = p_business_customer_id
  AND stage = p_current_stage;

  IF v_current_step IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::business_journey_stage, 'Stage not found';
    RETURN;
  END IF;

  -- Mark current stage as completed
  UPDATE business_journey_stages
  SET
    status = 'completed',
    completed_at = NOW(),
    completed_by = p_completed_by,
    updated_at = NOW()
  WHERE business_customer_id = p_business_customer_id
  AND stage = p_current_stage;

  -- Calculate next step
  v_next_step := v_current_step + 1;

  IF v_next_step > 6 THEN
    -- Journey complete!
    RETURN QUERY SELECT TRUE, NULL::business_journey_stage, 'Journey completed';
    RETURN;
  END IF;

  -- Get next stage enum value
  SELECT stage INTO v_next_stage
  FROM business_journey_stages
  WHERE business_customer_id = p_business_customer_id
  AND step_number = v_next_step;

  -- Activate next stage
  UPDATE business_journey_stages
  SET
    status = 'in_progress',
    started_at = NOW(),
    updated_at = NOW()
  WHERE business_customer_id = p_business_customer_id
  AND step_number = v_next_step;

  RETURN QUERY SELECT TRUE, v_next_stage, 'Advanced to next stage';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update timestamp trigger
-- ============================================================================
CREATE TRIGGER trigger_update_journey_stages_updated_at
  BEFORE UPDATE ON business_journey_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX idx_journey_stages_customer ON business_journey_stages(business_customer_id);
CREATE INDEX idx_journey_stages_quote ON business_journey_stages(quote_id);
CREATE INDEX idx_journey_stages_status ON business_journey_stages(status);
CREATE INDEX idx_journey_stages_stage ON business_journey_stages(stage);
CREATE INDEX idx_journey_stages_step ON business_journey_stages(step_number);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE business_journey_stages ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything (using correct column names: id and is_active)
CREATE POLICY "Admin full access to journey_stages"
  ON business_journey_stages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Business customers can view their own journey
CREATE POLICY "Business customers can view own journey"
  ON business_journey_stages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_customers
      WHERE business_customers.id = business_journey_stages.business_customer_id
      AND business_customers.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE business_journey_stages IS 'Tracks B2B customer progress through 6-step onboarding journey';
COMMENT ON COLUMN business_journey_stages.stage IS 'Current stage in the journey (1-6)';
COMMENT ON COLUMN business_journey_stages.required_documents IS 'JSON array of document types required for this stage';
COMMENT ON FUNCTION initialize_business_journey IS 'Creates all 6 journey stages for a new business customer';
COMMENT ON FUNCTION advance_business_journey IS 'Marks current stage complete and activates next stage';
