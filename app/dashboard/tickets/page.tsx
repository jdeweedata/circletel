'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import { TicketConversationPanel } from '@/components/dashboard/TicketConversationPanel';
import { PiSpinnerBold } from 'react-icons/pi';

interface ZohoDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: 'Open' | 'On Hold' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  createdTime: string;
  modifiedTime: string;
  customerEmail: string;
  customerName: string;
  commentCount?: number;
}

export default function TicketsPage() {
  const { user, session, customer } = useCustomerAuth();
  const [tickets, setTickets] = useState<ZohoDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const email = user?.email ?? customer?.email;
    if (!email) return;

    fetch(`/api/support/tickets/list?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setTickets(result.data);
        } else {
          setError(result.error ?? 'Failed to load tickets');
        }
      })
      .catch(() => setError('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [session?.access_token, user?.email, customer]);

  const customerName =
    [customer?.first_name, customer?.last_name]
      .filter(Boolean)
      .join(' ') ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    'You';

  const customerEmail = user?.email ?? customer?.email ?? '';

  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-slate-900 mb-6">My Requests</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <PiSpinnerBold className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <TicketConversationPanel
          tickets={tickets}
          customerName={customerName}
          customerEmail={customerEmail}
          accessToken={session?.access_token ?? ''}
        />
      )}
    </div>
  );
}
