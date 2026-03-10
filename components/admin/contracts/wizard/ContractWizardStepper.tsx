'use client'

import { IconType } from 'react-icons'
import {
  PiListBold,
  PiMagnifyingGlassBold,
  PiPackageBold,
  PiUsersBold,
  PiFileTextBold,
  PiCheckCircleBold,
  PiNoteBold,
} from 'react-icons/pi'
import { WorkflowStepper, WorkflowStep } from '@/components/admin/orders/WorkflowStepper'
import { useWizardContext } from './ContractWizardProvider'

// ---------------------------------------------------------------------------
// Step config types
// ---------------------------------------------------------------------------

interface StepConfig {
  id: number
  label: string
  subLabel: string
  icon: IconType
}

// ---------------------------------------------------------------------------
// Step config arrays
// ---------------------------------------------------------------------------

const SCRATCH_STEPS: StepConfig[] = [
  { id: 1, label: 'Entry',    subLabel: 'Choose method',     icon: PiListBold },
  { id: 2, label: 'Coverage', subLabel: 'Check address',     icon: PiMagnifyingGlassBold },
  { id: 3, label: 'Product',  subLabel: 'Select package',    icon: PiPackageBold },
  { id: 4, label: 'Customer', subLabel: 'Business details',  icon: PiUsersBold },
  { id: 5, label: 'Terms',    subLabel: 'Contract terms',    icon: PiFileTextBold },
  { id: 6, label: 'Review',   subLabel: 'Generate contract', icon: PiCheckCircleBold },
]

const QUOTE_STEPS: StepConfig[] = [
  { id: 1, label: 'Entry',    subLabel: 'Choose method',     icon: PiListBold },
  { id: 2, label: 'Quote',    subLabel: 'Select quote',      icon: PiNoteBold },
  { id: 3, label: 'Customer', subLabel: 'Business details',  icon: PiUsersBold },
  { id: 4, label: 'Terms',    subLabel: 'Contract terms',    icon: PiFileTextBold },
  { id: 5, label: 'Review',   subLabel: 'Generate contract', icon: PiCheckCircleBold },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContractWizardStepper() {
  const { state, currentStep, goToStep } = useWizardContext()

  const stepConfig = state.flow === 'quote' ? QUOTE_STEPS : SCRATCH_STEPS

  const steps: WorkflowStep[] = stepConfig.map((step) => ({
    id: step.id,
    label: step.label,
    subLabel: step.subLabel,
    icon: step.icon,
    status:
      step.id < currentStep
        ? 'completed'
        : step.id === currentStep
        ? 'active'
        : 'pending',
  }))

  function handleStepClick(stepId: number) {
    // Only allow navigating back, not forward
    if (stepId < currentStep) {
      goToStep(stepId)
    }
  }

  return (
    <WorkflowStepper
      steps={steps}
      currentStatus={String(currentStep)}
      onStepClick={handleStepClick}
    />
  )
}
