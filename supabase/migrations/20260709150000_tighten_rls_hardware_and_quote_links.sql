-- Whitelabel Phase 0 security burn-down (spec §7).
-- 1) Hardware catalogue: the "Admin full access" policies were
--    FOR ALL USING (true) with no role restriction -> the public anon
--    key could INSERT/UPDATE/DELETE catalogue rows. Admin traffic goes
--    through service-role API routes (RLS-bypassing), so full access is
--    scoped to service_role. Public read policies are unchanged.

DROP POLICY IF EXISTS "Admin full access hardware products" ON circletel_hardware_products;
CREATE POLICY "Service role full access hardware products" ON circletel_hardware_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access hardware supplier links" ON hardware_product_suppliers;
CREATE POLICY "Service role full access hardware supplier links" ON hardware_product_suppliers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access hardware terms" ON hardware_product_terms;
CREATE POLICY "Service role full access hardware terms" ON hardware_product_terms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access hardware service links" ON hardware_service_links;
CREATE POLICY "Service role full access hardware service links" ON hardware_service_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2) quote_acceptance_links: "Public can view ... by token" was
--    USING (true) for anon+authenticated -> anyone could enumerate all
--    acceptance links and tokens. Token resolution happens in
--    service-role API routes; no client-side reader exists
--    (verified 2026-07-09). Anon SELECT is removed entirely.

DROP POLICY IF EXISTS "Public can view quote acceptance links by token" ON public.quote_acceptance_links;
