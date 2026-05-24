-- Migration: Add MiRO Distribution and Nology Suppliers
-- Purpose: Enable supplier product catalog sync for MiRO and Nology hardware distributors
-- Created: 2026-03-01
--
-- MiRO Distribution: https://miro.co.za - Wi-Fi, networking, surveillance equipment
-- Nology: https://nology.co.za - Networking equipment (VirtueMart)

-- =====================================================
-- ADD MIRO DISTRIBUTION
-- =====================================================

INSERT INTO suppliers (
  name,
  code,
  website_url,
  feed_url,
  feed_type,
  contact_email,
  notes,
  is_active,
  sync_status,
  metadata
) VALUES (
  'MiRO Distribution',
  'MIRO',
  'https://miro.co.za',
  NULL, -- No single feed URL, scrape multiple category pages
  'html', -- HTML scraping
  'sales@miro.co.za',
  'Wi-Fi, wireless broadband, networking, surveillance, cabling. HTML scraping with multiple category pages. Stock tracked by branch (JHB, CPT, DBN, NS).',
  true,
  'pending',
  '{
    "sync_type": "html_scrape",
    "categories": [
      "https://miro.co.za/3-01-wi-fi?show=all",
      "https://miro.co.za/4-02-wireless-broadband?show=all",
      "https://miro.co.za/5-03-carrier-wireless",
      "https://miro.co.za/6-05-antennas---masts",
      "https://miro.co.za/8-07-networking?show=all",
      "https://miro.co.za/12-11-access-control",
      "https://miro.co.za/11-10-surveillance",
      "https://miro.co.za/9-08-cabling-cabinets",
      "https://miro.co.za/10-09-telephony?show=all",
      "https://miro.co.za/13-4-iot---smart-home?show=all"
    ],
    "rate_limit_ms": 2000,
    "branches": ["JHB", "CPT", "DBN", "NS"]
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- =====================================================
-- ADD NOLOGY
-- =====================================================

INSERT INTO suppliers (
  name,
  code,
  website_url,
  feed_url,
  feed_type,
  contact_email,
  notes,
  is_active,
  sync_status,
  metadata
) VALUES (
  'Nology',
  'NOLOGY',
  'https://www.nology.co.za',
  NULL, -- No single feed URL, scrape multiple category pages
  'html', -- HTML scraping (VirtueMart)
  'sales@nology.co.za',
  'Networking equipment - switches, routers, wireless. VirtueMart-based site with HTML scraping.',
  true,
  'pending',
  '{
    "sync_type": "html_scrape",
    "platform": "virtuemart",
    "categories": [
      "https://www.nology.co.za/products/networking/switches",
      "https://www.nology.co.za/products/networking/routers",
      "https://www.nology.co.za/products/wireless"
    ],
    "rate_limit_ms": 2000
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- =====================================================
-- UPDATE FEED_TYPE TO SUPPORT HTML
-- =====================================================

-- The existing feed_type column allows 'xml', 'api', 'csv', 'manual'
-- We need to add 'html' as a valid option
-- Since it's a TEXT column without constraint, no schema change needed

-- =====================================================
-- COMPLETE
-- =====================================================

-- Migration summary:
-- 1. Added MiRO Distribution supplier with 10 category URLs
-- 2. Added Nology supplier with 3 category URLs
-- 3. Both configured for HTML scraping with rate limiting
