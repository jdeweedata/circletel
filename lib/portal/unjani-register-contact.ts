import registerContacts from '@/lib/data/unjani-register-contacts.json';
import {
  clinicKey,
  contactForClinic,
  type ClinicContact,
} from '@/lib/portal/coverage-summary';

type RegisterContactRow = {
  nurse?: string;
  phone?: string;
  email?: string;
};

const RAW = registerContacts as Record<string, RegisterContactRow>;

let cached: Record<string, ClinicContact> | null = null;

/** Server-only: nurse / phone / email for every Unjani register clinic. */
export function allRegisterContactsByClinicKey(): Record<string, ClinicContact> {
  if (cached) return cached;
  const map: Record<string, ClinicContact> = {};
  for (const [name, row] of Object.entries(RAW)) {
    const key = clinicKey(name);
    if (!key) continue;
    map[key] = {
      name: row.nurse ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
    };
  }
  cached = map;
  return map;
}

export function registerContactForClinic(
  name: string | null | undefined
): ClinicContact | undefined {
  return contactForClinic(name, allRegisterContactsByClinicKey());
}
