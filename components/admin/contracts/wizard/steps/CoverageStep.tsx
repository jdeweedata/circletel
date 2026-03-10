'use client'

import { CoverageChecker } from '@/components/coverage/CoverageChecker'
import { useWizardContext } from '../ContractWizardProvider'
import { CoverageResult } from '../hooks/useContractWizard'

// ---------------------------------------------------------------------------
// Type for CoverageChecker callback result
// ---------------------------------------------------------------------------

interface CoverageCheckerResult {
  available: boolean
  services: string[]
  speeds: Array<{ download: number; upload: number }>
  packages?: Array<{
    id: string
    name: string
    service_type: string
    speed_down: number
    speed_up: number
    price: number
    promotion_price?: number
    promotion_months?: number
    description: string
    features: string[]
  }>
  areas?: Array<{
    service_type: string
    area_name: string
    activation_days: number
  }>
  coordinates?: {
    lat: number
    lng: number
  }
  address?: string
  leadId?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoverageStep() {
  const { updateState, updateCustomer, nextStep } = useWizardContext()

  const handleCoverageFound = (result: CoverageCheckerResult) => {
    // Map CoverageChecker result to wizard state
    const coverageData: CoverageResult = {
      address: result.address || '',
      coordinates: result.coordinates,
      packages: (
        result.packages?.map((pkg: typeof result.packages[0]) => ({
          id: pkg.id,
          name: pkg.name,
          speedDown: pkg.speed_down,
          speedUp: pkg.speed_up,
          monthlyFee: pkg.price,
          installationFee: 0, // Not provided by CoverageChecker
          dataPolicy: pkg.description,
          technology: pkg.service_type,
        })) || []
      ),
      provider: result.services?.[0],
      technology: result.services?.[0],
      coverageType: 'residential',
    }

    // Update wizard state with coverage result
    updateState('coverage', coverageData)

    // Update customer address if available
    if (result.address) {
      updateCustomer({ address: result.address })
    }

    // Move to next step
    nextStep()
  }

  const handleNoCoverage = () => {
    // User will retry, no action needed
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Check Coverage</h2>
        <p className="mt-2 text-gray-500 text-sm">
          Enter the installation address to check service availability and view available packages.
        </p>
      </div>

      {/* Coverage Checker */}
      <CoverageChecker
        onCoverageFound={handleCoverageFound}
        onNoCoverage={handleNoCoverage}
        showPackages={false}
        className="bg-white"
      />
    </div>
  )
}
