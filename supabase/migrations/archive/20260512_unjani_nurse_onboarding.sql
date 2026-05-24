-- Unjani Nurse Onboarding Migration
-- Creates customer + customer_services records for 20 active pilot site nurses
-- Billing starts 1 June 2026 (activation_date), billing_day = 1
-- Package: Unjani Managed Connectivity (f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e), R450.00 excl VAT

DO $$
DECLARE
  v_site RECORD;
  v_customer_id uuid;
  v_service_id uuid;
  v_seq int := 9; -- CT-2026-00008 is the latest, start from 00009
  v_first_name text;
  v_last_name text;
  v_name_parts text[];
BEGIN
  FOR v_site IN
    SELECT id, account_number, site_name, site_contact_name, site_contact_email, site_contact_phone
    FROM corporate_sites
    WHERE corporate_id = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e'
      AND status = 'active'
      AND site_contact_name IS NOT NULL
      AND site_contact_email IS NOT NULL
    ORDER BY account_number
  LOOP
    -- Skip if customer already exists for this site
    IF EXISTS (SELECT 1 FROM customers WHERE corporate_site_id = v_site.id) THEN
      CONTINUE;
    END IF;

    -- Parse name: last word = last_name, everything before = first_name
    v_name_parts := string_to_array(trim(v_site.site_contact_name), ' ');
    IF array_length(v_name_parts, 1) >= 2 THEN
      v_last_name := v_name_parts[array_length(v_name_parts, 1)];
      v_first_name := array_to_string(v_name_parts[1:array_length(v_name_parts, 1)-1], ' ');
    ELSE
      v_first_name := v_site.site_contact_name;
      v_last_name := '';
    END IF;

    -- Create customer record
    v_customer_id := gen_random_uuid();
    INSERT INTO customers (
      id, first_name, last_name, email, phone,
      account_type, status, account_status,
      account_number, corporate_site_id,
      business_name
    ) VALUES (
      v_customer_id,
      v_first_name,
      v_last_name,
      v_site.site_contact_email,
      v_site.site_contact_phone,
      'business',
      'active',
      'active',
      'CT-2026-' || lpad(v_seq::text, 5, '0'),
      v_site.id,
      v_site.site_name
    );

    -- Create customer_services record
    v_service_id := gen_random_uuid();
    INSERT INTO customer_services (
      id, customer_id, package_id, package_name,
      service_type, product_category,
      monthly_price, setup_fee,
      status, active,
      speed_down, speed_up,
      billing_day,
      activation_date, contract_start_date,
      contract_months,
      installation_address
    ) VALUES (
      v_service_id,
      v_customer_id,
      'f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e',
      'Unjani Managed Connectivity',
      'fibre',
      'corporate',
      450.00,
      0,
      'active',
      true,
      10, 10,
      1,
      '2026-06-01',
      '2026-06-01',
      0, -- month-to-month
      v_site.site_name
    );

    -- Link service back to corporate_site
    UPDATE corporate_sites
    SET service_id = v_service_id,
        updated_at = now()
    WHERE id = v_site.id;

    v_seq := v_seq + 1;
  END LOOP;
END $$;
