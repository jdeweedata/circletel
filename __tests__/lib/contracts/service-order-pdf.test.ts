/**
 * Tests for Service Order PDF Generator
 */

import { describe, it, expect } from '@jest/globals';
import { generateServiceOrderPdf, generateServiceOrderBlob, generateServiceOrderBuffer } from '@/lib/contracts/service-order-pdf';

describe('Service Order PDF Generator', () => {
  const mockInput = {
    accountNumber: 'CT-2026-00020',
    clinicName: 'Unjani Clinic Delmas',
    clinicAddress: '123 Main Street, Delmas',
    clinicProvince: 'Gauteng',
    clinicEmail: 'delmas@unjani.org',
    clinicPhone: '082 111 2222',
    monthlyFeeExclVat: 450,
    vatPercentage: 15,
    billingDay: '15' as const,
    activationDate: '2026-06-15T00:00:00Z',
    submittedAt: '2026-06-10T12:00:00Z',
  };

  it('should generate a PDF document', () => {
    const pdf = generateServiceOrderPdf(mockInput);

    // Check that we get a jsPDF instance with expected methods
    expect(pdf).toBeDefined();
    expect(typeof pdf.output).toBe('function');
    expect(typeof pdf.getNumberOfPages).toBe('function');

    // Should be at least 2 pages (header + terms + acceptance)
    const pageCount = pdf.getNumberOfPages();
    expect(pageCount).toBeGreaterThanOrEqual(2);
  });

  it('should generate a valid PDF blob', () => {
    const blob = generateServiceOrderBlob(mockInput);

    expect(blob).toBeDefined();
    expect(blob instanceof Blob).toBe(true);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should generate a valid PDF buffer', () => {
    const buffer = generateServiceOrderBuffer(mockInput);

    expect(buffer).toBeDefined();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(buffer.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('should include clinic details in the PDF', async () => {
    const blob = generateServiceOrderBlob(mockInput);
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = buffer.toString('utf8');

    // Check for key clinic identifiers in the PDF
    expect(text).toContain('Unjani Clinic Delmas');
    expect(text).toContain('CT-2026-00020');
    expect(text).toContain('Gauteng');
  });

  it('should include pricing information', async () => {
    const blob = generateServiceOrderBlob(mockInput);
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = buffer.toString('utf8');

    // Check for pricing markers (amount may be encoded)
    expect(text).toContain('450'); // R450 monthly fee
    expect(text).toContain('15'); // 15% VAT
  });

  it('should handle different billing days', () => {
    const billingDays: Array<'1' | '15' | '20' | '25'> = ['1', '15', '20', '25'];

    billingDays.forEach((billingDay) => {
      const input = { ...mockInput, billingDay };
      const pdf = generateServiceOrderPdf(input);

      expect(pdf).toBeDefined();
      expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    });
  });

  it('should generate consistent PDF across multiple calls', () => {
    const blob1 = generateServiceOrderBlob(mockInput);
    const blob2 = generateServiceOrderBlob(mockInput);

    // Both should be PDFs with same structure
    expect(blob1.type).toBe('application/pdf');
    expect(blob2.type).toBe('application/pdf');
    // Size may vary slightly due to timestamps, but should be similar
    expect(Math.abs(blob1.size - blob2.size)).toBeLessThan(500);
  });

  it('should handle clinic names with special characters', () => {
    const input = {
      ...mockInput,
      clinicName: "Unjani Clinic O'Brien & Partners",
    };

    const pdf = generateServiceOrderPdf(input);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });

  it('should handle long addresses', () => {
    const input = {
      ...mockInput,
      clinicAddress: '123 Very Long Street Name That Goes On For A While, Building 456, Floor 7, Delmas, Gauteng, 2110, South Africa',
    };

    const pdf = generateServiceOrderPdf(input);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });

  it('should produce a PDF starting with %PDF magic number', () => {
    const buffer = generateServiceOrderBuffer(mockInput);

    // PDF files must start with %PDF version indicator
    expect(buffer.toString('ascii', 0, 4)).toBe('%PDF');
  });

  it('should include Service Order number in output', async () => {
    const blob = generateServiceOrderBlob(mockInput);
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = buffer.toString('utf8');

    // Service Order number should be present
    expect(text).toContain('SO-CT-2026-00020');
  });
});
