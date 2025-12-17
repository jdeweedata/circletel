/**
 * Site Details Types
 *
 * TypeScript interfaces for B2B customer site details and RFI (Ready for Installation) checklist.
 *
 * @module types/site-details
 */

// ============================================================================
// Enums
// ============================================================================

export type PremisesOwnership = 'owned' | 'leased';

export type PropertyType =
  | 'office'
  | 'retail'
  | 'warehouse'
  | 'industrial'
  | 'data_center'
  | 'mixed_use'
  | 'other';

export type EquipmentLocation =
  | 'rack_mounted'
  | 'wall_mounted'
  | 'floor_standing'
  | 'other';

export type SiteAccessType = '24_7' | 'business_hours' | 'appointment_only';

export type RFIStatus = 'ready' | 'pending' | 'not_ready';

export type SiteDetailsStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

// ============================================================================
// Address Interface
// ============================================================================

export interface InstallationAddress {
  street: string;
  suburb?: string;
  city: string;
  province: string;
  postal_code: string;
}

// ============================================================================
// Site Photo Interface
// ============================================================================

export interface SitePhoto {
  url: string;
  filename: string;
  uploaded_at: string;
  description?: string;
}

// ============================================================================
// RFI Checklist Item Interface
// ============================================================================

export interface RFIChecklistItem {
  id: string;
  label: string;
  description: string;
  value: boolean;
}

// ============================================================================
// Main Site Details Interface
// ============================================================================

export interface SiteDetails {
  id: string;
  business_customer_id: string;
  journey_stage_id?: string | null;
  quote_id?: string | null;

  // Premises Information
  premises_ownership: PremisesOwnership;
  property_type: PropertyType;
  building_name?: string | null;
  floor_level?: string | null;
  installation_address?: InstallationAddress | null;

  // Equipment Location
  room_name: string;
  equipment_location: EquipmentLocation;
  cable_entry_point?: string | null;

  // RFI Checklist
  has_rack_facility: boolean;
  has_access_control: boolean;
  has_air_conditioning: boolean;
  has_ac_power: boolean;
  rfi_status: RFIStatus;
  rfi_notes?: string | null;

  // Access Information
  access_type: SiteAccessType;
  access_instructions?: string | null;

  // Building Manager (required if leased)
  building_manager_name?: string | null;
  building_manager_phone?: string | null;
  building_manager_email?: string | null;

  // Documentation
  site_photos: SitePhoto[];
  building_access_form_url?: string | null;

  // Landlord Consent (required for leased premises)
  landlord_consent_url?: string | null;
  landlord_consent_signed: boolean;
  landlord_consent_signed_at?: string | null;
  landlord_name?: string | null;
  landlord_contact?: string | null;

  // Status & Workflow
  status: SiteDetailsStatus;
  admin_notes?: string | null;
  rejection_reason?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
}

// ============================================================================
// Form Data Interface (for form submission)
// ============================================================================

export interface SiteDetailsFormData {
  // Premises Information
  premises_ownership: PremisesOwnership;
  property_type: PropertyType;
  building_name?: string;
  floor_level?: string;
  use_different_address: boolean;
  installation_address?: InstallationAddress;

  // Equipment Location
  room_name: string;
  equipment_location: EquipmentLocation;
  cable_entry_point?: string;

  // RFI Checklist
  has_rack_facility: boolean;
  has_access_control: boolean;
  has_air_conditioning: boolean;
  has_ac_power: boolean;
  rfi_notes?: string;

  // Access Information
  access_type: SiteAccessType;
  access_instructions?: string;

  // Building Manager
  building_manager_name?: string;
  building_manager_phone?: string;
  building_manager_email?: string;

  // Landlord Consent (for leased premises)
  landlord_name?: string;
  landlord_contact?: string;

  // Photos (handled separately via upload)
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SiteDetailsResponse {
  success: boolean;
  data?: SiteDetails;
  error?: string;
  message?: string;
}

export interface SiteDetailsListResponse {
  success: boolean;
  data?: SiteDetails[];
  total?: number;
  error?: string;
}

// ============================================================================
// RFI Summary Type (for dashboard display)
// ============================================================================

export interface RFISummary {
  status: RFIStatus;
  passed_count: number;
  total_count: number;
  items: {
    has_rack_facility: boolean;
    has_access_control: boolean;
    has_air_conditioning: boolean;
    has_ac_power: boolean;
  };
  missing_items: string[];
}

// ============================================================================
// Display Labels
// ============================================================================

export const PREMISES_OWNERSHIP_LABELS: Record<PremisesOwnership, string> = {
  owned: 'Owned',
  leased: 'Leased',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  office: 'Office Building',
  retail: 'Retail / Shop',
  warehouse: 'Warehouse',
  industrial: 'Industrial Facility',
  data_center: 'Data Center',
  mixed_use: 'Mixed Use',
  other: 'Other',
};

export const EQUIPMENT_LOCATION_LABELS: Record<EquipmentLocation, string> = {
  rack_mounted: 'Rack Mounted',
  wall_mounted: 'Wall Mounted',
  floor_standing: 'Floor Standing',
  other: 'Other',
};

export const ACCESS_TYPE_LABELS: Record<SiteAccessType, string> = {
  '24_7': '24/7 Access',
  business_hours: 'Business Hours Only',
  appointment_only: 'By Appointment Only',
};

export const RFI_STATUS_LABELS: Record<RFIStatus, string> = {
  ready: 'Ready for Installation',
  pending: 'Pending Review',
  not_ready: 'Not Ready',
};

export const SITE_DETAILS_STATUS_LABELS: Record<SiteDetailsStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

// ============================================================================
// RFI Checklist Configuration
// ============================================================================

export const RFI_CHECKLIST_CONFIG = [
  {
    id: 'has_rack_facility',
    label: 'Rack or Facility Available',
    description: 'Is there a rack or facility available to install the equipment?',
    helpText: 'This includes server racks, network cabinets, or dedicated mounting space.',
  },
  {
    id: 'has_access_control',
    label: 'Access Control Documented',
    description: 'Is there access control to the room/facility?',
    helpText: 'Access procedures, key cards, or security requirements for the installation area.',
  },
  {
    id: 'has_air_conditioning',
    label: 'Air Conditioning / Ventilation',
    description: 'Is the room air-conditioned or well ventilated?',
    helpText: 'Equipment requires proper cooling to operate reliably.',
  },
  {
    id: 'has_ac_power',
    label: 'AC Power Available',
    description: 'Is there a 220V 50Hz AC power plug for the PSU?',
    helpText: 'Standard South African power outlet required for our Power Supply Unit.',
  },
] as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate RFI status from checklist values
 */
export function calculateRFIStatus(
  has_rack_facility: boolean,
  has_access_control: boolean,
  has_air_conditioning: boolean,
  has_ac_power: boolean
): RFISummary {
  const items = {
    has_rack_facility,
    has_access_control,
    has_air_conditioning,
    has_ac_power,
  };

  const passed_count = Object.values(items).filter(Boolean).length;
  const total_count = 4;

  let status: RFIStatus;
  if (passed_count === 4) {
    status = 'ready';
  } else if (passed_count === 0) {
    status = 'not_ready';
  } else {
    status = 'pending';
  }

  const missing_items: string[] = [];
  if (!has_rack_facility) missing_items.push('Rack or facility');
  if (!has_access_control) missing_items.push('Access control');
  if (!has_air_conditioning) missing_items.push('Air conditioning/ventilation');
  if (!has_ac_power) missing_items.push('220V 50Hz AC power');

  return {
    status,
    passed_count,
    total_count,
    items,
    missing_items,
  };
}

/**
 * Check if building manager info is required
 */
export function isBuildingManagerRequired(
  premises_ownership: PremisesOwnership
): boolean {
  return premises_ownership === 'leased';
}

/**
 * Check if landlord consent is required
 */
export function isLandlordConsentRequired(
  premises_ownership: PremisesOwnership
): boolean {
  return premises_ownership === 'leased';
}

/**
 * Validate site details for submission
 */
export function validateSiteDetailsForSubmission(
  data: SiteDetailsFormData,
  photos: SitePhoto[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.premises_ownership) errors.push('Premises ownership is required');
  if (!data.property_type) errors.push('Property type is required');
  if (!data.room_name) errors.push('Room/area name is required');
  if (!data.equipment_location) errors.push('Equipment location is required');
  if (!data.access_type) errors.push('Access type is required');

  // Photos required (minimum 1)
  if (photos.length === 0) {
    errors.push('At least one site photo is required');
  }

  // Building manager required for leased premises
  if (data.premises_ownership === 'leased') {
    if (!data.building_manager_name) {
      errors.push('Building manager name is required for leased premises');
    }
    if (!data.building_manager_phone && !data.building_manager_email) {
      errors.push('Building manager contact (phone or email) is required for leased premises');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
