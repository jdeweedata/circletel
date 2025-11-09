-- Migration: test migration creation
-- Created: 2025-11-08 21:30:10
-- Purpose: [Describe what this migration does]

-- ============================================
-- STEP 1: Create Tables
-- ============================================

-- CREATE TABLE IF NOT EXISTS public.your_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
--   -- Add your columns here
-- );

-- ============================================
-- STEP 2: Create Indexes
-- ============================================

-- CREATE INDEX IF NOT EXISTS idx_your_table_column
--   ON public.your_table(column_name);

-- ============================================
-- STEP 3: Add Foreign Keys
-- ============================================

-- ALTER TABLE public.your_table
--   ADD CONSTRAINT fk_your_table_reference
--   FOREIGN KEY (reference_id) REFERENCES public.other_table(id)
--   ON DELETE CASCADE;

-- ============================================
-- STEP 4: Enable RLS
-- ============================================

-- ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- Service role can do everything (REQUIRED for API routes)
-- CREATE POLICY "service_role_all" ON public.your_table
--   FOR ALL
--   USING (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can read their own records
-- CREATE POLICY "users_select_own" ON public.your_table
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- Admins can access all records
-- CREATE POLICY "admins_all" ON public.your_table
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.admin_users
--       WHERE id = auth.uid()
--     )
--   );

-- ============================================
-- STEP 6: Create Triggers (if needed)
-- ============================================

-- Auto-update updated_at timestamp
-- CREATE OR REPLACE FUNCTION public.update_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_update_timestamp
--   BEFORE UPDATE ON public.your_table
--   FOR EACH ROW
--   EXECUTE FUNCTION public.update_timestamp();

-- ============================================
-- STEP 7: Add Comments
-- ============================================

-- COMMENT ON TABLE public.your_table IS 'Description of what this table stores';
-- COMMENT ON COLUMN public.your_table.column IS 'Description of this column';
