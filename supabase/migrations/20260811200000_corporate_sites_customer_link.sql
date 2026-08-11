-- Link a corporate site to the customer record that went through onboarding.
--
-- The Unjani Connect onboarding process (guide v1.22) runs six stages from
-- "Clinic nominated" to "Go live". Stages 1-4 are tracked on the customer side
-- (customers, onboarding_tokens, onboarding_submissions); stages 5-6 are tracked
-- on the site side (corporate_sites). There was no key joining the two, so a
-- per-site pipeline stage could only be guessed from the clinic name, which
-- matched 20 of 26 sites.
--
-- Nullable on purpose: a site may exist before its customer record is matched,
-- and ON DELETE SET NULL keeps the site if the customer record is removed.

ALTER TABLE corporate_sites
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_corporate_sites_customer_id
  ON corporate_sites (customer_id)
  WHERE customer_id IS NOT NULL;

COMMENT ON COLUMN corporate_sites.customer_id IS
  'Customer record this site was onboarded under. Joins site-side stages (survey/install, go live) to customer-side onboarding stages (nominated, introduction, details confirmed, visit booked).';
