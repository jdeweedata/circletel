-- Migration: Create Product Add-ons System
-- Purpose: Allow customers to add optional services (Static IP, Extended Support, etc.) to base packages
-- This eliminates the need for duplicate "Pro" variants of products

-- Product add-ons table
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'monthly' CHECK (price_type IN ('monthly', 'once-off')),
  compatible_service_types TEXT[],
  compatible_product_categories TEXT[],
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE product_addons IS 'Optional add-on services that can be added to base packages';
COMMENT ON COLUMN product_addons.price IS 'Price excluding VAT';
COMMENT ON COLUMN product_addons.compatible_product_categories IS 'Array of product categories this addon is compatible with';

-- Seed initial add-ons (prices excl VAT)
INSERT INTO product_addons (name, slug, description, short_description, price, price_type, compatible_product_categories, icon, sort_order) VALUES
('Static IP Address', 'static-ip', 'Dedicated static IP for remote access, VPN, CCTV, and hosting services. Essential for business applications requiring consistent IP addressing.', 'Fixed IP for remote access', 99.00, 'monthly', ARRAY['connectivity', 'wireless', '5g', 'lte'], 'globe', 1),
('Extended Support Hours', 'extended-support', 'Priority phone and WhatsApp support from 7am-9pm weekdays (extended from standard 8am-5pm). Faster response times and dedicated support queue.', 'Support 7am-9pm weekdays', 149.00, 'monthly', ARRAY['connectivity', 'wireless', '5g', 'lte'], 'headset', 2),
('Managed WiFi', 'managed-wifi', 'Professional WiFi optimization with remote management, monitoring, and automatic channel optimization. Includes monthly performance reports.', 'WiFi management included', 199.00, 'monthly', ARRAY['connectivity', 'wireless'], 'wifi', 3)
ON CONFLICT (slug) DO NOTHING;

-- Order add-ons junction table
CREATE TABLE IF NOT EXISTS order_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES consumer_orders(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES product_addons(id),
  quantity INT DEFAULT 1,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, addon_id)
);

-- Add comments
COMMENT ON TABLE order_addons IS 'Junction table linking orders to their selected add-ons';
COMMENT ON COLUMN order_addons.price_at_purchase IS 'Price at time of purchase (excluding VAT) - preserved for historical accuracy';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_addons_order ON order_addons(order_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_addon ON order_addons(addon_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_active ON product_addons(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_product_addons_categories ON product_addons USING GIN(compatible_product_categories);

-- Enable RLS
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_addons (public read, admin write)
CREATE POLICY "product_addons_public_read" ON product_addons
  FOR SELECT USING (active = true);

CREATE POLICY "product_addons_admin_all" ON product_addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for order_addons (customers see their own, admin sees all)
CREATE POLICY "order_addons_customer_read" ON order_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consumer_orders co
      WHERE co.id = order_addons.order_id
      AND co.customer_id = auth.uid()
    )
  );

CREATE POLICY "order_addons_admin_all" ON order_addons
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_product_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_addons_updated_at
  BEFORE UPDATE ON product_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_product_addons_updated_at();
