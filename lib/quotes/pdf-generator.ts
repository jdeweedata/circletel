/**
 * PDF Generator for Business Quotes
 *
 * Generates professional PDF quotes with CircleTel branding
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuoteDetails } from './types';

interface PDFOptions {
  includeTerms?: boolean;
  includeSignature?: boolean;
}

/**
 * Format currency for South Africa (ZAR)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate PDF quote document
 */
export function generateQuotePDF(quote: QuoteDetails, options: PDFOptions = {}): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPos = 20;

  // ===================================
  // HEADER - CircleTel Logo & Info
  // ===================================

  // CircleTel Branding
  doc.setFillColor(245, 131, 31); // CircleTel Orange
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CircleTel', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Business Connectivity Solutions', 20, 32);

  // Company details (right side)
  doc.setFontSize(9);
  const headerRight = pageWidth - 20;
  doc.text('7 Autumn Street', headerRight, 20, { align: 'right' });
  doc.text('Rivonia, Sandton, 2128', headerRight, 25, { align: 'right' });
  doc.text('Tel: 087 820 0000', headerRight, 30, { align: 'right' });
  doc.text('Email: quotes@circletel.co.za', headerRight, 35, { align: 'right' });

  yPos = 50;

  // ===================================
  // QUOTE HEADER
  // ===================================

  doc.setTextColor(31, 41, 55); // Dark neutral
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BUSINESS QUOTATION', 20, yPos);

  yPos += 10;

  // Quote metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99); // Secondary neutral

  const metaLeft = 20;
  const metaRight = pageWidth / 2 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Quote Number:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quote_number, metaLeft + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', metaRight, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.created_at), metaRight + 15, yPos);

  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.status.toUpperCase(), metaLeft + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Valid Until:', metaRight, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.valid_until), metaRight + 25, yPos);

  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Contract Term:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quote.contract_term} Months`, metaLeft + 35, yPos);

  yPos += 15;

  // ===================================
  // CUSTOMER INFORMATION
  // ===================================

  doc.setFillColor(230, 233, 239); // Light neutral
  doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CUSTOMER INFORMATION', 22, yPos);

  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  doc.setFont('helvetica', 'bold');
  doc.text('Company:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.company_name, metaLeft + 25, yPos);

  yPos += 6;

  if (quote.registration_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('Registration:', metaLeft, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.registration_number, metaLeft + 30, yPos);
    yPos += 6;
  }

  if (quote.vat_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('VAT Number:', metaLeft, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.vat_number, metaLeft + 30, yPos);
    yPos += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Person:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.contact_name, metaLeft + 35, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.contact_email, metaLeft + 15, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', metaRight, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.contact_phone, metaRight + 15, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Service Address:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(quote.service_address, pageWidth - 80);
  doc.text(addressLines, metaLeft + 38, yPos);

  yPos += 6 * addressLines.length + 10;

  // ===================================
  // SERVICES TABLE
  // ===================================

  doc.setFillColor(230, 233, 239);
  doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SERVICES', 22, yPos);

  yPos += 8;

  // Prepare table data
  const tableData = quote.items.map((item, index) => [
    String(index + 1),
    `${item.service_name}\n${item.speed_down}Mbps ↓ / ${item.speed_up}Mbps ↑${item.data_cap_gb ? `\nData: ${item.data_cap_gb}GB` : '\nUnlimited Data'}`,
    item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1),
    String(item.quantity),
    formatCurrency(item.monthly_price),
    formatCurrency(item.installation_price),
    formatCurrency(item.monthly_price * item.quantity)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Service Description', 'Type', 'Qty', 'Monthly', 'Install', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 131, 31], // CircleTel Orange
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===================================
  // PRICING SUMMARY
  // ===================================

  const summaryX = pageWidth - 80;

  doc.setDrawColor(230, 233, 239);
  doc.setLineWidth(0.5);

  // Subtotal Monthly
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal (Monthly):', summaryX, yPos);
  doc.text(formatCurrency(quote.subtotal_monthly), summaryX + 60, yPos, { align: 'right' });
  yPos += 7;

  // Installation
  if (quote.subtotal_installation > 0) {
    doc.text('Installation (Once-off):', summaryX, yPos);
    doc.text(formatCurrency(quote.subtotal_installation), summaryX + 60, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.line(summaryX, yPos - 2, summaryX + 60, yPos - 2);

  // VAT
  doc.text('VAT (15%):', summaryX, yPos);
  doc.text(formatCurrency(quote.vat_amount_monthly), summaryX + 60, yPos, { align: 'right' });
  yPos += 7;

  if (quote.vat_amount_installation > 0) {
    doc.text('VAT on Installation:', summaryX, yPos);
    doc.text(formatCurrency(quote.vat_amount_installation), summaryX + 60, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.line(summaryX, yPos - 2, summaryX + 60, yPos - 2);

  // Total Monthly
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(245, 131, 31); // Orange
  doc.text('TOTAL MONTHLY:', summaryX, yPos);
  doc.text(formatCurrency(quote.total_monthly), summaryX + 60, yPos, { align: 'right' });
  yPos += 8;

  // Total Installation
  if (quote.total_installation > 0) {
    doc.text('TOTAL INSTALLATION:', summaryX, yPos);
    doc.text(formatCurrency(quote.total_installation), summaryX + 60, yPos, { align: 'right' });
    yPos += 8;
  }

  yPos += 10;

  // ===================================
  // CUSTOMER NOTES
  // ===================================

  if (quote.customer_notes && !quote.customer_notes.startsWith('REJECTED:')) {
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 20, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(quote.customer_notes, pageWidth - 40);
    doc.text(notesLines, 20, yPos);
    yPos += 5 * notesLines.length + 10;
  }

  // ===================================
  // TERMS & CONDITIONS
  // ===================================

  if (options.includeTerms !== false) {
    // Add new page if needed
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(230, 233, 239);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TERMS & CONDITIONS', 22, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);

    const terms = [
      '1. This quote is valid for 30 days from the date of issue.',
      '2. Prices are quoted in South African Rands (ZAR) and include 15% VAT.',
      '3. Installation is subject to a successful site survey and feasibility assessment.',
      '4. Services are provided subject to network availability at the specified address.',
      '5. Contract terms are binding for the specified duration. Early termination fees may apply.',
      '6. Monthly fees are billed in advance and are due on the 1st of each month.',
      '7. Installation fees are payable upon contract signing or before installation commences.',
      '8. Customer is responsible for providing suitable infrastructure and access for installation.',
      '9. Service Level Agreements (SLAs) are detailed in the full service agreement.',
      '10. CircleTel reserves the right to amend pricing subject to 30 days written notice.'
    ];

    terms.forEach(term => {
      const termLines = doc.splitTextToSize(term, pageWidth - 45);
      doc.text(termLines, 22, yPos);
      yPos += 5 * termLines.length;
    });

    yPos += 10;
  }

  // ===================================
  // SIGNATURE SECTION
  // ===================================

  if (options.includeSignature !== false && quote.signature) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(230, 233, 239);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CUSTOMER ACCEPTANCE', 22, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.setFont('helvetica', 'bold');
    doc.text('Signed by:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.signature.signer_name, 45, yPos);

    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(quote.signature.signed_at), 45, yPos);

    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('ID Number:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.signature.signer_id_number, 45, yPos);

    yPos += 10;

    // Signature image placeholder
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, yPos, 80, 30);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Digital Signature', 60, yPos + 15, { align: 'center' });
  }

  // ===================================
  // FOOTER
  // ===================================

  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('CircleTel (Pty) Ltd | Reg: 2020/123456/07 | VAT: 4123456789', pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.circletel.co.za | support@circletel.co.za | 087 820 0000', pageWidth / 2, footerY + 4, { align: 'center' });

  return doc;
}

/**
 * Generate and download PDF
 */
export function downloadQuotePDF(quote: QuoteDetails, options?: PDFOptions): void {
  const pdf = generateQuotePDF(quote, options);
  pdf.save(`CircleTel-Quote-${quote.quote_number}.pdf`);
}

/**
 * Generate PDF as blob for server-side usage
 */
export function generateQuotePDFBlob(quote: QuoteDetails, options?: PDFOptions): Blob {
  const pdf = generateQuotePDF(quote, options);
  return pdf.output('blob');
}
