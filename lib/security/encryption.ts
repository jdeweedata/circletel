/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM authenticated encryption for sensitive data like
 * payment details. Uses a master key from environment variables with
 * proper key derivation for each encryption operation.
 *
 * Security features:
 * - AES-256-GCM authenticated encryption (prevents tampering)
 * - Random IV per encryption (prevents pattern analysis)
 * - PBKDF2 key derivation with random salt
 * - Base64 encoding for storage compatibility
 *
 * @module lib/security/encryption
 */

import crypto from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const KEY_LENGTH = 32; // 256 bits for AES-256
const PBKDF2_ITERATIONS = 100000;

// Version byte for future compatibility
const ENCRYPTION_VERSION = 0x01;

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptedData {
  /** Version byte for future compatibility */
  v: number;
  /** Salt used for key derivation (base64) */
  s: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64) */
  tag: string;
  /** Encrypted ciphertext (base64) */
  ct: string;
}

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/**
 * Get the master encryption key from environment
 * @throws Error if key is not configured
 */
function getMasterKey(): Buffer {
  const key = process.env.PAYMENT_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate a 32-byte hex key: openssl rand -hex 32'
    );
  }

  // Accept both hex and base64 encoded keys
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY must be a 32-byte key (64 hex chars or 44 base64 chars)'
    );
  }

  return decoded;
}

/**
 * Derive an encryption key from the master key using PBKDF2
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

// ============================================================================
// ENCRYPTION
// ============================================================================

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - Data to encrypt (will be JSON stringified if object)
 * @returns Encrypted data object
 * @throws Error if encryption fails or key not configured
 */
export function encrypt(plaintext: string | object): EncryptedData {
  const masterKey = getMasterKey();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key
  const derivedKey = deriveKey(masterKey, salt);

  // Convert to string if object
  const data = typeof plaintext === 'object' ? JSON.stringify(plaintext) : plaintext;

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    v: ENCRYPTION_VERSION,
    s: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: authTag.toString('base64'),
    ct: encrypted.toString('base64'),
  };
}

/**
 * Encrypt and return as a JSON string (for JSONB storage)
 */
export function encryptToJson(plaintext: string | object): string {
  return JSON.stringify(encrypt(plaintext));
}

// ============================================================================
// DECRYPTION
// ============================================================================

/**
 * Decrypt data encrypted with encrypt()
 *
 * @param encryptedData - Encrypted data object or JSON string
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails, data tampered, or key wrong
 */
export function decrypt(encryptedData: EncryptedData | string): string {
  const masterKey = getMasterKey();

  // Parse if string
  const data: EncryptedData =
    typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData;

  // Validate version
  if (data.v !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${data.v}`);
  }

  // Decode components
  const salt = Buffer.from(data.s, 'base64');
  const iv = Buffer.from(data.iv, 'base64');
  const authTag = Buffer.from(data.tag, 'base64');
  const ciphertext = Buffer.from(data.ct, 'base64');

  // Derive key
  const derivedKey = deriveKey(masterKey, salt);

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed - data may be corrupted or tampered with');
  }
}

/**
 * Decrypt and parse as JSON object
 */
export function decryptToObject<T = unknown>(encryptedData: EncryptedData | string): T {
  const plaintext = decrypt(encryptedData);
  return JSON.parse(plaintext) as T;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if a value looks like encrypted data
 */
export function isEncryptedData(value: unknown): value is EncryptedData {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.v === 'number' &&
    typeof obj.s === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.tag === 'string' &&
    typeof obj.ct === 'string'
  );
}

/**
 * Generate a new encryption key (for setup/rotation)
 * @returns 32-byte hex-encoded key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Mask sensitive data for logging/display
 * @param value - Value to mask
 * @param visibleChars - Number of characters to show at end
 * @returns Masked string (e.g., "***1234")
 */
export function maskSensitiveData(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  return '***' + value.slice(-visibleChars);
}
