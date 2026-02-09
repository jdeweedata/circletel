/**
 * GET /api/contracts/[id]/download-pdf
 * Task Group 8: API Layer - Contract Endpoints
 *
 * Streams contract PDF with "KYC Verified" badge
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContractPDF } from '@/lib/contracts/pdf-generator';
import { apiLogger } from '@/lib/logging';

/**
 * Download contract PDF
 *
 * - If PDF exists in storage, stream it
 * - If not, generate it on-the-fly and save
 * - Includes KYC verification badge
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  try {
    // 1. Get contract ID from params (Next.js 15 async pattern)
    const { id: contractId } = await context.params;

    if (!contractId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract ID is required',
        },
        { status: 400 }
      );
    }

    // 2. Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, contract_number, pdf_url, status, customer_id')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      apiLogger.error('[ContractPDFAPI] Contract not found:', contractError);
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    let pdfUrl = contract.pdf_url;

    // 3. Generate PDF if it doesn't exist
    if (!pdfUrl) {
      apiLogger.info('[ContractPDFAPI] PDF not found, generating...');
      try {
        pdfUrl = await generateContractPDF(contractId);
      } catch (pdfError) {
        apiLogger.error('[ContractPDFAPI] PDF generation failed:', pdfError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to generate PDF',
          },
          { status: 500 }
        );
      }
    }

    // 4. Fetch PDF from Supabase Storage
    const fileName = `${contract.customer_id}/${contract.contract_number}.pdf`;
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('contract-documents')
      .download(fileName);

    if (downloadError || !pdfData) {
      apiLogger.error('[ContractPDFAPI] PDF download failed:', downloadError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to download PDF',
        },
        { status: 500 }
      );
    }

    // 5. Convert Blob to Buffer
    const buffer = Buffer.from(await pdfData.arrayBuffer());

    // 6. Stream PDF with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contract.contract_number}.pdf"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    apiLogger.error('[ContractPDFAPI] Error downloading PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download PDF',
      },
      { status: 500 }
    );
  }
}
