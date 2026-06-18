/**
 * Shared mapping from the Unjani network register to the incumbent-connectivity
 * fields stored on customers.clinic_details. Used by the backfill script, the
 * register-clinic creation route, and the register-clinic-details read endpoint
 * so the drawer renders identically for pipeline and register clinics.
 */
import register from '@/lib/data/unjani-network-register.json';

export type ContractStatus = 'in_contract' | 'out_of_contract' | 'unknown';

export interface IncumbentFields {
  incumbent_isp: string | null;
  incumbent_cost: number | null;
  contract_status: ContractStatus;
}

export interface RegisterEntry {
  name: string;
  province: string | null;
  nurse: string | null;
  isp: string | null;
  isp_cost: number | null;
  saving: number | null;
  migration_ready: boolean;
}

/** migration_ready: true = free to switch (out of contract); false = locked in. */
export function deriveContractStatus(
  migrationReady: boolean | null | undefined
): ContractStatus {
  if (migrationReady === true) return 'out_of_contract';
  if (migrationReady === false) return 'in_contract';
  return 'unknown';
}

/** Normalise so pipeline names ("Unjani Clinic - Delmas") match register names ("Delmas"). */
export function normClinicName(s: string): string {
  return s.toLowerCase().replace(/^unjani clinic\s*-\s*/, '').trim();
}

const REGISTER_BY_NAME = new Map<string, RegisterEntry>(
  (register as { clinics: RegisterEntry[] }).clinics.map((c) => [normClinicName(c.name), c])
);

export function registerEntryForClinic(clinicName: string): RegisterEntry | undefined {
  return REGISTER_BY_NAME.get(normClinicName(clinicName));
}

export function incumbentForClinic(clinicName: string): IncumbentFields {
  const e = registerEntryForClinic(clinicName);
  return {
    incumbent_isp: e?.isp ?? null,
    incumbent_cost: e?.isp_cost ?? null,
    contract_status: deriveContractStatus(e?.migration_ready),
  };
}
