import {
  clinicKey,
  contactForClinic,
  mergeClinicContact,
} from '@/lib/portal/coverage-summary';
import { allRegisterContactsByClinicKey } from '@/lib/portal/unjani-register-contact';

export async function listUnjaniCoverageFeed(
  adminDb: {
    from: (table: string) => any;
  },
  organisationId: string
): Promise<{
  checks: unknown[];
  pipelineClinicKeys: string[];
  pipelineContacts: Record<string, { name: string; phone: string; email: string }>;
}> {
  const [{ data, error }, { data: sites }] = await Promise.all([
    adminDb
      .from('b2b_coverage_checks')
      .select('id, clinic_name, address, latitude, longitude, results, created_at')
      .eq('organisation_id', organisationId)
      .order('clinic_name', { ascending: true }),
    adminDb
      .from('corporate_sites')
      .select('site_name, site_contact_name, site_contact_phone, site_contact_email')
      .eq('corporate_id', organisationId),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const pipelineClinicKeys: string[] = [];
  const pipelineContacts = { ...allRegisterContactsByClinicKey() };

  for (const site of sites ?? []) {
    const key = clinicKey(site.site_name);
    if (!key) continue;
    pipelineClinicKeys.push(key);
    pipelineContacts[key] = mergeClinicContact(pipelineContacts[key], {
      name: site.site_contact_name ?? '',
      phone: site.site_contact_phone ?? '',
      email: site.site_contact_email ?? '',
    });
  }

  for (const check of data ?? []) {
    const key = clinicKey(check.clinic_name);
    if (!key || pipelineContacts[key]) continue;
    const found = contactForClinic(check.clinic_name, pipelineContacts);
    if (found) pipelineContacts[key] = found;
  }

  return {
    checks: data ?? [],
    pipelineClinicKeys: [...new Set(pipelineClinicKeys)],
    pipelineContacts,
  };
}
