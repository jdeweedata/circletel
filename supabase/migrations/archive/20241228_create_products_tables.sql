-- Migration: Create Products and Related Tables for CJF-001-02
-- Date: 2024-12-28
-- Purpose: Support Product Catalog System

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

-- Ensure columns exist if table was already created without them
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bundle_components TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS bundle_savings DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_speed INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS upload_speed INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_inclusive BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR';
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_zones TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_contract_months INTEGER DEFAULT 12;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deal_id TEXT;
ALTER TABLE products ALTER COLUMN deal_id DROP NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS provider TEXT;

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
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_service_type ON products(service_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_valid_dates ON promotions(valid_from, valid_until);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products data
INSERT INTO products (name, slug, category, service_type, description, short_description, 
  monthly_price, setup_fee, download_speed, upload_speed, features, is_featured, is_popular, sort_order)
VALUES
  -- Connectivity Products
  ('SkyFibre 50', 'skyfibre-50', 'connectivity', 'SkyFibre', 
   'Reliable wireless broadband with 50Mbps download speed. Perfect for small offices and remote workers.',
   'Wireless broadband - 50Mbps',
   599.00, 1499.00, 50, 25,
   '["Wireless technology", "Quick installation", "No cable required", "Unlimited data", "24/7 support"]',
   false, true, 1),
   
  ('SkyFibre 100', 'skyfibre-100', 'connectivity', 'SkyFibre',
   'High-speed wireless broadband with 100Mbps download speed. Ideal for growing businesses.',
   'Wireless broadband - 100Mbps',
   899.00, 1499.00, 100, 50,
   '["Wireless technology", "Quick installation", "No cable required", "Unlimited data", "24/7 support", "Priority support"]',
   true, true, 2),
   
  ('HomeFibre 100', 'homefibre-100', 'connectivity', 'HomeFibreConnect',
   'Premium fibre connection for residential and home offices. Ultra-reliable with 100Mbps speeds.',
   'Fibre to the home - 100Mbps',
   799.00, 1999.00, 100, 100,
   '["True fibre connection", "Symmetrical speeds", "Ultra-low latency", "Unlimited data", "Free router included"]',
   true, false, 3),
   
  ('HomeFibre 200', 'homefibre-200', 'connectivity', 'HomeFibreConnect',
   'Premium fibre connection with blazing fast 200Mbps speeds. Perfect for power users.',
   'Fibre to the home - 200Mbps',
   1099.00, 1999.00, 200, 200,
   '["True fibre connection", "Symmetrical speeds", "Ultra-low latency", "Unlimited data", "Premium router included", "Priority support"]',
   false, false, 4),
   
  ('BizFibre 200', 'bizfibre-200', 'connectivity', 'BizFibreConnect',
   'Enterprise-grade fibre for businesses. Guaranteed uptime with SLA.',
   'Business fibre - 200Mbps',
   2499.00, 2999.00, 200, 200,
   '["99.9% uptime SLA", "Dedicated support", "Symmetrical speeds", "Static IP included", "Unlimited data", "Same-day support"]',
   true, true, 5),
   
  ('BizFibre 500', 'bizfibre-500', 'connectivity', 'BizFibreConnect',
   'Premium business fibre with 500Mbps speeds. For businesses that need the best.',
   'Business fibre - 500Mbps',
   4999.00, 2999.00, 500, 500,
   '["99.9% uptime SLA", "Dedicated account manager", "Symmetrical speeds", "Multiple static IPs", "Unlimited data", "4-hour response time"]',
   false, false, 6),
   
  -- IT Services Products
  ('Basic IT Support', 'basic-it-support', 'it_services', 'IT_Support',
   'Essential IT support for small businesses. Remote assistance and basic maintenance.',
   'Remote IT support package',
   1299.00, 0.00, null, null,
   '["Remote desktop support", "Email support", "Basic security monitoring", "Monthly health check", "Business hours support"]',
   false, true, 7),
   
  ('Pro IT Support', 'pro-it-support', 'it_services', 'IT_Support',
   'Comprehensive IT support with proactive monitoring and priority response.',
   'Advanced IT support package',
   2999.00, 999.00, null, null,
   '["24/7 monitoring", "Proactive maintenance", "Priority support", "Quarterly reviews", "Security updates", "Backup management"]',
   true, false, 8),
   
  ('Microsoft 365 Business', 'microsoft-365-business', 'it_services', 'Cloud_Services',
   'Complete Microsoft 365 suite for businesses. Email, Office apps, and cloud storage.',
   'Microsoft 365 for business',
   399.00, 0.00, null, null,
   '["Outlook email", "Word, Excel, PowerPoint", "1TB OneDrive storage", "Teams collaboration", "Mobile apps", "Web versions"]',
   false, true, 9),
   
  -- Bundle Products
  ('CircleComplete Starter', 'circle-complete-starter', 'bundle', null,
   'Perfect bundle for small businesses. Combines connectivity and IT support.',
   'Connectivity + IT bundle for SMEs',
   1799.00, 999.00, 50, 25,
   '["SkyFibre 50 connectivity", "Basic IT Support", "Microsoft 365", "Save R398/month", "Single bill", "One support number"]',
   true, true, 10),
   
  ('CircleComplete Business', 'circle-complete-business', 'bundle', null,
   'Comprehensive solution for growing businesses. Premium connectivity with full IT support.',
   'Premium business bundle',
   3999.00, 1999.00, 200, 200,
   '["BizFibre 200 connectivity", "Pro IT Support", "Microsoft 365", "Cloud backup", "Save R998/month", "Dedicated account manager"]',
   true, false, 11)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample promotions
INSERT INTO promotions (product_id, name, description, discount_type, discount_value, promo_code, valid_until)
SELECT 
  id,
  'Launch Special',
  'Special launch pricing for first 25 customers',
  'percentage',
  20,
  'LAUNCH20',
  '2025-01-31'::timestamptz
FROM products
WHERE slug IN ('circle-complete-starter', 'circle-complete-business');

-- Insert a free installation promotion
INSERT INTO promotions (product_id, name, description, discount_type, discount_value, promo_code, valid_until)
SELECT 
  id,
  'Free Installation',
  'Free installation for new customers',
  'fixed',
  1999.00,
  'FREEINSTALL',
  '2025-02-28'::timestamptz
FROM products
WHERE category = 'connectivity' AND service_type = 'HomeFibreConnect';
