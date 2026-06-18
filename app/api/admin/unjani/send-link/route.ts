import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { issueToken, buildMagicLinkUrl, svc } from '@/lib/onboarding/onboarding-service';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import { sendOnboardingEmail } from '@/lib/onboarding/onboarding-email';
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
    .from('customers').select('id, phone, email, business_name, account_number').eq('id', customerId).single();
  if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });

  const token = await issueToken(customerId, channel);
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
  const url = buildMagicLinkUrl(base, token);

  // Send via the chosen channel and capture result.
  // `sent`/`sendError` are channel-agnostic; smsSent kept for backward compatibility.
  let sent = false;
  let sendError: string | undefined;

  if (channel === 'email') {
    if (!customer.email) {
      sendError = 'Customer has no email address';
    } else {
      try {
        const result = await sendOnboardingEmail({
          to: customer.email,
          clinicName: customer.business_name || 'your clinic',
          accountNumber: customer.account_number || '',
          url,
        });
        sent = result.success;
        if (!result.success) {
          sendError = result.error;
          apiLogger.warn('[Onboarding] email send failed', { customerId, email: customer.email, error: result.error });
        }
      } catch (error) {
        sendError = error instanceof Error ? error.message : 'Unknown error';
        apiLogger.error('[Onboarding] email send exception', { customerId, email: customer.email, error });
      }
    }
  } else if (!customer.phone) {
    sendError = 'Customer has no phone number';
  } else if (channel === 'whatsapp') {
    try {
      const result = await whatsAppService.sendClinicOnboarding(
        customer.phone,
        {
          clinicName: customer.business_name || 'there',
          token,
        },
        { customerId, createdBy: auth.adminUser.email }
      );
      sent = result.success;
      if (!result.success) {
        sendError = result.error;
        apiLogger.warn('[Onboarding] WhatsApp send failed', { customerId, phone: customer.phone, error: result.error });
      }
    } catch (error) {
      sendError = error instanceof Error ? error.message : 'Unknown error';
      apiLogger.error('[Onboarding] WhatsApp send exception', { customerId, phone: customer.phone, error });
    }
  } else if (channel === 'sms') {
    const message = `CircleTel: complete your billing setup for ${customer.business_name}: ${url} (link valid 7 days)`;
    try {
      const result = await clickatellService.sendSMS({ to: customer.phone, text: message });
      sent = result.success;
      if (!result.success) {
        sendError = result.error;
        apiLogger.warn('[Onboarding] SMS send failed', { customerId, phone: customer.phone, error: result.error });
      }
    } catch (error) {
      sendError = error instanceof Error ? error.message : 'Unknown error';
      apiLogger.error('[Onboarding] SMS send exception', { customerId, phone: customer.phone, error });
    }
  }

  // Update onboarding status regardless of send outcome
  await supabase.from('customers').update({ onboarding_status: 'in_progress' }).eq('id', customerId).eq('onboarding_status', 'pending');

  // Audit log for magic link issuance
  apiLogger.info('[Onboarding] Magic link issued', {
    customerId,
    channel,
    issuedBy: auth.adminUser.email,
    sent,
  });

  return NextResponse.json({ success: true, url, channel, sent, sendError, smsSent: sent, smsError: sendError });
}
