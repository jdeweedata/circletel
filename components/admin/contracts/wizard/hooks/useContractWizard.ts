'use client'

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface CoverageResult {
  address: string
  coordinates?: { lat: number; lng: number }
  packages: SelectedPackage[]
  provider?: string
  technology?: string
  coverageType?: string
}

export interface SelectedPackage {
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

export interface CustomerDetails {
  // Company
  companyName: string
  registrationNumber?: string
  vatNumber?: string
  // Primary contact
  contactPerson: string
  email: string
  phone: string
  // Installation address
  address: string
  // Optional linked IDs
  customerId?: string
  quoteId?: string
}

export interface ContractTerms {
  term: 12 | 24 | 36
  commencementDate: string // ISO date string
  noticePeriod: number     // days
  editMode: boolean        // unlock read-only fields
}

export interface SLAOverrides {
  uptimeGuarantee: string  // e.g. "99.5"
  faultResponse: string    // e.g. "4 hours"
  faultResolution: string  // e.g. "3 business days"
  creditCap: string        // e.g. "30"  (% of monthly fee)
}

export interface PricingOverrides {
  monthlyFee: number       // Excl. VAT
  installationFee: number  // Excl. VAT
}

// ---------------------------------------------------------------------------
// Full wizard state
// ---------------------------------------------------------------------------

export type WizardFlow = 'scratch' | 'quote'

export interface ContractWizardState {
  flow: WizardFlow
  // Step data
  selectedQuoteId: string | null
  coverage: CoverageResult | null
  selectedPackage: SelectedPackage | null
  customer: CustomerDetails
  terms: ContractTerms
  sla: SLAOverrides
  pricing: PricingOverrides
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface ContractWizardHook {
  state: ContractWizardState
  currentStep: number
  isSubmitting: boolean
  // Updaters
  updateState: <K extends keyof ContractWizardState>(
    key: K,
    value: ContractWizardState[K]
  ) => void
  updateCustomer: (partial: Partial<CustomerDetails>) => void
  updateTerms: (partial: Partial<ContractTerms>) => void
  updateSLA: (partial: Partial<SLAOverrides>) => void
  updatePricing: (partial: Partial<PricingOverrides>) => void
  // Navigation
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  // Utilities
  reset: () => void
  prefillFromQuote: (quote: Record<string, unknown>) => void
  getTotalSteps: () => number
  setIsSubmitting: (value: boolean) => void
}

// ---------------------------------------------------------------------------
// Initial state helpers
// ---------------------------------------------------------------------------

function defaultCommencementDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

const initialCustomer: CustomerDetails = {
  companyName: '',
  registrationNumber: '',
  vatNumber: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
}

const initialTerms: ContractTerms = {
  term: 24,
  commencementDate: defaultCommencementDate(),
  noticePeriod: 30,
  editMode: false,
}

const initialSLA: SLAOverrides = {
  uptimeGuarantee: '99.5',
  faultResponse: '4 hours',
  faultResolution: '3 business days',
  creditCap: '30',
}

const initialPricing: PricingOverrides = {
  monthlyFee: 0,
  installationFee: 0,
}

function buildInitialState(flow: WizardFlow = 'scratch'): ContractWizardState {
  return {
    flow,
    selectedQuoteId: null,
    coverage: null,
    selectedPackage: null,
    customer: { ...initialCustomer },
    terms: { ...initialTerms, commencementDate: defaultCommencementDate() },
    sla: { ...initialSLA },
    pricing: { ...initialPricing },
  }
}

// ---------------------------------------------------------------------------
// Step count constants
// ---------------------------------------------------------------------------

const SCRATCH_STEPS = 6
const QUOTE_STEPS = 5

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useContractWizard(flow: WizardFlow = 'scratch'): ContractWizardHook {
  const [state, setState] = useState<ContractWizardState>(() =>
    buildInitialState(flow)
  )
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // -------------------------------------------------------------------------
  // Generic updater
  // -------------------------------------------------------------------------
  const updateState = useCallback(
    <K extends keyof ContractWizardState>(key: K, value: ContractWizardState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // -------------------------------------------------------------------------
  // Partial nested updaters
  // -------------------------------------------------------------------------
  const updateCustomer = useCallback((partial: Partial<CustomerDetails>) => {
    setState((prev) => ({
      ...prev,
      customer: { ...prev.customer, ...partial },
    }))
  }, [])

  const updateTerms = useCallback((partial: Partial<ContractTerms>) => {
    setState((prev) => ({
      ...prev,
      terms: { ...prev.terms, ...partial },
    }))
  }, [])

  const updateSLA = useCallback((partial: Partial<SLAOverrides>) => {
    setState((prev) => ({
      ...prev,
      sla: { ...prev.sla, ...partial },
    }))
  }, [])

  const updatePricing = useCallback((partial: Partial<PricingOverrides>) => {
    setState((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, ...partial },
    }))
  }, [])

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const getTotalSteps = useCallback((): number => {
    return state.flow === 'quote' ? QUOTE_STEPS : SCRATCH_STEPS
  }, [state.flow])

  const goToStep = useCallback(
    (step: number) => {
      const total = state.flow === 'quote' ? QUOTE_STEPS : SCRATCH_STEPS
      if (step >= 1 && step <= total) {
        setCurrentStep(step)
      }
    },
    [state.flow]
  )

  const nextStep = useCallback(() => {
    const total = state.flow === 'quote' ? QUOTE_STEPS : SCRATCH_STEPS
    setCurrentStep((prev) => Math.min(prev + 1, total))
  }, [state.flow])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------
  const reset = useCallback(() => {
    setState(buildInitialState(flow))
    setCurrentStep(1)
    setIsSubmitting(false)
  }, [flow])

  // -------------------------------------------------------------------------
  // Prefill from quote
  // -------------------------------------------------------------------------
  const prefillFromQuote = useCallback((quote: Record<string, unknown>) => {
    // Map common quote fields to wizard state — adapt field names as needed
    const customer: Partial<CustomerDetails> = {}
    const pricing: Partial<PricingOverrides> = {}
    const selectedPackage: Partial<SelectedPackage> = {}

    if (typeof quote.company_name === 'string') customer.companyName = quote.company_name
    if (typeof quote.contact_person === 'string') customer.contactPerson = quote.contact_person
    // contact_name is the field name used by the business quotes API
    if (typeof quote.contact_name === 'string') customer.contactPerson = quote.contact_name
    if (typeof quote.email === 'string') customer.email = quote.email
    if (typeof quote.contact_email === 'string') customer.email = quote.contact_email
    if (typeof quote.phone === 'string') customer.phone = quote.phone
    if (typeof quote.contact_phone === 'string') customer.phone = quote.contact_phone
    if (typeof quote.installation_address === 'string') customer.address = quote.installation_address
    if (typeof quote.registration_number === 'string') customer.registrationNumber = quote.registration_number
    if (typeof quote.vat_number === 'string') customer.vatNumber = quote.vat_number
    if (typeof quote.id === 'string') customer.quoteId = quote.id
    if (typeof quote.customer_id === 'string') customer.customerId = quote.customer_id

    if (typeof quote.monthly_recurring === 'number') pricing.monthlyFee = quote.monthly_recurring
    // monthly_total is the field name used by the business quotes API
    if (typeof quote.monthly_total === 'number') pricing.monthlyFee = quote.monthly_total
    if (typeof quote.installation_fee === 'number') pricing.installationFee = quote.installation_fee

    if (typeof quote.package_name === 'string') selectedPackage.name = quote.package_name
    if (typeof quote.speed_down === 'number') selectedPackage.speedDown = quote.speed_down
    if (typeof quote.speed_up === 'number') selectedPackage.speedUp = quote.speed_up

    setState((prev) => ({
      ...prev,
      flow: 'quote',
      customer: { ...prev.customer, ...customer },
      pricing: { ...prev.pricing, ...pricing },
      selectedPackage:
        Object.keys(selectedPackage).length > 0
          ? ({
              ...prev.selectedPackage,
              id: (typeof quote.package_id === 'string' ? quote.package_id : ''),
              monthlyFee: pricing.monthlyFee ?? 0,
              installationFee: pricing.installationFee ?? 0,
              ...selectedPackage,
            } as SelectedPackage)
          : prev.selectedPackage,
    }))
  }, [])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    state,
    currentStep,
    isSubmitting,
    updateState,
    updateCustomer,
    updateTerms,
    updateSLA,
    updatePricing,
    goToStep,
    nextStep,
    prevStep,
    reset,
    prefillFromQuote,
    getTotalSteps,
    setIsSubmitting,
  }
}
