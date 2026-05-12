-- Corporate Billing Linkage Migration
-- Links customers and invoices to corporate sites for per-nurse billing
-- Unjani billing go-live: 1 June 2026

-- 1. Add corporate_site_id to customers (nurse → clinic linkage)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS corporate_site_id uuid REFERENCES corporate_sites(id);

CREATE INDEX IF NOT EXISTS idx_customers_corporate_site_id
  ON customers(corporate_site_id) WHERE corporate_site_id IS NOT NULL;

-- 2. Add corporate_site_id to customer_invoices (invoice → clinic for HQ drill-down)
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS corporate_site_id uuid REFERENCES corporate_sites(id);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_corporate_site_id
  ON customer_invoices(corporate_site_id) WHERE corporate_site_id IS NOT NULL;

-- 3. Index on corporate_account_id (already exists but ensure indexed for HQ queries)
CREATE INDEX IF NOT EXISTS idx_customer_invoices_corporate_account_id
  ON customer_invoices(corporate_account_id) WHERE corporate_account_id IS NOT NULL;

-- 4. Set monthly_fee = 450.00 on all active Unjani sites
UPDATE corporate_sites
SET monthly_fee = 450.00,
    updated_at = now()
WHERE corporate_id = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e'
  AND status = 'active'
  AND monthly_fee IS NULL;

-- 5. Update Unjani corporate account: billing contact, contract dates, expected_sites
UPDATE corporate_accounts
SET billing_contact_name = 'Unjani Clinics Finance',
    billing_contact_email = 'finance@unjani.org',
    billing_cycle = 'monthly',
    payment_terms = 30,
    contract_start_date = '2026-06-01',
    expected_sites = 253,
    industry = 'Healthcare',
    updated_at = now()
WHERE id = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e';

-- 6. Populate site_contact_* from Unjani register for active pilot sites
-- Alexandra
UPDATE corporate_sites SET site_contact_name = 'Tumelo Magula', site_contact_email = 'alexandra@unjani.org', site_contact_phone = '079 450 8924' WHERE account_number = 'CT-UNJ-002' AND site_contact_name IS NULL;
-- Barcelona
UPDATE corporate_sites SET site_contact_name = 'Lesedi Mmoneng', site_contact_email = 'barcelona@unjani.org', site_contact_phone = '079 227 7729' WHERE account_number = 'CT-UNJ-013' AND site_contact_name IS NULL;
-- Chloorkop
UPDATE corporate_sites SET site_contact_name = 'Jacqueline Mphuthi', site_contact_email = 'chloorkop@unjani.org', site_contact_phone = '077 465 4848' WHERE account_number = 'CT-UNJ-006' AND site_contact_name IS NULL;
-- Cosmo City
UPDATE corporate_sites SET site_contact_name = 'Mbali Mbatha', site_contact_email = 'cosmo@unjani.org', site_contact_phone = '079 810 5147' WHERE account_number = 'CT-UNJ-007' AND site_contact_name IS NULL;
-- Durban
UPDATE corporate_sites SET site_contact_name = 'Zanele Mulenga', site_contact_email = 'durban@unjani.org', site_contact_phone = '067 144 9498' WHERE account_number = 'CT-UNJ-022' AND site_contact_name IS NULL;
-- Fleurhof
UPDATE corporate_sites SET site_contact_name = 'Mpho Nxumalo', site_contact_email = 'fleurhof@unjani.org', site_contact_phone = '073 394 5117' WHERE account_number = 'CT-UNJ-008' AND site_contact_name IS NULL;
-- Heidelberg
UPDATE corporate_sites SET site_contact_name = 'Melany Gulston', site_contact_email = 'heidelburg@unjani.org', site_contact_phone = '082 450 4695' WHERE account_number = 'CT-UNJ-012' AND site_contact_name IS NULL;
-- Jabulani
UPDATE corporate_sites SET site_contact_name = 'Minah Mabunda', site_contact_email = 'jabulani@unjani.org', site_contact_phone = '076 294 3398' WHERE account_number = 'CT-UNJ-015' AND site_contact_name IS NULL;
-- Kayamandi
UPDATE corporate_sites SET site_contact_name = 'Nobulali Gxagxisa', site_contact_email = 'kayamandi@unjani.org', site_contact_phone = '074 515 9559' WHERE account_number = 'CT-UNJ-018' AND site_contact_name IS NULL;
-- Lens ext 10
UPDATE corporate_sites SET site_contact_name = 'Tsabeng Ramalope', site_contact_email = 'lensext10@unjani.org', site_contact_phone = '071 898 8722' WHERE account_number = 'CT-UNJ-016' AND site_contact_name IS NULL;
-- Nokaneng (Lenasia South in register)
UPDATE corporate_sites SET site_contact_name = 'Zandile Sibisi', site_contact_email = 'lenasiasouth@unjani.org', site_contact_phone = '064 468 0688' WHERE account_number = 'CT-UNJ-017' AND site_contact_name IS NULL;
-- Oukasie
UPDATE corporate_sites SET site_contact_name = 'Maggie Tlhoaele', site_contact_email = 'oukasie@unjani.org', site_contact_phone = '060 356 4365' WHERE account_number = 'CT-UNJ-014' AND site_contact_name IS NULL;
-- Phoenix
UPDATE corporate_sites SET site_contact_name = 'Philile Mthethwa', site_contact_email = 'pheonix@unjani.org', site_contact_phone = '083 534 2194' WHERE account_number = 'CT-UNJ-021' AND site_contact_name IS NULL;
-- Sicelo
UPDATE corporate_sites SET site_contact_name = 'Motshidisi Molubi', site_contact_email = 'sicelo@unjani.org', site_contact_phone = '061 525 5156' WHERE account_number = 'CT-UNJ-011' AND site_contact_name IS NULL;
-- Sky City
UPDATE corporate_sites SET site_contact_name = 'Philisiwe Modise', site_contact_email = 'skycity@unjani.org', site_contact_phone = '076 071 4887' WHERE account_number = 'CT-UNJ-009' AND site_contact_name IS NULL;
-- Soshanguve
UPDATE corporate_sites SET site_contact_name = 'Salome Moletsane', site_contact_email = 'soshanguve@unjani.org', site_contact_phone = '076 113 0227' WHERE account_number = 'CT-UNJ-025' AND site_contact_name IS NULL;
-- Sweetwaters
UPDATE corporate_sites SET site_contact_name = 'Thandi Mbandlwa', site_contact_email = 'sweetwaters@unjani.org', site_contact_phone = '082 822 2343' WHERE account_number = 'CT-UNJ-020' AND site_contact_name IS NULL;
-- Tokoza
UPDATE corporate_sites SET site_contact_name = 'Philisiwe Modise', site_contact_email = 'tokoza@unjani.org', site_contact_phone = '081 435 0985' WHERE account_number = 'CT-UNJ-010' AND site_contact_name IS NULL;
-- Umsinga
UPDATE corporate_sites SET site_contact_name = 'Nolwazi Dlamini', site_contact_email = 'umsinga@unjani.org', site_contact_phone = '061 509 5966' WHERE account_number = 'CT-UNJ-024' AND site_contact_name IS NULL;
-- Zamdela
UPDATE corporate_sites SET site_contact_name = 'Mahlatse Makofane', site_contact_email = 'zamdela@unjani.org', site_contact_phone = '067 841 8157' WHERE account_number = 'CT-UNJ-019' AND site_contact_name IS NULL;

-- Pending sites (no nurse contact yet, keep NULL)
-- CT-UNJ-001 (Soweto Diepkloof), CT-UNJ-003 (Khayelitsha), CT-UNJ-004 (Mamelodi), CT-UNJ-005 (Umlazi)
