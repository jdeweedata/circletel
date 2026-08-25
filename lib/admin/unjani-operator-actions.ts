/**
 * Operator next-actions for /admin/unjani/onboarding.
 * Stage keys still come only from deriveStage() — this file maps actions, not stages.
 */

import type { StageKey } from '@/lib/portal/onboarding-stage';

export type PrimaryActionId =
  | 'request_npc_acceptance'
  | 'send_intro'
  | 'remind'
  | 'confirm_details'
  | 'book_visit'
  | 'go_live'
  | 'done';

export type SecondaryActionId = 'request_changes' | 'open_kyc' | 'issue_service_order';

export interface OperatorAction {
  id: PrimaryActionId | SecondaryActionId;
  label: string;
}

export interface OperatorActions {
  primary: { id: PrimaryActionId; label: string };
  secondary: Array<{ id: SecondaryActionId; label: string }>;
}

const ACTIONS: Record<StageKey, OperatorActions> = {
  nominated: {
    primary: { id: 'request_npc_acceptance', label: 'Awaiting Unjani NPC' },
    secondary: [],
  },
  introduced: {
    primary: { id: 'remind', label: 'Send reminder' },
    secondary: [],
  },
  details_confirmed: {
    primary: { id: 'confirm_details', label: 'Confirm details' },
    secondary: [
      { id: 'request_changes', label: 'Request changes' },
      { id: 'open_kyc', label: 'Open full KYC' },
    ],
  },
  changes_requested: {
    primary: { id: 'remind', label: 'Send reminder' },
    secondary: [{ id: 'open_kyc', label: 'Open full KYC' }],
  },
  visit_booked: {
    primary: { id: 'book_visit', label: 'Book visit' },
    secondary: [{ id: 'issue_service_order', label: 'Issue service order' }],
  },
  installing: {
    primary: { id: 'go_live', label: 'Go live' },
    secondary: [],
  },
  live: {
    primary: { id: 'done', label: 'Done' },
    secondary: [],
  },
};

export function operatorAction(stage: StageKey): OperatorActions {
  return ACTIONS[stage];
}

/**
 * Guide: agree a date and avoid the 25th to the 7th (month-end / month-start).
 * Parses YYYY-MM-DD as a calendar day, not a UTC instant.
 */
export function isVisitWindowBlocked(isoDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return true;
  const day = Number(match[3]);
  return day >= 25 || day <= 7;
}
