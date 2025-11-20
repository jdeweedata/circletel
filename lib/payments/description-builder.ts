/**
 * Payment Description Builder
 *
 * Generates customer-friendly payment descriptions for bank statements and NetCash payment pages.
 * All descriptions are optimized to fit within 35 characters for maximum bank compatibility.
 */

// City abbreviation mapping for South African cities
const CITY_ABBREVIATIONS: Record<string, string> = {
  'johannesburg': 'JHB',
  'cape town': 'CPT',
  'capetown': 'CPT',
  'durban': 'DBN',
  'pretoria': 'PTA',
  'port elizabeth': 'PLZ',
  'bloemfontein': 'BFN',
  'east london': 'ELS',
  'polokwane': 'POL',
  'nelspruit': 'NEL',
  'kimberley': 'KIM',
  'pietermaritzburg': 'PMB',
  'rustenburg': 'RUS',
  'george': 'GRG',
  'midrand': 'MDR',
  'sandton': 'SNT',
  'centurion': 'CEN',
}

interface OrderData {
  account_number?: string
  order_number?: string
  package_name?: string
  package_speed?: string
  city?: string
  suburb?: string
  customer_id?: string
}

interface InvoiceData {
  invoice_number: string
}

/**
 * Abbreviate city name to 3-letter code
 * Falls back to first 3 uppercase letters if not in mapping
 */
export function abbreviateCity(city: string | undefined | null): string {
  if (!city) return ''

  const normalized = city.toLowerCase().trim()

  // Check if we have a mapping
  if (CITY_ABBREVIATIONS[normalized]) {
    return CITY_ABBREVIATIONS[normalized]
  }

  // Fallback: Take first 3 letters and uppercase
  return city.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
}

/**
 * Abbreviate package name to fit within character constraints
 * Removes unnecessary words like "Fibre", "Package", "Uncapped"
 */
export function abbreviatePackage(packageName: string | undefined | null): string {
  if (!packageName) return ''

  let abbreviated = packageName
    // Remove common filler words
    .replace(/\bFibre\b/gi, '')
    .replace(/\bPackage\b/gi, '')
    .replace(/\bUncapped\b/gi, '')
    .replace(/\bUnlimited\b/gi, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()

  // If still too long, try to shorten provider names
  abbreviated = abbreviated
    .replace(/\bFrogfoot\b/gi, 'Frog')
    .replace(/\bVumatel\b/gi, 'Vuma')
    .replace(/\bOpenserve\b/gi, 'Open')

  return abbreviated
}

/**
 * Abbreviate account number from "CT-YYYY-NNNNN" to "CT-NNNNN"
 */
export function abbreviateAccountNumber(accountNumber: string | undefined | null): string {
  if (!accountNumber) return ''

  // Extract just the last part after the last hyphen
  // "CT-2025-00123" → "CT-00123"
  const match = accountNumber.match(/^CT-\d{4}-(\d+)$/)
  if (match) {
    return `CT-${match[1]}`
  }

  // If doesn't match expected format, return as-is (truncated if too long)
  return accountNumber.substring(0, 10)
}

/**
 * Abbreviate order number from "ORD-YYYY-NNNNN" to "ORD-NNNNN"
 */
export function abbreviateOrderNumber(orderNumber: string | undefined | null): string {
  if (!orderNumber) return ''

  // Extract just the last part after the last hyphen
  // "ORD-2025-00123" → "ORD-00123"
  const match = orderNumber.match(/^ORD-\d{4}-(\d+)$/)
  if (match) {
    return `ORD-${match[1]}`
  }

  // If doesn't match expected format, return as-is (truncated if too long)
  return orderNumber.substring(0, 11)
}

/**
 * Truncate description to maxLength, adding ellipsis if needed
 */
export function truncateDescription(description: string, maxLength: number = 35): string {
  if (description.length <= maxLength) {
    return description
  }

  // Truncate and add ellipsis
  return description.substring(0, maxLength - 3) + '...'
}

/**
 * Build payment method validation description (R1.00 test charge)
 * Format: "CircleTel - Payment Verification"
 * Length: 32 characters
 */
export function buildPaymentMethodDescription(): string {
  return 'CircleTel - Payment Verification'
}

/**
 * Build order payment description
 * Format: "{account} {package} {city}"
 * Example: "CT-00123 MTN 100Mbps JHB"
 * Max Length: 35 characters
 */
export function buildOrderDescription(order: OrderData): string {
  const parts: string[] = []

  // Priority 1: Account number (or order number as fallback)
  if (order.account_number) {
    parts.push(abbreviateAccountNumber(order.account_number))
  } else if (order.order_number) {
    parts.push(abbreviateOrderNumber(order.order_number))
  }

  // Priority 2: Package name
  if (order.package_name) {
    parts.push(abbreviatePackage(order.package_name))
  }

  // Priority 3: City
  if (order.city) {
    parts.push(abbreviateCity(order.city))
  }

  // Join parts and truncate if necessary
  const description = parts.filter(Boolean).join(' ')

  // If we have no parts, use a generic fallback
  if (!description) {
    return 'CircleTel - Internet Service'
  }

  return truncateDescription(description, 35)
}

/**
 * Build invoice payment description
 * Format: "CircleTel - INV-{number}"
 * Example: "CircleTel - INV-00045"
 * Max Length: 35 characters
 */
export function buildInvoiceDescription(invoice: InvoiceData): string {
  // Abbreviate invoice number if needed
  const invoiceNum = invoice.invoice_number.replace(/^INV-\d{4}-/, 'INV-')

  const description = `CircleTel - ${invoiceNum}`
  return truncateDescription(description, 35)
}

/**
 * Build generic payment description with custom text
 * Format: "CircleTel - {text}"
 * Max Length: 35 characters
 */
export function buildGenericDescription(text: string): string {
  const description = `CircleTel - ${text}`
  return truncateDescription(description, 35)
}

/**
 * Validate description meets bank statement requirements
 */
export function validateDescription(description: string): {
  valid: boolean
  length: number
  maxLength: number
  errors: string[]
} {
  const errors: string[] = []
  const maxLength = 35

  if (description.length > maxLength) {
    errors.push(`Description exceeds ${maxLength} characters (${description.length})`)
  }

  if (description.length === 0) {
    errors.push('Description cannot be empty')
  }

  // Check for special characters that might cause issues
  if (/[<>\"'\\]/.test(description)) {
    errors.push('Description contains invalid characters (<, >, ", \', \\)')
  }

  return {
    valid: errors.length === 0,
    length: description.length,
    maxLength,
    errors,
  }
}
