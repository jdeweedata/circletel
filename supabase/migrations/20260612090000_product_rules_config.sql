-- Persists Rules Studio threshold overrides (previously client-side only).
-- Single-row config keyed by a fixed id; config JSONB matches Partial<RuleConfig>.
CREATE TABLE IF NOT EXISTS product_rules_config (
  id text PRIMARY KEY DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES admin_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_rules_config ENABLE ROW LEVEL SECURITY;
-- Service-role only (admin API uses the service client); no anon/authenticated policies.
