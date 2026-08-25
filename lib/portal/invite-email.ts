import { EmailChannel } from '@/lib/notifications/channels/email-channel';
import { roleLabel, type InvitableHqRole } from '@/lib/portal/access-templates';

const FROM = 'CircleTel <billing@notify.circletel.co.za>';

export function portalLoginUrl(): string {
  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';
  return `${origin.replace(/\/$/, '')}/unjani/login`;
}

export function portalInviteRedirectUrl(): string {
  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';
  return `${origin.replace(/\/$/, '')}/auth/callback?next=/unjani`;
}

export async function sendPortalAccessEmail(input: {
  to: string;
  displayName: string;
  role: InvitableHqRole;
  organisationName: string;
  invited: boolean;
}): Promise<{ sent: boolean; warning?: string }> {
  const loginUrl = portalLoginUrl();
  const label = roleLabel(input.role);
  const subject = input.invited
    ? 'You’ve been invited to Unjani Connect'
    : 'You’ve been given Unjani Connect portal access';
  const intro = input.invited
    ? `Hi ${input.displayName}, you’ve been invited to Unjani Connect for ${input.organisationName}.`
    : `Hi ${input.displayName}, you’ve been given Unjani Connect access for ${input.organisationName}.`;

  const result = await EmailChannel.send({
    from: FROM,
    to: input.to,
    subject,
    html: `
      <p>${intro}</p>
      <p>Your role is <strong>${label}</strong>.</p>
      <p><a href="${loginUrl}">Log in to the portal</a></p>
      <p>If you did not expect this email, you can ignore it.</p>
    `,
    tags: {
      template_id: 'portal_hq_invite',
      notification_type: input.invited ? 'portal_invite' : 'portal_access_granted',
    },
  });

  if (!result.success) {
    return { sent: false, warning: result.error || 'Invite email could not be sent' };
  }

  return { sent: true };
}
