-- Add T&C acceptance and device registration columns to consumer_orders
-- Migration: 20260527_add_consumer_terms_and_devices.sql

ALTER TABLE public.consumer_orders 
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS terms_version text DEFAULT '2026-05-27',
ADD COLUMN IF NOT EXISTS terms_accepted_ip text,
ADD COLUMN IF NOT EXISTS sim_serial text,
ADD COLUMN IF NOT EXISTS router_serial text,
ADD COLUMN IF NOT EXISTS router_model text;

COMMENT ON COLUMN public.consumer_orders.terms_accepted IS 'Customer has accepted the service agreement / T&Cs';
COMMENT ON COLUMN public.consumer_orders.terms_accepted_at IS 'Timestamp when customer accepted T&Cs';
COMMENT ON COLUMN public.consumer_orders.terms_version IS 'Version of T&Cs accepted';
COMMENT ON COLUMN public.consumer_orders.terms_accepted_ip IS 'IP address from which T&Cs were accepted';
COMMENT ON COLUMN public.consumer_orders.sim_serial IS 'SIM card serial number provisioned for this order';
COMMENT ON COLUMN public.consumer_orders.router_serial IS 'Router serial number provisioned for this order';
COMMENT ON COLUMN public.consumer_orders.router_model IS 'Router model provisioned for this order';
