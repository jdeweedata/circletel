-- TMF620 Product Offering Relationships
-- Enables Base + Modules pricing model (add-ons, prerequisites, exclusions)
-- See: /products/smb/skyfibre/SkyFibre_SMB_v2_Commercial_Product_Specification.md

-- Product relationship types
CREATE TYPE product_relationship_type AS ENUM (
    'addon',        -- Optional add-on module
    'requires',     -- Prerequisite (must have)
    'excludes',     -- Mutually exclusive
    'alternative',  -- Can substitute
    'includes'      -- Bundle component (included in price)
);

-- Product relationships table
CREATE TABLE product_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_product_id UUID NOT NULL REFERENCES admin_products(id) ON DELETE CASCADE,
    target_product_id UUID NOT NULL REFERENCES admin_products(id) ON DELETE CASCADE,
    relationship_type product_relationship_type NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER DEFAULT 1,
    price_modifier DECIMAL(10,2),  -- Override price when attached to source
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent self-referential relationships
    CONSTRAINT no_self_relationship CHECK (source_product_id != target_product_id),
    -- Unique relationship per type
    CONSTRAINT unique_relationship UNIQUE (source_product_id, target_product_id, relationship_type)
);

-- Indexes for efficient queries
CREATE INDEX idx_product_relationships_source ON product_relationships(source_product_id);
CREATE INDEX idx_product_relationships_target ON product_relationships(target_product_id);
CREATE INDEX idx_product_relationships_type ON product_relationships(relationship_type);

-- Enable RLS
ALTER TABLE product_relationships ENABLE ROW LEVEL SECURITY;

-- Public can view relationships for approved products only
CREATE POLICY "Public can view product relationships" ON product_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_products
            WHERE id = source_product_id
            AND status = 'approved'
        )
    );

-- Admin users can manage relationships (service role bypasses RLS)
CREATE POLICY "Admin users can manage product relationships" ON product_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id::text = auth.uid()::text
            AND is_active = true
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_product_relationships_updated_at
    BEFORE UPDATE ON product_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE product_relationships IS 'TMF620 ProductOfferingRelationship - defines how products relate (add-ons, prerequisites, exclusions)';
COMMENT ON COLUMN product_relationships.relationship_type IS 'addon=optional module, requires=prerequisite, excludes=mutually exclusive, alternative=substitute, includes=bundle component';
COMMENT ON COLUMN product_relationships.price_modifier IS 'Override price when this target product is attached to the source product';
