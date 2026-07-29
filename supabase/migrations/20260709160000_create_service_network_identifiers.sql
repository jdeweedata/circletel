-- Revenue Assurance: unified service ↔ network-identifier mapping
-- One row per (identifier_type, identifier_value) → the customer_service it belongs to.
-- Backfills the mapping-gap prerequisite for ALL active-signal sources (Ruijie AP SN,
-- Interstellio subscriber UUID, Tarana serial, MTN SIM MSISDN/ICCID).
-- Ref: docs/plans/2026-07-09-ra-report-reconciliation-spec.md §4

create table if not exists service_network_identifiers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references customer_services(id) on delete cascade,
  identifier_type text not null
    check (identifier_type in ('msisdn','iccid','interstellio_uuid','ruijie_sn','tarana_serial')),
  identifier_value text not null,
  source text,                         -- how it was mapped: 'backfill','provisioning','manual'
  created_at timestamptz not null default now(),
  unique (identifier_type, identifier_value)
);

create index if not exists idx_sni_service on service_network_identifiers (service_id);

-- Service-role only, matching ruijie_device_cache / RA convention
alter table service_network_identifiers enable row level security;
