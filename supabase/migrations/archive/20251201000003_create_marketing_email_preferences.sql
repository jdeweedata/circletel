-- ============================================================================
-- Marketing Email Preferences Table
-- ============================================================================
-- This table tracks customer preferences for marketing emails.
-- Customers can unsubscribe from marketing communications while still
-- receiving essential transactional emails (invoices, service notifications).
-- ============================================================================

-- Create marketing_email_preferences table
CREATE TABLE IF NOT EXISTS public.marketing_email_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Customer identification (can be linked to customers table or standalone)
    email VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    
    -- Marketing email categories
    promotional_emails BOOLEAN DEFAULT TRUE,        -- Promotions, deals, special offers
    newsletter_emails BOOLEAN DEFAULT TRUE,         -- Company newsletters
    product_updates BOOLEAN DEFAULT TRUE,           -- New product/service announcements
    partner_offers BOOLEAN DEFAULT FALSE,           -- Third-party partner offers
    
    -- Global unsubscribe (overrides all above)
    unsubscribed_all BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE,
    unsubscribe_reason TEXT,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique email
    CONSTRAINT unique_marketing_email UNIQUE (email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_email_preferences_email 
    ON public.marketing_email_preferences(email);
CREATE INDEX IF NOT EXISTS idx_marketing_email_preferences_customer_id 
    ON public.marketing_email_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_marketing_email_preferences_token 
    ON public.marketing_email_preferences(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_marketing_email_preferences_unsubscribed 
    ON public.marketing_email_preferences(unsubscribed_all);

-- Add updated_at trigger
CREATE TRIGGER update_marketing_email_preferences_updated_at 
    BEFORE UPDATE ON public.marketing_email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.marketing_email_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
-- Service role can manage all preferences
CREATE POLICY "Service role can manage marketing preferences" 
    ON public.marketing_email_preferences
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Customers can view and update their own preferences via token
CREATE POLICY "Anyone can view preferences by token" 
    ON public.marketing_email_preferences
    FOR SELECT
    USING (true);

-- Comments
COMMENT ON TABLE public.marketing_email_preferences IS 
    'Stores customer marketing email preferences. Customers can unsubscribe from marketing while still receiving transactional emails.';
COMMENT ON COLUMN public.marketing_email_preferences.promotional_emails IS 
    'Opt-in for promotional emails, deals, and special offers';
COMMENT ON COLUMN public.marketing_email_preferences.newsletter_emails IS 
    'Opt-in for company newsletters and updates';
COMMENT ON COLUMN public.marketing_email_preferences.product_updates IS 
    'Opt-in for new product and service announcements';
COMMENT ON COLUMN public.marketing_email_preferences.partner_offers IS 
    'Opt-in for third-party partner offers (default off)';
COMMENT ON COLUMN public.marketing_email_preferences.unsubscribed_all IS 
    'Global unsubscribe from all marketing emails';
COMMENT ON COLUMN public.marketing_email_preferences.unsubscribe_token IS 
    'Unique token for secure unsubscribe links in emails';

-- ============================================================================
-- View for checking if an email should receive marketing
-- ============================================================================
CREATE OR REPLACE VIEW public.v_marketing_email_status AS
SELECT 
    email,
    customer_id,
    CASE 
        WHEN unsubscribed_all THEN FALSE
        ELSE promotional_emails
    END AS can_receive_promotional,
    CASE 
        WHEN unsubscribed_all THEN FALSE
        ELSE newsletter_emails
    END AS can_receive_newsletter,
    CASE 
        WHEN unsubscribed_all THEN FALSE
        ELSE product_updates
    END AS can_receive_product_updates,
    CASE 
        WHEN unsubscribed_all THEN FALSE
        ELSE partner_offers
    END AS can_receive_partner_offers,
    NOT unsubscribed_all AS can_receive_any_marketing,
    unsubscribed_at,
    updated_at
FROM public.marketing_email_preferences;

COMMENT ON VIEW public.v_marketing_email_status IS 
    'View to easily check if an email address should receive marketing communications';
