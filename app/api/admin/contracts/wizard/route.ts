/**
 * Admin Contracts Wizard Submission API
 *
 * POST /api/admin/contracts/wizard
 *
 * Accepts the final wizard state, generates a managed service agreement PDF,
 * persists the contract record to the database, and optionally triggers Zoho Sign.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/lib/logging'
import type { ManagedServiceContractInput } from '@/lib/contracts/types'
import type { ContractWizardState } from '@/components/admin/contracts/wizard/hooks/useContractWizard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardSubmissionBody {
  state: ContractWizardState
  sendForSignature: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a term string/number to an integer number of months.
 * Accepts: 12 | 24 | 36 (number) or "month-to-month" (→ 1).
 */
function parseTermMonths(term: number | string): number {
  if (typeof term === 'number') return term
  const lower = String(term).toLowerCase()
  if (lower.includes('month-to-month') || lower === 'mtm') return 1
  const match = lower.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 24
}

/**
 * Calculate end date from start date and term in months.
 */
function calcEndDate(startDate: string, termMonths: number): string {
  const d = new Date(startDate)
  d.setMonth(d.getMonth() + termMonths)
  // Subtract one day so end date is the last day of service
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

/**
 * Validate the wizard submission body has the minimum required fields.
 */
function validateBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }

  const b = body as Partial<WizardSubmissionBody>

  if (!b.state) {
    errors.push('state is required')
    return { valid: false, errors }
  }

  const { state } = b

  // Customer
  if (!state.customer?.companyName) errors.push('state.customer.companyName is required')
  if (!state.customer?.contactPerson) errors.push('state.customer.contactPerson is required')
  if (!state.customer?.email) errors.push('state.customer.email is required')
  if (!state.customer?.address) errors.push('state.customer.address is required')

  // Package
  if (!state.selectedPackage) errors.push('state.selectedPackage is required')

  // Pricing
  if (typeof state.pricing?.monthlyFee !== 'number') errors.push('state.pricing.monthlyFee must be a number')
  if (typeof state.pricing?.installationFee !== 'number') errors.push('state.pricing.installationFee must be a number')

  // Terms
  if (!state.terms?.commencementDate) errors.push('state.terms.commencementDate is required')
  if (!state.terms?.term) errors.push('state.terms.term is required')

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authResult = await authenticateAdmin(request)
  if (!authResult.success) return authResult.response

  const permissionError = requirePermission(authResult.adminUser, 'contracts:create')
  if (permissionError) return permissionError

  try {
    const body = await request.json()

    // ── Validate ─────────────────────────────────────────────────────────────
    const validation = validateBody(body)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      )
    }

    const { state, sendForSignature = false } = body as WizardSubmissionBody
    const { customer, selectedPackage, pricing, sla, terms } = state

    // ── Build ManagedServiceContractInput ─────────────────────────────────────
    const termMonths = parseTermMonths(terms.term)

    const contractInput: ManagedServiceContractInput = {
      customer: {
        companyName: customer.companyName,
        registrationNumber: customer.registrationNumber,
        vatNumber: customer.vatNumber,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address,
      },
      service: {
        type: selectedPackage!.technology || 'Managed Business Connectivity',
        description:
          `${selectedPackage!.speedDown}/${selectedPackage!.speedUp} Mbps Managed Connectivity`,
        speedDown: selectedPackage!.speedDown,
        speedUp: selectedPackage!.speedUp,
        dataPolicy: selectedPackage!.dataPolicy || 'Uncapped',
        staticIp: selectedPackage!.staticIp ?? true,
        router: selectedPackage!.router || 'Business router with cloud management',
        monitoring: '24/7 proactive monitoring',
      },
      pricing: {
        monthlyFee: pricing.monthlyFee,
        installationFee: pricing.installationFee,
        vatRate: 0.15,
      },
      sla: {
        uptimeGuarantee: parseFloat(sla.uptimeGuarantee) || 99.5,
        faultResponse: sla.faultResponse || '4 hours',
        faultResolution: sla.faultResolution || '3 business days',
        creditCap: parseFloat(sla.creditCap) || 25,
      },
      contract: {
        term: termMonths === 1 ? 'Month-to-month' : `${termMonths} months`,
        noticePeriod: terms.noticePeriod || 30,
        commencementDate: terms.commencementDate,
      },
      equipment: {
        description: 'Business router with cloud management',
        ownership: 'CircleTel retains ownership',
        returnPeriod: '14 days after termination',
        replacementFee: 2500,
      },
    }

    // ── Call generate-managed to produce PDF + contract number ────────────────
    const origin =
      request.headers.get('origin') ||
      request.headers.get('x-forwarded-proto')
        ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const generateUrl = `${origin}/api/contracts/generate-managed?format=base64`

    const generateRes = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractInput),
    })

    if (!generateRes.ok) {
      const errBody = await generateRes.json().catch(() => ({}))
      apiLogger.error('[WizardSubmissionAPI] PDF generation failed', {
        status: generateRes.status,
        error: (errBody as Record<string, unknown>).error,
      })
      return NextResponse.json(
        { success: false, error: 'Failed to generate contract PDF' },
        { status: 502 }
      )
    }

    const generateData = await generateRes.json() as {
      success: boolean
      contractNumber: string
      data: string
      filename: string
    }

    const contractNumber: string = generateData.contractNumber

    // ── Calculate dates ───────────────────────────────────────────────────────
    const startDate = terms.commencementDate
    const endDate = termMonths === 1
      ? '' // month-to-month — no fixed end date, store empty string
      : calcEndDate(startDate, termMonths)

    const totalContractValue =
      pricing.monthlyFee * termMonths + pricing.installationFee

    // ── Determine service type ────────────────────────────────────────────────
    const rawTech = (selectedPackage!.technology || '').toLowerCase()
    let contractType: 'fibre' | 'wireless' | 'hybrid' = 'wireless'
    if (rawTech.includes('fibre') || rawTech.includes('ftth')) {
      contractType = 'fibre'
    } else if (rawTech.includes('hybrid')) {
      contractType = 'hybrid'
    }

    // ── Insert contract into database ─────────────────────────────────────────
    const supabase = await createClient()

    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert({
        contract_number: contractNumber,
        quote_id: state.selectedQuoteId || null,
        contract_type: contractType,
        contract_term_months: termMonths,
        start_date: startDate,
        end_date: endDate || null,
        monthly_recurring: pricing.monthlyFee,
        installation_fee: pricing.installationFee,
        total_contract_value: totalContractValue,
        status: sendForSignature ? 'pending_signature' : 'draft',
        metadata: {
          customer,
          package: selectedPackage,
          sla,
          flow: state.flow,
          pdfDataUri: generateData.data,
          filename: generateData.filename,
        },
      })
      .select('id, contract_number')
      .single()

    if (insertError || !contract) {
      apiLogger.error('[WizardSubmissionAPI] DB insert failed', {
        error: insertError?.message,
      })
      return NextResponse.json(
        { success: false, error: 'Failed to save contract' },
        { status: 500 }
      )
    }

    apiLogger.info('[WizardSubmissionAPI] Contract created', {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      sendForSignature,
    })

    // ── Optionally trigger Zoho Sign ──────────────────────────────────────────
    if (sendForSignature) {
      try {
        const { sendContractForSignature } = await import(
          '@/lib/integrations/zoho/sign-service'
        )
        await sendContractForSignature(contract.id)

        apiLogger.info('[WizardSubmissionAPI] Zoho Sign triggered', {
          contractId: contract.id,
        })
      } catch (signError) {
        // Non-fatal — contract is saved; signature can be retried
        apiLogger.error('[WizardSubmissionAPI] Zoho Sign trigger failed', {
          contractId: contract.id,
          error: signError instanceof Error ? signError.message : String(signError),
        })
      }
    }

    // ── Return ────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      contractId: contract.id,
      contractNumber: contract.contract_number,
    })
  } catch (error) {
    apiLogger.error('[WizardSubmissionAPI] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit contract',
      },
      { status: 500 }
    )
  }
}
