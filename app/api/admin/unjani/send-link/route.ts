import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { issueToken, buildMagicLinkUrl, svc } from '@/lib/onboarding/onboarding-service';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const { customerId, channel = 'sms' } = await request.json();
  if (!customerId) return NextResponse.json({ success: false, error: 'customerId required' }, { status: 400 });

  const supabase = svc();
  const { data: customer } = await supabase
    .from('customers').select('id, phone, email, business_name').eq('id', customerId).single();
  if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });

  const token = await issueToken(customerId, channel);
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
  const url = buildMagicLinkUrl(base, token);

  // Send via the chosen channel and capture result
  let smsSent = false;
  let smsError: string | undefined;

  if (channel === 'sms' && customer.phone) {
    const message = `CircleTel: complete your billing setup for ${customer.business_name}: ${url} (link valid 7 days)`;
    try {
      const result = await clickatellService.sendSMS({ to: customer.phone, text: message });
      if (result.success) {
        smsSent = true;
      } else {
        smsSent = false;
        smsError = result.error;
        apiLogger.warn('[Onboarding] SMS send failed', { customerId, phone: customer.phone, error: result.error });
      }
    } catch (error) {
      smsSent = false;
      smsError = error instanceof Error ? error.message : 'Unknown error';
      apiLogger.error('[Onboarding] SMS send exception', { customerId, phone: customer.phone, error });
    }
  } else if (channel === 'sms' && !customer.phone) {
    smsError = 'Customer has no phone number';
  }

  // Update onboarding status regardless of SMS outcome
  await supabase.from('customers').update({ onboarding_status: 'in_progress' }).eq('id', customerId).eq('onboarding_status', 'pending');

  // Audit log for magic link issuance
  apiLogger.info('[Onboarding] Magic link issued', {
    customerId,
    channel,
    issuedBy: auth.adminUser.email,
    smsSent
  });

  return NextResponse.json({ success: true, url, smsSent, smsError });
}
