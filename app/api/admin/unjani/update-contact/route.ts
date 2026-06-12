/**
 * Update-contact API — lets an admin change a clinic's contact details
 * (phone / email / nurse) before or during onboarding, e.g. a nurse asks for
 * the invite to go to a different number.
 *
 * POST /api/admin/unjani/update-contact
 * Body: { customerId: string; phone?: string; email?: string; nurseName?: string }
 *
 * At least one of phone/email/nurseName must be provided. The phone is what the
 * send-link / send-invite flow uses, so changing it here re-targets the invite.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;
    const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const body = await request.json().catch(() => ({}));
    const customerId: string = body.customerId;
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 });
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    const nurseName = typeof body.nurseName === 'string' ? body.nurseName.trim() : undefined;

    if (phone === undefined && email === undefined && nurseName === undefined) {
      return NextResponse.json(
        { success: false, error: 'Provide at least one of phone, email or nurseName' },
        { status: 400 }
      );
    }
    if (phone !== undefined && phone.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    const supabase = svc();

    const { data: customer, error: findErr } = await supabase
      .from('customers')
      .select('id, business_name, clinic_details, account_type')
      .eq('id', customerId)
      .single();
    if (findErr || !customer) {
      return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 });
    }

    // Guard: the phone-uniqueness index only applies to personal accounts; clinics
    // are business accounts so they can share/change numbers freely. Still block an
    // email collision with another customer for cleanliness.
    if (email !== undefined && email) {
      const { data: emailTaken } = await supabase
        .from('customers')
        .select('id')
        .ilike('email', email)
        .neq('id', customerId)
        .maybeSingle();
      if (emailTaken) {
        return NextResponse.json(
          { success: false, error: `Email ${email} is already used by another customer.` },
          { status: 409 }
        );
      }
    }

    const update: Record<string, unknown> = {};
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    if (nurseName !== undefined) {
      const details =
        customer.clinic_details && typeof customer.clinic_details === 'object'
          ? (customer.clinic_details as Record<string, unknown>)
          : {};
      update.clinic_details = { ...details, nurse_owner_name: nurseName || null };
    }

    const { error: updErr } = await supabase
      .from('customers')
      .update(update)
      .eq('id', customerId);
    if (updErr) {
      apiLogger.error('[Update contact] update failed', { customerId, error: updErr.message });
      return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
    }

    apiLogger.info('[Update contact] Clinic contact updated', {
      customerId,
      changed: Object.keys(update),
      updatedBy: auth.adminUser.email,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    apiLogger.error('[Update contact] API error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
