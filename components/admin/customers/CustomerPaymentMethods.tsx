'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  method_type: string;
  status: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number_masked: string | null;
  branch_code: string | null;
  mandate_amount: number | null;
  mandate_debit_day: number | null;
  mandate_signed_at: string | null;
  netcash_mandate_reference: string | null;
  netcash_mandate_pdf_link: string | null;
  created_at: string;
}

interface CustomerPaymentMethodsProps {
  customerId: string;
}

export function CustomerPaymentMethods({ customerId }: CustomerPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, [customerId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/payment-methods`);
      const result = await response.json();

      if (result.success) {
        setPaymentMethods(result.data || []);
      } else {
        setError(result.error || 'Failed to load payment methods');
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      active: {
        label: 'Active',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
      },
      pending: {
        label: 'Pending',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
      },
      failed: {
        label: 'Failed',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertTriangle,
      },
      suspended: {
        label: 'Suspended',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: AlertTriangle,
      },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDebitDayLabel = (day: number | null) => {
    if (!day) return '-';
    if (day === 99) return 'Last day of month';
    return `${day}${getOrdinalSuffix(day)} of each month`;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-900">
              Payment Methods / eMandate
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchPaymentMethods}
            className="h-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 mb-4">{error}</div>
        )}

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No payment methods registered</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((pm) => {
              const statusConfig = getStatusConfig(pm.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={pm.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                >
                  {/* Header with Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {pm.method_type === 'bank_account' ? 'Debit Order' : 'Credit Card'}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${statusConfig.className} text-xs font-medium`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Bank Details */}
                  {pm.method_type === 'bank_account' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Bank</p>
                        <p className="text-gray-900">{pm.bank_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Account Name</p>
                        <p className="text-gray-900">{pm.bank_account_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Account Number</p>
                        <p className="text-gray-900 font-mono">
                          {pm.bank_account_number_masked || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Branch Code</p>
                        <p className="text-gray-900 font-mono">{pm.branch_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Mandate Amount</p>
                        <p className="text-gray-900 font-semibold">
                          {pm.mandate_amount ? `R${Number(pm.mandate_amount).toFixed(2)}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Debit Day</p>
                        <p className="text-gray-900">{getDebitDayLabel(pm.mandate_debit_day)}</p>
                      </div>
                    </div>
                  )}

                  {/* Mandate Reference & Signed Date */}
                  {pm.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-4 text-sm">
                      {pm.netcash_mandate_reference && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FileText className="h-3.5 w-3.5" />
                          <span>NetCash Ref: </span>
                          <span className="font-mono text-gray-900">
                            {pm.netcash_mandate_reference}
                          </span>
                        </div>
                      )}
                      {pm.mandate_signed_at && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Signed: </span>
                          <span className="text-gray-900">
                            {formatDate(pm.mandate_signed_at)}
                          </span>
                        </div>
                      )}
                      {pm.netcash_mandate_pdf_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => window.open(pm.netcash_mandate_pdf_link!, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Mandate PDF
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="mt-2 text-xs text-gray-500">
                    Added on {formatDate(pm.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
