import { npcGuideSentence, npcNextStep, npcNowSentence } from '@/lib/portal/npc-site-brief';
import type { StageKey } from '@/lib/portal/onboarding-stage';

export function ClinicNowCard({
  stage,
  visitDate,
}: {
  stage: StageKey;
  visitDate?: string | null;
}) {
  return (
    <section
      aria-labelledby="clinic-now-heading"
      className="rounded-xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/[0.06]"
    >
      <p
        className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
        style={{ color: 'var(--pm-navy)' }}
      >
        Now
      </p>
      <h2
        id="clinic-now-heading"
        className="mt-1 text-lg font-extrabold"
        style={{ color: 'var(--pm-navy)' }}
      >
        {npcNowSentence(stage, { visitDate })}
      </h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--pm-body)' }}>
        {npcGuideSentence(stage)}
      </p>
      <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--pm-navy)' }}>
        {npcNextStep(stage)}
      </p>
    </section>
  );
}
