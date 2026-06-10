'use client';
import {
  PiArrowsClockwiseBold,
  PiChatBold,
  PiCheckCircleBold,
  PiCurrencyCircleDollarBold,
  PiFileTextBold,
  PiPaperPlaneRightBold,
  PiWarningCircleBold,
  PiWifiHighBold,
} from 'react-icons/pi';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CustomerSummary {
  total_outstanding: number;
  total_overdue: number;
  overdue_count: number;
  oldest_unpaid_invoice: {
    id: string;
    invoice_number: string;
    amount_due: number;
    due_date: string;
  } | null;
  active_service: {
    id: string;
    package_name: string;
    monthly_price: number;
    status: string;
  } | null;
  active_services_count: number;
  last_payment: {
    amount: number;
    date: string;
    payment_type: string;
  } | null;
}

interface CustomerSummaryStripProps {
  customerId: string;
  /** null while tickets are still loading, undefined if unavailable */
  openTicketCount: number | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export function CustomerSummaryStrip({ customerId, openTicketCount }: CustomerSummaryStripProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingPayNow, setSendingPayNow] = useState(false);
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/customers/${customerId}/summary`);
      const data = await response.json();
      if (response.ok && data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load customer summary:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSendPayNow = async () => {
    const invoice = summary?.oldest_unpaid_invoice;
    if (!invoice) return;

    const confirmed = window.confirm(
      `Send a Pay Now payment link for invoice ${invoice.invoice_number} (${formatCurrency(
        invoice.amount_due
      )}) to the customer via email and SMS?`
    );
    if (!confirmed) return;

    try {
      setSendingPayNow(true);
      const response = await fetch(`/api/admin/customers/${customerId}/send-paynow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send Pay Now link');
      }
      setActionResult({
        type: 'success',
        message: `Pay Now link sent for ${invoice.invoice_number}. Email: ${
          data.emailSent ? '✓' : '✗'
        } SMS: ${data.smsSent ? '✓' : '✗'}`,
      });
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send Pay Now link',
      });
    } finally {
      setSendingPayNow(false);
      setTimeout(() => setActionResult(null), 6000);
    }
  };

  const hasOutstanding = (summary?.total_outstanding ?? 0) > 0;
  const hasOverdue = (summary?.overdue_count ?? 0) > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {actionResult && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              actionResult.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {actionResult.type === 'success' ? (
              <PiCheckCircleBold className="h-4 w-4 flex-shrink-0" />
            ) : (
              <PiWarningCircleBold className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{actionResult.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* At-a-glance facts */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3 flex-1 min-w-[280px]">
            {/* Balance */}
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <PiCurrencyCircleDollarBold className="h-3.5 w-3.5" />
                Balance Due
              </p>
              {loading ? (
                <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <>
                  <p
                    className={`text-lg font-semibold ${
                      hasOverdue ? 'text-red-600' : hasOutstanding ? 'text-gray-900' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(summary?.total_outstanding ?? 0)}
                  </p>
                  {hasOverdue && (
                    <p className="text-xs text-red-500">
                      {summary?.overdue_count} overdue ({formatCurrency(summary?.total_overdue ?? 0)})
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Active service */}
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <PiWifiHighBold className="h-3.5 w-3.5" />
                Active Service
              </p>
              {loading ? (
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mt-1" />
              ) : summary?.active_service ? (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {summary.active_service.package_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(summary.active_service.monthly_price)}/mo
                    {summary.active_services_count > 1 &&
                      ` • +${summary.active_services_count - 1} more`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No active service</p>
              )}
            </div>

            {/* Last payment */}
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <PiCheckCircleBold className="h-3.5 w-3.5" />
                Last Payment
              </p>
              {loading ? (
                <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mt-1" />
              ) : summary?.last_payment ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.last_payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(summary.last_payment.date)}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No payments yet</p>
              )}
            </div>

            {/* Open tickets */}
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <PiChatBold className="h-3.5 w-3.5" />
                Open Tickets
              </p>
              {openTicketCount === null ? (
                <div className="h-6 w-10 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p
                  className={`text-lg font-semibold ${
                    openTicketCount > 0 ? 'text-yellow-600' : 'text-gray-900'
                  }`}
                >
                  {openTicketCount}
                </p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2">
            {summary?.oldest_unpaid_invoice && (
              <Button
                size="sm"
                onClick={handleSendPayNow}
                disabled={sendingPayNow}
                className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
              >
                {sendingPayNow ? (
                  <PiArrowsClockwiseBold className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <PiPaperPlaneRightBold className="h-4 w-4 mr-1.5" />
                )}
                Send Pay Now Link
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/support/tickets/new?customerId=${customerId}`)}
            >
              <PiChatBold className="h-4 w-4 mr-1.5" />
              Create Ticket
            </Button>
            <Link href={`/admin/customers/${customerId}/statement`} target="_blank">
              <Button size="sm" variant="outline">
                <PiFileTextBold className="h-4 w-4 mr-1.5" />
                Statement
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
