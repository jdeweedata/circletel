import {
  activationSteps,
  activateTicketPatch,
  buildActivationQueue,
  buildNominationQueue,
  deskStatusForPortalUpdate,
  parseNominationDescription,
  portalStageForClinic,
  registerTicketPatch,
} from '@/lib/admin/unjani-portal-ops';
import { stageDefinition } from '@/lib/portal/onboarding-stage';

describe('Unjani admin portal-ops feed', () => {
  const openNomination = {
    id: 't-nom',
    subject: 'Onboard clinic: Elim',
    description:
      'Clinic: Elim\nService address: 1 Main Rd\nOn-site contact: Nurse Dlamini\nMobile: 0821111111\nEmail: elim@unjani.org',
    status: 'open',
    ticket_type: 'activation_request',
    site_id: null,
    zoho_ticket_number: '1042',
    created_at: '2026-08-16T08:00:00.000Z',
  };

  const openActivation = {
    id: 't-act',
    subject: 'Activate Site: Unjani Clinic - Delmas',
    description: null,
    status: 'open',
    ticket_type: 'activation_request',
    site_id: 'site-delmas',
    zoho_ticket_number: '1043',
    created_at: '2026-08-16T09:00:00.000Z',
  };

  it('puts site-less activation tickets in Nominations and site-linked ones in Activations', () => {
    const nominations = buildNominationQueue({
      tickets: [
        openNomination,
        openActivation,
        { ...openNomination, id: 'closed', status: 'resolved' },
        { ...openNomination, id: 'support', ticket_type: 'support' },
      ],
      coverageChecks: [],
      existingClinicNames: [],
    });
    const activations = buildActivationQueue({
      tickets: [openNomination, openActivation, { ...openActivation, id: 'done', status: 'closed' }],
      sites: [{ id: 'site-delmas', site_name: 'Unjani Clinic - Delmas', status: 'pending' }],
    });

    expect(nominations.map((row) => row.clinicName)).toEqual(['Elim']);
    expect(nominations[0]?.ticket?.zoho_ticket_number).toBe('1042');
    expect(activations).toHaveLength(1);
    expect(activations[0]?.siteName).toBe('Unjani Clinic - Delmas');
    expect(activations[0]?.ticket.zoho_ticket_number).toBe('1043');
  });

  it('adds unmatched coverage checks and hides checks that already have a clinic or ticket', () => {
    const rows = buildNominationQueue({
      now: new Date('2026-08-16T12:00:00.000Z'),
      tickets: [openNomination],
      coverageChecks: [
        {
          id: 'chk-elim',
          clinic_name: 'Unjani Clinic - Elim',
          address: '1 Main Rd',
          created_at: '2026-08-15T00:00:00.000Z',
          results: { summary: { tarana: 'Available', '5g_lte': 'Available' } },
        },
        {
          id: 'chk-new',
          clinic_name: 'Unjani Clinic - Lens',
          address: 'Lens',
          created_at: '2026-08-15T00:00:00.000Z',
          results: { summary: { tarana: 'Available', '5g_lte': 'Not available' } },
        },
        {
          id: 'chk-live',
          clinic_name: 'Delmas',
          address: 'Delmas',
          created_at: '2026-08-15T00:00:00.000Z',
          results: null,
        },
      ],
      existingClinicNames: ['Unjani Clinic - Delmas'],
    });

    expect(rows.map((row) => row.clinicName).sort()).toEqual(['Elim', 'Lens']);
    expect(rows.find((row) => row.clinicName === 'Lens')?.source).toBe('coverage_check');
    expect(rows.find((row) => row.clinicName === 'Elim')?.source).toBe('ticket');
    expect(rows.find((row) => row.clinicName === 'Elim')?.coverageSummary?.tarana).toBe(
      'Available'
    );
  });

  it('ignores historical coverage backfill older than three days', () => {
    const rows = buildNominationQueue({
      now: new Date('2026-08-16T12:00:00.000Z'),
      tickets: [],
      coverageChecks: [
        {
          id: 'chk-old',
          clinic_name: 'Unjani Clinic - Lens',
          address: 'Lens',
          created_at: '2026-08-11T00:00:00.000Z',
          results: null,
        },
      ],
      existingClinicNames: [],
    });
    expect(rows).toEqual([]);
  });

  it('parses nomination contact details from the portal ticket body', () => {
    expect(parseNominationDescription(openNomination.description)).toEqual({
      clinicName: 'Elim',
      address: '1 Main Rd',
      contactName: 'Nurse Dlamini',
      mobile: '0821111111',
      email: 'elim@unjani.org',
    });
    expect(
      parseNominationDescription(
        [
          'ONBOARDING REQUEST (nomination → go-live step 1–3)',
          'Clinic: Berea',
          'Service address: The Alec Building, 41 Catherine Avenue, Berea',
          'On-site contact: Gertrude Nare',
          'Mobile: 010 023 1243',
          'Email: berea@unjani.org',
        ].join('\n')
      )
    ).toEqual({
      clinicName: 'Berea',
      address: 'The Alec Building, 41 Catherine Avenue, Berea',
      contactName: 'Gertrude Nare',
      mobile: '010 023 1243',
      email: 'berea@unjani.org',
    });
  });

  it('uses the portal six-stage engine for setup badges', () => {
    expect(portalStageForClinic({ billingStage: 'pending' })).toBe('nominated');
    expect(portalStageForClinic({ billingStage: 'invited', onboardingLinkSent: true })).toBe(
      'introduced'
    );
    expect(
      portalStageForClinic({
        billingStage: 'submitted',
        submissionStatus: 'submitted',
        onboardingLinkSent: true,
      })
    ).toBe('details_confirmed');
    expect(
      portalStageForClinic({
        billingStage: 'billing_ready',
        submissionStatus: 'approved',
        siteStatus: 'pending',
        onboardingLinkSent: true,
      })
    ).toBe('installing');
    expect(
      portalStageForClinic({
        billingStage: 'service_active',
        submissionStatus: 'approved',
        siteStatus: 'active',
        installedAt: '2026-08-01T00:00:00.000Z',
      })
    ).toBe('live');
    expect(stageDefinition(portalStageForClinic({ billingStage: 'pending' })).label).toBe(
      'Clinic nominated'
    );
  });

  it('marks a nomination in progress after register and resolves an activation after go-live', () => {
    expect(registerTicketPatch()).toEqual({ status: 'in_progress' });
    expect(registerTicketPatch('site-1')).toEqual({
      status: 'in_progress',
      site_id: 'site-1',
    });
    expect(activateTicketPatch(new Date('2026-08-16T10:00:00.000Z'))).toEqual({
      status: 'resolved',
      resolved_at: '2026-08-16T10:00:00.000Z',
    });
    expect(deskStatusForPortalUpdate('in_progress')).toBe('On Hold');
    expect(deskStatusForPortalUpdate('resolved')).toBe('Closed');
  });

  it('walks pending sites through provisioned then active', () => {
    expect(activationSteps('pending')).toEqual(['provisioned', 'active']);
    expect(activationSteps('provisioned')).toEqual(['active']);
    expect(activationSteps('active')).toEqual([]);
  });
});
