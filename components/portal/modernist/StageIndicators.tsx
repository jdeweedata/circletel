'use client';

import {
  ONBOARDING_STAGES,
  stageDefinition,
  type StageKey,
} from '@/lib/portal/onboarding-stage';

/** Colour per stage. Green reads as done, blue in flight, amber needs the clinic, red blocked. */
const STAGE_COLOURS: Record<StageKey, { fg: string; bg: string }> = {
  nominated: { fg: '#4A5568', bg: '#EDEFF2' },
  introduced: { fg: '#2563C9', bg: '#E7EFFB' },
  details_confirmed: { fg: '#C2700C', bg: '#FBEEDA' },
  changes_requested: { fg: '#D14343', bg: '#FBE3E3' },
  visit_booked: { fg: '#2563C9', bg: '#E7EFFB' },
  installing: { fg: '#2F9E5E', bg: '#E3F3E9' },
  live: { fg: '#2F9E5E', bg: '#E3F3E9' },
};

export function StageBadge({
  stage,
  size = 'md',
}: {
  stage: StageKey;
  size?: 'sm' | 'md';
}) {
  const definition = stageDefinition(stage);
  const colour = STAGE_COLOURS[stage];

  return (
    <span
      className={
        size === 'sm'
          ? 'inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide whitespace-nowrap'
          : 'inline-block px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide whitespace-nowrap'
      }
      style={{ color: colour.fg, background: colour.bg }}
    >
      {definition.label}
    </span>
  );
}

/** Horizontal count-per-stage breakdown of the whole pipeline. */
export function StageBreakdown({
  counts,
  total,
}: {
  counts: Record<StageKey, number>;
  total: number;
}) {
  const denominator = total || 1;

  return (
    <div style={{ border: '2px solid var(--pm-divider)' }} className="mt-6 bg-white">
      {ONBOARDING_STAGES.filter((s) => !s.branch || counts[s.key] > 0).map(
        (definition, i) => {
          const count = counts[definition.key] ?? 0;
          const colour = STAGE_COLOURS[definition.key];
          const percent = Math.round((count / denominator) * 100);

          return (
            <div
              key={definition.key}
              className="flex items-center gap-4 px-4 py-3"
              style={{
                borderTop: i > 0 ? '1px solid var(--pm-divider)' : undefined,
              }}
            >
              <span
                className="w-6 text-[11px] font-extrabold tabular-nums"
                style={{ color: 'var(--pm-navy)' }}
              >
                {definition.step ?? '↺'}
              </span>
              <span
                className="flex-1 text-sm font-extrabold"
                style={{ color: 'var(--pm-navy)' }}
              >
                {definition.label}
              </span>
              <div
                className="hidden sm:block h-2 w-40"
                style={{ background: 'var(--pm-ground)' }}
                role="presentation"
              >
                <div
                  className="h-full"
                  style={{ width: `${percent}%`, background: colour.fg }}
                />
              </div>
              <span
                className="w-8 text-right text-sm font-extrabold tabular-nums"
                style={{ color: 'var(--pm-navy)' }}
              >
                {count}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

/** Per-site progress through the six steps, with the guide's own wording. */
export function OnboardingProgress({ stage }: { stage: StageKey }) {
  const steps = ONBOARDING_STAGES.filter((s) => !s.branch);
  const current = stageDefinition(stage);
  // The exception branch sits at step 3 — the details need correcting.
  const currentStep = current.step ?? 3;

  return (
    <ol className="mt-6" style={{ border: '2px solid var(--pm-divider)' }}>
      {steps.map((step, i) => {
        const stepNumber = step.step ?? 0;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        const colour = STAGE_COLOURS[active ? stage : step.key];

        return (
          <li
            key={step.key}
            className="flex gap-4 px-4 py-4"
            style={{
              borderTop: i > 0 ? '1px solid var(--pm-divider)' : undefined,
              background: active ? colour.bg : '#FFFFFF',
            }}
            aria-current={active ? 'step' : undefined}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center text-xs font-extrabold"
              style={{
                background: done || active ? colour.fg : 'var(--pm-ground)',
                color: done || active ? '#FFFFFF' : 'var(--pm-navy)',
              }}
              aria-hidden="true"
            >
              {done ? '✓' : stepNumber}
            </span>
            <div>
              <p
                className="text-sm font-extrabold"
                style={{ color: 'var(--pm-navy)' }}
              >
                {active && stage === 'changes_requested'
                  ? current.label
                  : step.label}
                {done && <span className="sr-only"> — completed</span>}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--pm-body)' }}>
                {active && stage === 'changes_requested'
                  ? current.description
                  : step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
