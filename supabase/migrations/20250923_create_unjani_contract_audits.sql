-- Create table for Unjani contract audit form submissions
CREATE TABLE unjani_contract_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Clinic Information
  clinic_name VARCHAR NOT NULL,
  province VARCHAR NOT NULL,
  clinic_code VARCHAR,
  audit_date DATE NOT NULL,

  -- Current Service Provider Information
  current_provider VARCHAR NOT NULL,
  connection_type VARCHAR NOT NULL,
  current_speed INTEGER,
  monthly_fee NUMERIC NOT NULL,

  -- Contract Details
  contract_type VARCHAR NOT NULL CHECK (contract_type IN ('month-to-month', '12-months', '24-months', 'other')),
  contract_status VARCHAR NOT NULL,
  contract_start DATE NOT NULL,
  contract_end DATE,

  -- Migration Planning
  migration_priority VARCHAR CHECK (migration_priority IN ('high', 'medium', 'low')),
  priority_reason TEXT,
  preferred_migration_date DATE,
  additional_notes TEXT,

  -- Contact Information
  contact_name VARCHAR NOT NULL,
  contact_position VARCHAR NOT NULL,
  contact_phone VARCHAR NOT NULL,
  contact_email VARCHAR NOT NULL,
  alternative_contact VARCHAR,
  alternative_phone VARCHAR,
  best_contact_time VARCHAR,
  site_access_notes TEXT,

  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_unjani_audits_clinic_name ON unjani_contract_audits(clinic_name);
CREATE INDEX idx_unjani_audits_province ON unjani_contract_audits(province);
CREATE INDEX idx_unjani_audits_priority ON unjani_contract_audits(migration_priority);
CREATE INDEX idx_unjani_audits_submitted_at ON unjani_contract_audits(submitted_at);

-- Add RLS (Row Level Security) policy
ALTER TABLE unjani_contract_audits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on unjani_contract_audits" ON unjani_contract_audits
  FOR ALL USING (true) WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE unjani_contract_audits IS 'Stores contract audit form submissions for Unjani clinic network migration planning';