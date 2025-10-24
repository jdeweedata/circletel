-- Create table for capturing leads in areas without coverage
-- This helps CircleTel identify expansion opportunities

CREATE TABLE IF NOT EXISTS no_coverage_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Location Information
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Service Interest
  service_type TEXT, -- 'fibre', 'lte', '5g', 'wireless', 'any'
  expected_usage TEXT, -- 'light', 'moderate', 'heavy'
  budget_range TEXT, -- 'under_500', '500_1000', '1000_2000', 'over_2000'

  -- Urgency & Notes
  urgency TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  notes TEXT,

  -- Marketing Consent
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- Metadata
  source TEXT DEFAULT 'coverage_check', -- Track where lead came from
  user_agent TEXT,
  ip_address INET,

  -- Status Tracking
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'declined'
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_no_coverage_leads_email ON no_coverage_leads(email);
CREATE INDEX IF NOT EXISTS idx_no_coverage_leads_status ON no_coverage_leads(status);
CREATE INDEX IF NOT EXISTS idx_no_coverage_leads_created_at ON no_coverage_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_no_coverage_leads_location ON no_coverage_leads USING GIST(ll_to_earth(latitude::float8, longitude::float8));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_no_coverage_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_no_coverage_leads_updated_at_trigger
  BEFORE UPDATE ON no_coverage_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_no_coverage_leads_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE no_coverage_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (lead form submission)
CREATE POLICY "Allow anonymous lead submission"
  ON no_coverage_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access"
  ON no_coverage_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can view and update leads
CREATE POLICY "Admins can view and update leads"
  ON no_coverage_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE no_coverage_leads IS 'Captures leads from users checking coverage in areas where CircleTel does not yet have service. Used for market expansion planning.';
