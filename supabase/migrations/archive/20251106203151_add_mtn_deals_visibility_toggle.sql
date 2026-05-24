-- Add is_visible_on_frontend column to mtn_business_deals
-- This allows admins to control which deals appear on the public website

ALTER TABLE mtn_business_deals
ADD COLUMN is_visible_on_frontend BOOLEAN NOT NULL DEFAULT true;

-- Add index for faster queries filtering by visibility
CREATE INDEX idx_mtn_deals_visible ON mtn_business_deals(is_visible_on_frontend)
WHERE is_visible_on_frontend = true;

-- Add comment
COMMENT ON COLUMN mtn_business_deals.is_visible_on_frontend IS
'Controls whether this deal is shown on the public-facing website. Admins can toggle this in the admin panel.';
