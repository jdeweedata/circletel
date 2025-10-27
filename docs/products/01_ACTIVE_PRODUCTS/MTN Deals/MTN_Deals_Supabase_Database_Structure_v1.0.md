# MTN Deals Supabase Database Structure
**Version:** 1.0  
**Date:** 27 October 2025  
**Document Type:** Database Schema Design  
**Locale:** en-ZA  
**Author:** CircleTel Product Strategy

---

## Executive Summary

This document defines the Supabase database structure for managing MTN Business Deals data received monthly from Arlan Communications (PTY) LTD as per the Sales Agreement dated 29 September 2025. The structure supports historical tracking, commission calculations, and integration with CircleTel's product portfolio.

---

## 1. Database Overview

### 1.1 Purpose
- Store and manage monthly MTN Business Deals catalogue
- Track deal history and changes over time
- Enable commission calculations per Sales Agreement Addendum A
- Support integration with CircleTel's customer-facing systems
- Provide data for business intelligence and reporting

### 1.2 Key Requirements
- Monthly bulk updates from Excel workbooks
- Historical data retention
- Support for 17,000+ deals per month
- Version control and audit trails
- Integration with existing CircleTel product database
- Commission tracking and calculations

---

## 2. Database Schema

### 2.1 Core Tables

#### **Table: `mtn_deal_catalogues`**
Stores metadata about each monthly catalogue upload.

```sql
CREATE TABLE public.mtn_deal_catalogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogue_month DATE NOT NULL UNIQUE, -- First day of the month
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_name TEXT NOT NULL,
    file_source TEXT, -- e.g., "Arlan Communications"
    total_deals INTEGER NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    catalogue_status TEXT NOT NULL DEFAULT 'active' CHECK (catalogue_status IN ('active', 'superseded', 'archived')),
    uploaded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mtn_catalogues_month ON public.mtn_deal_catalogues(catalogue_month DESC);
CREATE INDEX idx_mtn_catalogues_status ON public.mtn_deal_catalogues(catalogue_status);

-- Comments
COMMENT ON TABLE public.mtn_deal_catalogues IS 'Monthly MTN deal catalogue metadata and upload tracking';
COMMENT ON COLUMN public.mtn_deal_catalogues.catalogue_status IS 'active = current month, superseded = replaced by newer, archived = historical';
```

---

#### **Table: `mtn_deals`**
Stores individual deal records from monthly catalogues.

```sql
CREATE TABLE public.mtn_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogue_id UUID NOT NULL REFERENCES public.mtn_deal_catalogues(id) ON DELETE CASCADE,
    
    -- Deal Identification
    deal_id TEXT NOT NULL, -- MTN Deal ID (e.g., "202508EBU2726")
    
    -- Promotion Dates
    promo_start_date DATE NOT NULL,
    promo_end_date DATE NOT NULL,
    
    -- Device Information
    oem_and_device TEXT NOT NULL,
    device_status TEXT CHECK (device_status IN ('NEW', 'CTB', 'REFURBISHED')),
    ebu_inventory_status_main TEXT,
    ebu_inventory_status_freebie TEXT,
    
    -- Freebies
    freebie_device TEXT,
    freebie_priceplan TEXT,
    
    -- Pricing
    total_subscription_incl_vat DECIMAL(10,2) NOT NULL,
    total_subscription_excl_vat DECIMAL(10,2) NOT NULL,
    once_off_payin_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Price Plan Details
    price_plan TEXT NOT NULL,
    eppix_package TEXT,
    eppix_tariff TEXT,
    package_description TEXT,
    tariff_description TEXT,
    contract_term INTEGER NOT NULL, -- In months
    
    -- Inclusions
    free_sim TEXT CHECK (free_sim IN ('Yes', 'No')),
    free_cli TEXT CHECK (free_cli IN ('Yes', 'No')),
    free_itb TEXT CHECK (free_itb IN ('Yes', 'No')),
    
    -- Bundle Details
    onnet_minute_bundle TEXT,
    anytime_minute_bundle TEXT,
    sms_bundle TEXT,
    data_bundle TEXT,
    bundle_description TEXT,
    
    -- Inclusive Price Plan Features
    inclusive_pp_minutes TEXT,
    inclusive_pp_data TEXT,
    inclusive_pp_sms TEXT,
    inclusive_pp_ingroup_calling TEXT,
    inclusive_pp_onnet_minutes TEXT,
    
    -- Totals
    total_data TEXT,
    total_minutes TEXT,
    
    -- Availability
    channel_deal_visibility TEXT,
    device_range_applicability TEXT,
    available_on_helios TEXT CHECK (available_on_helios IN ('Yes', 'No')),
    available_on_ilula TEXT CHECK (available_on_ilula IN ('Yes', 'No')),
    
    -- CircleTel Integration
    circletel_product_mapping UUID REFERENCES public.products(id),
    is_active_for_sale BOOLEAN NOT NULL DEFAULT true,
    internal_notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Composite unique constraint
    UNIQUE(catalogue_id, deal_id)
);

-- Indexes for performance
CREATE INDEX idx_mtn_deals_catalogue ON public.mtn_deals(catalogue_id);
CREATE INDEX idx_mtn_deals_deal_id ON public.mtn_deals(deal_id);
CREATE INDEX idx_mtn_deals_dates ON public.mtn_deals(promo_start_date, promo_end_date);
CREATE INDEX idx_mtn_deals_device ON public.mtn_deals(oem_and_device);
CREATE INDEX idx_mtn_deals_price_plan ON public.mtn_deals(price_plan);
CREATE INDEX idx_mtn_deals_active ON public.mtn_deals(is_active_for_sale) WHERE is_active_for_sale = true;
CREATE INDEX idx_mtn_deals_helios ON public.mtn_deals(available_on_helios) WHERE available_on_helios = 'Yes';
CREATE INDEX idx_mtn_deals_ilula ON public.mtn_deals(available_on_ilula) WHERE available_on_ilula = 'Yes';

-- Full text search index
CREATE INDEX idx_mtn_deals_fts ON public.mtn_deals USING GIN (
    to_tsvector('english', 
        COALESCE(oem_and_device, '') || ' ' ||
        COALESCE(price_plan, '') || ' ' ||
        COALESCE(package_description, '')
    )
);

-- Comments
COMMENT ON TABLE public.mtn_deals IS 'Individual MTN business deals from monthly catalogues';
COMMENT ON COLUMN public.mtn_deals.deal_id IS 'MTN Deal ID from source data';
COMMENT ON COLUMN public.mtn_deals.device_status IS 'NEW = New device, CTB = Come To Buy (upgrade), REFURBISHED = Refurbished device';
```

---

#### **Table: `mtn_commission_rates`**
Stores commission rate structures as per Sales Agreement Addendum A.

```sql
CREATE TABLE public.mtn_commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Subscription tiers (as per Addendum A)
    subscription_min DECIMAL(10,2) NOT NULL,
    subscription_max DECIMAL(10,2),
    
    -- MTN Commission rates
    mtn_commission_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0475 for 4.75%
    contract_term_months INTEGER NOT NULL DEFAULT 24,
    
    -- CircleTel Share (30% of MTN commission per agreement)
    circletel_commission_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.01425 for 1.425%
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure no overlapping date ranges for same tier
    EXCLUDE USING gist (
        numrange(subscription_min, subscription_max, '[]') WITH &&,
        daterange(effective_from, effective_to, '[]') WITH &&
    )
);

-- Indexes
CREATE INDEX idx_commission_rates_dates ON public.mtn_commission_rates(effective_from, effective_to);
CREATE INDEX idx_commission_rates_active ON public.mtn_commission_rates(is_active) WHERE is_active = true;

-- Insert initial commission structure from Addendum A
INSERT INTO public.mtn_commission_rates 
    (effective_from, subscription_min, subscription_max, mtn_commission_rate, circletel_commission_rate, contract_term_months)
VALUES
    ('2025-09-29', 0, 99.99, 0.0475, 0.01425, 24),
    ('2025-09-29', 100, 199.99, 0.0575, 0.01725, 24),
    ('2025-09-29', 200, 299.99, 0.0725, 0.02175, 24),
    ('2025-09-29', 300, 499.99, 0.0875, 0.02625, 24),
    ('2025-09-29', 500, 999.99, 0.0975, 0.02925, 24),
    ('2025-09-29', 1000, 1999.99, 0.1175, 0.03525, 24),
    ('2025-09-29', 2000, NULL, 0.1375, 0.04125, 24);

-- Comments
COMMENT ON TABLE public.mtn_commission_rates IS 'Commission rate structure as per Sales Agreement Addendum A';
COMMENT ON COLUMN public.mtn_commission_rates.circletel_commission_rate IS '30% of MTN commission as per agreement clause 1.1';
```

---

#### **Table: `mtn_deal_sales`**
Tracks actual sales made through CircleTel for commission calculation.

```sql
CREATE TABLE public.mtn_deal_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Deal Reference
    deal_id UUID NOT NULL REFERENCES public.mtn_deals(id),
    catalogue_id UUID NOT NULL REFERENCES public.mtn_deal_catalogues(id),
    
    -- Customer Information
    customer_id UUID REFERENCES public.customers(id),
    customer_account_number TEXT,
    
    -- Sale Details
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activation_date DATE,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_term_months INTEGER NOT NULL,
    
    -- Pricing
    monthly_subscription_incl_vat DECIMAL(10,2) NOT NULL,
    monthly_subscription_excl_vat DECIMAL(10,2) NOT NULL,
    once_off_payment_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_contract_value DECIMAL(12,2) NOT NULL, -- Total over contract term
    
    -- Commission Calculation
    applicable_mtn_commission_rate DECIMAL(5,4) NOT NULL,
    applicable_circletel_commission_rate DECIMAL(5,4) NOT NULL,
    mtn_commission_amount DECIMAL(10,2) NOT NULL,
    circletel_commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment Status
    commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        commission_status IN ('pending', 'approved', 'paid', 'disputed', 'cancelled')
    ),
    commission_paid_date DATE,
    commission_payment_reference TEXT,
    
    -- Source tracking
    sale_channel TEXT, -- e.g., 'Helios', 'iLula', 'Direct'
    sales_person UUID REFERENCES auth.users(id),
    
    -- Status
    sale_status TEXT NOT NULL DEFAULT 'active' CHECK (
        sale_status IN ('active', 'cancelled', 'upgraded', 'renewed', 'terminated')
    ),
    cancellation_date DATE,
    cancellation_reason TEXT,
    
    -- Integration
    mtn_contract_reference TEXT,
    arlan_order_reference TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deal_sales_deal ON public.mtn_deal_sales(deal_id);
CREATE INDEX idx_deal_sales_customer ON public.mtn_deal_sales(customer_id);
CREATE INDEX idx_deal_sales_dates ON public.mtn_deal_sales(sale_date, contract_start_date);
CREATE INDEX idx_deal_sales_commission_status ON public.mtn_deal_sales(commission_status);
CREATE INDEX idx_deal_sales_active ON public.mtn_deal_sales(sale_status) WHERE sale_status = 'active';

-- Comments
COMMENT ON TABLE public.mtn_deal_sales IS 'Tracks MTN deal sales through CircleTel for commission calculation';
COMMENT ON COLUMN public.mtn_deal_sales.total_contract_value IS 'Monthly subscription × contract term months';
COMMENT ON COLUMN public.mtn_deal_sales.circletel_commission_amount IS '30% of MTN commission per Sales Agreement';
```

---

#### **Table: `mtn_commission_payments`**
Tracks commission payments received from Arlan Communications.

```sql
CREATE TABLE public.mtn_commission_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payment Period
    payment_month DATE NOT NULL, -- First day of the month
    payment_date DATE NOT NULL,
    
    -- Payment Details
    total_sales_value DECIMAL(12,2) NOT NULL,
    total_mtn_commission DECIMAL(12,2) NOT NULL,
    total_circletel_commission DECIMAL(12,2) NOT NULL,
    
    -- Banking
    payment_reference TEXT NOT NULL,
    payment_amount_received DECIMAL(12,2),
    payment_received_date DATE,
    bank_statement_reference TEXT,
    
    -- Reconciliation
    reconciliation_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        reconciliation_status IN ('pending', 'matched', 'partial', 'disputed', 'resolved')
    ),
    variance_amount DECIMAL(10,2),
    variance_reason TEXT,
    
    -- Related Sales
    number_of_sales INTEGER NOT NULL,
    
    -- Documents
    invoice_reference TEXT,
    invoice_document_url TEXT,
    statement_document_url TEXT,
    
    -- Audit
    reconciled_by UUID REFERENCES auth.users(id),
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(payment_month)
);

-- Indexes
CREATE INDEX idx_commission_payments_month ON public.mtn_commission_payments(payment_month DESC);
CREATE INDEX idx_commission_payments_status ON public.mtn_commission_payments(reconciliation_status);

-- Comments
COMMENT ON TABLE public.mtn_commission_payments IS 'Monthly commission payments from Arlan Communications per clause 6.3 of Sales Agreement';
COMMENT ON COLUMN public.mtn_commission_payments.payment_date IS 'Expected by 25th of month per clause 6.3';
```

---

### 2.2 Supporting Tables

#### **Table: `mtn_deal_changes`**
Tracks changes to deals across catalogue versions.

```sql
CREATE TABLE public.mtn_deal_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id TEXT NOT NULL,
    
    -- Version tracking
    old_catalogue_id UUID REFERENCES public.mtn_deal_catalogues(id),
    new_catalogue_id UUID REFERENCES public.mtn_deal_catalogues(id),
    
    -- Change details
    change_type TEXT NOT NULL CHECK (
        change_type IN ('new', 'modified', 'removed', 'price_change', 'term_change', 'availability_change')
    ),
    change_summary JSONB NOT NULL, -- Structured change details
    
    -- Impact assessment
    affects_active_sales BOOLEAN NOT NULL DEFAULT false,
    active_sales_count INTEGER DEFAULT 0,
    
    -- Audit
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT
);

-- Indexes
CREATE INDEX idx_deal_changes_deal ON public.mtn_deal_changes(deal_id);
CREATE INDEX idx_deal_changes_catalogues ON public.mtn_deal_changes(old_catalogue_id, new_catalogue_id);
CREATE INDEX idx_deal_changes_type ON public.mtn_deal_changes(change_type);

-- Comments
COMMENT ON TABLE public.mtn_deal_changes IS 'Tracks changes between monthly catalogue versions';
```

---

#### **Table: `mtn_price_plan_mappings`**
Maps MTN price plans to CircleTel product offerings.

```sql
CREATE TABLE public.mtn_price_plan_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- MTN Side
    mtn_price_plan TEXT NOT NULL UNIQUE,
    eppix_package TEXT,
    eppix_tariff TEXT,
    
    -- CircleTel Side
    circletel_product_id UUID REFERENCES public.products(id),
    circletel_product_name TEXT,
    
    -- Mapping metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    mapping_confidence TEXT CHECK (mapping_confidence IN ('high', 'medium', 'low', 'manual')),
    mapping_notes TEXT,
    
    -- Audit
    mapped_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_price_plan_mappings_mtn ON public.mtn_price_plan_mappings(mtn_price_plan);
CREATE INDEX idx_price_plan_mappings_circletel ON public.mtn_price_plan_mappings(circletel_product_id);

-- Comments
COMMENT ON TABLE public.mtn_price_plan_mappings IS 'Maps MTN price plans to CircleTel product catalogue';
```

---

## 3. Database Functions

### 3.1 Commission Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_deal_commission(
    p_subscription_amount DECIMAL,
    p_contract_term_months INTEGER,
    p_effective_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    mtn_rate DECIMAL,
    circletel_rate DECIMAL,
    total_contract_value DECIMAL,
    mtn_commission DECIMAL,
    circletel_commission DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.mtn_commission_rate,
        cr.circletel_commission_rate,
        p_subscription_amount * p_contract_term_months AS total_contract_value,
        (p_subscription_amount * p_contract_term_months * cr.mtn_commission_rate) AS mtn_commission,
        (p_subscription_amount * p_contract_term_months * cr.circletel_commission_rate) AS circletel_commission
    FROM public.mtn_commission_rates cr
    WHERE 
        p_subscription_amount >= cr.subscription_min
        AND (cr.subscription_max IS NULL OR p_subscription_amount <= cr.subscription_max)
        AND p_effective_date >= cr.effective_from
        AND (cr.effective_to IS NULL OR p_effective_date <= cr.effective_to)
        AND cr.is_active = true
        AND cr.contract_term_months = p_contract_term_months
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage example:
-- SELECT * FROM calculate_deal_commission(500.00, 24, '2025-10-27');

COMMENT ON FUNCTION calculate_deal_commission IS 'Calculates commission based on Sales Agreement Addendum A rates';
```

---

### 3.2 Active Deals View Function

```sql
CREATE OR REPLACE FUNCTION get_active_deals(
    p_channel TEXT DEFAULT NULL,
    p_device_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    deal_id TEXT,
    catalogue_month DATE,
    device TEXT,
    price_plan TEXT,
    monthly_price DECIMAL,
    contract_term INTEGER,
    promo_end_date DATE,
    available_helios TEXT,
    available_ilula TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        md.deal_id,
        mdc.catalogue_month,
        md.oem_and_device,
        md.price_plan,
        md.total_subscription_incl_vat,
        md.contract_term,
        md.promo_end_date,
        md.available_on_helios,
        md.available_on_ilula
    FROM public.mtn_deals md
    JOIN public.mtn_deal_catalogues mdc ON md.catalogue_id = mdc.id
    WHERE 
        md.is_active_for_sale = true
        AND mdc.catalogue_status = 'active'
        AND md.promo_end_date >= CURRENT_DATE
        AND (p_channel IS NULL OR 
             (p_channel = 'Helios' AND md.available_on_helios = 'Yes') OR
             (p_channel = 'iLula' AND md.available_on_ilula = 'Yes'))
        AND (p_device_search IS NULL OR 
             md.oem_and_device ILIKE '%' || p_device_search || '%')
    ORDER BY md.total_subscription_incl_vat;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage examples:
-- SELECT * FROM get_active_deals('Helios', 'Samsung');
-- SELECT * FROM get_active_deals(NULL, 'iPhone');

COMMENT ON FUNCTION get_active_deals IS 'Returns active deals available for sale, optionally filtered by channel and device';
```

---

### 3.3 Monthly Commission Report Function

```sql
CREATE OR REPLACE FUNCTION generate_monthly_commission_report(
    p_month DATE
)
RETURNS TABLE (
    sale_id UUID,
    customer_name TEXT,
    device TEXT,
    sale_date DATE,
    monthly_subscription DECIMAL,
    contract_value DECIMAL,
    circletel_commission DECIMAL,
    commission_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mds.id,
        c.company_name,
        md.oem_and_device,
        mds.sale_date,
        mds.monthly_subscription_incl_vat,
        mds.total_contract_value,
        mds.circletel_commission_amount,
        mds.commission_status
    FROM public.mtn_deal_sales mds
    JOIN public.mtn_deals md ON mds.deal_id = md.id
    JOIN public.customers c ON mds.customer_id = c.id
    WHERE 
        DATE_TRUNC('month', mds.sale_date) = DATE_TRUNC('month', p_month)
        AND mds.sale_status = 'active'
    ORDER BY mds.sale_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage example:
-- SELECT * FROM generate_monthly_commission_report('2025-10-01');

COMMENT ON FUNCTION generate_monthly_commission_report IS 'Generates monthly sales and commission report';
```

---

## 4. Database Triggers

### 4.1 Auto-update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER update_mtn_deal_catalogues_updated_at
    BEFORE UPDATE ON public.mtn_deal_catalogues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mtn_deals_updated_at
    BEFORE UPDATE ON public.mtn_deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mtn_deal_sales_updated_at
    BEFORE UPDATE ON public.mtn_deal_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mtn_commission_payments_updated_at
    BEFORE UPDATE ON public.mtn_commission_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### 4.2 Auto-calculate Commission on Sale Insert

```sql
CREATE OR REPLACE FUNCTION auto_calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_calc RECORD;
BEGIN
    -- Calculate commission using the function
    SELECT * INTO v_commission_calc
    FROM calculate_deal_commission(
        NEW.monthly_subscription_excl_vat,
        NEW.contract_term_months,
        NEW.sale_date
    );
    
    -- Update the new row with calculated values
    NEW.applicable_mtn_commission_rate := v_commission_calc.mtn_rate;
    NEW.applicable_circletel_commission_rate := v_commission_calc.circletel_rate;
    NEW.total_contract_value := v_commission_calc.total_contract_value;
    NEW.mtn_commission_amount := v_commission_calc.mtn_commission;
    NEW.circletel_commission_amount := v_commission_calc.circletel_commission;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_commission_on_sale
    BEFORE INSERT ON public.mtn_deal_sales
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_commission();

COMMENT ON FUNCTION auto_calculate_commission IS 'Automatically calculates commission when a sale is recorded';
```

---

### 4.3 Supersede Old Catalogues

```sql
CREATE OR REPLACE FUNCTION supersede_old_catalogues()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark older catalogues as superseded
    UPDATE public.mtn_deal_catalogues
    SET catalogue_status = 'superseded',
        updated_at = NOW()
    WHERE catalogue_month < NEW.catalogue_month
      AND catalogue_status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supersede_catalogues_on_new_upload
    AFTER INSERT ON public.mtn_deal_catalogues
    FOR EACH ROW
    EXECUTE FUNCTION supersede_old_catalogues();

COMMENT ON FUNCTION supersede_old_catalogues IS 'Automatically marks older catalogues as superseded when new one is uploaded';
```

---

## 5. Views for Reporting

### 5.1 Current Active Deals View

```sql
CREATE OR REPLACE VIEW v_current_active_deals AS
SELECT 
    md.deal_id,
    mdc.catalogue_month,
    md.oem_and_device AS device,
    md.device_status,
    md.price_plan,
    md.total_subscription_incl_vat AS monthly_price_incl_vat,
    md.total_subscription_excl_vat AS monthly_price_excl_vat,
    md.contract_term,
    md.total_data,
    md.total_minutes,
    md.promo_start_date,
    md.promo_end_date,
    md.available_on_helios,
    md.available_on_ilula,
    md.channel_deal_visibility,
    md.ebu_inventory_status_main AS inventory_status,
    CASE 
        WHEN md.promo_end_date < CURRENT_DATE THEN 'Expired'
        WHEN md.promo_start_date > CURRENT_DATE THEN 'Upcoming'
        ELSE 'Active'
    END AS promo_status
FROM public.mtn_deals md
JOIN public.mtn_deal_catalogues mdc ON md.catalogue_id = mdc.id
WHERE 
    mdc.catalogue_status = 'active'
    AND md.is_active_for_sale = true;

COMMENT ON VIEW v_current_active_deals IS 'Current month active deals available for sale';
```

---

### 5.2 Commission Summary View

```sql
CREATE OR REPLACE VIEW v_commission_summary AS
SELECT 
    DATE_TRUNC('month', mds.sale_date) AS sale_month,
    COUNT(mds.id) AS total_sales,
    SUM(mds.total_contract_value) AS total_contract_value,
    SUM(mds.mtn_commission_amount) AS total_mtn_commission,
    SUM(mds.circletel_commission_amount) AS total_circletel_commission,
    AVG(mds.circletel_commission_amount) AS avg_commission_per_sale,
    COUNT(CASE WHEN mds.commission_status = 'paid' THEN 1 END) AS paid_count,
    SUM(CASE WHEN mds.commission_status = 'paid' THEN mds.circletel_commission_amount ELSE 0 END) AS paid_amount,
    COUNT(CASE WHEN mds.commission_status = 'pending' THEN 1 END) AS pending_count,
    SUM(CASE WHEN mds.commission_status = 'pending' THEN mds.circletel_commission_amount ELSE 0 END) AS pending_amount
FROM public.mtn_deal_sales mds
WHERE mds.sale_status = 'active'
GROUP BY DATE_TRUNC('month', mds.sale_date)
ORDER BY sale_month DESC;

COMMENT ON VIEW v_commission_summary IS 'Monthly commission summary for CircleTel';
```

---

### 5.3 Deal Comparison View (Month-over-Month)

```sql
CREATE OR REPLACE VIEW v_deal_comparison AS
WITH current_deals AS (
    SELECT 
        md.deal_id,
        md.oem_and_device,
        md.total_subscription_incl_vat,
        mdc.catalogue_month
    FROM public.mtn_deals md
    JOIN public.mtn_deal_catalogues mdc ON md.catalogue_id = mdc.id
    WHERE mdc.catalogue_status = 'active'
),
previous_deals AS (
    SELECT 
        md.deal_id,
        md.oem_and_device,
        md.total_subscription_incl_vat,
        mdc.catalogue_month
    FROM public.mtn_deals md
    JOIN public.mtn_deal_catalogues mdc ON md.catalogue_id = mdc.id
    WHERE mdc.catalogue_status = 'superseded'
    AND mdc.catalogue_month = (
        SELECT MAX(catalogue_month)
        FROM public.mtn_deal_catalogues
        WHERE catalogue_status = 'superseded'
    )
)
SELECT 
    COALESCE(c.deal_id, p.deal_id) AS deal_id,
    COALESCE(c.oem_and_device, p.oem_and_device) AS device,
    p.total_subscription_incl_vat AS previous_price,
    c.total_subscription_incl_vat AS current_price,
    c.total_subscription_incl_vat - p.total_subscription_incl_vat AS price_change,
    CASE 
        WHEN p.deal_id IS NULL THEN 'New Deal'
        WHEN c.deal_id IS NULL THEN 'Removed'
        WHEN c.total_subscription_incl_vat != p.total_subscription_incl_vat THEN 'Price Changed'
        ELSE 'Unchanged'
    END AS change_type
FROM current_deals c
FULL OUTER JOIN previous_deals p ON c.deal_id = p.deal_id;

COMMENT ON VIEW v_deal_comparison IS 'Compares current month deals with previous month';
```

---

## 6. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.mtn_deal_catalogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtn_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtn_deal_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtn_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtn_commission_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admin full access
CREATE POLICY admin_all_mtn_data ON public.mtn_deals
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Sales team read access to active deals
CREATE POLICY sales_read_active_deals ON public.mtn_deals
    FOR SELECT
    TO authenticated
    USING (
        is_active_for_sale = true
        AND EXISTS (
            SELECT 1 FROM public.mtn_deal_catalogues mdc
            WHERE mdc.id = catalogue_id
            AND mdc.catalogue_status = 'active'
        )
    );

-- Policy: Sales team can create sales records
CREATE POLICY sales_create_own_sales ON public.mtn_deal_sales
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sales_person = auth.uid()
    );

-- Policy: Users can view their own sales
CREATE POLICY sales_view_own_sales ON public.mtn_deal_sales
    FOR SELECT
    TO authenticated
    USING (
        sales_person = auth.uid()
        OR customer_id IN (
            SELECT id FROM public.customers
            WHERE account_manager = auth.uid()
        )
    );

-- Policy: Finance team can view all commission data
CREATE POLICY finance_view_commissions ON public.mtn_commission_payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'department' IN ('finance', 'admin')
        )
    );
```

---

## 7. Data Import Procedures

### 7.1 Monthly Excel Import Process

```sql
CREATE OR REPLACE FUNCTION import_monthly_mtn_deals(
    p_catalogue_month DATE,
    p_file_name TEXT,
    p_uploaded_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_catalogue_id UUID;
BEGIN
    -- Create catalogue entry
    INSERT INTO public.mtn_deal_catalogues (
        catalogue_month,
        file_name,
        file_source,
        total_deals,
        effective_from,
        uploaded_by,
        catalogue_status
    )
    VALUES (
        p_catalogue_month,
        p_file_name,
        'Arlan Communications',
        0, -- Will be updated after import
        p_catalogue_month,
        p_uploaded_by,
        'active'
    )
    RETURNING id INTO v_catalogue_id;
    
    -- Note: Actual deal records will be inserted via batch process
    -- This function creates the catalogue container
    
    RETURN v_catalogue_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION import_monthly_mtn_deals IS 'Initiates monthly MTN deals catalogue import process';
```

---

### 7.2 Deal Change Detection

```sql
CREATE OR REPLACE FUNCTION detect_deal_changes(
    p_new_catalogue_id UUID,
    p_old_catalogue_id UUID
)
RETURNS TABLE (
    change_type TEXT,
    deal_id TEXT,
    change_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- New deals
    SELECT 
        'new'::TEXT,
        n.deal_id,
        jsonb_build_object(
            'device', n.oem_and_device,
            'price', n.total_subscription_incl_vat
        )
    FROM public.mtn_deals n
    WHERE n.catalogue_id = p_new_catalogue_id
    AND NOT EXISTS (
        SELECT 1 FROM public.mtn_deals o
        WHERE o.catalogue_id = p_old_catalogue_id
        AND o.deal_id = n.deal_id
    )
    
    UNION ALL
    
    -- Removed deals
    SELECT 
        'removed'::TEXT,
        o.deal_id,
        jsonb_build_object(
            'device', o.oem_and_device,
            'price', o.total_subscription_incl_vat
        )
    FROM public.mtn_deals o
    WHERE o.catalogue_id = p_old_catalogue_id
    AND NOT EXISTS (
        SELECT 1 FROM public.mtn_deals n
        WHERE n.catalogue_id = p_new_catalogue_id
        AND n.deal_id = o.deal_id
    )
    
    UNION ALL
    
    -- Price changes
    SELECT 
        'price_change'::TEXT,
        n.deal_id,
        jsonb_build_object(
            'device', n.oem_and_device,
            'old_price', o.total_subscription_incl_vat,
            'new_price', n.total_subscription_incl_vat,
            'difference', n.total_subscription_incl_vat - o.total_subscription_incl_vat
        )
    FROM public.mtn_deals n
    JOIN public.mtn_deals o ON n.deal_id = o.deal_id
    WHERE n.catalogue_id = p_new_catalogue_id
    AND o.catalogue_id = p_old_catalogue_id
    AND n.total_subscription_incl_vat != o.total_subscription_incl_vat;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_deal_changes IS 'Detects changes between two catalogue versions';
```

---

## 8. API Integration Points

### 8.1 REST API Endpoints (via PostgREST)

```
# Get active deals for Helios channel
GET /v_current_active_deals?available_on_helios=eq.Yes&select=*

# Get deals by device
GET /mtn_deals?oem_and_device=ilike.*iPhone*&select=*

# Get commission summary
GET /v_commission_summary?select=*

# Create new sale
POST /mtn_deal_sales
{
  "deal_id": "uuid",
  "customer_id": "uuid",
  "monthly_subscription_incl_vat": 899.00,
  "contract_term_months": 24,
  ...
}

# Get monthly commission report
GET /rpc/generate_monthly_commission_report?p_month=2025-10-01
```

---

### 8.2 GraphQL Queries (via pg_graphql)

```graphql
# Get active deals with commission calculation
query GetActiveDealsByChannel($channel: String!) {
  mtnDealsCollection(
    filter: {
      isActiveForSale: { eq: true }
      availableOnHelios: { eq: $channel }
    }
  ) {
    edges {
      node {
        dealId
        oemAndDevice
        totalSubscriptionInclVat
        contractTerm
        priceplan
        promoEndDate
      }
    }
  }
}

# Get sales with commission details
query GetMonthlySales($month: Date!) {
  mtnDealSalesCollection(
    filter: {
      saleDate: { gte: $month }
    }
  ) {
    edges {
      node {
        saleDate
        customer {
          companyName
        }
        deal {
          oemAndDevice
        }
        circletelCommissionAmount
        commissionStatus
      }
    }
  }
}
```

---

## 9. Maintenance Procedures

### 9.1 Archive Old Catalogues

```sql
CREATE OR REPLACE FUNCTION archive_old_catalogues(
    p_months_to_keep INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    UPDATE public.mtn_deal_catalogues
    SET catalogue_status = 'archived',
        updated_at = NOW()
    WHERE catalogue_status = 'superseded'
      AND catalogue_month < (CURRENT_DATE - (p_months_to_keep || ' months')::INTERVAL)
    RETURNING COUNT(*) INTO v_archived_count;
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_catalogues IS 'Archives catalogues older than specified months';
```

---

### 9.2 Vacuum and Analyse

```sql
-- Schedule via pg_cron extension
SELECT cron.schedule(
    'vacuum-mtn-tables',
    '0 2 * * 0', -- Every Sunday at 2 AM
    $$
    VACUUM ANALYSE public.mtn_deals;
    VACUUM ANALYSE public.mtn_deal_sales;
    VACUUM ANALYSE public.mtn_deal_catalogues;
    $$
);
```

---

## 10. Backup and Recovery

### 10.1 Point-in-Time Recovery

```sql
-- Enable for critical tables
ALTER TABLE public.mtn_deal_sales SET (autovacuum_enabled = true);
ALTER TABLE public.mtn_commission_payments SET (autovacuum_enabled = true);

-- Backup schedule recommendation: Daily incremental, weekly full
```

---

### 10.2 Data Export for Compliance

```sql
CREATE OR REPLACE FUNCTION export_sales_data_for_period(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS SETOF public.mtn_deal_sales AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.mtn_deal_sales
    WHERE sale_date BETWEEN p_start_date AND p_end_date
    ORDER BY sale_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION export_sales_data_for_period IS 'Exports sales data for compliance and audit purposes';
```

---

## 11. Performance Optimisation

### 11.1 Partitioning Strategy

```sql
-- Partition mtn_deal_sales by month for better query performance
CREATE TABLE public.mtn_deal_sales_partitioned (
    LIKE public.mtn_deal_sales INCLUDING ALL
) PARTITION BY RANGE (sale_date);

-- Create partitions for each month
CREATE TABLE public.mtn_deal_sales_2025_10 
    PARTITION OF public.mtn_deal_sales_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE public.mtn_deal_sales_2025_11 
    PARTITION OF public.mtn_deal_sales_partitioned
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Continue creating partitions as needed
```

---

### 11.2 Materialised Views for Dashboards

```sql
CREATE MATERIALISED VIEW mv_deal_analytics AS
SELECT 
    DATE_TRUNC('month', mdc.catalogue_month) AS month,
    COUNT(DISTINCT md.deal_id) AS total_deals,
    COUNT(DISTINCT md.oem_and_device) AS unique_devices,
    AVG(md.total_subscription_incl_vat) AS avg_monthly_price,
    MIN(md.total_subscription_incl_vat) AS min_price,
    MAX(md.total_subscription_incl_vat) AS max_price,
    COUNT(CASE WHEN md.available_on_helios = 'Yes' THEN 1 END) AS helios_deals,
    COUNT(CASE WHEN md.available_on_ilula = 'Yes' THEN 1 END) AS ilula_deals
FROM public.mtn_deals md
JOIN public.mtn_deal_catalogues mdc ON md.catalogue_id = mdc.id
GROUP BY DATE_TRUNC('month', mdc.catalogue_month);

CREATE UNIQUE INDEX ON mv_deal_analytics (month);

-- Refresh schedule (via pg_cron)
SELECT cron.schedule(
    'refresh-deal-analytics',
    '0 1 * * *', -- Daily at 1 AM
    $$REFRESH MATERIALISED VIEW CONCURRENTLY mv_deal_analytics$$
);

COMMENT ON MATERIALISED VIEW mv_deal_analytics IS 'Pre-computed deal analytics for dashboard performance';
```

---

## 12. Implementation Checklist

### Phase 1: Core Schema (Week 1)
- [ ] Create `mtn_deal_catalogues` table
- [ ] Create `mtn_deals` table
- [ ] Create `mtn_commission_rates` table with initial data
- [ ] Set up basic indexes
- [ ] Implement timestamp triggers
- [ ] Test with sample data

### Phase 2: Sales Tracking (Week 2)
- [ ] Create `mtn_deal_sales` table
- [ ] Create `mtn_commission_payments` table
- [ ] Implement commission calculation function
- [ ] Create commission calculation trigger
- [ ] Test commission calculations
- [ ] Set up RLS policies

### Phase 3: Supporting Features (Week 3)
- [ ] Create `mtn_deal_changes` table
- [ ] Create `mtn_price_plan_mappings` table
- [ ] Implement change detection function
- [ ] Create reporting views
- [ ] Set up materialised views
- [ ] Test data import procedures

### Phase 4: Integration & Optimisation (Week 4)
- [ ] Configure API endpoints
- [ ] Implement GraphQL queries
- [ ] Set up partitioning for large tables
- [ ] Configure backup schedules
- [ ] Set up monitoring and alerts
- [ ] Load testing and performance tuning
- [ ] Documentation and training

---

## 13. Monthly Data Update Workflow

### Step-by-Step Process

1. **Receive Excel File from Arlan Communications**
   - Expected by: 5th of each month (per clause 4.2 of Sales Agreement)
   - File format: `.xlsx` with standard column structure

2. **Pre-Import Validation**
   ```sql
   -- Check for existing catalogue for the month
   SELECT * FROM public.mtn_deal_catalogues 
   WHERE catalogue_month = '2025-11-01';
   ```

3. **Create New Catalogue Entry**
   ```sql
   SELECT import_monthly_mtn_deals(
       '2025-11-01',
       'Helios_and_iLula_Business_Promos_-_Nov_2025_-_Deals.xlsx',
       auth.uid()
   );
   ```

4. **Bulk Insert Deals**
   - Use Supabase client library or PostgREST
   - Batch insert 1000 records at a time
   - Monitor for errors and rollback if needed

5. **Post-Import Validation**
   ```sql
   -- Verify record count
   SELECT 
       mdc.catalogue_month,
       mdc.total_deals AS expected,
       COUNT(md.id) AS actual
   FROM public.mtn_deal_catalogues mdc
   LEFT JOIN public.mtn_deals md ON mdc.id = md.catalogue_id
   WHERE mdc.catalogue_month = '2025-11-01'
   GROUP BY mdc.id, mdc.catalogue_month, mdc.total_deals;
   ```

6. **Change Detection**
   ```sql
   -- Detect changes from previous month
   SELECT * FROM detect_deal_changes(
       (SELECT id FROM public.mtn_deal_catalogues WHERE catalogue_month = '2025-11-01'),
       (SELECT id FROM public.mtn_deal_catalogues WHERE catalogue_month = '2025-10-01')
   );
   ```

7. **Update Catalogue Status**
   - Trigger automatically marks previous catalogues as 'superseded'
   - Verify status updates

8. **Notification**
   - Send notification to relevant teams about new catalogue
   - Highlight significant changes

---

## 14. Integration with CircleTel Systems

### 14.1 Customer Dashboard Integration

```typescript
// Example: Fetch available deals for customer
const fetchAvailableDeals = async (channel: 'Helios' | 'iLula') => {
  const { data, error } = await supabase
    .from('v_current_active_deals')
    .select('*')
    .eq(channel === 'Helios' ? 'available_on_helios' : 'available_on_ilula', 'Yes')
    .gte('promo_end_date', new Date().toISOString())
    .order('monthly_price_incl_vat', { ascending: true });
    
  return data;
};
```

---

### 14.2 Sales Portal Integration

```typescript
// Example: Record new sale
const recordMTNSale = async (saleData: MTNSaleInput) => {
  const { data, error } = await supabase
    .from('mtn_deal_sales')
    .insert({
      deal_id: saleData.dealId,
      customer_id: saleData.customerId,
      monthly_subscription_incl_vat: saleData.monthlySubscription,
      monthly_subscription_excl_vat: saleData.monthlySubscription / 1.15,
      contract_term_months: saleData.contractTerm,
      contract_start_date: saleData.startDate,
      contract_end_date: addMonths(saleData.startDate, saleData.contractTerm),
      sale_channel: saleData.channel,
      sales_person: await getCurrentUserId()
    })
    .select();
    
  // Commission is automatically calculated via trigger
  return data;
};
```

---

## 15. Reporting and Analytics

### 15.1 Key Performance Indicators (KPIs)

```sql
-- Monthly KPI Dashboard Query
SELECT 
    -- Current month stats
    (SELECT COUNT(*) FROM public.mtn_deal_sales 
     WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
     AND sale_status = 'active') AS current_month_sales,
    
    (SELECT SUM(circletel_commission_amount) 
     FROM public.mtn_deal_sales 
     WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
     AND sale_status = 'active') AS current_month_commission,
    
    -- YTD stats
    (SELECT COUNT(*) FROM public.mtn_deal_sales 
     WHERE EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
     AND sale_status = 'active') AS ytd_sales,
    
    (SELECT SUM(circletel_commission_amount) 
     FROM public.mtn_deal_sales 
     WHERE EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
     AND sale_status = 'active') AS ytd_commission,
    
    -- Active deals
    (SELECT COUNT(*) FROM public.v_current_active_deals) AS active_deals_count,
    
    -- Pending commission
    (SELECT SUM(circletel_commission_amount) 
     FROM public.mtn_deal_sales 
     WHERE commission_status = 'pending'
     AND sale_status = 'active') AS pending_commission;
```

---

### 15.2 Executive Dashboard Query

```sql
CREATE OR REPLACE VIEW v_executive_dashboard AS
WITH monthly_stats AS (
    SELECT 
        DATE_TRUNC('month', sale_date) AS month,
        COUNT(*) AS sales_count,
        SUM(total_contract_value) AS total_contract_value,
        SUM(circletel_commission_amount) AS commission_earned,
        AVG(circletel_commission_amount) AS avg_commission_per_sale
    FROM public.mtn_deal_sales
    WHERE sale_status = 'active'
    GROUP BY DATE_TRUNC('month', sale_date)
),
channel_performance AS (
    SELECT 
        sale_channel,
        COUNT(*) AS sales_count,
        SUM(circletel_commission_amount) AS commission
    FROM public.mtn_deal_sales
    WHERE sale_status = 'active'
    AND DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY sale_channel
)
SELECT 
    ms.*,
    (SELECT jsonb_agg(cp.*) FROM channel_performance cp) AS channel_breakdown
FROM monthly_stats ms
WHERE ms.month >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
ORDER BY ms.month DESC;
```

---

## 16. Security and Compliance

### 16.1 Data Privacy (POPIA Compliance)

- Personal customer information should be in separate `customers` table
- MTN deal data does not contain personal information
- Commission data linked via UUID references
- RLS policies enforce data access controls
- Audit trails via `created_at` and `updated_at` timestamps

---

### 16.2 Audit Logging

```sql
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_mtn_deal_sales
    AFTER INSERT OR UPDATE OR DELETE ON public.mtn_deal_sales
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_commission_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.mtn_commission_payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 17. Monitoring and Alerts

### 17.1 Database Health Checks

```sql
-- Table size monitoring
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'mtn%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### 17.2 Alert Conditions

```sql
-- Missing monthly catalogue alert
CREATE OR REPLACE FUNCTION check_missing_catalogue()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        WHERE NOT EXISTS (
            SELECT 1 FROM public.mtn_deal_catalogues
            WHERE catalogue_month = DATE_TRUNC('month', CURRENT_DATE)
        )
        AND EXTRACT(DAY FROM CURRENT_DATE) > 7 -- Alert after 7th of month
    );
END;
$$ LANGUAGE plpgsql;

-- Unpaid commission alert
CREATE OR REPLACE FUNCTION check_overdue_commission()
RETURNS TABLE (
    month DATE,
    days_overdue INTEGER,
    amount_due DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.payment_month,
        (CURRENT_DATE - (cp.payment_month + INTERVAL '25 days')::DATE)::INTEGER AS days_overdue,
        cp.total_circletel_commission
    FROM public.mtn_commission_payments cp
    WHERE cp.reconciliation_status IN ('pending', 'disputed')
    AND cp.payment_month + INTERVAL '25 days' < CURRENT_DATE
    ORDER BY cp.payment_month;
END;
$$ LANGUAGE plpgsql;
```

---

## 18. API Documentation Examples

### 18.1 REST API Examples

```bash
# Get all active deals for October 2025
curl -X GET "https://your-project.supabase.co/rest/v1/v_current_active_deals" \
  -H "apikey: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search for Samsung deals
curl -X GET "https://your-project.supabase.co/rest/v1/mtn_deals?oem_and_device=ilike.*Samsung*" \
  -H "apikey: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Calculate commission for a deal
curl -X POST "https://your-project.supabase.co/rest/v1/rpc/calculate_deal_commission" \
  -H "apikey: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_subscription_amount": 899.00,
    "p_contract_term_months": 24,
    "p_effective_date": "2025-10-27"
  }'

# Get monthly commission report
curl -X POST "https://your-project.supabase.co/rest/v1/rpc/generate_monthly_commission_report" \
  -H "apikey: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"p_month": "2025-10-01"}'
```

---

## 19. Migration Scripts

### 19.1 Initial Schema Creation Script

Save this as `001_initial_mtn_deals_schema.sql`:

```sql
-- Migration: Initial MTN Deals Schema
-- Version: 1.0
-- Date: 2025-10-27

BEGIN;

-- Create tables in order of dependencies
-- (Full SQL from sections above)

-- Create indexes
-- (Full SQL from sections above)

-- Create functions
-- (Full SQL from sections above)

-- Create triggers
-- (Full SQL from sections above)

-- Create views
-- (Full SQL from sections above)

-- Set up RLS
-- (Full SQL from sections above)

-- Insert initial commission rates
-- (Full SQL from section 2.1)

COMMIT;
```

---

## 20. Testing Strategy

### 20.1 Unit Tests

```sql
-- Test commission calculation
DO $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result
    FROM calculate_deal_commission(500.00, 24, '2025-10-27');
    
    ASSERT v_result.circletel_rate = 0.02925, 'Incorrect CircleTel commission rate';
    ASSERT v_result.circletel_commission = 351.00, 'Incorrect commission amount';
    
    RAISE NOTICE 'Commission calculation test passed';
END $$;
```

---

### 20.2 Integration Tests

```typescript
// Example Jest test for Supabase integration
describe('MTN Deals Integration', () => {
  test('should fetch active deals', async () => {
    const { data, error } = await supabase
      .from('v_current_active_deals')
      .select('*')
      .limit(10);
      
    expect(error).toBeNull();
    expect(data).toHaveLength(10);
    expect(data[0]).toHaveProperty('deal_id');
  });
  
  test('should calculate commission correctly', async () => {
    const { data, error } = await supabase.rpc('calculate_deal_commission', {
      p_subscription_amount: 899.00,
      p_contract_term_months: 24,
      p_effective_date: '2025-10-27'
    });
    
    expect(error).toBeNull();
    expect(data[0].circletel_commission).toBeCloseTo(762.48, 2);
  });
});
```

---

## 21. Future Enhancements

### Phase 2 Features (Q1 2026)
- Automated email alerts for catalogue updates
- Mobile app integration for sales team
- Predictive analytics for deal performance
- Customer deal recommendation engine
- Integration with CRM systems

### Phase 3 Features (Q2 2026)
- Machine learning for price optimisation
- Real-time inventory synchronisation
- Advanced commission dispute management
- Multi-channel attribution tracking
- API rate limiting and caching

---

## 22. Support and Maintenance

### 22.1 Database Maintenance Schedule

| Task | Frequency | Day/Time |
|------|-----------|----------|
| Vacuum and analyse | Weekly | Sunday 02:00 |
| Refresh materialised views | Daily | 01:00 |
| Archive old catalogues | Monthly | 1st, 03:00 |
| Backup verification | Daily | 04:00 |
| Index rebuild (if needed) | Quarterly | As needed |
| RLS policy review | Quarterly | As needed |

---

### 22.2 Contact Information

**Database Administrator:** CircleTel DevOps Team  
**Email:** devops@circletel.co.za  
**Escalation:** technical-support@circletel.co.za

---

## Appendix A: Column Mapping Reference

| Excel Column | Database Column | Data Type | Notes |
|--------------|-----------------|-----------|-------|
| Deal ID | deal_id | TEXT | Primary identifier |
| Promo Start date | promo_start_date | DATE | Converted from MM/DD/YYYY |
| Promo End date | promo_end_date | DATE | Converted from MM/DD/YYYY |
| OEM and Device | oem_and_device | TEXT | Device name |
| Total Subscription Incl Vat | total_subscription_incl_vat | DECIMAL(10,2) | Monthly price |
| Contract Term | contract_term | INTEGER | Months |
| Available on Helios | available_on_helios | TEXT | 'Yes'/'No' |
| Available on iLula | available_on_ilula | TEXT | 'Yes'/'No' |

---

## Appendix B: Sample Data Queries

```sql
-- Find best value deals (data per rand)
SELECT 
    deal_id,
    oem_and_device,
    total_subscription_incl_vat AS monthly_price,
    total_data,
    CASE 
        WHEN total_data ~ '^[0-9.]+GB$' THEN
            (CAST(REGEXP_REPLACE(total_data, '[^0-9.]', '', 'g') AS DECIMAL) * 1024)
            / NULLIF(total_subscription_incl_vat, 0)
        ELSE NULL
    END AS mb_per_rand
FROM public.v_current_active_deals
WHERE total_data IS NOT NULL
ORDER BY mb_per_rand DESC NULLS LAST
LIMIT 20;

-- Find deals expiring soon
SELECT 
    deal_id,
    oem_and_device,
    promo_end_date,
    promo_end_date - CURRENT_DATE AS days_remaining
FROM public.v_current_active_deals
WHERE promo_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
ORDER BY promo_end_date;

-- Compare prices across contract terms
SELECT 
    oem_and_device,
    contract_term,
    total_subscription_incl_vat,
    total_subscription_incl_vat * contract_term AS total_cost
FROM public.v_current_active_deals
WHERE oem_and_device LIKE '%iPhone 17%'
ORDER BY oem_and_device, contract_term;
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **EBU** | Enterprise Business Unit (MTN segment) |
| **CTB** | Come To Buy (device upgrade deals) |
| **Eppix** | MTN's billing and product management system |
| **ITB** | Itemised billing |
| **CLI** | Calling Line Identification |
| **BRC** | Business Retail Channel |
| **Corp** | Corporate channel |
| **On-net** | Calls within MTN network |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | CircleTel Product Strategy | Initial database structure document |

---

**END OF DOCUMENT**

This document supersedes any previous database structure documentation for MTN Deals management and should be used as the authoritative reference for all implementations.
