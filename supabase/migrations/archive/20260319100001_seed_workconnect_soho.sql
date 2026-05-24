-- Idempotent: delete existing WorkConnect packages before re-inserting
DELETE FROM service_packages WHERE service_type = 'WorkConnect' AND product_category = 'soho';

-- WorkConnect Starter — 50/13 Mbps — R799/mo
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, market_segment, provider,
  speed_down, speed_up, price, base_price_zar, cost_price_zar,
  description, features, active, status, is_featured, is_popular,
  slug, sku, pricing, metadata
) VALUES (
  'WorkConnect Starter', 'WorkConnect', 'soho', 'soho', 'soho', 'MTN',
  50, 13, 799.00, 799.00, 632.08,
  'Work-grade internet for freelancers and entry-level WFH. VoIP QoS, business email, and extended support hours.',
  ARRAY['Uncapped data, no FUP','VoIP QoS included','2 business email accounts','Reyee WiFi 5 router (free to use)','Extended support Mon-Sat 07:00-19:00','12 business hour response time','99% uptime target','Month-to-month or 12/24 month contract','R900 installation fee'],
  true, 'active', false, false,
  'workconnect-starter', 'WC-STARTER-50',
  '{"monthly": 799, "setup": 900, "download_speed": 50, "upload_speed": 13}'::jsonb,
  '{"cost_breakdown":{"wholesale_fwb":499.00,"infrastructure":33.50,"bss_platform":10.96,"router_amortisation":28.13,"installation_amortisation":37.50,"support_operations":15.00,"payment_processing":7.99},"router":{"model":"Reyee RG-EW1300G","dealer_cost":675},"margin_percent":20.9,"margin_post_24mo":27.2,"installation_fee":900,"contract_duration":"month-to-month or 12/24 months"}'::jsonb
);

-- WorkConnect Plus — 100/25 Mbps — R1,099/mo
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, market_segment, provider,
  speed_down, speed_up, price, base_price_zar, cost_price_zar,
  description, features, active, status, is_featured, is_popular,
  slug, sku, pricing, metadata
) VALUES (
  'WorkConnect Plus', 'WorkConnect', 'soho', 'soho', 'soho', 'MTN',
  100, 25, 1099.00, 1099.00, 754.66,
  'Power your productivity with VPN support, VoIP QoS, and a business gateway router. Ideal for remote workers and micro-businesses.',
  ARRAY['Uncapped data, no FUP','VoIP QoS included','5 business email accounts','Reyee Business Gateway router (free to use)','3 concurrent VPN tunnels','Extended support Mon-Sat 07:00-19:00','8 business hour response time','99% uptime target','Month-to-month or 12/24 month contract','R900 installation fee'],
  true, 'active', true, true,
  'workconnect-plus', 'WC-PLUS-100',
  '{"monthly": 1099, "setup": 900, "download_speed": 100, "upload_speed": 25}'::jsonb,
  '{"cost_breakdown":{"wholesale_fwb":599.00,"infrastructure":38.50,"bss_platform":10.96,"router_amortisation":42.71,"installation_amortisation":37.50,"support_operations":15.00,"payment_processing":10.99},"router":{"model":"Reyee RG-EG105GW","dealer_cost":1025},"margin_percent":31.3,"margin_post_24mo":33.8,"installation_fee":900,"contract_duration":"month-to-month or 12/24 months"}'::jsonb
);

-- WorkConnect Pro — 200/50 Mbps — R1,499/mo
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, market_segment, provider,
  speed_down, speed_up, price, base_price_zar, cost_price_zar,
  description, features, active, status, is_featured, is_popular,
  slug, sku, pricing, metadata
) VALUES (
  'WorkConnect Pro', 'WorkConnect', 'soho', 'soho', 'soho', 'MTN',
  200, 50, 1499.00, 1499.00, 842.66,
  'Built for ambition. Static IP, full traffic shaping, VPN, and WhatsApp priority support for power users and multi-user SOHO offices.',
  ARRAY['Uncapped data, no FUP','VoIP QoS with full traffic shaping','10 business email accounts','1 static IP included','Reyee Business Gateway router (free to use)','5 concurrent VPN tunnels','Remote Desktop optimised (RDP/Citrix)','WhatsApp priority support','4 business hour response time','99.5% uptime target with service credits','Month-to-month or 12/24 month contract','FREE installation (valued at R1,500)'],
  true, 'active', false, false,
  'workconnect-pro', 'WC-PRO-200',
  '{"monthly": 1499, "setup": 0, "download_speed": 200, "upload_speed": 50}'::jsonb,
  '{"cost_breakdown":{"wholesale_fwb":699.00,"infrastructure":55.00,"bss_platform":10.96,"router_amortisation":42.71,"installation_amortisation":0,"support_operations":20.00,"payment_processing":14.99},"router":{"model":"Reyee RG-EG105GW","dealer_cost":1025},"margin_percent":43.8,"margin_post_24mo":43.7,"installation_fee":0,"contract_duration":"month-to-month or 12/24 months"}'::jsonb
);

-- Note: cost_price_zar is overridden by sync_service_package_pricing_trigger
-- to store pricing.setup value. Actual monthly cost data lives in metadata.cost_breakdown.
