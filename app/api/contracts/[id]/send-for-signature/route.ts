/**
 * API Route: Send Contract for Signature
 * Task Group 7: ZOHO Sign Integration
 *
 * POST /api/contracts/[id]/send-for-signature
 * Sends contract to ZOHO Sign for digital signatures
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractForSignature } from '@/lib/integrations/zoho/sign-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract contract ID from params (Next.js 15 async pattern)
    const { id: contractId } = await context.params;

    console.log(`[Send for Signature] Processing contract ${contractId}`);

    // 2. Initialize Supabase client
    const supabase = await createClient();

    // 3. Validate contract exists and status = 'draft'
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, status, contract_number')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      console.error('[Send for Signature] Contract not found:', contractId);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // 4. Validate contract is in draft status
    if (contract.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Contract must be in draft status. Current status: ${contract.status}`,
        },
        { status: 400 }
      );
    }

    // 5. Send to ZOHO Sign
    console.log(`[Send for Signature] Sending contract ${contract.contract_number} to ZOHO Sign`);
    const { requestId, customerSigningUrl } = await sendContractForSignature(contractId);

    // 6. Update contract status to 'pending_signature'
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ status: 'pending_signature' })
      .eq('id', contractId);

    if (updateError) {
      console.error('[Send for Signature] Failed to update contract status:', updateError);
      // Don't throw - signature request was successful
    }

    // 7. Return success response
    return NextResponse.json({
      success: true,
      data: {
        zohoSignRequestId: requestId,
        customerSigningUrl,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Send for Signature Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send contract for signature',
      },
      { status: 500 }
    );
  }
}
