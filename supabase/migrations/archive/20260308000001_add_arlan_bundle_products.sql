-- Migration: Add Arlan Bundle Products
-- Date: 2026-03-08
-- Description: Extends product category enum and adds Business Complete, Remote+, Venue+ bundles

-- Add new category values to admin_product_category enum
ALTER TYPE admin_product_category ADD VALUE IF NOT EXISTS 'bundle' AFTER 'fixed_wireless_residential';
ALTER TYPE admin_product_category ADD VALUE IF NOT EXISTS 'waas' AFTER 'bundle';
ALTER TYPE admin_product_category ADD VALUE IF NOT EXISTS 'soho' AFTER 'waas';

-- Get admin user ID for created_by reference
DO $$
DECLARE
    admin_user_id UUID;
    business_complete_essential_id UUID;
    business_complete_professional_id UUID;
    business_complete_enterprise_id UUID;
    remote_starter_id UUID;
    remote_plus_id UUID;
    remote_pro_id UUID;
    venue_retail_id UUID;
    venue_hospitality_id UUID;
    venue_campus_id UUID;
BEGIN
    -- Get admin user
    SELECT id INTO admin_user_id FROM admin_users WHERE email = 'admin@circletel.co.za' LIMIT 1;

    -- =====================================================
    -- BUSINESS COMPLETE BUNDLES (SME)
    -- =====================================================

    -- Business Complete Essential
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Business Complete Essential',
        'business-complete-essential',
        'bundle',
        'connectivity_bundle',
        'SkyFibre 50 Mbps + MTN 5G Backup for SMEs',
        'Complete business connectivity solution combining SkyFibre 50 Mbps fixed wireless with automatic MTN 5G failover. Ideal for small businesses requiring reliable, always-on connectivity.',
        50, 12, false, '{12,24}', 'draft',
        100, true, admin_user_id
    ) RETURNING id INTO business_complete_essential_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (business_complete_essential_id, 1798.00, 0.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (business_complete_essential_id, 'Primary Connection', 'SkyFibre Business 50 (50/12.5 Mbps)', 'connectivity', true, 1),
    (business_complete_essential_id, 'Backup Connection', 'MTN 5G Essential (35 Mbps, 500GB FUP)', 'connectivity', true, 2),
    (business_complete_essential_id, 'Static IP', 'Included', 'features', true, 3),
    (business_complete_essential_id, 'Failover', 'Automatic (<30 seconds)', 'features', true, 4),
    (business_complete_essential_id, 'Support', 'Mon-Fri 8am-5pm', 'support', false, 5);

    -- Business Complete Professional
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Business Complete Professional',
        'business-complete-professional',
        'bundle',
        'connectivity_bundle',
        'SkyFibre 100 Mbps + MTN 5G Backup + Voice for SMEs',
        'Professional business bundle with 100 Mbps primary connectivity, 5G failover, and MTN Business Voice. Perfect for growing businesses with 10-25 employees.',
        100, 25, false, '{12,24}', 'draft',
        101, true, admin_user_id
    ) RETURNING id INTO business_complete_professional_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (business_complete_professional_id, 2547.00, 0.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (business_complete_professional_id, 'Primary Connection', 'SkyFibre Business 100 (100/25 Mbps)', 'connectivity', true, 1),
    (business_complete_professional_id, 'Backup Connection', 'MTN 5G Essential (35 Mbps, 500GB FUP)', 'connectivity', true, 2),
    (business_complete_professional_id, 'Voice Line', 'MTN Business Voice Standard', 'voice', true, 3),
    (business_complete_professional_id, 'Static IP', 'Included', 'features', true, 4),
    (business_complete_professional_id, 'Failover', 'Automatic (<30 seconds)', 'features', true, 5),
    (business_complete_professional_id, 'Support', 'Mon-Sat 7am-7pm', 'support', false, 6);

    -- Business Complete Enterprise
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Business Complete Enterprise',
        'business-complete-enterprise',
        'bundle',
        'connectivity_bundle',
        'SkyFibre 200 Mbps + MTN 5G Enterprise + Premium Voice',
        'Enterprise-grade bundle with 200 Mbps primary, 5G Enterprise backup, and premium voice. Designed for businesses with 25-50 employees requiring maximum reliability.',
        200, 50, false, '{24,36}', 'draft',
        102, true, admin_user_id
    ) RETURNING id INTO business_complete_enterprise_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (business_complete_enterprise_id, 3822.00, 0.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (business_complete_enterprise_id, 'Primary Connection', 'SkyFibre Business 200 (200/50 Mbps)', 'connectivity', true, 1),
    (business_complete_enterprise_id, 'Backup Connection', 'MTN 5G Enterprise (100+ Mbps, 1.5TB FUP)', 'connectivity', true, 2),
    (business_complete_enterprise_id, 'Voice Line', 'MTN Business Voice Premium', 'voice', true, 3),
    (business_complete_enterprise_id, 'Static IP', 'Included', 'features', true, 4),
    (business_complete_enterprise_id, 'Failover', 'Automatic (<30 seconds)', 'features', true, 5),
    (business_complete_enterprise_id, 'SLA', '99.9% Uptime Guarantee', 'support', true, 6),
    (business_complete_enterprise_id, 'Support', '24/7 Priority Support', 'support', false, 7),
    (business_complete_enterprise_id, 'Account Manager', 'Named Account Manager', 'support', false, 8);

    -- =====================================================
    -- REMOTE+ BUNDLES (SOHO)
    -- =====================================================

    -- Remote+ Starter
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Remote+ Starter',
        'remote-plus-starter',
        'soho',
        'connectivity_bundle',
        'WorkConnect 50 Mbps + LTE Backup for Remote Workers',
        'Entry-level work-from-home solution with 50 Mbps primary connectivity and LTE backup. Perfect for freelancers and light remote work.',
        50, 25, false, '{12,24}', 'draft',
        200, false, admin_user_id
    ) RETURNING id INTO remote_starter_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (remote_starter_id, 968.00, 0.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (remote_starter_id, 'Primary Connection', 'WorkConnect Starter 50 Mbps', 'connectivity', true, 1),
    (remote_starter_id, 'Backup Connection', 'MTN LTE Data SIM (15GB)', 'connectivity', true, 2),
    (remote_starter_id, 'WiFi', 'WiFi 6 Router Included', 'features', false, 3),
    (remote_starter_id, 'Support', 'Mon-Sat 7am-7pm', 'support', false, 4);

    -- Remote+ Plus
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Remote+ Plus',
        'remote-plus-plus',
        'soho',
        'connectivity_bundle',
        'WorkConnect 100 Mbps + 5G Failover for Remote Workers',
        'Professional work-from-home solution with 100 Mbps primary and automatic 5G failover. Ideal for video conferencing and cloud-heavy work.',
        100, 50, false, '{12,24}', 'draft',
        201, true, admin_user_id
    ) RETURNING id INTO remote_plus_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (remote_plus_id, 1618.00, 0.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (remote_plus_id, 'Primary Connection', 'WorkConnect Plus 100 Mbps', 'connectivity', true, 1),
    (remote_plus_id, 'Backup Connection', 'MTN 5G Essential (35 Mbps, 500GB FUP)', 'connectivity', true, 2),
    (remote_plus_id, 'Failover', 'Automatic (<30 seconds)', 'features', true, 3),
    (remote_plus_id, 'WiFi', 'WiFi 6 Router Included', 'features', false, 4),
    (remote_plus_id, 'Support', 'Mon-Sat 7am-7pm', 'support', false, 5);

    -- Remote+ Pro
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Remote+ Pro',
        'remote-plus-pro',
        'soho',
        'connectivity_bundle',
        'WorkConnect 200 Mbps + 5G Failover + Voice for Power Users',
        'Premium work-from-home solution with 200 Mbps, 5G backup, and business voice line. Perfect for consultants and micro-business owners.',
        200, 100, false, '{12,24}', 'draft',
        202, true, admin_user_id
    ) RETURNING id INTO remote_pro_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (remote_pro_id, 2367.00, 0.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (remote_pro_id, 'Primary Connection', 'WorkConnect Pro 200 Mbps', 'connectivity', true, 1),
    (remote_pro_id, 'Backup Connection', 'MTN 5G Essential (35 Mbps, 500GB FUP)', 'connectivity', true, 2),
    (remote_pro_id, 'Voice Line', 'MTN Business Voice Starter', 'voice', true, 3),
    (remote_pro_id, 'Failover', 'Automatic (<30 seconds)', 'features', true, 4),
    (remote_pro_id, 'WiFi', 'WiFi 6 Router Included', 'features', false, 5),
    (remote_pro_id, 'Support', 'Mon-Sun 7am-9pm', 'support', false, 6);

    -- =====================================================
    -- VENUE+ BUNDLES (Commercial WiFi + IoT)
    -- =====================================================

    -- Venue+ Retail
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Venue+ Retail',
        'venue-plus-retail',
        'waas',
        'managed_wifi_bundle',
        'CloudWiFi Essential + 5 IoT SIMs for Small Venues',
        'Entry-level managed WiFi solution for retail spaces under 300m². Includes 1-2 APs, captive portal, and 5 IoT SIMs for POS backup.',
        1000, 1000, true, '{24,36}', 'draft',
        300, false, admin_user_id
    ) RETURNING id INTO venue_retail_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (venue_retail_id, 1999.00, 2500.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (venue_retail_id, 'WiFi Coverage', 'CloudWiFi Essential (1-2 APs, <300m²)', 'wifi', true, 1),
    (venue_retail_id, 'IoT SIMs', '5x MTN IoT SIMs for POS/sensors', 'iot', true, 2),
    (venue_retail_id, 'Captive Portal', 'Custom branded guest portal', 'features', true, 3),
    (venue_retail_id, 'Management', 'Ruijie Cloud (zero license)', 'features', false, 4),
    (venue_retail_id, 'Support', 'Mon-Fri 8am-5pm', 'support', false, 5);

    -- Venue+ Hospitality
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Venue+ Hospitality',
        'venue-plus-hospitality',
        'waas',
        'managed_wifi_bundle',
        'CloudWiFi Professional + 10 IoT SIMs for Hotels & Restaurants',
        'Professional managed WiFi for hospitality venues 300-800m². Includes 3-5 APs, guest analytics, and 10 IoT SIMs for sensors and monitoring.',
        1000, 1000, true, '{24,36}', 'draft',
        301, true, admin_user_id
    ) RETURNING id INTO venue_hospitality_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (venue_hospitality_id, 4499.00, 5000.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (venue_hospitality_id, 'WiFi Coverage', 'CloudWiFi Professional (3-5 APs, 300-800m²)', 'wifi', true, 1),
    (venue_hospitality_id, 'IoT SIMs', '10x MTN IoT SIMs for sensors', 'iot', true, 2),
    (venue_hospitality_id, 'Analytics', 'Guest analytics dashboard', 'features', true, 3),
    (venue_hospitality_id, 'Captive Portal', 'Custom branded guest portal', 'features', true, 4),
    (venue_hospitality_id, 'Management', 'Ruijie Cloud (zero license)', 'features', false, 5),
    (venue_hospitality_id, 'SLA', '99.5% Uptime', 'support', false, 6),
    (venue_hospitality_id, 'Support', 'Mon-Sat 7am-7pm', 'support', false, 7);

    -- Venue+ Campus
    INSERT INTO admin_products (
        id, name, slug, category, service_type, description, long_description,
        speed_down, speed_up, is_symmetrical, contract_terms, status,
        sort_order, is_featured, created_by
    ) VALUES (
        gen_random_uuid(),
        'Venue+ Campus',
        'venue-plus-campus',
        'waas',
        'managed_wifi_bundle',
        'CloudWiFi Enterprise + 25 IoT SIMs for Large Venues',
        'Enterprise managed WiFi for large venues 800-2000m². Includes 6-12 APs, enterprise analytics, and 25 IoT SIMs for comprehensive connectivity.',
        1000, 1000, true, '{36,48}', 'draft',
        302, true, admin_user_id
    ) RETURNING id INTO venue_campus_id;

    INSERT INTO admin_product_pricing (product_id, price_regular, installation_fee, approval_status)
    VALUES (venue_campus_id, 9999.00, 12500.00, 'approved');

    INSERT INTO admin_product_features (product_id, feature_name, feature_value, feature_category, is_highlighted, sort_order) VALUES
    (venue_campus_id, 'WiFi Coverage', 'CloudWiFi Enterprise (6-12 APs, 800-2000m²)', 'wifi', true, 1),
    (venue_campus_id, 'IoT SIMs', '25x MTN IoT SIMs (mixed use)', 'iot', true, 2),
    (venue_campus_id, 'Analytics', 'Enterprise analytics dashboard', 'features', true, 3),
    (venue_campus_id, 'Captive Portal', 'Custom branded + multi-SSID', 'features', true, 4),
    (venue_campus_id, 'Management', 'Ruijie Cloud (zero license)', 'features', false, 5),
    (venue_campus_id, 'SLA', '99.9% Uptime', 'support', true, 6),
    (venue_campus_id, 'Support', '24/7 Priority', 'support', false, 7),
    (venue_campus_id, 'Account Manager', 'Dedicated Account Manager', 'support', false, 8);

    -- =====================================================
    -- ADD-ON MODULES FOR BUNDLES
    -- =====================================================

    INSERT INTO admin_product_addons (name, description, price, is_monthly, applicable_categories) VALUES
    ('Fleet M2M SIM', 'Additional M2M SIM for vehicle tracking', 199.00, true, ARRAY['bundle']::admin_product_category[]),
    ('Additional Voice Line', 'Extra MTN business voice line', 349.00, true, ARRAY['bundle']::admin_product_category[]),
    ('IoT Sensor Pack', '5x IoT SIMs for sensors', 399.00, true, ARRAY['bundle']::admin_product_category[]),
    ('Static IP (Arlan)', 'MTN static IP address', 149.00, true, ARRAY['bundle', 'soho']::admin_product_category[]),
    ('Cloud Backup Boost', '+100GB cloud storage', 99.00, true, ARRAY['soho']::admin_product_category[]),
    ('Extra LTE SIM', 'Additional LTE data SIM', 199.00, true, ARRAY['soho']::admin_product_category[]),
    ('Microsoft 365 Basic', 'Office apps + 1TB OneDrive', 179.00, true, ARRAY['soho', 'bundle']::admin_product_category[]),
    ('Additional IoT SIM', 'Extra IoT SIM for sensors/POS', 79.00, true, ARRAY['waas']::admin_product_category[]),
    ('5G Venue Backup', '5G router for primary backup', 599.00, true, ARRAY['waas']::admin_product_category[]),
    ('Digital Signage VLAN', 'Isolated network for displays', 350.00, true, ARRAY['waas']::admin_product_category[]),
    ('Content Filtering', 'Web filtering for guest WiFi', 250.00, true, ARRAY['waas']::admin_product_category[]),
    ('Analytics Dashboard Pro', 'Advanced guest analytics', 500.00, true, ARRAY['waas']::admin_product_category[]);

    RAISE NOTICE 'Successfully created 9 bundle products and 12 add-on modules';
END $$;

-- Add comment for documentation
COMMENT ON TABLE admin_products IS 'CircleTel product catalogue including Arlan MTN bundles (Business Complete, Remote+, Venue+)';
