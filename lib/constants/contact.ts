/**
 * CircleTel Contact Information Constants
 *
 * Centralized contact details for use across the application.
 * Update these values here to propagate changes site-wide.
 */

export const CONTACT = {
  // WhatsApp (Primary support channel)
  WHATSAPP_NUMBER: '082 487 3900',
  WHATSAPP_LINK: 'https://wa.me/27824873900',
  WHATSAPP_INTERNATIONAL: '+27 82 487 3900',

  // Sales phone (OUTBOUND only - not for public display)
  // Inbound sales: WhatsApp or sales@circletel.co.za → ZOHO Desk
  PHONE_SALES_OUTBOUND: '010 880 3663',

  // Email addresses
  EMAIL_PRIMARY: 'contactus@circletel.co.za', // Use this for all public-facing contact
  EMAIL_SUPPORT: 'contactus@circletel.co.za', // Alias for backward compatibility
  EMAIL_SALES: 'sales@circletel.co.za',
  EMAIL_BILLING: 'billing@circletel.co.za',
  EMAIL_LEGAL: 'legal@circletelsa.co.za',
  EMAIL_NOTIFICATIONS: 'no-reply@notify.circletel.co.za',

  // Business hours
  BUSINESS_HOURS: 'Monday - Friday: 08:00 - 17:00 SAST',
  SUPPORT_HOURS: 'Mon-Fri, 8am-5pm', // NOT 24/7 - WhatsApp + AI assistance during business hours

  // Physical address (CIPC registered — M2008026404)
  PHYSICAL_ADDRESS: {
    name: 'Circle Tel SA (Pty) Ltd',
    attention: 'Contracts and Commercial Manager',
    building: 'Imagine House',
    street: '2 Mellis Road',
    suburb: 'Rivonia',
    city: 'Rivonia',
    province: 'Gauteng',
    postalCode: '2128',
    country: 'South Africa',
  },

  // Website
  WEBSITE: 'https://www.circletel.co.za',
  WEBSITE_SHORT: 'circletel.co.za',
} as const

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
 * Format address as a single line
 */
export function formatAddressOneLine(): string {
  const { building, street, suburb, province, postalCode } = CONTACT.PHYSICAL_ADDRESS
  return `${building}, ${street}, ${suburb}, ${province}, ${postalCode}`
}

/**
 * Get WhatsApp link with pre-filled message
 */
export function getWhatsAppLink(message?: string): string {
  if (!message) return CONTACT.WHATSAPP_LINK
  return `${CONTACT.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`
}
