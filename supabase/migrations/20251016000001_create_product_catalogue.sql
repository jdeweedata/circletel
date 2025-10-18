-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'residential', 'business', '5g-lte' 
  subcategory VARCHAR(100), -- 'wireless', 'fibre', 'sim-only', 'router-sim'
  deal_id VARCHAR(50) UNIQUE, -- Hidden from frontend, for admin/reference
  sku VARCHAR(100) UNIQUE, -- Hidden from frontend, for admin/reference
  description TEXT,
  speed_upload VARCHAR(20),
  speed_download VARCHAR(20),
  speed_info VARCHAR(100), -- e.g., "50/20 Mbps"
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  provider VARCHAR(100), -- 'SkyFibre', 'CircleConnect', 'MTN', etc.
  contract_term_months INTEGER, -- 1, 6, 12, 18, 24 or NULL for month-to-month
  data_cap VARCHAR(50), -- 'uncapped', '15GB', '500GB', etc.
  router_included BOOLEAN DEFAULT false,
  router_model VARCHAR(100),
  special_features JSONB DEFAULT '{}', -- Store special features as JSON
  metadata JSONB DEFAULT '{}', -- Additional product metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product pricing table
CREATE TABLE product_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_type VARCHAR(50) NOT NULL, -- 'regular_ex_vat', 'regular_inc_vat', 'promo_inc_vat', 'installation'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_to TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product contract options table
CREATE TABLE product_contract_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  contract_length_months INTEGER, -- NULL for month-to-month
  installation_fee DECIMAL(10, 2),
  installation_description VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product audit log
CREATE TABLE product_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'activate', 'deactivate'
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  user_email VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_provider ON products(provider);
CREATE INDEX idx_product_pricing_product_id ON product_pricing(product_id);
CREATE INDEX idx_product_pricing_price_type ON product_pricing(price_type);
CREATE INDEX idx_product_audit_product_id ON product_audit_log(product_id);
CREATE INDEX idx_product_audit_created_at ON product_audit_log(created_at);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_contract_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_audit_log ENABLE ROW LEVEL SECURITY;

-- Products RLS policies
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Public can view active products only" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Product pricing RLS policies  
CREATE POLICY "Admins can view all pricing" ON product_pricing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Public can view active pricing only" ON product_pricing
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing" ON product_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Contract options RLS policies
CREATE POLICY "Admins can view all contract options" ON product_contract_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Public can view active contract options only" ON product_contract_options
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage contract options" ON product_contract_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Audit log RLS policies
CREATE POLICY "Admins can view audit log" ON product_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert audit log" ON product_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_pricing_updated_at BEFORE UPDATE ON product_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_contract_options_updated_at BEFORE UPDATE ON product_contract_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log product changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO product_audit_log (product_id, action, new_data, user_id, user_email)
        VALUES (NEW.id, 'create', row_to_json(NEW), auth.uid(), current_setting('app.current_user_email', true));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO product_audit_log (product_id, action, old_data, new_data, user_id, user_email)
        VALUES (NEW.id, 'update', row_to_json(OLD), row_to_json(NEW), auth.uid(), current_setting('app.current_user_email', true));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO product_audit_log (product_id, action, old_data, user_id, user_email)
        VALUES (OLD.id, 'delete', row_to_json(OLD), auth.uid(), current_setting('app.current_user_email', true));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for audit logging
CREATE TRIGGER product_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_product_changes();
