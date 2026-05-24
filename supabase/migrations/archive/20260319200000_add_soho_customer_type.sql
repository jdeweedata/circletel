-- Add 'soho' customer type across all tables that use customer_type

-- business_quotes: smme, enterprise -> + soho
ALTER TABLE business_quotes DROP CONSTRAINT IF EXISTS business_quotes_customer_type_check;
ALTER TABLE business_quotes ADD CONSTRAINT business_quotes_customer_type_check
CHECK (customer_type IN ('smme', 'enterprise', 'soho'));

-- billing_settings: global, business, consumer, partner -> + soho
ALTER TABLE billing_settings DROP CONSTRAINT IF EXISTS billing_settings_customer_type_check;
ALTER TABLE billing_settings ADD CONSTRAINT billing_settings_customer_type_check
CHECK (customer_type IN ('global', 'business', 'consumer', 'partner', 'soho'));

-- promotions: residential, business, all -> + soho
ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_customer_type_check;
ALTER TABLE promotions ADD CONSTRAINT promotions_customer_type_check
CHECK (customer_type IN ('residential', 'business', 'all', 'soho'));

-- service_packages already has 'soho' (added in 20260319100000)
