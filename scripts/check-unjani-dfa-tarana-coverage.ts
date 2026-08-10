#!/usr/bin/env npx tsx
/**
 * Batch DFA + Tarana coverage / feasibility check for the Unjani clinic site list.
 *
 * Fills in the blank columns of the CircleTel Unjani DFA Feasibility Request sheet:
 *   dfa_status, dfa_nearnet_distance_m, dfa_products_available, dfa_reference, checked_date
 * and appends the near-net detail, Tarana FWB read, and an access-technology decision.
 *
 * Checks performed per site:
 *   1. DFA Connected Buildings layer  — active fibre in the building (ArcGIS, public, no auth)
 *   2. DFA Near-Net Buildings layer   — nearest DFA building within --near-net-radius (default 200m)
 *   3. DFA Ductbank layer             — nearest COMPLETED fibre route within --route-radius (default 500m)
 *   4. Tarana base station proximity  — nearest online BN from tarana_base_stations (needs Supabase)
 *
 * Credentials:
 *   DFA layers are public — no credentials needed, so --skip-tarana runs with zero secrets.
 *   The Tarana leg needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; when they are
 *   absent the script says so once and records tarana_status=not_checked rather than failing.
 *
 * Run:
 *   set -a && source .env.local && set +a && npx tsx scripts/check-unjani-dfa-tarana-coverage.ts
 *
 * Options:
 *   --in=<path>               Input CSV  (default data/unjani/CircleTel_Unjani_DFA_Feasibility_Request_v1_0.csv)
 *   --out=<path>              Output CSV (default data/unjani/CircleTel_Unjani_DFA_Tarana_Coverage_Results.csv)
 *   --summary=<path>          Markdown run summary (default alongside --out)
 *   --limit=<n>               Only check the first n unchecked sites (smoke test)
 *   --concurrency=<n>         Parallel site checks (default 4)
 *   --near-net-radius=<m>     Near-net search radius in metres (default 200)
 *   --route-radius=<m>        Ductbank search radius in metres (default 500)
 *   --resume                  Keep rows already carrying a non-error dfa_status in --out
 *   --skip-tarana             DFA only (no Supabase required)
 *   --skip-dfa                Tarana only
 */

import * as fs from 'fs';
import * as path from 'path';

import { dfaCoverageClient } from '../lib/coverage/providers/dfa/dfa-coverage-client';
import { DFACoverageError } from '../lib/coverage/providers/dfa/types';
import type { DFACoverageResponse } from '../lib/coverage/providers/dfa/types';

// =====================================================
// CSV helpers (RFC 4180 — the address column is quoted and contains commas)
// =====================================================

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
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

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && src[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      field = '';
      record = [];
    } else {
      field += char;
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const nonEmpty = records.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0];
  const rows = nonEmpty.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

function csvCell(value: string): string {
  if (value === '') return '';
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: Record<string, string>[]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

// =====================================================
// CLI arguments
// =====================================================

interface Options {
  input: string;
  output: string;
  summary: string;
  limit: number | null;
  concurrency: number;
  nearNetRadius: number;
  routeRadius: number;
  fwbCapacity: 50 | 100 | 200;
  resume: boolean;
  skipTarana: boolean;
  skipDfa: boolean;
}

function parseOptions(argv: string[]): Options {
  const flag = (name: string): string | undefined => {
    const match = argv.find((arg) => arg.startsWith(`--${name}=`));
    return match ? match.slice(name.length + 3) : undefined;
  };
  const has = (name: string): boolean => argv.includes(`--${name}`);

  const positiveInt = (name: string, fallback: number): number => {
    const raw = flag(name);
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`--${name} must be a positive number, got "${raw}"`);
    }
    return value;
  };

  const input = flag('in') ?? 'data/unjani/CircleTel_Unjani_DFA_Feasibility_Request_v1_0.csv';
  const output = flag('out') ?? 'data/unjani/CircleTel_Unjani_DFA_Tarana_Coverage_Results.csv';

  const limitRaw = flag('limit');
  const limit = limitRaw === undefined ? null : positiveInt('limit', 0);

  const capacityRaw = flag('fwb-capacity');
  const fwbCapacity = capacityRaw === undefined ? 50 : Number(capacityRaw);
  if (fwbCapacity !== 50 && fwbCapacity !== 100 && fwbCapacity !== 200) {
    throw new Error(`--fwb-capacity must be 50, 100 or 200, got "${capacityRaw}"`);
  }

  return {
    input,
    output,
    summary: flag('summary') ?? output.replace(/\.csv$/i, '_SUMMARY.md'),
    limit,
    concurrency: positiveInt('concurrency', 4),
    nearNetRadius: positiveInt('near-net-radius', 200),
    routeRadius: positiveInt('route-radius', 500),
    fwbCapacity,
    resume: has('resume'),
    skipTarana: has('skip-tarana'),
    skipDfa: has('skip-dfa'),
  };
}

// =====================================================
// Result columns appended to the request template
// =====================================================

const RESULT_COLUMNS = [
  'dfa_status',
  'dfa_nearnet_distance_m',
  'dfa_products_available',
  'dfa_reference',
  'checked_date',
  'dfa_nearnet_building',
  'dfa_nearnet_address',
  'dfa_route_distance_m',
  'dfa_install_cost_estimate',
  'dfa_install_timeline',
  'dfa_error',
  'tarana_status',
  'tarana_confidence',
  'tarana_nearest_site',
  'tarana_distance_km',
  'tarana_active_connections',
  'tarana_csp_orderable',
  'tarana_csp_status',
  'tarana_csp_zone',
  'tarana_note',
  'tarana_error',
  'recommended_access',
] as const;

type ResultRow = Record<string, string>;

// =====================================================
// Per-site checks
// =====================================================

/** DFA statuses, ordered best-to-worst. */
type DfaStatus = 'connected' | 'near-net' | 'route-nearby' | 'none' | 'error';

interface DfaOutcome {
  status: DfaStatus;
  nearNetDistanceM: string;
  productsAvailable: string;
  reference: string;
  nearNetBuilding: string;
  nearNetAddress: string;
  routeDistanceM: string;
  installCost: string;
  installTimeline: string;
  error: string;
}

const EMPTY_DFA: DfaOutcome = {
  status: 'none',
  nearNetDistanceM: '',
  productsAvailable: '',
  reference: '',
  nearNetBuilding: '',
  nearNetAddress: '',
  routeDistanceM: '',
  installCost: '',
  installTimeline: '',
  error: '',
};

/**
 * Site-specific DFA capability, straight off the layer attributes.
 * Deliberately not the CircleTel product catalogue: the catalogue is identical for every
 * covered site, whereas these flags differ per building and are what DFA's own portal shows.
 */
function describeDfaProducts(response: DFACoverageResponse): string {
  const details = response.buildingDetails;
  if (!details) {
    return response.coverageType === 'near-net' ? 'Subject to near-net build quotation' : '';
  }

  const parts: string[] = [];
  const yes = (value: unknown) => String(value ?? '').trim().toLowerCase() === 'yes';

  if (yes(details.broadband)) parts.push('Broadband');
  if (yes(details.ftth)) parts.push('FTTH');
  if (details.precinct) parts.push(`Precinct: ${details.precinct}`);
  if (details.promotion) parts.push(`Promotion: ${details.promotion}`);

  return parts.length > 0 ? parts.join('; ') : 'Connected (no product flags published)';
}

async function checkDfa(
  latitude: number,
  longitude: number,
  options: Options
): Promise<DfaOutcome> {
  const response = await dfaCoverageClient.checkCoverage({
    latitude,
    longitude,
    checkNearNet: true,
    maxNearNetDistance: options.nearNetRadius,
  });

  const estimate = dfaInstallEstimate(response);

  if (response.coverageType === 'connected') {
    return {
      ...EMPTY_DFA,
      status: 'connected',
      nearNetDistanceM: '0',
      productsAvailable: describeDfaProducts(response),
      reference: response.buildingDetails?.buildingId ?? '',
      installCost: estimate.cost,
      installTimeline: estimate.timeline,
    };
  }

  if (response.coverageType === 'near-net') {
    const distance = response.nearNetDetails?.distance ?? 0;
    return {
      ...EMPTY_DFA,
      status: 'near-net',
      nearNetDistanceM: String(Math.round(distance)),
      productsAvailable: describeDfaProducts(response),
      nearNetBuilding: response.nearNetDetails?.buildingName ?? '',
      nearNetAddress: response.nearNetDetails?.address ?? '',
      installCost: estimate.cost,
      installTimeline: estimate.timeline,
    };
  }

  // No building match — fall back to the nearest completed fibre route so the DFA
  // feasibility desk can still see how far off-net the site really is.
  const route = await dfaCoverageClient.queryNearestFiberRoute(
    latitude,
    longitude,
    options.routeRadius
  );

  if (route) {
    return {
      ...EMPTY_DFA,
      status: 'route-nearby',
      routeDistanceM: String(Math.round(route.distance)),
      // Prefixed so the column is never ambiguous: a building ID and a route name look alike.
      reference: route.routeName ? `Route: ${route.routeName}` : '',
      productsAvailable: 'Off-net — build quotation required',
    };
  }

  return { ...EMPTY_DFA, status: 'none' };
}

function dfaInstallEstimate(response: DFACoverageResponse): { cost: string; timeline: string } {
  if (response.coverageType === 'connected') {
    return { cost: 'R0 - R1,500', timeline: '5-10 business days' };
  }
  if (response.coverageType === 'near-net') {
    const distance = response.nearNetDetails?.distance ?? 0;
    return distance <= 100
      ? { cost: 'R2,500 - R5,000', timeline: '10-15 business days' }
      : { cost: 'R5,000 - R15,000', timeline: '15-30 business days' };
  }
  return { cost: '', timeline: '' };
}

/**
 * Two independent legs, because they answer different questions:
 *   - TCS proximity  = our own evidence (is there an online Tarana BN near this site?)
 *   - MTN CSP        = the authority (will MTN actually accept an FWB order here?)
 * Either can be unavailable without invalidating the other, so both are recorded.
 */
interface TaranaOutcome {
  status: 'feasible' | 'not-feasible' | 'tcs-covered' | 'tcs-not-covered' | 'not_checked' | 'error';
  confidence: string;
  nearestSite: string;
  distanceKm: string;
  activeConnections: string;
  note: string;
  error: string;
  cspOrderable: string;
  cspStatus: string;
  cspZone: string;
}

const EMPTY_TARANA: TaranaOutcome = {
  status: 'not_checked',
  confidence: '',
  nearestSite: '',
  distanceKm: '',
  activeConnections: '',
  note: '',
  error: '',
  cspOrderable: '',
  cspStatus: '',
  cspZone: '',
};

type ProximityChecker =
  typeof import('../lib/coverage/mtn/base-station-service')['checkBaseStationProximity'];
type CspClient = typeof import('../lib/coverage/skyfibre/csp-client')['mtnCspClient'];

async function checkTarana(
  latitude: number,
  longitude: number,
  options: Options,
  deps: { checkProximity: ProximityChecker | null; cspClient: CspClient | null }
): Promise<TaranaOutcome> {
  const outcome: TaranaOutcome = { ...EMPTY_TARANA };
  const notes: string[] = [];

  // Leg 1 — TCS base station proximity (our synced tarana_base_stations table)
  if (deps.checkProximity) {
    const proximity = await deps.checkProximity({ lat: latitude, lng: longitude }, { limit: 5 });
    const nearest = proximity.nearestStation;

    outcome.confidence = proximity.confidence;
    outcome.nearestSite = nearest?.siteName ?? '';
    outcome.distanceKm = nearest ? nearest.distanceKm.toFixed(2) : '';
    outcome.activeConnections = nearest ? String(nearest.activeConnections) : '';
    outcome.status = proximity.hasCoverage ? 'tcs-covered' : 'tcs-not-covered';
    if (proximity.installationNote) notes.push(proximity.installationNote);
  }

  // Leg 2 — MTN CSP orderability. Final authority: it overrides the TCS read either way,
  // because our BN table only covers base stations we have synced.
  if (deps.cspClient) {
    const csp = await deps.cspClient.checkOrderability({
      latitude,
      longitude,
      capacityMbps: options.fwbCapacity,
    });

    outcome.cspStatus = csp.status;
    outcome.cspOrderable = csp.orderable === null ? '' : String(csp.orderable);
    outcome.cspZone = csp.taranaZone == null ? '' : String(csp.taranaZone);

    if (csp.orderable === true) {
      outcome.status = 'feasible';
    } else if (csp.orderable === false) {
      outcome.status = 'not-feasible';
    } else if (csp.status === 'error') {
      outcome.error = csp.error ?? 'CSP orderability check failed';
      notes.push(`CSP unavailable — status falls back to TCS proximity evidence.`);
    }
  }

  outcome.note = notes.join(' ');
  return outcome;
}

/**
 * Access-technology decision, following the sheet's stated policy:
 * fibre first, Tarana FWB where there is no fibre, 5G tertiary.
 */
function decideAccess(dfa: DfaOutcome, tarana: TaranaOutcome, capacityMbps: number): string {
  if (dfa.status === 'connected') {
    return 'DFA fibre — connected building';
  }
  if (dfa.status === 'near-net') {
    return `DFA fibre — near-net build (~${dfa.nearNetDistanceM}m)`;
  }
  if (tarana.status === 'feasible') {
    return `Tarana FWB ${capacityMbps} Mbps — CSP orderable`;
  }
  if (tarana.status === 'tcs-covered') {
    return `Tarana FWB — site survey required (${tarana.confidence} confidence, CSP unconfirmed)`;
  }
  if (dfa.status === 'route-nearby') {
    return `DFA build quotation — ~${dfa.routeDistanceM}m to completed route`;
  }
  if (dfa.status === 'error' || tarana.status === 'error' || tarana.status === 'not_checked') {
    return 'Incomplete — re-check required';
  }
  return '5G/LTE tertiary — no fibre or Tarana coverage';
}

// =====================================================
// Retry + concurrency
// =====================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Coordinate rejections are permanent — retrying them only wastes time. */
function isPermanent(error: unknown): boolean {
  return error instanceof DFACoverageError && error.code === 'INVALID_COORDINATES';
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isPermanent(error) || attempt === attempts) break;
      const backoff = 500 * 2 ** (attempt - 1);
      console.warn(`  ↻ ${label} attempt ${attempt} failed, retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastError;
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// =====================================================
// Main
// =====================================================

async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.skipDfa && options.skipTarana) {
    throw new Error('--skip-dfa and --skip-tarana together leave nothing to check');
  }

  const inputPath = path.resolve(options.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input CSV not found: ${inputPath}`);
  }

  const { headers, rows } = parseCsv(fs.readFileSync(inputPath, 'utf8'));
  if (rows.length === 0) {
    throw new Error(`Input CSV has no data rows: ${inputPath}`);
  }
  for (const required of ['site_id', 'latitude', 'longitude']) {
    if (!headers.includes(required)) {
      throw new Error(`Input CSV is missing the "${required}" column`);
    }
  }

  const outputHeaders = [...headers];
  for (const column of RESULT_COLUMNS) {
    if (!outputHeaders.includes(column)) outputHeaders.push(column);
  }

  const results: ResultRow[] = rows.map((row) => {
    const next: ResultRow = { ...row };
    for (const column of RESULT_COLUMNS) {
      if (next[column] === undefined) next[column] = '';
    }
    return next;
  });

  // --resume carries forward rows that already completed in a previous run.
  const outputPath = path.resolve(options.output);
  const alreadyChecked = new Set<string>();
  if (options.resume && fs.existsSync(outputPath)) {
    const previous = parseCsv(fs.readFileSync(outputPath, 'utf8'));
    const byId = new Map(previous.rows.map((row) => [row.site_id, row]));
    for (const row of results) {
      const prior = byId.get(row.site_id);
      if (prior && prior.dfa_status && prior.dfa_status !== 'error') {
        for (const column of RESULT_COLUMNS) row[column] = prior[column] ?? '';
        alreadyChecked.add(row.site_id);
      }
    }
    console.log(`↻ Resume: ${alreadyChecked.size} site(s) already checked, skipping.`);
  }

  // Tarana has two legs with independent prerequisites; DFA layers need none.
  let checkProximity: ProximityChecker | null = null;
  let cspClient: CspClient | null = null;
  const taranaSkipReasons: string[] = [];

  if (options.skipTarana) {
    taranaSkipReasons.push('--skip-tarana');
  } else {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      checkProximity = (await import('../lib/coverage/mtn/base-station-service'))
        .checkBaseStationProximity;
    } else {
      taranaSkipReasons.push(
        'TCS proximity leg off — NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set'
      );
    }

    if (process.env.MTN_CSP_USERNAME && process.env.MTN_CSP_PASSWORD) {
      cspClient = (await import('../lib/coverage/skyfibre/csp-client')).mtnCspClient;
    } else {
      taranaSkipReasons.push('MTN CSP leg off — MTN_CSP_USERNAME / MTN_CSP_PASSWORD not set');
    }
  }

  const taranaSkipReason = taranaSkipReasons.join('; ');
  if (taranaSkipReason) {
    console.warn(`⚠ ${taranaSkipReason}`);
    if (!options.skipTarana) {
      console.warn('  Run with: set -a && source .env.local && set +a');
    }
  }

  const pending = results.filter((row) => !alreadyChecked.has(row.site_id));
  const queue = options.limit === null ? pending : pending.slice(0, options.limit);

  const taranaLegs = [checkProximity && 'TCS', cspClient && `CSP@${options.fwbCapacity}Mbps`]
    .filter(Boolean)
    .join('+');

  console.log(
    `\nChecking ${queue.length} site(s) — DFA ${options.skipDfa ? 'off' : `on (near-net ${options.nearNetRadius}m, route ${options.routeRadius}m)`}, ` +
      `Tarana ${taranaLegs || 'off'}, concurrency ${options.concurrency}\n`
  );

  const checkedAt = new Date().toISOString().slice(0, 10);
  let done = 0;

  await runPool(queue, options.concurrency, async (row) => {
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    const label = `${row.site_id} ${row.clinic ?? ''}`.trim();

    let dfa: DfaOutcome = { ...EMPTY_DFA, status: options.skipDfa ? 'none' : 'error' };
    let tarana: TaranaOutcome = { ...EMPTY_TARANA, note: taranaSkipReason };

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      dfa = { ...EMPTY_DFA, status: 'error', error: 'Missing or invalid coordinates' };
      tarana = { ...EMPTY_TARANA, status: 'error', error: 'Missing or invalid coordinates' };
    } else {
      if (!options.skipDfa) {
        try {
          dfa = await withRetry(`${label} DFA`, () => checkDfa(latitude, longitude, options));
        } catch (error) {
          dfa = { ...EMPTY_DFA, status: 'error', error: errorMessage(error) };
        }
      } else {
        dfa = { ...EMPTY_DFA, status: 'none' };
      }

      if (checkProximity || cspClient) {
        try {
          tarana = await withRetry(`${label} Tarana`, () =>
            checkTarana(latitude, longitude, options, { checkProximity, cspClient })
          );
        } catch (error) {
          tarana = { ...EMPTY_TARANA, status: 'error', error: errorMessage(error) };
        }
      }
    }

    row.dfa_status = dfa.status;
    row.dfa_nearnet_distance_m = dfa.nearNetDistanceM;
    row.dfa_products_available = dfa.productsAvailable;
    row.dfa_reference = dfa.reference;
    row.checked_date = checkedAt;
    row.dfa_nearnet_building = dfa.nearNetBuilding;
    row.dfa_nearnet_address = dfa.nearNetAddress;
    row.dfa_route_distance_m = dfa.routeDistanceM;
    row.dfa_install_cost_estimate = dfa.installCost;
    row.dfa_install_timeline = dfa.installTimeline;
    row.dfa_error = dfa.error;
    row.tarana_status = tarana.status;
    row.tarana_confidence = tarana.confidence;
    row.tarana_nearest_site = tarana.nearestSite;
    row.tarana_distance_km = tarana.distanceKm;
    row.tarana_active_connections = tarana.activeConnections;
    row.tarana_csp_orderable = tarana.cspOrderable;
    row.tarana_csp_status = tarana.cspStatus;
    row.tarana_csp_zone = tarana.cspZone;
    row.tarana_note = tarana.note;
    row.tarana_error = tarana.error;
    row.recommended_access = decideAccess(dfa, tarana, options.fwbCapacity);

    done++;
    console.log(
      `[${done}/${queue.length}] ${label.padEnd(32)} DFA=${dfa.status.padEnd(12)} Tarana=${tarana.status.padEnd(11)} → ${row.recommended_access}`
    );
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, toCsv(outputHeaders, results), 'utf8');

  const summary = buildSummary(results, options, checkedAt, taranaSkipReason);
  fs.mkdirSync(path.dirname(path.resolve(options.summary)), { recursive: true });
  fs.writeFileSync(path.resolve(options.summary), summary, 'utf8');

  console.log(`\n✅ Results: ${outputPath}`);
  console.log(`✅ Summary: ${path.resolve(options.summary)}\n`);
  console.log(summary);
}

function tally(rows: ResultRow[], column: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row[column] || '(unchecked)';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
}

function countTable(title: string, counts: Map<string, number>, total: number): string {
  const lines = [`### ${title}`, '', '| Value | Sites | Share |', '|---|---:|---:|'];
  for (const [key, count] of counts) {
    lines.push(`| ${key} | ${count} | ${((count / total) * 100).toFixed(1)}% |`);
  }
  return lines.join('\n');
}

function buildSummary(
  rows: ResultRow[],
  options: Options,
  checkedAt: string,
  taranaSkipReason: string
): string {
  const total = rows.length;
  const checked = rows.filter((row) => row.dfa_status !== '').length;

  const sections = [
    '# Unjani DFA + Tarana Coverage Check — Run Summary',
    '',
    `**Run date:** ${checkedAt}`,
    `**Input:** ${options.input}`,
    `**Sites in sheet:** ${total} · **Sites with a result:** ${checked}`,
    `**Near-net radius:** ${options.nearNetRadius}m · **Ductbank radius:** ${options.routeRadius}m · **FWB capacity tested:** ${options.fwbCapacity} Mbps`,
    taranaSkipReason
      ? `**Tarana caveat:** ${taranaSkipReason}`
      : '**Tarana check:** TCS proximity + MTN CSP orderability, both run',
    '',
    countTable('DFA status', tally(rows, 'dfa_status'), total),
    '',
    countTable('Tarana status', tally(rows, 'tarana_status'), total),
    '',
    countTable('Recommended access technology', tally(rows, 'recommended_access'), total),
    '',
    '### Notes',
    '',
    '- `connected` = site falls inside a DFA Connected Building polygon (active fibre).',
    `- \`near-net\` = nearest DFA building is within ${options.nearNetRadius}m; \`dfa_nearnet_distance_m\` holds the measured distance.`,
    `- \`route-nearby\` = no DFA building match, but a completed ductbank route lies within ${options.routeRadius}m.`,
    '- `feasible` / `not-feasible` come from MTN CSP, which is the final authority on FWB orderability.',
    '- `tcs-covered` / `tcs-not-covered` are our own base-station evidence only, used when CSP could not be reached.',
    '- Coordinates flagged `AUTO-GEOCODED` in the sheet are address-level, not doorstep — exact GPS must be captured on site before order placement.',
  ];

  return sections.join('\n') + '\n';
}

main().catch((error) => {
  console.error(`\n❌ ${errorMessage(error)}`);
  process.exit(1);
});
