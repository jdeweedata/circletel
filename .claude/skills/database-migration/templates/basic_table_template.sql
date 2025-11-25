-- Template: Basic Table with RLS
-- Use this template for creating a new table with standard patterns

-- ============================================
-- STEP 1: Create Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.your_table_name (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys (if applicable)
  user_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,

  -- Data columns
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Metadata columns (ALWAYS INCLUDE)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- STEP 2: Create Indexes
-- ============================================

-- Index on foreign key (REQUIRED for performance)
CREATE INDEX IF NOT EXISTS idx_your_table_user_id
  ON public.your_table_name(user_id);

-- Index on commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_your_table_status
  ON public.your_table_name(status)
WHERE status = 'active';

-- ============================================
-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE public.your_table_name ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS Policies
-- ============================================

-- REQUIRED: Service role can do everything (for API routes)
CREATE POLICY "service_role_all" ON public.your_table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can read their own records
CREATE POLICY "users_select_own" ON public.your_table_name
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "users_insert_own" ON public.your_table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "users_update_own" ON public.your_table_name
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "users_delete_own" ON public.your_table_name
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can access all records
CREATE POLICY "admins_all" ON public.your_table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- STEP 5: Create Trigger for updated_at
-- ============================================

CREATE TRIGGER trigger_update_timestamp
  BEFORE UPDATE ON public.your_table_name
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- ============================================
-- STEP 6: Add Comments
-- ============================================

COMMENT ON TABLE public.your_table_name IS 'Description of what this table stores';
COMMENT ON COLUMN public.your_table_name.status IS 'Current status: active, inactive, or archived';
