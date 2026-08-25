-- Lab Overlay NAS as a Site on Estate. Not a clinic flip.
-- FWA site_code LAB-GENERIC already has overlay reachability.

INSERT INTO public.corporate_accounts (
  corporate_code,
  company_name,
  primary_contact_name,
  primary_contact_email,
  notes
)
VALUES (
  'CTLAB',
  'CircleTel Lab',
  'CircleTel Lab',
  'lab@circletel.co.za',
  'Pilot bench parent. Not a venue operator. Lab NAS counts as a Site.'
)
ON CONFLICT (corporate_code) DO NOTHING;

INSERT INTO public.corporate_sites (
  corporate_id,
  site_number,
  site_name,
  site_code,
  radius_provider,
  status,
  installation_address
)
SELECT
  accounts.id,
  1,
  'Lab generic NAS',
  'LAB-GENERIC',
  'radius',
  'active',
  '{"address":"CircleTel lab bench","province":"Gauteng"}'::jsonb
FROM public.corporate_accounts AS accounts
WHERE accounts.corporate_code = 'CTLAB'
  AND NOT EXISTS (
    SELECT 1
    FROM public.corporate_sites AS sites
    WHERE sites.site_code = 'LAB-GENERIC'
  );
