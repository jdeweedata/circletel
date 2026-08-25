import { WhatsAppInbox } from '@/components/admin/inbox/WhatsAppInbox';

export const dynamic = 'force-dynamic';

export default function AdminSupportInboxPage() {
  return <WhatsAppInbox channel="support" />;
}
