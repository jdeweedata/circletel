'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, RefreshCw, Eye, CheckCircle2, XCircle, Shield, ShieldAlert, Zap, Download, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface WebhookLog {
  id: string;
  webhook_id: string;
  provider: string;
  event_type: string;
  status: string;
  signature_verified: boolean;
  success: boolean | null;
  transaction_id: string | null;
  processing_duration_ms: number | null;
  retry_count: number;
  error_message: string | null;
  received_at: string;
  headers: any;
  body_parsed: any;
}

export default function WebhookLogsPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from('payment_webhook_logs').select('*').order('received_at', { ascending: false }).limit(100);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (providerFilter !== 'all') query = query.eq('provider', providerFilter);
      if (searchTerm) query = query.or(`webhook_id.ilike.%${searchTerm}%,transaction_id.ilike.%${searchTerm}%`);
      const { data } = await query;
      setWebhooks(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [statusFilter, providerFilter, searchTerm]);

  const stats = {
    total: webhooks.length,
    processed: webhooks.filter(w => w.status === 'processed').length,
    failed: webhooks.filter(w => w.status === 'failed').length,
    verified: webhooks.filter(w => w.signature_verified).length
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      processed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      received: 'bg-blue-100 text-blue-700',
      processing: 'bg-yellow-100 text-yellow-700'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Logs</h1>
          <p className="text-gray-600 mt-1">Monitor payment provider webhooks</p>
        </div>
        <Button onClick={fetchWebhooks} disabled={loading} className="bg-circleTel-orange hover:bg-circleTel-orange/90">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Processed</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.processed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Failed</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.failed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Verified</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{stats.verified}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="netcash">NetCash</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Webhook Logs ({webhooks.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin" /></div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No webhooks found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Processing</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-xs">{webhook.webhook_id.substring(0, 12)}...</TableCell>
                    <TableCell><Badge variant="outline">{webhook.provider}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{webhook.event_type}</Badge></TableCell>
                    <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                    <TableCell>
                      {webhook.signature_verified ? (
                        <Shield className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{webhook.processing_duration_ms ? `${webhook.processing_duration_ms}ms` : '—'}</TableCell>
                    <TableCell className="text-sm">{new Date(webhook.received_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedWebhook(webhook); setDetailsOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Details</DialogTitle>
            <DialogDescription>ID: {selectedWebhook?.webhook_id}</DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-sm text-gray-500">Provider</div><div className="font-medium">{selectedWebhook.provider}</div></div>
                <div><div className="text-sm text-gray-500">Event Type</div><div className="font-medium">{selectedWebhook.event_type}</div></div>
                <div><div className="text-sm text-gray-500">Status</div>{getStatusBadge(selectedWebhook.status)}</div>
                <div><div className="text-sm text-gray-500">Verified</div><div className="font-medium">{selectedWebhook.signature_verified ? 'Yes' : 'No'}</div></div>
              </div>
              {selectedWebhook.error_message && (
                <div className="bg-red-50 border border-red-200 p-4 rounded">
                  <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                  <div className="text-sm text-red-700">{selectedWebhook.error_message}</div>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Request Body</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(selectedWebhook.body_parsed, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
