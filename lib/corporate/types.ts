/**
 * Corporate Client Management Types
 *
 * Type definitions for corporate/enterprise client management system.
 * Supports parent-child account hierarchy for multi-site deployments.
 */

// ============================================================================
// Enums
// ============================================================================

export type CorporateAccountStatus = 'active' | 'suspended' | 'pending' | 'archived'

export type CorporateSiteStatus =
  | 'pending'       // Awaiting setup
  | 'ready'         // Ready for installation
  | 'provisioned'   // PPPoE credentials created
  | 'active'        // Service active
  | 'suspended'     // Service suspended
  | 'decommissioned' // Site removed

export type RFIStatus = 'not_ready' | 'pending' | 'approved'

export type AccessType = 'business_hours' | '24_7' | 'appointment'

// ============================================================================
// Address Types
// ============================================================================

export interface Address {
  street?: string
  city: string
  province?: string
  postal_code?: string
  suburb?: string
}

export interface Coordinates {
  lat: number
  lng: number
}

// ============================================================================
// Corporate Account Types
// ============================================================================

export interface CorporateAccount {
  id: string
  corporateCode: string
  companyName: string
  tradingName?: string | null
  registrationNumber?: string | null
  vatNumber?: string | null

  // Primary Contact
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone?: string | null
  primaryContactPosition?: string | null

  // Billing Contact
  billingContactName?: string | null
  billingContactEmail?: string | null
  billingContactPhone?: string | null

  // Technical Contact
  technicalContactName?: string | null
  technicalContactEmail?: string | null
  technicalContactPhone?: string | null

  // Address
  physicalAddress?: Address | null
  postalAddress?: Address | null

  // Status
  accountStatus: CorporateAccountStatus

  // Financial
  creditLimit: number
  paymentTerms: number
  billingCycle: string

  // Stats
  totalSites: number
  activeSites: number
  pendingSites: number

  // Contract
  contractStartDate?: string | null
  contractEndDate?: string | null
  contractValue?: number | null
  expectedSites?: number | null

  // Metadata
  industry?: string | null
  notes?: string | null

  // Timestamps
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export interface CreateCorporateAccountParams {
  corporateCode: string
  companyName: string
  tradingName?: string
  registrationNumber?: string
  vatNumber?: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone?: string
  primaryContactPosition?: string
  billingContactName?: string
  billingContactEmail?: string
  billingContactPhone?: string
  technicalContactName?: string
  technicalContactEmail?: string
  technicalContactPhone?: string
  physicalAddress?: Address
  postalAddress?: Address
  creditLimit?: number
  paymentTerms?: number
  billingCycle?: string
  contractStartDate?: string
  contractEndDate?: string
  contractValue?: number
  expectedSites?: number
  industry?: string
  notes?: string
  createdBy?: string
}

export interface UpdateCorporateAccountParams {
  companyName?: string
  tradingName?: string
  registrationNumber?: string
  vatNumber?: string
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  primaryContactPosition?: string
  billingContactName?: string
  billingContactEmail?: string
  billingContactPhone?: string
  technicalContactName?: string
  technicalContactEmail?: string
  technicalContactPhone?: string
  physicalAddress?: Address
  postalAddress?: Address
  accountStatus?: CorporateAccountStatus
  creditLimit?: number
  paymentTerms?: number
  billingCycle?: string
  contractStartDate?: string
  contractEndDate?: string
  contractValue?: number
  expectedSites?: number
  industry?: string
  notes?: string
}

// ============================================================================
// Corporate Site Types
// ============================================================================

export interface CorporateSite {
  id: string
  corporateId: string
  siteNumber: number
  accountNumber: string
  siteName: string
  siteCode?: string | null

  // Contact
  siteContactName?: string | null
  siteContactEmail?: string | null
  siteContactPhone?: string | null

  // Location
  installationAddress: Address
  province?: string | null
  coordinates?: Coordinates | null

  // Status
  status: CorporateSiteStatus

  // PPPoE
  pppoeCredentialId?: string | null
  pppoeUsername?: string | null

  // Service
  packageId?: string | null
  serviceId?: string | null
  monthlyFee?: number | null

  // Installation Checklist (RFI)
  hasRackFacility: boolean
  hasAccessControl: boolean
  hasAirConditioning: boolean
  hasAcPower: boolean
  rfiStatus: RFIStatus
  rfiNotes?: string | null

  // Site Access
  accessType: AccessType
  accessInstructions?: string | null
  landlordConsentUrl?: string | null

  // Installation Details
  installedAt?: string | null
  installedBy?: string | null
  routerSerial?: string | null
  routerModel?: string | null

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateCorporateSiteParams {
  corporateId: string
  siteName: string
  siteCode?: string
  siteContactName?: string
  siteContactEmail?: string
  siteContactPhone?: string
  installationAddress: Address
  province?: string
  coordinates?: Coordinates
  packageId?: string
  monthlyFee?: number
  hasRackFacility?: boolean
  hasAccessControl?: boolean
  hasAirConditioning?: boolean
  hasAcPower?: boolean
  rfiStatus?: RFIStatus
  rfiNotes?: string
  accessType?: AccessType
  accessInstructions?: string
  landlordConsentUrl?: string
}

export interface UpdateCorporateSiteParams {
  siteName?: string
  siteCode?: string
  siteContactName?: string
  siteContactEmail?: string
  siteContactPhone?: string
  installationAddress?: Address
  province?: string
  coordinates?: Coordinates
  status?: CorporateSiteStatus
  packageId?: string
  monthlyFee?: number
  hasRackFacility?: boolean
  hasAccessControl?: boolean
  hasAirConditioning?: boolean
  hasAcPower?: boolean
  rfiStatus?: RFIStatus
  rfiNotes?: string
  accessType?: AccessType
  accessInstructions?: string
  landlordConsentUrl?: string
  installedAt?: string
  installedBy?: string
  routerSerial?: string
  routerModel?: string
}

// ============================================================================
// Bulk Import Types
// ============================================================================

export interface BulkImportSiteRow {
  siteName: string
  siteCode?: string
  siteContactName?: string
  siteContactPhone?: string
  street?: string
  city: string
  province: string
  postalCode?: string
  monthlyFee?: number
}

export interface BulkImportResult {
  success: boolean
  totalRows: number
  successCount: number
  failedCount: number
  errors: Array<{
    row: number
    error: string
    data?: BulkImportSiteRow
  }>
  sites: CorporateSite[]
}

// ============================================================================
// PPPoE Bulk Types
// ============================================================================

export interface PPPoEBulkGenerateResult {
  success: boolean
  totalSites: number
  generatedCount: number
  failedCount: number
  errors: Array<{
    siteId: string
    siteName: string
    error: string
  }>
  credentials: Array<{
    siteId: string
    accountNumber: string
    username: string
    password: string
  }>
}

export interface PPPoEBulkProvisionResult {
  success: boolean
  totalSites: number
  provisionedCount: number
  failedCount: number
  errors: Array<{
    siteId: string
    accountNumber: string
    error: string
  }>
}

export interface PPPoEExportRow {
  siteName: string
  accountNumber: string
  pppoeUsername: string
  password: string
  address: string
  province: string
  status: CorporateSiteStatus
}

// ============================================================================
// List/Filter Types
// ============================================================================

export interface ListCorporatesParams {
  page?: number
  limit?: number
  status?: CorporateAccountStatus
  search?: string
  industry?: string
}

export interface ListSitesParams {
  corporateId: string
  page?: number
  limit?: number
  status?: CorporateSiteStatus
  province?: string
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
