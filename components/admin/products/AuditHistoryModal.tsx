'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown, Minus, User, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  product_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_fields: string[];
  changed_by_email: string | null;
  changed_by_name: string | null;
  change_reason: string | null;
  changed_at: string;
  price_changes: {
    monthly_price: { old: number | null; new: number | null; changed: boolean };
    setup_fee: { old: number | null; new: number | null; changed: boolean };
  };
}

interface AuditHistoryModalProps {
  productId: string;
  productName: string;
  open: boolean;
  onClose: () => void;
}

export function AuditHistoryModal({ productId, productName, open, onClose }: AuditHistoryModalProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && productId) {
      fetchAuditLogs();
    }
  }, [open, productId]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/audit-logs?limit=50`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      setAuditLogs(data.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getPriceTrendIcon = (oldPrice: number | null, newPrice: number | null) => {
    if (oldPrice === null || newPrice === null) return null;
    if (newPrice > oldPrice) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (newPrice < oldPrice) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800">Deleted</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-orange-500" />
            Audit History - {productName}
          </DialogTitle>
          <DialogDescription>
            Complete change history with user attribution and timestamps.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading audit history...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error Loading History</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && auditLogs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No audit history available for this product.</p>
          </div>
        )}

        {!loading && !error && auditLogs.length > 0 && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {auditLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      {log.changed_fields.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {log.changed_fields.length} field{log.changed_fields.length !== 1 ? 's' : ''} changed
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(log.changed_at), 'PPp')}
                    </span>
                  </div>

                  {/* Price Changes */}
                  {(log.price_changes.monthly_price.changed || log.price_changes.setup_fee.changed) && (
                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 uppercase">Price Changes:</p>

                      {log.price_changes.monthly_price.changed && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Monthly Price:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through">
                              {formatPrice(log.price_changes.monthly_price.old)}
                            </span>
                            {getPriceTrendIcon(log.price_changes.monthly_price.old, log.price_changes.monthly_price.new)}
                            <span className="font-semibold text-gray-900">
                              {formatPrice(log.price_changes.monthly_price.new)}
                            </span>
                          </div>
                        </div>
                      )}

                      {log.price_changes.setup_fee.changed && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Setup Fee:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through">
                              {formatPrice(log.price_changes.setup_fee.old)}
                            </span>
                            {getPriceTrendIcon(log.price_changes.setup_fee.old, log.price_changes.setup_fee.new)}
                            <span className="font-semibold text-gray-900">
                              {formatPrice(log.price_changes.setup_fee.new)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other Changed Fields */}
                  {log.changed_fields.filter(f => f !== 'monthly_price' && f !== 'setup_fee' && f !== 'updated_at').length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold">Other changes: </span>
                      {log.changed_fields.filter(f => f !== 'monthly_price' && f !== 'setup_fee' && f !== 'updated_at').join(', ')}
                    </div>
                  )}

                  {/* Change Reason */}
                  {log.change_reason && (
                    <div className="flex items-start gap-2 text-sm bg-blue-50 border border-blue-200 rounded p-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Reason:</p>
                        <p className="text-blue-800">{log.change_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* User Attribution */}
                  {log.changed_by_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <User className="h-3 w-3" />
                      <span>
                        Changed by <span className="font-semibold">{log.changed_by_name}</span>
                        {log.changed_by_email && (
                          <span className="text-gray-400"> ({log.changed_by_email})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
