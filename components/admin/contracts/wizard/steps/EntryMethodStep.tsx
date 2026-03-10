'use client'

import { PiPlusBold, PiNoteBold, PiArrowRightBold } from 'react-icons/pi'
import { useWizardContext } from '../ContractWizardProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlowOption {
  id: 'scratch' | 'from_quote'
  flow: 'scratch' | 'quote'
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FLOW_OPTIONS: FlowOption[] = [
  {
    id: 'scratch',
    flow: 'scratch',
    icon: PiPlusBold,
    title: 'Start Fresh',
    description:
      'Check coverage, select a package, and fill in customer details to create a new contract from scratch.',
  },
  {
    id: 'from_quote',
    flow: 'quote',
    icon: PiNoteBold,
    title: 'Convert Quote',
    description:
      'Select an existing business quote to convert into a contract with pre-filled customer and package details.',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntryMethodStep() {
  const { state, updateState, nextStep } = useWizardContext()

  function handleSelect(option: FlowOption) {
    updateState('flow', option.flow)
    nextStep()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create New Contract</h2>
        <p className="mt-2 text-gray-500 text-sm">
          Choose how you would like to create this contract.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {FLOW_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = state.flow === option.flow

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={[
                'w-full flex items-center gap-4 p-6 rounded-xl border-2 text-left',
                'transition-colors duration-150',
                isSelected
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-500 bg-white',
              ].join(' ')}
            >
              {/* Left icon */}
              <div className="shrink-0 p-3 rounded-lg bg-orange-100 text-orange-600">
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{option.title}</p>
                <p className="mt-0.5 text-sm text-gray-500 leading-snug">
                  {option.description}
                </p>
              </div>

              {/* Right arrow */}
              <PiArrowRightBold
                className={[
                  'shrink-0 w-5 h-5 transition-colors duration-150',
                  isSelected ? 'text-orange-500' : 'text-gray-400',
                ].join(' ')}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
