-- Adds billing_day_window setting: controls which billing_day values
-- are included in the 25th-of-month invoice generation run.

INSERT INTO billing_settings (
  setting_key,
  setting_value,
  customer_type,
  category,
  description
)
VALUES (
  'billing_day_window',
  '[1,2,3,4,5]',
  'global',
  'billing_rules',
  'billing_day values included in the 25th-of-month invoice generation run (e.g. [1,2,3,4,5] covers all customers billed on 1st-5th of month)'
)
ON CONFLICT (setting_key, customer_type) DO NOTHING;
