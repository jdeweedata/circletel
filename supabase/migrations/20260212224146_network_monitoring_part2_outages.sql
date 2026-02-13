-- Part 2: Outage Incidents (Run Second)

-- Outage Incidents
CREATE TABLE IF NOT EXISTS outage_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')) DEFAULT 'investigating',
  affected_providers TEXT[] DEFAULT '{}',
  affected_regions TEXT[] DEFAULT '{}',
  affected_customer_count INTEGER DEFAULT 0,
  root_cause TEXT,
  resolution_notes TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  identified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outage Updates (Timeline)
CREATE TABLE IF NOT EXISTS outage_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES outage_incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  message TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
