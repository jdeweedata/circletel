-- Add tarana_device_counts table for network-wide device counts from TMQ v5 /radios/count
-- Captures the same data visible in the MTN TCS Portal dashboard

CREATE TABLE IF NOT EXISTS public.tarana_device_counts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_log_id uuid REFERENCES public.tarana_sync_logs(id),
  bn_connected integer NOT NULL DEFAULT 0,
  bn_disconnected integer NOT NULL DEFAULT 0,
  bn_spectrum_unassigned integer NOT NULL DEFAULT 0,
  bn_new_installs_30d integer NOT NULL DEFAULT 0,
  bn_total integer NOT NULL DEFAULT 0,
  rn_connected integer NOT NULL DEFAULT 0,
  rn_disconnected integer NOT NULL DEFAULT 0,
  rn_spectrum_unassigned integer NOT NULL DEFAULT 0,
  rn_new_installs_30d integer NOT NULL DEFAULT 0,
  rn_total integer NOT NULL DEFAULT 0,
  fetched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.tarana_device_counts IS 'Network-wide device counts from TMQ v5 /radios/count endpoint, synced daily during Tarana sync';
COMMENT ON COLUMN public.tarana_device_counts.bn_connected IS 'Connected Base Nodes';
COMMENT ON COLUMN public.tarana_device_counts.bn_disconnected IS 'Disconnected Base Nodes';
COMMENT ON COLUMN public.tarana_device_counts.rn_connected IS 'Connected Remote Nodes';
COMMENT ON COLUMN public.tarana_device_counts.rn_disconnected IS 'Disconnected Remote Nodes';
COMMENT ON COLUMN public.tarana_device_counts.rn_new_installs_30d IS 'New Remote Node installs in last 30 days';
