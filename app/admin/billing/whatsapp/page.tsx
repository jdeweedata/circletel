'use client';

import {
  PiArrowsClockwiseBold,
  PiChatBold,
  PiCheckCircleBold,
  PiClockBold,
  PiEyeBold,
  PiFileTextBold,
  PiPaperPlaneRightBold,
  PiUsersBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BulkWhatsAppPanel } from '@/components/admin/billing/BulkWhatsAppPanel';
import { toast } from 'sonner';
import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

interface MessageLog {
  id: string;
  message_id: string;
  phone: string;
  template_name: string;
  status: string;
  created_at: string;
  invoice?: {
    invoice_number: string;
    total_amount: number;
  };
  customer?: {
    first_name: string;
    last_name: string;
  };
}

interface DueInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  status: string;
  whatsapp_sent_at: string | null;
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    whatsapp_consent: boolean;
  };
}

interface Stats {
  totalSent: number;
  delivered: number;
  read: number;
  failed: number;
  customersWithConsent: number;
}

const MSG_STATUS_VARIANT: Record<string, StatusVariant> = {
  sent: 'warning',
  delivered: 'info',
  read: 'success',
  failed: 'error',
};

export default function WhatsAppDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalSent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    customersWithConsent: 0,
  });
  const [recentMessages, setRecentMessages] = useState<MessageLog[]>([]);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);

  const fetchData = async () => {
    try {
      const statsRes = await fetch('/api/admin/billing/whatsapp/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const messagesRes = await fetch('/api/admin/billing/whatsapp/messages?limit=20');
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setRecentMessages(messagesData.messages || []);
      }

      const invoicesRes = await fetch('/api/admin/billing/invoices/due');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setDueInvoices(invoicesData.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load WhatsApp data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading WhatsApp data..." />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="WhatsApp Notifications"
        subtitle="Send PayNow links and payment reminders via WhatsApp"
        actions={
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <PiArrowsClockwiseBold className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Sent"
          value={stats.totalSent}
          icon={<PiPaperPlaneRightBold className="h-5 w-5" />}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          icon={<PiCheckCircleBold className="h-5 w-5" />}
        />
        <StatCard label="Read" value={stats.read} icon={<PiEyeBold className="h-5 w-5" />} />
        <StatCard label="Failed" value={stats.failed} icon={<PiXCircleBold className="h-5 w-5" />} />
        <StatCard
          label="With Consent"
          value={stats.customersWithConsent}
          icon={<PiUsersBold className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard title="Today's Invoices">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold tabular-nums">{dueInvoices.length}</p>
                    <p className="text-sm text-gray-600">Due Today</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700 tabular-nums">
                      {
                        dueInvoices.filter(
                          (inv) => inv.customer?.whatsapp_consent && inv.customer?.phone
                        ).length
                      }
                    </p>
                    <p className="text-sm text-green-700">Eligible</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">WhatsApp Template Status</h4>
                  <div className="space-y-1 text-sm">
                    {['Invoice Payment', 'Payment Reminder', 'Debit Failed'].map((label) => (
                      <div key={label} className="flex justify-between">
                        <span>{label}</span>
                        <StatusBadge status="Active" variant="success" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <BulkWhatsAppPanel invoices={dueInvoices} onComplete={handleRefresh} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <SectionCard title="Recent Messages">
            {recentMessages.length === 0 ? (
              <EmptyState
                icon={<PiChatBold />}
                title="No messages sent yet"
                description="WhatsApp notifications from the last 7 days will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="text-sm">
                        {new Date(msg.created_at).toLocaleString('en-ZA', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {msg.customer?.first_name} {msg.customer?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{msg.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{msg.invoice?.invoice_number || '-'}</p>
                          {msg.invoice?.total_amount != null && (
                            <p className="text-sm text-gray-500 tabular-nums">
                              R{msg.invoice.total_amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={msg.template_name.replace('circletel_', '').replace(/_/g, ' ')}
                          variant="neutral"
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                          variant={MSG_STATUS_VARIANT[msg.status] ?? 'neutral'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
