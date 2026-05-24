-- Migration: Update SkyFibre packages from old wireless to new MTN Tarana specifications
-- Document: skyfibre-residential-product-doc-v7.md
-- Date: 2025-10-15

-- Description: This migration updates SkyFibre packages to align with MTN Tarana Fixed Wireless
-- technology based on the official SkyFibre Residential Product Document v7.

BEGIN;

-- Step 1: Update technology classification and provider for SkyFibre products
UPDATE service_packages 
SET 
  technology_type = 'Fixed Wireless - Tarana G1',
  provider = 'MTN Wholesale',
  service_type = 'SkyFibre'  -- Keep service_type for backwards compatibility
WHERE service_type = 'SkyFibre';

-- Step 2: Update SkyFibre Starter to Tarana specifications (50/50 Mbps @ R799)
UPDATE service_packages 
SET 
  download_speed = 50,
  upload_speed = 50,
  price = 799,
  promotion_price = NULL,  -- No promotion currently mentioned in document
  promotion_months = NULL,
  cost_wholesale = 499,      -- Wholesale cost from document
  description = 'SkyFibre Starter - MTN Tarana Fixed Wireless perfect for basic internet needs with fiber-equivalent performance',
  features = ARRAY[
    'MTN Tarana G1 Beamforming Technology',
    '50 Mbps Download / 50 Mbps Upload (Symmetrical)',
    'Sub-5ms Latency for Gaming & Video Calls',
    'Professional Installation (15-minute setup)',
    'Package-Specific Router (Reyee RG-EW1200)',
    'FREE Ruijie Cloud Management',
    'Mobile App Control (Reyee Router App)',
    'Zero-Touch Provisioning',
    'Load-Shedding Resilient',
    '30-Day Satisfaction Guarantee',
    'Month-to-Month Contract',
    '24/7 Technical Support',
    'Weather-Proof Wireless Technology',
    '99.5% Uptime SLA'
  ],
  metadata = jsonb_build_object(
    'technology', 'Tarana G1',
    'latency', '< 5ms',
    'packet_loss', '< 0.1%',
    'weather_resistance', 'Superior',
    'installation_time', '15 minutes',
    'router_model', 'Reyee RG-EW1200',
    'router_value', 395,
    'router_specs', jsonb_build_object(
      'wifi_standard', '802.11ac Wave 2 (WiFi 5)',
      'wifi_speed', '1200 Mbps combined',
      'ports', '4x Fast Ethernet (100 Mbps)',
      'concurrent_devices', 'Up to 64',
      'antennas', '4x 5dBi omnidirectional'
    ),
    'wholesale_cost', 499,
    'margin_percentage', 37.5,
    'coverage_reach', '6 million homes nationally',
    'installation_cost', 2550,
    'promotional_installation', 900
  )
WHERE name = 'SkyFibre Starter';

-- Step 3: Update SkyFibre Essential to SkyFibre Plus (100/100 Mbps @ R899)
UPDATE service_packages 
SET 
  name = 'SkyFibre Plus',
  download_speed = 100,
  upload_speed = 100,
  price = 899,
  promotion_price = NULL,      -- No promotion currently mentioned in document
  promotion_months = NULL,
  cost_wholesale = 599,        -- Wholesale cost from document
  description = 'SkyFibre Plus - MTN Tarana Fixed Wireless for streaming and home office with superior performance',
  features = ARRAY[
    'MTN Tarana G1 Beamforming Technology',
    '100 Mbps Download / 100 Mbps Upload (Symmetrical)',
    'Sub-5ms Latency for Gaming & Video Calls',
    'Professional Installation (15-minute setup)',
    'Package-Specific Router (Reyee RG-EW1300G)',
    'FREE Ruijie Cloud Management',
    'Mobile App Control (Reyee Router App)',
    'Zero-Touch Provisioning',
    'Advanced Mesh Capabilities',
    'MU-MIMO Technology',
    'Load-Shedding Resilient',
    'Seamless Roaming',
    'VPN Support',
    '30-Day Satisfaction Guarantee',
    'Month-to-Month Contract',
    '24/7 Technical Support',
    'Weather-Proof Wireless Technology',
    '99.5% Uptime SLA'
  ],
  metadata = jsonb_build_object(
    'technology', 'Tarana G1',
    'latency', '< 5ms',
    'packet_loss', '< 0.1%',
    'weather_resistance', 'Superior',
    'installation_time', '15 minutes',
    'router_model', 'Reyee RG-EW1300G',
    'router_value', 595,
    'router_specs', jsonb_build_object(
      'wifi_standard', '802.11ac Wave 2 (WiFi 5)',
      'wifi_speed', '1300 Mbps combined',
      'ports', '4x Gigabit Ethernet (1000 Mbps)',
      'concurrent_devices', 'Up to 96',
      'antennas', '5x 6dBi high-gain',
      'mesh_support', 'Advanced mesh',
      'mu_mimo', 'Yes',
      'vpn_support', 'Yes'
    ),
    'wholesale_cost', 599,
    'margin_percentage', 33.4,
    'coverage_reach', '6 million homes nationally',
    'installation_cost', 2550,
    'promotional_installation', 900
  )
WHERE name = 'SkyFibre Essential';

-- Step 4: Update SkyFibre Pro to Tarana specifications (200/200 Mbps @ R1,099)
UPDATE service_packages 
SET 
  download_speed = 200,
  upload_speed = 200,
  price = 1099,
  promotion_price = NULL,      -- No promotion currently mentioned in document
  promotion_months = NULL,
  cost_wholesale = 699,        -- Wholesale cost from document
  description = 'SkyFibre Pro - MTN Tarana Fixed Wireless premium package for power users and large families',
  features = ARRAY[
    'MTN Tarana G1 Beamforming Technology',
    '200 Mbps Download / 200 Mbps Upload (Symmetrical)',
    'Sub-5ms Latency for Competitive Gaming & 4K Streaming',
    'Professional Installation (15-minute setup)',
    'Package-Specific Router (Reyee RG-EW3000GX)',
    'FREE Ruijie Cloud Management',
    'Mobile App Control (Reyee Router App)',
    'Zero-Touch Provisioning',
    'WiFi 6 Technology (802.11ax)',
    '4x4 MU-MIMO with OFDMA',
    'Dual-WAN Support',
    'Advanced QoS',
    'Load-Shedding Resilient',
    'Static IP Option Available',
    '30-Day Satisfaction Guarantee',
    'Month-to-Month Contract',
    '24/7 Technical Support',
    'Weather-Proof Wireless Technology',
    '99.5% Uptime SLA'
  ],
  metadata = jsonb_build_object(
    'technology', 'Tarana G1',
    'latency', '< 5ms',
    'packet_loss', '< 0.1%',
    'weather_resistance', 'Superior',
    'installation_time', '15 minutes',
    'router_model', 'Reyee RG-EW3000GX',
    'router_value', 875,
    'router_specs', jsonb_build_object(
      'wifi_standard', '802.11ax (WiFi 6)',
      'wifi_speed', '3000 Mbps combined',
      'ports', '4x Gigabit Ethernet',
      'concurrent_devices', 'Up to 128',
      'antennas', '6x 6dBi high-gain',
      'wifi_6_features', 'OFDMA, 4x4 MU-MIMO',
      'dual_wan', 'Yes',
      'advanced_qos', 'Yes'
    ),
    'wholesale_cost', 699,
    'margin_percentage', 36.4,
    'coverage_reach', '6 million homes nationally',
    'installation_cost', 2550,
    'promotional_installation', 900,
    'static_ip_available', true,
    'static_ip_cost', 99
  )
WHERE name = 'SkyFibre Pro';

-- Step 5: Update product category mapping to reflect Fixed Wireless nature
UPDATE service_type_mapping 
SET 
  product_category = 'wireless',
  description = 'MTN Tarana Fixed Wireless G1 technology - branded as SkyFibre',
  wholesale_provider = 'MTN Wholesale',
  technology_stack = 'Tarana G1 Beamforming Fixed Wireless Access',
  key_features = ARRAY[
    'Licensed Spectrum',
    'Beamforming Technology', 
    'Sub-5ms Latency',
    'Weather Resistant',
    'Professional Installation',
    'Package-Specific Routers',
    'Cloud Management',
    'Zero-Touch Provisioning'
  ]
WHERE service_type = 'SkyFibre';

-- Step 6: Add service packages for tracking installation and equipment costs
INSERT INTO service_packages (name, service_type, download_speed, upload_speed, price, promotion_price, cost_wholesale, description, features, sort_order) VALUES
-- Installation Service
('SkyFibre Professional Installation', 'SkyFibre', 0, 0, 2550, 900, 2000, 
 'Professional installation and setup of MTN Tarana RN device and router package',
 ARRAY[
   '15-minute installation time',
   'Professional site survey',
   'Mounting of Tarana RN device',
   'Cable routing and connections',
   'Router setup and provisioning',
   'Speed testing and optimization',
   'Customer WiFi setup',
   'QR code provisioning',
   'Load-shedding verification'
 ], 10),

-- Static IP Option
('SkyFibre Static IP', 'SkyFibre', 0, 0, 99, NULL, 0,
 'Static IP address option for SkyFibre customers requiring dedicated IP',
 ARRAY[
   'Dedicated static IP address',
   'No additional port forwarding required',
   'Ideal for servers and business use',
   'Compatible with all SkyFibre packages',
   '24/7 monitoring included'
 ], 11)

ON CONFLICT (name, service_type) DO NOTHING;

-- Step 7: Update coverage areas to reflect Tarana network coverage
UPDATE coverage_areas 
SET 
  description = 'MTN Tarana Fixed Wireless coverage area - 6 million homes nationally',
  activation_days = 3,  -- Target 3-day installation from document
  metadata = jsonb_build_object(
    'technology', 'Tarana G1',
    'coverage_homes', '6 million',
    'quality_score', 95,
    'weather_resistance', 'Excellent',
    'load_shedding_proof', true
  )
WHERE service_type = 'SkyFibre';

COMMIT;

-- Notes for review:
-- 1. Current pricing assumes VAT is added at frontend level (prices shown are excl VAT as per database convention)
-- 2. Installation costs follow document: Standard R2,550, Launch Special R900
-- 3. Router models updated to Reyee brand as specified in document
-- 4. All packages now feature symmetrical speeds (up/down)
-- 5. Latency specifications added for all packages (< 5ms)
-- 6. Package-specific router approach implemented
-- 7. Cloud management and mobile app features emphasized
