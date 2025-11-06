'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Ban,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PaymentTransaction {
  id: string;
  transaction_id: string;
  reference: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  customer_email: string | null;
  customer_name: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
  error_message: string | null;
  provider_response: any;
}

interface TransactionStats {
  total_count: number;
  total_amount: number;
  completed_count: number;
  completed_amount: number;
  failed_count: number;
  pending_count: number;
}

export default function PaymentTransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    total_count: 0,
    total_amount: 0,
    completed_count: 0,
    completed_amount: 0,
    failed_count: 0,
    pending_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Build query
      let query = supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`transaction_id.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setTransactions(data || []);

      // Calculate stats
      if (data) {
        const newStats: TransactionStats = {
          total_count: data.length,
          total_amount: data.reduce((sum, t) => sum + Number(t.amount), 0),
          completed_count: data.filter(t => t.status === 'completed').length,
          completed_amount: data
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + Number(t.amount), 0),
          failed_count: data.filter(t => t.status === 'failed').length,
          pending_count: data.filter(t => t.status === 'pending' || t.status === 'processing').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, providerFilter, searchTerm]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Transaction ID',
      'Reference',
      'Provider',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Customer Email',
      'Customer Name',
      'Initiated At',
      'Completed At'
    ];

    const rows = transactions.map(t => [
      t.transaction_id,
      t.reference,
      t.provider,
      t.amount,
      t.currency,
      t.status,
      t.payment_method || '',
      t.customer_email || '',
      t.customer_name || '',
      new Date(t.initiated_at).toLocaleString(),
      t.completed_at ? new Date(t.completed_at).toLocaleString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-transactions-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      completed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
      processing: { color: 'bg-blue-100 text-blue-700', icon: <RefreshCw className="h-3 w-3" /> },
      failed: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
      refunded: { color: 'bg-purple-100 text-purple-700', icon: <RotateCcw className="h-3 w-3" /> },
      cancelled: { color: 'bg-gray-100 text-gray-700', icon: <Ban className="h-3 w-3" /> },
      expired: { color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="h-3 w-3" /> }
    };

    const variant = variants[status] || variants.pending;

    return (
      <Badge variant="outline" className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get provider badge
  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      netcash: 'bg-orange-100 text-orange-700',
      zoho_billing: 'bg-blue-100 text-blue-700',
      payfast: 'bg-green-100 text-green-700',
      paygate: 'bg-purple-100 text-purple-700'
    };

    return (
      <Badge variant="outline" className={colors[provider] || 'bg-gray-100 text-gray-700'}>
        {provider}
      </Badge>
    );
  };

  // View transaction details
  const viewDetails = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">Payment Transactions</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            View and manage all payment transactions across all providers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={transactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={fetchTransactions}
            disabled={loading}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.total_count}</div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-circleTel-secondaryNeutral mt-1">
              R{stats.total_amount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">{stats.completed_count}</div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-green-600 mt-1">
              R{stats.completed_amount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_count}</div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-sm text-circleTel-secondaryNeutral mt-1">
              Awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">{stats.failed_count}</div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-red-600 mt-1">
              {stats.total_count > 0
                ? ((stats.failed_count / stats.total_count) * 100).toFixed(1)
                : 0}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by transaction ID, reference, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="netcash">NetCash</SelectItem>
                <SelectItem value="zoho_billing">ZOHO Billing</SelectItem>
                <SelectItem value="payfast">PayFast</SelectItem>
                <SelectItem value="paygate">PayGate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
          <CardDescription>
            {statusFilter !== 'all' && `Filtered by status: ${statusFilter}`}
            {providerFilter !== 'all' && ` | Filtered by provider: ${providerFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">No transactions found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm || statusFilter !== 'all' || providerFilter !== 'all'
                  ? 'Try adjusting your filters or search term'
                  : 'Transactions will appear here once payments are initiated'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {transaction.transaction_id.substring(0, 16)}...
                      </TableCell>
                      <TableCell className="font-medium">{transaction.reference}</TableCell>
                      <TableCell>{getProviderBadge(transaction.provider)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{transaction.customer_name || 'N/A'}</div>
                          <div className="text-gray-500">{transaction.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.currency} {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {transaction.payment_method ? (
                          <Badge variant="outline" className="text-xs">
                            {transaction.payment_method.replace('_', ' ')}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(transaction.initiated_at).toLocaleDateString()}{' '}
                        {new Date(transaction.initiated_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information for transaction {selectedTransaction?.transaction_id}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Amount</div>
                  <div className="text-2xl font-bold text-circleTel-orange">
                    {selectedTransaction.currency} {selectedTransaction.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Transaction ID</div>
                  <div className="font-mono text-sm">{selectedTransaction.transaction_id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Reference</div>
                  <div className="font-medium">{selectedTransaction.reference}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Provider</div>
                  {getProviderBadge(selectedTransaction.provider)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Payment Method</div>
                  <div>{selectedTransaction.payment_method || 'Not specified'}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Name</div>
                    <div>{selectedTransaction.customer_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div>{selectedTransaction.customer_email || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Initiated At</div>
                  <div>{new Date(selectedTransaction.initiated_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Completed At</div>
                  <div>
                    {selectedTransaction.completed_at
                      ? new Date(selectedTransaction.completed_at).toLocaleString()
                      : 'Not completed'}
                  </div>
                </div>
              </div>

              {/* Error Info */}
              {selectedTransaction.error_message && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Error Information
                  </h3>
                  <div className="text-sm text-red-700">{selectedTransaction.error_message}</div>
                </div>
              )}

              {/* Provider Response */}
              {selectedTransaction.provider_response && (
                <div>
                  <h3 className="font-semibold mb-2">Provider Response</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(selectedTransaction.provider_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
