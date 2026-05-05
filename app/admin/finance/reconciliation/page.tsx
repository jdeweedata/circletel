'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PiCheckCircleBold, PiXCircleBold, PiArrowsClockwiseBold, PiMagnifyingGlassBold, PiFunnelBold, PiPlayBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface QueueItem {
  id: string;
  source: string;
  source_reference: string;
  source_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  payer_reference: string | null;
  payer_name: string | null;
  match_confidence: number;
  match_method: string | null;
  status: 'pending' | 'approved' | 'rejected';
  matched_invoice_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface InvoiceSearchResult {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  due_date?: string;
}

export default function ReconciliationQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<InvoiceSearchResult[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSearchResult | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: statusFilter });
      if (sourceFilter) params.set('source', sourceFilter);
      const res = await fetch(`/api/admin/billing/reconciliation/queue?${params}`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const searchInvoices = async (query: string) => {
    if (query.length < 2) {
      setInvoiceResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/billing/invoices?search=${encodeURIComponent(query)}&status=sent,overdue&limit=10`);
      if (!res.ok) return;
      const data = await res.json();
      setInvoiceResults(data.invoices || data.data || []);
    } catch {
      setInvoiceResults([]);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem || !selectedInvoice) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/billing/reconciliation/queue/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: selectedInvoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApproveDialogOpen(false);
      setSelectedItem(null);
      setSelectedInvoice(null);
      setInvoiceSearch('');
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/billing/reconciliation/queue/${selectedItem.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRejectDialogOpen(false);
      setSelectedItem(null);
      setRejectReason('');
      fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrigger = async (type: 'eft' | 'paynow' | 'monthly-sweep') => {
    setTriggerLoading(type);
    try {
      const res = await fetch('/api/admin/billing/reconciliation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`${type} reconciliation triggered successfully`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger');
    } finally {
      setTriggerLoading(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve unmatched payments from EFT and PayNow
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTrigger('eft')}
            disabled={!!triggerLoading}
          >
            <PiPlayBold className="mr-1 h-4 w-4" />
            {triggerLoading === 'eft' ? 'Running...' : 'Run EFT'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTrigger('paynow')}
            disabled={!!triggerLoading}
          >
            <PiPlayBold className="mr-1 h-4 w-4" />
            {triggerLoading === 'paynow' ? 'Running...' : 'Run PayNow'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTrigger('monthly-sweep')}
            disabled={!!triggerLoading}
          >
            <PiPlayBold className="mr-1 h-4 w-4" />
            {triggerLoading === 'monthly-sweep' ? 'Running...' : 'Monthly Sweep'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:ring-2 ring-orange-200" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-green-200" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-red-200" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <PiFunnelBold className="h-4 w-4 text-slate-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sources</SelectItem>
            <SelectItem value="zoho_cashbook">EFT (Zoho Cashbook)</SelectItem>
            <SelectItem value="netcash_paynow">PayNow (NetCash)</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={fetchQueue}>
          <PiArrowsClockwiseBold className="h-4 w-4" />
        </Button>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Reconciliation Queue ({items.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No items in queue</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2 pr-4">Reference</th>
                    <th className="pb-2 pr-4">Payer</th>
                    <th className="pb-2 pr-4 text-right">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {item.source_date ? formatDate(item.source_date) : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {item.source === 'zoho_cashbook' ? 'EFT' : 'PayNow'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs max-w-[200px] truncate">
                        {item.payer_reference || item.source_reference}
                      </td>
                      <td className="py-3 pr-4 max-w-[150px] truncate">
                        {item.payer_name || '—'}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            item.status === 'pending' ? 'secondary' :
                            item.status === 'approved' ? 'default' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {item.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedItem(item);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <PiCheckCircleBold className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedItem(item);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <PiXCircleBold className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {item.status !== 'pending' && (
                          <span className="text-xs text-slate-400">
                            {item.resolved_at ? formatDate(item.resolved_at) : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <p><span className="text-slate-500">Amount:</span> <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                <p><span className="text-slate-500">Reference:</span> {selectedItem.payer_reference}</p>
                <p><span className="text-slate-500">Payer:</span> {selectedItem.payer_name || 'Unknown'}</p>
                <p><span className="text-slate-500">Date:</span> {selectedItem.source_date ? formatDate(selectedItem.source_date) : '—'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search for invoice to match:</label>
                <div className="relative">
                  <PiMagnifyingGlassBold className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Invoice number, customer name, or account..."
                    value={invoiceSearch}
                    onChange={(e) => {
                      setInvoiceSearch(e.target.value);
                      searchInvoices(e.target.value);
                    }}
                  />
                </div>
                {invoiceResults.length > 0 && (
                  <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                    {invoiceResults.map((inv) => (
                      <button
                        key={inv.id}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-b-0 ${
                          selectedInvoice?.id === inv.id ? 'bg-orange-50 border-orange-200' : ''
                        }`}
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{inv.invoice_number}</span>
                          <span className="font-medium">{formatCurrency(inv.total_amount)}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {inv.customer_name} &middot; {inv.status} &middot; Due {inv.due_date ? formatDate(inv.due_date) : '—'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedInvoice && (
                  <div className="bg-green-50 border border-green-200 p-2 rounded text-sm">
                    Selected: <strong>{selectedInvoice.invoice_number}</strong> — {formatCurrency(selectedInvoice.total_amount)}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!selectedInvoice || actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'Approving...' : 'Approve & Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <p><span className="text-slate-500">Amount:</span> <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                <p><span className="text-slate-500">Reference:</span> {selectedItem.payer_reference}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for rejection (optional):</label>
                <Input
                  placeholder="e.g. Duplicate, not a customer payment, test transaction..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
