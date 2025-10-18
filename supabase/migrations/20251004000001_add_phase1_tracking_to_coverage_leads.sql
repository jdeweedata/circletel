-- Phase 1: CX Implementation - Add tracking fields to coverage_leads table
-- Migration: 20251004000001_add_phase1_tracking_to_coverage_leads
-- Description: Adds customer type, UTM tracking, and additional lead qualification fields

-- Add customer type and business information
ALTER TABLE coverage_leads
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'residential' CHECK (
  customer_type IN ('residential', 'business')
),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS property_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add UTM tracking parameters for marketing attribution
ALTER TABLE coverage_leads
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Create indexes for analytics and filtering
CREATE INDEX IF NOT EXISTS idx_coverage_leads_customer_type
ON coverage_leads(customer_type);

CREATE INDEX IF NOT EXISTS idx_coverage_leads_utm_source
ON coverage_leads(utm_source);

CREATE INDEX IF NOT EXISTS idx_coverage_leads_utm_campaign
ON coverage_leads(utm_campaign);

CREATE INDEX IF NOT EXISTS idx_coverage_leads_created_at
ON coverage_leads(created_at DESC);

-- Add comment to document the purpose
COMMENT ON COLUMN coverage_leads.customer_type IS 'Type of customer: residential or business';
COMMENT ON COLUMN coverage_leads.utm_source IS 'Marketing campaign source (e.g., google, facebook)';
COMMENT ON COLUMN coverage_leads.utm_medium IS 'Marketing campaign medium (e.g., cpc, email)';
COMMENT ON COLUMN coverage_leads.utm_campaign IS 'Marketing campaign name';
COMMENT ON COLUMN coverage_leads.referrer_url IS 'HTTP referrer URL for attribution tracking';

-- Create view for marketing analytics
CREATE OR REPLACE VIEW coverage_lead_analytics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  customer_type,
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as lead_count,
  COUNT(*) FILTER (WHERE coverage_available = true) as qualified_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0),
    2
  ) as conversion_rate
FROM coverage_leads
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY
  DATE_TRUNC('day', created_at),
  customer_type,
  utm_source,
  utm_medium,
  utm_campaign
ORDER BY date DESC;

-- Grant access to authenticated users
GRANT SELECT ON coverage_lead_analytics TO authenticated;
