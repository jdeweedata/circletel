import {
  countOnboardingStages,
  emptyStageCounts,
  scopeOnboardingCustomers,
} from '@/lib/portal/count-onboarding-stages';
import { clinicKey } from '@/lib/portal/coverage-summary';

describe('countOnboardingStages', () => {
  it('counts an active site with a go-live date as live', () => {
    const result = countOnboardingStages({
      sites: [
        {
          id: 'site-delmas',
          status: 'active',
          installed_at: '2026-08-01T00:00:00.000Z',
        },
      ],
      customers: [{ id: 'cust-delmas', corporate_site_id: 'site-delmas' }],
      bestSubmission: {
        'cust-delmas': { status: 'approved', rejection_reason: null },
      },
      linkSent: new Set(['cust-delmas']),
    });

    expect(result.stageCounts.live).toBe(1);
    expect(result.stageByCustomerId['cust-delmas']).toBe('live');
    expect(result.stageBySiteId['site-delmas']).toBe('live');
  });

  it('counts an invite-only customer (no site) as introduced', () => {
    const result = countOnboardingStages({
      sites: [],
      customers: [{ id: 'cust-lens', corporate_site_id: null }],
      bestSubmission: {},
      linkSent: new Set(['cust-lens']),
    });

    expect(result.stageCounts).toEqual({
      ...emptyStageCounts(),
      introduced: 1,
    });
    expect(result.stageByCustomerId['cust-lens']).toBe('introduced');
  });

  it('counts a rejected submission as changes_requested', () => {
    const result = countOnboardingStages({
      sites: [],
      customers: [{ id: 'cust-berea', corporate_site_id: null }],
      bestSubmission: {
        'cust-berea': { status: 'submitted', rejection_reason: 'wrong address' },
      },
      linkSent: new Set(['cust-berea']),
    });

    expect(result.stageCounts.changes_requested).toBe(1);
    expect(result.stageByCustomerId['cust-berea']).toBe('changes_requested');
  });

  it('does not count a coverage-check-only clinic with no invite or submission', () => {
    const result = countOnboardingStages({
      sites: [],
      customers: [{ id: 'cust-check', corporate_site_id: null }],
      bestSubmission: {},
      linkSent: new Set(),
    });

    expect(result.stageCounts).toEqual(emptyStageCounts());
    expect(result.stageByCustomerId).toEqual({});
  });

  it('still counts a site that has no customer row', () => {
    const result = countOnboardingStages({
      sites: [{ id: 'site-orphan', status: 'pending', installed_at: null }],
      customers: [],
      bestSubmission: {},
      linkSent: new Set(),
    });

    expect(result.stageCounts.nominated).toBe(1);
    expect(result.stageBySiteId['site-orphan']).toBe('nominated');
    expect(result.stageByCustomerId).toEqual({});
  });
});

describe('scopeOnboardingCustomers', () => {
  it('keeps site-linked and coverage-matched clinics and drops training', () => {
    const scoped = scopeOnboardingCustomers(
      [
        { id: 'linked', business_name: 'Delmas', corporate_site_id: 'site-1' },
        {
          id: 'checked',
          business_name: 'Unjani Clinic - Lens',
          corporate_site_id: null,
        },
        {
          id: 'training',
          business_name: 'Unjani Training Clinic',
          corporate_site_id: 'site-1',
        },
        { id: 'other', business_name: 'Acme', corporate_site_id: null },
      ],
      ['site-1'],
      [clinicKey('Unjani Clinic - Lens')]
    );

    expect(scoped.map((row) => row.id)).toEqual(['linked', 'checked']);
  });
});
