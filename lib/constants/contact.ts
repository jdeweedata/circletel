/**
 * Contact Information Constants (legacy path)
 *
 * Now DERIVED from the tenant config layer — see lib/tenant/ and
 * docs/architecture/TENANT_CONFIG.md. Do not add values here; add them
 * to lib/tenant/ instead. Kept so 23 existing consumers work unchanged.
 */
import { getTenantConfig } from '@/lib/tenant';

export const CONTACT = getTenantConfig().contacts;

/**
 * Format a phone number for international calling
 */
export function formatPhoneInternational(phone: string): string {
  // Remove spaces and non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // If starts with 0, convert to +27
  if (cleaned.startsWith('0')) {
    return '+27' + cleaned.substring(1)
  }

  // If doesn't start with +, assume local and add +27
  if (!cleaned.startsWith('+')) {
    return '+27' + cleaned
  }

  return cleaned
}

/**
 * Format address as a single line (full)
 * "Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191"
 */
export function formatAddressOneLine(): string {
  const { building, street, suburb, city, postalCode } = CONTACT.PHYSICAL_ADDRESS
  return `${building}, ${street}, ${suburb}, ${city}, ${postalCode}`
}

/**
 * Format address with pipe separators (for PDF headers)
 * Line 1: "Imagine House | 2 Mellis Road"
 * Line 2: "Rivonia | Sandton | 2191"
 */
export function formatAddressPipe(): { line1: string; line2: string } {
  const { building, street, suburb, city, postalCode } = CONTACT.PHYSICAL_ADDRESS
  return {
    line1: `${building} | ${street}`,
    line2: `${suburb} | ${city} | ${postalCode}`,
  }
}

/**
 * Format postal address (same as physical)
 * "Imagine House, 2 Mellis Road, Rivonia, 2191"
 */
export function formatPostalAddress(): string {
  const { building, street, suburb, postalCode } = CONTACT.POSTAL_ADDRESS
  return `${building}, ${street}, ${suburb}, ${postalCode}`
}

/**
 * Format address for footer display
 * "Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191"
 */
export function formatAddressFooter(): string {
  return formatAddressOneLine()
}

/**
 * Get full company footer line for PDFs
 * "Circle Tel SA (Pty) Ltd | Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191"
 */
export function formatCompanyFooterLine(): string {
  return `Circle Tel SA (Pty) Ltd | ${formatAddressOneLine()}`
}

/**
 * Get WhatsApp link with pre-filled message
 */
export function getWhatsAppLink(message?: string): string {
  if (!message) return CONTACT.WHATSAPP_LINK
  return `${CONTACT.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`
}
