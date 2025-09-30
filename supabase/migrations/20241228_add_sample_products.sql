-- Migration: Add sample products for CircleTel
-- Date: 2024-12-28
-- Purpose: Populate products table with CircleTel service offerings

-- Clear existing products (if any) for clean state
TRUNCATE TABLE products CASCADE;

-- Insert Connectivity Products
INSERT INTO products (
  name,
  slug,
  category,
  service_type,
  description,
  features,
  pricing,
  requirements,
  status,
  is_featured,
  is_popular,
  metadata
) VALUES 
-- SkyFibre Products
(
  'SkyFibre 50',
  'skyfibre-50',
  'connectivity',
  'SkyFibre',
  'Wireless broadband solution with 50 Mbps download speed. Perfect for small businesses with quick deployment needs.',
  '["50 Mbps download speed", "25 Mbps upload speed", "No installation delays", "99.5% uptime SLA", "24/7 support", "Static IP included"]'::jsonb,
  '{"monthly": 899, "setup": 1500, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Line of sight to tower required", "Power backup recommended"]'::jsonb,
  'active',
  true,
  true,
  '{"installation_days": 3, "contract_months": 12}'::jsonb
),
(
  'SkyFibre 100',
  'skyfibre-100',
  'connectivity',
  'SkyFibre',
  'High-speed wireless broadband with 100 Mbps download. Ideal for growing businesses.',
  '["100 Mbps download speed", "50 Mbps upload speed", "No installation delays", "99.5% uptime SLA", "24/7 priority support", "Static IP included", "Free router"]'::jsonb,
  '{"monthly": 1499, "setup": 1500, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Line of sight to tower required", "Power backup recommended"]'::jsonb,
  'active',
  true,
  true,
  '{"installation_days": 3, "contract_months": 12}'::jsonb
),

-- HomeFibreConnect Products
(
  'HomeFibre 50/50',
  'homefibre-50',
  'connectivity',
  'HomeFibreConnect',
  'Symmetrical fibre connection perfect for remote work and small offices.',
  '["50 Mbps download", "50 Mbps upload", "Unlimited data", "99.9% uptime SLA", "Free installation", "WiFi 6 router included"]'::jsonb,
  '{"monthly": 799, "setup": 0, "currency": "ZAR", "vat_inclusive": true, "promotional_price": 599}'::jsonb,
  '["Fibre coverage required", "Building access for installation"]'::jsonb,
  'active',
  true,
  true,
  '{"installation_days": 5, "contract_months": 12, "promotion_ends": "2025-01-31"}'::jsonb
),
(
  'HomeFibre 100/100',
  'homefibre-100',
  'connectivity',
  'HomeFibreConnect',
  'Premium symmetrical fibre for demanding business applications.',
  '["100 Mbps download", "100 Mbps upload", "Unlimited data", "99.9% uptime SLA", "Free installation", "WiFi 6 router included", "Priority support"]'::jsonb,
  '{"monthly": 1199, "setup": 0, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Fibre coverage required", "Building access for installation"]'::jsonb,
  'active',
  true,
  false,
  '{"installation_days": 5, "contract_months": 12}'::jsonb
),

-- BizFibreConnect Products
(
  'BizFibre 100/100',
  'bizfibre-100',
  'connectivity',
  'BizFibreConnect',
  'Enterprise-grade fibre with business SLA and dedicated support.',
  '["100 Mbps symmetrical", "99.95% uptime SLA", "4-hour response time", "Dedicated account manager", "5 static IPs", "Business-grade router", "24/7 phone support"]'::jsonb,
  '{"monthly": 2499, "setup": 2500, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Business registration required", "Fibre coverage", "Credit check"]'::jsonb,
  'active',
  true,
  false,
  '{"installation_days": 7, "contract_months": 24, "sla_credits": true}'::jsonb
),
(
  'BizFibre 200/200',
  'bizfibre-200',
  'connectivity',
  'BizFibreConnect',
  'High-performance fibre for businesses with critical connectivity needs.',
  '["200 Mbps symmetrical", "99.95% uptime SLA", "2-hour response time", "Dedicated account manager", "8 static IPs", "Redundant routing", "Managed router", "24/7 priority support"]'::jsonb,
  '{"monthly": 3999, "setup": 2500, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Business registration required", "Fibre coverage", "Credit check"]'::jsonb,
  'active',
  true,
  true,
  '{"installation_days": 7, "contract_months": 24, "sla_credits": true}'::jsonb
),
(
  'BizFibre 500/500',
  'bizfibre-500',
  'connectivity',
  'BizFibreConnect',
  'Ultra-fast fibre for enterprises and data-intensive operations.',
  '["500 Mbps symmetrical", "99.99% uptime SLA", "1-hour response time", "Dedicated account manager", "16 static IPs", "Redundant routing", "Managed router", "24/7 VIP support", "Backup connection option"]'::jsonb,
  '{"monthly": 6999, "setup": 3500, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Business registration required", "Fibre coverage", "Credit approval", "Site survey required"]'::jsonb,
  'active',
  false,
  false,
  '{"installation_days": 10, "contract_months": 36, "sla_credits": true, "custom_sla": true}'::jsonb
),

-- IT Services
(
  'Managed IT Support - Essential',
  'managed-it-essential',
  'it_services',
  NULL,
  'Proactive IT support for small businesses. Keep your technology running smoothly.',
  '["Remote desktop support", "Help desk (business hours)", "Monthly health checks", "Software updates", "Basic cybersecurity", "5 users included"]'::jsonb,
  '{"monthly": 2999, "setup": 1500, "currency": "ZAR", "vat_inclusive": true, "per_additional_user": 299}'::jsonb,
  '["Windows 10/11 or Mac", "Internet connection", "Remote access software"]'::jsonb,
  'active',
  true,
  true,
  '{"response_time_hours": 4, "contract_months": 12}'::jsonb
),
(
  'Managed IT Support - Professional',
  'managed-it-professional',
  'it_services',
  NULL,
  'Comprehensive IT management for growing businesses.',
  '["24/7 remote support", "Dedicated technician", "Proactive monitoring", "Patch management", "Advanced cybersecurity", "Backup management", "15 users included", "Quarterly reviews"]'::jsonb,
  '{"monthly": 5999, "setup": 2500, "currency": "ZAR", "vat_inclusive": true, "per_additional_user": 199}'::jsonb,
  '["Business devices", "Internet connection", "Admin access"]'::jsonb,
  'active',
  true,
  false,
  '{"response_time_hours": 2, "contract_months": 12, "on_site_hours_included": 4}'::jsonb
),
(
  'Microsoft 365 Business Basic',
  'microsoft-365-basic',
  'it_services',
  NULL,
  'Cloud-based productivity suite with email and online apps.',
  '["Business email", "1TB OneDrive storage", "Teams", "Online Office apps", "SharePoint", "Exchange email"]'::jsonb,
  '{"monthly": 110, "setup": 0, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Per user license", "Internet connection"]'::jsonb,
  'active',
  true,
  true,
  '{"license_type": "per_user", "min_licenses": 1, "billing": "monthly"}'::jsonb
),
(
  'Microsoft 365 Business Standard',
  'microsoft-365-standard',
  'it_services',
  NULL,
  'Complete Office suite with desktop apps and cloud services.',
  '["Desktop Office apps", "Business email", "1TB OneDrive", "Teams", "SharePoint", "Exchange", "Intune", "Azure Information Protection"]'::jsonb,
  '{"monthly": 220, "setup": 0, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Per user license", "Windows 10/11 or Mac", "Internet connection"]'::jsonb,
  'active',
  true,
  true,
  '{"license_type": "per_user", "min_licenses": 1, "billing": "monthly"}'::jsonb
),
(
  'Cloud Backup - 1TB',
  'cloud-backup-1tb',
  'it_services',
  NULL,
  'Automated cloud backup solution for business data protection.',
  '["1TB storage", "Daily automated backups", "30-day retention", "File versioning", "Encrypted storage", "Quick restore", "Email notifications"]'::jsonb,
  '{"monthly": 599, "setup": 500, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Backup agent installation", "Internet connection"]'::jsonb,
  'active',
  false,
  true,
  '{"storage_gb": 1024, "retention_days": 30}'::jsonb
),

-- Bundles
(
  'CircleComplete Starter',
  'circle-complete-starter',
  'bundle',
  NULL,
  'Perfect bundle for small businesses. Connectivity + Essential IT support.',
  '["SkyFibre 50 or HomeFibre 50", "Managed IT Essential", "Microsoft 365 Basic (5 users)", "Cloud Backup 1TB", "Single invoice", "One support number", "20% bundle savings"]'::jsonb,
  '{"monthly": 4999, "setup": 2000, "currency": "ZAR", "vat_inclusive": true, "standard_price": 6297, "savings": 1298}'::jsonb,
  '["Coverage check required", "Business registration"]'::jsonb,
  'active',
  true,
  true,
  '{"bundle_components": ["skyfibre-50", "managed-it-essential", "microsoft-365-basic", "cloud-backup-1tb"], "min_users": 5, "contract_months": 12}'::jsonb
),
(
  'CircleComplete Business',
  'circle-complete-business',
  'bundle',
  NULL,
  'Comprehensive solution for growing businesses. Premium connectivity + Professional IT.',
  '["BizFibre 100 or SkyFibre 100", "Managed IT Professional", "Microsoft 365 Standard (15 users)", "Cloud Backup 5TB", "Priority support", "Quarterly business reviews", "25% bundle savings"]'::jsonb,
  '{"monthly": 9999, "setup": 3000, "currency": "ZAR", "vat_inclusive": true, "standard_price": 13298, "savings": 3299}'::jsonb,
  '["Coverage check required", "Business registration", "Credit check"]'::jsonb,
  'active',
  true,
  false,
  '{"bundle_components": ["bizfibre-100", "managed-it-professional", "microsoft-365-standard", "cloud-backup-5tb"], "min_users": 15, "contract_months": 24}'::jsonb
),
(
  'CircleComplete Enterprise',
  'circle-complete-enterprise',
  'bundle',
  NULL,
  'Enterprise-grade bundle with maximum performance and support.',
  '["BizFibre 200 or 500", "Managed IT Enterprise", "Microsoft 365 E3", "Unlimited backup", "Cybersecurity suite", "24/7 VIP support", "Dedicated account team", "30% bundle savings"]'::jsonb,
  '{"monthly": 19999, "setup": 5000, "currency": "ZAR", "vat_inclusive": true, "standard_price": 28570, "savings": 8571}'::jsonb,
  '["Site survey", "Enterprise agreement", "Custom SLA"]'::jsonb,
  'active',
  false,
  false,
  '{"bundle_components": ["bizfibre-200", "managed-it-enterprise", "microsoft-365-e3", "cloud-backup-unlimited"], "custom_config": true, "contract_months": 36}'::jsonb
),

-- Add-ons
(
  'Static IP Address',
  'static-ip',
  'add_on',
  NULL,
  'Additional static IP address for servers or services.',
  '["1 static IPv4 address", "Reverse DNS setup", "Same-day activation"]'::jsonb,
  '{"monthly": 99, "setup": 0, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Active connectivity service"]'::jsonb,
  'active',
  false,
  false,
  '{"addon_type": "connectivity", "instant_activation": true}'::jsonb
),
(
  'Email Security Pro',
  'email-security-pro',
  'add_on',
  NULL,
  'Advanced email protection against spam, viruses, and phishing.',
  '["Spam filtering", "Virus scanning", "Phishing protection", "Email encryption", "Attachment sandboxing", "Detailed reports"]'::jsonb,
  '{"monthly": 49, "setup": 0, "currency": "ZAR", "vat_inclusive": true}'::jsonb,
  '["Microsoft 365 or email service", "Per mailbox"]'::jsonb,
  'active',
  false,
  true,
  '{"addon_type": "security", "per_user": true}'::jsonb
);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_service_type ON products(service_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Add a promotions table if it doesn't exist
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'bundle')),
  discount_value DECIMAL(10,2),
  promo_code TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  product_ids TEXT[], -- Array of product slugs this promotion applies to
  min_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sample promotion
INSERT INTO promotions (
  name,
  description,
  discount_type,
  discount_value,
  promo_code,
  valid_until,
  product_ids
) VALUES (
  'Summer Fibre Special',
  'Get 25% off your first 3 months on any HomeFibre package',
  'percentage',
  25,
  'SUMMER25',
  '2025-02-28'::timestamptz,
  ARRAY['homefibre-50', 'homefibre-100']
);
