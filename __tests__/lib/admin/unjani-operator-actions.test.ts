import {
  isVisitWindowBlocked,
  operatorAction,
} from '@/lib/admin/unjani-operator-actions';
import { ONBOARDING_STAGES, type StageKey } from '@/lib/portal/onboarding-stage';

describe('Unjani operator actions', () => {
  const expectedPrimary: Record<StageKey, string> = {
    nominated: 'request_npc_acceptance',
    introduced: 'remind',
    details_confirmed: 'confirm_details',
    changes_requested: 'remind',
    visit_booked: 'book_visit',
    installing: 'go_live',
    live: 'done',
  };

  it.each(ONBOARDING_STAGES.map((stage) => [stage.key, expectedPrimary[stage.key]]))(
    'maps %s to primary action %s',
    (stage, actionId) => {
      expect(operatorAction(stage as StageKey).primary.id).toBe(actionId);
    }
  );

  it('uses operator labels from the Unjani guide, not B2B vetting labels', () => {
    expect(operatorAction('nominated').primary.label).toBe('Awaiting Unjani NPC');
    expect(operatorAction('introduced').primary.label).toBe('Send reminder');
    expect(operatorAction('details_confirmed').primary.label).toBe('Confirm details');
    expect(operatorAction('visit_booked').primary.label).toBe('Book visit');
    expect(operatorAction('installing').primary.label).toBe('Go live');
    expect(operatorAction('live').primary.label).toBe('Done');
  });

  it('keeps request-changes and KYC as secondary actions on clinic details', () => {
    const confirmed = operatorAction('details_confirmed');
    expect(confirmed.secondary.map((action) => action.id)).toEqual([
      'request_changes',
      'open_kyc',
    ]);
    expect(operatorAction('changes_requested').secondary.map((action) => action.id)).toEqual([
      'open_kyc',
    ]);
  });

  it('keeps issuing a service order secondary to booking the visit', () => {
    expect(operatorAction('visit_booked').secondary.map((action) => action.id)).toEqual([
      'issue_service_order',
    ]);
  });

  it('blocks installation visits from the 25th through the 7th', () => {
    expect(isVisitWindowBlocked('2026-08-25')).toBe(true);
    expect(isVisitWindowBlocked('2026-09-01')).toBe(true);
    expect(isVisitWindowBlocked('2026-09-07')).toBe(true);
    expect(isVisitWindowBlocked('2026-08-24')).toBe(false);
    expect(isVisitWindowBlocked('2026-09-08')).toBe(false);
  });
});
