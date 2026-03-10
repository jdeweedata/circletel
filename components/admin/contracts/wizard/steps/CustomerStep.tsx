'use client'

import { useState } from 'react'
import { PiWarningCircleBold } from 'react-icons/pi'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWizardContext } from '../ContractWizardProvider'
import { CustomerDetails } from '../hooks/useContractWizard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ValidationErrors = Partial<Record<keyof CustomerDetails, string>>

// ---------------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------------

interface FieldErrorProps {
  message?: string
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <PiWarningCircleBold className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

function FormField({ id, label, required, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CustomerStep() {
  const { state, updateCustomer, nextStep } = useWizardContext()
  const customer = state.customer

  const [errors, setErrors] = useState<ValidationErrors>({})

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!customer.companyName.trim()) newErrors.companyName = 'Required'
    if (!customer.contactPerson.trim()) newErrors.contactPerson = 'Required'
    if (!customer.email.trim()) {
      newErrors.email = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Invalid email'
    }
    if (!customer.phone.trim()) newErrors.phone = 'Required'
    if (!customer.address.trim()) newErrors.address = 'Required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleChange(field: keyof CustomerDetails) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      updateCustomer({ [field]: e.target.value })
      // Clear field error on change
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  function handleContinue() {
    if (validate()) {
      nextStep()
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Customer Details</h2>
        <p className="mt-2 text-gray-500 text-sm">
          Enter the customer information for this contract.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Company Info */}
        <Section title="Company Information">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField
                id="companyName"
                label="Company Name"
                required
                error={errors.companyName}
              >
                <Input
                  id="companyName"
                  value={customer.companyName}
                  onChange={handleChange('companyName')}
                  placeholder="Acme (Pty) Ltd"
                  className={errors.companyName ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
              </FormField>
            </div>

            <FormField
              id="registrationNumber"
              label="Registration Number"
              error={errors.registrationNumber}
            >
              <Input
                id="registrationNumber"
                value={customer.registrationNumber ?? ''}
                onChange={handleChange('registrationNumber')}
                placeholder="2023/012345/07"
                className={
                  errors.registrationNumber ? 'border-red-400 focus-visible:ring-red-300' : ''
                }
              />
            </FormField>

            <FormField id="vatNumber" label="VAT Number" error={errors.vatNumber}>
              <Input
                id="vatNumber"
                value={customer.vatNumber ?? ''}
                onChange={handleChange('vatNumber')}
                placeholder="4123456789"
                className={errors.vatNumber ? 'border-red-400 focus-visible:ring-red-300' : ''}
              />
            </FormField>
          </div>
        </Section>

        {/* Contact Person */}
        <Section title="Contact Person">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField
                id="contactPerson"
                label="Full Name"
                required
                error={errors.contactPerson}
              >
                <Input
                  id="contactPerson"
                  value={customer.contactPerson}
                  onChange={handleChange('contactPerson')}
                  placeholder="Jane Smith"
                  className={
                    errors.contactPerson ? 'border-red-400 focus-visible:ring-red-300' : ''
                  }
                />
              </FormField>
            </div>

            <FormField id="email" label="Email Address" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={customer.email}
                onChange={handleChange('email')}
                placeholder="jane@acme.co.za"
                className={errors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}
              />
            </FormField>

            <FormField id="phone" label="Phone Number" required error={errors.phone}>
              <Input
                id="phone"
                type="tel"
                value={customer.phone}
                onChange={handleChange('phone')}
                placeholder="011 000 0000"
                className={errors.phone ? 'border-red-400 focus-visible:ring-red-300' : ''}
              />
            </FormField>
          </div>
        </Section>

        {/* Address */}
        <Section title="Installation Address">
          <FormField id="address" label="Street Address" required error={errors.address}>
            <Input
              id="address"
              value={customer.address}
              onChange={handleChange('address')}
              placeholder="123 Main Street, Sandton, Johannesburg, 2196"
              className={errors.address ? 'border-red-400 focus-visible:ring-red-300' : ''}
            />
          </FormField>
        </Section>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-orange-600"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
