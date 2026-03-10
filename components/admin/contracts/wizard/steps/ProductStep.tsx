'use client'

import { PiCheckCircleBold, PiWifiHighBold } from 'react-icons/pi'
import { useWizardContext } from '../ContractWizardProvider'
import { SelectedPackage } from '../hooks/useContractWizard'
import { formatCurrency } from '@/lib/utils/format'

// ---------------------------------------------------------------------------
// Type for raw package from coverage state
// ---------------------------------------------------------------------------

interface RawPackage {
  id: string
  name: string
  speedDown: number
  speedUp: number
  monthlyFee: number
  installationFee: number
  dataPolicy?: string
  staticIp?: boolean
  router?: string
  technology?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductStep() {
  const { state, updateState, updatePricing, nextStep } = useWizardContext()

  const packages: RawPackage[] = state.coverage?.packages ?? []
  const selected = state.selectedPackage

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleSelect(pkg: RawPackage) {
    const selectedPackage: SelectedPackage = {
      id: pkg.id,
      name: pkg.name,
      speedDown: pkg.speedDown,
      speedUp: pkg.speedUp,
      monthlyFee: pkg.monthlyFee,
      installationFee: pkg.installationFee,
      dataPolicy: pkg.dataPolicy,
      staticIp: pkg.staticIp,
      router: pkg.router,
      technology: pkg.technology,
    }
    updateState('selectedPackage', selectedPackage)
    updatePricing({ monthlyFee: pkg.monthlyFee })
  }

  // -------------------------------------------------------------------------
  // Render — empty state
  // -------------------------------------------------------------------------

  if (packages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Select a Package</h2>
          <p className="mt-2 text-gray-500 text-sm">
            No packages are available for the selected address. Please go back and check coverage
            again.
          </p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <PiWifiHighBold className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No packages found</p>
          <p className="mt-1 text-xs text-gray-400">
            Return to the coverage step to search a different address.
          </p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render — package grid
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Select a Package</h2>
        <p className="mt-2 text-gray-500 text-sm">
          Choose the service package for this contract. {packages.length} package
          {packages.length !== 1 ? 's' : ''} available.
        </p>
      </div>

      {/* Package grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg, index) => {
          const isSelected = selected?.id === pkg.id
          const isPopular = index === 1

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handleSelect(pkg)}
              className={[
                'relative flex flex-col rounded-xl border-2 p-5 text-left transition-all duration-150',
                isSelected
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm',
              ].join(' ')}
            >
              {/* Popular badge */}
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Popular
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <PiCheckCircleBold className="absolute right-4 top-4 h-5 w-5 text-orange-500" />
              )}

              {/* Service type badge */}
              {pkg.technology && (
                <span className="mb-3 inline-flex w-fit items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                  {pkg.technology}
                </span>
              )}

              {/* Package name */}
              <p className="text-base font-semibold text-gray-900 leading-snug">{pkg.name}</p>

              {/* Description */}
              {pkg.dataPolicy && (
                <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {pkg.dataPolicy}
                </p>
              )}

              {/* Speed */}
              <div className="mt-3 flex items-center gap-1.5">
                <PiWifiHighBold className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {pkg.speedDown} <span className="text-gray-400">↓</span> / {pkg.speedUp}{' '}
                  <span className="text-gray-400">↑</span>{' '}
                  <span className="text-xs text-gray-400">Mbps</span>
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(pkg.monthlyFee)}
                </p>
                <p className="text-xs text-gray-400">per month excl. VAT</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Continue button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={!selected}
          onClick={nextStep}
          className={[
            'inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors duration-150',
            selected
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'cursor-not-allowed bg-gray-100 text-gray-400',
          ].join(' ')}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
