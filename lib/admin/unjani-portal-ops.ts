/**
 * Shared Unjani portal → Admin onboarding ops helpers.
 * Classification only — stage labels come from lib/portal/onboarding-stage.
 */

import { clinicKey } from '@/lib/portal/coverage-summary';
import { deskStatusForPortalUpdate } from '@/lib/portal/desk-tickets';
import { deriveStage, type StageKey, type StageSignals } from '@/lib/portal/onboarding-stage';

export { deskStatusForPortalUpdate };

export const ACTIVATION_TICKET_TYPE = 'activation_request';

export interface PortalOpsTicket {
  id: string;
  subject: string;
  description?: string | null;
  status: string;
  ticket_type: string;
  site_id: string | null;
  zoho_ticket_id?: string | null;
  zoho_ticket_number?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface PortalOpsCoverageCheck {
  id: string;
  clinic_name?: string | null;
  address?: string | null;
  created_at: string;
  results?: {
    summary?: { tarana?: string; '5g_lte'?: string };
  } | null;
}

export interface PortalOpsSite {
  id: string;
  site_name: string;
  status: string;
  installed_at?: string | null;
}

export interface NominationContact {
  clinicName?: string;
  address?: string;
  contactName?: string;
  mobile?: string;
  email?: string;
}

export interface NominationRow {
  source: 'ticket' | 'coverage_check';
  clinicName: string;
  address: string | null;
  contact: NominationContact;
  coverageSummary: { tarana?: string; '5g_lte'?: string } | null;
  createdAt: string;
  ticket: PortalOpsTicket | null;
  coverageCheckId: string | null;
}

export interface ActivationRow {
  clinicName: string;
  siteId: string;
  siteName: string;
  siteStatus: string;
  ticket: PortalOpsTicket;
}

function isOpenActivationRequest(ticket: PortalOpsTicket): boolean {
  return (
    ticket.ticket_type === ACTIVATION_TICKET_TYPE &&
    ticket.status !== 'resolved' &&
    ticket.status !== 'closed'
  );
}

export function parseNominationDescription(
  description: string | null | undefined
): NominationContact {
  if (!description) return {};
  const pick = (label: string) => {
    const match = description.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'));
    const value = match?.[1]?.trim();
    return value || undefined;
  };
  return {
    clinicName: pick('Clinic'),
    address: pick('Service address'),
    contactName: pick('On-site contact'),
    mobile: pick('Mobile'),
    email: pick('Email'),
  };
}

export function clinicNameFromTicket(ticket: PortalOpsTicket): string {
  const parsed = parseNominationDescription(ticket.description);
  if (parsed.clinicName) return parsed.clinicName;
  return ticket.subject
    .replace(/^Onboard clinic:\s*/i, '')
    .replace(/^Activate Site:\s*/i, '')
    .trim();
}

export function buildNominationQueue(input: {
  tickets: PortalOpsTicket[];
  coverageChecks: PortalOpsCoverageCheck[];
  existingClinicNames: Array<string | null | undefined>;
  now?: Date;
  coverageCheckMaxAgeDays?: number;
}): NominationRow[] {
  const existingKeys = new Set(
    input.existingClinicNames.map((name) => clinicKey(name)).filter(Boolean)
  );
  const ticketKeys = new Set<string>();
  const checkByKey = new Map<string, PortalOpsCoverageCheck>();
  for (const check of input.coverageChecks) {
    const key = clinicKey(check.clinic_name);
    if (key && !checkByKey.has(key)) checkByKey.set(key, check);
  }
  const rows: NominationRow[] = [];

  for (const ticket of input.tickets) {
    if (!isOpenActivationRequest(ticket) || ticket.site_id) continue;
    const contact = parseNominationDescription(ticket.description);
    const clinicName = clinicNameFromTicket(ticket);
    const key = clinicKey(clinicName);
    if (key && existingKeys.has(key)) continue;
    if (key) ticketKeys.add(key);
    const matchedCheck = key ? checkByKey.get(key) : undefined;
    rows.push({
      source: 'ticket',
      clinicName,
      address: contact.address ?? matchedCheck?.address ?? null,
      contact,
      coverageSummary: matchedCheck?.results?.summary ?? null,
      createdAt: ticket.created_at,
      ticket,
      coverageCheckId: matchedCheck?.id ?? null,
    });
  }

  const now = input.now ?? new Date();
  const maxAgeMs = (input.coverageCheckMaxAgeDays ?? 3) * 24 * 60 * 60 * 1000;

  for (const check of input.coverageChecks) {
    const clinicName = (check.clinic_name || '').trim();
    const key = clinicKey(clinicName);
    if (!key || existingKeys.has(key) || ticketKeys.has(key)) continue;
    const created = new Date(check.created_at).getTime();
    if (Number.isNaN(created) || now.getTime() - created > maxAgeMs) continue;
    rows.push({
      source: 'coverage_check',
      clinicName: clinicName.replace(/^Unjani Clinic\s*-\s*/i, '').trim() || clinicName,
      address: check.address ?? null,
      contact: { clinicName, address: check.address ?? undefined },
      coverageSummary: check.results?.summary ?? null,
      createdAt: check.created_at,
      ticket: null,
      coverageCheckId: check.id,
    });
  }

  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function buildActivationQueue(input: {
  tickets: PortalOpsTicket[];
  sites: PortalOpsSite[];
}): ActivationRow[] {
  const sites = new Map(input.sites.map((site) => [site.id, site]));
  return input.tickets
    .filter((ticket) => isOpenActivationRequest(ticket) && ticket.site_id)
    .map((ticket) => {
      const site = sites.get(ticket.site_id as string);
      return {
        clinicName: clinicNameFromTicket(ticket),
        siteId: ticket.site_id as string,
        siteName: site?.site_name || clinicNameFromTicket(ticket),
        siteStatus: site?.status || 'unknown',
        ticket,
      };
    });
}

export function signalsForPipelineClinic(input: {
  billingStage: string;
  documentVettingStatus?: string | null;
  siteStatus?: string | null;
  installedAt?: string | null;
  submissionStatus?: string | null;
  submissionRejectionReason?: string | null;
  onboardingLinkSent?: boolean;
}): StageSignals {
  const inferredSubmission =
    input.submissionStatus ??
    (input.documentVettingStatus === 'approved' ||
    ['docs_approved', 'billing_ready', 'service_active'].includes(input.billingStage)
      ? 'approved'
      : input.documentVettingStatus === 'rejected' ||
          input.billingStage === 'submitted' ||
          input.billingStage === 'changes_requested'
        ? 'submitted'
        : null);

  const inferredRejection =
    input.submissionRejectionReason ??
    (input.documentVettingStatus === 'rejected' || input.billingStage === 'changes_requested'
      ? 'changes requested'
      : null);

  return {
    siteStatus: input.siteStatus ?? null,
    installedAt: input.installedAt ?? null,
    submissionStatus: inferredSubmission,
    submissionRejectionReason: inferredRejection,
    onboardingLinkSent: input.onboardingLinkSent ?? input.billingStage !== 'pending',
  };
}

export function portalStageForClinic(
  input: Parameters<typeof signalsForPipelineClinic>[0]
): StageKey {
  return deriveStage(signalsForPipelineClinic(input));
}

export function registerTicketPatch(siteId?: string | null): {
  status: 'in_progress';
  site_id?: string;
} {
  return siteId ? { status: 'in_progress', site_id: siteId } : { status: 'in_progress' };
}

export function activateTicketPatch(now = new Date()): {
  status: 'resolved';
  resolved_at: string;
} {
  return { status: 'resolved', resolved_at: now.toISOString() };
}

export function activationSteps(currentStatus: string): Array<'provisioned' | 'active'> {
  if (currentStatus === 'active') return [];
  if (currentStatus === 'provisioned') return ['active'];
  return ['provisioned', 'active'];
}
