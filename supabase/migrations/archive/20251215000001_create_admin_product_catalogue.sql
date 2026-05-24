-- Create enum types for product catalogue admin system
CREATE TYPE admin_product_status AS ENUM ('draft', 'pending', 'approved', 'archived');
CREATE TYPE admin_product_category AS ENUM ('business_fibre', 'fixed_wireless_business', 'fixed_wireless_residential');
CREATE TYPE admin_user_role AS ENUM ('super_admin', 'product_manager', 'editor', 'viewer');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE change_type AS ENUM ('create', 'update', 'delete', 'pricing', 'features');

-- Admin users table for product catalogue management
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role admin_user_role NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced products table for admin catalogue
CREATE TABLE admin_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category admin_product_category NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    speed_down INTEGER NOT NULL,
    speed_up INTEGER NOT NULL,
    is_symmetrical BOOLEAN DEFAULT false,
    contract_terms INTEGER[] DEFAULT '{12,24}',
    status admin_product_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product pricing with approval workflow
CREATE TABLE admin_product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES admin_products(id) ON DELETE CASCADE,
    price_regular DECIMAL(10,2) NOT NULL,
    price_promo DECIMAL(10,2),
    installation_fee DECIMAL(10,2) DEFAULT 0,
    hardware_contribution DECIMAL(10,2) DEFAULT 0,
    router_rental DECIMAL(10,2) DEFAULT 0,
    is_promotional BOOLEAN DEFAULT false,
    promo_start_date TIMESTAMPTZ,
    promo_end_date TIMESTAMPTZ,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    approval_status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product features
CREATE TABLE admin_product_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES admin_products(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_value TEXT,
    feature_category TEXT DEFAULT 'general',
    is_highlighted BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product hardware specifications
CREATE TABLE admin_product_hardware (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES admin_products(id) ON DELETE CASCADE,
    hardware_model TEXT NOT NULL,
    hardware_type TEXT NOT NULL,
    specifications JSONB DEFAULT '{}',
    retail_value DECIMAL(10,2),
    dealer_cost DECIMAL(10,2),
    is_included BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product add-ons
CREATE TABLE admin_product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_monthly BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    applicable_categories admin_product_category[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product changes tracking for approval workflow
CREATE TABLE admin_product_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES admin_products(id) ON DELETE CASCADE,
    change_type change_type NOT NULL,
    field_name TEXT,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    requested_by UUID NOT NULL REFERENCES admin_users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    status approval_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT
);

-- Approval workflow management
CREATE TABLE admin_approval_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    current_stage INTEGER DEFAULT 1,
    total_stages INTEGER DEFAULT 1,
    required_approvers TEXT[] DEFAULT '{}',
    approval_history JSONB DEFAULT '[]',
    deadline TIMESTAMPTZ,
    priority INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced audit logs for admin actions
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_products_category ON admin_products(category);
CREATE INDEX idx_admin_products_status ON admin_products(status);
CREATE INDEX idx_admin_products_current ON admin_products(is_current);
CREATE INDEX idx_admin_product_pricing_product ON admin_product_pricing(product_id);
CREATE INDEX idx_admin_product_features_product ON admin_product_features(product_id);
CREATE INDEX idx_admin_product_changes_status ON admin_product_changes(status);
CREATE INDEX idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp);
CREATE INDEX idx_admin_audit_logs_user ON admin_audit_logs(user_id);

-- Add trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_admin_products_updated_at
    BEFORE UPDATE ON admin_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_product_pricing_updated_at
    BEFORE UPDATE ON admin_product_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_approval_workflow_updated_at
    BEFORE UPDATE ON admin_approval_workflow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_product_hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_product_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (approved products only)
CREATE POLICY "Public can view approved products" ON admin_products
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Public can view approved pricing" ON admin_product_pricing
    FOR SELECT USING (approval_status = 'approved');

CREATE POLICY "Public can view product features" ON admin_product_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_products
            WHERE id = admin_product_features.product_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Public can view product hardware" ON admin_product_hardware
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_products
            WHERE id = admin_product_hardware.product_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Public can view active addons" ON admin_product_addons
    FOR SELECT USING (is_active = true);

-- Insert initial admin user (to be updated with real credentials)
INSERT INTO admin_users (email, full_name, role, is_active) VALUES
('admin@circletel.co.za', 'System Administrator', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;