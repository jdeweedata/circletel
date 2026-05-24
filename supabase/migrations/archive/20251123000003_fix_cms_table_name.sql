-- Robustly rename pages to cms_pages if needed

DO $$
BEGIN
  -- Check if 'pages' table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pages') THEN
    -- Check if 'cms_pages' table already exists (to avoid collision)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cms_pages') THEN
      ALTER TABLE pages RENAME TO cms_pages;
      
      -- Rename indexes to match new table name (best effort)
      ALTER INDEX IF EXISTS pages_pkey RENAME TO cms_pages_pkey;
      ALTER INDEX IF EXISTS pages_slug_key RENAME TO cms_pages_slug_key;
      ALTER INDEX IF EXISTS pages_status_idx RENAME TO cms_pages_status_idx;
      ALTER INDEX IF EXISTS pages_author_idx RENAME TO cms_pages_author_idx;
      ALTER INDEX IF EXISTS pages_slug_idx RENAME TO cms_pages_slug_idx;
      ALTER INDEX IF EXISTS pages_content_type_idx RENAME TO cms_pages_content_type_idx;
      ALTER INDEX IF EXISTS pages_published_at_idx RENAME TO cms_pages_published_at_idx;
    END IF;
  END IF;
END $$;

-- Ensure RLS is enabled on the correct table
ALTER TABLE IF EXISTS cms_pages ENABLE ROW LEVEL SECURITY;
