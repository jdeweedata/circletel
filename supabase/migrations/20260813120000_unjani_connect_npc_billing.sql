-- Unjani Connect NPC billing (1 September 2026): RFS / job card gate,
-- 25-month contract fields, and NPC invoice query window.

ALTER TABLE public.corporate_sites
  ADD COLUMN IF NOT EXISTS rfs_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS rfs_certificate_path text,
  ADD COLUMN IF NOT EXISTS job_card_path text,
  ADD COLUMN IF NOT EXISTS job_card_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS job_card_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS job_card_approved_by uuid,
  ADD COLUMN IF NOT EXISTS contract_end_at date,
  ADD COLUMN IF NOT EXISTS contract_term_months integer,
  ADD COLUMN IF NOT EXISTS equipment_owner text DEFAULT 'circletel';

COMMENT ON COLUMN public.corporate_sites.rfs_issued_at IS
  'Ready for Service date. Starts the 30-calendar-day Unjani Connect free period.';
COMMENT ON COLUMN public.corporate_sites.equipment_owner IS
  'Always circletel for Unjani Connect — CPE remains CircleTel property.';

ALTER TABLE public.customer_invoices
  ADD COLUMN IF NOT EXISTS query_status text,
  ADD COLUMN IF NOT EXISTS query_note text,
  ADD COLUMN IF NOT EXISTS queried_at timestamptz,
  ADD COLUMN IF NOT EXISTS queried_by uuid;

COMMENT ON COLUMN public.customer_invoices.query_status IS
  'NPC invoice query window: null (open), queried, or cleared.';

-- Product catalogue: Unjani Connect NPC rules from 1 September 2026.
UPDATE public.service_packages
SET
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'contract_term_months', 25,
    'product_name', 'Unjani Connect',
    'npc_billing_from', '2026-09-01',
    'legacy_live_term_months', 24,
    'free_calendar_days', 30,
    'bill_to', 'Unjani Clinics NPC'
  )
WHERE sku = 'UNJ-MC-001';
