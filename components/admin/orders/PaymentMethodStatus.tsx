'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Ban,
  FileText,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  method_type: 'bank_account' | 'credit_card';
  status: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number_masked?: string;
  bank_account_type?: string;
  branch_code?: string;
  card_type?: string;
  card_number_masked?: string;
  card_holder_name?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  mandate_amount?: number;
  mandate_frequency?: string;
  mandate_debit_day?: number;
  mandate_signed_at?: string;
  netcash_mandate_pdf_link?: string;
  created_at: string;
}

interface EMandateRequest {
  id: string;
  status: string;
  netcash_short_url?: string;
  expires_at?: string;
  postback_reason_for_decline?: string;
  created_at: string;
}

interface PaymentMethodStatusProps {
  orderId: string;
  className?: string;
  onRequestPaymentMethod?: () => void;
}

export function PaymentMethodStatus({
  orderId,
  className,
  onRequestPaymentMethod,
}: PaymentMethodStatusProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [emandateRequest, setEmandateRequest] = useState<EMandateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [resendingMandate, setResendingMandate] = useState(false);

  useEffect(() => {
    fetchPaymentMethodStatus();
  }, [orderId]);

  const fetchPaymentMethodStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/payment-method`);
      const result = await response.json();

      if (result.success) {
        setPaymentMethod(result.data.paymentMethod);
        setEmandateRequest(result.data.emandateRequest);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching payment method:', err);
      setError('Failed to load payment method status');
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async () => {
    try {
      setSendingNotification(true);

      const response = await fetch(`/api/admin/orders/${orderId}/payment-method/notify`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        const sentChannels = [];
        if (result.data.email.sent) sentChannels.push('email');
        if (result.data.sms.sent) sentChannels.push('SMS');

        if (sentChannels.length > 0) {
          toast.success(`Reminder sent via ${sentChannels.join(' and ')}`, {
            description: 'Customer will receive the payment registration link',
          });
        } else {
          toast.warning('Notification partially failed', {
            description: 'Check console for details',
          });
        }
      } else {
        toast.error('Failed to send reminder', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
      toast.error('Network error', {
        description: 'Failed to send reminder notification',
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const resendMandate = async () => {
    try {
      setResendingMandate(true);

      const response = await fetch(`/api/admin/orders/${orderId}/resend-mandate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Mandate resent successfully', {
          description: `Email and SMS sent to ${result.data.recipientEmail}`,
        });
        // Refresh the status
        fetchPaymentMethodStatus();
      } else {
        toast.error('Failed to resend mandate', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('Error resending mandate:', err);
      toast.error('Network error', {
        description: 'Failed to resend mandate',
      });
    } finally {
      setResendingMandate(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: 'Registration Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
      },
      active: {
        label: 'Active & Verified',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      },
      failed: {
        label: 'Registration Failed',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Ban,
      },
      suspended: {
        label: 'Suspended',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
      },
      expired: {
        label: 'Expired',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
      },
    };

    return configs[status] || configs.pending;
  };

  const getEmandateStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending Creation', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Sent to Customer', className: 'bg-blue-100 text-blue-800' },
      resent: { label: 'Resent to Customer', className: 'bg-blue-100 text-blue-800' },
      customer_notified: { label: 'Customer Notified', className: 'bg-purple-100 text-purple-800' },
      viewed: { label: 'Viewed by Customer', className: 'bg-indigo-100 text-indigo-800' },
      signed: { label: 'Signed', className: 'bg-green-100 text-green-800' },
      declined: { label: 'Declined', className: 'bg-red-100 text-red-800' },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    };

    return configs[status] || configs.pending;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!paymentMethod) {
    // No payment method registered yet
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription className="mt-1">
                No payment method registered
              </CardDescription>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Not Registered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium mb-2">
              No payment method on file
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Request the customer to register their bank account or credit card for recurring billing
            </p>
            {onRequestPaymentMethod && (
              <Button onClick={onRequestPaymentMethod} size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Request Payment Method
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(paymentMethod.status);
  const StatusIcon = statusConfig.icon;
  const expired = emandateRequest && isExpired(emandateRequest.expires_at);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription className="mt-1">
              {paymentMethod.method_type === 'bank_account'
                ? 'Bank Account'
                : 'Credit Card'} - {paymentMethod.mandate_frequency || 'Monthly'}
            </CardDescription>
          </div>
          <Badge className={`${statusConfig.className} border`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Account Details */}
        {paymentMethod.method_type === 'bank_account' && paymentMethod.status === 'active' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Bank Account Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {paymentMethod.bank_name && (
                <div>
                  <span className="text-gray-600">Bank:</span>{' '}
                  <span className="font-medium text-gray-900">{paymentMethod.bank_name}</span>
                </div>
              )}
              {paymentMethod.bank_account_name && (
                <div>
                  <span className="text-gray-600">Account Name:</span>{' '}
                  <span className="font-medium text-gray-900">{paymentMethod.bank_account_name}</span>
                </div>
              )}
              {paymentMethod.bank_account_number_masked && (
                <div>
                  <span className="text-gray-600">Account Number:</span>{' '}
                  <span className="font-mono text-gray-900">{paymentMethod.bank_account_number_masked}</span>
                </div>
              )}
              {paymentMethod.bank_account_type && (
                <div>
                  <span className="text-gray-600">Account Type:</span>{' '}
                  <span className="font-medium text-gray-900 capitalize">{paymentMethod.bank_account_type}</span>
                </div>
              )}
              {paymentMethod.branch_code && (
                <div>
                  <span className="text-gray-600">Branch Code:</span>{' '}
                  <span className="font-mono text-gray-900">{paymentMethod.branch_code}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credit Card Details */}
        {paymentMethod.method_type === 'credit_card' && paymentMethod.status === 'active' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Credit Card Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {paymentMethod.card_holder_name && (
                <div>
                  <span className="text-gray-600">Cardholder:</span>{' '}
                  <span className="font-medium text-gray-900">{paymentMethod.card_holder_name}</span>
                </div>
              )}
              {paymentMethod.card_type && (
                <div>
                  <span className="text-gray-600">Card Type:</span>{' '}
                  <span className="font-medium text-gray-900 capitalize">{paymentMethod.card_type}</span>
                </div>
              )}
              {paymentMethod.card_number_masked && (
                <div>
                  <span className="text-gray-600">Card Number:</span>{' '}
                  <span className="font-mono text-gray-900">{paymentMethod.card_number_masked}</span>
                </div>
              )}
              {paymentMethod.card_expiry_month && paymentMethod.card_expiry_year && (
                <div>
                  <span className="text-gray-600">Expiry:</span>{' '}
                  <span className="font-mono text-gray-900">
                    {String(paymentMethod.card_expiry_month).padStart(2, '0')}/{paymentMethod.card_expiry_year}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mandate Details */}
        {paymentMethod.status === 'active' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Debit Order Mandate</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {paymentMethod.mandate_amount && (
                <div>
                  <span className="text-gray-600">Amount:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    R{paymentMethod.mandate_amount.toFixed(2)}/month
                  </span>
                </div>
              )}
              {paymentMethod.mandate_frequency && (
                <div>
                  <span className="text-gray-600">Frequency:</span>{' '}
                  <span className="font-medium text-gray-900 capitalize">{paymentMethod.mandate_frequency}</span>
                </div>
              )}
              {paymentMethod.mandate_debit_day && (
                <div>
                  <span className="text-gray-600">Debit Day:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {paymentMethod.mandate_debit_day === 99 ? 'Last day of month' : `${paymentMethod.mandate_debit_day}th`}
                  </span>
                </div>
              )}
              {paymentMethod.mandate_signed_at && (
                <div>
                  <span className="text-gray-600">Signed:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {new Date(paymentMethod.mandate_signed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* eMandate Request Status (for pending/failed) */}
        {emandateRequest && paymentMethod.status !== 'active' && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">eMandate Request Status</h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge className={getEmandateStatusConfig(emandateRequest.status).className}>
                  {getEmandateStatusConfig(emandateRequest.status).label}
                </Badge>
                {emandateRequest.expires_at && (
                  <span className="text-xs text-gray-500">
                    {expired ? 'Expired' : `Expires ${new Date(emandateRequest.expires_at).toLocaleDateString()}`}
                  </span>
                )}
              </div>
              {emandateRequest.netcash_short_url && !expired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(emandateRequest.netcash_short_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Link
                </Button>
              )}
            </div>
            {emandateRequest.postback_reason_for_decline && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Declined:</strong> {emandateRequest.postback_reason_for_decline}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={fetchPaymentMethodStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>

          {/* Resend Mandate - show for pending/sent/resent statuses */}
          {paymentMethod.status === 'pending' && emandateRequest && 
           ['pending', 'sent', 'resent', 'customer_notified', 'viewed'].includes(emandateRequest.status) && (
            <Button
              size="sm"
              variant="default"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              onClick={resendMandate}
              disabled={resendingMandate}
            >
              {resendingMandate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Mandate
                </>
              )}
            </Button>
          )}

          {paymentMethod.status === 'pending' && emandateRequest && !expired && (
            <Button
              size="sm"
              variant="outline"
              onClick={sendReminder}
              disabled={sendingNotification}
            >
              {sendingNotification ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </>
              )}
            </Button>
          )}

          {paymentMethod.netcash_mandate_pdf_link && paymentMethod.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(paymentMethod.netcash_mandate_pdf_link, '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Mandate PDF
            </Button>
          )}

          {paymentMethod.status === 'failed' && onRequestPaymentMethod && (
            <Button size="sm" onClick={onRequestPaymentMethod}>
              <CreditCard className="h-4 w-4 mr-2" />
              Retry Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
