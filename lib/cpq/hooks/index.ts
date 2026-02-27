/**
 * CPQ Hooks
 *
 * Custom hooks for CPQ wizard state management
 */

export { useCPQSession } from './useCPQSession';
export { useAutoSave, useStepAutoSave } from './useAutoSave';
export { useCPQNavigation, CPQ_STEPS } from './useCPQNavigation';

export type { CPQStepKey, CPQStepId, StepValidationResult, StepValidator } from './useCPQNavigation';
