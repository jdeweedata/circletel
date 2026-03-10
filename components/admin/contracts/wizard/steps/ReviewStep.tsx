'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PiPencilBold,
  PiSpinnerBold,
  PiFloppyDiskBold,
  PiPaperPlaneTiltBold,
  PiBuildingBold,
  PiPackageBold,
  PiFileTextBold,
} from 'react-icons/pi'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/admin/shared/SectionCard'
import { useWizardContext } from '../ContractWizardProvider'
import { formatCurrency } from '@/lib/utils/format'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%] truncate">
        {value || <span className="text-slate-400 italic">—</span>}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewStep() {
  const router = useRouter()
  const { state, goToStep, setIsSubmitting } = useWizardContext()
  const { flow, customer, selectedPackage, terms, sla, pricing } = state

  const [submitting, setSubmittingLocal] = useState(false)
  const [activeAction, setActiveAction] = useState<'draft' | 'send' | null>(null)

  // Step numbers vary by flow
  const customerStep = flow === 'quote' ? 3 : 4
  const productStep = flow === 'quote' ? 2 : 3
  const termsStep = flow === 'quote' ? 4 : 5

  // Derived values
  const monthlyExclVat = pricing.monthlyFee
  const monthlyVat = monthlyExclVat * 0.15
  const monthlyInclVat = monthlyExclVat + monthlyVat
  const installationExclVat = pricing.installationFee
  const totalContractValue = monthlyExclVat * terms.term + installationExclVat

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleSubmit(action: 'draft' | 'send') {
    if (submitting) return

    setSubmittingLocal(true)
    setActiveAction(action)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/contracts/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          sendForSignature: action === 'send',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create contract')
      }

      const contractId: string = data.data?.id || data.id

      toast.success(
        action === 'send'
          ? 'Contract created and sent for signature'
          : 'Contract saved as draft',
        { description: `Contract #${data.data?.contractNumber || contractId}` }
      )

      router.push(`/admin/contracts/${contractId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast.error('Failed to create contract', { description: message })
    } finally {
      setSubmittingLocal(false)
      setActiveAction(null)
      setIsSubmitting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Review &amp; Confirm</h2>
        <p className="mt-2 text-sm text-gray-500">
          Review all details before saving or sending for signature.
        </p>
      </div>

      {/* Customer Details */}
      <SectionCard
        title="Customer Details"
        icon={PiBuildingBold}
        action={
          <button
            type="button"
            onClick={() => goToStep(customerStep)}
            className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <PiPencilBold className="h-3.5 w-3.5" />
            Edit
          </button>
        }
      >
        <div className="divide-y divide-slate-100">
          <ReviewRow label="Company Name" value={customer.companyName} />
          {customer.registrationNumber && (
            <ReviewRow label="Registration No." value={customer.registrationNumber} />
          )}
          {customer.vatNumber && (
            <ReviewRow label="VAT Number" value={customer.vatNumber} />
          )}
          <ReviewRow label="Contact Person" value={customer.contactPerson} />
          <ReviewRow label="Email" value={customer.email} />
          <ReviewRow label="Phone" value={customer.phone} />
          <ReviewRow label="Installation Address" value={customer.address} />
        </div>
      </SectionCard>

      {/* Service Package */}
      <SectionCard
        title="Service Package"
        icon={PiPackageBold}
        action={
          flow === 'scratch' ? (
            <button
              type="button"
              onClick={() => goToStep(productStep)}
              className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              <PiPencilBold className="h-3.5 w-3.5" />
              Edit
            </button>
          ) : undefined
        }
      >
        <div className="divide-y divide-slate-100">
          <ReviewRow
            label="Package"
            value={selectedPackage?.name ?? 'Not selected'}
          />
          {selectedPackage && (
            <>
              <ReviewRow
                label="Speed"
                value={`${selectedPackage.speedDown}/${selectedPackage.speedUp} Mbps`}
              />
              {selectedPackage.technology && (
                <ReviewRow label="Technology" value={selectedPackage.technology} />
              )}
              {selectedPackage.dataPolicy && (
                <ReviewRow label="Data Policy" value={selectedPackage.dataPolicy} />
              )}
            </>
          )}
          {state.coverage?.address && (
            <ReviewRow label="Coverage Address" value={state.coverage.address} />
          )}
        </div>
      </SectionCard>

      {/* Contract Terms */}
      <SectionCard
        title="Contract Terms"
        icon={PiFileTextBold}
        action={
          <button
            type="button"
            onClick={() => goToStep(termsStep)}
            className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <PiPencilBold className="h-3.5 w-3.5" />
            Edit
          </button>
        }
      >
        <div className="divide-y divide-slate-100">
          <ReviewRow label="Contract Term" value={`${terms.term} months`} />
          <ReviewRow label="Commencement Date" value={terms.commencementDate} />
          <ReviewRow label="Notice Period" value={`${terms.noticePeriod} days`} />
          <ReviewRow label="Uptime Guarantee" value={`${sla.uptimeGuarantee}%`} />
          <ReviewRow label="Fault Response" value={sla.faultResponse} />
          <ReviewRow label="Fault Resolution" value={sla.faultResolution} />
          <ReviewRow label="Credit Cap" value={`${sla.creditCap}%`} />
        </div>
      </SectionCard>

      {/* Pricing Summary */}
      <div className="rounded-xl bg-orange-50 border border-orange-200 p-5">
        <h3 className="text-sm font-semibold text-orange-800 mb-4">Pricing Summary</h3>
        <dl className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <dt className="text-orange-700">Monthly (excl. VAT)</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(monthlyExclVat)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-orange-700">VAT (15%)</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(monthlyVat)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-orange-700">Monthly (incl. VAT)</dt>
            <dd className="font-semibold text-slate-900">{formatCurrency(monthlyInclVat)}</dd>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <dt className="text-orange-700">Installation Fee</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(installationExclVat)}</dd>
          </div>
          <div className="border-t border-orange-200 pt-2.5 flex justify-between text-sm font-semibold">
            <dt className="text-orange-800">Total Contract Value</dt>
            <dd className="text-orange-600">{formatCurrency(totalContractValue)}</dd>
          </div>
          <p className="text-xs text-orange-600/70 mt-1">
            ({terms.term} months × {formatCurrency(monthlyExclVat)} + {formatCurrency(installationExclVat)} installation, excl. VAT)
          </p>
        </dl>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => handleSubmit('draft')}
          className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          {activeAction === 'draft' ? (
            <PiSpinnerBold className="h-4 w-4 animate-spin" />
          ) : (
            <PiFloppyDiskBold className="h-4 w-4" />
          )}
          Save as Draft
        </Button>

        <Button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit('send')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          {activeAction === 'send' ? (
            <PiSpinnerBold className="h-4 w-4 animate-spin" />
          ) : (
            <PiPaperPlaneTiltBold className="h-4 w-4" />
          )}
          Save &amp; Send for Signature
        </Button>
      </div>
    </div>
  )
}
