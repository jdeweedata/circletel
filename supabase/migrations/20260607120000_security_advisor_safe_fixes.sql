-- Security Advisor (database-linter) safe remediations — 2026-06-07
--
-- Resolves three ERROR-level findings. All affected objects are read ONLY by the
-- service-role server client (lib/supabase/server), which bypasses RLS, so these
-- changes do not affect application behaviour.
--
-- NOT included (deliberate):
--   * public.cms_blog_posts  — intentional SECURITY DEFINER view giving anon a
--     controlled, status='published' window into the `payload` schema. Switching
--     to security_invoker would break public blog reads. Left as-is.
--   * public.spatial_ref_sys — PostGIS system table owned by supabase_admin;
--     cannot ALTER as the postgres role. Known false positive.

-- 0013_rls_disabled_in_public: enable RLS (deny-all to anon/authenticated;
-- service-role continues to bypass — the only consumer of these tables).
ALTER TABLE public.tarana_device_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- 0010_security_definer_view: run the view with the caller's permissions/RLS.
-- This view reads only public-schema tables and is queried solely server-side
-- (lib/hardware-catalogue/queries.ts) via the service-role client.
ALTER VIEW public.v_hardware_product_detail SET (security_invoker = on);
