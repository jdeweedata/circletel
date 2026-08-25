-- Link hardware inventory (network_devices) to corporate MSA sites.
-- Enables Unjani AP ↔ site joins for Usage Reports / SSID rollups when
-- ruijie_device_cache is sparse or empty. Wayfinder #674 / #672.

ALTER TABLE public.network_devices
  ADD COLUMN IF NOT EXISTS corporate_site_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'network_devices_corporate_site_id_fkey'
  ) THEN
    ALTER TABLE public.network_devices
      ADD CONSTRAINT network_devices_corporate_site_id_fkey
      FOREIGN KEY (corporate_site_id)
      REFERENCES public.corporate_sites(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_network_devices_corporate_site
  ON public.network_devices (corporate_site_id)
  WHERE corporate_site_id IS NOT NULL;

COMMENT ON COLUMN public.network_devices.corporate_site_id IS
  'B2B corporate site this hardware is installed at (e.g. Unjani clinic). Complements consumer_order_id for residential installs.';
