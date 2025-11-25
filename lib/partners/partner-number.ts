/**
 * Partner Number Generation
 * Generates unique partner numbers in format: CTPL-YYYY-NNN
 * Example: CTPL-2025-001, CTPL-2025-002, etc.
 */

import { createClient } from '@/lib/supabase/server'

export interface PartnerNumberResult {
  success: boolean
  partnerNumber?: string
  error?: string
}

/**
 * Generate the next partner number for the current year
 * Format: CTPL-YYYY-NNN (e.g., CTPL-2025-001)
 */
export async function generatePartnerNumber(): Promise<PartnerNumberResult> {
  try {
    const supabase = await createClient()
    const currentYear = new Date().getFullYear()
    const prefix = `CTPL-${currentYear}-`

    // Get the highest partner number for the current year
    const { data: existingPartners, error: queryError } = await supabase
      .from('partners')
      .select('partner_number')
      .like('partner_number', `${prefix}%`)
      .order('partner_number', { ascending: false })
      .limit(1)

    if (queryError) {
      throw new Error(`Failed to query existing partner numbers: ${queryError.message}`)
    }

    let nextNumber = 1

    if (existingPartners && existingPartners.length > 0 && existingPartners[0].partner_number) {
      // Extract the numeric part from the existing partner number
      const existingNumber = existingPartners[0].partner_number
      const numericPart = existingNumber.split('-').pop()
      if (numericPart) {
        nextNumber = parseInt(numericPart, 10) + 1
      }
    }

    // Format: CTPL-YYYY-NNN (3 digits, zero-padded)
    const partnerNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`

    return {
      success: true,
      partnerNumber,
    }
  } catch (error) {
    console.error('Error generating partner number:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating partner number',
    }
  }
}

/**
 * Assign a partner number to a partner record
 * This is called when a partner is approved
 */
export async function assignPartnerNumber(partnerId: string): Promise<PartnerNumberResult> {
  try {
    const supabase = await createClient()

    // Check if partner already has a number
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('partner_number')
      .eq('id', partnerId)
      .single()

    if (checkError) {
      throw new Error(`Failed to check partner: ${checkError.message}`)
    }

    if (existingPartner?.partner_number) {
      return {
        success: true,
        partnerNumber: existingPartner.partner_number,
      }
    }

    // Generate a new partner number
    const result = await generatePartnerNumber()
    if (!result.success || !result.partnerNumber) {
      throw new Error(result.error || 'Failed to generate partner number')
    }

    // Update the partner record with the new number
    const { error: updateError } = await supabase
      .from('partners')
      .update({ partner_number: result.partnerNumber })
      .eq('id', partnerId)

    if (updateError) {
      throw new Error(`Failed to assign partner number: ${updateError.message}`)
    }

    return {
      success: true,
      partnerNumber: result.partnerNumber,
    }
  } catch (error) {
    console.error('Error assigning partner number:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error assigning partner number',
    }
  }
}

/**
 * Validate partner number format
 */
export function isValidPartnerNumber(partnerNumber: string): boolean {
  // Format: CTPL-YYYY-NNN
  const regex = /^CTPL-\d{4}-\d{3}$/
  return regex.test(partnerNumber)
}
