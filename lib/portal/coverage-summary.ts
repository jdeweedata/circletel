/**
 * Portal coverage display helpers.
 *
 * DFA / fibre is intentionally ignored: the portal explorer only ranks
 * Tarana (fixed wireless), then 5G, then 4G.
 */

export type AccessTech = 'fixed_wireless' | '5g' | '4g' | 'none';

export interface CoverageCheckResults {
  site_id?: string | null;
  province?: string | null;
  district?: string | null;
  cluster_tier?: number | null;
  rollout_phase?: number | null;
  recommended_access_technology?: string | null;
  tarana?: { feasible?: boolean; capacity_mbps?: number | null };
  lte?: { available?: boolean };
  five_g?: { available?: boolean };
  summary?: { tarana?: string; '5g_lte'?: string };
}

export interface CoverageCheckRow {
  id: string;
  clinic_name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  results: CoverageCheckResults | null;
  created_at: string;
}

export interface ClinicContact {
  name: string;
  phone: string;
  email: string;
}

/** Same collapse as the dashboard: "Unjani Clinic - Lens ext 10" → "lensext10". */
export function clinicKey(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .replace(/^.*[Uu]njani [Cc]linic[ -]*/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Coverage-checked clinic Unjani has nominated — still waiting for NPC acceptance. */
export function isNominatedCoverageCheck(check: { results?: unknown }): boolean {
  const results = check.results as { nominated?: boolean; nominated_at?: string | null } | null;
  return Boolean(results?.nominated || results?.nominated_at);
}

/** Best available access, ignoring fibre / DFA. */
export function recommendedAccess(
  results: CoverageCheckResults | null | undefined
): AccessTech {
  if (results?.tarana?.feasible) return 'fixed_wireless';
  if (results?.five_g?.available) return '5g';
  if (results?.lte?.available) return '4g';
  return 'none';
}

export function recommendedLabel(tech: AccessTech): string {
  switch (tech) {
    case 'fixed_wireless':
      return 'Fixed wireless — Tarana 50 Mbps';
    case '5g':
      return '5G';
    case '4g':
      return '4G';
    default:
      return 'No coverage yet';
  }
}

export function coverageKpis(checks: CoverageCheckRow[]): {
  fixedWireless: number;
  fiveG: number;
  fourG: number;
} {
  let fixedWireless = 0;
  let fiveG = 0;
  let fourG = 0;
  for (const check of checks) {
    const rec = recommendedAccess(check.results);
    if (rec === 'fixed_wireless') fixedWireless += 1;
    else if (rec === '5g') fiveG += 1;
    else if (rec === '4g') fourG += 1;
  }
  return { fixedWireless, fiveG, fourG };
}

export function isInPipeline(
  clinicName: string | null | undefined,
  pipelineKeys: Iterable<string>
): boolean {
  const key = clinicKey(clinicName);
  if (!key) return false;
  const set = pipelineKeys instanceof Set ? pipelineKeys : new Set(pipelineKeys);
  return set.has(key);
}

/** Live site fields win when non-empty; otherwise keep the register value. */
export function mergeClinicContact(
  base: ClinicContact | undefined,
  overlay: ClinicContact | undefined
): ClinicContact {
  return {
    name: overlay?.name?.trim() || base?.name || '',
    phone: overlay?.phone?.trim() || base?.phone || '',
    email: overlay?.email?.trim() || base?.email || '',
  };
}

/**
 * Look up a contact map keyed by clinicKey, including labels like
 * "Soshanguve (Block P)" → soshanguve.
 */
export function contactForClinic(
  name: string | null | undefined,
  contacts: Record<string, ClinicContact>
): ClinicContact | undefined {
  const key = clinicKey(name);
  if (key && contacts[key]) return contacts[key];
  const stripped = clinicKey((name ?? '').replace(/\([^)]*\)/g, ''));
  if (stripped && contacts[stripped]) return contacts[stripped];
  return undefined;
}
