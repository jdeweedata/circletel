/**
 * Sales Agents System - Database Schema
 *
 * Creates tables for:
 * - Sales agents (internal/external/partner agents)
 * - Agent quote links (shareable links for quote requests)
 * - Quote acceptance links (for client acceptance)
 * - Updates to business_quotes table
 */

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE agent_type AS ENUM ('internal', 'external', 'partner');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'suspended');

-- =====================================================
-- SALES AGENTS TABLE
-- =====================================================

CREATE TABLE sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- NULL for agents who only use shareable links

  -- Profile
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT, -- For external/partner agents
  agent_type agent_type NOT NULL DEFAULT 'external',

  -- Commission & Performance
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (e.g., 5.00 = 5%)
  total_quotes_created INTEGER DEFAULT 0,
  total_quotes_accepted INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(12,2) DEFAULT 0.00,

  -- Shareable Link
  unique_link_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Status
  status agent_status NOT NULL DEFAULT 'active',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),

  -- Constraints
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Index for faster lookups
CREATE INDEX idx_sales_agents_status ON sales_agents(status);
CREATE INDEX idx_sales_agents_email ON sales_agents(email);
CREATE INDEX idx_sales_agents_token ON sales_agents(unique_link_token);

-- =====================================================
-- AGENT QUOTE LINKS TABLE (Shareable Links)
-- =====================================================

CREATE TABLE agent_quote_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES sales_agents(id) ON DELETE CASCADE,

  -- Link configuration
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  max_uses INTEGER, -- NULL = unlimited uses
  use_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT valid_use_count CHECK (use_count >= 0)
);

-- Index for token lookups
CREATE UNIQUE INDEX idx_agent_quote_links_token ON agent_quote_links(token);
CREATE INDEX idx_agent_quote_links_agent ON agent_quote_links(agent_id);

-- =====================================================
-- QUOTE ACCEPTANCE LINKS TABLE (Client Acceptance)
-- =====================================================

CREATE TABLE quote_acceptance_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE CASCADE,

  -- Link configuration
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Tracking
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for token lookups
CREATE UNIQUE INDEX idx_quote_acceptance_links_token ON quote_acceptance_links(token);
CREATE INDEX idx_quote_acceptance_links_quote ON quote_acceptance_links(quote_id);

-- =====================================================
-- UPDATE BUSINESS_QUOTES TABLE
-- =====================================================

ALTER TABLE business_quotes
  ADD COLUMN agent_id UUID REFERENCES sales_agents(id),
  ADD COLUMN acceptance_token TEXT,
  ADD COLUMN client_acceptance_ip INET,
  ADD COLUMN client_acceptance_user_agent TEXT;

-- Index for agent lookups
CREATE INDEX idx_business_quotes_agent ON business_quotes(agent_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_agents_updated_at
  BEFORE UPDATE ON sales_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_agents_updated_at();

-- Update agent stats when quote is created
CREATE OR REPLACE FUNCTION update_agent_quote_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL THEN
    UPDATE sales_agents
    SET total_quotes_created = total_quotes_created + 1
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_quotes_agent_created
  AFTER INSERT ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_quote_created();

-- Update agent stats when quote is accepted
CREATE OR REPLACE FUNCTION update_agent_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.agent_id IS NOT NULL THEN
    UPDATE sales_agents
    SET
      total_quotes_accepted = total_quotes_accepted + 1,
      total_revenue_generated = total_revenue_generated + NEW.total_monthly
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_quotes_agent_accepted
  AFTER UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_quote_accepted();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_quote_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_acceptance_links ENABLE ROW LEVEL SECURITY;

-- Sales Agents: Only admins can manage agents
CREATE POLICY "Admins can manage sales agents"
  ON sales_agents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Sales Agents: Agents can view their own profile
CREATE POLICY "Agents can view own profile"
  ON sales_agents
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Agent Quote Links: Admins and the agent can view their links
CREATE POLICY "Agent can view own quote links"
  ON agent_quote_links
  FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Agent Quote Links: Only admins can create/update/delete links
CREATE POLICY "Admins can manage agent quote links"
  ON agent_quote_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Quote Acceptance Links: Public read access for valid tokens
CREATE POLICY "Public can view quote acceptance links by token"
  ON quote_acceptance_links
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Quote Acceptance Links: Only authenticated users can create
CREATE POLICY "Authenticated users can create acceptance links"
  ON quote_acceptance_links
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Create a test sales agent
INSERT INTO sales_agents (
  email,
  full_name,
  phone,
  agent_type,
  commission_rate,
  status
) VALUES (
  'sales@circletel.co.za',
  'Test Sales Agent',
  '+27821234567',
  'internal',
  5.00,
  'active'
);

-- Add comments for documentation
COMMENT ON TABLE sales_agents IS 'Sales agents who create quotes for customers';
COMMENT ON TABLE agent_quote_links IS 'Shareable links for agents to create quote requests';
COMMENT ON TABLE quote_acceptance_links IS 'Links for clients to view and accept quotes';
COMMENT ON COLUMN sales_agents.unique_link_token IS 'Permanent shareable link token for the agent';
COMMENT ON COLUMN sales_agents.commission_rate IS 'Commission percentage (0-100)';
