/**
 * MikroTik Encryption Service
 *
 * Provides AES-256-GCM encryption/decryption for MikroTik credentials.
 * Extends the pattern from PPPoEEncryptionService.
 *
 * Environment Variable Required:
 * - MIKROTIK_ENCRYPTION_KEY: Base64-encoded 32-byte key
 *   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * @module lib/mikrotik/encryption-service
 */

import crypto from 'crypto';

// Encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits - recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypted data structure stored in database
 */
export interface EncryptedCredential {
  encrypted: string;
  iv: string;
  authTag: string;
}

/**
 * Parameters for decryption
 */
export interface DecryptParams {
  encrypted: string;
  iv: string;
  authTag: string;
}

/**
 * Get the encryption key from environment variables
 * @throws Error if key is not configured or invalid
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.MIKROTIK_ENCRYPTION_KEY;

  if (!keyBase64) {
    throw new Error(
      'MIKROTIK_ENCRYPTION_KEY environment variable is not set. ' +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }

  const key = Buffer.from(keyBase64, 'base64');

  if (key.length !== 32) {
    throw new Error(
      `MIKROTIK_ENCRYPTION_KEY must be 32 bytes (256 bits). Got ${key.length} bytes. ` +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }

  return key;
}

export class MikrotikEncryptionService {
  /**
   * Encrypt a credential using AES-256-GCM
   *
   * @param plaintext - The plaintext credential to encrypt
   * @returns Object containing encrypted data, IV, and auth tag (all as hex strings)
   */
  static encrypt(plaintext: string): EncryptedCredential {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt a credential using AES-256-GCM
   *
   * @param data - Object containing encrypted data, IV, and auth tag
   * @returns The decrypted plaintext credential
   * @throws Error if decryption fails (wrong key, tampered data, etc.)
   */
  static decrypt(data: DecryptParams): string {
    const key = getEncryptionKey();
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt router credentials for database storage
   *
   * @param pppoePassword - PPPoE password
   * @param routerPassword - Router admin password
   * @param wifiPassword - Optional WiFi password
   */
  static encryptRouterCredentials(
    pppoePassword: string,
    routerPassword: string,
    wifiPassword?: string
  ): {
    pppoe: EncryptedCredential;
    router: EncryptedCredential;
    wifi?: EncryptedCredential;
  } {
    const result: {
      pppoe: EncryptedCredential;
      router: EncryptedCredential;
      wifi?: EncryptedCredential;
    } = {
      pppoe: this.encrypt(pppoePassword),
      router: this.encrypt(routerPassword),
    };

    if (wifiPassword) {
      result.wifi = this.encrypt(wifiPassword);
    }

    return result;
  }

  /**
   * Decrypt router credentials from database
   *
   * @param pppoe - Encrypted PPPoE password fields
   * @param router - Encrypted router password fields
   * @param wifi - Optional encrypted WiFi password fields
   */
  static decryptRouterCredentials(
    pppoe: DecryptParams,
    router: DecryptParams,
    wifi?: DecryptParams
  ): {
    pppoePassword: string;
    routerPassword: string;
    wifiPassword?: string;
  } {
    const result: {
      pppoePassword: string;
      routerPassword: string;
      wifiPassword?: string;
    } = {
      pppoePassword: this.decrypt(pppoe),
      routerPassword: this.decrypt(router),
    };

    if (wifi) {
      result.wifiPassword = this.decrypt(wifi);
    }

    return result;
  }

  /**
   * Verify that the encryption key is properly configured
   * Useful for health checks and startup validation
   *
   * @returns true if key is valid
   * @throws Error if key is not configured or invalid
   */
  static verifyKeyConfiguration(): boolean {
    getEncryptionKey();
    return true;
  }

  /**
   * Test encryption/decryption cycle
   * Useful for health checks
   *
   * @returns true if encryption/decryption works correctly
   */
  static testEncryption(): boolean {
    const testValue = 'test_credential_123';
    const encrypted = this.encrypt(testValue);
    const decrypted = this.decrypt(encrypted);
    return decrypted === testValue;
  }

  /**
   * Generate a cryptographically secure random password
   *
   * @param length - Length of the password (default 16)
   * @returns A random alphanumeric password
   */
  static generatePassword(length: number = 16): string {
    // Exclude ambiguous characters: 0, O, I, l, 1
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const charsetLength = charset.length;

    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charsetLength];
    }

    return password;
  }
}
