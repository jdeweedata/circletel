'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, Easing } from 'framer-motion'
import { PiArrowLeftBold, PiXBold } from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { ContractWizardProvider, useWizardContext } from '@/components/admin/contracts/wizard/ContractWizardProvider'
import { ContractWizardStepper } from '@/components/admin/contracts/wizard/ContractWizardStepper'
import { EntryMethodStep } from '@/components/admin/contracts/wizard/steps/EntryMethodStep'
import { QuoteSelectStep } from '@/components/admin/contracts/wizard/steps/QuoteSelectStep'
import { CoverageStep } from '@/components/admin/contracts/wizard/steps/CoverageStep'
import { ProductStep } from '@/components/admin/contracts/wizard/steps/ProductStep'
import { CustomerStep } from '@/components/admin/contracts/wizard/steps/CustomerStep'
import { TermsStep } from '@/components/admin/contracts/wizard/steps/TermsStep'
import { ReviewStep } from '@/components/admin/contracts/wizard/steps/ReviewStep'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

const transition = {
  type: 'tween' as const,
  ease: 'easeInOut' as Easing,
  duration: 0.25,
}

// ---------------------------------------------------------------------------
// Inner wizard — must be inside ContractWizardProvider
// ---------------------------------------------------------------------------

function ContractWizardInner() {
  const router = useRouter()
  const { state, currentStep, prevStep, getTotalSteps } = useWizardContext()

  const totalSteps = getTotalSteps()
  // direction > 0 means moving forward (slide right → left), < 0 means back
  const direction = 1

  // -------------------------------------------------------------------------
  // Step renderer
  // -------------------------------------------------------------------------

  function renderStep() {
    // Step 1 or no flow chosen yet → always show entry method
    if (!state.flow || currentStep === 1) {
      return <EntryMethodStep key="entry" />
    }

    if (state.flow === 'quote') {
      switch (currentStep) {
        case 2:
          return <QuoteSelectStep key="quote-select" />
        case 3:
          return <CustomerStep key="customer-quote" />
        case 4:
          return <TermsStep key="terms-quote" />
        case 5:
          return <ReviewStep key="review-quote" />
        default:
          return <EntryMethodStep key="entry-default" />
      }
    }

    // flow === 'scratch'
    switch (currentStep) {
      case 2:
        return <CoverageStep key="coverage" />
      case 3:
        return <ProductStep key="product" />
      case 4:
        return <CustomerStep key="customer-scratch" />
      case 5:
        return <TermsStep key="terms-scratch" />
      case 6:
        return <ReviewStep key="review-scratch" />
      default:
        return <EntryMethodStep key="entry-default-scratch" />
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Title + step counter */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">Create Contract</h1>
            <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Cancel */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-900"
            onClick={() => router.push('/admin/contracts')}
          >
            <PiXBold className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
        </div>

        {/* Stepper — only show after flow is selected (step > 1) */}
        {currentStep > 1 && (
          <div className="max-w-5xl mx-auto px-6 pb-4">
            <ContractWizardStepper />
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${state.flow ?? 'none'}-${currentStep}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                               */}
      {/* ------------------------------------------------------------------ */}
      {currentStep > 1 && (
        <footer className="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-1.5"
            >
              <PiArrowLeftBold className="w-4 h-4" />
              Previous
            </Button>

            {/* Right side — each step's own "Next" / "Submit" button lives
                inside the step component itself so validation is co-located */}
            <span className="text-xs text-slate-400">
              Complete each step to continue
            </span>
          </div>
        </footer>
      )}

      {/* Spacer to prevent content being hidden behind fixed footer */}
      {currentStep > 1 && <div className="h-20" />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page export — wraps inner content in provider
// ---------------------------------------------------------------------------

export default function NewContractPage() {
  return (
    <ContractWizardProvider>
      <ContractWizardInner />
    </ContractWizardProvider>
  )
}
