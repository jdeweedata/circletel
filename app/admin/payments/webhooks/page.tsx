'use client';

/**
 * Webhook Monitoring Dashboard
 * Monitor and manage Netcash webhook notifications
 * Task 3.3: Netcash Webhook Integration
 */

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Webhook,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================================================================
// TYPES
// ==================================================================

interface WebhookRecord {
  id: string;
  order_id?: string;
  payment_reference: string;
  webhook_type: string;
  netcash_transaction_id?: string;
  amount?: number;
  status: 'received' | 'processing' | 'processed' | 'failed' | 'duplicate';
  signature_valid?: boolean;
  source_ip?: string;
  processed_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  raw_payload?: any;
}

interface WebhookStats {
  total_webhooks: number;
  successful_webhooks: number;
  failed_webhooks: number;
  pending_webhooks: number;
  duplicate_webhooks: number;
  success_rate: number;
  avg_processing_time_ms: number;
}

// ==================================================================
// MAIN COMPONENT
// ==================================================================

export default function WebhookMonitoringPage() {
  const { hasPermission } = usePermissions();
  const supabase = createClient();

  // State
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRecord | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // ==================================================================
  // DATA FETCHING
  // ==================================================================

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchWebhooks(), fetchStats()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      let query = supabase
        .from('payment_webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('webhook_type', typeFilter);
      }

      if (searchQuery) {
        query = query.or(
          `payment_reference.ilike.%${searchQuery}%,netcash_transaction_id.ilike.%${searchQuery}%,order_id.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setWebhooks(data || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      toast.error('Failed to load webhooks');
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_webhook_statistics', {
        hours_ago: 24,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Stats are optional, don't show error toast
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleViewDetails = (webhook: WebhookRecord) => {
    setSelectedWebhook(webhook);
    setDetailsDialogOpen(true);
  };

  const handleRetry = async (webhookId: string) => {
    try {
      setRetrying(true);

      // In a real implementation, this would trigger webhook reprocessing
      // For now, just simulate a retry
      toast.info('Webhook retry functionality will be implemented soon');

      // TODO: Implement retry logic
      // This would involve:
      // 1. Fetch webhook payload
      // 2. Re-validate signature
      // 3. Route to appropriate processor
      // 4. Update webhook status

      await fetchWebhooks();
    } catch (error) {
      console.error('Failed to retry webhook:', error);
      toast.error('Failed to retry webhook');
    } finally {
      setRetrying(false);
    }
  };

  // ==================================================================
  // FILTERS
  // ==================================================================

  useEffect(() => {
    fetchWebhooks();
  }, [statusFilter, typeFilter, searchQuery]);

  // ==================================================================
  // RENDER HELPERS
  // ==================================================================

  const getStatusBadge = (status: string, signatureValid?: boolean) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      processed: {
        variant: 'default',
        icon: CheckCircle2,
        label: 'Processed',
      },
      processing: {
        variant: 'default',
        icon: Clock,
        label: 'Processing',
      },
      received: {
        variant: 'default',
        icon: Clock,
        label: 'Received',
      },
      failed: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Failed',
      },
      duplicate: {
        variant: 'secondary',
        icon: Copy,
        label: 'Duplicate',
      },
    };

    const config = variants[status] || variants.received;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
        {signatureValid === false && status !== 'failed' && (
          <AlertCircle className="w-3 h-3 ml-1 text-amber-500" />
        )}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      payment_success: 'text-green-600',
      payment_failure: 'text-red-600',
      payment_pending: 'text-yellow-600',
      refund: 'text-blue-600',
      chargeback: 'text-purple-600',
      notify: 'text-gray-600',
    };

    return colors[type] || 'text-gray-600';
  };

  // ==================================================================
  // RENDER
  // ==================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <PermissionGate
      permissions={[PERMISSIONS.FINANCE.VIEW]}
      fallback={
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need Finance or Admin permissions to view webhook monitoring.
          </AlertDescription>
        </Alert>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Webhook className="w-8 h-8 text-circleTel-orange" />
              Webhook Monitoring
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage payment webhook notifications
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Webhooks (24h)</CardDescription>
                <CardTitle className="text-3xl">{stats.total_webhooks}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>Last 24 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.success_rate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{stats.successful_webhooks} successful</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed Webhooks</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  {stats.failed_webhooks}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span>
                    {stats.total_webhooks > 0
                      ? ((stats.failed_webhooks / stats.total_webhooks) * 100).toFixed(1)
                      : 0}% failure rate
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Processing Time</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.avg_processing_time_ms.toFixed(0)}ms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Per webhook</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="payment_success">Payment Success</SelectItem>
                    <SelectItem value="payment_failure">Payment Failure</SelectItem>
                    <SelectItem value="payment_pending">Payment Pending</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="chargeback">Chargeback</SelectItem>
                    <SelectItem value="notify">Notify</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Reference, Transaction ID, Order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Webhooks</CardTitle>
            <CardDescription>
              Showing {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No webhooks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          {getStatusBadge(webhook.status, webhook.signature_valid)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getTypeColor(webhook.webhook_type)}`}>
                            {webhook.webhook_type.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-xs">
                              {webhook.payment_reference}
                            </div>
                            {webhook.netcash_transaction_id && (
                              <div className="font-mono text-xs text-gray-500">
                                TXN: {webhook.netcash_transaction_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.amount ? `R${webhook.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(webhook.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.processed_at ? (
                            <div className="text-sm text-green-600">
                              {new Date(webhook.processed_at).toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(webhook)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {webhook.status === 'failed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRetry(webhook.id)}
                                disabled={retrying}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Webhook Details</DialogTitle>
              <DialogDescription>
                Complete information about this webhook notification
              </DialogDescription>
            </DialogHeader>

            {selectedWebhook && (
              <div className="space-y-4">
                {/* Status and Type */}
                <div className="flex gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedWebhook.status, selectedWebhook.signature_valid)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className={`mt-1 font-medium ${getTypeColor(selectedWebhook.webhook_type)}`}>
                      {selectedWebhook.webhook_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* References */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Reference</label>
                    <div className="font-mono text-sm mt-1">{selectedWebhook.payment_reference}</div>
                  </div>
                  {selectedWebhook.netcash_transaction_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                      <div className="font-mono text-sm mt-1">
                        {selectedWebhook.netcash_transaction_id}
                      </div>
                    </div>
                  )}
                  {selectedWebhook.order_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order ID</label>
                      <div className="font-mono text-sm mt-1">{selectedWebhook.order_id}</div>
                    </div>
                  )}
                  {selectedWebhook.amount && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount</label>
                      <div className="font-medium text-sm mt-1">
                        R{selectedWebhook.amount.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <div className="text-sm mt-1">
                      {new Date(selectedWebhook.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedWebhook.processed_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Processed</label>
                      <div className="text-sm mt-1 text-green-600">
                        {new Date(selectedWebhook.processed_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {selectedWebhook.error_message && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Error Message</label>
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{selectedWebhook.error_message}</AlertDescription>
                      </Alert>
                    </div>
                  </>
                )}

                {/* Security Info */}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  {selectedWebhook.signature_valid !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Signature Valid</label>
                      <div className="mt-1">
                        {selectedWebhook.signature_valid ? (
                          <Badge variant="default">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedWebhook.source_ip && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Source IP</label>
                      <div className="font-mono text-sm mt-1">{selectedWebhook.source_ip}</div>
                    </div>
                  )}
                </div>

                {/* Raw Payload */}
                {selectedWebhook.raw_payload && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Raw Payload</label>
                      <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(selectedWebhook.raw_payload, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
