import crypto from 'crypto';

/** Generate a 32-byte cryptographically-random URL-safe token (the plaintext sent in the link). */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** SHA-256 hex hash. Only the hash is stored in onboarding_tokens.token_hash. */
export function hashToken(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

export const TOKEN_TTL_DAYS = 7;

/** Expiry timestamp `TOKEN_TTL_DAYS` from `from` (ISO string). */
export function tokenExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
