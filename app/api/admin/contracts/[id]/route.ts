/**
 * Admin Contract Detail API Route
 * GET /api/admin/contracts/[id] - Get contract details with full related data
 * PATCH /api/admin/contracts/[id] - Update contract fields
 * DELETE /api/admin/contracts/[id] - Soft delete (set status to 'terminated')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 15;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get contract by ID with full related data
 *
 * Returns:
 * - Contract details
 * - Quote information (company_name, contact_person, email, phone, addresses)
 * - KYC session data
 * - Customer information
 * - Signature details
 * - ZOHO sync info
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const supabase = await createClient();

  try {
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

    // Fetch contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        business_quotes (
          id,
          quote_number,
          company_name,
          contact_name,
          contact_email,
          contact_phone,
          registration_number,
          vat_number,
          service_address,
          coordinates,
          customer_type,
          contract_term,
          subtotal_monthly,
          subtotal_installation,
          total_monthly,
          total_installation,
          custom_discount_percent,
          custom_discount_amount,
          custom_discount_reason,
          admin_notes,
          customer_notes,
          status,
          valid_until,
          approved_at,
          sent_at,
          accepted_at,
          created_at
        ),
        kyc_sessions (
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
      apiLogger.error('[AdminContractAPI] Contract not found', {
        error: contractError?.message,
        code: contractError?.code,
        contractId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    // Structure response data with expanded quote fields
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
      quote: contract.business_quotes
        ? {
            id: (contract.business_quotes as any).id,
            quoteNumber: (contract.business_quotes as any).quote_number,
            companyName: (contract.business_quotes as any).company_name,
            contactPerson: (contract.business_quotes as any).contact_name,
            email: (contract.business_quotes as any).contact_email,
            phone: (contract.business_quotes as any).contact_phone,
            registrationNumber: (contract.business_quotes as any).registration_number,
            vatNumber: (contract.business_quotes as any).vat_number,
            serviceAddress: (contract.business_quotes as any).service_address,
            coordinates: (contract.business_quotes as any).coordinates,
            customerType: (contract.business_quotes as any).customer_type,
            contractTerm: (contract.business_quotes as any).contract_term,
            subtotalMonthly: (contract.business_quotes as any).subtotal_monthly,
            subtotalInstallation: (contract.business_quotes as any).subtotal_installation,
            totalMonthly: (contract.business_quotes as any).total_monthly,
            totalInstallation: (contract.business_quotes as any).total_installation,
            customDiscountPercent: (contract.business_quotes as any).custom_discount_percent,
            customDiscountAmount: (contract.business_quotes as any).custom_discount_amount,
            customDiscountReason: (contract.business_quotes as any).custom_discount_reason,
            adminNotes: (contract.business_quotes as any).admin_notes,
            customerNotes: (contract.business_quotes as any).customer_notes,
            status: (contract.business_quotes as any).status,
            validUntil: (contract.business_quotes as any).valid_until,
            approvedAt: (contract.business_quotes as any).approved_at,
            sentAt: (contract.business_quotes as any).sent_at,
            acceptedAt: (contract.business_quotes as any).accepted_at,
            createdAt: (contract.business_quotes as any).created_at,
          }
        : null,
      kyc: contract.kyc_sessions
        ? {
            id: (contract.kyc_sessions as any).id,
            diditSessionId: (contract.kyc_sessions as any).didit_session_id,
            status: (contract.kyc_sessions as any).status,
            verificationResult: (contract.kyc_sessions as any).verification_result,
            riskTier: (contract.kyc_sessions as any).risk_tier,
            flowType: (contract.kyc_sessions as any).flow_type,
            userType: (contract.kyc_sessions as any).user_type,
            completedAt: (contract.kyc_sessions as any).completed_at,
            createdAt: (contract.kyc_sessions as any).created_at,
          }
        : null,
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

    apiLogger.info('[AdminContractAPI] Contract fetched successfully', {
      contractId,
      contractNumber: contract.contract_number,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    apiLogger.error('[AdminContractAPI] Error fetching contract', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contract',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update contract fields
 *
 * Allowed fields:
 * - status: Contract status (draft, pending_signature, etc.)
 * - start_date: Contract start date
 * - end_date: Contract end date
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const supabase = await createClient();

  try {
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

    const body = await request.json();

    // Build update object with only allowed fields
    const updateData: Record<string, any> = {};

    // Status update
    if (body.status !== undefined) {
      const validStatuses = [
        'draft',
        'pending_signature',
        'partially_signed',
        'fully_signed',
        'active',
        'expired',
        'terminated',
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // Date updates
    if (body.start_date !== undefined) {
      updateData.start_date = body.start_date;
    }
    if (body.end_date !== undefined) {
      updateData.end_date = body.end_date;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update. Allowed fields: status, start_date, end_date',
        },
        { status: 400 }
      );
    }

    // Perform update
    const { data: contract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Contract not found',
          },
          { status: 404 }
        );
      }
      apiLogger.error('[AdminContractAPI] Failed to update contract', {
        error: updateError.message,
        code: updateError.code,
        contractId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update contract',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    apiLogger.info('[AdminContractAPI] Contract updated successfully', {
      contractId,
      contractNumber: contract.contract_number,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract updated successfully',
    });
  } catch (error) {
    apiLogger.error('[AdminContractAPI] Error updating contract', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contract',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Soft delete contract by setting status to 'terminated'
 *
 * This does not permanently delete the contract record.
 * Use query param ?force=true to permanently delete (not recommended).
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const supabase = await createClient();

  try {
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

    // Check for force delete parameter
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    if (forceDelete) {
      // Hard delete - use with caution
      const { error: deleteError } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (deleteError) {
        apiLogger.error('[AdminContractAPI] Failed to permanently delete contract', {
          error: deleteError.message,
          code: deleteError.code,
          contractId,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to delete contract',
            details: deleteError.message,
          },
          { status: 500 }
        );
      }

      apiLogger.warn('[AdminContractAPI] Contract permanently deleted', {
        contractId,
      });

      return NextResponse.json({
        success: true,
        message: 'Contract permanently deleted',
      });
    } else {
      // Soft delete - set status to 'terminated'
      const { data: contract, error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'terminated' })
        .eq('id', contractId)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          return NextResponse.json(
            {
              success: false,
              error: 'Contract not found',
            },
            { status: 404 }
          );
        }
        apiLogger.error('[AdminContractAPI] Failed to terminate contract', {
          error: updateError.message,
          code: updateError.code,
          contractId,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to terminate contract',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      apiLogger.info('[AdminContractAPI] Contract terminated (soft delete)', {
        contractId,
        contractNumber: contract.contract_number,
      });

      return NextResponse.json({
        success: true,
        data: contract,
        message: 'Contract terminated successfully',
      });
    }
  } catch (error) {
    apiLogger.error('[AdminContractAPI] Error deleting contract', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete contract',
      },
      { status: 500 }
    );
  }
}
