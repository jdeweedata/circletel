export type CoverageExplorerMode = 'portal' | 'admin';

export function coverageExplorerConfig(mode: CoverageExplorerMode) {
  if (mode === 'admin') {
    return {
      apiBase: '/api/admin/unjani/coverage',
      onboardPath: '/api/admin/unjani/install-orders',
      ctaLabel: 'Process install order',
      formTitle: 'Process install order',
      formHelp:
        'Places a CircleTel install order after Unjani NPC confirms the nomination and coverage. If the Unjani Connect kit is in the warehouse it is reserved; otherwise a stock order is raised (due in 5 business days). Fulfilment is 14–21 business days from the order date.',
      submitLabel: 'Place install order',
    };
  }

  return {
    apiBase: '/api/portal/coverage',
    onboardPath: '/api/portal/coverage/onboard',
    ctaLabel: 'Nominate',
    formTitle: 'Nominate clinic',
    formHelp:
      'Sends an onboarding request to CircleTel with coverage findings. No banking details required. You can edit any field before submitting.',
    submitLabel: 'Submit onboarding request',
  };
}
