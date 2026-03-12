// __tests__/lib/billing/invoice-reference-parser.test.ts
import { parsePayNowReference, type ParsedReference } from '@/lib/billing/invoice-reference-parser';

describe('parsePayNowReference', () => {
  describe('CT-INV format', () => {
    it('parses CT-INV2026-00002-timestamp format', () => {
      const result = parsePayNowReference('CT-INV2026-00002-1771356357084');

      expect(result).toEqual<ParsedReference>({
        type: 'invoice',
        invoiceNumber: 'INV-2026-00002',
        rawReference: 'CT-INV2026-00002-1771356357084',
      });
    });

    it('parses CT-INV with different years', () => {
      const result = parsePayNowReference('CT-INV2025-00145-9876543210');

      expect(result).toEqual<ParsedReference>({
        type: 'invoice',
        invoiceNumber: 'INV-2025-00145',
        rawReference: 'CT-INV2025-00145-9876543210',
      });
    });

    it('is case insensitive', () => {
      const result = parsePayNowReference('ct-inv2026-00002-123456');

      expect(result.type).toBe('invoice');
      expect(result.invoiceNumber).toBe('INV-2026-00002');
    });
  });

  describe('Direct INV format', () => {
    it('parses INV-2026-00002 format', () => {
      const result = parsePayNowReference('INV-2026-00002');

      expect(result).toEqual<ParsedReference>({
        type: 'invoice',
        invoiceNumber: 'INV-2026-00002',
        rawReference: 'INV-2026-00002',
      });
    });

    it('parses invoice number embedded in longer string', () => {
      const result = parsePayNowReference('Payment for INV-2026-00003');

      expect(result.type).toBe('invoice');
      expect(result.invoiceNumber).toBe('INV-2026-00003');
    });
  });

  describe('Order/Contract format', () => {
    it('identifies CT-YYYYMMDD-hash as order type', () => {
      const result = parsePayNowReference('CT-20260227-52bd7f62');

      expect(result).toEqual<ParsedReference>({
        type: 'order',
        invoiceNumber: undefined,
        rawReference: 'CT-20260227-52bd7f62',
      });
    });

    it('identifies CT-YYYYMMDD with longer hash', () => {
      const result = parsePayNowReference('CT-20260312-abc123def456');

      expect(result.type).toBe('order');
      expect(result.invoiceNumber).toBeUndefined();
    });
  });

  describe('Unknown format', () => {
    it('returns unknown for unrecognized formats', () => {
      const result = parsePayNowReference('RANDOM-REF-12345');

      expect(result).toEqual<ParsedReference>({
        type: 'unknown',
        invoiceNumber: undefined,
        rawReference: 'RANDOM-REF-12345',
      });
    });

    it('returns unknown for empty string', () => {
      const result = parsePayNowReference('');

      expect(result.type).toBe('unknown');
    });

    it('returns unknown for order numbers', () => {
      const result = parsePayNowReference('ORD-2026-00123');

      expect(result.type).toBe('unknown');
    });
  });
});
