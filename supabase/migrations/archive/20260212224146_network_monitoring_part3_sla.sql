-- Part 3: SLA Tables (Run Third)

-- SLA Definitions
CREATE TABLE IF NOT EXISTS sla_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  uptime_target DECIMAL(5,2) NOT NULL,
  measurement_period TEXT DEFAULT 'monthly',
  credit_rate_per_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  max_credit_percent DECIMAL(5,2) DEFAULT 100.00,
  exclusions TEXT[],
  applies_to_package_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default SLA tiers
INSERT INTO sla_definitions (name, description, uptime_target, credit_rate_per_percent, applies_to_package_types) VALUES
  ('Standard', 'Residential service level', 99.00, 5.00, ARRAY['fibre', 'lte']),
  ('Business', 'Business service level with faster response', 99.50, 10.00, ARRAY['business']),
  ('Enterprise', 'Enterprise SLA with priority support', 99.90, 15.00, ARRAY['enterprise'])
ON CONFLICT (name) DO NOTHING;

-- SLA Violations
CREATE TABLE IF NOT EXISTS sla_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_service_id UUID REFERENCES customer_services(id) ON DELETE SET NULL,
  sla_id UUID NOT NULL REFERENCES sla_definitions(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  uptime_target DECIMAL(5,2) NOT NULL,
  uptime_achieved DECIMAL(5,2) NOT NULL,
  downtime_minutes INTEGER NOT NULL,
  downtime_incidents INTEGER DEFAULT 0,
  credit_amount DECIMAL(10,2),
  credit_percent DECIMAL(5,2),
  credit_note_id UUID,
  credit_applied BOOLEAN DEFAULT FALSE,
  credit_applied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_customer_sla_period UNIQUE (customer_id, sla_id, period_start, period_end)
);
