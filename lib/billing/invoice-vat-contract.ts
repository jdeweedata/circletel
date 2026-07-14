/**
 * CircleTel invoice VAT contract (source of truth for money + Zoho sync).
 *
 * ## Canonical fields on `customer_invoices`
 * - `subtotal`     — amount **excluding** VAT (net)
 * - `tax_amount`   — VAT portion
 * - `total_amount` — amount **including** VAT (gross / collectible)
 * - `line_items[].unit_price` and `amount` — **excluding** VAT (must sum to subtotal)
 *
 * ## Product price bases
 * - **Recurring / consumer / Unjani clinic services** (`customer_services.monthly_price`):
 *   stored and billed as **VAT-inclusive** gross. Invoice total equals that price;
 *   VAT is backed out via `computeVatInclusiveAmounts` (see `invoice-amounts.ts`).
 * - **B2B activation / some manual generators**: line amounts are **ex-VAT**; total =
 *   subtotal × 1.15 (`addVat` / BillingService.generateInvoice).
 *
 * Both paths must produce correct header triples (subtotal + tax = total).
 * Zoho Books/Billing must **never** re-derive VAT from product folklore — they
 * mirror these headers so Books total === Supabase total_amount.
 */

import { VAT_RATE, addVat } from '@/lib/billing/vat';
import { computeVatInclusiveAmounts } from '@/lib/billing/invoice-amounts';

export { VAT_RATE, addVat, computeVatInclusiveAmounts };

const MONEY_EPS = 0.02;

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function nearlyEqual(a: number, b: number, eps = MONEY_EPS): boolean {
  return Math.abs(a - b) <= eps;
}

export interface InvoiceLineSource {
  name?: string;
  description?: string;
  quantity?: number | string;
  /** Preferred excl-VAT unit price (canonical). */
  unit_price?: number | string;
  /** Line total excl VAT (canonical). */
  amount?: number | string;
  /** Legacy / alternate keys used by some writers or Zoho mappers. */
  price?: number | string;
  rate?: number | string;
  type?: string;
}

export interface NormalizedInvoiceLine {
  name: string;
  description?: string;
  quantity: number;
  /** Excl-VAT unit rate. */
  unitPriceExcl: number;
  /** Excl-VAT line total (quantity * unit or explicit amount). */
  amountExcl: number;
}

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Read a line's excl-VAT amount preference: amount → unit_price → price → rate.
 * Historical rows sometimes stored gross in unit_price; callers must normalize
 * against invoice headers via `buildZohoTaxInclusiveLines`.
 */
export function readLineMoney(item: InvoiceLineSource): {
  quantity: number;
  unitOrAmount: number;
} {
  const quantity = Math.max(1, Math.round(num(item.quantity, 1)) || 1);
  const amount = num(item.amount, NaN);
  if (Number.isFinite(amount) && amount !== 0) {
    return { quantity, unitOrAmount: amount };
  }
  const unit = num(item.unit_price, NaN);
  if (Number.isFinite(unit) && unit !== 0) {
    return { quantity, unitOrAmount: unit * quantity };
  }
  const price = num(item.price, NaN);
  if (Number.isFinite(price) && price !== 0) {
    return { quantity, unitOrAmount: price * quantity };
  }
  const rate = num(item.rate, NaN);
  if (Number.isFinite(rate) && rate !== 0) {
    return { quantity, unitOrAmount: rate * quantity };
  }
  return { quantity, unitOrAmount: 0 };
}

export function parseInvoiceLineItems(raw: unknown): InvoiceLineSource[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object') as InvoiceLineSource[];
}

export interface CustomerInvoiceVatFields {
  subtotal?: number | string | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  line_items?: unknown;
  invoice_type?: string | null;
  notes?: string | null;
}

export interface ZohoTaxInclusiveLine {
  name: string;
  description?: string;
  rate: number;
  quantity: number;
}

export interface ZohoBooksInvoiceMoneyPayload {
  /**
   * Always true for CircleTel → Zoho: line rates are **gross (incl VAT)** so
   * Zoho does not add another 15% on top of collectible totals.
   */
  is_inclusive_tax: true;
  line_items: ZohoTaxInclusiveLine[];
  /** Expected Books total (Supabase total_amount). */
  expectedTotal: number;
  /** Expected Books subtotal before tax display (Supabase subtotal). */
  expectedSubtotal: number;
  expectedTax: number;
}

/**
 * Build Zoho Books/Billing line items so the remote invoice total matches
 * Supabase `total_amount` for **all** product paths.
 *
 * Strategy: post **VAT-inclusive** line rates (`is_inclusive_tax: true`).
 * That matches consumer/Unjani (gross monthly_price) and B2B (net + tax headers)
 * as long as headers are correct.
 */
export function buildZohoTaxInclusiveInvoicePayload(
  invoice: CustomerInvoiceVatFields,
  fallbackName = 'Service'
): ZohoBooksInvoiceMoneyPayload {
  const subtotal = roundMoney(num(invoice.subtotal));
  const taxAmount = roundMoney(num(invoice.tax_amount));
  const totalAmount = roundMoney(num(invoice.total_amount));

  // Prefer header total; if missing, reconstruct from subtotal + tax or VAT-incl math
  let expectedTotal = totalAmount;
  let expectedSubtotal = subtotal;
  let expectedTax = taxAmount;

  if (expectedTotal <= 0 && expectedSubtotal > 0) {
    expectedTotal = roundMoney(expectedSubtotal + (expectedTax > 0 ? expectedTax : expectedSubtotal * VAT_RATE));
  }
  if (expectedSubtotal <= 0 && expectedTotal > 0) {
    const decomp = computeVatInclusiveAmounts(expectedTotal);
    expectedSubtotal = decomp.subtotal;
    expectedTax = decomp.vatAmount;
  }
  if (expectedTax <= 0 && expectedTotal > 0 && expectedSubtotal > 0) {
    expectedTax = roundMoney(expectedTotal - expectedSubtotal);
  }

  const rawLines = parseInvoiceLineItems(invoice.line_items);
  const named = rawLines.map((item, i) => {
    const { quantity, unitOrAmount } = readLineMoney(item);
    return {
      name: String(item.name || item.description || fallbackName),
      description: item.description ? String(item.description) : undefined,
      quantity,
      lineMoney: roundMoney(unitOrAmount),
      index: i,
    };
  }).filter((l) => l.lineMoney > 0);

  const sumLines = roundMoney(named.reduce((s, l) => s + l.lineMoney, 0));

  let grossLines: ZohoTaxInclusiveLine[];

  if (named.length === 0) {
    grossLines = [
      {
        name: fallbackName,
        description: invoice.notes || undefined,
        rate: expectedTotal > 0 ? expectedTotal : 0,
        quantity: 1,
      },
    ];
  } else if (nearlyEqual(sumLines, expectedTotal) && expectedTotal > 0) {
    // Lines already gross (legacy writers stored unit_price = collectible total)
    grossLines = named.map((l) => ({
      name: l.name,
      description: l.description,
      rate: roundMoney(l.lineMoney / l.quantity),
      quantity: l.quantity,
    }));
  } else if (nearlyEqual(sumLines, expectedSubtotal) && expectedSubtotal > 0 && expectedTotal > 0) {
    // Canonical: lines are excl-VAT — scale to gross so inclusive tax keeps Books total
    const scale = expectedTotal / sumLines;
    grossLines = named.map((l) => {
      const grossLine = roundMoney(l.lineMoney * scale);
      return {
        name: l.name,
        description: l.description,
        rate: roundMoney(grossLine / l.quantity),
        quantity: l.quantity,
      };
    });
    // Fix rounding so sum of gross rates*qty === expectedTotal
    const grossSum = roundMoney(
      grossLines.reduce((s, l) => s + roundMoney(l.rate * l.quantity), 0)
    );
    const drift = roundMoney(expectedTotal - grossSum);
    if (drift !== 0 && grossLines.length > 0) {
      const last = grossLines[grossLines.length - 1];
      last.rate = roundMoney(last.rate + drift / last.quantity);
    }
  } else if (expectedTotal > 0) {
    // Unrecognisable lines — single gross line from header total
    grossLines = [
      {
        name: named[0]?.name || fallbackName,
        description: invoice.notes || named[0]?.description,
        rate: expectedTotal,
        quantity: 1,
      },
    ];
  } else {
    grossLines = named.map((l) => ({
      name: l.name,
      description: l.description,
      rate: roundMoney(l.lineMoney / l.quantity),
      quantity: l.quantity,
    }));
  }

  return {
    is_inclusive_tax: true,
    line_items: grossLines,
    expectedTotal,
    expectedSubtotal,
    expectedTax,
  };
}

/**
 * Validate header triple for an invoice about to be issued or synced.
 */
export function assertInvoiceVatHeaders(invoice: CustomerInvoiceVatFields): {
  ok: boolean;
  error?: string;
} {
  const subtotal = roundMoney(num(invoice.subtotal));
  const tax = roundMoney(num(invoice.tax_amount));
  const total = roundMoney(num(invoice.total_amount));
  if (total < 0 || subtotal < 0 || tax < 0) {
    return { ok: false, error: 'Negative invoice money fields' };
  }
  if (!nearlyEqual(subtotal + tax, total)) {
    return {
      ok: false,
      error: `VAT headers inconsistent: subtotal ${subtotal} + tax ${tax} !== total ${total}`,
    };
  }
  return { ok: true };
}
