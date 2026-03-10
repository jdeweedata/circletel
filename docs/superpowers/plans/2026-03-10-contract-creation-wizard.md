# Contract Creation Wizard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-step wizard for creating contracts from scratch (with coverage check) or by converting existing quotes.

**Architecture:** Context-based state management following CPQ Wizard pattern. Separate step components with shared provider. Reuses existing CoverageChecker and WorkflowStepper components.

**Tech Stack:** Next.js 15 App Router, React Context, TypeScript, Tailwind, Framer Motion, Supabase

**Spec:** `docs/superpowers/specs/2026-03-10-contract-creation-wizard-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/admin/contracts/new/page.tsx` | Wizard orchestrator page |
| Create | `components/admin/contracts/wizard/ContractWizardProvider.tsx` | Context + state management |
| Create | `components/admin/contracts/wizard/ContractWizardStepper.tsx` | Step progress indicator |
| Create | `components/admin/contracts/wizard/steps/EntryMethodStep.tsx` | Choose scratch vs from quote |
| Create | `components/admin/contracts/wizard/steps/QuoteSelectStep.tsx` | Pick existing quote |
| Create | `components/admin/contracts/wizard/steps/CoverageStep.tsx` | Address lookup wrapper |
| Create | `components/admin/contracts/wizard/steps/ProductStep.tsx` | Select package |
| Create | `components/admin/contracts/wizard/steps/CustomerStep.tsx` | Business details form |
| Create | `components/admin/contracts/wizard/steps/TermsStep.tsx` | Contract terms + SLA |
| Create | `components/admin/contracts/wizard/steps/ReviewStep.tsx` | Preview + submit actions |
| Create | `components/admin/contracts/wizard/hooks/useContractWizard.ts` | Wizard state hook |
| Create | `components/admin/contracts/wizard/index.ts` | Barrel exports |
| Create | `app/api/admin/contracts/wizard/route.ts` | Wizard submission API |

**Reused Components:**
- `components/coverage/CoverageChecker.tsx` (address lookup)
- `components/admin/orders/WorkflowStepper.tsx` (step progress)
- `components/admin/shared/SectionCard.tsx` (content sections)
- `components/ui/*` (Button, Input, Select, etc.)

---

## Chunk 1: Wizard Infrastructure

### Task 1: Create Wizard Types and State Hook

**Files:**
- Create: `components/admin/contracts/wizard/hooks/useContractWizard.ts`

- [ ] **Step 1: Create the wizard state interface and hook**

```typescript
// components/admin/contracts/wizard/hooks/useContractWizard.ts
'use client';

import { useState, useCallback } from 'react';

export interface CoverageResult {
  available: boolean;
  services: string[];
  packages?: Array<{
    id: string;
    name: string;
    service_type: string;
    speed_down: number;
    speed_up: number;
    price: number;
    description: string;
    features: string[];
  }>;
  coordinates?: { lat: number; lng: number };
  address?: string;
  leadId?: string;
}

export interface SelectedPackage {
  id: string;
  name: string;
  serviceType: string;
  speedDown: number;
  speedUp: number;
  price: number;
  description: string;
}

export interface CustomerDetails {
  companyName: string;
  registrationNumber: string;
  vatNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface ContractTerms {
  contractTerm: 12 | 24 | 36;
  commencementDate: string;
  noticePeriod: number;
  editMode: boolean;
}

export interface SLAOverrides {
  uptimeGuarantee: string;
  faultResponse: string;
  faultResolution: string;
  creditCap: string;
}

export interface PricingOverrides {
  monthlyFee: number;
  installationFee: number;
}

export interface ContractWizardState {
  entryMethod: 'scratch' | 'from_quote' | null;
  selectedQuoteId: string | null;
  selectedQuote: any | null;
  coverageAddress: string;
  coverageResult: CoverageResult | null;
  selectedPackage: SelectedPackage | null;
  customer: CustomerDetails;
  terms: ContractTerms;
  slaOverrides: SLAOverrides;
  pricingOverrides: PricingOverrides;
}

const initialCustomer: CustomerDetails = {
  companyName: '',
  registrationNumber: '',
  vatNumber: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
};

const initialTerms: ContractTerms = {
  contractTerm: 24,
  commencementDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  noticePeriod: 30,
  editMode: false,
};

const initialSLA: SLAOverrides = {
  uptimeGuarantee: '99.5',
  faultResponse: '4 hours',
  faultResolution: '3 business days',
  creditCap: '30',
};

const initialPricing: PricingOverrides = {
  monthlyFee: 0,
  installationFee: 0,
};

const initialState: ContractWizardState = {
  entryMethod: null,
  selectedQuoteId: null,
  selectedQuote: null,
  coverageAddress: '',
  coverageResult: null,
  selectedPackage: null,
  customer: initialCustomer,
  terms: initialTerms,
  slaOverrides: initialSLA,
  pricingOverrides: initialPricing,
};

export function useContractWizard() {
  const [state, setState] = useState<ContractWizardState>(initialState);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateState = useCallback(<K extends keyof ContractWizardState>(
    key: K,
    value: ContractWizardState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateCustomer = useCallback((updates: Partial<CustomerDetails>) => {
    setState(prev => ({
      ...prev,
      customer: { ...prev.customer, ...updates },
    }));
  }, []);

  const updateTerms = useCallback((updates: Partial<ContractTerms>) => {
    setState(prev => ({
      ...prev,
      terms: { ...prev.terms, ...updates },
    }));
  }, []);

  const updateSLA = useCallback((updates: Partial<SLAOverrides>) => {
    setState(prev => ({
      ...prev,
      slaOverrides: { ...prev.slaOverrides, ...updates },
    }));
  }, []);

  const updatePricing = useCallback((updates: Partial<PricingOverrides>) => {
    setState(prev => ({
      ...prev,
      pricingOverrides: { ...prev.pricingOverrides, ...updates },
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setCurrentStep(1);
  }, []);

  // Pre-fill from quote
  const prefillFromQuote = useCallback((quote: any) => {
    setState(prev => ({
      ...prev,
      selectedQuote: quote,
      customer: {
        companyName: quote.company_name || '',
        registrationNumber: quote.registration_number || '',
        vatNumber: quote.vat_number || '',
        contactPerson: quote.contact_name || '',
        email: quote.contact_email || '',
        phone: quote.contact_phone || '',
        address: quote.installation_address || '',
      },
      coverageAddress: quote.installation_address || '',
      selectedPackage: quote.package_id ? {
        id: quote.package_id,
        name: quote.package_name || '',
        serviceType: quote.service_type || '',
        speedDown: quote.speed_down || 0,
        speedUp: quote.speed_up || 0,
        price: quote.monthly_total || 0,
        description: '',
      } : null,
      pricingOverrides: {
        monthlyFee: quote.monthly_total || 0,
        installationFee: quote.once_off_total || 0,
      },
    }));
  }, []);

  // Get total steps based on entry method
  const getTotalSteps = useCallback(() => {
    if (state.entryMethod === 'from_quote') {
      return 5; // Entry -> Quote -> Customer -> Terms -> Review
    }
    return 6; // Entry -> Coverage -> Product -> Customer -> Terms -> Review
  }, [state.entryMethod]);

  return {
    state,
    currentStep,
    isSubmitting,
    setIsSubmitting,
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
  };
}

export type ContractWizardHook = ReturnType<typeof useContractWizard>;
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/hooks/`
Expected: `useContractWizard.ts` exists

---

### Task 2: Create Wizard Context Provider

**Files:**
- Create: `components/admin/contracts/wizard/ContractWizardProvider.tsx`

- [ ] **Step 1: Create the context provider component**

```typescript
// components/admin/contracts/wizard/ContractWizardProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useContractWizard, ContractWizardHook } from './hooks/useContractWizard';

const ContractWizardContext = createContext<ContractWizardHook | null>(null);

interface ContractWizardProviderProps {
  children: ReactNode;
}

export function ContractWizardProvider({ children }: ContractWizardProviderProps) {
  const wizard = useContractWizard();

  return (
    <ContractWizardContext.Provider value={wizard}>
      {children}
    </ContractWizardContext.Provider>
  );
}

export function useWizardContext() {
  const context = useContext(ContractWizardContext);
  if (!context) {
    throw new Error('useWizardContext must be used within ContractWizardProvider');
  }
  return context;
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/`
Expected: `ContractWizardProvider.tsx` exists

---

### Task 3: Create Wizard Stepper Component

**Files:**
- Create: `components/admin/contracts/wizard/ContractWizardStepper.tsx`

- [ ] **Step 1: Create stepper that wraps WorkflowStepper**

```typescript
// components/admin/contracts/wizard/ContractWizardStepper.tsx
'use client';

import {
  PiListBold,
  PiMagnifyingGlassBold,
  PiPackageBold,
  PiUsersBold,
  PiFileTextBold,
  PiCheckCircleBold,
  PiNoteBold,
} from 'react-icons/pi';
import { WorkflowStepper, WorkflowStep } from '@/components/admin/orders/WorkflowStepper';
import { useWizardContext } from './ContractWizardProvider';

const SCRATCH_STEPS = [
  { id: 1, label: 'Entry', subLabel: 'Choose method', icon: PiListBold },
  { id: 2, label: 'Coverage', subLabel: 'Check address', icon: PiMagnifyingGlassBold },
  { id: 3, label: 'Product', subLabel: 'Select package', icon: PiPackageBold },
  { id: 4, label: 'Customer', subLabel: 'Business details', icon: PiUsersBold },
  { id: 5, label: 'Terms', subLabel: 'Contract terms', icon: PiFileTextBold },
  { id: 6, label: 'Review', subLabel: 'Generate contract', icon: PiCheckCircleBold },
];

const QUOTE_STEPS = [
  { id: 1, label: 'Entry', subLabel: 'Choose method', icon: PiListBold },
  { id: 2, label: 'Quote', subLabel: 'Select quote', icon: PiNoteBold },
  { id: 3, label: 'Customer', subLabel: 'Verify details', icon: PiUsersBold },
  { id: 4, label: 'Terms', subLabel: 'Contract terms', icon: PiFileTextBold },
  { id: 5, label: 'Review', subLabel: 'Generate contract', icon: PiCheckCircleBold },
];

export function ContractWizardStepper() {
  const { state, currentStep, goToStep } = useWizardContext();

  const stepConfigs = state.entryMethod === 'from_quote' ? QUOTE_STEPS : SCRATCH_STEPS;

  const workflowSteps: WorkflowStep[] = stepConfigs.map((step) => ({
    id: step.id,
    label: step.label,
    subLabel: step.subLabel,
    status: currentStep > step.id ? 'completed' : currentStep === step.id ? 'active' : 'pending',
    icon: step.icon,
  }));

  const handleStepClick = (stepId: number) => {
    // Can only go back, not forward (unless step is completed)
    if (stepId < currentStep) {
      goToStep(stepId);
    }
  };

  const currentLabel = stepConfigs.find(s => s.id === currentStep)?.label || '';

  return (
    <WorkflowStepper
      steps={workflowSteps}
      currentStatus={currentLabel}
      onStepClick={handleStepClick}
    />
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/`
Expected: `ContractWizardStepper.tsx` exists

---

### Task 4: Create Barrel Export

**Files:**
- Create: `components/admin/contracts/wizard/index.ts`

- [ ] **Step 1: Create barrel export file**

```typescript
// components/admin/contracts/wizard/index.ts
export { ContractWizardProvider, useWizardContext } from './ContractWizardProvider';
export { ContractWizardStepper } from './ContractWizardStepper';
export * from './hooks/useContractWizard';

// Steps
export { EntryMethodStep } from './steps/EntryMethodStep';
export { QuoteSelectStep } from './steps/QuoteSelectStep';
export { CoverageStep } from './steps/CoverageStep';
export { ProductStep } from './steps/ProductStep';
export { CustomerStep } from './steps/CustomerStep';
export { TermsStep } from './steps/TermsStep';
export { ReviewStep } from './steps/ReviewStep';
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/`
Expected: `index.ts` exists

- [ ] **Step 3: Commit infrastructure**

```bash
git add components/admin/contracts/wizard/
git commit -m "feat(contracts): add wizard infrastructure (provider, stepper, hooks)"
```

---

## Chunk 2: Entry and Selection Steps

### Task 5: Create Entry Method Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/EntryMethodStep.tsx`

- [ ] **Step 1: Create entry method selection component**

```typescript
// components/admin/contracts/wizard/steps/EntryMethodStep.tsx
'use client';

import { PiPlusBold, PiNoteBold, PiArrowRightBold } from 'react-icons/pi';
import { useWizardContext } from '../ContractWizardProvider';

export function EntryMethodStep() {
  const { state, updateState, nextStep } = useWizardContext();

  const handleSelect = (method: 'scratch' | 'from_quote') => {
    updateState('entryMethod', method);
    nextStep();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create New Contract</h2>
        <p className="mt-2 text-gray-600">
          Choose how you want to create the contract
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* From Scratch */}
        <button
          onClick={() => handleSelect('scratch')}
          className={`group relative p-6 rounded-xl border-2 text-left transition-all hover:border-orange-500 hover:shadow-lg ${
            state.entryMethod === 'scratch'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <PiPlusBold className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Start Fresh</h3>
              <p className="mt-1 text-sm text-gray-600">
                Check coverage, select a package, and enter customer details from scratch
              </p>
            </div>
            <PiArrowRightBold className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </div>
        </button>

        {/* From Quote */}
        <button
          onClick={() => handleSelect('from_quote')}
          className={`group relative p-6 rounded-xl border-2 text-left transition-all hover:border-orange-500 hover:shadow-lg ${
            state.entryMethod === 'from_quote'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <PiNoteBold className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Convert Quote</h3>
              <p className="mt-1 text-sm text-gray-600">
                Select an existing quote and convert it to a contract
              </p>
            </div>
            <PiArrowRightBold className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `EntryMethodStep.tsx` exists

---

### Task 6: Create Quote Select Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/QuoteSelectStep.tsx`

- [ ] **Step 1: Create quote selection component**

```typescript
// components/admin/contracts/wizard/steps/QuoteSelectStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { PiSpinnerBold, PiMagnifyingGlassBold, PiCheckCircleBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWizardContext } from '../ContractWizardProvider';
import { formatCurrency } from '@/lib/utils/format';

interface Quote {
  id: string;
  quote_number: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  installation_address: string;
  package_name: string;
  monthly_total: number;
  status: string;
  created_at: string;
}

export function QuoteSelectStep() {
  const { state, updateState, prefillFromQuote, nextStep } = useWizardContext();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/quotes/business/list?status=accepted&limit=50');
      if (!response.ok) throw new Error('Failed to fetch quotes');
      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      setError('Failed to load quotes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const search = searchTerm.toLowerCase();
    return (
      quote.quote_number?.toLowerCase().includes(search) ||
      quote.company_name?.toLowerCase().includes(search) ||
      quote.contact_name?.toLowerCase().includes(search)
    );
  });

  const handleSelect = (quote: Quote) => {
    updateState('selectedQuoteId', quote.id);
    prefillFromQuote(quote);
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <PiSpinnerBold className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading quotes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchQuotes} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Select a Quote</h2>
        <p className="mt-2 text-gray-600">
          Choose an accepted quote to convert into a contract
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by quote number, company, or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quote List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No accepted quotes found
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <button
              key={quote.id}
              onClick={() => handleSelect(quote)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:border-orange-500 hover:shadow-md ${
                state.selectedQuoteId === quote.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-orange-600">
                      {quote.quote_number}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                      {quote.status}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{quote.company_name}</p>
                  <p className="text-sm text-gray-600">{quote.contact_name}</p>
                  <p className="text-sm text-gray-500">{quote.package_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(quote.monthly_total)}/mo
                  </p>
                  {state.selectedQuoteId === quote.id && (
                    <PiCheckCircleBold className="h-5 w-5 text-orange-500 mt-2 ml-auto" />
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `QuoteSelectStep.tsx` exists

---

### Task 7: Create Coverage Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/CoverageStep.tsx`

- [ ] **Step 1: Create coverage step that wraps CoverageChecker**

```typescript
// components/admin/contracts/wizard/steps/CoverageStep.tsx
'use client';

import { CoverageChecker } from '@/components/coverage/CoverageChecker';
import { useWizardContext } from '../ContractWizardProvider';
import type { CoverageResult } from '../hooks/useContractWizard';

export function CoverageStep() {
  const { updateState, updateCustomer, nextStep } = useWizardContext();

  const handleCoverageFound = (result: CoverageResult) => {
    updateState('coverageResult', result);
    updateState('coverageAddress', result.address || '');
    // Pre-fill customer address
    if (result.address) {
      updateCustomer({ address: result.address });
    }
    nextStep();
  };

  const handleNoCoverage = () => {
    // Stay on step, let user try different address
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Check Coverage</h2>
        <p className="mt-2 text-gray-600">
          Enter the installation address to check service availability
        </p>
      </div>

      <CoverageChecker
        onCoverageFound={handleCoverageFound}
        onNoCoverage={handleNoCoverage}
        showPackages={false}
        className="border-0 shadow-none"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `CoverageStep.tsx` exists

---

### Task 8: Create Product Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/ProductStep.tsx`

- [ ] **Step 1: Create product selection component**

```typescript
// components/admin/contracts/wizard/steps/ProductStep.tsx
'use client';

import { PiCheckCircleBold, PiWifiHighBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { useWizardContext } from '../ContractWizardProvider';
import { formatCurrency } from '@/lib/utils/format';

export function ProductStep() {
  const { state, updateState, updatePricing, nextStep } = useWizardContext();
  const packages = state.coverageResult?.packages || [];

  const handleSelect = (pkg: typeof packages[0]) => {
    updateState('selectedPackage', {
      id: pkg.id,
      name: pkg.name,
      serviceType: pkg.service_type,
      speedDown: pkg.speed_down,
      speedUp: pkg.speed_up,
      price: pkg.price,
      description: pkg.description,
    });
    updatePricing({ monthlyFee: pkg.price, installationFee: 0 });
  };

  const handleContinue = () => {
    if (state.selectedPackage) {
      nextStep();
    }
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No packages available. Please go back and check a different address.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Select a Package</h2>
        <p className="mt-2 text-gray-600">
          Choose the service package for this contract
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg, index) => {
          const isSelected = state.selectedPackage?.id === pkg.id;
          return (
            <button
              key={pkg.id}
              onClick={() => handleSelect(pkg)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all hover:border-orange-500 hover:shadow-lg ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Popular badge */}
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                  Popular
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <PiCheckCircleBold className="h-6 w-6 text-orange-500" />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PiWifiHighBold className="h-5 w-5 text-orange-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {pkg.service_type}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                </div>

                <div className="text-center py-3 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {pkg.speed_down}<span className="text-lg text-gray-500">Mbps</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {pkg.speed_up}Mbps upload
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(pkg.price)}
                  </p>
                  <p className="text-xs text-gray-500">per month excl. VAT</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!state.selectedPackage}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `ProductStep.tsx` exists

- [ ] **Step 3: Commit entry and selection steps**

```bash
git add components/admin/contracts/wizard/steps/
git commit -m "feat(contracts): add wizard entry, quote, coverage, product steps"
```

---

## Chunk 3: Customer and Terms Steps

### Task 9: Create Customer Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/CustomerStep.tsx`

- [ ] **Step 1: Create customer details form**

```typescript
// components/admin/contracts/wizard/steps/CustomerStep.tsx
'use client';

import { useState } from 'react';
import { PiWarningCircleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizardContext } from '../ContractWizardProvider';

interface ValidationErrors {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function CustomerStep() {
  const { state, updateCustomer, nextStep } = useWizardContext();
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!state.customer.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!state.customer.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }
    if (!state.customer.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customer.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!state.customer.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!state.customer.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      nextStep();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
        <p className="mt-2 text-gray-600">
          Enter the business customer information
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Company Information</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={state.customer.companyName}
                onChange={(e) => updateCustomer({ companyName: e.target.value })}
                placeholder="Acme Corporation (Pty) Ltd"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <PiWarningCircleBold className="h-4 w-4" />
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={state.customer.registrationNumber}
                onChange={(e) => updateCustomer({ registrationNumber: e.target.value })}
                placeholder="2024/123456/07"
              />
            </div>

            <div>
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={state.customer.vatNumber}
                onChange={(e) => updateCustomer({ vatNumber: e.target.value })}
                placeholder="4123456789"
              />
            </div>
          </div>
        </div>

        {/* Contact Person */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Contact Person</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="contactPerson">Full Name *</Label>
              <Input
                id="contactPerson"
                value={state.customer.contactPerson}
                onChange={(e) => updateCustomer({ contactPerson: e.target.value })}
                placeholder="John Smith"
                className={errors.contactPerson ? 'border-red-500' : ''}
              />
              {errors.contactPerson && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <PiWarningCircleBold className="h-4 w-4" />
                  {errors.contactPerson}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={state.customer.email}
                onChange={(e) => updateCustomer({ email: e.target.value })}
                placeholder="john@acme.co.za"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <PiWarningCircleBold className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={state.customer.phone}
                onChange={(e) => updateCustomer({ phone: e.target.value })}
                placeholder="082 123 4567"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <PiWarningCircleBold className="h-4 w-4" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Installation Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Installation Address</h3>

          <div>
            <Label htmlFor="address">Full Address *</Label>
            <Input
              id="address"
              value={state.customer.address}
              onChange={(e) => updateCustomer({ address: e.target.value })}
              placeholder="123 Main Road, Sandton, Johannesburg, 2196"
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <PiWarningCircleBold className="h-4 w-4" />
                {errors.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `CustomerStep.tsx` exists

---

### Task 10: Create Terms Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/TermsStep.tsx`

- [ ] **Step 1: Create terms and SLA configuration**

```typescript
// components/admin/contracts/wizard/steps/TermsStep.tsx
'use client';

import { PiPencilBold, PiLockBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWizardContext } from '../ContractWizardProvider';
import { formatCurrency } from '@/lib/utils/format';

const CONTRACT_TERMS = [
  { value: 12, label: '12 months', discount: '' },
  { value: 24, label: '24 months', discount: 'Most popular' },
  { value: 36, label: '36 months', discount: 'Best value' },
] as const;

export function TermsStep() {
  const { state, updateTerms, updateSLA, updatePricing, nextStep } = useWizardContext();

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Contract Terms</h2>
        <p className="mt-2 text-gray-600">
          Configure the contract duration and terms
        </p>
      </div>

      <div className="space-y-6">
        {/* Contract Term Selection */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Contract Duration</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {CONTRACT_TERMS.map((term) => (
              <button
                key={term.value}
                onClick={() => updateTerms({ contractTerm: term.value })}
                className={`relative p-4 rounded-lg border-2 text-center transition-all ${
                  state.terms.contractTerm === term.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                {term.discount && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                    {term.discount}
                  </span>
                )}
                <p className="text-2xl font-bold text-gray-900">{term.value}</p>
                <p className="text-sm text-gray-500">months</p>
              </button>
            ))}
          </div>
        </div>

        {/* Commencement Date */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Start Date</h3>
          <div className="max-w-xs">
            <Label htmlFor="commencementDate">Commencement Date</Label>
            <Input
              id="commencementDate"
              type="date"
              value={state.terms.commencementDate}
              onChange={(e) => updateTerms({ commencementDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Edit Terms Toggle */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Custom Terms</h3>
              <p className="text-sm text-gray-500">
                Override default SLA and pricing values
              </p>
            </div>
            <div className="flex items-center gap-2">
              {state.terms.editMode ? (
                <PiPencilBold className="h-5 w-5 text-orange-500" />
              ) : (
                <PiLockBold className="h-5 w-5 text-gray-400" />
              )}
              <Switch
                checked={state.terms.editMode}
                onCheckedChange={(checked) => updateTerms({ editMode: checked })}
              />
            </div>
          </div>
        </div>

        {/* SLA and Pricing (only shown in edit mode) */}
        {state.terms.editMode && (
          <>
            {/* SLA Terms */}
            <div className="bg-white p-6 rounded-xl border border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-4">SLA Terms</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="uptimeGuarantee">Uptime Guarantee (%)</Label>
                  <Input
                    id="uptimeGuarantee"
                    value={state.slaOverrides.uptimeGuarantee}
                    onChange={(e) => updateSLA({ uptimeGuarantee: e.target.value })}
                    placeholder="99.5"
                  />
                </div>
                <div>
                  <Label htmlFor="faultResponse">Fault Response Time</Label>
                  <Input
                    id="faultResponse"
                    value={state.slaOverrides.faultResponse}
                    onChange={(e) => updateSLA({ faultResponse: e.target.value })}
                    placeholder="4 hours"
                  />
                </div>
                <div>
                  <Label htmlFor="faultResolution">Fault Resolution Time</Label>
                  <Input
                    id="faultResolution"
                    value={state.slaOverrides.faultResolution}
                    onChange={(e) => updateSLA({ faultResolution: e.target.value })}
                    placeholder="3 business days"
                  />
                </div>
                <div>
                  <Label htmlFor="creditCap">Credit Cap (%)</Label>
                  <Input
                    id="creditCap"
                    value={state.slaOverrides.creditCap}
                    onChange={(e) => updateSLA({ creditCap: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Override */}
            <div className="bg-white p-6 rounded-xl border border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-4">Pricing Override</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="monthlyFee">Monthly Fee (excl. VAT)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={state.pricingOverrides.monthlyFee}
                      onChange={(e) => updatePricing({ monthlyFee: parseFloat(e.target.value) || 0 })}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="installationFee">Installation Fee (excl. VAT)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <Input
                      id="installationFee"
                      type="number"
                      value={state.pricingOverrides.installationFee}
                      onChange={(e) => updatePricing({ installationFee: parseFloat(e.target.value) || 0 })}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Summary */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Contract Term:</span>
              <span className="font-medium">{state.terms.contractTerm} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Notice Period:</span>
              <span className="font-medium">{state.terms.noticePeriod} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Fee:</span>
              <span className="font-medium">{formatCurrency(state.pricingOverrides.monthlyFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Installation Fee:</span>
              <span className="font-medium">{formatCurrency(state.pricingOverrides.installationFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-900 font-semibold">Total Contract Value:</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(state.pricingOverrides.monthlyFee * state.terms.contractTerm + state.pricingOverrides.installationFee)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `TermsStep.tsx` exists

- [ ] **Step 3: Commit customer and terms steps**

```bash
git add components/admin/contracts/wizard/steps/
git commit -m "feat(contracts): add wizard customer and terms steps"
```

---

## Chunk 4: Review Step and Wizard API

### Task 11: Create Review Step

**Files:**
- Create: `components/admin/contracts/wizard/steps/ReviewStep.tsx`

- [ ] **Step 1: Create review and submit step**

```typescript
// components/admin/contracts/wizard/steps/ReviewStep.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiPencilBold,
  PiSpinnerBold,
  PiFloppyDiskBold,
  PiPaperPlaneTiltBold,
  PiCheckCircleBold,
  PiBuildingBold,
  PiUserBold,
  PiPackageBold,
  PiFileTextBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { useWizardContext } from '../ContractWizardProvider';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export function ReviewStep() {
  const router = useRouter();
  const { state, goToStep, isSubmitting, setIsSubmitting } = useWizardContext();
  const [submitAction, setSubmitAction] = useState<'draft' | 'send' | null>(null);

  const handleSubmit = async (action: 'draft' | 'send') => {
    setSubmitAction(action);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/contracts/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state,
          sendForSignature: action === 'send',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contract');
      }

      const data = await response.json();

      toast.success(
        action === 'send'
          ? 'Contract created and sent for signature!'
          : 'Contract saved as draft'
      );

      router.push(`/admin/contracts/${data.contractId}`);
    } catch (error) {
      console.error('Failed to create contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create contract');
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  // Navigate to step based on entry method
  const getStepNumber = (stepName: string) => {
    if (state.entryMethod === 'from_quote') {
      const map: Record<string, number> = { customer: 3, terms: 4 };
      return map[stepName] || 1;
    }
    const map: Record<string, number> = { coverage: 2, product: 3, customer: 4, terms: 5 };
    return map[stepName] || 1;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Review Contract</h2>
        <p className="mt-2 text-gray-600">
          Review all details before generating the contract
        </p>
      </div>

      {/* Customer Details */}
      <SectionCard
        title="Customer Details"
        icon={PiBuildingBold}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(getStepNumber('customer'))}
          >
            <PiPencilBold className="h-4 w-4 mr-1" />
            Edit
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Company Name</p>
            <p className="font-medium">{state.customer.companyName}</p>
          </div>
          {state.customer.registrationNumber && (
            <div>
              <p className="text-sm text-gray-500">Registration Number</p>
              <p className="font-medium">{state.customer.registrationNumber}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Contact Person</p>
            <p className="font-medium">{state.customer.contactPerson}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{state.customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{state.customer.phone}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Installation Address</p>
            <p className="font-medium">{state.customer.address}</p>
          </div>
        </div>
      </SectionCard>

      {/* Service Package */}
      <SectionCard
        title="Service Package"
        icon={PiPackageBold}
        action={
          state.entryMethod !== 'from_quote' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(getStepNumber('product'))}
            >
              <PiPencilBold className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )
        }
      >
        {state.selectedPackage ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Package Name</p>
              <p className="font-medium">{state.selectedPackage.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="font-medium">{state.selectedPackage.serviceType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Download Speed</p>
              <p className="font-medium">{state.selectedPackage.speedDown} Mbps</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Upload Speed</p>
              <p className="font-medium">{state.selectedPackage.speedUp} Mbps</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No package selected</p>
        )}
      </SectionCard>

      {/* Contract Terms */}
      <SectionCard
        title="Contract Terms"
        icon={PiFileTextBold}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep(getStepNumber('terms'))}
          >
            <PiPencilBold className="h-4 w-4 mr-1" />
            Edit
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Contract Term</p>
            <p className="font-medium">{state.terms.contractTerm} months</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Commencement Date</p>
            <p className="font-medium">
              {new Date(state.terms.commencementDate).toLocaleDateString('en-ZA')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Notice Period</p>
            <p className="font-medium">{state.terms.noticePeriod} days</p>
          </div>
          {state.terms.editMode && (
            <>
              <div>
                <p className="text-sm text-gray-500">Uptime Guarantee</p>
                <p className="font-medium">{state.slaOverrides.uptimeGuarantee}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fault Response</p>
                <p className="font-medium">{state.slaOverrides.faultResponse}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fault Resolution</p>
                <p className="font-medium">{state.slaOverrides.faultResolution}</p>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* Pricing Summary */}
      <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
        <h3 className="font-semibold text-gray-900 mb-4">Pricing Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Fee (excl. VAT)</span>
            <span className="font-medium">{formatCurrency(state.pricingOverrides.monthlyFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Installation Fee (excl. VAT)</span>
            <span className="font-medium">{formatCurrency(state.pricingOverrides.installationFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Contract Term</span>
            <span className="font-medium">{state.terms.contractTerm} months</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-orange-200">
            <span className="font-semibold text-gray-900">Total Contract Value</span>
            <span className="font-bold text-xl text-orange-600">
              {formatCurrency(
                state.pricingOverrides.monthlyFee * state.terms.contractTerm +
                  state.pricingOverrides.installationFee
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleSubmit('draft')}
          disabled={isSubmitting}
        >
          {isSubmitting && submitAction === 'draft' ? (
            <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PiFloppyDiskBold className="h-4 w-4 mr-2" />
          )}
          Save as Draft
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          onClick={() => handleSubmit('send')}
          disabled={isSubmitting}
        >
          {isSubmitting && submitAction === 'send' ? (
            <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PiPaperPlaneTiltBold className="h-4 w-4 mr-2" />
          )}
          Save & Send for Signature
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la components/admin/contracts/wizard/steps/`
Expected: `ReviewStep.tsx` exists

---

### Task 12: Create Wizard API Route

**Files:**
- Create: `app/api/admin/contracts/wizard/route.ts`

- [ ] **Step 1: Create the wizard submission API**

```typescript
// app/api/admin/contracts/wizard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging';
import type { ManagedServiceContractInput } from '@/lib/contracts/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/contracts/wizard
 * Create a contract from wizard data
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const permissionError = requirePermission(authResult.adminUser, 'contracts:create');
    if (permissionError) {
      return permissionError;
    }

    const body = await request.json();
    const { sendForSignature, ...wizardState } = body;

    apiLogger.info('[Contracts Wizard] Creating contract', {
      sendForSignature,
      entryMethod: wizardState.entryMethod,
    });

    // Transform wizard state to ManagedServiceContractInput
    const contractInput: ManagedServiceContractInput = {
      customer: {
        companyName: wizardState.customer.companyName,
        registrationNumber: wizardState.customer.registrationNumber || undefined,
        vatNumber: wizardState.customer.vatNumber || undefined,
        contactPerson: wizardState.customer.contactPerson,
        email: wizardState.customer.email,
        phone: wizardState.customer.phone,
        address: wizardState.customer.address,
      },
      service: {
        type: wizardState.selectedPackage?.serviceType || 'wireless',
        description: wizardState.selectedPackage?.name || 'Managed Service',
        speedDown: wizardState.selectedPackage?.speedDown || 0,
        speedUp: wizardState.selectedPackage?.speedUp || 0,
        dataPolicy: 'Truly Uncapped (No FUP)',
        staticIp: false,
        router: 'CircleTel Managed Router',
        monitoring: '24/7 Network Monitoring',
      },
      pricing: {
        monthlyFee: wizardState.pricingOverrides.monthlyFee,
        installationFee: wizardState.pricingOverrides.installationFee,
        vatRate: 0.15,
      },
      sla: {
        uptimeGuarantee: parseFloat(wizardState.slaOverrides.uptimeGuarantee) || 99.5,
        faultResponse: wizardState.slaOverrides.faultResponse || '4 hours',
        faultResolution: wizardState.slaOverrides.faultResolution || '3 business days',
        creditCap: parseFloat(wizardState.slaOverrides.creditCap) || 30,
      },
      contract: {
        term: `${wizardState.terms.contractTerm} months`,
        noticePeriod: wizardState.terms.noticePeriod,
        commencementDate: wizardState.terms.commencementDate,
      },
      equipment: {
        description: 'CircleTel Managed Router and CPE',
        ownership: 'CircleTel retains ownership',
        returnPeriod: '14 days after termination',
        replacementFee: 2500,
      },
    };

    // Generate PDF via the existing API
    const pdfResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/contracts/generate-managed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractInput),
      }
    );

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      apiLogger.error('[Contracts Wizard] PDF generation failed', { error: errorText });
      throw new Error('Failed to generate contract PDF');
    }

    const pdfData = await pdfResponse.json();
    const { contractNumber, pdfBase64 } = pdfData;

    // Save to database
    const supabase = await createClient();

    // Calculate dates
    const startDate = new Date(wizardState.terms.commencementDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + wizardState.terms.contractTerm);

    const totalContractValue =
      wizardState.pricingOverrides.monthlyFee * wizardState.terms.contractTerm +
      wizardState.pricingOverrides.installationFee;

    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert({
        contract_number: contractNumber,
        quote_id: wizardState.selectedQuoteId || null,
        contract_type: wizardState.selectedPackage?.serviceType || 'wireless',
        contract_term_months: wizardState.terms.contractTerm,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        monthly_recurring: wizardState.pricingOverrides.monthlyFee,
        once_off_fee: 0,
        installation_fee: wizardState.pricingOverrides.installationFee,
        total_contract_value: totalContractValue,
        status: sendForSignature ? 'pending_signature' : 'draft',
        // Store customer details in JSONB or separate table
        metadata: {
          customer: wizardState.customer,
          package: wizardState.selectedPackage,
          sla: wizardState.slaOverrides,
          entryMethod: wizardState.entryMethod,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      apiLogger.error('[Contracts Wizard] Database insert failed', { error: insertError });
      throw new Error('Failed to save contract');
    }

    // If sendForSignature, trigger Zoho Sign
    let zohoSignRequestId = null;
    if (sendForSignature) {
      try {
        // Import Zoho Sign service dynamically to avoid circular deps
        const { sendContractForSignature } = await import('@/lib/integrations/zoho/sign-service');
        const signResult = await sendContractForSignature(contract.id);
        zohoSignRequestId = signResult.requestId;

        // Update contract with Zoho Sign request ID
        await supabase
          .from('contracts')
          .update({ zoho_sign_request_id: zohoSignRequestId })
          .eq('id', contract.id);
      } catch (signError) {
        apiLogger.error('[Contracts Wizard] Zoho Sign failed', { error: signError });
        // Don't fail the whole operation, just log it
      }
    }

    apiLogger.info('[Contracts Wizard] Contract created', {
      contractId: contract.id,
      contractNumber,
      sendForSignature,
    });

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      contractNumber,
      zohoSignRequestId,
    });
  } catch (error) {
    apiLogger.error('[Contracts Wizard] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contract' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la app/api/admin/contracts/wizard/`
Expected: `route.ts` exists

- [ ] **Step 3: Commit review step and API**

```bash
git add components/admin/contracts/wizard/steps/ReviewStep.tsx app/api/admin/contracts/wizard/
git commit -m "feat(contracts): add wizard review step and submission API"
```

---

## Chunk 5: Wizard Page and Integration

### Task 13: Create Wizard Page

**Files:**
- Create: `app/admin/contracts/new/page.tsx`

- [ ] **Step 1: Create the wizard orchestrator page**

```typescript
// app/admin/contracts/new/page.tsx
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PiCaretLeftBold, PiXBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  ContractWizardProvider,
  ContractWizardStepper,
  useWizardContext,
  EntryMethodStep,
  QuoteSelectStep,
  CoverageStep,
  ProductStep,
  CustomerStep,
  TermsStep,
  ReviewStep,
} from '@/components/admin/contracts/wizard';

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
};

function WizardContent() {
  const router = useRouter();
  const { state, currentStep, prevStep, getTotalSteps } = useWizardContext();

  const handleCancel = useCallback(() => {
    router.push('/admin/contracts');
  }, [router]);

  // Render current step based on entry method and step number
  const renderStep = () => {
    if (state.entryMethod === null) {
      return <EntryMethodStep />;
    }

    if (state.entryMethod === 'from_quote') {
      switch (currentStep) {
        case 1:
          return <EntryMethodStep />;
        case 2:
          return <QuoteSelectStep />;
        case 3:
          return <CustomerStep />;
        case 4:
          return <TermsStep />;
        case 5:
          return <ReviewStep />;
        default:
          return <EntryMethodStep />;
      }
    }

    // From scratch flow
    switch (currentStep) {
      case 1:
        return <EntryMethodStep />;
      case 2:
        return <CoverageStep />;
      case 3:
        return <ProductStep />;
      case 4:
        return <CustomerStep />;
      case 5:
        return <TermsStep />;
      case 6:
        return <ReviewStep />;
      default:
        return <EntryMethodStep />;
    }
  };

  const totalSteps = getTotalSteps();
  const isFirstStep = currentStep === 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Contract</h1>
            <p className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <PiXBold className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Stepper */}
      {state.entryMethod && <ContractWizardStepper />}

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={1}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            <div className="p-6 max-w-5xl mx-auto">{renderStep()}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStep > 1 && (
        <div className="bg-white border-t px-6 py-4">
          <div className="max-w-5xl mx-auto">
            <Button variant="outline" onClick={prevStep} disabled={isFirstStep}>
              <PiCaretLeftBold className="h-4 w-4 mr-1" />
              Previous
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractWizardPage() {
  return (
    <ContractWizardProvider>
      <WizardContent />
    </ContractWizardProvider>
  );
}
```

- [ ] **Step 2: Verify page created**

Run: `ls -la app/admin/contracts/new/`
Expected: `page.tsx` exists

---

### Task 14: Add "New Contract" Button to List Page

**Files:**
- Modify: `app/admin/contracts/page.tsx`

- [ ] **Step 1: Read current list page**

Run: `head -60 app/admin/contracts/page.tsx`

- [ ] **Step 2: Add New Contract button to header**

Find the header section and add a Link button:

```typescript
// Add to imports
import Link from 'next/link';
import { PiPlusBold } from 'react-icons/pi';

// Add button in header (after the filter dropdown)
<Link href="/admin/contracts/new">
  <Button className="bg-orange-500 hover:bg-orange-600">
    <PiPlusBold className="h-4 w-4 mr-2" />
    New Contract
  </Button>
</Link>
```

- [ ] **Step 3: Verify type check passes**

Run: `npm run type-check:memory 2>&1 | head -30`
Expected: No errors in contracts files

- [ ] **Step 4: Commit wizard page and list update**

```bash
git add app/admin/contracts/
git commit -m "feat(contracts): add wizard page and new contract button"
```

---

### Task 15: Final Verification

- [ ] **Step 1: Run full type check**

Run: `npm run type-check:memory`
Expected: No TypeScript errors

- [ ] **Step 2: Test wizard flow in browser**

1. Navigate to `/admin/contracts`
2. Click "New Contract" button
3. Verify wizard loads at `/admin/contracts/new`
4. Select "Start Fresh"
5. Verify stepper shows all 6 steps
6. Go back and select "Convert Quote"
7. Verify stepper shows 5 steps

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(contracts): complete contract creation wizard (Phase 4)"
```

---

## Summary

| Chunk | Tasks | Files Created |
|-------|-------|---------------|
| 1 | 1-4 | Hook, Provider, Stepper, Index |
| 2 | 5-8 | Entry, Quote, Coverage, Product steps |
| 3 | 9-10 | Customer, Terms steps |
| 4 | 11-12 | Review step, Wizard API |
| 5 | 13-15 | Wizard page, List update, Verification |

**Total Files**: 13 new files
**Dependencies**: Existing CoverageChecker, WorkflowStepper, SectionCard components
