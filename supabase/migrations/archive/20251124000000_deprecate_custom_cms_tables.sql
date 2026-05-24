-- ================================================================
-- Deprecation Notice: Custom CMS Tables
-- ================================================================
-- Date: 2025-11-24
-- Reason: Migrating to Prismic Slice Machine for no-code visual page building
-- Status: Tables remain active for historical data, no new records should be created
-- Replacement: Prismic CMS (https://prismic.io)
-- ================================================================

-- Add deprecation comments to tables
comment on table pages is
  'DEPRECATED (2025-11-24): This table was part of the custom CMS system.
   Replaced by Prismic Slice Machine.
   Kept for historical reference only. Do not insert new records.
   Migration archived in: archive/old-cms/';

comment on table media_library is
  'DEPRECATED (2025-11-24): This table tracked media uploads for the custom CMS.
   Replaced by Prismic Media Library (CDN-hosted).
   Kept for historical reference only. Do not insert new records.
   Migration archived in: archive/old-cms/';

comment on table cms_ai_usage is
  'PARTIALLY DEPRECATED (2025-11-24): This table tracked AI usage for the custom CMS.
   The Gemini AI integration is preserved in /admin/ai-copy as a copywriting assistant.
   Table will be renamed to ai_copywriter_usage in future migration.
   For now, continue using for rate limiting of the AI copywriter tool.';

-- Add deprecation comments to key columns
comment on column pages.thought_signature is
  'Gemini 3 reasoning context for multi-turn conversations.
   This feature is unique to the custom CMS and not available in Prismic.
   Preserved in /admin/ai-copy tool for copywriting assistance.';

comment on column pages.content is
  'JSONB content structure specific to custom CMS.
   Prismic uses a different content model (Slices).
   Not compatible for direct migration.';

-- Log deprecation for audit trail
do $$
begin
  raise notice 'Custom CMS tables deprecated on 2025-11-24';
  raise notice 'Tables: pages, media_library, cms_ai_usage';
  raise notice 'Replacement: Prismic Slice Machine';
  raise notice 'Archived code location: archive/old-cms/';
end $$;
