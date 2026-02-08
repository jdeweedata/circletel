/**
 * Shared Email Context Types
 *
 * Provides structured context interfaces for email templates to reduce
 * parameter explosion. Instead of 7-9 flat parameters, templates receive
 * organized context objects.
 *
 * @example
 * // Before: 9 parameters
 * ServiceActivatedEmail({ customerName, orderNumber, ... })
 *
 * // After: Structured context
 * ServiceActivatedEmail({ customer, order, service, package: pkg })
 */

/**
 * Customer context - Basic customer information
 */
export interface CustomerContext {
  /** Customer's display name */
  name: string;
  /** Customer's email address (optional, for personalization) */
  email?: string;
}

/**
 * Order context - Order identification and tracking
 */
export interface OrderContext {
  /** Order number (e.g., "ORD-2025-001") */
  number: string;
  /** URL to view order details */
  url?: string;
}

/**
 * Package context - Service package details
 */
export interface PackageContext {
  /** Package display name (e.g., "100Mbps Fibre Uncapped") */
  name: string;
  /** Speed description (e.g., "100Mbps Down / 50Mbps Up") */
  speed?: string;
  /** Monthly price in Rands (e.g., 799.00) */
  price?: number;
  /** Formatted price string (e.g., "R 799.00") */
  priceFormatted?: string;
}

/**
 * Service context - Active service credentials and account info
 */
export interface ServiceContext {
  /** Customer account number (e.g., "ACC-2025-ABC123") */
  accountNumber: string;
  /** PPPoE or portal username */
  username: string;
  /** Temporary password (must be changed on first login) */
  temporaryPassword: string;
}

/**
 * Contract context - Contract signing information
 */
export interface ContractContext {
  /** Contract number (e.g., "CT-2025-001") */
  number: string;
  /** Zoho Sign URL for digital signature */
  signUrl: string;
  /** Signature link expiry date (ISO string) */
  expiresAt: string;
}

/**
 * Quote context - B2B quote information
 */
export interface QuoteContext {
  /** Quote number (e.g., "QT-2025-001") */
  number: string;
  /** URL to view/accept quote */
  url: string;
  /** Total quote amount in Rands */
  amount?: number;
  /** Formatted amount string (e.g., "R 15,000.00") */
  amountFormatted?: string;
  /** Quote validity date (ISO string) */
  validUntil?: string;
}

/**
 * Installation context - Installation scheduling and location
 */
export interface InstallationContext {
  /** Scheduled installation date (ISO string) */
  date?: string;
  /** Installation address */
  address?: string;
}

/**
 * Pricing context - Fee breakdown for contracts/invoices
 */
export interface PricingContext {
  /** Monthly recurring fee in Rands */
  monthlyFee: number;
  /** One-time installation fee in Rands */
  installationFee: number;
}

/**
 * Agent context - Sales/support agent details (B2B)
 */
export interface AgentContext {
  /** Agent's full name */
  name: string;
  /** Agent's email address */
  email?: string;
  /** Agent's phone number */
  phone?: string;
}

/**
 * Company context - Business customer company info (B2B)
 */
export interface CompanyContext {
  /** Company name */
  name: string;
}

/**
 * KYC Verification context
 */
export interface KYCContext {
  /** Verification completion date (ISO string) */
  verificationDate: string;
  /** Risk tier from KYC assessment */
  riskTier: 'low' | 'medium' | 'high';
}

/**
 * Support URLs context - Common support/action links
 */
export interface SupportContext {
  /** Customer portal URL */
  portalUrl?: string;
  /** Support center URL */
  supportUrl?: string;
  /** Live chat URL */
  chatUrl?: string;
}

// =============================================================================
// Composite Props Types for Specific Email Templates
// =============================================================================

/**
 * Props for Service Activated email
 * Replaces 9 flat parameters with 4 context objects
 */
export interface ServiceActivatedEmailProps {
  customer: CustomerContext;
  order: OrderContext;
  service: ServiceContext;
  package: PackageContext;
  installation: Pick<InstallationContext, 'date'>;
  support: Pick<SupportContext, 'portalUrl'>;
}

/**
 * Props for Contract Ready email
 * Replaces 7 flat parameters with 3 context objects
 */
export interface ContractReadyEmailProps {
  customer: CustomerContext;
  contract: ContractContext;
  package: PackageContext;
  pricing: PricingContext;
}

/**
 * Props for KYC Completed email
 * Replaces 5 flat parameters with 3 context objects
 */
export interface KYCCompletedEmailProps {
  customer: CustomerContext;
  kyc: KYCContext;
  quote: Pick<QuoteContext, 'number' | 'url'>;
}

/**
 * Props for Order Confirmation email
 */
export interface OrderConfirmationEmailProps {
  customer: CustomerContext;
  order: OrderContext;
  package: PackageContext;
  installation: InstallationContext;
}

/**
 * Props for Quote Sent email (B2B)
 */
export interface QuoteSentEmailProps {
  customer: CustomerContext;
  company: CompanyContext;
  quote: QuoteContext;
  agent?: AgentContext;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a price number to South African Rand string
 */
export function formatPrice(amount: number): string {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format a date string to South African locale
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Create default customer context for email previews
 */
export function createDefaultCustomer(): CustomerContext {
  return {
    name: 'John Doe',
    email: 'john.doe@example.com',
  };
}

/**
 * Create default order context for email previews
 */
export function createDefaultOrder(): OrderContext {
  return {
    number: 'ORD-2025-001',
    url: 'https://www.circletel.co.za/order/123',
  };
}

/**
 * Create default package context for email previews
 */
export function createDefaultPackage(): PackageContext {
  return {
    name: '100Mbps Fibre Uncapped',
    speed: '100Mbps Down / 50Mbps Up',
    price: 799,
    priceFormatted: 'R 799.00',
  };
}

/**
 * Create default service context for email previews
 */
export function createDefaultService(): ServiceContext {
  return {
    accountNumber: 'ACC-2025-ABC123',
    username: 'john.doe@circletel.co.za',
    temporaryPassword: 'TempPass123!',
  };
}

/**
 * Create default contract context for email previews
 */
export function createDefaultContract(): ContractContext {
  return {
    number: 'CT-2025-001',
    signUrl: 'https://sign.zoho.com/sign/xyz123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Create default pricing context for email previews
 */
export function createDefaultPricing(): PricingContext {
  return {
    monthlyFee: 799,
    installationFee: 699,
  };
}
