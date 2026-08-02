-- Omada CPE on network_devices + hardware inventory view
-- Delphius (Midrand SkyFibre) + New ExGen / NewGenMC (Rivonia BizFibre)

-- 1) Widen device_type CHECK
ALTER TABLE public.network_devices
  DROP CONSTRAINT IF EXISTS network_devices_device_type_check;

ALTER TABLE public.network_devices
  ADD CONSTRAINT network_devices_device_type_check
  CHECK (device_type = ANY (ARRAY[
    'tarana_router'::text,
    'tozed_cpe'::text,
    'ruijie_ap'::text,
    'sim_card'::text,
    'omada_gateway'::text,
    'omada_switch'::text
  ]));

-- 2) Seed / upsert Omada CPE for dual sites (serial = Omada SN from handover pack)
INSERT INTO public.network_devices (
  serial_number,
  device_name,
  device_type,
  model,
  site_name,
  channel,
  province,
  area,
  technology,
  pppoe_username,
  mac_address,
  ip_address,
  status,
  interstellio_subscriber_id,
  monthly_cost,
  deployed_at,
  signal_notes
) VALUES
  (
    '225A753000218',
    'Delphius Gateway',
    'omada_gateway',
    'ER706W-4G',
    'Delphius Midrand',
    'mtn_wholesale',
    'Gauteng',
    'Midrand',
    'Omada / Tarana FWA',
    'DelphiusCT-Midrand@circletel.co.za',
    '10-5A-95-7C-ED-D5',
    '192.168.1.1',
    'active',
    '361d49c6-43b1-11f1-95c3-00163ed48379',
    1899,
    '2026-03-01',
    'Omada site Delphius; SkyFibre Business 100; CT-2026-001'
  ),
  (
    '225C179000193',
    'Delphius Switch',
    'omada_switch',
    'SG3428MP',
    'Delphius Midrand',
    'mtn_wholesale',
    'Gauteng',
    'Midrand',
    'Omada',
    'DelphiusCT-Midrand@circletel.co.za',
    'A8-29-48-E4-A1-2C',
    '192.168.1.152',
    'active',
    '361d49c6-43b1-11f1-95c3-00163ed48379',
    NULL,
    '2026-03-01',
    'Omada site Delphius; uplink to ER706W-4G'
  ),
  (
    '225A753000232',
    'New ExGen Gateway',
    'omada_gateway',
    'ER706W-4G',
    'NewExGen Rivonia',
    'dfa',
    'Gauteng',
    'Rivonia',
    'Omada / DFA Fibre',
    'NewExGenCT-Rivonia@circletel.co.za',
    '10-5A-95-7C-EE-53',
    '192.168.8.1',
    'active',
    '68822698-43b1-11f1-95c3-00163ed48379',
    2999,
    '2026-04-01',
    'Omada site NewGenMC; BizFibre 100; Imagine House'
  ),
  (
    '225C179000352',
    'New ExGen Switch',
    'omada_switch',
    'SG3428MP',
    'NewExGen Rivonia',
    'dfa',
    'Gauteng',
    'Rivonia',
    'Omada',
    'NewExGenCT-Rivonia@circletel.co.za',
    'A8-29-48-E4-A1-CB',
    '192.168.8.108',
    'active',
    '68822698-43b1-11f1-95c3-00163ed48379',
    NULL,
    '2026-04-01',
    'Omada site NewGenMC; SN 225C179000352'
  )
ON CONFLICT (serial_number) DO UPDATE SET
  device_name = EXCLUDED.device_name,
  device_type = EXCLUDED.device_type,
  model = EXCLUDED.model,
  site_name = EXCLUDED.site_name,
  channel = EXCLUDED.channel,
  province = EXCLUDED.province,
  area = EXCLUDED.area,
  technology = EXCLUDED.technology,
  pppoe_username = EXCLUDED.pppoe_username,
  mac_address = EXCLUDED.mac_address,
  ip_address = EXCLUDED.ip_address,
  status = EXCLUDED.status,
  interstellio_subscriber_id = EXCLUDED.interstellio_subscriber_id,
  monthly_cost = EXCLUDED.monthly_cost,
  signal_notes = EXCLUDED.signal_notes,
  updated_at = now();

-- 3) Rebuild hardware view with Omada branch
CREATE OR REPLACE VIEW public.v_hardware_installations AS
WITH tarana_rn_ids AS (
  SELECT DISTINCT trim(serial) AS serial
  FROM (
    SELECT tarana_rn_serial AS serial
    FROM public.corporate_sites
    WHERE tarana_rn_serial IS NOT NULL AND trim(tarana_rn_serial) <> ''
    UNION
    SELECT identifier_value AS serial
    FROM public.service_network_identifiers
    WHERE identifier_type = 'tarana_serial'
      AND identifier_value IS NOT NULL
      AND trim(identifier_value) <> ''
    UNION
    SELECT serial_number AS serial
    FROM public.network_devices
    WHERE device_type = 'tarana_router'
      AND serial_number IS NOT NULL
      AND trim(serial_number) <> ''
  ) src
),
ruijie_rows AS (
  SELECT
    'ruijie'::text AS hardware_source,
    r.sn AS hardware_id,
    COALESCE(r.device_name, r.sn) AS hardware_label,
    r.model AS hardware_model,
    r.status AS hardware_status,
    r.last_seen_at AS last_seen_at,
    COALESCE(cs_site.customer_id, cs_sni.customer_id) AS customer_id,
    COALESCE(
      NULLIF(trim(both FROM concat_ws(' ', cust.first_name, cust.last_name)), ''),
      r.customer_name,
      site.site_name,
      NULLIF(trim(both FROM concat_ws(' ', ord.first_name, ord.last_name)), '')
    ) AS customer_name,
    COALESCE(cust.email, r.customer_email, site.site_contact_email, ord.email) AS customer_email,
    COALESCE(cs_site.id, cs_sni.id) AS service_id,
    COALESCE(cs_site.status, cs_sni.status)::text AS service_status,
    COALESCE(cs_site.active, cs_sni.active) AS service_active,
    COALESCE(cs_site.package_name, cs_sni.package_name)::text AS package_name,
    CASE
      WHEN r.corporate_site_id IS NOT NULL THEN 'corporate_site'
      WHEN r.customer_order_id IS NOT NULL THEN 'consumer_order'
      WHEN cs_sni.id IS NOT NULL AND site_via_svc.id IS NOT NULL THEN 'corporate_site'
      WHEN cs_sni.id IS NOT NULL THEN 'service_address'
      ELSE NULL
    END AS location_type,
    CASE
      WHEN r.corporate_site_id IS NOT NULL THEN r.corporate_site_id
      WHEN r.customer_order_id IS NOT NULL THEN r.customer_order_id
      WHEN site_via_svc.id IS NOT NULL THEN site_via_svc.id
      ELSE NULL
    END AS location_id,
    COALESCE(site.site_name, site_via_svc.site_name, ord.installation_address) AS location_name,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(', ',
        NULLIF(site.installation_address->>'street', ''),
        NULLIF(site.installation_address->>'suburb', ''),
        NULLIF(site.installation_address->>'city', ''),
        NULLIF(site.installation_address->>'province', ''),
        NULLIF(site.installation_address->>'postal_code', '')
      )), ''),
      NULLIF(TRIM(CONCAT_WS(', ',
        NULLIF(site_via_svc.installation_address->>'street', ''),
        NULLIF(site_via_svc.installation_address->>'suburb', ''),
        NULLIF(site_via_svc.installation_address->>'city', ''),
        NULLIF(site_via_svc.installation_address->>'province', ''),
        NULLIF(site_via_svc.installation_address->>'postal_code', '')
      )), ''),
      ord.installation_address,
      COALESCE(cs_site.installation_address, cs_sni.installation_address)
    ) AS location_address,
    COALESCE(site.province, site_via_svc.province, ord.province)::text AS province,
    COALESCE(site.lat, site_via_svc.lat) AS lat,
    COALESCE(site.lng, site_via_svc.lng) AS lng,
    CASE
      WHEN r.corporate_site_id IS NOT NULL THEN 'ruijie_cache_site'
      WHEN r.customer_order_id IS NOT NULL THEN 'ruijie_cache_order'
      WHEN sni.service_id IS NOT NULL THEN 'sni'
      ELSE NULL
    END AS link_method
  FROM public.ruijie_device_cache r
  LEFT JOIN public.corporate_sites site ON site.id = r.corporate_site_id
  LEFT JOIN public.customer_services cs_site ON cs_site.id = site.service_id
  LEFT JOIN public.consumer_orders ord ON ord.id = r.customer_order_id
  LEFT JOIN public.service_network_identifiers sni
    ON sni.identifier_type = 'ruijie_sn' AND sni.identifier_value = r.sn
  LEFT JOIN public.customer_services cs_sni ON cs_sni.id = sni.service_id
  LEFT JOIN public.corporate_sites site_via_svc ON site_via_svc.service_id = cs_sni.id
  LEFT JOIN public.customers cust
    ON cust.id = COALESCE(cs_site.customer_id, cs_sni.customer_id)
),
interstellio_rows AS (
  SELECT
    'interstellio'::text AS hardware_source,
    i.id AS hardware_id,
    COALESCE(i.username, i.name, i.id) AS hardware_label,
    NULL::text AS hardware_model,
    CASE
      WHEN i.enabled IS TRUE THEN 'enabled'
      WHEN i.enabled IS FALSE THEN 'disabled'
      ELSE NULL
    END AS hardware_status,
    i.last_seen AS last_seen_at,
    cs.customer_id,
    COALESCE(
      NULLIF(trim(cust.business_name), ''),
      NULLIF(trim(both FROM concat_ws(' ', cust.first_name, cust.last_name)), ''),
      i.name,
      site.site_name
    ) AS customer_name,
    COALESCE(cust.email, site.site_contact_email)::text AS customer_email,
    cs.id AS service_id,
    cs.status::text AS service_status,
    cs.active AS service_active,
    cs.package_name::text AS package_name,
    CASE
      WHEN site.id IS NOT NULL THEN 'corporate_site'
      WHEN cs.id IS NOT NULL THEN 'service_address'
      ELSE NULL
    END AS location_type,
    COALESCE(site.id, cs.id) AS location_id,
    COALESCE(site.site_name, cs.installation_address) AS location_name,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(', ',
        NULLIF(site.installation_address->>'street', ''),
        NULLIF(site.installation_address->>'suburb', ''),
        NULLIF(site.installation_address->>'city', ''),
        NULLIF(site.installation_address->>'province', ''),
        NULLIF(site.installation_address->>'postal_code', '')
      )), ''),
      cs.installation_address
    ) AS location_address,
    site.province::text AS province,
    site.lat AS lat,
    site.lng AS lng,
    CASE
      WHEN sni.service_id IS NOT NULL THEN 'sni'
      WHEN cs_conn.id IS NOT NULL THEN 'connection_id'
      WHEN cs_ppp.id IS NOT NULL THEN 'connection_id'
      ELSE NULL
    END AS link_method
  FROM public.interstellio_subscriber_cache i
  LEFT JOIN public.service_network_identifiers sni
    ON sni.identifier_type = 'interstellio_uuid' AND sni.identifier_value = i.id
  LEFT JOIN public.customer_services cs_sni ON cs_sni.id = sni.service_id
  LEFT JOIN public.customer_services cs_conn ON cs_conn.connection_id = i.id
  LEFT JOIN public.pppoe_credentials ppp
    ON ppp.interstellio_subscriber_id = i.id
  LEFT JOIN public.customer_services cs_ppp ON cs_ppp.id = ppp.service_id
  LEFT JOIN LATERAL (
    SELECT x.*
    FROM public.customer_services x
    WHERE x.id = COALESCE(cs_sni.id, cs_conn.id, cs_ppp.id)
  ) cs ON TRUE
  LEFT JOIN public.corporate_sites site ON site.service_id = cs.id
  LEFT JOIN public.customers cust ON cust.id = cs.customer_id
),
tarana_rows AS (
  SELECT
    'tarana'::text AS hardware_source,
    t.serial AS hardware_id,
    COALESCE(nd.device_name, site.site_name, t.serial) AS hardware_label,
    COALESCE(nd.model, 'Tarana G1 RN') AS hardware_model,
    COALESCE(nd.status, 'unknown') AS hardware_status,
    NULL::timestamptz AS last_seen_at,
    cs.customer_id,
    COALESCE(
      NULLIF(trim(both FROM concat_ws(' ', cust.first_name, cust.last_name)), ''),
      site.site_name
    ) AS customer_name,
    COALESCE(cust.email, site.site_contact_email)::text AS customer_email,
    cs.id AS service_id,
    cs.status::text AS service_status,
    cs.active AS service_active,
    cs.package_name::text AS package_name,
    CASE
      WHEN site.id IS NOT NULL THEN 'corporate_site'
      WHEN cs.id IS NOT NULL THEN 'service_address'
      ELSE NULL
    END AS location_type,
    COALESCE(site.id, cs.id) AS location_id,
    COALESCE(site.site_name, nd.site_name, cs.installation_address) AS location_name,
    COALESCE(
      NULLIF(TRIM(CONCAT_WS(', ',
        NULLIF(site.installation_address->>'street', ''),
        NULLIF(site.installation_address->>'suburb', ''),
        NULLIF(site.installation_address->>'city', ''),
        NULLIF(site.installation_address->>'province', ''),
        NULLIF(site.installation_address->>'postal_code', '')
      )), ''),
      cs.installation_address
    ) AS location_address,
    COALESCE(site.province, nd.province)::text AS province,
    site.lat AS lat,
    site.lng AS lng,
    CASE
      WHEN sni.service_id IS NOT NULL THEN 'sni'
      WHEN site.id IS NOT NULL THEN 'site_serial'
      ELSE NULL
    END AS link_method
  FROM tarana_rn_ids t
  LEFT JOIN public.service_network_identifiers sni
    ON sni.identifier_type = 'tarana_serial' AND sni.identifier_value = t.serial
  LEFT JOIN public.corporate_sites site
    ON site.tarana_rn_serial = t.serial
  LEFT JOIN LATERAL (
    SELECT x.*
    FROM public.customer_services x
    WHERE x.id = COALESCE(sni.service_id, site.service_id)
  ) cs ON TRUE
  LEFT JOIN public.customers cust ON cust.id = cs.customer_id
  LEFT JOIN LATERAL (
    SELECT n.*
    FROM public.network_devices n
    WHERE n.device_type = 'tarana_router' AND n.serial_number = t.serial
    ORDER BY n.updated_at DESC NULLS LAST
    LIMIT 1
  ) nd ON TRUE
),
omada_rows AS (
  SELECT
    'omada'::text AS hardware_source,
    n.serial_number AS hardware_id,
    n.device_name AS hardware_label,
    n.model AS hardware_model,
    n.status AS hardware_status,
    n.updated_at AS last_seen_at,
    cs.customer_id,
    COALESCE(
      NULLIF(trim(cust.business_name), ''),
      NULLIF(trim(both FROM concat_ws(' ', cust.first_name, cust.last_name)), ''),
      n.site_name
    ) AS customer_name,
    cust.email::text AS customer_email,
    cs.id AS service_id,
    cs.status::text AS service_status,
    cs.active AS service_active,
    cs.package_name::text AS package_name,
    CASE
      WHEN cs.id IS NOT NULL THEN 'service_address'
      ELSE NULL
    END AS location_type,
    cs.id AS location_id,
    COALESCE(n.site_name, cs.installation_address) AS location_name,
    COALESCE(cs.installation_address, n.area) AS location_address,
    n.province::text AS province,
    NULL::numeric(10,6) AS lat,
    NULL::numeric(10,6) AS lng,
    CASE
      WHEN cs.id IS NOT NULL THEN 'interstellio_subscriber_id'
      ELSE NULL
    END AS link_method
  FROM public.network_devices n
  LEFT JOIN public.customer_services cs
    ON cs.connection_id = n.interstellio_subscriber_id
  LEFT JOIN public.customers cust ON cust.id = cs.customer_id
  WHERE n.device_type IN ('omada_gateway', 'omada_switch')
)
SELECT * FROM ruijie_rows
UNION ALL
SELECT * FROM interstellio_rows
UNION ALL
SELECT * FROM tarana_rows
UNION ALL
SELECT * FROM omada_rows;

COMMENT ON VIEW public.v_hardware_installations IS
  'Hardware-first inventory (Ruijie / Interstellio / Tarana RN / Omada CPE) with optional customer/location links';

GRANT SELECT ON public.v_hardware_installations TO service_role;
