/**
 * PPPoE Module
 *
 * Provides PPPoE credential management for CircleTel customers.
 * Includes encrypted password storage and Interstellio provisioning.
 */

export { PPPoEEncryptionService, type EncryptedData, type DecryptParams } from './encryption-service'

export {
  PPPoECredentialService,
  type CreatePPPoEParams,
  type PPPoECredential,
  type PPPoECredentialWithCustomer,
  type AuditLogParams,
} from './credential-service'
