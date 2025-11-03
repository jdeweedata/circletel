/**
 * Invoice PDF Generator
 * Generates professional PDF invoices for CircleTel customers
 * Reuses branding and formatters from lib/quotes/pdf-generator-v2.ts
 * Task Group 10: Invoice Generation & NetCash Payments
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CIRCLETEL_LOGO_BASE64 } from '@/lib/quotes/circletel-logo-base64';
import { createClient } from '@/lib/supabase/server';

/**
 * Format currency in ZAR
 * Reused from lib/quotes/pdf-generator-v2.ts
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date in en-ZA locale
 * Reused from lib/quotes/pdf-generator-v2.ts
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate invoice PDF and upload to Supabase Storage
 *
 * @param invoiceId - UUID of the invoice
 * @returns Public URL of the generated PDF
 */
export async function generateInvoicePDF(invoiceId: string): Promise<string> {
  const supabase = await createClient();

  // 1. Fetch invoice, contract, customer data
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      contract:contracts(*),
      customer:customers(*)
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  // 2. Create jsPDF instance
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 3. Add header with CircleTel logo (reuse from pdf-generator-v2.ts)
  try {
    doc.addImage(CIRCLETEL_LOGO_BASE64, 'PNG', 15, 10, 25, 25);
  } catch (e) {
    // Fallback if logo fails to load
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 131, 31);
    doc.text('circleTEL', 15, 22);
  }

  // Header - Company Details (right side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 75, 75);
  const rightX = pageWidth - 15;
  doc.text('West House | Devcon Park | 7', rightX, 12, { align: 'right' });
  doc.text('Autumn Road | Rivonia | 2128', rightX, 17, { align: 'right' });
  doc.text('PO Box 3895, 2128', rightX, 22, { align: 'right' });
  doc.text('TEL: +27 87 087 6307', rightX, 27, { align: 'right' });
  doc.setTextColor(245, 131, 31);
  doc.text('EMAIL: ', rightX - 45, 32, { align: 'left' });
  doc.setTextColor(75, 75, 75);
  doc.text('contactus@circletel.co.za', rightX, 32, { align: 'right' });
  doc.setTextColor(245, 131, 31);
  doc.text('WEB: ', rightX - 37, 37, { align: 'left' });
  doc.setTextColor(75, 75, 75);
  doc.text('www.circletel.co.za', rightX, 37, { align: 'right' });

  // Orange horizontal line
  doc.setDrawColor(245, 131, 31);
  doc.setLineWidth(0.8);
  doc.line(15, 40, pageWidth - 15, 40);

  let yPos = 50;

  // 4. Add invoice title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 131, 31); // CircleTel orange
  doc.text('INVOICE', pageWidth - 15, yPos, { align: 'right' });

  yPos += 10;

  // 5. Add invoice details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, 52, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.invoice_date), 48, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.due_date), 40, yPos);

  yPos += 15;

  // 6. Add customer details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, yPos);

  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customer.company_name || invoice.customer.name || 'Customer', 15, yPos);

  yPos += 6;
  doc.text(invoice.customer.email || '', 15, yPos);

  yPos += 6;
  doc.text(invoice.customer.phone || '', 15, yPos);

  yPos += 15;

  // 7. Add line items table
  const items = typeof invoice.items === 'string'
    ? JSON.parse(invoice.items)
    : invoice.items;

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total)
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [245, 131, 31], // CircleTel orange
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  // 8. Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, pageWidth - 60, finalY);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 15, finalY, { align: 'right' });

  doc.text(`VAT (${invoice.vat_rate}%):`, pageWidth - 60, finalY + 6);
  doc.text(formatCurrency(invoice.vat_amount), pageWidth - 15, finalY + 6, { align: 'right' });

  // Total line with bold styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', pageWidth - 60, finalY + 15);
  doc.text(formatCurrency(invoice.total_amount), pageWidth - 15, finalY + 15, { align: 'right' });

  // 9. Add payment instructions
  yPos = finalY + 30;

  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 50;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Payment Instructions:', 15, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Please use the online payment link sent via email for instant payment.', 15, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Alternative Payment Methods:', 15, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Transfer:', 15, yPos);
  yPos += 5;
  doc.text('  Bank: First National Bank (FNB)', 15, yPos);
  yPos += 5;
  doc.text('  Account Name: Circle Tel SA (PTY) LTD', 15, yPos);
  yPos += 5;
  doc.text('  Account Number: [Contact us for account details]', 15, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`  Reference: ${invoice.invoice_number}`, 15, yPos);

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(75, 75, 75);
  doc.setFont('helvetica', 'bold');
  doc.text('Circle Tel SA (PTY) LTD - Authorized MTN Business Partner', pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Registration Number: 2008/026404/07', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text('All prices include VAT unless otherwise stated', pageWidth / 2, footerY + 8, { align: 'center' });

  // 10. Upload PDF to Supabase Storage
  const pdfBlob = doc.output('blob');
  const fileName = `${invoice.customer_id}/${invoice.invoice_number}.pdf`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('invoice-documents')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // 11. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('invoice-documents')
    .getPublicUrl(fileName);

  // 12. Update invoice.pdf_url
  await supabase
    .from('invoices')
    .update({ pdf_url: publicUrl })
    .eq('id', invoiceId);

  return publicUrl;
}

/**
 * Download invoice PDF directly (for admin use)
 */
export function downloadInvoicePDFDirect(invoice: any): void {
  const doc = generateInvoicePDFDocument(invoice);
  doc.save(`CircleTel-Invoice-${invoice.invoice_number}.pdf`);
}

/**
 * Generate PDF document without uploading (helper function)
 */
function generateInvoicePDFDocument(invoice: any): jsPDF {
  const doc = new jsPDF();
  // ... (implementation similar to generateInvoicePDF but without upload)
  return doc;
}
