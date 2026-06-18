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

function normalizeSAPhone(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s-]/g, '');
  return /^(0\d{9}|\+27\d{9})$/.test(cleaned) ? cleaned : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;
    const perm = requirePermission(auth.adminUser, 'customers:write');
    if (perm) return perm;

    const body = await request.json().catch(() => ({}));
    const customerId: string = body.customerId;
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 });
    }

    const phone =
      typeof body.phone === 'string' ? normalizeSAPhone(body.phone) : undefined;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    const nurseName = typeof body.nurseName === 'string' ? body.nurseName.trim() : undefined;
    const siteAddress = typeof body.siteAddress === 'string' ? body.siteAddress.trim() : undefined;
    const incumbentIsp = typeof body.incumbentIsp === 'string' ? body.incumbentIsp.trim() : undefined;
    const incumbentCost = body.incumbentCost !== undefined ? body.incumbentCost : undefined;
    const contractStatus = typeof body.contractStatus === 'string' ? body.contractStatus.trim() : undefined;

    if (
      phone === undefined &&
      email === undefined &&
      nurseName === undefined &&
      siteAddress === undefined &&
      incumbentIsp === undefined &&
      incumbentCost === undefined &&
      contractStatus === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'Provide at least one field to update' },
        { status: 400 }
      );
    }
    if (typeof body.phone === 'string' && phone === null) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }
    if (typeof body.email === 'string' && email.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email cannot be blank' },
        { status: 400 }
      );
    }
    if (email !== undefined && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
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

    // Fetch current clinic_details for read-modify-write
    const { data: current } = await supabase
      .from('customers')
      .select('clinic_details')
      .eq('id', customerId)
      .single();
    const details = (current?.clinic_details ?? {}) as Record<string, unknown>;

    const update: Record<string, unknown> = {};
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;

    // Build merged clinic_details with all provided updates
    const mergedDetails = {
      ...details,
      ...(nurseName !== undefined ? { nurse_owner_name: nurseName || null } : {}),
      ...(siteAddress !== undefined ? { site_address: siteAddress || null } : {}),
      ...(incumbentIsp !== undefined ? { incumbent_isp: incumbentIsp || null } : {}),
      ...(incumbentCost !== undefined
        ? {
            incumbent_cost:
              incumbentCost === '' || incumbentCost == null || !Number.isFinite(Number(incumbentCost))
                ? null
                : Number(incumbentCost),
          }
        : {}),
      // Only persist a valid enum value; ignore anything else (don't trust the client).
      ...(contractStatus !== undefined &&
      ['in_contract', 'out_of_contract', 'unknown'].includes(contractStatus)
        ? { contract_status: contractStatus }
        : {}),
    };

    if (
      nurseName !== undefined ||
      siteAddress !== undefined ||
      incumbentIsp !== undefined ||
      incumbentCost !== undefined ||
      contractStatus !== undefined
    ) {
      update.clinic_details = mergedDetails;
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
