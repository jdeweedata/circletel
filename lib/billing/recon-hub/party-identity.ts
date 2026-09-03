/**
 * Shared identity helpers for three-way cash match.
 * Account number is the primary key; exact (normalized) name confirms it.
 */

export interface PartyNameFields {
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
}

const ACCOUNT_NUMBER_RE = /\bCT-(\d{4})-(\d{5})\b/i;

export function normalizeName(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function namesEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return false;
  return left === right;
}

export function displayName(customer: PartyNameFields): string {
  const business = String(customer.business_name || '').trim();
  if (business) return business;
  return `${String(customer.first_name || '').trim()} ${String(customer.last_name || '').trim()}`.trim();
}

/**
 * Extract CT-YYYY-NNNNN from anywhere in a reference.
 * Ignores invoice (CT-INV…) and 8-digit order (CT-YYYYMMDD-…) forms.
 */
export function extractAccountNumber(text: string | null | undefined): string | null {
  const match = String(text || '').match(ACCOUNT_NUMBER_RE);
  if (!match) return null;
  return `CT-${match[1]}-${match[2]}`.toUpperCase();
}
