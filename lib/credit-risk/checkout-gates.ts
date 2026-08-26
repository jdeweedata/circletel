import type { CreditDecision } from './types';

export function checkoutCreditGates(
  decision?: CreditDecision | null,
  hardwarePrepaid = false
): {
  showFreeRouter: boolean;
  show24Month: boolean;
  showPrepaidByo: boolean;
} {
  if (!decision || decision === 'UNCHECKED') {
    return { showFreeRouter: true, show24Month: true, showPrepaidByo: false };
  }
  if (hardwarePrepaid) {
    return { showFreeRouter: true, show24Month: decision !== 'HARD_FAIL', showPrepaidByo: true };
  }
  if (decision === 'HARD_FAIL' || decision === 'FAIL') {
    return { showFreeRouter: false, show24Month: false, showPrepaidByo: true };
  }
  return {
    showFreeRouter: decision === 'PASS',
    show24Month: true,
    showPrepaidByo: decision === 'MARGINAL',
  };
}
