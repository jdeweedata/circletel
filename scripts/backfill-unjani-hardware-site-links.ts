/**
 * Backfill Unjani AP ↔ corporate_sites (+ network_devices.corporate_site_id).
 *
 * Wayfinder: Task #674 / map #672
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/backfill-unjani-hardware-site-links.ts
 *   DRY_RUN=1 ...  # print plan only
 *
 * Safe matches: service_network_identifiers.ruijie_sn → customer_services → corporate_sites.service_id
 * Primary SN on corporate_sites.ruijie_device_sn: existing site SN if set; else network_devices name match; else first SNI SN.
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

type Site = {
  id: string;
  account_number: string;
  site_name: string;
  service_id: string | null;
  ruijie_device_sn: string | null;
  status: string;
};

type Hw = {
  id: string;
  serial_number: string;
  device_name: string;
  device_type: string;
  site_name: string | null;
  ruijie_device_sn: string | null;
  corporate_site_id?: string | null;
};

/** Prefer these SNs as corporate_sites.ruijie_device_sn when a site has multiple APs. */
const PRIMARY_SN_PREFERENCE: Record<string, string> = {
  'CT-UNJ-007': 'G1U52HL044450', // Cosmo City — RAP in hardware inventory
  'CT-UNJ-013': 'G1UQ9C800686A', // Barcelona — named UNJANICLINICBARCELONA
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: sites, error: sitesErr } = await sb
    .from('corporate_sites')
    .select('id, account_number, site_name, service_id, ruijie_device_sn, status')
    .like('account_number', 'CT-UNJ-%')
    .order('account_number');
  if (sitesErr) throw sitesErr;

  const { data: sni, error: sniErr } = await sb
    .from('service_network_identifiers')
    .select('identifier_value, service_id')
    .eq('identifier_type', 'ruijie_sn');
  if (sniErr) throw sniErr;

  const { data: hardware, error: hwErr } = await sb
    .from('network_devices')
    .select('id, serial_number, device_name, device_type, site_name, ruijie_device_sn, corporate_site_id')
    .eq('device_type', 'ruijie_ap');
  if (hwErr) {
    // Column may not exist yet — retry without it
    const retry = await sb
      .from('network_devices')
      .select('id, serial_number, device_name, device_type, site_name, ruijie_device_sn')
      .eq('device_type', 'ruijie_ap');
    if (retry.error) throw hwErr;
    for (const h of retry.data ?? []) (h as Hw).corporate_site_id = null;
    console.warn('WARN: network_devices.corporate_site_id missing — apply migration first');
  }

  const hwRows: Hw[] = (hardware as Hw[]) ?? [];
  const hwBySn = new Map(hwRows.map((h) => [h.serial_number, h]));

  const { count: cacheCount } = await sb
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  const siteByService = new Map(
    (sites as Site[]).filter((s) => s.service_id).map((s) => [s.service_id as string, s])
  );

  /** account_number → list of SNs from SNI */
  const snsByAccount = new Map<string, string[]>();
  for (const row of sni ?? []) {
    const site = siteByService.get(row.service_id as string);
    if (!site) continue;
    const list = snsByAccount.get(site.account_number) ?? [];
    list.push(row.identifier_value as string);
    snsByAccount.set(site.account_number, list);
  }

  const beforeSitesWithSn = (sites as Site[]).filter((s) => s.ruijie_device_sn).length;
  const beforeHwLinked = hwRows.filter((h) => h.corporate_site_id).length;

  type PlanRow = {
    account: string;
    siteId: string;
    primarySn: string;
    allSns: string[];
    siteSnUpdate: boolean;
    hwUpserts: string[];
  };
  const plan: PlanRow[] = [];
  const residual: string[] = [];

  for (const site of sites as Site[]) {
    const sns = snsByAccount.get(site.account_number) ?? [];
    if (sns.length === 0) {
      residual.push(`${site.account_number} ${site.site_name} — no ruijie_sn in service_network_identifiers`);
      continue;
    }
    const preferred = PRIMARY_SN_PREFERENCE[site.account_number];
    const primarySn =
      site.ruijie_device_sn && sns.includes(site.ruijie_device_sn)
        ? site.ruijie_device_sn
        : preferred && sns.includes(preferred)
          ? preferred
          : sns.find((sn) => hwBySn.has(sn)) ?? sns[0];

    plan.push({
      account: site.account_number,
      siteId: site.id,
      primarySn,
      allSns: sns,
      siteSnUpdate: site.ruijie_device_sn !== primarySn,
      hwUpserts: sns,
    });
  }

  console.log(JSON.stringify({ dryRun: DRY, cacheCount, beforeSitesWithSn, beforeHwLinked, planCount: plan.length, residual }, null, 2));
  for (const p of plan) {
    console.log(
      `${p.account} primary=${p.primarySn} (+${p.allSns.length - 1} more) siteSnUpdate=${p.siteSnUpdate}`
    );
  }
  for (const r of residual) console.log(`RESIDUAL: ${r}`);

  if (DRY) {
    console.log('DRY_RUN — no writes');
    return;
  }

  let sitesUpdated = 0;
  let hwUpdated = 0;
  let hwInserted = 0;
  let cacheUpdated = 0;

  for (const p of plan) {
    if (p.siteSnUpdate) {
      const { error } = await sb
        .from('corporate_sites')
        .update({ ruijie_device_sn: p.primarySn, updated_at: new Date().toISOString() })
        .eq('id', p.siteId);
      if (error) throw new Error(`site ${p.account}: ${error.message}`);
      sitesUpdated++;
    }

    const site = (sites as Site[]).find((s) => s.id === p.siteId)!;

    for (const sn of p.allSns) {
      // network_devices.ruijie_device_sn FK → ruijie_device_cache.sn — ensure stub exists
      // when Cloud sync cache is empty so hardware + site links can land.
      const { data: cacheRow } = await sb
        .from('ruijie_device_cache')
        .select('sn, corporate_site_id')
        .eq('sn', sn)
        .maybeSingle();

      if (!cacheRow) {
        const { error } = await sb.from('ruijie_device_cache').insert({
          sn,
          device_name: site.site_name,
          group_name: 'Unjani',
          status: 'unknown',
          corporate_site_id: p.siteId,
          customer_name: site.site_name,
          mock_data: false,
          support_notes: 'Stub upserted by backfill-unjani-hardware-site-links (#674) — replace on next Ruijie sync',
        });
        if (error) throw new Error(`cache stub ${sn}: ${error.message}`);
        cacheUpdated++;
      } else {
        const { error } = await sb
          .from('ruijie_device_cache')
          .update({
            corporate_site_id: p.siteId,
            customer_name: site.site_name,
            updated_at: new Date().toISOString(),
          })
          .eq('sn', sn);
        if (error) throw new Error(`cache ${sn}: ${error.message}`);
        cacheUpdated++;
      }

      const existing = hwBySn.get(sn);
      if (existing) {
        const { error } = await sb
          .from('network_devices')
          .update({
            corporate_site_id: p.siteId,
            ruijie_device_sn: sn,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw new Error(`hw update ${sn}: ${error.message}`);
        hwUpdated++;
      } else {
        const { error } = await sb.from('network_devices').insert({
          serial_number: sn,
          device_name: `UNJANI-${site.account_number}-${sn.slice(-4)}`,
          device_type: 'ruijie_ap',
          site_name: site.site_name.replace(/^Unjani Clinic - /, 'Unjani '),
          channel: 'mtn_wholesale',
          status: 'active',
          ruijie_device_sn: sn,
          corporate_site_id: p.siteId,
        });
        if (error) throw new Error(`hw insert ${sn}: ${error.message}`);
        hwInserted++;
      }
    }
  }

  const { count: afterSites } = await sb
    .from('corporate_sites')
    .select('id', { count: 'exact', head: true })
    .like('account_number', 'CT-UNJ-%')
    .not('ruijie_device_sn', 'is', null);

  const { count: afterHw } = await sb
    .from('network_devices')
    .select('id', { count: 'exact', head: true })
    .eq('device_type', 'ruijie_ap')
    .not('corporate_site_id', 'is', null);

  console.log(
    JSON.stringify(
      {
        sitesUpdated,
        hwUpdated,
        hwInserted,
        cacheUpdated,
        cacheWasEmpty: (cacheCount ?? 0) === 0,
        afterSitesWithSn: afterSites,
        afterHwLinked: afterHw,
        residual,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
