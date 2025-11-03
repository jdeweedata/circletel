/**
 * POST /api/contracts/create-from-quote
 * Task Group 8: API Layer - Contract Endpoints
 *
 * Creates a contract from an approved quote with KYC verification
 * Validates KYC approval, generates PDF with KYC badge, triggers ZOHO sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createContractFromQuote } from '@/lib/contracts/contract-generator';
import { generateContractPDF } from '@/lib/contracts/pdf-generator';
import { createZohoSyncService } from '@/lib/integrations/zoho/sync-service';
import type { ContractCreateRequest } from '@/lib/contracts/types';

/**
 * Create contract from approved quote
 *
 * Validates:
 * - KYC session status = 'completed'
 * - KYC verification_result = 'approved'
 * - Quote exists and is approved
 *
 * Returns:
 * - Contract ID, number, and PDF URL
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Parse request body
    const body = (await request.json()) as ContractCreateRequest;
    const { quoteId, kycSessionId } = body;

    // 2. Validate input
    if (!quoteId || !kycSessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: quoteId and kycSessionId are required',
        },
        { status: 400 }
      );
    }

    // 3. Fetch KYC session and validate approval status
    const { data: kycSession, error: kycError } = await supabase
      .from('kyc_sessions')
      .select('id, status, verification_result, quote_id')
      .eq('id', kycSessionId)
      .single();

    if (kycError || !kycSession) {
      console.error('[ContractAPI] KYC session not found:', kycError);
      return NextResponse.json(
        {
          success: false,
          error: 'KYC session not found',
        },
        { status: 404 }
      );
    }

    // 4. Validate KYC approval
    if (kycSession.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: `KYC verification not completed. Current status: ${kycSession.status}`,
        },
        { status: 400 }
      );
    }

    if (kycSession.verification_result !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: `KYC verification not approved. Current result: ${kycSession.verification_result}`,
        },
        { status: 400 }
      );
    }

    // 5. Validate KYC session matches quote
    if (kycSession.quote_id !== quoteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'KYC session does not match the provided quote',
        },
        { status: 400 }
      );
    }

    // 6. Check if contract already exists for this quote
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id, contract_number, pdf_url, status')
      .eq('quote_id', quoteId)
      .single();

    if (existingContract) {
      console.log('[ContractAPI] Contract already exists for quote:', quoteId);
      return NextResponse.json({
        success: true,
        data: {
          contractId: existingContract.id,
          contractNumber: existingContract.contract_number,
          pdfUrl: existingContract.pdf_url,
          status: existingContract.status,
        },
      });
    }

    // 7. Create contract from quote
    const { contractId, contractNumber } = await createContractFromQuote(
      quoteId,
      kycSessionId
    );

    console.log('[ContractAPI] Contract created:', contractNumber);

    // 8. Generate contract PDF with KYC badge
    let pdfUrl: string | null = null;
    try {
      pdfUrl = await generateContractPDF(contractId);
      console.log('[ContractAPI] PDF generated:', pdfUrl);
    } catch (pdfError) {
      console.error('[ContractAPI] PDF generation failed:', pdfError);
      // Continue without PDF - can be regenerated later
    }

    // 9. Trigger ZOHO CRM sync (fire-and-forget)
    try {
      const zohoSync = createZohoSyncService();
      zohoSync.syncContractToDeal(contractId, { forceSync: false }).catch((syncError) => {
        console.error('[ContractAPI] ZOHO sync failed (non-blocking):', syncError);
      });
    } catch (syncError) {
      console.error('[ContractAPI] ZOHO sync initialization failed:', syncError);
      // Non-blocking - can be manually synced later
    }

    // 10. Return success response
    return NextResponse.json({
      success: true,
      data: {
        contractId,
        contractNumber,
        pdfUrl,
        status: 'draft',
      },
    });
  } catch (error) {
    console.error('[ContractAPI] Error creating contract:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contract',
      },
      { status: 500 }
    );
  }
}
