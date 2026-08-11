/**
 * One-time, idempotent backfill: load the 10 August 2026 Unjani clinic
 * pre-qualification results into b2b_coverage_checks so the portal reads them
 * from the database instead of CSVs on a developer's disk.
 *
 * Source (joined 1:1 on site_id, both 253 rows, both checked 2026-08-10):
 *   .docs/coverage-check/CircleTel_Unjani_DFA_Tarana_Coverage_Results_v1_0.csv
 *     → DFA feasibility (status, near-net distance, products, reference)
 *   .docs/coverage-check/CircleTel_Unjani_Tarana_LTE5G_Coverage_Results_v1_0.csv
 *     → Tarana FWB feasibility + MTN LTE / 5G availability
 *
 * Both were produced by scripts/check-unjani-dfa-tarana-coverage.ts and
 * scripts/check-unjani-tarana-lte-5g.ts.
 *
 * Dry run (default — prints the summary and two sample rows, writes nothing):
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/portal/backfill-b2b-coverage-checks.ts
 *
 * Apply:
 *   ... npx tsx scripts/portal/backfill-b2b-coverage-checks.ts --apply
 *
 * Re-run after a previous apply (deletes this organisation's rows first):
 *   ... npx tsx scripts/portal/backfill-b2b-coverage-checks.ts --apply --replace
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const DFA_CSV =
  '.docs/coverage-check/CircleTel_Unjani_DFA_Tarana_Coverage_Results_v1_0.csv';
const MOBILE_CSV =
  '.docs/coverage-check/CircleTel_Unjani_Tarana_LTE5G_Coverage_Results_v1_0.csv';

/** Unjani Clinics NPC — the only corporate account with portal users today. */
const ORGANISATION_ID = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e';
/**
 * b2b_coverage_checks.created_by is NOT NULL and FKs to b2b_portal_users(id).
 * These checks were run by CircleTel on the organisation's behalf, so they are
 * attributed to the organisation's portal admin account.
 */
const CREATED_BY = 'dcf3b6ef-1392-4a50-bd77-88ba3886b02c';

type Row = Record<string, string>;

/** RFC 4180 enough for these files: handles quoted fields containing commas. */
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n') {
      record.push(field);
      rows.push(record);
      record = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    rows.push(record);
  }

  const header = (rows.shift() ?? []).map((h) => h.replace(/^﻿/, '').trim());
  return rows
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

/** These CSVs encode booleans as `yes` / `no`. */
const bool = (v: string | undefined) => {
  const normalised = String(v ?? '').trim().toLowerCase();
  return normalised === 'yes' || normalised === 'true' || normalised === '1';
};
const num = (v: string | undefined) => {
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: string | undefined) => (v && v !== '' ? v : null);

async function main() {
  const apply = process.argv.includes('--apply');
  const replace = process.argv.includes('--replace');

  const dfaRows = parseCsv(readFileSync(DFA_CSV, 'utf8'));
  const mobileRows = parseCsv(readFileSync(MOBILE_CSV, 'utf8'));
  const mobileById = new Map(mobileRows.map((r) => [r.site_id, r]));

  const records = [];
  const skipped: string[] = [];

  for (const dfa of dfaRows) {
    const mobile = mobileById.get(dfa.site_id);
    if (!mobile) {
      skipped.push(`${dfa.site_id} (${dfa.clinic}): no mobile-check row`);
      continue;
    }

    const latitude = num(mobile.latitude ?? dfa.latitude);
    const longitude = num(mobile.longitude ?? dfa.longitude);
    const address = str(mobile.address ?? dfa.address);

    // latitude, longitude and address are NOT NULL in b2b_coverage_checks.
    if (latitude === null || longitude === null || !address) {
      skipped.push(`${dfa.site_id} (${dfa.clinic}): missing address or coordinates`);
      continue;
    }

    records.push({
      organisation_id: ORGANISATION_ID,
      created_by: CREATED_BY,
      clinic_name: str(dfa.clinic),
      address,
      latitude,
      longitude,
      results: {
        site_id: dfa.site_id,
        province: str(dfa.province),
        district: str(dfa.district),
        cluster: str(dfa.backhaul_cluster),
        cluster_tier: num(dfa.cluster_tier),
        rollout_phase: num(dfa.rollout_phase),
        priority: num(dfa.priority),
        geocode_source: str(mobile.geocode_source ?? dfa.geocode_source),
        geocode_confidence: str(mobile.geocode_confidence ?? dfa.geocode_confidence),
        recommended_access_technology: str(
          mobile.recommended_access_technology ?? dfa.recommended_access_technology
        ),
        notes: str(mobile.notes ?? dfa.notes),
        checked_date: str(mobile.checked_date ?? dfa.checked_date),
        dfa: {
          status: str(dfa.dfa_status),
          nearnet_distance_m: num(dfa.dfa_nearnet_distance_m),
          products_available: str(dfa.dfa_products_available),
          reference: str(dfa.dfa_reference),
          message: str(dfa.dfa_message),
        },
        tarana: {
          feasible: bool(mobile.tarana_feasible),
          medium: str(mobile.tarana_medium),
          region: str(mobile.tarana_region),
          capacity_mbps: num(mobile.tarana_capacity_mbps),
          nni: str(mobile.tarana_nni),
          up_node: str(mobile.tarana_up_node),
          reference: str(mobile.tarana_reference),
          error: str(mobile.tarana_error),
        },
        lte: {
          available: bool(mobile.lte_available),
          signal: str(mobile.lte_signal),
          access_type: str(mobile.lte_access_type),
          speed: str(mobile.lte_speed),
        },
        five_g: {
          available: bool(mobile.five_g_available),
          signal: str(mobile.five_g_signal),
          access_type: str(mobile.five_g_access_type),
          speed: str(mobile.five_g_speed),
        },
        source: {
          dfa_csv: DFA_CSV,
          mobile_csv: MOBILE_CSV,
        },
      },
    });
  }

  const withDfa = records.filter((r) => r.results.dfa.status !== 'none').length;
  const withTarana = records.filter((r) => r.results.tarana.feasible).length;
  const with5g = records.filter((r) => r.results.five_g.available).length;

  console.log(`DFA rows:        ${dfaRows.length}`);
  console.log(`Mobile rows:     ${mobileRows.length}`);
  console.log(`Joined records:  ${records.length}`);
  console.log(`  DFA available: ${withDfa}`);
  console.log(`  Tarana:        ${withTarana}`);
  console.log(`  5G:            ${with5g}`);
  if (skipped.length) {
    console.log(`Skipped (${skipped.length}):`);
    for (const s of skipped) console.log(`  - ${s}`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { count: existing, error: countError } = await supabase
    .from('b2b_coverage_checks')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', ORGANISATION_ID);
  if (countError) throw new Error(countError.message);

  console.log(`\nExisting rows for this organisation: ${existing ?? 0}`);

  if (!apply) {
    console.log('\nDRY RUN — nothing written. Sample records:');
    console.log(JSON.stringify(records.slice(0, 2), null, 2));
    console.log('\nRe-run with --apply to write.');
    return;
  }

  if ((existing ?? 0) > 0) {
    if (!replace) {
      throw new Error(
        `${existing} rows already exist for this organisation. ` +
          'Re-run with --replace to delete and reload them.'
      );
    }
    const { error: deleteError } = await supabase
      .from('b2b_coverage_checks')
      .delete()
      .eq('organisation_id', ORGANISATION_ID);
    if (deleteError) throw new Error(deleteError.message);
    console.log(`Deleted ${existing} existing rows.`);
  }

  let inserted = 0;
  const BATCH = 50;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('b2b_coverage_checks').insert(batch);
    if (error) throw new Error(`Batch at ${i}: ${error.message}`);
    inserted += batch.length;
    console.log(`  inserted ${inserted}/${records.length}`);
  }

  console.log(`\nDone — ${inserted} coverage checks written.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
