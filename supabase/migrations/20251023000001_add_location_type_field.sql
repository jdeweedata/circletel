-- Migration: Add location_type field to customers and orders tables
-- Date: 2025-10-23
-- Purpose: Track the type of property where service will be installed
--
-- Location Types:
-- - freestanding_home: Freestanding Home
-- - complex: Complex
-- - business_office: Business/Office Building
-- - school_campus: School Campus
-- - estate: Estate
-- - apartment: Apartment

-- Create ENUM type for location types
DO $$ BEGIN
  CREATE TYPE location_type_enum AS ENUM (
    'freestanding_home',
    'complex',
    'business_office',
    'school_campus',
    'estate',
    'apartment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add location_type column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS location_type location_type_enum;

-- Add location_type column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS installation_location_type location_type_enum;

-- Add comment to explain the field
COMMENT ON COLUMN customers.location_type IS 'Type of property where service is installed: freestanding_home, complex, business_office, school_campus, estate, apartment';
COMMENT ON COLUMN orders.installation_location_type IS 'Type of property where service will be installed: freestanding_home, complex, business_office, school_campus, estate, apartment';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_customers_location_type ON customers(location_type);
CREATE INDEX IF NOT EXISTS idx_orders_installation_location_type ON orders(installation_location_type);

-- Add location_type to coverage_leads table as well (for lead tracking)
ALTER TABLE coverage_leads
ADD COLUMN IF NOT EXISTS location_type location_type_enum;

COMMENT ON COLUMN coverage_leads.location_type IS 'Type of property for coverage check: freestanding_home, complex, business_office, school_campus, estate, apartment';

CREATE INDEX IF NOT EXISTS idx_coverage_leads_location_type ON coverage_leads(location_type);
