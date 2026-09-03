'use client';

import { useState } from 'react';
import {
  ONBOARDING_STAGES,
  stageDefinition,
  type StageKey,
} from '@/lib/portal/onboarding-stage';
import { OnboardingProgress } from '@/components/portal/modernist/StageIndicators';

export function OnboardingStepper({ stage }: { stage: StageKey }) {
  const steps = ONBOARDING_STAGES.filter((item) => !item.branch);
  const current = stageDefinition(stage);
  const currentStep = current.step ?? 3;
  const [showGuide, setShowGuide] = useState(false);

  return (
    <section aria-labelledby="onboarding-stepper-heading">
      <h2
        id="onboarding-stepper-heading"
        className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
        style={{ color: 'var(--pm-navy)' }}
      >
        Onboarding progress
      </h2>
      <ol className="mt-3 flex flex-wrap gap-2">
        {steps.map((step) => {
          const stepNumber = step.step ?? 0;
          const done = stepNumber < currentStep;
          const active = stepNumber === currentStep;
          return (
            <li
              key={step.key}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold"
              style={{
                background: active ? '#FBEEDA' : done ? '#E3F3E9' : '#EDEFF2',
                color: active ? '#C2700C' : done ? '#2F9E5E' : '#4A5568',
              }}
              aria-current={active ? 'step' : undefined}
            >
              <span aria-hidden="true">{done ? '✓' : stepNumber}</span>
              <span className={active ? '' : 'hidden sm:inline'}>{step.label}</span>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="mt-3 text-xs font-semibold underline underline-offset-2"
        style={{ color: 'var(--pm-navy)' }}
        onClick={() => setShowGuide((open) => !open)}
      >
        {showGuide ? 'Hide full guide' : 'Show full guide'}
      </button>
      {showGuide && <OnboardingProgress stage={stage} />}
    </section>
  );
}
