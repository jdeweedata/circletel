// Order data structure
export interface OrderData {
  coverage: CoverageData;
  account: AccountData;
  contact: ContactData;
  installation: InstallationData;
  payment?: PaymentData;
}

export interface CoverageData {
  address?: string;
  coordinates?: { lat: number; lng: number };
  leadId?: string;
  selectedPackage?: PackageDetails;
  pricing?: PricingDetails;
}

export interface AccountData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType?: 'personal' | 'business';
  isAuthenticated?: boolean;
}

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
  price?: string;
  promotion_price?: string | null;
  promotion_months?: number | null;
  features?: string[];
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
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'eft' | 'debit_order';
  details?: Record<string, unknown>; // Payment provider specific
}

export interface PaymentData {
  orderId?: string;
  paymentReference?: string;
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  paymentDate?: Date;
  amount?: number;
}

// Order stages
export type OrderStage = 1 | 2 | 3 | 4 | 5;

export const STAGE_NAMES = ['Coverage', 'Account', 'Contact', 'Installation', 'Payment'] as const;
export const TOTAL_STAGES = 5;