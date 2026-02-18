import { NextRequest, NextResponse } from 'next/server';
import { createBusinessQuote, QuoteGenerationError } from '@/lib/quotes/quote-generator';
import type { CreateQuoteRequest, QuoteItemType, ContractTerm, QuoteWithItems } from '@/lib/quotes/types';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

/**
 * Bulk Quote Creation Request
 * Used by the B2B Feasibility Portal to create quotes for multiple sites
 */
interface BulkQuoteRequest {
  clientDetails: {
    companyName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  requirements: {
    speedRequirement: '100' | '200' | '500' | '1000';
    contention: 'best-effort' | '10:1' | 'dia';
    contractTerm?: 12 | 24 | 36;
  };
  sites: Array<{
    address: string;
    coordinates?: { lat: number; lng: number };
    packages: Array<{
      packageId: string;
      itemType: 'primary' | 'secondary' | 'additional';
    }>;
  }>;
}

interface BulkQuoteResult {
  siteIndex: number;
  address: string;
  success: boolean;
  quote?: QuoteWithItems;
  error?: string;
  errorCode?: string;
}

interface BulkQuoteResponse {
  success: boolean;
  totalSites: number;
  successCount: number;
  failureCount: number;
  results: BulkQuoteResult[];
  summary: {
    totalMonthlyValue: number;
    totalInstallationValue: number;
    quoteNumbers: string[];
  };
}

/**
 * POST /api/quotes/business/bulk-create
 *
 * Create multiple business quotes for a multi-site feasibility assessment.
 * Each site with coverage gets an individual quote.
 */
export async function POST(request: NextRequest): Promise<NextResponse<BulkQuoteResponse | { success: false; error: string }>> {
  try {
    const body = await request.json() as BulkQuoteRequest;

    // Validate request structure
    const validationError = validateBulkRequest(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const results: BulkQuoteResult[] = [];
    const contractTerm: ContractTerm = body.requirements.contractTerm || 24;

    apiLogger.info(`[Bulk Quote] Starting bulk quote creation for ${body.sites.length} sites`, {
      companyName: body.clientDetails.companyName,
      siteCount: body.sites.length,
      contractTerm,
    });

    // Process each site
    for (let i = 0; i < body.sites.length; i++) {
      const site = body.sites[i];

      try {
        // Skip sites without packages
        if (!site.packages || site.packages.length === 0) {
          results.push({
            siteIndex: i,
            address: site.address,
            success: false,
            error: 'No packages selected for this site',
            errorCode: 'NO_PACKAGES',
          });
          continue;
        }

        // Step 1: Create a coverage lead for this site
        const { data: lead, error: leadError } = await supabase
          .from('coverage_leads')
          .insert({
            customer_type: 'business',
            company_name: body.clientDetails.companyName,
            first_name: body.clientDetails.contactName?.split(' ')[0] || 'Business',
            last_name: body.clientDetails.contactName?.split(' ').slice(1).join(' ') || 'Contact',
            email: body.clientDetails.contactEmail || '',
            phone: body.clientDetails.contactPhone || '',
            address: site.address,
            coordinates: site.coordinates || null,
            lead_source: 'feasibility_portal',
            requested_speed: body.requirements.speedRequirement,
          })
          .select('id')
          .single();

        if (leadError || !lead) {
          apiLogger.error(`[Bulk Quote] Failed to create lead for site ${i}`, { error: leadError?.message });
          results.push({
            siteIndex: i,
            address: site.address,
            success: false,
            error: 'Failed to create coverage lead',
            errorCode: 'LEAD_CREATE_ERROR',
          });
          continue;
        }

        // Step 2: Build the quote request
        const quoteRequest: CreateQuoteRequest = {
          lead_id: lead.id,
          customer_type: 'enterprise', // B2B feasibility is enterprise by default
          company_name: body.clientDetails.companyName,
          contact_name: body.clientDetails.contactName || 'Contact',
          contact_email: body.clientDetails.contactEmail || '',
          contact_phone: body.clientDetails.contactPhone || '',
          service_address: site.address,
          coordinates: site.coordinates,
          contract_term: contractTerm,
          items: site.packages.map(pkg => ({
            package_id: pkg.packageId,
            item_type: pkg.itemType as QuoteItemType,
            quantity: 1,
          })),
          customer_notes: `Multi-site feasibility quote. Speed requirement: ${body.requirements.speedRequirement}Mbps, Contention: ${body.requirements.contention}`,
        };

        // Step 3: Create the quote
        const quote = await createBusinessQuote(quoteRequest);

        apiLogger.info(`[Bulk Quote] Created quote ${quote.quote_number} for site ${i}`, {
          quoteId: quote.id,
          address: site.address,
          monthlyTotal: quote.total_monthly,
        });

        results.push({
          siteIndex: i,
          address: site.address,
          success: true,
          quote,
        });
      } catch (error) {
        const errorMessage = error instanceof QuoteGenerationError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';
        const errorCode = error instanceof QuoteGenerationError
          ? error.code
          : 'UNKNOWN_ERROR';

        apiLogger.error(`[Bulk Quote] Failed to create quote for site ${i}:`, {
          address: site.address,
          error: errorMessage,
          code: errorCode,
        });

        results.push({
          siteIndex: i,
          address: site.address,
          success: false,
          error: errorMessage,
          errorCode,
        });
      }
    }

    // Calculate summary
    const successfulQuotes = results.filter(r => r.success && r.quote);
    const summary = {
      totalMonthlyValue: successfulQuotes.reduce(
        (sum, r) => sum + (r.quote?.total_monthly || 0),
        0
      ),
      totalInstallationValue: successfulQuotes.reduce(
        (sum, r) => sum + (r.quote?.total_installation || 0),
        0
      ),
      quoteNumbers: successfulQuotes
        .map(r => r.quote?.quote_number)
        .filter((qn): qn is string => !!qn),
    };

    const response: BulkQuoteResponse = {
      success: successfulQuotes.length > 0,
      totalSites: body.sites.length,
      successCount: successfulQuotes.length,
      failureCount: results.length - successfulQuotes.length,
      results,
      summary,
    };

    apiLogger.info(`[Bulk Quote] Completed bulk quote creation`, {
      totalSites: response.totalSites,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalMonthlyValue: summary.totalMonthlyValue,
    });

    return NextResponse.json(response, {
      status: successfulQuotes.length > 0 ? 201 : 400,
    });
  } catch (error) {
    apiLogger.error('[Bulk Quote] Unexpected error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process bulk quote request',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate the bulk quote request structure
 */
function validateBulkRequest(body: BulkQuoteRequest): string | null {
  if (!body.clientDetails) {
    return 'Client details are required';
  }

  if (!body.clientDetails.companyName?.trim()) {
    return 'Company name is required';
  }

  if (!body.requirements) {
    return 'Requirements are required';
  }

  if (!['100', '200', '500', '1000'].includes(body.requirements.speedRequirement)) {
    return 'Invalid speed requirement. Must be 100, 200, 500, or 1000';
  }

  if (!['best-effort', '10:1', 'dia'].includes(body.requirements.contention)) {
    return 'Invalid contention type. Must be best-effort, 10:1, or dia';
  }

  if (body.requirements.contractTerm && ![12, 24, 36].includes(body.requirements.contractTerm)) {
    return 'Invalid contract term. Must be 12, 24, or 36 months';
  }

  if (!body.sites || !Array.isArray(body.sites) || body.sites.length === 0) {
    return 'At least one site is required';
  }

  // Validate each site
  for (let i = 0; i < body.sites.length; i++) {
    const site = body.sites[i];

    if (!site.address?.trim()) {
      return `Site ${i + 1}: Address is required`;
    }

    if (site.packages && !Array.isArray(site.packages)) {
      return `Site ${i + 1}: Packages must be an array`;
    }

    // Validate each package in the site
    if (site.packages) {
      for (let j = 0; j < site.packages.length; j++) {
        const pkg = site.packages[j];

        if (!pkg.packageId) {
          return `Site ${i + 1}, Package ${j + 1}: Package ID is required`;
        }

        if (!['primary', 'secondary', 'additional'].includes(pkg.itemType)) {
          return `Site ${i + 1}, Package ${j + 1}: Invalid item type. Must be primary, secondary, or additional`;
        }
      }
    }
  }

  return null;
}
