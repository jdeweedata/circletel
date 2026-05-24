/**
 * Hardware Product Terms — Back-to-Back Logic
 *
 * Manages T&C mirroring between supplier terms and CircleTel product terms.
 * Handles term versioning, auto-detection of supplier term changes,
 * and default term templates from supplier legal documents.
 */

import { createClient } from '@/lib/supabase/server'
import type { HardwareProductTerms } from './types'

// =====================================================
// Types
// =====================================================

export interface TermsHistoryEntry {
  id: string
  hardware_product_id: string
  warranty_period: string | null
  return_policy: string | null
  refund_policy: string | null
  delivery_estimate: string | null
  warranty_notes: string | null
  is_back_to_back: boolean
  source_supplier_code: string | null
  source_supplier_warranty_months: number | null
  version: number
  change_description: string | null
  changed_by: string
  effective_from: string | null
  created_at: string
}

export interface SupplierDefaultTerms {
  id: string
  supplier_id: string
  supplier_name?: string
  supplier_code?: string
  default_warranty_period: string | null
  default_return_policy: string | null
  default_refund_policy: string | null
  default_delivery_estimate: string | null
  legal_disclaimer: string | null
  vat_note: string | null
  stock_note: string | null
  source_document: string | null
  extracted_at: string | null
}

export interface TermsChangeAlert {
  hardware_product_id: string
  product_name: string
  product_slug: string
  supplier_code: string
  field: string
  old_value: string | null
  new_value: string | null
}

// =====================================================
// Terms Management
// =====================================================

/**
 * Get current terms for a hardware product.
 */
export async function getCurrentTerms(
  hardwareProductId: string
): Promise<HardwareProductTerms | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hardware_product_terms')
    .select('*')
    .eq('hardware_product_id', hardwareProductId)
    .single()
  return (data as HardwareProductTerms) || null
}

/**
 * Get terms history for a hardware product.
 */
export async function getTermsHistory(
  hardwareProductId: string
): Promise<TermsHistoryEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hardware_product_terms_history')
    .select('*')
    .eq('hardware_product_id', hardwareProductId)
    .order('version', { ascending: false })
  return (data || []) as TermsHistoryEntry[]
}

/**
 * Update terms and auto-version (trigger handles history).
 */
export async function updateTerms(
  hardwareProductId: string,
  updates: Partial<HardwareProductTerms>
): Promise<HardwareProductTerms> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hardware_product_terms')
    .update(updates)
    .eq('hardware_product_id', hardwareProductId)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update terms: ${error.message}`)
  return data as HardwareProductTerms
}

/**
 * Create initial terms for a product from supplier defaults.
 */
export async function createBackToBackTerms(
  hardwareProductId: string,
  supplierCode: string,
  warrantyMonths?: number | null,
  overrides?: Partial<HardwareProductTerms>
): Promise<HardwareProductTerms> {
  const supabase = await createClient()

  // Get supplier default terms
  const { data: defaults } = await supabase
    .from('supplier_default_terms')
    .select(
      `
      default_warranty_period,
      default_return_policy,
      default_refund_policy,
      default_delivery_estimate,
      supplier:suppliers (code, name)
    `
    )
    .eq('supplier.code', supplierCode)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dt = defaults as any

  const { data, error } = await supabase
    .from('hardware_product_terms')
    .insert({
      hardware_product_id: hardwareProductId,
      warranty_period:
        overrides?.warranty_period ||
        (warrantyMonths
          ? `${warrantyMonths} months manufacturer warranty`
          : dt?.default_warranty_period || null),
      return_policy:
        overrides?.return_policy || dt?.default_return_policy || null,
      refund_policy:
        overrides?.refund_policy || dt?.default_refund_policy || null,
      delivery_estimate:
        overrides?.delivery_estimate ||
        dt?.default_delivery_estimate ||
        null,
      is_back_to_back: overrides?.is_back_to_back ?? true,
      source_supplier_code: supplierCode,
      source_supplier_warranty_months: warrantyMonths || null,
      effective_from: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create terms: ${error.message}`)
  return data as HardwareProductTerms
}

// =====================================================
// Supplier Default Terms
// =====================================================

/**
 * Get all supplier default terms templates.
 */
export async function getSupplierDefaultTerms(): Promise<
  SupplierDefaultTerms[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('supplier_default_terms')
    .select(
      `
      *,
      supplier:suppliers (code, name)
    `
    )
    .order('created_at')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    ...row,
    supplier_name: row.supplier?.name,
    supplier_code: row.supplier?.code,
  }))
}

/**
 * Update supplier default terms template.
 */
export async function updateSupplierDefaultTerms(
  supplierId: string,
  updates: Partial<SupplierDefaultTerms>
): Promise<SupplierDefaultTerms> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_default_terms')
    .update(updates)
    .eq('supplier_id', supplierId)
    .select('*')
    .single()

  if (error)
    throw new Error(
      `Failed to update supplier terms: ${error.message}`
    )
  return data as SupplierDefaultTerms
}

// =====================================================
// Post-Sync: Detect Supplier Term Changes
// =====================================================

/**
 * After a supplier sync, check all linked hardware products for
 * term changes (warranty months, description changes that might
 * indicate new terms). Returns alerts for products needing review.
 */
export async function detectSupplierTermChanges(
  supplierCode: string
): Promise<TermsChangeAlert[]> {
  const supabase = await createClient()
  const alerts: TermsChangeAlert[] = []

  // Get hardware products linked to this supplier
  const { data: links } = await supabase
    .from('hardware_product_suppliers')
    .select(
      `
      hardware_product_id,
      supplier_product_id,
      hardware_product:circletel_hardware_products (
        id, name, slug, warranty_months
      ),
      terms:hardware_product_terms (
        warranty_period,
        source_supplier_warranty_months
      )
    `
    )
    .not('supplier_product_id', 'is', null)

  if (!links) return alerts

  for (const link of links) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = link as any

    // Get current supplier product warranty
    const { data: sp } = await supabase
      .from('supplier_products')
      .select('specifications')
      .eq('id', l.supplier_product_id)
      .single()

    if (!sp) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specs = (sp.specifications || {}) as Record<string, any>
    const currentWarranty = specs.warranty_months || null
    const previousWarranty =
      l.terms?.source_supplier_warranty_months || null

    if (
      currentWarranty !== null &&
      currentWarranty !== previousWarranty
    ) {
      const hw = l.hardware_product
      alerts.push({
        hardware_product_id: hw.id,
        product_name: hw.name,
        product_slug: hw.slug,
        supplier_code: supplierCode,
        field: 'warranty_months',
        old_value: previousWarranty
          ? `${previousWarranty} months`
          : null,
        new_value: `${currentWarranty} months`,
      })
    }
  }

  return alerts
}

/**
 * Apply detected term changes to hardware product terms.
 * Updates warranty period if back-to-back is enabled.
 */
export async function applyTermChanges(
  alert: TermsChangeAlert
): Promise<boolean> {
  const supabase = await createClient()

  if (alert.field === 'warranty_months') {
    const warrantyMonths = parseInt(
      alert.new_value?.replace(' months', '') || '0',
      10
    )

    await supabase
      .from('hardware_product_terms')
      .update({
        warranty_period: `${warrantyMonths} months manufacturer warranty`,
        source_supplier_warranty_months: warrantyMonths,
      })
      .eq('hardware_product_id', alert.hardware_product_id)
      .eq('is_back_to_back', true)

    return true
  }

  return false
}
