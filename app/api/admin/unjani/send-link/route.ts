import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { issueToken, buildMagicLinkUrl, svc } from '@/lib/onboarding/onboarding-service';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';

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

  // Send via the chosen channel. SMS shown; swap for WhatsApp/email per project helpers.
  if (channel === 'sms' && customer.phone) {
    const message = `CircleTel: complete your billing setup for ${customer.business_name}: ${url} (link valid 7 days)`;
    await clickatellService.sendSMS({ to: customer.phone, text: message });
  }
  await supabase.from('customers').update({ onboarding_status: 'in_progress' }).eq('id', customerId).eq('onboarding_status', 'pending');

  return NextResponse.json({ success: true, url });
}
