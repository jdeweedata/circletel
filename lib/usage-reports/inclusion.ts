import type { SupabaseClient } from '@supabase/supabase-js';

export interface InclusionSiteRow {
  id: string;
  name: string;
  account_number: string;
  status: string;
  service_id: string | null;
  service_status: string | null;
  corporate_code: string;
  account_name: string;
}

export function filterEligibleSites(
  rows: InclusionSiteRow[],
  opts: { includeProvisioned: boolean; unjaniOnly?: boolean }
): InclusionSiteRow[] {
  const allowedStatus = new Set(
    opts.includeProvisioned ? ['active', 'provisioned'] : ['active']
  );
  return rows.filter((r) => {
    if (!allowedStatus.has(r.status)) return false;
    if (r.service_id && r.service_status !== 'active') return false;
    if (opts.unjaniOnly && r.corporate_code !== 'UNJ') return false;
    return true;
  });
}

interface RawInclusionSiteRow {
  id: string;
  site_name: string;
  account_number: string | null;
  status: string;
  service_id: string | null;
  corporate_accounts: { corporate_code: string; company_name: string } | null;
}

export async function fetchInclusionSiteRows(
  supabase: SupabaseClient,
  corporateAccountId?: string
): Promise<InclusionSiteRow[]> {
  // No FK from corporate_sites.service_id → customer_services; load statuses separately.
  let q = supabase.from('corporate_sites').select(`
      id, site_name, account_number, status, service_id,
      corporate_accounts:corporate_id ( corporate_code, company_name )
    `);
  if (corporateAccountId) q = q.eq('corporate_id', corporateAccountId);
  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as unknown as RawInclusionSiteRow[];
  const serviceIds = [
    ...new Set(rows.map((r) => r.service_id).filter((id): id is string => Boolean(id))),
  ];

  const statusByServiceId = new Map<string, string>();
  if (serviceIds.length > 0) {
    const { data: services, error: serviceError } = await supabase
      .from('customer_services')
      .select('id, status')
      .in('id', serviceIds);
    if (serviceError) throw serviceError;
    for (const svc of services ?? []) {
      statusByServiceId.set(String(svc.id), String(svc.status));
    }
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.site_name,
    account_number: row.account_number ?? '',
    status: row.status,
    service_id: row.service_id,
    service_status: row.service_id
      ? statusByServiceId.get(row.service_id) ?? null
      : null,
    corporate_code: row.corporate_accounts?.corporate_code ?? '',
    account_name: row.corporate_accounts?.company_name ?? '',
  }));
}
