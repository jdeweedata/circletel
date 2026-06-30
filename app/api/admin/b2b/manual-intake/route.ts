/**
 * POST /api/admin/b2b/manual-intake
 *
 * Admin-assisted B2B onboarding capture for business details received by email.
 * Supports creating a new business customer record or updating an existing one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { manualB2BIntakeSchema, saveManualB2BIntake } from '@/lib/onboarding/manual-intake';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;

    const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const body = await request.json();
    const parsed = manualB2BIntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_failed',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await saveManualB2BIntake(svc(), body, {
      adminId: auth.adminUser.id ?? auth.user.id,
      adminEmail: auth.adminUser.email,
    });

    apiLogger.info('[Manual B2B Intake] captured', {
      customerId: result.customerId,
      submissionId: result.submissionId,
      createdCustomer: result.createdCustomer,
      by: auth.adminUser.email,
    });

    return NextResponse.json({ success: true, intake: result });
  } catch (error) {
    apiLogger.error('[Manual B2B Intake] failed', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
