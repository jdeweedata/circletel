import { NextRequest, NextResponse } from 'next/server';
import { resolveTokenForPurpose, svc } from '@/lib/onboarding/onboarding-service';
import {
  buildServiceOrderAcceptanceRecord,
  issueServiceOrderForCustomer,
} from '@/lib/onboarding/service-order-issuer';
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token) {
      return NextResponse.json({ success: false, error: 'token_required' }, { status: 400 });
    }

    const resolved = await resolveTokenForPurpose(token, 'service_order_signoff');
    if (!resolved) {
      return NextResponse.json({ success: false, error: 'invalid_or_expired' }, { status: 401 });
    }

    const supabase = svc();
    let submissionQuery = supabase
      .from('onboarding_submissions')
      .select('id, customer_id, segment, submission_data')
      .eq('customer_id', resolved.customerId);

    if (resolved.onboardingSubmissionId) {
      submissionQuery = submissionQuery.eq('id', resolved.onboardingSubmissionId);
    } else {
      submissionQuery = submissionQuery
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(1);
    }

    const { data: submission, error: submissionError } = await submissionQuery.single();
    if (submissionError || !submission) {
      return NextResponse.json(
        { success: false, error: 'submission_not_found' },
        { status: 404 }
      );
    }

    const existingData =
      submission.submission_data && typeof submission.submission_data === 'object'
        ? submission.submission_data
        : {};
    const acceptance = buildServiceOrderAcceptanceRecord({
      tokenId: resolved.tokenId,
      ip:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null,
      userAgent: request.headers.get('user-agent') || null,
      segment: submission.segment,
    });

    const { error: updateError } = await supabase
      .from('onboarding_submissions')
      .update({
        submission_data: {
          ...existingData,
          service_order_status: 'accepted',
          service_order_acceptance: acceptance,
        },
      })
      .eq('id', submission.id);
    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message || 'acceptance_update_failed' },
        { status: 500 }
      );
    }

    await supabase
      .from('onboarding_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resolved.tokenId);

    const issued = await issueServiceOrderForCustomer(supabase, {
      customerId: resolved.customerId,
      issuedBy: 'customer_signoff',
      sendEmail: false,
    });
    const billingReady = await maybeMarkBillingReady(supabase, resolved.customerId);

    return NextResponse.json({
      success: true,
      pdfPath: issued.pdfPath,
      billingReady,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
