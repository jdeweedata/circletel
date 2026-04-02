import { LocationType } from '@/lib/types/location-type';

// Order data structure - New 3-step journey
export interface OrderData {
  kyc?: KycData;
  coverage: CoverageData;
  package: PackageSelectionData;
  account: AccountData;
  // Legacy fields (still supported for backward compatibility)
  contact?: ContactData;
  installation?: InstallationData;
  payment?: PaymentData;
}

export interface CoverageData {
  address?: string;
  coordinates?: { lat: number; lng: number };
  leadId?: string;
  availableServices?: string[];
  locationType?: LocationType;
  coverageType?: string;
  propertyType?: string;
  // Selected package stored with coverage (legacy pattern)
  selectedPackage?: PackageDetails;
  // Bundle product preselection (from product page CTA)
  selectedBundle?: BundleProduct;
}

// Arlan bundle products
export type BundleProductSlug = 'business-complete' | 'remote-plus' | 'venue-plus';

export interface BundleProduct {
  slug: BundleProductSlug;
  name: string;
  category: 'business' | 'soho';
}

export interface PackageSelectionData {
  selectedPackage?: PackageDetails;
  pricing?: PricingDetails;
  selectedAddons?: SelectedAddon[];
}

// Product add-on types
export interface ProductAddon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  price_incl_vat: number;
  price_type: 'monthly' | 'once-off';
  compatible_product_categories: string[];
  icon: string | null;
  sort_order: number;
}

export interface SelectedAddon {
  addon: ProductAddon;
  quantity: number;
}

export interface AccountData {
  // Authentication
  email?: string;
  password?: string;
  isAuthenticated?: boolean;

  // Personal Info
  firstName?: string;
  lastName?: string;
  phone?: string;
  idNumber?: string;

  // Account Type
  accountType?: 'personal' | 'business';
  businessName?: string;
  businessRegistration?: string;
  taxNumber?: string;

  // Installation Details
  installationAddress?: Address;
  installationLocationType?: LocationType | string;
  preferredInstallationDate?: Date;
  alternativeInstallationDate?: Date;
  onsiteContact?: {
    name: string;
    phone: string;
    isAccountHolder: boolean;
  };
  specialInstructions?: string;

  // Payment
  paymentMethod?: PaymentMethod;
  termsAccepted?: boolean;
}

// Legacy types (deprecated but still supported)
export interface ContactData {
  customerType?: 'personal' | 'business';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessName?: string;
  businessRegistration?: string;
  taxNumber?: string;
  billingAddress?: Address;
}

export interface InstallationData {
  preferredDate?: Date;
  alternativeDate?: Date;
  locationType?: LocationType;
  onsiteContact?: {
    name: string;
    phone: string;
    isAccountHolder: boolean;
  };
  specialInstructions?: string;
  paymentMethod?: PaymentMethod;
  termsAccepted?: boolean;
}

export interface ValidationErrors {
  [key: string]: string[];
}

// Supporting types
export interface PackageDetails {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  onceOffPrice?: number;
  speed: string;
  type?: 'fibre' | 'wireless' | 'mobile';
  service_type?: string;
  product_category?: string;
  speed_down?: number;
  speed_up?: number;
  price?: string | number;
  promotion_price?: string | number | null;
  promotion_months?: number | null;
  features?: string[];
  installation_fee?: number;
  router_included?: boolean;
  activation_fee?: number;
  delivery_fee?: number;
  data_limit?: string;
}

export interface PricingDetails {
  monthly: number;
  onceOff: number;
  vatIncluded: boolean;
  breakdown: FeeBreakdown[];
}

export interface FeeBreakdown {
  name: string;
  amount: number;
  type: 'monthly' | 'once_off';
}

export interface Address {
  street: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'eft' | 'debit_order';
  details?: Record<string, unknown>; // Payment provider specific
}

export interface PaymentData {
  customerId?: string;
  orderId?: string;
  paymentReference?: string;
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  paymentDate?: Date;
  amount?: number;
}

// Order stages - 3-step journey (Location → Choose Plan → Account & Pay)
export type OrderStage = 1 | 2 | 3;
export type OrderStageId = 'coverage' | 'packages' | 'checkout';

export const STAGE_NAMES = ['Location', 'Choose Plan', 'Account & Pay'] as const;
export const TOTAL_STAGES = 3;

export const STAGE_IDS: OrderStageId[] = ['coverage', 'packages', 'checkout'];

export const getStageId = (stage: OrderStage): OrderStageId => {
  const map: Record<OrderStage, OrderStageId> = {
    1: 'coverage',
    2: 'packages',
    3: 'checkout',
  };
  return map[stage];
};

export const getStageNumber = (stageId: OrderStageId): OrderStage => {
  const map: Record<OrderStageId, OrderStage> = {
    coverage: 1,
    packages: 2,
    checkout: 3,
  };
  return map[stageId];
};

// Legacy 5-stage support (deprecated, for backward compatibility)
export type LegacyOrderStage = 1 | 2 | 3 | 4 | 5;
export const LEGACY_STAGE_NAMES = ['Coverage', 'Account', 'Contact', 'Installation', 'Payment'] as const;
export const LEGACY_TOTAL_STAGES = 5;

// KYC Verification Data
export interface KycData {
  verificationStatus?: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: Date;
  rejectionReason?: string;
  idDocumentUploaded?: boolean;
  proofOfAddressUploaded?: boolean;
  bankStatementUploaded?: boolean;
  companyRegistrationUploaded?: boolean;
  documentsUploaded?: boolean;
}

// KYC Helper Functions
export function hasRequiredKycDocuments(kycData: KycData, accountType: 'personal' | 'business' = 'personal'): boolean {
  const hasIdDocument = kycData?.idDocumentUploaded === true;
  const hasProofOfAddress = kycData?.proofOfAddressUploaded === true;

  if (accountType === 'business') {
    return hasIdDocument && hasProofOfAddress && (kycData?.companyRegistrationUploaded === true);
  }

  return hasIdDocument && hasProofOfAddress;
}

export function getKycStatusDisplay(status?: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'under_review':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Not Submitted';
  }
}

export function isKycApproved(kycData?: KycData): boolean {
  return kycData?.verificationStatus === 'approved';
}
