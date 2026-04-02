import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export interface OnboardingStatusResponse {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
}

/**
 * GET /api/customers/onboarding-status
 *
 * Returns the completion state of each onboarding verification step for the
 * authenticated customer. Used by the dashboard OnboardingBanner component.
 *
 * Auth: Bearer token required
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const sessionSupabase = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser(
      authHeader.split(' ')[1]
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch customer record
    const { data: customer, error: customerError } = await serviceSupabase
      .from('customers')
      .select('id, email, email_verified, phone, phone_verified_at')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    // Check if this is a phantom-email account (phone-signup user)
    const isPhantomEmail = customer.email?.endsWith('@phone.circletel.co.za') ?? false;

    // Check for at least one order with an installation address
    const { data: addressedOrder } = await serviceSupabase
      .from('consumer_orders')
      .select('id, installation_address')
      .eq('email', customer.email)
      .not('installation_address', 'is', null)
      .limit(1)
      .maybeSingle();

    const hasServiceAddress = !!addressedOrder?.installation_address;

    // Check for approved KYC documents on any order
    const { data: orders } = await serviceSupabase
      .from('consumer_orders')
      .select('id')
      .eq('email', customer.email)
      .limit(20);

    let kycComplete = false;
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const { data: kycDocs } = await serviceSupabase
        .from('kyc_documents')
        .select('document_type, verification_status')
        .in('order_id', orderIds)
        .eq('verification_status', 'approved');

      if (kycDocs) {
        const approvedTypes = new Set(kycDocs.map((d) => d.document_type));
        kycComplete = approvedTypes.has('id_document') && approvedTypes.has('proof_of_address');
      }
    }

    // Build steps
    const steps: OnboardingStep[] = [
      {
        id: 'phone_verified',
        label: 'Phone verified',
        description: 'Your mobile number has been verified via OTP.',
        completed: !!customer.phone_verified_at,
        actionLabel: customer.phone ? undefined : 'Add phone',
        actionHref: '/dashboard/profile',
      },
      {
        id: 'email_added',
        label: 'Add your email',
        description: 'Add a real email address to your account.',
        completed: !isPhantomEmail,
        actionLabel: isPhantomEmail ? 'Add email' : undefined,
        actionHref: '/dashboard/profile',
      },
      {
        id: 'email_verified',
        label: 'Verify your email',
        description: 'Confirm your email address so we can send important updates.',
        completed: !!customer.email_verified && !isPhantomEmail,
        actionLabel: (!customer.email_verified && !isPhantomEmail) ? 'Verify now' : undefined,
        actionHref: '/dashboard/profile',
      },
      {
        id: 'address_added',
        label: 'Add service address',
        description: 'Confirm where you need the service installed.',
        completed: hasServiceAddress,
        actionLabel: !hasServiceAddress ? 'Add address' : undefined,
        actionHref: '/dashboard/profile',
      },
      {
        id: 'kyc_complete',
        label: 'Upload ID & proof of address',
        description: 'Required for RICA compliance and service activation.',
        completed: kycComplete,
        actionLabel: !kycComplete ? 'Upload now' : undefined,
        actionHref: '/dashboard/kyc',
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const totalCount = steps.length;

    return NextResponse.json({
      steps,
      completedCount,
      totalCount,
      isComplete: completedCount === totalCount,
    } satisfies OnboardingStatusResponse);
  } catch (error) {
    apiLogger.error('[OnboardingStatus] Unexpected error', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
