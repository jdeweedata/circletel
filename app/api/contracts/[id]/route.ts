/**
 * GET /api/contracts/[id]
 * Task Group 8: API Layer - Contract Endpoints
 *
 * Returns full contract details with KYC information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get contract by ID with related data
 *
 * Returns:
 * - Contract details
 * - Quote information
 * - KYC session data
 * - Customer information
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

    // 2. Fetch contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        business_quotes!inner (
          id,
          quote_number,
          company_name,
          contact_person,
          email,
          phone,
          service_address,
          billing_address,
          status,
          valid_until
        ),
        kyc_sessions!inner (
          id,
          didit_session_id,
          status,
          verification_result,
          risk_tier,
          flow_type,
          user_type,
          completed_at,
          created_at
        ),
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('[ContractAPI] Contract not found:', contractError);
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    // 3. Structure response data
    const responseData = {
      contract: {
        id: contract.id,
        contractNumber: contract.contract_number,
        contractType: contract.contract_type,
        contractTermMonths: contract.contract_term_months,
        startDate: contract.start_date,
        endDate: contract.end_date,
        status: contract.status,
        monthlyRecurring: contract.monthly_recurring,
        onceOffFee: contract.once_off_fee,
        installationFee: contract.installation_fee,
        totalContractValue: contract.total_contract_value,
        pdfUrl: contract.pdf_url,
        signedPdfUrl: contract.signed_pdf_url,
        createdAt: contract.created_at,
        updatedAt: contract.updated_at,
      },
      quote: {
        id: (contract.business_quotes as any).id,
        quoteNumber: (contract.business_quotes as any).quote_number,
        companyName: (contract.business_quotes as any).company_name,
        contactPerson: (contract.business_quotes as any).contact_person,
        email: (contract.business_quotes as any).email,
        phone: (contract.business_quotes as any).phone,
        serviceAddress: (contract.business_quotes as any).service_address,
        billingAddress: (contract.business_quotes as any).billing_address,
        status: (contract.business_quotes as any).status,
        validUntil: (contract.business_quotes as any).valid_until,
      },
      kyc: {
        id: (contract.kyc_sessions as any).id,
        diditSessionId: (contract.kyc_sessions as any).didit_session_id,
        status: (contract.kyc_sessions as any).status,
        verificationResult: (contract.kyc_sessions as any).verification_result,
        riskTier: (contract.kyc_sessions as any).risk_tier,
        flowType: (contract.kyc_sessions as any).flow_type,
        userType: (contract.kyc_sessions as any).user_type,
        completedAt: (contract.kyc_sessions as any).completed_at,
        createdAt: (contract.kyc_sessions as any).created_at,
      },
      customer: contract.customers
        ? {
            id: (contract.customers as any).id,
            firstName: (contract.customers as any).first_name,
            lastName: (contract.customers as any).last_name,
            email: (contract.customers as any).email,
            phone: (contract.customers as any).phone,
          }
        : null,
      signature: {
        zohoSignRequestId: contract.zoho_sign_request_id,
        customerSignatureDate: contract.customer_signature_date,
        circletelSignatureDate: contract.circletel_signature_date,
        fullySignedDate: contract.fully_signed_date,
      },
      zoho: {
        dealId: contract.zoho_deal_id,
        lastSyncedAt: contract.last_synced_at,
      },
    };

    // 4. Return success response
    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('[ContractAPI] Error fetching contract:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contract',
      },
      { status: 500 }
    );
  }
}
