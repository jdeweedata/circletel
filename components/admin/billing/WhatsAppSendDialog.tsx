'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  status: string;
  customer?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    whatsapp_consent: boolean;
  };
}

interface WhatsAppSendDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type NotificationType = 'invoice_payment' | 'payment_reminder' | 'debit_failed';

// =============================================================================
// COMPONENT
// =============================================================================

export function WhatsAppSendDialog({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: WhatsAppSendDialogProps) {
  const [sending, setSending] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType>('invoice_payment');
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleSend = async () => {
    if (!invoice) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/billing/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          notification_type: notificationType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `WhatsApp sent to ${invoice.customer?.phone}`,
        });
        toast.success('WhatsApp notification sent successfully');
        onSuccess?.();
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to send WhatsApp notification',
        });
        toast.error(data.error || 'Failed to send');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      setResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setNotificationType('invoice_payment');
    onOpenChange(false);
  };

  const customer = invoice?.customer;
  const hasConsent = customer?.whatsapp_consent === true;
  const hasPhone = !!customer?.phone;
  const canSend = hasConsent && hasPhone;

  // Calculate days overdue
  const daysOverdue = invoice
    ? Math.max(0, Math.floor(
        (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Send WhatsApp Notification
          </DialogTitle>
          <DialogDescription>
            Send a PayNow link to the customer via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4 py-4">
            {/* Invoice Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Invoice</span>
                <span className="font-semibold">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-semibold text-lg">
                  R{invoice.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Due Date</span>
                <span className={daysOverdue > 0 ? 'text-red-600 font-semibold' : ''}>
                  {new Date(invoice.due_date).toLocaleDateString('en-ZA')}
                  {daysOverdue > 0 && ` (${daysOverdue} days overdue)`}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer</span>
                <span className="font-medium">
                  {customer?.first_name} {customer?.last_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phone</span>
                {hasPhone ? (
                  <span className="font-medium">{customer.phone}</span>
                ) : (
                  <Badge variant="destructive">No phone number</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">WhatsApp Consent</span>
                {hasConsent ? (
                  <Badge className="bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Consented
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    No consent
                  </Badge>
                )}
              </div>
            </div>

            {/* Warning if can't send */}
            {!canSend && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Cannot send WhatsApp</p>
                  <p className="text-sm text-amber-800">
                    {!hasConsent && 'Customer has not consented to WhatsApp notifications. '}
                    {!hasPhone && 'Customer has no phone number on file.'}
                  </p>
                </div>
              </div>
            )}

            {/* Notification Type */}
            {canSend && (
              <div className="space-y-2">
                <Label>Notification Type</Label>
                <Select
                  value={notificationType}
                  onValueChange={(v) => setNotificationType(v as NotificationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice_payment">
                      Invoice Payment Reminder
                    </SelectItem>
                    <SelectItem value="payment_reminder">
                      Overdue Payment Reminder
                    </SelectItem>
                    <SelectItem value="debit_failed">
                      Debit Order Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {notificationType === 'invoice_payment' && 'Standard payment due notification with Pay Now link.'}
                  {notificationType === 'payment_reminder' && 'Reminder for overdue invoices with urgency message.'}
                  {notificationType === 'debit_failed' && 'Notification when debit order collection failed.'}
                </p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`rounded-lg p-4 flex items-start gap-3 ${
                result.success
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${
                    result.success ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {result.success ? 'Sent Successfully' : 'Failed to Send'}
                  </p>
                  <p className={`text-sm ${
                    result.success ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                    {result.message || result.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result?.success ? 'Close' : 'Cancel'}
          </Button>
          {!result?.success && (
            <Button
              onClick={handleSend}
              disabled={sending || !canSend}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send WhatsApp
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
