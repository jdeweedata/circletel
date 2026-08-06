import type { SupabaseClient } from '@supabase/supabase-js';
import { now, SAST_OFFSET_MS } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { assembleCoreTraffic } from './core-traffic';
import {
  fetchInclusionSiteRows,
  filterEligibleSites,
  type InclusionSiteRow,
} from './inclusion';
import {
  loadFreeHourRows,
  resolvePatientWifi,
  type TdxPatientRow,
} from './patient-wifi';
import { loadStaffHourRows, resolveStaffWifi, siteHasLinkedAp } from './staff-wifi';
import type {
  AssembleSkipReason,
  CoreUnavailableDiagnosis,
  PatientWifiState,
  ReportPeriod,
  SiteUsageReportModel,
  StaffWifiState,
} from './types';

type ReportCore = SiteUsageReportModel['core'];
type ReportDevice = NonNullable<SiteUsageReportModel['device']>;

export type AssembleResult =
  | { ok: true; model: SiteUsageReportModel }
  | {
      ok: false;
      reason: AssembleSkipReason;
      siteId: string;
      siteLabel: string;
      /**
       * Present only for `core_unavailable` — which of the source links are
       * missing, so the caller can name each cause and its unlock step (#689).
       */
      diagnosis?: CoreUnavailableDiagnosis;
    };

export interface AssembleReportDeps {
  loadSite(siteId: string): Promise<InclusionSiteRow | null>;
  loadCore(siteId: string, period: ReportPeriod): Promise<ReportCore>;
  loadStaff(siteId: string, period: ReportPeriod): Promise<StaffWifiState>;
  loadPatient(
    siteId: string,
    period: ReportPeriod,
    tdxRow: TdxPatientRow | null
  ): Promise<PatientWifiState>;
  loadDevice(siteId: string): Promise<ReportDevice | null>;
  generatedAtIso?(): string;
}

export interface AssembleSiteUsageReportInput {
  siteId: string;
  period: ReportPeriod;
  patientRow: TdxPatientRow | null;
  deps?: AssembleReportDeps;
}

function generatedAtSastIso(): string {
  return new Date(now().getTime() + SAST_OFFSET_MS)
    .toISOString()
    .replace('Z', '+02:00');
}

async function loadReportDevice(
  supabase: SupabaseClient,
  siteId: string
): Promise<ReportDevice | null> {
  const { data: device, error } = await supabase
    .from('network_devices')
    .select('device_name,model,serial_number,ruijie_device_sn,status')
    .eq('corporate_site_id', siteId)
    .not('ruijie_device_sn', 'is', null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!device) return null;

  const ruijieSerial = device.ruijie_device_sn as string | null;
  const { data: cache, error: cacheError } = ruijieSerial
    ? await supabase
        .from('ruijie_device_cache')
        .select('group_name,status')
        .eq('sn', ruijieSerial)
        .maybeSingle()
    : { data: null, error: null };

  if (cacheError) throw cacheError;
  return {
    name: String(device.device_name ?? ''),
    model: String(device.model ?? ''),
    serial: String(ruijieSerial ?? device.serial_number ?? ''),
    group: String(cache?.group_name ?? ''),
    status: String(cache?.status ?? device.status ?? ''),
  };
}

export function createDefaultAssembleReportDeps(): AssembleReportDeps {
  let clientPromise: ReturnType<typeof createClient> | null = null;
  const getClient = () => {
    clientPromise ??= createClient();
    return clientPromise;
  };

  return {
    async loadSite(siteId) {
      const rows = await fetchInclusionSiteRows(await getClient());
      return (
        filterEligibleSites(rows, { includeProvisioned: false }).find(
          (site) => site.id === siteId
        ) ?? null
      );
    },
    async loadCore(siteId, period) {
      return assembleCoreTraffic(await getClient(), siteId, period);
    },
    async loadStaff(siteId, period) {
      const supabase = await getClient();
      const [apLinkedToSite, hourRows] = await Promise.all([
        siteHasLinkedAp(supabase, siteId),
        loadStaffHourRows(supabase, siteId, period.startUtc, period.endUtc),
      ]);
      return resolveStaffWifi({ apLinkedToSite, hourRows });
    },
    async loadPatient(siteId, period, tdxRow) {
      const supabase = await getClient();
      const [apLinkedToSite, hourRows] = await Promise.all([
        siteHasLinkedAp(supabase, siteId),
        loadFreeHourRows(supabase, siteId, period.startUtc, period.endUtc),
      ]);
      return resolvePatientWifi({ apLinkedToSite, hourRows, tdxRow });
    },
    async loadDevice(siteId) {
      return loadReportDevice(await getClient(), siteId);
    },
    generatedAtIso: generatedAtSastIso,
  };
}

export const defaultAssembleReportDeps = createDefaultAssembleReportDeps();

export async function assembleSiteUsageReport({
  siteId,
  period,
  patientRow,
  deps = defaultAssembleReportDeps,
}: AssembleSiteUsageReportInput): Promise<AssembleResult> {
  const site = await deps.loadSite(siteId);
  if (!site) {
    return {
      ok: false,
      reason: 'site_not_eligible',
      siteId,
      siteLabel: siteId,
    };
  }

  const core = await deps.loadCore(siteId, period);
  if (core.source === 'unavailable') {
    return {
      ok: false,
      reason: 'core_unavailable',
      siteId,
      siteLabel: site.name,
      diagnosis: core.unavailable,
    };
  }

  const unjani = site.corporate_code === 'UNJ';
  const [staff, patient, device] = await Promise.all([
    unjani
      ? deps.loadStaff(siteId, period)
      : Promise.resolve<StaffWifiState>({ kind: 'no_samples' }),
    unjani
      ? deps.loadPatient(siteId, period, patientRow)
      : Promise.resolve<PatientWifiState>({ kind: 'no_samples' }),
    deps.loadDevice(siteId),
  ]);

  return {
    ok: true,
    model: {
      generatedAtIso: deps.generatedAtIso?.() ?? generatedAtSastIso(),
      site: {
        id: site.id,
        name: site.name,
        accountNumber: site.account_number,
        corporateCode: site.corporate_code,
        accountName: site.account_name,
      },
      period,
      core,
      device,
      unjani,
      staff,
      patient,
    },
  };
}
