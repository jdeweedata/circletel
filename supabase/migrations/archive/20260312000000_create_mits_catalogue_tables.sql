-- Migration: Create MITS catalogue tables
-- Description: Tier catalogue, M365 pricing, and module catalogue for MITS CPQ

-- mits_tier_catalogue
CREATE TABLE public.mits_tier_catalogue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code TEXT NOT NULL UNIQUE,
    tier_name TEXT NOT NULL,
    description TEXT,
    target_users_min INTEGER NOT NULL,
    target_users_max INTEGER NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    connectivity_speed_dl INTEGER NOT NULL,
    connectivity_speed_ul INTEGER NOT NULL,
    static_ip_included INTEGER NOT NULL DEFAULT 1,
    lte_failover_included BOOLEAN NOT NULL DEFAULT false,
    skyfibre_product_code TEXT,
    m365_licence_type TEXT NOT NULL,
    m365_included_licences INTEGER NOT NULL,
    m365_additional_rate DECIMAL(10,2) NOT NULL,
    support_hours TEXT NOT NULL,
    sla_response_p1 DECIMAL(4,1) NOT NULL,
    sla_response_p2 DECIMAL(4,1) NOT NULL,
    sla_response_p3 DECIMAL(4,1) NOT NULL,
    sla_resolution_p1 INTEGER NOT NULL,
    onsite_included TEXT NOT NULL,
    onsite_visit_rate DECIMAL(10,2),
    firewall_included BOOLEAN NOT NULL DEFAULT false,
    endpoint_protection BOOLEAN NOT NULL DEFAULT false,
    backup_storage_gb INTEGER NOT NULL DEFAULT 0,
    security_training TEXT,
    uptime_guarantee DECIMAL(5,2) NOT NULL,
    service_credit_rate DECIMAL(5,2) NOT NULL,
    estimated_direct_cost DECIMAL(10,2) NOT NULL,
    target_margin_percent DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- mits_m365_pricing
CREATE TABLE public.mits_m365_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_type TEXT NOT NULL UNIQUE,
    licence_name TEXT NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    csp_cost DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- mits_module_catalogue
CREATE TABLE public.mits_module_catalogue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code TEXT NOT NULL UNIQUE,
    module_name TEXT NOT NULL,
    description TEXT,
    retail_price DECIMAL(10,2) NOT NULL,
    direct_cost DECIMAL(10,2) NOT NULL,
    billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'once_off', 'per_user')),
    available_from_tier TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mits_tier_active ON mits_tier_catalogue(is_active, sort_order);
CREATE INDEX idx_mits_m365_active ON mits_m365_pricing(is_active);
CREATE INDEX idx_mits_module_active ON mits_module_catalogue(is_active, sort_order);

-- RLS
ALTER TABLE mits_tier_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mits_m365_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE mits_module_catalogue ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "Read active tiers" ON mits_tier_catalogue FOR SELECT USING (is_active = true);
CREATE POLICY "Read active m365" ON mits_m365_pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Read active modules" ON mits_module_catalogue FOR SELECT USING (is_active = true);
