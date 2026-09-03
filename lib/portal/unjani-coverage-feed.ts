import {
  clinicKey,
  contactForClinic,
  isNominatedCoverageCheck,
  mergeClinicContact,
} from '@/lib/portal/coverage-summary';
import {
  countOnboardingStages,
  indexInstallEvidence,
  stageByClinicKey as mapStageByClinicKey,
  stageClinicRefs,
} from '@/lib/portal/count-onboarding-stages';
import { submissionRank, type StageKey } from '@/lib/portal/onboarding-stage';
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
  stageByClinicKey: Record<string, StageKey>;
}> {
  const [{ data, error }, { data: sites }, { data: customers }] = await Promise.all([
    adminDb
      .from('b2b_coverage_checks')
      .select('id, clinic_name, address, latitude, longitude, results, created_at')
      .eq('organisation_id', organisationId)
      .order('clinic_name', { ascending: true }),
    adminDb
      .from('corporate_sites')
      .select(
        'id, site_name, status, installed_at, site_contact_name, site_contact_phone, site_contact_email'
      )
      .eq('corporate_id', organisationId),
    adminDb.from('customers').select('id, business_name, corporate_site_id'),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const checks = data ?? [];
  const siteList = sites ?? [];
  const customerList = customers ?? [];
  const customerIds = customerList.map((customer: { id: string }) => customer.id);
  const bestSubmission: Record<
    string,
    { status: string | null; rejection_reason: string | null }
  > = {};
  const linkSent = new Set<string>();

  if (customerIds.length > 0) {
    const [{ data: submissions }, { data: tokens }] = await Promise.all([
      adminDb
        .from('onboarding_submissions')
        .select('customer_id, status, rejection_reason')
        .in('customer_id', customerIds),
      adminDb
        .from('onboarding_tokens')
        .select('customer_id, sent_at')
        .in('customer_id', customerIds)
        .not('sent_at', 'is', null),
    ]);

    for (const submission of submissions ?? []) {
      const current = bestSubmission[submission.customer_id];
      if (!current || submissionRank(submission.status) > submissionRank(current.status)) {
        bestSubmission[submission.customer_id] = {
          status: submission.status,
          rejection_reason: submission.rejection_reason,
        };
      }
    }
    for (const token of tokens ?? []) linkSent.add(token.customer_id);
  }

  const { data: installOrders } = await adminDb
    .from('unjani_install_orders')
    .select('customer_id, corporate_site_id, visit_date, kit_issued_at, status')
    .eq('organisation_id', organisationId)
    .in('status', ['open', 'scheduled', 'in_progress']);
  const installEvidence = indexInstallEvidence(installOrders ?? []);

  const nominatedChecks = checks.filter(isNominatedCoverageCheck);
  const counted = countOnboardingStages({
    sites: siteList,
    customers: customerList,
    bestSubmission,
    linkSent,
    nominatedCheckKeys: nominatedChecks.map(
      (check: { clinic_name?: string | null }) => check.clinic_name ?? ''
    ),
    installByCustomerId: installEvidence.byCustomerId,
    installBySiteId: installEvidence.bySiteId,
  });
  const refs = stageClinicRefs({
    sites: siteList,
    customers: customerList,
    stageBySiteId: counted.stageBySiteId,
    stageByCustomerId: counted.stageByCustomerId,
    nominatedChecks,
  });

  const pipelineClinicKeys: string[] = [];
  const pipelineContacts = { ...allRegisterContactsByClinicKey() };

  for (const site of siteList) {
    const key = clinicKey(site.site_name);
    if (!key) continue;
    pipelineClinicKeys.push(key);
    pipelineContacts[key] = mergeClinicContact(pipelineContacts[key], {
      name: site.site_contact_name ?? '',
      phone: site.site_contact_phone ?? '',
      email: site.site_contact_email ?? '',
    });
  }

  for (const check of checks) {
    const key = clinicKey(check.clinic_name);
    if (!key || pipelineContacts[key]) continue;
    const found = contactForClinic(check.clinic_name, pipelineContacts);
    if (found) pipelineContacts[key] = found;
  }

  return {
    checks,
    pipelineClinicKeys: [...new Set(pipelineClinicKeys)],
    pipelineContacts,
    stageByClinicKey: mapStageByClinicKey(refs),
  };
}
