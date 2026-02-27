'use client';

/**
 * useCPQNavigation Hook
 *
 * Manages wizard step navigation with validation
 */

import { useState, useCallback, useMemo } from 'react';
import type { CPQStepData, CPQSession } from '../types';

// Step definitions
export const CPQ_STEPS = [
  { id: 1, key: 'needs_assessment', label: 'Needs', subLabel: 'Assessment' },
  { id: 2, key: 'location_coverage', label: 'Location', subLabel: '& Coverage' },
  { id: 3, key: 'package_selection', label: 'Package', subLabel: 'Selection' },
  { id: 4, key: 'configuration', label: 'Configure', subLabel: 'Options' },
  { id: 5, key: 'pricing_discounts', label: 'Pricing', subLabel: '& Discounts' },
  { id: 6, key: 'customer_details', label: 'Customer', subLabel: 'Details' },
  { id: 7, key: 'review_summary', label: 'Review', subLabel: '& Submit' },
] as const;

export type CPQStepKey = (typeof CPQ_STEPS)[number]['key'];
export type CPQStepId = (typeof CPQ_STEPS)[number]['id'];

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type StepValidator = (stepData: CPQStepData) => StepValidationResult;

// Default validators for each step
const defaultValidators: Record<CPQStepKey, StepValidator> = {
  needs_assessment: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data = stepData.needs_assessment;

    // Basic validation - must have some requirements specified
    if (!data?.bandwidth_mbps && !data?.raw_input && !data?.num_sites) {
      errors.push('Please specify your requirements or use AI to parse them');
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  location_coverage: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data = stepData.location_coverage;

    if (!data?.sites || data.sites.length === 0) {
      errors.push('At least one location is required');
    } else {
      // Check all sites have addresses
      const sitesWithoutAddress = data.sites.filter((s) => !s.address);
      if (sitesWithoutAddress.length > 0) {
        errors.push(`${sitesWithoutAddress.length} site(s) missing address`);
      }

      // Warn about unchecked coverage
      const uncheckedSites = data.sites.filter((s) => !s.coverage_checked);
      if (uncheckedSites.length > 0) {
        warnings.push(`${uncheckedSites.length} site(s) have not had coverage checked`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  package_selection: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data = stepData.package_selection;

    if (!data?.selected_packages || data.selected_packages.length === 0) {
      errors.push('At least one package must be selected');
    }

    // Check all sites have packages
    const locationData = stepData.location_coverage;
    if (locationData?.sites && data?.selected_packages) {
      const coveredSites = new Set(data.selected_packages.map((p) => p.site_index));
      const uncoveredSites = locationData.sites.filter((s) => !coveredSites.has(s.index));
      if (uncoveredSites.length > 0) {
        warnings.push(`${uncoveredSites.length} site(s) have no package selected`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  configuration: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data = stepData.configuration;

    // Configuration is optional, so always valid unless there are explicit issues
    if (data?.per_site_config) {
      for (const config of data.per_site_config) {
        // Check if add_ons have valid quantities
        if (config.add_ons) {
          for (const addOn of config.add_ons) {
            if (addOn.quantity !== undefined && addOn.quantity < 1) {
              errors.push(`Invalid add-on quantity for site ${config.site_index + 1}`);
            }
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  pricing_discounts: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data = stepData.pricing_discounts;

    if (!data || data.total === undefined) {
      errors.push('Pricing has not been calculated');
    }

    // Warning for pending approval
    if (data?.approval_requested && data.approval_status === 'pending') {
      warnings.push('Discount approval is pending');
    }

    // Warning for rejected approval
    if (data?.approval_status === 'rejected') {
      errors.push('Discount was rejected - please adjust');
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  customer_details: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data = stepData.customer_details;

    if (!data?.company_name) {
      errors.push('Company name is required');
    }

    if (!data?.primary_contact?.name) {
      errors.push('Primary contact name is required');
    }

    if (!data?.primary_contact?.email) {
      errors.push('Primary contact email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.primary_contact.email)) {
      errors.push('Invalid email format');
    }

    if (!data?.primary_contact?.phone) {
      warnings.push('Contact phone number is recommended');
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  review_summary: (stepData) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Review step validates all previous steps
    for (const step of CPQ_STEPS) {
      if (step.key === 'review_summary') continue;

      const validator = defaultValidators[step.key];
      const result = validator(stepData);
      if (!result.isValid) {
        errors.push(`${step.label}: ${result.errors.join(', ')}`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },
};

interface UseCPQNavigationOptions {
  session: CPQSession | null;
  stepData: CPQStepData;
  onStepChange?: (newStep: number, oldStep: number) => void;
  onValidationError?: (step: number, errors: string[]) => void;
  customValidators?: Partial<Record<CPQStepKey, StepValidator>>;
}

interface UseCPQNavigationReturn {
  currentStep: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (step: number, skipValidation?: boolean) => StepValidationResult;
  goNext: () => StepValidationResult;
  goPrev: () => void;
  validateStep: (step: number) => StepValidationResult;
  validateAllSteps: () => Map<number, StepValidationResult>;
  getStepStatus: (step: number) => 'completed' | 'active' | 'pending';
  completedSteps: Set<number>;
}

export function useCPQNavigation(options: UseCPQNavigationOptions): UseCPQNavigationReturn {
  const { session, stepData, onStepChange, onValidationError, customValidators } = options;

  // Initialize current step from session or default to 1
  const [currentStep, setCurrentStep] = useState<number>(session?.current_step || 1);

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    // Initialize based on session's current step (all previous are complete)
    const initialStep = session?.current_step || 1;
    const completed = new Set<number>();
    for (let i = 1; i < initialStep; i++) {
      completed.add(i);
    }
    return completed;
  });

  // Merge custom validators with defaults
  const validators = useMemo(
    () => ({
      ...defaultValidators,
      ...customValidators,
    }),
    [customValidators]
  );

  // Validate a specific step
  const validateStep = useCallback(
    (step: number): StepValidationResult => {
      const stepDef = CPQ_STEPS.find((s) => s.id === step);
      if (!stepDef) {
        return { isValid: false, errors: ['Invalid step'], warnings: [] };
      }

      const validator = validators[stepDef.key];
      return validator(stepData);
    },
    [stepData, validators]
  );

  // Validate all steps
  const validateAllSteps = useCallback((): Map<number, StepValidationResult> => {
    const results = new Map<number, StepValidationResult>();
    for (const step of CPQ_STEPS) {
      results.set(step.id, validateStep(step.id));
    }
    return results;
  }, [validateStep]);

  // Go to a specific step
  const goToStep = useCallback(
    (step: number, skipValidation = false): StepValidationResult => {
      // Bounds check
      if (step < 1 || step > CPQ_STEPS.length) {
        return { isValid: false, errors: ['Invalid step number'], warnings: [] };
      }

      // Going backward always allowed
      if (step < currentStep) {
        const oldStep = currentStep;
        setCurrentStep(step);
        onStepChange?.(step, oldStep);
        return { isValid: true, errors: [], warnings: [] };
      }

      // Going forward requires validation (unless skipped)
      if (!skipValidation && step > currentStep) {
        // Validate all steps from current to target-1
        for (let i = currentStep; i < step; i++) {
          const result = validateStep(i);
          if (!result.isValid) {
            onValidationError?.(i, result.errors);
            return result;
          }
          // Mark step as completed
          setCompletedSteps((prev) => new Set([...Array.from(prev), i]));
        }
      }

      const oldStep = currentStep;
      setCurrentStep(step);
      onStepChange?.(step, oldStep);

      return { isValid: true, errors: [], warnings: [] };
    },
    [currentStep, validateStep, onStepChange, onValidationError]
  );

  // Go to next step
  const goNext = useCallback((): StepValidationResult => {
    if (currentStep >= CPQ_STEPS.length) {
      return { isValid: false, errors: ['Already at last step'], warnings: [] };
    }

    // Validate current step first
    const result = validateStep(currentStep);
    if (!result.isValid) {
      onValidationError?.(currentStep, result.errors);
      return result;
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...Array.from(prev), currentStep]));

    const oldStep = currentStep;
    setCurrentStep(currentStep + 1);
    onStepChange?.(currentStep + 1, oldStep);

    return { isValid: true, errors: [], warnings: result.warnings };
  }, [currentStep, validateStep, onStepChange, onValidationError]);

  // Go to previous step
  const goPrev = useCallback(() => {
    if (currentStep <= 1) return;

    const oldStep = currentStep;
    setCurrentStep(currentStep - 1);
    onStepChange?.(currentStep - 1, oldStep);
  }, [currentStep, onStepChange]);

  // Get step status for stepper UI
  const getStepStatus = useCallback(
    (step: number): 'completed' | 'active' | 'pending' => {
      if (completedSteps.has(step)) return 'completed';
      if (step === currentStep) return 'active';
      return 'pending';
    },
    [currentStep, completedSteps]
  );

  // Computed properties
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === CPQ_STEPS.length;
  const canGoNext = !isLastStep;
  const canGoPrev = !isFirstStep;

  return {
    currentStep,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    goToStep,
    goNext,
    goPrev,
    validateStep,
    validateAllSteps,
    getStepStatus,
    completedSteps,
  };
}
