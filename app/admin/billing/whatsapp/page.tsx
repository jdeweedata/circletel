'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { BulkWhatsAppPanel } from '@/components/admin/billing/BulkWhatsAppPanel';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// PAGE COMPONENT
// =============================================================================

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
      // Fetch stats
      const statsRes = await fetch('/api/admin/billing/whatsapp/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch recent messages
      const messagesRes = await fetch('/api/admin/billing/whatsapp/messages?limit=20');
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setRecentMessages(messagesData.messages || []);
      }

      // Fetch due invoices for bulk send
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'read':
        return <Badge className="bg-emerald-100 text-emerald-800"><Eye className="h-3 w-3 mr-1" />Read</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            WhatsApp Notifications
          </h1>
          <p className="text-gray-600">
            Send PayNow links and payment reminders via WhatsApp
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Send className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
                <p className="text-sm text-gray-600">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.read}</p>
                <p className="text-sm text-gray-600">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.customersWithConsent}</p>
                <p className="text-sm text-gray-600">With Consent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Today's Invoices
                </CardTitle>
                <CardDescription>
                  Invoices due today that can receive WhatsApp notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-2xl font-bold">{dueInvoices.length}</p>
                      <p className="text-sm text-gray-600">Due Today</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-emerald-700">
                        {dueInvoices.filter(inv =>
                          inv.customer?.whatsapp_consent && inv.customer?.phone
                        ).length}
                      </p>
                      <p className="text-sm text-emerald-700">Eligible</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">WhatsApp Template Status</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Invoice Payment</span>
                        <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Reminder</span>
                        <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Debit Failed</span>
                        <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Send Panel */}
            <BulkWhatsAppPanel
              invoices={dueInvoices}
              onComplete={handleRefresh}
            />
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>
                WhatsApp notifications sent in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {recentMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No messages sent yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentMessages.map((msg) => (
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
                            {msg.invoice?.total_amount && (
                              <p className="text-sm text-gray-500">
                                R{msg.invoice.total_amount.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {msg.template_name.replace('circletel_', '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
