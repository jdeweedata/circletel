/**
 * Corporate Client Management Module
 *
 * Provides services for managing enterprise/corporate clients with
 * parent-child account structures (corporate → sites).
 *
 * @example
 * ```typescript
 * import { CorporateAccountService, CorporateSiteService, CorporatePPPoEBulkService } from '@/lib/corporate'
 *
 * // Create corporate account
 * const { account } = await CorporateAccountService.create({
 *   corporateCode: 'UNJ',
 *   companyName: 'Unjani Clinics NPC',
 *   primaryContactName: 'John Doe',
 *   primaryContactEmail: 'john@example.com',
 * })
 *
 * // Add site (account number auto-generated: CT-UNJ-001)
 * const { site } = await CorporateSiteService.create({
 *   corporateId: account.id,
 *   siteName: 'Unjani Clinic - Soweto',
 *   installationAddress: { city: 'Soweto', province: 'Gauteng' },
 * })
 *
 * // Generate PPPoE credentials
 * const result = await CorporatePPPoEBulkService.bulkGenerate([site.id])
 * // Result includes: { username: 'CT-UNJ-001@circletel.co.za', password: 'xYz123...' }
 * ```
 */

// Services
export { CorporateAccountService } from './corporate-service'
export { CorporateSiteService } from './site-service'
export { CorporatePPPoEBulkService } from './pppoe-bulk-service'

// Types
export type {
  // Enums
  CorporateAccountStatus,
  CorporateSiteStatus,
  RFIStatus,
  AccessType,

  // Common
  Address,
  Coordinates,

  // Corporate Account
  CorporateAccount,
  CreateCorporateAccountParams,
  UpdateCorporateAccountParams,

  // Corporate Site
  CorporateSite,
  CreateCorporateSiteParams,
  UpdateCorporateSiteParams,

  // Bulk Import
  BulkImportSiteRow,
  BulkImportResult,

  // PPPoE Bulk
  PPPoEBulkGenerateResult,
  PPPoEBulkProvisionResult,
  PPPoEExportRow,

  // List/Filter
  ListCorporatesParams,
  ListSitesParams,
  PaginatedResult,
} from './types'
