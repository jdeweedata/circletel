/**
 * PPPoE Encryption Service
 *
 * Provides AES-256-GCM encryption/decryption for PPPoE passwords.
 * Uses authenticated encryption to ensure data integrity.
 *
 * Environment Variable Required:
 * - PPPOE_ENCRYPTION_KEY: Base64-encoded 32-byte key
 *   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import crypto from 'crypto'

// Encryption constants
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits - recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const PASSWORD_LENGTH = 12 // 12 character passwords (24 hex chars from 12 bytes)

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

export interface DecryptParams {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Get the encryption key from environment variables
 * @throws Error if key is not configured or invalid
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.PPPOE_ENCRYPTION_KEY

  if (!keyBase64) {
    throw new Error(
      'PPPOE_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }

  const key = Buffer.from(keyBase64, 'base64')

  if (key.length !== 32) {
    throw new Error(
      `PPPOE_ENCRYPTION_KEY must be 32 bytes (256 bits). Got ${key.length} bytes. ` +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }

  return key
}

export class PPPoEEncryptionService {
  /**
   * Encrypt a password using AES-256-GCM
   *
   * @param password - The plaintext password to encrypt
   * @returns Object containing encrypted data, IV, and auth tag (all as hex strings)
   */
  static encrypt(password: string): EncryptedData {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })

    let encrypted = cipher.update(password, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    }
  }

  /**
   * Decrypt a password using AES-256-GCM
   *
   * @param data - Object containing encrypted data, IV, and auth tag
   * @returns The decrypted plaintext password
   * @throws Error if decryption fails (wrong key, tampered data, etc.)
   */
  static decrypt(data: DecryptParams): string {
    const key = getEncryptionKey()
    const iv = Buffer.from(data.iv, 'hex')
    const authTag = Buffer.from(data.authTag, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Generate a cryptographically secure random password
   *
   * @param length - Number of bytes (default 12, produces 24 hex characters)
   * @returns A random hex string password
   */
  static generatePassword(length: number = PASSWORD_LENGTH): string {
    // Generate random bytes and convert to hex
    // 12 bytes = 24 hex characters
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate a human-friendly password (alphanumeric, easier to read)
   *
   * @param length - Length of the password (default 12)
   * @returns A random alphanumeric password
   */
  static generateHumanFriendlyPassword(length: number = PASSWORD_LENGTH): string {
    // Exclude ambiguous characters: 0, O, I, l, 1
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const charsetLength = charset.length

    let password = ''
    const randomBytes = crypto.randomBytes(length)

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charsetLength]
    }

    return password
  }

  /**
   * Verify that the encryption key is properly configured
   * Useful for health checks and startup validation
   *
   * @returns true if key is valid
   * @throws Error if key is not configured or invalid
   */
  static verifyKeyConfiguration(): boolean {
    getEncryptionKey()
    return true
  }

  /**
   * Test encryption/decryption cycle
   * Useful for health checks
   *
   * @returns true if encryption/decryption works correctly
   */
  static testEncryption(): boolean {
    const testPassword = 'test_password_123'
    const encrypted = this.encrypt(testPassword)
    const decrypted = this.decrypt(encrypted)
    return decrypted === testPassword
  }
}
