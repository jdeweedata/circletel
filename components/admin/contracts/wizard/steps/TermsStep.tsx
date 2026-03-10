'use client'

import { PiPencilBold, PiLockBold } from 'react-icons/pi'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWizardContext } from '../ContractWizardProvider'
import { formatCurrency } from '@/lib/utils/format'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TERM_OPTIONS: { value: 12 | 24 | 36; label: string; badge?: string }[] = [
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months', badge: 'Most popular' },
  { value: 36, label: '36 months', badge: 'Best value' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermsStep() {
  const { state, updateTerms, updateSLA, updatePricing, nextStep } = useWizardContext()

  const { terms, sla, pricing } = state

  // Today's date in YYYY-MM-DD format for the date picker minimum
  const todayStr = new Date().toISOString().split('T')[0]

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const totalContractValue = pricing.monthlyFee * terms.term + pricing.installationFee

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleTermSelect(term: 12 | 24 | 36) {
    updateTerms({ term })
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateTerms({ commencementDate: e.target.value })
  }

  function handleEditModeToggle(checked: boolean) {
    updateTerms({ editMode: checked })
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Contract Terms</h2>
        <p className="mt-2 text-sm text-gray-500">
          Set the contract duration, start date, and service level details.
        </p>
      </div>

      {/* Term selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Contract Term</h3>
        <div className="grid grid-cols-3 gap-3">
          {TERM_OPTIONS.map((option) => {
            const isSelected = terms.term === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTermSelect(option.value)}
                className={[
                  'relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-150',
                  isSelected
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm',
                ].join(' ')}
              >
                {option.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                    {option.badge}
                  </span>
                )}
                <span
                  className={[
                    'text-lg font-bold',
                    isSelected ? 'text-orange-600' : 'text-gray-900',
                  ].join(' ')}
                >
                  {option.value}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">months</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Commencement date */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Commencement Date</h3>
        <Input
          type="date"
          value={terms.commencementDate}
          min={todayStr}
          onChange={handleDateChange}
          className="max-w-xs"
        />
        <p className="mt-1.5 text-xs text-gray-400">
          The date from which the contract period begins.
        </p>
      </div>

      {/* Edit terms toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {terms.editMode ? (
              <PiPencilBold className="h-4 w-4 text-orange-500" />
            ) : (
              <PiLockBold className="h-4 w-4 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-700">Edit Terms</p>
              <p className="text-xs text-gray-400">
                {terms.editMode
                  ? 'Editing SLA and pricing fields'
                  : 'Toggle to override SLA and pricing defaults'}
              </p>
            </div>
          </div>
          <Switch checked={terms.editMode} onCheckedChange={handleEditModeToggle} />
        </div>
      </div>

      {/* Edit fields — only visible when editMode is ON */}
      {terms.editMode && (
        <>
          {/* SLA overrides */}
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50/30 p-5">
            <h3 className="text-sm font-semibold text-orange-700 mb-4">SLA Fields</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Uptime Guarantee (%)
                </label>
                <Input
                  type="text"
                  value={sla.uptimeGuarantee}
                  onChange={(e) => updateSLA({ uptimeGuarantee: e.target.value })}
                  placeholder="99.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fault Response
                </label>
                <Input
                  type="text"
                  value={sla.faultResponse}
                  onChange={(e) => updateSLA({ faultResponse: e.target.value })}
                  placeholder="4 hours"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fault Resolution
                </label>
                <Input
                  type="text"
                  value={sla.faultResolution}
                  onChange={(e) => updateSLA({ faultResolution: e.target.value })}
                  placeholder="3 business days"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Credit Cap (%)
                </label>
                <Input
                  type="text"
                  value={sla.creditCap}
                  onChange={(e) => updateSLA({ creditCap: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Pricing overrides */}
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50/30 p-5">
            <h3 className="text-sm font-semibold text-orange-700 mb-4">Pricing Fields</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Monthly Fee (R)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={pricing.monthlyFee || ''}
                  onChange={(e) =>
                    updatePricing({ monthlyFee: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Installation Fee (R)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={pricing.installationFee || ''}
                  onChange={(e) =>
                    updatePricing({ installationFee: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Summary */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
        <dl className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Contract term</dt>
            <dd className="font-medium text-gray-900">{terms.term} months</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Notice period</dt>
            <dd className="font-medium text-gray-900">{terms.noticePeriod} days</dd>
          </div>
          <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm">
            <dt className="text-gray-500">Monthly fee</dt>
            <dd className="font-medium text-gray-900">{formatCurrency(pricing.monthlyFee)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Installation fee</dt>
            <dd className="font-medium text-gray-900">
              {formatCurrency(pricing.installationFee)}
            </dd>
          </div>
          <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm font-semibold">
            <dt className="text-gray-700">Total contract value</dt>
            <dd className="text-orange-600">{formatCurrency(totalContractValue)}</dd>
          </div>
        </dl>
      </div>

      {/* Continue */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={nextStep}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
