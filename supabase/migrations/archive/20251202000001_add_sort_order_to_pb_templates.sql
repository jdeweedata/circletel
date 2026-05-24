-- Add sort_order column to pb_templates table
-- This column is required by the CMS templates API for ordering templates
-- Fix for: 500 Internal Server Error on /api/admin/cms/templates

ALTER TABLE pb_templates
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Set initial sort order based on creation date (earlier templates get lower sort order)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM pb_templates
)
UPDATE pb_templates
SET sort_order = numbered.rn
FROM numbered
WHERE pb_templates.id = numbered.id;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pb_templates_sort_order ON pb_templates(sort_order);

COMMENT ON COLUMN pb_templates.sort_order IS 'Display order for templates in the CMS builder (lower values appear first)';
