-- Part 5: RLS Policies (Run Last)

-- Enable RLS
ALTER TABLE provider_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outage_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE outage_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_health_checks ENABLE ROW LEVEL SECURITY;

-- Provider status - admin only
DROP POLICY IF EXISTS "Admin read provider status" ON provider_status_logs;
CREATE POLICY "Admin read provider status" ON provider_status_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

-- Connection logs - customer can see own, admin can see all
DROP POLICY IF EXISTS "Customers read own connection logs" ON customer_connection_logs;
CREATE POLICY "Customers read own connection logs" ON customer_connection_logs
  FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin read all connection logs" ON customer_connection_logs;
CREATE POLICY "Admin read all connection logs" ON customer_connection_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

-- Outages - public read, admin write
DROP POLICY IF EXISTS "Anyone can read outages" ON outage_incidents;
CREATE POLICY "Anyone can read outages" ON outage_incidents
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admin manage outages" ON outage_incidents;
CREATE POLICY "Admin manage outages" ON outage_incidents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

-- Outage updates
DROP POLICY IF EXISTS "Anyone can read public outage updates" ON outage_updates;
CREATE POLICY "Anyone can read public outage updates" ON outage_updates
  FOR SELECT TO authenticated USING (is_public = TRUE);

DROP POLICY IF EXISTS "Admin manage outage updates" ON outage_updates;
CREATE POLICY "Admin manage outage updates" ON outage_updates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

-- SLA definitions - public read
DROP POLICY IF EXISTS "Anyone can read SLA definitions" ON sla_definitions;
CREATE POLICY "Anyone can read SLA definitions" ON sla_definitions
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- SLA violations - customer can see own, admin can see all
DROP POLICY IF EXISTS "Customers read own SLA violations" ON sla_violations;
CREATE POLICY "Customers read own SLA violations" ON sla_violations
  FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin manage SLA violations" ON sla_violations;
CREATE POLICY "Admin manage SLA violations" ON sla_violations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

-- Health checks - admin only
DROP POLICY IF EXISTS "Admin read health checks" ON network_health_checks;
CREATE POLICY "Admin read health checks" ON network_health_checks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));
