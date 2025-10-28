/**
 * Quote Numbering System
 *
 * Handles generation and validation of quote numbers
 * Format: BQ-YYYY-NNN (e.g., BQ-2025-001)
 */

/**
 * Parse quote number into components
 */
export function parseQuoteNumber(quoteNumber: string): {
  prefix: string;
  year: number;
  sequence: number;
  valid: boolean;
} {
  const match = quoteNumber.match(/^BQ-(\d{4})-(\d{3})$/);

  if (!match) {
    return {
      prefix: 'BQ',
      year: 0,
      sequence: 0,
      valid: false
    };
  }

  return {
    prefix: 'BQ',
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
    valid: true
  };
}

/**
 * Validate quote number format
 */
export function isValidQuoteNumber(quoteNumber: string): boolean {
  return /^BQ-\d{4}-\d{3}$/.test(quoteNumber);
}

/**
 * Format quote number display
 */
export function formatQuoteNumber(quoteNumber: string): string {
  if (!isValidQuoteNumber(quoteNumber)) {
    return quoteNumber;
  }

  const { year, sequence } = parseQuoteNumber(quoteNumber);
  return `BQ-${year}-${sequence.toString().padStart(3, '0')}`;
}

/**
 * Get year from quote number
 */
export function getQuoteYear(quoteNumber: string): number | null {
  const { valid, year } = parseQuoteNumber(quoteNumber);
  return valid ? year : null;
}

/**
 * Get sequence from quote number
 */
export function getQuoteSequence(quoteNumber: string): number | null {
  const { valid, sequence } = parseQuoteNumber(quoteNumber);
  return valid ? sequence : null;
}

/**
 * Check if quote number is from current year
 */
export function isCurrentYearQuote(quoteNumber: string): boolean {
  const year = getQuoteYear(quoteNumber);
  return year === new Date().getFullYear();
}

/**
 * Generate next quote number (client-side prediction only)
 * Note: Actual generation happens server-side via database trigger
 */
export function predictNextQuoteNumber(lastQuoteNumber: string | null): string {
  const currentYear = new Date().getFullYear();

  if (!lastQuoteNumber || !isValidQuoteNumber(lastQuoteNumber)) {
    return `BQ-${currentYear}-001`;
  }

  const { year, sequence } = parseQuoteNumber(lastQuoteNumber);

  // If last quote is from previous year, start new sequence
  if (year < currentYear) {
    return `BQ-${currentYear}-001`;
  }

  // Increment sequence
  const nextSequence = sequence + 1;
  return `BQ-${currentYear}-${nextSequence.toString().padStart(3, '0')}`;
}

/**
 * Compare quote numbers
 */
export function compareQuoteNumbers(a: string, b: string): number {
  const parsedA = parseQuoteNumber(a);
  const parsedB = parseQuoteNumber(b);

  if (!parsedA.valid || !parsedB.valid) {
    return a.localeCompare(b);
  }

  // Compare by year first
  if (parsedA.year !== parsedB.year) {
    return parsedA.year - parsedB.year;
  }

  // Then by sequence
  return parsedA.sequence - parsedB.sequence;
}

/**
 * Sort quote numbers in descending order (newest first)
 */
export function sortQuoteNumbers(quoteNumbers: string[]): string[] {
  return [...quoteNumbers].sort((a, b) => compareQuoteNumbers(b, a));
}
