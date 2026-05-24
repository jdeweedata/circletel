-- Migration: Add missing service type mappings and products for licensed_wireless and SkyFibre
-- Date: 2025-10-19
-- Description: Adds mappings for licensed_wireless and creates SkyFibre and PMP product packages

-- ============================================================================
-- PART 1: Add Service Type Mappings
-- ============================================================================

-- Add licensed_wireless mapping to wireless category (for PMP products)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  ('licensed_wireless', 'mtn', 'wireless', 4, true, 'MTN Point-to-Multipoint Licensed Wireless (PMP Coverage Layer)')
ON CONFLICT DO NOTHING;

-- Add alternative mapping for licensed_wireless to SkyFibre (lower priority)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  ('licensed_wireless', 'mtn', 'SkyFibre', 5, true, 'Alternative mapping for licensed wireless to SkyFibre products')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 2: Add SkyFibre Product Packages
-- ============================================================================

-- SkyFibre packages (MTN Tarana G1 Fixed Wireless)
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  active
) VALUES
  -- SkyFibre Essential
  (
    'SkyFibre Essential 50Mbps',
    'SkyFibre',
    'SkyFibre',
    50,
    25,
    399,
    299,
    3,
    'Entry-level fixed wireless internet with excellent coverage',
    ARRAY[
      '50Mbps Download / 25Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'No installation required',
      'Router included',
      'Load shedding backup available',
      'Excellent rural coverage'
    ],
    true
  ),

  -- SkyFibre Standard
  (
    'SkyFibre Standard 100Mbps',
    'SkyFibre',
    'SkyFibre',
    100,
    50,
    599,
    449,
    3,
    'Fast fixed wireless for homes and small offices',
    ARRAY[
      '100Mbps Download / 50Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'No installation required',
      'Router included',
      'Load shedding backup available',
      'Priority support'
    ],
    true
  ),

  -- SkyFibre Premium
  (
    'SkyFibre Premium 200Mbps',
    'SkyFibre',
    'SkyFibre',
    200,
    100,
    899,
    699,
    3,
    'High-speed fixed wireless for demanding users',
    ARRAY[
      '200Mbps Download / 100Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'No installation required',
      'Router included',
      'Load shedding backup available',
      'Priority support',
      '24/7 technical support'
    ],
    true
  ),

  -- SkyFibre Business
  (
    'SkyFibre Business 200Mbps',
    'SkyFibre',
    'SkyFibre',
    200,
    200,
    1199,
    999,
    3,
    'Business-grade symmetric fixed wireless',
    ARRAY[
      '200Mbps Download / 200Mbps Upload (Symmetric)',
      'Uncapped Data',
      'Month-to-Month',
      'No installation required',
      'Business-grade router included',
      'Load shedding backup included',
      'Business SLA',
      '99.5% uptime guarantee',
      'Priority support',
      '24/7 technical support'
    ],
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 3: Add Point-to-Multipoint (PMP) Licensed Wireless Packages
-- ============================================================================

-- PMP packages (Licensed Wireless for rural/hard-to-reach areas)
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  active
) VALUES
  -- PMP Basic
  (
    'Wireless Connect Basic 10Mbps',
    'uncapped_wireless',
    'wireless',
    10,
    5,
    299,
    249,
    3,
    'Affordable licensed wireless for rural connectivity',
    ARRAY[
      '10Mbps Download / 5Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'Professional installation included',
      'Outdoor CPE included',
      'Licensed spectrum (interference-free)',
      'Excellent rural coverage',
      'Power backup compatible'
    ],
    true
  ),

  -- PMP Standard
  (
    'Wireless Connect Standard 25Mbps',
    'uncapped_wireless',
    'wireless',
    25,
    10,
    449,
    349,
    3,
    'Reliable licensed wireless for homes and small businesses',
    ARRAY[
      '25Mbps Download / 10Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'Professional installation included',
      'Outdoor CPE included',
      'Licensed spectrum (interference-free)',
      'Excellent rural coverage',
      'Power backup compatible',
      'Email support'
    ],
    true
  ),

  -- PMP Premium
  (
    'Wireless Connect Premium 50Mbps',
    'uncapped_wireless',
    'wireless',
    50,
    25,
    699,
    549,
    3,
    'High-speed licensed wireless for demanding applications',
    ARRAY[
      '50Mbps Download / 25Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'Professional installation included',
      'Outdoor CPE included',
      'Licensed spectrum (interference-free)',
      'Excellent rural coverage',
      'Power backup compatible',
      'Priority support',
      'Phone and email support'
    ],
    true
  ),

  -- PMP Business
  (
    'Wireless Connect Business 100Mbps',
    'uncapped_wireless',
    'wireless',
    100,
    50,
    1099,
    899,
    3,
    'Enterprise-grade licensed wireless connectivity',
    ARRAY[
      '100Mbps Download / 50Mbps Upload',
      'Uncapped Data',
      'Month-to-Month',
      'Professional installation included',
      'Business-grade outdoor CPE',
      'Licensed spectrum (interference-free)',
      'Excellent rural coverage',
      'Power backup included',
      'Business SLA',
      '99.5% uptime guarantee',
      'Priority support',
      '24/7 technical support'
    ],
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 4: Verification Queries (for testing)
-- ============================================================================

-- Verify service type mappings
-- SELECT * FROM service_type_mapping WHERE technical_type IN ('licensed_wireless', 'uncapped_wireless') ORDER BY priority;

-- Verify SkyFibre packages
-- SELECT name, product_category, speed_down, price, promotion_price FROM service_packages WHERE product_category = 'SkyFibre' ORDER BY price;

-- Verify PMP packages (Wireless Connect products)
-- SELECT name, product_category, speed_down, price, promotion_price FROM service_packages WHERE product_category = 'wireless' AND name LIKE 'Wireless Connect%' ORDER BY price;

-- Count packages by category
-- SELECT product_category, COUNT(*) as package_count FROM service_packages WHERE active = true GROUP BY product_category ORDER BY product_category;
