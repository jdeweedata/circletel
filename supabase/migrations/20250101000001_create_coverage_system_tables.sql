-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create coverage_leads table (similar to Supersonic's lead creation)
CREATE TABLE IF NOT EXISTS coverage_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'qualified', 'converted', 'rejected')
  ),
  source VARCHAR(50) DEFAULT 'coverage_check',
  session_id VARCHAR(100),
  coverage_available BOOLEAN DEFAULT false,
  available_services TEXT[],
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_packages table (packages available for each service type)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (
    service_type IN ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'All')
  ),
  speed_down INTEGER NOT NULL, -- Download speed in Mbps
  speed_up INTEGER NOT NULL,   -- Upload speed in Mbps
  price DECIMAL(10, 2) NOT NULL,
  promotion_price DECIMAL(10, 2),
  promotion_months INTEGER DEFAULT 3,
  description TEXT,
  features TEXT[],
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing coverage_areas table to include more fields
ALTER TABLE coverage_areas
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS province VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS activation_days INTEGER DEFAULT 7;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coverage_leads_coordinates
ON coverage_leads(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_coverage_leads_address
ON coverage_leads USING gin(to_tsvector('english', address));

CREATE INDEX IF NOT EXISTS idx_coverage_leads_session
ON coverage_leads(session_id);

CREATE INDEX IF NOT EXISTS idx_service_packages_service_type
ON service_packages(service_type);

CREATE INDEX IF NOT EXISTS idx_service_packages_active
ON service_packages(active);

-- Insert sample service packages (similar to Supersonic's offerings)
INSERT INTO service_packages (name, service_type, speed_down, speed_up, price, promotion_price, promotion_months, description, features, sort_order) VALUES

-- SkyFibre packages (Wireless)
('SkyFibre Starter', 'SkyFibre', 10, 10, 459, 259, 3, 'Wireless broadband perfect for basic internet needs',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 1),

('SkyFibre Essential', 'SkyFibre', 25, 15, 529, 329, 3, 'Great for streaming and working from home',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 2),

('SkyFibre Pro', 'SkyFibre', 50, 25, 639, 439, 3, 'Perfect for families and multiple device usage',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 3),

-- HomeFibreConnect packages
('HomeFibre Basic', 'HomeFibreConnect', 20, 10, 579, 379, 3, 'Entry-level fibre for homes',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 4),

('HomeFibre Standard', 'HomeFibreConnect', 50, 50, 809, 609, 3, 'Balanced fibre for modern households',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 5),

('HomeFibre Premium', 'HomeFibreConnect', 100, 50, 799, 499, 3, 'High-speed fibre for demanding users',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 6),

('HomeFibre Ultra', 'HomeFibreConnect', 100, 100, 909, 609, 3, 'Ultra-fast symmetric speeds',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 7),

('HomeFibre Giga', 'HomeFibreConnect', 200, 100, 999, 699, 3, 'Lightning-fast downloads with excellent uploads',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet'], 8),

-- BizFibreConnect packages
('BizFibre Essential', 'BizFibreConnect', 200, 200, 1109, 809, 3, 'Business-grade symmetric fibre',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet', 'Business SLA'], 9),

('BizFibre Pro', 'BizFibreConnect', 500, 500, 1309, 1009, 3, 'Premium business connectivity',
 ARRAY['Month-to-Month', 'Free Installation', 'Free-to-use Router', 'Uncapped Internet', 'Business SLA', 'Priority Support'], 10);

-- Insert sample coverage areas for testing
INSERT INTO coverage_areas (service_type, coverage_name, coverage_quality, polygon, city, province, status, activation_days) VALUES

-- Johannesburg Coverage
('SkyFibre', 'Johannesburg Central', 'excellent',
 ST_GeomFromText('POLYGON((28.0200 -26.2200, 28.0800 -26.2200, 28.0800 -26.1800, 28.0200 -26.1800, 28.0200 -26.2200))', 4326),
 'Johannesburg', 'Gauteng', 'active', 3),

('HomeFibreConnect', 'Sandton CBD', 'excellent',
 ST_GeomFromText('POLYGON((28.0400 -26.1100, 28.0600 -26.1100, 28.0600 -26.0900, 28.0400 -26.0900, 28.0400 -26.1100))', 4326),
 'Johannesburg', 'Gauteng', 'active', 5),

('BizFibreConnect', 'Rosebank Business District', 'good',
 ST_GeomFromText('POLYGON((28.0300 -26.1500, 28.0500 -26.1500, 28.0500 -26.1300, 28.0300 -26.1300, 28.0300 -26.1500))', 4326),
 'Johannesburg', 'Gauteng', 'active', 7),

-- Centurion Coverage (including Heritage Hill where 18 Rasmus Erasmus is located)
('SkyFibre', 'Centurion - Heritage Hill', 'excellent',
 ST_GeomFromText('POLYGON((28.1700 -25.9200, 28.1900 -25.9200, 28.1900 -25.9000, 28.1700 -25.9000, 28.1700 -25.9200))', 4326),
 'Centurion', 'Gauteng', 'active', 3),

('HomeFibreConnect', 'Centurion Central', 'good',
 ST_GeomFromText('POLYGON((28.1800 -25.8600, 28.2000 -25.8600, 28.2000 -25.8400, 28.1800 -25.8400, 28.1800 -25.8600))', 4326),
 'Centurion', 'Gauteng', 'active', 5),

-- Cape Town Coverage
('All', 'Cape Town CBD', 'excellent',
 ST_GeomFromText('POLYGON((18.4100 -33.9400, 18.4400 -33.9400, 18.4400 -33.9100, 18.4100 -33.9100, 18.4100 -33.9400))', 4326),
 'Cape Town', 'Western Cape', 'active', 3);

-- Create function to check coverage at specific coordinates
CREATE OR REPLACE FUNCTION check_coverage_at_point(
  lat DECIMAL,
  lng DECIMAL
) RETURNS TABLE(
  service_type VARCHAR,
  coverage_quality VARCHAR,
  speed_tier VARCHAR,
  coverage_name VARCHAR,
  activation_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.service_type,
    ca.coverage_quality,
    'Multiple speeds available' as speed_tier,
    ca.coverage_name,
    ca.activation_days
  FROM coverage_areas ca
  WHERE ST_Contains(
    ca.polygon,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  )
  AND ca.status = 'active'
  ORDER BY
    CASE ca.service_type
      WHEN 'BizFibreConnect' THEN 1
      WHEN 'HomeFibreConnect' THEN 2
      WHEN 'SkyFibre' THEN 3
      WHEN 'All' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_coverage_leads_updated_at BEFORE UPDATE ON coverage_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();