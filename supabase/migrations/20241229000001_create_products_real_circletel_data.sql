-- Migration: Create Products with Real CircleTel Data
-- Date: 2024-12-29
-- Purpose: Support Product Catalog System with actual CircleTel products
-- Based on: CircleTel product documentation from docs/products/

-- Create product categories enum
CREATE TYPE product_category AS ENUM ('connectivity', 'it_services', 'bundle', 'add_on');

-- Create service type enum (matching coverage system)
CREATE TYPE service_type AS ENUM ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'IT_Support', 'Cloud_Services');

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category product_category NOT NULL,
  service_type service_type,
  description TEXT,
  short_description TEXT,

  -- Pricing information
  monthly_price DECIMAL(10, 2) NOT NULL,
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  vat_inclusive BOOLEAN DEFAULT true,

  -- Speed information (for connectivity products)
  download_speed INTEGER, -- in Mbps
  upload_speed INTEGER, -- in Mbps

  -- Features and specifications
  features JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '[]',

  -- Bundle information
  is_bundle BOOLEAN DEFAULT false,
  bundle_components TEXT[] DEFAULT '{}',
  bundle_savings DECIMAL(10, 2) DEFAULT 0,

  -- Availability and status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  availability_zones TEXT[] DEFAULT '{}',
  min_contract_months INTEGER DEFAULT 12,

  -- SEO and marketing
  meta_title TEXT,
  meta_description TEXT,
  image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',

  -- Sorting and display
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_months')),
  discount_value DECIMAL(10, 2) NOT NULL,
  promo_code TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_comparisons table for comparison feature
CREATE TABLE IF NOT EXISTS product_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_service_type ON products(service_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_popular ON products(is_popular) WHERE is_popular = true;
CREATE INDEX idx_promotions_product_id ON promotions(product_id);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_valid_dates ON promotions(valid_from, valid_until);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert real CircleTel products based on documentation
INSERT INTO products (name, slug, category, service_type, description, short_description,
  monthly_price, setup_fee, download_speed, upload_speed, features, is_featured, is_popular,
  sort_order, min_contract_months, availability_zones)
VALUES
  -- SkyFibre Product Line (Fixed Wireless Access)
  ('SkyFibre Essential', 'skyfibre-essential', 'connectivity', 'SkyFibre',
   'Primary launch product - affordable Fixed Wireless Access for businesses. MTN Tarana G1 infrastructure with 10/10 Mbps uncapped data.',
   'Essential business internet via fixed wireless',
   1299.00, 1999.00, 10, 10,
   '["Uncapped data", "Month-to-month contract", "24/7 support", "MTN Tarana G1 network", "Quick setup 24-48 hours", "Dedicated business line"]',
   true, true, 1, 1,
   '["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein"]'),

  ('SkyFibre SME 50', 'skyfibre-sme-50', 'connectivity', 'SkyFibre',
   'Small to medium business Fixed Wireless Access solution. 50 Mbps uncapped for growing businesses without fibre access.',
   'SME wireless internet - 50 Mbps',
   749.00, 2500.00, 50, 25,
   '["Uncapped data", "Business-grade service", "24/7 technical support", "MTN network", "Self-install option", "SLA included"]',
   false, true, 2, 12,
   '["Johannesburg", "Cape Town", "Pretoria", "Centurion", "Sandton", "Randburg"]'),

  ('SkyFibre SME 100', 'skyfibre-sme-100', 'connectivity', 'SkyFibre',
   'Advanced SME Fixed Wireless Access with 100 Mbps speeds. Perfect for businesses with higher bandwidth requirements.',
   'SME wireless internet - 100 Mbps',
   999.00, 2500.00, 100, 50,
   '["Uncapped data", "Higher bandwidth", "Business priority support", "MTN Tarana network", "Professional installation", "99.5% uptime SLA"]',
   true, false, 3, 12,
   '["Johannesburg", "Cape Town", "Pretoria", "Durban", "Centurion"]'),

  ('SkyFibre SME 200', 'skyfibre-sme-200', 'connectivity', 'SkyFibre',
   'Premium SME Fixed Wireless Access with 200 Mbps speeds. Enterprise-level performance for demanding businesses.',
   'Premium SME wireless - 200 Mbps',
   1249.00, 3500.00, 200, 100,
   '["Uncapped data", "Enterprise performance", "Priority technical support", "Dedicated account manager", "99.5% uptime SLA", "Professional installation"]',
   false, false, 4, 12,
   '["Johannesburg", "Cape Town", "Pretoria", "Sandton"]'),

  -- BizFibre Connect Product Line (DFA Wholesale Fibre)
  ('BizFibre Connect Lite', 'bizfibre-connect-lite', 'connectivity', 'BizFibreConnect',
   'Enterprise-grade fibre connectivity for micro businesses. DFA wholesale infrastructure with Reyee cloud-managed router included.',
   'Business fibre - 10/10 Mbps',
   1699.00, 0.00, 10, 10,
   '["Symmetrical speeds", "99.5% uptime SLA", "Enterprise router included", "Professional installation", "24/7 local support", "Low contention 1:10"]',
   false, true, 5, 24,
   '["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"]'),

  ('BizFibre Connect Starter', 'bizfibre-connect-starter', 'connectivity', 'BizFibreConnect',
   'Small office fibre solution with 25 Mbps symmetrical speeds. Includes enterprise-grade Reyee router with cloud management.',
   'Small office fibre - 25/25 Mbps',
   1899.00, 500.00, 25, 25,
   '["Symmetrical speeds", "Enterprise router with cloud management", "99.5% uptime SLA", "Professional installation", "Free lifetime cloud access", "Service credits"]',
   true, false, 6, 24,
   '["Johannesburg", "Cape Town", "Durban", "Pretoria"]'),

  ('BizFibre Connect Plus', 'bizfibre-connect-plus', 'connectivity', 'BizFibreConnect',
   'Growing SME fibre solution with 50 Mbps symmetrical speeds. Perfect for multi-user offices with cloud applications.',
   'Growing SME fibre - 50/50 Mbps',
   2499.00, 500.00, 50, 50,
   '["Symmetrical 50 Mbps", "Enterprise-grade router", "99.5% uptime SLA", "Priority support", "Cloud management included", "Multi-user optimization"]',
   false, true, 7, 24,
   '["Johannesburg", "Cape Town", "Durban", "Pretoria", "Centurion"]'),

  ('BizFibre Connect Pro', 'bizfibre-connect-pro', 'connectivity', 'BizFibreConnect',
   'Medium business fibre with 100 Mbps symmetrical speeds. Ideal for heavy cloud usage and video conferencing.',
   'Medium business fibre - 100/100 Mbps',
   2999.00, 0.00, 100, 100,
   '["Symmetrical 100 Mbps", "Premium router rental available", "99.5% uptime SLA", "Priority technical support", "Heavy cloud usage optimized", "Video conferencing ready"]',
   true, false, 8, 24,
   '["Johannesburg", "Cape Town", "Durban", "Pretoria"]'),

  ('BizFibre Connect Ultra', 'bizfibre-connect-ultra', 'connectivity', 'BizFibreConnect',
   'Large office fibre with 200 Mbps symmetrical speeds. Mission-critical operations with enterprise-grade service levels.',
   'Large office fibre - 200/200 Mbps',
   4373.00, 0.00, 200, 200,
   '["Symmetrical 200 Mbps", "Enterprise router rental", "99.5% uptime SLA", "Dedicated account manager", "Mission-critical support", "Service credits included"]',
   false, false, 9, 24,
   '["Johannesburg", "Cape Town", "Durban", "Pretoria"]'),

  -- HomeFibre Connect (Consumer Fibre) - Coming Soon
  ('HomeFibre Connect 50', 'homefibre-connect-50', 'connectivity', 'HomeFibreConnect',
   'Consumer fibre internet for homes and home offices. Reliable 50 Mbps symmetrical speeds with family-friendly features.',
   'Home fibre internet - 50/50 Mbps',
   599.00, 1999.00, 50, 50,
   '["Symmetrical speeds", "Family-friendly", "Home office ready", "Easy installation", "Consumer support", "Parental controls"]',
   false, false, 10, 12,
   '["Johannesburg", "Cape Town", "Pretoria"]'),

  ('HomeFibre Connect 100', 'homefibre-connect-100', 'connectivity', 'HomeFibreConnect',
   'Premium home fibre with 100 Mbps speeds. Perfect for large families and home-based businesses.',
   'Premium home fibre - 100/100 Mbps',
   899.00, 1999.00, 100, 100,
   '["Symmetrical 100 Mbps", "Large family support", "Home business ready", "Gaming optimized", "Streaming optimized", "Wi-Fi 6 router"]',
   false, true, 11, 12,
   '["Johannesburg", "Cape Town", "Pretoria", "Centurion"]'),

  -- IT Services
  ('Microsoft 365 Business Standard', 'microsoft-365-business-standard', 'it_services', 'Cloud_Services',
   'Complete Microsoft 365 suite for businesses. Includes Office apps, Exchange email, Teams, SharePoint, and OneDrive with 1TB storage.',
   'Microsoft 365 for business teams',
   329.00, 0.00, null, null,
   '["Office apps (Word, Excel, PowerPoint)", "Outlook email hosting", "Microsoft Teams", "1TB OneDrive storage", "SharePoint collaboration", "Mobile apps included"]',
   true, true, 12, 12,
   '["National", "All Regions"]'),

  ('Basic IT Support', 'basic-it-support', 'it_services', 'IT_Support',
   'Essential IT support for small businesses. Remote assistance, email support, and basic security monitoring during business hours.',
   'Remote IT support for small business',
   999.00, 0.00, null, null,
   '["Remote desktop support", "Email/phone support", "Basic security monitoring", "Monthly system health check", "Business hours support 8AM-5PM", "Incident response"]',
   false, true, 13, 12,
   '["National", "All Regions"]'),

  ('Professional IT Support', 'professional-it-support', 'it_services', 'IT_Support',
   'Comprehensive IT support with proactive monitoring and 24/7 availability. Includes security management and monthly reviews.',
   'Professional 24/7 IT support',
   2499.00, 999.00, null, null,
   '["24/7 proactive monitoring", "Priority support response", "Security management", "Backup monitoring", "Monthly business reviews", "Patch management"]',
   true, false, 14, 12,
   '["National", "All Regions"]'),

  -- Managed Services (Coming Soon)
  ('SmartBranch LTE Backup', 'smartbranch-lte-backup', 'add_on', 'IT_Support',
   'Automatic LTE backup solution for business continuity. Seamless failover when primary connection fails.',
   'Automatic LTE backup for business',
   499.00, 999.00, 25, 5,
   '["Automatic failover", "Business continuity", "4G/LTE backup", "Seamless switching", "Uptime monitoring", "Professional installation"]',
   false, false, 15, 12,
   '["Johannesburg", "Cape Town", "Pretoria", "Durban"]'),

  -- Bundle Products
  ('CircleComplete Starter', 'circle-complete-starter', 'bundle', null,
   'Perfect bundle for small businesses combining SkyFibre Essential connectivity, Microsoft 365, and Basic IT Support.',
   'Complete small business solution',
   2199.00, 1999.00, 10, 10,
   '["SkyFibre Essential 10/10 Mbps", "Microsoft 365 Business Standard", "Basic IT Support", "Save R428/month", "Single monthly bill", "Unified support"]',
   true, true, 16, 12,
   '["Johannesburg", "Cape Town", "Pretoria", "Durban"]'),

  ('CircleComplete Business', 'circle-complete-business', 'bundle', null,
   'Comprehensive solution for growing businesses. BizFibre Connect Plus with professional IT support and Microsoft 365.',
   'Complete growing business solution',
   4499.00, 999.00, 50, 50,
   '["BizFibre Connect Plus 50/50 Mbps", "Microsoft 365 Business Standard", "Professional IT Support", "Save R827/month", "Dedicated account manager", "Priority support"]',
   true, false, 17, 24,
   '["Johannesburg", "Cape Town", "Pretoria", "Durban"]);

-- Insert sample promotions for MVP launch
INSERT INTO promotions (product_id, name, description, discount_type, discount_value, promo_code, valid_until)
SELECT
  id,
  'MVP Launch Special',
  'Limited time launch pricing for first 25 customers',
  'percentage',
  15,
  'LAUNCH15',
  '2025-01-31'::timestamptz
FROM products
WHERE slug IN ('skyfibre-essential', 'circle-complete-starter');

-- Insert bundle savings promotions
INSERT INTO promotions (product_id, name, description, discount_type, discount_value, promo_code, valid_until)
SELECT
  id,
  'Bundle Savings',
  'Save when you combine multiple services',
  'fixed',
  428.00,
  'BUNDLESAVE',
  '2025-12-31'::timestamptz
FROM products
WHERE slug = 'circle-complete-starter';

INSERT INTO promotions (product_id, name, description, discount_type, discount_value, promo_code, valid_until)
SELECT
  id,
  'Business Bundle Savings',
  'Professional bundle discount for growing businesses',
  'fixed',
  827.00,
  'BIZSAVE',
  '2025-12-31'::timestamptz
FROM products
WHERE slug = 'circle-complete-business';

-- Insert free installation promotion
INSERT INTO promotions (product_id, name, description, discount_type, discount_value, promo_code, valid_until)
SELECT
  id,
  'Free Installation',
  'Free installation for new BizFibre Connect customers',
  'fixed',
  500.00,
  'FREEINSTALL',
  '2025-03-31'::timestamptz
FROM products
WHERE service_type = 'BizFibreConnect' AND setup_fee > 0;