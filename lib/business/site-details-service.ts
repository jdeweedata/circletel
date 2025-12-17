/**
 * Site Details Service
 *
 * Business logic for managing B2B customer site details and RFI status.
 *
 * @module lib/business/site-details-service
 */

import { createClient } from '@/lib/supabase/server';
import {
  SiteDetails,
  SiteDetailsFormData,
  RFIStatus,
  SiteDetailsStatus,
  SitePhoto,
  calculateRFIStatus,
  RFISummary,
} from '@/types/site-details';

// ============================================================================
// Types
// ============================================================================

export interface CreateSiteDetailsInput {
  business_customer_id: string;
  quote_id?: string;
  journey_stage_id?: string;
  data: SiteDetailsFormData;
  photos: SitePhoto[];
}

export interface UpdateSiteDetailsInput {
  id: string;
  data: Partial<SiteDetailsFormData>;
  photos?: SitePhoto[];
}

export interface SiteDetailsWithRFI extends SiteDetails {
  rfi_summary: RFISummary;
}

// ============================================================================
// Site Details Service
// ============================================================================

export class SiteDetailsService {
  /**
   * Get site details for a business customer
   */
  static async getSiteDetails(
    businessCustomerId: string,
    quoteId?: string
  ): Promise<SiteDetailsWithRFI | null> {
    const supabase = await createClient();

    let query = supabase
      .from('business_site_details')
      .select('*')
      .eq('business_customer_id', businessCustomerId);

    if (quoteId) {
      query = query.eq('quote_id', quoteId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      console.error('Error fetching site details:', error);
      throw new Error('Failed to fetch site details');
    }

    return this.enrichWithRFISummary(data as SiteDetails);
  }

  /**
   * Get site details by ID
   */
  static async getSiteDetailsById(id: string): Promise<SiteDetailsWithRFI | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_site_details')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching site details:', error);
      throw new Error('Failed to fetch site details');
    }

    return this.enrichWithRFISummary(data as SiteDetails);
  }

  /**
   * Create new site details
   */
  static async createSiteDetails(input: CreateSiteDetailsInput): Promise<SiteDetailsWithRFI> {
    const supabase = await createClient();

    const { data, photos, business_customer_id, quote_id, journey_stage_id } = input;

    // Build the insert data
    const insertData = {
      business_customer_id,
      quote_id: quote_id || null,
      journey_stage_id: journey_stage_id || null,

      // Premises Information
      premises_ownership: data.premises_ownership,
      property_type: data.property_type,
      building_name: data.building_name || null,
      floor_level: data.floor_level || null,
      installation_address: data.use_different_address ? data.installation_address : null,

      // Equipment Location
      room_name: data.room_name,
      equipment_location: data.equipment_location,
      cable_entry_point: data.cable_entry_point || null,

      // RFI Checklist
      has_rack_facility: data.has_rack_facility,
      has_access_control: data.has_access_control,
      has_air_conditioning: data.has_air_conditioning,
      has_ac_power: data.has_ac_power,
      rfi_notes: data.rfi_notes || null,

      // Access Information
      access_type: data.access_type,
      access_instructions: data.access_instructions || null,

      // Building Manager
      building_manager_name: data.building_manager_name || null,
      building_manager_phone: data.building_manager_phone || null,
      building_manager_email: data.building_manager_email || null,

      // Landlord (for leased premises)
      landlord_name: data.landlord_name || null,
      landlord_contact: data.landlord_contact || null,

      // Documentation
      site_photos: photos,

      // Status
      status: 'draft',
    };

    const { data: created, error } = await supabase
      .from('business_site_details')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating site details:', error);
      throw new Error('Failed to create site details');
    }

    return this.enrichWithRFISummary(created as SiteDetails);
  }

  /**
   * Update existing site details
   */
  static async updateSiteDetails(input: UpdateSiteDetailsInput): Promise<SiteDetailsWithRFI> {
    const supabase = await createClient();

    const { id, data, photos } = input;

    // Build update data (only include defined fields)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.premises_ownership !== undefined) updateData.premises_ownership = data.premises_ownership;
    if (data.property_type !== undefined) updateData.property_type = data.property_type;
    if (data.building_name !== undefined) updateData.building_name = data.building_name || null;
    if (data.floor_level !== undefined) updateData.floor_level = data.floor_level || null;
    if (data.installation_address !== undefined) {
      updateData.installation_address = data.use_different_address ? data.installation_address : null;
    }
    if (data.room_name !== undefined) updateData.room_name = data.room_name;
    if (data.equipment_location !== undefined) updateData.equipment_location = data.equipment_location;
    if (data.cable_entry_point !== undefined) updateData.cable_entry_point = data.cable_entry_point || null;
    if (data.has_rack_facility !== undefined) updateData.has_rack_facility = data.has_rack_facility;
    if (data.has_access_control !== undefined) updateData.has_access_control = data.has_access_control;
    if (data.has_air_conditioning !== undefined) updateData.has_air_conditioning = data.has_air_conditioning;
    if (data.has_ac_power !== undefined) updateData.has_ac_power = data.has_ac_power;
    if (data.rfi_notes !== undefined) updateData.rfi_notes = data.rfi_notes || null;
    if (data.access_type !== undefined) updateData.access_type = data.access_type;
    if (data.access_instructions !== undefined) updateData.access_instructions = data.access_instructions || null;
    if (data.building_manager_name !== undefined) updateData.building_manager_name = data.building_manager_name || null;
    if (data.building_manager_phone !== undefined) updateData.building_manager_phone = data.building_manager_phone || null;
    if (data.building_manager_email !== undefined) updateData.building_manager_email = data.building_manager_email || null;
    if (data.landlord_name !== undefined) updateData.landlord_name = data.landlord_name || null;
    if (data.landlord_contact !== undefined) updateData.landlord_contact = data.landlord_contact || null;

    if (photos !== undefined) updateData.site_photos = photos;

    const { data: updated, error } = await supabase
      .from('business_site_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating site details:', error);
      throw new Error('Failed to update site details');
    }

    return this.enrichWithRFISummary(updated as SiteDetails);
  }

  /**
   * Submit site details for review
   */
  static async submitSiteDetails(id: string): Promise<SiteDetailsWithRFI> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_site_details')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error submitting site details:', error);
      throw new Error('Failed to submit site details');
    }

    return this.enrichWithRFISummary(data as SiteDetails);
  }

  /**
   * Admin: Approve site details
   */
  static async approveSiteDetails(
    id: string,
    verifiedBy: string,
    notes?: string
  ): Promise<SiteDetailsWithRFI> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      status: 'approved',
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.admin_notes = notes;
    }

    const { data, error } = await supabase
      .from('business_site_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving site details:', error);
      throw new Error('Failed to approve site details');
    }

    return this.enrichWithRFISummary(data as SiteDetails);
  }

  /**
   * Admin: Reject site details
   */
  static async rejectSiteDetails(
    id: string,
    reason: string,
    notes?: string
  ): Promise<SiteDetailsWithRFI> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.admin_notes = notes;
    }

    const { data, error } = await supabase
      .from('business_site_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting site details:', error);
      throw new Error('Failed to reject site details');
    }

    return this.enrichWithRFISummary(data as SiteDetails);
  }

  /**
   * Admin: Record landlord consent
   */
  static async recordLandlordConsent(
    id: string,
    consentUrl: string
  ): Promise<SiteDetailsWithRFI> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_site_details')
      .update({
        landlord_consent_url: consentUrl,
        landlord_consent_signed: true,
        landlord_consent_signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error recording landlord consent:', error);
      throw new Error('Failed to record landlord consent');
    }

    return this.enrichWithRFISummary(data as SiteDetails);
  }

  /**
   * Get all site details for admin view with filtering
   */
  static async getAllSiteDetails(options?: {
    rfi_status?: RFIStatus;
    status?: SiteDetailsStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: SiteDetailsWithRFI[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('business_site_details')
      .select('*, business_customers!inner(company_name, account_number)', { count: 'exact' });

    if (options?.rfi_status) {
      query = query.eq('rfi_status', options.rfi_status);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching site details list:', error);
      throw new Error('Failed to fetch site details');
    }

    const enrichedData = (data || []).map((item) =>
      this.enrichWithRFISummary(item as SiteDetails)
    );

    return {
      data: enrichedData,
      total: count || 0,
    };
  }

  /**
   * Add RFI summary to site details
   */
  private static enrichWithRFISummary(siteDetails: SiteDetails): SiteDetailsWithRFI {
    const rfi_summary = calculateRFIStatus(
      siteDetails.has_rack_facility,
      siteDetails.has_access_control,
      siteDetails.has_air_conditioning,
      siteDetails.has_ac_power
    );

    return {
      ...siteDetails,
      rfi_summary,
    };
  }

  /**
   * Check if site details can advance journey
   * (RFI ready OR admin override)
   */
  static canAdvanceJourney(siteDetails: SiteDetails): {
    canAdvance: boolean;
    reason: string;
  } {
    // Check if approved by admin
    if (siteDetails.status === 'approved') {
      return { canAdvance: true, reason: 'Site details approved by admin' };
    }

    // Check RFI status
    if (siteDetails.rfi_status === 'ready') {
      return { canAdvance: true, reason: 'All RFI requirements met' };
    }

    // Check if leased and landlord consent pending
    if (
      siteDetails.premises_ownership === 'leased' &&
      !siteDetails.landlord_consent_signed
    ) {
      return {
        canAdvance: false,
        reason: 'Landlord consent required for leased premises',
      };
    }

    // Pending or not ready - needs admin review
    return {
      canAdvance: false,
      reason: `RFI status: ${siteDetails.rfi_status}. Admin review required.`,
    };
  }
}
