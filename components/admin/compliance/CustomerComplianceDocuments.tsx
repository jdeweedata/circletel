'use client';

/**
 * Admin view of customer-uploaded FICA/RICA compliance documents.
 * Used both as a tab on the customer detail page (pass `customerId`) and as a cross-customer
 * review queue (omit `customerId`, set `defaultStatus="pending"`, `showCustomer`).
 *
 * Files live in the private `kyc-documents` bucket; "View" fetches a short-lived signed URL
 * from /api/admin/kyc/document-url. List/approve/reject go through /api/admin/compliance/documents.
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiCheckBold, PiEyeBold, PiFileTextBold, PiXBold } from 'react-icons/pi';

interface ComplianceDoc {
  id: string;
  category: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  uploaded_at: string;
  rejection_reason?: string | null;
  customer?: { id: string; name: string; email: string; account_number?: string } | null;
  order?: { id: string; order_number: string; package_name?: string } | null;
}

interface Props {
  customerId?: string;
  defaultStatus?: string;
  showCustomer?: boolean;
  title?: string;
}

export function CustomerComplianceDocuments({
  customerId,
  defaultStatus = '',
  showCustomer = false,
  title,
}: Props) {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (customerId) params.set('customerId', customerId);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/compliance/documents?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load documents');
      setDocs(data.documents || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [customerId, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function view(path: string) {
    try {
      const res = await fetch(`/api/admin/kyc/document-url?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to get document URL');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to open document');
    }
  }

  async function review(id: string, status: 'approved' | 'rejected') {
    let rejection_reason: string | undefined;
    if (status === 'rejected') {
      const r = window.prompt('Reason for rejection (shown to the customer):');
      if (!r) return;
      rejection_reason = r;
    }
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/compliance/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id, status, rejection_reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  const badgeClass = (s: string) =>
    s === 'approved'
      ? 'bg-green-100 text-green-800'
      : s === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title || 'Compliance Documents'}</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded.</p>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <PiFileTextBold className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{d.file_name}</p>
                    <p className="text-xs text-gray-500">
                      <span className="uppercase">{d.category}</span> ·{' '}
                      {d.document_type.replace(/_/g, ' ')}
                      {d.order?.order_number ? ` · ${d.order.order_number}` : ''}
                    </p>
                    {showCustomer && d.customer && (
                      <p className="text-xs text-gray-600">
                        {d.customer.name} · {d.customer.email}
                        {d.customer.account_number ? ` · ${d.customer.account_number}` : ''}
                      </p>
                    )}
                    {d.status === 'rejected' && d.rejection_reason && (
                      <p className="text-xs text-red-600 mt-0.5">Reason: {d.rejection_reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badgeClass(d.status)}`}>
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => view(d.file_path)}>
                    <PiEyeBold className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {d.status !== 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === d.id}
                      onClick={() => review(d.id, 'approved')}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      title="Approve"
                    >
                      <PiCheckBold className="w-4 h-4" />
                    </Button>
                  )}
                  {d.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === d.id}
                      onClick={() => review(d.id, 'rejected')}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      title="Reject"
                    >
                      <PiXBold className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
