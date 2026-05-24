-- Migration: Add Rectron Supplier Record
-- Purpose: Seed Rectron as a supplier for price list sync
-- Created: 2026-05-23
--
-- Rectron is a major SA ICT distributor. Their feed is an Excel (.xlsm)
-- price list downloaded from RectronZone reseller portal (CAPTCHA-gated).
-- The file is placed in /home/circletel/products/pricelist/ for sync.
--
-- Key differences from other suppliers:
-- - No stock-on-hand data (price list only)
-- - Price excludes VAT
-- - Includes warranty duration in months
-- - File-based sync, not API/HTML-scrape

-- =====================================================
-- ADD RECTRON SUPPLIER
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
  'Rectron',
  'RECTRON',
  'https://www.rectron.co.za',
  NULL, -- Manual file download from RectronZone portal
  'xlsm', -- Macro-enabled Excel file from RectronZone
  'sales@rectron.co.za',
  'Major ICT distributor — components, notebooks, displays, networking, storage, peripherals. Price list (xlsm) downloaded manually from rectronzone.co.za/downloadzone. No stock levels provided.',
  true,
  'pending',
  '{
    "sync_type": "xlsm_file",
    "platform": "storefront7",
    "watch_dir": "/home/circletel/products/pricelist",
    "file_pattern": "RECTRON_PRICE_LIST_*.xlsm",
    "archive_processed": false,
    "branches": ["JHB", "CPT", "DBN", "BFN", "PE"],
    "pricing_note": "Prices exclude VAT. E&OE. Subject to exchange rate fluctuations.",
    "no_stock_data": true
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- =====================================================
-- COMPLETE
-- =====================================================

-- Migration summary:
-- 1. Added Rectron supplier with xlsm file-based sync configuration
-- 2. Rectron joined as 4th distributor alongside Scoop, MiRO, and Nology
