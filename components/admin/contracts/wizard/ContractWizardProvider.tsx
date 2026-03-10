'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useContractWizard, ContractWizardHook } from './hooks/useContractWizard'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ContractWizardContext = createContext<ContractWizardHook | null>(null)

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

interface ContractWizardProviderProps {
  children: ReactNode
  flow?: 'scratch' | 'quote'
}

export function ContractWizardProvider({
  children,
  flow = 'scratch',
}: ContractWizardProviderProps) {
  const wizard = useContractWizard(flow)

  return (
    <ContractWizardContext.Provider value={wizard}>
      {children}
    </ContractWizardContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useWizardContext(): ContractWizardHook {
  const context = useContext(ContractWizardContext)

  if (!context) {
    throw new Error(
      'useWizardContext must be used within a ContractWizardProvider'
    )
  }

  return context
}
