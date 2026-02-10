/**
 * Corporate Account Service
 *
 * Handles CRUD operations for corporate/enterprise accounts.
 * These are parent entities that can have multiple site locations.
 */

import { createClient } from '@/lib/supabase/server'
import {
  CorporateAccount,
  CreateCorporateAccountParams,
  UpdateCorporateAccountParams,
  ListCorporatesParams,
  PaginatedResult,
} from './types'

// ============================================================================
// Corporate Account Service
// ============================================================================

export class CorporateAccountService {
  /**
   * Create a new corporate account
   */
  static async create(params: CreateCorporateAccountParams): Promise<{
    success: boolean
    account?: CorporateAccount
    error?: string
  }> {
    const supabase = await createClient()

    try {
      // Validate corporate code format (uppercase alphanumeric)
      const code = params.corporateCode.toUpperCase()
      if (!/^[A-Z0-9]+$/.test(code)) {
        return {
          success: false,
          error: 'Corporate code must be uppercase alphanumeric characters only',
        }
      }

      // Check if corporate code already exists
      const { data: existing } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('corporate_code', code)
        .single()

      if (existing) {
        return {
          success: false,
          error: `Corporate code ${code} is already in use`,
        }
      }

      // Create corporate account
      const { data, error } = await supabase
        .from('corporate_accounts')
        .insert({
          corporate_code: code,
          company_name: params.companyName,
          trading_name: params.tradingName,
          registration_number: params.registrationNumber,
          vat_number: params.vatNumber,
          primary_contact_name: params.primaryContactName,
          primary_contact_email: params.primaryContactEmail,
          primary_contact_phone: params.primaryContactPhone,
          primary_contact_position: params.primaryContactPosition,
          billing_contact_name: params.billingContactName,
          billing_contact_email: params.billingContactEmail,
          billing_contact_phone: params.billingContactPhone,
          technical_contact_name: params.technicalContactName,
          technical_contact_email: params.technicalContactEmail,
          technical_contact_phone: params.technicalContactPhone,
          physical_address: params.physicalAddress,
          postal_address: params.postalAddress,
          credit_limit: params.creditLimit ?? 0,
          payment_terms: params.paymentTerms ?? 30,
          billing_cycle: params.billingCycle ?? 'monthly',
          contract_start_date: params.contractStartDate,
          contract_end_date: params.contractEndDate,
          contract_value: params.contractValue,
          expected_sites: params.expectedSites,
          industry: params.industry,
          notes: params.notes,
          created_by: params.createdBy,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create corporate account:', error)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        account: this.mapAccount(data),
      }
    } catch (error) {
      console.error('Error creating corporate account:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get a corporate account by ID
   */
  static async getById(id: string): Promise<CorporateAccount | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapAccount(data)
  }

  /**
   * Get a corporate account by corporate code
   */
  static async getByCode(code: string): Promise<CorporateAccount | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('corporate_code', code.toUpperCase())
      .single()

    if (error || !data) {
      return null
    }

    return this.mapAccount(data)
  }

  /**
   * Update a corporate account
   */
  static async update(
    id: string,
    params: UpdateCorporateAccountParams
  ): Promise<{
    success: boolean
    account?: CorporateAccount
    error?: string
  }> {
    const supabase = await createClient()

    try {
      const updateData: Record<string, unknown> = {}

      // Map params to database columns
      if (params.companyName !== undefined) updateData.company_name = params.companyName
      if (params.tradingName !== undefined) updateData.trading_name = params.tradingName
      if (params.registrationNumber !== undefined)
        updateData.registration_number = params.registrationNumber
      if (params.vatNumber !== undefined) updateData.vat_number = params.vatNumber
      if (params.primaryContactName !== undefined)
        updateData.primary_contact_name = params.primaryContactName
      if (params.primaryContactEmail !== undefined)
        updateData.primary_contact_email = params.primaryContactEmail
      if (params.primaryContactPhone !== undefined)
        updateData.primary_contact_phone = params.primaryContactPhone
      if (params.primaryContactPosition !== undefined)
        updateData.primary_contact_position = params.primaryContactPosition
      if (params.billingContactName !== undefined)
        updateData.billing_contact_name = params.billingContactName
      if (params.billingContactEmail !== undefined)
        updateData.billing_contact_email = params.billingContactEmail
      if (params.billingContactPhone !== undefined)
        updateData.billing_contact_phone = params.billingContactPhone
      if (params.technicalContactName !== undefined)
        updateData.technical_contact_name = params.technicalContactName
      if (params.technicalContactEmail !== undefined)
        updateData.technical_contact_email = params.technicalContactEmail
      if (params.technicalContactPhone !== undefined)
        updateData.technical_contact_phone = params.technicalContactPhone
      if (params.physicalAddress !== undefined) updateData.physical_address = params.physicalAddress
      if (params.postalAddress !== undefined) updateData.postal_address = params.postalAddress
      if (params.accountStatus !== undefined) updateData.account_status = params.accountStatus
      if (params.creditLimit !== undefined) updateData.credit_limit = params.creditLimit
      if (params.paymentTerms !== undefined) updateData.payment_terms = params.paymentTerms
      if (params.billingCycle !== undefined) updateData.billing_cycle = params.billingCycle
      if (params.contractStartDate !== undefined)
        updateData.contract_start_date = params.contractStartDate
      if (params.contractEndDate !== undefined) updateData.contract_end_date = params.contractEndDate
      if (params.contractValue !== undefined) updateData.contract_value = params.contractValue
      if (params.expectedSites !== undefined) updateData.expected_sites = params.expectedSites
      if (params.industry !== undefined) updateData.industry = params.industry
      if (params.notes !== undefined) updateData.notes = params.notes

      const { data, error } = await supabase
        .from('corporate_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update corporate account:', error)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        account: this.mapAccount(data),
      }
    } catch (error) {
      console.error('Error updating corporate account:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * List corporate accounts with pagination and filters
   */
  static async list(params: ListCorporatesParams = {}): Promise<PaginatedResult<CorporateAccount>> {
    const supabase = await createClient()
    const page = params.page || 1
    const limit = Math.min(params.limit || 20, 50)
    const offset = (page - 1) * limit

    let query = supabase.from('corporate_accounts').select('*', { count: 'exact' })

    // Apply filters
    if (params.status) {
      query = query.eq('account_status', params.status)
    }

    if (params.industry) {
      query = query.eq('industry', params.industry)
    }

    if (params.search) {
      query = query.or(
        `company_name.ilike.%${params.search}%,corporate_code.ilike.%${params.search}%,primary_contact_email.ilike.%${params.search}%`
      )
    }

    const { data, error, count } = await query
      .order('company_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error || !data) {
      return { data: [], total: 0, page, limit, totalPages: 0 }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      data: data.map(this.mapAccount),
      total,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Get dashboard stats for corporate accounts
   */
  static async getStats(): Promise<{
    totalCorporates: number
    activeCorporates: number
    totalSites: number
    activeSites: number
    pendingSites: number
  }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('corporate_accounts')
      .select('account_status, total_sites, active_sites, pending_sites')

    if (error || !data) {
      return {
        totalCorporates: 0,
        activeCorporates: 0,
        totalSites: 0,
        activeSites: 0,
        pendingSites: 0,
      }
    }

    return {
      totalCorporates: data.length,
      activeCorporates: data.filter((a) => a.account_status === 'active').length,
      totalSites: data.reduce((sum, a) => sum + (a.total_sites || 0), 0),
      activeSites: data.reduce((sum, a) => sum + (a.active_sites || 0), 0),
      pendingSites: data.reduce((sum, a) => sum + (a.pending_sites || 0), 0),
    }
  }

  /**
   * Delete a corporate account (soft delete by setting status to archived)
   */
  static async archive(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Check if corporate has any non-decommissioned sites
    const { data: sites } = await supabase
      .from('corporate_sites')
      .select('id')
      .eq('corporate_id', id)
      .neq('status', 'decommissioned')
      .limit(1)

    if (sites && sites.length > 0) {
      return {
        success: false,
        error: 'Cannot archive corporate with active sites. Decommission all sites first.',
      }
    }

    const { error } = await supabase
      .from('corporate_accounts')
      .update({ account_status: 'archived' })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Map database row to CorporateAccount type
   */
  private static mapAccount(row: Record<string, unknown>): CorporateAccount {
    return {
      id: row.id as string,
      corporateCode: row.corporate_code as string,
      companyName: row.company_name as string,
      tradingName: row.trading_name as string | null,
      registrationNumber: row.registration_number as string | null,
      vatNumber: row.vat_number as string | null,
      primaryContactName: row.primary_contact_name as string,
      primaryContactEmail: row.primary_contact_email as string,
      primaryContactPhone: row.primary_contact_phone as string | null,
      primaryContactPosition: row.primary_contact_position as string | null,
      billingContactName: row.billing_contact_name as string | null,
      billingContactEmail: row.billing_contact_email as string | null,
      billingContactPhone: row.billing_contact_phone as string | null,
      technicalContactName: row.technical_contact_name as string | null,
      technicalContactEmail: row.technical_contact_email as string | null,
      technicalContactPhone: row.technical_contact_phone as string | null,
      physicalAddress: row.physical_address as CorporateAccount['physicalAddress'],
      postalAddress: row.postal_address as CorporateAccount['postalAddress'],
      accountStatus: row.account_status as CorporateAccount['accountStatus'],
      creditLimit: Number(row.credit_limit) || 0,
      paymentTerms: Number(row.payment_terms) || 30,
      billingCycle: (row.billing_cycle as string) || 'monthly',
      totalSites: Number(row.total_sites) || 0,
      activeSites: Number(row.active_sites) || 0,
      pendingSites: Number(row.pending_sites) || 0,
      contractStartDate: row.contract_start_date as string | null,
      contractEndDate: row.contract_end_date as string | null,
      contractValue: row.contract_value ? Number(row.contract_value) : null,
      expectedSites: row.expected_sites ? Number(row.expected_sites) : null,
      industry: row.industry as string | null,
      notes: row.notes as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      createdBy: row.created_by as string | null,
    }
  }
}
