-- Create tables for CJF-001: Service Availability & Product Discovery
-- Following the schema from CJF-001 implementation guide

-- Create coverage_areas table for service area mapping
CREATE TABLE coverage_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL CHECK (service_type IN ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect')),
  area_name TEXT NOT NULL,
  polygon JSONB NOT NULL,
  available_speeds JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'coming_soon', 'planned')),
  activation_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table for capturing potential customers
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  coordinates JSONB,
  requested_service TEXT,
  source TEXT DEFAULT 'coverage_checker',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table for service offerings
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('connectivity', 'it_services', 'bundle')),
  service_type TEXT,
  description TEXT,
  features JSONB DEFAULT '[]',
  pricing JSONB NOT NULL,
  requirements JSONB DEFAULT '[]',
  bundle_components TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_coverage_areas_service_type ON coverage_areas(service_type);
CREATE INDEX idx_coverage_areas_status ON coverage_areas(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);

-- Add updated_at triggers
CREATE TRIGGER update_coverage_areas_updated_at
    BEFORE UPDATE ON coverage_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to coverage and products
CREATE POLICY "Public can view active coverage areas" ON coverage_areas
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Leads should only be accessible by authenticated admin users
CREATE POLICY "Only admins can view leads" ON leads
    FOR SELECT USING (false); -- Restrict public access

-- Insert sample coverage areas for testing
INSERT INTO coverage_areas (service_type, area_name, polygon, available_speeds, status, activation_days) VALUES
('SkyFibre', 'Johannesburg - Sandton', '{"type": "Polygon", "coordinates": [[[28.0473, -26.1076], [28.0573, -26.1076], [28.0573, -26.0976], [28.0473, -26.0976], [28.0473, -26.1076]]]}', '[{"download": 50, "upload": 25}, {"download": 100, "upload": 50}]', 'active', 1),
('HomeFibreConnect', 'Cape Town - Century City', '{"type": "Polygon", "coordinates": [[[18.4941, -33.8950], [18.5041, -33.8950], [18.5041, -33.8850], [18.4941, -33.8850], [18.4941, -33.8950]]]}', '[{"download": 100, "upload": 100}, {"download": 200, "upload": 200}]', 'active', 3),
('BizFibreConnect', 'Durban - Umhlanga', '{"type": "Polygon", "coordinates": [[[31.0831, -29.7233], [31.0931, -29.7233], [31.0931, -29.7133], [31.0831, -29.7133], [31.0831, -29.7233]]]}', '[{"download": 100, "upload": 100}, {"download": 500, "upload": 500}]', 'active', 2),
('SkyFibre', 'Pretoria - Menlyn', '{"type": "Polygon", "coordinates": [[[28.2776, -25.7848], [28.2876, -25.7848], [28.2876, -25.7748], [28.2776, -25.7748], [28.2776, -25.7848]]]}', '[{"download": 50, "upload": 25}, {"download": 100, "upload": 50}]', 'active', 1);

-- Insert sample products for testing
INSERT INTO products (name, slug, category, service_type, description, features, pricing, requirements, bundle_components, status) VALUES
('SkyFibre 50Mbps', 'skyfibre-50mbps', 'connectivity', 'SkyFibre', 'High-speed wireless internet for homes and small businesses', '["50Mbps download", "25Mbps upload", "Unlimited data", "Quick installation"]', '{"monthly": 799, "installation": 0, "hardware": 0}', '["Clear line of sight", "Mounting space"]', '{}', 'active'),
('HomeFibre Connect 100Mbps', 'homefibre-100mbps', 'connectivity', 'HomeFibreConnect', 'Premium residential fibre connection', '["100Mbps symmetrical", "Unlimited data", "99.9% uptime", "Static IP available"]', '{"monthly": 899, "installation": 500, "hardware": 200}', '["Fibre availability", "Installation access"]', '{}', 'active'),
('Business Pro Bundle', 'business-pro-bundle', 'bundle', 'BizFibreConnect', 'Complete business connectivity and IT solution', '["100Mbps fibre", "UPS backup", "IT monitoring", "Cloud backup"]', '{"monthly": 1999, "installation": 0, "hardware": 500}', '["Business premises", "Power backup support"]', '["connectivity", "it_services"]', 'active');