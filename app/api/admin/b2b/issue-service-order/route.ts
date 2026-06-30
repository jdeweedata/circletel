/**
 * POST /api/admin/b2b/issue-service-order
 *
 * Generates a Service Order PDF, stores it against the onboarding submission,
 * emails the PDF to the customer, and includes a customer-owned signoff link.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { issueServiceOrderForCustomer } from '@/lib/onboarding/service-order-issuer';
import { apiLogger } from '@/lib/logging/logger';

interface RequestBody {
  customerId: string;
}

interface ServiceOrderResponse {
  success: boolean;
  pdfPath?: string;
  emailed?: boolean;
  signoffUrl?: string;
  message: string;
  error?: string;
}

function baseUrlFromRequest(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get('origin') ||
    new URL(request.url).origin
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<ServiceOrderResponse>> {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response as NextResponse<ServiceOrderResponse>;

    const perm = requirePermission(authResult.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm as NextResponse<ServiceOrderResponse>;

    const { customerId } = (await request.json()) as RequestBody;
    if (!customerId) {
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'customerId is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const result = await issueServiceOrderForCustomer(supabase, {
      customerId,
      baseUrl: baseUrlFromRequest(request),
      issuedBy: authResult.adminUser.email,
      sendEmail: true,
    });

    apiLogger.info('[Service Order] issued with signoff link', {
      customerId,
      submissionId: result.submissionId,
      pdfPath: result.pdfPath,
      emailed: result.emailed,
      by: authResult.adminUser.email,
    });

    return NextResponse.json<ServiceOrderResponse>(
      {
        success: true,
        pdfPath: result.pdfPath,
        emailed: result.emailed,
        signoffUrl: result.signoffUrl,
        message: `Service Order issued successfully. Email ${result.emailed ? 'sent' : 'could not be sent'}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    apiLogger.error('[Service Order] failed', { error });
    return NextResponse.json<ServiceOrderResponse>(
      {
        success: false,
        message: 'Service Order could not be issued',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
