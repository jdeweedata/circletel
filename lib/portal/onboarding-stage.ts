/**
 * The six Unjani Connect onboarding stages, from the customer-facing guide
 * "Unjani Connect — Your onboarding & support guide" v1.22 (22/07/2026),
 * section "From nomination to go-live".
 *
 * Stages 1-4 are evidenced on the customer side (customers, onboarding_tokens,
 * onboarding_submissions); stages 5-6 on the site side (corporate_sites). The
 * two are joined by corporate_sites.customer_id.
 *
 * "Changes requested" is not a seventh stage — the guide describes six. It is an
 * exception branch off stage 3, which is why it renders differently.
 */

export type StageKey =
  | 'nominated'
  | 'introduced'
  | 'details_confirmed'
  | 'changes_requested'
  | 'visit_booked'
  | 'installing'
  | 'live';

export interface StageDefinition {
  key: StageKey;
  /** Step number in the guide. The exception branch has none. */
  step: number | null;
  label: string;
  /** The guide's own description of the step. */
  description: string;
  /** Exception branch rather than a forward step. */
  branch?: boolean;
}

export const ONBOARDING_STAGES: StageDefinition[] = [
  {
    key: 'nominated',
    step: 1,
    label: 'Clinic nominated',
    description:
      'Unjani NPC confirms the clinic and CircleTel checks coverage at the provided address.',
  },
  {
    key: 'introduced',
    step: 2,
    label: 'Introduction',
    description: 'Unjani introduces CircleTel to the clinic manager or nurse.',
  },
  {
    key: 'details_confirmed',
    step: 3,
    label: 'Clinic details confirmed',
    description:
      'We capture the service address and authorised on-site contact details.',
  },
  {
    key: 'changes_requested',
    step: null,
    label: 'Changes requested',
    description: 'The submitted clinic details need correcting before we can proceed.',
    branch: true,
  },
  {
    key: 'visit_booked',
    step: 4,
    label: 'Installation visit booked',
    description:
      'We agree a suitable date with the on-site contact, confirm it before travelling and avoid the 25th to the 7th.',
  },
  {
    key: 'installing',
    step: 5,
    label: 'Survey, install and test',
    description:
      'Our technician confirms signal and equipment positions, installs the router and access point, tests the service and shows staff the basic checks.',
  },
  {
    key: 'live',
    step: 6,
    label: 'Go live',
    description:
      'We issue the Ready for Service Certificate. The free first month starts on the go-live date.',
  },
];

const STAGE_BY_KEY = new Map(ONBOARDING_STAGES.map((s) => [s.key, s]));

export function stageDefinition(key: StageKey): StageDefinition {
  const definition = STAGE_BY_KEY.get(key);
  if (!definition) throw new Error(`Unknown onboarding stage: ${key}`);
  return definition;
}

/** Everything the derivation needs, gathered from the two sides of the join. */
export interface StageSignals {
  /** corporate_sites.status — 'active' once the site is live. */
  siteStatus?: string | null;
  /** corporate_sites.installed_at — the go-live date. */
  installedAt?: string | null;
  /** Most advanced onboarding_submissions row for the customer. */
  submissionStatus?: string | null;
  submissionRejectionReason?: string | null;
  /** An onboarding link has been sent to the clinic. */
  onboardingLinkSent?: boolean;
  /** Scheduler-confirmed visit (YYYY-MM-DD). A proposed ops slot does not count. */
  visitDate?: string | null;
  /** Kit physically issued for the confirmed visit. */
  kitIssuedAt?: string | null;
}

/**
 * Most-advanced-evidence-wins. Approved details stay on Clinic details confirmed
 * until the scheduler writes a visit date. Survey/install starts after that
 * confirmed visit once the kit is issued — not merely because a pending site exists.
 */
export function deriveStage(signals: StageSignals): StageKey {
  const {
    siteStatus,
    installedAt,
    submissionStatus,
    submissionRejectionReason,
    onboardingLinkSent,
    visitDate,
    kitIssuedAt,
  } = signals;

  if (siteStatus === 'active' && installedAt) return 'live';
  if (visitDate && kitIssuedAt) return 'installing';
  if (visitDate) return 'visit_booked';
  if (submissionRejectionReason) return 'changes_requested';
  if (submissionStatus === 'submitted' || submissionStatus === 'approved') {
    return 'details_confirmed';
  }
  if (onboardingLinkSent) return 'introduced';
  return 'nominated';
}

/** Ranks onboarding_submissions rows — a customer can hold several drafts. */
export function submissionRank(status: string | null | undefined): number {
  if (status === 'approved') return 3;
  if (status === 'submitted') return 2;
  return 1;
}

/**
 * The guide: "Your first month from go-live is free." A site therefore only
 * contributes to monthly spend once its free month has elapsed.
 */
export function isInFreeFirstMonth(
  installedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!installedAt) return false;
  const goLive = new Date(installedAt);
  if (Number.isNaN(goLive.getTime())) return false;
  const freeUntil = new Date(goLive);
  freeUntil.setMonth(freeUntil.getMonth() + 1);
  return now < freeUntil;
}
