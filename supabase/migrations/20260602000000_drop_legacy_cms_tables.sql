-- Migration: Remove legacy CMS builder tables
-- Date: 2026-06-02
-- Context: Replaced by Payload CMS (embedded Next.js, /cms admin)
--
-- Drops tables that supported the old drag-and-drop page builder.
-- Payload CMS creates its own tables with payload_ prefix.
-- Only 1 draft row existed in cms_pages — no data loss.

-- Drop dependent tables first (foreign keys)
DROP TABLE IF EXISTS cms_page_versions CASCADE;
DROP TABLE IF EXISTS cms_media CASCADE;
DROP TABLE IF EXISTS cms_templates CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;

-- Drop supporting function
DROP FUNCTION IF EXISTS get_cms_media_path(text);
