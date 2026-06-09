import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { issueToken, svc } from '@/lib/onboarding/onboarding-service';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import { apiLogger } from '@/lib/logging/logger';

/**
 * Batch WhatsApp onboarding invite for Unjani clinics.
 *
 * For each not-yet-onboarded clinic, issue a magic-link token and send the
 * `circletel_clinic_onboarding` WhatsApp template (from the billing WABA).
 * The template's URL button deep-links to /onboarding/<token> (the web wizard).
 *
 * Body: { dryRun?: boolean, customerIds?: string[] }
 *  - dryRun: list eligible clinics without sending.
 *  - customerIds: restrict to specific customers (otherwise all Unjani clinics
 *    with onboarding_status in pending/in_progress).
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const body = await request.json().catch(() => ({}));
  const dryRun: boolean = !!body.dryRun;
  const customerIds: string[] | undefined = Array.isArray(body.customerIds) ? body.customerIds : undefined;

  const supabase = svc();

  let query = supabase
    .from('customers')
    .select('id, phone, business_name, onboarding_status')
    .in('onboarding_status', ['pending', 'in_progress']);

  if (customerIds && customerIds.length > 0) {
    query = query.in('id', customerIds);
  } else {
    query = query.ilike('business_name', '%unjani%');
  }

  const { data: clinics, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const eligible = (clinics || []).filter((c) => !!c.phone);
  const noPhone = (clinics || []).filter((c) => !c.phone).map((c) => ({ id: c.id, business_name: c.business_name }));

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      eligibleCount: eligible.length,
      eligible: eligible.map((c) => ({ id: c.id, business_name: c.business_name, phone: c.phone })),
      skippedNoPhone: noPhone,
    });
  }

  const results: Array<{ id: string; business_name: string | null; sent: boolean; error?: string }> = [];
  let sentCount = 0;

  for (const clinic of eligible) {
    try {
      const token = await issueToken(clinic.id, 'whatsapp');
      const res = await whatsAppService.sendClinicOnboarding(clinic.phone!, {
        clinicName: clinic.business_name || 'there',
        token,
      });
      if (res.success) {
        sentCount++;
        await supabase
          .from('customers')
          .update({ onboarding_status: 'in_progress' })
          .eq('id', clinic.id)
          .eq('onboarding_status', 'pending');
      }
      results.push({ id: clinic.id, business_name: clinic.business_name, sent: res.success, error: res.error });
    } catch (err) {
      results.push({
        id: clinic.id,
        business_name: clinic.business_name,
        sent: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
    // Rate-limit between sends
    await new Promise((r) => setTimeout(r, 150));
  }

  apiLogger.info('[Onboarding] WhatsApp batch invite sent', {
    issuedBy: auth.adminUser.email,
    total: eligible.length,
    sent: sentCount,
    failed: eligible.length - sentCount,
  });

  return NextResponse.json({
    success: true,
    total: eligible.length,
    sent: sentCount,
    failed: eligible.length - sentCount,
    skippedNoPhone: noPhone,
    results,
  });
}
