/**
 * Profile Management Types
 * Types for customer preferences, service addresses, and physical addresses
 */

// =============================================================================
// Customer Preferences
// =============================================================================

export type LanguagePreference =
  | 'en'  // English
  | 'af'  // Afrikaans
  | 'zu'  // Zulu
  | 'xh'  // Xhosa
  | 'st'  // Sotho
  | 'tn'  // Tswana
  | 'ss'  // Swazi
  | 'nr'  // Ndebele
  | 've'  // Venda
  | 'ts'  // Tsonga
  | 'nd'; // Northern Ndebele

export type PreferredContactMethod = 'email' | 'phone' | 'sms' | 'whatsapp';

export interface CustomerPreferences {
  language_preference: LanguagePreference;
  preferred_contact_method: PreferredContactMethod;
  timezone: string;
}

// =============================================================================
// Service Addresses
// =============================================================================

export type ServiceType =
  | 'fibre'
  | 'copper'
  | 'voip'
  | 'lte'
  | 'wireless'
  | 'satellite';

export type InstallationStatus =
  | 'pending'
  | 'scheduled'
  | 'active'
  | 'inactive'
  | 'cancelled'
  | 'suspended';

export type SouthAfricanProvince =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Free State'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Northern Cape';

export interface ServiceAddress {
  id: string;
  customer_id: string;
  auth_user_id?: string;

  // Address Details
  location_name: string;
  service_type: ServiceType;
  street_address: string;
  suburb?: string;
  city: string;
  province: SouthAfricanProvince;
  postal_code: string;

  // Installation Details
  installation_date?: string;
  installation_status: InstallationStatus;

  // Flags
  is_primary: boolean;
  is_active: boolean;

  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceAddressPayload {
  location_name: string;
  service_type: ServiceType;
  street_address: string;
  suburb?: string;
  city: string;
  province: SouthAfricanProvince;
  postal_code: string;
  installation_date?: string;
  installation_status?: InstallationStatus;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateServiceAddressPayload extends Partial<CreateServiceAddressPayload> {
  is_active?: boolean;
}

// =============================================================================
// Physical Addresses (RICA & FICA Compliance)
// =============================================================================

export type AddressType = 'mailing' | 'billing' | 'both';

export type IDType = 'sa_id' | 'passport' | 'asylum_seeker' | 'refugee';

export type FICAStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'under_review';

export interface PhysicalAddress {
  id: string;
  customer_id: string;
  auth_user_id?: string;

  // Address Type
  address_type: AddressType;

  // Mailing Address
  mailing_street_address?: string;
  mailing_suburb?: string;
  mailing_city?: string;
  mailing_province?: SouthAfricanProvince;
  mailing_postal_code?: string;

  // Billing Address
  billing_same_as_mailing: boolean;
  billing_street_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: SouthAfricanProvince;
  billing_postal_code?: string;

  // RICA Compliance
  id_number?: string;
  id_type?: IDType;

  // FICA Compliance
  business_registration_number?: string;
  tax_reference_number?: string;
  fica_status: FICAStatus;
  fica_verified_at?: string;
  fica_verified_by?: string;
  fica_expiry_date?: string;

  // Flags
  is_primary: boolean;

  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePhysicalAddressPayload {
  address_type: AddressType;

  // Mailing Address (required for compliance)
  mailing_street_address: string;
  mailing_suburb?: string;
  mailing_city: string;
  mailing_province: SouthAfricanProvince;
  mailing_postal_code: string;

  // Billing Address (optional if same as mailing)
  billing_same_as_mailing?: boolean;
  billing_street_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: SouthAfricanProvince;
  billing_postal_code?: string;

  // RICA Compliance
  id_number?: string;
  id_type?: IDType;

  // FICA Compliance (for business accounts)
  business_registration_number?: string;
  tax_reference_number?: string;

  // Flags
  is_primary?: boolean;
  notes?: string;
}

export interface UpdatePhysicalAddressPayload extends Partial<CreatePhysicalAddressPayload> {}

// =============================================================================
// Profile Update Payloads
// =============================================================================

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  business_name?: string;
  business_registration?: string;
  tax_number?: string;
  language_preference?: LanguagePreference;
  preferred_contact_method?: PreferredContactMethod;
  timezone?: string;
}

// =============================================================================
// Helper Types
// =============================================================================

export interface ServiceAddressWithStatus extends ServiceAddress {
  statusBadge: {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  };
}

export interface PhysicalAddressWithCompliance extends PhysicalAddress {
  ficaBadge: {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
  };
  isCompliant: boolean;
}

// =============================================================================
// Language Display Names
// =============================================================================

export const LANGUAGE_NAMES: Record<LanguagePreference, string> = {
  en: 'English',
  af: 'Afrikaans',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  st: 'Sesotho',
  tn: 'Setswana',
  ss: 'siSwati',
  nr: 'isiNdebele',
  ve: 'Tshivenḓa',
  ts: 'Xitsonga',
  nd: 'isiNdebele (Northern)',
};

// =============================================================================
// Province Options
// =============================================================================

export const PROVINCES: SouthAfricanProvince[] = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

// =============================================================================
// Service Type Display Names
// =============================================================================

export const SERVICE_TYPE_NAMES: Record<ServiceType, string> = {
  fibre: 'Fibre',
  copper: 'Copper',
  voip: 'VOIP',
  lte: 'LTE',
  wireless: 'Wireless',
  satellite: 'Satellite',
};

// =============================================================================
// Installation Status Display Names
// =============================================================================

export const INSTALLATION_STATUS_NAMES: Record<InstallationStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  active: 'Active',
  inactive: 'Inactive',
  cancelled: 'Cancelled',
  suspended: 'Suspended',
};

// =============================================================================
// Helper Functions
// =============================================================================

export function getInstallationStatusBadge(status: InstallationStatus): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'green' };
    case 'scheduled':
      return { label: 'Scheduled', color: 'blue' };
    case 'pending':
      return { label: 'Pending', color: 'yellow' };
    case 'suspended':
      return { label: 'Suspended', color: 'yellow' };
    case 'inactive':
      return { label: 'Inactive', color: 'gray' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'red' };
    default:
      return { label: status, color: 'gray' };
  }
}

export function getFICAStatusBadge(status: FICAStatus): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
} {
  switch (status) {
    case 'verified':
      return { label: 'Verified', color: 'green' };
    case 'under_review':
      return { label: 'Under Review', color: 'blue' };
    case 'pending':
      return { label: 'Pending', color: 'yellow' };
    case 'expired':
      return { label: 'Expired', color: 'yellow' };
    case 'rejected':
      return { label: 'Rejected', color: 'red' };
    default:
      return { label: status, color: 'yellow' };
  }
}
