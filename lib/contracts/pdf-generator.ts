/**
 * Contract PDF Generator
 * Task Group 6: Contract Generation & PDF with KYC Badge
 *
 * Generates professional contract PDFs with KYC verification badge
 * REUSES code from lib/quotes/pdf-generator-v2.ts
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/lib/supabase/server';
import { CIRCLETEL_LOGO_BASE64 } from '@/lib/quotes/circletel-logo-base64';
import { getTemplateForServiceType } from './contract-templates';
import { updateContractPdfUrl } from './contract-generator';
import type { ContractPDFData } from './types';

// REUSED from pdf-generator-v2.ts
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// REUSED from pdf-generator-v2.ts
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Add CircleTel header and footer to PDF page
 * REUSED from pdf-generator-v2.ts with modifications for contract
 */
function addHeaderFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header - CircleTel Logo (left side)
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

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(75, 75, 75);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Circle Tel SA (PTY) LTD - Authorized MTN Business Partner',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Registration Number: 2008/026404/07',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );
  doc.text(
    'All prices include VAT unless otherwise stated',
    pageWidth / 2,
    footerY + 8,
    { align: 'center' }
  );
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    footerY + 12,
    { align: 'center' }
  );
}

/**
 * Add KYC Verified badge to PDF (NEW - Task Group 6 specific)
 *
 * @param doc - jsPDF instance
 * @param yPosition - Y position for badge
 * @param kycData - KYC verification data
 * @returns New Y position after badge
 */
function addKYCBadge(
  doc: jsPDF,
  yPosition: number,
  kycData: { verifiedDate: string; riskTier: string }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const badgeX = pageWidth - 60;
  const badgeY = yPosition;
  const badgeWidth = 45;
  const badgeHeight = 12;

  // Draw green rounded rectangle background
  doc.setFillColor(16, 185, 129); // #10B981 green
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');

  // Add checkmark icon (✓)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255); // White
  doc.text('✓', badgeX + 3, badgeY + 8);

  // Add "KYC VERIFIED" text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('KYC VERIFIED', badgeX + 10, badgeY + 5);

  // Add "by Didit" text
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('by Didit', badgeX + 10, badgeY + 9);

  // Add verification date below badge
  doc.setFontSize(7);
  doc.setTextColor(75, 75, 75); // Grey
  doc.text(
    `Verified: ${formatDate(kycData.verifiedDate)}`,
    badgeX,
    badgeY + 16
  );

  // Add risk tier indicator
  const riskColor =
    kycData.riskTier === 'low'
      ? [16, 185, 129]
      : kycData.riskTier === 'medium'
      ? [245, 158, 11]
      : [239, 68, 68];
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(
    `Risk: ${kycData.riskTier.toUpperCase()}`,
    badgeX,
    badgeY + 20
  );

  return badgeY + 25; // Return new Y position
}

/**
 * Generate contract PDF with KYC badge
 *
 * @param contractId - Contract UUID
 * @returns URL of uploaded PDF in Supabase Storage
 */
export async function generateContractPDF(contractId: string): Promise<string> {
  const supabase = await createClient();

  try {
    // 1. Fetch contract data with joins
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        business_quotes!inner(
          quote_number,
          company_name,
          contact_person,
          email,
          phone,
          service_address
        ),
        kyc_sessions!inner(
          verified_at,
          risk_tier,
          verification_type
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    // 2. Prepare PDF data
    const pdfData: ContractPDFData = {
      contract: {
        contractNumber: contract.contract_number,
        contractType: contract.contract_type,
        contractTermMonths: contract.contract_term_months,
        startDate: contract.start_date,
        endDate: contract.end_date,
        monthlyRecurring: contract.monthly_recurring,
        onceOffFee: contract.once_off_fee,
        installationFee: contract.installation_fee,
        totalContractValue: contract.total_contract_value,
      },
      quote: {
        quoteNumber: (contract.business_quotes as any).quote_number,
        companyName: (contract.business_quotes as any).company_name,
        contactPerson: (contract.business_quotes as any).contact_person,
        email: (contract.business_quotes as any).email,
        phone: (contract.business_quotes as any).phone,
        installationAddress: (contract.business_quotes as any).service_address,
      },
      kyc: {
        verifiedDate: (contract.kyc_sessions as any).verified_at,
        riskTier: (contract.kyc_sessions as any).risk_tier,
        verificationType: (contract.kyc_sessions as any).verification_type,
      },
    };

    // 3. Create jsPDF instance
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 4. Page 1: Header, KYC Badge, Contract Summary
    addHeaderFooter(doc, 1, 3);

    let yPos = 50;

    // Add "SERVICE CONTRACT" title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153); // Blue
    doc.text('SERVICE CONTRACT', 15, yPos);

    // Add KYC badge (top-right)
    addKYCBadge(doc, 50, {
      verifiedDate: pdfData.kyc.verifiedDate,
      riskTier: pdfData.kyc.riskTier,
    });

    yPos += 10;

    // Contract details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Contract Number: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfData.contract.contractNumber, 55, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Contract Date: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(new Date().toISOString()), 55, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Based on Quote: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfData.quote.quoteNumber, 55, yPos);

    yPos += 12;

    // Customer details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', 15, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Name: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfData.quote.companyName, 50, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Person: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfData.quote.contactPerson, 50, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Email: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfData.quote.email, 50, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Phone: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfData.quote.phone, 50, yPos);

    yPos += 10;

    // Installation address
    doc.setFont('helvetica', 'bold');
    doc.text('Installation Address:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(
      pdfData.quote.installationAddress,
      pageWidth - 30
    );
    addressLines.forEach((line: string) => {
      doc.text(line, 15, yPos);
      yPos += 5;
    });

    yPos += 10;

    // Pricing table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('CONTRACT PRICING', 15, yPos);

    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: [
        ['Monthly Recurring Charge', formatCurrency(pdfData.contract.monthlyRecurring)],
        ['Contract Term', `${pdfData.contract.contractTermMonths} Months`],
        ['Installation Fee (Once-Off)', formatCurrency(pdfData.contract.installationFee)],
        ['Other Once-Off Fees', formatCurrency(pdfData.contract.onceOffFee)],
        ['Total Contract Value', formatCurrency(pdfData.contract.totalContractValue)],
      ],
      theme: 'striped',
      headStyles: {
        fillColor: [51, 102, 153],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: 'right' },
      },
    });

    // 5. Page 2: Terms & Conditions
    doc.addPage();
    addHeaderFooter(doc, 2, 3);

    yPos = 50;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('TERMS & CONDITIONS', 15, yPos);

    yPos += 8;

    // Get template for service type
    const template = getTemplateForServiceType(
      pdfData.contract.contractType as 'fibre' | 'wireless' | 'hybrid'
    );

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Add T&Cs
    template.termsAndConditions.forEach((term) => {
      const termLines = doc.splitTextToSize(term, pageWidth - 30);
      termLines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage();
          addHeaderFooter(doc, 2, 3);
          yPos = 50;
        }
        doc.text(line, 15, yPos);
        yPos += 4;
      });
      yPos += 3;
    });

    // 6. Page 3: SLA, Cancellation, Signatures
    doc.addPage();
    addHeaderFooter(doc, 3, 3);

    yPos = 50;

    // SLA Terms
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('SERVICE LEVEL AGREEMENT (SLA)', 15, yPos);

    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    template.slaTerms.forEach((sla) => {
      const slaLines = doc.splitTextToSize(sla, pageWidth - 30);
      slaLines.forEach((line: string) => {
        doc.text(line, 15, yPos);
        yPos += 4;
      });
      yPos += 2;
    });

    yPos += 5;

    // Cancellation Policy
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('CANCELLATION POLICY', 15, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const cancelLines = doc.splitTextToSize(template.cancellationPolicy, pageWidth - 30);
    cancelLines.forEach((line: string) => {
      doc.text(line, 15, yPos);
      yPos += 4;
    });

    yPos += 5;

    // Early Termination Fee
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('EARLY TERMINATION FEE', 15, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const etfLines = doc.splitTextToSize(template.earlyTerminationFee, pageWidth - 30);
    etfLines.forEach((line: string) => {
      doc.text(line, 15, yPos);
      yPos += 4;
    });

    yPos += 10;

    // Signature section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('SIGNATURES', 15, yPos);

    yPos += 8;

    // Signature table
    autoTable(doc, {
      startY: yPos,
      head: [['Signed For: CircleTel (duly Authorized)', 'Signed For: Customer (duly Authorized)']],
      body: [
        ['', ''],
        ['Date Signed: _________________', 'Date Signed: _________________'],
        ['Name: _______________________', 'Name: _______________________'],
        ['Signature: ___________________', 'Signature: ___________________'],
        ['Witness Signature: ___________', 'Witness Signature: ___________'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [51, 102, 153],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        minCellHeight: 10,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 90 },
      },
    });

    // 7. Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // 8. Upload to Supabase Storage
    const fileName = `${contract.customer_id}/${pdfData.contract.contractNumber}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contract-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      throw new Error('Failed to upload contract PDF');
    }

    // 9. Get public URL
    const { data: urlData } = supabase.storage
      .from('contract-documents')
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // 10. Update contract record with PDF URL
    await updateContractPdfUrl(contractId, pdfUrl);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    throw error;
  }
}
