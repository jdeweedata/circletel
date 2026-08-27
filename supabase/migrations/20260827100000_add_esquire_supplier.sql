-- Add Esquire Technologies as a fifth hardware distributor.
-- Feed is XML (credentials in ESQUIRE_FEED_* env, never in this file).
-- Prices exclude VAT. AvailableQty is Yes/No, not warehouse units.

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
  'Esquire Technologies',
  'ESQUIRE',
  'https://www.esquire.co.za',
  'https://api.esquire.co.za/api/DataFeed',
  'xml',
  'procurement@circletel.co.za',
  'SA distributor XML datafeed. Sync with ESQUIRE_FEED_USER and ESQUIRE_FEED_PASSWORD. Do not publish the raw catalogue.',
  true,
  'pending',
  '{
    "sync_type": "xml_feed",
    "pricing_note": "Feed Price is dealer excl VAT. AvailableQty is Yes/No.",
    "stock_is_boolean": true
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  feed_type = EXCLUDED.feed_type,
  feed_url = EXCLUDED.feed_url,
  updated_at = NOW();
