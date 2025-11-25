#!/usr/bin/env python3
"""
Generate a new Supabase migration file with proper naming convention.
Usage: python generate_migration.py "description of migration"
"""

import sys
import os
from datetime import datetime
from pathlib import Path


def generate_migration(description: str, output_dir: str = "supabase/migrations") -> str:
    """
    Generate a new migration file with timestamp and description.

    Args:
        description: Human-readable description (will be converted to snake_case)
        output_dir: Directory to save migration file

    Returns:
        Path to the created migration file
    """
    # Generate timestamp (YYYYMMDDHHMMSS format)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    # Convert description to snake_case
    snake_case_desc = description.lower()
    snake_case_desc = snake_case_desc.replace(" ", "_")
    snake_case_desc = "".join(c for c in snake_case_desc if c.isalnum() or c == "_")

    # Create filename
    filename = f"{timestamp}_{snake_case_desc}.sql"

    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Full file path
    filepath = output_path / filename

    # Migration template
    template = f"""-- Migration: {description}
-- Created: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
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
"""

    # Write template to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(template)

    return str(filepath)


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_migration.py \"description of migration\"")
        print("\nExample:")
        print("  python generate_migration.py \"create customer invoices table\"")
        print("\nThis will create:")
        print("  supabase/migrations/20251108120000_create_customer_invoices_table.sql")
        sys.exit(1)

    description = sys.argv[1]

    try:
        filepath = generate_migration(description)
        print(f"[SUCCESS] Migration file created successfully!")
        print(f"File: {filepath}")
        print(f"\nNext steps:")
        print(f"1. Edit the migration file and uncomment/modify the template")
        print(f"2. Test locally: npx supabase db reset && npx supabase migration up")
        print(f"3. Commit: git add {filepath}")
        print(f"4. Push to staging for testing")
    except Exception as e:
        print(f"[ERROR] Error creating migration file: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
