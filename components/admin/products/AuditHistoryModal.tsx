'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { History, TrendingUp, TrendingDown, Minus, User, Calendar, FileText, Loader2, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
        return <Badge className="bg-green-100 text-green-800 border-green-200">Created</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Updated</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Deleted</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] bg-white p-0 gap-0 overflow-hidden">
        {/* Header - Fixed */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-circleTel-orange" />
                </div>
                <div>
                  <div className="text-gray-900">Audit History</div>
                  <div className="text-sm font-normal text-gray-600 mt-0.5">{productName}</div>
                </div>
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            Complete change history with user attribution and timestamps
          </DialogDescription>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-circleTel-orange mb-3" />
              <span className="text-gray-600 font-medium">Loading audit history...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Error Loading History</p>
                <p className="text-sm mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAuditLogs}
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && auditLogs.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <History className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-700">No audit history available</p>
              <p className="text-sm mt-1">Changes to this product will appear here</p>
            </div>
          )}

          {!loading && !error && auditLogs.length > 0 && (
            <div className="space-y-4">
              {auditLogs.map((log, index) => (
                <div
                  key={log.id}
                  className={cn(
                    "border-2 border-gray-200 rounded-xl p-5 space-y-4",
                    "hover:border-circleTel-orange hover:shadow-lg transition-all duration-200",
                    "bg-white"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      {log.changed_fields.length > 0 && (
                        <Badge variant="outline" className="text-xs border-gray-300">
                          {log.changed_fields.length} field{log.changed_fields.length !== 1 ? 's' : ''} changed
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {format(new Date(log.changed_at), 'PPp')}
                    </span>
                  </div>

                  {/* Price Changes */}
                  {(log.price_changes.monthly_price.changed || log.price_changes.setup_fee.changed) && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-bold text-orange-900 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Price Changes
                      </p>

                      {log.price_changes.monthly_price.changed && (
                        <div className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-orange-100">
                          <span className="text-gray-700 font-medium">Monthly Price:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 line-through font-medium">
                              {formatPrice(log.price_changes.monthly_price.old)}
                            </span>
                            {getPriceTrendIcon(log.price_changes.monthly_price.old, log.price_changes.monthly_price.new)}
                            <span className="font-bold text-gray-900 text-base">
                              {formatPrice(log.price_changes.monthly_price.new)}
                            </span>
                          </div>
                        </div>
                      )}

                      {log.price_changes.setup_fee.changed && (
                        <div className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-orange-100">
                          <span className="text-gray-700 font-medium">Setup Fee:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 line-through font-medium">
                              {formatPrice(log.price_changes.setup_fee.old)}
                            </span>
                            {getPriceTrendIcon(log.price_changes.setup_fee.old, log.price_changes.setup_fee.new)}
                            <span className="font-bold text-gray-900 text-base">
                              {formatPrice(log.price_changes.setup_fee.new)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other Changed Fields */}
                  {log.changed_fields.filter(f => f !== 'monthly_price' && f !== 'setup_fee' && f !== 'updated_at').length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Other Changes:</p>
                      <div className="flex flex-wrap gap-2">
                        {log.changed_fields
                          .filter(f => f !== 'monthly_price' && f !== 'setup_fee' && f !== 'updated_at')
                          .map((field, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {field.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Change Reason */}
                  {log.change_reason && (
                    <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Reason:</p>
                        <p className="text-sm text-blue-800 leading-relaxed">{log.change_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* User Attribution */}
                  {log.changed_by_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 pt-3 border-t border-gray-200">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                      <span>
                        Changed by <span className="font-semibold text-gray-900">{log.changed_by_name}</span>
                        {log.changed_by_email && (
                          <span className="text-gray-500 ml-1">({log.changed_by_email})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Summary */}
        {!loading && !error && auditLogs.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              Showing <span className="font-semibold text-gray-900">{auditLogs.length}</span> {auditLogs.length === 1 ? 'change' : 'changes'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
