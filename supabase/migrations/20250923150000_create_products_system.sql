-- Create products table for CircleTel product portfolio management
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Basic product information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,

    -- Product categorization
    category VARCHAR(100) NOT NULL, -- 'residential', 'smb', 'enterprise'
    technology VARCHAR(100) NOT NULL, -- 'fibre', 'fixed_wireless', 'lte', 'managed_services'
    product_line VARCHAR(100) NOT NULL, -- 'skyfibre', 'bizfibreconnect', 'homefibreconnect', 'fibrebiz', 'managed'

    -- Pricing information
    price_monthly DECIMAL(10,2) NOT NULL,
    price_installation DECIMAL(10,2) DEFAULT 0,
    price_upfront DECIMAL(10,2) DEFAULT 0,
    price_router_rental DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',

    -- Service specifications
    speed_download INTEGER, -- in Mbps
    speed_upload INTEGER, -- in Mbps
    data_cap INTEGER, -- in GB, NULL for uncapped
    is_symmetrical BOOLEAN DEFAULT false,

    -- Service features (JSON array)
    features JSONB DEFAULT '[]'::jsonb,

    -- Technical specifications
    technology_details JSONB DEFAULT '{}'::jsonb,
    router_included BOOLEAN DEFAULT false,
    router_model VARCHAR(255),
    static_ip_included INTEGER DEFAULT 0,

    -- Service levels
    uptime_sla DECIMAL(5,3), -- e.g., 99.5 for 99.5%
    support_hours VARCHAR(100), -- e.g., "24/7", "business_hours"
    support_response_time VARCHAR(100), -- e.g., "4_hours", "next_day"

    -- Contract terms
    contract_months INTEGER DEFAULT 24,
    contract_options JSONB DEFAULT '[]'::jsonb, -- [12, 24, 36]

    -- Availability and status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    available_regions JSONB DEFAULT '["national"]'::jsonb,

    -- Marketing content
    marketing_headline VARCHAR(255),
    marketing_description TEXT,
    target_market TEXT,
    competitive_advantages JSONB DEFAULT '[]'::jsonb,

    -- Ordering and availability
    order_priority INTEGER DEFAULT 0,
    requires_coverage_check BOOLEAN DEFAULT true,
    coverage_technologies JSONB DEFAULT '[]'::jsonb, -- Technologies needed for this product

    -- Bundling and upsells
    bundle_options JSONB DEFAULT '[]'::jsonb,
    addon_services JSONB DEFAULT '[]'::jsonb,

    -- Internal information
    cost_wholesale DECIMAL(10,2),
    cost_infrastructure DECIMAL(10,2),
    cost_total DECIMAL(10,2),
    margin_percentage DECIMAL(5,2),

    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create product addons table
CREATE TABLE IF NOT EXISTS product_addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_setup DECIMAL(10,2) DEFAULT 0,

    category VARCHAR(100) NOT NULL, -- 'ip_address', 'security', 'support', 'hardware'
    is_active BOOLEAN DEFAULT true,

    -- Which products can use this addon
    compatible_categories JSONB DEFAULT '["residential", "smb", "enterprise"]'::jsonb,
    compatible_technologies JSONB DEFAULT '["fibre", "fixed_wireless", "lte"]'::jsonb
);

-- Create product bundles table
CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Bundle products (array of product IDs)
    product_ids JSONB NOT NULL,
    addon_ids JSONB DEFAULT '[]'::jsonb,

    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,

    -- Availability
    is_active BOOLEAN DEFAULT true,
    target_category VARCHAR(100) NOT NULL,

    -- Marketing
    marketing_title VARCHAR(255),
    marketing_savings_text VARCHAR(255), -- e.g., "Save R399/month"

    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

-- Allow read access to active products for everyone
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Product addons are viewable by everyone" ON product_addons FOR SELECT USING (is_active = true);
CREATE POLICY "Product bundles are viewable by everyone" ON product_bundles FOR SELECT USING (is_active = true);

-- Only authenticated admin users can modify products
-- Note: This would need proper admin role checking in a real application
CREATE POLICY "Products are editable by authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Product addons are editable by authenticated users" ON product_addons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Product bundles are editable by authenticated users" ON product_bundles FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_technology ON products(technology);
CREATE INDEX idx_products_product_line ON products(product_line);
CREATE INDEX idx_products_price ON products(price_monthly);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_addons_updated_at BEFORE UPDATE ON product_addons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_bundles_updated_at BEFORE UPDATE ON product_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();