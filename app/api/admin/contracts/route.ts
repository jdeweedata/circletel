/**
 * Admin Contracts API
 *
 * GET /api/admin/contracts - List contracts with filters and pagination
 *
 * Query parameters:
 * - status: Filter by contract status (draft, pending_signature, partially_signed, fully_signed, active, expired, terminated)
 * - search: Search by contract_number or company_name (from business_quotes)
 * - dateFrom: Filter by created_at >= dateFrom
 * - dateTo: Filter by created_at <= dateTo
 * - page: Page number (default: 1)
 * - pageSize: Number of items per page (default: 20)
 *
 * @module app/api/admin/contracts/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

// Valid contract statuses
const VALID_STATUSES = [
  'draft',
  'pending_signature',
  'partially_signed',
  'fully_signed',
  'active',
  'expired',
  'terminated',
] as const;

type ContractStatus = (typeof VALID_STATUSES)[number];

export async function GET(request: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const supabase = await createClient();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ContractStatus | null;
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Calculate pagination offset
    const offset = (page - 1) * pageSize;

    // Build the query with joined business_quotes data
    let query = supabase
      .from('contracts')
      .select(
        `
        id,
        contract_number,
        quote_id,
        customer_id,
        kyc_session_id,
        contract_type,
        contract_term_months,
        start_date,
        end_date,
        monthly_recurring,
        once_off_fee,
        installation_fee,
        total_contract_value,
        zoho_sign_request_id,
        customer_signature_date,
        circletel_signature_date,
        fully_signed_date,
        signed_pdf_url,
        status,
        zoho_deal_id,
        last_synced_at,
        created_at,
        updated_at,
        business_quotes (
          id,
          quote_number,
          company_name,
          contact_person,
          email,
          phone,
          status
        )
      `,
        { count: 'exact' }
      );

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply date range filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      // Add end of day to include the entire dateTo day
      const dateToEnd = `${dateTo}T23:59:59.999Z`;
      query = query.lte('created_at', dateToEnd);
    }

    // Apply search filter (search in contract_number or business_quotes.company_name)
    // Note: Supabase doesn't support OR across tables directly, so we handle this with ilike on contract_number
    // and filter business_quotes separately if needed
    if (search) {
      // Search in contract_number using ilike
      query = query.or(`contract_number.ilike.%${search}%`);
    }

    // Apply sorting (newest first by default)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    // Execute the query
    const { data: contracts, error: contractsError, count } = await query;

    if (contractsError) {
      apiLogger.error('[AdminContractsAPI] Failed to fetch contracts', {
        error: contractsError.message,
        code: contractsError.code,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch contracts',
        },
        { status: 500 }
      );
    }

    // If search is provided, also search by company_name and merge results
    let filteredContracts = contracts || [];
    if (search && contracts) {
      // The OR filter above handles contract_number search
      // For company_name search in the joined table, we need to filter client-side
      // or do a separate query. For simplicity, let's include contracts where
      // the business_quotes.company_name matches
      const searchLower = search.toLowerCase();
      filteredContracts = contracts.filter((contract: any) => {
        const contractNumberMatch = contract.contract_number
          ?.toLowerCase()
          .includes(searchLower);
        const companyNameMatch = contract.business_quotes?.company_name
          ?.toLowerCase()
          .includes(searchLower);
        return contractNumberMatch || companyNameMatch;
      });
    }

    // Transform the response data
    const transformedContracts = filteredContracts.map((contract: any) => ({
      id: contract.id,
      contractNumber: contract.contract_number,
      quoteId: contract.quote_id,
      customerId: contract.customer_id,
      kycSessionId: contract.kyc_session_id,
      contractType: contract.contract_type,
      contractTermMonths: contract.contract_term_months,
      startDate: contract.start_date,
      endDate: contract.end_date,
      monthlyRecurring: contract.monthly_recurring,
      onceOffFee: contract.once_off_fee,
      installationFee: contract.installation_fee,
      totalContractValue: contract.total_contract_value,
      status: contract.status,
      signedPdfUrl: contract.signed_pdf_url,
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
      quote: contract.business_quotes
        ? {
            id: contract.business_quotes.id,
            quoteNumber: contract.business_quotes.quote_number,
            companyName: contract.business_quotes.company_name,
            contactPerson: contract.business_quotes.contact_person,
            email: contract.business_quotes.email,
            phone: contract.business_quotes.phone,
            status: contract.business_quotes.status,
          }
        : null,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
    }));

    // Calculate total (use count from query when no client-side filtering)
    const total = search ? filteredContracts.length : (count ?? 0);

    apiLogger.info('[AdminContractsAPI] Contracts listed', {
      total,
      page,
      pageSize,
      status: status || 'all',
      search: search || 'none',
    });

    return NextResponse.json({
      success: true,
      data: {
        contracts: transformedContracts,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    apiLogger.error('[AdminContractsAPI] Error fetching contracts', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contracts',
      },
      { status: 500 }
    );
  }
}
