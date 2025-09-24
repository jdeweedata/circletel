-- Insert CircleTel product portfolio based on product documentation
-- This populates the products table with real CircleTel products

-- BizFibreConnect Products (Business FTTH via DFA)
INSERT INTO products (
    name, slug, description, category, technology, product_line,
    price_monthly, price_installation, price_upfront, price_router_rental,
    speed_download, speed_upload, is_symmetrical,
    features, router_included, router_model, static_ip_included,
    uptime_sla, support_hours, support_response_time,
    contract_months, contract_options,
    marketing_headline, marketing_description, target_market,
    competitive_advantages, requires_coverage_check, coverage_technologies,
    cost_wholesale, cost_infrastructure, cost_total, margin_percentage,
    is_active, is_featured, order_priority, tags
) VALUES

-- BizFibreConnect Lite
(
    'BizFibre Connect Lite', 'bizfibre-connect-lite',
    'Enterprise-grade fibre connectivity for micro businesses with FREE cloud management',
    'smb', 'fibre', 'bizfibreconnect',
    1699.00, 0.00, 0.00, 0.00,
    10, 10, true,
    '["Uncapped Data", "Symmetrical Speed", "Cloud Management", "Professional Router", "24/7 Support", "Professional Installation"]'::jsonb,
    true, 'Reyee RG-EW1300G', 0,
    99.5, '24/7', '15_minutes',
    24, '[12, 24]'::jsonb,
    'Professional internet with enterprise router included',
    'Micro businesses and home offices get enterprise-grade fibre with included router and cloud management',
    'Micro businesses, home offices, startups',
    '["FREE router included (R595 value)", "Cloud management platform", "Low contention ratio 1:10", "99.5% uptime SLA"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    999.00, 122.00, 1139.00, 33.0,
    true, true, 100, '["bizfibre", "starter", "micro_business", "fibre"]'::jsonb
),

-- BizFibreConnect Starter
(
    'BizFibre Connect Starter', 'bizfibre-connect-starter',
    'Business-grade fibre with dual-WAN capability for small offices',
    'smb', 'fibre', 'bizfibreconnect',
    1899.00, 0.00, 500.00, 0.00,
    25, 25, true,
    '["Uncapped Data", "Dual-WAN Support", "Load Balancing", "QoS", "Firewall", "Cloud Management"]'::jsonb,
    true, 'Reyee RG-EG105G', 0,
    99.5, '24/7', '15_minutes',
    24, '[12, 24]'::jsonb,
    'Business-grade with dual-WAN capability',
    'Small offices and retail stores get professional connectivity with redundancy features',
    'Small offices, retail stores',
    '["Dual-WAN capability", "Load balancing", "Professional QoS", "R500 hardware contribution only"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    999.00, 122.00, 1142.00, 39.8,
    true, false, 90, '["bizfibre", "small_business", "dual_wan"]'::jsonb
),

-- BizFibreConnect Plus
(
    'BizFibre Connect Plus', 'bizfibre-connect-plus',
    'Power your phones and cameras with built-in PoE support',
    'smb', 'fibre', 'bizfibreconnect',
    2499.00, 0.00, 500.00, 0.00,
    50, 50, true,
    '["Uncapped Data", "PoE Support", "IP Phone Ready", "Camera Support", "Advanced Firewall"]'::jsonb,
    true, 'Reyee RG-EG105G-P', 0,
    99.5, '24/7', '15_minutes',
    24, '[12, 24]'::jsonb,
    'Power your phones and cameras with built-in PoE',
    'Growing SMEs get advanced connectivity with Power over Ethernet for phones and cameras',
    'Growing SMEs, multi-user offices',
    '["Built-in PoE (54W)", "IP phone support", "Security camera ready", "Advanced features"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    1422.00, 122.00, 1565.00, 37.4,
    true, false, 80, '["bizfibre", "poe", "ip_phones", "cameras"]'::jsonb
),

-- BizFibreConnect Pro
(
    'BizFibre Connect Pro', 'bizfibre-connect-pro',
    'Enterprise VPN and advanced security for medium businesses',
    'smb', 'fibre', 'bizfibreconnect',
    2999.00, 0.00, 0.00, 99.00,
    100, 100, true,
    '["Enterprise VPN", "64 VPN Tunnels", "Advanced Security", "Priority Support", "Multi-WAN"]'::jsonb,
    false, 'Reyee RG-EG305GH-P-E', 0,
    99.5, '24/7', '15_minutes',
    24, '[12, 24]'::jsonb,
    'Enterprise VPN and advanced security',
    'Medium businesses get enterprise-grade features with VPN support and advanced security',
    'Medium businesses, heavy cloud usage',
    '["64 VPN tunnels", "Enterprise security", "Router rental model", "Advanced features"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    1731.00, 122.00, 1853.00, 38.2,
    true, true, 70, '["bizfibre", "enterprise_vpn", "security"]'::jsonb
),

-- BizFibreConnect Ultra
(
    'BizFibre Connect Ultra', 'bizfibre-connect-ultra',
    'Maximum performance with 8-port PoE for large offices',
    'enterprise', 'fibre', 'bizfibreconnect',
    4373.00, 0.00, 0.00, 149.00,
    200, 200, true,
    '["Maximum Performance", "8-Port PoE", "110W PoE Budget", "Enterprise Management", "Mission Critical"]'::jsonb,
    false, 'Reyee RG-EG310GH-P-E', 0,
    99.5, '24/7', '15_minutes',
    24, '[12, 24]'::jsonb,
    'Maximum performance with 8-port PoE',
    'Large offices get maximum performance with extensive PoE support for mission-critical operations',
    'Large offices, mission-critical operations',
    '["8-port PoE (110W)", "Maximum throughput", "Enterprise grade", "Mission critical"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    2875.00, 122.00, 2997.00, 31.5,
    true, false, 60, '["bizfibre", "enterprise", "maximum_performance"]'::jsonb
);

-- SkyFibre SMB Products (Business Fixed Wireless)
INSERT INTO products (
    name, slug, description, category, technology, product_line,
    price_monthly, price_installation, speed_download, speed_upload, is_symmetrical,
    features, router_included, static_ip_included,
    uptime_sla, support_hours, support_response_time,
    contract_months, marketing_headline, marketing_description, target_market,
    competitive_advantages, requires_coverage_check, coverage_technologies,
    cost_wholesale, cost_infrastructure, cost_total, margin_percentage,
    is_active, order_priority, tags
) VALUES

-- SkyFibre SMB Essential
(
    'SkyFibre SMB Essential', 'skyfibre-smb-essential',
    'Business-grade fixed wireless with SLA guarantee for small offices',
    'smb', 'fixed_wireless', 'skyfibre',
    1899.00, 0.00, 50, 50, true,
    '["99.5% SLA", "Static IP Included", "Business Email", "Cloud Backup", "QoS for VoIP"]'::jsonb,
    true, 1,
    99.5, 'business_hours', '8_hours',
    12, 'Perfect for small offices and startups',
    'Small offices get reliable fixed wireless with business-grade SLA and included static IP',
    'Small offices, startups',
    '["Business SLA 99.5%", "Static IP included", "5 email accounts", "50GB cloud backup"]'::jsonb,
    true, '["FIXED_WIRELESS"]'::jsonb,
    1112.38, 0.00, 1112.38, 41.4,
    true, 50, '["skyfibre", "smb", "essential", "wireless"]'::jsonb
),

-- SkyFibre SMB Professional
(
    'SkyFibre SMB Professional', 'skyfibre-smb-professional',
    'Enhanced business wireless with VPN support and extended support hours',
    'smb', 'fixed_wireless', 'skyfibre',
    2899.00, 0.00, 100, 100, true,
    '["VPN Support", "Advanced Firewall", "Traffic Shaping", "Real-time Monitoring", "Account Manager"]'::jsonb,
    true, 1,
    99.5, 'extended', '4_hours',
    12, 'Ideal for growing businesses',
    'Growing businesses get enhanced wireless with VPN support and dedicated account management',
    'Growing businesses',
    '["VPN support (5 users)", "Extended support 8am-8pm", "Account manager", "100GB backup"]'::jsonb,
    true, '["FIXED_WIRELESS"]'::jsonb,
    1435.71, 0.00, 1435.71, 50.5,
    true, 40, '["skyfibre", "smb", "professional", "vpn"]'::jsonb
),

-- SkyFibre SMB Premium
(
    'SkyFibre SMB Premium', 'skyfibre-smb-premium',
    'Maximum performance wireless with SD-WAN and 24/7 support',
    'smb', 'fixed_wireless', 'skyfibre',
    4499.00, 0.00, 200, 200, true,
    '["SD-WAN", "API Access", "Advanced Security", "10 VPN Users", "Quarterly Reviews"]'::jsonb,
    true, 2,
    99.9, '24/7', '2_hours',
    12, 'For businesses requiring maximum performance',
    'High-performance businesses get premium wireless with SD-WAN and enterprise features',
    'High-performance businesses',
    '["99.9% uptime SLA", "SD-WAN capabilities", "24/7 support", "2 static IPs"]'::jsonb,
    true, '["FIXED_WIRELESS"]'::jsonb,
    2160.71, 0.00, 2160.71, 52.0,
    true, 30, '["skyfibre", "smb", "premium", "sd_wan"]'::jsonb
),

-- SkyFibre SMB Enterprise
(
    'SkyFibre SMB Enterprise', 'skyfibre-smb-enterprise',
    'Complete connectivity solution with managed services and redundancy',
    'enterprise', 'fixed_wireless', 'skyfibre',
    6999.00, 0.00, 200, 200, true,
    '["Dual Router Redundancy", "Managed Firewall", "25 VPN Users", "BGP Routing", "MPLS Ready"]'::jsonb,
    true, 5,
    99.9, '24/7_priority', '1_hour',
    12, 'Complete connectivity solution for established businesses',
    'Established businesses get enterprise-grade wireless with full managed services',
    'Established businesses, enterprise',
    '["1-hour response SLA", "/29 IP block (5 IPs)", "Dual redundancy", "Managed services"]'::jsonb,
    true, '["FIXED_WIRELESS"]'::jsonb,
    3850.00, 0.00, 3850.00, 45.0,
    true, 20, '["skyfibre", "enterprise", "managed", "redundancy"]'::jsonb
);

-- HomeFibreConnect Products (Residential FTTH)
INSERT INTO products (
    name, slug, description, category, technology, product_line,
    price_monthly, price_installation, speed_download, speed_upload, is_symmetrical,
    features, router_included,
    uptime_sla, support_hours, support_response_time,
    contract_months, marketing_headline, marketing_description, target_market,
    competitive_advantages, requires_coverage_check, coverage_technologies,
    is_active, order_priority, tags, metadata
) VALUES

-- HomeFibreConnect Starter
(
    'HomeFibre Connect Starter', 'homefibre-connect-starter',
    'Affordable home fibre with WiFi 6 router included',
    'residential', 'fibre', 'homefibreconnect',
    449.00, 0.00, 25, 25, true,
    '["Uncapped Data", "WiFi 6 Router", "Professional Installation", "Local Support"]'::jsonb,
    true,
    99.5, 'extended', '24_hours',
    24, 'Affordable home fibre with enterprise router',
    'Families get reliable home fibre with included WiFi 6 router and professional installation',
    'Small families, light usage',
    '["WiFi 6 included", "No throttling", "Professional setup", "Local support"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    true, 10, '["homefibre", "residential", "starter", "family"]'::jsonb,
    '{"revised_pricing": true, "competitive_with_mtn": true}'::jsonb
),

-- HomeFibreConnect Plus
(
    'HomeFibre Connect Plus', 'homefibre-connect-plus',
    'Perfect for streaming and remote work with enhanced support',
    'residential', 'fibre', 'homefibreconnect',
    649.00, 0.00, 50, 50, true,
    '["Premium Router", "Enhanced Support", "Parental Controls", "Guest Network"]'::jsonb,
    true,
    99.7, 'extended', '12_hours',
    24, 'Perfect for streaming and remote work',
    'Modern families get enhanced home fibre perfect for streaming and work from home',
    'Modern families, remote workers',
    '["Premium WiFi 6 router", "Enhanced support", "Work-from-home ready", "Family features"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    true, 5, '["homefibre", "residential", "streaming", "remote_work"]'::jsonb,
    '{"revised_pricing": true, "work_from_home_optimized": true}'::jsonb
),

-- HomeFibreConnect Max
(
    'HomeFibre Connect Max', 'homefibre-connect-max',
    'High-speed home fibre for power users and large households',
    'residential', 'fibre', 'homefibreconnect',
    849.00, 0.00, 100, 100, true,
    '["Mesh Ready", "Advanced Security", "Priority Support", "Smart Home Compatible"]'::jsonb,
    true,
    99.9, '24/7', '6_hours',
    24, 'High-speed for power users and large households',
    'Power users and large households get maximum home fibre performance with premium features',
    'Power users, large households, gamers',
    '["True 100Mbps symmetrical", "Mesh WiFi ready", "Gaming optimized", "24/7 support"]'::jsonb,
    true, '["FIBRE"]'::jsonb,
    true, 1, '["homefibre", "residential", "power_users", "gaming"]'::jsonb,
    '{"gaming_optimized": true, "large_household": true}'::jsonb
);

-- SkyFibre Residential Products
INSERT INTO products (
    name, slug, description, category, technology, product_line,
    price_monthly, price_installation, speed_download, speed_upload,
    features, router_included,
    uptime_sla, support_hours, support_response_time,
    contract_months, marketing_headline, marketing_description, target_market,
    competitive_advantages, requires_coverage_check, coverage_technologies,
    is_active, order_priority, tags
) VALUES

-- SkyFibre Home Basic
(
    'SkyFibre Home Basic', 'skyfibre-home-basic',
    'Affordable fixed wireless for basic internet needs',
    'residential', 'fixed_wireless', 'skyfibre',
    599.00, 0.00, 25, 10,
    '["Uncapped Data", "Quick Installation", "Weather Resistant", "Local Support"]'::jsonb,
    true,
    99.0, 'business_hours', 'next_day',
    12, 'Affordable wireless for basic internet needs',
    'Budget-conscious families get reliable wireless internet with quick installation',
    'Budget families, basic internet users',
    '["3-5 day installation", "Weather resistant", "No digging required", "Relocatable"]'::jsonb,
    true, '["FIXED_WIRELESS"]'::jsonb,
    true, 1, '["skyfibre", "residential", "basic", "budget"]'::jsonb
),

-- SkyFibre Home Standard
(
    'SkyFibre Home Standard', 'skyfibre-home-standard',
    'Balanced wireless performance for modern family needs',
    'residential', 'fixed_wireless', 'skyfibre',
    899.00, 0.00, 50, 25,
    '["HD Streaming Ready", "Multiple Device Support", "Parental Controls", "Guest WiFi"]'::jsonb,
    true,
    99.5, 'extended', '12_hours',
    12, 'Balanced performance for modern family needs',
    'Modern families get balanced wireless performance perfect for streaming and work',
    'Modern families, streaming households',
    '["HD streaming capable", "Multi-device support", "Family controls", "Quick setup"]'::jsonb,
    true, '["FIXED_WIRELESS"]'::jsonb,
    true, 2, '["skyfibre", "residential", "family", "streaming"]'::jsonb
);

-- Insert Product Add-ons
INSERT INTO product_addons (
    name, description, price_monthly, price_setup, category,
    compatible_categories, compatible_technologies
) VALUES

-- Static IP Addresses
('Static IP Address', 'Single public IPv4 address for business applications', 99.00, 0.00, 'ip_address',
 '["smb", "enterprise"]'::jsonb, '["fibre", "fixed_wireless"]'::jsonb),

('IP Block /29', '5 usable public IP addresses for enterprise needs', 399.00, 0.00, 'ip_address',
 '["enterprise"]'::jsonb, '["fibre", "fixed_wireless"]'::jsonb),

-- Security Services
('Advanced Security Suite', 'Enhanced firewall protection and threat detection', 199.00, 0.00, 'security',
 '["smb", "enterprise"]'::jsonb, '["fibre", "fixed_wireless", "lte"]'::jsonb),

('Managed Security', 'Fully managed security service with 24/7 monitoring', 499.00, 299.00, 'security',
 '["enterprise"]'::jsonb, '["fibre", "fixed_wireless"]'::jsonb),

-- Support Services
('Priority Support', '2-hour SLA response time with dedicated team', 299.00, 0.00, 'support',
 '["smb", "enterprise"]'::jsonb, '["fibre", "fixed_wireless", "lte"]'::jsonb),

('Enterprise Support', '1-hour SLA with on-site support included', 599.00, 0.00, 'support',
 '["enterprise"]'::jsonb, '["fibre", "fixed_wireless"]'::jsonb),

-- Hardware Services
('Router Insurance', 'Hardware replacement coverage for included routers', 49.00, 0.00, 'hardware',
 '["residential", "smb", "enterprise"]'::jsonb, '["fibre", "fixed_wireless"]'::jsonb),

('Backup Connectivity', 'Automatic LTE/5G failover for business continuity', 299.00, 199.00, 'hardware',
 '["smb", "enterprise"]'::jsonb, '["fibre", "fixed_wireless"]'::jsonb);

-- Insert Product Bundles
INSERT INTO product_bundles (
    name, description, product_ids, addon_ids,
    price_monthly, discount_amount, target_category,
    marketing_title, marketing_savings_text
) VALUES

-- Business Connectivity Bundle
('Business Connectivity Bundle', 'Complete business solution with backup and security',
 '["bizfibre-connect-pro"]'::jsonb,
 '["static-ip-address", "advanced-security-suite", "backup-connectivity"]'::jsonb,
 3499.00, 398.00, 'smb',
 'Complete Business Solution', 'Save R398/month'),

-- Enterprise Premium Bundle
('Enterprise Premium Bundle', 'Full enterprise solution with managed services',
 '["skyfibre-smb-enterprise"]'::jsonb,
 '["ip-block-29", "managed-security", "enterprise-support"]'::jsonb,
 7999.00, 1497.00, 'enterprise',
 'Complete Enterprise Solution', 'Save R1,497/month'),

-- Home Worker Bundle
('Home Worker Bundle', 'Perfect for remote work with backup connectivity',
 '["homefibre-connect-plus"]'::jsonb,
 '["router-insurance", "backup-connectivity"]'::jsonb,
 999.00, 147.00, 'residential',
 'Perfect for Remote Work', 'Save R147/month');