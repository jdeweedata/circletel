// lib/billing/invoice-reference-parser.ts

/**
 * Invoice Reference Parser
 *
 * Parses PayNow transaction references to extract invoice numbers.
 * Handles multiple formats:
 * - CT-INV2026-00002-timestamp → INV-2026-00002
 * - INV-2026-00002 → INV-2026-00002
 * - CT-20260227-hash → order type (no invoice number)
 */

export interface ParsedReference {
  /** Type of reference: invoice, order, contract, account, or unknown */
  type: 'invoice' | 'order' | 'contract' | 'account' | 'unknown';
  /** Extracted invoice number (e.g., "INV-2026-00002") */
  invoiceNumber?: string;
  /** Extracted account number (e.g., "CT-2025-00012") */
  accountNumber?: string;
  /** Original reference string */
  rawReference: string;
}

/**
 * Parse a PayNow reference to extract invoice information
 *
 * @param reference - The PayNow reference string (e.g., "CT-INV2026-00002-1771356357084")
 * @returns Parsed reference with type and extracted invoice number
 */
export function parsePayNowReference(reference: string): ParsedReference {
  if (!reference) {
    return { type: 'unknown', rawReference: reference || '' };
  }

  // Strategy 1: CT-INV format (e.g., "CT-INV2026-00002-1771356357084")
  // Captures: INV + 4-digit year + 5-digit sequence
  const ctInvMatch = reference.match(/CT-INV(\d{4})-?(\d{5})/i);
  if (ctInvMatch) {
    const year = ctInvMatch[1];
    const sequence = ctInvMatch[2];
    return {
      type: 'invoice',
      invoiceNumber: `INV-${year}-${sequence}`,
      rawReference: reference,
    };
  }

  // Strategy 2: Direct INV format (e.g., "INV-2026-00002")
  const invMatch = reference.match(/INV-(\d{4})-(\d{5})/i);
  if (invMatch) {
    const year = invMatch[1];
    const sequence = invMatch[2];
    return {
      type: 'invoice',
      invoiceNumber: `INV-${year}-${sequence}`,
      rawReference: reference,
    };
  }

  // Strategy 3: Date-based format (e.g., "CT-20260227-52bd7f62") — likely order/contract
  if (/^CT-\d{8}-/i.test(reference)) {
    return {
      type: 'order',
      invoiceNumber: undefined,
      rawReference: reference,
    };
  }

  // Strategy 4: Account number format (e.g., "CT-2025-00012")
  // Captures: CT + 4-digit year + 5-digit sequence
  const ctAccountMatch = reference.match(/^CT-(\d{4})-(\d{5})$/i);
  if (ctAccountMatch) {
    return {
      type: 'account',
      accountNumber: reference,
      rawReference: reference,
    };
  }

  // Unknown format
  return {
    type: 'unknown',
    invoiceNumber: undefined,
    rawReference: reference,
  };
}

/**
 * Check if a reference contains an invoice number
 */
export function hasInvoiceNumber(reference: string): boolean {
  const parsed = parsePayNowReference(reference);
  return parsed.type === 'invoice' && !!parsed.invoiceNumber;
}
