'use client';
import { PiChatBold, PiCheckCircleBold, PiPaperPlaneRightBold, PiSpinnerBold, PiWarningBold, PiXCircleBold } from 'react-icons/pi';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  whatsapp_sent_at: string | null;
  customer?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    whatsapp_consent: boolean;
  };
}

interface BulkResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

interface BulkWhatsAppPanelProps {
  invoices: Invoice[];
  onComplete?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BulkWhatsAppPanel({
  invoices,
  onComplete,
}: BulkWhatsAppPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notificationType, setNotificationType] = useState<string>('invoice_payment');
  const [result, setResult] = useState<BulkResult | null>(null);

  // Filter invoices that can receive WhatsApp
  const eligibleInvoices = invoices.filter(inv =>
    inv.customer?.whatsapp_consent === true && !!inv.customer?.phone
  );

  const notSentInvoices = eligibleInvoices.filter(inv => !inv.whatsapp_sent_at);

  // Toggle single selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select all eligible
  const selectAllEligible = () => {
    setSelectedIds(new Set(notSentInvoices.map(inv => inv.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Send to selected
  const handleBulkSend = async () => {
    if (selectedIds.size === 0) {
      toast.error('No invoices selected');
      return;
    }

    setSending(true);
    setProgress(0);
    setResult(null);

    const ids = Array.from(selectedIds);
    const bulkResult: BulkResult = {
      total: ids.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < ids.length; i++) {
        const invoiceId = ids[i];

        try {
          const response = await fetch('/api/admin/billing/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice_id: invoiceId,
              notification_type: notificationType,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            bulkResult.sent++;
          } else {
            bulkResult.failed++;
            bulkResult.errors.push(`${data.invoice_number || invoiceId}: ${data.error}`);
          }
        } catch (error) {
          bulkResult.failed++;
          bulkResult.errors.push(`${invoiceId}: Network error`);
        }

        // Update progress
        setProgress(Math.round(((i + 1) / ids.length) * 100));

        // Small delay between sends
        if (i < ids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setResult(bulkResult);

      if (bulkResult.failed === 0) {
        toast.success(`Successfully sent ${bulkResult.sent} WhatsApp notifications`);
      } else if (bulkResult.sent > 0) {
        toast.warning(`Sent ${bulkResult.sent}, failed ${bulkResult.failed} notifications`);
      } else {
        toast.error('All notifications failed to send');
      }

      // Clear selection and refresh
      setSelectedIds(new Set());
      onComplete?.();
    } catch (error) {
      toast.error('Bulk send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiChatBold className="h-5 w-5 text-emerald-600" />
          Bulk WhatsApp Notifications
        </CardTitle>
        <CardDescription>
          Send PayNow links to multiple customers via WhatsApp.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{invoices.length}</p>
            <p className="text-sm text-gray-600">Total Invoices</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{eligibleInvoices.length}</p>
            <p className="text-sm text-emerald-700">With Consent</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{notSentInvoices.length}</p>
            <p className="text-sm text-blue-700">Not Sent Yet</p>
          </div>
        </div>

        {/* Notification Type */}
        <div className="space-y-2">
          <Label>Notification Type</Label>
          <Select value={notificationType} onValueChange={setNotificationType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice_payment">Invoice Payment Reminder</SelectItem>
              <SelectItem value="payment_reminder">Overdue Payment Reminder</SelectItem>
              <SelectItem value="debit_failed">Debit Order Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAllEligible}>
            Select All Eligible ({notSentInvoices.length})
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear
          </Button>
          <div className="ml-auto text-sm text-gray-600">
            {selectedIds.size} selected
          </div>
        </div>

        {/* Invoice List (scrollable) */}
        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No invoices to display
            </div>
          ) : (
            invoices.map((invoice) => {
              const hasConsent = invoice.customer?.whatsapp_consent === true;
              const hasPhone = !!invoice.customer?.phone;
              const alreadySent = !!invoice.whatsapp_sent_at;
              const canSelect = hasConsent && hasPhone && !alreadySent;

              return (
                <div
                  key={invoice.id}
                  className={`flex items-center gap-3 p-3 ${
                    !canSelect ? 'opacity-50 bg-gray-50' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(invoice.id)}
                    onCheckedChange={() => canSelect && toggleSelection(invoice.id)}
                    disabled={!canSelect}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{invoice.invoice_number}</span>
                      <Badge variant="outline" className="text-xs">
                        R{invoice.total_amount.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {invoice.customer?.first_name} {invoice.customer?.last_name}
                      {' - '}
                      {invoice.customer?.phone || 'No phone'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {alreadySent && (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <PiCheckCircleBold className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    )}
                    {!hasConsent && (
                      <Badge variant="destructive" className="text-xs">
                        No consent
                      </Badge>
                    )}
                    {!hasPhone && (
                      <Badge variant="secondary" className="text-xs">
                        No phone
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Progress */}
        {sending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Sending notifications...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.failed === 0
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-4">
              {result.failed === 0 ? (
                <PiCheckCircleBold className="h-8 w-8 text-emerald-600" />
              ) : (
                <PiWarningBold className="h-8 w-8 text-amber-600" />
              )}
              <div>
                <p className="font-semibold">
                  {result.failed === 0 ? 'All Sent Successfully' : 'Completed with Errors'}
                </p>
                <p className="text-sm">
                  Sent: {result.sent} | Failed: {result.failed}
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 max-h-24 overflow-y-auto">
                {result.errors.slice(0, 5).map((error, i) => (
                  <p key={i} className="text-sm text-red-700">
                    <PiXCircleBold className="h-3 w-3 inline mr-1" />
                    {error}
                  </p>
                ))}
                {result.errors.length > 5 && (
                  <p className="text-sm text-gray-600">
                    ...and {result.errors.length - 5} more errors
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleBulkSend}
          disabled={sending || selectedIds.size === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          {sending ? (
            <>
              <PiSpinnerBold className="h-4 w-4 animate-spin mr-2" />
              Sending {progress}%...
            </>
          ) : (
            <>
              <PiPaperPlaneRightBold className="h-4 w-4 mr-2" />
              Send to {selectedIds.size} Customers
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Only customers with WhatsApp consent and phone numbers can receive notifications.
        </p>
      </CardContent>
    </Card>
  );
}
