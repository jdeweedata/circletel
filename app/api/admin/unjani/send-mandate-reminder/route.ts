import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import { apiLogger } from '@/lib/logging/logger';

/**
 * POST /api/admin/unjani/send-mandate-reminder
 *
 * Sends the DebiCheck "approve your debit order" WhatsApp heads-up
 * (template circletel_debicheck_reminder) to a clinic nurse — a primer so she
 * doesn't dismiss the NetCash signing SMS as phishing. Does NOT touch NetCash;
 * resending the actual DebiCheck request is a separate NetCash-portal action.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const { customerId } = await request.json();
  if (!customerId) {
    return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 });
  }

  const supabase = svc();
  const { data: customer } = await supabase
    .from('customers')
    .select('id, phone, first_name, business_name')
    .eq('id', customerId)
    .single();
  if (!customer) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
  }
  if (!customer.phone) {
    return NextResponse.json({ success: false, error: 'Customer has no phone number' }, { status: 400 });
  }

  // Monthly amount incl VAT — from the clinic's service price, defaulting to R450 ex VAT.
  const { data: svcRow } = await supabase
    .from('customer_services')
    .select('monthly_price')
    .eq('customer_id', customerId)
    .maybeSingle();
  const exVat = Number(svcRow?.monthly_price ?? 450);
  const amount = `R${(exVat * 1.15).toFixed(2)}`;

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
  const headerImageUrl = `${base}/images/onboarding/debicheck-whatsapp-header.png`;

  let sent = false;
  let sendError: string | undefined;
  try {
    const result = await whatsAppService.sendDebiCheckReminder(
      customer.phone,
      {
        firstName: customer.first_name || 'there',
        clinicName: customer.business_name || 'your clinic',
        amount,
        headerImageUrl,
      },
      { customerId: customer.id, createdBy: auth.adminUser.email }
    );
    sent = result.success;
    if (!result.success) {
      sendError = result.error;
      apiLogger.warn('[Onboarding] DebiCheck reminder send failed', {
        customerId,
        phone: customer.phone,
        error: result.error,
      });
    }
  } catch (error) {
    sendError = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Onboarding] DebiCheck reminder send exception', { customerId, error });
  }

  apiLogger.info('[Onboarding] DebiCheck reminder issued', {
    customerId,
    issuedBy: auth.adminUser.email,
    sent,
  });

  return NextResponse.json({ success: true, sent, sendError });
}
