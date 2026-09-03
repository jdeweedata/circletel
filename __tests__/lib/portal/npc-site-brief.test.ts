import { npcNextStep, npcNowSentence } from '@/lib/portal/npc-site-brief';
import { ONBOARDING_STAGES, type StageKey } from '@/lib/portal/onboarding-stage';

describe('npc-site-brief', () => {
  const expected: Record<StageKey, string> = {
    nominated: 'CircleTel is checking coverage at the clinic address.',
    introduced: 'Waiting for the clinic to complete setup.',
    details_confirmed:
      'CircleTel is assigning kit and a technician. The scheduler will confirm a visit slot with the clinic contact.',
    changes_requested: 'The clinic needs to correct the details CircleTel asked for.',
    visit_booked: 'Installation visit booked. Tell the on-site contact to expect CircleTel.',
    installing:
      'CircleTel is surveying and installing. Confirm the visit date with CircleTel if you have not been given one.',
    live: 'Service is live. First month from go-live is free.',
  };

  it.each(ONBOARDING_STAGES.map((stage) => [stage.key, expected[stage.key]]))(
    'gives NPC a next step for %s',
    (stage, step) => {
      expect(npcNextStep(stage as StageKey)).toBe(step);
    }
  );

  it('shows the confirmed visit date on visit_booked', () => {
    expect(npcNowSentence('visit_booked', { visitDate: '2026-09-10' })).toBe(
      'Installation visit booked for 2026-09-10.'
    );
  });

  it('does not invent a visit date when none exists', () => {
    expect(npcNowSentence('details_confirmed', { visitDate: null })).toBe(
      'Visit date not booked yet.'
    );
  });
});
